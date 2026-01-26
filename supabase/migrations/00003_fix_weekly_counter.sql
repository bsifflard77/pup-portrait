-- Migration: 00003_fix_weekly_counter
-- Fixes the weekly generation counter by using atomic increments
-- Problem: Counter wasn't decrementing properly because read/update weren't atomic

-- Create atomic increment function for weekly generations
CREATE OR REPLACE FUNCTION increment_weekly_generations(p_user_id UUID)
RETURNS TABLE(new_count INTEGER, was_reset BOOLEAN) AS $$
DECLARE
  week_start TIMESTAMP WITH TIME ZONE;
  current_reset TIMESTAMP WITH TIME ZONE;
  result_count INTEGER;
  did_reset BOOLEAN := FALSE;
BEGIN
  -- Calculate start of current week (Monday 00:00:00 UTC)
  week_start := date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
  
  -- Get current reset timestamp
  SELECT weekly_reset_at INTO current_reset
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if we need to reset (weekly_reset_at is null or before this week)
  IF current_reset IS NULL OR current_reset < week_start THEN
    -- Reset counter and set new reset timestamp, then increment
    UPDATE profiles
    SET 
      weekly_generations_used = 1,
      weekly_reset_at = week_start
    WHERE id = p_user_id
    RETURNING weekly_generations_used INTO result_count;
    did_reset := TRUE;
  ELSE
    -- Just increment
    UPDATE profiles
    SET weekly_generations_used = COALESCE(weekly_generations_used, 0) + 1
    WHERE id = p_user_id
    RETURNING weekly_generations_used INTO result_count;
  END IF;
  
  RETURN QUERY SELECT result_count, did_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create atomic increment function for daily generations (premium/lifetime)
CREATE OR REPLACE FUNCTION increment_daily_generations(p_user_id UUID)
RETURNS TABLE(new_count INTEGER, was_reset BOOLEAN) AS $$
DECLARE
  day_start TIMESTAMP WITH TIME ZONE;
  current_reset TIMESTAMP WITH TIME ZONE;
  result_count INTEGER;
  did_reset BOOLEAN := FALSE;
BEGIN
  -- Calculate start of current day (00:00:00 UTC)
  day_start := date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
  
  -- Get current reset timestamp
  SELECT daily_reset_at INTO current_reset
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if we need to reset
  IF current_reset IS NULL OR current_reset < day_start THEN
    -- Reset counter and set new reset timestamp, then increment
    UPDATE profiles
    SET 
      daily_generations_used = 1,
      daily_reset_at = day_start
    WHERE id = p_user_id
    RETURNING daily_generations_used INTO result_count;
    did_reset := TRUE;
  ELSE
    -- Just increment
    UPDATE profiles
    SET daily_generations_used = COALESCE(daily_generations_used, 0) + 1
    WHERE id = p_user_id
    RETURNING daily_generations_used INTO result_count;
  END IF;
  
  RETURN QUERY SELECT result_count, did_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current usage (for display without incrementing)
CREATE OR REPLACE FUNCTION get_generation_usage(p_user_id UUID)
RETURNS TABLE(
  weekly_used INTEGER,
  weekly_remaining INTEGER,
  daily_used INTEGER,
  daily_remaining INTEGER,
  tier TEXT
) AS $$
DECLARE
  week_start TIMESTAMP WITH TIME ZONE;
  day_start TIMESTAMP WITH TIME ZONE;
  p_tier TEXT;
  p_weekly_used INTEGER;
  p_daily_used INTEGER;
  p_weekly_reset TIMESTAMP WITH TIME ZONE;
  p_daily_reset TIMESTAMP WITH TIME ZONE;
BEGIN
  week_start := date_trunc('week', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
  day_start := date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
  
  SELECT 
    subscription_tier,
    weekly_generations_used,
    daily_generations_used,
    weekly_reset_at,
    daily_reset_at
  INTO p_tier, p_weekly_used, p_daily_used, p_weekly_reset, p_daily_reset
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if counters need reset (for accurate display)
  IF p_weekly_reset IS NULL OR p_weekly_reset < week_start THEN
    p_weekly_used := 0;
  END IF;
  
  IF p_daily_reset IS NULL OR p_daily_reset < day_start THEN
    p_daily_used := 0;
  END IF;
  
  RETURN QUERY SELECT 
    COALESCE(p_weekly_used, 0),
    GREATEST(0, 5 - COALESCE(p_weekly_used, 0)),  -- 5 weekly for free
    COALESCE(p_daily_used, 0),
    GREATEST(0, 15 - COALESCE(p_daily_used, 0)), -- 15 daily for premium
    p_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_weekly_generations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_weekly_generations(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION increment_daily_generations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_daily_generations(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_generation_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_generation_usage(UUID) TO service_role;
