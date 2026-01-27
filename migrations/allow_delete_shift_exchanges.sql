-- Allow users to delete their own shift exchanges
-- This is required for the "Cancelar Repasse" functionality

create policy "Users can delete their own shift exchanges"
on shift_exchanges for delete
to authenticated
using (
  requesting_profile_id = auth.uid()
);
