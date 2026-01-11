import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, Clock, Bell, LogOut } from 'lucide-react';
import { Group, Profile, Shift, ShiftAssignment, AppRole, GroupMember, ServiceRole } from '../../types';
import CalendarView from '../CalendarView';
import { canUserLeaveGroup, leaveGroup, updateMemberPersonalColor, getGroupMembers } from '../../services/api';
import ColorPalette from '../ColorPalette';
import ShiftInbox from '../ShiftInbox';
import { useToast } from '../../context/ToastContext';

const hexToRgba = (hex: string, alpha: number) => {
    let c: any;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
    }
    return hex;
}

interface PlantonistaServiceViewProps {
    group: Group;
    shifts: Shift[];
    assignments: ShiftAssignment[];
    currentUser: Profile;
    onBack: () => void;
    onGroupUpdate?: () => void;
}

const PlantonistaServiceView: React.FC<PlantonistaServiceViewProps> = ({ group, shifts, assignments, currentUser, onBack, onGroupUpdate }) => {
    const [activeTab, setActiveTab] = useState<'calendar' | 'members' | 'history' | 'settings' | 'notifications'>('calendar');
    const displayColor = group.color || '#10b981';
    const [canLeave, setCanLeave] = useState(true);
    const [leaveCheckMessage, setLeaveCheckMessage] = useState('');
    const { showToast } = useToast();
    const [isLeavingGroup, setIsLeavingGroup] = useState(false);

    // Members State
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        if (activeTab === 'members' && members.length === 0) {
            const fetchMembers = async () => {
                setLoadingMembers(true);
                try {
                    const data = await getGroupMembers(group.id);
                    setMembers(data);
                } catch (error) {
                    console.error("Error fetching members:", error);
                } finally {
                    setLoadingMembers(false);
                }
            };
            fetchMembers();
        }
    }, [activeTab, group.id, members.length]);

    // Personal color state
    const [selectedColor, setSelectedColor] = useState(group.color || '#10b981');
    const [isSavingColor, setIsSavingColor] = useState(false);

    // Sync state with prop (for external updates)
    useEffect(() => {
        setSelectedColor(group.color || '#10b981');
    }, [group.color]);

    // Check if user can leave when settings tab is active
    useEffect(() => {
        const checkLeaveEligibility = async () => {
            if (activeTab === 'settings') {
                try {
                    const result = await canUserLeaveGroup(group.id, currentUser.id);
                    setCanLeave(result.canLeave);
                    setLeaveCheckMessage(result.reason || '');
                } catch (error) {
                    console.error('Error checking leave eligibility:', error);
                    setCanLeave(false);
                    setLeaveCheckMessage('Erro ao verificar elegibilidade. Tente novamente.');
                }
            }
        };

        checkLeaveEligibility();
    }, [activeTab, group.id, currentUser.id]);

    const handleLeaveGroup = async () => {
        if (!canLeave) {
            showToast(leaveCheckMessage, 'error');
            return;
        }

        const confirmMessage = 'Deseja realmente sair deste serviço? Você precisará de um novo convite para retornar.';
        if (!confirm(confirmMessage)) return;

        setIsLeavingGroup(true);
        try {
            await leaveGroup(group.id, currentUser.id);
            showToast('Você saiu do serviço com sucesso.', 'success');
            onBack(); // Return to main view
        } catch (error: any) {
            console.error('Error leaving group:', error);
            showToast(error.message || 'Erro ao sair do serviço. Tente novamente.', 'error');
        } finally {
            setIsLeavingGroup(false);
        }
    };

    const handleColorChange = async (color: string) => {
        setSelectedColor(color);
        setIsSavingColor(true);
        try {
            await updateMemberPersonalColor(group.id, currentUser.id, color);
            showToast('Cor pessoal atualizada!', 'success');
            if (onGroupUpdate) {
                onGroupUpdate(); // Refresh group data
            }
        } catch (error) {
            console.error('Error updating color:', error);
            showToast('Erro ao salvar cor. Tente novamente.', 'error');
            setSelectedColor(group.color || '#10b981'); // Revert
        } finally {
            setIsSavingColor(false);
        }
    };

    // ...

    const renderContent = () => {
        switch (activeTab) {
            case 'notifications':
                return <ShiftInbox groupId={group.id} currentUser={currentUser} groupColor={group.color} />;
            case 'calendar':
                return (
                    <div className="flex flex-col">
                        <CalendarView
                            shifts={shifts}
                            assignments={assignments}
                            currentUser={currentUser}
                            currentUserRole={AppRole.PLANTONISTA}
                            groupColor={group.color}
                            showAvailableShifts={false}
                            groupId={group.id}
                            userServiceRole={group.user_role}
                        />

                    </div>
                );
            case 'members':
                return (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-lg font-bold">Membros do Serviço ({members.length})</h3>
                        </div>

                        {loadingMembers ? (
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
                                                    {member.service_role === ServiceRole.ADMIN ? 'ADM' : member.service_role === ServiceRole.ADMIN_AUX ? 'AUX' : 'Plantonista'}
                                                </span>
                                                {member.profile.crm && (
                                                    <span className="text-xs text-slate-400 font-medium">CRM {member.profile.crm}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            case 'history':
                return (
                    <div className="p-6 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Histórico de Plantões</h2>
                        <p className="text-slate-600 dark:text-slate-400">Histórico em desenvolvimento.</p>
                    </div>
                );
            case 'settings':
                return (
                    <div className="p-6 space-y-6 max-w-2xl mx-auto">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Configurações</h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Gerencie suas preferências pessoais neste serviço</p>
                        </div>

                        {/* Personal Color Section */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Cor do Serviço</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Personalize a cor deste serviço apenas para você</p>
                            </div>

                            <ColorPalette
                                selectedColor={selectedColor}
                                onColorChange={handleColorChange}
                            />

                            {isSavingColor && (
                                <p className="text-sm text-slate-500 dark:text-slate-400">Salvando...</p>
                            )}
                        </div>

                        {/* Leave Service Section */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">Sair do Serviço</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Remover-se permanentemente deste serviço</p>
                            </div>

                            {!canLeave && (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                                    <p className="text-sm text-amber-800 dark:text-amber-200">{leaveCheckMessage}</p>
                                </div>
                            )}

                            <button
                                onClick={handleLeaveGroup}
                                disabled={!canLeave || isLeavingGroup}
                                className={`w-full flex items-center justify-center gap-3 p-4 rounded-2xl border font-bold transition-all ${canLeave && !isLeavingGroup
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-600 hover:bg-red-100'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <LogOut size={20} />
                                <span className="text-sm">
                                    {isLeavingGroup ? 'Saindo...' : 'Sair do Serviço'}
                                </span>
                            </button>
                        </div>

                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                                Ao sair, você precisará de um novo convite para retornar
                            </p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col bg-slate-50 dark:bg-slate-950 min-h-full">
            {/* Toolbar */}
            <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0 shadow-sm sticky top-0 z-30">
                <button
                    onClick={() => setActiveTab('calendar')}
                    style={activeTab === 'calendar' ? { color: displayColor, backgroundColor: hexToRgba(displayColor, 0.05) } : undefined}
                    className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'calendar' ? '' : 'text-slate-400'}`}
                >
                    <Calendar size={20} />
                    <span className="text-[10px] font-bold">Calendário</span>
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    style={activeTab === 'notifications' ? { color: displayColor, backgroundColor: hexToRgba(displayColor, 0.05) } : undefined}
                    className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'notifications' ? '' : 'text-slate-400'}`}
                >
                    <Bell size={20} />
                    <span className="text-[10px] font-bold">Avisos</span>
                </button>
                <button
                    onClick={() => setActiveTab('members')}
                    style={activeTab === 'members' ? { color: displayColor, backgroundColor: hexToRgba(displayColor, 0.05) } : undefined}
                    className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'members' ? '' : 'text-slate-400'}`}
                >
                    <Users size={20} />
                    <span className="text-[10px] font-bold">Equipe</span>
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    style={activeTab === 'history' ? { color: displayColor, backgroundColor: hexToRgba(displayColor, 0.05) } : undefined}
                    className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'history' ? '' : 'text-slate-400'}`}
                >
                    <Clock size={20} />
                    <span className="text-[10px] font-bold">Histórico</span>
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    style={activeTab === 'settings' ? { color: displayColor, backgroundColor: hexToRgba(displayColor, 0.05) } : undefined}
                    className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'settings' ? '' : 'text-slate-400'}`}
                >
                    <Settings size={20} />
                    <span className="text-[10px] font-bold">Ajustes</span>
                </button>
            </div>

            <div className="flex-1 relative">
                <div
                    key={activeTab}
                    className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default PlantonistaServiceView;
