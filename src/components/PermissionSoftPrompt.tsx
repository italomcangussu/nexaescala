import React from 'react';
import { LucideIcon, X } from 'lucide-react';

interface PermissionSoftPromptProps {
    isOpen: boolean;
    onClose: () => void;
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
    onClose,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-in">
                <div className="p-8 text-center">
                    <div className="flex justify-end -mt-4 -mr-4">
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className={`mx-auto w-20 h-20 ${iconBgClass} rounded-3xl flex items-center justify-center mb-6`}>
                        <Icon className={iconColorClass} size={40} />
                    </div>

                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-3 leading-tight">
                        {title}
                    </h3>

                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed px-2">
                        {description}
                    </p>

                    <nav className="space-y-3">
                        <button
                            onClick={onConfirm}
                            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primaryDark transition-all active:scale-[0.98]"
                        >
                            {confirmText}
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-3 text-slate-400 dark:text-slate-500 font-bold text-sm hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            Agora não
                        </button>
                    </nav>
                </div>

                {/* Visual Hint for Apple Guidelines - Transparency */}
                <div className="bg-slate-50 dark:bg-slate-800/50 py-3 px-6 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center font-medium uppercase tracking-widest">
                        Respeitamos sua privacidade
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PermissionSoftPrompt;
