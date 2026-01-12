import React, { useEffect, useState } from 'react';
import { ArrowRightLeft, Megaphone, Calendar, Clock, Users } from 'lucide-react';
import { getServiceExchangeHistory } from '../../services/api';
import { ShiftExchange } from '../../types';

interface ServiceHistoryTabProps {
    groupId: string;
}

const ServiceHistoryTab: React.FC<ServiceHistoryTabProps> = ({ groupId }) => {
    const [history, setHistory] = useState<ShiftExchange[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getServiceExchangeHistory(groupId);
                setHistory(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchHistory();
    }, [groupId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-medium">Carregando histórico...</p>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
                    <Clock size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Sem histórico recente</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                    Nenhuma troca ou repasse foi realizado nos últimos 30 dias.
                </p>
            </div>
        );
    }

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr + 'T12:00:00'); // Normalize timezone
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
    };

    const formatDateTime = (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 px-2">
                Histórico (Últimos 30 dias)
            </h3>

            <div className="grid gap-4">
                {history.map((item) => {
                    const isSwap = item.type === 'DIRECT_SWAP';
                    const isGlobal = !item.target_profile_id;
                    const shiftDate = item.offered_shift?.shift.date;
                    const shiftTime = item.offered_shift?.shift.start_time;

                    return (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col gap-3 relative overflow-hidden"
                        >
                            {/* Decorative Activity Line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isSwap ? 'bg-indigo-500' : 'bg-sky-500'}`} />

                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSwap ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30' : 'bg-sky-100 text-sky-600 dark:bg-sky-900/30'}`}>
                                        {isSwap ? <ArrowRightLeft size={16} /> : <Megaphone size={16} />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                            {isSwap ? 'Troca de Plantão' : isGlobal ? 'Repasse Global' : 'Repasse Direcionado'}
                                        </h4>
                                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                            <Calendar size={10} />
                                            Realizado em {formatDateTime(item.created_at)}
                                        </span>
                                    </div>
                                </div>
                                <div className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-[10px] font-bold uppercase">
                                    Concluído
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />

                            {/* Details */}
                            <div className="flex items-center justify-between gap-4">
                                {/* From */}
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-white dark:border-slate-700 shadow-sm">
                                        <img
                                            src={item.requesting_profile?.avatar_url}
                                            alt={item.requesting_profile?.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">De</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                            {item.requesting_profile?.full_name?.split(' ')[0]}
                                        </span>
                                    </div>
                                </div>

                                {/* Arrow */}
                                <div className="text-slate-300">
                                    <ArrowRightLeft size={14} />
                                </div>

                                {/* To */}
                                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                    <div className="flex flex-col items-end min-w-0">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">Para</span>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                                            {item.target_profile?.full_name?.split(' ')[0] || 'Todos'}
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-white dark:border-slate-700 shadow-sm flex items-center justify-center">
                                        {item.target_profile ? (
                                            <img
                                                src={item.target_profile.avatar_url}
                                                alt={item.target_profile.full_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Users size={14} className="text-slate-400" /> // Use Users component instead of Group if imported
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Shift Info Badge */}
                            <div className="mt-1 flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="p-1 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                    <Calendar size={12} className="text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase leading-none mb-0.5">Plantão Negociado</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">
                                        {formatDate(shiftDate)} • {shiftTime?.slice(0, 5)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ServiceHistoryTab;
