import React, { useState } from 'react';
import Layout from '../components/Layout';
import CalendarView from '../components/CalendarView';
import ShiftCard from '../components/ShiftCard';
import GroupCard from '../components/GroupCard';
import SocialFeedView from '../components/SocialFeedView';
import ProfileView from '../components/ProfileView';
import EditProfileModal from '../components/EditProfileModal';
import { ServiceEditor } from '../components/service-editor';
import ServiceDetailView from '../components/ServiceDetailView';
import FinanceDashboard from '../components/FinanceDashboard';
import ShiftCheckoutModal from '../components/ShiftCheckoutModal';
import FinancialConfigModal from '../components/FinancialConfigModal';
import NotificationManager from '../components/NotificationManager';
import Logo from '../components/Logo';
import {
  MOCK_POSTS,
  MOCK_FINANCIAL_CONFIGS
} from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';

import { Profile, Shift, ServiceRole, Group, FinancialConfig } from '../types';
import { Search, FilePlus, Share2, X, Plus, Calendar, Users } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Navigation State
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [activeHomeTab, setActiveHomeTab] = useState<'shifts' | 'groups'>('shifts');



  // Data State
  const { profile: currentUser, signOut } = useAuth();

  // Custom Hooks for Data
  const {
    profiles,
    setProfiles,
    userGroups,
    shifts,
    assignments,
    userRole,
    refresh
  } = useDashboardData(currentUser);



  // Overlay States
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Group | null>(null);

  // Finance States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutShift, setCheckoutShift] = useState<Shift | null>(null);
  const [isFinConfigOpen, setIsFinConfigOpen] = useState(false);
  const [finConfigGroup, setFinConfigGroup] = useState<Group | null>(null);

  // Guard clause - MUST be after all hooks
  if (!currentUser) return null;

  // Hydrate data
  const hydratedAssignments = assignments.map(a => ({
    ...a,
    profile: profiles.find(p => p.id === a.profile_id)
  }));

  const myShifts = shifts.filter(s =>
    assignments.some(a => a.shift_id === s.id && a.profile_id === currentUser.id) ||
    assignments.some(a => a.shift_id === s.id)
  );

  const handleEditShift = (shift: Shift) => {
    alert(`Editar configurações do plantão: ${shift.date}`);
  };

  const handleProfileClick = (profileId: string) => {
    setViewingProfileId(profileId);
  };

  const handleSaveProfile = (updatedProfile: Profile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
    setIsEditingProfile(false);
  };

  const handleFinishWizard = async (group?: Group, navigate?: boolean) => {
    await refresh();
    if (group && navigate) {
      setSelectedService(group);
    }
    setIsWizardOpen(false);
  };

  // Finance Handlers
  const handleSimulateCheckout = () => {
    // Find last unpaid shift from Mock for Demo
    // In real app, user selects specific shifts
    const lastShift = myShifts[0]; // Just picking first for demo
    if (lastShift) {
      setCheckoutShift(lastShift);
      setIsCheckoutOpen(true);
    } else {
      alert("Nenhum plantão recente encontrado para checkout.");
    }
  };

  const handleSaveFinConfig = (config: FinancialConfig) => {
    console.log("Saving Config:", config);
    setIsFinConfigOpen(false);
    // Ideally Refetch or optimistic update
  };

  const handleConfirmCheckout = (data: any) => {
    console.log("Checkout Confirmed:", data);
    setIsCheckoutOpen(false);
    alert("Checkout realizado com sucesso (Simulação)!");
  };

  const renderHomeContent = () => {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-4 bg-surface dark:bg-slate-900 sticky top-0 z-20 transition-colors">
          <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-lg flex shadow-inner transition-colors">
            <button
              onClick={() => setActiveHomeTab('shifts')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeHomeTab === 'shifts' ? 'bg-white dark:bg-slate-700 text-textPrimary dark:text-slate-100 shadow-sm' : 'text-textSecondary dark:text-slate-400 hover:text-textPrimary dark:hover:text-slate-200'}`}
            >
              Meus Plantões
            </button>
            <button
              onClick={() => setActiveHomeTab('groups')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all ${activeHomeTab === 'groups' ? 'bg-white dark:bg-slate-700 text-textPrimary dark:text-slate-100 shadow-sm' : 'text-textSecondary dark:text-slate-400 hover:text-textPrimary dark:hover:text-slate-200'}`}
            >
              Serviços
            </button>
          </div>
        </div>

        <div className="px-4 pb-24">
          {activeHomeTab === 'shifts' ? (
            <div className="space-y-4">
              {myShifts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Calendar size={32} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Sem Plantões no momento</p>
                </div>
              ) : (
                myShifts.map(shift => {
                  const assignment = hydratedAssignments.find(a => a.shift_id === shift.id);
                  return (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      assignment={assignment}
                      currentUserRole={userRole}
                      onEdit={handleEditShift}
                    />
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar serviço"
                  className="w-full bg-white dark:bg-slate-800 border-none rounded-lg py-3 pl-10 pr-4 shadow-sm text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-slate-200 placeholder-slate-400 transition-colors"
                />
                <Search size={18} className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" />
              </div>

              {userGroups.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Users size={32} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Você não está em nenhum serviço no momento</p>
                </div>
              ) : (
                [
                  { title: 'Plantonista', role: ServiceRole.PLANTONISTA },
                  { title: 'Administrador (ADM)', role: ServiceRole.ADMIN },
                  { title: 'Administrador Auxiliar (AUX)', role: ServiceRole.ADMIN_AUX },
                  { title: 'Visitante', role: ServiceRole.VISITANTE }
                ].map(cat => {
                  const groups = userGroups.filter(g => g.user_role === cat.role);
                  if (groups.length === 0) return null;
                  return (
                    <div key={cat.title}>
                      <h3 className="text-xs font-bold text-textSecondary dark:text-slate-500 uppercase tracking-wider mb-2">{cat.title}</h3>
                      <div onClick={() => setSelectedService(groups[0])}>
                        {groups.map(group => (
                          <div key={group.id} onClick={() => setSelectedService(group)}>
                            <GroupCard group={group} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeBottomTab) {
      case 'home': return renderHomeContent();
      case 'calendar': return <CalendarView shifts={shifts} assignments={hydratedAssignments} currentUser={currentUser} currentUserRole={userRole} />;

      case 'finance': return (
        <FinanceDashboard
          currentUser={currentUser}
          userGroups={userGroups} // Passing fetched groups
          onSimulateCheckout={handleSimulateCheckout}
          onConfigureService={(group) => {
            setFinConfigGroup(group);
            setIsFinConfigOpen(true);
          }}
        />
      );

      case 'colleagues': return <SocialFeedView posts={MOCK_POSTS} profiles={profiles} currentUser={currentUser} onProfileClick={handleProfileClick} />;
      default: return null;
    }
  };

  return (
    <Layout
      activeTab={activeBottomTab}
      onTabChange={setActiveBottomTab}
      currentUser={currentUser}
      onProfileClick={() => handleProfileClick(currentUser.id)}
      onSignOut={signOut}
    >
      <NotificationManager />

      {renderContent()}

      {/* FAB (Custom Logo + Plus) */}
      {activeBottomTab !== 'colleagues' && (
        <div className="fixed bottom-24 right-4 z-50">
          <button
            onClick={() => setIsFabOpen(true)}
            className="w-16 h-16 rounded-full shadow-float flex items-center justify-center bg-white dark:bg-slate-800 active:scale-95 transition-transform relative group border border-primary/20"
          >
            <Logo className="w-10 h-10" />
            <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800">
              <Plus size={12} className="text-white" strokeWidth={4} />
            </div>
          </button>
        </div>
      )}

      {/* FAB Overlay (Animated) */}
      {isFabOpen && (
        <div className="fixed inset-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in-up">
          <button onClick={() => setIsFabOpen(false)} className="absolute top-6 left-6 p-2 bg-gray-100 dark:bg-slate-800 rounded-full">
            <X size={24} className="text-slate-500" />
          </button>

          <div className="scale-150 mb-10 animate-pulse-slow">
            <Logo className="w-24 h-24" />
          </div>

          <div className="space-y-4 w-full max-w-xs px-4">
            <button
              onClick={() => { setIsFabOpen(false); setIsWizardOpen(true); }}
              className="w-full bg-primary text-white p-4 rounded-2xl flex items-center gap-4 shadow-lg shadow-emerald-200 dark:shadow-none hover:scale-105 transition-transform"
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <FilePlus size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Novo Serviço</h3>
                <p className="text-xs opacity-90">Sou o Administrador (ADM) da Escala</p>
              </div>
            </button>

            <button
              onClick={() => { alert("Link de convite copiado!"); setIsFabOpen(false); }}
              className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:scale-105 transition-transform"
            >
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <Share2 size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-lg">Convidar outro ADM</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Compartilhar App</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Service Creation/Editing Wizard */}
      {isWizardOpen && (
        <ServiceEditor
          mode="create"
          onClose={() => setIsWizardOpen(false)}
          currentUser={currentUser}
          onFinish={handleFinishWizard}
        />
      )}

      {/* Service Detail View (Role Based) */}
      {selectedService && (
        <ServiceDetailView
          group={selectedService}
          currentUser={currentUser}
          onClose={() => setSelectedService(null)}
        />
      )}

      {/* --- FINANCE MODALS --- */}
      {isCheckoutOpen && checkoutShift && (
        <ShiftCheckoutModal
          shift={checkoutShift}
          config={MOCK_FINANCIAL_CONFIGS['g1']} // Mocking G1 config for demo
          onClose={() => setIsCheckoutOpen(false)}
          onConfirm={handleConfirmCheckout}
        />
      )}

      {isFinConfigOpen && finConfigGroup && (
        <FinancialConfigModal
          group={finConfigGroup}
          onClose={() => setIsFinConfigOpen(false)}
          onSave={handleSaveFinConfig}
          initialConfig={MOCK_FINANCIAL_CONFIGS[finConfigGroup.id]}
        />
      )}

      {/* Other Modals */}
      {viewingProfileId && <ProfileView profile={profiles.find(p => p.id === viewingProfileId) || currentUser} currentUser={currentUser} onBack={() => setViewingProfileId(null)} onEdit={() => setIsEditingProfile(true)} />}
      {isEditingProfile && <EditProfileModal profile={currentUser} onClose={() => setIsEditingProfile(false)} onSave={handleSaveProfile} />}
    </Layout>
  );
};

export default Dashboard;