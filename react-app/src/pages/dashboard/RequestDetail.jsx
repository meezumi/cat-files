import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import FilePreview from '../../components/common/FilePreview';
import {
    ArrowLeft,
    MoreHorizontal,
    Trash2,
    Clock,
    Download,
    Share2,
    Edit,
    Copy,
    BookOpen,
    Archive,
    CheckCircle,
    Check,
    X,
    History
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import styles from './RequestDetail.module.css';

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isViewer } = useAuth();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [activeTab, setActiveTab] = useState('details'); // 'details' | 'activity'

    // CC Recipient State
    const [showCCInput, setShowCCInput] = useState(false);
    const [ccName, setCcName] = useState('');
    const [ccEmail, setCcEmail] = useState('');

    // Editing State
    const [isEditingDueDate, setIsEditingDueDate] = useState(false);
    const [dueDate, setDueDate] = useState('');

    // Reminder State
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderMessage, setReminderMessage] = useState('');
    const [sendingReminder, setSendingReminder] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Handlers
    const handleDownloadAll = async () => {
        setIsDownloading(true);
        const toastId = toast.loading("Preparing download...");
        try {
            const response = await fetch(`/server/upload_function/download-all/${id}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Request_${id}_Files.zip`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success("Download started", { id: toastId });
            } else {
                let errorMsg = "Unknown error";
                try {
                    const err = await response.json();
                    errorMsg = err.message;
                } catch (e) {
                    errorMsg = response.statusText;
                }
                toast.error(`Download failed: ${errorMsg}`, { id: toastId });
            }
        } catch (error) {
            console.error("Download Error:", error);
            toast.error("Failed to download files", { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleMarkCompleted = () => {
        setShowCompleteModal(true);
    };

    const confirmMarkCompleted = async () => {
        setShowCompleteModal(false);
        await updateRequestStatus('Completed');
    };

    const handleSendReminder = () => {
        setShowReminderModal(true);
    };

    const confirmSendReminder = async () => {
        setSendingReminder(true);
        try {
            const res = await fetch(`/server/workflow_function/requests/${id}/remind`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customMessage: reminderMessage })
            });
            const result = await res.json();

            if (res.ok) {
                toast.success("Reminder sent successfully!");
                setShowReminderModal(false);
                setReminderMessage('');
            } else {
                toast.error(`Failed to send reminder: ${result.message}`);
            }
        } catch (err) {
            console.error("Failed to send reminder", err);
            toast.error("An error occurred while sending the reminder.");
        } finally {
            setSendingReminder(false);
        }
    };

    const handleAddCC = async () => {
        try {
            const response = await fetch(`/server/workflow_function/requests/${id}/cc`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: ccName, email: ccEmail })
            });
            const result = await response.json();

            if (result.status === 'success') {
                // Update local state
                setRequest(prev => ({
                    ...prev,
                    ccRecipients: result.data
                }));
                // Reset form
                setCcName('');
                setCcEmail('');
                setShowCCInput(false);
                toast.success("CC Recipient added");
            } else {
                toast.error('Failed to add CC: ' + result.message);
            }
        } catch (err) {
            console.error('Add CC Error:', err);
        }
    };

    const handleUpdateDueDate = async () => {
        try {
            const response = await fetch(`/server/workflow_function/requests/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dueDate: dueDate })
            });
            const result = await response.json();

            if (result.status === 'success') {
                setRequest(prev => ({
                    ...prev,
                    dueDate: dueDate
                }));
                toast.success("Due date updated");
                setIsEditingDueDate(false);
            } else {
                toast.error('Failed to update due date: ' + result.message);
            }
        } catch (err) {
            console.error("Update Due Date Error:", err);
            toast.error("Failed to update due date");
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
                    // Initialize editing state
                    if (result.data.dueDate) {
                        // Ensure format is YYYY-MM-DD
                        setDueDate(new Date(result.data.dueDate).toISOString().split('T')[0]);
                    }
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
            toast.success("Item status updated");

        } catch (error) {
            console.error("Status update error:", error);
            toast.error("Failed to update status");
            // Revert optimistic update (TODO: Implement proper revert)
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
                toast.success("Saved as Template successfully!");
                setShowDropdown(false);
            }
        } catch (err) {
            console.error("Failed to save template:", err);
            toast.error("Failed to save template");
        }
    };

    // ...

    // ...

    const handleShare = () => {
        // Construct Public Guest URL
        // origin + /app/p/ + requestID
        const url = `${window.location.origin}/app/p/${id}`;
        navigator.clipboard.writeText(url);
        toast.success(
            <div>
                <div>Guest link copied to clipboard!</div>
                <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '4px' }}>
                    You can now share it with the recipient.
                </div>
            </div>,
            { duration: 4000 }
        );
        setShowDropdown(false);
    };

    // ...

    if (loading) return <Loader text="Loading request details..." />;
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
                        {request.status === 'Archived' ? (
                            // Archived requests only show Restore button
                            <div className={styles.headerActions}>
                                <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={() => updateRequestStatus('Unarchived')}>
                                    <Archive size={16} style={{ marginRight: 6 }} />
                                    Restore from Archive
                                </button>
                            </div>
                        ) : (
                            // Active requests show normal action buttons (hidden for Viewers)
                            !isViewer() && (
                                <div className={styles.headerActions}>
                                    <button className={styles.actionBtn} onClick={handleShare}>
                                        <Share2 size={16} style={{ marginRight: 6 }} />
                                        Share Request
                                    </button>
                                    <button className={styles.actionBtn} onClick={handleDownloadAll} disabled={isDownloading}>
                                        <Download size={16} style={{ marginRight: 6 }} />
                                        Download All
                                    </button>
                                    <button className={styles.actionBtn} onClick={handleSendReminder}>
                                        <Clock size={16} style={{ marginRight: 6 }} />
                                        Send Reminder
                                    </button>
                                    {/* Only show Mark Completed if status is NOT Draft and NOT already Completed */}
                                    {request.status !== 'Draft' && request.status !== 'Completed' && (
                                        <button className={`${styles.actionBtn} ${styles.actionBtnPrimary}`} onClick={handleMarkCompleted}>
                                            <CheckCircle size={16} style={{ marginRight: 6 }} />
                                            Mark Completed
                                        </button>
                                    )}
                                </div>
                            )
                        )}

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

                                        <button className={styles.dropdownItem} onClick={() => updateRequestStatus('Expired')}>
                                            <Clock size={14} />
                                            Expire Request
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
                        <strong>Created:</strong> {new Date(request.date).toLocaleDateString()}
                    </div>
                    <div className={styles.metaItem}>
                        <strong>Due Date:</strong>
                        {isEditingDueDate ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8, gap: 8 }}>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className={styles.dateInput}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUpdateDueDate}
                                    style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                                >
                                    Save
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => setIsEditingDueDate(false)}
                                    style={{ padding: '6px 12px', fontSize: '12px', height: '32px', background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-main)' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span style={{ marginLeft: 4 }}>
                                    {request.dueDate ? new Date(request.dueDate).toLocaleDateString() : 'N/A'}
                                </span>
                                {!isViewer() && request.status !== 'Completed' && request.status !== 'Archived' && (
                                    <button
                                        onClick={() => setIsEditingDueDate(true)}
                                        className={styles.iconBtn}
                                        style={{
                                            width: 24,
                                            height: 24,
                                            marginLeft: 8,
                                            border: 'none',
                                            background: 'transparent',
                                            display: 'inline-flex'
                                        }}
                                        title="Edit Due Date"
                                    >
                                        <Edit size={14} />
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                    <div className={styles.metaItem}>
                        <strong>Status:</strong> <span className={styles.statusBadge}>{request.status}</span>
                    </div>
                </div>
            </header>

            <div className={styles.content}>
                <div className={styles.tabContainer}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'details' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('details')}
                    >
                        Checklist Details
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'activity' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        Before Activity Log
                    </button>
                </div>

                {activeTab === 'details' ? (
                    <>
                        <div className={styles.recipientsSection}>
                            <h2>Recipients</h2>
                            <div className={styles.recipientsList}>
                                {/* Primary Recipient */}
                                <div className={styles.recipientPill}>
                                    <span title={request.recipient?.email}>{request.recipient?.name}</span>
                                    <span style={{ fontSize: 11, opacity: 0.7 }}>Primary</span>
                                </div>

                                {/* CC Recipients */}
                                {request.ccRecipients && request.ccRecipients.map((cc, idx) => (
                                    <div key={idx} className={`${styles.recipientPill} ${styles.secondaryPill}`}>
                                        <span title={cc.email}>{cc.name}</span>
                                        <span style={{ fontSize: 11, opacity: 0.7 }}>CC</span>
                                    </div>
                                ))}
                            </div>

                            {!showCCInput ? (
                                !isViewer() && request.status !== 'Completed' && request.status !== 'Archived' && (
                                    <button className="btn btn-sm btn-outline" onClick={() => setShowCCInput(true)}>
                                        + Add CC Recipient
                                    </button>
                                )
                            ) : (
                                <div className={styles.ccInputRow}>
                                    <input
                                        className={styles.ccInput}
                                        placeholder="Name"
                                        value={ccName}
                                        onChange={(e) => setCcName(e.target.value)}
                                    />
                                    <input
                                        className={styles.ccInput}
                                        placeholder="Email"
                                        value={ccEmail}
                                        onChange={(e) => setCcEmail(e.target.value)}
                                    />
                                    <div className={styles.ccActions}>
                                        <button className="btn btn-sm btn-primary" onClick={handleAddCC} disabled={!ccName || !ccEmail}>Add</button>
                                        <button className="btn btn-sm" onClick={() => setShowCCInput(false)}>Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>

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

                                                    {/* Approve/Reject visible ONLY if file is uploaded (Not Pending) and not already decided */}
                                                    {item.status !== 'Approved' && item.status !== 'Returned' && item.status !== 'Pending' && (
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
                                                    <FilePreview fileId={item.fileId} fileName={item.fileName} folderId={item.folderId} />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className={styles.activityLogContainer}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <History size={18} />
                            Activity History
                        </h2>
                        {request.activityLogs && request.activityLogs.length > 0 ? (
                            <div className={styles.timeline}>
                                {request.activityLogs.map((log, index) => (
                                    <div key={index} className={styles.timelineItem}>
                                        <div className={styles.timelineIcon}>
                                            <div className={styles.dot} />
                                        </div>
                                        <div className={styles.timelineContent}>
                                            <p className={styles.logDetail}>{log.Details}</p>
                                            <div className={styles.logMeta}>
                                                <span className={styles.logAction}>{log.Action}</span>
                                                <span className={styles.bullet}>•</span>
                                                <span>{log.Actor}</span>
                                                <span className={styles.bullet}>•</span>
                                                <span>
                                                    {formatDistanceToNow(new Date(log.CREATEDTIME), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>No activity recorded yet.</div>
                        )}
                    </div>
                )}
            </div>
            <Modal
                isOpen={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                title="Mark as Completed"
                actions={
                    <>
                        <button className="btn" onClick={() => setShowCompleteModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={confirmMarkCompleted}>
                            Yes, Mark Completed
                        </button>
                    </>
                }
            >
                <p>Are you sure you want to mark this request as <strong>Completed</strong>?</p>
                <p>This indicates that all necessary documents have been received and reviewed.</p>
            </Modal>


            <Modal
                isOpen={showReminderModal}
                onClose={() => setShowReminderModal(false)}
                title="Send Reminder"
                actions={
                    <>
                        <button className="btn" onClick={() => setShowReminderModal(false)} disabled={sendingReminder}>Cancel</button>
                        <button className="btn btn-primary" onClick={confirmSendReminder} disabled={sendingReminder}>
                            {sendingReminder ? 'Sending...' : 'Send Reminder'}
                        </button>
                    </>
                }
            >
                <div style={{ paddingBottom: '8px' }}>
                    <p style={{ marginBottom: '16px', color: 'var(--color-text-muted)' }}>
                        Send a reminder email to <strong>{request.recipient?.name}</strong> ({request.recipient?.email})?
                    </p>

                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--color-text-muted)' }}>
                        Add a personal note (optional)
                    </label>
                    <textarea
                        value={reminderMessage}
                        onChange={(e) => setReminderMessage(e.target.value)}
                        placeholder="e.g. Please upload these by Friday."
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            fontSize: '14px',
                            resize: 'vertical',
                            background: 'var(--color-input-bg)',
                            color: 'var(--color-text-main)'
                        }}
                    />
                </div>
            </Modal>
        </div>

    );
};



export default RequestDetail;
