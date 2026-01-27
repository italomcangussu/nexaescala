import React, { useState } from 'react';
import { Eye, EyeOff, Check, ArrowLeft } from 'lucide-react';

interface SettingsPasswordProps {
    onBack: () => void;
}

const PasswordRequirement = ({ label, met }: { label: string, met: boolean }) => (
    <div className={`flex items-center gap-1.5 transition-colors duration-300 ${met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${met ? 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700' : 'border-slate-300 dark:border-slate-600'}`}>
            {met && <Check size={10} strokeWidth={4} />}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
    </div>
);

const SettingsPassword: React.FC<SettingsPasswordProps> = ({ onBack }) => {
    const [passwordForm, setPasswordForm] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const [showPassword, setShowPassword] = useState(false);

    const handlePasswordChange = (key: keyof typeof passwordForm, value: string) => {
        setPasswordForm(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="px-6 animate-fade-in-up w-full">
            <div className="flex items-center mb-6 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Alterar Senha</h2>
            </div>

            <div className="space-y-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Senha Atual</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={passwordForm.current}
                            onChange={(e) => handlePasswordChange('current', e.target.value)}
                            className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-100 transition-colors"
                            placeholder="Digite sua senha atual"
                        />
                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-4 text-slate-400">
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <div className="flex justify-end mt-1">
                        <button
                            type="button"
                            onClick={() => alert('Email de recuperação enviado')}
                            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline transition-colors"
                        >
                            Esqueceu a senha?
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nova Senha</label>
                    <input
                        type="password"
                        value={passwordForm.new}
                        onChange={(e) => handlePasswordChange('new', e.target.value)}
                        className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-100 transition-colors"
                        placeholder="Mínimo 8 caracteres"
                    />
                    {/* Password Requirements Checklist */}
                    <div className="flex flex-wrap gap-y-2 gap-x-4 pt-2 px-1">
                        <PasswordRequirement label="Mínimo 8 caracteres" met={passwordForm.new.length >= 8} />
                        <PasswordRequirement label="Maiúscula" met={/[A-Z]/.test(passwordForm.new)} />
                        <PasswordRequirement label="Minúscula" met={/[a-z]/.test(passwordForm.new)} />
                        <PasswordRequirement label="Número" met={/[0-9]/.test(passwordForm.new)} />
                        <PasswordRequirement label="Especial" met={/[!@#$%^&*(),.?":{}|<>]/.test(passwordForm.new)} />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Confirmar Nova Senha</label>
                    <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                        className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-100 transition-colors"
                        placeholder="Repita a nova senha"
                    />
                </div>

                <button className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:bg-primaryDark active:scale-95 transition-all mt-4">
                    Atualizar Senha
                </button>
            </div>
        </div>
    );
};

export default SettingsPassword;
