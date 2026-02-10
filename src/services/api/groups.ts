import { supabase } from '../../lib/supabase';
import { Group, GroupMember, ServiceRole, AppRole, TeamMember, ShiftPreset, GroupRelationship } from '../../types';
import { fetchWithCache, invalidateCache } from './cache';
import { validateServiceInput, validateColorHex, sanitizeFilterValue } from './validation';
import { createNotificationsBulk, sendPushToUsers } from './notifications';

// --- GROUPS ---

export const getUserGroups = async (userId: string): Promise<Group[]> => {
    return fetchWithCache(`user_groups_${userId}`, async () => {
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groups = data.map((item: any) => {
            const computedColor = item.personal_color || item.group.color || '#10b981';
            return {
                ...item.group,
                user_role: item.service_role,
                color: computedColor,
                has_seen_color_banner: item.has_seen_color_banner || false,
                member_count: 0,
                unread_messages: 0
            };
        }) as Group[];

        const groupIds = groups.map(g => g.id);
        if (groupIds.length > 0) {
            const { data: members, error: membersError } = await supabase
                .from('group_members')
                .select('group_id')
                .in('group_id', groupIds);

            if (!membersError && members) {
                const counts: Record<string, number> = {};
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                members.forEach((m: any) => {
                    counts[m.group_id] = (counts[m.group_id] || 0) + 1;
                });

                groups.forEach(g => {
                    g.member_count = counts[g.id] || 0;
                });
            }
        }

        return groups;
    });
};

export const createService = async (ownerId: string, name: string, institution: string, color: string): Promise<Group> => {
    const validated = validateServiceInput(name, institution);
    const validatedColor = validateColorHex(color);

    const { data, error } = await supabase
        .from('groups')
        .insert({
            owner_id: ownerId,
            name: validated.name,
            institution: validated.institution,
            color: validatedColor
        })
        .select()
        .single();

    if (error) throw error;

    invalidateCache(`user_groups_${ownerId}`);

    return {
        ...data,
        user_role: ServiceRole.ADMIN,
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
    invalidateCache(`group_members_${groupId}`);
};

export const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    return fetchWithCache(`group_members_${groupId}`, async () => {
        const { data, error } = await supabase
            .from('group_members')
            .select(`
                *,
                profile:profiles(*)
            `)
            .eq('group_id', groupId);

        if (error) throw error;
        return data as GroupMember[];
    });
};

export const removeGroupMember = async (groupId: string, profileId: string): Promise<void> => {
    const { error } = await supabase
        .from('group_members')
        .delete()
        .match({ group_id: groupId, profile_id: profileId });

    if (error) throw error;
    invalidateCache(`group_members_${groupId}`);
};

export interface CanLeaveGroupResult {
    canLeave: boolean;
    reason?: string;
    assignmentCount?: number;
}

export const canUserLeaveGroup = async (groupId: string, userId: string): Promise<CanLeaveGroupResult> => {
    const { data: shifts, error: shiftsError } = await supabase
        .from('shifts')
        .select('id, is_published')
        .eq('group_id', groupId);

    if (shiftsError) throw shiftsError;

    if (!shifts || shifts.length === 0) {
        return { canLeave: true };
    }

    const shiftIds = shifts.map(s => s.id);

    const { data: assignments, error: assignmentsError } = await supabase
        .from('shift_assignments')
        .select('id, shift_id')
        .in('shift_id', shiftIds)
        .eq('profile_id', userId);

    if (assignmentsError) throw assignmentsError;

    if (!assignments || assignments.length === 0) {
        return { canLeave: true };
    }

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
    const validation = await canUserLeaveGroup(groupId, userId);

    if (!validation.canLeave) {
        throw new Error(validation.reason || 'Você não pode sair deste serviço no momento.');
    }

    await removeGroupMember(groupId, userId);
    invalidateCache(`user_groups_${userId}`);
};

export const updateMemberPersonalColor = async (groupId: string, userId: string, color: string): Promise<void> => {
    const { error } = await supabase
        .from('group_members')
        .update({
            personal_color: color,
            has_seen_color_banner: true
        })
        .match({ group_id: groupId, profile_id: userId });

    if (error) throw error;
    invalidateCache(`user_groups_${userId}`);
};

export const markColorBannerSeen = async (groupId: string, userId: string): Promise<void> => {
    const { error } = await supabase
        .from('group_members')
        .update({ has_seen_color_banner: true })
        .match({ group_id: groupId, profile_id: userId });

    if (error) throw error;
};

export const deleteGroup = async (groupId: string): Promise<void> => {
    const { data: shifts } = await supabase.from('shifts').select('id').eq('group_id', groupId);
    const shiftIds = shifts?.map(s => s.id) || [];

    if (shiftIds.length > 0) {
        const { error: assignError } = await supabase
            .from('shift_assignments')
            .delete()
            .in('shift_id', shiftIds);
        if (assignError) throw assignError;
    }

    const { error: shiftError } = await supabase
        .from('shifts')
        .delete()
        .eq('group_id', groupId);
    if (shiftError) throw shiftError;

    const { error: memberError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId);
    if (memberError) throw memberError;

    const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

    if (error) throw error;
};

export const searchInstitutions = async (query: string): Promise<string[]> => {
    if (!query || query.length < 2) return [];

    const q = sanitizeFilterValue(query);
    const { data, error } = await supabase
        .from('groups')
        .select('institution')
        .ilike('institution', `%${q}%`)
        .limit(20);

    if (error) throw error;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const names = data.map((item: any) => item.institution);
    return Array.from(new Set(names)) as string[];
};

export const getAdminGroups = async (userId: string): Promise<Group[]> => {
    const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', userId);

    if (error) throw error;
    return data as Group[];
};

// --- GROUP RELATIONSHIPS ---

export const getRelatedGroups = async (groupId: string): Promise<GroupRelationship[]> => {
    const { data, error } = await supabase
        .from('group_relationships')
        .select(`
            *,
            related_group:groups!related_group_id(id, name, institution, color)
        `)
        .eq('group_id', groupId);

    if (error) throw error;
    return data as GroupRelationship[];
};

export const addRelatedGroup = async (
    groupId: string,
    relatedGroupId: string,
    relationshipType: string
): Promise<GroupRelationship> => {
    const { data, error } = await supabase
        .from('group_relationships')
        .insert({
            group_id: groupId,
            related_group_id: relatedGroupId,
            relationship_type: relationshipType
        })
        .select()
        .single();

    if (error) throw error;
    return data as GroupRelationship;
};

export const removeRelatedGroup = async (relationshipId: string): Promise<void> => {
    const { error } = await supabase
        .from('group_relationships')
        .delete()
        .eq('id', relationshipId);

    if (error) throw error;
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

    if (shiftPresets.length > 0) {
        const presetsWithGroupId = shiftPresets.map(p => ({
            code: p.code,
            start_time: p.start_time,
            end_time: p.end_time,
            quantity_needed: p.quantity_needed || 1,
            days_of_week: p.days_of_week,
            group_id: groupId
        }));

        const { error: presetsError } = await supabase
            .from('shift_presets')
            .insert(presetsWithGroupId);

        if (presetsError) {
            console.error('Error creating shift presets:', presetsError);
        }
    }

    const memberInserts = team.map(member => {
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

    if (memberInserts.length > 0) {
        const { error: membersError } = await supabase
            .from('group_members')
            .insert(memberInserts);

        if (membersError) {
            console.error('Error adding members:', membersError);
        }
    }

    invalidateCache(`user_groups_${ownerId}`);

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
        await supabase
            .from('shift_presets')
            .delete()
            .eq('group_id', groupId);

        if (shiftPresets.length > 0) {
            const presetsWithGroupId = shiftPresets.map(p => ({
                code: p.code,
                start_time: p.start_time,
                end_time: p.end_time,
                quantity_needed: p.quantity_needed || 1,
                days_of_week: p.days_of_week,
                group_id: groupId
            }));

            const { error } = await supabase
                .from('shift_presets')
                .insert(presetsWithGroupId);

            if (error) console.error('Error syncing shift presets:', error);
        }
    }

    // 3. Sync Members
    if (team) {
        const { data: currentMembers } = await supabase
            .from('group_members')
            .select('profile_id')
            .eq('group_id', groupId);

        const currentMemberIds = new Set((currentMembers || []).map(m => m.profile_id));
        const newMemberIds = new Set(team.map(m => m.profile.id));

        const toRemove = [...currentMemberIds].filter(id => !newMemberIds.has(id));
        const toAdd = team.filter(m => !currentMemberIds.has(m.profile.id));

        if (toRemove.length > 0) {
            await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .in('profile_id', toRemove);
        }

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

    // Notify all current members about the service update
    const { data: allMembers } = await supabase
        .from('group_members')
        .select('profile_id')
        .eq('group_id', groupId);

    if (allMembers && allMembers.length > 0) {

        const serviceName = updates.name || 'seu serviço';
        const memberIds = allMembers.map(m => m.profile_id);
        const notifs = memberIds.map(uid => ({
            user_id: uid,
            title: 'Serviço Atualizado',
            message: `O serviço "${serviceName}" foi atualizado pelo gestor.`,
            type: 'SERVICE_UPDATE' as const,
            is_read: false,
            metadata: { group_id: groupId }
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createNotificationsBulk(notifs as any);
        await sendPushToUsers(memberIds, 'SERVICE_UPDATE', 'Serviço Atualizado', `O serviço "${serviceName}" foi atualizado pelo gestor.`);
    }
};
