import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    MoreHorizontal,
    Trash2,
    Clock,
    ExternalLink,
    Download,
    Share2,
    Edit,
    Copy,
    BookOpen,
    Archive,
    CheckCircle,
    Check,
    X
} from 'lucide-react';
import styles from './RequestDetail.module.css';

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);

    // Handlers
    const handleMarkCompleted = async () => {
        if (!window.confirm("Mark this request as Completed?")) return;
        await updateRequestStatus('Completed');
    };

    const handleSendReminder = async () => {
        try {
            const res = await fetch(`/server/workflow_function/requests/${id}/remind`, { method: 'POST' });
            if (res.ok) alert("Reminder sent successfully!");
        } catch (err) {
            console.error("Failed to send reminder", err);
        }
    };

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

            const response = await fetch(`/server/workflow_function/items/${itemId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error("Update failed");

        } catch (error) {
            console.error("Status update error:", error);
            alert("Failed to update status");
        }
    };

    const updateRequestStatus = async (newStatus) => {
        try {
            const response = await fetch(`/server/workflow_function/requests/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (response.ok) {
                if (newStatus === 'Trash') navigate('/dashboard/trash');
                else {
                    setRequest(prev => ({ ...prev, status: newStatus }));
                    setShowDropdown(false);
                }
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleSaveAsTemplate = async () => {
        try {
            if (!request) return;
            // Clean payload for creating new template
            const payload = {
                recipientName: '', // Templates don't usually have recipients? Or should we keep it? Let's clear it.
                recipientEmail: '',
                subject: request.subject,
                message: request.description,
                status: 'Draft',
                isTemplate: true,
                sections: request.sections.map(s => ({
                    title: s.title,
                    description: '',
                    items: s.items.map(i => ({ title: i.title, type: i.type }))
                }))
            };

            const res = await fetch('/server/create_request_function/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Saved as Template successfully!");
                setShowDropdown(false);
            }
        } catch (err) {
            console.error("Failed to save template:", err);
        }
    };

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        alert("Link copied to clipboard!");
        setShowDropdown(false);
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
                        <div className={styles.headerActions}>
                            <button className={styles.actionBtn} onClick={handleSendReminder}>
                                <Clock size={16} style={{ marginRight: 6 }} />
                                Send Reminder
                            </button>
                            <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleMarkCompleted}>
                                <CheckCircle size={16} style={{ marginRight: 6 }} />
                                Mark Completed
                            </button>
                        </div>

                        <button className={styles.iconBtn} onClick={() => updateRequestStatus('Trash')} title="Move to Trash">
                            <Trash2 size={18} />
                        </button>

                        <div style={{ position: 'relative' }}>
                            <button
                                className={styles.iconBtn}
                                title="More Options"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <MoreHorizontal size={18} />
                            </button>

                            {showDropdown && (
                                <>
                                    <div className={styles.bgOverlay} onClick={() => setShowDropdown(false)} />
                                    <div className={styles.dropdownMenu}>
                                        <button className={styles.dropdownItem} onClick={handleShare}>
                                            <Share2 size={14} />
                                            Share Request
                                        </button>
                                        <button className={styles.dropdownItem} onClick={() => navigate(`/dashboard/new?templateId=${id}`)}>
                                            <Edit size={14} />
                                            Edit Request
                                        </button>
                                        <button className={styles.dropdownItem} onClick={handleSaveAsTemplate}>
                                            <Copy size={14} />
                                            Save as Template
                                        </button>
                                        <button className={styles.dropdownItem} onClick={() => updateRequestStatus('Unread')}>
                                            <BookOpen size={14} />
                                            Mark Unread
                                        </button>
                                        <button className={styles.dropdownItem} onClick={() => updateRequestStatus('Archived')}>
                                            <Archive size={14} />
                                            Archive Request
                                        </button>
                                        <button className={styles.dropdownItem} onClick={() => updateRequestStatus('Trash')} style={{ color: '#ef4444' }}>
                                            <Trash2 size={14} />
                                            Delete Request
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
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

                                            {/* Approve/Reject visible ONLY if not already decided (Approved or Returned) */}
                                            {item.status !== 'Approved' && item.status !== 'Returned' && (
                                                <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                                                    <button
                                                        className={styles.approveBtn}
                                                        onClick={() => handleStatusChange(item.id, 'Approved')}
                                                        title="Approve Item"
                                                    >
                                                        <Check size={14} />
                                                        Approve
                                                    </button>
                                                    <button
                                                        className={styles.rejectBtn}
                                                        onClick={() => handleStatusChange(item.id, 'Returned')}
                                                        title="Reject/Return Item"
                                                    >
                                                        <X size={14} />
                                                        Reject
                                                    </button>
                                                </div>
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
