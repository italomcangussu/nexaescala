import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface AuthContextType {
    user: any | null;
    profile: Profile | null;
    loading: boolean;
    needsOnboarding: boolean;
    signOut: () => Promise<void>;
    refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    needsOnboarding: false,
    signOut: async () => { },
    refetchProfile: async () => { }
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    console.log("DEBUG: AuthContext - Provider Rendering...");
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setNeedsOnboarding(false);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                setNeedsOnboarding(true); // Assume needs onboarding if no profile
            } else {
                const profileData = data as Profile;
                setProfile(profileData);

                // Check if user needs onboarding (onboarding_completed flag is false or null)
                const isIncomplete = !profileData.onboarding_completed;
                setNeedsOnboarding(isIncomplete);
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            setNeedsOnboarding(true);
        } finally {
            setLoading(false);
        }
    };

    const refetchProfile = async () => {
        if (user?.id) {
            // Refetch without triggering loading state to avoid UI flicker
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    const profileData = data as Profile;
                    setProfile(profileData);
                    setNeedsOnboarding(!profileData.onboarding_completed);
                }
            } catch (err) {
                console.error('Error refetching profile:', err);
            }
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, needsOnboarding, signOut, refetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

