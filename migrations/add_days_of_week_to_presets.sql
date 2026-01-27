-- Migration: Add days_of_week to shift_presets
-- Purpose: Allow defining which days of the week a shift preset applies to.
-- Default: {0,1,2,3,4,5,6} (All days: Sun-Sat)

ALTER TABLE public.shift_presets 
ADD COLUMN IF NOT EXISTS days_of_week integer[] DEFAULT '{0,1,2,3,4,5,6}';

-- Comment on column using integer for 0=Sunday, 6=Saturday
COMMENT ON COLUMN public.shift_presets.days_of_week IS 'Array of integers representing days of the week (0=Sunday, 6=Saturday)';
