-- Migration: Create shift_exchange_requests table for peer-to-peer shift exchanges
-- This enables plantonistas to request shift swaps directly without admin approval

-- Create enum for exchange request status
DO $$ BEGIN
    CREATE TYPE exchange_request_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create shift_exchange_requests table
CREATE TABLE IF NOT EXISTS public.shift_exchange_requests (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    requesting_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    target_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    offered_shift_id uuid REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
    requested_shift_options jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of shift IDs (max 3)
    accepted_shift_id uuid REFERENCES public.shifts(id) ON DELETE SET NULL,
    status exchange_request_status DEFAULT 'PENDING' NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    
    -- Constraints
    CONSTRAINT different_users CHECK (requesting_user_id != target_user_id),
    CONSTRAINT valid_shift_options CHECK (jsonb_array_length(requested_shift_options) BETWEEN 1 AND 3),
    CONSTRAINT accepted_shift_in_options CHECK (
        accepted_shift_id IS NULL OR 
        status != 'ACCEPTED' OR
        requested_shift_options ? accepted_shift_id::text
    )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shift_exchange_requests_requesting_user 
    ON public.shift_exchange_requests(requesting_user_id);
CREATE INDEX IF NOT EXISTS idx_shift_exchange_requests_target_user 
    ON public.shift_exchange_requests(target_user_id);
CREATE INDEX IF NOT EXISTS idx_shift_exchange_requests_group 
    ON public.shift_exchange_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_shift_exchange_requests_status 
    ON public.shift_exchange_requests(status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shift_exchange_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shift_exchange_requests_updated_at
    BEFORE UPDATE ON public.shift_exchange_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_shift_exchange_requests_updated_at();

-- Enable Row Level Security
ALTER TABLE public.shift_exchange_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view requests where they are requester or target
CREATE POLICY "Users can view their exchange requests"
    ON public.shift_exchange_requests
    FOR SELECT
    USING (
        auth.uid() = requesting_user_id OR 
        auth.uid() = target_user_id
    );

-- RLS Policy: Users can create exchange requests for their own shifts
CREATE POLICY "Users can create exchange requests"
    ON public.shift_exchange_requests
    FOR INSERT
    WITH CHECK (
        auth.uid() = requesting_user_id AND
        -- Verify the user owns the offered shift
        EXISTS (
            SELECT 1 FROM public.shift_assignments
            WHERE shift_id = offered_shift_id
            AND profile_id = auth.uid()
        )
    );

-- RLS Policy: Target users can update (accept/reject) requests
CREATE POLICY "Target users can respond to requests"
    ON public.shift_exchange_requests
    FOR UPDATE
    USING (auth.uid() = target_user_id)
    WITH CHECK (auth.uid() = target_user_id);

-- RLS Policy: Requesting users can cancel their own pending requests
CREATE POLICY "Requesting users can cancel requests"
    ON public.shift_exchange_requests
    FOR UPDATE
    USING (
        auth.uid() = requesting_user_id AND 
        status = 'PENDING'
    )
    WITH CHECK (
        auth.uid() = requesting_user_id AND
        status = 'CANCELLED'
    );

-- RLS Policy: Group admins can view all exchange requests in their groups
CREATE POLICY "Group admins can view all requests"
    ON public.shift_exchange_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE id = shift_exchange_requests.group_id
            AND owner_id = auth.uid()
        )
    );

-- Comment on table
COMMENT ON TABLE public.shift_exchange_requests IS 
    'Stores peer-to-peer shift exchange requests between plantonistas. ' ||
    'Allows users to request swaps with up to 3 date options, ' ||
    'which are automatically processed without admin approval.';
