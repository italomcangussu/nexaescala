import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole, Profile } from '../types';
import DayDetailSheet from './DayDetailSheet';
import ShiftCard from './ShiftCard';

interface CalendarViewProps {
  shifts: Shift[];
  assignments: ShiftAssignment[];
  currentUser: Profile;
  currentUserRole: AppRole;
  groupColor?: string;
  showAvailableShifts?: boolean;
  groupId?: string; // Optional (e.g. for MainApp aggregated view)
}

const CalendarView: React.FC<CalendarViewProps> = ({ shifts, assignments, currentUser, currentUserRole, groupColor, showAvailableShifts = true, groupId }) => {
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
      days.push(<div key={`empty-${i}`} className="h-12 w-full" />);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      checkDate.setHours(0, 0, 0, 0);
      const isPast = checkDate < today;

      const dayShifts = visibleShifts.filter(s => s.date === dateStr);

      // Check if user has a shift
      const myShiftOnThisDay = dayShifts.some(s =>
        assignments.some(a => a.shift_id === s.id && a.profile_id === currentUser.id)
      );

      const hasAnyShift = dayShifts.length > 0;

      const isSelected = selectedDate === dateStr;

      // Check if this specific day cell is "Today"
      const isToday =
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      // Determine Style Classes based on state
      let dayCircleClasses = "w-9 h-9 flex items-center justify-center text-sm font-bold rounded-full transition-all duration-200";

      if (isSelected) {
        dayCircleClasses += " text-white shadow-md scale-110 z-10";
      } else if (myShiftOnThisDay) {
        if (isPast) {
          // Past Shift
          dayCircleClasses += " border-2 bg-transparent";
        } else {
          // Future/Present Shift
          dayCircleClasses += " text-white shadow-sm";
        }
      } else if (isToday) {
        dayCircleClasses += " border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100";
      } else {
        dayCircleClasses += " text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800";
      }

      const dayStyle = isSelected
        ? { backgroundColor: groupColor || 'var(--color-primary)' }
        : myShiftOnThisDay
          ? {
            borderColor: isPast ? groupColor || 'var(--color-primary)' : 'transparent',
            backgroundColor: isPast ? 'transparent' : groupColor || 'var(--color-primary)',
            color: isPast ? groupColor || 'var(--color-primary)' : 'white'
          }
          : isToday && groupColor ? { color: groupColor } : {};

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className="flex flex-col items-center justify-start h-14 w-full cursor-pointer relative group"
        >
          {/* Day Number Container */}
          <div className={dayCircleClasses} style={dayStyle}>
            {day}
          </div>

          {/* Secondary Indicators (Dots below number) */}
          <div className="flex gap-1 mt-1.5 h-1.5">
            {!myShiftOnThisDay && hasAnyShift && (
              <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/50' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="flex flex-col h-full bg-surface dark:bg-slate-900 transition-colors duration-300">

      {/* Modern Calendar Header */}
      <div className="bg-surface dark:bg-slate-900 pt-6 pb-2 px-6 transition-colors">
        <div className="flex items-center justify-between mb-6">
          <div className="flex flex-col">
            <span className="text-sm text-textSecondary dark:text-slate-500 font-medium uppercase tracking-wider">{currentDate.getFullYear()}</span>
            <div className="flex items-center gap-2" onClick={() => setCurrentDate(new Date())}>
              <h2 className="text-2xl font-bold text-textPrimary dark:text-slate-100 capitalize cursor-pointer hover:text-primary transition-colors">
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
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <span key={d} className="text-[11px] text-textSecondary dark:text-slate-500 font-semibold uppercase tracking-widest opacity-60">{d}</span>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 px-4 pb-4">
        {generateCalendarDays()}
      </div>

      {/* Decorative Divider */}
      <div className="h-4 bg-background dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 shadow-inner"></div>

      {/* Available Shifts List - Conditionally Rendered */}
      {showAvailableShifts && (
        <div className="flex-1 bg-background dark:bg-slate-950 px-4 py-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-base font-bold text-textPrimary dark:text-slate-200">Plantões disponíveis</h3>
            <button className="p-1 text-textSecondary dark:text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <MoreHorizontal size={20} />
            </button>
          </div>

          {availableShifts.length > 0 ? (
            <div className="space-y-4 pb-20">
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
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-textSecondary dark:text-slate-500 opacity-60">
              <div className="w-16 h-16 bg-gray-200 dark:bg-slate-800 rounded-full mb-3 flex items-center justify-center">
                <span className="text-2xl">📅</span>
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