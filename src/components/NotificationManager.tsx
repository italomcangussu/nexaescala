import React, { useEffect, useState } from 'react';
import { Bell, X, Share, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updatePushSubscription } from '../services/api';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useNavigate } from 'react-router-dom';

const NotificationManager: React.FC = () => {
    const [permission, setPermission] = useState<any>('default');
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const { profile: currentUser } = useAuth();
    const navigate = useNavigate();

    const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

    useEffect(() => {
        // Platform detection and base logic...
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!isStandaloneMode);

        const setupNotifications = async () => {
            if (Capacitor.isNativePlatform()) {
                // --- NATIVE (CAPACITOR) LOGIC ---

                // Check current status
                const permStatus = await PushNotifications.checkPermissions();
                setPermission(permStatus.receive);

                if (permStatus.receive === 'granted') {
                    PushNotifications.register();
                } else if (permStatus.receive === 'prompt') {
                    // Apple HIG: Don't ask for notification permission on first app session.
                    // Let the user experience the app's value first.
                    const sessionKey = 'nexa_app_session_count';
                    const count = parseInt(localStorage.getItem(sessionKey) || '0', 10) + 1;
                    localStorage.setItem(sessionKey, String(count));

                    if (count < 2) return; // Skip first session

                    const timer = setTimeout(() => setShowBanner(true), 3000);
                    return () => clearTimeout(timer);
                }

                // Add Listeners
                await PushNotifications.removeAllListeners();

                PushNotifications.addListener('registration', async (token) => {
                    console.log('Push registration success, token: ' + token.value);
                    if (currentUser) {
                        // Create a hybrid subscription object to store the native token
                        // We map 'p256dh' to platform and 'auth' to token for retrieval on backend
                        const nativeSub = {
                            endpoint: 'native',
                            expirationTime: null,
                            keys: {
                                p256dh: Capacitor.getPlatform(), // 'ios' or 'android'
                                auth: token.value
                            }
                        } as any; // Cast to any to satisfy PushSubscription type signature

                        await updatePushSubscription(currentUser.id, nativeSub);
                    }
                });

                PushNotifications.addListener('registrationError', (error) => {
                    console.error('Error on registration: ' + JSON.stringify(error));
                });

                PushNotifications.addListener('pushNotificationReceived', (notification) => {
                    console.log('Push received: ', notification);
                    // Optionally trigger a local toast/refresh here
                });

                PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                    console.log('Push action performed:', notification.notification.data);
                    const data = notification.notification.data;

                    // Handle Navigation
                    if (data?.url) {
                        navigate(data.url);
                    } else if (data?.group_id) {
                        // Example: Navigate to specific group if ID is present
                        // You might need a more complex routing logic here
                    }
                });

            } else {
                // --- WEB (PWA) LOGIC ---
                if ('Notification' in window) {
                    setPermission(Notification.permission);
                    if (Notification.permission === 'default') {
                        // Same deferred approach for web
                        const sessionKey = 'nexa_app_session_count';
                        const count = parseInt(localStorage.getItem(sessionKey) || '0', 10) + 1;
                        localStorage.setItem(sessionKey, String(count));

                        if (count < 2) return;

                        const timer = setTimeout(() => setShowBanner(true), 3000);
                        return () => clearTimeout(timer);
                    }
                }
            }
        };

        setupNotifications();

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, [currentUser, navigate]);

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const handleRequestPermission = async () => {
        try {
            if (Capacitor.isNativePlatform()) {
                // Native Request
                let permStatus = await PushNotifications.checkPermissions();

                if (permStatus.receive === 'prompt') {
                    permStatus = await PushNotifications.requestPermissions();
                }

                if (permStatus.receive === 'granted') {
                    setPermission('granted');
                    setShowBanner(false);
                    await PushNotifications.register();
                } else {
                    setPermission('denied');
                }
            } else {
                // Web Request
                const result = await Notification.requestPermission();
                setPermission(result);
                if (result === 'granted') {
                    setShowBanner(false);
                    await subscribeUserToPush();
                }
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
        }
    };

    const subscribeUserToPush = async () => {
        try {
            if (!('serviceWorker' in navigator) || !currentUser) return;

            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('User is subscribed:', subscription);
            await updatePushSubscription(currentUser.id, subscription);
        } catch (error) {
            console.error('Failed to subscribe the user: ', error);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
    };

    // If permission already granted or denied (and not in native prompt state), hide banner
    // Note: For Native, 'prompt' means we should ask. 'granted' means we are good.
    const isGranted = permission === 'granted';
    const isDenied = permission === 'denied';

    if (!showBanner || isGranted || isDenied) return null;

    // Custom UI for iOS PWA requiring installation first (only relevant for Web)
    if (!Capacitor.isNativePlatform() && isIOS && !isStandalone) {
        return (
            <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in-down">
                <div className="bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Smartphone size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Instale o App</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-1">
                                    Para receber notificações no iPhone, adicione este app à Tela de Início.
                                </p>
                            </div>
                        </div>
                        <button onClick={handleDismiss} className="text-slate-400 p-1"><X size={16} /></button>
                    </div>

                    <div className="bg-surface dark:bg-slate-800 p-3 rounded-xl text-xs space-y-2">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span className="font-bold">1.</span> Toque no botão Compartilhar <Share size={14} className="inline ml-1" />
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <span className="font-bold">2.</span> Selecione "Adicionar à Tela de Início"
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Standard Permission Request Banner
    return (
        <div className="fixed top-4 left-4 right-4 z-50 animate-fade-in-down">
            <div className="bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary dark:text-primary-light rounded-xl">
                            <Bell size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">Ativar Notificações?</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-1">
                                Receba alertas sobre seus plantões e trocas de escala.
                            </p>
                        </div>
                    </div>
                    <button onClick={handleDismiss} className="text-slate-400 p-1"><X size={16} /></button>
                </div>

                <button
                    onClick={handleRequestPermission}
                    className="w-full py-4 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-primary-dark transition-all active:scale-[0.98] shadow-lg shadow-emerald-200/50 dark:shadow-none"
                >
                    Ativar Notificações
                </button>
            </div>
        </div>
    );
};

export default NotificationManager;
