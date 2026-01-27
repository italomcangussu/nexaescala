-- Migration: Fix Schema Mismatches and Missing Tables
-- Purpose: Add missing columns to group_members and create notifications table.

-- 1. Add missing columns to group_members
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS personal_color text DEFAULT '#10b981',
ADD COLUMN IF NOT EXISTS has_seen_color_banner boolean DEFAULT false;

-- 2. Create notifications table if not exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL DEFAULT 'SYSTEM',
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    metadata jsonb
);

-- 3. Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policy: Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

-- 5. RLS Policy: Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);
