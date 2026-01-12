-- 1. Add Unique Index to prevent duplicate pending exchanges for the same assignment
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_exchange_per_assignment 
ON public.shift_exchanges (offered_shift_assignment_id) 
WHERE status = 'PENDING';

-- 2. Create RPC function to safely accept a shift exchange (prevents race conditions)
CREATE OR REPLACE FUNCTION accept_shift_exchange(exchange_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exchange record;
    v_assignment_id uuid;
    v_status text;
BEGIN
    -- Select the exchange request, locking the row for update
    SELECT * INTO v_exchange
    FROM shift_exchanges
    WHERE id = exchange_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Repasse não encontrado.';
    END IF;

    -- Validate Status
    IF v_exchange.status != 'PENDING' THEN
        RAISE EXCEPTION 'Este repasse já foi processado (Status: %).', v_exchange.status;
    END IF;

    -- Validate Target (if directed)
    IF v_exchange.target_profile_id IS NOT NULL AND v_exchange.target_profile_id != user_id THEN
        RAISE EXCEPTION 'Este repasse não foi direcionado a você.';
    END IF;

    -- Perform the Acceptance Logic
    
    -- 1. Update the Assignment to the new user
    UPDATE shift_assignments
    SET profile_id = user_id
    WHERE id = v_exchange.offered_shift_assignment_id;

    -- 2. Update the Exchange Status
    UPDATE shift_exchanges
    SET 
        status = 'ACCEPTED',
        target_profile_id = user_id, -- Ensure target is recorded even for global giveaways
        updated_at = now()
    WHERE id = exchange_id;

    -- 3. (Optional) Cancel any OTHER pending exchanges involving this assignment?
    -- If there were other offers for this same assignment (should be prevented by index, but good to be safe)
    -- Actually, the unique index prevents multiple PENDING offers for the same assignment.
    -- But what if the assignment ID was different but pointed to the same shift? 
    -- Usually assignment is 1-to-1 with a slot. So we are good.

END;
$$;
