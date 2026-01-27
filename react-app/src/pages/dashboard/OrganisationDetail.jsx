import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import MembersTab from '../../components/organisation/MembersTab';
import { ArrowLeft, Building2, User, Plus, Trash2 } from 'lucide-react';
import styles from './OrganisationDetail.module.css';

const OrganisationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [org, setOrg] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('contacts');

    // Add Contact Modal State
    const [showContactModal, setShowContactModal] = useState(false);
    const [contactForm, setContactForm] = useState({ Name: '', Email: '', Role: '', Phone: '' });

    useEffect(() => {
        if (id === 'new') return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [orgRes, contactRes] = await Promise.all([
                    fetch(`/server/fetch_requests_function/orgs/${id}`),
                    fetch(`/server/fetch_requests_function/orgs/${id}/contacts`)
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
            const res = await fetch(`/server/fetch_requests_function/orgs/${id}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactForm)
            });
            const result = await res.json();
            if (result.status === 'success') {
                const contactRes = await fetch(`/server/fetch_requests_function/orgs/${id}/contacts`);
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
            await fetch(`/server/fetch_requests_function/orgs/contacts/${contactId}`, { method: 'DELETE' });
            setContacts(prev => prev.filter(c => c.ROWID !== contactId));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && id !== 'new') return <Loader text="Loading organisation details..." />;

    if (id === 'new') {
        return <OrganisationForm isNew={true} />;
    }

    if (!org) return <div>Organisation not found</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <button className="btn" onClick={() => navigate('/dashboard/organisations')} style={{ marginRight: 16 }}>
                    <ArrowLeft size={20} />
                </button>
                <h1>{org.Name}</h1>
            </div>

            <div className={styles.grid}>
                {/* Org Info Card */}
                <div className={styles.card} style={{ height: 'fit-content' }}>
                    <div className={styles.cardHeader}>
                        <h3>Organisation Details</h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                        <div className={styles.orgIcon}>
                            <Building2 size={32} />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: 18 }}>{org.Name}</h3>
                            <a href={`http://${org.Domain}`} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: '#3b82f6' }}>{org.Domain || 'No Domain'}</a>
                        </div>
                    </div>

                    <div className={styles.infoList}>
                        <div className={styles.row}>
                            <span className={styles.label}>Phone:</span>
                            <span>{org.Phone || '--'}</span>
                        </div>
                        <div className={styles.row}>
                            <span className={styles.label}>Address:</span>
                            <span>{org.Address || '--'}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs and Content */}
                <div className={styles.card} style={{ padding: 0 }}>
                    {/* Tab Headers */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid #e2e8f0'
                    }}>
                        <button
                            onClick={() => setActiveTab('contacts')}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                border: 'none',
                                background: activeTab === 'contacts' ? 'white' : '#f8fafc',
                                borderBottom: activeTab === 'contacts' ? '2px solid #3b82f6' : '2px solid transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === 'contacts' ? 600 : 400,
                                color: activeTab === 'contacts' ? '#1e293b' : '#64748b',
                                fontSize: 14,
                                transition: 'all 0.2s'
                            }}
                        >
                            Contacts
                        </button>
                        <button
                            onClick={() => setActiveTab('members')}
                            style={{
                                flex: 1,
                                padding: '16px 24px',
                                border: 'none',
                                background: activeTab === 'members' ? 'white' : '#f8fafc',
                                borderBottom: activeTab === 'members' ? '2px solid #3b82f6' : '2px solid transparent',
                                cursor: 'pointer',
                                fontWeight: activeTab === 'members' ? 600 : 400,
                                color: activeTab === 'members' ? '#1e293b' : '#64748b',
                                fontSize: 14,
                                transition: 'all 0.2s'
                            }}
                        >
                            Team Members
                        </button>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'contacts' ? (
                        <div style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#1e293b' }}>All Contacts</h3>
                                <button className="btn btn-sm" onClick={() => setShowContactModal(true)}>
                                    <Plus size={14} style={{ marginRight: 6 }} /> Add Contact
                                </button>
                            </div>

                            <div>
                                {contacts.map(contact => (
                                    <div key={contact.ROWID} className={styles.contactItem}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div className={styles.contactAvatar}>
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 500, fontSize: 14, color: '#1e293b' }}>{contact.Name}</div>
                                                <div style={{ fontSize: 13, color: '#64748b' }}>{contact.Email}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <span className={styles.contactRole}>{contact.Role || 'Member'}</span>
                                            <button onClick={() => handleDeleteContact(contact.ROWID)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: 4, display: 'flex' }} title="Remove Contact">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {contacts.length === 0 && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '48px 24px',
                                        color: '#94a3b8',
                                        background: '#f8fafc',
                                        borderRadius: 8,
                                        border: '1px dashed #e2e8f0'
                                    }}>
                                        <User size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                                        <p style={{ margin: 0, fontSize: 14 }}>No contacts added yet</p>
                                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#cbd5e1' }}>Add contacts to send them data requests</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <MembersTab orgId={id} />
                    )}
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

// Simple Form for New Org
const OrganisationForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ Name: '', Domain: '', Website: '', Address: '', Phone: '' });

    const handleSubmit = async () => {
        try {
            const res = await fetch('/server/fetch_requests_function/orgs', {
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
