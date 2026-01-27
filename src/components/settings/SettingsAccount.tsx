import React, { useState, useEffect } from 'react';
import { Eye, ChevronRight, ArrowLeft } from 'lucide-react';
import Switch from '../Switch';
import { useAuth } from '../../context/AuthContext';

interface SettingsAccountProps {
    onBack: () => void;
}

const SettingsAccount: React.FC<SettingsAccountProps> = ({ onBack }) => {
    const { profile } = useAuth();

    const [accountForm, setAccountForm] = useState({
        fullName: '',
        crm: '',
        email: '',
        phone: '',
        isProfileVisible: true,
        visibilityScope: 'Serviço e Seguidores'
    });

    useEffect(() => {
        if (profile) {
            setAccountForm(prev => ({
                ...prev,
                fullName: profile.full_name || '',
                crm: profile.crm || '',
                phone: profile.phone || '',
                // Email is usually on user object, but sometimes copied to profile. 
                // Ensuring we have a fallback or we might need to pull user object too if profile doesn't have email.
                email: 'email' in profile ? (profile as any).email : ''
            }));
        }
    }, [profile]);

    const handleAccountChange = (key: keyof typeof accountForm, value: any) => {
        setAccountForm(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="px-6 animate-fade-in-up w-full">
            <div className="flex items-center mb-6 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Dados da Conta</h2>
            </div>

            <div className="space-y-5">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Nome Completo</label>
                        <input
                            value={accountForm.fullName}
                            onChange={(e) => handleAccountChange('fullName', e.target.value)}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary/20 outline-none border border-transparent focus:bg-white dark:focus:bg-slate-600 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">CRM</label>
                        <input
                            value={accountForm.crm}
                            onChange={(e) => handleAccountChange('crm', e.target.value)}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary/20 outline-none border border-transparent focus:bg-white dark:focus:bg-slate-600 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">E-mail</label>
                        <input
                            value={accountForm.email}
                            onChange={(e) => handleAccountChange('email', e.target.value)}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary/20 outline-none border border-transparent focus:bg-white dark:focus:bg-slate-600 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase">Telefone</label>
                        <input
                            value={accountForm.phone}
                            onChange={(e) => handleAccountChange('phone', e.target.value)}
                            className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-primary/20 outline-none border border-transparent focus:bg-white dark:focus:bg-slate-600 transition-all"
                        />
                    </div>
                </div>

                {/* Visibility Toggle Section */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Eye size={18} className="text-primary" />
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Visível no Perfil</span>
                        </div>
                        <Switch
                            isOn={accountForm.isProfileVisible}
                            onToggle={() => handleAccountChange('isProfileVisible', !accountForm.isProfileVisible)}
                        />
                    </div>

                    {/* Conditional Select */}
                    <div className={`overflow-hidden transition-all duration-300 ${accountForm.isProfileVisible ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Quem pode ver meus dados?</label>
                        <div className="relative">
                            <select
                                value={accountForm.visibilityScope}
                                onChange={(e) => handleAccountChange('visibilityScope', e.target.value)}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option>Todos</option>
                                <option>Serviço</option>
                                <option>Serviço e Seguidores</option>
                                <option>Ninguém</option>
                            </select>
                            <ChevronRight className="absolute right-3 top-3 rotate-90 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>

                <button className="w-full bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 hover:bg-primaryDark active:scale-95 transition-all">
                    Salvar Alterações
                </button>
            </div>
        </div>
    );
};

export default SettingsAccount;
