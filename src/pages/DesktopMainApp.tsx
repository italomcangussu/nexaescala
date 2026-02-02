import React, { useState, useEffect } from 'react';
import DesktopLayout from '../components/DesktopLayout';
import DesktopScaleEditor from '../components/DesktopScaleEditor';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Group } from '../types';
import { Calendar, Users, FileEdit, Wallet, Loader2, ArrowLeft } from 'lucide-react';
import CalendarView from '../components/CalendarView';
import FinanceDashboard from '../components/FinanceDashboard';
import ProfileView from '../components/ProfileView';
import EditProfileModal from '../components/EditProfileModal';
import SettingsMain from '../components/settings/SettingsMain';
import SettingsPrivacy from '../components/settings/SettingsPrivacy';
import SettingsNotifications from '../components/settings/SettingsNotifications';
import SettingsHelp from '../components/settings/SettingsHelp';
import SettingsAbout from '../components/settings/SettingsAbout';
import SettingsPassword from '../components/settings/SettingsPassword';
import { getFinancialConfig, saveFinancialConfig } from '../services/api';
import FinancialConfigModal from '../components/FinancialConfigModal';
import { AppRole, FinancialConfig, ServiceRole } from '../types';

const DesktopMainApp: React.FC = () => {
    const { profile: currentUser, signOut, refetchProfile } = useAuth();
    const { userGroups, shifts, assignments, isLoading, profiles, setProfiles, userRole } = useDashboardData(currentUser);

    const [activeTab, setActiveTab] = useState('home');
    const [activeSettingsView, setActiveSettingsView] = useState('main');
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Finance States
    const [isFinConfigOpen, setIsFinConfigOpen] = useState(false);
    const [finConfigGroup, setFinConfigGroup] = useState<Group | null>(null);
    const [finConfig, setFinConfig] = useState<FinancialConfig | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    // Filter groups by admin privilege
    const adminGroups = userGroups.filter(g =>
        g.user_role === ServiceRole.ADMIN || g.user_role === ServiceRole.ADMIN_AUX
    );

    // Select first group on load (prioritize admin groups)
    useEffect(() => {
        if (!selectedGroup) {
            if (adminGroups.length > 0) {
                setSelectedGroup(adminGroups[0]);
            } else if (userGroups.length > 0) {
                setSelectedGroup(userGroups[0]);
            }
        }
    }, [userGroups, adminGroups, selectedGroup]);

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    // Render Dashboard content
    const renderDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Summary Cards */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Calendar size={24} className="text-primary" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">
                            {shifts.length}
                        </span>
                        <p className="text-xs text-slate-500 font-medium">Turnos este mês</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <FileEdit size={24} className="text-emerald-500" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">
                            {assignments.length}
                        </span>
                        <p className="text-xs text-slate-500 font-medium">Atribuições</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Users size={24} className="text-blue-500" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">
                            {userGroups.length}
                        </span>
                        <p className="text-xs text-slate-500 font-medium">Serviços</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <Wallet size={24} className="text-amber-500" />
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-800 dark:text-white">
                            R$ 0
                        </span>
                        <p className="text-xs text-slate-500 font-medium">Pendente</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="col-span-full bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    Ações Rápidas
                </h3>
                <div className="flex flex-wrap gap-3">
                    {adminGroups.length > 0 && (
                        <button
                            onClick={() => {
                                if (!selectedGroup || !(selectedGroup.user_role === ServiceRole.ADMIN || selectedGroup.user_role === ServiceRole.ADMIN_AUX)) {
                                    setSelectedGroup(adminGroups[0]);
                                }
                                setActiveTab('editor');
                                setShowEditor(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-xl text-white font-semibold text-sm transition-colors"
                        >
                            <FileEdit size={18} />
                            Abrir Editor de Escala
                        </button>
                    )}
                    <button
                        onClick={() => setActiveTab('calendar')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                    >
                        <Calendar size={18} />
                        Ver Calendário
                    </button>
                </div>
            </div>

            {/* Services List */}
            <div className="col-span-full lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    Meus Serviços
                </h3>

                {userGroups.length === 0 ? (
                    <p className="text-slate-400 text-sm">Nenhum serviço encontrado</p>
                ) : (
                    <div className="space-y-3">
                        {userGroups.map(group => {
                            const isGroupAdmin = group.user_role === ServiceRole.ADMIN || group.user_role === ServiceRole.ADMIN_AUX;
                            return (
                                <button
                                    key={group.id}
                                    onClick={() => {
                                        setSelectedGroup(group);
                                        if (isGroupAdmin) {
                                            setActiveTab('editor');
                                            setShowEditor(true);
                                        } else {
                                            setActiveTab('calendar');
                                            setShowEditor(false);
                                        }
                                    }}
                                    className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left group"
                                >
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                                        style={{ backgroundColor: group.color || '#10b981' }}
                                    >
                                        {group.name?.charAt(0) || 'S'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-slate-800 dark:text-white block truncate">
                                                {group.name}
                                            </span>
                                            {isGroupAdmin && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Administrador" />
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-400 block truncate">
                                            {group.institution}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${isGroupAdmin
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                            }`}>
                                            {group.user_role === ServiceRole.ADMIN ? 'Gestor' :
                                                group.user_role === ServiceRole.ADMIN_AUX ? 'Auxiliar' :
                                                    group.user_role === ServiceRole.PLANTONISTA ? 'Plantonista' : 'Visitante'}
                                        </span>
                                        {isGroupAdmin && (
                                            <span className="text-[10px] text-primary font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <FileEdit size={10} />
                                                Editar Escala
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="col-span-full lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                    Atividades Recentes
                </h3>
                <p className="text-slate-400 text-sm">Nenhuma atividade recente</p>
            </div>
        </div>
    );

    const handleSaveProfile = async (updatedProfile: any) => {
        setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
        if (currentUser && updatedProfile.id === currentUser.id) {
            await refetchProfile();
        }
        setIsEditingProfile(false);
    };

    const handleSaveFinConfig = async (config: FinancialConfig) => {
        if (!currentUser) return;
        try {
            await saveFinancialConfig(currentUser.id, config);
        } catch (error) {
            console.error("Error saving config:", error);
        }
    };

    // Render Calendar
    const renderCalendar = () => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px]">
            <CalendarView
                shifts={shifts}
                assignments={assignments.map(a => ({ ...a, profile: profiles.find(p => p.id === a.profile_id) }))}
                currentUser={currentUser!}
                currentUserRole={userRole || AppRole.MEDICO}
                userGroups={userGroups}
            />
        </div>
    );

    // Render Finance
    const renderFinance = () => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px]">
            <FinanceDashboard
                currentUser={currentUser!}
                userGroups={userGroups}
                onSimulateCheckout={() => { alert("Simulação de checkout disponível em breve no Desktop") }}
                onConfigureService={async (group) => {
                    setFinConfigGroup(group);
                    const config = await getFinancialConfig(currentUser!.id, group.id);
                    setFinConfig(config);
                    setIsFinConfigOpen(true);
                }}
            />
        </div>
    );

    // Render Settings
    const renderSettings = () => {
        const renderSettingsContent = () => {
            switch (activeSettingsView) {
                case 'privacy': return <SettingsPrivacy onBack={() => setActiveSettingsView('main')} onNavigate={setActiveSettingsView} />;
                case 'notifications': return <SettingsNotifications onBack={() => setActiveSettingsView('main')} />;
                case 'password': return <SettingsPassword onBack={() => setActiveSettingsView('main')} />;
                case 'help': return <SettingsHelp onBack={() => setActiveSettingsView('main')} />;
                case 'about': return <SettingsAbout onBack={() => setActiveSettingsView('main')} />;
                default: return <SettingsMain onNavigate={setActiveSettingsView} onSignOut={signOut} />;
            }
        };

        return (
            <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-8">
                {activeSettingsView !== 'main' && (
                    <button
                        onClick={() => setActiveSettingsView('main')}
                        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold"
                    >
                        <ArrowLeft size={18} />
                        Voltar para Configurações
                    </button>
                )}
                {renderSettingsContent()}
            </div>
        );
    };

    // Render Profile
    const renderProfile = () => (
        <div className="max-w-4xl mx-auto">
            <ProfileView
                profile={currentUser!}
                currentUser={currentUser!}
                onBack={() => setActiveTab('home')}
                onEdit={() => setIsEditingProfile(true)}
            />
        </div>
    );

    // Render content based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return renderDashboard();
            case 'calendar':
                return renderCalendar();
            case 'editor':
                if (showEditor && selectedGroup) {
                    const isGroupAdmin = selectedGroup.user_role === ServiceRole.ADMIN || selectedGroup.user_role === ServiceRole.ADMIN_AUX;

                    if (!isGroupAdmin) {
                        return (
                            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                                <FileEdit size={48} className="text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Acesso Restrito</h3>
                                <p className="text-slate-500 text-sm max-w-md text-center mt-2">
                                    Você não tem permissão de administrador para editar a escala deste serviço.
                                </p>
                                <button
                                    onClick={() => { setShowEditor(false); setActiveTab('home'); }}
                                    className="mt-6 px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20"
                                >
                                    Voltar ao Início
                                </button>
                            </div>
                        );
                    }

                    return (
                        <DesktopScaleEditor
                            key={selectedGroup.id}
                            currentUser={currentUser}
                            userGroups={userGroups}
                            initialGroup={selectedGroup}
                            onBack={() => { setShowEditor(false); setActiveTab('home'); }}
                        />
                    );
                }
                return renderDashboard();
            case 'finance':
                return renderFinance();
            case 'settings':
                return renderSettings();
            case 'profile':
                return renderProfile();
            default:
                return renderDashboard();
        }
    };

    return (
        <DesktopLayout
            currentUser={currentUser}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onSignOut={signOut}
            isLoading={isLoading}
            isAdmin={adminGroups.length > 0}
        >
            {renderContent()}
            {isEditingProfile && (
                <EditProfileModal
                    profile={currentUser!}
                    onClose={() => setIsEditingProfile(false)}
                    onSave={handleSaveProfile}
                />
            )}
            {isFinConfigOpen && finConfigGroup && (
                <FinancialConfigModal
                    group={finConfigGroup}
                    onClose={() => {
                        setIsFinConfigOpen(false);
                        setFinConfig(null);
                    }}
                    onSave={handleSaveFinConfig}
                    initialConfig={finConfig || undefined}
                />
            )}
        </DesktopLayout>
    );
};

export default DesktopMainApp;
