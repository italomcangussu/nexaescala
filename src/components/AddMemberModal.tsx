import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus } from 'lucide-react';
import { Profile, ServiceRole, Group } from '../types';
import { searchProfiles, addGroupMember } from '../services/api';

interface AddMemberModalProps {
    group: Group;
    isOpen: boolean;
    onClose: () => void;
    onMemberAdded: () => void;
    currentMemberIds: string[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ group, isOpen, onClose, onMemberAdded, currentMemberIds }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [addingId, setAddingId] = useState<string | null>(null);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2) {
                setIsSearching(true);
                try {
                    const results = await searchProfiles(searchTerm);
                    // Filter out existing members
                    setSearchResults(results.filter(p => !currentMemberIds.includes(p.id)));
                } catch (error) {
                    console.error("Search error:", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, currentMemberIds]);

    const handleAdd = async (profile: Profile) => {
        setAddingId(profile.id);
        try {
            // Default to MEDICO (AppRole) and PLANTONISTA (ServiceRole) when adding via this simplified UI
            // 'role' column likely corresponds to AppRole enum ('medico', etc)
            await addGroupMember(group.id, profile.id, 'medico', ServiceRole.PLANTONISTA);
            onMemberAdded();
            // Remove from results to prevent double add
            setSearchResults(prev => prev.filter(p => p.id !== profile.id));
        } catch (error: any) {
            console.error("Error adding member:", error);
            alert(`Erro ao adicionar membro: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setAddingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h3 className="font-bold text-lg">Adicionar Membro</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou CRM..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/50 text-base"
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto min-h-[100px]">
                        {isSearching ? (
                            <div className="flex justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-2">
                                {searchResults.map(profile => (
                                    <div key={profile.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                                            {profile.avatar_url && <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{profile.full_name}</p>
                                            <p className="text-xs text-slate-500 truncate">{profile.crm ? `CRM ${profile.crm}` : profile.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAdd(profile)}
                                            disabled={addingId === profile.id}
                                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {addingId === profile.id ? (
                                                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <UserPlus size={20} />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : searchTerm.length >= 2 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                Nenhum usuário encontrado.
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-sm">
                                Digite para buscar novos membros.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
