import React, { useState } from 'react';
import { Home, Calendar, Search, Bell, Landmark, Settings, LucideProps } from 'lucide-react';
import { Profile, Notification } from '../types';
import { getNotifications, markNotificationAsRead } from '../services/api';
import Logo from './Logo';
import SettingsMenu from './SettingsMenu';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: Profile;
  onProfileClick: () => void;
  onSignOut: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  currentUser,
  onProfileClick,
  onSignOut,
  onNotificationClick
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications(currentUser.id);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const hasUnread = notifications.some(n => !n.is_read);

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && hasUnread) {
      // Mark all as read when opening
      try {
        const unread = notifications.filter(n => !n.is_read);
        for (const n of unread) {
          await markNotificationAsRead(n.id);
        }
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background dark:bg-slate-950 overflow-hidden relative font-sans transition-colors duration-300">

      {/* Top Header - Modernized with Logo */}
      <header className="bg-surface dark:bg-slate-900 px-5 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-gray-50/50 dark:border-slate-800/50 shadow-sm transition-colors duration-300">
        <div
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onProfileClick}
        >
          <div className="relative">
            <img
              src={currentUser.avatar_url}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-slate-700"
            />
            <div className="absolute top-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-white dark:border-slate-900"></div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[11px] text-textSecondary dark:text-slate-400 font-medium leading-tight">Olá, {currentUser.full_name.split(' ')[0]} {currentUser.full_name.split(' ')[1]}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Logo className="w-5 h-5 text-primaryDark dark:text-primaryLight" />
              <span className="text-lg font-bold text-primaryDark dark:text-slate-100 leading-none tracking-tight">NexaEscala</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 text-textSecondary dark:text-slate-400">
          <button className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors hidden sm:block">
            <Search size={20} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleBellClick}
            className={`p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full relative transition-colors ${showNotifications ? 'text-primary' : ''}`}
          >
            <Bell size={20} strokeWidth={2.5} />
            {hasUnread && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-16 right-5 w-80 max-h-[400px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-slate-100">Notificações</h3>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Recentes</span>
              </div>
              <div className="overflow-y-auto no-scrollbar flex-1">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-slate-400">
                    <Bell size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Nenhuma notificação por aqui.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50 dark:divide-slate-800">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                        onClick={() => {
                          setShowNotifications(false);
                          onNotificationClick?.(n);
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === 'SHIFT_PUBLISHED' ? 'bg-emerald-100 text-emerald-600' :
                              n.type === 'MENTION' ? 'bg-amber-100 text-amber-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                            {n.type === 'SHIFT_PUBLISHED' ? <Calendar size={16} /> :
                              n.type === 'MENTION' ? <Search size={16} /> :
                                <Bell size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">{new Date(n.created_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primaryLight active:scale-90 transform duration-200"
          >
            <Settings size={20} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto no-scrollbar bg-background dark:bg-slate-950 transition-colors duration-300 ${activeTab === 'editor' ? 'pb-0' : 'pb-24'}`}>
        {children}
      </main>

      {/* Bottom Navigation - Glassmorphism hint (Hidden in Editor) */}
      {activeTab !== 'editor' && (
        <nav className="fixed bottom-0 w-full z-40 bg-surface/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-gray-100 dark:border-slate-800 pb-safe transition-colors duration-300">
          <div className="flex justify-around items-center h-[72px] px-2">

            <NavButton
              active={activeTab === 'home'}
              onClick={() => onTabChange('home')}
              icon={<Home size={24} />}
              label="Início"
            />

            <NavButton
              active={activeTab === 'calendar'}
              onClick={() => onTabChange('calendar')}
              icon={<Calendar size={24} />}
              label="Escalas"
            />

            <NavButton
              active={activeTab === 'finance'}
              onClick={() => onTabChange('finance')}
              icon={<Landmark size={24} />}
              label="Financeiro"
            />

          </div>
        </nav>
      )}

      {/* Settings Overlay */}
      <SettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSignOut={onSignOut}
      />
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-20 py-2 transition-all duration-300 ${active ? 'text-primary dark:text-primaryLight' : 'text-textSecondary dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300'}`}
    >
      <div className={`${active ? 'scale-110 -translate-y-1' : 'scale-100'} transition-transform duration-300`}>
        {/* Fill the icon if active for solid look */}
        {React.cloneElement(icon as React.ReactElement<LucideProps>, {
          strokeWidth: active ? 2.5 : 2,
          fill: active ? "currentColor" : "none",
          fillOpacity: active ? 0.2 : 0
        })}
      </div>
      <span className={`text-[10px] font-medium mt-1 ${active ? 'font-bold' : ''}`}>{label}</span>
    </button>
  );
};

export default Layout;