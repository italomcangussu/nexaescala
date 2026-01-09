import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader, AlertCircle, Eye, EyeOff, CheckCircle, Circle } from 'lucide-react';

// Logo URL from Supabase Storage
const LOGO_URL = 'https://vjlcfkkyfeteljutwfet.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_yup0wjyup0wjyup0.png';

// Error message translations
const ERROR_MESSAGES: Record<string, string> = {
    'Invalid login credentials': 'Email ou senha incorretos. Verifique e tente novamente.',
    'User already registered': 'Este email já possui conta. Faça login.',
    'Email not confirmed': 'Confirme seu email para continuar.',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
    'Unable to validate email address: invalid format': 'Formato de email inválido.',
};

const getErrorMessage = (error: string): string => {
    return ERROR_MESSAGES[error] || error;
};

interface PasswordStrength {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasSpecialChar: boolean;
}

const checkPasswordStrength = (password: string): PasswordStrength => ({
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password),
});

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fullName, setFullName] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordHints, setShowPasswordHints] = useState(false);
    const [forgotPassword, setForgotPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const navigate = useNavigate();
    const { user } = useAuth();

    React.useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    const passwordStrength = checkPasswordStrength(password);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                // Validate password strength
                if (!passwordStrength.hasMinLength || !passwordStrength.hasUppercase || !passwordStrength.hasLowercase || !passwordStrength.hasSpecialChar) {
                    throw new Error('A senha não atende aos requisitos mínimos');
                }

                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                        emailRedirectTo: window.location.origin
                    }
                });
                if (error) throw error;

                // Auto-login: If user is created and session exists, they're logged in
                if (data.user && data.session) {
                    // Force reload to trigger AuthContext detection
                    window.location.href = '/';
                    return;
                } else if (data.user && !data.session) {
                    // Email confirmation required - show success message not error
                    setSuccessMessage('Conta criada! Verifique seu email para confirmar o cadastro.');
                    setLoading(false);
                    return;
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(getErrorMessage(err.message || 'Ocorreu um erro'));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            setError(getErrorMessage(err.message || 'Erro ao conectar com Google'));
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Digite seu email para recuperar a senha.');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`
            });
            if (error) throw error;
            setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
        } catch (err: any) {
            setError(getErrorMessage(err.message || 'Erro ao enviar email de recuperação'));
        } finally {
            setLoading(false);
        }
    };

    const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
        <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${met ? 'text-emerald-600' : 'text-red-500'}`}>
            {met ? <CheckCircle size={14} /> : <Circle size={14} />}
            <span>{text}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden animate-fade-in-up">

                {/* Header with Logo */}
                <div className="relative bg-gradient-to-br from-primary/10 via-emerald-50 to-teal-50/50 dark:from-primary/20 dark:via-slate-800 dark:to-slate-800 p-8 text-center overflow-hidden">
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-primary to-teal-500"></div>
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>

                    {/* Logo */}
                    <div className="relative inline-flex p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-lg shadow-emerald-100 dark:shadow-none mb-4">
                        <img
                            src={LOGO_URL}
                            alt="NexaEscala"
                            className="w-16 h-16 object-contain"
                            onError={(e) => {
                                // Fallback if logo fails to load
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>

                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-teal-600 bg-clip-text text-transparent">
                        NexaEscala
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Gestão Inteligente de Plantões
                    </p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
                        {forgotPassword ? 'Recuperar Senha' : (isSignUp ? 'Crie sua conta' : 'Bem-vindo de volta')}
                    </h2>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-start gap-3 animate-fade-in-up">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Alert */}
                    {successMessage && (
                        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl flex items-start gap-3 animate-fade-in-up">
                            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Forgot Password Form */}
                    {forgotPassword ? (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
                                Digite seu email e enviaremos um link para redefinir sua senha.
                            </p>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={20} /> : 'Enviar Link'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setForgotPassword(false); setError(null); setSuccessMessage(null); }}
                                className="w-full py-3 text-slate-500 hover:text-emerald-600 font-medium transition-colors"
                            >
                                Voltar ao Login
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleAuth} className="space-y-4">
                            {/* Full Name (Sign Up only) */}
                            {isSignUp && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                                        placeholder="Dr. João Silva"
                                    />
                                </div>
                            )}

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-slate-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => isSignUp && setShowPasswordHints(true)}
                                        onBlur={() => setShowPasswordHints(false)}
                                        className="w-full pl-11 pr-11 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Password Requirements (Sign Up only) */}
                                {isSignUp && showPasswordHints && (
                                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1.5 animate-fade-in-up">
                                        <PasswordRequirement met={passwordStrength.hasMinLength} text="Mínimo 8 caracteres" />
                                        <PasswordRequirement met={passwordStrength.hasUppercase} text="Pelo menos uma letra maiúscula" />
                                        <PasswordRequirement met={passwordStrength.hasLowercase} text="Pelo menos uma letra minúscula" />
                                        <PasswordRequirement met={passwordStrength.hasSpecialChar} text="Pelo menos um caractere especial (!@#$%...)" />
                                    </div>
                                )}

                                {/* Forgot Password Link */}
                                {!isSignUp && !forgotPassword && (
                                    <button
                                        type="button"
                                        onClick={() => { setForgotPassword(true); setError(null); setSuccessMessage(null); }}
                                        className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        Esqueceu a senha?
                                    </button>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl hover:shadow-emerald-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={20} /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    {!forgotPassword && (
                        <div className="flex items-center my-6">
                            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
                            <span className="px-4 text-sm text-slate-400">ou</span>
                            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                    )}

                    {/* Google Login Button */}
                    {!forgotPassword && (
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continuar com Google
                        </button>
                    )}

                    {/* Toggle Sign Up / Sign In */}
                    {!forgotPassword && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                }}
                                className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors"
                            >
                                {isSignUp ? 'Já tem conta? Entrar' : 'Não tem conta? Cadastre-se'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
