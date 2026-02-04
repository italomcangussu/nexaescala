import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Loader, AlertCircle, Eye, EyeOff, CheckCircle, Circle, MessageSquare, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { Capacitor } from '@capacitor/core';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import Logo from '../components/Logo';
import LegalModal from '../components/LegalModal';



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
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'terms' | 'privacy' }>({
        isOpen: false,
        type: 'terms'
    });

    const navigate = useNavigate();
    const { user } = useAuth();
    const { isDesktop } = useDeviceDetection();

    // Re-check for desktop since we want the "fill the screen" experience
    const shouldUseDesktopLayout = isDesktop && window.innerWidth >= 1024;

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
                if (!acceptedTerms) {
                    throw new Error('Você precisa aceitar os Termos de Uso e Política de Privacidade.');
                }
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

                if (data.user && data.session) {
                    window.location.href = '/';
                    return;
                } else if (data.user && !data.session) {
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

    const handleAppleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            if (Capacitor.isNativePlatform()) {
                const result = await SignInWithApple.authorize({
                    clientId: 'com.nexaescala.app',
                    redirectURI: 'https://vjlcfkkyfeteljutwfet.supabase.co/auth/v1/callback',
                    scopes: 'name email',
                });

                if (result.response.identityToken) {
                    const { givenName, familyName, email } = result.response;

                    const { error } = await supabase.auth.signInWithIdToken({
                        provider: 'apple',
                        token: result.response.identityToken,
                    });
                    if (error) throw error;

                    // Apple only provides name on FIRST sign-in
                    const appleFullName = [givenName, familyName]
                        .filter(Boolean).join(' ').trim();

                    if (appleFullName) {
                        try {
                            await supabase.auth.updateUser({
                                data: { full_name: appleFullName }
                            });
                            const { data: { user: currentUser } } = await supabase.auth.getUser();
                            if (currentUser) {
                                await supabase.from('profiles').update({
                                    full_name: appleFullName,
                                    ...(email ? { email } : {})
                                }).eq('id', currentUser.id);
                            }
                        } catch (metadataError) {
                            console.warn('Could not update Apple user metadata:', metadataError);
                        }
                    }
                }
            } else {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'apple',
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                if (error) throw error;
            }
        } catch (err: any) {
            console.error('Apple Login Error:', err);
            setError(getErrorMessage(err.message || 'Erro ao conectar com Apple'));
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
        <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
            {met ? <CheckCircle size={14} className="text-emerald-500" /> : <Circle size={14} />}
            <span>{text}</span>
        </div>
    );

    const renderAuthForm = () => (
        <div className="w-full max-w-sm mx-auto space-y-6 animate-fade-in-up">
            <div className="text-center mb-8 lg:text-left">
                <h2 className="text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    {forgotPassword ? 'Recuperar Acesso' : (isSignUp ? 'Comece Agora' : 'Bem-vindo de volta')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                    {forgotPassword
                        ? 'Enviaremos um link para resetar sua senha.'
                        : (isSignUp ? 'Crie sua conta em poucos segundos.' : 'Insira seus dados para entrar na plataforma.')}
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-2xl flex items-start gap-3 animate-shake">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Success Alert */}
            {successMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-sm rounded-2xl flex items-start gap-3 animate-fade-in">
                    <CheckCircle size={20} className="shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                </div>
            )}

            {forgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email Profissional</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                                <Mail size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-surface dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 dark:text-white font-medium"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-none hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : 'Enviar Recuperação'}
                    </button>
                    <button
                        type="button"
                        onClick={() => { setForgotPassword(false); setError(null); setSuccessMessage(null); }}
                        className="w-full text-center text-sm font-bold text-slate-400 hover:text-primary transition-colors pt-2"
                    >
                        Voltar ao Login
                    </button>
                </form>
            ) : (
                <form onSubmit={handleAuth} className="space-y-5">
                    {isSignUp && (
                        <div className="space-y-1.5 animate-fade-in-up">
                            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3.5 bg-surface dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 dark:text-white font-medium"
                                placeholder="Como deseja ser chamado?"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                                <Mail size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-surface dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 dark:text-white font-medium"
                                placeholder="seu@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold text-slate-500 uppercase">Senha</label>
                            {!isSignUp && (
                                <button
                                    type="button"
                                    onClick={() => setForgotPassword(true)}
                                    className="text-[10px] font-black text-primary uppercase tracking-wider hover:opacity-80 transition-opacity"
                                >
                                    Esqueceu?
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
                                <Lock size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => isSignUp && setShowPasswordHints(true)}
                                onBlur={() => setShowPasswordHints(false)}
                                className="w-full pl-12 pr-12 py-3.5 bg-surface dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-slate-800 dark:text-white font-medium"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {isSignUp && showPasswordHints && (
                            <div className="mt-3 p-3.5 bg-surface dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-2xl space-y-2.5 animate-fade-in">
                                <PasswordRequirement met={passwordStrength.hasMinLength} text="Pelo menos 8 caracteres" />
                                <PasswordRequirement met={passwordStrength.hasUppercase} text="Uma letra maiúscula" />
                                <PasswordRequirement met={passwordStrength.hasLowercase} text="Uma letra minúscula" />
                                <PasswordRequirement met={passwordStrength.hasSpecialChar} text="Um caractere especial" />
                            </div>
                        )}
                    </div>

                    {isSignUp && (
                        <div className="flex items-start gap-3 px-1 animate-fade-in">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded-lg border-slate-300 text-primary focus:ring-primary/20 transition-all accent-primary cursor-pointer"
                            />
                            <label htmlFor="terms" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed cursor-pointer select-none">
                                Li e aceito os <button type="button" onClick={() => setLegalModal({ isOpen: true, type: 'terms' })} className="font-bold text-primary hover:underline bg-transparent border-none p-0 inline">Termos de Uso</button> e <button type="button" onClick={() => setLegalModal({ isOpen: true, type: 'privacy' })} className="font-bold text-primary hover:underline bg-transparent border-none p-0 inline">Políticas de Privacidade</button>.
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (isSignUp && !acceptedTerms)}
                        className={`group w-full py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 ${loading || (isSignUp && !acceptedTerms) ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : ''}`}
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : (isSignUp ? 'Criar minha conta' : 'Acessar plataforma')}
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            )}

            {!forgotPassword && (
                <>
                    <div className="relative flex items-center py-2">
                        <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                        <span className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ou entre com</span>
                        <div className="flex-1 border-t border-slate-200 dark:border-slate-800"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-surface dark:hover:bg-slate-800 transition-all shadow-sm group"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Google</span>
                        </button>

                        <button
                            onClick={handleAppleLogin}
                            className="flex items-center justify-center gap-2.5 p-3.5 bg-slate-900 dark:bg-white border border-slate-900 dark:border-white rounded-2xl hover:bg-black dark:hover:bg-slate-100 transition-all shadow-sm group"
                        >
                            <svg className="w-5 h-5 fill-white dark:fill-slate-900 group-hover:scale-110 transition-transform" viewBox="0 0 384 512">
                                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-83.6-20.8-44.1 0-93.7 32.7-115.1 76-24.8 49.3-15.6 131.7 19.5 204.6 15.6 32.5 40.5 68.3 75.2 68.3 31.4 0 46.5-21.7 89.2-21.7 41.6 0 54.4 21.7 89.2 21.7 35.5 0 57.6-31.1 77.2-61.9 22-31.7 31-62.4 31.3-63.9-.8-.4-60.6-23.3-60.6-94.8zm-51.1-131c3.8-31.5-13.8-63.8-40.7-80.1-5.1-3-11.1-5.3-16.7-6.5-2.8-5.3-6.5-10.4-11.1-14.9-20.2-19.8-51.9-20.7-72.1-12.7-2.6 1.1-4.9 2.4-7.1 3.9 33.7 33.7 26.5 83.9 2.4 115 28.5 3.3 58.7-10.8 77.7-33.8 11.5-13.9 17.6-31.5 17.6-50.9z" />
                            </svg>
                            <span className="text-sm font-bold text-white dark:text-slate-900">Apple</span>
                        </button>
                    </div>

                    <div className="text-center pt-6">
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
                            className="text-sm font-bold text-slate-500 hover:text-primary transition-all underline underline-offset-4 decoration-primary/30"
                        >
                            {isSignUp ? 'Já possui conta? Faça Login' : 'Não tem conta? Crie uma agora'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    if (shouldUseDesktopLayout) {
        return (
            <div className="min-h-screen bg-white dark:bg-background-dark flex overflow-hidden">
                {/* Visual Left Side */}
                <div className="hidden lg:flex w-7/12 relative bg-slate-900 overflow-hidden items-center justify-center p-12">
                    {/* Dynamic Background */}
                    <div className="absolute inset-0">
                        <div className="absolute top-0 right-0 w-[80%] h-[80%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                        <div className="absolute bottom-0 left-0 w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>

                        {/* Grid Pattern Overlay */}
                        <div className="absolute inset-x-0 inset-y-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
                    </div>

                    <div className="relative z-10 w-full max-w-2xl text-center">
                        <div className="mb-10 inline-block p-8 bg-white/5 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl animate-float">
                            <Logo className="w-48 h-48 text-primary" />
                        </div>

                        <div className="space-y-6">
                            <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tight">
                                Transforme sua <br />
                                <span className="text-primary italic">gestão de escalas</span>
                            </h1>
                            <p className="text-xl text-slate-400 font-medium max-w-lg mx-auto leading-relaxed">
                                A solução completa para plantões médicos, automação de trocas e controle financeiro integrado.
                            </p>
                        </div>

                        <div className="mt-16 grid grid-cols-2 gap-8 text-left">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                                    <ShieldCheck className="text-primary" size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">Segurança Total</h4>
                                    <p className="text-sm text-slate-500">Dados criptografados e controle de acesso rigoroso.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center shrink-0 border border-amber-500/20">
                                    <Sparkles className="text-amber-500" size={24} />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white">Automático</h4>
                                    <p className="text-sm text-slate-500">Regras de repasse e trocas validadas por IA.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Branding Watermark */}
                    <div className="absolute bottom-10 left-12 flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <span className="text-white/20 font-black tracking-widest text-sm uppercase">NexaEscala • 2024</span>
                    </div>
                </div>

                {/* Form Right Side */}
                <div className="w-full lg:w-5/12 flex items-center justify-center p-8 lg:p-16 relative bg-white dark:bg-surface-dark border-l border-slate-100 dark:border-slate-800">
                    <div className="w-full max-w-md h-full flex flex-col justify-center">
                        {/* Mobile-only logo */}
                        <div className="lg:hidden flex justify-center mb-10">
                            <Logo className="w-20 h-20 text-primary" />
                        </div>

                        {renderAuthForm()}

                        <div className="mt-auto pt-10 text-center">
                            <button
                                onClick={() => navigate('/suporte')}
                                className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-primary transition-all uppercase tracking-[0.2em]"
                            >
                                <MessageSquare size={14} />
                                Suporte Especializado
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default Mobile-Responsive Layout
    return (
        <div className="min-h-screen bg-surface dark:bg-background-dark flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 opacity-50">
                <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-emerald-400/20 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute -bottom-[20%] right-[20%] w-[50%] h-[50%] bg-blue-400/20 rounded-full blur-[100px] animate-pulse-slow delay-2000"></div>
            </div>

            <div className="max-w-md w-full backdrop-blur-2xl bg-white/90 dark:bg-surface-dark/90 border border-white/50 dark:border-slate-700/50 rounded-[2.5rem] shadow-2xl p-8 lg:p-12 relative z-10 animate-fade-in-up">
                <div className="flex justify-center mb-8">
                    <Logo className="w-24 h-24 text-primary" />
                </div>
                {renderAuthForm()}

                <div className="mt-8 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => navigate('/suporte')}
                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors"
                    >
                        Precisa de Ajuda?
                    </button>
                </div>
            </div>

            <LegalModal
                isOpen={legalModal.isOpen}
                type={legalModal.type}
                onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default LoginPage;
