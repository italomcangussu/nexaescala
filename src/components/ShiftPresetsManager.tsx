import React, { useState } from 'react';
import { ShiftPreset } from '../types';
import { X, Plus, Edit2, Trash2, Save, Moon, Sun } from 'lucide-react';
import WeekDaySelector from './WeekDaySelector';

interface ShiftPresetsManagerProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    currentPresets: ShiftPreset[];
    onSave: (presets: ShiftPreset[]) => void;
    isDailyMode?: boolean;
    onRevert?: () => void;
}

const ShiftPresetsManager: React.FC<ShiftPresetsManagerProps> = ({
    isOpen,
    onClose,
    groupId,
    currentPresets,
    onSave,
    isDailyMode = false,
    onRevert
}) => {
    const [presets, setPresets] = useState<ShiftPreset[]>(currentPresets);
    const [editingPreset, setEditingPreset] = useState<ShiftPreset | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        start_time: '',
        end_time: '',
        quantity_needed: 1,
        days_of_week: [0, 1, 2, 3, 4, 5, 6]
    });

    // Reset and sync with props
    React.useEffect(() => {
        if (isOpen) {
            setPresets(currentPresets);
        }
    }, [isOpen, currentPresets]);

    if (!isOpen) return null;

    const resetForm = () => {
        setFormData({
            code: '',
            start_time: '',
            end_time: '',
            quantity_needed: 1,
            days_of_week: [0, 1, 2, 3, 4, 5, 6]
        });
        setEditingPreset(null);
        setIsAdding(false);
    };

    const handleEdit = (preset: ShiftPreset) => {
        setEditingPreset(preset);
        setFormData({
            code: preset.code,
            start_time: preset.start_time.slice(0, 5), // HH:MM
            end_time: preset.end_time.slice(0, 5),
            quantity_needed: preset.quantity_needed || 1,
            days_of_week: preset.days_of_week || [0, 1, 2, 3, 4, 5, 6]
        });
        setIsAdding(false);
    };

    const handleAdd = () => {
        resetForm();
        setIsAdding(true);
    };

    const handleDelete = (presetId: string) => {
        if (!confirm('Tem certeza que deseja remover este turno? Isso afetará todos os plantões do serviço.')) {
            return;
        }
        setPresets(prev => prev.filter(p => p.id !== presetId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.code.trim()) {
            alert('Código do turno é obrigatório');
            return;
        }
        if (!formData.start_time || !formData.end_time) {
            alert('Horários são obrigatórios');
            return;
        }
        if (formData.quantity_needed < 1) {
            alert('Quantidade deve ser maior que zero');
            return;
        }

        // Check for duplicate code
        const isDuplicate = presets.some(p =>
            p.code.toUpperCase() === formData.code.toUpperCase() &&
            p.id !== editingPreset?.id
        );
        if (isDuplicate) {
            alert('Já existe um turno com este código');
            return;
        }

        if (editingPreset) {
            // Update existing
            setPresets(prev => prev.map(p =>
                p.id === editingPreset.id
                    ? {
                        ...p,
                        code: formData.code.toUpperCase(),
                        start_time: formData.start_time + ':00',
                        end_time: formData.end_time + ':00',
                        quantity_needed: formData.quantity_needed,
                        days_of_week: formData.days_of_week
                    }
                    : p
            ));
        } else {
            // Add new
            const newPreset: ShiftPreset = {
                id: `temp-${Date.now()}`,
                group_id: groupId,
                code: formData.code.toUpperCase(),
                start_time: formData.start_time + ':00',
                end_time: formData.end_time + ':00',
                quantity_needed: formData.quantity_needed,
                days_of_week: formData.days_of_week
            };
            setPresets(prev => [...prev, newPreset]);
        }

        resetForm();
    };

    const handleSave = () => {
        onSave(presets);
    };

    const getShiftIcon = (startTime: string) => {
        const hour = parseInt(startTime.split(':')[0]);
        const isNight = hour >= 18 || hour < 6;
        return isNight ? Moon : Sun;
    };

    const getShiftColor = (startTime: string) => {
        const hour = parseInt(startTime.split(':')[0]);
        const isNight = hour >= 18 || hour < 6;
        return isNight
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800'
            : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-200 dark:border-orange-800';
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {isDailyMode ? 'Escala Individual do Dia' : 'Gerenciar Turnos'}
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {isDailyMode ? 'Configure os turnos apenas para este dia' : 'Configure os turnos gerais do serviço'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <X size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Current Presets */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                Turnos Configurados ({presets.length})
                            </h3>
                            <button
                                onClick={handleAdd}
                                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
                            >
                                <Plus size={16} />
                                Adicionar
                            </button>
                        </div>

                        <div className="space-y-2">
                            {presets.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">
                                    Nenhum turno configurado
                                </div>
                            ) : (
                                presets.map((preset) => {
                                    const Icon = getShiftIcon(preset.start_time);
                                    const colorClass = getShiftColor(preset.start_time);

                                    return (
                                        <div
                                            key={preset.id}
                                            className={`flex items-center justify-between p-4 rounded-xl border ${colorClass}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon size={20} strokeWidth={2.5} />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black">
                                                            {preset.code}
                                                        </span>
                                                        <span className="text-xs font-medium opacity-70">
                                                            {preset.start_time.slice(0, 5)} - {preset.end_time.slice(0, 5)}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs opacity-60 flex gap-2">
                                                        <span>{preset.quantity_needed || 1} vaga{(preset.quantity_needed || 1) > 1 ? 's' : ''}</span>
                                                        <span>•</span>
                                                        <span>
                                                            {(preset.days_of_week?.length === 7) ? 'Todos os dias' :
                                                                (preset.days_of_week?.length === 0) ? 'Nenhum dia' :
                                                                    preset.days_of_week?.map(d => ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][d]).join(', ')}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(preset)}
                                                    className="w-8 h-8 rounded-lg bg-white/50 dark:bg-slate-800/50 flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(preset.id)}
                                                    className="w-8 h-8 rounded-lg bg-white/50 dark:bg-slate-800/50 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Form */}
                    {(isAdding || editingPreset) && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                                {editingPreset ? 'Editar Turno' : 'Novo Turno'}
                            </h4>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Código *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="Ex: DT, NT, MT"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            maxLength={4}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Vagas *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.quantity_needed}
                                            onChange={(e) => setFormData({ ...formData, quantity_needed: parseInt(e.target.value) || 1 })}
                                            min="1"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Horário Início *
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Horário Fim *
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <WeekDaySelector
                                        selectedDays={formData.days_of_week}
                                        onChange={(days) => setFormData({ ...formData, days_of_week: days })}
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors"
                                    >
                                        {editingPreset ? 'Atualizar' : 'Adicionar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-col gap-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {isDailyMode
                                ? 'As mudanças afetarão apenas este dia específico'
                                : 'As mudanças afetarão todos os plantões gerados'}
                        </p>
                        {isDailyMode && onRevert && (
                            <button
                                onClick={onRevert}
                                className="text-[10px] text-primary font-bold hover:underline text-left"
                            >
                                Reverter para Escala Geral
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg"
                    >
                        <Save size={18} />
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShiftPresetsManager;
