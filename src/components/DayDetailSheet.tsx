import React, { useState, useEffect } from 'react';
import { X, Clock, Users, ArrowRightLeft, Trash2, Sun, Moon, CloudSun, Sparkles, Megaphone } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole, Profile, Group } from '../types';
import ShiftExchangeModal from './ShiftExchangeModal';
import RepasseModal from './RepasseModal'; // Import RepasseModal
import { getRelatedShiftsForDay } from '../services/api';

interface DayDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  shifts: Shift[];
  assignments: ShiftAssignment[];
  currentUser: Profile;
  currentUserRole: AppRole;
  groupId?: string; // Add groupId to props
}

const DayDetailSheet: React.FC<DayDetailSheetProps> = ({
  isOpen,
  onClose,
  date,
  shifts,
  assignments,
  currentUser,
  currentUserRole,
  groupId
}) => {
  const [exchangeAssignment, setExchangeAssignment] = useState<any | null>(null);
  const [repasseShift, setRepasseShift] = useState<Shift | null>(null); // State for Repasse Modal
  const [relatedShifts, setRelatedShifts] = useState<{
    group: Group;
    label: string | null;
    assignments: ShiftAssignment[];
  }[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  useEffect(() => {
    if (isOpen && date && groupId) {
      fetchRelatedShifts();
    }
  }, [isOpen, date, groupId]);

  const fetchRelatedShifts = async () => {
    if (!date || !groupId) return;
    setIsLoadingRelated(true);
    try {
      const data = await getRelatedShiftsForDay(groupId, date);
      setRelatedShifts(data);
    } catch (error) {
      console.error('Failed to fetch related shifts', error);
    } finally {
      setIsLoadingRelated(false);
    }
  };

  if (!isOpen || !date) return null;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getAssignmentsForShift = (shiftId: string) => {
    return assignments.filter(a => a.shift_id === shiftId);
  };

  // --- Sorting Shifs (Time Ascending: 00:00 -> 23:59) ---
  const sortedShifts = [...shifts].sort((a, b) => {
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] z-50 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up transition-colors duration-300 ring-1 ring-black/5 dark:ring-white/10">

        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-8 pb-6 pt-2 flex justify-between items-start border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tight">{formatDate(date)}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full inline-block">
              {shifts.length} {shifts.length === 1 ? 'plantão' : 'plantões'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 pb-20 bg-slate-50 dark:bg-slate-950 min-h-[300px] transition-colors">
          {sortedShifts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                <Clock size={40} className="opacity-40" />
                <div className="absolute top-0 right-0 w-6 h-6 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-xs text-slate-500">0</div>
              </div>
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">Dia Livre</h3>
              <p className="max-w-[200px] mx-auto leading-relaxed text-sm">Nenhum plantão cadastrado nesta data.</p>

              {currentUserRole === AppRole.GESTOR && (
                <button className="mt-6 px-6 py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primaryDark transition-all active:scale-95">
                  + Criar Plantão
                </button>
              )}
            </div>
          ) : (
            sortedShifts.map(shift => {
              const shiftAssignments = getAssignmentsForShift(shift.id);
              const missingCount = shift.quantity_needed - shiftAssignments.length;
              const isUserAssigned = shiftAssignments.some(a => a.profile_id === currentUser.id);

              // --- Determine Time & Style (Copied Logic from ShiftCard) ---
              const startH = parseInt(shift.start_time.split(':')[0], 10);
              const isNightShift = startH >= 18 || startH <= 5;

              let TimeIcon = Sun;
              if (startH >= 12 && startH < 18) TimeIcon = CloudSun;
              else if (isNightShift) TimeIcon = Moon;

              // Styles based on Day/Night
              const cardStyles = isNightShift ? {
                // Night Shift Styles
                container: 'bg-slate-900 border-slate-800 shadow-lg shadow-indigo-900/10',
                headerBg: 'bg-gradient-to-r from-slate-800/50 to-indigo-900/20',
                textPrimary: 'text-slate-100',
                textSecondary: 'text-slate-400',
                iconColor: 'text-indigo-400',
                badge: 'bg-indigo-900/30 text-indigo-300 border-indigo-800',
                timeBg: 'bg-slate-800/80',
              } : {
                // Day Shift Styles
                container: 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm',
                headerBg: 'bg-orange-50/50 dark:bg-orange-900/10', // Warm accent for day
                textPrimary: 'text-slate-800 dark:text-slate-100',
                textSecondary: 'text-slate-500 dark:text-slate-400',
                iconColor: 'text-amber-500',
                badge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
                timeBg: 'bg-slate-50 dark:bg-slate-800/50',
              };

              // Override for Day/Afternoon specifics if needed, but keeping it simple like ShiftCard
              if (startH >= 12 && startH < 18 && !isNightShift) {
                // Afternoon tweak
                cardStyles.headerBg = 'bg-amber-50/50 dark:bg-amber-900/10';
              }


              return (
                <div key={shift.id} className={`rounded-3xl border transition-all overflow-hidden ${cardStyles.container} ${isUserAssigned ? 'ring-2 ring-primary/20 dark:ring-primary/10' : ''}`}>

                  {/* Modern Header Section */}
                  <div className={`p-5 pb-4 ${cardStyles.headerBg} relative overflow-hidden`}>
                    {/* Decorative Orbs */}
                    <div className={`absolute -right-6 -top-6 w-24 h-24 bg-current rounded-full blur-2xl opacity-5 ${isNightShift ? 'text-indigo-500' : 'text-orange-400'}`}></div>

                    {/* Service & Institution Header (NEW) */}
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex flex-col">
                        <h3 className={`font-bold text-lg leading-tight transition-colors ${cardStyles.textPrimary}`}>
                          {shift.group_name || 'Serviço'}
                        </h3>
                        <div className={`flex items-center text-xs font-medium mt-1 ${cardStyles.textSecondary}`}>
                          <Users size={12} className={`mr-1 ${isNightShift ? 'text-indigo-400' : 'text-amber-500'}`} />
                          <span className="opacity-80 tracking-wide">{shift.institution_name || 'Instituição'}</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {missingCount > 0 ? (
                        <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg flex items-center gap-1.5 border border-red-100 dark:border-red-900/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Need {missingCount}
                        </div>
                      ) : (
                        <div className={`px-3 py-1.5 text-[10px] font-bold rounded-lg flex items-center gap-1.5 border ${cardStyles.badge}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Completo
                        </div>
                      )}
                    </div>

                    <div className="flex items-start justify-between relative z-10">
                      {/* Time & Icon */}
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isNightShift ? 'bg-slate-800 text-indigo-400' : 'bg-white text-amber-500'}`}>
                          <TimeIcon size={24} strokeWidth={2.5} className={isNightShift ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'drop-shadow-sm'} />
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-2xl font-black tracking-tight ${cardStyles.textPrimary}`}>
                              {shift.start_time}
                            </span>
                            <span className={`text-sm font-medium opacity-60 ${cardStyles.textSecondary}`}>
                              - {shift.end_time}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest opacity-70 ${cardStyles.textSecondary}`}>
                            {shift.code || (isNightShift ? 'Noturno' : 'Diurno')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assignments List */}
                  <div className="p-4 space-y-3 bg-white dark:bg-slate-900/50">
                    <h4 className={`text-[10px] uppercase font-bold tracking-wider mb-2 ${cardStyles.textSecondary}`}>Plantonistas Escalados</h4>

                    {shiftAssignments.length > 0 ? (
                      shiftAssignments.map(assign => (
                        <div key={assign.id} className="flex items-center justify-between group py-1.5">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {assign.profile?.avatar_url ? (
                                <img
                                  src={assign.profile.avatar_url}
                                  alt={assign.profile.full_name}
                                  className={`w-9 h-9 rounded-full object-cover ring-2 ${isNightShift ? 'ring-slate-800' : 'ring-white dark:ring-slate-800'}`}
                                />
                              ) : (
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${isNightShift ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                  {assign.profile?.full_name?.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              {assign.is_confirmed && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                                  <div className="w-1 h-0.5 bg-white"></div>
                                </div>
                              )}
                            </div>

                            <div>
                              <p className={`text-sm ${assign.profile_id === currentUser.id ? `font-black ${cardStyles.textPrimary}` : `font-medium ${cardStyles.textSecondary}`}`}>
                                {assign.profile?.full_name} {assign.profile_id === currentUser.id && <span className="text-primary font-bold text-xs ml-1">(Você)</span>}
                              </p>
                              <div className="flex items-center gap-1">
                                <p className={`text-[10px] ${assign.profile_id === currentUser.id ? 'text-primary' : 'opacity-60'}`}>{assign.profile?.specialty || 'Plantonista'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {/* MY ASSIGNMENT ACTIONS */}
                            {assign.profile_id === currentUser.id && (
                              <>
                                {/* Repasse Button */}
                                <button
                                  onClick={() => setRepasseShift(shift)}
                                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:bg-blue-100 transition-colors"
                                >
                                  <Megaphone size={12} />
                                  Repassar
                                </button>

                                {/* Troca Button */}
                                <button
                                  onClick={() => setExchangeAssignment({ ...assign, shift })}
                                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-100 transition-colors"
                                >
                                  <ArrowRightLeft size={12} />
                                  Trocar
                                </button>
                              </>
                            )}

                            {/* MANAGER ACTIONS */}
                            {currentUserRole === AppRole.GESTOR && (
                              <button className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-1">
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Nenhum plantonista confirmado.</p>
                    )}

                    {/* Empty Slots Indicator */}
                    {missingCount > 0 && (
                      <div className="pt-2">
                        <div className="flex items-center justify-between p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                          <div className="flex items-center gap-2 opacity-60">
                            <Users size={14} className="text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">
                              {missingCount} {missingCount === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                            </span>
                          </div>
                          {currentUserRole === AppRole.GESTOR && (
                            <button className="text-[10px] font-bold text-primary uppercase hover:bg-primary/10 px-2 py-1 rounded transition-colors">+ Add</button>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              );
            })
          )}
        </div>


        {/* Related Services Section */}
        {relatedShifts.length > 0 && (
          <div className="px-8 pb-10 bg-white dark:bg-slate-950">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-6" />
            <h3 className="text-xs font-black uppercase tracking-wider mb-4 text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Sparkles size={12} />
              Em outros serviços
            </h3>

            {isLoadingRelated ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {relatedShifts.map((rel, index) => (
                  <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="px-4 py-2 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                        <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200">{rel.group.name}</h4>
                      </div>
                      {rel.label && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {rel.label}
                        </span>
                      )}
                    </div>

                    <div className="p-3 grid gap-3">
                      {rel.assignments.length > 0 ? rel.assignments.map(assign => (
                        <div key={assign.id} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden grayscale opacity-80">
                            <img src={assign.profile?.avatar_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{assign.profile?.full_name}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-xs text-slate-400 italic px-2">Nenhum plantonista escalado.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Exchange Modal */}
      {exchangeAssignment && groupId && (
        <ShiftExchangeModal
          assignment={exchangeAssignment}
          groupId={groupId}
          currentUserId={currentUser.id}
          onClose={() => setExchangeAssignment(null)}
          onSuccess={() => {
            setExchangeAssignment(null);
            alert('Solicitação enviada com sucesso!');
            // onClose(); // Optional: close sheet too
          }}
        />
      )}

      {/* Repasse Modal */}
      {repasseShift && (
        <RepasseModal
          isOpen={!!repasseShift}
          onClose={() => setRepasseShift(null)}
          shift={repasseShift}
          currentUserProfileId={currentUser.id}
          currentUserRole={currentUserRole}
        />
      )}

      <style>{`
        .animate-slide-up {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default DayDetailSheet;