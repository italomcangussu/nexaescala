import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole, Profile, ServiceRole, Group, ShiftExchange, TradeStatus, TradeType } from '../types';
import { getShiftExchanges, getUserShiftExchanges } from '../services/api';
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
  const [exchanges, setExchanges] = useState<ShiftExchange[]>([]);

  // Fetch exchanges when group or view changes
  useEffect(() => {
    // If we are in a specific group view, we fetch that group's exchanges
    // If unified view (groupId is undefined), we might need to fetch all?
    // For now, let's assume we fetch for the specific group if provided.
    // Optimization: In unified view, we might rely on the parent or fetch all user relevant exchanges.
    // Given the constraints, let's try to fetch if groupId exists.
    const loadExchanges = async () => {
      try {
        if (groupId) {
          const data = await getShiftExchanges(groupId);
          setExchanges(data);
        } else {
          // Unified View: Fetch all exchanges relevant to the user (requester or target)
          // We need to import getUserShiftExchanges in the imports section first, or assume it's imported
          const data = await getUserShiftExchanges(currentUser.id);
          setExchanges(data);
        }
      } catch (err) {
        console.error("Failed to load exchanges for calendar", err);
      }
    };
    loadExchanges();
  }, [groupId, currentDate, currentUser.id]); // Reload when month changes? Not strictly necessary unless we paginate, but safe.

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

  // Filter shifts based on publication status
  const canSeeUnpublished = currentUserRole === AppRole.GESTOR || currentUserRole === AppRole.AUXILIAR;
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

      if (day === 1) {
        console.log(`[DEBUG Day 1] Date: ${dateStr}`);
        console.log(`[DEBUG Day 1] Assignments Count:`, assignments.length);
      }

      const dayShifts = shifts.filter(s => s.date === dateStr);
      const publishedDayShifts = dayShifts.filter(s => s.is_published);

      // Check for MY Assignments
      const myAssignmentsOnDay = assignments.filter(a =>
        a.profile_id === currentUser.id && dayShifts.some(s => s.id === a.shift_id)
      );
      const myShiftOnThisDay = myAssignmentsOnDay.length > 0;

      // Identify Services for Multi-Service Gradient
      let dayServiceColors: string[] = [];
      if (myShiftOnThisDay && userGroups) {
        // Collect unique colors for my shifts on this day
        const dayGroups = myAssignmentsOnDay
          .map(a => dayShifts.find(s => s.id === a.shift_id)?.group_id)
          .filter(Boolean)
          .map(gid => userGroups.find(g => g.id === gid))
          .filter((g): g is Group => !!g);

        // Use Set to get unique colors to avoid gradient of same color
        const uniqueColors = new Set(dayGroups.map(g => g.color || '#10b981'));
        dayServiceColors = Array.from(uniqueColors);
      }

      if (day === 1) {
        console.log(`[DEBUG Day 1] myAssignmentsOnDay:`, myAssignmentsOnDay);
        console.log(`[DEBUG Day 1] All Exchanges:`, exchanges);
      }

      // Check for Transferred Shifts (Was mine, now someone else's) -> History
      const myTransferredExchangesOnDay = exchanges.filter(ex =>
        ex.status === TradeStatus.ACCEPTED &&
        ex.requesting_profile_id === currentUser.id &&
        ex.offered_shift?.shift?.date === dateStr
      );

      const isTransferred = myTransferredExchangesOnDay.length > 0; // History takes precedence if accepted

      // Check for Pending Exchanges (Repassando...)
      // Only considered if NOT transferred yet.
      // If transferred, it's history. match date.
      const myPendingExchangesOnDay = exchanges.filter(ex =>
        ex.status === 'PENDING' &&
        ex.requesting_profile_id === currentUser.id &&
        ex.offered_shift?.shift?.date === dateStr
      );

      const isRepassing = !isTransferred && myPendingExchangesOnDay.length > 0;

      const pendingType = isRepassing ? myPendingExchangesOnDay[0].type : null; // 'GIVEAWAY' or 'DIRECT_SWAP'

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

      // Resolve Color and Gradient Logic
      let activeShiftColor = displayColor;
      let backgroundStyle: string | undefined = undefined;
      let borderStyle: string | undefined = undefined;

      if (myShiftOnThisDay && !groupColor && userGroups) {
        if (dayServiceColors.length > 1) {
          // Premium Gradient for multiple services
          const colorStops = dayServiceColors.map((color, index) => {
            const step = 100 / dayServiceColors.length;
            return `${color} ${index * step}% ${(index + 1) * step}%`;
          }).join(', ');
          backgroundStyle = `linear-gradient(135deg, ${colorStops})`;
          borderStyle = `rgba(255,255,255,0.2)`;
        } else if (dayServiceColors.length === 1) {
          activeShiftColor = dayServiceColors[0];
          // Premium single service gradient (glow effect)
          backgroundStyle = `linear-gradient(135deg, ${activeShiftColor}, ${hexToRgba(activeShiftColor, 0.8)})`;
          borderStyle = `${activeShiftColor}40`;
        } else {
          // Fallback single logic
          const shiftId = myAssignmentsOnDay[0].shift_id;
          const shift = dayShifts.find(s => s.id === shiftId);
          if (shift) {
            const group = userGroups.find(g => g.id === shift.group_id);
            if (group && group.color) activeShiftColor = group.color;
          }
          backgroundStyle = `linear-gradient(135deg, ${activeShiftColor}, ${hexToRgba(activeShiftColor, 0.8)})`;
          borderStyle = `${activeShiftColor}40`;
        }
      } else if (myShiftOnThisDay) {
        // Single group view color
        backgroundStyle = `linear-gradient(135deg, ${displayColor}, ${hexToRgba(displayColor, 0.8)})`;
        borderStyle = `${displayColor}40`;
      }

      // Styles
      const dayStyle: React.CSSProperties = {
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      };
      let dotContent = null;

      if (isSelected) {
        dayStyle.background = myShiftOnThisDay ? backgroundStyle : `linear-gradient(135deg, ${displayColor}, ${hexToRgba(displayColor, 0.9)})`;
        dayStyle.color = 'white';
        dayStyle.boxShadow = `0 10px 15px -3px ${hexToRgba(displayColor, 0.4)}, 0 4px 6px -2px ${hexToRgba(displayColor, 0.2)}`;
        dayStyle.borderColor = 'rgba(255,255,255,0.3)';
      } else if (isTransferred) {
        // Transferred State: Gray History, No Background, Icon Below
        dayStyle.backgroundColor = 'transparent';
        dayStyle.color = '#94a3b8'; // Slate 400
        dayStyle.borderColor = 'transparent';
        dotContent = <Repeat size={12} className="mt-0.5 opacity-60" />;
      } else if (isRepassing) {
        // Repassing: Keep Service Color Gradient
        dayStyle.background = backgroundStyle || `linear-gradient(135deg, ${activeShiftColor}, ${hexToRgba(activeShiftColor, 0.8)})`;
        dayStyle.color = 'white';
        dayStyle.borderColor = 'rgba(255,255,255,0.2)';

        // Icon based on type
        dotContent = (
          <div className={`absolute top-0.5 right-0.5 animate-strong-pulse ${pendingType === TradeType.GIVEAWAY ? 'text-blue-100' : 'text-emerald-100'} drop-shadow-md`}>
            <Repeat size={12} strokeWidth={3} />
          </div>
        );
      } else if (myShiftOnThisDay) {
        dayStyle.background = backgroundStyle;
        dayStyle.color = 'white';
        dayStyle.fontWeight = 'bold';
        dayStyle.borderColor = borderStyle;
        dayStyle.boxShadow = `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)`;
        // Optional: Inner glow
        dayStyle.backgroundImage = `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%), ${backgroundStyle}`;
      } else if (hasRelevantShifts) {
        if (isAdminView) {
          dayStyle.backgroundColor = hexToRgba(displayColor, 0.08);
          dayStyle.color = displayColor;
          dayStyle.borderColor = hexToRgba(displayColor, 0.2);
        }
      }

      // Pulse logic for vacancies
      const hasVacancy = hasRelevantShifts && !isAdminView && publishedDayShifts.some(s => {
        const shiftAssigns = assignments.filter(a => a.shift_id === s.id);
        return shiftAssigns.length < (s.quantity_needed || 1);
      });

      const shouldPulse = !isSelected && !isRepassing && !myShiftOnThisDay && hasVacancy;
      if (shouldPulse) {
        dayStyle.boxShadow = `0 0 0 2px ${hexToRgba(displayColor, 0.4)}`;
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
                ? (isAdminView || myShiftOnThisDay || isRepassing || isTransferred
                  ? 'cursor-pointer'
                  : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer')
                : 'border-transparent text-slate-300 dark:text-slate-700 cursor-default opacity-50'}
            ${isToday && !isSelected ? 'ring-2 ring-gray-200 dark:ring-slate-700' : ''}
            ${shouldPulse ? 'animate-pulse' : ''}
          `}
        >
          <span className={`text-sm font-bold ${isPast && !isSelected && !isTransferred ? 'opacity-50' : ''}`}>{day}</span>
          {dotContent}
          {isRepassing && !isSelected && (
            <span className={`
              absolute -bottom-2 scale-75 whitespace-nowrap px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md border border-white/20
              ${pendingType === TradeType.GIVEAWAY
                ? 'bg-blue-600/40 text-blue-50 shadow-blue-900/10'
                : 'bg-emerald-600/40 text-emerald-50 shadow-emerald-900/10'}
            `}>
              {pendingType === TradeType.GIVEAWAY ? 'Em Repasse' : 'Em Troca'}
            </span>
          )}
        </div>
      );
    }
    return days;
  };

  // Filter User Groups for Legend: Only those with published shifts in THIS month
  const legendGroups = userGroups?.filter(g => {
    // Check if there are any shifts in current month belonging to this group
    return shifts.some(s => {
      const sDate = new Date(s.date + 'T12:00:00'); // Safe date parsing
      return s.group_id === g.id &&
        s.is_published &&
        sDate.getMonth() === currentDate.getMonth() &&
        sDate.getFullYear() === currentDate.getFullYear();
    });
  }) || [];

  // Determine which status legends to show based on exchanges in THIS month
  const statusLegend = {
    showRepassando: false, // Pending Giveaway
    showTrocando: false,   // Pending Swap
    showRepassado: false,  // Completed Giveaway
    showTrocado: false,    // Completed Swap
  };

  exchanges.forEach(ex => {
    // Check if exchange belongs to this month
    // Needed field: ex.offered_shift.shift.date
    const dateStr = ex.offered_shift?.shift?.date;
    if (dateStr) {
      const shiftDate = new Date(dateStr + 'T12:00:00');
      if (shiftDate.getMonth() === currentDate.getMonth() &&
        shiftDate.getFullYear() === currentDate.getFullYear()) {
        if (ex.status === 'PENDING') {
          if (ex.type === TradeType.GIVEAWAY) statusLegend.showRepassando = true;
          if (ex.type === TradeType.DIRECT_SWAP) statusLegend.showTrocando = true;
        } else if (ex.status === TradeStatus.ACCEPTED) {
          if (ex.type === TradeType.GIVEAWAY) statusLegend.showRepassado = true;
          if (ex.type === TradeType.DIRECT_SWAP) statusLegend.showTrocado = true;
        }
      }
    }
  });

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

      {/* Legend */}
      <div className="px-6 mb-6">
        <div className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-800 shadow-sm">

          {/* Group 1: Service Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-2.5">
            {groupId ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm border border-white/20" style={{ background: `linear-gradient(135deg, ${groupColor || '#10b981'}, ${hexToRgba(groupColor || '#10b981', 0.8)})` }}></div>
                <span className="tracking-wide">Seu Plantão</span>
              </div>
            ) : (
              legendGroups.length > 0 ? (
                legendGroups.map(g => (
                  <div key={g.id} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm border border-white/20" style={{ background: `linear-gradient(135deg, ${g.color || '#10b981'}, ${hexToRgba(g.color || '#10b981', 0.8)})` }}></div>
                    <span className="truncate max-w-[90px] tracking-wide">{g.name}</span>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1.5 opacity-50">
                  <span className="italic font-medium">Sem plantões no mês</span>
                </div>
              )
            )}
          </div>

          {/* Group 2: Status Legend */}
          {(statusLegend.showRepassando || statusLegend.showTrocando || statusLegend.showRepassado) && (
            <div className="flex items-center gap-4 pt-3 sm:pt-0 sm:pl-5 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 w-full sm:w-auto">
              {statusLegend.showRepassando && (
                <div className="flex items-center gap-1.5">
                  <Repeat size={11} className="text-blue-500 animate-strong-pulse" />
                  <span className="uppercase tracking-tighter opacity-80">Em Repasse</span>
                </div>
              )}
              {statusLegend.showTrocando && (
                <div className="flex items-center gap-1.5">
                  <Repeat size={11} className="text-emerald-500 animate-strong-pulse" />
                  <span className="uppercase tracking-tighter opacity-80">Em Troca</span>
                </div>
              )}
              {statusLegend.showRepassado && (
                <div className="flex items-center gap-1.5 opacity-60">
                  <Repeat size={11} className="text-slate-400" />
                  <span className="uppercase tracking-tighter">Repassado</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Decorative Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800 mx-6"></div>

      {/* Available Shifts List - Conditionally Rendered */}
      {
        showAvailableShifts && (
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
        )
      }

      <DayDetailSheet
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        shifts={selectedDate ? visibleShifts.filter(s => s.date === selectedDate) : []}
        assignments={assignments}
        currentUser={currentUser}
        currentUserRole={currentUserRole}
        groupId={groupId}
        exchanges={exchanges}
      />
    </div >
  );
};

export default CalendarView;