import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

const RequestItem = ({ request }) => {
    const navigate = useNavigate();

    const getStatusBadge = (status) => {
        switch (status.toLowerCase()) {
            case 'draft': return styles.badgeDraft;
            case 'sent': return styles.badgeSent;
            case 'completed': return styles.badgeCompleted;
            default: return '';
        }
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
