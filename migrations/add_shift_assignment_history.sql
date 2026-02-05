-- Migration: Add shift_assignment_history table for tracking assignment changes
-- This enables rollback capability for shift exchanges/swaps

-- Create history table to track all assignment changes
CREATE TABLE IF NOT EXISTS shift_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES shift_assignments(id) ON DELETE CASCADE,
    previous_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    new_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL CHECK (change_type IN ('SWAP', 'GIVEAWAY', 'MANUAL', 'ROLLBACK')),
    exchange_id UUID, -- References shift_exchanges.id (nullable for manual changes)
    exchange_request_id UUID, -- References shift_exchange_requests.id (nullable)
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    notes TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_assignment_history_assignment_id ON shift_assignment_history(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_exchange_id ON shift_assignment_history(exchange_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_exchange_request_id ON shift_assignment_history(exchange_request_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_changed_at ON shift_assignment_history(changed_at DESC);

-- RLS Policies
ALTER TABLE shift_assignment_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view history for assignments they're involved in
CREATE POLICY "Users can view history for their assignments"
ON shift_assignment_history
FOR SELECT
TO authenticated
USING (
    previous_profile_id = auth.uid() OR
    new_profile_id = auth.uid()
);

-- Allow insert for authenticated users (system inserts via API)
CREATE POLICY "System can insert history"
ON shift_assignment_history
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create database function for atomic swap with history
CREATE OR REPLACE FUNCTION execute_shift_swap_atomic(
    p_assignment_1_id UUID,
    p_assignment_2_id UUID,
    p_user_1_id UUID,
    p_user_2_id UUID,
    p_exchange_id UUID DEFAULT NULL,
    p_exchange_request_id UUID DEFAULT NULL,
    p_change_type TEXT DEFAULT 'SWAP'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_original_1_profile UUID;
    v_original_2_profile UUID;
    v_result JSONB;
BEGIN
    -- Get original profile_ids before swap
    SELECT profile_id INTO v_original_1_profile
    FROM shift_assignments WHERE id = p_assignment_1_id;

    SELECT profile_id INTO v_original_2_profile
    FROM shift_assignments WHERE id = p_assignment_2_id;

    -- Validate assignments exist
    IF v_original_1_profile IS NULL OR v_original_2_profile IS NULL THEN
        RAISE EXCEPTION 'One or both assignments not found';
    END IF;

    -- Perform the swap atomically
    UPDATE shift_assignments SET profile_id = p_user_2_id WHERE id = p_assignment_1_id;
    UPDATE shift_assignments SET profile_id = p_user_1_id WHERE id = p_assignment_2_id;

    -- Record history for assignment 1
    INSERT INTO shift_assignment_history (
        assignment_id, previous_profile_id, new_profile_id,
        change_type, exchange_id, exchange_request_id, changed_by
    ) VALUES (
        p_assignment_1_id, v_original_1_profile, p_user_2_id,
        p_change_type, p_exchange_id, p_exchange_request_id, auth.uid()
    );

    -- Record history for assignment 2
    INSERT INTO shift_assignment_history (
        assignment_id, previous_profile_id, new_profile_id,
        change_type, exchange_id, exchange_request_id, changed_by
    ) VALUES (
        p_assignment_2_id, v_original_2_profile, p_user_1_id,
        p_change_type, p_exchange_id, p_exchange_request_id, auth.uid()
    );

    v_result := jsonb_build_object(
        'success', true,
        'assignment_1_original', v_original_1_profile,
        'assignment_2_original', v_original_2_profile
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Transaction automatically rolls back on exception
        RAISE;
END;
$$;

-- Create database function for atomic giveaway with history
CREATE OR REPLACE FUNCTION execute_giveaway_atomic(
    p_assignment_id UUID,
    p_new_profile_id UUID,
    p_exchange_id UUID DEFAULT NULL,
    p_change_type TEXT DEFAULT 'GIVEAWAY'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_original_profile UUID;
    v_result JSONB;
BEGIN
    -- Get original profile_id
    SELECT profile_id INTO v_original_profile
    FROM shift_assignments WHERE id = p_assignment_id;

    IF v_original_profile IS NULL THEN
        RAISE EXCEPTION 'Assignment not found';
    END IF;

    -- Perform the transfer
    UPDATE shift_assignments SET profile_id = p_new_profile_id WHERE id = p_assignment_id;

    -- Record history
    INSERT INTO shift_assignment_history (
        assignment_id, previous_profile_id, new_profile_id,
        change_type, exchange_id, changed_by
    ) VALUES (
        p_assignment_id, v_original_profile, p_new_profile_id,
        p_change_type, p_exchange_id, auth.uid()
    );

    v_result := jsonb_build_object(
        'success', true,
        'original_profile', v_original_profile
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION execute_shift_swap_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION execute_giveaway_atomic TO authenticated;
