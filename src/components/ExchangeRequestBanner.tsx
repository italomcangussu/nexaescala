import React from 'react';
import { X, ArrowRightLeft, Calendar, User } from 'lucide-react';
import { ShiftExchangeRequest } from '../types';

interface ExchangeRequestBannerProps {
    request: ShiftExchangeRequest;
    onOpenResponse: () => void;
    onDismiss: () => void;
}

const ExchangeRequestBanner: React.FC<ExchangeRequestBannerProps> = ({
    request,
    onOpenResponse,
    onDismiss
}) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 animate-fade-in-up shadow-lg">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <ArrowRightLeft className="text-white" size={20} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-white">
                            Nova Solicitação de Troca
                        </h4>
                        <button
                            onClick={onDismiss}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <User size={16} />
                            <span>
                                <strong className="text-slate-800 dark:text-white">
                                    {request.requesting_user?.full_name}
                                </strong>
                                {' '}quer trocar um plantão com você
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar size={16} />
                            <span>
                                Plantão oferecido: {' '}
                                <strong className="text-slate-800 dark:text-white">
                                    {formatDate(request.offered_shift?.date || '')}
                                </strong>
                                {' '}às {request.offered_shift?.start_time}
                            </span>
                        </div>

                        {request.requested_shifts && request.requested_shifts.length > 0 && (
                            <div className="text-slate-500 dark:text-slate-400 text-xs">
                                {request.requested_shifts.length} opção(ões) de data disponível(is)
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={onOpenResponse}
                            className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md shadow-primary/30 hover:bg-primaryDark transition-all text-sm"
                        >
                            Ver Detalhes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExchangeRequestBanner;
