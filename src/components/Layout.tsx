import React, { useState } from 'react';
import { Home, Calendar, Users, Search, Bell, Landmark, Settings, LucideProps } from 'lucide-react';
import { Profile } from '../types';
import Logo from './Logo';
import SettingsMenu from './SettingsMenu';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: Profile;
  onProfileClick: () => void;
  onSignOut: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  currentUser,
  onProfileClick,
  onSignOut
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          <button className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full relative transition-colors">
            <Bell size={20} strokeWidth={2.5} />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-error rounded-full ring-2 ring-white dark:ring-slate-900"></span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primaryLight active:scale-90 transform duration-200"
          >
            <Settings size={20} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar bg-background dark:bg-slate-950 transition-colors duration-300">
        {children}
      </main>

      {/* Bottom Navigation - Glassmorphism hint */}
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

          <NavButton
            active={activeTab === 'colleagues'}
            onClick={() => onTabChange('colleagues')}
            icon={<Users size={24} />}
            label="Colegas"
          />

        </div>
      </nav>

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