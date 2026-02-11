
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AnalyticsWidget from './AnalyticsWidget';
import Loader from '../common/Loader';
import styles from './Dashboard.module.css';

const AnalyticsPage = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        if (authLoading) return; // Wait for auth to initialize

        if (!user) {
            navigate('/login');
            return;
        }

        const role = user.organisation?.role;
        if (role === 'Super Admin' || role === 'Admin') {
            setIsAuthorized(true);
        } else {
            console.log('Unauthorized access attempt to Analytics', user);
            navigate('/dashboard');
        }
        setCheckingAuth(false);
    }, [user, authLoading, navigate]);

    if (authLoading || checkingAuth) {
        return (
            <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div style={{ color: 'var(--color-text-muted)' }}>Verifying access...</div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Analytics Dashboard</h1>
                <p className={styles.subtitle}>Overview of organisation performance and metrics.</p>
            </div>

            {/* The widget handles its own data fetching */}
            <AnalyticsWidget />
        </div>
    );
};

export default AnalyticsPage;
