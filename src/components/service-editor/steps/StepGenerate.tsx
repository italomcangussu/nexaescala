import React from 'react';
import { Calendar, Users, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { ShiftPreset } from '../../../types';

interface MonthOption {
    year: number;
    month: number; // 0-indexed
    label: string;
    selected: boolean;
}

interface StepGenerateProps {
    presets: ShiftPreset[];
    selectedMonths: MonthOption[];
    quantityPerShift: number;
    onToggleMonth: (year: number, month: number) => void;
    onQuantityChange: (quantity: number) => void;
}

const StepGenerate: React.FC<StepGenerateProps> = ({
    presets,
    selectedMonths,
    quantityPerShift,
    onToggleMonth,
    onQuantityChange,
}) => {
    // Calculate preview
    const selectedCount = selectedMonths.filter(m => m.selected).length;
    const daysPerMonth = 30; // Approximate
    const totalShifts = selectedCount * daysPerMonth * presets.length;
    const totalSlots = totalShifts * quantityPerShift;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header Info */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5 border border-primary/20">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <Zap size={24} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1">Gerar Escala Inicial</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Selecione os meses para pré-popular o calendário com seus turnos.
                            Você poderá editar tudo depois no Editor de Escala.
                        </p>
                    </div>
                </div>
            </div>

            {/* Presets Summary */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Turnos Configurados ({presets.length})
                </label>
                <div className="flex flex-wrap gap-2">
                    {presets.map(preset => (
                        <div
                            key={preset.id}
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                        >
                            <span className="font-bold text-primary text-sm">{preset.code}</span>
                            <span className="text-xs text-slate-400">{preset.start_time} - {preset.end_time}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quantity Setting */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Plantonistas por Turno
                </label>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <button
                            type="button"
                            onClick={() => onQuantityChange(Math.max(1, quantityPerShift - 1))}
                            className="px-4 py-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ChevronDown size={18} />
                        </button>
                        <input
                            type="number"
                            value={quantityPerShift}
                            onChange={e => onQuantityChange(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                            className="w-16 text-center py-3 bg-transparent border-none outline-none font-bold text-lg text-slate-800 dark:text-white"
                            min={1}
                            max={20}
                        />
                        <button
                            type="button"
                            onClick={() => onQuantityChange(Math.min(20, quantityPerShift + 1))}
                            className="px-4 py-3 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ChevronUp size={18} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Users size={16} />
                        <span className="text-sm">por turno</span>
                    </div>
                </div>
            </div>

            {/* Month Selection */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">
                    Meses para Gerar
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedMonths.map(monthOpt => (
                        <button
                            key={`${monthOpt.year}-${monthOpt.month}`}
                            type="button"
                            onClick={() => onToggleMonth(monthOpt.year, monthOpt.month)}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${monthOpt.selected
                                    ? 'bg-primary/10 border-primary text-primary font-bold'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-primary/50'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Calendar size={16} />
                                <span className="text-sm capitalize">{monthOpt.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Preview */}
            {selectedCount > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                Resumo da Geração
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {selectedCount} {selectedCount === 1 ? 'mês' : 'meses'} × ~{daysPerMonth} dias × {presets.length} {presets.length === 1 ? 'turno' : 'turnos'}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{totalShifts.toLocaleString()}</p>
                            <p className="text-xs text-slate-400">{totalSlots.toLocaleString()} vagas</p>
                        </div>
                    </div>
                </div>
            )}

            {selectedCount === 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm text-amber-700 dark:text-amber-400">
                        <span className="font-bold">⚠️ Atenção:</span> Selecione pelo menos 1 mês para gerar a escala inicial.
                        Você pode pular esta etapa e adicionar turnos manualmente depois.
                    </p>
                </div>
            )}
        </div>
    );
};

export default StepGenerate;
