import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Simple loading spinner or placeholder
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#666' }}>Loading...</div>;
    }

    if (!user) {
        // Redirect to native login, but we can't do that easily via Navigate 
        // because it's an external URL (relative, but handled by server).
        // Actually, asking them to login via a Landing Page or redirecting directly?
        // Let's redirect to a local "/login" page that handles the external redirect, 
        // OR just trigger the login function.

        // Better UX: Show a "Please Login" page or redirect. 
        // Since we are inside the App Router, let's force a window location change if we want strict enforcement, 
        // OR render a "Redirecting to Login..." component.

        window.location.href = '/__catalyst/auth/login';
        return null;
    }

    return children;
};

export default ProtectedRoute;
