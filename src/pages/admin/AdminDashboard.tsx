import React, { useEffect, useState } from 'react';
import { getAdminStats } from '../../services/api';
import { Users, Building2, Activity } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<{ totalUsers: number, activeUsers24h: number, totalGroups: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const data = await getAdminStats();
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Carregando estatísticas...</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Visão Geral</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Users */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Users size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Total</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats?.totalUsers}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Usuários Cadastrados</div>
                </div>

                {/* Total Services */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <Building2 size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">Ativos</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stats?.totalGroups}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Serviços/Grupos Criados</div>
                </div>

                {/* Active Users (Mock for now) */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <Activity size={24} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">24h</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white mb-1">--</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">Usuários Ativos (Log Indisponível)</div>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ações Rápidas</h2>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-100 dark:border-slate-700">
                    <p className="text-slate-500 text-sm">Nenhuma ação pendente no momento.</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
