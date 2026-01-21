import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { ArrowLeft, Building2, User, Plus, Trash2 } from 'lucide-react';
import styles from '../../components/dashboard/Dashboard.module.css';

const OrganisationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [org, setOrg] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Add Contact Modal State
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactForm, setContactForm] = useState({ Name: '', Email: '', Role: '', Phone: '' });

    useEffect(() => {
        if (id === 'new') return; // Handled separately or redirect? Ideally separate create page or modal.

        const fetchData = async () => {
            setLoading(true);
            try {
                const [orgRes, contactRes] = await Promise.all([
                    fetch(`/server/org_function/${id}`),
                    fetch(`/server/org_function/${id}/contacts`)
                ]);

                const orgData = await orgRes.json();
                const contactData = await contactRes.json();

                if (orgData.status === 'success') setOrg(orgData.data);
                if (contactData.status === 'success') setContacts(contactData.data);
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleAddContact = async () => {
        if (!contactForm.Name || !contactForm.Email) return alert("Name and Email are required");

        try {
            const res = await fetch(`/server/org_function/${id}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm)
            });
            const result = await res.json();
            if (result.status === 'success') {
                // Refresh contacts
                const contactRes = await fetch(`/server/org_function/${id}/contacts`);
                const contactData = await contactRes.json();
                setContacts(contactData.data);
                setShowContactModal(false);
                setContactForm({ Name: '', Email: '', Role: '', Phone: '' });
            } else {
                alert("Failed to add contact: " + result.message);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (!window.confirm("Delete this contact?")) return;
        try {
            await fetch(`/server/org_function/contacts/${contactId}`, { method: 'DELETE' });
            setContacts(prev => prev.filter(c => c.ROWID !== contactId));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && id !== 'new') return <Loader text="Loading organisation details..." />;

    // Placeholder for Create New Org View if ID is 'new' (Ideally separate, but handling here for now)
    if (id === 'new') {
        return <OrganisationForm isNew={true} />;
    }

    if (!org) return <div>Organisation not found</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className="btn" onClick={() => navigate('/dashboard/organisations')} style={{ marginRight: 16 }}>
                    <ArrowLeft size={16} />
                </button>
                <h1>{org.Name}</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Org Info Card */}
                <div className={styles.card} style={{ height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <Building2 size={32} />
                        </div>
                        <div style={{ marginLeft: 16 }}>
                            <h3 style={{ margin: 0 }}>{org.Name}</h3>
                            <a href={`http://${org.Domain}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#3b82f6' }}>{org.Domain}</a>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ fontSize: 14 }}><strong>Phone:</strong> {org.Phone || '--'}</div>
                        <div style={{ fontSize: 14 }}><strong>Address:</strong> {org.Address || '--'}</div>
                    </div>
                </div>

                {/* Contacts List */}
                <div className={styles.card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h3 style={{ margin: 0 }}>Contacts / Recipients</h3>
                        <button className="btn btn-sm" onClick={() => setShowContactModal(true)}>
                            <Plus size={14} style={{ marginRight: 6 }} /> Add Contact
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {contacts.map(contact => (
                            <div key={contact.ROWID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #f1f5f9', borderRadius: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{contact.Name}</div>
                                        <div style={{ fontSize: 12, color: '#666' }}>{contact.Email}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>{contact.Role || 'Member'}</span>
                                    <button onClick={() => handleDeleteContact(contact.ROWID)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {contacts.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20 }}>No contacts added yet.</div>}
                    </div>
                </div>
            </div>

            {/* Add Contact Modal */}
            <Modal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                title="Add New Contact"
                actions={
                    <>
                        <button className="btn" onClick={() => setShowContactModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleAddContact}>Save Contact</button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Name *</label>
                        <input className="form-input" value={contactForm.Name} onChange={e => setContactForm({ ...contactForm, Name: e.target.value })} placeholder="Full Name" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Email *</label>
                        <input className="form-input" value={contactForm.Email} onChange={e => setContactForm({ ...contactForm, Email: e.target.value })} placeholder="email@example.com" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Role</label>
                        <input className="form-input" value={contactForm.Role} onChange={e => setContactForm({ ...contactForm, Role: e.target.value })} placeholder="e.g. Accountant" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Phone</label>
                        <input className="form-input" value={contactForm.Phone} onChange={e => setContactForm({ ...contactForm, Phone: e.target.value })} placeholder="Optional" style={{ width: '100%', padding: 8, border: '1px solid #ddd', borderRadius: 4 }} />
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Simple Form for New Org (Internal Component for now)
const OrganisationForm = () => {
    // ... Implementation for creating org ... 
    // For brevity, putting basic implementation:
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ Name: '', Domain: '', Website: '', Address: '', Phone: '' });

    const handleSubmit = async () => {
        try {
            const res = await fetch('/server/org_function/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.status === 'success') {
                navigate(`/dashboard/organisations/${result.data.ROWID}`);
            } else {
                alert("Error: " + result.message);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card} style={{ maxWidth: 600, margin: '0 auto' }}>
                <h2>Create New Organisation</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <input placeholder="Organisation Name" value={formData.Name} onChange={e => setFormData({ ...formData, Name: e.target.value })} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4 }} />
                    <input placeholder="Domain (e.g. acme.com)" value={formData.Domain} onChange={e => setFormData({ ...formData, Domain: e.target.value })} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4 }} />
                    <input placeholder="Address" value={formData.Address} onChange={e => setFormData({ ...formData, Address: e.target.value })} style={{ padding: 10, border: '1px solid #ddd', borderRadius: 4 }} />
                    <button className="btn btn-primary" onClick={handleSubmit}>Create Organisation</button>
                    <button className="btn" onClick={() => navigate(-1)}>Cancel</button>
                </div>
            </div>
        </div>
    )
};


export default OrganisationDetail;
