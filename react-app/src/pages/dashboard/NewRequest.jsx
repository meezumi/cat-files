import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, Plus, Trash2, Check } from 'lucide-react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import styles from './NewRequest.module.css';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';

const NewRequest = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        recipientName: '',
        recipientEmail: '',
        subject: '',
        message: '',
        sections: [{ id: Date.now(), title: 'General Documents', items: [] }],
        dueDate: '',
        reminderFreq: 3,
        tags: [] // Array of {value, label}
    });
    const [availableTags, setAvailableTags] = useState([]); // Array of {value, label, color}
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

                        // Populate form with template data (preserving sections)
                        const loadedSections = t.sections && t.sections.length > 0 ? t.sections.map(sec => ({
                            id: sec.id || Date.now() + Math.random(),
                            title: sec.title,
                            items: sec.items ? sec.items.map(i => ({
                                id: Date.now() + Math.random(),
                                title: i.title,
                                type: i.type || 'file'
                            })) : []
                        })) : [{ id: Date.now(), title: 'General Documents', items: [] }];

                        setFormData(prev => ({
                            ...prev,
                            subject: t.subject,
                            message: t.description || '',
                            sections: loadedSections
                        }));
                    }
                })
                .catch(err => console.error("Failed to load template", err))
                .finally(() => setLoading(false));
        }
    }, [location.search]);

    // Fetch Tags
    useEffect(() => {
        fetch('/server/create_request_function/tags')
            .then(res => res.json())
            .then(result => {
                if (result.status === 'success') {
                    setAvailableTags(result.data.map(t => ({ value: t.ROWID, label: t.Name, color: t.Color })));
                }
            })
            .catch(err => console.error("Failed to fetch tags", err));
    }, []);

    const handleCreateTag = async (inputValue) => {
        setLoading(true);
        try {
            const res = await fetch('/server/create_request_function/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: inputValue })
            });
            const result = await res.json();
            if (result.status === 'success') {
                const newTag = { value: result.data.ROWID, label: result.data.Name, color: result.data.Color };
                setAvailableTags(prev => [...prev, newTag]);
                setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
            }
        } catch (error) {
            console.error("Failed to create tag", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Section Management
    const handleAddSection = () => {
        setFormData(prev => ({
            ...prev,
            sections: [...prev.sections, { id: Date.now(), title: 'New Section', items: [] }]
        }));
    };

    const handleRemoveSection = (sectionId) => {
        if (formData.sections.length <= 1) return; // Prevent deleting last section
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.filter(s => s.id !== sectionId)
        }));
    };

    const handleSectionTitleChange = (sectionId, newTitle) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s => s.id === sectionId ? { ...s, title: newTitle } : s)
        }));
    };

    // Item Management
    const handleAddItem = (sectionId) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id === sectionId) {
                    return { ...s, items: [...s.items, { id: Date.now(), title: '', type: 'file' }] };
                }
                return s;
            })
        }));
    };

    const handleItemChange = (sectionId, itemId, value) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id === sectionId) {
                    return {
                        ...s,
                        items: s.items.map(i => i.id === itemId ? { ...i, title: value } : i)
                    };
                }
                return s;
            })
        }));
    };

    const handleRemoveItem = (sectionId, itemId) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.map(s => {
                if (s.id === sectionId) {
                    // Only remove if it's not the last item? No, user can empty a section.
                    return { ...s, items: s.items.filter(i => i.id !== itemId) };
                }
                return s;
            })
        }));
    };

    // State for UI UX
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isTemplateSaved, setIsTemplateSaved] = useState(false);

    // ... (useEffect remains same) ...

    // ... (handlers remain same) ...

    const handleSubmit = async (status, isTemplate = false) => {
        try {
            const payload = {
                ...formData,
                status: isTemplate ? 'Draft' : status,
                isTemplate: isTemplate,
                sections: formData.sections.map(s => ({
                    title: s.title,
                    description: '',
                    items: s.items.map(i => ({ title: i.title, type: i.type || 'file', allowedFileTypes: i.allowedFileTypes }))
                })),
                tags: formData.tags.map(t => t.value)
            };

            await fetch('/server/create_request_function/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (isTemplate) {
                setIsTemplateSaved(true);
                setShowSuccessModal(true);
            } else {
                navigate('/dashboard/inbox');
            }
        } catch (error) {
            console.error("Error creating request:", error);
        }
    };

    if (loading) return <Loader text="Loading template..." />;

    const modalActions = (
        <button className="btn btn-primary" onClick={() => setShowSuccessModal(false)}>
            Close
        </button>
    );

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>New Request</h1>

            <div className={styles.card}>
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <h2>Recipient Details</h2>

                        {/* Contact Selection Logic */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500 }}>Recipient Source</label>
                            <div style={{ display: 'flex', gap: 24 }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                                    <input
                                        type="radio"
                                        name="recipientSource"
                                        checked={!formData.isExistingContact}
                                        onChange={() => setFormData(p => ({ ...p, isExistingContact: false, recipientName: '', recipientEmail: '' }))}
                                        style={{ marginRight: 8, width: 16, height: 16 }}
                                    />
                                    New Recipient
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '14px' }}>
                                    <input
                                        type="radio"
                                        name="recipientSource"
                                        checked={formData.isExistingContact}
                                        onChange={() => setFormData(p => ({ ...p, isExistingContact: true }))}
                                        style={{ marginRight: 8, width: 16, height: 16 }}
                                    />
                                    Select from Contacts
                                </label>
                            </div>
                        </div>

                        {formData.isExistingContact ? (
                            <div className={styles.formGroup}>
                                <label>Select Contact</label>
                                <ContactSelect
                                    onSelect={(contact) => setFormData(p => ({
                                        ...p,
                                        recipientName: contact.Name,
                                        recipientEmail: contact.Email,
                                        orgId: contact.OrganisationID,
                                        contactId: contact.ROWID
                                    }))}
                                />
                            </div>
                        ) : (
                            <>
                                <div className={styles.formGroup}>
                                    <label>Recipient Name</label>
                                    <input name="recipientName" value={formData.recipientName} onChange={handleInputChange} placeholder="e.g. John Doe" />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Email Address</label>
                                    <input name="recipientEmail" value={formData.recipientEmail} onChange={handleInputChange} placeholder="e.g. john@example.com" />
                                </div>
                            </>
                        )}

                        <div className={styles.formGroup}>
                            <label>Tags</label>
                            <CreatableSelect
                                isMulti
                                options={availableTags}
                                value={formData.tags}
                                onChange={(newValue) => setFormData(prev => ({ ...prev, tags: newValue || [] }))}
                                onCreateOption={handleCreateTag}
                                placeholder="Select or create tags..."
                                isDisabled={loading}
                                classNamePrefix="react-select"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: '42px',
                                        borderColor: '#e2e8f0',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            borderColor: '#cbd5e1'
                                        }
                                    }),
                                    multiValue: (base) => ({
                                        ...base,
                                        backgroundColor: '#e2e8f0',
                                        borderRadius: '4px'
                                    }),
                                    multiValueLabel: (base) => ({
                                        ...base,
                                        color: '#334155',
                                        fontSize: '12px'
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        fontSize: '14px'
                                    })
                                }}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Subject</label>
                            <input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="e.g. Documents for Tax Return" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Due Date</label>
                            <input
                                type="date"
                                name="dueDate"
                                value={formData.dueDate}
                                onChange={handleInputChange}
                                className="form-input"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '14px',
                                    color: '#334155'
                                }}
                            />
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
                            {formData.sections.map((section, sIndex) => (
                                <div key={section.id} style={{ marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8, background: '#fafafa' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                                        <input
                                            value={section.title}
                                            onChange={(e) => handleSectionTitleChange(section.id, e.target.value)}
                                            style={{ flex: 1, fontWeight: 'bold', border: 'none', background: 'transparent', fontSize: 16 }}
                                            placeholder="Section Title"
                                        />
                                        {formData.sections.length > 1 && (
                                            <button onClick={() => handleRemoveSection(section.id)} className={styles.removeBtn} title="Delete Section" style={{ color: '#dc3545' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    {section.items.map((item, index) => (
                                        <div key={item.id} className={styles.checklistItem}>
                                            <span>{index + 1}.</span>
                                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                <input
                                                    value={item.title}
                                                    onChange={(e) => handleItemChange(section.id, item.id, e.target.value)}
                                                    placeholder="Item Name"
                                                    autoFocus
                                                    style={{ width: '100%' }}
                                                />
                                                <input
                                                    value={item.allowedFileTypes || ''}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            sections: prev.sections.map(s => {
                                                                if (s.id !== section.id) return s;
                                                                return {
                                                                    ...s,
                                                                    items: s.items.map(i => i.id === item.id ? { ...i, allowedFileTypes: newVal } : i)
                                                                };
                                                            })
                                                        }));
                                                    }}
                                                    placeholder="Allowed Types (e.g. .pdf, .png) - Optional"
                                                    style={{ fontSize: 12, padding: 4, border: '1px solid #eee', borderRadius: 4, color: '#666' }}
                                                />
                                            </div>
                                            <button onClick={() => handleRemoveItem(section.id, item.id)} className={styles.removeBtn}>×</button>
                                        </div>
                                    ))}
                                    <button className="btn" onClick={() => handleAddItem(section.id)} style={{ border: '1px dashed #ccc', width: '100%', marginTop: 8, fontSize: 13 }}>+ Add Item to {section.title}</button>
                                </div>
                            ))}

                            <button className="btn btn-primary" onClick={handleAddSection} style={{ width: '100%', marginBottom: 16, background: 'var(--color-secondary)' }}>
                                <Plus size={16} style={{ marginRight: 8 }} />
                                Add New Section
                            </button>
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
                            <div style={{ marginTop: 16 }}>
                                <strong>Checklist Structure:</strong>
                                {formData.sections.map(s => (
                                    <div key={s.id} style={{ marginLeft: 12, marginTop: 4 }}>
                                        - {s.title} ({s.items.length} items)
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button className="btn" onClick={() => setStep(2)}>Back</button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn"
                                    onClick={() => !isTemplateSaved && handleSubmit('Draft', true)}
                                    style={{
                                        border: '1px solid var(--color-primary)',
                                        color: isTemplateSaved ? 'var(--color-success)' : 'var(--color-primary)',
                                        borderColor: isTemplateSaved ? 'var(--color-success)' : 'var(--color-primary)',
                                        background: 'white',
                                        cursor: isTemplateSaved ? 'default' : 'pointer',
                                        opacity: isTemplateSaved ? 0.8 : 1
                                    }}
                                >
                                    {isTemplateSaved ? (
                                        <>
                                            <Check size={14} style={{ marginRight: 6 }} />
                                            Saved
                                        </>
                                    ) : (
                                        <>
                                            <Save size={14} style={{ marginRight: 6 }} />
                                            Save as Template
                                        </>
                                    )}
                                </button>
                                <button className="btn" onClick={() => handleSubmit('Draft')}>Save Draft</button>
                                <button className="btn btn-primary" onClick={() => handleSubmit('Sent')}>Send Now</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                title="Template Saved"
                actions={modalActions}
            >
                <p><strong>{formData.subject}</strong> has been saved as a template successfully.</p>
                <p>You can now use this template when creating new requests to save time.</p>
            </Modal>
        </div>
    );
};


const ContactSelect = ({ onSelect }) => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all organisations to get contacts (Ideally needs a dedicated all-contacts endpoint or flatten orgs)
        // For now, let's just fetch orgs and assume we iterate or fetch specific contact endpoint we planned.
        // Wait, our backend plans said "searchable contacts" in org_function.
        // Let's assume we implement a simple "GET /server/org_function/contacts" or similar.
        // But for now, since I only implemented contacts nested under Orgs, I might need to fetch all orgs and their contacts.
        // Let's do a quick hack: Fetch Orgs -> Fetch Contacts for each. (Not efficient but works for MVP).
        // Actually, let's just fetch ALL contacts if we can.
        // The implementation of `org_function` didn't explicitly show a "Global Contact Search".
        // I will just mock fetching from a hypothetical endpoint or fetch orgs and Flatten.

        async function loadContacts() {
            try {
                const res = await fetch('/server/fetch_requests_function/orgs'); // List Orgs
                const orgResult = await res.json();
                if (orgResult.status === 'success') {
                    // Start with just orgs to let user select Org -> Contact? Or just flatten?
                    // Let's Flatten: Fetch contacts for each Org.
                    const allContacts = [];
                    for (const org of orgResult.data) {
                        try {
                            const cRes = await fetch(`/server/fetch_requests_function/orgs/${org.ROWID}/contacts`);
                            const cData = await cRes.json();
                            if (cData.status === 'success') {
                                allContacts.push(...cData.data.map(c => ({ ...c, OrgName: org.Name })));
                            }
                        } catch (e) { }
                    }
                    setContacts(allContacts);
                }
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        }
        loadContacts();
    }, []);

    if (loading) return <div style={{ fontSize: 12, color: '#666' }}>Loading contacts...</div>;

    const options = contacts.map(c => ({
        value: c.ROWID,
        label: `${c.Name} (${c.Email}) - ${c.OrgName}`,
        contact: c
    }));

    return (
        <Select
            options={options}
            onChange={(option) => onSelect(option.contact)}
            placeholder="Search for a contact..."
            classNamePrefix="react-select"
            styles={{
                control: (base) => ({
                    ...base,
                    minHeight: '42px',
                    borderColor: '#e2e8f0',
                    borderRadius: '4px',
                    fontSize: '14px',
                    boxShadow: 'none',
                    '&:hover': {
                        borderColor: '#cbd5e1'
                    }
                }),
                menu: (base) => ({
                    ...base,
                    fontSize: '14px'
                })
            }}
        />
    );
};

export default NewRequest;
