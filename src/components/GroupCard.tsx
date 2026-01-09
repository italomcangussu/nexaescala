import React from 'react';
import { Users, ChevronRight, Activity, MapPin } from 'lucide-react';
import { Group } from '../types';

interface GroupCardProps {
  group: Group;
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-card-hover active:scale-[0.98] mb-3 overflow-hidden cursor-pointer">

      {/* Decorative Background Elements */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none opacity-5 dark:opacity-10"
        style={{ backgroundColor: group.color || '#10b981' }}
      ></div>

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-start gap-3.5 flex-1 pr-2">

          {/* Icon Box - Medical Theme */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm shrink-0 transition-colors duration-300"
            style={{
              backgroundColor: `${group.color}15` || '#ecfdf5', // roughly 10% opacity hex
              color: group.color || '#10b981',
              borderColor: `${group.color}30` || '#d1fae5'
            }}
          >
            <Activity size={22} strokeWidth={2} />
          </div>

          <div className="flex flex-col min-w-0">
            {/* Service Name (Title) */}
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight mb-1 truncate pr-2">
              {group.name}
            </h3>

            {/* Institution Name (Subtitle) */}
            <div className="flex items-start">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug line-clamp-2">
                {group.institution}
              </span>
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-3 mt-2.5">
              <div className="flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-md">
                <Users size={10} className="mr-1" />
                {group.member_count} membros
              </div>
              {/* Status Indicator */}
              <div
                className="flex items-center text-[10px] font-bold"
                style={{ color: group.color || '#10b981' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full mr-1 animate-pulse"
                  style={{ backgroundColor: group.color || '#10b981' }}
                ></span>
                Ativo
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Area */}
        <div className="flex flex-col items-end justify-between h-full pl-2 border-l border-slate-50 dark:border-slate-700/50 min-h-[3rem]">
          {group.unread_messages > 0 ? (
            <div className="flex flex-col items-center gap-1 mt-1">
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-sm shadow-red-200 dark:shadow-none animate-pulse">
                {group.unread_messages}
              </span>
              <span className="text-[9px] text-red-500 font-bold">Novas</span>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <ChevronRight
                size={18}
                className="text-slate-300 dark:text-slate-600 transition-colors"
                style={{ color: undefined }} // Reset style if needed or use group-hover logic with CSS variables if complex. Keeping simple for now, maybe inline style on hover isn't easy in React without state.
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCard;