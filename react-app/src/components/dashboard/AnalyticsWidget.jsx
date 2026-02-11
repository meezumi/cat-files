
import React, { useState, useEffect } from 'react';
import { BarChart, Clock, Users, Activity } from 'lucide-react';
import styles from './AnalyticsWidget.module.css';

const AnalyticsWidget = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/server/fetch_requests_function/analytics');
                const result = await res.json();
                if (result.status === 'success') {
                    setData(result.data);
                }
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) return <div className={styles.loading}>Loading analytics...</div>;
    if (!data) return null;

    const { statusCounts, avgCompletionDays, topRecipients, monthlyData } = data;

    // Helper to calculate bar height for charts
    const maxMonthly = Math.max(...monthlyData.map(m => Math.max(m.sent, m.completed)), 1);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className={styles.container}>
            <div className={styles.grid}>
                {/* 1. Summary Cards */}
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
                            <span className={styles.statValue}>{statusCounts.Responded || 0}</span>
                            <span className={styles.statLabel}>Responded</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{statusCounts.Completed || 0}</span>
                            <span className={styles.statLabel}>Completed</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statValue}>{statusCounts.Total || 0}</span>
                            <span className={styles.statLabel}>Total</span>
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Clock size={18} className={styles.iconGreen} />
                        <h3>Avg. Completion Time</h3>
                    </div>
                    <div className={styles.bigStat}>
                        {avgCompletionDays} <span className={styles.unit}>days</span>
                    </div>
                    <p className={styles.subtext}>Average time from Sent to Completed/Archived</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <Users size={18} className={styles.iconPurple} />
                        <h3>Top Requesters</h3>
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

                {/* 2. Monthly Chart (Spanning Full Width) */}
                <div className={`${styles.card} ${styles.chartCard}`}>
                    <div className={styles.cardHeader}>
                        <BarChart size={18} className={styles.iconOrange} />
                        <h3>Monthly Activity ({new Date().getFullYear()})</h3>
                        <div className={styles.legend}>
                            <span className={styles.legendItem}><span className={styles.dotSent}></span> Sent</span>
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
