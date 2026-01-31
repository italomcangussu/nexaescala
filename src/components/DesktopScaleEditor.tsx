import React, { useState, useEffect, useCallback } from 'react';
import {
    ChevronLeft,
    ChevronDown,
    Save,
    CheckCircle,
    Settings,
    Copy,
    Printer,
    Search,
    Loader2,
    X,
    UserPlus,
    Calendar,
    Clock
} from 'lucide-react';
import {
    Shift,
    Profile,
    Group,
    ShiftAssignment,
    ServiceRole,
    GroupMember,
    ShiftPreset
} from '../types';
import ShiftAssignmentModal from './ShiftAssignmentModal';
import AddMemberModal from './AddMemberModal';
import ShiftLegend from './ShiftLegend';
import ShiftPresetsManager from './ShiftPresetsManager';
import ReplicateScheduleModal from './ReplicateScheduleModal';
import {
    getShifts,
    getAssignments,
    publishShifts,
    sendGroupMessage,
    deleteAssignment,
    createAssignment,
    getGroupMembers,
    addGroupMember,
    getShiftPresets,
    regenerateShiftsForMonth,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import { useKeyboardShortcuts, createEditorShortcuts } from '../hooks/useKeyboardShortcuts';

interface DesktopScaleEditorProps {
    currentUser: Profile;
    userGroups: Group[];
    onBack?: () => void;
    initialGroup?: Group | null;
    initialDate?: Date;
}

const DesktopScaleEditor: React.FC<DesktopScaleEditorProps> = ({
    currentUser,
    userGroups,
    onBack,
    initialGroup,
    initialDate
}) => {
    const { showToast } = useToast();

    // State
    const [currentDate, setCurrentDate] = useState(initialDate || new Date());
    const [selectedGroup] = useState<Group | null>(initialGroup || userGroups[0] || null);
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isReplicateModalOpen, setIsReplicateModalOpen] = useState(false);

    // Data State
    const [groupShifts, setGroupShifts] = useState<Shift[]>([]);
    const [localAssignments, setLocalAssignments] = useState<ShiftAssignment[]>([]);
    const [originalAssignments, setOriginalAssignments] = useState<ShiftAssignment[]>([]);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const [shiftPresets, setShiftPresets] = useState<ShiftPreset[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isPresetsManagerOpen, setIsPresetsManagerOpen] = useState(false);
    const [selectionData] = useState<{ date: Date; shiftLabel: string; startTime: string } | null>(null);

    // Keyboard shortcuts reference handlers (will be updated after handleSave/handlePublish are defined)
    const handlePrint = useCallback(() => window.print(), []);
    const handleEscape = useCallback(() => {
        if (isMonthDropdownOpen) setIsMonthDropdownOpen(false);
        else if (isReplicateModalOpen) setIsReplicateModalOpen(false);
        else if (isPresetsManagerOpen) setIsPresetsManagerOpen(false);
        else if (isAddMemberModalOpen) setIsAddMemberModalOpen(false);
        else if (isModalOpen) setIsModalOpen(false);
        else if (onBack) onBack();
    }, [isMonthDropdownOpen, isReplicateModalOpen, isPresetsManagerOpen, isAddMemberModalOpen, isModalOpen, onBack]);

    // Months for dropdown
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    // Generate days in month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    };

    const toLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const currentMonthDays = getDaysInMonth(currentDate);

    // FETCH DATA
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedGroup?.id || selectedGroup.id.startsWith('temp-')) return;

            setIsLoading(true);
            try {
                const shiftsData = await getShifts(selectedGroup.id);
                setGroupShifts(shiftsData);

                if (shiftsData.length > 0) {
                    const shiftIds = shiftsData.map(s => s.id);
                    const assignmentsData = await getAssignments(shiftIds);
                    setLocalAssignments(assignmentsData);
                    setOriginalAssignments(assignmentsData);
                } else {
                    setLocalAssignments([]);
                    setOriginalAssignments([]);
                }

                const membersData = await getGroupMembers(selectedGroup.id);
                setGroupMembers(membersData);

                const presetsData = await getShiftPresets(selectedGroup.id);
                setShiftPresets(presetsData);

            } catch (error) {
                console.error("Error fetching scale data:", error);
                showToast("Erro ao carregar dados da escala", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedGroup, currentDate]);

    // Get unique shift types for columns
    const getUniqueShiftTypes = useCallback(() => {
        const types = new Map<string, { code: string; startTime: string; endTime: string; color: string }>();

        shiftPresets.forEach(preset => {
            const key = `${preset.code}-${preset.start_time}`;
            if (!types.has(key)) {
                const isNight = preset.start_time >= '18:00' || preset.start_time < '06:00';
                types.set(key, {
                    code: preset.code,
                    startTime: preset.start_time,
                    endTime: preset.end_time,
                    color: isNight ? 'bg-indigo-500' : 'bg-amber-500'
                });
            }
        });

        return Array.from(types.values()).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [shiftPresets]);

    const shiftTypes = getUniqueShiftTypes();

    // Filter members by search
    const filteredMembers = groupMembers.filter(member =>
        member.profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get assignment for a specific member, date, and shift type
    const getAssignment = (memberId: string, dateStr: string, startTime: string) => {
        const shift = groupShifts.find(s => s.date === dateStr && s.start_time === startTime);
        if (!shift) return null;

        return localAssignments.find(a =>
            a.shift_id === shift.id &&
            a.profile_id === memberId
        );
    };

    // Handle cell click
    const handleCellClick = (member: GroupMember, date: Date, shiftType: { code: string; startTime: string }) => {
        const dateStr = toLocalDateString(date);
        const shift = groupShifts.find(s => s.date === dateStr && s.start_time === shiftType.startTime);

        if (!shift) return;

        const existingAssignment = localAssignments.find(a =>
            a.shift_id === shift.id &&
            a.profile_id === member.profile.id
        );

        if (existingAssignment) {
            // Remove assignment
            setLocalAssignments(prev => prev.filter(a => a.id !== existingAssignment.id));
            if (!existingAssignment.id.startsWith('temp-')) {
                deleteAssignment(existingAssignment.id).catch(err => {
                    console.error("Error deleting assignment:", err);
                    showToast("Erro ao remover atribuição", "error");
                });
            }
        } else {
            // Add assignment
            const newAssignment: ShiftAssignment = {
                id: `temp-${Date.now()}-${Math.random()}`,
                shift_id: shift.id,
                profile_id: member.profile.id,
                profile: member.profile,
                is_confirmed: false
            };
            setLocalAssignments(prev => [...prev, newAssignment]);
        }
    };

    // Handle save
    const handleSave = async () => {
        if (!selectedGroup) return;

        setIsLoading(true);
        try {
            const currentIds = new Set(localAssignments.map(a => a.id));

            // Deletions
            const toDelete = originalAssignments.filter(a => !currentIds.has(a.id));
            for (const a of toDelete) {
                await deleteAssignment(a.id);
            }

            // Additions
            const toAdd = localAssignments.filter(a => a.id.startsWith('temp-'));
            for (const assignment of toAdd) {
                await createAssignment({
                    shift_id: assignment.shift_id,
                    profile_id: assignment.profile_id,
                    is_confirmed: assignment.is_confirmed
                });
            }

            setOriginalAssignments([...localAssignments]);
            showToast("Escala salva com sucesso!", "success");
        } catch (error) {
            console.error("Failed to save:", error);
            showToast("Erro ao salvar escala", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle publish
    const handlePublish = async () => {
        if (!selectedGroup?.id) return;

        setIsLoading(true);
        try {
            await handleSave();
            const shiftIds = groupShifts.map(s => s.id);
            await publishShifts(selectedGroup.id, shiftIds);

            try {
                await sendGroupMessage({
                    group_id: selectedGroup.id,
                    sender_id: currentUser.id,
                    content: `🎉 Nova escala publicada para ${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}!`,
                    message_type: 'TEXT'
                });
            } catch (msgError) {
                console.error("Failed to post message:", msgError);
            }

            showToast("Escala publicada com sucesso!", "success");
            if (onBack) onBack();
        } catch (error) {
            console.error("Failed to publish:", error);
            showToast("Erro ao publicar escala", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle add member
    const handleAddNewMember = async (profile: Profile) => {
        if (!selectedGroup) return;

        const newMember: GroupMember = {
            id: `temp-m-${Date.now()}`,
            group_id: selectedGroup.id,
            profile: profile,
            role: 'MEDICO' as any,
            service_role: ServiceRole.PLANTONISTA
        };

        setGroupMembers(prev => [...prev, newMember]);
        setIsAddMemberModalOpen(false);

        if (selectedGroup.id && !selectedGroup.id.startsWith('temp-')) {
            try {
                await addGroupMember(selectedGroup.id, profile.id, 'MEDICO' as any, ServiceRole.PLANTONISTA);
                showToast(`${profile.full_name} adicionado(a) com sucesso!`, "success");
            } catch (error) {
                console.error("Error adding member:", error);
                showToast("Erro ao adicionar membro", "error");
            }
        }
    };

    // Get day header style
    const getDayStyle = (date: Date) => {
        const day = date.getDay();
        const isWeekend = day === 0 || day === 6;
        const isToday = toLocalDateString(date) === toLocalDateString(new Date());

        return {
            isWeekend,
            isToday,
            bgClass: isToday
                ? 'bg-primary text-white'
                : isWeekend
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
        };
    };

    // Years and months for dropdown
    const years = [currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1];

    // Keyboard shortcuts integration
    useKeyboardShortcuts(createEditorShortcuts({
        onSave: handleSave,
        onPublish: handlePublish,
        onReplicate: () => setIsReplicateModalOpen(true),
        onPrint: handlePrint,
        onEscape: handleEscape
    }));

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white/70 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex items-center gap-4">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="text-slate-700 dark:text-slate-200 font-medium">Carregando...</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0">
                <div className="flex items-center justify-between gap-4">
                    {/* Left: Back + Group Info */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                        </button>

                        <div className="flex flex-col">
                            <h1 className="text-xl font-black text-slate-800 dark:text-white">
                                Editor de Escala
                            </h1>
                            <span className="text-xs text-slate-500">
                                {selectedGroup?.name} • {selectedGroup?.institution}
                            </span>
                        </div>
                    </div>

                    {/* Center: Month Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                            className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary/50 transition-colors shadow-sm"
                        >
                            <Calendar size={18} className="text-primary" />
                            <span className="text-lg font-bold text-slate-800 dark:text-white">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </span>
                            <ChevronDown size={18} className={`text-slate-400 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Month Dropdown */}
                        {isMonthDropdownOpen && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 z-50 min-w-[320px]">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Selecionar Mês</span>
                                    <button onClick={() => setIsMonthDropdownOpen(false)}>
                                        <X size={16} className="text-slate-400" />
                                    </button>
                                </div>

                                {/* Year Tabs */}
                                <div className="flex gap-2 mb-4">
                                    {years.map(year => (
                                        <button
                                            key={year}
                                            onClick={() => setCurrentDate(new Date(year, currentDate.getMonth(), 1))}
                                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${currentDate.getFullYear() === year
                                                ? 'bg-primary text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>

                                {/* Month Grid */}
                                <div className="grid grid-cols-3 gap-2">
                                    {monthNames.map((month, index) => (
                                        <button
                                            key={month}
                                            onClick={() => {
                                                setCurrentDate(new Date(currentDate.getFullYear(), index, 1));
                                                setIsMonthDropdownOpen(false);
                                            }}
                                            className={`py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${currentDate.getMonth() === index
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                                                }`}
                                        >
                                            {month.substring(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsReplicateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                        >
                            <Copy size={16} />
                            Replicar
                        </button>

                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
                        >
                            <Printer size={16} />
                            Imprimir
                        </button>

                        <button
                            onClick={() => setIsPresetsManagerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-semibold text-sm transition-colors"
                        >
                            <Settings size={16} />
                            Turnos
                        </button>

                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 rounded-xl text-white font-semibold text-sm transition-colors"
                        >
                            <Save size={16} />
                            Salvar
                        </button>

                        <button
                            onClick={handlePublish}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <CheckCircle size={16} />
                            Publicar
                        </button>
                    </div>
                </div>

                {/* Shift Legend & Search */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <ShiftLegend presets={shiftPresets} />

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar membro..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none w-48"
                            />
                        </div>

                        <button
                            onClick={() => setIsAddMemberModalOpen(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                        >
                            <UserPlus size={16} />
                            Adicionar Membro
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse min-w-max">
                            {/* Table Header */}
                            <thead>
                                <tr>
                                    {/* Fixed Member Column */}
                                    <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 p-3 text-left min-w-[200px]">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Membro / Turno
                                        </span>
                                    </th>

                                    {/* Shift Type Sub-headers */}
                                    <th className="sticky left-[200px] z-20 bg-slate-50 dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 p-3 text-center min-w-[100px]">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            Turno
                                        </span>
                                    </th>

                                    {/* Day Columns */}
                                    {currentMonthDays.map(date => {
                                        const dayStyle = getDayStyle(date);
                                        const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

                                        return (
                                            <th
                                                key={toLocalDateString(date)}
                                                className={`border-b border-r border-slate-200 dark:border-slate-700 p-2 text-center min-w-[44px] ${dayStyle.bgClass}`}
                                            >
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-bold uppercase opacity-70">
                                                        {weekDay}
                                                    </span>
                                                    <span className="text-sm font-black">
                                                        {date.getDate().toString().padStart(2, '0')}
                                                    </span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody>
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={currentMonthDays.length + 2} className="p-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <UserPlus size={32} className="text-slate-300" />
                                                <span>Nenhum membro encontrado</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredMembers.flatMap((member) =>
                                        shiftTypes.map((shiftType, shiftIndex) => (
                                            <tr
                                                key={`${member.id}-${shiftType.code}-${shiftType.startTime}`}
                                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                {/* Member Name (only on first shift row) */}
                                                {shiftIndex === 0 ? (
                                                    <td
                                                        rowSpan={shiftTypes.length}
                                                        className="sticky left-0 z-10 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 p-3"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-emerald-400 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                                                {member.profile.full_name?.charAt(0) || 'U'}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-[140px]">
                                                                    {member.profile.full_name}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    {member.service_role === ServiceRole.ADMIN ? 'Administrador' : 'Plantonista'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                ) : null}

                                                {/* Shift Type */}
                                                <td className="sticky left-[200px] z-10 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 p-2 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-[10px] font-bold ${shiftType.color}`}>
                                                        <Clock size={10} />
                                                        {shiftType.code}
                                                    </div>
                                                </td>

                                                {/* Day Cells */}
                                                {currentMonthDays.map(date => {
                                                    const dateStr = toLocalDateString(date);
                                                    const assignment = getAssignment(member.profile.id, dateStr, shiftType.startTime);
                                                    const hasShift = groupShifts.some(s => s.date === dateStr && s.start_time === shiftType.startTime);
                                                    const dayStyle = getDayStyle(date);

                                                    return (
                                                        <td
                                                            key={`${member.id}-${dateStr}-${shiftType.startTime}`}
                                                            onClick={() => hasShift && handleCellClick(member, date, shiftType)}
                                                            className={`
                                border-b border-r border-slate-100 dark:border-slate-800 p-1 text-center
                                ${hasShift ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700' : 'bg-slate-50 dark:bg-slate-800/30 cursor-not-allowed'}
                                ${dayStyle.isWeekend && !assignment ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}
                                transition-colors
                              `}
                                                        >
                                                            {assignment ? (
                                                                <div className={`w-8 h-8 mx-auto rounded-lg ${shiftType.color} flex items-center justify-center text-white shadow-sm`}>
                                                                    <CheckCircle size={14} />
                                                                </div>
                                                            ) : hasShift ? (
                                                                <div className="w-8 h-8 mx-auto rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700" />
                                                            ) : (
                                                                <div className="w-8 h-8 mx-auto rounded-lg bg-slate-100 dark:bg-slate-800" />
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ShiftAssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => { }}
                date={selectionData?.date || new Date()}
                members={groupMembers}
                shiftLabel={selectionData?.shiftLabel || ''}
            />

            <AddMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => setIsAddMemberModalOpen(false)}
                onAddMember={handleAddNewMember}
                existingMemberIds={groupMembers.map(m => m.profile.id)}
            />

            <ShiftPresetsManager
                isOpen={isPresetsManagerOpen}
                onClose={() => setIsPresetsManagerOpen(false)}
                groupId={selectedGroup?.id || ''}
                currentPresets={shiftPresets}
                onSave={async (presets) => {
                    if (!selectedGroup?.id) return;
                    setIsLoading(true);
                    try {
                        // Save presets logic here (similar to ScaleEditorView)
                        await regenerateShiftsForMonth(selectedGroup.id, currentDate, presets);
                        const updatedShifts = await getShifts(selectedGroup.id);
                        setGroupShifts(updatedShifts);
                        const updatedPresets = await getShiftPresets(selectedGroup.id);
                        setShiftPresets(updatedPresets);
                        setIsPresetsManagerOpen(false);
                        showToast('Turnos atualizados com sucesso!', 'success');
                    } catch (error) {
                        console.error('Error saving presets:', error);
                        showToast('Erro ao atualizar turnos', 'error');
                    } finally {
                        setIsLoading(false);
                    }
                }}
            />

            {isReplicateModalOpen && (
                <ReplicateScheduleModal
                    isOpen={isReplicateModalOpen}
                    onClose={() => setIsReplicateModalOpen(false)}
                    sourceMonth={currentDate}
                    groupId={selectedGroup?.id || ''}
                    onSuccess={() => {
                        showToast('Escala replicada com sucesso!', 'success');
                        setIsReplicateModalOpen(false);
                    }}
                />
            )}
        </div>
    );
};

export default DesktopScaleEditor;
