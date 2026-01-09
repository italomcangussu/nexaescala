import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ThemeOption } from '../types';

import SettingsMain from './settings/SettingsMain';
import SettingsAppearance from './settings/SettingsAppearance';
import SettingsNotifications from './settings/SettingsNotifications';
import SettingsPrivacy from './settings/SettingsPrivacy';
import SettingsPassword from './settings/SettingsPassword';
import SettingsAccount from './settings/SettingsAccount';
import SettingsDeleteAccount from './settings/SettingsDeleteAccount';
import SettingsPrivacyPolicy from './settings/SettingsPrivacyPolicy';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeOption;
  onThemeChange: (theme: ThemeOption) => void;
  onSignOut: () => void;
}

type SettingsView =
  | 'main'
  | 'notifications'
  | 'privacy'
  | 'change_password'
  | 'account_edit'
  | 'privacy_policy'
  | 'delete_account'
  | 'appearance'
  | 'help'
  | 'about';

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose, currentTheme, onThemeChange, onSignOut }) => {
  const [showContent, setShowContent] = useState(false);
  const [currentView, setCurrentView] = useState<SettingsView>('main');

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setTimeout(() => {
        setCurrentView('main');
      }, 500);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (currentView) {
      case 'main':
        return <SettingsMain onNavigate={(view) => setCurrentView(view as SettingsView)} onSignOut={onSignOut} />;
      case 'appearance':
        return <SettingsAppearance currentTheme={currentTheme} onThemeChange={onThemeChange} onBack={() => setCurrentView('main')} />;
      case 'notifications':
        return <SettingsNotifications onBack={() => setCurrentView('main')} />;
      case 'privacy':
        return <SettingsPrivacy onNavigate={(view) => setCurrentView(view as SettingsView)} onBack={() => setCurrentView('main')} />;
      case 'change_password':
        return <SettingsPassword onBack={() => setCurrentView('privacy')} />;
      case 'account_edit':
        return <SettingsAccount onBack={() => setCurrentView('privacy')} />;
      case 'privacy_policy':
        return <SettingsPrivacyPolicy onBack={() => setCurrentView('privacy')} onDeleteAccount={() => setCurrentView('delete_account')} />;
      case 'delete_account':
        return <SettingsDeleteAccount onBack={() => setCurrentView('privacy')} onCloseMenu={onClose} />;
      default:
        return <SettingsMain onNavigate={(view) => setCurrentView(view as SettingsView)} onSignOut={onSignOut} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Main Card */}
      <div
        className={`relative bg-surface dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) ${showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20'}`}
      >

        {/* Decoration */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-900/20 pointer-events-none z-0" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100/80 dark:bg-slate-800/80 rounded-full text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 z-20 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar pt-8 pb-8 relative z-10 hidden-scrollbar">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;