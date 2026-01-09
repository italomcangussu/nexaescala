import React from 'react';
import { Sun, Moon, Smartphone, Clock, Check, ArrowLeft } from 'lucide-react';
import { ThemeOption } from '../../types';

interface SettingsAppearanceProps {
    currentTheme: ThemeOption;
    onThemeChange: (theme: ThemeOption) => void;
    onBack: () => void;
}

const SettingsAppearance: React.FC<SettingsAppearanceProps> = ({ currentTheme, onThemeChange, onBack }) => {
    return (
        <div className="px-6 animate-fade-in-up w-full">
            <div className="flex items-center mb-6 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Aparência</h2>
            </div>

            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-4">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Modo Escuro</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                        Escolha como o aplicativo deve se comportar em relação ao tema do seu dispositivo.
                    </p>

                    <div className="space-y-2">
                        {[
                            { id: 'light', label: 'Desativado (Claro)', icon: Sun },
                            { id: 'dark', label: 'Ativado (Escuro)', icon: Moon },
                            { id: 'system', label: 'Usar tema do dispositivo', icon: Smartphone },
                            { id: 'auto', label: 'Automático (18h às 06h)', icon: Clock },
                        ].map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => onThemeChange(opt.id as ThemeOption)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${currentTheme === opt.id
                                    ? 'bg-primary/5 border-primary text-primary dark:text-primaryLight'
                                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <opt.icon size={18} />
                                    <span className="text-sm font-medium">{opt.label}</span>
                                </div>
                                {currentTheme === opt.id && <Check size={18} />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-[10px] text-slate-400">
                        O modo Automático usa o relógio do seu dispositivo para alternar entre claro e escuro.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsAppearance;
