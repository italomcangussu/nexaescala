import React, { useState, useRef } from 'react';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';
import { uploadAvatar, createPreviewUrl } from '../lib/imageUtils';
import {
    ChevronRight,
    ChevronLeft,
    Camera,
    User,
    Stethoscope,
    CheckCircle,
    Loader,
    Sparkles
} from 'lucide-react';

// Logo URL from Supabase Storage
const LOGO_URL = 'https://vjlcfkkyfeteljutwfet.supabase.co/storage/v1/object/public/logo/Gemini_Generated_Image_yup0wjyup0wjyup0.png';

interface OnboardingWizardProps {
    user: { id: string; email?: string };
    initialProfile?: Partial<Profile>;
    onComplete: () => void;
}

// Brazilian states
const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const SPECIALTIES = [
    'Clínica Geral',
    'Cardiologia',
    'Clínica Médica',
    'Cirurgia Geral',
    'Dermatologia',
    'Endocrinologia',
    'Gastroenterologia',
    'Geriatria',
    'Ginecologia',
    'Medicina de Emergência',
    'Medicina Intensiva',
    'Neurologia',
    'Oftalmologia',
    'Ortopedia',
    'Pediatria',
    'Psiquiatria',
    'Radiologia',
    'Urologia',
    'Outra'
];

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, initialProfile, onComplete }) => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [fullName, setFullName] = useState(initialProfile?.full_name || '');
    const [crmNumber, setCrmNumber] = useState('');
    const [crmState, setCrmState] = useState('');
    const [specialty, setSpecialty] = useState(initialProfile?.specialty || '');
    const [avatarPreview, setAvatarPreview] = useState<string | null>(initialProfile?.avatar_url || null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const steps = [
        { id: 'welcome', title: 'Bem-vindo' },
        { id: 'info', title: 'Seus Dados' },
        { id: 'photo', title: 'Foto de Perfil' },
        { id: 'complete', title: 'Concluído' }
    ];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const preview = await createPreviewUrl(file);
            setAvatarPreview(preview);
            setAvatarFile(file);
        } catch (err) {
            setError('Erro ao carregar imagem');
        }
    };

    const handleNext = async () => {
        if (step === steps.length - 2) {
            // Save profile before going to completion
            await saveProfile();
        } else if (step < steps.length - 1) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const saveProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            let avatarUrl = avatarPreview;

            // Upload avatar if a new file was selected
            if (avatarFile) {
                avatarUrl = await uploadAvatar(user.id, avatarFile);
            }

            // Build CRM string
            const crmFormatted = crmNumber && crmState ? `${crmNumber}-${crmState}` : null;

            // Update profile in Supabase
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    crm: crmFormatted,
                    specialty: specialty || null,
                    avatar_url: avatarUrl,
                    onboarding_completed: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setStep(steps.length - 1); // Go to completion
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar perfil');
        } finally {
            setLoading(false);
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 0: // Welcome
                return (
                    <div className="text-center py-8 animate-fade-in-up">
                        <div className="inline-flex p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-emerald-100 dark:shadow-none mb-6">
                            <img src={LOGO_URL} alt="NexaEscala" className="w-20 h-20 object-contain" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Bem-vindo ao NexaEscala!
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            Vamos configurar seu perfil em alguns passos rápidos para você começar a usar o app.
                        </p>
                    </div>
                );

            case 1: // Info
                return (
                    <div className="space-y-5 animate-fade-in-up">
                        <div className="text-center mb-6">
                            <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-3">
                                <User className="text-primary" size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Seus Dados</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Informações básicas do seu perfil</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Nome Completo *</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                                placeholder="Dr. João Silva"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">CRM (Opcional)</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={crmNumber}
                                    onChange={(e) => setCrmNumber(e.target.value.replace(/\D/g, ''))}
                                    className="flex-1 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                                    placeholder="12345"
                                    maxLength={10}
                                />
                                <select
                                    value={crmState}
                                    onChange={(e) => setCrmState(e.target.value)}
                                    className="w-24 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200"
                                >
                                    <option value="">UF</option>
                                    {BRAZILIAN_STATES.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Especialidade</label>
                            <div className="relative">
                                <Stethoscope size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={specialty}
                                    onChange={(e) => setSpecialty(e.target.value)}
                                    className="w-full pl-11 p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 dark:text-slate-200 appearance-none"
                                >
                                    <option value="">Selecione...</option>
                                    {SPECIALTIES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                );

            case 2: // Photo
                return (
                    <div className="text-center animate-fade-in-up">
                        <div className="inline-flex p-3 bg-primary/10 rounded-xl mb-3">
                            <Camera className="text-primary" size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Foto de Perfil</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Adicione uma foto para personalizar seu perfil</p>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative mx-auto w-32 h-32 rounded-full bg-slate-100 dark:bg-slate-700 border-4 border-white dark:border-slate-600 shadow-lg cursor-pointer group overflow-hidden"
                        >
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <User size={48} className="text-slate-300 dark:text-slate-500" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={28} />
                            </div>
                        </div>

                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-4 text-sm font-semibold text-primary hover:underline"
                        >
                            {avatarPreview ? 'Alterar foto' : 'Escolher foto'}
                        </button>

                        <p className="text-xs text-slate-400 mt-2">
                            Você pode pular esta etapa
                        </p>
                    </div>
                );

            case 3: // Complete
                return (
                    <div className="text-center py-8 animate-fade-in-up">
                        <div className="inline-flex p-4 bg-primary/10 rounded-full mb-6">
                            <Sparkles className="text-primary" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                            Tudo Pronto!
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                            Seu perfil foi configurado com sucesso. Agora você pode começar a usar o NexaEscala!
                        </p>

                        {avatarPreview && (
                            <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-6">
                                <img src={avatarPreview} alt="Profile" className="w-12 h-12 rounded-full object-cover" />
                                <div className="text-left">
                                    <p className="font-bold text-slate-800 dark:text-slate-100">{fullName}</p>
                                    <p className="text-sm text-slate-500">{specialty || 'Médico'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        if (step === 1) return fullName.trim().length > 0;
        return true;
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Progress Bar */}
                <div className="h-1.5 bg-slate-100 dark:bg-slate-700">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
                            {error}
                        </div>
                    )}

                    {renderStepContent()}
                </div>

                {/* Footer - Always visible */}
                <div className="p-6 pt-0 flex gap-3">
                    {step > 0 && step < steps.length - 1 && (
                        <button
                            onClick={handleBack}
                            className="flex-1 py-3.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                        >
                            <ChevronLeft size={18} />
                            Voltar
                        </button>
                    )}

                    {step < steps.length - 1 ? (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed() || loading}
                            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader className="animate-spin" size={20} />
                            ) : (
                                <>
                                    {step === steps.length - 2 ? 'Finalizar' : 'Continuar'}
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={onComplete}
                            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} />
                            Entrar no App
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
