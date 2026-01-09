import React from 'react';
import { Plus, Trash2, Moon, Sun } from 'lucide-react';
import { Shift, ShiftAssignment, Profile } from '../../types';

// ... imports ...
import { GroupMember } from '../../types'; // Added import

interface DayCellProps {
    date: string; // YYYY-MM-DD
    dayNum: number;
    shifts: Shift[];
    assignments: ShiftAssignment[];
    members: Profile[]; // To resolve profile_id to avatar
    onDrop: (date: string, shiftId: string, memberId: string) => void;
    onRemoveAssignment: (assignmentId: string) => void;
    onAddShift: (date: string, type: 'day' | 'night' | 'custom') => void;
    checkConflict?: (memberId: string, date: string, startTime: string, endTime: string) => string | null;
    selectedMember?: GroupMember | null;
    onSelectAssignment?: (date: string, shiftId: string) => void;
    onOpenMemberPicker?: (date: string, shiftId: string) => void;
    isTargeted?: boolean;
}

const DayCell: React.FC<DayCellProps> = ({
    date,
    dayNum,
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
    isTargeted
}) => {
    const isToday = new Date().toISOString().split('T')[0] === date;

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };

    const handleDrop = (e: React.DragEvent, shiftId: string) => {
        e.preventDefault();
        const memberId = e.dataTransfer.getData('memberId');
        if (memberId) {
            onDrop(date, shiftId, memberId);
        }
    };

    const handleCellClick = (shiftId: string) => {
        if (selectedMember && onSelectAssignment) {
            onSelectAssignment(date, shiftId);
        } else if (onOpenMemberPicker) {
            onOpenMemberPicker(date, shiftId);
        }
    };

    // Helper to get Shift Icon
    const getShiftIcon = (start: string) => {
        const h = parseInt(start.split(':')[0]);
        if (h >= 18 || h <= 5) return <Moon size={12} />;
        return <Sun size={12} />;
    };

    // Helper to get Profile
    const getProfile = (id: string) => members.find(m => m.id === id);

    return (
        <div className={`min-h-[140px] bg-white dark:bg-slate-900 rounded-2xl border p-3 transition-colors flex flex-col group relative ${isToday ? 'border-primary/50 ring-1 ring-primary/20' : 'border-slate-200 dark:border-slate-800 hover:border-primary/30'}`}>

            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-300'}`}>{dayNum}</span>

                {/* Add Shift Action (Visible on Hover) */}
                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    <button
                        onClick={() => onAddShift(date, 'day')}
                        className="p-1 hover:bg-orange-50 text-slate-300 hover:text-orange-500 rounded transition-colors"
                        title="Add Day Shift"
                    >
                        <Sun size={14} />
                    </button>
                    <button
                        onClick={() => onAddShift(date, 'night')}
                        className="p-1 hover:bg-indigo-50 text-slate-300 hover:text-indigo-500 rounded transition-colors"
                        title="Add Night Shift"
                    >
                        <Moon size={14} />
                    </button>
                </div>
            </div>

            {/* Shifts Stack */}
            <div className="space-y-2 flex-1">
                {shifts.map(shift => {
                    const shiftAssignments = assignments.filter(a => a.shift_id === shift.id);
                    const isNight = parseInt(shift.start_time) >= 18 || parseInt(shift.start_time) <= 5;
                    const styleClass = isNight
                        ? 'bg-slate-900 dark:bg-slate-950 border-slate-800 border-l-indigo-500 text-slate-400'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 border-l-orange-400 text-slate-500';

                    const isSelectable = selectedMember && shiftAssignments.length < shift.quantity_needed;

                    return (
                        <div
                            key={shift.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, shift.id)}
                            onClick={() => handleCellClick(shift.id)}
                            className={`p-2 rounded-lg border border-l-4 flex flex-col gap-2 transition-all ${styleClass} 
                                cursor-pointer hover:shadow-md active:scale-95
                                ${selectedMember && shiftAssignments.length < shift.quantity_needed ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
                                ${isTargeted ? 'ring-4 ring-primary ring-offset-2' : ''}
                            `}
                        >
                            {/* Shift Header */}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold flex items-center gap-1">
                                    {getShiftIcon(shift.start_time)}
                                    {shift.start_time} - {shift.end_time}
                                </span>
                                <span className="text-[9px] opacity-60 font-medium">{shiftAssignments.length}/{shift.quantity_needed}</span>
                            </div>

                            {/* Avatars Grid */}
                            <div className="flex flex-wrap gap-1">
                                {shiftAssignments.map(assignment => {
                                    const profile = getProfile(assignment.profile_id);
                                    if (!profile) return null;

                                    // Check conflict
                                    const conflict = checkConflict?.(assignment.profile_id, date, shift.start_time, shift.end_time);

                                    return (
                                        <div key={assignment.id} className="relative group/avatar">
                                            <div className={`relative rounded-full ${conflict ? 'ring-2 ring-red-500' : ''}`}>
                                                <img
                                                    src={profile.avatar_url}
                                                    alt={profile.full_name}
                                                    className="w-6 h-6 rounded-full border border-white dark:border-slate-800 object-cover cursor-pointer hover:scale-110 transition-transform"
                                                    title={conflict ? `CONFLITO: ${conflict}` : profile.full_name}
                                                />
                                                {conflict && (
                                                    <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[8px] font-bold border border-white">!</div>
                                                )}
                                            </div>
                                            {/* Remove Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoveAssignment(assignment.id);
                                                }}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/avatar:opacity-100 transition-opacity hover:scale-110"
                                            >
                                                <Trash2 size={8} />
                                            </button>
                                        </div>
                                    );
                                })}

                                {/* Placeholder for Empty Slots */}
                                {shiftAssignments.length < shift.quantity_needed && (
                                    <div className={`w-6 h-6 rounded-full border-2 border-dashed flex items-center justify-center ${selectedMember ? 'border-primary bg-primary/20 animate-pulse' : 'border-slate-300/50'}`}>
                                        <Plus size={10} className={selectedMember ? 'text-primary' : 'text-slate-400'} />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {shifts.length === 0 && (
                    <div className="h-full flex items-center justify-center opacity-30">
                        <span className="text-[10px] text-slate-400 font-medium">Sem plantões</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DayCell;
