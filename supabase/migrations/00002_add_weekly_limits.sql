-- Migration: 00002_add_weekly_limits
-- Adds weekly generation tracking for free tier users
-- Changes: Free tier now gets 5/week instead of 3/day

-- Add weekly generation columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weekly_generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weekly_reset_at TIMESTAMP WITH TIME ZONE;

-- Create function to increment total generations (for Edge Function use)
CREATE OR REPLACE FUNCTION increment_total_generations(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_total INTEGER;
BEGIN
  UPDATE profiles
  SET total_generations = COALESCE(total_generations, 0) + 1
  WHERE id = user_id
  RETURNING total_generations INTO new_total;
  RETURN new_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the daily reset function to also handle weekly resets
CREATE OR REPLACE FUNCTION reset_generation_counters()
RETURNS void AS $$
DECLARE
  week_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate start of current week (Monday)
  week_start := date_trunc('week', CURRENT_TIMESTAMP);

  -- Reset daily counters for premium/lifetime users
  UPDATE profiles
  SET
    daily_generations_used = 0,
    daily_reset_at = CURRENT_TIMESTAMP
  WHERE
    subscription_tier IN ('premium', 'lifetime')
    AND (daily_reset_at IS NULL OR daily_reset_at < CURRENT_DATE);

  -- Reset weekly counters for free users
  UPDATE profiles
  SET
    weekly_generations_used = 0,
    weekly_reset_at = week_start
  WHERE
    subscription_tier = 'free'
    AND (weekly_reset_at IS NULL OR weekly_reset_at < week_start);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old function if exists (renamed)
DROP FUNCTION IF EXISTS reset_daily_generations();

-- Create index for weekly reset queries
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_reset ON profiles(weekly_reset_at);
CREATE INDEX IF NOT EXISTS idx_profiles_daily_reset ON profiles(daily_reset_at);

-- Add comment explaining the tier limits
COMMENT ON COLUMN profiles.weekly_generations_used IS 'Free tier: 5 portraits per week';
COMMENT ON COLUMN profiles.weekly_reset_at IS 'Timestamp when weekly counter was last reset (Monday)';
COMMENT ON COLUMN profiles.daily_generations_used IS 'Premium/Lifetime tier: 15 portraits per day';
COMMENT ON COLUMN profiles.daily_reset_at IS 'Timestamp when daily counter was last reset';
