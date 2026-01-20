import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

const RequestItem = ({ request }) => {
    const navigate = useNavigate();

    const getStatusBadge = (status) => {
        const s = status.toLowerCase().replace(' ', ''); // Handle 'In Review' -> 'inreview' if needed, or just match exact
        if (s === 'draft') return styles.badgeDraft;
        if (s === 'sent') return styles.badgeSent;
        if (s === 'completed') return styles.badgeCompleted;
        if (s === 'trash') return styles.badgeTrash;
        if (s === 'seen') return styles.badgeSeen;
        if (s === 'responded') return styles.badgeResponded;
        if (s === 'inreview' || s === 'in review') return styles.badgeInReview;
        if (s === 'expired') return styles.badgeExpired;
        if (s === 'archived') return styles.badgeArchived;
        return '';
    };

    return (
        <div className={styles.tableRow} onClick={() => navigate(`/dashboard/requests/${request.id}`)}>
            <div className={styles.colCheckbox}>
                <input type="checkbox" onClick={(e) => e.stopPropagation()} />
            </div>
            <div className={styles.colName}>{request.recipient?.name || 'Unknown'}</div>
            <div className={styles.colSubject}>{request.subject}</div>
            <div className={styles.colStatus}>
                {request.status && (
                    <span className={`${styles.badge} ${getStatusBadge(request.status)}`}>
                        {request.status}
                    </span>
                )}
            </div>
            <div className={styles.colProgress}>{request.progress}</div>
            <div className={styles.colDate}>
                {new Date(request.date).toLocaleDateString()}
            </div>
        </div>
    );
};

export default RequestItem;
