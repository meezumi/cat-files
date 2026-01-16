import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Inbox,
    FileText,
    Send,
    CheckCircle,
    Clock,
    Archive,
    Trash2,
    Plus,
    LogOut,
    User
} from 'lucide-react';
import styles from './Layout.module.css';

const Sidebar = () => {
    const { user, logout } = useAuth();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.newRequestWrapper}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Plus size={16} style={{ marginRight: 8 }} />
                    New Request
                </button>
            </div>

            <nav className={styles.nav} style={{ flex: 1 }}>
                <div className={styles.navGroup}>
                    <NavLink to="/dashboard/inbox" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <Inbox size={18} />
                        <span>Inbox</span>
                    </NavLink>
                </div>

                <div className={styles.navLabel}>Requests</div>
                <div className={styles.navGroup}>
                    <NavLink to="/dashboard/all" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <FileText size={18} />
                        <span>All Requests</span>
                    </NavLink>
                    <NavLink to="/dashboard/drafts" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <FileText size={18} className={styles.iconDraft} />
                        <span>Drafts</span>
                    </NavLink>
                    <NavLink to="/dashboard/sent" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <Send size={18} />
                        <span>Sent</span>
                    </NavLink>
                    <NavLink to="/dashboard/responded" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <CheckCircle size={18} />
                        <span>Responded</span>
                    </NavLink>
                    <NavLink to="/dashboard/expired" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <Clock size={18} />
                        <span>Expired</span>
                    </NavLink>
                    <NavLink to="/dashboard/completed" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <CheckCircle size={18} />
                        <span>Completed</span>
                    </NavLink>
                    <NavLink to="/dashboard/archived" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <Archive size={18} />
                        <span>Archived</span>
                    </NavLink>
                    <NavLink to="/dashboard/trash" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <Trash2 size={18} />
                        <span>Trash</span>
                    </NavLink>
                </div>
            </nav>

            {/* User Profile Section */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)' }}>
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px' }}>
                            <User size={16} color="#64748b" />
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.first_name} {user.last_name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.email_id}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ padding: '8px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Loading...</div>
                )}

                <button
                    onClick={logout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '8px 12px',
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        fontSize: '14px',
                        cursor: 'pointer',
                        borderRadius: '6px'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#fef2f2'}
                    onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    <LogOut size={16} style={{ marginRight: '8px' }} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
