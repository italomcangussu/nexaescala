import { supabase } from '../lib/supabase';
import { Profile, Group, Shift, ShiftAssignment, FinancialRecord, FinancialConfig, ServiceRole, ShiftExchange, TradeStatus, GroupMember, ChatMessage, ShiftPreset, TeamMember, AppRole, GroupRelationship, Notification } from '../types';

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
      service_role,
      personal_color,
      has_seen_color_banner
    `)
        .eq('profile_id', userId);

    if (error) throw error;

    const groups = data.map((item: any) => ({
        ...item.group,
        user_role: item.service_role,
        // Use personal_color if set, otherwise default to emerald green
        color: item.personal_color || '#10b981',
        has_seen_color_banner: item.has_seen_color_banner || false,
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

export const createFinancialRecord = async (record: Omit<FinancialRecord, 'id'>): Promise<FinancialRecord> => {
    const { data, error } = await supabase
        .from('financial_records')
        .insert(record)
        .select()
        .single();

    if (error) throw error;
    return data as FinancialRecord;
};

// --- FINANCIAL CONFIG ---

export const getFinancialConfig = async (userId: string, groupId: string): Promise<FinancialConfig | null> => {
    const { data, error } = await supabase
        .from('financial_configs')
        .select('*')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .maybeSingle();

    if (error) return null;
    return data as FinancialConfig;
};

export const saveFinancialConfig = async (userId: string, config: FinancialConfig): Promise<void> => {
    const { error } = await supabase
        .from('financial_configs')
        .upsert({
            user_id: userId,
            group_id: config.group_id,
            contract_type: config.contract_type,
            payment_model: config.payment_model,
            fixed_value: config.fixed_value,
            production_value_unit: config.production_value_unit,
            tax_percent: config.tax_percent,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,group_id' });

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

export interface CanLeaveGroupResult {
    canLeave: boolean;
    reason?: string;
    assignmentCount?: number;
}

export const canUserLeaveGroup = async (groupId: string, userId: string): Promise<CanLeaveGroupResult> => {
    // 1. Get all shifts for this group (both published and draft)
    const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, is_published')
        .eq('group_id', groupId);

    if (shiftsError) throw shiftsError;

    if (!shifts || shifts.length === 0) {
        return { canLeave: true };
    }

    const shiftIds = shifts.map(s => s.id);

    // 2. Check if user has any assignments in these shifts
    const { data: assignments, error: assignmentsError } = await supabase
        .from('shift_assignments')
        .select('id, shift_id')
        .in('shift_id', shiftIds)
        .eq('profile_id', userId);

    if (assignmentsError) throw assignmentsError;

    if (!assignments || assignments.length === 0) {
        return { canLeave: true };
    }

    // 3. User has assignments - determine the reason
    const publishedAssignments = assignments.filter(a => {
        const shift = shifts.find(s => s.id === a.shift_id);
        return shift?.is_published;
    });

    const draftAssignments = assignments.filter(a => {
        const shift = shifts.find(s => s.id === a.shift_id);
        return !shift?.is_published;
    });

    let reason = '';
    if (publishedAssignments.length > 0 && draftAssignments.length > 0) {
        reason = `Você está escalado em ${publishedAssignments.length} plantão(ões) publicado(s) e ${draftAssignments.length} em rascunho. Abandono de plantão é proibido.`;
    } else if (publishedAssignments.length > 0) {
        reason = `Você está escalado em ${publishedAssignments.length} plantão(ões) publicado(s). Abandono de plantão é proibido.`;
    } else {
        reason = `Você está escalado em ${draftAssignments.length} plantão(ões) em rascunho. Você precisa ser removido da escala antes de sair.`;
    }

    return {
        canLeave: false,
        reason,
        assignmentCount: assignments.length
    };
};

export const leaveGroup = async (groupId: string, userId: string): Promise<void> => {
    // 1. Validate if user can leave
    const validation = await canUserLeaveGroup(groupId, userId);

    if (!validation.canLeave) {
        throw new Error(validation.reason || 'Você não pode sair deste serviço no momento.');
    }

    // 2. Remove user from group
    await removeGroupMember(groupId, userId);
};

// --- PERSONAL COLOR PREFERENCES ---

export const updateMemberPersonalColor = async (groupId: string, userId: string, color: string): Promise<void> => {
    const { error } = await supabase
        .from('group_members')
        .update({
            personal_color: color,
            has_seen_color_banner: true
        })
        .match({ group_id: groupId, profile_id: userId });

    if (error) throw error;
};

export const markColorBannerSeen = async (groupId: string, userId: string): Promise<void> => {
    const { error } = await supabase
        .from('group_members')
        .update({ has_seen_color_banner: true })
        .match({ group_id: groupId, profile_id: userId });

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

export const updateShift = async (shiftId: string, updates: Partial<Shift>): Promise<Shift> => {
    const { data, error } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', shiftId)
        .select()
        .single();
    if (error) throw error;
    return data as Shift;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) throw error;
    return data as Profile;
};

export const updatePushSubscription = async (userId: string, subscription: PushSubscription | null): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({ push_subscription: subscription ? JSON.stringify(subscription) : null })
        .eq('id', userId);

    if (error) throw error;
};

export const publishShifts = async (groupId: string, shiftIds: string[]): Promise<void> => {
    if (shiftIds.length === 0) return;
    const { error } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .eq('group_id', groupId)
        .in('id', shiftIds);
    if (error) throw error;
};

export const deleteShift = async (shiftId: string) => {
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

export const updateAssignment = async (assignmentId: string, updates: Partial<ShiftAssignment>): Promise<ShiftAssignment> => {
    const { data, error } = await supabase
        .from('shift_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select('*, profile:profiles(*)')

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Assignment not found');

    // Return first item (safest way to handle potential duplicate returns or weird states)
    return data[0] as ShiftAssignment;
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

// Regenerate shifts for a specific month based on current presets
export const regenerateShiftsForMonth = async (
    groupId: string,
    date: Date
): Promise<void> => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // 1. Get current presets
    const presets = await getShiftPresets(groupId);
    if (presets.length === 0) {
        console.warn('No presets found for group', groupId);
        return;
    }

    // 2. Calculate month range
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // 3. Get existing shifts for this month
    const { data: existingShifts, error: fetchError } = await supabase
        .from('shifts')
        .select('id, code, date, start_time, is_individual')
        .eq('group_id', groupId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (fetchError) throw fetchError;

    // 4. Delete shifts that don't have assignments AND are not individual
    if (existingShifts && existingShifts.length > 0) {
        // Filter out individual scale days immediately
        const generalShiftIds = existingShifts
            .filter((s: any) => !s.is_individual)
            .map((s: any) => s.id);

        if (generalShiftIds.length > 0) {
            // Check usage in assignments (Batch check)
            const { data: assignments } = await supabase
                .from('shift_assignments')
                .select('shift_id')
                .in('shift_id', generalShiftIds);

            const usedShiftIds = new Set(assignments?.map((a: any) => a.shift_id));

            // Find shifts to delete (unused)
            const shiftsToDelete = generalShiftIds.filter(id => !usedShiftIds.has(id));

            if (shiftsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('shifts')
                    .delete()
                    .in('id', shiftsToDelete);

                if (deleteError) throw deleteError;
            }
        }
    }

    // 5. Generate new shifts for the month
    await generateShiftsForGroup(groupId, [{ year, month }], presets, 1);
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
            code: p.code,
            start_time: p.start_time,
            end_time: p.end_time,
            quantity_needed: p.quantity_needed || 1,
            days_of_week: p.days_of_week, // Save selected days
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
                quantity_needed: p.quantity_needed || 1,
                days_of_week: p.days_of_week, // Save selected days
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
    presets: { code: string; start_time: string; end_time: string; quantity_needed?: number; days_of_week?: number[] }[],
    quantityPerShift: number
): Promise<number> => {
    if (months.length === 0 || presets.length === 0) return 0;

    const shiftsToInsert: any[] = [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Calculate date range for optimization
    const sortedDetails = months.map(m => {
        const first = new Date(m.year, m.month, 1);
        const last = new Date(m.year, m.month + 1, 0);
        return { first, last };
    }).sort((a, b) => a.first.getTime() - b.first.getTime());

    const minDate = sortedDetails[0].first.toISOString().split('T')[0];
    const maxDate = sortedDetails[sortedDetails.length - 1].last.toISOString().split('T')[0];

    // Fetch existing shift dates to avoid duplicates/overwriting individual days (Scoped to range)
    const { data: existing } = await supabase
        .from('shifts')
        .select('date')
        .eq('group_id', groupId)
        .gte('date', minDate)
        .lte('date', maxDate);

    const existingDates = new Set(existing?.map(s => s.date) || []);

    for (const { year, month } of months) {
        const days = getDaysInMonth(year, month);

        for (const day of days) {
            // Skip past days or days that already have shifts (like individual scales)
            if (day < todayStr || existingDates.has(day)) continue;

            for (const preset of presets) {
                // Check if this day of week is allowed for this preset
                if (preset.days_of_week && preset.days_of_week.length > 0) {
                    const dateObj = new Date(day + 'T12:00:00'); // Use noon to avoid timezone shift
                    const dayOfWeek = dateObj.getDay(); // 0-6 (Sun-Sat)
                    if (!preset.days_of_week.includes(dayOfWeek)) {
                        continue;
                    }
                }

                shiftsToInsert.push({
                    group_id: groupId,
                    date: day,
                    start_time: preset.start_time,
                    end_time: preset.end_time,
                    quantity_needed: preset.quantity_needed || quantityPerShift,
                    code: preset.code,
                    is_published: false
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

// --- NOTIFICATIONS ---

export const getNotifications = async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) throw error;
};

export const createNotification = async (notification: Partial<Notification>): Promise<Notification> => {
    const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();

    if (error) throw error;
    return data as Notification;
};

export const createNotificationsBulk = async (notifications: Partial<Notification>[]): Promise<void> => {
    if (notifications.length === 0) return;
    const { error } = await supabase
        .from('notifications')
        .insert(notifications);

    if (error) throw error;
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
            requesting_profile: profiles!requesting_profile_id(*),
            target_profile: profiles!target_profile_id(*),
            offered_shift: shift_assignments!offered_shift_assignment_id(
                id,
                shift: shifts(*)
            ),
            requested_shift: shift_assignments!requested_shift_assignment_id(
                id,
                shift: shifts(*)
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

// --- RELATED SERVICES ---

export const getRelatedGroups = async (groupId: string): Promise<GroupRelationship[]> => {
    const { data, error } = await supabase
        .from('group_relationships')
        .select(`
            *,
            related_group: groups!related_group_id(*)
        `)
        .eq('source_group_id', groupId);

    if (error) throw error;
    return data as GroupRelationship[];
};

export const addRelatedGroup = async (
    sourceGroupId: string,
    relatedGroupId: string,
    label?: string
): Promise<void> => {
    const { error } = await supabase
        .from('group_relationships')
        .insert({
            source_group_id: sourceGroupId,
            related_group_id: relatedGroupId,
            display_label: label
        });

    if (error) throw error;
};

export const removeRelatedGroup = async (relationshipId: string): Promise<void> => {
    const { error } = await supabase
        .from('group_relationships')
        .delete()
        .eq('id', relationshipId);

    if (error) throw error;
};

export const getAdminGroups = async (userId: string): Promise<Group[]> => {
    const { data, error } = await supabase
        .from('group_members')
        .select(`
            group: groups(*)
        `)
        .eq('profile_id', userId)
        .in('service_role', [ServiceRole.ADMIN, ServiceRole.ADMIN_AUX]);

    if (error) throw error;

    // Extract groups from the join result
    return data.map((item: any) => item.group) as Group[];
};

export const getRelatedShiftsForDay = async (groupId: string, date: string): Promise<{
    group: Group;
    label: string | null;
    assignments: ShiftAssignment[];
}[]> => {
    // 1. Get related groups
    const relationships = await getRelatedGroups(groupId);
    if (relationships.length === 0) return [];

    const results = await Promise.all(relationships.map(async (rel) => {
        // 2. Get shifts for that group on that day
        const { data: shifts } = await supabase
            .from('shifts')
            .select(`
                id,
                start_time,
                assignments: shift_assignments(
                    id,
                    profile: profiles(*)
                )
            `)
            .eq('group_id', rel.related_group_id)
            .eq('date', date)
            .eq('is_published', true);

        if (!shifts || shifts.length === 0) return null;

        // Flatten assignments from all shifts of the day
        const allAssignments = shifts.flatMap(s => s.assignments);

        return {
            group: rel.related_group!,
            label: rel.display_label,
            assignments: allAssignments as unknown as ShiftAssignment[]
        };
    }));

    return results.filter(Boolean) as {
        group: Group;
        label: string | null;
        assignments: ShiftAssignment[];
    }[];
};
// --- INDIVIDUAL (DAILY) SCALE MANAGEMENT ---

/**
 * Saves a specific scale for a single day, marking it as individual.
 * This replaces all shifts for that day for the given group.
 */
export const saveDailyScale = async (
    groupId: string,
    date: string,
    presets: { code: string; start_time: string; end_time: string; quantity_needed: number }[]
) => {
    // 1. Delete existing shifts for this date
    const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('group_id', groupId)
        .eq('date', date);

    if (deleteError) throw deleteError;

    // 2. Insert new individual shifts
    if (presets.length > 0) {
        const shiftsToInsert = presets.map(p => ({
            group_id: groupId,
            date: date,
            start_time: p.start_time.includes(':') && p.start_time.split(':').length === 2 ? p.start_time + ':00' : p.start_time,
            end_time: p.end_time.includes(':') && p.end_time.split(':').length === 2 ? p.end_time + ':00' : p.end_time,
            quantity_needed: p.quantity_needed,
            code: p.code.toUpperCase(),
            is_published: false,
            is_individual: true
        }));

        const { error: insertError } = await supabase
            .from('shifts')
            .insert(shiftsToInsert);

        if (insertError) throw insertError;
    }
};

/**
 * Reverts an individual day scale back to the general service presets.
 */
export const revertDailyScaleToGeneral = async (groupId: string, date: string) => {
    // 1. Get general presets for the group
    const presets = await getShiftPresets(groupId);

    // 2. Clear current shifts for this date
    const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('group_id', groupId)
        .eq('date', date);

    if (deleteError) throw deleteError;

    // 3. Recreate from general presets (is_individual = false)
    if (presets.length > 0) {
        const shiftsToInsert = presets.map(p => ({
            group_id: groupId,
            date: date,
            start_time: p.start_time,
            end_time: p.end_time,
            quantity_needed: p.quantity_needed || 1,
            code: p.code,
            is_published: false,
            is_individual: false
        }));

        const { error: insertError } = await supabase
            .from('shifts')
            .insert(shiftsToInsert);

        if (insertError) throw insertError;
    }
};
