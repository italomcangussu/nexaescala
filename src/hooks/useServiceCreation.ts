import React, { useState, useEffect } from 'react';
import { Profile, ServiceRole, ShiftPreset, Group, AppRole } from '../types';
import { createService, addGroupMember, searchInstitutions, searchProfiles } from '../services/api';

export const useServiceCreation = (currentUser: Profile, onFinish: (group?: Group, navigate?: boolean) => void) => {
    const [step, setStep] = useState(1);

    // Step 1: Info
    const [serviceName, setServiceName] = useState('');
    const [institution, setInstitution] = useState('');
    const [color, setColor] = useState('#059669');

    // Step 2: Shifts
    const [shifts, setShifts] = useState<ShiftPreset[]>([
        { id: '1', code: 'DT', start_time: '07:00', end_time: '19:00' },
        { id: '2', code: 'NT', start_time: '19:00', end_time: '07:00' },
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

            // 3. Add Other Members
            for (const member of team) {
                if (member.profile.id === currentUser.id) continue;

                // Map ServiceRole to AppRole roughly for now or just generic 'medico'
                let appRole = AppRole.MEDICO;
                if (member.role === ServiceRole.ADMIN) appRole = AppRole.GESTOR;
                if (member.role === ServiceRole.ADMIN_AUX) appRole = AppRole.AUXILIAR;

                await addGroupMember(newGroup.id, member.profile.id, appRole, member.role);
            }

            setCreatedGroup(newGroup);
            setShowCompletion(true);
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.message || 'Erro desconhecido';
            const errorDetails = err.details || err.hint || '';
            alert(`DEBUG ERRO:\nMsg: ${errorMsg}\nDetalhes: ${errorDetails}\nCode: ${err.code || 'N/A'}`);
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
