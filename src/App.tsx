import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useDeviceDetection } from './hooks/useDeviceDetection';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/MainApp'));
const DesktopMainApp = React.lazy(() => import('./pages/DesktopMainApp'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const SupportPage = React.lazy(() => import('./pages/SupportPage'));
const SupportAdminPage = React.lazy(() => import('./pages/SupportAdminPage'));

// Admin Pages
const AdminLayout = React.lazy(() => import('./pages/admin/AdminLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = React.lazy(() => import('./pages/admin/UserManagement'));
const AdminLogs = React.lazy(() => import('./pages/admin/SystemLogs'));
const AdminLoginPage = React.lazy(() => import('./pages/admin/AdminLoginPage'));

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen bg-surface dark:bg-background-dark">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
);

import { ToastProvider } from './context/ToastContext';

// Component to handle main app routing based on device/subdomain
const MainAppRouter: React.FC = () => {
    const { isWebSubdomain, isDesktop } = useDeviceDetection();

    // Use desktop version if on web.nexaescala.com OR if on desktop with large screen
    const shouldUseDesktop = isWebSubdomain || (isDesktop && window.innerWidth >= 1280);

    if (shouldUseDesktop) {
        return <DesktopMainApp />;
    }

    return <Dashboard />;
};

const App: React.FC = () => {
    console.log("DEBUG: App.tsx - Rendering...");
    return (
        <ToastProvider>
            <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/politicas-de-privacidade" element={<PrivacyPolicy />} />
                        <Route path="/politicas-privacidade" element={<PrivacyPolicy />} />
                        <Route path="/suporte" element={<SupportPage />} />
                        <Route path="/suporte-admin" element={<SupportAdminPage />} />

                        {/* Protected Routes */}
                        <Route
                            path="/*"
                            element={
                                <ProtectedRoute>
                                    <ErrorBoundary>
                                        <MainAppRouter />
                                    </ErrorBoundary>
                                </ProtectedRoute>
                            }
                        />

                        {/* Admin Routes */}
                        <Route path="/painel-admin/login" element={<AdminLoginPage />} />
                        <Route path="/painel-admin" element={
                            <AdminRoute>
                                <AdminLayout />
                            </AdminRoute>
                        }>
                            <Route index element={<AdminDashboard />} />
                            <Route path="users" element={<AdminUsers />} />
                            <Route path="logs" element={<AdminLogs />} />
                        </Route>
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </ToastProvider>
    );
};

export default App;

