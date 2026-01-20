import React, { useEffect, useState, useRef } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequestItem from './RequestItem';
import styles from './Dashboard.module.css';
import Loader from '../common/Loader';

const RequestList = ({ filterStatus }) => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, limit: 10 });
    const [showFilter, setShowFilter] = useState(false);
    const filterRef = useRef(null);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilter(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

    const handleFilterClick = (status) => {
        setShowFilter(false);
        const route = status === 'all' ? '/dashboard/all' : `/dashboard/${status}`;
        navigate(route);
    };

    if (loading) return <Loader text="Loading requests..." />;

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <div style={{ position: 'relative' }} ref={filterRef}>
                    <button
                        className="btn"
                        style={{ border: '1px solid #ddd', background: 'white', display: 'flex', alignItems: 'center' }}
                        onClick={() => setShowFilter(!showFilter)}
                    >
                        <Filter size={14} style={{ marginRight: 8 }} />
                        Filter Requests: <strong>{filterStatus ? filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1) : 'All'}</strong>
                        <ChevronDown size={14} style={{ marginLeft: 8 }} />
                    </button>
                    {showFilter && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 4,
                            background: 'white',
                            border: '1px solid #eee',
                            borderRadius: 6,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            zIndex: 10,
                            minWidth: 160
                        }}>
                            <div className={styles.dropdownItem} onClick={() => handleFilterClick('all')}>All Requests</div>
                            <div className={styles.dropdownItem} onClick={() => handleFilterClick('drafts')}>Drafts</div>
                            <div className={styles.dropdownItem} onClick={() => handleFilterClick('sent')}>Sent</div>
                            <div className={styles.dropdownItem} onClick={() => handleFilterClick('completed')}>Completed</div>
                            <div className={styles.dropdownItem} onClick={() => handleFilterClick('trash')}>Trash</div>
                        </div>
                    )}
                </div>
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
