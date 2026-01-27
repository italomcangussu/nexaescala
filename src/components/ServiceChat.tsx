import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Plus } from 'lucide-react';
// import { supabase } from '../lib/supabase';
import { ChatMessage, Profile, Group, Shift, ShiftAssignment } from '../types';
// import { fetchGroupMessages, sendGroupMessage, createShiftExchange, TradeType, TradeStatus } from '../services/api';
// import MessageBubble from './chat/MessageBubble';
// import OfferShiftModal from './chat/OfferShiftModal';

interface ServiceChatProps {
    group: Group;
    currentUser: Profile;
    shifts?: Shift[];
    assignments?: ShiftAssignment[];
}

const ServiceChat: React.FC<ServiceChatProps> = ({
    group,
    currentUser,

}) => {
    // State
    const [messages /*, setMessages */] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    // const [isLoading, setIsLoading] = useState(true);
    // const [error, setError] = useState<string | null>(null);
    // const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    // const mountedRef = useRef(true);

    // Helpers
    /* const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }; */

    // Load Messages
    // Load Messages
    const loadMessages = useCallback(async () => {
        // if (!group?.id) return;

        // try {
        //     setIsLoading(true);
        //     const data = await fetchGroupMessages(group.id);

        //     if (mountedRef.current) {
        //         setMessages(Array.isArray(data) ? data : []);
        //         setError(null);
        //     }
        // } catch (err) {
        //     console.error("Failed to load messages:", err);
        //     if (mountedRef.current) {
        //         setError("Não foi possível carregar as mensagens.");
        //     }
        // } finally {
        //     if (mountedRef.current) {
        //         setIsLoading(false);
        //         // Scroll to bottom after initial load
        //         setTimeout(scrollToBottom, 100);
        //     }
        // }
    }, [group?.id]);

    // Initial Load & Realtime
    useEffect(() => {
        // console.log("ServiceChat mounted", { group, currentUser });
        // mountedRef.current = true;
        // loadMessages();

        // // Realtime Subscription
        // let channel: any = null;
        // try {
        //     channel = supabase
        //         .channel(`group_chat_${group.id}`)
        //         .on(
        //             'postgres_changes',
        //             {
        //                 event: 'INSERT',
        //                 schema: 'public',
        //                 table: 'service_chat_messages',
        //                 filter: `group_id=eq.${group.id}`
        //             },
        //             async (payload) => {
        //                  // Safely handle new message
        //                  const newMessageBase = payload.new as ChatMessage;

        //                  // Fetch full message to get sender details
        //                  const { data: fullMessage } = await supabase
        //                     .from('service_chat_messages')
        //                     .select('*, sender:profiles(*)')
        //                     .eq('id', newMessageBase.id)
        //                     .single();

        //                  if (mountedRef.current && fullMessage) {
        //                      setMessages(prev => {
        //                          const safePrev = Array.isArray(prev) ? prev : [];
        //                          // Dedup just in case
        //                          if (safePrev.some(m => m.id === fullMessage.id)) return safePrev;
        //                          return [...safePrev, fullMessage as ChatMessage];
        //                      });
        //                      setTimeout(scrollToBottom, 100);
        //                  }
        //             }
        //         )
        //         .subscribe((status) => {
        //             console.log(`Chat subscription status: ${status}`);
        //         });
        // } catch (subError) {
        //     console.error("Realtime subscription error:", subError);
        // }

        // return () => {
        //     mountedRef.current = false;
        //     if (channel) supabase.removeChannel(channel);
        // };
    }, [group?.id, loadMessages]);

    // Handlers
    // const handleSend = async () => {
    //     if (!inputText.trim() || !currentUser?.id) return;

    //     const content = inputText.trim();
    //     setInputText(''); // Optimistic clear

    //     try {
    //         await sendGroupMessage({
    //             group_id: group.id,
    //             sender_id: currentUser.id,
    //             content: content,
    //             message_type: 'TEXT'
    //         });
    //         // Realtime will pick it up
    //     } catch (err) {
    //         console.error("Error sending message:", err);
    //         setError("Erro ao enviar mensagem.");
    //         setInputText(content); // Restore
    //     }
    // };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // handleSend();
        }
    };

    // const handleOfferShift = async (shift: Shift) => {
    //     setIsOfferModalOpen(false);
    //     if (!shift?.id || !currentUser?.id) return;

    //     try {
    //         // Find assignment
    //         const assignment = (assignments || []).find(a => a.shift_id === shift.id && a.profile_id === currentUser.id);

    //         if (!assignment) {
    //             alert("Erro: Escala não encontrada para este plantão.");
    //             return;
    //         }

    //         // 1. Create message
    //         await sendGroupMessage({
    //             group_id: group.id,
    //             sender_id: currentUser.id,
    //             content: `Estou doando meu plantão do dia ${shift.date}`,
    //             message_type: 'SHIFT_OFFER',
    //             metadata: {
    //                 shift_id: shift.id,
    //                 date: shift.date,
    //                 start_time: shift.start_time,
    //                 end_time: shift.end_time
    //             }
    //         });

    //         // 2. Create Exchange
    //         await createShiftExchange({
    //             group_id: group.id,
    //             requesting_profile_id: currentUser.id,
    //             offered_shift_assignment_id: assignment.id,
    //             type: TradeType.GIVEAWAY,
    //             status: TradeStatus.PENDING
    //         });

    //     } catch (err) {
    //         console.error("Error offering shift:", err);
    //         alert("Erro ao ofertar plantão.");
    //     }
    // };

    // Safely render content
    if (!group || !currentUser) {
        return <div className="p-4 text-center text-red-500">Erro: Dados do chat inválidos.</div>;
    }

    return (
        <div className="flex flex-col h-[500px] lg:h-[600px] border rounded-2xl bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-800 overflow-hidden shadow-inner">

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* {isLoading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full text-red-400">
                        <AlertCircle size={32} className="mb-2" />
                        <p className="text-sm">{error}</p>
                        <button onClick={loadMessages} className="mt-2 text-primary text-xs underline">Tentar novamente</button>
                    </div>
                ) : */ (!messages || messages.length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                            <p className="text-sm">Nenhuma mensagem ainda.</p>
                            <p className="text-xs">Comece a conversa!</p>
                        </div>
                    ) : (
                        <div className="text-center p-4">Messages disabled for debug</div>
                        // messages.map(msg => (
                        //     <MessageBubble
                        //         key={msg.id || Math.random().toString()}
                        //         message={msg}
                        //         currentUser={currentUser}
                        //         isOwnMessage={msg.sender_id === currentUser.id}
                        //         showAvatar={msg.sender_id !== currentUser.id}
                        //         // onAcceptOffer={handleAcceptOffer} // Disabled for now to simplify
                        //         onAcceptOffer={(mId, sId) => alert("Funcionalidade em desenvolvimento.")}
                        //     />
                        // ))
                    )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex items-end gap-2">
                <button
                    // onClick={() => setIsOfferModalOpen(true)}
                    className="p-3 text-slate-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                    title="Ofertar/Trocar Plantão"
                >
                    <Plus size={24} />
                </button>

                <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl flex items-center px-4 py-2 border border-transparent focus-within:border-primary/50 transition-colors">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite uma mensagem..."
                        className="w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 resize-none max-h-24 py-2"
                        rows={1}
                        style={{ minHeight: '40px' }}
                    />
                </div>

                <button
                    // onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 transition-all"
                >
                    <Send size={20} />
                </button>
            </div>

            {/* Modal - Conditional Render */}
            {/* {isOfferModalOpen && (
                <OfferShiftModal
                    isOpen={isOfferModalOpen}
                    onClose={() => setIsOfferModalOpen(false)}
                    shifts={shifts}
                    assignments={assignments}
                    currentUserId={currentUser.id}
                    onConfirm={handleOfferShift}
                />
            )} */}
        </div>
    );
};

export default ServiceChat;
