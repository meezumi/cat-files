import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Filter, ChevronDown, Trash2, AlertTriangle, Search, RefreshCw, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RequestItem from './RequestItem';
import styles from './Dashboard.module.css';
import Loader from '../common/Loader';
import Modal from '../common/Modal';

const RequestList = ({ filterStatus }) => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ page: 1, limit: 10 });
    const [showFilter, setShowFilter] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedRequests, setSelectedRequests] = useState(new Set());
    const filterRef = useRef(null);

    // ... (useEffect for click outside remains same) ...

    const fetchRequests = useCallback(async (showLoader = true) => {
        if (showLoader) setLoading(true);
        else setIsRefreshing(true);

        try {
            let url = `/server/fetch_requests_function/?page=${page}&per_page=10`;
            if (filterStatus && filterStatus !== 'all') {
                url += `&status=${filterStatus}`;
            }
            if (debouncedSearch) {
                url += `&search=${encodeURIComponent(debouncedSearch)}`;
            }

            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'success') {
                setRequests(result.data);
                if (result.meta) setMeta(result.meta);
                setSelectedRequests(new Set()); // Reset selection on fetch
            }
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [filterStatus, page, debouncedSearch]);

    useEffect(() => {
        fetchRequests(true);
    }, [fetchRequests]);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleFilterClick = (status) => {
        setShowFilter(false);
        const route = status === 'all' ? '/dashboard/all' : `/dashboard/${status}`;
        navigate(route);
    };

    const handleEmptyTrash = async () => {
        setShowDeleteModal(false);
        setLoading(true);
        try {
            const response = await fetch('/server/workflow_function/trash', {
                method: 'DELETE'
            });
            const result = await response.json();
            if (result.status === 'success') {
                // Refresh list
                setPage(1);
                fetchRequests(true);
            } else {
                alert('Failed to empty trash: ' + result.message);
            }
        } catch (error) {
            console.error('Empty trash failed:', error);
            alert('An error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRequests(new Set(requests.map(r => r.id)));
        } else {
            setSelectedRequests(new Set());
        }
    };

    const handleSelectOne = (id) => {
        const newSet = new Set(selectedRequests);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedRequests(newSet);
    };

    const handleBatchAction = async (status) => {
        if (!selectedRequests.size) return;
        if (!window.confirm(`Are you sure you want to ${status} ${selectedRequests.size} request(s)?`)) return;

        setLoading(true);
        try {
            const response = await fetch('/server/workflow_function/requests/batch-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ids: Array.from(selectedRequests),
                    status: status
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                setSelectedRequests(new Set());
                fetchRequests(true);
            } else {
                alert('Batch action failed: ' + result.message);
            }
        } catch (error) {
            console.error('Batch action error:', error);
            alert('Batch action failed');
        } finally {
            setLoading(false);
        }
    };

    const deleteModalActions = (
        <>
            <button className="btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
            <button className="btn" onClick={handleEmptyTrash} style={{ background: '#dc3545', color: 'white', border: 'none' }}>
                Yes, Empty Trash
            </button>
        </>
    );

    return (
        <div className={styles.container}>
            <div className={styles.controls} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                                <div className={styles.dropdownItem} onClick={() => handleFilterClick('expired')}>Expired</div>
                                <div className={styles.dropdownItem} onClick={() => handleFilterClick('trash')}>Trash</div>
                            </div>
                        )}
                    </div>

                    <button
                        className="btn"
                        onClick={() => fetchRequests(false)}
                        title="Refresh List"
                        style={{
                            border: '1px solid #ddd',
                            background: 'white',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        disabled={loading || isRefreshing}
                    >
                        <RefreshCw size={16} className={isRefreshing ? styles.spin : ''} />
                    </button>

                    {selectedRequests.size > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginLeft: 8, borderLeft: '1px solid #ddd', paddingLeft: 8 }}>
                            <button
                                className="btn"
                                onClick={() => handleBatchAction('Archived')}
                                title="Archive Selected"
                                style={{ padding: 8 }}
                            >
                                <Archive size={16} />
                            </button>
                            <button
                                className="btn"
                                onClick={() => handleBatchAction('Trash')}
                                title="Move Selected to Trash"
                                style={{ padding: 8, color: '#dc3545' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {filterStatus === 'trash' && requests.length > 0 && (
                    <button
                        className="btn"
                        onClick={() => setShowDeleteModal(true)}
                        style={{
                            background: '#fee2e2',
                            color: '#dc3545',
                            border: '1px solid #fecaca',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Trash2 size={14} style={{ marginRight: 6 }} />
                        Empty Trash
                    </button>
                )}
            </div>

            {/* Search Bar */}
            <div style={{ padding: '0 16px 16px 16px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search requests by subject or recipient..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        style={{
                            width: '100%',
                            padding: '10px 10px 10px 40px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div className={styles.tableWrapper}>
                <div className={styles.tableHeader}>
                    <div className={styles.colCheckbox}>
                        <input
                            type="checkbox"
                            checked={requests.length > 0 && selectedRequests.size === requests.length}
                            onChange={handleSelectAll}
                        />
                    </div>
                    <div className={styles.colName}>Recipient</div>
                    <div className={styles.colSubject}>Subject</div>
                    <div className={styles.colStatus}>Status</div>
                    <div className={styles.colProgress}>Progress</div>
                    <div className={styles.colDate}>Date</div>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                        <Loader text="Loading requests..." />
                    </div>
                ) : requests.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>
                        {filterStatus === 'trash' ? 'Trash is empty.' : 'No requests found.'}
                    </div>
                ) : (
                    requests.map((req, index) => (
                        <RequestItem
                            key={req.id}
                            request={req}
                            index={index}
                            isSelected={selectedRequests.has(req.id)}
                            onToggle={() => handleSelectOne(req.id)}
                        />
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
                    disabled={requests.length < meta.limit}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>

            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Empty Trash?"
                actions={deleteModalActions}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#dc3545' }}>
                    <AlertTriangle size={24} />
                    <p style={{ color: '#333', margin: 0 }}>
                        Are you sure you want to permanently delete all items in the Trash?
                        <br />
                        <span style={{ fontSize: '13px', color: '#666' }}>This action cannot be undone.</span>
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default RequestList;
