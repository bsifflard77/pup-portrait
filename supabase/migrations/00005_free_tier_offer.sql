-- Migration: 2026-05-26 free-tier offer
-- Replaces the old "5 portraits per week" free tier with a ONE-TIME offer:
-- upload your dog's photo → 1 watermarked portrait + 5 watermarked background
-- variations (6 images), then paywall. Photo upload (formerly paid-only) is now
-- the free conversion hook. See 30_Specs/2026-05-25_Spec_Free-Tier-Offer_Monomoy.md
--
-- The old weekly-counter columns (weekly_generations_used, weekly_reset_at) and
-- increment_weekly_generations() are intentionally LEFT IN PLACE — they're
-- harmless once the free tier stops reading them, and dropping them now would
-- force a coordinated deploy. They can be cleaned up in a later pass.

BEGIN;

-- ------------------------------------------------------------------
-- 1) profiles: one-time free-offer tracking
-- ------------------------------------------------------------------

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS free_offer_used BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_images_used INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN profiles.free_offer_used IS
  'One-time free offer (1 portrait + 5 backgrounds) consumed. Set true only after the full set is delivered, or auto-locked at 6 images.';
COMMENT ON COLUMN profiles.free_images_used IS
  'Count (0-6) of free-tier images generated within the one-time offer. Lets a partially failed set resume without burning the offer.';

-- ------------------------------------------------------------------
-- 2) Free-offer helpers (atomic, mirror the pack_credits helpers)
-- ------------------------------------------------------------------

-- Increment the free-image counter by N and return the new total. Once the full
-- set (1 portrait + 5 backgrounds = 6 images) is reached, the one-time offer is
-- locked automatically as a server-side abuse guard.
CREATE OR REPLACE FUNCTION increment_free_images_used(p_user_id UUID, p_amount INT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_total INT;
BEGIN
  UPDATE profiles
  SET free_images_used = free_images_used + p_amount
  WHERE id = p_user_id
  RETURNING free_images_used INTO new_total;

  IF new_total >= 6 THEN
    UPDATE profiles
    SET free_offer_used = true
    WHERE id = p_user_id;
  END IF;

  RETURN new_total;
END;
$$;

-- Explicitly close the one-time offer once the user finishes their free set
-- (called by the flow after a successful set, even if they chose fewer than 5
-- backgrounds). Idempotent.
CREATE OR REPLACE FUNCTION mark_free_offer_used(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET free_offer_used = true
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_free_images_used(UUID, INT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION mark_free_offer_used(UUID) TO authenticated, service_role;

COMMIT;
