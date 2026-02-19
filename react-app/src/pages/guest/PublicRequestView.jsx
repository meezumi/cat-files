import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, Clock, FileText, AlertTriangle } from 'lucide-react';
import FileUploader from './FileUploader';
import styles from './PublicView.module.css';
import Loader from '../../components/common/Loader';

const PublicRequestView = () => {
    const { id } = useParams();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await fetch(`/server/fetch_requests_function/${id}?view=guest`);
                if (!response.ok) throw new Error('Network error');
                const result = await response.json();
                if (result.status === 'success') {
                    setRequest(result.data);
                } else {
                    setFetchError(true);
                }
            } catch (error) {
                console.error('Failed to fetch request:', error);
                setFetchError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id]);

    const handleUploadDefault = (sectionId, itemId, fileData) => {
        setRequest(prev => ({
            ...prev,
            sections: prev.sections.map(sec => {
                if (sec.id !== sectionId) return sec;
                return {
                    ...sec,
                    items: sec.items.map(item => {
                        if (item.id !== itemId) return item;
                        return {
                            ...item,
                            status: 'Uploaded',
                            fileId: fileData.id,
                            fileName: fileData.filename
                        };
                    })
                };
            })
        }));
    };

    const handleSubmitRequest = () => {
        setSubmitted(true);
        toast.success(
            <div>
                <div style={{ fontWeight: 600 }}>Documents submitted!</div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 3 }}>
                    Thank you — your files are now under review.
                </div>
            </div>,
            { duration: 5000 }
        );
    };

    // ── States ───────────────────────────────────────
    if (loading) return <Loader text="Loading request…" />;

    if (fetchError) {
        return (
            <div className={styles.errorState}>
                <AlertTriangle size={40} style={{ color: '#f59e0b', marginBottom: 16 }} />
                <h2>Request not found</h2>
                <p>This link may have expired or is no longer available. Please contact the sender for a new link.</p>
            </div>
        );
    }

    if (!request) {
        return (
            <div className={styles.errorState}>
                <h2>Unable to load request</h2>
                <p>Something went wrong. Please try refreshing the page.</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className={styles.errorState}>
                <CheckCircle size={48} style={{ color: '#10b981', marginBottom: 16 }} />
                <h2>Submission received!</h2>
                <p>Your documents have been submitted for review. You can close this window.</p>
            </div>
        );
    }

    // ── Render ───────────────────────────────────────
    return (
        <div className={styles.container}>
            <div className={styles.intro}>
                <h1>{request.subject}</h1>
                <p className={styles.message}>
                    Hi <strong>{request.recipient?.name}</strong>, please upload the requested documents below.
                </p>
                <div className={styles.meta}>
                    {request.date && (
                        <span className={styles.metaItem}>
                            <Clock size={15} /> Due: {new Date(request.date).toLocaleDateString()}
                        </span>
                    )}
                    <span className={styles.metaItem}>{request.progress} completed</span>
                </div>
            </div>

            <div className={styles.sections}>
                {request.sections && request.sections.map(section => (
                    <div key={section.id} className={styles.section}>
                        <h3 className={styles.sectionTitle}>{section.title}</h3>
                        <div className={styles.items}>
                            {section.items.map(item => (
                                <div key={item.id} className={styles.itemCard}>
                                    <div className={styles.itemHeader}>
                                        <div className={styles.itemInfo}>
                                            <FileText size={20} className={styles.icon} />
                                            <div>
                                                <h4>{item.title}</h4>
                                                {item.status === 'Approved' && (
                                                    <span className={styles.approvedBadge}>
                                                        <CheckCircle size={12} /> Approved
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className={styles.status}>{item.status}</div>
                                    </div>

                                    {/* Returned — show notice + re-upload */}
                                    {item.status === 'Returned' && (
                                        <div>
                                            <p className={styles.returnedNotice}>
                                                <AlertTriangle size={14} />
                                                This file was returned. Please upload again.
                                            </p>
                                            <FileUploader
                                                requestId={request.id}
                                                sectionId={section.id}
                                                itemId={item.id}
                                                allowedFileTypes={item.allowedFileTypes}
                                                onUploadComplete={(fileData) => handleUploadDefault(section.id, item.id, fileData)}
                                            />
                                        </div>
                                    )}

                                    {/* Already uploaded */}
                                    {item.status !== 'Returned' && (item.status === 'Uploaded' || item.fileId) && (
                                        <div className={styles.uploadedFile}>
                                            <span className={styles.fileName}>
                                                {item.fileName || `Document (ID: ${item.fileId})`}
                                            </span>
                                            <span className={styles.uploadSuccess}>
                                                <CheckCircle size={14} /> Uploaded
                                            </span>
                                        </div>
                                    )}

                                    {/* Pending upload */}
                                    {item.status !== 'Returned' && item.status !== 'Approved' && item.status !== 'Uploaded' && !item.fileId && (
                                        <FileUploader
                                            requestId={request.id}
                                            sectionId={section.id}
                                            itemId={item.id}
                                            allowedFileTypes={item.allowedFileTypes}
                                            onUploadComplete={(fileData) => handleUploadDefault(section.id, item.id, fileData)}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.actions}>
                <button className={styles.submitBtn} onClick={handleSubmitRequest}>
                    Submit Documents
                </button>
            </div>
        </div>
    );
};

export default PublicRequestView;

