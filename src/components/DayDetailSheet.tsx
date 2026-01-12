import React, { useState, useEffect } from 'react';
import { X, Clock, Users, ArrowRightLeft, Trash2, Sun, Moon, CloudSun, Sparkles, Megaphone, Repeat } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole, Profile, Group } from '../types';
import ShiftExchangeRequestModal from './ShiftExchangeRequestModal';
import RepasseModal from './RepasseModal'; // Import RepasseModal
import { getRelatedShiftsForDay, cancelShiftExchange } from '../services/api';
import { useToast } from '../context/ToastContext';
import Portal from './Portal';

interface DayDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string | null;
  shifts: Shift[];
  assignments: ShiftAssignment[];
  currentUser: Profile;
  currentUserRole: AppRole;
  groupId?: string;
  exchanges?: any[]; // Pass exchanges
}

const DayDetailSheet: React.FC<DayDetailSheetProps> = ({
  isOpen,
  onClose,
  date,
  shifts,
  assignments,
  currentUser,
  currentUserRole,
  groupId,
  exchanges = []
}) => {
  const { showToast } = useToast();
  const [exchangeAssignment, setExchangeAssignment] = useState<any | null>(null);
  const [repasseShift, setRepasseShift] = useState<Shift | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [exchangeToCancel, setExchangeToCancel] = useState<any | null>(null);

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
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] z-50 max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up transition-colors duration-300 ring-1 ring-black/5 dark:ring-white/10">

        <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
        </div>

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

              const startH = parseInt(shift.start_time.split(':')[0], 10);
              const isNightShift = startH >= 18 || startH <= 5;

              let TimeIcon = Sun;
              if (startH >= 12 && startH < 18) TimeIcon = CloudSun;
              else if (isNightShift) TimeIcon = Moon;

              const cardStyles = isNightShift ? {
                container: 'bg-slate-900 border-slate-800 shadow-lg shadow-indigo-900/10',
                textPrimary: 'text-slate-100',
                textSecondary: 'text-slate-400',
                iconColor: 'text-indigo-400',
                badge: 'bg-indigo-900/30 text-indigo-300 border-indigo-800',
                orb1: 'from-indigo-900/40 to-purple-900/10',
                orb2: 'bg-indigo-900/20',
                divider: 'border-slate-800',
                buttonBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-indigo-900/40'
              } : {
                container: 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 shadow-sm',
                textPrimary: 'text-slate-800 dark:text-slate-100',
                textSecondary: 'text-slate-500 dark:text-slate-400',
                iconColor: 'text-amber-500',
                badge: 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800',
                orb1: 'from-emerald-100/30 to-teal-50/10 dark:from-emerald-900/20 dark:to-teal-900/10',
                orb2: 'bg-green-50/30 dark:bg-green-900/10',
                divider: 'border-slate-50 dark:border-slate-800',
                buttonBg: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 dark:shadow-none'
              };

              return (
                <div key={shift.id} className="group relative w-full mb-4 animate-fade-in-up">
                  <div className={`relative overflow-hidden rounded-[2rem] border transition-all duration-500 ${cardStyles.container} ${isUserAssigned ? 'ring-2 ring-primary/20' : ''}`}>

                    {/* Animated Decorative Background Orbs */}
                    <div className={`absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br rounded-full blur-3xl transition-all duration-700 group-hover:scale-125 ${cardStyles.orb1}`}></div>
                    <div className={`absolute -left-6 bottom-0 w-24 h-24 rounded-full blur-2xl transition-all duration-700 group-hover:scale-110 ${cardStyles.orb2}`}></div>

                    <div className="relative z-10 p-5">
                      {/* Header: Institution & Status */}
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                          <h3 className={`font-black text-xl leading-tight transition-colors ${cardStyles.textPrimary}`}>
                            {shift.group_name || 'Serviço'}
                          </h3>
                          <div className={`flex items-center text-xs font-semibold mt-1 ${cardStyles.textSecondary}`}>
                            <Users size={12} className={`mr-1 ${isNightShift ? 'text-indigo-400' : 'text-primary'}`} />
                            <span className="opacity-80 tracking-wide">{shift.institution_name || 'Instituição'}</span>
                          </div>
                        </div>

                        {/* Premium Status Badge */}
                        {missingCount > 0 ? (
                          <div className="px-3 py-1.5 bg-red-50/80 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black rounded-xl flex items-center gap-1.5 border border-red-100 dark:border-red-900/30 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            Faltam {missingCount}
                          </div>
                        ) : (
                          <div className={`px-3 py-1.5 text-[10px] font-black rounded-xl flex items-center gap-1.5 border backdrop-blur-sm ${cardStyles.badge}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Completo
                          </div>
                        )}
                      </div>

                      {/* Body: Time & Visuals */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest mb-1 block opacity-60 ${cardStyles.textSecondary}`}>Horário</span>
                          <div className="flex items-baseline space-x-1">
                            <span className={`text-4xl font-black tracking-tighter ${isNightShift ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                              {shift.start_time}
                            </span>
                            <span className={`text-lg font-medium opacity-40 ${cardStyles.textSecondary}`}>- {shift.end_time}</span>
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 block opacity-60 ${cardStyles.textSecondary}`}>
                            {shift.code || (isNightShift ? 'Noturno' : 'Diurno')}
                          </span>
                        </div>

                        {/* Animated Icon */}
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          <div className={`absolute inset-0 bg-gradient-to-tr ${isNightShift ? 'from-indigo-500/20 to-purple-500/10' : 'from-emerald-100 to-green-50 dark:from-emerald-900/30 dark:to-green-900/20'} rounded-full opacity-50 animate-pulse-slow`}></div>
                          <TimeIcon size={28} className={`relative z-10 drop-shadow-sm animate-float ${isNightShift ? cardStyles.iconColor : 'text-amber-500'}`} strokeWidth={2.5} />
                          <Sparkles size={12} className={`absolute top-0 right-0 animate-pulse ${isNightShift ? 'text-indigo-300' : 'text-emerald-400'}`} />
                        </div>
                      </div>

                      {/* Footer: User & Actions */}
                      <div className={`pt-4 border-t ${cardStyles.divider}`}>
                        <h4 className={`text-[10px] uppercase font-black tracking-wider mb-4 opacity-50 ${cardStyles.textSecondary}`}>Plantonistas Escalados</h4>

                        <div className="space-y-4">
                          {shiftAssignments.length > 0 ? (
                            [
                              ...shiftAssignments.map(assign => {
                                const pendingEx = exchanges.find(ex =>
                                  ex.status === 'PENDING' &&
                                  ex.offered_shift_assignment_id === assign.id
                                );
                                return { type: 'active', data: assign, pendingEx };
                              }),
                              ...(exchanges.filter(ex =>
                                ex.status === 'ACCEPTED' &&
                                ex.requesting_profile_id === currentUser.id &&
                                ex.offered_shift?.shift_id === shift.id
                              ).map(ex => ({ type: 'ghost', data: ex })))
                            ].map((item: any) => {
                              if (item.type === 'ghost') {
                                const ex = item.data;
                                return (
                                  <div key={`ghost-${ex.id}`} className="flex items-center justify-between py-2 opacity-40 grayscale select-none pointer-events-none relative rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 px-3 border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center space-x-3">
                                      <div className="relative">
                                        <img src={currentUser.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200" />
                                        <div className="absolute -bottom-0.5 -right-0.5 bg-slate-500 text-white rounded-full p-0.5">
                                          <Repeat size={10} />
                                        </div>
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400 italic">Você (Repassado)</p>
                                        <p className="text-[10px] opacity-60">Para: {ex.target_profile?.full_name || 'Comunidade'}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              const assign = item.data;
                              const pendingEx = item.pendingEx;

                              return (
                                <div key={assign.id} className="flex items-center justify-between group/user">
                                  <div className="flex items-center space-x-3">
                                    <div className="relative">
                                      {assign.profile?.avatar_url ? (
                                        <img
                                          src={assign.profile.avatar_url}
                                          alt=""
                                          className={`w-10 h-10 rounded-full object-cover ring-2 transition-transform group-hover/user:scale-105 ${isNightShift ? 'ring-slate-800 border-slate-700' : 'ring-emerald-50 border-white'}`}
                                        />
                                      ) : (
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${isNightShift ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                          {assign.profile?.full_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                      )}
                                      {assign.is_confirmed && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                      )}
                                    </div>
                                    <div>
                                      <p className={`text-sm ${assign.profile_id === currentUser.id ? `font-black ${cardStyles.textPrimary}` : `font-bold ${cardStyles.textSecondary}`}`}>
                                        {assign.profile?.full_name}
                                      </p>
                                      <p className={`text-[10px] font-medium ${assign.profile_id === currentUser.id ? 'text-primary' : 'opacity-60 text-slate-500'}`}>
                                        {assign.profile?.specialty || assign.profile?.crm || 'Plantonista'}
                                        {assign.profile_id === currentUser.id && <span className="font-bold ml-1">(Você)</span>}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Action Buttons - Vertical Layout matching ShiftCard */}
                                  <div className="flex flex-col items-end gap-1.5">
                                    {assign.profile_id === currentUser.id && (
                                      <>
                                        {pendingEx ? (
                                          <button
                                            onClick={() => {
                                              setExchangeToCancel(pendingEx);
                                              setIsCancelModalOpen(true);
                                            }}
                                            className="relative overflow-hidden flex items-center justify-center min-w-[90px] px-3 py-1.5 rounded-lg text-white shadow-md active:scale-95 transition-all bg-amber-500 hover:bg-amber-600"
                                          >
                                            <div className="absolute inset-0 w-full h-full bg-white/20 animate-pulse-slow"></div>
                                            <span className="relative text-[10px] font-black uppercase tracking-wider">Repassando...</span>
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => setRepasseShift(shift)}
                                            className="relative overflow-hidden group/btn flex items-center justify-center min-w-[90px] px-3 py-1.5 rounded-lg text-white shadow-md active:scale-95 transition-all bg-blue-500 hover:bg-blue-600"
                                          >
                                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer"></div>
                                            <Megaphone size={12} className="mr-1.5" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">Repassar</span>
                                          </button>
                                        )}

                                        <button
                                          onClick={() => setExchangeAssignment({ ...assign, shift })}
                                          className={`relative overflow-hidden group/btn flex items-center justify-center min-w-[90px] px-3 py-1.5 rounded-lg text-white shadow-md active:scale-95 transition-all ${cardStyles.buttonBg}`}
                                        >
                                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-shimmer delay-75"></div>
                                          <ArrowRightLeft size={12} className="mr-1.5" />
                                          <span className="text-[10px] font-black uppercase tracking-wider">Trocar</span>
                                        </button>
                                      </>
                                    )}

                                    {currentUserRole === AppRole.GESTOR && (
                                      <button className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-slate-400 italic">Nenhum plantonista confirmado.</p>
                          )}

                          {missingCount > 0 && (
                            <div className="pt-2">
                              <div className="flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/10">
                                <div className="flex items-center gap-2 opacity-60">
                                  <Users size={14} className="text-slate-400" />
                                  <span className="text-xs font-bold text-slate-500">
                                    {missingCount} {missingCount === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                                  </span>
                                </div>
                                {currentUserRole === AppRole.GESTOR && (
                                  <button className="text-[10px] font-black text-primary uppercase hover:bg-primary/10 px-3 py-1 rounded-lg transition-colors border border-primary/20">+ Add</button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );

            })
          )}
        </div>

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

      {exchangeAssignment && (
        <ShiftExchangeRequestModal
          myShiftAssignment={exchangeAssignment}
          groupId={exchangeAssignment.shift.group_id}
          onClose={() => setExchangeAssignment(null)}
          onSuccess={() => {
            setExchangeAssignment(null);
            showToast('Solicitação de troca enviada!', 'success');
          }}
        />
      )}

      {repasseShift && (
        <RepasseModal
          isOpen={!!repasseShift}
          onClose={() => setRepasseShift(null)}
          shift={repasseShift}
          currentUserProfileId={currentUser.id}
          currentUserRole={currentUserRole}
        />
      )}

      {/* Cancel Exchange Modal */}
      {isCancelModalOpen && exchangeToCancel && (
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in" onClick={() => setIsCancelModalOpen(false)}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl w-full max-w-sm animate-zoom-in border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-500 mb-2">
                  <Megaphone size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">Cancelar Repasse?</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Ao cancelar, seu plantão não estará mais disponível para outros colegas.
                </p>
                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setIsCancelModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await cancelShiftExchange(exchangeToCancel.id);
                        showToast('Repasse cancelado com sucesso!', 'success');
                        setIsCancelModalOpen(false);
                        onClose(); // Optional: Close sheet to force refresh or callback
                      } catch (error) {
                        console.error(error);
                        showToast('Erro ao cancelar repasse', 'error');
                      }
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
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