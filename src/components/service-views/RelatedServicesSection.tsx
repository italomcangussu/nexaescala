import React, { useState, useEffect } from 'react';
import { Group, GroupRelationship, Profile } from '../../types';
import { getRelatedGroups, addRelatedGroup, removeRelatedGroup, getAdminGroups } from '../../services/api';
import { Link, Trash2, Plus, Loader2 } from 'lucide-react';

interface RelatedServicesSectionProps {
    group: Group;
    currentUser: Profile;
}

const RelatedServicesSection: React.FC<RelatedServicesSectionProps> = ({ group, currentUser }) => {
    const [relationships, setRelationships] = useState<GroupRelationship[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Add Mode State
    const [isAdding, setIsAdding] = useState(false);
    const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
    const [isLoadingGroups, setIsLoadingGroups] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [customLabel, setCustomLabel] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchRelationships();
    }, [group.id]);

    const fetchRelationships = async () => {
        setIsLoading(true);
        try {
            const data = await getRelatedGroups(group.id);
            setRelationships(data);
        } catch (error) {
            console.error('Failed to fetch relationships:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartAdd = async () => {
        setIsAdding(true);
        setIsLoadingGroups(true);
        try {
            const groups = await getAdminGroups(currentUser.id);
            // Filter out current group and already related groups
            const existingIds = relationships.map(r => r.related_group_id);
            setAvailableGroups(groups.filter(g => g.id !== group.id && !existingIds.includes(g.id)));
        } catch (error) {
            console.error('Failed to load admin groups', error);
        } finally {
            setIsLoadingGroups(false);
        }
    };

    const handleAdd = async () => {
        if (!selectedGroup) return;
        setIsSaving(true);
        try {
            await addRelatedGroup(group.id, selectedGroup, customLabel);
            await fetchRelationships();
            setIsAdding(false);
            setSelectedGroup('');
            setCustomLabel('');
        } catch (error) {
            console.error('Failed to add relationship', error);
            alert('Erro ao adicionar relacionamento');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm('Remover este relacionamento?')) return;
        try {
            await removeRelatedGroup(id);
            setRelationships(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error('Failed to remove relationship', error);
        }
    };

    return (
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Link size={20} className="text-slate-400" />
                Serviços Relacionados
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Relacione outros serviços para que os plantonistas possam ver informações importantes (ex: quem é a chefia do dia).
            </p>

            {isLoading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="animate-spin text-slate-400" />
                </div>
            ) : (
                <div className="space-y-3">
                    {relationships.map(rel => (
                        <div key={rel.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div>
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">
                                    {rel.related_group?.name}
                                </h4>
                                {rel.display_label && (
                                    <span className="text-xs font-medium px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full mt-1 inline-block">
                                        {rel.display_label}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => handleRemove(rel.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {relationships.length === 0 && !isAdding && (
                        <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                            <span className="text-sm text-slate-400">Nenhum serviço relacionado</span>
                        </div>
                    )}
                </div>
            )}

            {!isAdding ? (
                <button
                    onClick={handleStartAdd}
                    className="mt-4 w-full py-2 flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                >
                    <Plus size={16} />
                    Adicionar Relacionamento
                </button>
            ) : (
                <div className="mt-4 p-4 bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30 rounded-xl shadow-sm ring-1 ring-emerald-500/20">
                    <h4 className="font-bold text-sm mb-3 text-slate-800 dark:text-slate-100">Novo Relacionamento</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Serviço</label>
                            {isLoadingGroups ? (
                                <div className="h-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <Loader2 className="animate-spin text-slate-400" size={16} />
                                </div>
                            ) : availableGroups.length === 0 ? (
                                <div className="text-center py-3 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    Você não é administrador de outros serviços.
                                </div>
                            ) : (
                                <select
                                    value={selectedGroup}
                                    onChange={(e) => setSelectedGroup(e.target.value)}
                                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                >
                                    <option value="">Selecione um serviço...</option>
                                    {availableGroups.map(g => (
                                        <option key={g.id} value={g.id}>{g.name} ({g.institution})</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Rótulo de Exibição (Opcional)</label>
                            <input
                                type="text"
                                value={customLabel}
                                onChange={(e) => setCustomLabel(e.target.value)}
                                placeholder="Ex: Chefia de Equipe, Interconsultas..."
                                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            />
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="flex-1 py-2 text-slate-500 dark:text-slate-400 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!selectedGroup || isSaving}
                                className="flex-1 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-200 dark:shadow-none"
                            >
                                {isSaving && <Loader2 size={14} className="animate-spin" />}
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RelatedServicesSection;
