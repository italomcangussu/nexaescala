-- FIX: Infinite recursion in RLS policies
-- The previous policy caused a loop because it queried the 'profiles' table while checking permissions for the 'profiles' table.

-- 1. Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all logs" ON app_logs;

-- 2. Create a secure function to check admin status without triggering RLS
-- SECURITY DEFINER means this function runs with the privileges of the database owner, bypassing RLS checks.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND app_role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the policies using the secure function

-- Policy for PROFILES
CREATE POLICY "Admins can view all profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (
    public.is_admin()
);

-- Policy for LOGS
CREATE POLICY "Admins can view all logs" 
ON app_logs FOR SELECT 
TO authenticated 
USING (
    public.is_admin()
);
