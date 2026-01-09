import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FinancialConfig, PaymentModel, ContractType, Group } from '../types';
import { X, Calculator, Building, Percent, Check, Loader } from 'lucide-react';

interface FinancialConfigModalProps {
   group: Group;
   initialConfig?: FinancialConfig;
   onClose: () => void;
   onSave: (config: FinancialConfig) => void;
}

const FinancialConfigModal: React.FC<FinancialConfigModalProps> = ({ group, initialConfig, onClose, onSave }) => {
   const [config, setConfig] = useState<FinancialConfig>(initialConfig || {
      group_id: group.id,
      contract_type: ContractType.PJ_PRIVATE,
      payment_model: PaymentModel.FIXED,
      fixed_value: 0,
      production_value_unit: 0,
      tax_percent: 0
   });
   const [saving, setSaving] = useState(false);
   const [saved, setSaved] = useState(false);
   const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

   // Auto-save with debounce
   const debouncedSave = useCallback((configToSave: FinancialConfig) => {
      if (saveTimeoutRef.current) {
         clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
         setSaving(true);
         try {
            await onSave(configToSave);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
         } catch (err) {
            console.error('Error auto-saving:', err);
         } finally {
            setSaving(false);
         }
      }, 800); // 800ms debounce
   }, [onSave]);

   const handleChange = (field: keyof FinancialConfig, value: any) => {
      const newConfig = { ...config, [field]: value };
      setConfig(newConfig);
      debouncedSave(newConfig);
   };

   // Cleanup timeout on unmount
   useEffect(() => {
      return () => {
         if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
         }
      };
   }, []);

   // Preview Calculation
   const simulateNet = () => {
      const base = config.fixed_value;
      const prodMock = config.payment_model !== PaymentModel.FIXED ? (config.production_value_unit * 10) : 0; // Simulating 10 patients
      const gross = base + prodMock;
      const net = gross * (1 - (config.tax_percent / 100));
      return { gross, net };
   };

   const { gross, net } = simulateNet();

   return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
         <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

         <div className="relative bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
               <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Configuração de Honorários</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{group.name}</p>
               </div>
               <div className="flex items-center gap-2">
                  {/* Auto-save indicator */}
                  {saving && (
                     <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Loader size={14} className="animate-spin" />
                        <span>Salvando...</span>
                     </div>
                  )}
                  {saved && !saving && (
                     <div className="flex items-center gap-1 text-xs text-emerald-500">
                        <Check size={14} />
                        <span>Salvo!</span>
                     </div>
                  )}
                  <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full">
                     <X size={20} />
                  </button>
               </div>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">

               {/* Section 1: Vínculo */}
               <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                     <Building size={14} /> Natureza do Vínculo
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                     <button
                        onClick={() => handleChange('contract_type', ContractType.CLT_PUBLIC)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.contract_type === ContractType.CLT_PUBLIC ? 'bg-primary/10 border-primary text-primary dark:text-primaryLight' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                     >
                        Público (CLT)
                     </button>
                     <button
                        onClick={() => handleChange('contract_type', ContractType.PJ_PRIVATE)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${config.contract_type === ContractType.PJ_PRIVATE ? 'bg-primary/10 border-primary text-primary dark:text-primaryLight' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                     >
                        Privado (PJ)
                     </button>
                  </div>
               </div>

               {/* Section 2: Modelo */}
               <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                     <Calculator size={14} /> Modelo de Remuneração
                  </h3>
                  <select
                     value={config.payment_model}
                     onChange={(e) => handleChange('payment_model', e.target.value)}
                     className="w-full p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-primary text-sm"
                  >
                     <option value={PaymentModel.FIXED}>Apenas Valor Fixo</option>
                     <option value={PaymentModel.PRODUCTION}>Apenas Produção</option>
                     <option value={PaymentModel.MIXED}>Misto (Fixo + Produção)</option>
                  </select>
               </div>

               {/* Section 3: Valores */}
               <div className="space-y-4">
                  {(config.payment_model === PaymentModel.FIXED || config.payment_model === PaymentModel.MIXED) && (
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Valor Fixo (Bruto)</label>
                        <div className="relative">
                           <span className="absolute left-3 top-3 text-slate-400 text-sm">R$</span>
                           <input
                              type="number"
                              value={config.fixed_value}
                              onChange={(e) => handleChange('fixed_value', Number(e.target.value))}
                              className="w-full pl-10 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-primary"
                           />
                        </div>
                     </div>
                  )}

                  {(config.payment_model === PaymentModel.PRODUCTION || config.payment_model === PaymentModel.MIXED) && (
                     <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Valor por Paciente/Prod (Bruto)</label>
                        <div className="relative">
                           <span className="absolute left-3 top-3 text-slate-400 text-sm">R$</span>
                           <input
                              type="number"
                              value={config.production_value_unit}
                              onChange={(e) => handleChange('production_value_unit', Number(e.target.value))}
                              className="w-full pl-10 p-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-primary"
                           />
                        </div>
                     </div>
                  )}
               </div>

               {/* Section 4: Impostos */}
               <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1 mb-3">
                     <Percent size={14} /> Impostos e Taxas
                  </h3>
                  <div>
                     <label className="text-xs text-slate-500 mb-1 block">Taxa Total de Desconto (%)</label>
                     <input
                        type="number"
                        value={config.tax_percent}
                        onChange={(e) => handleChange('tax_percent', Number(e.target.value))}
                        placeholder="Ex: 16.33"
                        className="w-full p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 outline-none focus:border-primary"
                     />
                     <p className="text-[10px] text-slate-400 mt-2">
                        Some ISS, Taxa Administrativa, IRRF estimado, etc.
                     </p>
                  </div>
               </div>

               {/* Preview Card */}
               <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Simulação (1 Plantão)</span>
                     {config.payment_model !== PaymentModel.FIXED && <span className="text-[10px] text-emerald-600 dark:text-emerald-500 italic">com 10 pacientes</span>}
                  </div>
                  <div className="flex items-end gap-2">
                     <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300">
                        R$ {net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                     <span className="text-xs text-emerald-600 mb-1 font-medium line-through decoration-emerald-400/50">
                        R$ {gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </span>
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">Valor Líquido Estimado</p>
               </div>

            </div>

            {/* Footer - simplified since we auto-save */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
               <button
                  onClick={onClose}
                  className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primaryDark transition-all flex items-center justify-center gap-2"
               >
                  <Check size={18} />
                  Concluído
               </button>
            </div>

         </div>
      </div>
   );
};

export default FinancialConfigModal;