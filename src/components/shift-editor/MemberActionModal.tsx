import React from 'react';
import { X, UserMinus, RefreshCw } from 'lucide-react';
import { Profile } from '../../types';

interface MemberActionModalProps {
    member: Profile;
    onClose: () => void;
    onRemove: () => void;
    onSwap: () => void;
}

const MemberActionModal: React.FC<MemberActionModalProps> = ({ member, onClose, onRemove, onSwap }) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X size={20} />
                    </button>

                    <div className="w-20 h-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full mb-4 p-1">
                        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full rounded-full object-cover" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">{member.full_name}</h3>
                    <p className="text-sm text-slate-500">{member.specialty || 'Membro da Equipe'}</p>
                </div>

                <div className="p-4 space-y-3">
                    <button
                        onClick={() => { onSwap(); onClose(); }}
                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl flex items-center gap-4 transition-colors group text-left"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <RefreshCw size={20} />
                        </div>
                        <div>
                            <span className="block font-bold text-slate-800 dark:text-white">Trocar Plantonista</span>
                            <span className="text-xs text-slate-500">Substituir por outro membro</span>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            if (window.confirm(`Remover ${member.full_name} deste plantão?`)) {
                                onRemove();
                                onClose();
                            }
                        }}
                        className="w-full p-4 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-4 transition-colors group text-left"
                    >
                        <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <UserMinus size={20} />
                        </div>
                        <div>
                            <span className="block font-bold text-red-600 dark:text-red-400">Remover da Escala</span>
                            <span className="text-xs text-red-400/70">Desfazer atribuição</span>
                        </div>
                    </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 text-center">
                    <button onClick={onClose} className="text-sm font-bold text-slate-400 hover:text-slate-600">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

export default MemberActionModal;
