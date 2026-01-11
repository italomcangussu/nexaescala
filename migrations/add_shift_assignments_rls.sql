-- Migration: Add UPDATE and DELETE policies for shift_assignments
-- Purpose: Allow Admins and Owners to manage shift assignments (delete/update).

-- 1. DROP existing policies if they are too broad or conflicting (Clean state)
-- keeping existing SELECT/INSERT for now, but adding specific ones for management

-- 2. Policy for UPDATE
CREATE POLICY "Assignments editable by admins" 
ON public.shift_assignments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.shifts s
    JOIN public.groups g ON s.group_id = g.id
    LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.profile_id = auth.uid()
    WHERE s.id = shift_assignments.shift_id
    AND (
      g.owner_id = auth.uid() OR 
      gm.service_role IN ('STAFF', 'STAFF_AUX')
    )
  )
);

-- 3. Policy for DELETE
CREATE POLICY "Assignments deletable by admins" 
ON public.shift_assignments 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.shifts s
    JOIN public.groups g ON s.group_id = g.id
    LEFT JOIN public.group_members gm ON g.id = gm.group_id AND gm.profile_id = auth.uid()
    WHERE s.id = shift_assignments.shift_id
    AND (
      g.owner_id = auth.uid() OR 
      gm.service_role IN ('STAFF', 'STAFF_AUX')
    )
  )
);

-- Note: Current INSERT policy is "true". We might want to restrict it later, but for now this fixes the "Save" (Delete/Update) issue.
