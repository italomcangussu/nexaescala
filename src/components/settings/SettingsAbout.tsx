import React from 'react';
import { Info, ArrowLeft, Heart, Shield, Globe } from 'lucide-react';
import Logo from '../Logo';

interface SettingsAboutProps {
    onBack: () => void;
}

const SettingsAbout: React.FC<SettingsAboutProps> = ({ onBack }) => {
    return (
        <div className="px-6 animate-fade-in-up w-full text-center">
            <div className="flex items-center mb-8 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
            </div>

            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mb-4 shadow-xl shadow-primary/5">
                    <Logo className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">NexaEscala</h2>
                <p className="text-sm text-slate-400 font-medium">Versão 1.0.2 (Build 2405)</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 mb-8">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                    "A tecnologia que liberta o médico para focar no que realmente importa: a vida."
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 text-left">
                <div className="flex items-center gap-4 p-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                        <Globe size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-100">Visite nosso site</h4>
                        <p className="text-xs text-slate-400">www.nexaescala.com.br</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                        <Shield size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-100">Legal</h4>
                        <p className="text-xs text-slate-400">Termos e Condições de Uso</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-3">
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                        <Heart size={18} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-100">Feito com carinho</h4>
                        <p className="text-xs text-slate-400">Desenvolvido pela Nexa Labs</p>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-[10px] text-slate-300 dark:text-slate-600">
                © 2026 NexaEscala. Todos os direitos reservados.
            </p>
        </div>
    );
};

export default SettingsAbout;
