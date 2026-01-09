import React from 'react';
import { ActivityLog } from '../types';
import { ArrowRightLeft, UserPlus, FileCheck, AlertCircle } from 'lucide-react';

interface TimelineViewProps {
  logs: ActivityLog[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ logs }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'SHIFT_SWAP': return <ArrowRightLeft size={16} className="text-primary dark:text-primaryLight" />;
      case 'MEMBER_ADDED': return <UserPlus size={16} className="text-secondary" />;
      case 'SHIFT_ASSIGN': return <FileCheck size={16} className="text-slate-600 dark:text-slate-300" />;
      default: return <AlertCircle size={16} className="text-slate-400" />;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-primary dark:text-primaryLight mb-6">Atividade do Serviço</h2>
      
      <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8 transition-colors">
        {logs.map(log => (
          <div key={log.id} className="relative pl-8 group">
            {/* Connector Dot */}
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 group-hover:border-primary dark:group-hover:border-primaryLight transition-colors flex items-center justify-center">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-primary dark:group-hover:bg-primaryLight transition-colors"></div>
            </div>

            {/* Content Card */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-start space-x-4 transition-colors">
              <img 
                src={log.actor_profile.avatar_url} 
                alt={log.actor_profile.full_name} 
                className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-800"
              />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{log.actor_profile.full_name}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{formatTime(log.created_at)}</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                  {log.details}
                </div>
                <div className="inline-flex items-center space-x-2 px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-md">
                   {getIcon(log.action_type)}
                   <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
                     {log.action_type.toLowerCase().replace('_', ' ')}
                   </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Start Point */}
        <div className="relative pl-8 pt-4">
           <div className="absolute -left-[5px] top-6 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
           <p className="text-xs text-slate-400 italic">Início do histórico do mês</p>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;