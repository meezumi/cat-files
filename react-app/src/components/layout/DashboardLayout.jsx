import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './Layout.module.css';

const DashboardLayout = () => {
    const location = useLocation();
    return (
        <div className={styles.layout}>
            <Topbar />
            <div className={styles.mainWrapper}>
                <Sidebar />
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
