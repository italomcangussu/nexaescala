import { supabase } from '../../lib/supabase';
import { ChatMessage } from '../../types';

// --- GROUP CHAT ---

export const fetchGroupMessages = async (groupId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
        .from('service_chat_messages')
        .select(`
            *,
            sender:profiles!sender_id(id, full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(100);

    if (error) throw error;
    return (data || []) as ChatMessage[];
};

export const sendGroupMessage = async (message: Partial<ChatMessage>): Promise<ChatMessage> => {
    const { data, error } = await supabase
        .from('service_chat_messages')
        .insert(message)
        .select(`
            *,
            sender:profiles!sender_id(id, full_name, avatar_url)
        `)
        .single();

    if (error) throw error;
    return data as ChatMessage;
};
