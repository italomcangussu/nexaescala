-- Migration: Fix Shifts Code Column and Shift Presets RLS
-- Date: 2026-01-11
-- Purpose: Add code column to shifts table and RLS policies for shift_presets

-- 1. Add code column to shifts table
ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS code text;

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_shifts_code ON public.shifts(code);

-- 3. Add comment for documentation
COMMENT ON COLUMN public.shifts.code IS 'Shift code from preset (e.g., M, T, DT, NT, SOB)';

-- 4. Update existing shifts with code based on time matching
-- This is a one-time data migration to populate existing shifts
UPDATE public.shifts s
SET code = sp.code
FROM public.shift_presets sp
WHERE s.group_id = sp.group_id
  AND s.start_time = sp.start_time
  AND s.end_time = sp.end_time
  AND s.code IS NULL;

-- 5. Enable RLS for shift_presets table
ALTER TABLE public.shift_presets ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS policy: View presets of groups you're a member of
CREATE POLICY "View presets of my groups" 
ON public.shift_presets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.group_members 
    WHERE group_id = shift_presets.group_id 
    AND profile_id = auth.uid()
  )
);

-- 7. Add RLS policy: Only group owner can modify presets
CREATE POLICY "Presets editable by owner" 
ON public.shift_presets 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.groups 
    WHERE id = shift_presets.group_id 
    AND owner_id = auth.uid()
  )
);

-- Verification queries (run these after migration to verify):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'shifts' AND column_name = 'code';
-- SELECT * FROM pg_policies WHERE tablename = 'shift_presets';
