import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader, AlertCircle, Eye, EyeOff, CheckCircle, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Local Assets
const LOGO_LIGHT = '/assets/logo-1.png';
const LOGO_DARK = '/assets/logo-2.png';

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-emerald-400/20 dark:bg-emerald-900/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] bg-blue-400/20 dark:bg-blue-900/10 rounded-full blur-[120px] animate-pulse-slow delay-1000"></div>
                <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] bg-teal-400/20 dark:bg-teal-900/10 rounded-full blur-[100px] animate-pulse-slow delay-2000"></div>
            </div>

            <div className="max-w-md w-full backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border border-white/50 dark:border-slate-700/50 rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden relative z-10 animate-fade-in-up">

                {/* Header */}
                <div className="pt-10 pb-6 px-8 text-center">
                    <div className="flex justify-center mb-6">
                        <img
                            src={LOGO_LIGHT}
                            alt="NexaEscala"
                            className="w-40 h-40 object-contain dark:hidden transform hover:scale-105 transition-transform duration-500"
                        />
                        <img
                            src={LOGO_DARK}
                            alt="NexaEscala"
                            className="w-40 h-40 object-contain hidden dark:block transform hover:scale-105 transition-transform duration-500"
                        />
                    </div>

                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-emerald-800 to-slate-900 dark:from-white dark:via-emerald-400 dark:to-white tracking-tight mb-2">
                        NexaEscala
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Gestão inteligente para sua equipe
                    </p>
                </div>

                {/* Form Section */}
                <div className="p-8 pt-2">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 text-center">
                        {forgotPassword ? 'Recuperar Acesso' : (isSignUp ? 'Criar Nova Conta' : 'Acesse sua conta')}
                    </h2>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50/80 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Alert */}
                    {successMessage && (
                        <div className="mb-4 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-xl flex items-start gap-3 animate-fade-in">
                            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                            <span>{successMessage}</span>
                        </div>
                    )}

                    {/* Forgot Password Flow */}
                    {forgotPassword ? (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4 leading-relaxed">
                                Digite seu email cadastrado para receber as instruções de recuperação de senha.
                            </p>
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-emerald-500">
                                        <Mail size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={20} /> : 'Enviar Link de Recuperação'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setForgotPassword(false); setError(null); setSuccessMessage(null); }}
                                className="w-full py-3 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors text-sm"
                            >
                                Voltar ao Login
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleAuth} className="space-y-4">
                            {/* Sign Up Name Field */}
                            {isSignUp && (
                                <div className="animate-fade-in-up group">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium"
                                        placeholder="Ex: Ana Silva"
                                    />
                                </div>
                            )}

                            {/* Email Field */}
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="group">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Senha</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => isSignUp && setShowPasswordHints(true)}
                                        onBlur={() => setShowPasswordHints(false)}
                                        className="w-full pl-11 pr-11 p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 dark:text-slate-200 font-medium"
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Password Strength Requirements */}
                                {isSignUp && showPasswordHints && (
                                    <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2 animate-fade-in-up">
                                        <PasswordRequirement met={passwordStrength.hasMinLength} text="Mínimo 8 caracteres" />
                                        <PasswordRequirement met={passwordStrength.hasUppercase} text="Letra maiúscula" />
                                        <PasswordRequirement met={passwordStrength.hasLowercase} text="Letra minúscula" />
                                        <PasswordRequirement met={passwordStrength.hasSpecialChar} text="Caractere especial" />
                                    </div>
                                )}

                                {/* Forgot Password Link */}
                                {!isSignUp && !forgotPassword && (
                                    <div className="flex justify-end mt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setForgotPassword(true); setError(null); setSuccessMessage(null); }}
                                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
                                        >
                                            Esqueceu a senha?
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Main Action Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader className="animate-spin" size={20} /> : (isSignUp ? 'Criar Conta' : 'Entrar')}
                            </button>
                        </form>
                    )}

                    {/* Divider */}
                    {!forgotPassword && (
                        <div className="flex items-center my-6">
                            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
                            <span className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wide">ou</span>
                            <div className="flex-1 border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                    )}

                    {/* Google Login */}
                    {!forgotPassword && (
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow"
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
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                }}
                                className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            >
                                {isSignUp ? 'Já tem uma conta? ' : 'Ainda não tem conta? '}
                                <span className="font-bold underline decoration-2 decoration-transparent hover:decoration-current transition-all">
                                    {isSignUp ? 'Faça Login' : 'Cadastre-se'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Decorative bottom bar */}
                <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500"></div>
            </div>
        </div>
    );
};

export default LoginPage;
