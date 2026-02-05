import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader } from 'lucide-react';

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-surface dark:bg-surface-dark text-primary">
                <Loader className="animate-spin" size={40} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/painel-admin/login" replace />;
    }

    if (profile?.app_role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};
