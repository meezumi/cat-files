import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationCenter.module.css';

const NotificationCenter = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await fetch('/server/fetch_requests_function/notifications');
            const result = await res.json();
            if (result.status === 'success') {
                setNotifications(result.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Poll for notifications every 30s
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            const res = await fetch('/server/fetch_requests_function/notifications/read-all', { method: 'PUT' });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, IsRead: true })));
            }
        } catch (e) { }
    };

    const handleMarkRead = async (id, isRead) => {
        if (isRead) return;
        try {
            await fetch(`/server/fetch_requests_function/notifications/${id}`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => n.ROWID === id ? { ...n, IsRead: true } : n));
        } catch (e) { }
    };

    const handleNavigate = (n) => {
        handleMarkRead(n.ROWID, n.IsRead);
        setIsOpen(false);
        if (n.Link) navigate(n.Link);
    };

    const unreadCount = notifications.filter(n => !n.IsRead).length;

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button
                className={styles.bellBtn}
                onClick={() => setIsOpen(!isOpen)}
                title="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className={styles.list}>
                        {loading && notifications.length === 0 ? (
                            <div className={styles.empty}>Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className={styles.empty}>No notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div
                                    key={n.ROWID}
                                    className={`${styles.item} ${n.IsRead ? styles.read : styles.unread}`}
                                    onClick={() => handleNavigate(n)}
                                >
                                    <div className={styles.itemContent}>
                                        <p className={styles.message}>{n.Message}</p>
                                        <span className={styles.time}>{new Date(n.CREATEDTIME).toLocaleString()}</span>
                                    </div>
                                    {!n.IsRead && <div className={styles.dot} />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
