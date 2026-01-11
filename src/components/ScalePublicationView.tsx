import React from 'react';
import {
    
    ChevronRight,
    Calendar,
    AlertTriangle,
    Clock,
    Filter,
    Share2,
    Sun,
    CloudSun,
    Moon,
    
    
    
    
    Rocket,
    Plus
} from 'lucide-react';
import { Group, Profile, Shift, ShiftAssignment } from '../types';

interface ScalePublicationViewProps {
    group: Group;
    currentUser: Profile;
    shifts: Shift[];
    assignments: ShiftAssignment[];
    onBack: () => void;
    onPublish: () => void;
}

const ScalePublicationView: React.FC<ScalePublicationViewProps> = ({
    group,
    currentUser,
    shifts,
    assignments,
    onBack,
    onPublish
}) => {
    const [activeTurn, setActiveTurn] = React.useState<'Manhã' | 'Tarde' | 'Noite'>('Manhã');

    // Helper to check for overlaps
    const checkOverlap = (s1: Shift, s2: Shift) => {
        if (s1.date !== s2.date) {
            // Handle cross-day shifts if necessary, but usually conflicts are on same date or overlapping nights
            // For simplicity, let's start with same-day overlaps
            return false;
        }

        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const start1 = parseTime(s1.start_time);
        let end1 = parseTime(s1.end_time);
        if (end1 < start1) end1 += 1440; // Crosses midnight

        const start2 = parseTime(s2.start_time);
        let end2 = parseTime(s2.end_time);
        if (end2 < start2) end2 += 1440; // Crosses midnight

        return start1 < end2 && start2 < end1;
    };

    // Find conflicts
    const profileAssignmentsMap = new Map<string, Shift[]>();

    assignments.forEach(a => {
        const shift = shifts.find(s => s.id === a.shift_id);
        if (!shift) return;

        if (!profileAssignmentsMap.has(a.profile_id)) {
            profileAssignmentsMap.set(a.profile_id, []);
        }
        profileAssignmentsMap.get(a.profile_id)?.push(shift);
    });

    const conflictShiftIds = new Set<string>();
    profileAssignmentsMap.forEach(userShifts => {
        for (let i = 0; i < userShifts.length; i++) {
            for (let j = i + 1; j < userShifts.length; j++) {
                if (checkOverlap(userShifts[i], userShifts[j])) {
                    conflictShiftIds.add(userShifts[i].id);
                    conflictShiftIds.add(userShifts[j].id);
                }
            }
        }
    });

    // Stats calculation
    const totalShifts = shifts.length;
    const conflictCount = conflictShiftIds.size;

    // Hours calculation
    const totalMinutes = shifts.reduce((acc, s) => {
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const start = parseTime(s.start_time);
        let end = parseTime(s.end_time);
        if (end < start) end += 1440;
        return acc + (end - start);
    }, 0);
    const totalHours = Math.round(totalMinutes / 60);

    const stats = [
        { label: 'TOTAL DE PLANTÕES', value: totalShifts.toString(), icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
        { label: 'CONFLITOS ENCONTRADOS', value: conflictCount.toString().padStart(2, '0'), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', isError: conflictCount > 0 },
        { label: 'CARGA HORÁRIA', value: `${totalHours}h`, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    ];

    const turns = [
        { label: 'Manhã', range: '06:00 - 12:00', count: shifts.filter(s => s.start_time >= '06:00' && s.start_time < '12:00').length, icon: Sun },
        { label: 'Tarde', range: '12:00 - 18:00', count: shifts.filter(s => s.start_time >= '12:00' && s.start_time < '18:00').length, icon: CloudSun },
        { label: 'Noite', range: '18:00 - 06:00', count: shifts.filter(s => s.start_time >= '18:00' || s.start_time < '06:00').length, icon: Moon },
    ];

    // Filtered shifts for display
    const filteredShifts = shifts.filter(s => {
        if (activeTurn === 'Manhã') return s.start_time >= '06:00' && s.start_time < '12:00';
        if (activeTurn === 'Tarde') return s.start_time >= '12:00' && s.start_time < '18:00';
        return s.start_time >= '18:00' || s.start_time < '06:00';
    }).sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));


    // Get distinct profile IDs from assignments for the footer
    const uniqueProfileIds = Array.from(new Set(assignments.map(a => a.profile_id)));
    const footerProfiles = assignments
        .filter((a, i, self) => self.findIndex(t => t.profile_id === a.profile_id) === i)
        .slice(0, 3)
        .map(a => ({
            initials: a.profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??',
            color: 'bg-primary'
        }));

    const extraCount = uniqueProfileIds.length > 3 ? `+${uniqueProfileIds.length - 3}` : null;


    return (
        <div className="fixed inset-0 z-[80] bg-slate-50 dark:bg-black flex flex-col animate-fade-in">

            {/* Top Header - Breadcrumbs & Main Actions */}
            <div className="px-6 pt-6 pb-4 bg-white dark:bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">
                    <span>Escalas</span>
                    <ChevronRight size={10} />
                    <span className="text-emerald-500">Revisão Final</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                            {group.name}<span className="text-emerald-500">.</span>
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Outubro 12 - 18, 2026. Revise conflitos antes de publicar.
                        </p>
                    </div>

                    <div className="hidden md:flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                            <Filter size={16} />
                            Filtrar Data
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all">
                            <Share2 size={16} />
                            Compartilhar
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-32">
                {/* Horizontal Stats - Mobile Scrollable */}
                <div className="flex gap-4 overflow-x-auto px-6 py-4 no-scrollbar">
                    {stats.map((stat, idx) => (
                        <div
                            key={idx}
                            className={`min-w-[200px] flex-1 bg-white dark:bg-slate-900 p-5 rounded-3xl border ${stat.isError ? 'border-red-100 dark:border-red-900/30' : 'border-slate-100 dark:border-slate-800'} shadow-sm relative overflow-hidden`}
                        >
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1">{stat.label}</p>
                            <div className="grow flex items-end justify-between">
                                <span className={`text-3xl font-black ${stat.isError ? 'text-slate-800 dark:text-white' : 'text-slate-800 dark:text-white'}`}>
                                    {stat.value}
                                </span>
                                <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                                    <stat.icon size={20} strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons - Mobile Version */}
                <div className="md:hidden flex gap-2 px-6 mb-6">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm shadow-sm">
                        <Filter size={16} />
                        Filtrar
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-800 font-bold text-sm shadow-sm">
                        <Share2 size={16} />
                        Partilhar
                    </button>
                </div>

                {/* Turn Selectors */}
                <div className="px-6 mb-8">
                    <div className="flex gap-6 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
                        {turns.map((turn, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveTurn(turn.label as any)}
                                className={`flex items-center gap-3 pb-3 relative transition-all min-w-fit ${activeTurn === turn.label ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
                            >
                                <div className={`p-1.5 rounded-lg ${activeTurn === turn.label ? 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 font-bold' : ''}`}>
                                    <turn.icon size={18} />
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm leading-tight flex items-center gap-2">
                                        {turn.label}
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-500">{turn.count}</span>
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider leading-tight">{turn.range}</p>
                                </div>
                                {activeTurn === turn.label && (
                                    <div className="absolute bottom-[-1px] left-0 right-0 h-1 bg-emerald-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Shifts Grid/List */}
                <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredShifts.map((shift, idx) => {
                        const shiftAssignments = assignments.filter(a => a.shift_id === shift.id);
                        // If multiple people in one shift, we show multiple cards OR we can group them.
                        // The design shows one card per assignment/person usually.

                        return shiftAssignments.length > 0 ? shiftAssignments.map((assignment, aidx) => {
                            const hasConflict = conflictShiftIds.has(shift.id);
                            const formattedDate = new Date(shift.date + 'T12:00:00')
                                .toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
                                .toUpperCase();

                            const initials = assignment.profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
                            const specialty = assignment.profile?.specialty || 'Profissional';

                            return (
                                <div
                                    key={`${idx}-${aidx}`}
                                    className={`
                            relative bg-white dark:bg-slate-900 p-5 rounded-[2rem] border transition-all duration-300
                            ${hasConflict
                                            ? 'border-red-400 dark:border-red-600 shadow-[0_10px_40px_-10px_rgba(239,68,68,0.2)]'
                                            : 'border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md'}
                          `}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                            {formattedDate}
                                        </span>
                                        <div className={`
                                    px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter
                                    ${hasConflict ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                assignment.is_confirmed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}
                                `}>
                                            {hasConflict ? 'CONFLITO' : assignment.is_confirmed ? 'CONFIRMADO' : 'PENDENTE'}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center font-black text-sm text-white
                                    ${hasConflict ? 'bg-red-400' : 'bg-emerald-500'}
                                `}>
                                            {initials}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-slate-100">{assignment.profile?.full_name}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                                {hasConflict ? 'Sobreposição detectada' : `${specialty} ${assignment.profile?.crm ? `• CRM ${assignment.profile.crm}` : ''}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div key={idx} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm opacity-60">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        {new Date(shift.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).toUpperCase()}
                                    </span>
                                    <div className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-400">
                                        VAZIO
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 text-slate-300">
                                        <Plus size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-400 italic">Vaga em aberto</p>
                                        <p className="text-xs text-slate-300">Nenhum profissional escalado</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add Shift Placeholder Card */}
                    <button className="flex flex-col items-center justify-center p-5 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all min-h-[140px] group">
                        <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 group-hover:text-emerald-500 transition-colors mb-2">
                            <Plus size={24} />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Adicionar Plantão</span>
                    </button>
                </div>

            </div>

            {/* Footer Bar - Sticky Bottom */}
            <div className="fixed bottom-0 inset-x-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 p-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4 z-50">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex -space-x-2">
                        {footerProfiles.map((p, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-white ${p.color}`}>
                                {p.initials}
                            </div>
                        ))}
                        {extraCount && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-white bg-slate-400">
                                {extraCount}
                            </div>
                        )}
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span className="text-slate-800 dark:text-white">{uniqueProfileIds.length} profissionais</span> alocados nesta semana
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={onBack}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-slate-600 dark:text-slate-300 font-black text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        Voltar ao Editor
                    </button>
                    <button
                        onClick={onPublish}
                        className="flex-[2] md:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-500 hover:scale-[1.02] transition-all"
                    >
                        <Rocket size={20} />
                        Publicar Escala Agora
                    </button>
                </div>
            </div>

        </div>
    );
};

export default ScalePublicationView;
