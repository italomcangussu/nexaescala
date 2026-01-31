import React, { useState } from 'react';
import {
    LayoutDashboard,
    Calendar,
    Settings,
    LogOut,
    Menu,
    Bell,
    ChevronRight,
    Wallet,
    FileEdit
} from 'lucide-react';
import Logo from './Logo';
import { Profile } from '../types';

interface DesktopLayoutProps {
    children: React.ReactNode;
    currentUser: Profile;
    activeTab: string;
    onTabChange: (tab: string) => void;
    onSignOut: () => void;
    onProfileClick: () => void;
    notificationCount?: number;
    onNotificationClick?: () => void;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({
    children,
    currentUser,
    activeTab,
    onTabChange,
    onSignOut,
    onProfileClick,
    notificationCount = 0,
    onNotificationClick
}) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const navItems = [
        { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'calendar', label: 'Calendário', icon: Calendar },
        { id: 'editor', label: 'Editor de Escala', icon: FileEdit },
        { id: 'finance', label: 'Financeiro', icon: Wallet },
    ];

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`
          flex flex-col h-full bg-white dark:bg-slate-900 
          border-r border-slate-200/60 dark:border-slate-800
          transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'w-20' : 'w-72'}
          shrink-0 relative z-40
        `}
            >
                {/* Logo & Toggle */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    {!isSidebarCollapsed && (
                        <div className="flex items-center gap-3">
                            <Logo className="w-10 h-10" />
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-slate-800 dark:text-white tracking-tight">
                                    NexaEscala
                                </span>
                                <span className="text-[9px] font-bold text-primary/70 uppercase tracking-widest">
                                    Desktop
                                </span>
                            </div>
                        </div>
                    )}

                    {isSidebarCollapsed && (
                        <Logo className="w-10 h-10 mx-auto" />
                    )}

                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className={`
              p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 
              text-slate-500 transition-colors
              ${isSidebarCollapsed ? 'mx-auto mt-4' : ''}
            `}
                    >
                        {isSidebarCollapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl
                  transition-all duration-200 group
                  ${isActive
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }
                  ${isSidebarCollapsed ? 'justify-center' : ''}
                `}
                                title={isSidebarCollapsed ? item.label : undefined}
                            >
                                <Icon
                                    size={20}
                                    className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'}
                                />
                                {!isSidebarCollapsed && (
                                    <span className="font-semibold text-sm">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                    {/* Settings */}
                    <button
                        onClick={() => { }}
                        className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              text-slate-500 dark:text-slate-400 
              hover:bg-slate-100 dark:hover:bg-slate-800 
              transition-colors mb-2
              ${isSidebarCollapsed ? 'justify-center' : ''}
            `}
                        title={isSidebarCollapsed ? 'Configurações' : undefined}
                    >
                        <Settings size={18} />
                        {!isSidebarCollapsed && <span className="text-sm font-medium">Configurações</span>}
                    </button>

                    {/* User Profile */}
                    <button
                        onClick={onProfileClick}
                        className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
              hover:bg-slate-100 dark:hover:bg-slate-800 
              transition-colors
              ${isSidebarCollapsed ? 'justify-center' : ''}
            `}
                    >
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {currentUser?.full_name?.charAt(0) || 'U'}
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="flex flex-col items-start min-w-0">
                                <span className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[140px]">
                                    {currentUser?.full_name || 'Usuário'}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
                                    {currentUser?.email}
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Logout */}
                    <button
                        onClick={onSignOut}
                        className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mt-2
              text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 
              transition-colors
              ${isSidebarCollapsed ? 'justify-center' : ''}
            `}
                        title={isSidebarCollapsed ? 'Sair' : undefined}
                    >
                        <LogOut size={18} />
                        {!isSidebarCollapsed && <span className="text-sm font-medium">Sair</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                            {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <button
                            onClick={onNotificationClick}
                            className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {notificationCount > 9 ? '9+' : notificationCount}
                                </span>
                            )}
                        </button>

                        {/* Quick Actions */}
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                        <span className="text-xs text-slate-400 font-medium">
                            {new Date().toLocaleDateString('pt-BR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </span>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-950">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default DesktopLayout;
