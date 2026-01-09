import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import styles from './Layout.module.css';

const DashboardLayout = () => {
    return (
        <div className={styles.layout}>
            <Topbar />
            <div className={styles.mainWrapper}>
                <Sidebar />
                <main className={styles.content}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
