import { useReducer, useEffect, useCallback } from 'react';
import { Profile, Group, ServiceRole, ShiftPreset, TeamMember, ServiceEditorState, ServiceEditorMode, MonthOption } from '../types';
import {
    searchInstitutions,
    searchProfiles,
    createServiceComplete,
    updateServiceComplete,
    getShiftPresets,
    getGroupMembers,
    generateShiftsForGroup
} from '../services/api';

// --- Action Types ---
type ServiceEditorAction =
    | { type: 'SET_MODE'; mode: ServiceEditorMode; groupId?: string }
    | { type: 'SET_STEP'; step: number }
    | { type: 'UPDATE_INFO'; field: 'serviceName' | 'institution' | 'color'; value: string }
    | { type: 'SET_SHIFT_PRESETS'; presets: ShiftPreset[] }
    | { type: 'ADD_SHIFT_PRESET'; preset: ShiftPreset }
    | { type: 'UPDATE_SHIFT_PRESET'; id: string; updates: Partial<ShiftPreset> }
    | { type: 'REMOVE_SHIFT_PRESET'; id: string }
    | { type: 'SET_TEAM'; team: TeamMember[] }
    | { type: 'ADD_TEAM_MEMBER'; member: TeamMember }
    | { type: 'UPDATE_MEMBER_ROLES'; profileId: string; roles: ServiceRole[] }
    | { type: 'REMOVE_TEAM_MEMBER'; profileId: string }
    | { type: 'SET_SEARCH_QUERY'; query: string }
    | { type: 'SET_SEARCH_RESULTS'; results: Profile[] }
    | { type: 'SET_IS_SEARCHING'; isSearching: boolean }
    | { type: 'SET_INST_SEARCH'; query: string }
    | { type: 'SET_INST_SEARCH_RESULTS'; results: string[] }
    | { type: 'TOGGLE_INSTITUTION_MODAL'; show: boolean }
    | { type: 'TOGGLE_NEW_INST_FORM'; show: boolean }
    | { type: 'UPDATE_INST_FORM'; field: string; value: string }
    | { type: 'TOGGLE_SHIFT_MODAL'; show: boolean }
    | { type: 'SET_EDITING_SHIFT'; shift: Partial<ShiftPreset> | null }
    | { type: 'SET_SAVING'; isSaving: boolean }
    | { type: 'SET_COMPLETION'; show: boolean; group?: Group }
    | { type: 'SET_ERROR'; field: string; error: string }
    | { type: 'CLEAR_ERROR'; field: string }
    | { type: 'TOUCH_FIELD'; field: string }
    | { type: 'TOGGLE_MONTH'; year: number; month: number }
    | { type: 'SET_QUANTITY_PER_SHIFT'; quantity: number }
    | { type: 'RESET' };

// Helper to generate month options
const generateMonthOptions = (): MonthOption[] => {
    const now = new Date();
    const months: MonthOption[] = [];

    for (let i = 0; i < 7; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
            selected: i === 0 // Only current month selected by default
        });
    }

    return months;
};

// --- Initial State ---
const createInitialState = (currentUser: Profile): ServiceEditorState => ({
    mode: 'create',
    groupId: undefined,
    step: 1,

    // Step 1: Info
    serviceName: '',
    institution: '',
    color: '#059669',

    // Step 2: Shifts - Default presets
    shiftPresets: [
        { id: 'default-1', code: 'MT', start_time: '07:00', end_time: '19:00', quantity_needed: 1, days_of_week: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'default-2', code: 'SN', start_time: '19:00', end_time: '07:00', quantity_needed: 1, days_of_week: [0, 1, 2, 3, 4, 5, 6] },
    ],

    // Step 3: Team - Owner always included
    team: [
        {
            profile: currentUser,
            roles: [ServiceRole.ADMIN],
            isOwner: true
        }
    ],

    // UI State
    isSaving: false,
    showCompletion: false,
    createdGroup: null,

    // Search
    searchQuery: '',
    searchResults: [],
    isSearching: false,

    // Institution Modal
    instSearch: '',
    instSearchResults: [],
    showInstitutionModal: false,
    showNewInstForm: false,
    instForm: {
        name: '',
        city: '',
        state: '',
        phone: '',
    },

    // Shift Modal
    showShiftModal: false,
    editingShift: null,

    // Step 4: Generation
    selectedMonths: generateMonthOptions(),
    quantityPerShift: 2,

    // Validation
    errors: {},
    touched: {},
});

// --- Reducer ---
const serviceEditorReducer = (state: ServiceEditorState, action: ServiceEditorAction): ServiceEditorState => {
    switch (action.type) {
        case 'SET_MODE':
            return { ...state, mode: action.mode, groupId: action.groupId };

        case 'SET_STEP':
            return { ...state, step: action.step };

        case 'UPDATE_INFO':
            return {
                ...state,
                [action.field]: action.value,
                touched: { ...state.touched, [action.field]: true }
            };

        case 'SET_SHIFT_PRESETS':
            return { ...state, shiftPresets: action.presets };

        case 'ADD_SHIFT_PRESET':
            return { ...state, shiftPresets: [...state.shiftPresets, action.preset] };

        case 'UPDATE_SHIFT_PRESET':
            return {
                ...state,
                shiftPresets: state.shiftPresets.map(p =>
                    p.id === action.id ? { ...p, ...action.updates } : p
                )
            };

        case 'REMOVE_SHIFT_PRESET':
            return {
                ...state,
                shiftPresets: state.shiftPresets.filter(p => p.id !== action.id)
            };

        case 'SET_TEAM':
            return { ...state, team: action.team };

        case 'ADD_TEAM_MEMBER':
            // Prevent duplicates
            if (state.team.some(m => m.profile.id === action.member.profile.id)) {
                return state;
            }
            return { ...state, team: [...state.team, action.member] };

        case 'UPDATE_MEMBER_ROLES':
            return {
                ...state,
                team: state.team.map(m =>
                    m.profile.id === action.profileId
                        ? { ...m, roles: action.roles }
                        : m
                )
            };

        case 'REMOVE_TEAM_MEMBER':
            // Cannot remove owner
            const memberToRemove = state.team.find(m => m.profile.id === action.profileId);
            if (memberToRemove?.isOwner) return state;
            return {
                ...state,
                team: state.team.filter(m => m.profile.id !== action.profileId)
            };

        case 'SET_SEARCH_QUERY':
            return { ...state, searchQuery: action.query };

        case 'SET_SEARCH_RESULTS':
            return { ...state, searchResults: action.results };

        case 'SET_IS_SEARCHING':
            return { ...state, isSearching: action.isSearching };

        case 'SET_INST_SEARCH':
            return { ...state, instSearch: action.query };

        case 'SET_INST_SEARCH_RESULTS':
            return { ...state, instSearchResults: action.results };

        case 'TOGGLE_INSTITUTION_MODAL':
            return { ...state, showInstitutionModal: action.show };

        case 'TOGGLE_NEW_INST_FORM':
            return { ...state, showNewInstForm: action.show };

        case 'UPDATE_INST_FORM':
            return {
                ...state,
                instForm: { ...state.instForm, [action.field]: action.value }
            };

        case 'TOGGLE_SHIFT_MODAL':
            return { ...state, showShiftModal: action.show };

        case 'SET_EDITING_SHIFT':
            return { ...state, editingShift: action.shift };

        case 'SET_SAVING':
            return { ...state, isSaving: action.isSaving };

        case 'SET_COMPLETION':
            return {
                ...state,
                showCompletion: action.show,
                createdGroup: action.group || state.createdGroup
            };

        case 'SET_ERROR':
            return {
                ...state,
                errors: { ...state.errors, [action.field]: action.error }
            };

        case 'CLEAR_ERROR':
            const { [action.field]: _, ...remainingErrors } = state.errors;
            return { ...state, errors: remainingErrors };

        case 'TOUCH_FIELD':
            return {
                ...state,
                touched: { ...state.touched, [action.field]: true }
            };

        case 'TOGGLE_MONTH':
            return {
                ...state,
                selectedMonths: state.selectedMonths.map(m =>
                    m.year === action.year && m.month === action.month
                        ? { ...m, selected: !m.selected }
                        : m
                )
            };

        case 'SET_QUANTITY_PER_SHIFT':
            return { ...state, quantityPerShift: action.quantity };

        case 'RESET':
            return createInitialState(state.team.find(m => m.isOwner)?.profile || state.team[0].profile);

        default:
            return state;
    }
};

// --- Hook ---
export const useServiceEditor = (
    currentUser: Profile,
    existingGroup?: Group,
    onComplete?: (group: Group, navigate: boolean, presets?: ShiftPreset[]) => void
) => {
    const [state, dispatch] = useReducer(
        serviceEditorReducer,
        currentUser,
        createInitialState
    );

    // --- Initialize Edit Mode ---
    useEffect(() => {
        if (existingGroup) {
            dispatch({ type: 'SET_MODE', mode: 'edit', groupId: existingGroup.id });
            dispatch({ type: 'UPDATE_INFO', field: 'serviceName', value: existingGroup.name });
            dispatch({ type: 'UPDATE_INFO', field: 'institution', value: existingGroup.institution });
            dispatch({ type: 'UPDATE_INFO', field: 'color', value: existingGroup.color || '#059669' });

            // Load shift presets
            getShiftPresets(existingGroup.id).then(presets => {
                if (presets.length > 0) {
                    dispatch({ type: 'SET_SHIFT_PRESETS', presets });
                }
            });

            // Load members
            getGroupMembers(existingGroup.id).then(members => {
                const teamMembers: TeamMember[] = members.map(m => ({
                    profile: m.profile,
                    roles: m.service_roles || [m.service_role],
                    isOwner: m.profile.id === currentUser.id
                }));
                if (teamMembers.length > 0) {
                    dispatch({ type: 'SET_TEAM', team: teamMembers });
                }
            });
        }
    }, [existingGroup, currentUser.id]);

    // --- Debounced Institution Search ---
    useEffect(() => {
        const timer = setTimeout(() => {
            if (state.instSearch.length >= 2) {
                searchInstitutions(state.instSearch).then(results => {
                    dispatch({ type: 'SET_INST_SEARCH_RESULTS', results });
                });
            } else {
                dispatch({ type: 'SET_INST_SEARCH_RESULTS', results: [] });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [state.instSearch]);

    // --- Debounced Profile Search ---
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (state.searchQuery.length >= 2) {
                dispatch({ type: 'SET_IS_SEARCHING', isSearching: true });
                try {
                    const results = await searchProfiles(state.searchQuery);
                    dispatch({ type: 'SET_SEARCH_RESULTS', results });
                } catch (e) {
                    console.error(e);
                } finally {
                    dispatch({ type: 'SET_IS_SEARCHING', isSearching: false });
                }
            } else {
                dispatch({ type: 'SET_SEARCH_RESULTS', results: [] });
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [state.searchQuery]);

    // --- Validation ---
    const validateField = useCallback((field: string, value: any): string => {
        switch (field) {
            case 'serviceName':
                if (!value || value.length < 3) return 'Nome deve ter pelo menos 3 caracteres';
                break;
            case 'institution':
                if (!value) return 'Instituição é obrigatória';
                break;
            case 'shiftPresets':
                if (!value || value.length === 0) return 'Adicione pelo menos 1 turno';
                break;
        }
        return '';
    }, []);

    // Check validity without dispatching errors (for canAdvance)
    const checkStepValid = useCallback((step: number): boolean => {
        switch (step) {
            case 1:
                return !validateField('serviceName', state.serviceName) &&
                    !validateField('institution', state.institution);
            case 2:
                return !validateField('shiftPresets', state.shiftPresets);
            case 3:
                return true; // Team always has at least owner
            default:
                return false;
        }
    }, [state.serviceName, state.institution, state.shiftPresets, validateField]);

    // Validate and dispatch errors (for navigation)
    const validateStep = useCallback((step: number): boolean => {
        let isValid = true;

        switch (step) {
            case 1:
                const nameError = validateField('serviceName', state.serviceName);
                const instError = validateField('institution', state.institution);

                if (nameError) {
                    dispatch({ type: 'SET_ERROR', field: 'serviceName', error: nameError });
                    isValid = false;
                } else {
                    dispatch({ type: 'CLEAR_ERROR', field: 'serviceName' });
                }

                if (instError) {
                    dispatch({ type: 'SET_ERROR', field: 'institution', error: instError });
                    isValid = false;
                } else {
                    dispatch({ type: 'CLEAR_ERROR', field: 'institution' });
                }
                break;

            case 2:
                const shiftsError = validateField('shiftPresets', state.shiftPresets);
                if (shiftsError) {
                    dispatch({ type: 'SET_ERROR', field: 'shiftPresets', error: shiftsError });
                    isValid = false;
                } else {
                    dispatch({ type: 'CLEAR_ERROR', field: 'shiftPresets' });
                }
                break;

            case 3:
                // Team always has at least owner
                break;
        }

        return isValid;
    }, [state.serviceName, state.institution, state.shiftPresets, validateField]);

    // --- Actions ---
    const actions = {
        // Navigation
        nextStep: () => {
            if (validateStep(state.step) && state.step < 3) {
                dispatch({ type: 'SET_STEP', step: state.step + 1 });
            }
        },

        prevStep: () => {
            if (state.step > 1) {
                dispatch({ type: 'SET_STEP', step: state.step - 1 });
            }
        },

        goToStep: (step: number) => {
            if (step >= 1 && step <= 3) {
                // Validate all previous steps
                let canGo = true;
                for (let i = 1; i < step; i++) {
                    if (!validateStep(i)) {
                        canGo = false;
                        break;
                    }
                }
                if (canGo) {
                    dispatch({ type: 'SET_STEP', step });
                }
            }
        },

        // Info
        updateInfo: (field: 'serviceName' | 'institution' | 'color', value: string) => {
            dispatch({ type: 'UPDATE_INFO', field, value });

            // Real-time validation
            const error = validateField(field, value);
            if (error) {
                dispatch({ type: 'SET_ERROR', field, error });
            } else {
                dispatch({ type: 'CLEAR_ERROR', field });
            }
        },

        // Institution Modal
        openInstitutionModal: () => dispatch({ type: 'TOGGLE_INSTITUTION_MODAL', show: true }),
        closeInstitutionModal: () => {
            dispatch({ type: 'TOGGLE_INSTITUTION_MODAL', show: false });
            dispatch({ type: 'TOGGLE_NEW_INST_FORM', show: false });
            dispatch({ type: 'SET_INST_SEARCH', query: '' });
        },
        setInstSearch: (query: string) => dispatch({ type: 'SET_INST_SEARCH', query }),
        showNewInstForm: () => dispatch({ type: 'TOGGLE_NEW_INST_FORM', show: true }),
        hideNewInstForm: () => dispatch({ type: 'TOGGLE_NEW_INST_FORM', show: false }),
        updateInstForm: (field: string, value: string) => dispatch({ type: 'UPDATE_INST_FORM', field, value }),
        saveInstitution: () => {
            dispatch({ type: 'UPDATE_INFO', field: 'institution', value: state.instForm.name });
            dispatch({ type: 'TOGGLE_INSTITUTION_MODAL', show: false });
            dispatch({ type: 'TOGGLE_NEW_INST_FORM', show: false });
        },
        selectInstitution: (name: string) => {
            dispatch({ type: 'UPDATE_INFO', field: 'institution', value: name });
            dispatch({ type: 'TOGGLE_INSTITUTION_MODAL', show: false });
        },

        // Shifts
        openShiftModal: (shift?: ShiftPreset) => {
            dispatch({
                type: 'SET_EDITING_SHIFT',
                shift: shift || { code: '', start_time: '', end_time: '', days_of_week: [0, 1, 2, 3, 4, 5, 6] }
            });
            dispatch({ type: 'TOGGLE_SHIFT_MODAL', show: true });
        },
        closeShiftModal: () => {
            dispatch({ type: 'TOGGLE_SHIFT_MODAL', show: false });
            dispatch({ type: 'SET_EDITING_SHIFT', shift: null });
        },
        updateEditingShift: (field: string, value: any) => {
            if (state.editingShift) {
                dispatch({
                    type: 'SET_EDITING_SHIFT',
                    shift: { ...state.editingShift, [field]: value }
                });
            }
        },
        saveShift: () => {
            if (state.editingShift?.code && state.editingShift.start_time && state.editingShift.end_time) {
                if (state.editingShift.id && !state.editingShift.id.startsWith('new-')) {
                    dispatch({
                        type: 'UPDATE_SHIFT_PRESET',
                        id: state.editingShift.id,
                        updates: state.editingShift as Partial<ShiftPreset>
                    });
                } else {
                    dispatch({
                        type: 'ADD_SHIFT_PRESET',
                        preset: {
                            ...state.editingShift,
                            id: `new-${Date.now()}`
                        } as ShiftPreset
                    });
                }
                dispatch({ type: 'TOGGLE_SHIFT_MODAL', show: false });
                dispatch({ type: 'SET_EDITING_SHIFT', shift: null });
            }
        },
        removeShift: (id: string) => dispatch({ type: 'REMOVE_SHIFT_PRESET', id }),

        // Team
        setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', query }),
        addMember: (profile: Profile, roles: ServiceRole[]) => {
            dispatch({
                type: 'ADD_TEAM_MEMBER',
                member: { profile, roles, isOwner: false }
            });
            dispatch({ type: 'SET_SEARCH_QUERY', query: '' });
            dispatch({ type: 'SET_SEARCH_RESULTS', results: [] });
        },
        updateMemberRoles: (profileId: string, roles: ServiceRole[]) => {
            dispatch({ type: 'UPDATE_MEMBER_ROLES', profileId, roles });
        },
        removeMember: (profileId: string) => {
            dispatch({ type: 'REMOVE_TEAM_MEMBER', profileId });
        },
        toggleMemberRole: (profileId: string, role: ServiceRole) => {
            const member = state.team.find(m => m.profile.id === profileId);
            if (member) {
                const hasRole = member.roles.includes(role);
                const newRoles = hasRole
                    ? member.roles.filter(r => r !== role)
                    : [...member.roles, role];

                // Ensure at least one role
                if (newRoles.length > 0) {
                    dispatch({ type: 'UPDATE_MEMBER_ROLES', profileId, roles: newRoles });
                }
            }
        },

        // Generation
        toggleMonth: (year: number, month: number) => {
            dispatch({ type: 'TOGGLE_MONTH', year, month });
        },
        setQuantityPerShift: (quantity: number) => {
            dispatch({ type: 'SET_QUANTITY_PER_SHIFT', quantity });
        },

        // Save
        save: async () => {
            if (!validateStep(state.step)) return;

            dispatch({ type: 'SET_SAVING', isSaving: true });

            try {
                let resultGroup: Group;

                if (state.mode === 'create') {
                    resultGroup = await createServiceComplete({
                        ownerId: currentUser.id,
                        name: state.serviceName,
                        institution: state.institution,
                        color: state.color,
                        shiftPresets: state.shiftPresets.map(p => ({
                            code: p.code,
                            start_time: p.start_time,
                            end_time: p.end_time,
                            quantity_needed: p.quantity_needed || 1
                        })),
                        team: state.team,
                    });

                    // Generate shifts for CURRENT (remaining) and NEXT Month automatically
                    const now = new Date();
                    const currentMonth = { year: now.getFullYear(), month: now.getMonth() };
                    const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                    const nextMonth = { year: nextDate.getFullYear(), month: nextDate.getMonth() };

                    await generateShiftsForGroup(
                        resultGroup.id,
                        [currentMonth, nextMonth],
                        state.shiftPresets.map(p => ({
                            code: p.code,
                            start_time: p.start_time,
                            end_time: p.end_time,
                            quantity_needed: p.quantity_needed || 2
                        })),
                        state.quantityPerShift
                    );
                } else {
                    await updateServiceComplete(
                        state.groupId!,
                        {
                            name: state.serviceName,
                            institution: state.institution,
                            color: state.color,
                        },
                        state.shiftPresets,
                        state.team
                    );
                    resultGroup = {
                        id: state.groupId!,
                        name: state.serviceName,
                        institution: state.institution,
                        color: state.color,
                        member_count: state.team.length,
                        unread_messages: 0,
                        user_role: ServiceRole.ADMIN,
                    };
                }

                dispatch({ type: 'SET_COMPLETION', show: true, group: resultGroup });
            } catch (err: any) {
                console.error('Error saving service:', err);
                alert(`Falha ao salvar serviço:\n${err.message || 'Erro desconhecido'}`);
            } finally {
                dispatch({ type: 'SET_SAVING', isSaving: false });
            }
        },

        // Completion
        finish: (navigate: boolean) => {
            if (state.createdGroup && onComplete) {
                onComplete(state.createdGroup, navigate, state.shiftPresets);
            }
        },

        reset: () => dispatch({ type: 'RESET' }),
    };

    // --- Computed Values ---
    const filteredProfiles = state.searchResults.filter(
        p => !state.team.some(m => m.profile.id === p.id)
    );

    const canAdvance = checkStepValid(state.step);

    return {
        state,
        actions,
        filteredProfiles,
        canAdvance,
    };
};
