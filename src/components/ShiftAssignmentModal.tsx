import React, { useState } from 'react';
import { X, Search, Calendar, RefreshCcw, Repeat } from 'lucide-react';
import { GroupMember } from '../types';

interface ShiftAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (memberId: string, frequency: string) => void;
    date: Date;
    members: GroupMember[];
    shiftLabel: string;
}

const ShiftAssignmentModal: React.FC<ShiftAssignmentModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    date,
    members,
    shiftLabel
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [selectedFrequency, setSelectedFrequency] = useState<string>('unico');

    if (!isOpen) return null;

    const weekdayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const capitalizedWeekday = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1).split('-')[0]; // "Terça"

    // Mock filtering users
    const filteredMembers = members.filter(m =>
        m.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const frequencies = [
        { id: 'unico', label: 'Único', icon: Calendar },
        { id: 'semanal', label: `Toda ${capitalizedWeekday}`, icon: Calendar, highlight: true },
        { id: 'quinzenal', label: '15 em 15', icon: RefreshCcw },
        { id: 'mensal', label: '1x por Mês', icon: Repeat },
    ];

    const handleConfirm = () => {
        if (selectedMemberId && selectedFrequency) {
            onConfirm(selectedMemberId, selectedFrequency);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-100 dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-2">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                        Atribuir Plantão
                        {shiftLabel && (
                            <span className="text-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                {shiftLabel}
                            </span>
                        )}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">

                    {/* Member Search */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Selecionar Membro
                        </label>
                        <div className="relative">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou especialidade..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-4 shadow-sm text-sm font-medium focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>

                        {/* Member List */}
                        <div className="space-y-2 max-h-40 overflow-y-auto p-2 custom-scrollbar">
                            {filteredMembers.map(member => (
                                <div
                                    key={member.id}
                                    onClick={() => setSelectedMemberId(member.id)}
                                    className={`
                                        flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border
                                        ${selectedMemberId === member.id
                                            ? 'bg-white dark:bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 shadow-md transform scale-[1.02]'
                                            : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedMemberId === member.id ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {member.profile.avatar_url ? (
                                                <img src={member.profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                member.profile.full_name.substring(0, 2).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">
                                                {member.profile.full_name}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                                {member.profile.specialty || "Membro"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedMemberId === member.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                        {selectedMemberId === member.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Frequency Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Frequência
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {frequencies.map((freq) => {
                                const Icon = freq.icon;
                                const isSelected = selectedFrequency === freq.id;
                                return (
                                    <button
                                        key={freq.id}
                                        onClick={() => setSelectedFrequency(freq.id)}
                                        className={`
                                            flex flex-col items-center justify-center gap-2 p-4 rounded-3xl transition-all border-2
                                            ${isSelected
                                                ? 'bg-slate-200 dark:bg-slate-700 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-white shadow-inner'
                                                : freq.highlight
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
                                                    : 'bg-white dark:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'}
                                        `}
                                    >
                                        <div className={`p-2 rounded-xl mb-1 ${isSelected ? 'bg-slate-300 dark:bg-slate-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                            <Icon size={20} className={isSelected ? 'text-slate-700 dark:text-white' : ''} />
                                        </div>
                                        <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                                            {freq.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 p-4 rounded-2xl flex gap-3">
                        <div className="bg-white dark:bg-slate-800 w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm text-orange-500">
                            💡
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            <strong className="text-orange-600 dark:text-orange-400 block mb-0.5">Dica Profissional:</strong>
                            {selectedFrequency === 'unico' && "Atribui o profissional apenas para este dia específico, sem repetições automáticas."}
                            {selectedFrequency === 'semanal' && `Preenche automaticamente todas as ${capitalizedWeekday}s deste mês.`}
                            {selectedFrequency === 'quinzenal' && "Alterna a escala a cada 14 dias (semana sim, semana não) a partir desta data."}
                            {selectedFrequency === 'mensal' && "Fixa a escala apenas para este dia no mês atual."}
                        </p>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedMemberId}
                        className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        Escalar
                        <span className="text-emerald-300">➤</span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ShiftAssignmentModal;
