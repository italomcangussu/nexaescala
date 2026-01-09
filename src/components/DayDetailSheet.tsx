import React from 'react';
import { X, Clock, Users, ArrowRightLeft, Trash2, Edit2 } from 'lucide-react';
import { Shift, ShiftAssignment, AppRole, Profile, Group } from '../types';
import ShiftExchangeModal from './ShiftExchangeModal'; // Import new modal

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
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] animate-slide-up transition-colors duration-300">

        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 pb-4 pt-2 flex justify-between items-start border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-primary dark:text-primaryLight capitalize">{formatDate(date)}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{shifts.length} turnos agendados</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 pb-10 bg-background dark:bg-slate-950 min-h-[300px] transition-colors">
          {shifts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-600">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={32} className="opacity-50" />
              </div>
              <p>Nenhum plantão cadastrado para este dia.</p>
              {currentUserRole === AppRole.GESTOR && (
                <button className="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg hover:bg-primaryDark transition-all">
                  + Criar Plantão
                </button>
              )}
            </div>
          ) : (
            shifts.map(shift => {
              const shiftAssignments = getAssignmentsForShift(shift.id);
              const missingCount = shift.quantity_needed - shiftAssignments.length;
              const isUserAssigned = shiftAssignments.some(a => a.profile_id === currentUser.id);

              return (
                <div key={shift.id} className={`rounded-2xl border ${isUserAssigned ? 'border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-sm' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-card dark:shadow-none'} overflow-hidden transition-all`}>

                  {/* Shift Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2.5 rounded-xl ${shift.start_time.startsWith('19') ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                        <Clock size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                          {shift.start_time} - {shift.end_time}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
                          {shift.start_time.startsWith('19') ? 'Plantão Noturno' : 'Plantão Diurno'}
                        </div>
                      </div>
                    </div>

                    {missingCount > 0 && (
                      <div className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-200 dark:border-amber-800">
                        Faltam {missingCount}
                      </div>
                    )}
                  </div>

                  {/* Doctors List */}
                  <div className="bg-slate-50/50 dark:bg-slate-800/30 p-4 space-y-3 border-t border-slate-100 dark:border-slate-800">
                    {shiftAssignments.map(assign => (
                      <div key={assign.id} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <img
                            src={assign.profile?.avatar_url}
                            alt={assign.profile?.full_name}
                            className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm"
                          />
                          <div>
                            <p className={`text-sm ${assign.profile_id === currentUser.id ? 'font-bold text-primary dark:text-primaryLight' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                              {assign.profile?.full_name} {assign.profile_id === currentUser.id && '(Você)'}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                              <p className="text-[11px] text-slate-400 font-medium">{assign.profile?.crm || 'CRM 12345'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Actions based on role/ownership */}
                        <div className="flex items-center space-x-1">
                          {assign.profile_id === currentUser.id && (
                            <button
                              onClick={() => setExchangeAssignment({ ...assign, shift })}
                              className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform hover:bg-slate-50 dark:hover:bg-slate-600"
                            >
                              <ArrowRightLeft size={14} className="text-primary dark:text-primaryLight" />
                              <span>Gerenciar</span>
                            </button>
                          )}
                          {currentUserRole === AppRole.GESTOR && (
                            <button className="p-2 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: missingCount }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="flex items-center space-x-3 opacity-60">
                          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <Users size={16} className="text-slate-500 dark:text-slate-400" />
                          </div>
                          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Vaga disponível</span>
                        </div>
                        {currentUserRole === AppRole.GESTOR && (
                          <button className="text-primary dark:text-primaryLight text-xs font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                            + Convidar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Manager Footer Actions */}
                  {currentUserRole === AppRole.GESTOR && (
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-gray-50 dark:bg-slate-800/50">
                      <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primaryLight transition-colors">
                        <Edit2 size={14} />
                        Editar Turno
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
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
      )}

      <style>{`
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
};

export default DayDetailSheet;