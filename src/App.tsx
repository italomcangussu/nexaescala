import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/MainApp'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
);

import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
    console.log("DEBUG: App.tsx - Rendering...");
    return (
        <ToastProvider>
            <BrowserRouter>
                <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/politicas-de-privacidade" element={<PrivacyPolicy />} />

                        {/* Protected Routes */}
                        <Route
                            path="/*"
                            element={
                                <ProtectedRoute>
                                    <ErrorBoundary>
                                        <Dashboard />
                                    </ErrorBoundary>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </ToastProvider>
    );
};

export default App;
