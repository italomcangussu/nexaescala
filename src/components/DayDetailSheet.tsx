import React from 'react';
import { X, Clock, Users, ArrowRightLeft, Trash2, Edit2, Sun, Moon, CloudSun, User } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole, Profile, Group } from '../types';
import ShiftExchangeModal from './ShiftExchangeModal'; // Import new modal
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
  const [exchangeAssignment, setExchangeAssignment] = React.useState<any | null>(null);
  const [relatedShifts, setRelatedShifts] = React.useState<{
    group: Group;
    label: string | null;
    assignments: ShiftAssignment[];
  }[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = React.useState(false);

  React.useEffect(() => {
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
        <div className="p-6 space-y-6 pb-20 bg-background dark:bg-slate-950 min-h-[300px] transition-colors">
          {shifts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-600">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 relative">
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
            shifts.map(shift => {
              const shiftAssignments = getAssignmentsForShift(shift.id);
              const missingCount = shift.quantity_needed - shiftAssignments.length;
              const isUserAssigned = shiftAssignments.some(a => a.profile_id === currentUser.id);

              // Determine Time Icon
              const startH = parseInt(shift.start_time.split(':')[0]);
              let TimeIcon = Sun;
              let timeColorClass = "bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400";

              if (startH >= 12 && startH < 18) {
                TimeIcon = CloudSun;
                timeColorClass = "bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400";
              } else if (startH >= 18 || startH < 6) {
                TimeIcon = Moon;
                timeColorClass = "bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-400";
              }

              return (
                <div key={shift.id} className={`rounded-3xl border transition-all overflow-hidden ${isUserAssigned ? 'border-primary/40 bg-primary/5 dark:bg-primary/5 shadow-sm shadow-primary/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm'}`}>

                  {/* Shift Header */}
                  <div className="p-1">
                    <div className={`flex items-center justify-between p-4 rounded-[1.3rem] ${timeColorClass}`}>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                          <TimeIcon size={18} strokeWidth={2.5} />
                        </div>
                        <div>
                          <div className="font-black text-lg leading-none mb-1">
                            {shift.start_time} - {shift.end_time}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                            {shift.code || (startH >= 18 || startH < 6 ? 'Plantão Noturno' : 'Plantão Diurno')}
                          </div>
                        </div>
                      </div>

                      {missingCount > 0 && (
                        <div className="px-3 py-1.5 bg-white/80 dark:bg-black/20 backdrop-blur-sm text-[10px] font-bold rounded-lg flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                          Faltam {missingCount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assignments List */}
                  <div className="px-4 pb-4 pt-2 space-y-3">
                    {shiftAssignments.map(assign => (
                      <div key={assign.id} className="flex items-center justify-between group py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0 last:pb-0">
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            {assign.profile?.avatar_url ? (
                              <img
                                src={assign.profile.avatar_url}
                                alt={assign.profile.full_name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-800"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold">
                                {assign.profile?.full_name?.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            {assign.is_confirmed && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center">
                                <div className="w-1.5 h-1 bg-white" style={{ clipPath: 'polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%)' }}></div>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className={`text-sm ${assign.profile_id === currentUser.id ? 'font-black text-slate-800 dark:text-white' : 'font-bold text-slate-700 dark:text-slate-300'}`}>
                              {assign.profile?.full_name} {assign.profile_id === currentUser.id && <span className="text-primary font-normal text-xs ml-1">(Você)</span>}
                            </p>
                            <div className="flex items-center gap-1">
                              <p className="text-[11px] text-slate-400 font-medium">{assign.profile?.specialty || 'Plantonista'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions based on role/ownership */}
                        <div className="flex items-center">
                          {assign.profile_id === currentUser.id && (
                            <button
                              onClick={() => setExchangeAssignment({ ...assign, shift })}
                              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all hover:bg-white inset-ring"
                            >
                              <ArrowRightLeft size={12} className="text-primary" />
                              <span>Trocar</span>
                            </button>
                          )}
                          {currentUserRole === AppRole.GESTOR && (
                            <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-1">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: missingCount }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-3 opacity-60">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <User size={16} className="text-slate-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Vaga disponível</span>
                        </div>
                        {currentUserRole === AppRole.GESTOR && (
                          <button className="text-primary dark:text-primaryLight text-[10px] font-black hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wide">
                            + Convidar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Manager Footer Actions */}
                  {currentUserRole === AppRole.GESTOR && (
                    <div className="px-4 py-2 border-t border-slate-50 dark:border-slate-800/50 flex justify-end bg-slate-50/50 dark:bg-slate-800/20">
                      <button className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors uppercase tracking-wider">
                        <Edit2 size={12} />
                        Gerenciar Turno
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>


        {/* Related Services Section */}
        {relatedShifts.length > 0 && (
          <div className="px-8 pb-10 bg-background dark:bg-slate-950">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent mb-6" />
            <h3 className="text-sm font-black uppercase tracking-wider mb-4 text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <Users size={14} />
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
      )
      }

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