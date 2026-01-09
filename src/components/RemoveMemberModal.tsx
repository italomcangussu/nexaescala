import React, { useState } from 'react';
import { X, Search, Trash2, Shield } from 'lucide-react';
import { GroupMember, ServiceRole } from '../types';
import { removeGroupMember } from '../services/api';

interface RemoveMemberModalProps {
    members: GroupMember[];
    isOpen: boolean;
    onClose: () => void;
    onMemberRemoved: () => void;
    currentUserId: string; // To prevent removing oneself if needed, or to check permissions
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({ members, isOpen, onClose, onMemberRemoved, currentUserId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [removingId, setRemovingId] = useState<string | null>(null);

    const filteredMembers = members.filter(m =>
        m.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.profile.crm && m.profile.crm.includes(searchTerm))
    );

    const handleRemove = async (member: GroupMember) => {
        if (!window.confirm(`Tem certeza que deseja remover ${member.profile.full_name} da escala?`)) {
            return;
        }

        setRemovingId(member.id);
        try {
            await removeGroupMember(member.group_id, member.profile.id);
            onMemberRemoved();
        } catch (error) {
            console.error("Error removing member:", error);
            alert("Erro ao remover membro.");
        } finally {
            setRemovingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-lg">Retirar Membro</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar membro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-red-500/50 text-base"
                        />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {filteredMembers.length > 0 ? (
                            <div className="space-y-2">
                                {filteredMembers.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                            <img src={member.profile.avatar_url} alt={member.profile.full_name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{member.profile.full_name}</p>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${member.service_role === ServiceRole.ADMIN ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {member.service_role === ServiceRole.ADMIN ? 'ADM' : 'PLT'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate">{member.profile.crm ? `CRM ${member.profile.crm}` : 'Sem CRM'}</p>
                                        </div>

                                        {/* Don't allow removing oneself via this specific button logic for safety, can be discussed */}
                                        {member.profile.id !== currentUserId && (
                                            <button
                                                onClick={() => handleRemove(member)}
                                                disabled={removingId === member.id}
                                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Remover da escala"
                                            >
                                                {removingId === member.id ? (
                                                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <X size={20} />
                                                )}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                Nenhum membro encontrado.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemoveMemberModal;
