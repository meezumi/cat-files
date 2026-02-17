import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, FileText, User, Shield, Trash2, Mail, Search, RefreshCw } from 'lucide-react';
import Loader from '../../components/common/Loader';
import styles from '../../components/dashboard/Dashboard.module.css';

const AuditLogsPage = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchLogs = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            else setIsRefreshing(true);

            const response = await fetch('/server/fetch_requests_function/audit-logs', {
                headers: {
                    'x-zc-user-id': user?.user_id
                },
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || (response.status === 403 ? "You do not have permission to view audit logs." : 'Failed to fetch logs'));
            }

            const data = await response.json();
            if (data.status === 'success') {
                setLogs(data.data);
            } else {
                throw new Error(data.message || 'Failed to fetch logs');
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLogs(true);
    }, [fetchLogs]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString();
    };

    const getActionIcon = (action) => {
        const lower = action ? action.toLowerCase() : '';
        if (lower.includes('created')) return <FileText size={16} className="text-emerald-500" />;
        if (lower.includes('deleted') || lower.includes('removed')) return <Trash2 size={16} className="text-red-500" />;
        if (lower.includes('role') || lower.includes('policy')) return <Shield size={16} className="text-amber-500" />;
        if (lower.includes('email')) return <Mail size={16} className="text-blue-500" />;
        if (lower.includes('member') || lower.includes('user')) return <User size={16} className="text-indigo-500" />;
        return <AlertCircle size={16} className="text-slate-400" />;
    };

    const filteredLogs = logs.filter(log =>
        (log.Action && log.Action.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.Details && log.Details.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.Actor && log.Actor.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2" style={{ color: 'var(--color-text-main)' }}>Audit Logs</h1>
                <p className="text-slate-600 dark:text-slate-400" style={{ color: 'var(--color-text-muted)' }}>Comprehensive record of all system activities.</p>
            </div>

            {/* Controls */}
            <div className="mb-6" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ position: 'relative', width: '320px' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 40px',
                            border: '1px solid var(--color-border)',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            background: 'var(--color-bg-card)',
                            color: 'var(--color-text-main)',
                            height: '42px'
                        }}
                    />
                </div>

                <button
                    onClick={() => fetchLogs(false)}
                    title="Refresh Logs"
                    style={{
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg-card)',
                        color: 'var(--color-text-muted)',
                        height: '42px',
                        width: '42px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        cursor: loading || isRefreshing ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loading || isRefreshing}
                >
                    <RefreshCw size={18} className={isRefreshing ? styles.spin : ''} />
                </button>
            </div>

            {loading && !isRefreshing ? (
                <div className="flex justify-center items-center h-64">
                    <Loader text="Loading logs..." />
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center gap-3">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) : (
                <div className={styles.tableWrapper}>
                    <div className={styles.tableHeader}>
                        <div className={styles.colTimestamp}>Timestamp</div>
                        <div className={styles.colAction}>Action</div>
                        <div className={styles.colActor}>Actor</div>
                        <div className={styles.colDetails}>Details</div>
                    </div>
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                            <div key={log.ROWID} className={styles.tableRow}>
                                <div className={styles.colTimestamp} style={{ fontSize: '13px' }}>
                                    {formatDate(log.CREATEDTIME)}
                                </div>
                                <div className={styles.colAction}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {getActionIcon(log.Action)}
                                        <span style={{ fontWeight: 500 }}>{log.Action}</span>
                                    </div>
                                </div>
                                <div className={styles.colActor}>
                                    {log.Actor || 'System'}
                                </div>
                                <div className={styles.colDetails} title={log.Details} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {log.Details}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <p>No audit logs found.</p>
                            <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.7 }}>
                                Actions like creating requests or managing members will appear here.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AuditLogsPage;
