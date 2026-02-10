import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { createAppLog } from '../services/api';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

interface AuthContextType {
    user: User | null;
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
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        let isMounted = true;

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id, isMounted);
            else setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!isMounted) return;
            if (_event === 'SIGNED_IN' && session?.user) {
                // Log the sign in event (fire and forget)
                createAppLog('info', 'User signed in', { email: session.user.email })
                    .catch(() => { /* Silently ignore log errors */ });
            }

            setUser(session?.user ?? null);
            if (session?.user) fetchProfile(session.user.id, isMounted);
            else {
                setProfile(null);
                setNeedsOnboarding(false);
                setLoading(false);
            }
        });

        // Listen for deep link redirects (OAuth callback on native)
        let appUrlListener: { remove: () => void } | undefined;
        if (Capacitor.isNativePlatform()) {
            App.addListener('appUrlOpen', async ({ url }) => {
                // Close the SFSafariViewController opened by Browser.open
                try { await Browser.close(); } catch { /* no-op if already closed */ }

                // Handle token fragment (implicit flow): ...#access_token=...&refresh_token=...
                const hashIndex = url.indexOf('#');
                if (hashIndex !== -1) {
                    const params = new URLSearchParams(url.substring(hashIndex + 1));
                    const accessToken = params.get('access_token');
                    const refreshToken = params.get('refresh_token');
                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                        return;
                    }
                }

                // Handle code parameter (PKCE flow): ...?code=...
                const codeMatch = url.match(/[?&]code=([^&#]+)/);
                if (codeMatch) {
                    await supabase.auth.exchangeCodeForSession(codeMatch[1]);
                }
            }).then(listener => {
                appUrlListener = listener;
            });
        }

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            appUrlListener?.remove();
        };
    }, []);

    const fetchProfile = async (userId: string, isMounted = true) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!isMounted) return;

            if (error) {
                setNeedsOnboarding(true); // Assume needs onboarding if no profile
            } else {
                const profileData = data as Profile;
                setProfile(profileData);

                // Check if user needs onboarding (onboarding_completed flag is false or null)
                const isIncomplete = !profileData.onboarding_completed;
                setNeedsOnboarding(isIncomplete);
            }
        } catch {
            if (!isMounted) return;
            setNeedsOnboarding(true);
        } finally {
            if (isMounted) setLoading(false);
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
            } catch {
                // Silently ignore refetch errors
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

