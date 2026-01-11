-- Migration: Add personal color preferences to group_members
-- Description: Allows each user to customize the color of services independently

-- Add personal_color column to store user's custom color for the service
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS personal_color text;

-- Add has_seen_color_banner column to track if user has seen the color selection banner
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS has_seen_color_banner boolean DEFAULT false;

-- Add comment to explain the columns
COMMENT ON COLUMN public.group_members.personal_color IS 'User''s personal color preference for this service. NULL means use default color (#10b981)';
COMMENT ON COLUMN public.group_members.has_seen_color_banner IS 'Whether the user has seen and dismissed the color selection banner for this service';
