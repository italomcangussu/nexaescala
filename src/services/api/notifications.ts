import { supabase } from '../../lib/supabase';
import { Notification, NotificationPreferences } from '../../types';

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

// --- PUSH NOTIFICATION SENDER ---

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
    enabled: true,
    swaps: true,
    newShifts: true,
    groups: true
};

const NOTIFICATION_TYPE_TO_PREF: Record<string, keyof NotificationPreferences> = {
    'SHIFT_SWAP': 'swaps',
    'SHIFT_OFFER': 'swaps',
    'SHIFT_PUBLISHED': 'newShifts',
    'SERVICE_UPDATE': 'groups',
    'SYSTEM': 'enabled',
    'MENTION': 'enabled',
};

export const sendPushToUsers = async (
    userIds: string[],
    notificationType: string,
    title: string,
    body: string,
    url?: string
): Promise<void> => {
    if (userIds.length === 0) return;

    try {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, push_subscription, notification_preferences')
            .in('id', userIds)
            .not('push_subscription', 'is', null);

        if (!profiles || profiles.length === 0) return;

        const prefKey = NOTIFICATION_TYPE_TO_PREF[notificationType] || 'enabled';

        for (const profile of profiles) {
            const prefs = (profile.notification_preferences as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES;

            if (!prefs.enabled) continue;
            if (prefKey !== 'enabled' && !prefs[prefKey]) continue;

            const subscription = profile.push_subscription;
            if (!subscription) continue;

            const parsedSub = JSON.parse(subscription);

            if (parsedSub.endpoint === 'native') {
                await supabase.functions.invoke('send-push-notification', {
                    body: {
                        type: 'native',
                        platform: parsedSub.keys?.p256dh,
                        token: parsedSub.keys?.auth,
                        title,
                        body,
                        data: { url: url || '/' }
                    }
                });
            } else {
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
        console.error('Error sending push notifications:', error);
    }
};
