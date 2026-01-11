import React, { useState, useEffect } from 'react';
import { Calendar, Users, Settings, Clock, Bell, LogOut } from 'lucide-react';
import { Group, Profile, Shift, ShiftAssignment, AppRole } from '../../types';
import CalendarView from '../CalendarView';
import { canUserLeaveGroup, leaveGroup, updateMemberPersonalColor } from '../../services/api';
import ColorPalette from '../ColorPalette';
import ShiftInbox from '../ShiftInbox';

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
    const [canLeave, setCanLeave] = useState(true);
    const [leaveCheckMessage, setLeaveCheckMessage] = useState('');
    const [isLeavingGroup, setIsLeavingGroup] = useState(false);

    // Personal color state
    const [selectedColor, setSelectedColor] = useState(group.color || '#10b981');
    const [isSavingColor, setIsSavingColor] = useState(false);

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
            alert(leaveCheckMessage);
            return;
        }

        const confirmMessage = 'Deseja realmente sair deste serviço? Você precisará de um novo convite para retornar.';
        if (!confirm(confirmMessage)) return;

        setIsLeavingGroup(true);
        try {
            await leaveGroup(group.id, currentUser.id);
            alert('Você saiu do serviço com sucesso.');
            onBack(); // Return to main view
        } catch (error: any) {
            console.error('Error leaving group:', error);
            alert(error.message || 'Erro ao sair do serviço. Tente novamente.');
        } finally {
            setIsLeavingGroup(false);
        }
    };

    const handleColorChange = async (color: string) => {
        setSelectedColor(color);
        setIsSavingColor(true);
        try {
            await updateMemberPersonalColor(group.id, currentUser.id, color);
            if (onGroupUpdate) {
                onGroupUpdate(); // Refresh group data
            }
        } catch (error) {
            console.error('Error updating color:', error);
            alert('Erro ao salvar cor. Tente novamente.');
            setSelectedColor(group.color || '#10b981'); // Revert
        } finally {
            setIsSavingColor(false);
        }
    };

    // ...

    const renderContent = () => {
        switch (activeTab) {
            case 'notifications':
                return <ShiftInbox groupId={group.id} currentUser={currentUser} />;
            case 'calendar':
                return (
                    <div className="flex flex-col h-full">
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
                    <div className="p-6 space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Membros da Equipe</h2>
                        <p className="text-slate-600 dark:text-slate-400">Lista de membros em desenvolvimento.</p>
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
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* Toolbar */}
            <div className="px-6 py-3 bg-white dark:bg-slate-900 border-b border-gray-50 dark:border-slate-800 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0 shadow-sm">
                <button onClick={() => setActiveTab('calendar')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'calendar' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Calendar size={20} />
                    <span className="text-[10px] font-bold">Calendário</span>
                </button>
                <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'notifications' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Bell size={20} />
                    <span className="text-[10px] font-bold">Avisos</span>
                </button>
                <button onClick={() => setActiveTab('members')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'members' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Users size={20} />
                    <span className="text-[10px] font-bold">Equipe</span>
                </button>

                <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'history' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Clock size={20} />
                    <span className="text-[10px] font-bold">Histórico</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Settings size={20} />
                    <span className="text-[10px] font-bold">Ajustes</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto relative">
                <div
                    key={activeTab}
                    className="h-full animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default PlantonistaServiceView;
