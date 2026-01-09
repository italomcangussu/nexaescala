import React, { useState } from 'react';
import { Shift, ShiftAssignment } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar } from 'lucide-react';

interface OfferShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (shift: Shift) => void;
    shifts: Shift[];
    assignments: ShiftAssignment[];
    currentUserId: string;
}

const OfferShiftModal: React.FC<OfferShiftModalProps> = ({ isOpen, onClose, onConfirm, shifts = [], assignments = [], currentUserId }) => {
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

    if (!isOpen) return null;

    // Filter shifts assigned to current user in the future
    const myShifts = (shifts || []).filter(s => {
        const isAssigned = (assignments || []).some(a => a.shift_id === s.id && a.profile_id === currentUserId);
        const isFuture = s.date ? new Date(s.date) >= new Date() : false;
        return isAssigned && isFuture;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl z-10 overflow-hidden animate-fade-in-up">

                <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Oferecer Plantão</h3>
                    <button onClick={onClose}>
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-sm text-slate-500 mb-4">Selecione um plantão para oferecer ao grupo:</p>

                    {myShifts.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            Você não tem plantões futuros neste serviço.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {myShifts.map(shift => (
                                <div
                                    key={shift.id}
                                    onClick={() => setSelectedShift(shift)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3
                                ${selectedShift?.id === shift.id
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500'
                                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-col leading-none">
                                        <span className="text-[10px]">
                                            {(() => {
                                                try { return format(new Date(shift.date), 'MMM', { locale: ptBR }).toUpperCase(); }
                                                catch { return '---'; }
                                            })()}
                                        </span>
                                        <span className="text-sm">
                                            {(() => {
                                                try { return format(new Date(shift.date), 'dd'); }
                                                catch { return '--'; }
                                            })()}
                                        </span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                            {(() => {
                                                try { return format(new Date(shift.date), 'EEEE', { locale: ptBR }); }
                                                catch { return 'Data inválida'; }
                                            })()}
                                        </h4>
                                        <p className="text-xs text-slate-500">{shift.start_time} - {shift.end_time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                    <button
                        disabled={!selectedShift}
                        onClick={() => selectedShift && onConfirm(selectedShift)}
                        className="w-full bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-600 transition-colors"
                    >
                        Confirmar Oferta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfferShiftModal;
