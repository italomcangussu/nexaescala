import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, Calendar as CalendarIcon } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole, Profile, ServiceRole, Group } from '../types';
import DayDetailSheet from './DayDetailSheet';
import ShiftCard from './ShiftCard';

const hexToRgba = (hex: string, alpha: number) => {
  let c: any;
  if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
    c = hex.substring(1).split('');
    if (c.length == 3) {
      c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = '0x' + c.join('');
    return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
  }
  return hex; // Trigger fallback if not hex
}

interface CalendarViewProps {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  currentUser: Profile;
  currentUserRole: AppRole;
  groupColor?: string;
  showAvailableShifts?: boolean;
  groupId?: string; // Optional (e.g. for MainApp aggregated view)
  userServiceRole?: ServiceRole; // Role in specific group
  userGroups?: Group[]; // For unified view color lookup
}

const CalendarView: React.FC<CalendarViewProps> = ({
  shifts,
  assignments,
  currentUser,
  currentUserRole,
  groupColor,
  showAvailableShifts = true,
  groupId,
  userServiceRole,
  userGroups
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleEditShift = (shift: Shift) => {
    alert(`Editar configurações do plantão: ${shift.date}`);
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  // Determine if user can see unpublished shifts
  const canSeeUnpublished = currentUserRole === AppRole.GESTOR || currentUserRole === AppRole.AUXILIAR;

  // Filter shifts based on publication status
  const visibleShifts = canSeeUnpublished ? shifts : shifts.filter(s => s.is_published);

  // Filter shifts available for trading (exclude current user's shifts)
  const availableShifts = visibleShifts.filter(shift => {
    const assignment = assignments.find(a => a.shift_id === shift.id);
    return assignment && assignment.profile_id !== currentUser.id;
  });

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      checkDate.setHours(0, 0, 0, 0);
      const isPast = checkDate < today;

      const dayShifts = shifts.filter(s => s.date === dateStr);
      const publishedDayShifts = dayShifts.filter(s => s.is_published);

      // Check if user has a shift (on any shift of this day)
      const myAssignmentsOnDay = assignments.filter(a =>
        a.profile_id === currentUser.id && dayShifts.some(s => s.id === a.shift_id)
      );
      const myShiftOnThisDay = myAssignmentsOnDay.length > 0;

      const isSelected = selectedDate === dateStr;
      const isToday =
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      // --- VISUALIZATION LOGIC (UPDATED) ---
      const isAdminView = !!groupId && (userServiceRole === ServiceRole.ADMIN || userServiceRole === ServiceRole.ADMIN_AUX);
      const shiftsForCalc = isAdminView ? dayShifts : publishedDayShifts;
      const hasRelevantShifts = shiftsForCalc.length > 0;

      const displayColor = groupColor || '#10b981';

      // Resolve Color for My Active Shift
      let activeShiftColor = displayColor;
      if (myShiftOnThisDay && !groupColor && userGroups) {
        // Unified View: Find color for the specific shift(s)
        // If multiple shifts, take the first one's color for now
        const shiftId = myAssignmentsOnDay[0].shift_id;
        const shift = dayShifts.find(s => s.id === shiftId);
        if (shift) {
          const group = userGroups.find(g => g.id === shift.group_id);
          if (group && group.color) {
            activeShiftColor = group.color;
          }
        }
      }

      // Determine dot status
      let hasIssue = false; // Issue needs attention
      let hasVacancy = false; // Vacancy needs attention

      if (isAdminView && hasRelevantShifts) {
        // Admin sees issues if shifts aren't full
        const isFull = shiftsForCalc.every(s => {
          const shiftAssigns = assignments.filter(a => a.shift_id === s.id);
          return shiftAssigns.length >= (s.quantity_needed || 1);
        });
        if (!isFull) hasIssue = true;
      } else if (hasRelevantShifts) {
        // User sees vacancies
        hasVacancy = publishedDayShifts.some(s => {
          const shiftAssigns = assignments.filter(a => a.shift_id === s.id);
          return shiftAssigns.length < (s.quantity_needed || 1);
        });
      }

      // Dynamic Styles
      const dayStyle: React.CSSProperties = {};

      if (isSelected) {
        dayStyle.backgroundColor = activeShiftColor; // Use active color if it's my shift day? Or just selected/display? Use active if relevant.
        // Actually, for selection, let's keep consistent. But if I have a shift, maybe I want THAT color to be the "theme" of the selection?
        // Let's stick to displayColor (context color) for selection, UNLESS unified view.
        if (!groupColor && myShiftOnThisDay) {
          dayStyle.backgroundColor = activeShiftColor;
          dayStyle.borderColor = activeShiftColor;
        } else {
          dayStyle.backgroundColor = displayColor;
          dayStyle.borderColor = displayColor;
        }
        dayStyle.color = 'white';
      } else if (myShiftOnThisDay) {
        // Highlight Active Shift Day - SOLID COLOR
        dayStyle.backgroundColor = activeShiftColor;
        dayStyle.borderColor = activeShiftColor;
        dayStyle.color = 'white';
        dayStyle.fontWeight = 'bold';
      } else if (hasRelevantShifts) {
        if (isAdminView) {
          dayStyle.backgroundColor = hexToRgba(displayColor, 0.1); // Light background
          dayStyle.borderColor = hexToRgba(displayColor, 0.3);
          dayStyle.color = displayColor; // Strong text
        }
      }

      const shouldPulse = !isSelected && ((hasVacancy && !myShiftOnThisDay) || hasIssue);
      if (shouldPulse) {
        // Add box shadow ring manually to use dynamic color
        dayStyle.boxShadow = `0 0 0 2px ${hexToRgba(displayColor, 0.6)}`;
      }

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          style={dayStyle}
          className={`
            aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all group border
            ${isSelected ? 'shadow-lg scale-105 z-10' :
              hasRelevantShifts
                ? (isAdminView
                  ? 'cursor-pointer' // Styles handling bg/color
                  : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer')
                : 'border-transparent text-slate-300 dark:text-slate-700 cursor-default opacity-50'}
            ${isToday && !isSelected ? 'ring-2 ring-gray-200 dark:ring-slate-700' : ''}
            ${shouldPulse ? 'animate-pulse' : ''}
          `}
        >
          <span className={`text-sm font-bold ${isPast && !isSelected ? 'opacity-50' : ''}`}>{day}</span>


        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col bg-surface dark:bg-slate-950 transition-colors duration-300">

      {/* Modern Calendar Header */}
      <div className="bg-surface dark:bg-slate-900 pt-6 pb-2 px-6 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-sm text-textSecondary dark:text-slate-500 font-medium uppercase tracking-wider">{currentDate.getFullYear()}</span>
            <div className="flex items-center gap-2" onClick={() => setCurrentDate(new Date())}>
              <h2 className="text-3xl font-black text-textPrimary dark:text-slate-100 capitalize cursor-pointer hover:text-primary transition-colors tracking-tight">
                {monthNames[currentDate.getMonth()]}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="p-2 border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-textSecondary dark:text-slate-400 transition-all">
              <ChevronLeft size={18} />
            </button>
            <button onClick={handleNextMonth} className="p-2 border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 rounded-full hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-textSecondary dark:text-slate-400 transition-all">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 text-center mb-2">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, index) => (
            <span key={`${d}-${index}`} className="text-xs font-black text-textSecondary dark:text-slate-600 opacity-60">{d}</span>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 px-6 pb-16">
        {generateCalendarDays()}
      </div>

      {/* Decorative Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6"></div>

      {/* Available Shifts List - Conditionally Rendered */}
      {showAvailableShifts && (
        <div className="bg-background dark:bg-slate-950 px-6 py-6 pb-20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-textPrimary dark:text-slate-200">Plantões disponíveis</h3>
            <button className="p-1 text-textSecondary dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {availableShifts.length > 0 ? (
            <div className="space-y-4">
              {availableShifts.map((shift, idx) => {
                const assignment = assignments.find(a => a.shift_id === shift.id);
                if (assignment && assignment.profile_id === currentUser.id) return null;

                return (
                  <ShiftCard
                    key={idx}
                    shift={shift}
                    assignment={assignment}
                    currentUserRole={currentUserRole}
                    onEdit={handleEditShift}
                    hideProfile={true}
                    accentColor={groupColor}
                    currentUserId={currentUser.id}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-textSecondary dark:text-slate-500 opacity-60">
              <div className="w-16 h-16 bg-gray-50 dark:bg-slate-900 rounded-full mb-3 flex items-center justify-center">
                <CalendarIcon className="opacity-50" />
              </div>
              <p className="text-sm font-medium">Tudo tranquilo por aqui.</p>
              <p className="text-xs">Nenhum plantão para troca no momento.</p>
            </div>
          )}
        </div>
      )}

      <DayDetailSheet
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        shifts={selectedDate ? visibleShifts.filter(s => s.date === selectedDate) : []}
        assignments={assignments}
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        groupId={groupId}
      />
    </div>
  );
};

export default CalendarView;