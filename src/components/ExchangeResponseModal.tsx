import React, { useState } from 'react';
import { X, ArrowRightLeft, Calendar, Clock } from 'lucide-react';
import { ShiftExchangeRequest } from '../types';
import { respondToExchangeRequest } from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ExchangeResponseModalProps {
    request: ShiftExchangeRequest;
    onClose: () => void;
    onSuccess: () => void;
}

const ExchangeResponseModal: React.FC<ExchangeResponseModalProps> = ({
    request,
    onClose,
    onSuccess
}) => {
    const { showToast } = useToast();
    const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            weekday: 'long'
        });
    };

    const handleAccept = () => {
        if (!selectedShiftId) {
            showToast('Selecione um plantão para trocar', 'error');
            return;
        }
        setShowConfirmation(true);
    };

    const confirmAccept = async () => {
        if (!selectedShiftId) return;

        setIsLoading(true);
        try {
            await respondToExchangeRequest(request.id, 'ACCEPT', selectedShiftId);
            showToast('Troca confirmada com sucesso!', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error accepting exchange:', error);
            showToast(error.message || 'Erro ao confirmar troca', 'error');
        } finally {
            setIsLoading(false);
            setShowConfirmation(false);
        }
    };

    const handleReject = async () => {
        setIsLoading(true);
        try {
            await respondToExchangeRequest(request.id, 'REJECT');
            showToast('Solicitação recusada', 'info');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error rejecting exchange:', error);
            showToast(error.message || 'Erro ao recusar solicitação', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

                <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl animate-fade-in-up overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                                <ArrowRightLeft className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                    Solicitação de Troca
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    De: {request.requesting_user?.full_name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {/* Offered Shift */}
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                Plantão Oferecido
                            </h4>
                            <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-start gap-3">
                                    <Calendar className="text-emerald-600 mt-1" size={20} />
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 dark:text-white">
                                            {formatDate(request.offered_shift?.date || '')}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
                                            <Clock size={16} />
                                            <span>
                                                {request.offered_shift?.start_time} - {request.offered_shift?.end_time}
                                            </span>
                                            {request.offered_shift?.code && (
                                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">
                                                    {request.offered_shift.code}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requested Shifts */}
                        <div>
                            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                Escolha um dos seus plantões para trocar
                            </h4>
                            <div className="space-y-3">
                                {request.requested_shifts?.map(shift => (
                                    <button
                                        key={shift.id}
                                        onClick={() => setSelectedShiftId(shift.id)}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedShiftId === shift.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start gap-3">
                                                <Calendar className={selectedShiftId === shift.id ? 'text-primary' : 'text-slate-400'} size={20} />
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-white">
                                                        {formatDate(shift.date)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-600 dark:text-slate-400">
                                                        <Clock size={16} />
                                                        <span>{shift.start_time} - {shift.end_time}</span>
                                                        {shift.code && (
                                                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-medium">
                                                                {shift.code}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {selectedShiftId === shift.id && (
                                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white text-sm">✓</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3">
                        <button
                            onClick={handleReject}
                            disabled={isLoading}
                            className="px-6 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold transition-colors disabled:opacity-50"
                        >
                            Rejeitar
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={!selectedShiftId || isLoading}
                            className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-lg shadow-primary/30 hover:bg-primaryDark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processando...' : 'Confirmar Troca'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Toast */}
            {showConfirmation && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirmation(false)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl max-w-sm w-full animate-fade-in-up">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            Confirmar Troca?
                        </h4>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Tem certeza que deseja confirmar a troca? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-semibold transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAccept}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primaryDark transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Confirmando...' : 'Sim, confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExchangeResponseModal;
