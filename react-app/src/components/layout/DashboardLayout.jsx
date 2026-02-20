import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './Layout.module.css';

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Close sidebar on route change (mobile nav)
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                navigate('/dashboard/new');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate]);

    return (
        <div className={styles.layout}>
            <Topbar onMenuToggle={() => setSidebarOpen(o => !o)} sidebarOpen={sidebarOpen} />
            <div className={styles.mainWrapper}>
                {/* Mobile backdrop */}
                {sidebarOpen && (
                    <div
                        className={styles.sidebarBackdrop}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <main className={styles.content}>
                    <div key={location.pathname} className="animate-slide-up">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
