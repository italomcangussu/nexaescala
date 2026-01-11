```
import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Send, Search } from 'lucide-react';
import { Profile, Shift, ShiftAssignment } from '../types';
import { getGroupMembers, getAvailableShiftsForExchange, createShiftExchangeRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface ShiftExchangeRequestModalProps {
    myShiftAssignment: ShiftAssignment & { shift: Shift };
    groupId: string;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 1 | 2;

const ShiftExchangeRequestModal: React.FC<ShiftExchangeRequestModalProps> = ({
    myShiftAssignment,
    groupId,
    onClose,
    onSuccess
}) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [step, setStep] = useState<Step>(1);
    const [members, setMembers] = useState<Profile[]>([]);
    const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [availableShifts, setAvailableShifts] = useState<Shift[]>([]);
    const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingShifts, setIsLoadingShifts] = useState(false);

    // Load group members on mount
    useEffect(() => {
        loadMembers();
    }, [groupId]);

    // Load available shifts when member is selected
    useEffect(() => {
        if (selectedMember && user) {
            loadAvailableShifts();
        }
    }, [selectedMember]);

    const loadMembers = async () => {
        try {
            const groupMembers = await getGroupMembers(groupId);
            // Filter out current user
            const otherMembers = groupMembers
                .filter(gm => gm.profile.id !== user?.id)
                .map(gm => gm.profile);
            setMembers(otherMembers);
        } catch (error) {
            console.error('Error loading members:', error);
            showToast('Erro ao carregar membros', 'error');
        }
    };

    const loadAvailableShifts = async () => {
        if (!selectedMember || !user) return;

        setIsLoadingShifts(true);
        try {
            const shifts = await getAvailableShiftsForExchange(
                groupId,
                selectedMember.id,
                user.id,
                true // Exclude conflicts
            );
            setAvailableShifts(shifts);
        } catch (error) {
            console.error('Error loading shifts:', error);
            showToast('Erro ao carregar plantões disponíveis', 'error');
        } finally {
            setIsLoadingShifts(false);
        }
    };

    const handleMemberSelect = (member: Profile) => {
        setSelectedMember(member);
        setStep(2);
    };

    const handleShiftToggle = (shiftId: string) => {
        setSelectedShiftIds(prev => {
            if (prev.includes(shiftId)) {
                return prev.filter(id => id !== shiftId);
            } else if (prev.length < 3) {
                return [...prev, shiftId];
            }
            return prev;
        });
    };

    const handleSubmit = async () => {
        if (!selectedMember || !user || selectedShiftIds.length === 0) return;

        setIsLoading(true);
        try {
            await createShiftExchangeRequest(
                groupId,
                user.id,
                selectedMember.id,
                myShiftAssignment.shift.id,
                selectedShiftIds
            );
            showToast('Solicitação de troca enviada!', 'success');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating exchange request:', error);
            showToast(error.message || 'Erro ao enviar solicitação', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredMembers = members.filter(member =>
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl animate-fade-in-up overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                        Solicitar Troca de Plantão
                    </h3>
                    <p className="text-sm text-slate-500">
                        {myShiftAssignment.shift.group_name} • {formatDate(myShiftAssignment.shift.date)} • {myShiftAssignment.shift.start_time}
                    </p>

                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 mt-4">
                        <div className={`flex items - center justify - center w - 8 h - 8 rounded - full ${ step === 1 ? 'bg-primary text-white' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' } `}>
                            {step > 1 ? '✓' : '1'}
                        </div>
                        <div className={`flex - 1 h - 1 ${ step === 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700' } `} />
                        <div className={`flex items - center justify - center w - 8 h - 8 rounded - full ${ step === 2 ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400' } `}>
                            2
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {step === 1 && (
                        <div>
                            <h4 className="font-semibold text-slate-800 dark:text-white mb-3">
                                Selecione um membro
                            </h4>

                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar membro..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            {/* Members List */}
                            <div className="space-y-2">
                                {filteredMembers.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => handleMemberSelect(member)}
                                        className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <img
                                            src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random`}
alt = { member.full_name }
className = "w-10 h-10 rounded-full"
    />
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-slate-800 dark:text-white">
                                                {member.full_name}
                                            </p>
                                            {member.specialty && (
                                                <p className="text-xs text-slate-500">
                                                    {member.specialty}
                                                </p>
                                            )}
                                        </div>
                                        <ChevronRight className="text-slate-400" size={20} />
                                    </button >
                                ))}
                            </div >
                        </div >
                    )}

{
    step === 2 && (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-800 dark:text-white">
                    Escolha até 3 opções de plantão
                </h4>
                <span className="text-sm text-slate-500">
                    {selectedShiftIds.length}/3 selecionados
                </span>
            </div>

            {isLoadingShifts ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            ) : availableShifts.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-slate-500">
                        Nenhum plantão disponível para troca
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        Plantões que conflitam com seus outros serviços foram filtrados
                    </p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {availableShifts.map(shift => (
                        <button
                            key={shift.id}
                            onClick={() => handleShiftToggle(shift.id)}
                            disabled={!selectedShiftIds.includes(shift.id) && selectedShiftIds.length >= 3}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${selectedShiftIds.includes(shift.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                } ${!selectedShiftIds.includes(shift.id) && selectedShiftIds.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-slate-800 dark:text-white">
                                        {formatDate(shift.date)}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        {shift.start_time} - {shift.end_time}
                                        {shift.code && ` • ${shift.code}`}
                                    </p>
                                </div>
                                {selectedShiftIds.includes(shift.id) && (
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <span className="text-white text-sm">✓</span>
                                    </div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
                </div >

    {/* Footer */ }
    < div className = "p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3" >
        { step === 2 && (
            <button
                onClick={() => {
                    setStep(1);
                    setSelectedShiftIds([]);
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
            >
                <ChevronLeft size={18} />
                Voltar
            </button>
        )}

{
    step === 2 && (
        <button
            onClick={handleSubmit}
            disabled={selectedShiftIds.length === 0 || isLoading}
            className="flex-1 px-6 py-3 bg-primary text-white font-semibold rounded-lg shadow-lg shadow-primary/30 hover:bg-primaryDark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Enviando...
                </>
            ) : (
                <>
                    <Send size={18} />
                    Enviar Pedido
                </>
            )}
        </button>
    )
}
                </div >
            </div >
        </div >
    );
};

export default ShiftExchangeRequestModal;
