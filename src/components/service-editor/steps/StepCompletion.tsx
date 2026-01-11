import React from 'react';
import { CheckCircle, ChevronRight, Calendar, Home } from 'lucide-react';
import { Group } from '../../../types';

interface StepCompletionProps {
    serviceName: string;
    group: Group | null;
    mode: 'create' | 'edit';
    onNavigateToEditor: () => void;
    onGoHome: () => void;
}

const StepCompletion: React.FC<StepCompletionProps> = ({
    serviceName,
    group: _group, // Reserved for future use
    mode,
    onNavigateToEditor,
    onGoHome,
}) => {
    const isEdit = mode === 'edit';

    return (
        <div className="w-full flex flex-col items-center justify-center p-8 text-center animate-fade-in-up">
            {/* Success Icon */}
            <div className="relative mb-6">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30 animate-bounce-slow z-10 relative">
                    <CheckCircle size={48} strokeWidth={3} />
                </div>
                <div className="absolute inset-0 bg-emerald-500/30 rounded-full animate-ping"></div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                {isEdit ? 'Serviço Atualizado!' : 'Serviço Criado!'}
            </h2>

            {/* Description */}
            <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed max-w-xs mx-auto">
                O serviço <span className="font-bold text-slate-800 dark:text-slate-200">"{serviceName}"</span> foi {isEdit ? 'atualizado' : 'salvo'} com sucesso.
            </p>

            {/* Action Buttons */}
            <div className="w-full space-y-3 max-w-xs">
                <button
                    type="button"
                    onClick={onNavigateToEditor}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-600/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
                >
                    <Calendar size={20} />
                    Ver Mural de Escalas
                    <ChevronRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                    type="button"
                    onClick={onGoHome}
                    className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                    <Home size={18} />
                    Voltar ao Início
                </button>
            </div>

            {/* Confetti-like decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float-1"></div>
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-amber-400 rounded-full animate-float-2"></div>
                <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-purple-400 rounded-full animate-float-3"></div>
                <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-cyan-400 rounded-full animate-float-1"></div>
            </div>
        </div>
    );
};

export default StepCompletion;
