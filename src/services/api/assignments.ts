import { supabase } from '../../lib/supabase';
import { ShiftAssignment } from '../../types';

// --- ASSIGNMENTS ---

export const createAssignment = async (assignment: Partial<ShiftAssignment>): Promise<ShiftAssignment> => {
    const { data, error } = await supabase
        .from('shift_assignments')
        .insert(assignment)
        .select('*, profile:profiles(*)')
        .single();
    if (error) throw error;
    return data as ShiftAssignment;
};

export const deleteAssignment = async (assignmentId: string): Promise<void> => {
    const { error } = await supabase
        .from('shift_assignments')
        .delete()
        .eq('id', assignmentId);
    if (error) throw error;
};

export const updateAssignment = async (assignmentId: string, updates: Partial<ShiftAssignment>): Promise<ShiftAssignment> => {
    const { data, error } = await supabase
        .from('shift_assignments')
        .update(updates)
        .eq('id', assignmentId)
        .select('*, profile:profiles(*)');

    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Assignment not found');

    return data[0] as ShiftAssignment;
};
