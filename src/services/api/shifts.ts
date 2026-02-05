import { supabase } from '../../lib/supabase';
import { Shift, ShiftAssignment, ShiftPreset, Group } from '../../types';
import { fetchWithCache, invalidateCache } from './cache';
import { createNotificationsBulk, sendPushToUsers } from './notifications';

// --- SHIFTS ---

export const getMyShifts = async (userId: string): Promise<{ shifts: Shift[], assignments: ShiftAssignment[] }> => {
    const { data: assignmentsData, error: assignError } = await supabase
        .from('shift_assignments')
        .select(`
            id,
            shift_id,
            profile_id,
            is_confirmed,
            shift:shifts (
                *,
                group:groups (
                    name,
                    institution
                )
            )
        `)
        .eq('profile_id', userId);

    if (assignError) throw assignError;

    const shifts: Shift[] = [];
    const assignments: ShiftAssignment[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    assignmentsData.forEach((a: any) => {
        if (a.shift) {
            const shiftWithGroup = {
                ...a.shift,
                group_name: a.shift.group?.name,
                institution_name: a.shift.group?.institution
            };
            shifts.push(shiftWithGroup);
            assignments.push({
                id: a.id,
                shift_id: a.shift_id,
                profile_id: a.profile_id,
                is_confirmed: a.is_confirmed
            });
        }
    });

    return { shifts, assignments };
};

export const getMemberAssignmentsForPeriod = async (
    memberIds: string[],
    startDate: string,
    endDate: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any[]> => {
    if (memberIds.length === 0) return [];

    const { data: result, error: err } = await supabase
        .from('shift_assignments')
        .select(`
            id,
            profile_id,
            shift:shifts!inner (
                id,
                date,
                start_time,
                end_time,
                group_id,
                group:groups ( name )
            )
        `)
        .in('profile_id', memberIds)
        .gte('shift.date', startDate)
        .lte('shift.date', endDate);

    if (err) throw err;
    return result || [];
};

export const getShifts = async (groupId: string, forceRefresh = false): Promise<Shift[]> => {
    return fetchWithCache(`shifts_${groupId}`, async () => {
        const { data, error } = await supabase
            .from('shifts')
            .select(`
                *,
                group:groups (
                    name,
                    institution
                )
            `)
            .eq('group_id', groupId);

        if (error) throw error;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shifts = (data as any[]).map(shift => ({
            ...shift,
            group_name: shift.group?.name,
            institution_name: shift.group?.institution
        }));

        return shifts as Shift[];
    }, forceRefresh);
};

export const getAssignments = async (shiftIds: string[], forceRefresh = false): Promise<ShiftAssignment[]> => {
    if (shiftIds.length === 0) return [];

    return fetchWithCache(`assignments_${shiftIds.slice(0, 5).join('_')}_count${shiftIds.length}`, async () => {
        const { data, error } = await supabase
            .from('shift_assignments')
            .select('*, profile:profiles(*)')
            .in('shift_id', shiftIds);

        if (error) throw error;
        return data as ShiftAssignment[];
    }, forceRefresh);
};

export const createShift = async (shift: Partial<Shift>): Promise<Shift> => {
    const { data, error } = await supabase
        .from('shifts')
        .insert(shift)
        .select()
        .single();
    if (error) throw error;

    if (shift.group_id) {
        invalidateCache(`shifts_${shift.group_id}`);
    }

    return data as Shift;
};

export const updateShift = async (shiftId: string, updates: Partial<Shift>): Promise<Shift> => {
    const { data, error } = await supabase
        .from('shifts')
        .update(updates)
        .eq('id', shiftId)
        .select()
        .single();
    if (error) throw error;
    return data as Shift;
};

export const deleteShift = async (shiftId: string) => {
    const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);
    if (error) throw error;
};

export const publishShifts = async (groupId: string, shiftIds: string[]): Promise<void> => {
    if (shiftIds.length === 0) return;
    const { error } = await supabase
        .from('shifts')
        .update({ is_published: true })
        .eq('group_id', groupId)
        .in('id', shiftIds);
    if (error) throw error;

    const { data: members } = await supabase
        .from('group_members')
        .select('profile_id')
        .eq('group_id', groupId);

    if (members && members.length > 0) {
        const notifications = members.map(m => ({
            user_id: m.profile_id,
            title: 'Nova Escala Publicada',
            message: 'Uma nova escala foi publicada no seu serviço.',
            type: 'SHIFT_PUBLISHED',
            is_read: false,
            metadata: { group_id: groupId }
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createNotificationsBulk(notifications as any);

        const memberIds = members.map(m => m.profile_id);
        await sendPushToUsers(memberIds, 'SHIFT_PUBLISHED', 'Nova Escala Publicada', 'Uma nova escala foi publicada no seu serviço.');
    }

    invalidateCache(`shifts_${groupId}`);
};

// --- SHIFT PRESETS ---

export const getShiftPresets = async (groupId: string): Promise<ShiftPreset[]> => {
    const { data, error } = await supabase
        .from('shift_presets')
        .select('*')
        .eq('group_id', groupId)
        .order('code');

    if (error) throw error;
    return data as ShiftPreset[];
};

export const createShiftPreset = async (preset: Omit<ShiftPreset, 'id'>): Promise<ShiftPreset> => {
    const { data, error } = await supabase
        .from('shift_presets')
        .insert(preset)
        .select()
        .single();

    if (error) throw error;
    return data as ShiftPreset;
};

export const updateShiftPreset = async (presetId: string, updates: Partial<ShiftPreset>): Promise<void> => {
    const { error } = await supabase
        .from('shift_presets')
        .update(updates)
        .eq('id', presetId);

    if (error) throw error;
};

export const deleteShiftPreset = async (presetId: string): Promise<void> => {
    const { error } = await supabase
        .from('shift_presets')
        .delete()
        .eq('id', presetId);

    if (error) throw error;
};

export const createShiftPresetsBulk = async (
    groupId: string,
    presets: Omit<ShiftPreset, 'id' | 'group_id'>[]
): Promise<ShiftPreset[]> => {
    const presetsWithGroupId = presets.map(p => ({
        ...p,
        group_id: groupId
    }));

    const { data, error } = await supabase
        .from('shift_presets')
        .insert(presetsWithGroupId)
        .select();

    if (error) throw error;
    return data as ShiftPreset[];
};

export const syncShiftPresets = async (groupId: string, presets: ShiftPreset[]): Promise<void> => {
    const { data: currentPresets, error: fetchError } = await supabase
        .from('shift_presets')
        .select('*')
        .eq('group_id', groupId);

    if (fetchError) throw fetchError;

    const incomingIds = new Set(presets.filter(p => p.id && typeof p.id === 'string' && !p.id.startsWith('temp-')).map(p => p.id));

    const toDelete = currentPresets?.filter(p => !incomingIds.has(p.id)) || [];
    if (toDelete.length > 0) {
        const { error: deleteError } = await supabase.from('shift_presets').delete().in('id', toDelete.map(p => p.id));
        if (deleteError) throw deleteError;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toInsert: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toUpdate: any[] = [];

    presets.forEach(p => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const item: any = {
            group_id: groupId,
            code: p.code,
            start_time: p.start_time,
            end_time: p.end_time,
            quantity_needed: Number(p.quantity_needed) || 1,
            days_of_week: p.days_of_week || [0, 1, 2, 3, 4, 5, 6]
        };

        if (p.id && typeof p.id === 'string' && !p.id.startsWith('temp-')) {
            item.id = p.id;
            toUpdate.push(item);
        } else {
            toInsert.push(item);
        }
    });

    if (toInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('shift_presets')
            .insert(toInsert);
        if (insertError) throw insertError;
    }

    if (toUpdate.length > 0) {
        const { error: updateError } = await supabase
            .from('shift_presets')
            .upsert(toUpdate);
        if (updateError) throw updateError;
    }
};

// --- SHIFT GENERATION ---

interface MonthSelection {
    year: number;
    month: number;
}

const getDaysInMonth = (year: number, month: number): string[] => {
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return d.toISOString().split('T')[0];
    });
};

export const generateShiftsForGroup = async (
    groupId: string,
    months: MonthSelection[],
    presets: { code: string; start_time: string; end_time: string; quantity_needed?: number; days_of_week?: number[] }[],
    quantityPerShift: number,
    existingDatesSet?: Set<string>
): Promise<number> => {
    if (months.length === 0 || presets.length === 0) return 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shiftsToInsert: any[] = [];

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let existingDates = existingDatesSet;

    if (!existingDates) {
        const sortedDetails = months.map(m => {
            const first = new Date(m.year, m.month, 1);
            const last = new Date(m.year, m.month + 1, 0);
            return { first, last };
        }).sort((a, b) => a.first.getTime() - b.first.getTime());

        const minDate = sortedDetails[0].first.toISOString().split('T')[0];
        const maxDate = sortedDetails[sortedDetails.length - 1].last.toISOString().split('T')[0];

        const { data: existing } = await supabase
            .from('shifts')
            .select('date')
            .eq('group_id', groupId)
            .gte('date', minDate)
            .lte('date', maxDate);

        existingDates = new Set(existing?.map(s => s.date) || []);
    }

    for (const { year, month } of months) {
        const days = getDaysInMonth(year, month);

        for (const day of days) {
            if (day < todayStr || existingDates.has(day)) continue;

            for (const preset of presets) {
                if (preset.days_of_week && preset.days_of_week.length > 0) {
                    const dateObj = new Date(day + 'T12:00:00');
                    const dayOfWeek = dateObj.getDay();
                    if (!preset.days_of_week.includes(dayOfWeek)) {
                        continue;
                    }
                }

                shiftsToInsert.push({
                    group_id: groupId,
                    date: day,
                    start_time: preset.start_time,
                    end_time: preset.end_time,
                    quantity_needed: preset.quantity_needed || quantityPerShift,
                    code: preset.code,
                    is_published: false
                });
            }
        }
    }

    if (shiftsToInsert.length === 0) return 0;

    const { error } = await supabase
        .from('shifts')
        .insert(shiftsToInsert);

    if (error) {
        console.error('Error generating shifts:', error);
        throw error;
    }

    invalidateCache(`shifts_${groupId}`);

    return shiftsToInsert.length;
};

export const regenerateShiftsForMonth = async (
    groupId: string,
    date: Date,
    presets?: ShiftPreset[]
): Promise<void> => {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (presets) {
        await syncShiftPresets(groupId, presets);
    }

    const currentPresets = presets || await getShiftPresets(groupId);
    if (currentPresets.length === 0) return;

    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data: existingShifts, error: fetchError } = await supabase
        .from('shifts')
        .select(`*, shift_assignments(id)`)
        .eq('group_id', groupId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (fetchError) throw fetchError;

    const todayStr = new Date().toISOString().split('T')[0];

    const handledShifts = new Set<string>();
    const shiftsToDelete: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shiftsToUpdate: any[] = [];

    for (const shift of (existingShifts || [])) {
        const preset = currentPresets.find(p => p.code === shift.code);

        if (!preset) {
            if (!shift.shift_assignments || shift.shift_assignments.length === 0) {
                shiftsToDelete.push(shift.id);
            }
            continue;
        }

        const d = new Date(shift.date + 'T12:00:00');
        const dayOfWeek = d.getDay();

        if (preset.days_of_week && !preset.days_of_week.includes(dayOfWeek)) {
            if (!shift.shift_assignments || shift.shift_assignments.length === 0) {
                shiftsToDelete.push(shift.id);
                continue;
            }
        }

        if (shift.date >= todayStr) {
            shiftsToUpdate.push({
                id: shift.id,
                group_id: groupId,
                date: shift.date,
                code: preset.code,
                start_time: preset.start_time,
                end_time: preset.end_time,
                quantity_needed: preset.quantity_needed || 1,
                is_published: shift.is_published
            });
        }

        handledShifts.add(`${shift.date}_${shift.code}`);
    }

    if (shiftsToDelete.length > 0) {
        const { error: deleteError } = await supabase.from('shifts').delete().in('id', shiftsToDelete);
        if (deleteError) throw deleteError;
    }

    if (shiftsToUpdate.length > 0) {
        const { error: updateError } = await supabase.from('shifts').upsert(shiftsToUpdate);
        if (updateError) throw updateError;
    }

    const days = Array.from({ length: lastDay }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return d.toISOString().split('T')[0];
    });

    const newShifts = [];
    for (const day of days) {
        if (day < todayStr) continue;

        for (const preset of currentPresets) {
            if (handledShifts.has(`${day}_${preset.code}`)) continue;

            const d = new Date(day + 'T12:00:00');
            const dayOfWeek = d.getDay();
            if (preset.days_of_week && !preset.days_of_week.includes(dayOfWeek)) continue;

            newShifts.push({
                group_id: groupId,
                date: day,
                code: preset.code,
                start_time: preset.start_time,
                end_time: preset.end_time,
                quantity_needed: preset.quantity_needed || 1,
                is_published: false
            });
        }
    }

    if (newShifts.length > 0) {
        const { error: insertError } = await supabase.from('shifts').insert(newShifts);
        if (insertError) throw insertError;
    }

    invalidateCache(`shifts_${groupId}`);
};

// --- INDIVIDUAL (DAILY) SCALE MANAGEMENT ---

export const saveDailyScale = async (
    groupId: string,
    date: string,
    presets: { code: string; start_time: string; end_time: string; quantity_needed: number }[]
) => {
    const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('group_id', groupId)
        .eq('date', date);

    if (deleteError) throw deleteError;

    if (presets.length > 0) {
        const shiftsToInsert = presets.map(p => ({
            group_id: groupId,
            date: date,
            start_time: p.start_time.includes(':') && p.start_time.split(':').length === 2 ? p.start_time + ':00' : p.start_time,
            end_time: p.end_time.includes(':') && p.end_time.split(':').length === 2 ? p.end_time + ':00' : p.end_time,
            quantity_needed: p.quantity_needed,
            code: p.code.toUpperCase(),
            is_published: false,
            is_individual: true
        }));

        const { error: insertError } = await supabase
            .from('shifts')
            .insert(shiftsToInsert);

        if (insertError) throw insertError;
    }

    invalidateCache(`shifts_${groupId}`);
};

export const revertDailyScaleToGeneral = async (groupId: string, date: string) => {
    const presets = await getShiftPresets(groupId);

    const { error: deleteError } = await supabase
        .from('shifts')
        .delete()
        .eq('group_id', groupId)
        .eq('date', date);

    if (deleteError) throw deleteError;

    if (presets.length > 0) {
        const shiftsToInsert = presets.map(p => ({
            group_id: groupId,
            date: date,
            start_time: p.start_time,
            end_time: p.end_time,
            quantity_needed: p.quantity_needed || 1,
            code: p.code,
            is_published: false,
            is_individual: false
        }));

        const { error: insertError } = await supabase
            .from('shifts')
            .insert(shiftsToInsert);

        if (insertError) throw insertError;
    }

    invalidateCache(`shifts_${groupId}`);
};

// --- RELATED SHIFTS ---

export const getRelatedShiftsForDay = async (groupId: string, date: string): Promise<{
    group: Group;
    label: string | null;
    assignments: ShiftAssignment[];
}[]> => {
    const { data: relationships, error: relError } = await supabase
        .from('group_relationships')
        .select(`
            *,
            related_group: groups!related_group_id(*)
        `)
        .eq('source_group_id', groupId);

    if (relError) throw relError;
    if (!relationships || relationships.length === 0) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await Promise.all(relationships.map(async (rel: any) => {
        const { data: shifts } = await supabase
            .from('shifts')
            .select(`
                id,
                start_time,
                assignments: shift_assignments(
                    id,
                    profile: profiles(*)
                )
            `)
            .eq('group_id', rel.related_group_id)
            .eq('date', date)
            .eq('is_published', true);

        if (!shifts || shifts.length === 0) return null;

        const allAssignments = shifts.flatMap(s => s.assignments);

        return {
            group: rel.related_group!,
            label: rel.display_label,
            assignments: allAssignments as unknown as ShiftAssignment[]
        };
    }));

    return results.filter(Boolean) as {
        group: Group;
        label: string | null;
        assignments: ShiftAssignment[];
    }[];
};

// --- REPLICATE SCHEDULE ---

export interface ReplicateScheduleOptions {
    includeAssignments: boolean;
    adjustDates: boolean;
}

export const replicateScheduleToMonth = async (
    groupId: string,
    sourceMonth: Date,
    targetMonth: Date,
    options: ReplicateScheduleOptions
): Promise<void> => {
    const { includeAssignments, adjustDates } = options;

    const sourceYear = sourceMonth.getFullYear();
    const sourceMonthIndex = sourceMonth.getMonth();
    const sourceStartDate = `${sourceYear}-${String(sourceMonthIndex + 1).padStart(2, '0')}-01`;
    const sourceDaysInMonth = new Date(sourceYear, sourceMonthIndex + 1, 0).getDate();
    const sourceEndDate = `${sourceYear}-${String(sourceMonthIndex + 1).padStart(2, '0')}-${String(sourceDaysInMonth).padStart(2, '0')}`;

    const targetYear = targetMonth.getFullYear();
    const targetMonthIndex = targetMonth.getMonth();
    const targetDaysInMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate();

    const { data: sourceShifts, error: fetchError } = await supabase
        .from('shifts')
        .select(`
            *,
            shift_assignments(*)
        `)
        .eq('group_id', groupId)
        .gte('date', sourceStartDate)
        .lte('date', sourceEndDate);

    if (fetchError) throw fetchError;
    if (!sourceShifts || sourceShifts.length === 0) {
        throw new Error('Nenhum turno encontrado no mês de origem.');
    }

    const targetStartDate = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-01`;
    const targetEndDate = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(targetDaysInMonth).padStart(2, '0')}`;

    const { data: existingTargetShifts } = await supabase
        .from('shifts')
        .select('id, is_published, shift_assignments(id)')
        .eq('group_id', groupId)
        .gte('date', targetStartDate)
        .lte('date', targetEndDate);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shiftsToDelete = (existingTargetShifts || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((s: any) => !s.is_published && (!s.shift_assignments || s.shift_assignments.length === 0))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((s: any) => s.id);

    if (shiftsToDelete.length > 0) {
        await supabase.from('shifts').delete().in('id', shiftsToDelete);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shiftsToCreate: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignmentsToCreate: any[] = [];

    for (const sourceShift of sourceShifts) {
        const sourceDate = new Date(sourceShift.date + 'T00:00:00');
        const sourceDayOfMonth = sourceDate.getDate();
        const sourceDayOfWeek = sourceDate.getDay();

        let targetDayOfMonth: number;

        if (adjustDates) {
            const firstDayOfTargetMonth = new Date(targetYear, targetMonthIndex, 1);
            const firstWeekdayOffset = (sourceDayOfWeek - firstDayOfTargetMonth.getDay() + 7) % 7;
            const weekNumber = Math.floor((sourceDayOfMonth - 1) / 7);
            targetDayOfMonth = 1 + firstWeekdayOffset + (weekNumber * 7);

            if (targetDayOfMonth > targetDaysInMonth) {
                targetDayOfMonth = targetDayOfMonth - 7;
            }
        } else {
            targetDayOfMonth = Math.min(sourceDayOfMonth, targetDaysInMonth);
        }

        const targetDateStr = `${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}-${String(targetDayOfMonth).padStart(2, '0')}`;

        const newShift = {
            group_id: groupId,
            date: targetDateStr,
            code: sourceShift.code,
            start_time: sourceShift.start_time,
            end_time: sourceShift.end_time,
            quantity_needed: sourceShift.quantity_needed,
            is_published: false,
            is_individual: sourceShift.is_individual
        };

        shiftsToCreate.push({
            shift: newShift,
            sourceAssignments: includeAssignments ? sourceShift.shift_assignments : []
        });
    }

    const { data: createdShifts, error: createError } = await supabase
        .from('shifts')
        .insert(shiftsToCreate.map(s => s.shift))
        .select();

    if (createError) throw createError;

    if (includeAssignments && createdShifts && createdShifts.length > 0) {
        for (let i = 0; i < createdShifts.length; i++) {
            const newShiftId = createdShifts[i].id;
            const sourceAssignments = shiftsToCreate[i].sourceAssignments || [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const assignment of sourceAssignments as any[]) {
                assignmentsToCreate.push({
                    shift_id: newShiftId,
                    profile_id: assignment.profile_id,
                    is_confirmed: false
                });
            }
        }

        if (assignmentsToCreate.length > 0) {
            const { error: assignError } = await supabase
                .from('shift_assignments')
                .insert(assignmentsToCreate);

            if (assignError) throw assignError;
        }
    }

    invalidateCache(`shifts_${groupId}`);
};

// --- CROSS-GROUP ASSIGNMENTS ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAllUserAssignmentsAcrossGroups = async (profileIds: string[]): Promise<any[]> => {
    if (profileIds.length === 0) return [];

    const { data, error } = await supabase
        .from('shift_assignments')
        .select(`
            id,
            profile_id,
            shift_id,
            is_confirmed,
            shift:shifts!inner (
                id,
                date,
                start_time,
                end_time,
                code,
                group_id,
                group:groups (
                    id,
                    name,
                    institution
                )
            ),
            profile:profiles (
                id,
                full_name
            )
        `)
        .in('profile_id', profileIds);

    if (error) throw error;
    return data || [];
};
