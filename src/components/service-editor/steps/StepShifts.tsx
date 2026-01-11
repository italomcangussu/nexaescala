import React from 'react';
import { Clock, Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { ShiftPreset } from '../../../types';

interface StepShiftsProps {
    shifts: ShiftPreset[];
    errors: Record<string, string>;
    onAdd: () => void;
    onEdit: (shift: ShiftPreset) => void;
    onRemove: (id: string) => void;
}

const StepShifts: React.FC<StepShiftsProps> = ({
    shifts,
    errors,
    onAdd,
    onEdit,
    onRemove,
}) => {
    const hasError = errors.shiftPresets;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">
                        Turnos Cadastrados
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        {shifts.length} turno{shifts.length !== 1 ? 's' : ''} configurado{shifts.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {hasError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <AlertCircle size={16} className="text-red-500" />
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.shiftPresets}</p>
                </div>
            )}

            {/* Shift List */}
            <div className="space-y-3">
                {shifts.map((shift) => (
                    <div
                        key={shift.id}
                        className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow group"
                    >
                        <div className="flex items-center gap-4">
                            {/* Code Badge */}
                            <div
                                className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary dark:text-primaryLight flex items-center justify-center font-bold text-base border border-primary/20 shadow-inner"
                            >
                                {shift.code}
                            </div>

                            {/* Time Info */}
                            <div>
                                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
                                    <Clock size={16} className="text-slate-400" />
                                    <span>{shift.start_time}</span>
                                    <span className="text-slate-300 dark:text-slate-600">→</span>
                                    <span>{shift.end_time}</span>
                                </div>
                                <div className="flex gap-1 mt-1.5">
                                    {[0, 1, 2, 3, 4, 5, 6].map(day => {
                                        const labels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
                                        const isSelected = (shift.days_of_week || [0, 1, 2, 3, 4, 5, 6]).includes(day);
                                        return (
                                            <div
                                                key={day}
                                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${isSelected
                                                    ? 'bg-primary/20 text-primary'
                                                    : 'bg-slate-100 dark:bg-slate-700/50 text-slate-300 dark:text-slate-600'
                                                    }`}
                                            >
                                                {labels[day]}
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Nº de Plantonistas: {shift.quantity_needed || 1}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button
                                type="button"
                                onClick={() => onEdit(shift)}
                                className="p-2.5 text-slate-400 hover:text-primary dark:hover:text-primaryLight hover:bg-primary/5 rounded-lg transition-colors"
                                title="Editar turno"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                type="button"
                                onClick={() => onRemove(shift.id)}
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remover turno"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Button */}
            <button
                type="button"
                onClick={onAdd}
                className="w-full py-4 border-2 border-dashed border-primary/30 text-primary dark:text-primaryLight font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all group"
            >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Adicionar Turno
            </button>

            {/* Tips */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-primary">💡 Dica:</span> Use siglas curtas como "T" (Tarde), "M" (Manhã),
                    "MT", "SN". Os horários podem ultrapassar meia-noite.
                </p>
            </div>
        </div>
    );
};

export default StepShifts;
