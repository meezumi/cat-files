import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, FileText } from 'lucide-react';
import FileUploader from './FileUploader';
import styles from './PublicView.module.css';
import Loader from '../../components/common/Loader';

const PublicRequestView = () => {
    const { id } = useParams();
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const response = await fetch(`/server/fetch_requests_function/${id}?view=guest`);
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

    if (loading) return <Loader text="Loading..." />;
    if (!request) return <div className="error-message">Request not found or expired.</div>;

    // ...
    if (loading) return <Loader text="Loading..." />;
    if (!request) return <div className="error-message">Request not found or expired.</div>;

    const handleUploadDefault = (sectionId, itemId, fileData) => {
        // Update local state to reflect upload immediately
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

    const handleSubmitRequest = async () => {
        // Optional: Call API to explicitly set status to Responded/In Review
        // For now, since upload triggers 'Responded', we can just show a success message or redirect
        alert("Thank you! Your documents have been submitted for review.");
        // Reload or redirect?
        // window.location.reload(); 
    };

    return (
        <div className={styles.container}>
            <div className={styles.intro}>
                <h1>{request.subject}</h1>
                <p className={styles.message}>
                    Hi {request.recipient?.name}, please upload the requested documents below.
                </p>
                <div className={styles.meta}>
                    <span className={styles.metaItem}><Clock size={16} /> Due: {new Date(request.date).toLocaleDateString()}</span>
                    <span className={styles.metaItem}>{request.progress} Completed</span>
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
                                                {item.status === 'Approved' && <span className={styles.approvedBadge}><CheckCircle size={12} /> Approved</span>}
                                            </div>
                                        </div>
                                        <div className={styles.status}>
                                            {item.status}
                                        </div>
                                    </div>

                                    {/* Upload Area OR File Display */}
                                    {(item.status === 'Uploaded' || item.fileId) ? (
                                        <div className={styles.uploadedFile}>
                                            <span className={styles.fileName}>
                                                {item.fileName || `Document (ID: ${item.fileId})`}
                                            </span>
                                            <span className={styles.uploadSuccess}>
                                                <CheckCircle size={14} /> Uploaded
                                            </span>
                                        </div>
                                    ) : (
                                        item.status !== 'Approved' && item.status !== 'Returned' && (
                                            <FileUploader
                                                requestId={request.id}
                                                sectionId={section.id}
                                                itemId={item.id}
                                                allowedFileTypes={item.allowedFileTypes}
                                                onUploadComplete={(fileData) => handleUploadDefault(section.id, item.id, fileData)}
                                            />
                                        )
                                    )}

                                    {/* Handle Returned items specifically if needed, likely re-enable upload */}
                                    {item.status === 'Returned' && (
                                        <div style={{ marginTop: 10 }}>
                                            <p style={{ color: '#d32f2f', fontSize: 13, marginBottom: 8 }}>Item was returned. Please upload again.</p>
                                            <FileUploader
                                                requestId={request.id}
                                                sectionId={section.id}
                                                itemId={item.id}
                                                allowedFileTypes={item.allowedFileTypes}
                                                onUploadComplete={(fileData) => handleUploadDefault(section.id, item.id, fileData)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.actions}>
                <button className={styles.submitBtn} onClick={handleSubmitRequest}>
                    Submit Request
                </button>
            </div>
        </div>
    );
};

export default PublicRequestView;
