import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import { Building2, Plus, Phone, Globe, MapPin } from 'lucide-react';
import styles from '../../components/dashboard/Dashboard.module.css';

const OrganisationList = () => {
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/server/fetch_requests_function/orgs')
            .then(res => res.json())
            .then(result => {
                if (result.status === 'success') {
                    setOrgs(result.data);
                }
            })
            .catch(err => console.error("Failed to fetch organisations", err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <Loader text="Loading organisations..." />;

    return (
        <div className={styles.container}>
            <div className={styles.header} style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: 24, margin: 0 }}>Organisations</h1>
                <button className="btn btn-primary" onClick={() => navigate('/dashboard/organisations/new')}>
                    <Plus size={16} style={{ marginRight: 8 }} />
                    Add Organisation
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {orgs.map(org => (
                    <div
                        key={org.ROWID}
                        style={{
                            background: 'white',
                            padding: '20px',
                            borderRadius: '8px',
                            border: '1px solid #eee',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s'
                        }}
                        onClick={() => navigate(`/dashboard/organisations/${org.ROWID}`)}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                            {org.LogoURL ? (
                                <img src={org.LogoURL} alt={org.Name} style={{ width: 40, height: 40, borderRadius: 4, marginRight: 12, objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: 40, height: 40, borderRadius: 4, background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                                    <Building2 size={20} />
                                </div>
                            )}
                            <h3 style={{ margin: 0, fontSize: 16 }}>{org.Name}</h3>
                        </div>

                        <div style={{ fontSize: 13, color: '#666', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {org.Website && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Globe size={13} style={{ marginRight: 8 }} />
                                    {org.Website.replace(/^https?:\/\//, '')}
                                </div>
                            )}
                            {org.Phone && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Phone size={13} style={{ marginRight: 8 }} />
                                    {org.Phone}
                                </div>
                            )}
                            {org.Address && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <MapPin size={13} style={{ marginRight: 8 }} />
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{org.Address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {orgs.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, background: '#fafafa', borderRadius: 8, color: '#666' }}>
                        <Building2 size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                        <p>No organisations found. Create one to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganisationList;
