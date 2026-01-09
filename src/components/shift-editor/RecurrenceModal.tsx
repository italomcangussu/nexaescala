import React from 'react';
import { X, Repeat, Calendar, Check } from 'lucide-react';
import { RecurrenceType } from './useShiftEditor';

interface RecurrenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recurrence: RecurrenceType) => void;
    currentSelection: RecurrenceType;
}

const RecurrenceModal: React.FC<RecurrenceModalProps> = ({ isOpen, onClose, onSave, currentSelection }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Repetição de Escala</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3">
                    {/* Option 1: None (Flexible) */}
                    <button
                        onClick={() => onSave('NONE')}
                        className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${currentSelection === 'NONE'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentSelection === 'NONE' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Calendar size={20} />
                            </div>
                            <div className="text-left">
                                <span className={`font-bold block ${currentSelection === 'NONE' ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>Não Repetir</span>
                                <span className="text-xs text-slate-500">Plantonista Flexível</span>
                            </div>
                        </div>
                        {currentSelection === 'NONE' && <Check size={20} />}
                    </button>

                    {/* Option 2: Weekly (Effective) */}
                    <button
                        onClick={() => onSave('WEEKLY')}
                        className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${currentSelection === 'WEEKLY'
                                ? 'border-blue-500 bg-blue-500/5 text-blue-600'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentSelection === 'WEEKLY' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Repeat size={20} />
                            </div>
                            <div className="text-left">
                                <span className={`font-bold block ${currentSelection === 'WEEKLY' ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>Toda Semana</span>
                                <span className="text-xs text-slate-500">Plantonista Efetivo</span>
                            </div>
                        </div>
                        {currentSelection === 'WEEKLY' && <Check size={20} />}
                    </button>

                    {/* Option 3: Bi-Weekly (Effective) */}
                    <button
                        onClick={() => onSave('BIWEEKLY')}
                        className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${currentSelection === 'BIWEEKLY'
                                ? 'border-purple-500 bg-purple-500/5 text-purple-600'
                                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentSelection === 'BIWEEKLY' ? 'bg-purple-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                <Repeat size={20} />
                            </div>
                            <div className="text-left">
                                <span className={`font-bold block ${currentSelection === 'BIWEEKLY' ? 'text-purple-600' : 'text-slate-700 dark:text-slate-300'}`}>Quinzenalmente (15 dias)</span>
                                <span className="text-xs text-slate-500">Plantonista Efetivo</span>
                            </div>
                        </div>
                        {currentSelection === 'BIWEEKLY' && <Check size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecurrenceModal;
