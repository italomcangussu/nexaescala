import React, { useState, useMemo, useEffect } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    AlertTriangle,
    Rocket,
    X,
    User,
    Sun,
    Moon,
    Loader2,
    CloudSun,
    Clock
} from 'lucide-react';
import { Group, Profile, Shift, ShiftAssignment } from '../types';
import { getAllUserAssignmentsAcrossGroups } from '../services/api';
import { useToast } from '../context/ToastContext';

interface DesktopScaleReviewProps {
    group: Group;
    shifts: Shift[];
    assignments: ShiftAssignment[];
    currentDate: Date;
    onBack: () => void;
    onPublish: () => void;
}

interface ConflictInfo {
    shiftId: string;
    conflictingShiftId: string;
    profileId: string;
    profileName: string;
    date: string;
    time: string;
    conflictService: string;
}

const DesktopScaleReview: React.FC<DesktopScaleReviewProps> = ({
    group,
    shifts,
    assignments,
    currentDate,
    onBack,
    onPublish
}) => {
    const { showToast } = useToast();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [externalAssignments, setExternalAssignments] = useState<any[]>([]);
    const [isLoadingConflicts, setIsLoadingConflicts] = useState(true);

    // Load all user assignments across all groups for conflict detection
    useEffect(() => {
        const loadExternalAssignments = async () => {
            setIsLoadingConflicts(true);
            try {
                // Get all profile IDs from current assignments
                const profileIds = Array.from(new Set(assignments.map(a => a.profile_id)));

                // Fetch all assignments for these users across all groups
                const allAssignments = await getAllUserAssignmentsAcrossGroups(profileIds);

                // Filter out assignments from the current group
                const external = allAssignments.filter((a: any) => a.shift?.group_id !== group.id);
                setExternalAssignments(external);
            } catch (error) {
                console.error("Error loading external assignments:", error);
                showToast("Erro ao carregar conflitos entre serviços", "error");
            } finally {
                setIsLoadingConflicts(false);
            }
        };

        if (assignments.length > 0) {
            loadExternalAssignments();
        } else {
            setIsLoadingConflicts(false);
        }
    }, [assignments, group.id, showToast]);

    // Helper function to check time overlap
    const checkTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
        const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        let s1 = parseTime(start1);
        let e1 = parseTime(end1);
        if (e1 < s1) e1 += 1440; // Next day

        let s2 = parseTime(start2);
        let e2 = parseTime(end2);
        if (e2 < s2) e2 += 1440; // Next day

        return s1 < e2 && s2 < e1;
    };

    // --- CONFLICT DETECTION ---
    const { conflictShiftIds, conflictDetails } = useMemo(() => {
        const ids = new Set<string>();
        const details: ConflictInfo[] = [];

        // 1. Internal conflicts (same group, same user, overlapping times)
        const profileAssignmentsMap = new Map<string, Shift[]>();
        assignments.forEach(a => {
            const shift = shifts.find(s => s.id === a.shift_id);
            if (!shift) return;
            if (!profileAssignmentsMap.has(a.profile_id)) {
                profileAssignmentsMap.set(a.profile_id, []);
            }
            profileAssignmentsMap.get(a.profile_id)?.push(shift);
        });

        // Check internal overlaps
        profileAssignmentsMap.forEach((userShifts, profileId) => {
            for (let i = 0; i < userShifts.length; i++) {
                for (let j = i + 1; j < userShifts.length; j++) {
                    const s1 = userShifts[i];
                    const s2 = userShifts[j];
                    if (s1.date === s2.date && checkTimeOverlap(s1.start_time, s1.end_time, s2.start_time, s2.end_time)) {
                        ids.add(s1.id);
                        ids.add(s2.id);

                        const profile = assignments.find(a => a.profile_id === profileId)?.profile;
                        details.push({
                            shiftId: s1.id,
                            conflictingShiftId: s2.id,
                            profileId,
                            profileName: profile?.full_name || 'Desconhecido',
                            date: s1.date,
                            time: `${s1.start_time} x ${s2.start_time}`,
                            conflictService: group.name + ' (Interno)'
                        });
                    }
                }
            }
        });

        // 2. External conflicts (different groups)
        assignments.forEach(assignment => {
            const shift = shifts.find(s => s.id === assignment.shift_id);
            if (!shift) return;

            // Find external assignments for this user on the same date
            const externalConflicts = externalAssignments.filter((ext: any) =>
                ext.profile_id === assignment.profile_id &&
                ext.shift?.date === shift.date &&
                checkTimeOverlap(shift.start_time, shift.end_time, ext.shift.start_time, ext.shift.end_time)
            );

            if (externalConflicts.length > 0) {
                ids.add(shift.id);

                externalConflicts.forEach((ext: any) => {
                    details.push({
                        shiftId: shift.id,
                        conflictingShiftId: ext.shift.id,
                        profileId: assignment.profile_id,
                        profileName: assignment.profile?.full_name || 'Desconhecido',
                        date: shift.date,
                        time: `${shift.start_time}`,
                        conflictService: ext.shift.group?.name || 'Outro Serviço'
                    });
                });
            }
        });

        return { conflictShiftIds: ids, conflictDetails: details };
    }, [shifts, assignments, externalAssignments, group.name]);

    const conflictCount = conflictShiftIds.size;

    // --- STATS CALCULATION ---
    const totalShifts = useMemo(() => shifts.length, [shifts]);

    // --- CALENDAR DATA ---
    const monthDetails = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const days = [];
        for (let i = 0; i < startingDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [currentDate]);

    // Auto-select first day with shifts if none selected
    useEffect(() => {
        if (!selectedDate && shifts.length > 0) {
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

    // --- MEMBER STATS ---
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

    // Get conflicts for selected date
    const selectedDateConflicts = useMemo(() => {
        if (!selectedDate) return [];
        const dateStr = selectedDate.toISOString().split('T')[0];
        return conflictDetails.filter(c => c.date === dateStr);
    }, [selectedDate, conflictDetails]);

    const handlePublishClick = () => {
        if (conflictCount > 0) {
            showToast(`Não é possível publicar: ${conflictCount} conflito(s) detectado(s)`, "error");
            return;
        }
        onPublish();
    };

    return (
        <div className="fixed inset-0 z-80 bg-slate-50 dark:bg-slate-950 flex flex-col animate-fade-in overflow-hidden">
            {/* HEADER */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">
                            <span>Editor</span>
                            <ChevronRight size={10} />
                            <span className="text-emerald-500">Revisão Final</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                            {group.name}<span className="text-emerald-500">.</span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} • Revise conflitos antes de publicar
                        </p>
                    </div>
                </div>

                {isLoadingConflicts && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verificando conflitos...</span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* DASHBOARD GRID */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {/* Stats Cards Column */}
                    <div className="md:col-span-1 lg:col-span-1 space-y-4">
                        {/* Total Shifts Card */}
                        <div
                            onClick={() => setShowStatsModal(true)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total de Plantões</p>
                                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                    <CalendarIcon size={18} />
                                </div>
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-1 group-hover:scale-110 transition-transform origin-left">{totalShifts}</h2>
                            <p className="text-xs text-slate-400">Clique para ver detalhes</p>
                        </div>

                        {/* Conflicts Card */}
                        <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border ${conflictCount > 0 ? 'border-red-300 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/20' : 'border-slate-200 dark:border-slate-800'} shadow-sm transition-all`}>
                            <div className="flex justify-between items-start mb-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Conflitos Encontrados</p>
                                <div className={`p-2 rounded-xl ${conflictCount > 0 ? 'bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                                    <AlertTriangle size={18} />
                                </div>
                            </div>
                            <h2 className={`text-4xl font-black mb-1 ${conflictCount > 0 ? 'text-red-600' : 'text-slate-800 dark:text-white'}`}>
                                {conflictCount.toString().padStart(2, '0')}
                            </h2>
                            <p className="text-xs text-slate-400">{conflictCount > 0 ? 'Verifique os dias marcados' : 'Nenhum conflito detectado'}</p>
                        </div>
                    </div>

                    {/* Calendar View */}
                    <div className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200">Visão Geral do Mês</h3>
                            <div className="flex gap-3">
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                    Com Plantão
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Conflito
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                                <span key={`${d}-${i}`} className="text-xs font-black text-slate-300 dark:text-slate-600">{d}</span>
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
                                            ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105 z-10' :
                                                hasShifts
                                                    ? 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer'
                                                    : 'text-slate-300 dark:text-slate-700 cursor-default opacity-50'}
                                            ${hasConflict && !isSelected ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                                        `}
                                    >
                                        <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>{date.getDate()}</span>
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
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-full">
                                {displayedShifts.length} plantões
                            </span>
                            {selectedDateConflicts.length > 0 && (
                                <span className="text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                                    <AlertTriangle size={12} />
                                    {selectedDateConflicts.length} conflito(s)
                                </span>
                            )}
                        </div>

                        {/* Conflict Warnings for Selected Date */}
                        {selectedDateConflicts.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={16} className="text-red-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">Conflitos Detectados neste Dia</h4>
                                        <div className="space-y-2">
                                            {selectedDateConflicts.map((conflict, idx) => (
                                                <div key={idx} className="text-xs text-red-700 dark:text-red-400 bg-white dark:bg-slate-900/50 rounded-lg p-3 border border-red-200 dark:border-red-900/30">
                                                    <p className="fontbold">
                                                        <User size={12} className="inline mr-1" />
                                                        {conflict.profileName}
                                                    </p>
                                                    <p className="text-red-600 dark:text-red-500 mt-1">
                                                        <Clock size={12} className="inline mr-1" />
                                                        Horário {conflict.time} • Conflita com: <strong>{conflict.conflictService}</strong>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {displayedShifts.map((shift) => {
                                const shiftAssignments = assignments.filter(a => a.shift_id === shift.id);
                                const isNight = shift.start_time >= '18:00' || shift.start_time < '06:00';
                                const Icon = isNight ? Moon : Sun;
                                const hasConflict = conflictShiftIds.has(shift.id);

                                return (
                                    <div key={shift.id} className={`bg-white dark:bg-slate-900 rounded-2xl p-1 border transition-all ${hasConflict ? 'border-red-400 dark:border-red-500 shadow-lg shadow-red-100 dark:shadow-red-950/50' : 'border-slate-200 dark:border-slate-800'}`}>
                                        {/* Shift Header */}
                                        <div className={`
                                            flex items-center justify-between p-3 rounded-xl mb-1
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
                                            {shiftAssignments.length > 0 ? shiftAssignments.map(assignment => {
                                                const assignmentHasConflict = conflictDetails.some(c =>
                                                    c.shiftId === shift.id && c.profileId === assignment.profile_id
                                                );

                                                return (
                                                    <div key={assignment.id} className="flex items-center gap-3">
                                                        <div className="relative">
                                                            {assignment.profile?.avatar_url ? (
                                                                <img src={assignment.profile.avatar_url} className="w-10 h-10 rounded-full object-cover bg-slate-200" alt="avatar" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                                                    {assignment.profile?.full_name?.substring(0, 2).toUpperCase()}
                                                                </div>
                                                            )}
                                                            {assignmentHasConflict && (
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
                                                );
                                            }) : (
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

            {/* STATS MODAL */}
            {showStatsModal && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
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
                                    {memberStats.map((stat) => (
                                        <tr key={stat.profile.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
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
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center gap-3 z-50 shrink-0">
                <div className="text-sm text-slate-500">
                    {conflictCount > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-bold">
                            ⚠️ Resolva os conflitos antes de publicar
                        </span>
                    ) : (
                        <span className="text-emerald-600 font-bold">
                            ✓ Tudo pronto para publicar
                        </span>
                    )}
                </div>
                <button
                    onClick={handlePublishClick}
                    disabled={conflictCount > 0}
                    className={`
                        flex items-center gap-3 px-8 py-3 rounded-xl font-black text-sm shadow-lg transition-all
                        ${conflictCount > 0
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none hover:bg-emerald-500 hover:scale-[1.02]'
                        }
                    `}
                >
                    <Rocket size={20} />
                    Publicar Escala Agora
                </button>
            </div>
        </div>
    );
};

export default DesktopScaleReview;
