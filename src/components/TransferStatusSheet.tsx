import React, { useState } from 'react';
import { X, Megaphone, Clock, Calendar, MapPin, Trash2, ArrowRightLeft, Sparkles, AlertCircle } from 'lucide-react';
import { Shift, ShiftExchange, TradeType } from '../types';
import { cancelShiftExchange } from '../services/api';
import { useToast } from '../context/ToastContext';
import Portal from './Portal';

interface TransferStatusSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    shift: Shift;
    pendingExchange: ShiftExchange;
}

const TransferStatusSheet: React.FC<TransferStatusSheetProps> = ({
    isOpen,
    onClose,
    onSuccess,
    shift,
    pendingExchange
}) => {
    const { showToast } = useToast();
    const [isCancelling, setIsCancelling] = useState(false);
    const [showConfirmCancel, setShowConfirmCancel] = useState(false);

    if (!isOpen) return null;

    const dateObj = new Date(shift.date + 'T12:00:00');
    const fullDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            await cancelShiftExchange(pendingExchange.id);
            showToast('Repasse cancelado com sucesso!', 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Erro ao cancelar o repasse', 'error');
        } finally {
            setIsCancelling(false);
        }
    };

    const isDirected = !!pendingExchange.target_profile_id;
    const isSwap = pendingExchange.type === TradeType.DIRECT_SWAP;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in"
                    onClick={onClose}
                />

                {/* Sheet Content */}
                <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-slide-up sm:animate-zoom-in overflow-hidden border-t sm:border border-slate-100 dark:border-slate-800">

                    {/* Visual Header / Indicator */}
                    <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-2 sm:hidden" />

                    {/* Premium Header Container */}
                    <div className="p-8 pb-6">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 ${isSwap ? 'bg-indigo-500 shadow-indigo-100' : 'bg-amber-500 shadow-amber-100 dark:shadow-none'}`}>
                                    {isSwap ? <ArrowRightLeft className="text-white" size={28} /> : <Megaphone className="text-white" size={28} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={16} className={isSwap ? 'text-indigo-500' : 'text-amber-500'} />
                                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                            Status do Repasse
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isSwap ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {isSwap ? 'Troca Direcionada' : (isDirected ? 'Repasse Direcionado' : 'Repasse Público')}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Aguardando</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Shift Card Summary Inline */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                                    <Calendar className="text-primary" size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Plantão</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 capitalize">{fullDate}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                                    <Clock className="text-primary" size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{shift.start_time} - {shift.end_time}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                                    <MapPin className="text-primary" size={20} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{shift.group_name} • {shift.institution_name}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress / Status Message */}
                    <div className="px-8 py-4 bg-primary/5 dark:bg-primary/10 border-y border-primary/10">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-primary shrink-0 mt-0.5" size={18} />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                {isDirected
                                    ? `Aguardando a resposta de ${pendingExchange.target_profile?.full_name || 'um colega'}. Se ele recusar, o plantão voltará para sua escala.`
                                    : "Este plantão está visível no feed do grupo e na aba global de solicitações. O primeiro colega que aceitar ficará com a vaga."
                                }
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 flex flex-col gap-3">
                        {!showConfirmCancel ? (
                            <button
                                onClick={() => setShowConfirmCancel(true)}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95"
                            >
                                <Trash2 size={18} />
                                Cancelar Repasse
                            </button>
                        ) : (
                            <div className="flex gap-3 animate-fade-in">
                                <button
                                    onClick={() => setShowConfirmCancel(false)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-200"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isCancelling}
                                    className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-600 transition-all disabled:opacity-50"
                                >
                                    {isCancelling ? 'Processando...' : 'Confirmar Cancelamento'}
                                </button>
                            </div>
                        )}
                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-tight mt-2">
                            Você pode cancelar a qualquer momento enquanto não houver aceite
                        </p>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default TransferStatusSheet;
