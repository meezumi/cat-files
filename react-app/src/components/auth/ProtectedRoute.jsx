import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // Simple loading spinner or placeholder
        return <Loader text="Verifying access..." />;
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

        // Auto-redirecting here causes an infinite loop if the session isn't established yet 
        // or if the redirect back from Catalyst Login doesn't immediately set the cookie visible to the API.
        // Instead of hard redirect, show a Landing/Login page.

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <h2>Authentication Required</h2>
                <p>Please log in to access the dashboard.</p>
                <button
                    onClick={() => window.location.href = '/__catalyst/auth/login'}
                    style={{ padding: '10px 20px', marginTop: '20px', background: '#2eb85c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Log In
                </button>
            </div>
        );
        // return null;
    }

    return children;
};

export default ProtectedRoute;
