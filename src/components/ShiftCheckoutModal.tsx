import React, { useState } from 'react';
import { FinancialConfig, PaymentModel, Shift } from '../types';
import { X, CheckCircle, Plus, DollarSign } from 'lucide-react';

interface ShiftCheckoutModalProps {
   shift: Shift;
   config: FinancialConfig;
   onClose: () => void;
   onConfirm: (data: any) => void;
}

const ShiftCheckoutModal: React.FC<ShiftCheckoutModalProps> = ({ config, onClose, onConfirm }) => {

   const [productionQty, setProductionQty] = useState<number>(0);
   const [extraValue, setExtraValue] = useState<number>(0);
   const [extraDesc, setExtraDesc] = useState('');
   const [showExtras, setShowExtras] = useState(false);

   // Calculate Totals
   const fixedEarnings = config.payment_model === PaymentModel.PRODUCTION ? 0 : config.fixed_value;
   const prodEarnings = productionQty * config.production_value_unit;
   const grossTotal = fixedEarnings + prodEarnings + extraValue;
   const netTotal = grossTotal * (1 - (config.tax_percent / 100));

   return (
      <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
         <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

         <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slide-up sm:animate-fade-in-up overflow-hidden max-h-[90vh]">

            {/* Header Graphic */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-6 pt-8 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
               <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                     <DollarSign size={32} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Fim de Plantão!</h2>
                  <p className="text-emerald-100 text-sm">Vamos fechar a conta do dia?</p>
               </div>
               <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/30 text-white transition-colors">
                  <X size={18} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">

               {/* Summary Fixed */}
               {config.payment_model !== PaymentModel.PRODUCTION && (
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                           <CheckCircle size={20} />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-slate-500 uppercase">Valor Fixo</p>
                           <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">Plantão cumprido</p>
                        </div>
                     </div>
                     <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        + R$ {fixedEarnings.toLocaleString('pt-BR')}
                     </span>
                  </div>
               )}

               {/* Production Input */}
               {(config.payment_model === PaymentModel.PRODUCTION || config.payment_model === PaymentModel.MIXED) && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
                     <div className="flex justify-between items-center mb-4">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Produtividade</label>
                        <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                           R$ {config.production_value_unit}/pct
                        </span>
                     </div>

                     <div className="flex items-center justify-between gap-4">
                        <button
                           onClick={() => setProductionQty(Math.max(0, productionQty - 1))}
                           className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xl hover:bg-slate-200 transition-colors"
                        >-</button>

                        <div className="flex-1 text-center">
                           <span className="block text-3xl font-black text-slate-800 dark:text-slate-100">{productionQty}</span>
                           <span className="text-[10px] text-slate-400 uppercase font-bold">Pacientes</span>
                        </div>

                        <button
                           onClick={() => setProductionQty(productionQty + 1)}
                           className="w-12 h-12 rounded-xl bg-primary text-white font-bold text-xl shadow-lg hover:bg-primaryDark transition-colors"
                        >+</button>
                     </div>

                     {productionQty > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 text-right">
                           <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              + R$ {prodEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                           </span>
                        </div>
                     )}
                  </div>
               )}

               {/* Extras */}
               <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-all">
                  <button
                     onClick={() => setShowExtras(!showExtras)}
                     className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                     <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Plus size={16} className="text-primary" /> Adicionar Ganhos Extras
                     </span>
                     <span className="text-xs text-slate-400">{showExtras ? 'Fechar' : 'Expandir'}</span>
                  </button>

                  {showExtras && (
                     <div className="p-4 pt-0 space-y-3 animate-fade-in-up">
                        <input
                           value={extraDesc}
                           onChange={(e) => setExtraDesc(e.target.value)}
                           placeholder="Descrição (ex: Procedimento X)"
                           className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary dark:text-slate-200"
                        />
                        <div className="relative">
                           <span className="absolute left-3 top-3 text-slate-400 text-sm">R$</span>
                           <input
                              type="number"
                              value={extraValue || ''}
                              onChange={(e) => setExtraValue(Number(e.target.value))}
                              placeholder="0,00"
                              className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-primary dark:text-slate-200"
                           />
                        </div>
                     </div>
                  )}
               </div>

            </div>

            {/* Footer Total */}
            <div className="p-6 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
               <div className="flex justify-between items-end mb-4">
                  <div>
                     <p className="text-xs font-bold text-slate-400 uppercase">Total Líquido (Estimado)</p>
                     <p className="text-xs text-slate-300">Desc. Aprox: {config.tax_percent}%</p>
                  </div>
                  <div className="text-right">
                     <p className="text-3xl font-black text-slate-800 dark:text-slate-100">R$ {netTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     <p className="text-xs font-medium text-emerald-500">Bruto: R$ {grossTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
               </div>

               <button
                  onClick={() => onConfirm({
                     productionQty,
                     extraValue,
                     extraDesc,
                     grossTotal,
                     netTotal
                  })}
                  className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primaryDark active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                  <CheckCircle size={20} />
                  CONFIRMAR E SALVAR NO EXTRATO
               </button>
            </div>

         </div>
      </div>
   );
};

export default ShiftCheckoutModal;