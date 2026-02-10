import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';

export type PickedImage = {
  file: File;
  mimeType: string;
  fileName: string;
  webPath?: string;
};

export async function pickImageNative(): Promise<PickedImage | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const photo = await Camera.getPhoto({
    quality: 85,
    allowEditing: true,
    source: CameraSource.Prompt,
    resultType: CameraResultType.Uri,
  });

  if (!photo.webPath) return null;

  const res = await fetch(photo.webPath);
  const blob = await res.blob();

  const format = (photo.format || 'jpeg').toLowerCase();
  const fileName = `image.${format === 'jpg' ? 'jpeg' : format}`;
  const mimeType = blob.type || (format === 'png' ? 'image/png' : 'image/jpeg');
  const file = new File([blob], fileName, { type: mimeType });

  return { file, mimeType, fileName, webPath: photo.webPath };
}

export async function requestPushNotificationsIfNeeded(): Promise<'granted' | 'denied' | 'prompt' | 'unknown'> {
  if (!Capacitor.isNativePlatform()) return 'unknown';

  try {
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt') {
      perm = await PushNotifications.requestPermissions();
    }

    if (perm.receive === 'granted') {
      await PushNotifications.register();
    }

    return perm.receive as any;
  } catch (e) {
    console.error('Erro ao pedir permissao de notificacoes:', e);
    return 'unknown';
  }
}

