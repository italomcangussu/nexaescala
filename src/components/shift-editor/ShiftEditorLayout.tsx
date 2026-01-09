import React from 'react';
import { ArrowLeft, Save, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid } from 'lucide-react';
import { Group, Profile } from '../../types';
import EditorMemberSidebar from './EditorMemberSidebar';
import EditorCalendarGrid from './EditorCalendarGrid';
import { useShiftLogic } from './useShiftLogic';

interface ShiftEditorLayoutProps {
    group: Group;
    currentUser: Profile;
    onBack: () => void;
}

const ShiftEditorLayout: React.FC<ShiftEditorLayoutProps> = ({ group, currentUser, onBack }) => {
    const {
        currentDate,
        nextMonth,
        prevMonth,
        members,
        days,
        shifts,
        assignments,
        isLoading,
        isSaving,
        saveChanges,
        handleAddShift,
        handleAddAssignment,
        handleRemoveAssignment,
        checkConflict
    } = useShiftLogic(group, currentUser);

    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">

            {/* Sidebar */}
            <EditorMemberSidebar members={members} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0">

                {/* Header */}
                <header className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">Editor de Escala</h2>
                            <span className="text-xs text-slate-500 font-medium">{group.name}</span>
                        </div>

                        {/* Month Navigation */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 ml-6">
                            <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-slate-300">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-4 text-sm font-bold text-slate-700 dark:text-slate-200 capitalize min-w-[140px] text-center">
                                {monthName}
                            </span>
                            <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-slate-300">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <Grid size={18} />
                            <span>Visualizar</span>
                        </button>
                        <button
                            onClick={saveChanges}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} />
                            <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
                        </button>
                    </div>
                </header>

                {/* Calendar Grid Area */}
                <div className="flex-1 overflow-auto p-6 relative">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-4 mb-4">
                        {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</div>
                        ))}
                    </div>

                    <EditorCalendarGrid
                        days={days}
                        shifts={shifts}
                        assignments={assignments}
                        members={members.map(gm => gm.profile)}
                        onDrop={handleAddAssignment}
                        onRemoveAssignment={handleRemoveAssignment}
                        onAddShift={handleAddShift}
                        checkConflict={checkConflict}
                    />
                </div>
            </div>
        </div>
    );
};

export default ShiftEditorLayout;
