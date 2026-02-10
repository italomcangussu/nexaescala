import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PermissionSoftPromptProps {
    isOpen: boolean;
    onConfirm: () => void;
    title: string;
    description: string;
    icon: LucideIcon;
    confirmText: string;
    iconColorClass?: string;
    iconBgClass?: string;
}

const PermissionSoftPrompt: React.FC<PermissionSoftPromptProps> = ({
    isOpen,
    onConfirm,
    title,
    description,
    icon: Icon,
    confirmText,
    iconColorClass = "text-primary",
    iconBgClass = "bg-primary/10"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-surface-dark w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-8 text-center">
                    <div className={`mx-auto w-20 h-20 ${iconBgClass} rounded-3xl flex items-center justify-center mb-6`}>
                        <Icon className={iconColorClass} size={40} />
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-3 leading-tight">
                        {title}
                    </h3>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed px-2">
                        {description}
                    </p>

                    <button
                        onClick={onConfirm}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primary-dark transition-all active:scale-[0.98]"
                    >
                        {confirmText}
                    </button>
                </div>

                {/* Visual Hint for Apple Guidelines - Transparency */}
                <div className="bg-surface dark:bg-slate-800/50 py-3 px-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium uppercase tracking-widest">
                        Respeitamos sua privacidade
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PermissionSoftPrompt;
