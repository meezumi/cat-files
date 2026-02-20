import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Plus, UserPlus, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationCenter from '../common/NotificationCenter';
import styles from './Layout.module.css';

const Topbar = ({ onMenuToggle, sidebarOpen }) => {
    const navigate = useNavigate();
    const { hasOrganisation, getOrganisation } = useAuth();

    return (
        <header className={styles.topbar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Hamburger — only visible on mobile via CSS */}
                <button
                    className={styles.hamburger}
                    onClick={onMenuToggle}
                    aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
                >
                    {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <div
                    className={styles.logo}
                    onClick={() => navigate('/dashboard/inbox')}
                    style={{ cursor: 'pointer' }}
                >
                    files
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {hasOrganisation() ? (
                    <button
                        className={`btn ${styles.topbarBtn}`}
                        style={{ backgroundColor: 'white', color: 'black', fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => {
                            const org = getOrganisation();
                            if (org && org.id) {
                                navigate(`/dashboard/organisations/${org.id}?tab=members`);
                            }
                        }}
                    >
                        <UserPlus size={14} />
                        <span className={styles.topbarBtnLabel}>Invite Members</span>
                    </button>
                ) : (
                    <button
                        className={`btn ${styles.topbarBtn}`}
                        style={{ backgroundColor: 'white', color: 'black', fontSize: '13px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => navigate('/dashboard/organisations/new')}
                    >
                        <Plus size={14} />
                        <span className={styles.topbarBtnLabel}>Add Organisation</span>
                    </button>
                )}
                <NotificationCenter />
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
