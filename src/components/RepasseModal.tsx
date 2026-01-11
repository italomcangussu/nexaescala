import React, { useState } from 'react';
import { X, Megaphone, AlertCircle } from 'lucide-react';
import { Shift } from '../types';
import { createShiftOffer } from '../services/api';

interface RepasseModalProps {
    isOpen: boolean;
    onClose: () => void;
    shift: Shift;
    currentUserProfileId: string;
    currentUserRole: string; // Not strictly needed but good for context
}

const RepasseModal: React.FC<RepasseModalProps> = ({ isOpen, onClose, shift, currentUserProfileId }) => {
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await createShiftOffer(shift.id, currentUserProfileId, note);
            alert('Plantão ofertado com sucesso! Os administradores foram notificados.');
            onClose();
        } catch (error: any) {
            console.error('Error offering shift:', error);
            alert('Erro ao ofertar plantão: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Megaphone size={120} />
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <h2 className="text-2xl font-black mb-1">Repassar Plantão</h2>
                    <p className="text-blue-100 text-sm font-medium">Ofereça este plantão para a equipe</p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Shift Info Card */}
                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                        <span className="text-xs uppercase font-bold text-slate-400 mb-1">Data do Plantão</span>
                        <div className="text-xl font-black text-slate-800 dark:text-slate-100">
                            {new Date(shift.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div className="text-sm font-medium text-slate-500 mt-1">
                            {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 flex gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Ao ofertar este plantão, ele ficará disponível para outros colegas. Você continua responsável por ele até que alguém aceite e a troca seja aprovada.
                        </p>
                    </div>

                    {/* Note Input */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Observação (Opcional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ex: Preciso viajar urgente..."
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all min-h-[100px] resize-none text-slate-700 dark:text-slate-200"
                        />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Megaphone size={18} />
                                    Confirmar Oferta
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RepasseModal;
