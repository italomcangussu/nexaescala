import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Shift } from '../../types';

interface EditShiftModalProps {
    shift: Shift;
    onClose: () => void;
    onSave: (shiftId: string, updates: Partial<Shift>) => void;
    onDelete?: (shiftId: string) => void;
}

const EditShiftModal: React.FC<EditShiftModalProps> = ({ shift, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState({
        start_time: shift.start_time,
        end_time: shift.end_time,
        quantity_needed: shift.quantity_needed
    });

    useEffect(() => {
        setFormData({
            start_time: shift.start_time,
            end_time: shift.end_time,
            quantity_needed: shift.quantity_needed
        });
    }, [shift]);

    const handleSave = () => {
        onSave(shift.id, formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Editar Turno</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início</label>
                            <input
                                type="time"
                                value={formData.start_time}
                                onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim</label>
                            <input
                                type="time"
                                value={formData.end_time}
                                onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantidade de Plantonistas</label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="10"
                                value={formData.quantity_needed}
                                onChange={e => setFormData({ ...formData, quantity_needed: parseInt(e.target.value) })}
                                className="flex-1 accent-primary h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="w-12 h-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xl text-slate-800 dark:text-white">
                                {formData.quantity_needed}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 flex gap-3">
                    {onDelete && (
                        <button
                            onClick={() => {
                                if (window.confirm('Tem certeza que deseja remover este turno?')) {
                                    onDelete(shift.id);
                                    onClose();
                                }
                            }}
                            className="px-4 py-3 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        >
                            Excluir
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primaryDark transition-colors shadow-lg shadow-primary/20"
                    >
                        Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditShiftModal;
