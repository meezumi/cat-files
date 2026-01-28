import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import styles from './Layout.module.css';

const Topbar = () => {
    const navigate = useNavigate();
    const { hasOrganisation, getOrganisation } = useAuth();

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
                {hasOrganisation() ? (
                    <button
                        className="btn"
                        style={{ backgroundColor: 'white', color: 'black', fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => {
                            const org = getOrganisation();
                            if (org && org.id) {
                                navigate(`/dashboard/organisations/${org.id}?tab=members`);
                            }
                        }}
                    >
                        <UserPlus size={14} />
                        Invite Members
                    </button>
                ) : (
                    <button
                        className="btn"
                        style={{ backgroundColor: 'white', color: 'black', fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => navigate('/dashboard/organisations/new')}
                    >
                        Add Organisation <Plus size={14} />
                    </button>
                )}
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
