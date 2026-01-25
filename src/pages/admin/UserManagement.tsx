import React, { useEffect, useState } from 'react';
import { getAllUsers, updateUserAppRole } from '../../services/api';
import { Profile } from '../../types';
import { Search, MoreVertical, Shield, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const { showToast } = useToast();

    useEffect(() => {
        loadUsers();
    }, [page]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const result = await getAllUsers(page);
            setUsers(result.users);
        } catch (error) {
            showToast('Erro ao carregar usuários', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'admin' | 'user' | 'support') => {
        if (!window.confirm(`Tem certeza que deseja alterar o papel deste usuário para ${newRole}?`)) return;

        try {
            await updateUserAppRole(userId, newRole);
            showToast('Papel do usuário atualizado', 'success');
            loadUsers(); // Refresh
        } catch (error) {
            showToast('Erro ao atualizar papel', 'error');
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Usuários</h1>
                {/* Search could go here */}
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">CRM/Registro</th>
                                <th className="px-6 py-4">Papel (App)</th>
                                <th className="px-6 py-4">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                    <User size={14} />
                                                </div>
                                            )}
                                            <span className="font-medium text-slate-900 dark:text-white">{user.full_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{user.email || '-'}</td>
                                    <td className="px-6 py-4">{user.crm || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${user.app_role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                                            }`}
                                        >
                                            {user.app_role || 'user'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative group">
                                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                            {/* Minimal dropdown for demo */}
                                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-slate-100 dark:border-slate-700 hidden group-hover:block z-10">
                                                <button
                                                    onClick={() => handleRoleChange(user.id, 'admin')}
                                                    className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
                                                >
                                                    Tornar Admin
                                                </button>
                                                <button
                                                    onClick={() => handleRoleChange(user.id, 'user')}
                                                    className="block w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700"
                                                >
                                                    Tornar Usuário
                                                </button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {users.length === 0 && !loading && (
                    <div className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
