import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Moon, Sun, UserPlus, Save, PlusCircle, ArrowRightLeft, Trash2, Loader2, CheckCircle, Settings, Edit } from 'lucide-react';
import { Shift, Profile, AppRole, Group, ShiftAssignment, ServiceRole, GroupMember, ShiftPreset } from '../types';
import ShiftAssignmentModal from './ShiftAssignmentModal';
import AddMemberModal from './AddMemberModal';
import ScaleMonthSelector from './ScaleMonthSelector';
import ScalePublicationView from './ScalePublicationView';
import ShiftLegend from './ShiftLegend';
import ShiftPresetsManager from './ShiftPresetsManager';
import {
    getShifts,
    getAssignments,
    updateAssignment,
    publishShifts,
    sendGroupMessage,
    deleteAssignment,
    createAssignment,
    getGroupMembers,
    addGroupMember,
    createService,
    getShiftPresets,
    createShiftPreset,
    updateShiftPreset,
    deleteShiftPreset,
    regenerateShiftsForMonth,
    saveDailyScale,
    revertDailyScaleToGeneral
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
    initialPresets?: ShiftPreset[];
}

const ScaleEditorView: React.FC<ScaleEditorViewProps> = ({
    shifts: initialShiftsProp = [],
    assignments: initialAssignmentsProp = [],
    currentUser,

    userGroups,
    onBack,
    initialGroup,
    initialDate,
    initialPresets = []
}) => {
    const { showToast } = useToast();

    // View Mode: If initialDate is explicitly provided, jump to editor. Otherwise, start at selector.
    const [viewMode, setViewMode] = useState<'selector' | 'editor'>(initialDate ? 'editor' : 'selector');

    const [currentDate, setCurrentDate] = useState(initialDate || new Date());
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(initialGroup || userGroups[0] || null);

    const userRole = selectedGroup?.user_role;
    const isAdmin = userRole === ServiceRole.ADMIN || userRole === ServiceRole.ADMIN_AUX;
    const isOwner = userRole === ServiceRole.ADMIN;

    // Data State
    const [groupShifts, setGroupShifts] = useState<Shift[]>(initialShiftsProp);
    const [localAssignments, setLocalAssignments] = useState<ShiftAssignment[]>(initialAssignmentsProp);
    const [originalAssignments, setOriginalAssignments] = useState<ShiftAssignment[]>(initialAssignmentsProp);
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]); // Members State
    const [isLoading, setIsLoading] = useState(false);

    const [shiftPresets, setShiftPresets] = useState<ShiftPreset[]>(initialPresets);
    const [isPresetsManagerOpen, setIsPresetsManagerOpen] = useState(false);

    // Individual Day Editing
    const [isDailyMode, setIsDailyMode] = useState(false);
    const [editingDate, setEditingDate] = useState<string | null>(null);
    const [dailyPresets, setDailyPresets] = useState<ShiftPreset[]>([]);

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

                // 4. Fetch Shift Presets
                let presetsData = await getShiftPresets(selectedGroup.id);

                // Fallback: If no presets exist but we have shifts, infer them
                if (presetsData.length === 0 && shiftsData.length > 0) {
                    const uniquePresets = new Map<string, ShiftPreset>();

                    shiftsData.forEach(shift => {
                        // Create a unique key for the preset configuration
                        const key = `${shift.code || 'UNK'}-${shift.start_time}-${shift.end_time}`;

                        if (!uniquePresets.has(key)) {
                            uniquePresets.set(key, {
                                id: `inferred-${key}`, // Temporary ID
                                group_id: shift.group_id,
                                code: shift.code || 'PLT',
                                start_time: shift.start_time,
                                end_time: shift.end_time,
                                quantity_needed: shift.quantity_needed,
                                days_of_week: [0, 1, 2, 3, 4, 5, 6] // Default to all days since we can't easily infer recurrence yet
                            });
                        }
                    });

                    presetsData = Array.from(uniquePresets.values());
                }

                if (presetsData.length > 0) {
                    setShiftPresets(presetsData);
                } else if (initialPresets && initialPresets.length > 0) {
                    setShiftPresets(initialPresets);
                } else {
                    setShiftPresets([]);
                }

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

    // --- SHIFT PRESETS MANAGEMENT ---
    const handleSavePresets = async (newPresets: ShiftPreset[]) => {
        if (!selectedGroup?.id) return;

        setIsLoading(true);
        try {
            // 1. Identify changes
            const toAdd = newPresets.filter(p => p.id.startsWith('temp-'));
            const toUpdate = newPresets.filter(p =>
                !p.id.startsWith('temp-') &&
                shiftPresets.find(old =>
                    old.id === p.id &&
                    (old.start_time !== p.start_time ||
                        old.end_time !== p.end_time ||
                        old.code !== p.code ||
                        old.quantity_needed !== p.quantity_needed ||
                        // Check if days of week changed (simple stringify comparison for array content)
                        JSON.stringify(old.days_of_week?.sort()) !== JSON.stringify(p.days_of_week?.sort())
                    )
                )
            );
            const toDelete = shiftPresets.filter(old =>
                !newPresets.find(p => p.id === old.id)
            );

            // 2. Apply changes concurrently
            const promises: Promise<any>[] = [];

            // Add new presets in bulk if function exists, otherwise concurrent individual ops (or use create if bulk not imported)
            // But we already have createShiftPresetsBulk in api.ts, need to import it.
            // Since we can't easily change imports in this block, let's use parallel create for now or assume import exists (I will update imports next)
            // Actually, for now let's use parallel individual creates if bulk isn't imported, but I should update imports first.
            // Wait, I can't update imports IN THE SAME BLOCK comfortably. 
            // I will use concurrent individual creations here for safety if bulk isn't imported, 
            // BUT wait, toAdd is local only.

            // To ensure safety, I will stick to what's available or use what I know I can fix. 
            // Let's assume I will fix imports in a separate step or just use parallel loops for now.
            // The file preview showed createShiftPreset IS imported. createShiftPresetsBulk might not be.
            // Let's strictly use Promise.all with existing functions to be safe, which is already a huge specific improvement.

            if (toAdd.length > 0) {
                promises.push(...toAdd.map(preset => createShiftPreset({
                    group_id: selectedGroup.id,
                    code: preset.code,
                    start_time: preset.start_time,
                    end_time: preset.end_time,
                    quantity_needed: preset.quantity_needed,
                    days_of_week: preset.days_of_week
                })));
            }

            if (toUpdate.length > 0) {
                promises.push(...toUpdate.map(preset => updateShiftPreset(preset.id, {
                    code: preset.code,
                    start_time: preset.start_time,
                    end_time: preset.end_time,
                    quantity_needed: preset.quantity_needed,
                    days_of_week: preset.days_of_week
                })));
            }

            if (toDelete.length > 0) {
                promises.push(...toDelete.map(preset => deleteShiftPreset(preset.id)));
            }

            // Await all DB mutations
            await Promise.all(promises);

            // 3. Regenerate shifts for current month
            // This is also slow, but likely necessary.
            // OPTIMIZATION: Pass the updated presets so we don't fetch them again!
            // We need to pass the FULL list of presets (new + existing - deleted + updated)
            // But actually, we just updated the DB. If we construct the full list in memory, we save a fetch.
            // Constructing the memory list:
            // This is tricky because `newPresets` passed to this function IS the full new state from UI!
            // `ShiftPresetsManager` calls `onSave(presets)` with the full final array.
            // So `newPresets` IS valid to pass directly.

            await regenerateShiftsForMonth(selectedGroup.id, currentDate, newPresets);

            // 4. Reload data concurrently
            const [updatedShifts, updatedPresets] = await Promise.all([
                getShifts(selectedGroup.id),
                getShiftPresets(selectedGroup.id)
            ]);

            setGroupShifts(updatedShifts);
            setShiftPresets(updatedPresets);

            // Reload assignments if shifts exist
            if (updatedShifts.length > 0) {
                const shiftIds = updatedShifts.map(s => s.id);
                const assignmentsData = await getAssignments(shiftIds);
                setLocalAssignments(assignmentsData);
                setOriginalAssignments(assignmentsData);
            } else {
                // If no shifts, assignments should be empty
                setLocalAssignments([]);
                setOriginalAssignments([]);
            }

            setIsPresetsManagerOpen(false);
            showToast('Turnos atualizados com sucesso!', 'success');
        } catch (error) {
            console.error('Error saving presets:', error);
            showToast('Erro ao atualizar turnos. Tente novamente.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenDailyEditor = (dateStr: string, currentShifts: Shift[]) => {
        setEditingDate(dateStr);
        setIsDailyMode(true);
        // Map shifts to presets format
        const presets: ShiftPreset[] = currentShifts.map(s => ({
            id: s.id,
            group_id: s.group_id,
            code: s.code || '',
            start_time: s.start_time,
            end_time: s.end_time,
            quantity_needed: s.quantity_needed
        }));
        setDailyPresets(presets);
        setIsPresetsManagerOpen(true);
    };

    const handleSaveDailyPresets = async (presets: ShiftPreset[]) => {
        if (!selectedGroup || !editingDate) return;

        setIsLoading(true);
        try {
            await saveDailyScale(
                selectedGroup.id,
                editingDate,
                presets.map(p => ({
                    code: p.code,
                    start_time: p.start_time,
                    end_time: p.end_time,
                    quantity_needed: p.quantity_needed || 1
                }))
            );

            // Refresh data
            const updatedShifts = await getShifts(selectedGroup.id);
            setGroupShifts(updatedShifts);

            setIsPresetsManagerOpen(false);
            setIsDailyMode(false);
            setEditingDate(null);
            showToast('Escala do dia atualizada com sucesso!', 'success');
        } catch (error) {
            console.error('Error saving daily presets:', error);
            showToast('Erro ao atualizar escala do dia.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRevertToGeneral = async () => {
        if (!selectedGroup || !editingDate) return;

        if (!confirm('Deseja reverter este dia para a escala geral? Todas as alterações manuais deste dia serão perdidas.')) {
            return;
        }

        setIsLoading(true);
        try {
            await revertDailyScaleToGeneral(selectedGroup.id, editingDate);

            // Refresh data
            const updatedShifts = await getShifts(selectedGroup.id);
            setGroupShifts(updatedShifts);

            setIsPresetsManagerOpen(false);
            setIsDailyMode(false);
            setEditingDate(null);
            showToast('Escala revertida para o padrão geral!', 'success');
        } catch (error) {
            console.error('Error reverting daily scale:', error);
            showToast('Erro ao reverter escala.', 'error');
        } finally {
            setIsLoading(false);
        }
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
                currentDate={currentDate}
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
                        onClick={() => {
                            if (viewMode === 'editor') {
                                setViewMode('selector');
                            } else {
                                handleSaveAndExit(false);
                            }
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        title={viewMode === 'editor' ? "Voltar para seleção de mês" : "Sair"}
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


            {/* Shift Legend */}
            <div className="px-2 md:px-4 max-w-5xl mx-auto w-full">
                <ShiftLegend presets={shiftPresets} />
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

                    // If no shifts exist (e.g. weekends excluded by days_of_week), hide the card entireley
                    if (dailyShifts.length === 0) {
                        return null;
                    }

                    const shiftSlots = dailyShifts.map(s => {
                        const isNight = s.start_time >= '18:00' || s.start_time < '06:00';
                        const hoursDiff = (Number(s.end_time.substring(0, 2)) - Number(s.start_time.substring(0, 2)) + 24) % 24;
                        const duration = hoursDiff === 0 ? 24 : hoursDiff;
                        const timeRange = `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`;

                        return {
                            id: s.id, // Use real ID
                            code: s.code || 'N/A', // Use code or fallback
                            label: s.code || 'N/A',
                            hours: `${duration}h`, // Dynamic hours
                            timeRange, // Start - End
                            icon: isNight ? Moon : Sun,
                            color: isNight
                                ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
                            start_time: s.start_time,
                            quantity_needed: s.quantity_needed // Include quantity for rendering
                        };
                    }).sort((a, b) => a.start_time.localeCompare(b.start_time));



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

                                    {/* Edit Day Icon (Admin only) */}
                                    {(isAdmin || isOwner) && (
                                        <button
                                            onClick={() => handleOpenDailyEditor(dateStr, dailyShifts)}
                                            className="md:ml-2 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all active:scale-95"
                                            title="Editar escala deste dia"
                                        >
                                            <Edit size={16} />
                                        </button>
                                    )}
                                </div>

                                {dailyShifts.some(s => s.is_individual) && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800 rounded-md text-[9px] font-bold uppercase tracking-wider animate-in fade-in zoom-in duration-300">
                                        <Settings size={10} strokeWidth={3} />
                                        Escala Individual
                                    </div>
                                )}
                            </div>

                            {/* Shifts Rows Container */}
                            <div className="flex flex-col gap-3 w-full">
                                {shiftSlots.map((slot) => {
                                    // Render a card for each quantity needed for this specific shift
                                    const quantity = slot.quantity_needed || 1;

                                    return (
                                        <div key={slot.id} className="flex flex-row gap-1.5 md:gap-4 w-full">
                                            {Array.from({ length: quantity }).map((_, i) => {
                                                // Get assignment for this specific slot index
                                                const assignmentsForShift = localAssignments.filter(a => a.shift_id === slot.id);
                                                const assignment = assignmentsForShift[i]; // Pick by index
                                                const isAssigned = !!assignment;

                                                // Unique key
                                                const key = `${slot.id}-${i}`;

                                                // Ensure we have profile data
                                                const assignedProfile = assignment?.profile;

                                                // Clean name
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
                                                            {/* Shift Label */}
                                                            <div className={`
                                                                flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm
                                                                ${isAssigned
                                                                    ? 'bg-white/20 border-white/10 text-white'
                                                                    : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 ${slot.color.split(' ')[0]}`
                                                                }
                                                            `}>
                                                                <Icon size={10} strokeWidth={3} />
                                                                <span className="text-[9px] md:text-xs font-black tracking-wide leading-none">
                                                                    {slot.label}
                                                                </span>
                                                                <div className={`w-0.5 h-2.5 rounded-full ${isAssigned ? 'bg-white/40' : 'bg-slate-200 dark:bg-slate-600'}`} />
                                                                <span className={`text-[8px] md:text-[10px] font-bold leading-none ${isAssigned ? 'text-white/90' : 'text-slate-400'}`}>
                                                                    {slot.timeRange}
                                                                </span>
                                                            </div>

                                                            {/* Body */}
                                                            <div className="flex-1 flex flex-col items-center justify-center w-full gap-1.5 mt-1">
                                                                {isAssigned ? (
                                                                    <>
                                                                        <div className="relative group cursor-pointer w-full h-full flex flex-col items-center justify-center p-1" onClick={() => handleSlotClick(date, key, slot.label, slot.start_time)}>
                                                                            {/* Actions */}
                                                                            <div className="absolute right-1 top-1 flex flex-col gap-1 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                                <button onClick={(e) => { e.stopPropagation(); handleSwapInitiate(assignment); }} className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm bg-white/90 text-slate-500 hover:text-blue-500">
                                                                                    <ArrowRightLeft size={10} />
                                                                                </button>
                                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assignment.id); }} className="w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center shadow-sm backdrop-blur-sm bg-white/90 text-slate-500 hover:text-red-500">
                                                                                    <Trash2 size={10} />
                                                                                </button>
                                                                            </div>

                                                                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full p-0.5 shadow-sm bg-white/30">
                                                                                <img src={mockAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-emerald-600" />
                                                                            </div>
                                                                            <span className="text-[9px] md:text-xs font-bold text-white text-center leading-tight truncate w-full px-1 mt-1">
                                                                                {displayName}
                                                                            </span>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center cursor-pointer rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors" onClick={() => handleSlotClick(date, key, slot.label, slot.start_time)}>
                                                                        <PlusCircle size={24} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Old Code Removed:
                            <div className="flex flex-col gap-3 w-full">
                                {Array.from({ length: rowsPerDay }).map((_, rowIndex) => (
                                    ...
                                ))}
                            </div> 
                            */}
                        </div>
                    );
                })}
            </div>

            {/* Floating Action Bar / Footer - Robust Centering */}
            <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
                <div className="pointer-events-auto flex items-center gap-3 bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/30 dark:border-slate-700/50 scale-95 md:scale-100 transition-transform ring-1 ring-white/40 dark:ring-white/10">
                    <button
                        onClick={() => setIsPresetsManagerOpen(true)}
                        className="flex items-center gap-3 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-blue-500 border border-white/20 transition-all text-[10px] md:text-xs lg:text-sm leading-tight"
                    >
                        <Settings size={20} />
                        <span className="text-left">
                            Gerenciar<br />
                            Turnos
                        </span>
                    </button>

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

            <ShiftPresetsManager
                isOpen={isPresetsManagerOpen}
                onClose={() => {
                    setIsPresetsManagerOpen(false);
                    setIsDailyMode(false);
                    setEditingDate(null);
                }}
                groupId={selectedGroup?.id || ''}
                currentPresets={isDailyMode ? dailyPresets : shiftPresets}
                onSave={isDailyMode ? handleSaveDailyPresets : handleSavePresets}
                isDailyMode={isDailyMode}
                onRevert={handleRevertToGeneral}
            />

            {/* BLOCKING LOADING OVERLAY */}
            {isLoading && (
                <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 text-center mx-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Processando...</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Por favor, aguarde enquanto salvamos suas alterações.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScaleEditorView;
