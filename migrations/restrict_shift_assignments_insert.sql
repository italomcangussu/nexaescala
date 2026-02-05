-- Migration: Restrict INSERT on shift_assignments
-- Purpose: Only group owner or STAFF/STAFF_AUX can insert assignments.
-- SELECT remains using(true) to preserve cross-service visibility and conflict detection.

-- 1. Drop the current permissive INSERT policy
DROP POLICY IF EXISTS "Insert assignments" ON public.shift_assignments;

-- 2. Create restricted INSERT policy
-- Only allows insert if the user is the owner of the group or has STAFF/STAFF_AUX role
CREATE POLICY "Insert assignments by admins"
ON public.shift_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shifts s
    JOIN public.groups g ON s.group_id = g.id
    LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.profile_id = auth.uid()
    WHERE s.id = shift_id
    AND (
      g.owner_id = auth.uid() OR
      gm.service_role IN ('STAFF', 'STAFF_AUX')
    )
  )
);
