import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ArrowLeft } from 'lucide-react';

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();

    // Auth/role verification is handled by AdminRoute wrapper in App.tsx

    return (
        <div className="flex h-screen bg-slate-100 dark:bg-surface-dark">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-slate-800 shadow-md flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <img src="/assets/logo-1.png" alt="NexaEscala" className="w-8 h-8 rounded-md" />
                    <span className="font-bold text-lg text-slate-800 dark:text-white">Admin Panel</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/painel-admin"
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-700'
                            }`
                        }
                    >
                        <LayoutDashboard size={20} />
                        Dashboard
                    </NavLink>

                    <NavLink
                        to="/painel-admin/users"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-700'
                            }`
                        }
                    >
                        <Users size={20} />
                        Usuários
                    </NavLink>

                    <NavLink
                        to="/painel-admin/logs"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-700'
                            }`
                        }
                    >
                        <FileText size={20} />
                        Logs do Sistema
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors w-full"
                    >
                        <ArrowLeft size={20} />
                        Voltar ao App
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
