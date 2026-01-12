-- Enable RLS on notifications table (ensure it's on)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert notifications
-- This allows users to create notifications for other users (e.g. for shift exchanges)
CREATE POLICY "Users can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);
