import { supabase } from '../../lib/supabase';
import { Profile, NotificationPreferences } from '../../types';
import { sanitizeFilterValue, validateProfileUpdates } from './validation';

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

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
    const validatedUpdates = validateProfileUpdates(updates);
    if (Object.keys(validatedUpdates).length === 0) {
        throw new Error('Nenhum campo válido para atualizar');
    }

    const { data, error } = await supabase
        .from('profiles')
        .update(validatedUpdates)
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
