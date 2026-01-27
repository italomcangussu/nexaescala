import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';
import OnboardingWizard from './OnboardingWizard';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, loading, needsOnboarding, refetchProfile } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-primary">
                <Loader className="animate-spin" size={40} />
            </div>
        );
    }

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to when they were redirected. This allows us to send them
        // along to that page after they login, which is a nicer user experience.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Show onboarding wizard if user hasn't completed profile setup
    if (needsOnboarding && user) {
        return (
            <OnboardingWizard
                user={user}
                initialProfile={profile || undefined}
                onComplete={async () => {
                    await refetchProfile();
                }}
            />
        );
    }

    return <>{children}</>;
};

