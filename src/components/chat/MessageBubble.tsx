import React from 'react';
import { ChatMessage, Profile } from '../../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageBubbleProps {
    message: ChatMessage;
    currentUser: Profile;
    isOwnMessage: boolean;
    showAvatar: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, currentUser, isOwnMessage, showAvatar }) => {

    const safeFormat = (dateStr: string | undefined, formatStr: string) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            return format(date, formatStr, { locale: ptBR });
        } catch (e) {
            return '';
        }
    };

    const time = safeFormat(message.created_at, 'HH:mm');

    return (
        <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full overflow-hidden shrink-0 bg-gray-200 dark:bg-slate-700 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                {message.sender?.avatar_url && (
                    <img src={message.sender.avatar_url} alt={message.sender.full_name} className="w-full h-full object-cover" />
                )}
            </div>

            <div className={`flex flex-col max-w-[85%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                {!isOwnMessage && showAvatar && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1 mb-1 font-medium truncate max-w-full">
                        {message.sender?.full_name?.split(' ')[0]}
                    </span>
                )}

                <div
                    className={`px-4 py-2 rounded-2xl shadow-sm relative group
            ${isOwnMessage
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-br-none'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-none'
                        }`}
                >
                    <p className="text-sm break-words whitespace-pre-wrap leading-relaxed">{message.content || ''}</p>
                    <span className={`text-[9px] block text-right mt-1 opacity-70 ${isOwnMessage ? 'text-white/80' : 'text-slate-400'}`}>
                        {time}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
