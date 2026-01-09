import React, { useEffect, useState } from 'react';
import { Bell, Check, X, ArrowRightLeft, Gift, Clock } from 'lucide-react';
import { ShiftExchange, Profile, TradeStatus, TradeType } from '../types';
import { getShiftExchanges, updateShiftExchangeStatus, executeExchangeTransaction } from '../services/api';

interface ShiftInboxProps {
    groupId: string;
    currentUser: Profile;
}

const ShiftInbox: React.FC<ShiftInboxProps> = ({ groupId, currentUser }) => {
    const [exchanges, setExchanges] = useState<ShiftExchange[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchExchanges = async () => {
        setLoading(true);
        try {
            const data = await getShiftExchanges(groupId);
            // Filter: 
            // 1. Pending requests where I am the target
            // 2. Pending Group Giveaways (target is null)
            // 3. My own requests (to see status) - Optional, maybe separate tab
            const myIncoming = data.filter(e =>
                e.status === TradeStatus.PENDING &&
                (e.target_profile_id === currentUser.id || e.target_profile_id === null)
            );
            setExchanges(myIncoming);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExchanges();
    }, [groupId, currentUser.id]);

    const handleAccept = async (exchange: ShiftExchange) => {
        if (!confirm('Tem certeza que deseja aceitar? A escala será atualizada imediatamente.')) return;

        try {
            // Use the "transaction" helper (client-side simulation for now)
            // If it's a group giveaway, we must claim it by "setting ourselves as target" effectively
            const exchangeToProcess = { ...exchange };
            if (exchange.type === TradeType.GIVEAWAY && !exchange.target_profile_id) {
                exchangeToProcess.target_profile_id = currentUser.id;
            }

            await executeExchangeTransaction(exchangeToProcess);
            fetchExchanges(); // Refresh
            alert('Troca realizada com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao processar troca.');
        }
    };

    const handleReject = async (exchange: ShiftExchange) => {
        if (!confirm('Rejeitar solicitação?')) return;
        try {
            await updateShiftExchangeStatus(exchange.id, TradeStatus.REJECTED);
            fetchExchanges();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Bell className="text-primary" size={20} />
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Solicitações ({exchanges.length})</h3>
                </div>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center py-10 text-slate-400">Carregando...</div>
                ) : exchanges.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Check size={40} className="mx-auto mb-2 opacity-50" />
                        <p>Tudo em dia! Nenhuma solicitação pendente.</p>
                    </div>
                ) : (
                    exchanges.map(ex => (
                        <div key={ex.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                            {/* Type Indicator Strip */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${ex.type === TradeType.DIRECT_SWAP ? 'bg-blue-500' : 'bg-purple-500'}`} />

                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-full ${ex.type === TradeType.DIRECT_SWAP ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                        {ex.type === TradeType.DIRECT_SWAP ? <ArrowRightLeft size={16} /> : <Gift size={16} />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                                            {ex.type === TradeType.DIRECT_SWAP ? 'Proposta de Troca' : (ex.target_profile_id ? 'Doação de Plantão' : 'Plantão Disponível')}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            de {ex.requesting_profile?.full_name}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(ex.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg mb-4 text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Oferece:</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                        {ex.offered_shift?.shift?.date} ({ex.offered_shift?.shift?.start_time})
                                    </span>
                                </div>
                                {ex.type === TradeType.DIRECT_SWAP && ex.requested_shift && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Pede em troca:</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                            {ex.requested_shift.shift.date} ({ex.requested_shift.shift.start_time})
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleReject(ex)}
                                    className="flex-1 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                                >
                                    <X size={14} /> Rejeitar
                                </button>
                                <button
                                    onClick={() => handleAccept(ex)}
                                    className="flex-1 py-2 bg-primary text-white font-bold text-xs rounded-lg shadow-sm hover:bg-primaryDark transition-all flex items-center justify-center gap-1"
                                >
                                    <Check size={14} /> Aceitar
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ShiftInbox;
