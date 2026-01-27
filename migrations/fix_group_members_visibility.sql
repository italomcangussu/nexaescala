-- Migration: Add "View own membership" policy for group_members
-- Purpose: Fix visibility issues where users cannot see their own group memberships due to potential recursion in existing policy.

-- 1. Create simple policy for self-viewing
CREATE POLICY "View own membership" 
ON public.group_members 
FOR SELECT 
USING (
  profile_id = auth.uid()
);

-- Note: The existing "View members of my groups" policy handles seeing *other* members of the same group.
-- This new policy ensures the base case (seeing oneself) is always allowed and efficient.
