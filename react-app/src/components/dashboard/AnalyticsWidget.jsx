
import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Clock, Users, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import styles from './AnalyticsWidget.module.css';
import Loader from '../common/Loader';

const AnalyticsWidget = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchAnalytics = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            else setIsRefreshing(true);
            setError(null);

            const res = await fetch('/server/fetch_requests_function/analytics', {
                credentials: 'include'  // Required for Catalyst session auth in production
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Server error: ${res.status}`);
            }

            const result = await res.json();
            if (result.status === 'success') {
                setData(result.data);
                console.log('Analytics loaded for orgId:', result.data.orgId || 'personal');
            } else {
                throw new Error(result.message || 'Failed to load analytics');
            }
        } catch (err) {
            console.error("Failed to load analytics", err);
            setError(err.message);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader text="Loading analytics..." />
        </div>
    );

    if (error) return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            padding: '48px 24px', color: 'var(--color-text-muted)', textAlign: 'center'
        }}>
            <AlertCircle size={32} style={{ opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Failed to load analytics: <strong>{error}</strong></p>
            <button className="btn btn-sm" onClick={() => fetchAnalytics(true)}>Try Again</button>
        </div>
    );

    if (!data) return null;

    const { statusCounts, avgCompletionDays, topRecipients, monthlyData } = data;

    const maxMonthly = Math.max(...monthlyData.map(m => Math.max(m.sent, m.responded || 0, m.completed)), 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className={styles.container}>
            {/* Header with Refresh */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button
                    className="btn btn-sm"
                    onClick={() => fetchAnalytics(false)}
                    disabled={isRefreshing}
                    title="Refresh analytics"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                    <RefreshCw size={14} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            <div className={styles.grid}>
                {/* 1. Status Summary Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Activity size={18} className={styles.iconBlue} />
                        <h3>Request Status</h3>
                    </div>
                    <div className={styles.statusGrid}>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{statusCounts.Sent || 0}</span>
                            <span className={styles.statLabel}>Sent</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{statusCounts.Seen || 0}</span>
                            <span className={styles.statLabel}>Seen</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{statusCounts.Responded || 0}</span>
                            <span className={styles.statLabel}>Responded</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{statusCounts.Completed || 0}</span>
                            <span className={styles.statLabel}>Completed</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue} style={{ color: statusCounts.Expired > 0 ? '#ef4444' : 'inherit' }}>
                                {statusCounts.Expired || 0}
                            </span>
                            <span className={styles.statLabel}>Expired</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{statusCounts.Archived || 0}</span>
                            <span className={styles.statLabel}>Archived</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue} style={{ fontWeight: 700 }}>{statusCounts.Total || 0}</span>
                            <span className={styles.statLabel}>Total</span>
                        </div>
                    </div>
                </div>

                {/* 2. Avg Completion Time */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Clock size={18} className={styles.iconGreen} />
                        <h3>Avg. Completion Time</h3>
                    </div>
                    <div className={styles.bigStat}>
                        {avgCompletionDays} <span className={styles.unit}>days</span>
                    </div>
                    <p className={styles.subtext}>Average time from Sent → Completed</p>
                </div>

                {/* 3. Top Recipients */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Users size={18} className={styles.iconPurple} />
                        <h3>Top Recipients</h3>
                    </div>
                    <ul className={styles.list}>
                        {topRecipients.length === 0 ? (
                            <li className={styles.empty}>No data yet</li>
                        ) : (
                            topRecipients.map((r, i) => (
                                <li key={i} className={styles.listItem}>
                                    <span className={styles.rank}>{i + 1}</span>
                                    <span className={styles.name}>{r.name}</span>
                                    <span className={styles.count}>{r.count}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>

                {/* 4. Monthly Activity Chart (full width) */}
                <div className={`${styles.card} ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <BarChart size={18} className={styles.iconOrange} />
                        <h3>Monthly Activity ({new Date().getFullYear()})</h3>
                        <div className={styles.legend}>
                            <span className={styles.legendItem}><span className={styles.dotSent}></span> Sent</span>
                            <span className={styles.legendItem}><span className={styles.dotResponded}></span> Responded</span>
                            <span className={styles.legendItem}><span className={styles.dotComp}></span> Completed</span>
                        </div>
                    </div>
                    <div className={styles.chartContainer}>
                        {monthlyData.map((d, i) => (
                            <div key={i} className={styles.barGroup}>
                                <div className={styles.bars}>
                                    <div
                                        className={styles.barSent}
                                        style={{ height: `${(d.sent / maxMonthly) * 100}%` }}
                                        title={`Sent: ${d.sent}`}
                                    ></div>
                                    <div
                                        className={styles.barResponded}
                                        style={{ height: `${((d.responded || 0) / maxMonthly) * 100}%` }}
                                        title={`Responded: ${d.responded || 0}`}
                                    ></div>
                                    <div
                                        className={styles.barCompleted}
                                        style={{ height: `${(d.completed / maxMonthly) * 100}%` }}
                                        title={`Completed: ${d.completed}`}
                                    ></div>
                                </div>
                                <span className={styles.monthLabel}>{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsWidget;
