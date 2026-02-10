import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Mail } from 'lucide-react';
import Loader from '../common/Loader';

const EmailSettingsTab = ({ orgId, orgData, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        EmailSubject: '',
        EmailBody: ''
    });

    useEffect(() => {
        if (orgData) {
            setFormData({
                EmailSubject: orgData.EmailSubject || 'File Request: {{Subject}}',
                EmailBody: orgData.EmailBody || 'Hi {{RecipientName}},\n\nYou have received a new file request.\n\nPlease upload the requested documents by clicking the button below.'
            });
        }
    }, [orgData]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/server/fetch_requests_function/orgs/${orgId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.status === 'success') {
                if (onUpdate) onUpdate(formData);
                alert("Email settings updated successfully!");
            } else {
                alert("Failed to update: " + result.message);
            }
        } catch (err) {
            console.error(err);
            alert("Error saving settings");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (window.confirm("Reset to default template?")) {
            setFormData({
                EmailSubject: 'File Request: {{Subject}}',
                EmailBody: 'Hi {{RecipientName}},\n\nYou have received a new file request.\n\nPlease upload the requested documents by clicking the button below.'
            });
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={20} />
                    Email Notification Template
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                    Customize the email sent to recipients when a new request is created.
                    You can use placeholders like <code>{`{{RecipientName}}`}</code>, <code>{`{{Subject}}`}</code>, and <code>{`{{SenderName}}`}</code>.
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 800 }}>
                {/* Subject Line */}
                <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-text-main)', marginBottom: 8 }}>
                        Email Subject
                    </label>
                    <input
                        className="form-input"
                        value={formData.EmailSubject}
                        onChange={e => setFormData({ ...formData, EmailSubject: e.target.value })}
                        placeholder="e.g. Action Required: {{Subject}}"
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-input-bg)', color: 'var(--color-text-main)' }}
                    />
                </div>

                {/* Body Content */}
                <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: 'var(--color-text-main)', marginBottom: 8 }}>
                        Email Body
                    </label>
                    <textarea
                        className="form-input"
                        value={formData.EmailBody}
                        onChange={e => setFormData({ ...formData, EmailBody: e.target.value })}
                        rows={10}
                        placeholder="Enter your email template here..."
                        style={{ width: '100%', padding: '12px', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-input-bg)', color: 'var(--color-text-main)', lineHeight: 1.5, resize: 'vertical', fontFamily: 'monospace' }}
                    />
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        Note: The "View Request" button and standard footer will be automatically added below your content.
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        {loading ? <Loader size={16} /> : <Save size={16} />}
                        Save Changes
                    </button>
                    <button
                        className="btn"
                        onClick={handleReset}
                        disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}
                    >
                        <RefreshCw size={16} />
                        Reset Defaults
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmailSettingsTab;
