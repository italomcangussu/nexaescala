import React, { useState, useEffect } from 'react';
import { Megaphone, AlertCircle, ChevronRight, Users, User, Search, Check, ArrowLeft, X, Sparkles } from 'lucide-react';
import { Shift, ShiftAssignment, GroupMember, TradeType, TradeStatus } from '../types';
import { getGroupMembers, createShiftExchange } from '../services/api';
import { useToast } from '../context/ToastContext';
import Portal from './Portal';

interface RepasseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    shift: Shift;
    assignment?: ShiftAssignment;
    currentUserProfileId: string;
    currentUserRole: string;
}

type RepasseStep = 'CHOICE' | 'DIRECTED_MEMBER' | 'CONFIRM_GLOBAL';

const RepasseModal: React.FC<RepasseModalProps> = ({ isOpen, onClose, onSuccess, shift, assignment, currentUserProfileId }) => {
    const { showToast } = useToast();
    const [step, setStep] = useState<RepasseStep>('CHOICE');
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && step === 'DIRECTED_MEMBER') {
            loadMembers();
        }
    }, [isOpen, step]);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep('CHOICE');
            setSelectedMember(null);
            setSearchQuery('');
        }
    }, [isOpen]);

    const loadMembers = async () => {
        setIsLoadingMembers(true);
        try {
            const data = await getGroupMembers(shift.group_id);
            // Filter out current user
            setMembers(data.filter(m => m.profile.id !== currentUserProfileId));
        } catch (error) {
            console.error('Error loading members:', error);
            showToast('Erro ao carregar membros do serviço', 'error');
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const handleBack = () => {
        if (step === 'CHOICE') onClose();
        else setStep('CHOICE');
    };

    const handleConfirm = async (targetMemberId: string | null = null) => {
        if (!assignment) {
            showToast('Erro: Atribuição não encontrada', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await createShiftExchange({
                group_id: shift.group_id,
                type: TradeType.GIVEAWAY,
                status: TradeStatus.PENDING,
                requesting_profile_id: currentUserProfileId,
                target_profile_id: targetMemberId,
                offered_shift_assignment_id: assignment.id,
            } as any);

            showToast(
                targetMemberId
                    ? 'Repasse direcionado enviado com sucesso!'
                    : 'Repasse ofertado para todo o serviço!',
                'success'
            );
            onSuccess?.();
            onClose();
        } catch (error: any) {
            console.error('Error in giveaway:', error);
            showToast('Erro ao processar repasse: ' + (error.message || 'Erro desconhecido'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase();
    };

    const filteredMembers = members.filter(m =>
        m.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.profile.crm?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <Portal>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
                {/* Backdrop Click */}
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl border-t sm:border border-white/20 dark:border-slate-800/50 overflow-hidden animate-fade-in-up flex flex-col max-h-[92vh] sm:max-h-[85vh]">

                    {/* Pull Handle (Mobile) */}
                    <div className="sm:hidden flex justify-center pt-4 pb-1 shrink-0">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    </div>

                    {/* Header */}
                    <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 relative">
                        {/* Back Button (Top Left) */}
                        <button
                            onClick={handleBack}
                            className="absolute left-6 top-6 sm:top-8 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        {/* Close Button (Top Right) */}
                        <button
                            onClick={onClose}
                            className="absolute right-6 top-6 sm:top-8 p-2 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mt-2">
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={18} className="text-sky-500 animate-pulse" />
                                <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                                    {step === 'CHOICE' ? 'Repassar Plantão' :
                                        step === 'DIRECTED_MEMBER' ? 'Escolher Membro' : 'Confirmar Repasse'}
                                </h3>
                            </div>

                            {/* Shift Info Badge */}
                            <div className="flex items-center gap-3 mt-3 px-4 py-2 bg-sky-500/10 rounded-2xl border border-sky-500/20 w-fit">
                                <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                                    {formatDate(shift.date)}
                                </span>
                                <div className="w-px h-3 bg-sky-500/30" />
                                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 truncate max-w-[200px]">
                                    {shift.group_name} • {shift.start_time.slice(0, 5)}
                                </span>
                            </div>
                        </div>

                        {/* Stepper Visual */}
                        <div className="flex items-center justify-center gap-2 mt-6 max-w-[200px] mx-auto">
                            <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${step === 'CHOICE' ? 'bg-sky-500' : 'bg-sky-500/20'}`}></div>
                            <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${step !== 'CHOICE' ? 'bg-sky-500' : 'bg-sky-500/20'}`}></div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                        {step === 'CHOICE' && (
                            <div className="space-y-4">
                                <button
                                    onClick={() => setStep('CONFIRM_GLOBAL')}
                                    className="w-full group relative overflow-hidden flex items-center p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 transition-all rounded-[2.5rem] text-left active:scale-[0.98]"
                                >
                                    <div className="w-14 h-14 rounded-3xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center mr-5 shrink-0 group-hover:scale-110 transition-transform">
                                        <Users className="text-sky-600 dark:text-sky-400" size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-lg text-slate-800 dark:text-white mb-1">Repasse Geral</h4>
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-tight">Ofertado para todos do serviço</p>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-sky-500 transition-colors" size={24} />
                                </button>

                                <button
                                    onClick={() => setStep('DIRECTED_MEMBER')}
                                    className="w-full group relative overflow-hidden flex items-center p-6 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all rounded-[2.5rem] text-left active:scale-[0.98]"
                                >
                                    <div className="w-14 h-14 rounded-3xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mr-5 shrink-0 group-hover:scale-110 transition-transform">
                                        <User className="text-blue-600 dark:text-blue-400" size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-lg text-slate-800 dark:text-white mb-1">Repasse Direcionado</h4>
                                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-tight">Para um membro específico</p>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={24} />
                                </button>

                                <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3 mt-4">
                                    <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
                                        Você continua responsável pelo plantão até que alguém o aceite e a troca seja processada.
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 'CONFIRM_GLOBAL' && (
                            <div className="space-y-8 animate-fade-in text-center py-4">
                                <div className="mx-auto w-24 h-24 bg-sky-100 dark:bg-sky-900/30 rounded-[2rem] flex items-center justify-center mb-6">
                                    <Megaphone className="text-sky-600 dark:text-sky-400" size={48} />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">Deseja confirmar o repasse?</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs mx-auto">
                                        O plantão ficará disponível para que <span className="text-sky-600">qualquer membro</span> do grupo possa assumir.
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleConfirm(null)}
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-sky-600 hover:bg-sky-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-sky-500/20 active:scale-95 transition-all text-lg flex items-center justify-center gap-3 disabled:opacity-70"
                                >
                                    {isSubmitting ? (
                                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            Confirmar Repasse
                                            <Check size={24} />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {step === 'DIRECTED_MEMBER' && (
                            <div className="space-y-6 animate-fade-in h-full flex flex-col">
                                {/* Search */}
                                <div className="relative shrink-0">
                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar colega..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-3xl outline-none font-bold text-slate-700 dark:text-white transition-all text-sm transition-all"
                                    />
                                </div>

                                {/* List */}
                                <div className="flex-1 space-y-3 min-h-[300px]">
                                    {isLoadingMembers ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <div key={i} className="h-20 bg-slate-50 dark:bg-slate-800 animate-pulse rounded-3xl"></div>
                                        ))
                                    ) : filteredMembers.length > 0 ? (
                                        filteredMembers.map(member => (
                                            <button
                                                key={member.id}
                                                onClick={() => setSelectedMember(member)}
                                                className={`w-full flex items-center p-4 rounded-[1.5rem] border-2 transition-all active:scale-[0.98] ${selectedMember?.id === member.id
                                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                                                    : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800'
                                                    }`}
                                            >
                                                <img
                                                    src={member.profile.avatar_url}
                                                    alt={member.profile.full_name}
                                                    className="w-12 h-12 rounded-2xl object-cover mr-4 ring-2 ring-slate-100 dark:ring-slate-800"
                                                />
                                                <div className="flex-1 text-left">
                                                    <h5 className="font-black text-slate-800 dark:text-white text-sm">{member.profile.full_name}</h5>
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                        CRM {member.profile.crm || '---'}
                                                    </span>
                                                </div>
                                                {selectedMember?.id === member.id && (
                                                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                                        <Check size={14} strokeWidth={4} />
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center space-y-3">
                                            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                                <User size={32} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">Nenhum membro encontrado</p>
                                        </div>
                                    )}
                                </div>

                                {/* Selection Confirmation Toggle */}
                                <div className={`pt-4 shrink-0 transition-all duration-300 ${selectedMember ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                                    <button
                                        onClick={() => handleConfirm(selectedMember?.profile.id)}
                                        disabled={isSubmitting}
                                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Repassar Plantão
                                                <ChevronRight size={24} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Safe Area */}
                    <div className="h-8 shrink-0 sm:hidden"></div>
                </div>
            </div>
        </Portal>
    );
};

export default RepasseModal;
