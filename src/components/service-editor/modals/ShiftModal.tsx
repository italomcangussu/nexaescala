import React from 'react';
import { Clock } from 'lucide-react';
import { ShiftPreset } from '../../../types';

interface ShiftModalProps {
    isOpen: boolean;
    shift: Partial<ShiftPreset> | null;
    onClose: () => void;
    onUpdate: (field: string, value: string) => void;
    onSave: () => void;
}

const ShiftModal: React.FC<ShiftModalProps> = ({
    isOpen,
    shift,
    onClose,
    onUpdate,
    onSave,
}) => {
    if (!isOpen || !shift) return null;

    const isEditing = shift.id && !shift.id.startsWith('new-') && !shift.id.startsWith('default-');
    const canSave = shift.code && shift.start_time && shift.end_time;

    return (
        <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col items-center justify-center animate-fade-in-up p-6">
            <div className="w-full max-w-sm space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mb-4">
                        <Clock size={32} className="text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                        {isEditing ? 'Editar Turno' : 'Novo Turno'}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Defina a sigla e os horários
                    </p>
                </div>

                {/* Code Input */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                        Sigla (Ex: NTN)
                    </label>
                    <input
                        value={shift.code || ''}
                        onChange={e => onUpdate('code', e.target.value.toUpperCase())}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-center text-2xl tracking-[0.3em] uppercase border-2 border-transparent focus:border-primary outline-none dark:text-white transition-colors"
                        maxLength={4}
                        placeholder="DT"
                    />
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        Use siglas curtas como T, M, MT, SN
                    </p>
                </div>

                {/* Time Inputs */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                            Início
                        </label>
                        <input
                            type="time"
                            value={shift.start_time || ''}
                            onChange={e => onUpdate('start_time', e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center font-semibold dark:text-white border-2 border-transparent focus:border-primary outline-none transition-colors text-lg"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-2">
                            Fim
                        </label>
                        <input
                            type="time"
                            value={shift.end_time || ''}
                            onChange={e => onUpdate('end_time', e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center font-semibold dark:text-white border-2 border-transparent focus:border-primary outline-none transition-colors text-lg"
                        />
                    </div>
                </div>

                {/* Duration Preview */}
                {shift.start_time && shift.end_time && (
                    <div className="flex gap-4">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                            <p className="text-xs text-slate-400 mb-1">Duração</p>
                            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                {calculateDuration(shift.start_time, shift.end_time)}
                            </p>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2 text-center">
                                Plantonistas
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                value={shift.quantity_needed || 2}
                                onChange={e => onUpdate('quantity_needed', e.target.value)}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center font-bold text-xl dark:text-white border-2 border-transparent focus:border-primary outline-none transition-colors"
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={!canSave}
                        className="flex-1 py-3.5 bg-primary text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primaryDark transition-colors"
                    >
                        {isEditing ? 'Salvar' : 'Adicionar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper function to calculate duration
const calculateDuration = (start: string, end: string): string => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);

    let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Handle overnight shifts
    if (totalMinutes <= 0) {
        totalMinutes += 24 * 60;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (minutes === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${minutes}min`;
};

export default ShiftModal;
