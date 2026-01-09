import { supabase } from '../lib/supabase';
import { Profile, Group, Shift, ShiftAssignment, FinancialRecord, FinancialConfig, ServiceRole, ShiftExchange, TradeStatus, GroupMember, ChatMessage } from '../types';

// --- PROFILES ---

export const getProfiles = async (): Promise<Profile[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

    if (error) throw error;
    return data as Profile[];
};

export const getProfileById = async (id: string): Promise<Profile | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) return null;
    return data as Profile;
};

export const searchProfiles = async (query: string): Promise<Profile[]> => {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,crm.ilike.%${query}%`)
        .limit(10);

    if (error) throw error;
    return data as Profile[];
};

// --- GROUPS ---

export const getUserGroups = async (userId: string): Promise<Group[]> => {
    // We need to join group_members to find groups the user belongs to
    const { data, error } = await supabase
        .from('group_members')
        .select(`
      group:groups (
        id,
        name,
        institution,
        owner_id,
        color
      ),
      role,
      service_role
    `)
        .eq('profile_id', userId);

    if (error) throw error;

    const groups = data.map((item: any) => ({
        ...item.group,
        user_role: item.service_role,
        member_count: 0, // Default, will update below
        unread_messages: 0 // Placeholder
    })) as Group[];

    // Fetch member counts for these groups
    const groupIds = groups.map(g => g.id);
    if (groupIds.length > 0) {
        const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select('group_id')
            .in('group_id', groupIds);

        if (!membersError && members) {
            // Aggregate counts
            const counts: Record<string, number> = {};
            members.forEach((m: any) => {
                counts[m.group_id] = (counts[m.group_id] || 0) + 1;
            });

            // Update groups with counts
            groups.forEach(g => {
                g.member_count = counts[g.id] || 0;
            });
        }
    }

    return groups;
};

// --- SHIFTS ---

// Fetch shifts assigned to the current user
export const getMyShifts = async (userId: string): Promise<{ shifts: Shift[], assignments: ShiftAssignment[] }> => {
    // 1. Get assignments for user
    const { data: assignmentsData, error: assignError } = await supabase
        .from('shift_assignments')
        .select(`
      id,
      shift_id,
      profile_id,
      is_confirmed,
      shift:shifts (*)
    `)
        .eq('profile_id', userId);

    if (assignError) throw assignError;

    const shifts: Shift[] = [];
    const assignments: ShiftAssignment[] = [];

    assignmentsData.forEach((a: any) => {
        if (a.shift) {
            shifts.push(a.shift);
            assignments.push({
                id: a.id,
                shift_id: a.shift_id,
                profile_id: a.profile_id,
                is_confirmed: a.is_confirmed
            });
        }
    });

    return { shifts, assignments };
};

export const getMemberAssignmentsForPeriod = async (memberIds: string[], startDate: string, endDate: string): Promise<any[]> => {
    if (memberIds.length === 0) return [];

    // We need to fetch assignments and join with shifts to get the date/time
    // We need to fetch assignments and join with shifts


    const { data: result, error: err } = await supabase
        .from('shift_assignments')
        .select(`
            id,
            profile_id,
            shift:shifts!inner (
                id,
                date,
                start_time,
                end_time,
                group_id,
                group:groups ( name )
            )
        `)
        .in('profile_id', memberIds)
        .gte('shift.date', startDate)
        .lte('shift.date', endDate);

    if (err) throw err;
    return result || [];
};

export const getShifts = async (groupId: string): Promise<Shift[]> => {
    const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('group_id', groupId);

    if (error) throw error;
    return data as Shift[];
};

export const getAssignments = async (shiftIds: string[]): Promise<ShiftAssignment[]> => {
    if (shiftIds.length === 0) return [];

    const { data, error } = await supabase
        .from('shift_assignments')
        .select('*, profile:profiles(*)')
        .in('shift_id', shiftIds);

    if (error) throw error;
    return data as ShiftAssignment[];
};

// --- FINANCIAL RECORDS ---

export interface FinancialRecordWithGroup extends FinancialRecord {
    group_name: string;
    date: string;
}

export const getFinancialRecords = async (userId: string): Promise<FinancialRecordWithGroup[]> => {
    const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform data - since we're not joining, use placeholder for group_name
    return (data || []).map((record: any) => ({
        id: record.id,
        shift_id: record.shift_id,
        fixed_earnings: Number(record.fixed_earnings) || 0,
        production_quantity: record.production_quantity || 0,
        production_earnings: Number(record.production_earnings) || 0,
        extras_value: Number(record.extras_value) || 0,
        extras_description: record.extras_description,
        gross_total: Number(record.gross_total) || 0,
        net_total: Number(record.net_total) || 0,
        is_paid: record.is_paid || false,
        paid_at: record.paid_at,
        group_name: 'Plantão', // Simplified - can enhance later
        date: record.created_at
    }));
};

export const updateFinancialRecordPaidStatus = async (recordId: string, isPaid: boolean): Promise<void> => {
    const { error } = await supabase
        .from('financial_records')
        .update({
            is_paid: isPaid,
            paid_at: isPaid ? new Date().toISOString() : null
        })
        .eq('id', recordId);

    if (error) throw error;
};

// --- FINANCIAL CONFIG ---

export const getFinancialConfig = async (userId: string, groupId: string): Promise<FinancialConfig | null> => {
    const { data, error } = await supabase
        .from('financial_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .single();

    if (error) return null;
    return data as FinancialConfig;
};

export const saveFinancialConfig = async (config: Partial<FinancialConfig> & { user_id: string; group_id: string }): Promise<void> => {
    const { error } = await supabase
        .from('financial_configs')
        .upsert(config, { onConflict: 'user_id,group_id' });

    if (error) throw error;
};

// --- GROUPS MANAGEMENT ---

export const createService = async (ownerId: string, name: string, institution: string, color: string): Promise<Group> => {
    const { data, error } = await supabase
        .from('groups')
        .insert({
            owner_id: ownerId,
            name,
            institution,
            color
        })
        .select()
        .single();

    if (error) throw error;

    // Return formatted group (mocking missing fields)
    return {
        ...data,
        user_role: ServiceRole.ADMIN, // Creator is Admin
        member_count: 1,
        unread_messages: 0
    } as Group;
};

export const updateGroup = async (groupId: string, updates: Partial<Group>): Promise<void> => {
    const { error } = await supabase
        .from('groups')
        .update(updates)
        .eq('id', groupId);

    if (error) throw error;
};

export const addGroupMember = async (groupId: string, profileId: string, role: string, serviceRole: string): Promise<void> => {
    const { error } = await supabase
        .from('group_members')
        .insert({
            group_id: groupId,
            profile_id: profileId,
            role,
            service_role: serviceRole
        });

    if (error) throw error;
};

export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    const { data, error } = await supabase
        .from('group_members')
        .select(`
            *,
            profile:profiles(*)
        `)
        .eq('group_id', groupId);

    if (error) throw error;
    return data as GroupMember[];
};

export const removeGroupMember = async (groupId: string, profileId: string): Promise<void> => {
    // Optional: Check if user has open shifts? For now, just delete the member association.
    // Ideally, we should also probably remove future shift assignments for this user in this group.

    // 1. Remove Assignments (Future proofing - though not strictly requested, it avoids orphan assignments)
    // For now, let's just remove the member record as requested.

    const { error } = await supabase
        .from('group_members')
        .delete()
        .match({ group_id: groupId, profile_id: profileId });

    if (error) throw error;
};

export const createShift = async (shift: Partial<Shift>): Promise<Shift> => {
    const { data, error } = await supabase
        .from('shifts')
        .insert(shift)
        .select()
        .single();
    if (error) throw error;
    return data as Shift;
};

export const deleteShift = async (shiftId: string): Promise<void> => {
    const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);
    if (error) throw error;
};

export const createAssignment = async (assignment: Partial<ShiftAssignment>): Promise<ShiftAssignment> => {
    const { data, error } = await supabase
        .from('shift_assignments')
        .insert(assignment)
        .select('*, profile:profiles(*)') // Return with profile for UI
        .single();
    if (error) throw error;
    return data as ShiftAssignment;
};

export const deleteAssignment = async (assignmentId: string): Promise<void> => {
    const { error } = await supabase
        .from('shift_assignments')
        .delete()
        .eq('id', assignmentId);
    if (error) throw error;
};

export const deleteGroup = async (groupId: string): Promise<void> => {
    // 1. Get all shifts for this group to delete their assignments
    const { data: shifts } = await supabase.from('shifts').select('id').eq('group_id', groupId);
    const shiftIds = shifts?.map(s => s.id) || [];

    if (shiftIds.length > 0) {
        // Delete assignments for these shifts
        const { error: assignError } = await supabase
            .from('shift_assignments')
            .delete()
            .in('shift_id', shiftIds);
        if (assignError) throw assignError;
    }

    // 2. Delete Shifts
    const { error: shiftError } = await supabase
        .from('shifts')
        .delete()
        .eq('group_id', groupId);
    if (shiftError) throw shiftError;

    // 3. Delete Group Members
    const { error: memberError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId);
    if (memberError) throw memberError;

    // 4. Delete Group
    const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

    if (error) throw error;
};

// ... (existing code)

export const searchInstitutions = async (query: string): Promise<string[]> => {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
        .from('groups')
        .select('institution')
        .ilike('institution', `%${query}%`)
        .limit(20);

    if (error) throw error;

    // Deduplicate names
    const names = data.map((item: any) => item.institution);
    return Array.from(new Set(names)) as string[];
};

// --- SHIFT EXCHANGES ---

export const createShiftExchange = async (exchange: Partial<ShiftExchange>): Promise<void> => {
    const { error } = await supabase
        .from('shift_exchanges')
        .insert(exchange);

    if (error) throw error;
};

export const getShiftExchanges = async (groupId: string): Promise<ShiftExchange[]> => {
    const { data, error } = await supabase
        .from('shift_exchanges')
        .select(`
            *,
            requesting_profile:profiles!requesting_profile_id(*),
            target_profile:profiles!target_profile_id(*),
            offered_shift:shift_assignments!offered_shift_assignment_id(
                id,
                date,
                shift:shifts(*)
            ),
            requested_shift:shift_assignments!requested_shift_assignment_id(
                id,
                date,
                shift:shifts(*)
            )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any; // Cast due to complex join structure
};

export const updateShiftExchangeStatus = async (exchangeId: string, status: TradeStatus): Promise<void> => {
    const { error } = await supabase
        .from('shift_exchanges')
        .update({ status })
        .eq('id', exchangeId);

    if (error) throw error;

    // NOTE: Actual swap logic (changing assignments) should happen transactionally
    // For now, we update status here, and consumer of this function performs the swap if ACCEPTED
};

// Helper to execute the swap/giveaway atomic transaction
export const executeExchangeTransaction = async (exchange: ShiftExchange): Promise<void> => {
    // 1. Update assignments
    // If Giveaway: Assign offered shift to target (or current user if group claim)
    // If Swap: Swap profiles on both assignments

    // This requires complex logic. For MVP, we will do it client-side sequentially 
    // but ideally this is a Postgres Function.

    // Placeholder Implementation for MVP:

    if (exchange.type === 'GIVEAWAY' && exchange.target_profile_id) {
        // Transfer offered shift to target
        const { error } = await supabase
            .from('shift_assignments')
            .update({ profile_id: exchange.target_profile_id })
            .eq('id', exchange.offered_shift_assignment_id);
        if (error) throw error;
    } else if (exchange.type === 'DIRECT_SWAP' && exchange.target_profile_id && exchange.requested_shift_assignment_id) {
        // Swap
        // 1. Offered -> Target
        const { error: e1 } = await supabase
            .from('shift_assignments')
            .update({ profile_id: exchange.target_profile_id })
            .eq('id', exchange.offered_shift_assignment_id);
        if (e1) throw e1;

        // 2. Requested -> Requester
        const { error: e2 } = await supabase
            .from('shift_assignments')
            .update({ profile_id: exchange.requesting_profile_id })
            .eq('id', exchange.requested_shift_assignment_id);
        if (e2) throw e2;
    }

    // 2. Update Exchange Status
    await updateShiftExchangeStatus(exchange.id, TradeStatus.ACCEPTED);
};

// --- CHAT ---

export const fetchGroupMessages = async (groupId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
        .from('service_chat_messages')
        .select('*, sender:profiles(*)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error("Error fetching messages:", error);
        return [];
    }
    return (data || []) as ChatMessage[];
};

export const sendGroupMessage = async (message: Partial<ChatMessage>): Promise<ChatMessage> => {
    const { data, error } = await supabase
        .from('service_chat_messages')
        .insert(message)
        .select('*, sender:profiles(*)') // Join to get sender instantly
        .single();

    if (error) throw error;
    return data as ChatMessage;
};
