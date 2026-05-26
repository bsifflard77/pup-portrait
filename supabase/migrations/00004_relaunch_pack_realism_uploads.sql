-- Migration: 2026-05-19 relaunch sprint
-- Adds support for:
--   1. New tiers: 'pack' (one-time 12-portrait pack) and 'realism' (annual sub
--      with Flux Kontext Pro toggle unlocked).
--   2. The photo-upload pack feature — `pet-uploads` storage bucket with RLS,
--      auto-deletion after 24 hours, and a `pack_credits` counter on profiles.
--   3. Generation provenance — `engine` and `from_photo_upload` columns on
--      portraits so we can debug, surface badges in the UI, and roll up costs.

BEGIN;

-- ------------------------------------------------------------------
-- 1) profiles: add pack_credits, allow new subscription_tier values
-- ------------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS pack_credits INT NOT NULL DEFAULT 0;

-- Drop and recreate the tier check constraint to allow the new values.
-- Existing rows are already 'free' | 'premium' | 'lifetime' and remain valid.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pack', 'premium', 'realism', 'lifetime'));

-- ------------------------------------------------------------------
-- 2) portraits: add engine + from_photo_upload columns
-- ------------------------------------------------------------------

ALTER TABLE portraits
  ADD COLUMN IF NOT EXISTS engine TEXT,
  ADD COLUMN IF NOT EXISTS from_photo_upload BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN portraits.engine IS 'nano-banana-2 | flux-kontext-pro | gemini-2.0-flash (legacy)';
COMMENT ON COLUMN portraits.from_photo_upload IS 'TRUE when generated from a user-uploaded reference photo (pack feature)';

CREATE INDEX IF NOT EXISTS idx_portraits_engine ON portraits(engine);
CREATE INDEX IF NOT EXISTS idx_portraits_from_photo_upload ON portraits(from_photo_upload) WHERE from_photo_upload = true;

-- ------------------------------------------------------------------
-- 3) Pack credit helpers
-- ------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_pack_credits(p_user_id UUID, p_amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_total INT;
BEGIN
  UPDATE profiles
  SET pack_credits = pack_credits + p_amount
  WHERE id = p_user_id
  RETURNING pack_credits INTO new_total;
  RETURN new_total;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_pack_credits(p_user_id UUID, p_amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_total INT;
BEGIN
  -- Clamp at zero — don't allow negative credits.
  UPDATE profiles
  SET pack_credits = GREATEST(0, pack_credits - p_amount)
  WHERE id = p_user_id
  RETURNING pack_credits INTO new_total;

  -- If a Pack-tier user just consumed their last credit, downgrade them to
  -- free. (Premium/realism/lifetime keep their tier regardless of pack_credits.)
  IF new_total <= 0 THEN
    UPDATE profiles
    SET subscription_tier = 'free'
    WHERE id = p_user_id AND subscription_tier = 'pack';
  END IF;

  RETURN new_total;
END;
$$;

-- Bulk helper for the pack endpoint — increments total_generations by N
-- without N round-trips.
CREATE OR REPLACE FUNCTION increment_total_generations_by(user_id UUID, p_amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_total INT;
BEGIN
  UPDATE profiles
  SET total_generations = COALESCE(total_generations, 0) + p_amount
  WHERE id = user_id
  RETURNING total_generations INTO new_total;
  RETURN new_total;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_pack_credits(UUID, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION decrement_pack_credits(UUID, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_total_generations_by(UUID, INT) TO authenticated, service_role;

-- ------------------------------------------------------------------
-- 4) pet-uploads storage bucket — for the photo-upload pack feature
-- ------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pet-uploads',
  'pet-uploads',
  false,
  10485760, -- 10 MB cap on a single upload
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  public = EXCLUDED.public;

-- RLS policies — users can only see their own uploads. Path convention is
-- `<user_uid>/<random>.jpg`, enforced by storage.foldername[1] = uid.

DROP POLICY IF EXISTS "Users can upload their own pet photos" ON storage.objects;
CREATE POLICY "Users can upload their own pet photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can read their own pet photos" ON storage.objects;
CREATE POLICY "Users can read their own pet photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'pet-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users can delete their own pet photos" ON storage.objects;
CREATE POLICY "Users can delete their own pet photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'pet-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ------------------------------------------------------------------
-- 5) 24-hour TTL for pet-uploads
-- ------------------------------------------------------------------
-- pg_cron must be enabled in the Supabase project (Database → Extensions).
-- Once enabled, this scheduled job deletes uploads older than 24 hours every
-- hour on the hour.

CREATE OR REPLACE FUNCTION delete_old_pet_uploads()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INT;
BEGIN
  WITH old_uploads AS (
    DELETE FROM storage.objects
    WHERE bucket_id = 'pet-uploads'
      AND created_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM old_uploads;

  RAISE NOTICE 'delete_old_pet_uploads removed % rows', deleted_count;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_old_pet_uploads() TO service_role;

-- Schedule via pg_cron. Wrap in a DO block so the migration doesn't fail if
-- pg_cron isn't enabled yet (Bill can enable it in the Supabase dashboard,
-- then re-run just this scheduling statement).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Unschedule any prior version of this job first (idempotent).
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'delete-old-pet-uploads';

    PERFORM cron.schedule(
      'delete-old-pet-uploads',
      '0 * * * *',
      'SELECT delete_old_pet_uploads()'
    );
  ELSE
    RAISE NOTICE 'pg_cron extension not enabled — skipping schedule. Enable pg_cron in Supabase dashboard, then run: SELECT cron.schedule(''delete-old-pet-uploads'', ''0 * * * *'', ''SELECT delete_old_pet_uploads()'');';
  END IF;
END $$;

COMMIT;
