import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PushNotifications } from '@capacitor/push-notifications';

export type PickedImage = {
  file: File;
  mimeType: string;
  fileName: string;
  webPath?: string;
};

export type NativePhotoSource = 'camera' | 'photos';
export type NativePermissionState = 'granted' | 'limited' | 'denied';

function toPermissionState(raw: string | undefined): NativePermissionState {
  if (raw === 'granted') return 'granted';
  if (raw === 'limited') return 'limited';
  return 'denied';
}

export async function ensurePermission(type: NativePhotoSource): Promise<NativePermissionState> {
  if (!Capacitor.isNativePlatform()) return 'denied';

  try {
    const perm = await Camera.checkPermissions();
    const current = type === 'camera' ? perm.camera : perm.photos;

    if (current === 'prompt') {
      const next = await Camera.requestPermissions({
        permissions: [type],
      });
      const nextState = type === 'camera' ? next.camera : next.photos;
      return toPermissionState(nextState);
    }

    return toPermissionState(current);
  } catch {
    return 'denied';
  }
}

export async function pickImageNative(source: NativePhotoSource): Promise<PickedImage | null> {
  if (!Capacitor.isNativePlatform()) return null;

  const photo = await Camera.getPhoto({
    quality: 85,
    // iOS only supports allowEditing for CameraSource.Camera (not Photos).
    allowEditing: source === 'camera',
    source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
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
