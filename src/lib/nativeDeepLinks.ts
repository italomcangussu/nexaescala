import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { supabase } from './supabase';

const AUTH_CALLBACK_PREFIX = 'com.nexaescala.app://auth/callback';
const RESET_PASSWORD_PREFIX = 'com.nexaescala.app://reset-password';

let lastHandledUrl: string | undefined;
let lastHandledAt = 0;

async function safeCloseBrowser() {
  try {
    await Browser.close();
  } catch {
    // no-op (already closed / not available)
  }
}

async function handleAuthCallbackUrl(url: string) {
  // Close the in-app browser (iOS SFSafariViewController) as soon as we regain control.
  await safeCloseBrowser();

  // PKCE flow: ...?code=...
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error('Erro ao trocar code por sessão:', error);
      }
      return;
    }

    // Implicit flow: ...#access_token=...&refresh_token=...
    const hash = parsed.hash?.startsWith('#') ? parsed.hash.slice(1) : '';
    if (hash) {
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('Erro ao definir sessão (implicit):', error);
        }
      }
    }
  } catch (e) {
    console.error('Erro ao processar URL de callback OAuth:', e);
  }
}

async function handleOpenUrl(url?: string) {
  if (!url) return;

  // iOS can deliver both `getLaunchUrl()` and `appUrlOpen` for the same link.
  if (url === lastHandledUrl && Date.now() - lastHandledAt < 5000) return;
  lastHandledUrl = url;
  lastHandledAt = Date.now();

  if (url.startsWith(AUTH_CALLBACK_PREFIX)) {
    await handleAuthCallbackUrl(url);
    return;
  }

  if (url.startsWith(RESET_PASSWORD_PREFIX)) {
    await safeCloseBrowser();
    // Optional: wire this to a real route/page when you implement reset-password in the app.
    console.info('Deep link reset-password recebido:', url);
  }
}

export async function initNativeDeepLinks() {
  if (!Capacitor.isNativePlatform()) return;

  // Avoid double-registration on HMR/dev reloads.
  const w = window as unknown as { __nexa_native_deeplinks_inited?: boolean };
  if (w.__nexa_native_deeplinks_inited) return;
  w.__nexa_native_deeplinks_inited = true;

  // Cold start: if iOS launches the app from the deep link, `appUrlOpen` may not fire.
  try {
    const launch = await App.getLaunchUrl();
    await handleOpenUrl(launch?.url ?? undefined);
  } catch (e) {
    console.warn('Falha ao ler launch URL do Capacitor:', e);
  }

  // Warm/backgrounded: regular deep link event.
  void App.addListener('appUrlOpen', ({ url }) => {
    void handleOpenUrl(url);
  });
}
