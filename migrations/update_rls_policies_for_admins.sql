-- Migration: Update RLS Policies for Shift Management
-- Purpose: Allow 'STAFF' and 'STAFF_AUX' roles to manage shifts and presets, not just the Group Owner.

-- 1. SHIFTS TABLE POLICIES
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Shifts editable by admins/owners" ON public.shifts;

-- Create new comprehensive policy
CREATE POLICY "Shifts editable by admins" 
ON public.shifts 
FOR ALL 
USING (
  -- Allow if User is Owner
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = shifts.group_id 
    AND owner_id = auth.uid()
  )
  OR
  -- Allow if User is Admin (STAFF or STAFF_AUX)
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = shifts.group_id 
    AND profile_id = auth.uid() 
    AND service_role IN ('STAFF', 'STAFF_AUX')
  )
);

-- 2. SHIFT PRESETS TABLE POLICIES
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Presets editable by owner" ON public.shift_presets;

-- Create new comprehensive policy
CREATE POLICY "Presets editable by admins" 
ON public.shift_presets 
FOR ALL 
USING (
  -- Allow if User is Owner
  EXISTS (
    SELECT 1 FROM public.groups 
    WHERE id = shift_presets.group_id 
    AND owner_id = auth.uid()
  )
  OR
  -- Allow if User is Admin (STAFF or STAFF_AUX)
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = shift_presets.group_id 
    AND profile_id = auth.uid() 
    AND service_role IN ('STAFF', 'STAFF_AUX')
  )
);
