import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export const NativeNotificationService = {

    isNative: () => {
        return Capacitor.isNativePlatform();
    },

    requestPermissions: async (): Promise<boolean> => {
        if (!Capacitor.isNativePlatform()) return false;

        try {
            const result = await PushNotifications.requestPermissions();
            if (result.receive === 'granted') {
                // Register with Apple / Firebase
                await PushNotifications.register();
                return true;
            }
        } catch (error) {
            console.error('Error requesting native permissions:', error);
        }
        return false;
    },

    addListener: (eventName: 'registration' | 'registrationError' | 'pushNotificationReceived' | 'pushNotificationActionPerformed', listener: (data: any) => void) => {
        if (!Capacitor.isNativePlatform()) return;

        // Type casting logic to handle specific event listeners if needed
        // @ts-ignore
        PushNotifications.addListener(eventName, listener);
    },

    removeAllListeners: () => {
        if (!Capacitor.isNativePlatform()) return;
        PushNotifications.removeAllListeners();
    }
};
