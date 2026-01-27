import React from 'react';
import { ChevronRight, Building } from 'lucide-react';

interface StepInfoProps {
    serviceName: string;
    institution: string;
    color: string;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    onUpdate: (field: 'serviceName' | 'institution' | 'color', value: string) => void;
    onOpenInstitutionModal: () => void;
}

const PRESET_COLORS = [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#84CC16', // Lime
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#D946EF', // Fuchsia
    '#EC4899', // Pink
    '#64748B', // Slate
];

const StepInfo: React.FC<StepInfoProps> = ({
    serviceName,
    institution,
    color,
    errors,
    touched,
    onUpdate,
    onOpenInstitutionModal,
}) => {
    const hasNameError = touched.serviceName && errors.serviceName;
    const hasInstError = touched.institution && errors.institution;

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Service Name */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Nome do Serviço
                </label>
                <input
                    value={serviceName}
                    onChange={e => onUpdate('serviceName', e.target.value)}
                    placeholder="Ex: UTI Adulto - Equipe A"
                    className={`w-full p-4 bg-white dark:bg-slate-800 border rounded-xl focus:ring-2 outline-none text-slate-800 dark:text-slate-100 transition-all
            ${hasNameError
                            ? 'border-red-400 dark:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20'
                            : 'border-gray-200 dark:border-slate-700 focus:ring-primary/20'
                        }`}
                    id="service-name"
                    name="service-name"
                />
                {hasNameError && (
                    <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.serviceName}
                    </p>
                )}
                {serviceName.length > 0 && !hasNameError && (
                    <p className="mt-2 text-xs text-emerald-500 dark:text-emerald-400">
                        ✓ Nome válido
                    </p>
                )}
            </div>

            {/* Institution */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                    Instituição
                </label>
                <button
                    type="button"
                    onClick={onOpenInstitutionModal}
                    className={`w-full p-4 bg-white dark:bg-slate-800 border rounded-xl flex items-center justify-between transition-all text-left group
            ${hasInstError
                            ? 'border-red-400 dark:border-red-500'
                            : 'border-gray-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-slate-700'
                        }`}
                >
                    {institution ? (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building size={20} className="text-primary" />
                            </div>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{institution}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400">Selecionar ou criar instituição...</span>
                    )}
                    <ChevronRight className="text-slate-400 group-hover:text-primary transition-colors" size={20} />
                </button>
                {hasInstError && (
                    <p className="mt-2 text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.institution}
                    </p>
                )}
            </div>

            {/* Color Palette */}
            <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">
                    Cor do Grupo
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                    {PRESET_COLORS.map((presetColor) => (
                        <button
                            key={presetColor}
                            type="button"
                            onClick={() => onUpdate('color', presetColor)}
                            className={`w-full aspect-square rounded-full transition-all flex items-center justify-center ${color === presetColor
                                ? 'ring-2 ring-offset-2 ring-primary scale-110 dark:ring-offset-slate-900'
                                : 'hover:scale-110 opacity-70 hover:opacity-100'
                                }`}
                            style={{ backgroundColor: presetColor }}
                        >
                            {color === presetColor && (
                                <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tips */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-primary">💡 Dica:</span> O nome do serviço deve ser descritivo e único.
                    A cor ajuda a identificar rapidamente o serviço em sua lista.
                </p>
            </div>
        </div>
    );
};

export default StepInfo;
