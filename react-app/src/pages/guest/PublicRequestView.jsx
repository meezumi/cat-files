import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, Clock, FileText } from 'lucide-react';
import FileUploader from './FileUploader';
import styles from './PublicView.module.css';

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

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (!request) return <div className="error-message">Request not found or expired.</div>;

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

                                    {/* Upload Area */}
                                    {item.status !== 'Approved' && (
                                        <FileUploader onUploadComplete={(fileData) => {
                                            console.log('Uploaded:', fileData);
                                            // In a real app, update local state or re-fetch
                                            alert('File uploaded successfully!');
                                        }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PublicRequestView;
