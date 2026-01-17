import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../components/dashboard/Dashboard.module.css'; // Reusing dashboard styles for simplicity

const ProfilePage = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ sent: 0, completed: 0 });

    useEffect(() => {
        // Mock stats or fetch from backend if available
        setStats({ sent: 12, completed: 5 });
    }, []);

    if (!user) return <div>Loading...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '32px' }}>Account Settings</h1>

            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Profile Information</h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>Your personal details and contact info.</p>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginRight: '24px' }}>
                            {user.first_name?.[0]}
                        </div>
                        <div>
                            <div style={{ fontWeight: '500', fontSize: '16px' }}>{user.first_name} {user.last_name}</div>
                            <div style={{ color: '#64748b' }}>{user.email_id}</div>
                            <div style={{ marginTop: '8px', fontSize: '12px', background: '#f1f5f9', display: 'inline-block', padding: '2px 8px', borderRadius: '12px' }}>
                                {user.role_details?.role_name || 'User'}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>First Name</label>
                            <input disabled value={user.first_name} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Last Name</label>
                            <input disabled value={user.last_name || ''} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '32px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Organization</h2>
                </div>
                <div style={{ padding: '24px' }}>
                    <p><strong>Org ID:</strong> {user.org_id || 'N/A'}</p>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
