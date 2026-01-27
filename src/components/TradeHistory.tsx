
import React, { useState, useEffect } from 'react';
import { getTradeHistory } from '../services/api';
import { Profile } from '../types';
import { History, Calendar, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Sparkles, Filter, Clock } from 'lucide-react';
import { format, isSameDay, isThisWeek, isThisMonth, subWeeks, subMonths, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TradeHistoryProps {
    currentUser: Profile;
}

type FilterType = 'all' | 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month';

const TradeHistory: React.FC<TradeHistoryProps> = ({ currentUser }) => {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const data = await getTradeHistory(currentUser.id);
                setHistory(data);
            } catch (error) {
                console.error("Error fetching trade history:", error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUser) {
            fetchHistory();
        }
    }, [currentUser]);

    const getFilteredHistory = () => {
        const now = new Date();
        return history.filter(item => {
            const itemDate = new Date(item.date);
            switch (filter) {
                case 'today':
                    return isSameDay(itemDate, now);
                case 'this_week':
                    return isThisWeek(itemDate, { locale: ptBR });
                case 'last_week':
                    const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: ptBR });
                    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: ptBR });
                    return isWithinInterval(itemDate, { start: lastWeekStart, end: lastWeekEnd });
                case 'this_month':
                    return isThisMonth(itemDate);
                case 'last_month':
                    const lastMonthStart = startOfMonth(subMonths(now, 1));
                    const lastMonthEnd = endOfMonth(subMonths(now, 1));
                    return isWithinInterval(itemDate, { start: lastMonthStart, end: lastMonthEnd });
                default:
                    return true;
            }
        });
    };

    const filteredItems = getFilteredHistory();

    const renderIcon = (type: string) => {
        switch (type) {
            case 'SWAP':
                return <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800"><ArrowRightLeft size={18} /></div>;
            case 'GIVEN':
                return <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><ArrowUpRight size={18} /></div>;
            case 'TAKEN':
                return <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"><ArrowDownLeft size={18} /></div>;
            default:
                return <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500"><History size={18} /></div>;
        }
    };

    const renderDetails = (item: any) => {
        if (item.type === 'SWAP') {
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Trocou com <span className="font-bold text-slate-700 dark:text-slate-200">{item.counterparty?.full_name}</span></span>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 uppercase">Saiu: {format(new Date(item.givenShift?.date), 'dd/MM')}</span>
                        <ArrowRightLeft size={10} className="text-slate-400" />
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 border border-green-100 uppercase">Entrou: {format(new Date(item.receivedShift?.date), 'dd/MM')}</span>
                    </div>
                </div>
            );
        } else if (item.type === 'GIVEN') {
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Repassou para <span className="font-bold text-slate-700 dark:text-slate-200">{item.counterparty?.full_name || 'Alguém'}</span></span>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase">Doado: {format(new Date(item.givenShift?.date), 'dd/MM')}</span>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pegou de <span className="font-bold text-slate-700 dark:text-slate-200">{item.counterparty?.full_name || 'Alguém'}</span></span>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">Recebido: {format(new Date(item.receivedShift?.date), 'dd/MM')}</span>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="space-y-4 animate-fade-in-up delay-100">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <History size={16} className="text-slate-400 dark:text-slate-500" />
                    <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Trade Histórico</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase">{history.length} Opurações</span>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                {[
                    { id: 'all', label: 'Tudo' },
                    { id: 'today', label: 'Hoje' },
                    { id: 'this_week', label: 'Esta Semana' },
                    { id: 'last_week', label: 'Semana Passada' },
                    { id: 'this_month', label: 'Este Mês' },
                    { id: 'last_month', label: 'Mês Passado' },
                ].map(opt => (
                    <button
                        key={opt.id}
                        onClick={() => setFilter(opt.id as FilterType)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all border ${filter === opt.id
                                ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white shadow-md'
                                : 'bg-white text-slate-500 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-50'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-8 border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
                    <Calendar className="text-slate-300 dark:text-slate-600 mb-2" size={32} />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Nenhum histórico encontrado para este período</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredItems.map(item => (
                        <div key={`${item.type}-${item.id}`} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center gap-3 group">
                            {/* Icon */}
                            {renderIcon(item.type)}

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 truncate pr-2">{item.serviceName || 'Serviço'}</h4>
                                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
                                        <Clock size={10} />
                                        {format(new Date(item.date), "dd MMM 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                {renderDetails(item)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TradeHistory;
