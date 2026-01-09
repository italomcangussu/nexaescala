import React, { useState } from 'react';
import { ArrowLeft, Save, ChevronLeft, ChevronRight, Grid } from 'lucide-react';
import { Group, Profile, GroupMember, Shift, ShiftAssignment } from '../../types';
import EditorMemberSidebar from './EditorMemberSidebar';
import EditorCalendarGrid from './EditorCalendarGrid';
import { useShiftLogic } from './useShiftLogic';
import EditShiftModal from './EditShiftModal';
import MemberActionModal from './MemberActionModal';

interface ShiftEditorLayoutProps {
    group: Group;
    currentUser: Profile;
    onBack: () => void;
}

const ShiftEditorLayout: React.FC<ShiftEditorLayoutProps> = ({ group, onBack }) => {
    const {
        currentDate,
        nextMonth,
        prevMonth,
        members,
        days,
        shifts,
        assignments,
        isSaving,
        isPublishing,
        saveChanges,
        publishScale,
        handleAddShift,
        handleAddAssignment,
        handleRemoveAssignment,
        checkConflict,
        updateShiftDetails,
        removeMemberFromShift,
        swapMemberInShift
    } = useShiftLogic(group);

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
    const [pendingShiftTarget, setPendingShiftTarget] = useState<{ date: string, shiftId: string } | null>(null);

    // UI States for Modals
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [memberActionTarget, setMemberActionTarget] = useState<{ assignment: ShiftAssignment, member: Profile } | null>(null);
    const [swappingAssignment, setSwappingAssignment] = useState<ShiftAssignment | null>(null);

    const handleOpenMemberPicker = (date: string, shiftId: string) => {
        setPendingShiftTarget({ date, shiftId });
        setIsSidebarOpen(true);
    };

    // Handlers passed to Grid
    const handleEditShiftRequest = (shift: Shift) => {
        setEditingShift(shift);
    };

    const handleMemberClickRequest = (assignment: ShiftAssignment) => {
        const member = members.find(m => m.profile.id === assignment.profile_id)?.profile;
        if (member) {
            setMemberActionTarget({ assignment, member });
        }
    };

    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return (
        <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">

            {/* Sidebar (Desktop: Fixed, Mobile: Drawer) */}
            <div className={`
                fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <EditorMemberSidebar
                    members={members}
                    onDragStart={() => {
                        // Desktop drag start
                        if (window.innerWidth < 768) {
                            setIsSidebarOpen(false); // Close sidebar on mobile drag (less common but good fallback)
                        }
                    }}
                    selectedMember={selectedMember}
                    onSelectMember={(member) => {
                        if (pendingShiftTarget) {
                            handleAddAssignment(pendingShiftTarget.date, pendingShiftTarget.shiftId, member.profile.id);
                            setPendingShiftTarget(null);
                        } else if (swappingAssignment) {
                            swapMemberInShift(swappingAssignment, member.profile.id);
                            setSwappingAssignment(null);
                        } else {
                            setSelectedMember(member);
                        }
                        setIsSidebarOpen(false); // Close sidebar on selection for mobile flow
                    }}
                />

                {/* Instructions for Reverse Assignment / Swap */}
                {(pendingShiftTarget || swappingAssignment) && (
                    <div className="absolute top-20 left-0 right-0 bg-primary text-white p-3 text-xs font-bold z-[40] animate-bounce-slow flex items-center justify-between shadow-lg">
                        <span>{swappingAssignment ? 'Escolha o substituto' : 'Escolha um médico para escalar neste turno'}</span>
                        <button onClick={() => { setPendingShiftTarget(null); setSwappingAssignment(null); }} className="p-1 hover:bg-white/20 rounded">
                            <Save size={14} /> {/* X icon replacement */}
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Overlay for Sidebar */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full min-w-0">

                {/* Header */}
                <header className="px-4 md:px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm z-10 shrink-0 gap-2">
                    <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex flex-col min-w-0">
                            <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-white leading-tight truncate">Editor de Escala</h2>
                            <span className="text-xs text-slate-500 font-medium truncate hidden md:block">{group.name}</span>
                        </div>

                        {/* Month Navigation - Mobile Compact */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 ml-2 md:ml-6 shrink-0">
                            <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-slate-300">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="px-2 md:px-4 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-200 capitalize w-[90px] md:min-w-[140px] text-center truncate">
                                {monthName}
                            </span>
                            <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-slate-600 dark:text-slate-300">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mobile: Toggle Sidebar */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className={`md:hidden flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-xl transition-colors ${selectedMember ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-slate-100 text-slate-600'}`}
                        >
                            <Grid size={18} />
                            <span className="hidden sm:inline">Equipe</span>
                            {selectedMember && (
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            )}
                        </button>

                        <button
                            onClick={saveChanges}
                            disabled={isSaving || isPublishing}
                            className="flex items-center gap-2 px-4 md:px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 border border-slate-200 dark:border-slate-700"
                        >
                            <Save size={18} />
                            <span className="hidden sm:inline">{isSaving ? 'Salvando...' : 'Salvar Rascunho'}</span>
                        </button>
                    </div>
                </header>

                {/* Selected Member Indicator (Mobile) */}
                {
                    selectedMember && (
                        <div className="md:hidden bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary">Selecionado:</span>
                                <div className="flex items-center gap-2">
                                    <img src={selectedMember.profile.avatar_url} className="w-5 h-5 rounded-full" alt="" />
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{selectedMember.profile.full_name}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600"
                            >
                                Cancelar
                            </button>
                        </div>
                    )
                }


                {/* Calendar Grid Area */}
                <div className="flex-1 overflow-auto p-2 md:p-6 relative">
                    {/* Weekday Headers - Hidden on mobile if stacking */}
                    <div className="hidden md:grid grid-cols-7 gap-4 mb-4">
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
                        onAddShift={handleAddShift}
                        checkConflict={checkConflict}
                        selectedMember={selectedMember} // Pass selected member
                        onSelectAssignment={(date, shiftId) => {
                            if (selectedMember) {
                                handleAddAssignment(date, shiftId, selectedMember.profile.id);
                                // Optional: Clear selection after assignment?
                                // setSelectedMember(null);
                            }
                        }}
                        onOpenMemberPicker={handleOpenMemberPicker}
                        pendingShiftTarget={pendingShiftTarget}
                        // New handlers
                        onEditShift={handleEditShiftRequest}
                        onMemberClick={handleMemberClickRequest}
                    />
                </div>

                {/* Floating Publish Button */}
                <div className="fixed bottom-6 left-0 right-0 px-6 z-20 flex justify-center pointer-events-none">
                    <button
                        onClick={() => {
                            if (window.confirm("Tem certeza que deseja publicar a escala? Ela ficará visível para todos os membros.")) {
                                publishScale();
                            }
                        }}
                        disabled={isSaving || isPublishing}
                        className="pointer-events-auto flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-[0_8px_25px_-5px_rgba(16,185,129,0.5)] hover:bg-emerald-700 hover:shadow-emerald-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 group"
                    >
                        <div className={`w-2 h-2 rounded-full bg-white ${isPublishing ? 'animate-ping' : 'animate-pulse'}`} />
                        <span className="text-base tracking-tight">{isPublishing ? 'Publicando...' : 'Publicar Escala'}</span>
                        <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

                {/* Modals */}
                {editingShift && (
                    <EditShiftModal
                        shift={editingShift}
                        onClose={() => setEditingShift(null)}
                        onSave={updateShiftDetails}
                    // onDelete={} // Not implemented in logic yet, optional
                    />
                )}

                {memberActionTarget && (
                    <MemberActionModal
                        member={memberActionTarget.member}
                        onClose={() => setMemberActionTarget(null)}
                        onRemove={() => removeMemberFromShift(memberActionTarget.assignment)}
                        onSwap={() => {
                            setSwappingAssignment(memberActionTarget.assignment);
                            setIsSidebarOpen(true); // Open sidebar to pick new member
                        }}
                    />
                )}
            </div >
        </div >
    );
};

export default ShiftEditorLayout;
