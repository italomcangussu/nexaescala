import React, { useEffect, useState } from 'react';
import { Bell, X, Share, Smartphone } from 'lucide-react';

const NotificationManager: React.FC = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check permission status
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return;
        }

        setPermission(Notification.permission);

        // Platform detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(ios);

        // Standalone detection
        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!isStandaloneMode);

        // Show banner logic: If default permission
        if (Notification.permission === 'default') {
            // Delay to avoid overwhelming strictly on load
            const timer = setTimeout(() => setShowBanner(true), 2500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleRequestPermission = async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted') {
                setShowBanner(false);
                // Here we would typically trigger the subscription to the Push Service
                console.log('Notification permission granted!');
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        // Could save 'dismissed' state to local storage to not show again immediately
    };

    if (!showBanner || permission === 'granted' || permission === 'denied') return null;

    // Custom UI for iOS requiring installation first
    if (isIOS && !isStandalone) {
        return (
            <div className="fixed top-4 left-4 right-4 z-[100] animate-fade-in-down">
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col gap-3">
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

                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs space-y-2">
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

    // Standard Permission Request
    return (
        <div className="fixed top-4 left-4 right-4 z-[100] animate-fade-in-down">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary dark:text-primaryLight rounded-xl">
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
                    className="w-full py-2.5 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primaryDark transition-colors shadow-lg shadow-emerald-200/50 dark:shadow-none"
                >
                    Sim, permitir notificações
                </button>
            </div>
        </div>
    );
};

export default NotificationManager;
