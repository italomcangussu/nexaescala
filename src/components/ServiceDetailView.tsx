import React, { useState, useEffect } from 'react';
import { Group, ServiceRole, Profile } from '../types';
// Cleaned imports
import { X, Settings, LogOut, Users } from 'lucide-react';
import AdminServiceView from './service-views/AdminServiceView';
import PlantonistaServiceView from './service-views/PlantonistaServiceView';
import { getGroupMembers } from '../services/api';

interface ServiceDetailViewProps {
  group: Group;
  currentUser: Profile;
  onClose: () => void;
}

const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({ group, currentUser, onClose }) => {
  const isAdmin = group.user_role === ServiceRole.ADMIN || group.user_role === ServiceRole.ADMIN_AUX;
  const isAux = group.user_role === ServiceRole.ADMIN_AUX;
  const isPlantonista = group.user_role === ServiceRole.PLANTONISTA;

  const [memberCount, setMemberCount] = useState<number>(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const members = await getGroupMembers(group.id);
        setMemberCount(members.length);
      } catch (error) {
        console.error("Failed to fetch member count", error);
      }
    };
    fetchCount();
  }, [group.id]);

  return (
    <div className="fixed inset-0 z-[60] bg-background dark:bg-slate-950 flex flex-col animate-fade-in-up overflow-hidden">

      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{group.name}</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${isAdmin ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
              {group.user_role === ServiceRole.ADMIN ? 'Administrador (ADM)' : group.user_role === ServiceRole.ADMIN_AUX ? 'Administrador Auxiliar (AUX)' : isPlantonista ? 'Plantonista' : 'Visitante'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{group.institution}</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
              <Users size={12} className="text-slate-500 dark:text-slate-400" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{memberCount} membros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Ativo</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPlantonista && (
            <button className="p-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full hover:bg-red-100 transition-colors" title="Sair do Serviço">
              <LogOut size={18} />
            </button>
          )}
          {isAdmin && !isAux && (
            <button className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-full hover:bg-slate-100 transition-colors">
              <Settings size={18} />
            </button>
          )}
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 rounded-full hover:bg-slate-200 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Content based on Role */}
      <div className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        {(group.user_role === ServiceRole.ADMIN || group.user_role === ServiceRole.ADMIN_AUX) ? (
          <AdminServiceView group={group} currentUser={currentUser} isAux={group.user_role === ServiceRole.ADMIN_AUX} />
        ) : (
          <PlantonistaServiceView group={group} currentUser={currentUser} />
        )}
      </div>

    </div>
  );
};

export default ServiceDetailView;