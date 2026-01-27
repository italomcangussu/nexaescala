import React, { useEffect, useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Group, Shift } from '../types';
import { getShifts } from '../services/api';

interface ScaleMonthSelectorProps {
    group: Group;
    onSelectMonth: (date: Date) => void;
    onBack: () => void;
}

type MonthStatus = 'VAZIA' | 'RASCUNHO' | 'PUBLICADA';

const ScaleMonthSelector: React.FC<ScaleMonthSelectorProps> = ({ group, onSelectMonth, onBack }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [years, setYears] = useState<number[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        const fetchShifts = async () => {
            setIsLoading(true);
            try {
                const data = await getShifts(group.id);
                setShifts(data);

                const currentYear = new Date().getFullYear();
                const dataYears = data.map(s => {
                    const dateStr = s.date.toString();
                    return parseInt(dateStr.split('-')[0]);
                });
                const uniqueYears = Array.from(new Set([currentYear, currentYear + 1, ...dataYears])).sort((a, b) => a - b);
                setYears(uniqueYears);

                if (!uniqueYears.includes(selectedYear)) {
                    setSelectedYear(uniqueYears[0]);
                }
            } catch (error) {
                console.error("Failed to fetch shifts for selector", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchShifts();
    }, [group.id]);

    const handlePrevYear = () => {
        const currentIndex = years.indexOf(selectedYear);
        if (currentIndex > 0) {
            setSelectedYear(years[currentIndex - 1]);
        }
    };

    const handleNextYear = () => {
        const currentIndex = years.indexOf(selectedYear);
        if (currentIndex < years.length - 1) {
            setSelectedYear(years[currentIndex + 1]);
        }
    };

    const getMonthStatus = (year: number, monthIndex: number): MonthStatus => {
        const shiftsInMonth = shifts.filter(s => {
            const dateStr = s.date.toString();
            const [y, m] = dateStr.split('-').map(Number);
            return y === year && (m - 1) === monthIndex;
        });

        if (shiftsInMonth.length === 0) return 'VAZIA';
        if (shiftsInMonth.some(s => s.is_published)) return 'PUBLICADA';
        return 'RASCUNHO';
    };

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-slate-50/50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-primary/60" size={32} />
                    <span className="text-xs font-medium text-slate-400 animate-pulse text-center">Carregando painel...</span>
                </div>
            </div>
        );
    }

    const currentIndex = years.indexOf(selectedYear);

    return (
        <div className="fixed inset-0 z-[70] flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Minimalist Header */}
            <div className="px-5 pt-8 pb-4 flex items-center justify-between shrink-0 max-w-[1600px] mx-auto w-full">
                <div className="flex items-center gap-6">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all duration-200 shadow-sm"
                    >
                        <ChevronLeft className="text-slate-600 dark:text-slate-300" size={18} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            Mural de Escalas
                        </h1>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                            {group.name}
                        </span>
                    </div>
                </div>

                {/* Visual Accent */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/60 dark:bg-slate-900/40 border border-white dark:border-slate-800 rounded-xl backdrop-blur-sm shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] leading-none">
                        Editor Live
                    </span>
                </div>
            </div>

            {/* Premium Year Selector */}
            <div className="px-5 py-4 flex justify-center">
                <div className="flex items-center gap-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-1.5 px-4 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                    <button
                        onClick={handlePrevYear}
                        disabled={currentIndex <= 0}
                        className={`p-1.5 rounded-lg transition-all ${currentIndex <= 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-3 px-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ano</span>
                        <span className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            {selectedYear}
                        </span>
                    </div>

                    <button
                        onClick={handleNextYear}
                        disabled={currentIndex >= years.length - 1}
                        className={`p-1.5 rounded-lg transition-all ${currentIndex >= years.length - 1 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                    >
                        <ChevronLeft className="rotate-180" size={18} />
                    </button>
                </div>
            </div>

            {/* Scrollable Grid - Better Edge Utilization */}
            <div className="flex-1 overflow-y-auto px-5 pb-8 pt-2 custom-scrollbar mt-2 max-w-[1600px] mx-auto w-full">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {monthNames.map((month, index) => {
                            const status = getMonthStatus(selectedYear, index);

                            return (
                                <button
                                    key={month}
                                    onClick={() => onSelectMonth(new Date(selectedYear, index, 1))}
                                    className="group relative flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/50 rounded-2xl hover:shadow-[0_15px_40px_rgba(0,0,0,0.03)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.2)] hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 text-left h-[88px]"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all duration-300 shadow-sm shrink-0">
                                            <CalendarIcon size={20} className="text-slate-400 dark:text-slate-500 group-hover:text-primary transition-colors" />
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                                                Mês
                                            </span>
                                            <span className="text-lg font-black text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors leading-tight">
                                                {month}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {/* Minimalist Premium Status */}
                                        <div className="flex flex-col items-end gap-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${status === 'PUBLICADA' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                                    status === 'RASCUNHO' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' :
                                                        'bg-slate-300 dark:bg-slate-600'
                                                    }`} />
                                                <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${status === 'PUBLICADA' ? 'text-emerald-600/90 dark:text-emerald-400/90' :
                                                    status === 'RASCUNHO' ? 'text-amber-600/90 dark:text-amber-400/90' :
                                                        'text-slate-400 dark:text-slate-500'
                                                    }`}>
                                                    {status}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0 transition-all duration-300 ml-2">
                                            <div className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg shadow-lg shadow-primary/20">
                                                <ChevronLeft className="rotate-180" size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.05);
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                }
            `}</style>
        </div>
    );
};

export default ScaleMonthSelector;
