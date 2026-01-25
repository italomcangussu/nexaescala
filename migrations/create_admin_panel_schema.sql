-- Add app_role to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS app_role text DEFAULT 'user';

-- Create app_logs table
CREATE TABLE IF NOT EXISTS app_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES auth.users(id),
    level text NOT NULL, -- 'info', 'warn', 'error'
    message text NOT NULL,
    metadata jsonb,
    created_at timestamptz DEFAULT now()
);

-- Update specific user to admin
UPDATE profiles 
SET app_role = 'admin' 
WHERE email = 'italomcangussu@icloud.com';

-- Enable RLS
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- Policies for app_logs
CREATE POLICY "Admins can view all logs" 
ON app_logs FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.app_role = 'admin'
    )
);

CREATE POLICY "Users can insert logs" 
ON app_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow Admins to view ALL profiles (override existing if needed, or ensure access)
-- Note: Existing policies might limit profile visibility. Let's add an explicit admin policy.
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.app_role = 'admin'
    )
);
