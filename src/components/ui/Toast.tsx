import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    onClose: (id: string) => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const icons = {
        success: <CheckCircle size={18} className="text-emerald-500" />,
        error: <AlertCircle size={18} className="text-red-500" />,
        info: <Info size={18} className="text-blue-500" />
    };

    const bgColors = {
        success: 'bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900/30',
        error: 'bg-white dark:bg-slate-800 border-red-100 dark:border-red-900/30',
        info: 'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900/30'
    };

    return (
        <div className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md
            animate-in slide-in-from-top-2 fade-in duration-300
            ${bgColors[type]}
            min-w-[300px] max-w-sm
        `}>
            {icons[type]}
            <p className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {message}
            </p>
            <button
                onClick={() => onClose(id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
};

export default Toast;
