import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './GuestLayout.module.css';

const GuestLayout = () => {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.logo}>files</div>
            </header>
            <main className={styles.content}>
                <Outlet />
            </main>
            <footer className={styles.footer}>
                <p>Powered by Pipefile</p>
            </footer>
        </div>
    );
};

export default GuestLayout;
