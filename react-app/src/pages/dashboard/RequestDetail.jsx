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

    const handleStatusChange = async (itemId, newStatus) => {
        try {
            // Optimistic update
            setRequest(prev => ({
                ...prev,
                sections: prev.sections.map(section => ({
                    ...section,
                    items: section.items.map(item =>
                        item.id === itemId ? { ...item, status: newStatus } : item
                    )
                }))
            }));

            // API Call
            const response = await fetch(`/server/workflow_function/items/${itemId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error("Update failed");

        } catch (error) {
            console.error("Status update error:", error);
            // Revert (Simple reload or more complex rollback logic)
            alert("Failed to update status");
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to move this request to Trash?")) return;

        try {
            const response = await fetch(`/server/workflow_function/requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Trash' })
            });

            if (response.ok) {
                navigate('/dashboard/trash'); // or inbox
            } else {
                alert("Failed to delete request");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error deleting request");
        }
    };

    if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
    if (!request) return <div style={{ padding: 24 }}>Request not found</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titleRow}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)} title="Go Back">
                        <ArrowLeft size={20} />
                    </button>
                    <h1>{request.subject}</h1>
                    <div className={styles.actions}>
                        <button className={styles.iconBtn} onClick={handleDelete} title="Move to Trash">
                            <Trash2 size={18} />
                        </button>
                        <button className={styles.iconBtn} title="More Options">
                            <MoreHorizontal size={18} />
                        </button>
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
                                            {/* Actions for Review: Only show if Uploaded */}
                                            {item.status === 'Uploaded' && (
                                                <>
                                                    <button className={styles.approveBtn} onClick={() => handleStatusChange(item.id, 'Approved')}>
                                                        Approve
                                                    </button>
                                                    <button className={styles.rejectBtn} onClick={() => handleStatusChange(item.id, 'Returned')}>
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Render File Info if exists */}
                                    {item.status !== 'Pending' && item.fileId && (
                                        <div className={styles.fileInfo}>
                                            <FilePreview fileId={item.fileId} folderId={item.folderId} />
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

// Real File Preview Component
const FilePreview = ({ fileId, folderId }) => {
    // Construct Download URL
    // Since we are using function proxying: 
    // /server/upload_function/:id (GET)
    const downloadUrl = `/server/upload_function/${fileId}${folderId ? `?folderId=${folderId}` : ''}`;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#666', marginTop: '8px' }}>
            <div style={{ width: 16, height: 16, background: '#eee', borderRadius: 2 }}></div>
            <span>Document (ID: {fileId})</span>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                <ExternalLink size={14} style={{ cursor: 'pointer', marginLeft: 4 }} />
                <span style={{ marginLeft: 4 }}>View</span>
            </a>
            <a href={downloadUrl} download style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                <Download size={14} style={{ cursor: 'pointer', marginLeft: 8 }} />
            </a>
        </div>
    );
};

export default RequestDetail;
