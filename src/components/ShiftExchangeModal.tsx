import React, { useState } from 'react';
import { X, ArrowRightLeft, Gift } from 'lucide-react';
import { ShiftAssignment, Shift, TradeType } from '../types';
import { createShiftExchange } from '../services/api';

interface ShiftExchangeModalProps {
    assignment: ShiftAssignment & { shift: Shift };
    groupId: string;
    currentUserId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ShiftExchangeModal: React.FC<ShiftExchangeModalProps> = ({ assignment, groupId, currentUserId, onClose, onSuccess }) => {
    const [mode, setMode] = useState<'SELECT_TYPE' | 'SELECT_USER' | 'CONFIRM'>('SELECT_TYPE');
    const [actionType, setActionType] = useState<TradeType>(TradeType.DIRECT_SWAP); // Default
    const [isLoading, setIsLoading] = useState(false);


    const handleSelectType = (type: TradeType) => {
        setActionType(type);
        // Skip user selection for now as it was dead code
        setMode('CONFIRM'); // Go straight to confirm or logic validation
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await createShiftExchange({
                group_id: groupId,
                type: actionType,
                status: 'PENDING', // Uses string enum from DB
                requesting_profile_id: currentUserId,
                target_profile_id: null, // Default to Group/Null since selection is removed
                offered_shift_assignment_id: assignment.id,
            } as any);
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar solicitação.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-6 shadow-xl animate-fade-in-up">
                <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
                    <X size={20} />
                </button>

                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Gerenciar Plantão</h3>
                <p className="text-xs text-slate-500 mb-6">{assignment.shift?.date} - {assignment.shift?.start_time}</p>

                {mode === 'SELECT_TYPE' && (
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => handleSelectType(TradeType.DIRECT_SWAP)}
                            className="p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 flex flex-col items-center gap-2 transition-all"
                        >
                            <ArrowRightLeft className="text-blue-600" size={32} />
                            <span className="font-bold text-blue-700 dark:text-blue-400 text-sm">Troca Direta</span>
                        </button>
                        <button
                            onClick={() => handleSelectType(TradeType.GIVEAWAY)}
                            className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 flex flex-col items-center gap-2 transition-all"
                        >
                            <Gift className="text-emerald-600" size={32} />
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">Doar Plantão</span>
                        </button>
                    </div>
                )}

                {mode === 'CONFIRM' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4">
                            {actionType === TradeType.DIRECT_SWAP ? <ArrowRightLeft size={32} /> : <Gift size={32} />}
                        </div>

                        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2">Confirmar Solicitação</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Você deseja solicitar
                            <strong className="text-slate-800 dark:text-slate-200"> {actionType === TradeType.DIRECT_SWAP ? 'troca' : 'doação'} </strong>
                            para
                            <strong className="text-slate-800 dark:text-slate-200"> o Grupo</strong>?
                        </p>

                        <div className="flex gap-3 w-full">
                            <button onClick={() => setMode('SELECT_TYPE')} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancelar</button>
                            <button
                                onClick={handleConfirm}
                                disabled={isLoading}
                                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-primaryDark transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? 'Enviando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ShiftExchangeModal;
