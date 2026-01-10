import React from 'react';
import { X, ChevronRight, ChevronLeft, Building, Save, Clock, Plus, Trash2, Edit2, Search, CheckCircle, Crown } from 'lucide-react';
import { Profile, ServiceRole } from '../types';
import { useServiceCreation } from '../hooks/useServiceCreation';

interface ServiceWizardProps {
  onClose: () => void;
  currentUser: Profile;
  onFinish: (group?: any, navigate?: boolean) => void;
}

const ServiceWizard: React.FC<ServiceWizardProps> = ({ onClose, currentUser, onFinish }) => {
  const {
    step,
    serviceName, setServiceName,
    institution, setInstitution,
    color, setColor,
    shifts,
    team,
    searchQuery, setSearchQuery,
    showInstitutionModal, setShowInstitutionModal,
    showShiftModal, setShowShiftModal,
    editingShift, setEditingShift,
    showCompletion,
    instForm, setInstForm,
    instSearch, setInstSearch,
    instSearchResults,
    showNewInstForm, setShowNewInstForm,
    createdGroup,
    isSaving,
    filteredProfiles,
    handleNext,
    handlePrev,
    saveInstitution,
    saveShift,
    removeShift,
    addMember,
    handleCreateService,
  } = useServiceCreation(currentUser, onFinish);

  const isSuccessState = showCompletion;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Overlay Backdrop - Handles Close */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity z-10 pointer-events-auto"
        onClick={onClose}
      />

      {/* Main Wizard Card - Floating Style */}
      <div
        onClick={e => e.stopPropagation()}
        className={`
          relative w-full mx-4 rounded-3xl shadow-2xl flex flex-col transition-all duration-300 animate-fade-in-up z-20 pointer-events-auto
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 overflow-hidden
          ${isSuccessState ? 'max-w-md h-auto' : 'max-w-2xl h-[650px] max-h-[85vh]'}
        `}
      >

        {!isSuccessState ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Novo Serviço</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Etapa {step} de 3</p>
              </div>
              <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-gray-100 dark:bg-slate-800 w-full">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">

              {/* STEP 1: INFO */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Nome do Serviço</label>
                    <input
                      value={serviceName}
                      onChange={e => setServiceName(e.target.value)}
                      placeholder="Ex: UTI Adulto - Equipe A"
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Instituição</label>
                    <button
                      type="button"
                      onClick={() => setShowInstitutionModal(true)}
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left"
                    >
                      {institution ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{institution}</span>
                      ) : (
                        <span className="text-slate-400">Selecionar ou criar instituição...</span>
                      )}
                      <ChevronRight className="text-slate-400" size={20} />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Cor do Grupo (Visualização pessoal)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={color}
                        onChange={e => setColor(e.target.value)}
                        className="w-12 h-12 rounded-xl cursor-pointer border-none"
                      />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{color}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SHIFTS */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in-up">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase">Turnos Cadastrados</h3>
                  </div>

                  <div className="space-y-3">
                    {shifts.map(shift => (
                      <div key={shift.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary dark:text-primaryLight flex items-center justify-center font-bold text-sm border border-primary/20">
                            {shift.code}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold">
                              <Clock size={16} className="text-slate-400" />
                              {shift.start_time} - {shift.end_time}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {shift.quantity_needed || 2} Plantonistas
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => { setEditingShift(shift); setShowShiftModal(true); }} className="p-2 text-slate-400 hover:text-primary dark:hover:text-primaryLight">
                            <Edit2 size={18} />
                          </button>
                          <button type="button" onClick={() => removeShift(shift.id)} className="p-2 text-slate-400 hover:text-error">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => { setEditingShift({ code: '', start_time: '', end_time: '' }); setShowShiftModal(true); }}
                    className="w-full py-4 border-2 border-dashed border-primary/30 text-primary dark:text-primaryLight font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                  >
                    <Plus size={20} />
                    Adicionar Turno
                  </button>
                </div>
              )}

              {/* STEP 3: TEAM */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in-up">
                  {/* Current Team */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Membros Adicionados</h3>
                    <div className="flex flex-wrap gap-2">
                      {team.map((member, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-slate-700 shadow-sm">
                          <img src={member.profile.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{member.profile.full_name.split(' ')[0]}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded uppercase font-bold">
                              {member.role === ServiceRole.ADMIN ? 'ADM' :
                                member.role === ServiceRole.ADMIN_AUX ? 'ADM AUX' :
                                  member.role === ServiceRole.PLANTONISTA ? 'PLANT' : 'VIS'}
                            </span>
                            {member.role === ServiceRole.ADMIN && <Crown size={12} className="text-amber-500" fill="currentColor" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar plantonista (Nome, CRM...)"
                      className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-sm text-slate-800 dark:text-slate-100"
                    />
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                  </div>

                  {/* Results */}
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {searchQuery && filteredProfiles.map(profile => (
                      <div key={profile.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{profile.full_name}</p>
                            <p className="text-xs text-slate-500">{profile.crm} • {profile.specialty}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 w-full sm:w-auto justify-end overflow-x-auto">
                          {[ServiceRole.ADMIN, ServiceRole.ADMIN_AUX, ServiceRole.PLANTONISTA, ServiceRole.VISITANTE].map(role => (
                            <button
                              type="button"
                              key={role}
                              onClick={() => addMember(profile, role)}
                              className="px-2 py-1 text-[10px] font-bold border border-slate-200 dark:border-slate-700 rounded hover:bg-primary hover:text-white hover:border-primary transition-colors text-slate-500 dark:text-slate-400 whitespace-nowrap"
                            >
                              {role === ServiceRole.ADMIN ? 'ADM' :
                                role === ServiceRole.ADMIN_AUX ? 'ADM AUX' :
                                  role === ServiceRole.PLANTONISTA ? 'PLANT' : 'VIS'}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Navigation */}
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-between bg-white dark:bg-slate-900">
              {step > 1 ? (
                <button type="button" onClick={handlePrev} className="px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  Voltar
                </button>
              ) : <div></div>}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={step === 1 && (!serviceName || !institution)}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primaryDark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  Prosseguir
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={handleCreateService}
                  disabled={isSaving}
                  className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primaryDark transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <span className="animate-spin">⏳</span> : <Save size={18} />}
                  {isSaving ? 'Salvando...' : 'Salvar Serviço'}
                </button>
              )}
            </div>
          </>
        ) : (
          /* COMPLETION SUCCESS STATE (Replaces Wizard Content) */
          <div className="w-full flex-col items-center justify-center p-8 text-center relative flex">


            <div className="relative z-10 flex flex-col items-center w-full">
              <div className="w-20 h-20 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-5 ring-8 ring-emerald-500/5 dark:ring-emerald-500/10 shadow-lg shadow-emerald-500/10 shrink-0">
                <CheckCircle size={40} strokeWidth={2.5} />
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Serviço Criado!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed px-4 max-w-xs mx-auto">
                O serviço <span className="font-bold text-slate-800 dark:text-slate-200">{serviceName}</span> foi salvo com sucesso.
              </p>

              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={() => onFinish(createdGroup!, true)}
                  className="w-full py-3.5 bg-primary text-white font-bold rounded-xl text-base shadow-lg shadow-emerald-500/20 hover:bg-primaryDark transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
                >
                  Ir para Editor de Escala
                  <ChevronRight size={18} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => onFinish(createdGroup!, false)}
                  className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL INSTITUTION --- */}
        {showInstitutionModal && !isSuccessState && (
          <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col animate-fade-in-up">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {showNewInstForm ? 'Nova Instituição' : 'Selecionar Instituição'}
              </h3>
              <button type="button" onClick={() => setShowInstitutionModal(false)}><X className="text-slate-400" /></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {!showNewInstForm ? (
                <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                    <input
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 focus:ring-primary/50 text-slate-800 dark:text-white"
                      placeholder="Buscar instituição..."
                      value={instSearch}
                      onChange={e => setInstSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div>
                    {instSearchResults.length > 0 && <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Resultados Encontrados</h4>}
                    <div className="space-y-2">
                      {instSearchResults.map(inst => (
                        <button
                          type="button"
                          key={inst}
                          onClick={() => { setInstitution(inst); setShowInstitutionModal(false); }}
                          className="w-full text-left p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-primary hover:bg-primary/5 transition-all text-sm font-medium text-slate-700 dark:text-slate-200"
                        >
                          {inst}
                        </button>
                      ))}
                      {instSearch.length > 2 && instSearchResults.length === 0 && (
                        <p className="text-center text-slate-400 text-sm py-4">Nenhuma instituição encontrada com esse nome.</p>
                      )}
                      {instSearch.length <= 2 && (
                        <div className="text-center py-8">
                          <Building size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                          <p className="text-slate-400 text-sm">Digite o nome para buscar instituições cadastradas.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowNewInstForm(true)}
                    className="w-full py-4 border-2 border-dashed border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Cadastrar Nova Instituição
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in-right space-y-4">
                  <button type="button" onClick={() => setShowNewInstForm(false)} className="text-xs font-bold text-slate-500 hover:text-primary flex items-center gap-1 mb-2">
                    <ChevronLeft size={14} /> Voltar para busca
                  </button>
                  <div className="space-y-3">
                    <input placeholder="Nome da Instituição" value={instForm.name} onChange={e => setInstForm({ ...instForm, name: e.target.value })} className="w-full p-3 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-primary" />
                    <div className="flex gap-3">
                      <input placeholder="Cidade" value={instForm.city} onChange={e => setInstForm({ ...instForm, city: e.target.value })} className="w-1/2 p-3 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-primary" />
                      <input placeholder="Estado" value={instForm.state} onChange={e => setInstForm({ ...instForm, state: e.target.value })} className="w-1/2 p-3 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-primary" />
                    </div>
                    <input placeholder="Telefone" value={instForm.phone} onChange={e => setInstForm({ ...instForm, phone: e.target.value })} className="w-full p-3 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:border-primary" />
                    <button type="button" onClick={saveInstitution} className="w-full py-3 bg-primary text-white font-bold rounded-lg text-sm hover:bg-primaryDark">Salvar e Selecionar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- MODAL SHIFT --- */}
        {showShiftModal && !isSuccessState && (
          <div className="absolute inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col items-center justify-center animate-fade-in-up p-6">
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editar Turno</h3>
                <p className="text-sm text-slate-500">Defina a sigla e os horários</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Sigla (Ex: NTN)</label>
                <input
                  value={editingShift?.code || ''}
                  onChange={e => setEditingShift(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-center text-xl tracking-widest uppercase border border-transparent focus:border-primary outline-none dark:text-white"
                  maxLength={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Início</label>
                  <input
                    type="time"
                    value={editingShift?.start_time || ''}
                    onChange={e => setEditingShift(prev => ({ ...prev, start_time: e.target.value }))}
                    className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center font-semibold dark:text-white border border-transparent focus:border-primary outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Fim</label>
                <input
                  type="time"
                  value={editingShift?.end_time || ''}
                  onChange={e => setEditingShift(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center font-semibold dark:text-white border border-transparent focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Plantonistas</label>
              <input
                type="number"
                min="1"
                max="50"
                value={editingShift?.quantity_needed || 2}
                onChange={e => setEditingShift(prev => ({ ...prev, quantity_needed: parseInt(e.target.value) || 2 }))}
                className="w-full mt-1 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-center text-xl tracking-widest border border-transparent focus:border-primary outline-none dark:text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={() => setShowShiftModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl">Voltar</button>
              <button
                type="button"
                onClick={saveShift}
                disabled={!editingShift?.code || !editingShift?.start_time || !editingShift?.end_time}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50"
              >
                {editingShift?.id ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ServiceWizard;