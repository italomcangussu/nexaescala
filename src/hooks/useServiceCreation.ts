import React, { useState, useEffect } from 'react';
import { Profile, ServiceRole, ShiftPreset, Group, AppRole } from '../types';
import { createService, addGroupMember, searchInstitutions, searchProfiles, createShift, createShiftPresetsBulk } from '../services/api';

export const useServiceCreation = (currentUser: Profile, onFinish: (group?: Group, navigate?: boolean) => void) => {
    const [step, setStep] = useState(1);

    // Step 1: Info
    const [serviceName, setServiceName] = useState('');
    const [institution, setInstitution] = useState('');
    const [color, setColor] = useState('#059669');

    // Step 2: Shifts
    const [shifts, setShifts] = useState<ShiftPreset[]>([
        { id: '1', code: 'MT', start_time: '07:00', end_time: '19:00', quantity_needed: 1 },
        { id: '2', code: 'SN', start_time: '19:00', end_time: '07:00', quantity_needed: 1 },
    ]);

    // Step 3: Team
    const [team, setTeam] = useState<{ profile: Profile; role: ServiceRole }[]>([
        { profile: currentUser, role: ServiceRole.ADMIN }
    ]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [isSearchingMembers, setIsSearchingMembers] = useState(false);

    // Modals inside Wizard
    const [showInstitutionModal, setShowInstitutionModal] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [editingShift, setEditingShift] = useState<Partial<ShiftPreset> | null>(null);
    const [showCompletion, setShowCompletion] = useState(false);

    const [instForm, setInstForm] = useState({ name: '', city: '', state: '', phone: '' });
    const [instSearch, setInstSearch] = useState('');
    const [instSearchResults, setInstSearchResults] = useState<string[]>([]); // Real results
    const [showNewInstForm, setShowNewInstForm] = useState(false);
    const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Debounce search Institutions
    useEffect(() => {
        const timer = setTimeout(() => {
            if (instSearch.length >= 2) {
                searchInstitutions(instSearch).then(setInstSearchResults);
            } else {
                setInstSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [instSearch]);

    // Debounce search Profiles
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                setIsSearchingMembers(true);
                try {
                    const results = await searchProfiles(searchQuery);
                    setSearchResults(results);
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsSearchingMembers(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleNext = (e?: React.MouseEvent) => {
        console.log('[DEBUG] handleNext called, current step:', step);
        e?.preventDefault();
        e?.stopPropagation();
        if (step < 3) {
            console.log('[DEBUG] Moving to step:', step + 1);
            setStep(step + 1);
        }
    };

    const handlePrev = () => {
        if (step > 1) setStep(step - 1);
    };

    const saveInstitution = () => {
        setInstitution(instForm.name);
        setShowInstitutionModal(false);
    };

    const saveShift = () => {
        if (editingShift && editingShift.code && editingShift.start_time && editingShift.end_time) {
            let newShifts;
            if (editingShift.id) {
                newShifts = shifts.map(s => s.id === editingShift.id ? editingShift as ShiftPreset : s);
            } else {
                newShifts = [...shifts, { ...editingShift, id: Date.now().toString() } as ShiftPreset]
            }
            setShifts(newShifts);
            setShowShiftModal(false);
            setEditingShift(null);
        }
    };

    const removeShift = (id: string) => {
        setShifts(prev => prev.filter(s => s.id !== id));
    }

    const addMember = (profile: Profile, role: ServiceRole) => {
        if (!team.some(m => m.profile.id === profile.id)) {
            setTeam([...team, { profile, role }]);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleCreateService = async () => {
        setIsSaving(true);
        try {
            // 1. Create Group
            const newGroup = await createService(currentUser.id, serviceName, institution, color);

            // 2. Add Owner as Admin
            await addGroupMember(newGroup.id, currentUser.id, 'gestor', ServiceRole.ADMIN);

            // 3. Add Other Members in Parallel
            const memberPromises = team
                .filter(member => member.profile.id !== currentUser.id)
                .map(member => {
                    // Map ServiceRole to AppRole
                    let appRole = AppRole.MEDICO;
                    if (member.role === ServiceRole.ADMIN) appRole = AppRole.GESTOR;
                    if (member.role === ServiceRole.ADMIN_AUX) appRole = AppRole.AUXILIAR;

                    return addGroupMember(newGroup.id, member.profile.id, appRole, member.role);
                });

            await Promise.all(memberPromises);

            // 3.1. Save Shift Presets
            await createShiftPresetsBulk(newGroup.id, shifts.map(s => ({
                code: s.code,
                start_time: s.start_time,
                end_time: s.end_time,
                quantity_needed: s.quantity_needed ?? 1
            })));

            // 4. Generate Shifts for CURRENT Month (remaining days) AND NEXT Month
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();

            const monthsToGenerate = [
                { year: currentYear, month: currentMonth }, // Current
                { year: currentMonth === 11 ? currentYear + 1 : currentYear, month: currentMonth === 11 ? 0 : currentMonth + 1 } // Next
            ];

            const shiftPromises: Promise<any>[] = [];

            for (const { year, month } of monthsToGenerate) {
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                for (let day = 1; day <= daysInMonth; day++) {
                    // Skip past days if dealing with current month
                    if (year === currentYear && month === currentMonth && day < now.getDate()) {
                        continue;
                    }

                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                    // Create each shift preset for this day
                    for (const preset of shifts) {
                        shiftPromises.push(createShift({
                            group_id: newGroup.id,
                            date: dateStr,
                            start_time: preset.start_time,
                            end_time: preset.end_time,
                            quantity_needed: preset.quantity_needed || 2, // Use preset quantity
                            is_published: false // Draft mode
                        }));
                    }
                }
            }

            await Promise.all(shiftPromises);

            // Construct the group object with members for the UI
            const createdGroupWithMembers: Group = {
                ...newGroup,
                members: team.map((t, index) => {
                    // Map ServiceRole to AppRole
                    let appRole = AppRole.MEDICO;
                    if (t.role === ServiceRole.ADMIN) appRole = AppRole.GESTOR;
                    if (t.role === ServiceRole.ADMIN_AUX) appRole = AppRole.AUXILIAR;

                    return {
                        id: `temp-member-${index}`, // We don't have the real ID yet, but that's okay for UI
                        group_id: newGroup.id,
                        profile: t.profile,
                        role: appRole,
                        service_role: t.role,
                        joined_at: new Date().toISOString()
                    };
                })
            };

            setCreatedGroup(createdGroupWithMembers);
            setShowCompletion(true);
        } catch (err: any) {
            console.error('Error creating service:', err);
            const errorMsg = err.message || 'Erro desconhecido ao criar serviço.';
            const errorDetails = err.details || err.hint || '';
            // It's better to use a proper toast notification here if available, 
            // but for now we'll stick to alert as a fallback or a state to show error in UI.
            alert(`Falha ao criar serviço:\n${errorMsg}\n${errorDetails}`);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredProfiles = searchResults.filter(p =>
        !team.some(m => m.profile.id === p.id)
    );

    return {
        step,
        setStep,
        serviceName,
        setServiceName,
        institution,
        setInstitution,
        color,
        setColor,
        shifts,
        setShifts,
        team,
        setTeam,
        searchQuery,
        setSearchQuery,
        showInstitutionModal,
        setShowInstitutionModal,
        showShiftModal,
        setShowShiftModal,
        editingShift,
        setEditingShift,
        showCompletion,
        setShowCompletion,
        instForm,
        setInstForm,
        instSearch,
        setInstSearch,
        instSearchResults,
        setInstSearchResults,
        showNewInstForm,
        setShowNewInstForm,
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
        onFinish,
        isSearchingMembers
    };
};
