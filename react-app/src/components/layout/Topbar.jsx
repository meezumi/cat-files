import React from 'react';
import { User, HelpCircle } from 'lucide-react'; // Using Lucide icons
import styles from './Layout.module.css';

const Topbar = () => {
    return (
        <header className={styles.topbar}>
            <div className={styles.logo}>files</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button className="btn" style={{ backgroundColor: 'white', color: 'black', fontSize: '12px', padding: '6px 12px' }}>
                    Add team +
                </button>
                <span style={{ fontSize: '14px', cursor: 'pointer' }}>Support</span>
                <User size={20} style={{ cursor: 'pointer' }} />
            </div>
        </header>
    );
};

export default Topbar;
