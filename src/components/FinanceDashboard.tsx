import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getFinancialRecords, updateFinancialRecordPaidStatus, FinancialRecordWithGroup } from '../services/api';
import { Profile, Group } from '../types';
import { DollarSign, Filter, Check, Settings, ChevronRight, Building, Plus, Loader, RefreshCw } from 'lucide-react';

interface FinanceDashboardProps {
   currentUser: Profile;
   userGroups: Group[];
   onSimulateCheckout: () => void;
   onConfigureService: (group: Group) => void;
}

const FinanceDashboard: React.FC<FinanceDashboardProps> = ({ currentUser, userGroups, onSimulateCheckout, onConfigureService }) => {
   const [records, setRecords] = useState<FinancialRecordWithGroup[]>([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);
   const [showServiceSelector, setShowServiceSelector] = useState(false);

   // Fetch financial records from Supabase
   useEffect(() => {
      fetchRecords();
   }, [currentUser.id]);

   const fetchRecords = async () => {
      setLoading(true);
      setError(null);
      try {
         const data = await getFinancialRecords(currentUser.id);
         setRecords(data);
      } catch (err: any) {
         console.error('Error fetching financial records:', err);
         setError('Erro ao carregar registros financeiros');
      } finally {
         setLoading(false);
      }
   };

   // Calculations
   const totalEstimated = records.reduce((acc, r) => acc + r.net_total, 0);
   const totalReceived = records.filter(r => r.is_paid).reduce((acc, r) => acc + r.net_total, 0);
   const totalPending = totalEstimated - totalReceived;

   // Chart Data
   const breakdownData = [
      { name: 'Recebido', value: totalReceived, color: '#10B981' }, // Emerald
      { name: 'Pendente', value: totalPending, color: '#F59E0B' }, // Amber
   ];

   const handleTogglePaid = async (id: string) => {
      const record = records.find(r => r.id === id);
      if (!record) return;

      const newPaidStatus = !record.is_paid;

      // Optimistic update
      setRecords(prev => prev.map(r =>
         r.id === id ? { ...r, is_paid: newPaidStatus, paid_at: newPaidStatus ? new Date().toISOString() : undefined } : r
      ));

      try {
         await updateFinancialRecordPaidStatus(id, newPaidStatus);
      } catch (err) {
         // Revert on error
         setRecords(prev => prev.map(r =>
            r.id === id ? { ...r, is_paid: !newPaidStatus, paid_at: record.paid_at } : r
         ));
         console.error('Error updating paid status:', err);
      }
   };

   // Get current month name
   const currentMonth = new Date().toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

   return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">

         {/* Finance Header */}
         <div className="px-6 py-6 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex justify-between items-start shrink-0">
            <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Financeiro</h1>
               <p className="text-sm text-slate-500 dark:text-slate-400">Controle seus ganhos</p>
            </div>
            <div className="flex gap-2">
               <button
                  onClick={fetchRecords}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors"
                  title="Atualizar"
               >
                  <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
               </button>
               <button
                  onClick={() => setShowServiceSelector(true)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition-colors"
                  title="Configurar Vínculos"
               >
                  <Settings size={20} />
               </button>
               <button
                  onClick={onSimulateCheckout}
                  className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-200 transition-colors flex items-center gap-2"
               >
                  <DollarSign size={14} /> Checkout
               </button>
            </div>
         </div>

         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">

            {/* Error State */}
            {error && (
               <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm">
                  {error}
               </div>
            )}

            {/* Main Cards */}
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-emerald-700 rounded-2xl p-4 text-white shadow-xl shadow-emerald-700/40 relative overflow-hidden">
                  <div className="relative z-10">
                     <p className="text-xs font-bold text-emerald-100 uppercase mb-1">Total Recebido</p>
                     <h3 className="text-2xl font-black text-white">R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-2 translate-y-2">
                     <DollarSign size={64} className="text-white" />
                  </div>
               </div>

               <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="relative z-10">
                     <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">A Receber</p>
                     <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  </div>
                  <div className="absolute right-2 bottom-2 text-emerald-500 opacity-20">
                     <DollarSign size={40} />
                  </div>
               </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
               <div className="h-24 w-24 shrink-0 relative">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={breakdownData.filter(d => d.value > 0)}
                           innerRadius={35}
                           outerRadius={45}
                           paddingAngle={5}
                           dataKey="value"
                           stroke="none"
                        >
                           {breakdownData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                        </Pie>
                     </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-[10px] font-bold text-slate-400">{currentMonth}</span>
                  </div>
               </div>
               <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Resumo do Mês</h3>
                  <div className="space-y-1">
                     {breakdownData.map(d => (
                        <div key={d.name} className="flex items-center gap-2 text-xs">
                           <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                           <span className="text-slate-500 dark:text-slate-400">{d.name}</span>
                           <span className="font-bold text-slate-700 dark:text-slate-300 ml-auto">R$ {d.value.toLocaleString('pt-BR', { notation: "compact" })}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Transaction List */}
            <div>
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Extrato de Plantões</h3>
                  <button className="text-primary dark:text-primaryLight text-xs font-bold flex items-center gap-1">
                     <Filter size={14} /> Filtros
                  </button>
               </div>

               {loading ? (
                  <div className="flex items-center justify-center py-12">
                     <Loader className="animate-spin text-primary" size={32} />
                  </div>
               ) : records.length === 0 ? (
                  <div className="text-center py-12">
                     <DollarSign size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                     <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum registro financeiro</p>
                     <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Os registros aparecerão aqui após seus plantões</p>
                  </div>
               ) : (
                  <div className="space-y-3 pb-20">
                     {records.map(record => (
                        <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between group transition-all hover:border-primary/30">
                           <div className="flex items-center gap-4">
                              {/* Checkbox */}
                              <button
                                 onClick={() => handleTogglePaid(record.id)}
                                 className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${record.is_paid ? 'bg-emerald-500 border-emerald-500 scale-110' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'}`}
                              >
                                 {record.is_paid && <Check size={14} className="text-white" strokeWidth={3} />}
                              </button>

                              <div>
                                 <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{record.group_name}</p>
                                 <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>{new Date(record.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                    {record.extras_value > 0 && <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-bold">+Extras</span>}
                                    {record.production_quantity > 0 && <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[10px] font-bold">Prod</span>}
                                 </div>
                              </div>
                           </div>

                           <div className="text-right">
                              <p className={`font-bold ${record.is_paid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                 R$ {record.net_total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                 {record.is_paid ? 'Recebido' : 'Estimado'}
                              </p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>

         {/* SERVICE SELECTOR MODAL (OVERLAY) */}
         {showServiceSelector && (
            <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-up">
               <div
                  className="bg-white dark:bg-slate-900 w-full sm:max-w-sm h-[70%] sm:h-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                     <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Meus Vínculos</h3>
                     <button onClick={() => setShowServiceSelector(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                        <Settings size={18} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                     <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Selecione um serviço para configurar seus honorários:</p>

                     {userGroups.length === 0 ? (
                        <div className="text-center py-8">
                           <Building size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                           <p className="text-slate-500 dark:text-slate-400 text-sm">Você ainda não está em nenhum grupo</p>
                        </div>
                     ) : (
                        userGroups.map(group => (
                           <button
                              key={group.id}
                              onClick={() => {
                                 onConfigureService(group);
                                 setShowServiceSelector(false);
                              }}
                              className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary dark:hover:border-primary transition-all group text-left flex items-center justify-between"
                           >
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <Building size={20} />
                                 </div>
                                 <div>
                                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{group.name}</p>
                                    <p className="text-[10px] text-slate-400">{group.institution}</p>
                                 </div>
                              </div>
                              <ChevronRight size={18} className="text-slate-300 group-hover:text-primary transition-colors" />
                           </button>
                        ))
                     )}

                     <button className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Plus size={16} /> Adicionar Novo Vínculo Externo
                     </button>
                  </div>
               </div>
               {/* Click outside to close area */}
               <div className="absolute inset-0 -z-10" onClick={() => setShowServiceSelector(false)}></div>
            </div>
         )}
      </div>
   );
};

export default FinanceDashboard;