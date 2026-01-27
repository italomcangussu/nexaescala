import React from 'react';
import LandingPage from '../pages/LandingPage';
import { useLocation } from 'react-router-dom';

interface SubdomainRouterProps {
    children: React.ReactNode;
}

export const SubdomainRouter: React.FC<SubdomainRouterProps> = ({ children }) => {
    // Logic to determine if we are on the Landing Page Domain vs App Domain
    const hostname = window.location.hostname;

    // Check if it's the App Subdomain
    const isAppSubdomain = hostname.startsWith('app.') || hostname.includes('localhost'); // Keep localhost as App for dev convenience

    // Explicitly check for Landing Page domains
    const isLandingDomain = hostname.startsWith('www.') || hostname === 'nexaescala.com';

    // Development Override: You can use a query param to view landing page in dev
    const location = useLocation();
    const forceLanding = new URLSearchParams(location.search).get('view') === 'landing';

    if (forceLanding || (isLandingDomain && !isAppSubdomain)) {
        // If we are on the landing page domain, we ignore the React Router Routes passed as children
        // and render the Landing Page directly.
        // Note: We might want some routes (like privacy policy) to work on both.

        // Let's verify if the current path is a shared route (like privacy policy)
        // If it is, we render standard routes. If it's root '/', we render Landing.
        if (location.pathname === '/') {
            return <LandingPage />;
        }
        // If it's another path on 'www' (e.g. /login), we might want to redirect to app.
        if (location.pathname === '/login') {
            window.location.href = 'https://app.nexaescala.com/login';
            return null;
        }
    }

    // Default: Render the App (Children Routes)
    return <>{children}</>;
};
