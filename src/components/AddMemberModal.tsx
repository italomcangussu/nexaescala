import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { Profile } from '../types';
import { searchProfiles } from '../services/api';

interface AddMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddMember: (profile: Profile) => void;
    existingMemberIds: string[];
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose, onAddMember, existingMemberIds }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Profile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setIsSearching(true);
                try {
                    const data = await searchProfiles(query);
                    // Filter out users who are already members
                    const availableData = data.filter(p => !existingMemberIds.includes(p.id));
                    setResults(availableData);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setResults([]);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query, existingMemberIds]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] border border-slate-100 dark:border-slate-800">

                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Adicionar Membro</h2>
                        <p className="text-xs text-slate-500 font-medium">Busque usuários para integrar à equipe</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="relative">
                        <Search size={20} className="absolute left-3 top-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Nome, CRM ou E-mail..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-xl py-3 pl-11 pr-4 shadow-sm text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-slate-200 placeholder-slate-400"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-2">
                    {isSearching ? (
                        <div className="py-8 text-center text-slate-400 text-sm">Buscando...</div>
                    ) : results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map(profile => (
                                <button
                                    key={profile.id}
                                    onClick={() => onAddMember(profile)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors text-left group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-300 text-slate-500 font-bold">
                                                {profile.full_name?.[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{profile.full_name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            {profile.crm && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono">{profile.crm}</span>}
                                            {profile.specialty && <span className="truncate">{profile.specialty}</span>}
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <UserPlus size={16} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="py-12 text-center">
                            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                <Search size={24} />
                            </div>
                            <p className="text-slate-500 text-sm">Nenhum usuário encontrado</p>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <p className="text-slate-400 text-sm">Digite para pesquisar novos membros</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
