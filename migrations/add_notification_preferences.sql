-- Migration: Add notification_preferences JSONB column to profiles
-- This stores each user's notification category preferences

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "enabled": true,
  "swaps": true,
  "newShifts": true,
  "groups": true
}'::jsonb;

-- Enable RLS policy for users to update their own notification_preferences
-- (profiles table already has RLS enabled with update-own-profile policy)
