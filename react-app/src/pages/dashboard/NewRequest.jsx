import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Calendar, Clock } from 'lucide-react';
import styles from './NewRequest.module.css'; // We'll create this next

const NewRequest = () => {
    const navigate = useNavigate();
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

    const handleSubmit = async (status) => {
        try {
            const payload = { ...formData, status };
            // In real app: POST /server/files_function/api/requests
            console.log('Ranking Request:', payload);

            // Mock API call
            await fetch('/server/files_function/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            navigate('/dashboard/inbox');
        } catch (error) {
            console.error("Error creating request:", error);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>New Request</h1>

            {/* Step Indicators would go here */}

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
                                <button className="btn" onClick={() => handleSubmit('Draft')}>Save Draft</button>
                                <button className="btn" onClick={() => handleSubmit('Scheduled')}>Schedule</button>
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
