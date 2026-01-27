import React from 'react';
import { Key, User, FileText, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';

interface SettingsPrivacyProps {
    onNavigate: (view: string) => void;
    onBack: () => void;
}

const SettingsPrivacy: React.FC<SettingsPrivacyProps> = ({ onNavigate, onBack }) => {
    return (
        <div className="px-6 animate-fade-in-up w-full">
            <div className="flex items-center mb-6 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Privacidade</h2>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => onNavigate('change_password')}
                    className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Key size={20} /></div>
                        <div className="text-left">
                            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">Alterar Senha</span>
                            <span className="text-[10px] text-slate-400">Segurança da conta</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                </button>

                <button
                    onClick={() => onNavigate('account_edit')}
                    className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><User size={20} /></div>
                        <div className="text-left">
                            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">Conta</span>
                            <span className="text-[10px] text-slate-400">Dados pessoais e visibilidade</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                </button>

                <button
                    onClick={() => onNavigate('privacy_policy')}
                    className="w-full bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-98 transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg"><FileText size={20} /></div>
                        <div className="text-left">
                            <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">Políticas de Privacidade</span>
                            <span className="text-[10px] text-slate-400">Termos de uso e LGPD</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 dark:text-slate-600" />
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                <button
                    onClick={() => onNavigate('delete_account')}
                    className="w-full bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-98 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 text-red-500 rounded-lg shadow-sm"><Trash2 size={20} /></div>
                        <div className="text-left">
                            <span className="block text-sm font-bold text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">Excluir minha conta</span>
                            <span className="text-[10px] text-red-400 dark:text-red-500/70">Ação irreversível</span>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-red-300 dark:text-red-800" />
                </button>
            </div>
        </div>
    );
};

export default SettingsPrivacy;
