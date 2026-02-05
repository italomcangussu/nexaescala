import { supabase } from '../../lib/supabase';
import { Profile, AppLog } from '../../types';

// --- ADMIN API ---

export const getAdminStats = async (): Promise<{ totalUsers: number, activeUsers24h: number, totalGroups: number }> => {
    const { count: totalUsers, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    const { count: totalGroups, error: groupsError } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true });

    if (usersError) console.warn('Error fetching total users:', usersError);
    if (groupsError) console.warn('Error fetching total groups:', groupsError);

    return {
        totalUsers: totalUsers || 0,
        activeUsers24h: 0,
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
};

export const createAppLog = async (
    level: 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, unknown>
): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
    const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
    });

    if (error) {
        throw new Error(error.message || 'Falha ao deletar conta');
    }

    await supabase.auth.signOut();
};
