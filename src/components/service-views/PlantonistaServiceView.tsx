import React, { useState } from 'react';
import { Calendar, Users, History, Settings, Bell } from 'lucide-react';
import { Group, Profile, AppRole } from '../../types';
import CalendarView from '../CalendarView';
import { INITIAL_SHIFTS, INITIAL_ASSIGNMENTS } from '../../services/dataService'; // Using mock data
import ShiftInbox from '../ShiftInbox';
import ServiceChat from '../ServiceChat';

interface PlantonistaServiceViewProps {
    group: Group;
    currentUser: Profile;
}

// ... 

const PlantonistaServiceView: React.FC<PlantonistaServiceViewProps> = ({ group, currentUser }) => {
    const [activeTab, setActiveTab] = useState<'calendar' | 'members' | 'history' | 'settings' | 'notifications'>('calendar');

    // ... 

    const renderContent = () => {
        switch (activeTab) {
            case 'notifications':
                return <ShiftInbox groupId={group.id} currentUser={currentUser} />;
            case 'calendar':
                return (
                    <div className="flex flex-col h-full">
                        <CalendarView
                            shifts={INITIAL_SHIFTS.filter(s => s.group_id === group.id)}
                            assignments={INITIAL_ASSIGNMENTS}
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
                                shifts={INITIAL_SHIFTS.filter(s => s.group_id === group.id)}
                                assignments={INITIAL_ASSIGNMENTS}
                            />
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
