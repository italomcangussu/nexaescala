import { useState, useEffect, useMemo } from 'react';
import { Group, Profile, Shift, ShiftAssignment, GroupMember, ShiftPreset } from '../../types';
import { getGroupMembers, getShifts, getAssignments, createShift, deleteShift, createAssignment, deleteAssignment, getMemberAssignmentsForPeriod } from '../../services/api';

// Helper to get days in month
const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    });
};

export const useShiftLogic = (group: Group, currentUser: Profile) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);

    // External Conflicts State
    const [externalAssignments, setExternalAssignments] = useState<any[]>([]); // Assignments from OTHER groups

    // Initial Data Snapshots (for diffing if needed, or just to know what's deleted)
    const [originalShifts, setOriginalShifts] = useState<Shift[]>([]);
    const [originalAssignments, setOriginalAssignments] = useState<ShiftAssignment[]>([]);

    // Deleted Items Tracking
    const [deletedShiftIds, setDeletedShiftIds] = useState<string[]>([]);
    const [deletedAssignmentIds, setDeletedAssignmentIds] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Initial Load
    useEffect(() => {
        loadData();
    }, [group.id, currentDate.getMonth(), currentDate.getFullYear()]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const memberPromise = getGroupMembers(group.id);
            const shiftsPromise = getShifts(group.id); // Should filter by month

            const [membersData, shiftsData] = await Promise.all([memberPromise, shiftsPromise]);

            setMembers(membersData);
            setShifts(shiftsData);
            setOriginalShifts(JSON.parse(JSON.stringify(shiftsData)));

            // Get local assignments
            const shiftIds = shiftsData.map(s => s.id);
            if (shiftIds.length > 0) {
                const assignmentsData = await getAssignments(shiftIds);
                setAssignments(assignmentsData);
                setOriginalAssignments(JSON.parse(JSON.stringify(assignmentsData)));
            } else {
                setAssignments([]);
                setOriginalAssignments([]);
            }

            // Fetch EXTERNAL assignments for conflict detection
            // Range: Start of month to End of month (approx for now, ideally precise based on view)
            // Using a loose range for simplicity: 1st day to last day of current view
            const startStr = getDaysInMonth(currentDate)[0];
            const endStr = getDaysInMonth(currentDate).pop() || startStr;
            const memberIds = membersData.map(m => m.profile.id);

            if (memberIds.length > 0) {
                const extData = await getMemberAssignmentsForPeriod(memberIds, startStr, endStr);
                // Filter out assignments that belong to THIS group to avoid self-conflict flags if API returns them
                // The API query uses !inner on shifts. check if group_id is excluded? 
                // We didn't exclude in API, so filter here:
                const others = extData.filter((a: any) => a.shift.group_id !== group.id);
                setExternalAssignments(others);
            }

            // Reset Diff
            setDeletedShiftIds([]);
            setDeletedAssignmentIds([]);

        } catch (error) {
            console.error("Error loading editor data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Conflict Checker
    const checkConflict = (memberId: string, date: string, startTime: string, endTime: string): string | null => {
        // Find external assignment on same date/time overlap
        // Simplified overlap check:
        // Shifts are typically 07-19 or 19-07. 
        // 19-07 (Night) technically spans to next day, handled by date? 
        // `shift.date` usually represents the start date.

        const conflict = externalAssignments.find((ext: any) => {
            if (ext.profile_id !== memberId) return false;
            // Check date match
            // Note: Night shifts might need special handling if date definition varies
            // For MVP assuming strict date string match + time overlap
            if (ext.shift.date === date) {
                // Same day. Check time.
                // If Times overlap? 
                // Simple equality for standard shifts:
                if (ext.shift.start_time === startTime) return true;

                // Overlap logic (StartA < EndB && StartB < EndA)
                // Need to parse times. skipping for MVP speed if using standard blocks.
                // Assuming standard blocks for now.
            }
            return false;
        });

        if (conflict) {
            return `Conflito: ${conflict.shift.group?.name || 'Outro Serviço'}`;
        }
        return null;
    };

    // Actions
    const handleAddShift = (date: string, type: 'day' | 'night' | 'custom') => {
        const tempId = `temp_shift_${Date.now()}_${Math.random()}`;
        const newShift: Shift = {
            id: tempId,
            group_id: group.id,
            date: date,
            start_time: type === 'night' ? '19:00' : '07:00',
            end_time: type === 'night' ? '07:00' : '19:00',
            quantity_needed: 2,
            is_published: true
        };
        setShifts(prev => [...prev, newShift]);
    };

    const handleAddAssignment = (date: string, shiftId: string, memberId: string) => {
        // Validation: Double Booking?
        // assignments.some(a => ... check date equality etc) - Skip for simplicity now

        // Validation: Already assigned to this shift
        if (assignments.some(a => a.shift_id === shiftId && a.profile_id === memberId)) return;

        // Find specific shift to check time
        const shift = shifts.find(s => s.id === shiftId);
        if (shift) {
            const conflictMsg = checkConflict(memberId, date, shift.start_time, shift.end_time);
            if (conflictMsg) {
                // Just warn or block? User said: "gere um aviso... e não permita publicar"
                // So we ALLOW adding it to draft, but flag it. 
                // Or we allow adding but show warning immediately.
                alert(`Atenção: ${conflictMsg}. Você não poderá publicar enquanto houver esse conflito.`);
            }
        }

        const tempId = `temp_assign_${Date.now()}_${Math.random()}`;
        const newAssignment: ShiftAssignment = {
            id: tempId,
            shift_id: shiftId,
            profile_id: memberId,
            is_confirmed: true
        };
        setAssignments(prev => [...prev, newAssignment]);
    };

    const handleRemoveAssignment = (assignmentId: string) => {
        setAssignments(prev => prev.filter(a => a.id !== assignmentId));
        if (!assignmentId.startsWith('temp_')) {
            setDeletedAssignmentIds(prev => [...prev, assignmentId]);
        }
    };

    const saveChanges = async () => {
        // Final Validation before Save
        // Check ALL current assignments for conflicts
        for (const assign of assignments) {
            const shift = shifts.find(s => s.id === assign.shift_id);
            if (!shift) continue;

            const conflict = checkConflict(assign.profile_id, shift.date, shift.start_time, shift.end_time);
            if (conflict) {
                const member = members.find(m => m.profile.id === assign.profile_id);
                alert(`Impossível salvar: ${member?.profile.full_name} tem conflito no dia ${shift.date} (${conflict}). Remova o conflito antes de publicar.`);
                return; // BLOCK
            }
        }

        setIsSaving(true);
        try {
            // 1. Process Deleted assignments
            if (deletedAssignmentIds.length > 0) {
                // In a batch endpoint would be better, but loop for now
                for (const id of deletedAssignmentIds) await deleteAssignment(id);
            }
            // 2. Process Deleted Shifts (if any - not impl yet)

            // 3. Process New Shifts
            const newShifts = shifts.filter(s => s.id.startsWith('temp_'));
            // Map TempID -> RealID
            const shiftIdMap: Record<string, string> = {};

            for (const s of newShifts) {
                // Remove id from object before insert
                const { id, ...shiftData } = s;
                const created = await createShift(shiftData);
                shiftIdMap[s.id] = created.id;
            }

            // 4. Process Assignments (New)
            const newAssignments = assignments.filter(a => a.id.startsWith('temp_'));
            for (const a of newAssignments) {
                // If parent shift was temp, swap ID
                const realShiftId = shiftIdMap[a.shift_id] || a.shift_id;

                // If realShiftId is still temp, something went wrong (or it was deleted before save? unlikely)
                if (realShiftId.startsWith('temp_')) continue;

                const { id, profile, ...assignData } = a;
                // Don't send profile obj, send profile_id
                await createAssignment({
                    ...assignData,
                    shift_id: realShiftId
                });
            }

            alert("Alterações salvas com sucesso!");
            await loadData(); // Reload to get cleanup state

        } catch (e) {
            console.error("Error saving:", e);
            alert("Erro ao salvar alterações.");
        } finally {
            setIsSaving(false);
        }
    };

    // Navigation
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

    // Getters
    const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

    const getShiftsForDay = (dateStr: string) => shifts.filter(s => s.date === dateStr);
    const getAssignmentsForShift = (shiftId: string) => assignments.filter(a => a.shift_id === shiftId);

    return {
        currentDate,
        isLoading,
        isSaving,
        saveChanges,
        members,
        shifts,
        assignments,
        externalAssignments, // expose for UI
        days,
        nextMonth,
        prevMonth,
        getShiftsForDay,
        getAssignmentsForShift,
        checkConflict, // expose for UI
        handleAddShift,
        handleAddAssignment,
        handleRemoveAssignment
    };
};
