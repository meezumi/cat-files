import React, { useEffect, useState } from 'react';
import { Filter } from 'lucide-react';
import RequestItem from './RequestItem';
import styles from './Dashboard.module.css';

const RequestList = ({ filterStatus }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, limit: 10 });

    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                // Build query string
                let url = `/server/fetch_requests_function/?page=${page}&per_page=10`;
                if (filterStatus && filterStatus !== 'all') {
                    url += `&status=${filterStatus}`;
                }

                const response = await fetch(url);
                const result = await response.json();

                if (result.status === 'success') {
                    setRequests(result.data);
                    if (result.meta) setMeta(result.meta);
                }
            } catch (error) {
                console.error('Failed to fetch requests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [filterStatus, page]);

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

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', gap: '8px' }}>
                <button
                    className="btn"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px' }}>Page {page}</span>
                <button
                    className="btn"
                    disabled={requests.length < meta.limit} // Simple check for now
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
};


export default RequestList;
