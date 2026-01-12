import React from 'react';
import { ArrowRightLeft, Megaphone, Check, X, Clock, Sparkles } from 'lucide-react';
import { ShiftExchange, ShiftExchangeRequest } from '../types';

interface ActionableNotificationCardProps {
    item: ShiftExchange | ShiftExchangeRequest;
    onAccept: (item: any) => void;
    onDecline: (item: any) => void;
    isLoading?: boolean;
}

const ActionableNotificationCard: React.FC<ActionableNotificationCardProps> = ({
    item,
    onAccept,
    onDecline,
    isLoading
}) => {
    // Determine if it's an ExchangeRequest (Swap) or a ShiftExchange (Giveaway)
    const isSwap = 'requested_shift_options' in item;

    const requesterName = isSwap
        ? (item as ShiftExchangeRequest).requesting_user?.full_name
        : (item as ShiftExchange).requesting_profile?.full_name;

    const shiftDate = isSwap
        ? (item as ShiftExchangeRequest).offered_shift?.date
        : (item as ShiftExchange).offered_shift?.shift.date;

    const shiftTime = isSwap
        ? (item as ShiftExchangeRequest).offered_shift?.start_time
        : (item as ShiftExchange).offered_shift?.shift.start_time;

    const groupName = isSwap
        ? 'Troca de Plantão'
        : (item as ShiftExchange).offered_shift?.shift.group_name || 'Repasse de Plantão';

    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
    };

    return (
        <div className="relative overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] p-6 shadow-xl border border-white/40 dark:border-slate-800/50 group animate-fade-in-up mb-4">
            {/* Decorative Background Glow */}
            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700 ${isSwap ? 'bg-indigo-500' : 'bg-sky-500'}`} />

            <div className="flex flex-col gap-5 relative z-10">
                {/* Header Info */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-transform duration-500 ${isSwap ? 'bg-indigo-500 shadow-indigo-200 dark:shadow-none' : 'bg-sky-500 shadow-sky-200 dark:shadow-none'}`}>
                            {isSwap ? <ArrowRightLeft className="text-white" size={24} /> : <Megaphone className="text-white" size={24} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} className={isSwap ? 'text-indigo-500' : 'text-sky-500'} />
                                <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                    {isSwap
                                        ? 'Solicitação de Troca'
                                        : (item as ShiftExchange).target_profile_id
                                            ? 'Repasse Direcionado'
                                            : 'Repasse Global'
                                    }
                                </h4>
                            </div>
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                de <span className="text-slate-900 dark:text-slate-200">{requesterName}</span>
                            </p>
                        </div>
                    </div>

                    {/* Date Badge */}
                    <div className="flex flex-col items-center px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">DATA</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white leading-none">
                            {formatDate(shiftDate)}
                        </span>
                    </div>
                </div>

                {/* Shift Details Content */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/50 dark:border-slate-800/50">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Clock size={16} className="text-slate-400" />
                            <span className="text-xs font-bold">{shiftTime?.slice(0, 5)}</span>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-300 truncate">
                            {groupName}
                        </span>
                    </div>

                    {isSwap && (item as ShiftExchangeRequest).requested_shift_options && (
                        <div className="px-4 py-2 border-l-2 border-indigo-500/30 ml-2">
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Troca por um de seus plantões</p>
                            <div className="flex flex-wrap gap-2">
                                {(item as ShiftExchangeRequest).requested_shift_options.length} opções disponíveis
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                        onClick={() => onDecline(item)}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <X size={16} />
                        Recusar
                    </button>
                    <button
                        onClick={() => onAccept(item)}
                        disabled={isLoading}
                        className={`relative overflow-hidden group/btn flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all duration-300 ${isSwap ? 'bg-indigo-500 hover:bg-indigo-600 shadow-indigo-200 dark:shadow-none' : 'bg-sky-500 hover:bg-sky-600 shadow-sky-200 dark:shadow-none'}`}
                    >
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer" />
                        <Check size={16} />
                        {isLoading ? '...' : 'Aceitar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionableNotificationCard;
