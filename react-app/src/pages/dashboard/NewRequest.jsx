import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, FileText, Calendar, Clock, Save } from 'lucide-react';
import styles from './NewRequest.module.css';

const NewRequest = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        recipientName: '',
        recipientEmail: '',
        subject: '',
        message: '',
        items: [],
        dueDate: '',
        reminderFreq: 3
    });
    const [loading, setLoading] = useState(false);

    // Load Template if present
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const templateId = params.get('templateId');

        if (templateId) {
            setLoading(true);
            fetch(`/server/fetch_requests_function/${templateId}`)
                .then(res => res.json())
                .then(result => {
                    if (result.status === 'success') {
                        const t = result.data;
                        // Populate form with template data
                        // Flatten sections into items for current simple UI
                        const allItems = [];
                        if (t.sections) {
                            t.sections.forEach(sec => {
                                if (sec.items) {
                                    sec.items.forEach(item => {
                                        allItems.push({
                                            id: Date.now() + Math.random(),
                                            title: item.title,
                                            type: item.type
                                        });
                                    });
                                }
                            });
                        }

                        setFormData(prev => ({
                            ...prev,
                            subject: t.subject, // Template name usually matches subject
                            message: t.description || '',
                            items: allItems.length > 0 ? allItems : prev.items
                        }));
                    }
                })
                .catch(err => console.error("Failed to load template", err))
                .finally(() => setLoading(false));
        }
    }, [location.search]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { id: Date.now(), title: '', type: 'file' }]
        }));
    };

    const handleItemChange = (id, value) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, title: value } : item)
        }));
    };

    const handleRemoveItem = (id) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    const handleSubmit = async (status, isTemplate = false) => {
        try {
            // Transform flat items list to sections structure for backend
            const payload = {
                ...formData,
                status: isTemplate ? 'Draft' : status, // Templates are effectively drafts but flagged
                isTemplate: isTemplate,
                sections: [
                    {
                        title: 'General Documents',
                        items: formData.items
                    }
                ]
            };

            await fetch('/server/create_request_function/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (isTemplate) {
                alert('Template saved successfully!');
            } else {
                navigate('/dashboard/inbox');
            }
        } catch (error) {
            console.error("Error creating request:", error);
        }
    };

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Loading template...</div>;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>New Request</h1>

            <div className={styles.card}>
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h2>Recipient Details</h2>
                        <div className={styles.formGroup}>
                            <label>Recipient Name</label>
                            <input name="recipientName" value={formData.recipientName} onChange={handleInputChange} placeholder="e.g. John Doe" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email Address</label>
                            <input name="recipientEmail" value={formData.recipientEmail} onChange={handleInputChange} placeholder="e.g. john@example.com" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Subject</label>
                            <input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="e.g. Documents for Tax Return" />
                        </div>
                        <div className={styles.actions}>
                            <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Checklist</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.stepContent}>
                        <h2>Build Checklist</h2>
                        <div className={styles.checklist}>
                            {formData.items.map((item, index) => (
                                <div key={item.id} className={styles.checklistItem}>
                                    <span>{index + 1}.</span>
                                    <input
                                        value={item.title}
                                        onChange={(e) => handleItemChange(item.id, e.target.value)}
                                        placeholder="e.g. Copy of Passport"
                                        autoFocus
                                    />
                                    <button onClick={() => handleRemoveItem(item.id)} className={styles.removeBtn}>×</button>
                                </div>
                            ))}
                            <button className="btn" onClick={handleAddItem} style={{ border: '1px dashed #ccc', width: '100%' }}>+ Add Item</button>
                        </div>
                        <div className={styles.actions}>
                            <button className="btn" onClick={() => setStep(1)}>Back</button>
                            <button className="btn btn-primary" onClick={() => setStep(3)}>Next: Review</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={styles.stepContent}>
                        <h2>Review & Send</h2>
                        <div className={styles.summary}>
                            <p><strong>To:</strong> {formData.recipientName} ({formData.recipientEmail})</p>
                            <p><strong>Subject:</strong> {formData.subject}</p>
                            <p><strong>Items:</strong> {formData.items.length} items requested</p>
                        </div>

                        <div className={styles.actions}>
                            <button className="btn" onClick={() => setStep(2)}>Back</button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn" onClick={() => handleSubmit('Draft', true)} style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'white' }}>
                                    <Save size={14} style={{ marginRight: 6 }} />
                                    Save as Template
                                </button>
                                <button className="btn" onClick={() => handleSubmit('Draft')}>Save Draft</button>
                                <button className="btn btn-primary" onClick={() => handleSubmit('Sent')}>Send Now</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewRequest;
