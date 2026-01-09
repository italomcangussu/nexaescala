import React, { useState, useEffect } from 'react';
import { Calendar, Users, History, Settings, Bell, Shield } from 'lucide-react';
import { Group, Profile, AppRole, GroupMember, ServiceRole, Shift, ShiftAssignment } from '../../types';
import { getGroupMembers, getShifts, getAssignments } from '../../services/api';
import CalendarView from '../CalendarView';
import ShiftInbox from '../ShiftInbox';
import ServiceChat from '../ServiceChat';

interface PlantonistaServiceViewProps {
    group: Group;
    currentUser: Profile;
}

// ... 

const PlantonistaServiceView: React.FC<PlantonistaServiceViewProps> = ({ group, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'calendar' | 'members' | 'history' | 'settings' | 'notifications'>('calendar');

    // Data State
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

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
            setShifts(shiftsData);

            const shiftIds = shiftsData.map(s => s.id);
            if (shiftIds.length > 0) {
                const assignmentsData = await getAssignments(shiftIds);
                setAssignments(assignmentsData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'members' && members.length === 0) {
            fetchMembers();
        }
    }, [activeTab]);

    const fetchMembers = async () => {
        setIsLoadingData(true); // Use isLoadingData for all data fetching
        try {
            const data = await getGroupMembers(group.id);
            setMembers(data);
        } catch (error) {
            console.error("Error fetching members:", error);
        } finally {
            setIsLoadingData(false);
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
                                shifts={shifts}
                                assignments={assignments}
                            />
                        </div>
                    </div>
                );
            case 'members':
                return (
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-lg font-bold">Membros do Serviço ({members.length})</h3>
                        </div>

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
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                            <img src={member.profile.avatar_url} alt={member.profile.full_name} className="w-full h-full object-cover" />
                                        </div>

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
                                    </div>
                                ))}
                            </div>
                        )}
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
                    <span className="text-[10px] font-bold">Escala</span>
                </button>
                <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'notifications' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Bell size={20} />
                    <span className="text-[10px] font-bold">Solicitações</span>
                </button>
                <button onClick={() => setActiveTab('members')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'members' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Users size={20} />
                    <span className="text-[10px] font-bold">Equipe</span>
                </button>
                {/* ... other buttons */}
                <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'history' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <History size={20} />
                    <span className="text-[10px] font-bold">Log</span>
                </button>
                <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl transition-all ${activeTab === 'settings' ? 'text-primary bg-primary/5' : 'text-slate-400'}`}>
                    <Settings size={20} />
                    <span className="text-[10px] font-bold">Ajustes</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto relative">
                {renderContent()}
            </div>
        </div>
    );
};

export default PlantonistaServiceView;
