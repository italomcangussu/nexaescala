import React, { useState, useMemo } from 'react';
import {
    ChevronRight,
    Calendar as CalendarIcon,
    AlertTriangle,
    Clock,
    Filter,
    Share2,
    Sun,
    CloudSun,
    Moon,
    Rocket,
    Plus,
    X,
    User,
    ChevronLeft,
    CheckCircle2
} from 'lucide-react';
import { Group, Profile, Shift, ShiftAssignment } from '../types';

interface ScalePublicationViewProps {
    group: Group;
    currentUser: Profile;
    shifts: Shift[];
    assignments: ShiftAssignment[];
    currentDate: Date;
    onBack: () => void;
    onPublish: () => void;
}

const ScalePublicationView: React.FC<ScalePublicationViewProps> = ({
    group,
    currentUser,
    shifts,
    assignments,
    currentDate,
    onBack,
    onPublish
}) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showStatsModal, setShowStatsModal] = useState(false);

    // --- CONFLICT LOGIC ---
    // 1. Internal Overlaps (Same Group)
    const checkOverlap = (s1: Shift, s2: Shift) => {
        if (s1.date !== s2.date) return false;
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };
        const start1 = parseTime(s1.start_time);
        let end1 = parseTime(s1.end_time);
        if (end1 < start1) end1 += 1440;

        const start2 = parseTime(s2.start_time);
        let end2 = parseTime(s2.end_time);
        if (end2 < start2) end2 += 1440;

        return start1 < end2 && start2 < end1;
    };

    const conflictShiftIds = useMemo(() => {
        const ids = new Set<string>();
        const profileAssignmentsMap = new Map<string, Shift[]>();

        assignments.forEach(a => {
            const shift = shifts.find(s => s.id === a.shift_id);
            if (!shift) return;
            if (!profileAssignmentsMap.has(a.profile_id)) {
                profileAssignmentsMap.set(a.profile_id, []);
            }
            profileAssignmentsMap.get(a.profile_id)?.push(shift);
        });

        profileAssignmentsMap.forEach(userShifts => {
            for (let i = 0; i < userShifts.length; i++) {
                for (let j = i + 1; j < userShifts.length; j++) {
                    if (checkOverlap(userShifts[i], userShifts[j])) {
                        ids.add(userShifts[i].id);
                        ids.add(userShifts[j].id);
                    }
                }
            }
        });
        return ids;
    }, [shifts, assignments]);

    // --- STATS CALCULATION ---
    const totalShifts = useMemo(() => shifts.length, [shifts]);
    const conflictCount = conflictShiftIds.size;

    // --- CALENDAR DATA ---
    const monthDetails = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay(); // 0 = Sun

        const days = [];
        for (let i = 0; i < startingDay; i++) days.push(null); // Empty slots
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [currentDate]);

    // Auto-select first day with shifts if none selected
    React.useEffect(() => {
        if (!selectedDate && shifts.length > 0) {
            // Find first shift date
            const sortedShifts = [...shifts].sort((a, b) => a.date.localeCompare(b.date));
            if (sortedShifts[0]) {
                const parts = sortedShifts[0].date.split('-').map(Number);
                setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
            }
        }
    }, [shifts, selectedDate]);


    // --- FILTERED SHIFTS (By Selected Date) ---
    const displayedShifts = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = selectedDate.toISOString().split('T')[0];
        return shifts.filter(s => s.date === dateStr).sort((a, b) => a.start_time.localeCompare(b.start_time));
    }, [selectedDate, shifts]);

    // --- MEMBER STATS (For Modal) ---
    const memberStats = useMemo(() => {
        const stats = new Map<string, {
            profile: Profile,
            total: number,
            morning: number,
            afternoon: number,
            night: number
        }>();

        assignments.forEach(a => {
            if (!a.profile) return;
            const shift = shifts.find(s => s.id === a.shift_id);
            if (!shift) return;

            if (!stats.has(a.profile.id)) {
                stats.set(a.profile.id, {
                    profile: a.profile,
                    total: 0,
                    morning: 0,
                    afternoon: 0,
                    night: 0
                });
            }

            const entry = stats.get(a.profile.id)!;
            entry.total++;

            const start = parseInt(shift.start_time.split(':')[0]);
            if (start >= 6 && start < 12) entry.morning++;
            else if (start >= 12 && start < 18) entry.afternoon++;
            else entry.night++;
        });

        return Array.from(stats.values()).sort((a, b) => b.total - a.total);
    }, [assignments, shifts]);


    return (
        <div className="fixed inset-0 z-[80] bg-slate-50 dark:bg-black flex flex-col animate-fade-in overflow-hidden">

            {/* HEADER */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm z-20">
                <div>
                    <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                        <span>Escalas</span>
                        <ChevronRight size={10} />
                        <span className="text-emerald-500">Revisão Final</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                        {group.name}<span className="text-emerald-500">.</span>
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} • Revise conflitos antes de publicar.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onBack} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                        <Share2 size={14} /> Partilhar
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">

                {/* DASHBOARD GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">

                    {/* Stats Cards Column */}
                    <div className="md:col-span-1 lg:col-span-1 space-y-4">
                        {/* Total Shifts Card */}
                        <div
                            onClick={() => setShowStatsModal(true)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total de Plantões</p>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                    <CalendarIcon size={18} />
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-1 group-hover:scale-110 transition-transform origin-left">{totalShifts}</h2>
                            <p className="text-xs text-slate-400">Toque para ver detalhes</p>
                        </div>

                        {/* Conflicts Card */}
                        <div className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border ${conflictCount > 0 ? 'border-red-200 dark:border-red-900/50 bg-red-50/10' : 'border-slate-100 dark:border-slate-800'} shadow-sm transition-all`}>
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Conflitos Encontrados</p>
                                <div className={`p-2 rounded-xl ${conflictCount > 0 ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                                    <AlertTriangle size={18} />
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-1">{conflictCount.toString().padStart(2, '0')}</h2>
                            <p className="text-xs text-slate-400">{conflictCount > 0 ? 'Verifique os dias marcados' : 'Nenhum conflito detectado'}</p>
                        </div>
                    </div>

                    {/* Calendar View (Centerpiece) */}
                    <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200">Visão Geral do Mês</h3>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-full bg-emerald-400"></div>Com Plantão</div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-full bg-red-400"></div>Conflito</div>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                                <span key={d} className="text-xs font-black text-slate-300 dark:text-slate-600">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {monthDetails.map((date, i) => {
                                if (!date) return <div key={i} className="aspect-square" />;
                                const dateStr = date.toISOString().split('T')[0];
                                const hasShifts = shifts.some(s => s.date === dateStr);
                                const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr;
                                const hasConflict = shifts.some(s => s.date === dateStr && conflictShiftIds.has(s.id));

                                return (
                                    <button
                                        key={i}
                                        onClick={() => hasShifts && setSelectedDate(date)}
                                        disabled={!hasShifts}
                                        className={`
                                            aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all
                                            ${isSelected ? 'bg-slate-800 text-white shadow-lg scale-105 z-10' :
                                                hasShifts
                                                    ? 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                                                    : 'text-slate-300 dark:text-slate-700 cursor-default opacity-50'}
                                            ${hasConflict && !isSelected ? 'ring-2 ring-red-400 bg-red-50 dark:bg-red-900/20' : ''}
                                        `}
                                    >
                                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{date.getDate()}</span>
                                        {/* Status Dots */}
                                        <div className="flex gap-0.5 mt-1 h-1.5">
                                            {hasConflict && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                                            {!hasConflict && hasShifts && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SELECTED DATE DETAILS */}
                {selectedDate && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white capitalize">
                                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h3>
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-full">
                                {displayedShifts.length} plantões
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayedShifts.map((shift) => {
                                const shiftAssignments = assignments.filter(a => a.shift_id === shift.id);
                                const isNight = shift.start_time >= '18:00' || shift.start_time < '06:00';
                                const Icon = isNight ? Moon : Sun;
                                const hasConflict = conflictShiftIds.has(shift.id);

                                return (
                                    <div key={shift.id} className={`bg-white dark:bg-slate-900 rounded-3xl p-1 border transition-all ${hasConflict ? 'border-red-400 dark:border-red-500 shadow-red-100' : 'border-slate-100 dark:border-slate-800'}`}>
                                        {/* Shift Header */}
                                        <div className={`
                                            flex items-center justify-between p-3 rounded-2xl mb-1
                                            ${isNight ? 'bg-slate-800 text-blue-100' : 'bg-slate-50 text-orange-600'}
                                        `}>
                                            <div className="flex items-center gap-2">
                                                <Icon size={14} />
                                                <span className="text-xs font-black">{shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}</span>
                                            </div>
                                            <span className="text-[10px] font-bold opacity-70 tracking-wider">
                                                {shift.code}
                                            </span>
                                        </div>

                                        {/* Assignments List */}
                                        <div className="p-3 space-y-2">
                                            {shiftAssignments.length > 0 ? shiftAssignments.map(assignment => (
                                                <div key={assignment.id} className="flex items-center gap-3">
                                                    <div className="relative">
                                                        {assignment.profile?.avatar_url ? (
                                                            <img src={assignment.profile.avatar_url} className="w-10 h-10 rounded-full object-cover bg-slate-200" alt="avatar" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                                                {assignment.profile?.full_name?.substring(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        {hasConflict && (
                                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-full border-2 border-white text-[8px] font-bold" title="Conflito detectado">!</div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{assignment.profile?.full_name}</p>
                                                        <p className="text-[10px] text-slate-400 truncate">{assignment.profile?.specialty || 'Plantonista'}</p>
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${assignment.is_confirmed ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                                                        {assignment.is_confirmed ? 'OK' : 'PND'}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="flex flex-col items-center justify-center py-4 text-slate-300">
                                                    <User size={20} className="mb-1 opacity-50" />
                                                    <span className="text-[10px] font-bold">Vaga Aberta</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* TOTAL SHIFTS DETAIL MODAL */}
            {showStatsModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Resumo de Escalação</h3>
                            <button onClick={() => setShowStatsModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider">Profissional</th>
                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Manhã</th>
                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Tarde</th>
                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Noite</th>
                                        <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {memberStats.map((stat, i) => (
                                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                                        {stat.profile.full_name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{stat.profile.full_name}</p>
                                                        <p className="text-[10px] text-slate-400">{stat.profile.specialty || 'Generalista'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {stat.morning > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-50 text-orange-600 text-xs font-bold">
                                                        <Sun size={10} /> {stat.morning}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {stat.afternoon > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-600 text-xs font-bold">
                                                        <CloudSun size={10} /> {stat.afternoon}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                {stat.night > 0 ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs font-bold">
                                                        <Moon size={10} /> {stat.night}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <span className="text-sm font-black text-emerald-600">{stat.total}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 flex justify-end gap-3 z-50">
                <button
                    onClick={onPublish}
                    className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-500 hover:scale-[1.02] transition-all"
                >
                    <Rocket size={20} />
                    Publicar Escala Agora
                </button>
            </div>

        </div>
    );
};

export default ScalePublicationView;
