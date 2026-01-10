import React from 'react';
import { X, ChevronRight, ChevronLeft, Save, Loader2, Check } from 'lucide-react';
import { Profile, Group, ServiceEditorMode } from '../../types';
import { useServiceEditor } from '../../hooks/useServiceEditor';

// Step Components
import StepInfo from './steps/StepInfo';
import StepShifts from './steps/StepShifts';
import StepTeam from './steps/StepTeam';
import StepGenerate from './steps/StepGenerate';
import StepCompletion from './steps/StepCompletion';

// Modal Components
import InstitutionModal from './modals/InstitutionModal';
import ShiftModal from './modals/ShiftModal';

interface ServiceEditorProps {
    mode: ServiceEditorMode;
    group?: Group;
    currentUser: Profile;
    onClose: () => void;
    onFinish: (group: Group, navigate: boolean) => void;
}

const ServiceEditor: React.FC<ServiceEditorProps> = ({
    mode,
    group,
    currentUser,
    onClose,
    onFinish,
}) => {
    const { state, actions, filteredProfiles, canAdvance } = useServiceEditor(
        currentUser,
        group,
        onFinish
    );

    const isSuccessState = state.showCompletion;

    // Wizard Step Indicator
    const WizardProgress = () => (
        <div className="px-6 py-3 bg-slate-50/50 dark:bg-slate-950/50 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center justify-between max-w-lg mx-auto">
                {[1, 2, 3].map(step => {
                    const isActive = state.step === step;
                    const isCompleted = state.step > step;
                    const stepLabels = ['Info', 'Turnos', 'Equipe'];

                    return (
                        <React.Fragment key={step}>
                            <button
                                type="button"
                                onClick={() => actions.goToStep(step)}
                                className={`flex items-center gap-2 transition-all ${isActive || isCompleted ? 'cursor-pointer' : 'cursor-default opacity-50'
                                    }`}
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${isCompleted
                                    ? 'bg-primary text-white'
                                    : isActive
                                        ? 'bg-primary/20 text-primary border-2 border-primary'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                    {isCompleted ? <Check size={14} strokeWidth={3} /> : step}
                                </div>
                                <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-primary' : 'text-slate-400'
                                    }`}>
                                    {stepLabels[step - 1]}
                                </span>
                            </button>

                            {step < 3 && (
                                <div className={`flex-1 h-0.5 mx-1.5 rounded ${state.step > step ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                                    }`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );

    // Render current step
    const renderStep = () => {
        switch (state.step) {
            case 1:
                return (
                    <StepInfo
                        serviceName={state.serviceName}
                        institution={state.institution}
                        color={state.color}
                        errors={state.errors}
                        touched={state.touched}
                        onUpdate={actions.updateInfo}
                        onOpenInstitutionModal={actions.openInstitutionModal}
                    />
                );
            case 2:
                return (
                    <StepShifts
                        shifts={state.shiftPresets}
                        errors={state.errors}
                        onAdd={() => actions.openShiftModal()}
                        onEdit={actions.openShiftModal}
                        onRemove={actions.removeShift}
                    />
                );
            case 3:
                return (
                    <StepTeam
                        team={state.team}
                        searchQuery={state.searchQuery}
                        searchResults={filteredProfiles}
                        isSearching={state.isSearching}
                        onSearch={actions.setSearchQuery}
                        onAddMember={actions.addMember}
                        onUpdateRoles={actions.updateMemberRoles}
                        onRemoveMember={actions.removeMember}
                        onToggleRole={actions.toggleMemberRole}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity z-10 pointer-events-auto"
                onClick={onClose}
            />

            {/* Main Card */}
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
                                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                    {mode === 'edit' ? 'Editar Serviço' : 'Novo Serviço'}
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    Etapa {state.step} de 3
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Progress */}
                        <WizardProgress />

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
                            {renderStep()}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-between bg-white dark:bg-slate-900">
                            {state.step > 1 ? (
                                <button
                                    type="button"
                                    onClick={actions.prevStep}
                                    className="px-5 py-2.5 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} />
                                    Voltar
                                </button>
                            ) : (
                                <div />
                            )}

                            {state.step < 3 ? (
                                <button
                                    type="button"
                                    onClick={actions.nextStep}
                                    disabled={!canAdvance}
                                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primaryDark disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    Prosseguir
                                    <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={actions.save}
                                    disabled={state.isSaving}
                                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-primaryDark transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {state.isSaving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {mode === 'edit' ? 'Salvar Alterações' : 'Criar Serviço'}
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <StepCompletion
                        serviceName={state.serviceName}
                        group={state.createdGroup}
                        mode={mode}
                        onNavigateToEditor={() => actions.finish(true)}
                        onGoHome={() => actions.finish(false)}
                    />
                )}

                {/* Modals */}
                <InstitutionModal
                    isOpen={state.showInstitutionModal}
                    showNewForm={state.showNewInstForm}
                    searchQuery={state.instSearch}
                    searchResults={state.instSearchResults}
                    formData={state.instForm}
                    onClose={actions.closeInstitutionModal}
                    onSearch={actions.setInstSearch}
                    onSelect={actions.selectInstitution}
                    onShowNewForm={actions.showNewInstForm}
                    onHideNewForm={actions.hideNewInstForm}
                    onUpdateForm={actions.updateInstForm}
                    onSave={actions.saveInstitution}
                />

                <ShiftModal
                    isOpen={state.showShiftModal}
                    shift={state.editingShift}
                    onClose={actions.closeShiftModal}
                    onUpdate={actions.updateEditingShift}
                    onSave={actions.saveShift}
                />
            </div>
        </div>
    );
};

export default ServiceEditor;
