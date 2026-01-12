import React, { useState, useEffect } from 'react';
import { Profile, Shift, ShiftAssignment, Group, AppRole, ShiftExchange } from '../types';
import { getProfiles, getUserGroups, getMyShifts, getUserShiftExchanges } from '../services/api';


interface UseDashboardDataReturn {
    profiles: Profile[];
    setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>;
    userGroups: Group[];
    shifts: Shift[];
    assignments: ShiftAssignment[];
    isLoading: boolean;
    userRole: AppRole;
    exchanges: ShiftExchange[];
    refresh: () => Promise<void>;
}

export const useDashboardData = (currentUser: Profile | null): UseDashboardDataReturn => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [userGroups, setUserGroups] = useState<Group[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
    const [exchanges, setExchanges] = useState<ShiftExchange[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole] = useState<AppRole>(AppRole.MEDICO);

    const fetchData = async () => {
        if (!currentUser) return;
        setIsLoading(true);
        try {
            const [fetchedProfiles, fetchedGroups, myShiftData, fetchedExchanges] = await Promise.all([
                getProfiles(),
                getUserGroups(currentUser.id),
                getMyShifts(currentUser.id),
                getUserShiftExchanges(currentUser.id)
            ]);

            setProfiles(fetchedProfiles);
            setUserGroups(fetchedGroups);
            setShifts(myShiftData.shifts);
            setAssignments(myShiftData.assignments);
            setExchanges(fetchedExchanges);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    return {
        profiles,
        setProfiles,
        userGroups,
        shifts,
        assignments,
        exchanges,
        isLoading,
        userRole,
        refresh: fetchData
    };
};
