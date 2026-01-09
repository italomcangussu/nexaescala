import React, { useState } from 'react';
import { Search, Crown, X, Loader2, UserPlus } from 'lucide-react';
import { Profile, ServiceRole, TeamMember } from '../../../types';

interface StepTeamProps {
    team: TeamMember[];
    searchQuery: string;
    searchResults: Profile[];
    isSearching: boolean;
    onSearch: (query: string) => void;
    onAddMember: (profile: Profile, roles: ServiceRole[]) => void;
    onUpdateRoles: (profileId: string, roles: ServiceRole[]) => void;
    onRemoveMember: (profileId: string) => void;
    onToggleRole: (profileId: string, role: ServiceRole) => void;
}

const StepTeam: React.FC<StepTeamProps> = ({
    team,
    searchQuery,
    searchResults,
    isSearching,
    onSearch,
    onAddMember,
    onUpdateRoles: _onUpdateRoles, // Reserved for future use
    onRemoveMember,
    onToggleRole,
}) => {
    const [selectedRolesForNew, setSelectedRolesForNew] = useState<ServiceRole[]>([ServiceRole.PLANTONISTA]);

    const handleAddWithRoles = (profile: Profile) => {
        onAddMember(profile, selectedRolesForNew);
        setSelectedRolesForNew([ServiceRole.PLANTONISTA]); // Reset
    };

    const filteredResults = searchResults.filter(
        p => !team.some(m => m.profile.id === p.id)
    );

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Current Team */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                        Membros da Equipe ({team.length})
                    </h3>
                </div>

                <div className="space-y-2">
                    {team.map((member) => (
                        <div
                            key={member.profile.id}
                            className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <img
                                        src={member.profile.avatar_url}
                                        alt=""
                                        className="w-10 h-10 rounded-full ring-2 ring-white dark:ring-slate-700"
                                    />
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {member.profile.full_name}
                                            </p>
                                            {member.isOwner && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 rounded-full">
                                                    <Crown size={12} className="text-amber-500" fill="currentColor" />
                                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">CRIADOR</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500">
                                            {member.profile.crm && `${member.profile.crm} • `}
                                            {member.profile.specialty || member.profile.email}
                                        </p>
                                    </div>
                                </div>

                                {!member.isOwner && (
                                    <button
                                        onClick={() => onRemoveMember(member.profile.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Role Chips */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {[ServiceRole.ADMIN, ServiceRole.ADMIN_AUX, ServiceRole.PLANTONISTA, ServiceRole.VISITANTE].map(role => {
                                    const isActive = member.roles.includes(role);
                                    const isOwnerAdminRole = member.isOwner && role === ServiceRole.ADMIN;

                                    return (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => !isOwnerAdminRole && onToggleRole(member.profile.id, role)}
                                            disabled={isOwnerAdminRole}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${isActive
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                } ${isOwnerAdminRole ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            {role === ServiceRole.ADMIN ? 'ADM' :
                                                role === ServiceRole.ADMIN_AUX ? 'ADM AUX' :
                                                    role === ServiceRole.PLANTONISTA ? 'PLANT' : 'VIS'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    value={searchQuery}
                    onChange={e => onSearch(e.target.value)}
                    placeholder="Buscar plantonista (Nome, CRM, Email...)"
                    className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm text-slate-800 dark:text-slate-100"
                />
                {isSearching ? (
                    <Loader2 className="absolute left-3 top-3.5 text-primary animate-spin" size={18} />
                ) : (
                    <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                )}
            </div>

            {/* Search Results */}
            {searchQuery.length >= 2 && (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredResults.length === 0 && !isSearching && (
                        <div className="text-center py-8">
                            <UserPlus size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
                            <p className="text-sm text-slate-400">Nenhum usuário encontrado</p>
                        </div>
                    )}

                    {filteredResults.map(profile => (
                        <div
                            key={profile.id}
                            className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <img
                                    src={profile.avatar_url}
                                    alt=""
                                    className="w-12 h-12 rounded-full"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                        {profile.full_name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {profile.crm} • {profile.specialty || profile.email}
                                    </p>
                                </div>
                            </div>

                            {/* Role Selection for New Member */}
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-wrap gap-1">
                                    {[ServiceRole.ADMIN, ServiceRole.ADMIN_AUX, ServiceRole.PLANTONISTA, ServiceRole.VISITANTE].map(role => {
                                        const isSelected = selectedRolesForNew.includes(role);
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        if (selectedRolesForNew.length > 1) {
                                                            setSelectedRolesForNew(prev => prev.filter(r => r !== role));
                                                        }
                                                    } else {
                                                        setSelectedRolesForNew(prev => [...prev, role]);
                                                    }
                                                }}
                                                className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${isSelected
                                                    ? 'bg-primary/20 text-primary border border-primary'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-transparent'
                                                    }`}
                                            >
                                                {role === ServiceRole.ADMIN ? 'ADM' :
                                                    role === ServiceRole.ADMIN_AUX ? 'ADM AUX' :
                                                        role === ServiceRole.PLANTONISTA ? 'PLANT' : 'VIS'}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleAddWithRoles(profile)}
                                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primaryDark transition-colors flex items-center gap-1.5"
                                >
                                    <UserPlus size={14} />
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tips */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-primary">💡 Dica:</span> Cada membro pode ter múltiplas funções.
                    Clique nos badges para ativar/desativar funções. O criador sempre será ADM.
                </p>
            </div>
        </div>
    );
};

export default StepTeam;
