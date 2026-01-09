import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/MainApp'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));

const LoadingFallback = () => (
    <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
    </div>
);

const App: React.FC = () => {
    console.log("DEBUG: App.tsx - Rendering...");
    return (
        <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />

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
    );
};

export default App;
