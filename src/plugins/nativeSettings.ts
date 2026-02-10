import { Capacitor, registerPlugin } from '@capacitor/core';

export interface NativeSettingsPlugin {
  openAppSettings(): Promise<void>;
}

const NativeSettings = registerPlugin<NativeSettingsPlugin>('NativeSettings', {
  web: {
    openAppSettings: async () => {
      // No-op on web.
    },
  },
});

export async function openAppSettings(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await NativeSettings.openAppSettings();
  } catch (e) {
    console.warn('Failed to open app settings:', e);
  }
}

