-- Migration: Fix INSERT policy on group_members
-- Problem: Current policy only allows profile_id = auth.uid() (self-join).
--   This blocks admins from adding other members, which is a bug.
-- Fix: Allow INSERT if:
--   a) User is adding themselves (self-join), OR
--   b) User is the owner of the group, OR
--   c) User has STAFF/STAFF_AUX role in the group

-- 1. Drop the current permissive INSERT policy
DROP POLICY IF EXISTS "Self join or Owner add" ON public.group_members;

-- 2. Create corrected INSERT policy
CREATE POLICY "Members insertable by self or group admin"
ON public.group_members
FOR INSERT
WITH CHECK (
  -- Self-join: user adds themselves
  profile_id = auth.uid()
  OR
  -- Group owner can add anyone
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_id
    AND g.owner_id = auth.uid()
  )
  OR
  -- STAFF/STAFF_AUX can add members
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_id
    AND gm.profile_id = auth.uid()
    AND gm.service_role IN ('STAFF', 'STAFF_AUX')
  )
);
