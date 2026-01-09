import { supabase } from '../lib/supabase';
import { Profile, Group, Shift, ShiftAssignment, FinancialRecord, FinancialConfig, ServiceRole, ShiftExchange, TradeStatus, GroupMember, ChatMessage, ShiftPreset, TeamMember, AppRole } from '../types';

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

// --- SHIFT PRESETS ---

export const getShiftPresets = async (groupId: string): Promise<ShiftPreset[]> => {
    const { data, error } = await supabase
        .from('shift_presets')
        .select('*')
        .eq('group_id', groupId)
        .order('code');

    if (error) throw error;
    return data as ShiftPreset[];
};

export const createShiftPreset = async (preset: Omit<ShiftPreset, 'id'>): Promise<ShiftPreset> => {
    const { data, error } = await supabase
        .from('shift_presets')
        .insert(preset)
        .select()
        .single();

    if (error) throw error;
    return data as ShiftPreset;
};

export const updateShiftPreset = async (presetId: string, updates: Partial<ShiftPreset>): Promise<void> => {
    const { error } = await supabase
        .from('shift_presets')
        .update(updates)
        .eq('id', presetId);

    if (error) throw error;
};

export const deleteShiftPreset = async (presetId: string): Promise<void> => {
    const { error } = await supabase
        .from('shift_presets')
        .delete()
        .eq('id', presetId);

    if (error) throw error;
};

export const createShiftPresetsBulk = async (groupId: string, presets: Omit<ShiftPreset, 'id' | 'group_id'>[]): Promise<ShiftPreset[]> => {
    const presetsWithGroupId = presets.map(p => ({
        ...p,
        group_id: groupId
    }));

    const { data, error } = await supabase
        .from('shift_presets')
        .insert(presetsWithGroupId)
        .select();

    if (error) throw error;
    return data as ShiftPreset[];
};

// --- SERVICE CREATION (Enhanced) ---

export interface CreateServicePayload {
    ownerId: string;
    name: string;
    institution: string;
    color: string;
    shiftPresets: Omit<ShiftPreset, 'id' | 'group_id'>[];
    team: TeamMember[];
}

export const createServiceComplete = async (payload: CreateServicePayload): Promise<Group> => {
    const { ownerId, name, institution, color, shiftPresets, team } = payload;

    // 1. Create Group
    const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
            owner_id: ownerId,
            name,
            institution,
            color
        })
        .select()
        .single();

    if (groupError) throw groupError;

    const groupId = groupData.id;

    // 2. Create Shift Presets
    if (shiftPresets.length > 0) {
        const presetsWithGroupId = shiftPresets.map(p => ({
            ...p,
            group_id: groupId
        }));

        const { error: presetsError } = await supabase
            .from('shift_presets')
            .insert(presetsWithGroupId);

        if (presetsError) {
            console.error('Error creating shift presets:', presetsError);
            // Continue even if presets fail - the main group was created
        }
    }

    // 3. Add Members with their roles
    const memberInserts = team.map(member => {
        // Use the first role for primary service_role, store all in service_roles
        const primaryRole = member.roles[0] || ServiceRole.PLANTONISTA;

        // Map ServiceRole to AppRole
        let appRole: AppRole = AppRole.MEDICO;
        if (member.roles.includes(ServiceRole.ADMIN)) appRole = AppRole.GESTOR;
        else if (member.roles.includes(ServiceRole.ADMIN_AUX)) appRole = AppRole.AUXILIAR;

        return {
            group_id: groupId,
            profile_id: member.profile.id,
            role: appRole,
            service_role: primaryRole
        };
    });

    if (memberInserts.length > 0) {
        const { error: membersError } = await supabase
            .from('group_members')
            .insert(memberInserts);

        if (membersError) {
            console.error('Error adding members:', membersError);
        }
    }

    // Return formatted group
    return {
        ...groupData,
        user_role: ServiceRole.ADMIN,
        member_count: team.length,
        unread_messages: 0
    } as Group;
};

// Update existing service with all data
export const updateServiceComplete = async (
    groupId: string,
    updates: {
        name?: string;
        institution?: string;
        color?: string;
    },
    shiftPresets?: ShiftPreset[],
    team?: TeamMember[]
): Promise<void> => {
    // 1. Update Group basic info
    if (Object.keys(updates).length > 0) {
        const { error } = await supabase
            .from('groups')
            .update(updates)
            .eq('id', groupId);

        if (error) throw error;
    }

    // 2. Sync Shift Presets (delete all and recreate)
    if (shiftPresets) {
        // Delete existing
        await supabase
            .from('shift_presets')
            .delete()
            .eq('group_id', groupId);

        // Create new
        if (shiftPresets.length > 0) {
            const presetsWithGroupId = shiftPresets.map(p => ({
                code: p.code,
                start_time: p.start_time,
                end_time: p.end_time,
                group_id: groupId
            }));

            const { error } = await supabase
                .from('shift_presets')
                .insert(presetsWithGroupId);

            if (error) console.error('Error syncing shift presets:', error);
        }
    }

    // 3. Sync Members (more complex - need to handle adds/removes)
    if (team) {
        // Get current members
        const { data: currentMembers } = await supabase
            .from('group_members')
            .select('profile_id')
            .eq('group_id', groupId);

        const currentMemberIds = new Set((currentMembers || []).map(m => m.profile_id));
        const newMemberIds = new Set(team.map(m => m.profile.id));

        // Find members to remove
        const toRemove = [...currentMemberIds].filter(id => !newMemberIds.has(id));

        // Find members to add
        const toAdd = team.filter(m => !currentMemberIds.has(m.profile.id));

        // Remove members
        if (toRemove.length > 0) {
            await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .in('profile_id', toRemove);
        }

        // Add new members
        if (toAdd.length > 0) {
            const memberInserts = toAdd.map(member => {
                const primaryRole = member.roles[0] || ServiceRole.PLANTONISTA;
                let appRole: AppRole = AppRole.MEDICO;
                if (member.roles.includes(ServiceRole.ADMIN)) appRole = AppRole.GESTOR;
                else if (member.roles.includes(ServiceRole.ADMIN_AUX)) appRole = AppRole.AUXILIAR;

                return {
                    group_id: groupId,
                    profile_id: member.profile.id,
                    role: appRole,
                    service_role: primaryRole
                };
            });

            await supabase
                .from('group_members')
                .insert(memberInserts);
        }

        // Update existing members' roles
        for (const member of team) {
            if (currentMemberIds.has(member.profile.id)) {
                const primaryRole = member.roles[0] || ServiceRole.PLANTONISTA;
                let appRole: AppRole = AppRole.MEDICO;
                if (member.roles.includes(ServiceRole.ADMIN)) appRole = AppRole.GESTOR;
                else if (member.roles.includes(ServiceRole.ADMIN_AUX)) appRole = AppRole.AUXILIAR;

                await supabase
                    .from('group_members')
                    .update({ role: appRole, service_role: primaryRole })
                    .eq('group_id', groupId)
                    .eq('profile_id', member.profile.id);
            }
        }
    }
};

// --- SHIFT GENERATION ---

interface MonthSelection {
    year: number;
    month: number; // 0-indexed
}

// Helper: get all days in a month
const getDaysInMonth = (year: number, month: number): string[] => {
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    });
};

export const generateShiftsForGroup = async (
    groupId: string,
    months: MonthSelection[],
    presets: { code: string; start_time: string; end_time: string }[],
    quantityPerShift: number
): Promise<number> => {
    if (months.length === 0 || presets.length === 0) return 0;

    const shiftsToInsert: any[] = [];

    for (const { year, month } of months) {
        const days = getDaysInMonth(year, month);

        for (const day of days) {
            for (const preset of presets) {
                shiftsToInsert.push({
                    group_id: groupId,
                    date: day,
                    start_time: preset.start_time,
                    end_time: preset.end_time,
                    quantity_needed: quantityPerShift,
                    is_published: false // Draft state until user publishes
                });
            }
        }
    }

    if (shiftsToInsert.length === 0) return 0;

    // Batch insert (Supabase handles bulk inserts)
    const { error } = await supabase
        .from('shifts')
        .insert(shiftsToInsert);

    if (error) {
        console.error('Error generating shifts:', error);
        throw error;
    }

    return shiftsToInsert.length;
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
