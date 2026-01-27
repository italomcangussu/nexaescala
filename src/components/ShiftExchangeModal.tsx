import React, { useState } from 'react';
import { X, ArrowRightLeft, Gift, Calendar, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { ShiftAssignment, Shift, TradeType } from '../types';
import { createShiftExchange } from '../services/api';
import { useToast } from '../context/ToastContext';
import Portal from './Portal';

interface ShiftExchangeModalProps {
    assignment: ShiftAssignment & { shift: Shift };
    groupId: string;
    currentUserId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ShiftExchangeModal: React.FC<ShiftExchangeModalProps> = ({ assignment, groupId, currentUserId, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'SELECT_TYPE' | 'SELECT_USER' | 'CONFIRM'>('SELECT_TYPE');
    const [actionType, setActionType] = useState<TradeType>(TradeType.DIRECT_SWAP);
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    const shift = assignment.shift;
    const dateObj = new Date(shift.date + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

    const handleSelectType = (type: TradeType) => {
        setActionType(type);
        setMode('CONFIRM');
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await createShiftExchange({
                group_id: groupId,
                type: actionType,
                status: 'PENDING',
                requesting_profile_id: currentUserId,
                target_profile_id: null,
                offered_shift_assignment_id: assignment.id,
            } as any);
            showToast(actionType === TradeType.DIRECT_SWAP ? 'Solicitação de troca enviada!' : 'Plantão disponibilizado para doação!', 'success');
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            showToast('Erro ao criar solicitação.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Portal>
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

                <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-md w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in-up border border-white/20 dark:border-slate-800/50 pb-safe">
                    {/* Mobile Pull Handle */}
                    <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-2" />

                    {/* Decoration */}
                    <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${actionType === TradeType.DIRECT_SWAP || mode === 'SELECT_TYPE' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
                    <div className={`absolute -left-20 -bottom-20 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none ${actionType === TradeType.DIRECT_SWAP || mode === 'SELECT_TYPE' ? 'bg-indigo-500' : 'bg-teal-500'}`} />

                    <div className="relative p-6 sm:p-8">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-6 sm:mb-8">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">Gerenciar Plantão</h3>
                                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                                    <MapPin size={14} className="text-primary" />
                                    {shift.group_name || 'Serviço'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Shift Info Badge */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-3xl p-4 sm:p-5 mb-6 sm:mb-8 flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 shadow-sm rounded-2xl p-2 sm:p-3 min-w-[60px] sm:min-w-[70px] border border-slate-100 dark:border-slate-700">
                                <span className="text-[9px] sm:text-[10px] font-bold uppercase text-primary tracking-widest leading-none mb-1">{weekday.split('-')[0].substring(0, 3)}</span>
                                <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-none">{dateObj.getDate()}</span>
                            </div>
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm sm:text-base">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span>{formattedDate}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
                                    <Clock size={14} className="text-slate-400" />
                                    <span>{shift.start_time} - {shift.end_time}</span>
                                </div>
                            </div>
                        </div>

                        {mode === 'SELECT_TYPE' && (
                            <div className="space-y-3 sm:space-y-4">
                                <button
                                    onClick={() => handleSelectType(TradeType.DIRECT_SWAP)}
                                    className="group relative w-full p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-blue-100 bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/30 dark:hover:bg-blue-900/20 flex items-center gap-4 sm:gap-5 transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02] text-left overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <ArrowRightLeft size={60} className="sm:w-[80px] sm:h-[80px]" />
                                    </div>
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform">
                                        <ArrowRightLeft size={24} className="sm:w-[28px] sm:h-[28px]" />
                                    </div>
                                    <div>
                                        <span className="block font-black text-blue-800 dark:text-blue-400 text-base sm:text-lg leading-tight mb-0.5 sm:mb-1">Troca Direta</span>
                                        <p className="text-blue-600/70 dark:text-blue-400/60 text-[10px] sm:text-xs font-medium leading-relaxed">Troque com outro colega</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => handleSelectType(TradeType.GIVEAWAY)}
                                    className="group relative w-full p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 border-emerald-100 bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-900/10 dark:border-emerald-900/30 dark:hover:bg-emerald-900/20 flex items-center gap-4 sm:gap-5 transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02] text-left overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Gift size={60} className="sm:w-[80px] sm:h-[80px]" />
                                    </div>
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform">
                                        <Gift size={24} className="sm:w-[28px] sm:h-[28px]" />
                                    </div>
                                    <div>
                                        <span className="block font-black text-emerald-800 dark:text-emerald-400 text-base sm:text-lg leading-tight mb-0.5 sm:mb-1">Doar Plantão</span>
                                        <p className="text-emerald-600/70 dark:text-emerald-400/60 text-[10px] sm:text-xs font-medium leading-relaxed">Deixe aberto para o grupo</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {mode === 'CONFIRM' && (
                            <div className="animate-fade-in-up">
                                <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center text-white mb-4 sm:mb-6 shadow-2xl relative ${actionType === TradeType.DIRECT_SWAP ? 'bg-blue-500 shadow-blue-500/40' : 'bg-emerald-500 shadow-emerald-500/40'}`}>
                                        {actionType === TradeType.DIRECT_SWAP ? <ArrowRightLeft size={30} className="sm:w-[36px] sm:h-[36px]" /> : <Gift size={30} className="sm:w-[36px] sm:h-[36px]" />}
                                        <Sparkles size={14} className="absolute -top-1 -right-1 text-amber-400 animate-pulse" />
                                    </div>

                                    <h3 className="font-black text-xl sm:text-2xl text-slate-800 dark:text-white mb-2 sm:mb-3">Confirmar Solicitação</h3>
                                    <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-3 rounded-2xl flex items-start gap-2 max-w-[280px] sm:max-w-xs mx-auto">
                                        <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
                                        <p className="text-slate-600 dark:text-slate-400 text-[10px] sm:text-xs text-left leading-relaxed">
                                            Ao confirmar, uma mensagem será enviada ao grupo notificando sobre a <strong className="text-slate-900 dark:text-slate-200">{actionType === TradeType.DIRECT_SWAP ? 'troca' : 'doação'}</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 sm:gap-4 mb-2">
                                    <button
                                        onClick={() => setMode('SELECT_TYPE')}
                                        disabled={isLoading}
                                        className="flex-1 py-3 sm:py-4 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all active:scale-95 disabled:opacity-50 text-sm sm:text-base"
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={isLoading}
                                        className={`flex-1 py-3 sm:py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 group relative overflow-hidden text-sm sm:text-base ${actionType === TradeType.DIRECT_SWAP ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30'}`}
                                    >
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                        {isLoading ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Confirmar
                                                <ArrowRightLeft size={18} className="group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </Portal>
    );
};

export default ShiftExchangeModal;
