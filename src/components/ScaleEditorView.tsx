import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Moon, Sun, UserPlus, Save, PlusCircle, ArrowRightLeft, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { Shift, Profile, AppRole, Group, ShiftAssignment, ServiceRole, GroupMember } from '../types';
import ShiftAssignmentModal from './ShiftAssignmentModal';
import AddMemberModal from './AddMemberModal';
import ScaleMonthSelector from './ScaleMonthSelector';
import ScalePublicationView from './ScalePublicationView';
import {
    getShifts,
    getAssignments,
    updateAssignment,
    publishShifts,
    sendGroupMessage,
    deleteAssignment,
    createAssignment,
    deleteShift,
    updateShift,
    getGroupMembers,
    addGroupMember,
    createService
} from '../services/api';
import { useToast } from '../context/ToastContext';

interface ScaleEditorViewProps {
    shifts?: Shift[]; // Made optional as we fetch internally now
    assignments?: ShiftAssignment[];
    currentUser: Profile;

    userGroups: Group[];
    onBack?: () => void;
    initialGroup?: Group | null;
    initialDate?: Date;
}

const ScaleEditorView: React.FC<ScaleEditorViewProps> = ({
    shifts: initialShiftsProp = [],
    assignments: initialAssignmentsProp = [],
    currentUser,

    userGroups,
    onBack,
    initialGroup,
    initialDate
}) => {
    const { showToast } = useToast();

    // View Mode: If initialDate is explicitly provided, jump to editor. Otherwise, start at selector.
    const [viewMode, setViewMode] = useState<'selector' | 'editor'>(initialDate ? 'editor' : 'selector');

    const [currentDate, setCurrentDate] = useState(initialDate || new Date());
    // Initialize with initialGroup if provided, or default to first group
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(initialGroup || userGroups[0] || null);

    // Data State
    const [groupShifts, setGroupShifts] = useState<Shift[]>(initialShiftsProp);
    const [localAssignments, setLocalAssignments] = useState<ShiftAssignment[]>(initialAssignmentsProp);
    const [originalAssignments, setOriginalAssignments] = useState<ShiftAssignment[]>(initialAssignmentsProp);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]); // Members State
    const [isLoading, setIsLoading] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [selectionData, setSelectionData] = useState<{ date: Date; shiftLabel: string; startTime: string } | null>(null);
    const [swapSource, setSwapSource] = useState<ShiftAssignment | null>(null); // State for Swap Action
    const [showPublicationReview, setShowPublicationReview] = useState(false);

    // Effect to update selectedGroup if initialGroup changes
    useEffect(() => {
        if (initialGroup) {
            setSelectedGroup(initialGroup);
        }
    }, [initialGroup]);

    // FETCH DATA when selectedGroup changes
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedGroup?.id || selectedGroup.id.startsWith('temp-')) return;

            setIsLoading(true);
            try {
                // 1. Fetch Shifts for Group
                const shiftsData = await getShifts(selectedGroup.id);
                setGroupShifts(shiftsData);

                // 2. Fetch Assignments for these Shifts
                if (shiftsData.length > 0) {
                    const shiftIds = shiftsData.map(s => s.id);
                    const assignmentsData = await getAssignments(shiftIds);
                    setLocalAssignments(assignmentsData);
                    setOriginalAssignments(assignmentsData);
                } else {
                    setLocalAssignments([]);
                    setOriginalAssignments([]);
                }

                // 3. Fetch Group Members
                const membersData = await getGroupMembers(selectedGroup.id);
                setGroupMembers(membersData);

            } catch (error) {
                console.error("Error fetching scale data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedGroup]);

    const handleAddNewMember = async (profile: Profile) => {
        if (!selectedGroup) return;

        // 1. Update Local State immediately for UI
        const newMember = {
            id: `temp-m-${Date.now()}`,
            group_id: selectedGroup.id,
            profile: profile,
            role: AppRole.MEDICO,
            service_role: ServiceRole.PLANTONISTA
        };

        const updatedGroup = {
            ...selectedGroup,
            members: [...(selectedGroup.members || []), newMember]
        };
        // Update local members state
        setGroupMembers(prev => [...prev, newMember as any]); // ensuring type compatibility

        setSelectedGroup(updatedGroup);
        setIsAddMemberModalOpen(false);

        // 2. Persist if Group is Real
        if (selectedGroup.id && !selectedGroup.id.startsWith('temp-')) {
            try {
                await addGroupMember(selectedGroup.id, profile.id, AppRole.MEDICO, ServiceRole.PLANTONISTA);
                showToast(`Dr(a). ${profile.full_name} adicionado(a) com sucesso!`, "success");
            } catch (error: any) {
                console.error("Error adding member:", error);
                showToast(`Erro ao salvar membro: ${error.message || JSON.stringify(error)}`, "error");
            }
        }
    };

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Generate days for the selected month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1));
    };

    // Helper: Local YYYY-MM-DD
    const toLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const currentMonthDays = getDaysInMonth(currentDate);

    // Handle opening the assignment modal
    // --- DIRECT ACTIONS (SWAP & DELETE) ---

    const handleDeleteAssignment = async (assignmentId: string) => {
        if (!confirm("Tem certeza que deseja remover este membro do plantão?")) return;

        // Optimistic Update
        const prevAssignments = [...localAssignments];
        setLocalAssignments(prev => prev.filter(a => a.id !== assignmentId));

        try {
            // Check if it's a temp ID (not saved yet)
            if (!assignmentId.startsWith('temp-')) {
                await deleteAssignment(assignmentId);
            }
        } catch (error) {
            console.error("Error deleting assignment:", error);
            showToast("Erro ao remover. Tente novamente.", "error");
            setLocalAssignments(prevAssignments); // Revert
        }
    };

    const handleSwapInitiate = (assignment: ShiftAssignment) => {
        if (swapSource?.id === assignment.id) {
            setSwapSource(null); // Cancel if clicking same
        } else {
            setSwapSource(assignment);
            // Ideally show a toast here. For now, visual feedback on card is enough.
        }
    };

    const handleSlotClick = async (date: Date, key: string, label: string, startTime: string) => {
        const dateStr = toLocalDateString(date);
        const sId = groupShifts.find(s => s.date === dateStr && s.start_time === startTime)?.id;

        if (!sId) {
            // Need to create shift effectively if it doesn't exist? 
            // The current logic implies shifts exist. 
            // If they don't, we can't swap to them easily without creating them first.
            // Assuming shifts exist for now based on currentMonthDays map logic.
            return;
        }

        // SWAP LOGIC
        if (swapSource) {
            // Check if we are clicking the source itself (Cancel)
            if (swapSource.shift_id === sId && localAssignments.find(a => a.id === swapSource.id)?.shift_id === sId) {
                // Wait, if users click the same SLOT, but maybe the slot has multiple people?
                // The key is unique per slot-row.
                setSwapSource(null);
                return;
            }

            const prevAssignments = [...localAssignments]; // Defined here for correct scope

            try {
                // 1. Identify Target Assignment (if any)
                // We need to know WHICH row was clicked if we want to swap with a specific person.
                // The `key` passed is `${slot.id}-${rowIndex}`.
                // But `handleSlotClick` arguments don't strictly include rowIndex unless we pass it.
                // We only passed date, key, label, startTime. Key contains the info.

                const rowIndex = parseInt(key.split('-').pop() || '0');
                const assignmentsForShift = localAssignments.filter(a => a.shift_id === sId);
                const targetAssignment = assignmentsForShift[rowIndex]; // The assignment at this specific slot/row

                if (targetAssignment) {
                    // CASE A: Swap two existing assignments
                    // Source: swapSource (id: A, shift: S1)
                    // Target: targetAssignment (id: B, shift: S2)

                    // Optimistic
                    const updated = localAssignments.map(a => {
                        if (a.id === swapSource.id) return { ...a, shift_id: targetAssignment.shift_id };
                        if (a.id === targetAssignment.id) return { ...a, shift_id: swapSource.shift_id };
                        return a;
                    });
                    setLocalAssignments(updated);
                    setSwapSource(null);

                    // API
                    if (!swapSource.id.startsWith('temp-') && !targetAssignment.id.startsWith('temp-')) {
                        await updateAssignment(swapSource.id, { shift_id: targetAssignment.shift_id });
                        await updateAssignment(targetAssignment.id, { shift_id: swapSource.shift_id });
                    }
                    showToast("Troca efetuada com sucesso!", "success");

                } else {
                    // CASE B: Move to Empty Slot
                    // Source: swapSource (id: A, shift: S1)
                    // Target: Empty (shift: S2)

                    // Optimistic
                    const updated = localAssignments.map(a => {
                        if (a.id === swapSource.id) return { ...a, shift_id: sId };
                        return a;
                    });
                    setLocalAssignments(updated);
                    setSwapSource(null);

                    // API
                    if (!swapSource.id.startsWith('temp-')) {
                        await updateAssignment(swapSource.id, { shift_id: sId });
                    }
                    showToast("Troca efetuada com sucesso!", "success");
                }

            } catch (error) {
                console.error("Swap failed", error);
                const errorMessage = error instanceof Error ? error.message :
                    (typeof error === 'object' && error !== null && 'message' in error) ? (error as any).message :
                        JSON.stringify(error);
                showToast(`Erro ao realizar troca: ${errorMessage}`, "error");
                setLocalAssignments(prevAssignments); // Revert
            }
            return;
        }

        // NORMAL: Open Modal
        setSelectionData({ date, shiftLabel: label, startTime });
        setIsModalOpen(true);
    };

    // LOGIC: Calculate timestamps and assign members
    const handleAssignMember = (memberId: string, frequency: string) => {
        if (!selectionData || !selectedGroup) return;

        const { date: targetDate, startTime } = selectionData;
        const newAssignmentsToAdd: ShiftAssignment[] = [];
        const member = groupMembers.find(m => m.id === memberId);

        if (!member) return;

        // Helper to find shift ID for a date + time
        const findShiftId = (d: Date) => {
            const dStr = toLocalDateString(d);
            const s = groupShifts.find(shift => shift.date === dStr && shift.start_time === startTime);
            return s?.id;
        };

        const targetYear = targetDate.getFullYear();
        const targetMonth = targetDate.getMonth();
        const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

        // 1. Determine Dates to assign
        const datesToAssign: Date[] = [];

        if (frequency === 'unico') {
            datesToAssign.push(new Date(targetDate));
        } else if (frequency === 'semanal') {
            const targetDayOfWeek = targetDate.getDay();
            for (let day = 1; day <= lastDayOfMonth; day++) {
                const d = new Date(targetYear, targetMonth, day);
                if (d.getDay() === targetDayOfWeek && d >= targetDate) {
                    datesToAssign.push(d);
                }
            }
        } else if (frequency === 'quinzenal') {
            let d = new Date(targetDate);
            while (d.getMonth() === targetMonth) {
                datesToAssign.push(new Date(d));
                d.setDate(d.getDate() + 14);
            }
        } else if (frequency === 'mensal') {
            datesToAssign.push(new Date(targetDate));
        }

        // 2. Generate Assignments
        let duplicateCount = 0;
        datesToAssign.forEach(d => {
            const sId = findShiftId(d);
            if (sId) {
                // Check if member is already assigned to this shift
                const isAlreadyAssigned = localAssignments.some(
                    a => a.shift_id === sId && a.profile_id === member.profile.id
                );

                if (isAlreadyAssigned) {
                    duplicateCount++;
                    return;
                }

                newAssignmentsToAdd.push({
                    id: `temp-${Math.random()}`,
                    shift_id: sId,
                    profile_id: member.profile.id,
                    profile: member.profile, // Crucial for local display!
                    is_confirmed: false
                });
            }
        });

        if (duplicateCount > 0 && newAssignmentsToAdd.length === 0) {
            showToast(`O membro já está escalado para este(s) dia(s).`, "error");
            return;
        }

        // 3. Update State (Append)
        setLocalAssignments(prev => [...prev, ...newAssignmentsToAdd]);

        setIsModalOpen(false); // Close modal after assignment
        setSelectionData(null); // Clear selection data
    };



    // --- SAVE LOGIC ---
    // Helper: Ensure we have a valid Service (Group) in DB
    const ensureServiceExists = async (group: Group): Promise<Group> => {
        if (!group.id || group.id.startsWith('temp-')) {
            // It's a draft group, we need to create it
            // Assuming current user is owner
            try {
                const newGroup = await createService(currentUser.id, group.name, group.institution, group.color || '#000000');
                return newGroup;
            } catch (error) {
                console.error("Error creating service:", error);
                throw error;
            }
        }
        return group;
    };



    const handleSaveAndExit = async (notify: boolean = true) => {
        if (!selectedGroup) return;

        // const [isSaving, setIsSaving] = useState(false); // We need this state if we want UI feedback
        // For this step, we'll just use alert/block.

        try {
            // 1. Ensure Service Exists
            const persistedGroup = await ensureServiceExists(selectedGroup);
            if (persistedGroup.id !== selectedGroup.id) {
                // Update local state if ID changed
                setSelectedGroup(persistedGroup);
            }



            // 2. Process Assignments
            // We need to diff `localAssignments` vs `originalAssignments` (from DB)
            // Or simpler: For every assignment in `localAssignments`:
            //    - If it has `_mockDate` (newly created draft), it needs saving.
            //    - If it's old (real ID), we leave it (assuming no updates to existing in this view, only adds/removes).
            //    - WAIT: Removals?
            //    - If `originalAssignments` has ID X, and `localAssignments` does NOT, we must DELETE X.

            const currentIds = new Set(localAssignments.map(a => a.id));

            // A. Deletions
            const toDelete = originalAssignments.filter(a => !currentIds.has(a.id));
            for (const a of toDelete) {
                await deleteAssignment(a.id);
            }

            // B. Additions / Updates
            const toAdd = localAssignments.filter(a => a.id.startsWith('temp-'));

            for (const assignment of toAdd) {

                await createAssignment({
                    shift_id: assignment.shift_id,
                    profile_id: assignment.profile_id,
                    is_confirmed: assignment.is_confirmed
                });
            }

            if (notify) {
                showToast("Rascunho salvo com sucesso!", "success");
            }
            if (onBack) onBack();

        } catch (error) {
            console.error("Failed to save draft:", error);
            showToast("Erro ao salvar rascunho. Tente novamente.", "error");
        }
    };



    // Conditional Render: Selector Mode
    if (viewMode === 'selector' && selectedGroup) {
        return (
            <ScaleMonthSelector
                group={selectedGroup}
                onBack={() => onBack && onBack()}
                onSelectMonth={(date) => {
                    setCurrentDate(date);
                    setViewMode('editor');
                }}
            />
        );
    }

    // Conditional Render: Publication Review
    if (showPublicationReview && selectedGroup) {
        const handlePublishScale = async () => {
            if (!selectedGroup?.id) return;

            setIsLoading(true);
            try {
                // Publish all shifts in the current view/group
                const shiftIds = groupShifts.map(s => s.id);
                await publishShifts(selectedGroup.id, shiftIds);

                // Add message to feed
                try {
                    await sendGroupMessage({
                        group_id: selectedGroup.id,
                        sender_id: currentUser.id,
                        content: `🎉 Nova escala publicada para ${currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}!`,
                        message_type: 'TEXT'
                    });
                } catch (msgError) {
                    console.error("Failed to post publication message:", msgError);
                }

                showToast("Escala publicada com sucesso!", "success");
                setShowPublicationReview(false);
                if (onBack) onBack(); // Exit scale editor after publishing
            } catch (error) {
                console.error("Failed to publish scale:", error);
                showToast("Erro ao publicar escala.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        return (
            <ScalePublicationView
                group={selectedGroup}
                currentUser={currentUser}
                shifts={groupShifts}
                assignments={localAssignments}
                onBack={() => setShowPublicationReview(false)}
                onPublish={handlePublishScale}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[70] flex flex-col h-full bg-slate-100 dark:bg-black transition-colors duration-300 overflow-y-auto pb-10 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            )}

            {/* Header Section - Compact Liquid Glass */}
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl py-3 px-4 shadow-sm border-b border-white/20 dark:border-slate-800/50 z-20 sticky top-0 flex items-center justify-between gap-3 transition-colors duration-300 supports-[backdrop-filter]:bg-white/60">

                {/* Left: Back Btn + Title & Group Info */}
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => handleSaveAndExit(false)} // Silent save on back
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">
                                Escala
                            </h1>
                            <span className="text-[10px] font-bold text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                Beta
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[150px]">
                                {selectedGroup?.name || "Selecione um Serviço"}
                            </span>
                            <button
                                onClick={() => setIsAddMemberModalOpen(true)}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                title="Adicionar Membro"
                            >
                                <UserPlus size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Compact Month Selector - Glassy */}
                <div className="flex items-center bg-white/50 dark:bg-slate-800/50 p-0.5 rounded-lg border border-white/20 dark:border-slate-700/50 shrink-0 backdrop-blur-md shadow-sm">
                    <button
                        onClick={handlePrevMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/80 dark:hover:bg-slate-700 text-slate-500 transition-all active:scale-95"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <div className="px-2 text-center min-w-[70px]">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 block leading-tight">
                            {monthNames[currentDate.getMonth()].substring(0, 3)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium leading-none">
                            {currentDate.getFullYear()}
                        </span>
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/80 dark:hover:bg-slate-700 text-slate-500 transition-all active:scale-95"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Main Content - Days List */}
            <div className="px-2 md:px-4 py-4 md:py-8 max-w-5xl mx-auto w-full space-y-2 md:space-y-6">

                {currentMonthDays.map((date) => {
                    const dateStr = toLocalDateString(date);
                    const weekDay = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
                    const dayNumber = date.getDate().toString().padStart(2, '0');
                    const monthName = monthNames[date.getMonth()];

                    // Mock Configuration: Active Shift Types (Dynamic 1-4)
                    // Request: Show only MT and SN
                    // Filter shifts for this specific date
                    const dailyShifts = groupShifts.filter(s => s.date === dateStr);

                    // If no shifts exist (e.g. future months not generated), fallback to empty or defaults
                    // For now, if empty, we might show nothing or default slots.
                    // But to respect the user's creation, we should rely on dailyShifts.

                    const shiftSlots = dailyShifts.length > 0 ? dailyShifts.map(s => {
                        const isNight = s.start_time >= '18:00' || s.start_time < '06:00';
                        return {
                            id: s.id, // Use real ID
                            code: s.code || (isNight ? 'NT' : 'DT'), // Use code or fallback
                            label: s.code || (isNight ? 'NT' : 'DT'),
                            hours: '12h', // Could calculate from start/end
                            icon: isNight ? Moon : Sun,
                            color: isNight
                                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
                            start_time: s.start_time
                        };
                    }).sort((a, b) => a.start_time.localeCompare(b.start_time)) : [];

                    // If no shifts found, maybe show a "No Shifts" message or keeping existing behaviour?
                    // Existing behavior was hardcoded. 
                    // If we return empty, the day will be empty.

                    // Mock Configuration: Rows per day (Quantity of professionals)
                    const rowsPerDay = 2; // Still hardcoded for now, ideal is s.quantity_needed

                    return (
                        <div key={dateStr} className="bg-white dark:bg-slate-900 rounded-2xl md:rounded-3xl p-2 md:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 dark:border-slate-800 animate-in fade-in duration-700 slide-in-from-bottom-4">

                            {/* Date Header - Mobile Horizontal */}
                            <div className="flex flex-row md:flex-col items-center md:items-start justify-between gap-3 mb-2 md:mb-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl md:bg-transparent md:p-0">
                                <div className="flex items-center gap-2 md:gap-3">
                                    <div className="flex flex-col items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl shadow-sm">
                                        <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase leading-none mt-1">
                                            {weekDay}
                                        </span>
                                        <span className="text-sm md:text-xl font-black text-slate-800 dark:text-slate-100 leading-none">
                                            {dayNumber}
                                        </span>
                                    </div>
                                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />
                                    <span className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest hidden md:block">
                                        {monthName}
                                    </span>
                                    {/* Mobile Month Name */}
                                    <span className="text-xs font-bold text-slate-500 md:hidden uppercase">
                                        {monthName.substring(0, 3)}
                                    </span>
                                </div>
                            </div>

                            {/* Shifts Rows Container */}
                            <div className="flex flex-col gap-3 w-full">
                                {Array.from({ length: rowsPerDay }).map((_, rowIndex) => (
                                    /* Single Row of Shifts */
                                    <div key={rowIndex} className="flex flex-row gap-1.5 md:gap-4 w-full">
                                        {shiftSlots.map((slot) => {
                                            // Get assignment from local state by filtering all assignments for this shift and picking by row index
                                            const assignmentsForShift = localAssignments.filter(a => a.shift_id === slot.id);
                                            const assignment = assignmentsForShift[rowIndex];
                                            const isAssigned = !!assignment;

                                            // Unique key for React
                                            const key = `${slot.id}-${rowIndex}`;

                                            // Ensure we have profile data
                                            const assignedProfile = assignment?.profile;

                                            // Clean name for avatar AND display (remove Dr., Dra., etc)
                                            const cleanName = assignedProfile?.full_name?.replace(/^(Dr\.|Dra\.|Prof\.|Enf\.|Sr\.|Sra\.)\s+/i, '').trim() || 'User';
                                            const nameParts = cleanName.split(' ');
                                            const displayName = nameParts.length > 1
                                                ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
                                                : nameParts[0];

                                            const mockAvatar = assignedProfile?.avatar_url || `https://ui-avatars.com/api/?name=${cleanName}&background=random`;
                                            const Icon = slot.icon;

                                            return (
                                                <div key={key} className="flex-1 min-w-0 flex flex-col gap-2">

                                                    {/* Slot Card */}
                                                    <div className={`
                                                        relative flex flex-col items-center justify-between p-1.5 md:p-4 rounded-xl md:rounded-2xl h-28 md:h-40 transition-all
                                                        ${isAssigned
                                                            ? 'bg-emerald-600 border border-emerald-500 shadow-md shadow-emerald-200/50 dark:shadow-none'
                                                            : 'bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-300'}
                                                    `}>

                                                        {/* Shift Label - Modernized */}
                                                        <div className={`
                                                            flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm
                                                            ${isAssigned
                                                                ? 'bg-white/20 border-white/10 text-white'
                                                                : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 ${slot.color.split(' ')[0]}` // Extract text color
                                                            }
                                                        `}>
                                                            <Icon size={10} strokeWidth={3} />
                                                            <span className="text-[9px] md:text-xs font-black tracking-wide leading-none">
                                                                {slot.label}
                                                            </span>
                                                            <div className={`w-0.5 h-2.5 rounded-full ${isAssigned ? 'bg-white/40' : 'bg-slate-200 dark:bg-slate-600'}`} />
                                                            <span className={`text-[8px] md:text-[10px] font-bold leading-none ${isAssigned ? 'text-white/90' : 'text-slate-400'}`}>
                                                                {slot.hours}
                                                            </span>
                                                        </div>

                                                        {/* Body: Content */}
                                                        <div className="flex-1 flex flex-col items-center justify-center w-full gap-1.5 mt-1">
                                                            {isAssigned ? (
                                                                <>
                                                                    <div className="relative group cursor-pointer w-full h-full flex flex-col items-center justify-center p-1" onClick={() => handleSlotClick(date, key, slot.label, slot.start_time)}>

                                                                        {/* ACTION ICONS (Top Right of Card) */}
                                                                        <div className="absolute right-1 top-1 flex flex-col gap-1 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                            {/* 1. Swap Button */}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleSwapInitiate(assignment);
                                                                                }}
                                                                                className={`
                                                                                    w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm transition-all active:scale-95 md:hover:scale-110
                                                                                    ${swapSource?.id === assignment.id
                                                                                        ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200'
                                                                                        : 'bg-white/90 dark:bg-slate-800/90 text-slate-500 hover:text-blue-500'}
                                                                                `}
                                                                                title="Trocar"
                                                                            >
                                                                                <ArrowRightLeft size={10} strokeWidth={2.5} className="md:w-3 md:h-3" />
                                                                            </button>

                                                                            {/* 2. Delete Button */}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleDeleteAssignment(assignment.id);
                                                                                }}
                                                                                className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-500 hover:text-red-500 flex items-center justify-center shadow-sm backdrop-blur-sm transition-all active:scale-95 md:hover:scale-110"
                                                                                title="Remover"
                                                                            >
                                                                                <Trash2 size={10} strokeWidth={2.5} className="md:w-3 md:h-3" />
                                                                            </button>
                                                                        </div>

                                                                        {/* Avatar Container */}
                                                                        <div className={`
                                                                            w-8 h-8 md:w-12 md:h-12 rounded-full p-0.5 shadow-sm transition-all duration-300 relative
                                                                            ${swapSource?.id === assignment.id ? 'ring-4 ring-orange-400 scale-110 bg-orange-100' : 'bg-white/30'}
                                                                        `}>
                                                                            <img
                                                                                src={mockAvatar}
                                                                                alt="Avatar"
                                                                                className="w-full h-full rounded-full object-cover border-2 border-emerald-600"
                                                                            />
                                                                        </div>

                                                                        <span className="text-[9px] md:text-xs font-bold text-white text-center leading-tight truncate w-full px-1 mt-1">
                                                                            {displayName}
                                                                        </span>
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <div
                                                                    className={`w-full h-full flex flex-col items-center justify-center cursor-pointer rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors ${swapSource ? 'ring-2 ring-orange-400 bg-orange-50/50' : ''}`}
                                                                    onClick={() => handleSlotClick(date, key, slot.label, slot.start_time)}
                                                                >
                                                                    {swapSource ? (
                                                                        <div className="flex flex-col items-center animate-pulse">
                                                                            <ArrowRightLeft size={20} className="text-orange-500 mb-1" />
                                                                            <span className="text-[8px] font-bold text-orange-600 uppercase">Trocar aqui</span>
                                                                        </div>
                                                                    ) : (
                                                                        <PlusCircle size={24} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Action Bar / Footer - Robust Centering */}
            <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
                <div className="pointer-events-auto flex items-center gap-3 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/30 dark:border-slate-700/50 scale-95 md:scale-100 transition-transform ring-1 ring-white/40 dark:ring-white/10">
                    <button
                        onClick={() => handleSaveAndExit(true)} // Notify on explicit save
                        className="flex items-center gap-3 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-white dark:hover:bg-slate-700 border border-white/20 dark:border-slate-600/50 transition-all text-[10px] md:text-xs lg:text-sm leading-tight backdrop-blur-sm"
                    >
                        <Save size={20} />
                        <span className="text-left">
                            Salvar<br />
                            Rascunho
                        </span>
                    </button>

                    <button
                        onClick={() => setShowPublicationReview(true)}
                        className="flex items-center gap-3 bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-500 hover:scale-[1.02] transition-all text-[10px] md:text-xs lg:text-sm leading-tight border border-white/20"
                    >
                        <CheckCircle size={20} />
                        <span className="text-left">
                            Revisar<br />
                            Escala
                        </span>
                    </button>
                </div>
            </div>

            {/* Load More/Scroll Tip */}
            <div className="flex justify-center pb-8 pt-4">
                <button className="bg-white dark:bg-slate-800 px-6 py-2 rounded-full text-xs font-bold text-slate-400 border border-slate-100 dark:border-slate-800 shadow-sm">
                    Carregar mais dias
                </button>
            </div>

            <ShiftAssignmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleAssignMember}
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

        </div>
    );
};

export default ScaleEditorView;
