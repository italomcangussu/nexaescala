import { supabase } from '../lib/supabase';
import { Profile, Group, Shift, ShiftAssignment, FinancialRecord, FinancialConfig, ServiceRole, ShiftExchange, TradeStatus, TradeType, GroupMember, ChatMessage, ShiftPreset, TeamMember, AppRole, GroupRelationship, Notification, ShiftExchangeRequest, AppLog, NotificationPreferences } from '../types';


// --- CACHE HELPER ---
const CACHE_PREFIX = 'nexaescala_cache_';
// Default cache duration: 7 days (offline first approach)


const fetchWithCache = async <T>(key: string, fetcher: () => Promise<T>, forceRefresh = false): Promise<T> => {
    const cacheKey = CACHE_PREFIX + key;

    // If online and force refresh is true, skip cache read
    if (!forceRefresh && navigator.onLine) {
        // We still prefer fresh data if online, but could implement Stale-While-Revalidate here
        // For now, simpler approach: Network First, Fallback to Cache
    }

    try {
        // Try network first
        const data = await fetcher();
        // If successful, save to cache
        try {
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data
            }));
        } catch (e) {
            console.warn('LocalStorage full, skipping cache save', e);
        }
        return data;
    } catch (error) {
        // If network fails, try cache
        console.warn(`[Offline Mode] Network request failed for ${key}, checking cache...`);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const parsed = JSON.parse(cached);
            console.info(`[Offline Mode] Using cached data for ${key} (${new Date(parsed.timestamp).toLocaleString()})`);
            return parsed.data as T;
        }
        // If no cache, propagate error
        throw error;
    }
};

// --- FILTER SANITIZATION ---
// Supabase PostgREST filter syntax uses special characters: , . ( )
// User input must be sanitized to prevent filter injection.
const sanitizeFilterValue = (value: string): string => {
    return value.replace(/[,.()"'\\]/g, '');
};

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

    const q = sanitizeFilterValue(query);
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,crm.ilike.%${q}%`)
        .limit(10);

    if (error) throw error;
    return data as Profile[];
};



// --- ADMIN API ---

export const getAdminStats = async (): Promise<{ totalUsers: number, activeUsers24h: number, totalGroups: number }> => {
    // Basic stats (approximate since we might not have 'last_sign_in' exposed in public profile)
    // We can count profiles
    const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: totalGroups, error: groupsError } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true });

    if (usersError) console.warn('Error fetching total users:', usersError);
    if (groupsError) console.warn('Error fetching total groups:', groupsError);

    // For active users, we could query logs if we had them populated
    return {
        totalUsers: totalUsers || 0,
        activeUsers24h: 0, // Mock for now until logs are active
        totalGroups: totalGroups || 0
    };
};

export const getAllUsers = async (page = 0, limit = 50): Promise<{ users: Profile[], total: number }> => {
    const { data, count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .range(page * limit, (page + 1) * limit - 1)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return { users: data as Profile[], total: count || 0 };
};

export const updateUserAppRole = async (userId: string, role: 'admin' | 'user' | 'support'): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({ app_role: role })
        .eq('id', userId);

    if (error) throw error;
};

export const getAppLogs = async (limit = 100): Promise<AppLog[]> => {
    const { data, error } = await supabase
        .from('app_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data as AppLog[];
    return data as AppLog[];
};

export const createAppLog = async (
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: any
): Promise<void> => {
    // Current user is automatically attached via RLS if we set default user_id or we can pass it manually?
    // In our schema: user_id uuid REFERENCES auth.users(id)
    // RLS: "Users can insert logs" WITH CHECK (auth.uid() = user_id)

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Can't log if not authenticated (or handle anonymous logs differently if needed)

    const { error } = await supabase
        .from('app_logs')
        .insert({
            user_id: user.id,
            level,
            message,
            metadata
        });

    if (error) console.error('Failed to create app log:', error);
};

export const deleteUserAccount = async (userId: string): Promise<void> => {
    // Call the delete-user Edge Function which handles full deletion
    // (profile data + auth.users) using service_role key server-side.
    const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
    });

    if (error) {
        throw new Error(error.message || 'Falha ao deletar conta');
    }

    // Sign out after successful deletion
    await supabase.auth.signOut();
};

export const getUserGroups = async (userId: string): Promise<Group[]> => {
    return fetchWithCache(`user_groups_${userId}`, async () => {
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

        const groups = data.map((item: any) => {
            const computedColor = item.personal_color || item.group.color || '#10b981';
            // Debug deprecated: console.log(`[API] Group ${item.group.name} - Personal: ${item.personal_color}`);
            return {
                ...item.group,
                user_role: item.service_role,
                // Use personal_color if set, then group color, otherwise default to emerald green
                color: computedColor,
                has_seen_color_banner: item.has_seen_color_banner || false,
                member_count: 0, // Default, will update below
                unread_messages: 0 // Placeholder
            }
        }) as Group[];

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
    });
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
      shift:shifts (
        *,
        group:groups (
            name,
            institution
        )
      )
    `)
        .eq('profile_id', userId);

    if (assignError) throw assignError;

    const shifts: Shift[] = [];
    const assignments: ShiftAssignment[] = [];

    assignmentsData.forEach((a: any) => {
        if (a.shift) {
            const shiftWithGroup = {
                ...a.shift,
                group_name: a.shift.group?.name,
                institution_name: a.shift.group?.institution
            };
            shifts.push(shiftWithGroup);
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

export const getShifts = async (groupId: string, forceRefresh = false): Promise<Shift[]> => {
    return fetchWithCache(`shifts_${groupId}`, async () => {
        const { data, error } = await supabase
            .from('shifts')
            .select(`
            *,
            group:groups (
                name,
                institution
            )
        `)
            .eq('group_id', groupId);

        if (error) throw error;

        // Map group details to shift object
        const shifts = (data as any[]).map(shift => ({
            ...shift,
            group_name: shift.group?.name,
            institution_name: shift.group?.institution
        }));

        return shifts as Shift[];
    }, forceRefresh);
};

export const getAssignments = async (shiftIds: string[], forceRefresh = false): Promise<ShiftAssignment[]> => {
    if (shiftIds.length === 0) return [];

    return fetchWithCache(`assignments_${shiftIds.slice(0, 5).join('_')}_count${shiftIds.length}`, async () => {
        const { data, error } = await supabase
            .from('shift_assignments')
            .select('*, profile:profiles(*)')
            .in('shift_id', shiftIds);

        if (error) throw error;
        return data as ShiftAssignment[];
    }, forceRefresh);
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
    return fetchWithCache(`fin_config_${userId}_${groupId}`, async () => {
        const { data, error } = await supabase
            .from('financial_configs')
            .select('*')
            .eq('user_id', userId)
            .eq('group_id', groupId)
            .maybeSingle();

        if (error) return null;
        return data as FinancialConfig;
    });
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
    console.log('[API] updateMemberPersonalColor', { groupId, userId, color });
    const { error } = await supabase
        .from('group_members')
        .update({
            personal_color: color,
            has_seen_color_banner: true
        })
        .match({ group_id: groupId, profile_id: userId });

    if (error) {
        console.error('[API] updateMemberPersonalColor ERROR', error);
        throw error;
    }
    console.log('[API] updateMemberPersonalColor SUCCESS');
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

// --- NOTIFICATION PREFERENCES ---

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    enabled: true,
    swaps: true,
    newShifts: true,
    groups: true
};

export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return (data?.notification_preferences as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES;
};

export const updateNotificationPreferences = async (userId: string, preferences: NotificationPreferences): Promise<void> => {
    const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', userId);

    if (error) throw error;
};

// --- PUSH NOTIFICATION SENDER ---

// Maps notification types to preference keys
const NOTIFICATION_TYPE_TO_PREF: Record<string, keyof NotificationPreferences> = {
    'SHIFT_SWAP': 'swaps',
    'SHIFT_OFFER': 'swaps',
    'SHIFT_PUBLISHED': 'newShifts',
    'SERVICE_UPDATE': 'groups',
    'SYSTEM': 'enabled', // System notifications always go if enabled
    'MENTION': 'enabled',
};

/**
 * Send push notification to specific users after checking their preferences.
 * Called after inserting into the notifications table.
 */
export const sendPushToUsers = async (
    userIds: string[],
    notificationType: string,
    title: string,
    body: string,
    url?: string
): Promise<void> => {
    if (userIds.length === 0) return;

    try {
        // Fetch push subscriptions and preferences for target users
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, push_subscription, notification_preferences')
            .in('id', userIds)
            .not('push_subscription', 'is', null);

        if (!profiles || profiles.length === 0) return;

        const prefKey = NOTIFICATION_TYPE_TO_PREF[notificationType] || 'enabled';

        for (const profile of profiles) {
            const prefs = (profile.notification_preferences as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES;

            // Check if notifications are enabled globally and for this category
            if (!prefs.enabled) continue;
            if (prefKey !== 'enabled' && !prefs[prefKey]) continue;

            const subscription = profile.push_subscription;
            if (!subscription) continue;

            const parsedSub = JSON.parse(subscription);

            if (parsedSub.endpoint === 'native') {
                // Native push (iOS/Android) - send via Edge Function
                await supabase.functions.invoke('send-push-notification', {
                    body: {
                        type: 'native',
                        platform: parsedSub.keys?.p256dh, // 'ios' or 'android'
                        token: parsedSub.keys?.auth,
                        title,
                        body,
                        data: { url: url || '/' }
                    }
                });
            } else {
                // Web push - send via Edge Function
                await supabase.functions.invoke('send-push-notification', {
                    body: {
                        type: 'web',
                        subscription: parsedSub,
                        title,
                        body,
                        data: { url: url || '/' }
                    }
                });
            }
        }
    } catch (error) {
        // Push failures should not break the main flow
        console.error('Error sending push notifications:', error);
    }
};

export const publishShifts = async (groupId: string, shiftIds: string[]): Promise<void> => {
    if (shiftIds.length === 0) return;
    const { error } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .eq('group_id', groupId)
        .in('id', shiftIds);
    if (error) throw error;

    // Notify all group members about the new scale
    const { data: members } = await supabase
        .from('group_members')
        .select('profile_id')
        .eq('group_id', groupId);

    if (members && members.length > 0) {
        const notifications = members.map(m => ({
            user_id: m.profile_id,
            title: 'Nova Escala Publicada',
            message: 'Uma nova escala foi publicada no seu serviço.',
            type: 'SHIFT_PUBLISHED',
            is_read: false,
            metadata: { group_id: groupId }
        }));
        await createNotificationsBulk(notifications as any);

        // Send push notifications
        const memberIds = members.map(m => m.profile_id);
        await sendPushToUsers(memberIds, 'SHIFT_PUBLISHED', 'Nova Escala Publicada', 'Uma nova escala foi publicada no seu serviço.');
    }
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

    const q = sanitizeFilterValue(query);
    const { data, error } = await supabase
        .from('groups')
        .select('institution')
        .ilike('institution', `%${q}%`)
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

export const syncShiftPresets = async (groupId: string, presets: ShiftPreset[]): Promise<void> => {
    // 1. Get current presets
    const { data: currentPresets, error: fetchError } = await supabase
        .from('shift_presets')
        .select('*')
        .eq('group_id', groupId);

    if (fetchError) throw fetchError;

    const incomingIds = new Set(presets.filter(p => p.id && typeof p.id === 'string' && !p.id.startsWith('temp-')).map(p => p.id));

    // 2. Delete removed
    const toDelete = currentPresets?.filter(p => !incomingIds.has(p.id)) || [];
    if (toDelete.length > 0) {
        const { error: deleteError } = await supabase.from('shift_presets').delete().in('id', toDelete.map(p => p.id));
        if (deleteError) throw deleteError;
    }

    // 3. Separate into Inserts and Updates to avoid bulk-upsert key mismatch (null ID error)
    const toInsert: any[] = [];
    const toUpdate: any[] = [];

    presets.forEach(p => {
        const item: any = {
            group_id: groupId,
            code: p.code,
            start_time: p.start_time,
            end_time: p.end_time,
            quantity_needed: Number(p.quantity_needed) || 1,
            days_of_week: p.days_of_week || [0, 1, 2, 3, 4, 5, 6]
        };

        if (p.id && typeof p.id === 'string' && !p.id.startsWith('temp-')) {
            item.id = p.id;
            toUpdate.push(item);
        } else {
            toInsert.push(item);
        }
    });

    // 4. Perform Insert
    if (toInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('shift_presets')
            .insert(toInsert);
        if (insertError) throw insertError;
    }

    // 5. Perform Update
    if (toUpdate.length > 0) {
        const { error: updateError } = await supabase
            .from('shift_presets')
            .upsert(toUpdate);
        if (updateError) throw updateError;
    }
};

// Regenerate shifts for a specific month based on current presets
export const regenerateShiftsForMonth = async (
    groupId: string,
    date: Date,
    presets?: ShiftPreset[]
): Promise<void> => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // 1. Ensure presets are synced if provided
    if (presets) {
        await syncShiftPresets(groupId, presets);
    }

    const currentPresets = presets || await getShiftPresets(groupId);
    if (currentPresets.length === 0) return;

    // 2. Range
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // 3. Fetch ALL shifts for this month
    const { data: existingShifts, error: fetchError } = await supabase
        .from('shifts')
        .select(`*, shift_assignments(id)`)
        .eq('group_id', groupId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (fetchError) throw fetchError;

    const todayStr = new Date().toISOString().split('T')[0];

    const handledShifts = new Set<string>();
    const shiftsToDelete: string[] = [];
    const shiftsToUpdate: any[] = [];

    for (const shift of (existingShifts || [])) {
        const preset = currentPresets.find(p => p.code === shift.code);

        if (!preset) {
            // Preset no longer exists - delete if no assignments
            if (!shift.shift_assignments || shift.shift_assignments.length === 0) {
                shiftsToDelete.push(shift.id);
            }
            continue;
        }

        // Check if day is valid for this preset
        const d = new Date(shift.date + 'T12:00:00');
        const dayOfWeek = d.getDay();

        if (preset.days_of_week && !preset.days_of_week.includes(dayOfWeek)) {
            // Shift shouldn't exist - delete if no assignments
            if (!shift.shift_assignments || shift.shift_assignments.length === 0) {
                shiftsToDelete.push(shift.id);
                continue;
            }
        }

        // Update if in future/today
        if (shift.date >= todayStr) {
            shiftsToUpdate.push({
                id: shift.id,
                group_id: groupId,
                date: shift.date,
                code: preset.code,
                start_time: preset.start_time,
                end_time: preset.end_time,
                quantity_needed: preset.quantity_needed || 1,
                is_published: shift.is_published
            });
        }

        handledShifts.add(`${shift.date}_${shift.code}`);
    }

    // Execute batch delete
    if (shiftsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('shifts').delete().in('id', shiftsToDelete);
        if (deleteError) throw deleteError;
    }

    // Execute batch update via upsert
    if (shiftsToUpdate.length > 0) {
        const { error: updateError } = await supabase.from('shifts').upsert(shiftsToUpdate);
        if (updateError) throw updateError;
    }

    // 4. Create missing shifts
    const days = Array.from({ length: lastDay }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return d.toISOString().split('T')[0];
    });

    const newShifts = [];
    for (const day of days) {
        if (day < todayStr) continue;

        for (const preset of currentPresets) {
            if (handledShifts.has(`${day}_${preset.code}`)) continue;

            const d = new Date(day + 'T12:00:00');
            const dayOfWeek = d.getDay();
            if (preset.days_of_week && !preset.days_of_week.includes(dayOfWeek)) continue;

            newShifts.push({
                group_id: groupId,
                date: day,
                code: preset.code,
                start_time: preset.start_time,
                end_time: preset.end_time,
                quantity_needed: preset.quantity_needed || 1,
                is_published: false
            });
        }
    }

    if (newShifts.length > 0) {
        const { error: insertError } = await supabase.from('shifts').insert(newShifts);
        if (insertError) throw insertError;
    }
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
        await createNotificationsBulk(notifs as any);
        await sendPushToUsers(memberIds, 'SERVICE_UPDATE', 'Serviço Atualizado', `O serviço "${serviceName}" foi atualizado pelo gestor.`);
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
    quantityPerShift: number,
    existingDatesSet?: Set<string> // Optimization: Pass existing dates to avoid query
): Promise<number> => {
    if (months.length === 0 || presets.length === 0) return 0;

    const shiftsToInsert: any[] = [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // If existingDatesSet provided, use it. Otherwise fetch.
    let existingDates = existingDatesSet;

    if (!existingDates) {
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

        existingDates = new Set(existing?.map(s => s.date) || []);
    }

    for (const { year, month } of months) {
        const days = getDaysInMonth(year, month);

        for (const day of days) {
            // Skip past days or days that already have shifts (like individual scales)
            // Note: Since we are in "Regenerate" context, we might be allowed to touch past days if we want?
            // But usually we preserve history. Let's keep the logic: `day < todayStr` skip.
            // Wait, if I am editing a future schedule, I definitely want to generate.

            // existingDates.has(day) check ensures we don't double-book a day that has shifts (individual or otherwise)
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
    // Check if there is already a pending exchange for this assignment
    const { data: existing } = await supabase
        .from('shift_exchanges')
        .select('id')
        .eq('offered_shift_assignment_id', exchange.offered_shift_assignment_id)
        .eq('status', 'PENDING')
        .maybeSingle();

    if (existing) {
        throw new Error('Já existe um pedido de repasse pendente para este plantão.');
    }

    const { data, error } = await supabase
        .from('shift_exchanges')
        .insert(exchange)
        .select()
        .single();

    if (error) throw error;

    // Notification Logic for Giveaways
    if (exchange.type === TradeType.GIVEAWAY) {
        if (exchange.target_profile_id) {
            // Directed Giveaway: Notify the target user
            await createNotificationsBulk([{
                user_id: exchange.target_profile_id,
                title: 'Repasse de Plantão Recebido',
                message: 'Um colega repassou um plantão diretamente para você.',
                type: 'SHIFT_OFFER',
                is_read: false,
                metadata: { exchange_id: data.id }
            }]);
            await sendPushToUsers([exchange.target_profile_id], 'SHIFT_OFFER', 'Repasse de Plantão Recebido', 'Um colega repassou um plantão diretamente para você.');
        } else {
            // Global Giveaway: Notify ALL group members
            const { data: members } = await supabase
                .from('group_members')
                .select('profile_id')
                .eq('group_id', exchange.group_id);

            if (members && members.length > 0) {
                // EXCLUDE the requesting user from the notification list
                const otherMembers = members.filter(m => m.profile_id !== exchange.requesting_profile_id);

                if (otherMembers.length > 0) {
                    const notifications = otherMembers.map(m => ({
                        user_id: m.profile_id,
                        title: exchange.type === TradeType.DIRECT_SWAP ? 'Oportunidade de Troca' : 'Oportunidade de Plantão',
                        message: exchange.type === TradeType.DIRECT_SWAP
                            ? `Um colega solicitou uma troca de plantão no grupo.`
                            : `Um colega ofertou um plantão para o grupo.`,
                        type: 'SHIFT_OFFER',
                        is_read: false,
                        metadata: { exchange_id: data.id }
                    }));
                    await createNotificationsBulk(notifications as any);
                    const pushIds = otherMembers.map(m => m.profile_id);
                    const pushMsg = exchange.type === TradeType.DIRECT_SWAP
                        ? 'Um colega solicitou uma troca de plantão no grupo.'
                        : 'Um colega ofertou um plantão para o grupo.';
                    await sendPushToUsers(pushIds, 'SHIFT_OFFER', 'Oportunidade de Plantão', pushMsg);
                }
            }
        }
    }
};

export const cancelShiftExchange = async (exchangeId: string): Promise<void> => {
    // 1. Fetch exchange to check for target_profile_id
    const { data: exchange } = await supabase
        .from('shift_exchanges')
        .select('target_profile_id')
        .eq('id', exchangeId)
        .single();

    // 2. Notify target if it was directed
    if (exchange?.target_profile_id) {
        await createNotificationsBulk([{
            user_id: exchange.target_profile_id,
            title: 'Solicitação Cancelada',
            message: 'Um colega cancelou a solicitação de repasse/troca que enviou para você.',
            type: 'SHIFT_OFFER',
            is_read: false,
            metadata: { exchange_id: exchangeId }
        }]);
        await sendPushToUsers([exchange.target_profile_id], 'SHIFT_OFFER', 'Solicitação Cancelada', 'Um colega cancelou a solicitação de repasse/troca que enviou para você.');
    }

    // 3. Update status to CANCELLED (better than delete for notification context)
    const { error } = await supabase
        .from('shift_exchanges')
        .update({ status: TradeStatus.CANCELLED })
        .eq('id', exchangeId)
        .eq('status', 'PENDING');

    if (error) throw error;
};

export const respondToShiftExchange = async (
    exchangeId: string,
    action: 'ACCEPT' | 'REJECT',
    targetUserId: string
): Promise<void> => {
    // 1. Fetch the exchange
    const { data: exchange, error: fetchError } = await supabase
        .from('shift_exchanges')
        .select('*')
        .eq('id', exchangeId)
        .single();

    if (fetchError) throw fetchError;
    if (!exchange) throw new Error('Repasse/Troca não encontrada.');

    if (action === 'ACCEPT') {
        // Execute transaction client-side to ensure proper handling of Swaps and Global Giveaways
        await executeExchangeTransaction(exchange, targetUserId);
    } else {
        // Reject - Only relevant for DIRECTED giveaways
        if (exchange.target_profile_id === targetUserId) {
            const { error: updateExchangeError } = await supabase
                .from('shift_exchanges')
                .update({ status: TradeStatus.REJECTED })
                .eq('id', exchangeId);

            if (updateExchangeError) throw updateExchangeError;

            // Notify original requester
            await createNotificationsBulk([{
                user_id: exchange.requesting_profile_id,
                title: 'Repasse Recusado',
                message: 'Um colega recusou o seu repasse direcionado.',
                type: 'SHIFT_OFFER',
                is_read: false,
                metadata: { exchange_id: exchangeId }
            }]);
            await sendPushToUsers([exchange.requesting_profile_id], 'SHIFT_OFFER', 'Repasse Recusado', 'Um colega recusou o seu repasse direcionado.');
        }
    }
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

export const getUserShiftExchanges = async (userId: string): Promise<ShiftExchange[]> => {
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
        .or(`requesting_profile_id.eq.${userId},target_profile_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any;
};

export const getServiceExchangeHistory = async (groupId: string): Promise<ShiftExchange[]> => {
    // Calculate date 30 days ago
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const thirtyDaysAgo = date.toISOString();

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
        .eq('status', 'ACCEPTED')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any;
};

export const updateShiftExchangeStatus = async (exchangeId: string, status: TradeStatus): Promise<void> => {
    // 1. Fetch exchange for notification details
    const { data: exchange } = await supabase
        .from('shift_exchanges')
        .select('requesting_profile_id, type')
        .eq('id', exchangeId)
        .single();

    const { error } = await supabase
        .from('shift_exchanges')
        .update({ status })
        .eq('id', exchangeId);

    if (error) throw error;

    // 2. Notify requester if status is REJECTED
    if (status === TradeStatus.REJECTED && exchange) {
        await createNotificationsBulk([{
            user_id: exchange.requesting_profile_id,
            title: exchange.type === TradeType.DIRECT_SWAP ? 'Troca Recusada' : 'Repasse Recusado',
            message: 'Sua solicitação de plantão foi recusada.',
            type: 'SHIFT_OFFER',
            is_read: false,
            metadata: { exchange_id: exchangeId }
        }]);
        const rejectTitle = exchange.type === TradeType.DIRECT_SWAP ? 'Troca Recusada' : 'Repasse Recusado';
        await sendPushToUsers([exchange.requesting_profile_id], 'SHIFT_OFFER', rejectTitle, 'Sua solicitação de plantão foi recusada.');
    }
    // NOTE: Actual swap logic (changing assignments) should happen transactionally
    // For now, we update status here, and consumer of this function performs the swap if ACCEPTED
};

// Helper to execute the swap/giveaway atomic transaction
export async function executeExchangeTransaction(exchange: ShiftExchange, acceptingUserId?: string): Promise<void> {
    const finalTargetId = exchange.type === 'DIRECT_SWAP' || exchange.target_profile_id
        ? exchange.target_profile_id
        : acceptingUserId;

    if (!finalTargetId) {
        throw new Error("Target user not identified for exchange.");
    }

    // 1. Update assignments
    if (exchange.type === 'GIVEAWAY') {
        // Transfer offered shift to target (Global or Directed)
        const { error } = await supabase
            .from('shift_assignments')
            .update({ profile_id: finalTargetId })
            .eq('id', exchange.offered_shift_assignment_id);
        if (error) throw error;
    } else if (exchange.type === 'DIRECT_SWAP' && exchange.requested_shift_assignment_id) {
        // Swap
        // 1. Offered -> Target
        const { error: e1 } = await supabase
            .from('shift_assignments')
            .update({ profile_id: finalTargetId })
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
    const { error } = await supabase
        .from('shift_exchanges')
        .update({
            status: TradeStatus.ACCEPTED,
            target_profile_id: finalTargetId, // Ensure target is set for Global ones
            updated_at: new Date().toISOString()
        })
        .eq('id', exchange.id);

    if (error) throw error;

    // Notify original requester that the exchange was finalized
    await createNotificationsBulk([{
        user_id: exchange.requesting_profile_id,
        title: exchange.type === TradeType.DIRECT_SWAP ? 'Troca Confirmada!' : 'Repasse Aceito!',
        message: exchange.type === TradeType.DIRECT_SWAP
            ? 'Sua solicitação de troca de plantão foi concluída com sucesso.'
            : 'Um colega aceitou o seu repasse de plantão.',
        type: 'SHIFT_OFFER',
        is_read: false,
        metadata: { exchange_id: exchange.id }
    }]);
    const execTitle = exchange.type === TradeType.DIRECT_SWAP ? 'Troca Confirmada!' : 'Repasse Aceito!';
    const execMsg = exchange.type === TradeType.DIRECT_SWAP
        ? 'Sua solicitação de troca de plantão foi concluída com sucesso.'
        : 'Um colega aceitou o seu repasse de plantão.';
    await sendPushToUsers([exchange.requesting_profile_id], 'SHIFT_OFFER', execTitle, execMsg);
}

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
// --- SHIFT EXCHANGES ---

export const createShiftOffer = async (
    shiftId: string,
    requestingProfileId: string,
    note?: string
): Promise<void> => {
    // 1. Get shift details to find the group
    const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .select(`
            *,
            group:groups(id, name, owner_id)
        `)
        .eq('id', shiftId)
        .single();

    if (shiftError) throw shiftError;

    // 2. Create the Exchange Request
    const { error: insertError } = await supabase
        .from('shift_exchanges')
        .insert({
            shift_id: shiftId,
            requesting_profile_id: requestingProfileId,
            status: 'PENDING', // Assuming 'PENDING' is a valid status in TradeStatus enum or string
            note: note
        });

    if (insertError) throw insertError;

    // 3. Notify Admins
    // Fetch admins of this group
    const { data: admins, error: adminError } = await supabase
        .from('group_members')
        .select('profile_id')
        .eq('group_id', shift.group_id)
        .in('service_role', ['ADMIN', 'ADMIN_AUX']);

    if (!adminError && admins && admins.length > 0) {
        const adminIds = admins.map(a => a.profile_id);

        // Prepare notifications
        const notifications: Partial<Notification>[] = adminIds.map(adminId => ({
            user_id: adminId,
            title: 'Nova Oferta de Plantão',
            message: `Um membro ofertou um plantão no serviço ${shift.group.name}.`,
            type: 'SHIFT_OFFER', // Ensure this type exists or use Generic
            link: `/services/${shift.group.id}?tab=notifications`,
            is_read: false
        }));

        await createNotificationsBulk(notifications);
    }
};


// --- PEER-TO-PEER SHIFT EXCHANGE REQUESTS ---

/**
 * Create a new shift exchange request
 * Allows a plantonista to request a shift swap with another member
 */
export const createShiftExchangeRequest = async (
    groupId: string,
    requestingUserId: string,
    targetUserId: string,
    offeredShiftId: string,
    requestedShiftOptions: string[] // Array of 1-3 shift IDs
): Promise<ShiftExchangeRequest> => {
    // Validate shift options count
    if (requestedShiftOptions.length < 1 || requestedShiftOptions.length > 3) {
        throw new Error('Você deve selecionar entre 1 e 3 opções de plantão.');
    }

    // Create the exchange request
    const { data, error } = await supabase
        .from('shift_exchange_requests')
        .insert({
            group_id: groupId,
            requesting_user_id: requestingUserId,
            target_user_id: targetUserId,
            offered_shift_id: offeredShiftId,
            requested_shift_options: requestedShiftOptions,
            status: 'PENDING'
        })
        .select()
        .single();

    if (error) throw error;

    // Create notification for target user
    await createNotificationsBulk([{
        user_id: targetUserId,
        title: 'Nova Solicitação de Troca',
        message: 'Você recebeu uma solicitação de troca de plantão.',
        type: 'SHIFT_SWAP',
        is_read: false,
        metadata: { exchange_request_id: data.id }
    }]);
    await sendPushToUsers([targetUserId], 'SHIFT_SWAP', 'Nova Solicitação de Troca', 'Você recebeu uma solicitação de troca de plantão.');

    return data as ShiftExchangeRequest;
};

/**
 * Get all pending exchange requests for the current user
 * Returns both sent and received requests
 */
export const getMyPendingExchangeRequests = async (userId: string): Promise<ShiftExchangeRequest[]> => {
    const { data, error } = await supabase
        .from('shift_exchange_requests')
        .select(`
            *,
            requesting_user:profiles!requesting_user_id(*),
            target_user:profiles!target_user_id(*),
            offered_shift:shifts!offered_shift_id(*)
        `)
        .or(`requesting_user_id.eq.${userId},target_user_id.eq.${userId}`)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch requested shifts for each request
    const enrichedData = await Promise.all(
        (data || []).map(async (request: any) => {
            const shiftIds = request.requested_shift_options as string[];

            if (shiftIds && shiftIds.length > 0) {
                const { data: shifts, error: shiftsError } = await supabase
                    .from('shifts')
                    .select('*')
                    .in('id', shiftIds);

                if (!shiftsError && shifts) {
                    request.requested_shifts = shifts;
                }
            }

            return request;
        })
    );

    return enrichedData as ShiftExchangeRequest[];
};

/**
 * Get available shifts for exchange (target user's future shifts)
 * Optionally filters out shifts that conflict with requester's schedule
 */
export const getAvailableShiftsForExchange = async (
    groupId: string,
    targetUserId: string,
    requestingUserId: string,
    excludeConflicts: boolean = true
): Promise<Shift[]> => {
    const today = new Date().toISOString().split('T')[0];

    // Get target user's future shift assignments
    const { data: assignments, error: assignError } = await supabase
        .from('shift_assignments')
        .select(`
            id,
            shift:shifts!inner(
                *,
                group:groups(name, institution)
            )
        `)
        .eq('profile_id', targetUserId)
        .gte('shift.date', today)
        .eq('shift.group_id', groupId)
        .eq('shift.is_published', true);

    if (assignError) throw assignError;

    let shifts = (assignments || []).map((a: any) => ({
        ...a.shift,
        group_name: a.shift.group?.name,
        institution_name: a.shift.group?.institution
    })) as Shift[];

    // Filter out conflicts if requested
    if (excludeConflicts) {
        // Get requester's all shift assignments (across all groups)
        const { data: requesterAssignments, error: reqError } = await supabase
            .from('shift_assignments')
            .select(`
                shift:shifts!inner(
                    id,
                    date,
                    start_time,
                    end_time
                )
            `)
            .eq('profile_id', requestingUserId)
            .gte('shift.date', today);

        if (reqError) throw reqError;

        const requesterShifts = (requesterAssignments || []).map((a: any) => a.shift);

        // Filter out shifts that conflict
        shifts = shifts.filter(shift => {
            return !requesterShifts.some(reqShift => {
                // Check if dates match and times overlap
                if (shift.date !== reqShift.date) return false;

                // Simple time overlap check
                const shiftStart = shift.start_time;
                const shiftEnd = shift.end_time;
                const reqStart = reqShift.start_time;
                const reqEnd = reqShift.end_time;

                // Check for overlap
                return !(shiftEnd <= reqStart || shiftStart >= reqEnd);
            });
        });
    }

    return shifts;
};

/**
 * Respond to an exchange request (accept or reject)
 */
export const respondToExchangeRequest = async (
    requestId: string,
    action: 'ACCEPT' | 'REJECT',
    selectedShiftId?: string
): Promise<void> => {
    // Fetch the request
    const { data: request, error: fetchError } = await supabase
        .from('shift_exchange_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError) throw fetchError;
    if (!request) throw new Error('Solicitação não encontrada.');

    if (action === 'ACCEPT') {
        if (!selectedShiftId) {
            throw new Error('Você deve selecionar um plantão para trocar.');
        }

        // Validate selected shift is in options
        const options = request.requested_shift_options as string[];
        if (!options.includes(selectedShiftId)) {
            throw new Error('Plantão selecionado não está nas opções.');
        }

        // Execute the swap atomically
        await executeShiftSwap(
            request.offered_shift_id,
            selectedShiftId,
            request.requesting_user_id,
            request.target_user_id
        );

        // Update request status
        const { error: updateError } = await supabase
            .from('shift_exchange_requests')
            .update({
                status: 'ACCEPTED',
                accepted_shift_id: selectedShiftId
            })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // Create notifications for both users
        await createNotificationsBulk([
            {
                user_id: request.requesting_user_id,
                title: 'Troca Aceita!',
                message: 'Sua solicitação de troca foi aceita.',
                type: 'SHIFT_SWAP',
                is_read: false
            },
            {
                user_id: request.target_user_id,
                title: 'Troca Confirmada',
                message: 'A troca de plantão foi confirmada.',
                type: 'SHIFT_SWAP',
                is_read: false
            }
        ]);
        await sendPushToUsers(
            [request.requesting_user_id, request.target_user_id],
            'SHIFT_SWAP',
            'Troca Confirmada',
            'A troca de plantão foi confirmada com sucesso.'
        );
    } else {
        // Reject
        const { error: updateError } = await supabase
            .from('shift_exchange_requests')
            .update({ status: 'REJECTED' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // Notify requester
        await createNotificationsBulk([{
            user_id: request.requesting_user_id,
            title: 'Troca Recusada',
            message: 'Sua solicitação de troca foi recusada.',
            type: 'SHIFT_SWAP',
            is_read: false
        }]);
        await sendPushToUsers([request.requesting_user_id], 'SHIFT_SWAP', 'Troca Recusada', 'Sua solicitação de troca foi recusada.');
    }
};

/**
 * Execute atomic shift swap between two users
 */
const executeShiftSwap = async (
    offeredShiftId: string,
    requestedShiftId: string,
    requestingUserId: string,
    targetUserId: string
): Promise<void> => {
    // Get both assignments
    const { data: offeredAssignment, error: e1 } = await supabase
        .from('shift_assignments')
        .select('id')
        .eq('shift_id', offeredShiftId)
        .eq('profile_id', requestingUserId)
        .single();

    const { data: requestedAssignment, error: e2 } = await supabase
        .from('shift_assignments')
        .select('id')
        .eq('shift_id', requestedShiftId)
        .eq('profile_id', targetUserId)
        .single();

    if (e1 || e2 || !offeredAssignment || !requestedAssignment) {
        throw new Error('Erro ao localizar as atribuições de plantão.');
    }

    // Swap the assignments
    // Update offered shift to target user
    const { error: swap1Error } = await supabase
        .from('shift_assignments')
        .update({ profile_id: targetUserId })
        .eq('id', offeredAssignment.id);

    if (swap1Error) throw swap1Error;

    // Update requested shift to requesting user
    const { error: swap2Error } = await supabase
        .from('shift_assignments')
        .update({ profile_id: requestingUserId })
        .eq('id', requestedAssignment.id);

    if (swap2Error) throw swap2Error;
};



export const getPendingActionableRequests = async (userId: string): Promise<{ swaps: ShiftExchangeRequest[], giveaways: ShiftExchange[] }> => {
    // Get the user's groups first to filter public giveaways
    const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('profile_id', userId);

    const groupIds = userGroups?.map(g => g.group_id) || [];

    // 1. Fetch Swaps (ShiftExchangeRequest) - Directed to user
    const { data: swaps, error: swapsError } = await supabase
        .from('shift_exchange_requests')
        .select(`
            *,
            requesting_user:profiles!requesting_user_id(*),
            offered_shift:shifts!offered_shift_id(
                *,
                group:groups(name, institution)
            )
        `)
        .eq('target_user_id', userId)
        .eq('status', 'PENDING');

    if (swapsError) throw swapsError;

    // 2. Fetch Giveaways (ShiftExchange)
    // - Must be GIVEAWAY type and PENDING status
    // - Either target_profile_id is NULL (Public) OR matches current user (Directed)
    // - Current user must NOT be the requester
    // - Must belong to one of the user's groups
    let giveawaysQuery = supabase
        .from('shift_exchanges')
        .select(`
            *,
            requesting_profile:profiles!requesting_profile_id(*),
            offered_shift:shift_assignments!offered_shift_assignment_id(
                id,
                shift:shifts(
                    *,
                    group:groups(name, institution)
                )
            )
        `)
        .eq('status', TradeStatus.PENDING)
        .eq('type', TradeType.GIVEAWAY)
        .neq('requesting_profile_id', userId);

    if (groupIds.length > 0) {
        giveawaysQuery = giveawaysQuery.in('group_id', groupIds);
    }

    const { data: giveaways, error: giveawaysError } = await giveawaysQuery
        .or(`target_profile_id.eq.${userId},target_profile_id.is.null`);

    if (giveawaysError) throw giveawaysError;

    // Fetch requested shifts for each swap request
    const enrichedSwaps = await Promise.all(
        (swaps || []).map(async (request: any) => {
            const shiftIds = request.requested_shift_options as string[];

            if (shiftIds && shiftIds.length > 0) {
                const { data: shifts, error: shiftsError } = await supabase
                    .from('shifts')
                    .select('*')
                    .in('id', shiftIds);

                if (!shiftsError && shifts) {
                    request.requested_shifts = shifts;
                }
            }
            return request;
        })
    );

    return {
        swaps: enrichedSwaps as ShiftExchangeRequest[],
        giveaways: (giveaways || []) as ShiftExchange[]
    };
};

export const cancelExchangeRequest = async (requestId: string): Promise<void> => {
    // 1. Fetch request to identify target user for notification
    const { data: request, error: fetchError } = await supabase
        .from('shift_exchange_requests')
        .select('target_user_id')
        .eq('id', requestId)
        .single();

    if (fetchError) throw fetchError;

    // 2. Update status to CANCELLED
    const { error } = await supabase
        .from('shift_exchange_requests')
        .update({ status: 'CANCELLED' })
        .eq('id', requestId);

    if (error) throw error;

    // 3. Notify the target user
    if (request?.target_user_id) {
        await createNotificationsBulk([{
            user_id: request.target_user_id,
            title: 'Solicitação de Troca Cancelada',
            message: 'A solicitação de troca enviada para você foi cancelada pelo remetente.',
            type: 'SHIFT_SWAP',
            is_read: false,
            metadata: { exchange_request_id: requestId }
        }]);
        await sendPushToUsers([request.target_user_id], 'SHIFT_SWAP', 'Solicitação de Troca Cancelada', 'A solicitação de troca enviada para você foi cancelada pelo remetente.');
    }
};

/**
 * TRADES HISTORY
 * Unified history of completed exchanges (Swaps and Giveaways)
 */
export const getTradeHistory = async (userId: string): Promise<any[]> => {
    // 1. Fetch Accepted Swaps (ShiftExchangeRequest)
    // Involved as requester or target
    const { data: swaps, error: swapsError } = await supabase
        .from('shift_exchange_requests')
        .select(`
            *,
            requesting_user:profiles!requesting_user_id(*),
            target_user:profiles!target_user_id(*),
            offered_shift:shifts!offered_shift_id(
                 *,
                 group:groups(name, institution)
            ),
            accepted_shift:shifts!accepted_shift_id(
                 *,
                 group:groups(name, institution)
            )
        `)
        .eq('status', 'ACCEPTED')
        .or(`requesting_user_id.eq.${userId},target_user_id.eq.${userId}`);

    if (swapsError) throw swapsError;

    // 2. Fetch Accepted Giveaways (ShiftExchange)
    // Involved as requester (giver) or target (receiver)
    const { data: giveaways, error: giveawaysError } = await supabase
        .from('shift_exchanges')
        .select(`
            *,
            requesting_profile:profiles!requesting_profile_id(*),
            target_profile:profiles!target_profile_id(*),
            offered_shift:shift_assignments!offered_shift_assignment_id(
                id,
                shift:shifts(
                    *,
                    group:groups(name, institution)
                )
            )
        `)
        .eq('status', TradeStatus.ACCEPTED)
        .or(`requesting_profile_id.eq.${userId},target_profile_id.eq.${userId}`);

    if (giveawaysError) throw giveawaysError;

    // Normalize and Combine
    const normalizedSwaps = (swaps || []).map(s => ({
        id: s.id,
        type: 'SWAP',
        date: s.updated_at || s.created_at,
        status: s.status,
        // Context
        isRequester: s.requesting_user_id === userId,
        counterparty: s.requesting_user_id === userId ? s.target_user : s.requesting_user,
        // Details
        givenShift: s.requesting_user_id === userId ? s.offered_shift : s.accepted_shift,
        receivedShift: s.requesting_user_id === userId ? s.accepted_shift : s.offered_shift,
        serviceName: s.offered_shift?.group?.name
    }));

    const normalizedGiveaways = (giveaways || []).map(g => {
        const isGiver = g.requesting_profile_id === userId;
        return {
            id: g.id,
            type: isGiver ? 'GIVEN' : 'TAKEN', // Repassado vs Pego
            date: g.updated_at || g.created_at,
            status: g.status,
            // Context
            isRequester: isGiver,
            counterparty: isGiver ? g.target_profile : g.requesting_profile,
            // Details
            givenShift: isGiver ? g.offered_shift?.shift : null,
            receivedShift: !isGiver ? g.offered_shift?.shift : null,
            serviceName: g.offered_shift?.shift?.group?.name
        };
    });

    // Merge and Sort by Date Descending
    const history = [...normalizedSwaps, ...normalizedGiveaways].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return history;
};

// --- REPLICATE SCHEDULE ---

export interface ReplicateScheduleOptions {
    includeAssignments: boolean;
    adjustDates: boolean;
}

export const replicateScheduleToMonth = async (
    groupId: string,
    sourceMonth: Date,
    targetMonth: Date,
    options: ReplicateScheduleOptions
): Promise<void> => {
    const { includeAssignments, adjustDates } = options;

    // 1. Get source month boundaries
    const sourceYear = sourceMonth.getFullYear();
    const sourceMonthIndex = sourceMonth.getMonth();
    const sourceStartDate = `${sourceYear}-${String(sourceMonthIndex + 1).padStart(2, '0')}-01`;
    const sourceDaysInMonth = new Date(sourceYear, sourceMonthIndex + 1, 0).getDate();
    const sourceEndDate = `${sourceYear}-${String(sourceMonthIndex + 1).padStart(2, '0')}-${String(sourceDaysInMonth).padStart(2, '0')}`;

    // 2. Get target month boundaries
    const targetYear = targetMonth.getFullYear();
    const targetMonthIndex = targetMonth.getMonth();
    const targetDaysInMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();

    // 3. Fetch source shifts with assignments
    const { data: sourceShifts, error: fetchError } = await supabase
        .from('shifts')
        .select(`
      *,
      shift_assignments(*)
    `)
        .eq('group_id', groupId)
        .gte('date', sourceStartDate)
        .lte('date', sourceEndDate);

    if (fetchError) throw fetchError;
    if (!sourceShifts || sourceShifts.length === 0) {
        throw new Error('Nenhum turno encontrado no mês de origem.');
    }

    // 4. Delete existing shifts in target month (only non-published, no assignments)
    const targetStartDate = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-01`;
    const targetEndDate = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(targetDaysInMonth).padStart(2, '0')}`;

    const { data: existingTargetShifts } = await supabase
        .from('shifts')
        .select('id, is_published, shift_assignments(id)')
        .eq('group_id', groupId)
        .gte('date', targetStartDate)
        .lte('date', targetEndDate);

    // Only delete shifts without assignments and not published
    const shiftsToDelete = (existingTargetShifts || [])
        .filter((s: any) => !s.is_published && (!s.shift_assignments || s.shift_assignments.length === 0))
        .map((s: any) => s.id);

    if (shiftsToDelete.length > 0) {
        await supabase.from('shifts').delete().in('id', shiftsToDelete);
    }

    // 5. Create new shifts in target month
    const shiftsToCreate: any[] = [];
    const assignmentsToCreate: any[] = [];

    for (const sourceShift of sourceShifts) {
        const sourceDate = new Date(sourceShift.date + 'T00:00:00');
        const sourceDayOfMonth = sourceDate.getDate();
        const sourceDayOfWeek = sourceDate.getDay();

        let targetDayOfMonth: number;

        if (adjustDates) {
            // Find closest day in target month with same weekday
            // Start from first occurrence of that weekday
            const firstDayOfTargetMonth = new Date(targetYear, targetMonthIndex, 1);
            const firstWeekdayOffset = (sourceDayOfWeek - firstDayOfTargetMonth.getDay() + 7) % 7;
            const weekNumber = Math.floor((sourceDayOfMonth - 1) / 7);
            targetDayOfMonth = 1 + firstWeekdayOffset + (weekNumber * 7);

            // Ensure it's within the month
            if (targetDayOfMonth > targetDaysInMonth) {
                targetDayOfMonth = targetDayOfMonth - 7; // Go to previous week
            }
        } else {
            // Keep same day of month
            targetDayOfMonth = Math.min(sourceDayOfMonth, targetDaysInMonth);
        }

        const targetDateStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(targetDayOfMonth).padStart(2, '0')}`;

        // Create shift object
        const newShift = {
            group_id: groupId,
            date: targetDateStr,
            code: sourceShift.code,
            start_time: sourceShift.start_time,
            end_time: sourceShift.end_time,
            quantity_needed: sourceShift.quantity_needed,
            is_published: false,
            is_individual: sourceShift.is_individual
        };

        shiftsToCreate.push({
            shift: newShift,
            sourceAssignments: includeAssignments ? sourceShift.shift_assignments : []
        });
    }

    // Insert shifts and get their IDs
    const { data: createdShifts, error: createError } = await supabase
        .from('shifts')
        .insert(shiftsToCreate.map(s => s.shift))
        .select();

    if (createError) throw createError;

    // 6. Create assignments if option enabled
    if (includeAssignments && createdShifts && createdShifts.length > 0) {
        for (let i = 0; i < createdShifts.length; i++) {
            const newShiftId = createdShifts[i].id;
            const sourceAssignments = shiftsToCreate[i].sourceAssignments || [];

            for (const assignment of sourceAssignments) {
                assignmentsToCreate.push({
                    shift_id: newShiftId,
                    profile_id: assignment.profile_id,
                    is_confirmed: false // Reset confirmation for new month
                });
            }
        }

        if (assignmentsToCreate.length > 0) {
            const { error: assignError } = await supabase
                .from('shift_assignments')
                .insert(assignmentsToCreate);

            if (assignError) throw assignError;
        }
    }
};



// Get all shift assignments for specific users across ALL groups
// Used for conflict detection between different services
export const getAllUserAssignmentsAcrossGroups = async (profileIds: string[]): Promise<any[]> => {
    if (profileIds.length === 0) return [];

    const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
            id,
            profile_id,
            shift_id,
            is_confirmed,
            shift:shifts!inner (
                id,
                date,
                start_time,
                end_time,
                code,
                group_id,
                group:groups (
                    id,
                    name,
                    institution
                )
            ),
            profile:profiles (
                id,
                full_name
            )
        `)
        .in('profile_id', profileIds);

    if (error) throw error;
    return data || [];
};
