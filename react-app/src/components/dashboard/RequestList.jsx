import React, { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import RequestItem from './RequestItem';
import styles from './Dashboard.module.css';

const RequestList = ({ filterStatus }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                // Build query string
                let url = '/server/files_function/api/requests';
                if (filterStatus && filterStatus !== 'all') {
                    url += `?status=${filterStatus}`;
                }

                const response = await fetch(url);
                const result = await response.json();

                if (result.status === 'success') {
                    setRequests(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch requests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [filterStatus]);

    if (loading) {
        return <div style={{ padding: 24 }}>Loading requests...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                {/* Placeholder for Filter Dropdown */}
                <button className="btn" style={{ border: '1px solid #ddd', background: 'white' }}>
                    <Filter size={14} style={{ marginRight: 8 }} />
                    Filter Requests
                </button>
            </div>

            <div className={styles.tableWrapper}>
                <div className={styles.tableHeader}>
                    <div className={styles.colCheckbox}><input type="checkbox" /></div>
                    <div className={styles.colName}>Recipient</div>
                    <div className={styles.colSubject}>Subject</div>
                    <div className={styles.colStatus}>Status</div>
                    <div className={styles.colProgress}>Progress</div>
                    <div className={styles.colDate}>Date</div>
                </div>

                {requests.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>No requests found.</div>
                ) : (
                    requests.map(req => (
                        <RequestItem key={req.id} request={req} />
                    ))
                )}
            </div>
        </div>
    );
};

export default RequestList;
