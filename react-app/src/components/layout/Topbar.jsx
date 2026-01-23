import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus } from 'lucide-react'; // Using Lucide icons
import styles from './Layout.module.css';

const Topbar = () => {
    const navigate = useNavigate();

    return (
        <header className={styles.topbar}>
            <div
                className={styles.logo}
                onClick={() => navigate('/dashboard/inbox')}
                style={{ cursor: 'pointer' }}
            >
                files
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                    className="btn"
                    style={{ backgroundColor: 'white', color: 'black', fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => navigate('/dashboard/organisations/new')}
                >
                    Add Organisation <Plus size={14} />
                </button>
                <button
                    onClick={() => navigate('/dashboard/profile')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 4 }}
                    title="User Profile"
                >
                    <User size={20} />
                </button>
            </div>
        </header>
    );
};

export default Topbar;
