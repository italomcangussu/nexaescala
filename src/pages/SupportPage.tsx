import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Phone, User, MessageCircle, Send, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Country codes for phone number
const COUNTRY_CODES = [
    { code: '+55', country: 'Brasil', flag: '🇧🇷' },
    { code: '+1', country: 'EUA/Canadá', flag: '🇺🇸' },
    { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
    { code: '+351', country: 'Portugal', flag: '🇵🇹' },
    { code: '+34', country: 'Espanha', flag: '🇪🇸' },
    { code: '+49', country: 'Alemanha', flag: '🇩🇪' },
    { code: '+33', country: 'França', flag: '🇫🇷' },
    { code: '+39', country: 'Itália', flag: '🇮🇹' },
];

const MESSAGE_TYPES = [
    { value: 'suggestion', label: 'Sugestão', icon: '💡' },
    { value: 'support', label: 'Suporte Técnico', icon: '🛠️' },
    { value: 'error', label: 'Reportar Erro', icon: '🐛' },
    { value: 'compliment', label: 'Elogio', icon: '⭐' },
    { value: 'complaint', label: 'Reclamação', icon: '📢' },
];

const SupportPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [countryCode, setCountryCode] = useState('+55');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [messageType, setMessageType] = useState('support');
    const [message, setMessage] = useState('');

    // Format phone number with mask (DDD + number)
    const formatPhoneNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, '');

        if (countryCode === '+55') {
            // Brazilian format: (11) 98765-4321
            if (cleaned.length <= 2) return cleaned;
            if (cleaned.length <= 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
            if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
        }

        // Generic format for other countries
        return cleaned;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setPhoneNumber(formatted);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Validate fields
            if (!fullName || !email || !phoneNumber || !message) {
                throw new Error('Por favor, preencha todos os campos obrigatórios.');
            }

            // Insert into Supabase
            const { error: insertError } = await supabase
                .from('support_messages')
                .insert({
                    full_name: fullName,
                    email: email,
                    country_code: countryCode,
                    phone_number: phoneNumber,
                    message_type: messageType,
                    message: message,
                    status: 'new'
                });

            if (insertError) throw insertError;

            // Success! Reset form
            setSuccess(true);
            setFullName('');
            setEmail('');
            setPhoneNumber('');
            setMessage('');
            setMessageType('support');

            // Auto redirect after 3 seconds
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err: any) {
            console.error('Support submission error:', err);
            setError(err.message || 'Erro ao enviar mensagem. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-emerald-400/20 dark:bg-emerald-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-teal-400/20 dark:bg-teal-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-blue-400/20 dark:bg-blue-900/10 rounded-full blur-[100px] animate-pulse-slow delay-2000"></div>
            </div>

            <div className="max-w-3xl w-full backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden relative z-10 animate-fade-in-up">

                {/* Header */}
                <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-600 p-8 text-center">
                    <h1 className="text-4xl font-extrabold text-white mb-2">Central de Suporte</h1>
                    <p className="text-emerald-100 font-medium">Estamos aqui para ajudar você! ✨</p>
                </div>

                {/* Success Message */}
                {success ? (
                    <div className="p-12 text-center animate-fade-in">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-6 animate-bounce-slow">
                            <CheckCircle size={48} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">Mensagem Enviada com Sucesso! 🎉</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-2">
                            Recebemos sua mensagem e entraremos em contato em breve.
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                            Redirecionando para o início...
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Error Alert */}
                        {error && (
                            <div className="p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-start gap-3 animate-shake">
                                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Full Name */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                <User size={16} />
                                Nome Completo *
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium"
                                placeholder="Ex: João Silva"
                            />
                        </div>

                        {/* Email */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                <Mail size={16} />
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium"
                                placeholder="seu@email.com"
                            />
                        </div>

                        {/* Phone Number with Country Code */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                <Phone size={16} />
                                Telefone *
                            </label>
                            <div className="flex gap-3">
                                <select
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className="w-1/3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium"
                                >
                                    {COUNTRY_CODES.map((item) => (
                                        <option key={item.code} value={item.code}>
                                            {item.flag} {item.code}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
                                    className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium"
                                    placeholder={countryCode === '+55' ? '(11) 98765-4321' : 'Número de telefone'}
                                />
                            </div>
                        </div>

                        {/* Message Type Selector */}
                        <div className="group">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                <MessageCircle size={16} />
                                Tipo de Mensagem *
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {MESSAGE_TYPES.map((type) => (
                                    <button
                                        key={type.value}
                                        type="button"
                                        onClick={() => setMessageType(type.value)}
                                        className={`p-4 rounded-xl border-2 transition-all font-semibold text-sm flex flex-col items-center gap-2 ${messageType === type.value
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 shadow-lg shadow-emerald-500/20'
                                            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-700'
                                            }`}
                                    >
                                        <span className="text-2xl">{type.icon}</span>
                                        <span>{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Message */}
                        <div className="group">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Sua Mensagem *
                            </label>
                            <textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={6}
                                className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium resize-none"
                                placeholder="Descreva sua dúvida, sugestão ou feedback aqui..."
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                {message.length} / 2000 caracteres
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="flex-1 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 py-4 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${loading
                                    ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed text-slate-500 dark:text-slate-400 shadow-none'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="animate-spin" size={20} />
                                        Enviando...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Enviar Mensagem
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        📧 Sua mensagem será respondida em até 24 horas • 💚 Obrigado por usar o NexaEscala
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupportPage;
