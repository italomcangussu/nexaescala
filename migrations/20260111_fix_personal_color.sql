-- Migration to support Personal Service Colors
-- 1. Ensure columns exist
ALTER TABLE group_members 
ADD COLUMN IF NOT EXISTS personal_color text,
ADD COLUMN IF NOT EXISTS has_seen_color_banner boolean DEFAULT false;

-- 2. Drop existing policy if it conflicts (optional, safer to just add a specific one)
-- Check if RLS is enabled
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- 3. Policy to allow users to update their own membership details (specifically personal color)
-- Existing policies usually cover SELECT. We need UPDATE.
-- Note: We use a specific suffix to avoid name collision if "Users can update own member" exists.
DROP POLICY IF EXISTS "Users can update own personal color" ON group_members;

CREATE POLICY "Users can update own personal color"
ON group_members
FOR UPDATE
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- 4. Verify/Grant permissions (standard public role usage in Supabase)
GRANT UPDATE (personal_color, has_seen_color_banner) ON group_members TO authenticated;
GRANT UPDATE (personal_color, has_seen_color_banner) ON group_members TO service_role;
