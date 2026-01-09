import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    Inbox,
    FileText,
    Send,
    CheckCircle,
    Clock,
    Archive,
    Trash2,
    User,
    Plus
} from 'lucide-react';
import styles from './Layout.module.css';

const Sidebar = () => {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.newRequestWrapper}>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Plus size={16} style={{ marginRight: 8 }} />
                    New Request
                </button>
            </div>

            <nav className={styles.nav}>
                <div className={styles.navGroup}>
                    <NavLink to="/dashboard/inbox" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <Inbox size={18} />
                        <span>Inbox</span>
                    </NavLink>
                    <NavLink to="/dashboard/profile" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <User size={18} />
                        <span>Profile</span>
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
        </aside>
    );
};

export default Sidebar;
