import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MoreHorizontal,
    Trash2,
    Clock,
    ExternalLink,
    Download
} from 'lucide-react';
import styles from './RequestDetail.module.css';

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch request data
        const fetchRequest = async () => {
            try {
                const response = await fetch(`/server/fetch_requests_function/${id}`);
                const result = await response.json();
                if (result.status === 'success') {
                    setRequest(result.data);
                }
            } catch (error) {
                console.error('Failed to fetch request:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id]);

    const handleStatusChange = (itemId, newStatus) => {
        // In real app: PUT /api/requests/:id/items/:itemId
        // Here: Optimistic local update
        setRequest(prev => ({
            ...prev,
            items: prev.items.map(item =>
                item.id === itemId ? { ...item, status: newStatus } : item
            )
        }));
    };

    if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
    if (!request) return <div style={{ padding: 24 }}>Request not found</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h1>{request.subject}</h1>
                    <div className={styles.actions}>
                        <button className={styles.iconBtn}><Trash2 size={18} /></button>
                        <button className={styles.iconBtn}><MoreHorizontal size={18} /></button>
                    </div>
                </div>

                <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                        <strong>Recipient:</strong> {request.recipient?.name}
                    </div>
                    <div className={styles.metaItem}>
                        <strong>Due Date:</strong> {new Date(request.date).toLocaleDateString()}
                    </div>
                    <div className={styles.metaItem}>
                        <strong>Status:</strong> <span className={styles.statusBadge}>{request.status}</span>
                    </div>
                </div>
            </header>

            <div className={styles.content}>
                <h2>Checklist Items</h2>
                <div className={styles.checklist}>
                    {request.sections && request.sections.map(section => (
                        <div key={section.id} className={styles.section}>
                            <h3 className={styles.sectionTitle}>{section.title}</h3>
                            {section.items && section.items.map(item => (
                                <div key={item.id} className={styles.itemCard}>
                                    <div className={styles.itemHeader}>
                                        <h3>{item.title}</h3>
                                        <div className={styles.itemActions}>
                                            <span className={`${styles.badge} ${styles[item.status.toLowerCase()]}`}>
                                                {item.status}
                                            </span>
                                            {/* Actions for Review */}
                                            {item.status === 'Uploaded' && (
                                                <>
                                                    <button className={styles.approveBtn} onClick={() => handleStatusChange(section.id, item.id, 'Approved')}>
                                                        Approve
                                                    </button>
                                                    <button className={styles.rejectBtn} onClick={() => handleStatusChange(section.id, item.id, 'Returned')}>
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Render File Info if exists (Mock) */}
                                    {item.status !== 'Pending' && (
                                        <div className={styles.fileInfo}>
                                            <FilePreview />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Mock File Preview Component
const FilePreview = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666', marginTop: '8px' }}>
        <div style={{ width: 16, height: 16, background: '#eee', borderRadius: 2 }}></div>
        <span>document.pdf</span>
        <ExternalLink size={14} style={{ cursor: 'pointer' }} />
        <Download size={14} style={{ cursor: 'pointer' }} />
    </div>
);

export default RequestDetail;
