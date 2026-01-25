import React, { useEffect, useState } from 'react';
import { getAppLogs } from '../../services/api';
import { AppLog } from '../../types';
import { useToast } from '../../context/ToastContext';

const SystemLogs: React.FC = () => {
    const [logs, setLogs] = useState<AppLog[]>([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const data = await getAppLogs();
            setLogs(data);
        } catch (error) {
            console.error(error);
            showToast('Erro ao carregar logs. Verifique se a tabela app_logs existe.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Logs do Sistema</h1>

            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg shadow-inner font-mono text-sm h-[600px] overflow-y-auto">
                {loading && <div className="text-center p-4">Carregando logs...</div>}

                {!loading && logs.length === 0 && (
                    <div className="text-center p-4 text-slate-500">Nenhum log encontrado.</div>
                )}

                {logs.map((log) => (
                    <div key={log.id} className="mb-2 border-b border-slate-800 pb-1 last:border-0">
                        <span className="text-slate-500 mr-2">[{new Date(log.created_at).toLocaleString()}]</span>
                        <span className={`font-bold mr-2 uppercase ${log.level === 'error' ? 'text-red-500' :
                                log.level === 'warn' ? 'text-amber-500' : 'text-blue-500'
                            }`}>
                            {log.level}
                        </span>
                        <span className="text-slate-200">{log.message}</span>
                        {log.metadata && (
                            <div className="ml-8 mt-1 text-xs text-slate-500">
                                {JSON.stringify(log.metadata)}
                            </div>
                        )}
                        <div className="ml-8 text-xs text-slate-600">User: {log.user_id}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SystemLogs;
