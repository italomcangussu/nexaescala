import React, { useState } from 'react';
import { X, Copy, Calendar, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { replicateScheduleToMonth } from '../services/api';

interface ReplicateScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceMonth: Date;
    groupId: string;
    onSuccess: () => void;
}

const ReplicateScheduleModal: React.FC<ReplicateScheduleModalProps> = ({
    isOpen,
    onClose,
    sourceMonth,
    groupId,
    onSuccess
}) => {
    const { showToast } = useToast();
    const [targetYear, setTargetYear] = useState(sourceMonth.getFullYear());
    const [targetMonth, setTargetMonth] = useState(sourceMonth.getMonth() + 1);
    const [includeAssignments, setIncludeAssignments] = useState(true);
    const [adjustDates, setAdjustDates] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const sourceMonthName = monthNames[sourceMonth.getMonth()];
    const sourceYear = sourceMonth.getFullYear();

    const years = [sourceYear, sourceYear + 1, sourceYear + 2];

    const handleReplicate = async () => {
        setIsLoading(true);
        try {
            const targetDate = new Date(targetYear, targetMonth - 1, 1);

            await replicateScheduleToMonth(
                groupId,
                sourceMonth,
                targetDate,
                {
                    includeAssignments,
                    adjustDates
                }
            );

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error replicating schedule:', error);
            showToast('Erro ao replicar escala. Tente novamente.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const targetMonthName = monthNames[targetMonth - 1];
    const isSameMonth = targetYear === sourceYear && targetMonth === sourceMonth.getMonth() + 1;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Copy size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">
                                Replicar Escala
                            </h2>
                            <p className="text-sm text-slate-500">
                                Copiar para outro mês
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Source Month */}
                    <div className="bg-surface dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {sourceMonthName.substring(0, 3)}
                            </span>
                            <span className="text-lg font-black text-slate-800 dark:text-white">
                                {sourceYear}
                            </span>
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Mês de Origem
                            </span>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">
                                {sourceMonthName} {sourceYear}
                            </p>
                        </div>
                        <Calendar size={24} className="text-slate-300" />
                    </div>

                    {/* Target Month Selection */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <Copy size={14} className="text-primary" />
                            Copiar para
                        </label>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Year Selector */}
                            <div className="relative">
                                <select
                                    value={targetYear}
                                    onChange={(e) => setTargetYear(Number(e.target.value))}
                                    className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-primary/30 outline-none"
                                >
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>

                            {/* Month Selector */}
                            <div className="relative">
                                <select
                                    value={targetMonth}
                                    onChange={(e) => setTargetMonth(Number(e.target.value))}
                                    className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-primary/30 outline-none"
                                >
                                    {monthNames.map((month, index) => (
                                        <option key={month} value={index + 1}>{month}</option>
                                    ))}
                                </select>
                                <Calendar size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Opções
                        </label>

                        {/* Include Assignments */}
                        <label className="flex items-center justify-between p-4 bg-surface dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={18} className={includeAssignments ? 'text-emerald-500' : 'text-slate-300'} />
                                <div>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Incluir atribuições de membros
                                    </span>
                                    <p className="text-xs text-slate-400">
                                        Copiar quem está escalado em cada turno
                                    </p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={includeAssignments}
                                onChange={(e) => setIncludeAssignments(e.target.checked)}
                                className="w-5 h-5 rounded-md border-slate-300 text-primary focus:ring-primary/30"
                            />
                        </label>

                        {/* Adjust Dates */}
                        <label className="flex items-center justify-between p-4 bg-surface dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-3">
                                <Calendar size={18} className={adjustDates ? 'text-blue-500' : 'text-slate-300'} />
                                <div>
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        Ajustar por dia da semana
                                    </span>
                                    <p className="text-xs text-slate-400">
                                        Manter padrão semanal (seg, ter, qua...)
                                    </p>
                                </div>
                            </div>
                            <input
                                type="checkbox"
                                checked={adjustDates}
                                onChange={(e) => setAdjustDates(e.target.checked)}
                                className="w-5 h-5 rounded-md border-slate-300 text-primary focus:ring-primary/30"
                            />
                        </label>
                    </div>

                    {/* Warning if same month */}
                    {isSameMonth && (
                        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                            <p className="text-sm text-amber-700 dark:text-amber-400">
                                Você selecionou o mesmo mês de origem. Escolha um mês diferente.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleReplicate}
                        disabled={isLoading || isSameMonth}
                        className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Replicando...
                            </>
                        ) : (
                            <>
                                <Copy size={18} />
                                Replicar para {targetMonthName}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReplicateScheduleModal;
