import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Send, Search, Calendar, Clock, MapPin, Sparkles, User as UserIcon } from 'lucide-react';
import { Profile, Shift, ShiftAssignment } from '../types';
import { getGroupMembers, getAvailableShiftsForExchange, createShiftExchangeRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Portal from './Portal';

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
                true
            );

            // Sort shifts by date and then by start time
            const sortedShifts = [...shifts].sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateA !== dateB) return dateA - dateB;
                return a.start_time.localeCompare(b.start_time);
            });

            setAvailableShifts(sortedShifts);
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
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    const myShift = myShiftAssignment.shift;

    return (
        <Portal>
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-fade-in-up border border-white/20 dark:border-slate-800/50 flex flex-col max-h-[92vh]">
                    {/* Mobile Pull Handle */}
                    <div className="sm:hidden w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mt-4 mb-1 shrink-0" />

                    {/* Header */}
                    <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-6 sm:top-8 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={16} className="text-amber-500 animate-pulse" />
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                Pedir Troca
                            </h3>
                        </div>

                        <div className="flex items-center gap-3 mt-2 px-3 py-2 bg-primary/5 rounded-2xl border border-primary/10 w-fit">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-primary uppercase leading-none">{formatDate(myShift.date)}</span>
                            </div>
                            <div className="w-px h-4 bg-primary/20" />
                            <span className="text-xs font-bold text-primary truncate max-w-[150px]">
                                {myShift.group_name} • {myShift.start_time}
                            </span>
                        </div>

                        {/* Stepper Visual */}
                        <div className="flex items-center gap-2 mt-6">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold transition-all ${step >= 1 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>1</div>
                            <div className={`flex-1 h-1 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`} />
                            <div className={`flex items-center justify-center w-8 h-8 rounded-xl font-bold transition-all ${step >= 2 ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>2</div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar">
                        {step === 1 && (
                            <div className="animate-fade-in-up">
                                <h4 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <UserIcon size={20} className="text-primary" />
                                    Com quem deseja trocar?
                                </h4>

                                {/* Search */}
                                <div className="relative mb-6 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por nome ou especialidade..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 border-2 border-slate-100 dark:border-slate-800 rounded-3xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
                                    />
                                </div>

                                {/* Members List */}
                                <div className="grid gap-3">
                                    {filteredMembers.map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => handleMemberSelect(member)}
                                            className="group w-full flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 hover:border-primary/30 hover:bg-primary/5 transition-all active:scale-[0.98]"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={member.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=random`}
                                                    alt={member.full_name}
                                                    className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-700 group-hover:ring-primary/20 transition-all"
                                                />
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                                                    {member.full_name}
                                                </p>
                                                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    {member.specialty || 'Plantonista'} {member.crm && `• CRM ${member.crm}`}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                                                <ChevronRight size={20} />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && selectedMember && (
                            <div className="animate-fade-in-up">
                                <div className="flex flex-col mb-6">
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                        <Calendar size={20} className="text-primary" />
                                        Escolha o que quer em troca
                                    </h4>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Selecione até 3 opções de plantão da <span className="text-primary font-bold">{selectedMember.full_name.split(' ')[0]}</span>
                                    </p>
                                </div>

                                {isLoadingShifts ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                        <p className="text-sm font-bold text-slate-400 animate-pulse">Buscando plantões compatíveis...</p>
                                    </div>
                                ) : availableShifts.length === 0 ? (
                                    <div className="text-center py-12 px-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <Calendar size={32} />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-white">Nenhum plantão compatível</p>
                                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                                            Filtramos plantões que conflitam com seus horários atuais para garantir sua segurança.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {availableShifts.map(shift => (
                                            <button
                                                key={shift.id}
                                                onClick={() => handleShiftToggle(shift.id)}
                                                disabled={!selectedShiftIds.includes(shift.id) && selectedShiftIds.length >= 3}
                                                className={`group relative p-5 rounded-[2rem] border-2 transition-all text-left overflow-hidden active:scale-[0.98] ${selectedShiftIds.includes(shift.id)
                                                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-primary/20'
                                                    } ${!selectedShiftIds.includes(shift.id) && selectedShiftIds.length >= 3 ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                                            >
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-2xl transition-colors ${selectedShiftIds.includes(shift.id) ? 'bg-primary text-white scale-110' : 'bg-slate-50 dark:bg-slate-700 text-slate-400'}`}>
                                                            <Calendar size={20} />
                                                        </div>
                                                        <div>
                                                            <p className={`font-black tracking-tight ${selectedShiftIds.includes(shift.id) ? 'text-primary' : 'text-slate-800 dark:text-white'}`}>
                                                                {new Date(shift.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                                                <Clock size={12} />
                                                                <span>{shift.start_time} - {shift.end_time}</span>
                                                                {shift.code && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded uppercase">{shift.code}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {selectedShiftIds.includes(shift.id) && (
                                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-xl animate-scale-in">
                                                            <span className="font-black">✓</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedShiftIds.includes(shift.id) && (
                                                    <div className="absolute top-0 right-0 p-2 opacity-5">
                                                        <Sparkles size={60} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 sm:p-8 bg-white/50 dark:bg-black/20 backdrop-blur-sm border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 shrink-0 pb-safe-offset-4">
                        {step === 2 && (
                            <button
                                onClick={() => {
                                    setStep(1);
                                    setSelectedShiftIds([]);
                                }}
                                className="w-14 h-14 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-2xl hover:text-primary transition-all active:scale-90 shrink-0"
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={step === 1 ? !selectedMember : (selectedShiftIds.length === 0 || isLoading)}
                            className={`flex-1 h-14 font-black rounded-2xl shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative overflow-hidden ${(step === 1 ? selectedMember : selectedShiftIds.length > 0)
                                ? 'bg-primary text-white shadow-primary/30 hover:bg-primaryDark'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                }`}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Enviando...</span>
                                </>
                            ) : (
                                <>
                                    <span>{step === 1 ? 'Próximo Passo' : `Enviar Pedido (${selectedShiftIds.length})`}</span>
                                    {step === 1 ? <ChevronRight size={20} /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                </>
                            )}
                            {((step === 1 && selectedMember) || (step === 2 && selectedShiftIds.length > 0)) && (
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Portal>
    );
};

export default ShiftExchangeRequestModal;
