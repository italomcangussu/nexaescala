import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Mail,
    Phone,
    MessageCircle,
    Send,
    Loader,
    CheckCircle,
    Eye,
    AlertCircle,
    Clock,
    Filter,
    Search,
    X,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface SupportMessage {
    id: string;
    full_name: string;
    email: string;
    country_code: string;
    phone_number: string;
    message_type: 'suggestion' | 'support' | 'error' | 'compliment' | 'complaint';
    message: string;
    status: 'new' | 'read' | 'answered';
    admin_response: string | null;
    created_at: string;
    updated_at: string;
}

const MESSAGE_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    suggestion: { label: 'Sugestão', icon: '💡', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    support: { label: 'Suporte', icon: '🛠️', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
    error: { label: 'Erro', icon: '🐛', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
    compliment: { label: 'Elogio', icon: '⭐', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
    complaint: { label: 'Reclamação', icon: '📢', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    new: { label: 'Nova', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    read: { label: 'Lida', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    answered: { label: 'Respondida', color: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' },
};

const SupportAdminPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [filteredMessages, setFilteredMessages] = useState<SupportMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
    const [response, setResponse] = useState('');
    const [sendingResponse, setSendingResponse] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Check if user is admin
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        // Check if user email is admin (you can enhance this)
        const adminEmails = ['italomcangussu@icloud.com'];
        if (!adminEmails.includes(user.email || '')) {
            navigate('/');
            return;
        }
    }, [user, navigate]);

    // Load messages
    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('support_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            setMessages(data || []);
            setFilteredMessages(data || []);
        } catch (err: any) {
            console.error('Error loading messages:', err);
            setError('Erro ao carregar mensagens.');
        } finally {
            setLoading(false);
        }
    };

    // Apply filters
    useEffect(() => {
        let filtered = messages;

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(m => m.status === statusFilter);
        }

        // Type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(m => m.message_type === typeFilter);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(m =>
                m.full_name.toLowerCase().includes(query) ||
                m.email.toLowerCase().includes(query) ||
                m.message.toLowerCase().includes(query)
            );
        }

        setFilteredMessages(filtered);
    }, [statusFilter, typeFilter, searchQuery, messages]);

    const handleViewMessage = async (message: SupportMessage) => {
        setSelectedMessage(message);
        setResponse('');

        // Mark as read if it's new
        if (message.status === 'new') {
            await updateMessageStatus(message.id, 'read');
        }
    };

    const updateMessageStatus = async (messageId: string, status: 'read' | 'answered') => {
        try {
            const { error } = await supabase
                .from('support_messages')
                .update({ status })
                .eq('id', messageId);

            if (error) throw error;

            // Update local state
            setMessages(messages.map(m => m.id === messageId ? { ...m, status } : m));
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleSendResponse = async () => {
        if (!selectedMessage || !response.trim()) return;

        setSendingResponse(true);
        setError(null);

        try {
            // Update message with response in database
            const { error: updateError } = await supabase
                .from('support_messages')
                .update({
                    admin_response: response,
                    status: 'answered'
                })
                .eq('id', selectedMessage.id);

            if (updateError) throw updateError;

            // Send email via Supabase Edge Function
            try {
                const { data: { session } } = await supabase.auth.getSession();

                const emailResponse = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-support-email`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`,
                        },
                        body: JSON.stringify({
                            to: selectedMessage.email,
                            subject: `Resposta do Suporte NexaEscala - ${MESSAGE_TYPE_LABELS[selectedMessage.message_type].label}`,
                            userName: selectedMessage.full_name,
                            userMessage: selectedMessage.message,
                            adminResponse: response,
                            messageType: selectedMessage.message_type,
                        }),
                    }
                );

                if (!emailResponse.ok) {
                    console.error('Email sending failed:', await emailResponse.text());
                    // Continue anyway - message was saved
                }
            } catch (emailError) {
                console.error('Error sending email:', emailError);
                // Continue anyway - message was saved
            }

            // Update local state
            setMessages(messages.map(m =>
                m.id === selectedMessage.id
                    ? { ...m, admin_response: response, status: 'answered' }
                    : m
            ));

            setSelectedMessage(null);
            setResponse('');

            alert('Resposta enviada com sucesso! ✅\nO usuário receberá um email em breve.');
        } catch (err: any) {
            console.error('Error sending response:', err);
            setError('Erro ao enviar resposta.');
        } finally {
            setSendingResponse(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const stats = {
        total: messages.length,
        new: messages.filter(m => m.status === 'new').length,
        read: messages.filter(m => m.status === 'read').length,
        answered: messages.filter(m => m.status === 'answered').length,
    };

    return (
        <div className="min-h-screen bg-surface dark:bg-background-dark">
            {/* Header */}
            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-600 p-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Voltar
                    </button>
                    <h1 className="text-3xl font-extrabold text-white mb-2">Central de Suporte - Admin</h1>
                    <p className="text-emerald-100">Gerencie todas as mensagens de suporte dos usuários</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Total</div>
                        <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-emerald-200 dark:border-emerald-800 shadow-sm">
                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Novas</div>
                        <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.new}</div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-blue-200 dark:border-blue-800 shadow-sm">
                        <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">Lidas</div>
                        <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.read}</div>
                    </div>
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Respondidas</div>
                        <div className="text-3xl font-bold text-slate-700 dark:text-slate-300">{stats.answered}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={20} className="text-slate-500" />
                        <h2 className="font-bold text-slate-800 dark:text-slate-100">Filtros</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por nome, email ou mensagem..."
                                className="w-full pl-10 pr-4 py-2 bg-surface dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 dark:text-slate-200"
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 bg-surface dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="new">Novas</option>
                            <option value="read">Lidas</option>
                            <option value="answered">Respondidas</option>
                        </select>

                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 bg-surface dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-slate-800 dark:text-slate-200"
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value="suggestion">Sugestões</option>
                            <option value="support">Suporte</option>
                            <option value="error">Erros</option>
                            <option value="compliment">Elogios</option>
                            <option value="complaint">Reclamações</option>
                        </select>
                    </div>
                </div>

                {/* Messages List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="animate-spin text-emerald-600" size={32} />
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="bg-white dark:bg-surface-dark rounded-xl p-12 text-center border border-slate-200 dark:border-slate-800">
                        <MessageCircle size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                        <p className="text-slate-500 dark:text-slate-400">Nenhuma mensagem encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredMessages.map((message) => (
                            <div
                                key={message.id}
                                className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => handleViewMessage(message)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${MESSAGE_TYPE_LABELS[message.message_type].color}`}>
                                                {MESSAGE_TYPE_LABELS[message.message_type].icon} {MESSAGE_TYPE_LABELS[message.message_type].label}
                                            </span>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[message.status].color}`}>
                                                {STATUS_LABELS[message.status].label}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                                            {message.full_name}
                                        </h3>

                                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                                            <span className="flex items-center gap-1">
                                                <Mail size={14} />
                                                {message.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Phone size={14} />
                                                {message.country_code} {message.phone_number}
                                            </span>
                                        </div>

                                        <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                                            {message.message}
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatDate(message.created_at)}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewMessage(message);
                                            }}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <Eye size={16} />
                                            Ver Detalhes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Message Detail Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                        {/* Modal Header */}
                        <div className="bg-linear-to-r from-emerald-600 to-teal-600 p-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{selectedMessage.full_name}</h2>
                                <p className="text-emerald-100 text-sm">{selectedMessage.email}</p>
                            </div>
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Message Details */}
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${MESSAGE_TYPE_LABELS[selectedMessage.message_type].color}`}>
                                        {MESSAGE_TYPE_LABELS[selectedMessage.message_type].icon} {MESSAGE_TYPE_LABELS[selectedMessage.message_type].label}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[selectedMessage.status].color}`}>
                                        {STATUS_LABELS[selectedMessage.status].label}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                                        {formatDate(selectedMessage.created_at)}
                                    </span>
                                </div>

                                <div className="bg-surface dark:bg-slate-800 rounded-xl p-4 mb-4">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Contato:</h3>
                                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                        <p className="flex items-center gap-2">
                                            <Phone size={14} />
                                            {selectedMessage.country_code} {selectedMessage.phone_number}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-surface dark:bg-slate-800 rounded-xl p-4">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mensagem:</h3>
                                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                        {selectedMessage.message}
                                    </p>
                                </div>
                            </div>

                            {/* Previous Admin Response */}
                            {selectedMessage.admin_response && (
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                                        <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Resposta Enviada:</h3>
                                    </div>
                                    <p className="text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap text-sm">
                                        {selectedMessage.admin_response}
                                    </p>
                                </div>
                            )}

                            {/* Response Form */}
                            {selectedMessage.status !== 'answered' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Responder ao Usuário:
                                    </label>
                                    <textarea
                                        value={response}
                                        onChange={(e) => setResponse(e.target.value)}
                                        rows={6}
                                        className="w-full p-4 bg-surface dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 resize-none"
                                        placeholder="Digite sua resposta aqui. Ela será enviada para o email do usuário..."
                                    />

                                    {error && (
                                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                            <AlertCircle size={16} />
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex gap-3 mt-4">
                                        <button
                                            onClick={() => setSelectedMessage(null)}
                                            className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleSendResponse}
                                            disabled={sendingResponse || !response.trim()}
                                            className={`flex-1 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${sendingResponse || !response.trim()
                                                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                }`}
                                        >
                                            {sendingResponse ? (
                                                <>
                                                    <Loader className="animate-spin" size={18} />
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={18} />
                                                    Enviar Resposta
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportAdminPage;
