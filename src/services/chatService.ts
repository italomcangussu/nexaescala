import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';

export const fetchGroupMessages = async (groupId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
        .from('service_chat_messages')
        .select(`
            *,
            sender:profiles (
                id,
                full_name,
                avatar_url
            )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
    }

    return (data || []) as ChatMessage[];
};

export const sendGroupMessage = async (params: {
    group_id: string;
    sender_id: string;
    content: string;
}) => {
    const { data, error } = await supabase
        .from('service_chat_messages')
        .insert({
            group_id: params.group_id,
            sender_id: params.sender_id,
            content: params.content,
            message_type: 'TEXT'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};
