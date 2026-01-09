import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, Gift, Users, Search, Check } from 'lucide-react';
import { ShiftAssignment, GroupMember, Shift, Profile, TradeType } from '../types';
import { getGroupMembers, createShiftExchange } from '../services/api';

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
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (mode === 'SELECT_USER') {
            setIsLoading(true);
            getGroupMembers(groupId).then(data => {
                // Filter out self
                setMembers(data.filter(m => m.profile.id !== currentUserId));
            }).finally(() => setIsLoading(false));
        }
    }, [mode, groupId, currentUserId]);

    const handleSelectType = (type: TradeType) => {
        setActionType(type);
        if (type === TradeType.GIVEAWAY) {
            // Ask: To specific user or group?
            // For MVP simplicity, let's treat "Select User" as standard. 
            // If user selects "Group", that's a special null target.
            setMode('SELECT_USER');
        } else {
            setMode('SELECT_USER');
        }
    };

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await createShiftExchange({
                group_id: groupId,
                type: actionType,
                status: 'PENDING', // Uses string enum from DB
                requesting_profile_id: currentUserId,
                target_profile_id: selectedMember?.profile.id || null, // Null = Group Giveaway
                offered_shift_assignment_id: assignment.id,
                // requested_shift_assignment_id: null // Logic for selecting THEIR shift to swap is complex, for MVP omitting
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

    const filteredMembers = members.filter(m => m.profile.full_name.toLowerCase().includes(search.toLowerCase()));

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
// ...
                            {actionType === TradeType.DIRECT_SWAP ? <ArrowRightLeft size={32} /> : <Gift size={32} />}
                        </button>

                        <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-2">Confirmar Solicitação</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Você deseja solicitar
                            <strong className="text-slate-800 dark:text-slate-200"> {actionType === TradeType.DIRECT_SWAP ? 'troca' : 'doação'} </strong>
                            para
                            <strong className="text-slate-800 dark:text-slate-200"> {selectedMember ? selectedMember.profile.full_name : 'o Grupo'}</strong>?
                        </p>

                        <div className="flex gap-3">
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
