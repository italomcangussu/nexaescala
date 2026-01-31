import React, { useState, useEffect } from 'react';
import DesktopLayout from '../components/DesktopLayout';
import DesktopScaleEditor from '../components/DesktopScaleEditor';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { Group } from '../types';
import { Calendar, Users, FileEdit, Wallet, Loader2 } from 'lucide-react';

const DesktopMainApp: React.FC = () => {
    const { profile: currentUser, signOut } = useAuth();
    const { userGroups, shifts, assignments, isLoading } = useDashboardData(currentUser);

    const [activeTab, setActiveTab] = useState('editor');
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [showEditor, setShowEditor] = useState(false);

    // Select first group on load
    useEffect(() => {
        if (userGroups.length > 0 && !selectedGroup) {
            setSelectedGroup(userGroups[0]);
        }
    }, [userGroups, selectedGroup]);

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
                    <button
                        onClick={() => { setActiveTab('editor'); setShowEditor(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 rounded-xl text-white font-semibold text-sm transition-colors"
                    >
                        <FileEdit size={18} />
                        Abrir Editor de Escala
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors">
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
                        {userGroups.map(group => (
                            <button
                                key={group.id}
                                onClick={() => { setSelectedGroup(group); setActiveTab('editor'); setShowEditor(true); }}
                                className="w-full flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                                    style={{ backgroundColor: group.color || '#10b981' }}
                                >
                                    {group.name?.charAt(0) || 'S'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold text-slate-800 dark:text-white block truncate">
                                        {group.name}
                                    </span>
                                    <span className="text-xs text-slate-400 block truncate">
                                        {group.institution}
                                    </span>
                                </div>
                                <span className="text-xs text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md font-medium">
                                    {group.user_role}
                                </span>
                            </button>
                        ))}
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

    // Render Calendar placeholder
    const renderCalendar = () => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <Calendar size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Calendário
            </h3>
            <p className="text-slate-500">Em breve: visualização de calendário integrada</p>
        </div>
    );

    // Render Finance placeholder
    const renderFinance = () => (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <Wallet size={48} className="text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                Financeiro
            </h3>
            <p className="text-slate-500">Em breve: relatórios financeiros e controle de pagamentos</p>
        </div>
    );

    // Render content based on active tab
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
            );
        }

        switch (activeTab) {
            case 'home':
                return renderDashboard();
            case 'calendar':
                return renderCalendar();
            case 'editor':
                if (showEditor && selectedGroup) {
                    return (
                        <DesktopScaleEditor
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
            onProfileClick={() => { }}
        >
            {renderContent()}
        </DesktopLayout>
    );
};

export default DesktopMainApp;
