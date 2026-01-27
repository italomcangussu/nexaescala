-- Migration: Allow users to view shift assignments involved in their exchanges
-- Purpose: Fix the issue where "Repassado" (history) items disappear because the user loses visibility of the assignment after transfer.

-- Policy: Users can view shift_assignments if they are the requester or target of a shift_exchange linked to that assignment.
CREATE POLICY "View assignments in exchanges"
ON public.shift_assignments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.shift_exchanges se
        WHERE se.offered_shift_assignment_id = shift_assignments.id
        AND (
            se.requesting_profile_id = auth.uid() OR
            se.target_profile_id = auth.uid()
        )
    )
);
