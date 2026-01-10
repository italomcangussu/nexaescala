import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole, Profile, ServiceRole, Group } from '../types';
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
  userServiceRole?: ServiceRole; // Role in specific group
  userGroups?: Group[]; // For global view colors
}

const CalendarView: React.FC<CalendarViewProps> = ({ shifts, assignments, currentUser, currentUserRole, groupColor, showAvailableShifts = true, groupId, userServiceRole, userGroups }) => {
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

      const dayShifts = shifts.filter(s => s.date === dateStr);
      const publishedDayShifts = dayShifts.filter(s => s.is_published);

      // Check if user has a shift (on any shift of this day)
      const myAssignment = assignments.find(a =>
        a.profile_id === currentUser.id && dayShifts.some(s => s.id === a.shift_id)
      );
      const myShiftOnThisDay = !!myAssignment;

      const isSelected = selectedDate === dateStr;
      const isToday =
        day === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear();

      // --- VISUALIZATION LOGIC ---
      let circleStyle: React.CSSProperties = {};
      let circleClasses = "w-9 h-9 flex items-center justify-center text-sm font-bold rounded-full transition-all duration-200 relative";

      const isAdminView = !!groupId && (userServiceRole === ServiceRole.ADMIN || userServiceRole === ServiceRole.ADMIN_AUX);
      const shiftsForCalc = isAdminView ? dayShifts : publishedDayShifts;
      const hasRelevantShifts = shiftsForCalc.length > 0;

      if (isSelected) {
        circleClasses += " shadow-lg scale-110 z-10 text-slate-900 dark:text-white";
        circleStyle = {
          borderWidth: '3px',
          borderColor: groupColor || 'var(--color-primary)',
          backgroundColor: 'transparent'
        };
      } else if (isAdminView) {
        // ADMIN / AUX LOGIC
        if (hasRelevantShifts) {
          const isFull = shiftsForCalc.every(s => {
            const shiftAssigns = assignments.filter(a => a.shift_id === s.id);
            return shiftAssigns.length >= (s.quantity_needed || 1);
          });

          circleClasses += " border-2";
          if (isFull) {
            circleClasses += " bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-slate-800 dark:text-slate-100";
          } else {
            circleClasses += " border-emerald-500 bg-transparent text-slate-600 dark:text-slate-400";
          }

          if (isPast) circleClasses += " opacity-40";
        } else {
          circleClasses += " text-slate-600 dark:text-slate-400";
        }
      } else if (!groupId ? hasRelevantShifts : myShiftOnThisDay) {
        // GLOBAL VIEW (All published) OR SERVICE VIEW (Only My Shifts)
        const targetColor = groupId ? groupColor : (userGroups?.find(g => g.id === shiftsForCalc[0].group_id)?.color);
        const finalColor = targetColor || 'var(--color-primary)';

        circleStyle = {
          borderWidth: '2px',
          borderColor: finalColor,
          backgroundColor: 'transparent'
        };

        if (isPast) circleClasses += " opacity-40";
        circleClasses += " text-slate-600 dark:text-slate-400";
      } else {
        // NO SHIFTS OR OTHERS' SHIFTS (In Service View)
        if (isToday) circleClasses += " border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800";
        circleClasses += " text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800";
      }

      // Available shifts (vacancies)
      const hasAvailableVacancies = publishedDayShifts.some(s => {
        const shiftAssigns = assignments.filter(a => a.shift_id === s.id);
        return shiftAssigns.length < (s.quantity_needed || 1);
      });

      // Special detail for participating admin (only on visible shifts)
      const showAdminPartDetail = isAdminView && myShiftOnThisDay && hasRelevantShifts;

      // Show dot for other's shifts in Plantonista service view
      const showOtherShiftDot = !!groupId && !isAdminView && !myShiftOnThisDay && hasRelevantShifts;

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className="flex flex-col items-center justify-start h-14 w-full cursor-pointer relative group"
        >
          {/* Day Number Container */}
          <div className={circleClasses} style={circleStyle}>
            {day}
            {showAdminPartDetail && (
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm z-20">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </div>

          {/* Secondary Indicators (Dot below number) */}
          <div className="flex gap-1 mt-1.5 h-1.5">
            {hasAvailableVacancies && !isSelected && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]"></div>
            )}
            {showOtherShiftDot && !isSelected && (
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
            )}
            {myShiftOnThisDay && !isAdminView && !isSelected && (
              /* Pulse dot for my shift even with circle to give extra weight */
              <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"></div>
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