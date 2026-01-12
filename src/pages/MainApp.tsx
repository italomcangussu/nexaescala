import React, { useState } from 'react';
import Layout from '../components/Layout';
import CalendarView from '../components/CalendarView';
import ShiftCard from '../components/ShiftCard';
import GroupCard from '../components/GroupCard';
import ProfileView from '../components/ProfileView';
import EditProfileModal from '../components/EditProfileModal';
import { ServiceEditor } from '../components/service-editor';
import ServiceDetailView from '../components/ServiceDetailView';
import ScaleEditorView from '../components/ScaleEditorView';
import FinanceDashboard from '../components/FinanceDashboard';
import ShiftCheckoutModal from '../components/ShiftCheckoutModal';
import FinancialConfigModal from '../components/FinancialConfigModal';
import NotificationManager from '../components/NotificationManager';
import Logo from '../components/Logo';
import ActionableNotificationCard from '../components/ActionableNotificationCard';
import ExchangeResponseModal from '../components/ExchangeResponseModal';
import TradeHistory from '../components/TradeHistory';
import DraggableFAB from '../components/DraggableFAB';
import { usePendingRequests } from '../hooks/usePendingRequests';

import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';

import { Profile, Shift, ServiceRole, Group, FinancialConfig, ShiftPreset, Notification as AppNotification } from '../types';
import { Search, FilePlus, Share2, X, Calendar, Users, Sparkles } from 'lucide-react';
import { getFinancialConfig, createFinancialRecord, saveFinancialConfig } from '../services/api';

const Dashboard: React.FC = () => {
  // Navigation State
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [activeHomeTab, setActiveHomeTab] = useState<'shifts' | 'groups' | 'requests'>('shifts');



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
    exchanges,
    pendingSwapRequests,
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
  const [checkoutConfig, setCheckoutConfig] = useState<FinancialConfig | null>(null);
  const [isFinConfigOpen, setIsFinConfigOpen] = useState(false);
  const [finConfigGroup, setFinConfigGroup] = useState<Group | null>(null);
  const [finConfig, setFinConfig] = useState<FinancialConfig | null>(null);

  // Navigation State for Editor
  const [editorTargetGroup, setEditorTargetGroup] = useState<Group | null>(null);
  const [editorInitialDate, setEditorInitialDate] = useState<Date | undefined>(undefined);
  const [editorInitialPresets, setEditorInitialPresets] = useState<ShiftPreset[]>([]);

  // Pending Actions State
  const {
    pendingSwaps,
    pendingGiveaways,
    isActionLoading,
    handleAccept,
    handleDecline,
    refresh: refreshPending
  } = usePendingRequests(currentUser);

  const [respondingToSwap, setRespondingToSwap] = useState<any>(null);

  // Keep selectedService in sync with userGroups updates (e.g. after color change)
  React.useEffect(() => {
    if (selectedService) {
      const updated = userGroups.find(g => g.id === selectedService.id);
      // Only update if the object reference changed but ID is same, implies data refresh
      if (updated && updated !== selectedService) {
        setSelectedService(updated);
      }
    }
  }, [userGroups, selectedService]);

  // Guard clause - MUST be after all hooks
  if (!currentUser) return null;



  // Hydrate data
  const hydratedAssignments = assignments.map(a => ({
    ...a,
    profile: profiles.find(p => p.id === a.profile_id)
  }));

  const myShifts = shifts.filter(s => {
    // Only show published shifts
    if (!s.is_published) return false;

    return assignments.some(a => a.shift_id === s.id && a.profile_id === currentUser.id);
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) return dateA - dateB;
    return a.start_time.localeCompare(b.start_time);
  });

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

  const handleFinishWizard = async (group?: Group, navigate?: boolean, presets?: ShiftPreset[]) => {
    await refresh();
    if (group && navigate) {
      // Updated: Open the editor in 'selector' mode (months overview)
      setEditorTargetGroup(group);
      setEditorInitialDate(undefined);
      setEditorInitialPresets(presets || []);
    } else if (group) {
      setSelectedService(group); // Just open detail
    }
    setIsWizardOpen(false);
  };

  const handleOpenScaleEditor = (group: Group) => {
    setEditorTargetGroup(group);
    setEditorInitialDate(undefined); // Default to current date for existing services
    setEditorInitialPresets([]); // Clear local presets so it fetches
  };

  // Finance Handlers
  const handleSimulateCheckout = async () => {
    const lastShift = myShifts[0];
    if (lastShift && currentUser) {
      try {
        const config = await getFinancialConfig(currentUser.id, lastShift.group_id);
        if (config) {
          setCheckoutConfig(config);
          setCheckoutShift(lastShift);
          setIsCheckoutOpen(true);
        } else {
          // If no config, open config modal first or show error
          setFinConfigGroup(userGroups.find(g => g.id === lastShift.group_id) || null);
          setIsFinConfigOpen(true);
          alert("Por favor, configure seus honorários para este serviço primeiro.");
        }
      } catch (error) {
        console.error("Error fetching checkout config:", error);
      }
    } else {
      alert("Nenhum plantão recente encontrado para checkout.");
    }
  };

  const onActionAccept = async (item: any) => {
    const result = await handleAccept(item);
    if (result?.type === 'OPEN_MODAL') {
      setRespondingToSwap(result.item);
    } else {
      await refresh();
    }
  };

  const onActionDecline = async (item: any) => {
    await handleDecline(item);
    await refresh();
  };

  const handleSaveFinConfig = async (config: FinancialConfig) => {
    if (!currentUser) return;
    try {
      await saveFinancialConfig(currentUser.id, config);
      setIsFinConfigOpen(false);
      // Success
    } catch (error) {
      console.error("Error saving config:", error);
    }
  };

  const handleConfirmCheckout = async (data: any) => {
    if (!checkoutShift || !currentUser) return;

    try {
      await createFinancialRecord({
        user_id: currentUser.id,
        shift_id: checkoutShift.id,
        date: checkoutShift.date,
        group_name: checkoutShift.institution_name || 'Hospital',
        fixed_earnings: data.fixed_earnings || 0,
        production_quantity: data.productionQty,
        production_earnings: (data.productionQty * (data.production_value_unit || 0)),
        extras_value: data.extraValue,
        extras_description: data.extraDesc,
        gross_total: data.grossTotal,
        net_total: data.netTotal,
        is_paid: false
      });
      setIsCheckoutOpen(false);
      alert("Checkout realizado com sucesso!");
    } catch (error) {
      console.error("Error saving checkout:", error);
      alert("Erro ao salvar checkout.");
    }
  };

  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.metadata && notification.metadata.group_id) {
      const group = userGroups.find(g => g.id === notification.metadata.group_id);
      if (group) {
        setSelectedService(group);
        setActiveBottomTab('home');
      }
    } else if (notification.type === 'SHIFT_SWAP' || notification.type === 'SHIFT_OFFER') {
      setActiveBottomTab('home');
      setActiveHomeTab('requests');
    }
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
            <button
              onClick={() => setActiveHomeTab('requests')}
              className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-all relative ${activeHomeTab === 'requests' ? 'bg-white dark:bg-slate-700 text-textPrimary dark:text-slate-100 shadow-sm' : 'text-textSecondary dark:text-slate-400 hover:text-textPrimary dark:hover:text-slate-200'}`}
            >
              Solicitações
              {(pendingGiveaways.length + pendingSwaps.length) > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-bounce-subtle">
                  {pendingGiveaways.length + pendingSwaps.length}
                </span>
              )}
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
                  const pendingExchange = exchanges.find(ex =>
                    ex.status === 'PENDING' &&
                    ex.requesting_profile_id === currentUser.id &&
                    ex.offered_shift_assignment_id === assignment?.id
                  );
                  const pendingSwapRequest = pendingSwapRequests.find(req =>
                    req.status === 'PENDING' &&
                    req.requesting_user_id === currentUser.id &&
                    req.offered_shift_id === shift.id
                  );
                  return (
                    <ShiftCard
                      key={shift.id}
                      shift={shift}
                      assignment={assignment}
                      currentUserRole={userRole}
                      onEdit={handleEditShift}
                      currentUserId={currentUser.id}
                      onRefresh={refresh}
                      pendingExchange={pendingExchange}
                      pendingSwapRequest={pendingSwapRequest}
                    />
                  );
                })
              )}
            </div>
          ) : activeHomeTab === 'groups' ? (
            <div className="space-y-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquisar serviço"
                  className="w-full bg-white dark:bg-slate-800 border-none rounded-lg py-3 pl-10 pr-4 shadow-sm text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-slate-200 placeholder-slate-400 transition-colors"
                />
                <Search size={18} className="absolute left-3 top-3 text-gray-400 dark:text-slate-500" />
              </div>

              {/* Home Tabs */}
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
                      <div>
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
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-amber-500" />
                Deseja Trocar ou Repassar algum plantão?
              </h2>

              {(() => {
                const directedSwaps = pendingSwaps;
                const directedGiveaways = pendingGiveaways.filter(g => g.target_profile_id === currentUser.id);
                const globalGiveaways = pendingGiveaways.filter(g => !g.target_profile_id);

                const directedCount = directedSwaps.length + directedGiveaways.length;
                const globalCount = globalGiveaways.length;

                return (
                  <div className="space-y-8">
                    {/* Directed Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Direcionadas</h3>
                          <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black ${directedCount > 0 ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {directedCount}
                          </span>
                        </div>
                      </div>

                      {directedCount === 0 ? (
                        <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Nenhuma solicitação direcionada</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {directedGiveaways.map(g => (
                            <ActionableNotificationCard
                              key={g.id}
                              item={g}
                              onAccept={onActionAccept}
                              onDecline={onActionDecline}
                              isLoading={isActionLoading === g.id}
                            />
                          ))}
                          {directedSwaps.map(s => (
                            <ActionableNotificationCard
                              key={s.id}
                              item={s}
                              onAccept={onActionAccept}
                              onDecline={onActionDecline}
                              isLoading={isActionLoading === s.id}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Global Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Globais (Feed)</h3>
                          <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black ${globalCount > 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                            {globalCount}
                          </span>
                        </div>
                      </div>

                      {globalCount === 0 ? (
                        <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl p-6 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Nenhuma oferta global disponível</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {globalGiveaways.map(g => (
                            <ActionableNotificationCard
                              key={g.id}
                              item={g}
                              onAccept={onActionAccept}
                              onDecline={onActionDecline}
                              isLoading={isActionLoading === g.id}
                            />
                          ))}
                        </div>
                      )}
                    </div>


                    {/* Trade History Section */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <TradeHistory currentUser={currentUser} />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div >
    );
  };

  const renderContent = () => {
    switch (activeBottomTab) {
      case 'home': return renderHomeContent();
      case 'calendar': return <CalendarView shifts={shifts} assignments={hydratedAssignments} currentUser={currentUser} currentUserRole={userRole} userGroups={userGroups} />;
      case 'finance': return (
        <FinanceDashboard
          currentUser={currentUser}
          userGroups={userGroups}
          onSimulateCheckout={handleSimulateCheckout}
          onConfigureService={async (group) => {
            setFinConfigGroup(group);
            const config = await getFinancialConfig(currentUser.id, group.id);
            setFinConfig(config);
            setIsFinConfigOpen(true);
          }}
        />
      );

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
      onNotificationClick={handleNotificationClick}
    >
      <NotificationManager />

      {renderContent()}

      {/* LiquidGlass Draggable FAB */}
      {activeBottomTab !== 'editor' && (
        <DraggableFAB key="fab-reset-v4" onClick={() => setIsFabOpen(true)} />
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

      {/* Exchange Response Modal */}
      {respondingToSwap && (
        <ExchangeResponseModal
          request={respondingToSwap}
          onClose={() => setRespondingToSwap(null)}
          onSuccess={() => {
            setRespondingToSwap(null);
            refresh();
            refreshPending();
          }}
        />
      )}
      {/* Service Detail View (Role Based) */}
      {selectedService && (
        <ServiceDetailView
          group={selectedService}
          currentUser={currentUser}
          onClose={() => setSelectedService(null)}
          onOpenScaleEditor={handleOpenScaleEditor}
          onGroupUpdate={refresh}
          pendingSwapRequests={pendingSwapRequests}
        />
      )}

      {/* --- FINANCE MODALS --- */}
      {isCheckoutOpen && checkoutShift && checkoutConfig && (
        <ShiftCheckoutModal
          shift={checkoutShift}
          config={checkoutConfig}
          onClose={() => {
            setIsCheckoutOpen(false);
            setCheckoutShift(null);
            setCheckoutConfig(null);
          }}
          onConfirm={handleConfirmCheckout}
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

      {/* Other Modals */}
      {viewingProfileId && <ProfileView profile={profiles.find(p => p.id === viewingProfileId) || currentUser} currentUser={currentUser} onBack={() => setViewingProfileId(null)} onEdit={() => setIsEditingProfile(true)} />}
      {isEditingProfile && <EditProfileModal profile={currentUser} onClose={() => setIsEditingProfile(false)} onSave={handleSaveProfile} />}

      {/* Global Scale Editor Page Overlay */}
      {(editorTargetGroup || activeBottomTab === 'editor') && (
        <ScaleEditorView
          shifts={shifts}
          assignments={hydratedAssignments}
          currentUser={currentUser}
          userGroups={userGroups}
          onBack={() => {
            setEditorTargetGroup(null);
            setEditorInitialDate(undefined);
            setEditorInitialPresets([]);
            if (activeBottomTab === 'editor') setActiveBottomTab('home');
          }}
          initialGroup={editorTargetGroup || userGroups[0]}
          initialDate={editorInitialDate}
          initialPresets={editorInitialPresets}
        />
      )}
    </Layout>
  );
};

export default Dashboard;