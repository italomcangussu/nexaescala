import React, { useState, useEffect, useRef } from 'react';
import { Bell, ArrowLeft, Loader } from 'lucide-react';
import Switch from '../Switch';
import { useAuth } from '../../context/AuthContext';
import { getNotificationPreferences, updateNotificationPreferences } from '../../services/api';
import { NotificationPreferences } from '../../types';

interface SettingsNotificationsProps {
    onBack: () => void;
}

const SettingsNotifications: React.FC<SettingsNotificationsProps> = ({ onBack }) => {
    const { profile: currentUser } = useAuth();
    const [notifSettings, setNotifSettings] = useState<NotificationPreferences>({
        enabled: true,
        swaps: true,
        newShifts: true,
        groups: true
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load preferences from database
    useEffect(() => {
        if (!currentUser) return;
        const load = async () => {
            try {
                const prefs = await getNotificationPreferences(currentUser.id);
                setNotifSettings(prefs);
            } catch (error) {
                console.error('Error loading notification preferences:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentUser]);

    // Save preferences with debounce
    const persistPreferences = (newSettings: NotificationPreferences) => {
        if (!currentUser) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setSaving(true);
            try {
                await updateNotificationPreferences(currentUser.id, newSettings);
            } catch (error) {
                console.error('Error saving notification preferences:', error);
            } finally {
                setSaving(false);
            }
        }, 500);
    };

    const toggleSwitch = (key: keyof NotificationPreferences) => {
        const newSettings = { ...notifSettings, [key]: !notifSettings[key] };
        setNotifSettings(newSettings);
        persistPreferences(newSettings);
    };

    if (loading) {
        return (
            <div className="px-6 animate-fade-in-up w-full">
                <div className="flex items-center mb-6 relative px-1">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Notificações</h2>
                </div>
                <div className="flex justify-center py-12">
                    <Loader className="animate-spin text-primary" size={24} />
                </div>
            </div>
        );
    }

    return (
        <div className="px-6 animate-fade-in-up w-full">
            <div className="flex items-center mb-6 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Notificações</h2>
                {saving && <Loader className="animate-spin text-primary ml-auto" size={16} />}
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Bell size={16} />
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-100">Ativar Notificações</span>
                        </div>
                        <Switch isOn={notifSettings.enabled} onToggle={() => toggleSwitch('enabled')} />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-11">
                        Receba alertas importantes sobre suas escalas e atividades dos serviços.
                    </p>
                </div>

                <div className={`space-y-4 transition-all duration-300 ${notifSettings.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">Preferências de Alerta</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface dark:hover:bg-slate-800 transition-colors">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Trocas e Repasses</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Alertas de solicitações de colegas.</p>
                            </div>
                            <Switch isOn={notifSettings.swaps} onToggle={() => toggleSwitch('swaps')} />
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 mx-3"></div>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface dark:hover:bg-slate-800 transition-colors">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Novos Plantões</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Quando novas escalas forem publicadas.</p>
                            </div>
                            <Switch isOn={notifSettings.newShifts} onToggle={() => toggleSwitch('newShifts')} />
                        </div>
                        <div className="h-px bg-slate-100 dark:bg-slate-700 mx-3"></div>
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-surface dark:hover:bg-slate-800 transition-colors">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Meus Serviços</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">Atualizações e avisos do gestor.</p>
                            </div>
                            <Switch isOn={notifSettings.groups} onToggle={() => toggleSwitch('groups')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsNotifications;
