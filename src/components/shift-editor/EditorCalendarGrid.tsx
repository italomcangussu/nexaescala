import React from 'react';
import DayCell from './DayCell';
import { Shift, ShiftAssignment, Profile, GroupMember } from '../../types';

interface EditorCalendarGridProps {
    days: string[]; // YYYY-MM-DD strings
    shifts: Shift[];
    assignments: ShiftAssignment[];
    members: Profile[];
    onDrop: (date: string, shiftId: string, memberId: string) => void;
    onRemoveAssignment: (assignmentId: string) => void;
    onAddShift: (date: string, type: 'day' | 'night' | 'custom') => void;
    checkConflict?: (memberId: string, date: string, startTime: string, endTime: string) => string | null;
    selectedMember?: GroupMember | null;
    onSelectAssignment?: (date: string, shiftId: string) => void;
    onOpenMemberPicker?: (date: string, shiftId: string) => void;
    pendingShiftTarget?: { date: string, shiftId: string } | null;
}

const EditorCalendarGrid: React.FC<EditorCalendarGridProps> = ({
    days,
    shifts,
    assignments,
    members,
    onDrop,
    onRemoveAssignment,
    onAddShift,
    checkConflict,
    selectedMember,
    onSelectAssignment,
    onOpenMemberPicker,
    pendingShiftTarget
}) => {

    // Find first day of the month to add padding
    const firstDateStr = days[0];
    const firstDate = new Date(firstDateStr + 'T12:00:00');
    const startDayOfWeek = firstDate.getDay(); // 0 (Sun) to 6 (Sat)

    const paddingDays = Array.from({ length: startDayOfWeek });

    return (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 auto-rows-fr pb-10">
            {/* Padding for empty start days - Hidden on mobile */}
            {paddingDays.map((_, i) => (
                <div key={`pad-${i}`} className="hidden md:block min-h-[140px] opacity-20 pointer-events-none" />
            ))}

            {days.map(dayStr => {
                const dateObj = new Date(dayStr + 'T12:00:00');
                const dayNum = dateObj.getDate();

                // Filter content for this day
                const dayShifts = shifts.filter(s => s.date === dayStr);
                const dayAssignments = assignments.filter(a => dayShifts.some(s => s.id === a.shift_id));

                return (
                    <DayCell
                        key={dayStr}
                        date={dayStr}
                        dayNum={dayNum}
                        shifts={dayShifts}
                        assignments={dayAssignments}
                        members={members}
                        onDrop={onDrop}
                        onRemoveAssignment={onRemoveAssignment}
                        onAddShift={onAddShift}
                        checkConflict={checkConflict}
                        selectedMember={selectedMember}
                        onSelectAssignment={onSelectAssignment}
                        onOpenMemberPicker={onOpenMemberPicker}
                        targetedShiftId={pendingShiftTarget?.date === dayStr ? pendingShiftTarget.shiftId : null}
                    />
                );
            })}
        </div>
    );
};

export default EditorCalendarGrid;
