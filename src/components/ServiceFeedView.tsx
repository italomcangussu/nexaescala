import React, { useState, useEffect, useCallback } from 'react';
import {
    MessageSquare,
    Repeat,
    ArrowRightLeft,
    Clock,
    Send,
    User,
    CheckCircle2,
    Calendar,
    Rocket,
} from 'lucide-react';
import { Group, Profile, Shift, ShiftAssignment, ChatMessage, ShiftExchange, TradeStatus, TradeType, GroupMember } from '../types';
import { fetchGroupMessages, sendGroupMessage, getShiftExchanges, executeExchangeTransaction, getGroupMembers, createNotificationsBulk, createShiftExchange } from '../services/api';
import OfferShiftModal from './chat/OfferShiftModal';
import { useToast } from '../context/ToastContext';

const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return hex;
}

interface ServiceFeedViewProps {
    group: Group;
    currentUser: Profile;
    shifts: Shift[];
    assignments: ShiftAssignment[];
}

type UnifiedFeedItem =
    | { type: 'message'; data: ChatMessage; timestamp: string }
    | { type: 'exchange'; data: ShiftExchange; timestamp: string };

const ServiceFeedView: React.FC<ServiceFeedViewProps> = ({
    group,
    currentUser,
    shifts,
    assignments
}) => {
    const [feedItems, setFeedItems] = useState<UnifiedFeedItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const { showToast } = useToast();

    const fetchMembers = useCallback(async () => {
        try {
            const members = await getGroupMembers(group.id);
            setGroupMembers(members);
        } catch (error) {
            console.error("Failed to fetch group members:", error);
        }
    }, [group.id]);

    const displayColor = group.color || '#10b981';

    const loadFeed = useCallback(async () => {
        try {
            setIsLoading(true);
            const [messages, exchanges] = await Promise.all([
                fetchGroupMessages(group.id),
                getShiftExchanges(group.id)
            ]);

            const items: UnifiedFeedItem[] = [
                ...messages.map(m => ({ type: 'message' as const, data: m, timestamp: m.created_at })),
                ...exchanges.map(e => ({ type: 'exchange' as const, data: e, timestamp: e.created_at }))
            ];

            // Sort by timestamp descending
            items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setFeedItems(items);
        } catch (error) {
            console.error("Failed to load feed:", error);
            showToast("Erro ao carregar o feed.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [group.id, showToast]);

    useEffect(() => {
        loadFeed();
        fetchMembers();
    }, [loadFeed, fetchMembers]);

    const filteredMentionMembers = mentionSearch
        ? groupMembers.filter(m => m.profile.full_name.toLowerCase().includes(mentionSearch.toLowerCase()))
        : [];

    useEffect(() => {
        if (filteredMentionMembers.length > 0) {
            setSelectedMentionIndex(0);
        }
    }, [mentionSearch, filteredMentionMembers.length]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const cursorPosition = e.target.selectionStart || 0;
        const textBeforeCursor = value.slice(0, cursorPosition);

        const lastAtChar = textBeforeCursor.lastIndexOf('@');

        if (lastAtChar !== -1) {
            const query = textBeforeCursor.slice(lastAtChar + 1);
            // Only trigger if @ is at start of word or start of string
            const isWordStart = lastAtChar === 0 || textBeforeCursor[lastAtChar - 1] === ' ';

            if (isWordStart && !query.includes(' ')) {
                setMentionSearch(query);
                setMentionIndex(lastAtChar);
            } else {
                setMentionSearch('');
            }
        } else {
            setMentionSearch('');
        }

        setInputText(value);
    };

    const selectMember = (member: GroupMember) => {
        if (mentionIndex === -1) return;

        const textBeforeMention = inputText.slice(0, mentionIndex);
        const textAfterMention = inputText.slice(mentionIndex + mentionSearch.length + 1);

        const newText = `${textBeforeMention}@${member.profile.full_name} ${textAfterMention}`;
        setInputText(newText);
        setMentionSearch('');
        setMentionIndex(-1);
        setSelectedMentionIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (mentionIndex !== -1 && filteredMentionMembers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedMentionIndex(prev => (prev + 1) % filteredMentionMembers.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedMentionIndex(prev => (prev - 1 + filteredMentionMembers.length) % filteredMentionMembers.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectMember(filteredMentionMembers[selectedMentionIndex]);
            } else if (e.key === 'Escape') {
                setMentionSearch('');
                setMentionIndex(-1);
            }
        } else if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;
        try {
            await sendGroupMessage({
                group_id: group.id,
                sender_id: currentUser.id,
                content: inputText.trim(),
                message_type: 'TEXT'
            });

            // Parse mentions for notifications
            const memberNames = groupMembers.map(m => m.profile.full_name).sort((a, b) => b.length - a.length);
            if (memberNames.length > 0) {
                const mentionRegex = new RegExp(`@(${memberNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
                const matches = Array.from(inputText.matchAll(mentionRegex));

                if (matches.length > 0) {
                    const notifications = matches.map(match => {
                        const mentionedName = match[1];
                        const mentionedMember = groupMembers.find(m => m.profile.full_name === mentionedName);

                        if (mentionedMember && mentionedMember.profile.id !== currentUser.id) {
                            return {
                                user_id: mentionedMember.profile.id,
                                title: 'Você foi mencionado',
                                message: `${currentUser.full_name} mencionou você em ${group.name}`,
                                type: 'MENTION' as const,
                                is_read: false,
                                metadata: { group_id: group.id }
                            };
                        }
                        return null;
                    }).filter(Boolean);

                    if (notifications.length > 0) {
                        await createNotificationsBulk(notifications as any[]);
                    }
                }
            }

            setInputText('');
            loadFeed();
        } catch (error) {
            showToast("Erro ao enviar comentário.", "error");
        }
    };

    const handleAcceptExchange = async (exchange: ShiftExchange) => {
        try {
            // In a real app, this should confirm which shift the user is offering back if it's a SWAP
            // For GIVEAWAY, it's simpler.
            if (exchange.type === TradeType.GIVEAWAY) {
                const updatedExchange = { ...exchange, target_profile_id: currentUser.id };
                await executeExchangeTransaction(updatedExchange);
                showToast("Plantão aceito com sucesso!", "success");
            } else {
                showToast("Para trocas diretas, o proponente deve aceitar.", "info");
            }
            loadFeed();
        } catch (error) {
            showToast("Erro ao processar troca.", "error");
        }
    };

    const renderFeedItem = (item: UnifiedFeedItem) => {
        if (item.type === 'message') {
            const msg = item.data;
            const isSystem = msg.message_type === 'SHIFT_OFFER' || msg.message_type === 'SHIFT_SWAP';

            return (
                <div key={msg.id} className="mb-6 animate-fade-in-up">
                    <div className="flex gap-4">
                        <div className="shrink-0">
                            {msg.sender?.avatar_url ? (
                                <img src={msg.sender.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm" />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">{msg.sender?.full_name}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div
                                style={isSystem ? {
                                    backgroundColor: hexToRgba(displayColor, 0.05),
                                    borderColor: hexToRgba(displayColor, 0.2)
                                } : undefined}
                                className={`p-4 rounded-2xl shadow-sm border ${isSystem ? '' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}
                            >
                                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                    {(() => {
                                        const memberNames = groupMembers.map(m => m.profile.full_name).sort((a, b) => b.length - a.length);
                                        if (memberNames.length === 0) return msg.content;

                                        const mentionRegex = new RegExp(`(@(?:${memberNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`, 'g');
                                        return msg.content.split(mentionRegex).map((part, i) => {
                                            if (part.startsWith('@')) {
                                                const name = part.substring(1);
                                                if (memberNames.includes(name)) {
                                                    return (
                                                        <span key={i} className="font-black text-primary" style={{ color: displayColor }}>
                                                            {part}
                                                        </span>
                                                    );
                                                }
                                            }
                                            return part;
                                        });
                                    })()}
                                </p>

                                {msg.metadata?.shift_id && (
                                    <div
                                        style={{ borderTopColor: hexToRgba(displayColor, 0.2) }}
                                        className="mt-3 pt-3 border-t flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} style={{ color: displayColor }} />
                                            <span style={{ color: displayColor }} className="text-xs font-bold opacity-80">
                                                {new Date(msg.metadata.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <span style={{ color: displayColor }} className="text-[10px] font-black uppercase tracking-tighter">
                                            OFERTA DISPONÍVEL
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            const exch = item.data;
            const isCompleted = exch.status === TradeStatus.ACCEPTED;

            return (
                <div key={exch.id} className="mb-6 animate-fade-in-up">
                    <div className="flex gap-4">
                        <div className="shrink-0 flex flex-col items-center gap-2">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center`}
                                style={isCompleted || exch.type === TradeType.GIVEAWAY ? { backgroundColor: hexToRgba(displayColor, 0.1), color: displayColor } : { backgroundColor: '#dbeafe', color: '#2563eb' }}
                            >
                                {exch.type === TradeType.GIVEAWAY ? <Repeat size={20} /> : <ArrowRightLeft size={20} />}
                            </div>
                            <div className="w-0.5 grow bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                        </div>
                        <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    {isCompleted ? 'TROCA CONCLUÍDA' : exch.type === TradeType.GIVEAWAY ? 'OFERTA DE PLANTÃO' : 'PROPOSTA DE TROCA'}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {new Date(exch.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div
                                style={isCompleted ? { backgroundColor: hexToRgba(displayColor, 0.05), borderColor: hexToRgba(displayColor, 0.2) } : undefined}
                                className={`p-5 rounded-3xl border transition-all ${isCompleted ? '' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'}`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 overflow-hidden">
                                        <img src={exch.requesting_profile?.avatar_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {exch.requesting_profile?.full_name}
                                        {exch.type === TradeType.GIVEAWAY ? ' está oferecendo:' : ' quer trocar:'}
                                    </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-[8px] font-black text-slate-400 uppercase leading-none">{new Date(exch.offered_shift?.shift?.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-slate-100 leading-none">{new Date(exch.offered_shift?.shift?.date + 'T12:00:00').getDate()}</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                                {exch.offered_shift?.shift?.start_time} - {exch.offered_shift?.shift?.end_time}
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                                {exch.offered_shift?.shift?.code || 'Plantão'}
                                            </p>
                                        </div>
                                    </div>

                                    {!isCompleted && exch.requesting_profile_id !== currentUser.id && (
                                        <button
                                            onClick={() => handleAcceptExchange(exch)}
                                            style={{ backgroundColor: displayColor, boxShadow: `0 10px 15px -3px ${hexToRgba(displayColor, 0.3)}` }}
                                            className="px-4 py-2 text-white rounded-xl text-xs font-black shadow-lg hover:scale-105 transition-all"
                                        >
                                            ACEITAR
                                        </button>
                                    )}

                                    {isCompleted && (
                                        <div
                                            style={{ backgroundColor: hexToRgba(displayColor, 0.1), color: displayColor }}
                                            className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
                                        >
                                            <CheckCircle2 size={14} />
                                            <span className="text-[10px] font-black uppercase">CONCLUÍDO</span>
                                        </div>
                                    )}
                                </div>

                                {isCompleted && exch.target_profile && (
                                    <div
                                        style={{ borderLeftColor: hexToRgba(displayColor, 0.4) }}
                                        className="mt-4 flex items-center gap-2 pl-4 border-l-2"
                                    >
                                        <ArrowRightLeft size={12} style={{ color: displayColor }} />
                                        <p className="text-[11px] font-medium text-slate-500">
                                            Assumido por <span className="font-bold text-slate-800 dark:text-slate-200">{exch.target_profile.full_name}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col bg-slate-50 dark:bg-black w-full">

            {/* Action Bar */}
            <div className="px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-primary" />
                    <h2 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-wider">Feed do Serviço</h2>
                </div>
            </div>

            {/* Feed Scroll Area */}
            <div className="flex-1 px-6 pt-2 pb-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 py-10">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
                        <p className="text-xs font-bold text-slate-400 animate-pulse">CARREGANDO FEED...</p>
                    </div>
                ) : feedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                            <Clock size={32} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Sem atividades no feed</p>
                        <p className="text-xs mt-1">Seja o primeiro a postar ou oferecer um plantão.</p>
                    </div>
                ) : (
                    <>
                        {/* System Header Update Placeholder */}
                        <div
                            style={{ backgroundColor: displayColor, boxShadow: `0 20px 25px -5px ${hexToRgba(displayColor, 0.3)}` }}
                            className="mb-8 p-4 rounded-[2rem] shadow-xl flex items-center gap-4 animate-scale-in"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                                <Rocket size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/80 uppercase tracking-widest leading-none mb-1">Escala Atualizada</p>
                                <p className="text-sm font-bold text-white leading-tight">Nova escala de Outubro já disponível para revisão e troca.</p>
                            </div>
                        </div>

                        {feedItems.map(renderFeedItem)}
                    </>
                )}
            </div>

            {/* Input Footer */}
            <div className="p-4 px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shrink-0 sticky bottom-0 z-20 pb-safe">
                {/* Mention Suggester */}
                {filteredMentionMembers.length > 0 && (
                    <div className="absolute bottom-full left-6 right-6 mb-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                        <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                            {filteredMentionMembers.map((member, idx) => (
                                <button
                                    key={member.id}
                                    onClick={() => selectMember(member)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors text-left ${selectedMentionIndex === idx
                                        ? 'bg-slate-100 dark:bg-slate-700'
                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-slate-100 dark:border-slate-600">
                                        <img src={member.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{member.profile.full_name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="relative group">
                    <input
                        type="text"
                        value={inputText}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Escreva um comentário ou informe uma troca..."
                        className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium border border-transparent focus:border-primary/50 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all shadow-inner"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        style={{ backgroundColor: displayColor, boxShadow: `0 10px 15px -3px ${hexToRgba(displayColor, 0.3)}` }}
                        className="absolute right-2 top-2 w-10 h-10 text-white rounded-xl flex items-center justify-center shadow-lg disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {isOfferModalOpen && (
                <OfferShiftModal
                    isOpen={isOfferModalOpen}
                    onClose={() => setIsOfferModalOpen(false)}
                    shifts={shifts}
                    assignments={assignments}
                    currentUserId={currentUser.id}
                    onConfirm={async (shift) => {
                        setIsOfferModalOpen(false);
                        const assignment = assignments.find(a => a.shift_id === shift.id && a.profile_id === currentUser.id);
                        if (!assignment) return;

                        try {
                            // 1. Create the structured exchange record first so it's actionable
                            await createShiftExchange({
                                group_id: group.id,
                                type: TradeType.GIVEAWAY,
                                status: TradeStatus.PENDING,
                                requesting_profile_id: currentUser.id,
                                offered_shift_assignment_id: assignment.id
                            });

                            // 2. Send the chat message for UI feed
                            await sendGroupMessage({
                                group_id: group.id,
                                sender_id: currentUser.id,
                                content: `Estou doando meu plantão do dia ${new Date(shift.date + 'T12:00:00').toLocaleDateString('pt-BR')}`,
                                message_type: 'SHIFT_OFFER',
                                metadata: { shift_id: shift.id, date: shift.date }
                            });

                            loadFeed();
                            showToast("Plantão ofertado com sucesso!", "success");
                        } catch (e) {
                            showToast("Erro ao ofertar plantão.", "error");
                        }
                    }}
                />
            )}
        </div>
    );
};

export default ServiceFeedView;
