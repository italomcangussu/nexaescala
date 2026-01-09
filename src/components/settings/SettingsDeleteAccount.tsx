import React, { useState } from 'react';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

interface SettingsDeleteAccountProps {
    onBack: () => void;
    onCloseMenu: () => void;
}

const SettingsDeleteAccount: React.FC<SettingsDeleteAccountProps> = ({ onBack, onCloseMenu }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <div className="px-6 animate-fade-in-up w-full relative h-full">
            <div className="flex items-center mb-6 relative px-1">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 ml-2">Excluir Conta</h2>
            </div>

            <div className="flex flex-col items-center text-center mt-4 space-y-6">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center animate-pulse">
                    <AlertTriangle size={40} className="text-red-500" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Tem certeza?</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Ao excluir sua conta, todos os seus dados de escalas, histórico e conexões serão removidos permanentemente. <br /><br />
                        <strong className="text-slate-700 dark:text-slate-300">Essa ação não pode ser desfeita.</strong>
                    </p>
                </div>

                <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 active:scale-95 transition-all mt-8"
                >
                    Excluir Conta
                </button>
            </div>

            {/* DELETE CONFIRMATION OVERLAY */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in-up rounded-[2.5rem]">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Decisão Final</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 text-center">Todos os seus dados serão apagados agora.</p>

                    <div className="w-full space-y-3">
                        <button
                            onClick={() => {
                                alert('Conta excluída (Simulação)');
                                onCloseMenu();
                            }}
                            className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-red-700 active:scale-95 transition-all"
                        >
                            Sim, excluir tudo
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold py-3.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 active:scale-95 transition-all"
                        >
                            Não, manter conta
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsDeleteAccount;
