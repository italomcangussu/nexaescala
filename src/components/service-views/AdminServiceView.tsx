import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, Grid, Bell, Shield, UserPlus, UserMinus, Save, Palette, History, ClipboardList } from 'lucide-react';
import { Group, Profile, GroupMember, ServiceRole, AppRole } from '../../types';
import CalendarView from '../CalendarView';
import { getGroupMembers, deleteGroup, updateGroup, getShifts, getAssignments, addGroupMember } from '../../services/api';
import { Shift, ShiftAssignment } from '../../types';
import ShiftInbox from '../ShiftInbox';
import AddMemberModal from '../AddMemberModal';
import RemoveMemberModal from '../RemoveMemberModal';
import ServiceChat from '../ServiceChat';
import RelatedServicesSection from './RelatedServicesSection';

interface AdminServiceViewProps {
    group: Group;
    currentUser: Profile;
    isAux?: boolean; // If true, disable some features
    onOpenEditor?: (group: Group) => void;
}

const AdminServiceView: React.FC<AdminServiceViewProps> = ({ group, currentUser, isAux = false, onOpenEditor }) => {
    const [activeTab, setActiveTab] = useState<'calendar' | 'editor' | 'members' | 'settings' | 'notifications' | 'history'>('calendar');

    // Data State
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [groupShifts, setGroupShifts] = useState<Shift[]>([]);
    const [groupAssignments, setGroupAssignments] = useState<ShiftAssignment[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Modals State
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);

    // Settings State
    const [editName, setEditName] = useState(group.name);
    const [editInstitution, setEditInstitution] = useState(group.institution);
    const [editColor, setEditColor] = useState(group.color || '#3b82f6');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    useEffect(() => {
        loadData();
    }, [group.id]);

    const loadData = async () => {
        setIsLoadingData(true);
        try {
            const memberPromise = getGroupMembers(group.id);
            const shiftsPromise = getShifts(group.id);

            const [membersData, shiftsData] = await Promise.all([memberPromise, shiftsPromise]);

            setMembers(membersData);
            setGroupShifts(shiftsData);

            const shiftIds = shiftsData.map(s => s.id);
            if (shiftIds.length > 0) {
                const assignmentsData = await getAssignments(shiftIds);
                setGroupAssignments(assignmentsData);
            }
        } catch (error) {
            console.error("Error fetching admin view data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const fetchMembers = async () => {
        // Kept for modal callbacks
        try {
            const data = await getGroupMembers(group.id);
            setMembers(data);
        } catch (error) {
            console.error("Error fetching members:", error);
        }
    };

    const handleAddMember = async (profile: Profile) => {
        try {
            await addGroupMember(group.id, profile.id, AppRole.MEDICO, ServiceRole.PLANTONISTA);
            setIsAddMemberModalOpen(false);
            fetchMembers();
            alert(`Dr(a). ${profile.full_name} adicionado(a) com sucesso!`);
        } catch (error: any) {
            console.error("Error adding member:", error);
            alert(`Erro ao adicionar membro: ${error.message || 'Erro desconhecido'}`);
        }
    };



    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
            {/* Toolbar */}
            <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0 shadow-sm">
                <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'calendar' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Calendar size={20} />
                    <span className="text-[10px] font-bold">Escala</span>
                </button>
                <button
                    onClick={() => onOpenEditor ? onOpenEditor(group) : setActiveTab('editor')}
                    className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'editor' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}
                >
                    <Grid size={20} />
                    <span className="text-[10px] font-bold text-center">Editor de Escala</span>
                </button>
                <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'notifications' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Bell size={20} />
                    <span className="text-[10px] font-bold">Solicitações</span>
                </button>
                <button onClick={() => setActiveTab('members')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'members' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Users size={20} />
                    <span className="text-[10px] font-bold">Membros</span>
                </button>
                {!isAux && (
                    <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                        <Settings size={20} />
                        <span className="text-[10px] font-bold">Gerenciar</span>
                    </button>
                )}
                <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'history' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <History size={20} />
                    <span className="text-[10px] font-bold">Log</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto relative">
                {activeTab === 'calendar' && (
                    <div className="flex flex-col h-full">
                        {isLoadingData ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-400">
                                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                                <p className="font-medium">Carregando escala...</p>
                            </div>
                        ) : (
                            <>
                                <CalendarView
                                    shifts={groupShifts}
                                    assignments={groupAssignments}
                                    currentUser={currentUser}
                                    currentUserRole={AppRole.GESTOR}
                                    groupColor={group.color}
                                    showAvailableShifts={false}
                                    groupId={group.id}
                                    userServiceRole={group.user_role}
                                />

                                {/* Service Chat Section */}
                                <div className="flex-1 bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-slate-800 rounded-t-3xl -mt-4 relative z-10 px-4 pt-6 pb-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                    <div className="mb-4 flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Chat do Serviço</h3>
                                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-bold">Online</span>
                                    </div>
                                    <ServiceChat
                                        group={group}
                                        currentUser={currentUser}
                                        shifts={groupShifts}
                                        assignments={groupAssignments}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <ShiftInbox groupId={group.id} currentUser={currentUser} />
                )}

                {activeTab === 'members' && (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-lg font-bold">Membros do Serviço ({members.length})</h3>
                            {!isAux && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsRemoveMemberModalOpen(true)}
                                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                        title="Retirar Membro"
                                    >
                                        <UserMinus size={20} />
                                    </button>
                                    <button
                                        onClick={() => setIsAddMemberModalOpen(true)}
                                        className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors font-bold text-sm shadow-sm"
                                    >
                                        <UserPlus size={18} />
                                        <span>Adicionar</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Modals */}
                        <AddMemberModal
                            isOpen={isAddMemberModalOpen}
                            onClose={() => setIsAddMemberModalOpen(false)}
                            onAddMember={handleAddMember}
                            existingMemberIds={members.map(m => m.profile.id)}
                        />

                        <RemoveMemberModal
                            members={members}
                            isOpen={isRemoveMemberModalOpen}
                            onClose={() => setIsRemoveMemberModalOpen(false)}
                            onMemberRemoved={() => {
                                // Refresh members list
                                fetchMembers();
                            }}
                            currentUserId={currentUser.id}
                        />

                        {isLoadingData ? (
                            <div className="flex justify-center py-10">
                                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : members.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                Nenhum membro encontrado.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {members.map(member => (
                                    <div key={member.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                            <img src={member.profile.avatar_url} alt={member.profile.full_name} className="w-full h-full object-cover" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate">{member.profile.full_name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 ${member.service_role === ServiceRole.ADMIN ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' :
                                                    member.service_role === ServiceRole.ADMIN_AUX ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' :
                                                        'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    }`}>
                                                    {member.service_role === ServiceRole.ADMIN && <Shield size={10} />}
                                                    {member.service_role === ServiceRole.ADMIN ? 'ADM' : member.service_role === ServiceRole.ADMIN_AUX ? 'AUX' : 'Plantonista'}
                                                </span>
                                                {member.profile.crm && (
                                                    <span className="text-xs text-slate-400 font-medium">CRM {member.profile.crm}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions (Future) */}
                                        {/* <button className="p-2 text-slate-400 hover:text-slate-600"><MoreVertical size={18} /></button> */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="p-4">
                        <h3 className="text-lg font-bold mb-4">Configurações do Serviço</h3>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Nome do Serviço / Equipe
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all font-bold text-slate-800 dark:text-slate-100"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Instituição / Hospital
                                </label>
                                <div className="relative">
                                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        value={editInstitution}
                                        onChange={(e) => setEditInstitution(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-primary/50 outline-none transition-all font-medium text-slate-800 dark:text-slate-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Cor de Identificação
                                </label>
                                <div className="flex items-center gap-3 overflow-x-auto p-1">
                                    {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setEditColor(color)}
                                            className={`w-10 h-10 rounded-full border-2 transition-all ${editColor === color ? 'border-slate-900 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`}
                                            style={{ backgroundColor: color }}
                                            aria-label={`Select color ${color}`}
                                        />
                                    ))}
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 ml-2">
                                        <input
                                            type="color"
                                            value={editColor}
                                            onChange={(e) => setEditColor(e.target.value)}
                                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                        />
                                        <Palette className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-white pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    setIsSavingSettings(true);
                                    try {
                                        await updateGroup(group.id, {
                                            name: editName,
                                            institution: editInstitution,
                                            color: editColor
                                        });
                                        alert('Configurações salvas com sucesso!');
                                        // Reload to update global state
                                        window.location.reload();
                                    } catch (error: any) {
                                        console.error("Error saving settings:", error);
                                        alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
                                    } finally {
                                        setIsSavingSettings(false);
                                    }
                                }}
                                disabled={isSavingSettings}
                                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg shadow-slate-200 dark:shadow-none active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                            >
                                {isSavingSettings ? (
                                    <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        Salvar Alterações
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Related Services */}
                        <RelatedServicesSection group={group} currentUser={currentUser} />

                        {!isAux && (
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                <h4 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-wider">Zona de Perigo</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                    A exclusão do serviço é irreversível. Todos os plantões, escalas e mensagens serão apagados permanentemente.
                                </p>
                                <button
                                    onClick={async () => {
                                        if (window.confirm(`Tem certeza que deseja EXCLUIR o serviço "${group.name}"? Esta ação não pode ser desfeita.`)) {
                                            try {
                                                await deleteGroup(group.id);
                                                window.location.reload();
                                            } catch (error: any) {
                                                alert(`Erro ao excluir serviço: ${error.message || 'Erro desconhecido'}`);
                                                console.error("Deletion failed:", error);
                                            }
                                        }
                                    }}
                                    className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-100 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                >
                                    Excluir Serviço
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <ClipboardList className="text-primary" size={24} />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Log de Atividades</h3>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center">
                            <History size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma atividade recente registrada.</p>
                            <p className="text-xs text-slate-400 mt-1">Sendo um administrador, você verá aqui todas as trocas e edições feitas na escala.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminServiceView;
