import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import {
    Inbox,
    MessageSquare,
    FileText,
    Send,
    CheckCircle,
    Clock,
    Archive,
    Trash2,
    Plus,
    LogOut,
    User,
    ChevronDown,
    Building2,
    Settings,
    Edit2,
    MoreHorizontal,
    X,
    Book
} from 'lucide-react';
import styles from './Layout.module.css';

const Sidebar = () => {
    const { user, logout, isViewer } = useAuth();
    const navigate = useNavigate();
    const [showTemplates, setShowTemplates] = React.useState(false);
    const [templates, setTemplates] = React.useState([]);
    const [loadingTemplates, setLoadingTemplates] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showTemplateManager, setShowTemplateManager] = React.useState(false);

    const handleDeleteTemplate = async (templateId) => {
        if (!window.confirm("Are you sure you want to delete this template?")) return;

        try {
            const response = await fetch(`/server/workflow_function/requests/${templateId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Trash' })
            });

            if (response.ok) {
                // Remove from local list
                setTemplates(prev => prev.filter(t => t.id !== templateId));
            } else {
                alert("Failed to delete template");
            }
        } catch (err) {
            console.error("Delete template error:", err);
            alert("Error deleting template");
        }
    };

    React.useEffect(() => {
        if (showTemplates && templates.length === 0) {
            setLoadingTemplates(true);
            fetch('/server/fetch_requests_function/?type=template')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        setTemplates(data.data);
                    }
                })
                .catch(err => console.error("Failed to fetch templates", err))
                .finally(() => setLoadingTemplates(false));
        }
    }, [showTemplates, templates.length]);

    return (
        <aside className={styles.sidebar}>
            {!isViewer() && (
                <div className={styles.newRequestWrapper}>
                    <div className={styles.newRequestWrapper} style={{ position: 'relative' }}>
                        <div className={styles.splitBtnContainer}>
                            <button
                                className="btn btn-primary"
                                style={{
                                    flex: 1,
                                    borderTopRightRadius: 0,
                                    borderBottomRightRadius: 0,
                                    padding: '12px 16px',
                                    whiteSpace: 'nowrap'
                                }}
                                onClick={() => navigate('/dashboard/new')}
                            >
                                <Plus size={16} style={{ marginRight: 8 }} />
                                New Request
                            </button>
                            <button
                                className="btn btn-primary"
                                style={{
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0,
                                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                                    padding: '0 8px',
                                    width: '32px'
                                }}
                                onClick={() => setShowTemplates(!showTemplates)}
                            >
                                <ChevronDown size={14} />
                            </button>
                        </div>

                        {showTemplates && (
                            <div className={styles.templateDropdown}>
                                {!showTemplateManager ? (
                                    <>
                                        <div className={styles.templateSearch}>
                                            <input
                                                placeholder="Search templates..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div style={{ padding: '4px 0' }}>
                                            <div className={styles.navLabel} style={{ padding: '4px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                Create from Template
                                                <Settings
                                                    size={14}
                                                    style={{ cursor: 'pointer', opacity: 0.7 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowTemplateManager(true);
                                                    }}
                                                    title="Manage Templates"
                                                />
                                            </div>
                                            {loadingTemplates ? (
                                                <div style={{ padding: '8px 12px', color: '#999', fontSize: '12px' }}>Loading...</div>
                                            ) : templates.filter(t => t.subject.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                                                <div style={{ padding: '8px 12px', color: '#999', fontSize: '12px' }}>No templates found</div>
                                            ) : (
                                                templates
                                                    .filter(t => t.subject.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    .map(t => (
                                                        <div
                                                            key={t.id}
                                                            className={styles.templateItem}
                                                            onClick={() => {
                                                                setShowTemplates(false);
                                                                navigate(`/dashboard/new?templateId=${t.id}`);
                                                            }}
                                                        >
                                                            <FileText size={12} style={{ marginRight: 6, opacity: 0.7 }} />
                                                            {t.subject}
                                                        </div>
                                                    ))
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className={styles.templateManager}>
                                        <div className={styles.managerHeader}>
                                            <span style={{ fontWeight: 600 }}>Manage Templates</span>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <Plus size={16} style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard/new')} title="New Template" />
                                                <X size={16} style={{ cursor: 'pointer' }} onClick={() => setShowTemplateManager(false)} />
                                            </div>
                                        </div>
                                        <div className={styles.managerList}>
                                            {templates.map(t => (
                                                <div key={t.id} className={styles.managerItem}>
                                                    <span className={styles.managerName} title={t.subject}>{t.subject}</span>
                                                    <div className={styles.managerActions}>
                                                        <Edit2
                                                            size={14}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // Navigate to New Request with template ID to "Use/Edit" it as a new request
                                                                navigate(`/dashboard/new?templateId=${t.id}`);
                                                                setShowTemplates(false);
                                                            }}
                                                            title="Use/Edit Template"
                                                        />
                                                        <Trash2
                                                            size={14}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTemplate(t.id);
                                                            }}
                                                            title="Delete Template"
                                                        />
                                                        <MoreHorizontal size={14} />
                                                    </div>
                                                </div>
                                            ))}
                                            {templates.length === 0 && (
                                                <div style={{ padding: 12, textAlign: 'center', color: '#999', fontSize: 13 }}>No templates</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <nav className={styles.nav} style={{ flex: 1 }}>
                <div className={styles.navGroup}>
                    <NavLink to="/dashboard/inbox" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <Inbox size={18} />
                        <span>Inbox</span>
                    </NavLink>
                    <NavLink to="/dashboard/organisations" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}>
                        <Building2 size={18} />
                        <span>Organisations</span>
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
                        <MessageSquare size={18} />
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

            {/* API Documentation Link for Devs/Reviewers */}
            <div style={{ padding: '0 16px 16px' }}>
                <NavLink
                    to="/api/v1/documentation"
                    className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
                    style={{ color: '#6366f1' }}
                >
                    <Book size={18} />
                    <span>API Docs</span>
                </NavLink>
            </div>

            {/* User Profile Section */}
            <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)' }}>
                {user ? (
                    <div
                        style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', cursor: 'pointer' }}
                        onClick={() => navigate('/dashboard/profile')}
                    >
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
