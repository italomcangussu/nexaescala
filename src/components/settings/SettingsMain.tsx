import React from 'react';
import { Settings, Lock, Bell, Moon, HelpCircle, Info, ChevronRight, LogOut } from 'lucide-react';
import Logo from '../Logo';

interface SettingsMainProps {
    onNavigate: (view: string) => void;
    onSignOut: () => void;
}

const SettingsMain: React.FC<SettingsMainProps> = ({ onNavigate, onSignOut }) => {
    const menuItems = [
        { icon: Settings, label: 'Configurações', sub: 'Geral', view: 'main' }, // view 'main' is circular but here for structure if needed
        { icon: Lock, label: 'Privacidade', sub: 'Senhas e dados', view: 'privacy' },
        { icon: Bell, label: 'Notificações', sub: 'Sons e alertas', view: 'notifications' },
        { icon: Moon, label: 'Aparência', sub: 'Tema claro/escuro', view: 'appearance' },
        { icon: HelpCircle, label: 'Ajuda', sub: 'FAQ e Suporte', view: 'help' }, // Placeholder view
        { icon: Info, label: 'Sobre', sub: 'Versão 1.0.2', view: 'about' }, // Placeholder view
    ];

    return (
        <div className="px-6 flex flex-col items-center animate-fade-in-up">
            <div className="transform transition-all duration-700 delay-100 scale-100 translate-y-0">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-900 blur-xl opacity-50 rounded-full animate-pulse-slow"></div>
                    <Logo className="w-20 h-20 drop-shadow-lg relative z-10 dark:text-emerald-400" />
                </div>
            </div>

            <h2 className="mt-4 text-xl font-bold text-primaryDark dark:text-emerald-100 transition-all duration-500 delay-200">
                NexaEscala
            </h2>
            <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mb-8 transition-all duration-500 delay-300">
                Menu Principal
            </p>

            <div className="w-full space-y-2">
                {menuItems.map((item, index) => (
                    <div
                        key={item.label}
                        onClick={() => item.view !== 'main' && onNavigate(item.view)}
                        className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all duration-300 cursor-pointer group border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                        style={{ transitionDelay: `${400 + (index * 50)}ms` }}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center group-hover:bg-primary/10 dark:group-hover:bg-primary/20 group-hover:text-primary dark:group-hover:text-primaryLight transition-colors shadow-sm">
                                <item.icon size={20} strokeWidth={2} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{item.label}</h3>
                                <p className="text-[10px] text-slate-400 font-medium">{item.sub}</p>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-primary dark:group-hover:text-primaryLight transition-colors" />
                    </div>
                ))}
            </div>

            <div className="w-full mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 transition-all duration-500 delay-700">
                <button
                    onClick={onSignOut}
                    className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-error font-bold hover:bg-red-100 dark:hover:bg-red-900/40 active:scale-95 transition-all">
                    <LogOut size={18} />
                    <span>Sair da conta</span>
                </button>
                <p className="text-center text-[10px] text-slate-300 dark:text-slate-600 mt-4">Versão 1.0.2 (Build 2405)</p>
            </div>
        </div>
    );
};

export default SettingsMain;
