import React from 'react';
import { ArrowRightLeft, Edit, Sun, Moon, MapPin, Sparkles } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole } from '../types';

interface ShiftCardProps {
  shift: Shift;
  assignment?: ShiftAssignment;
  currentUserRole?: AppRole;
  onEdit?: (shift: Shift) => void;
  hideProfile?: boolean;
  accentColor?: string;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ shift, assignment, currentUserRole, onEdit, hideProfile = false, accentColor }) => {
  // Date Formatting
  const dateObj = new Date(shift.date + 'T12:00:00');
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });

  // Shift Logic
  const startHour = parseInt(shift.start_time.split(':')[0], 10);
  const isNightShift = startHour >= 18 || startHour <= 5;

  const isFlex = shift.institution_name?.toLowerCase().includes('flex');

  // Icon Selection
  const Icon = isNightShift ? Moon : Sun;

  // Dynamic Styles based on Night/Day + App Dark Mode
  // Night shift stays dark/indigo even in light mode.
  // Day shift is white in light mode, but needs to be dark slate in dark mode.

  const cardStyles = isNightShift ? {
    // Night Shift Styles (Always Darkish)
    container: 'bg-slate-900 border-slate-800 shadow-lg shadow-indigo-900/20 dark:border-indigo-900/50',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    iconColor: 'text-indigo-400',
    badge: 'bg-slate-800/80 border-slate-700',
    badgeText: 'text-indigo-400',
    orb1: 'from-indigo-900/60 to-purple-900/20',
    orb2: 'bg-indigo-900/30',
    editBtnHover: 'hover:text-indigo-400 hover:bg-slate-800',
    divider: 'border-slate-800',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/40 hover:shadow-indigo-800/50'
  } : {
    // Day Shift Styles (Adaptive)
    container: 'bg-white dark:bg-slate-800 border-emerald-50 dark:border-slate-700 shadow-card dark:shadow-none',
    textPrimary: 'text-slate-800 dark:text-slate-100 group-hover:text-primaryDark dark:group-hover:text-primaryLight',
    textSecondary: 'text-slate-500 dark:text-slate-400',
    iconColor: 'text-amber-500',
    badge: 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    orb1: 'from-emerald-100/40 to-teal-50/20 dark:from-emerald-900/20 dark:to-teal-900/10 group-hover:from-emerald-200/40',
    orb2: 'bg-green-50/50 dark:bg-green-900/20',
    editBtnHover: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700',
    divider: 'border-slate-50 dark:border-slate-700',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 hover:shadow-emerald-300 dark:shadow-none'
  };

  return (
    <div className="group relative w-full mb-4 animate-fade-in-up">
      {/* Card Container */}
      <div className={`relative overflow-hidden rounded-3xl border transition-all duration-500 hover:shadow-card-hover hover:-translate-y-1 ${cardStyles.container}`}>

        {/* Animated Decorative Background Orb */}
        <div className={`absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br rounded-full blur-3xl transition-all duration-700 group-hover:scale-125 ${cardStyles.orb1}`}></div>
        <div className={`absolute -left-8 bottom-0 w-32 h-32 rounded-full blur-2xl transition-all duration-700 group-hover:scale-110 ${cardStyles.orb2}`}></div>

        <div className="relative z-10 p-5">

          {/* Header: Date Badge & Institution */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex flex-col">
              <h3 className={`font-bold text-lg leading-tight transition-colors ${cardStyles.textPrimary}`}>
                {shift.institution_name || 'Instituição'}
              </h3>
              <div className={`flex items-center text-xs font-medium mt-1 ${cardStyles.textSecondary}`}>
                <MapPin size={12} className={`mr-1 ${isNightShift ? 'text-indigo-400' : 'text-primary'}`} />
                <span className="opacity-80 tracking-wide">{isFlex ? 'Unidade Flex' : 'Bloco Central'}</span>
              </div>
            </div>

            {/* Premium Date Badge */}
            <div
              className={`flex flex-col items-center backdrop-blur-sm px-3 py-2 rounded-2xl border ${cardStyles.badge}`}
              style={!isNightShift && accentColor ? {
                backgroundColor: `${accentColor}15`,
                borderColor: `${accentColor}30`,
                color: accentColor
              } : {}}
            >
              <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${!isNightShift && accentColor ? '' : cardStyles.badgeText}`} style={!isNightShift && accentColor ? { color: accentColor } : {}}>{weekday.split('-')[0]}</span>
              <span className={`text-xl font-black leading-none ${!isNightShift && accentColor ? '' : (isNightShift ? 'text-white' : 'text-emerald-800 dark:text-emerald-200')}`} style={!isNightShift && accentColor ? { color: accentColor } : {}}>{day}</span>
              <span className={`text-[9px] font-bold uppercase opacity-80 ${!isNightShift && accentColor ? '' : (isNightShift ? 'text-slate-400' : 'text-emerald-500 dark:text-emerald-400')}`} style={!isNightShift && accentColor ? { color: accentColor } : {}}>{month}</span>
            </div>
          </div>

          {/* Body: Time & Visuals */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 block ${cardStyles.textSecondary}`}>Horário</span>
              <div className="flex items-baseline space-x-1">
                <span className={`text-4xl font-black tracking-tighter ${isNightShift ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                  {shift.start_time}
                </span>
                <span className={`text-lg font-light ${cardStyles.textSecondary}`}>- {shift.end_time}</span>
              </div>
            </div>

            {/* Animated Icon */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <div
                className={`absolute inset-0 bg-gradient-to-tr ${isNightShift ? 'from-indigo-500/20 to-purple-500/10' : 'from-emerald-100 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20'} rounded-full opacity-50 animate-pulse-slow`}
                style={!isNightShift && accentColor ? { background: `radial-gradient(circle, ${accentColor}20 0%, ${accentColor}05 70%)` } : {}}
              ></div>
              <Icon
                size={28}
                className={`relative z-10 drop-shadow-sm animate-float ${isNightShift ? cardStyles.iconColor : ''}`}
                style={!isNightShift && accentColor ? { color: accentColor } : {}}
                strokeWidth={2}
                fill={isNightShift ? "currentColor" : "none"}
                fillOpacity={0.2}
              />
              {/* Sparkle decoration */}
              <Sparkles size={12} className={`absolute top-0 right-0 animate-pulse ${isNightShift ? 'text-indigo-300' : 'text-emerald-400'}`} style={!isNightShift && accentColor ? { color: accentColor } : {}} />
            </div>
          </div>

          {/* Footer: User & Premium Action */}
          <div className={`flex items-center justify-between pt-4 border-t ${cardStyles.divider}`}>

            {/* User Info */}
            <div className="flex items-center space-x-2.5">
              {!hideProfile && (
                <>
                  <div className="relative group/avatar cursor-pointer">
                    <img
                      src={assignment?.profile?.avatar_url}
                      alt="Profile"
                      className={`w-9 h-9 rounded-full border-2 shadow-sm object-cover ring-1 transition-transform group-hover/avatar:scale-105 ${isNightShift ? 'border-slate-700 ring-slate-800' : 'border-white dark:border-slate-600 ring-emerald-50 dark:ring-slate-700'}`}
                    />
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2 rounded-full animate-pulse ${isNightShift ? 'bg-indigo-500 border-slate-900' : 'bg-emerald-500 border-white dark:border-slate-700'}`}></div>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold truncate max-w-[120px] ${isNightShift ? 'text-slate-300' : 'text-slate-700 dark:text-slate-200'}`}>
                      {assignment?.profile?.full_name}
                      {assignment?.profile_id === assignment?.profile?.id &&
                        <span className={`${isNightShift ? 'text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'} font-normal ml-1`}>(Você)</span>}
                    </span>
                    <span className={`text-[10px] font-medium ${cardStyles.textSecondary}`}>CRM {assignment?.profile?.crm || '---'}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {currentUserRole === AppRole.GESTOR && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(shift);
                  }}
                  className={`p-2 rounded-xl transition-all active:scale-95 text-slate-400 ${cardStyles.editBtnHover}`}
                >
                  <Edit size={18} strokeWidth={2} />
                </button>
              )}

              {/* Premium Button with Shimmer Effect - Adjusted for Night */}
              <button
                className={`relative overflow-hidden group/btn flex items-center px-5 py-2.5 rounded-xl text-white shadow-lg active:scale-95 transition-all duration-300 ${cardStyles.buttonBg}`}
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer"></div>
                <ArrowRightLeft size={14} className="mr-2 group-hover/btn:rotate-180 transition-transform duration-500" />
                <span className="text-xs font-bold uppercase tracking-wide">Trocar</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShiftCard;