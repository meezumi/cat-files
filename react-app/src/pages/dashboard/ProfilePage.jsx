import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
    const { user, logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Get Organisation Details
    const myOrg = user?.organisation;

    useEffect(() => {
        // Mock stats or fetch from backend if available

        // Set loading to false once user data is available or fetched
        if (user) {
            setFirstName(user.first_name || '');
            setLastName(user.last_name || '');
            setLoading(false);
        }
    }, [user]);

    const handleSaveProfile = async () => {
        try {
            const res = await fetch('/server/fetch_requests_function/auth/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ first_name: firstName, last_name: lastName })
            });
            const result = await res.json();

            if (result.status === 'success') {
                toast.success("Profile updated successfully");
                setIsEditing(false);
                // Reload to refresh context
                window.location.reload();
            } else {
                toast.error("Failed to update: " + result.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred");
        }
    };

    if (loading || !user) return <Loader text="Loading profile..." />; // Use loading state and user check

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '32px' }}>Account Settings</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
                {/* Left Column: Profile */}
                <div style={{ background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-main)' }}>Profile Information</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>Your personal details and contact info.</p>
                    </div>

                    <div style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--color-bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginRight: '24px', color: 'var(--color-text-main)' }}>
                                {user.first_name?.[0]}
                            </div>
                            <div>
                                <div style={{ fontWeight: '500', fontSize: '16px', color: 'var(--color-text-main)' }}>{user.first_name} {user.last_name}</div>
                                <div style={{ color: 'var(--color-text-muted)' }}>{user.email_id}</div>
                                <div style={{ marginTop: '8px', fontSize: '12px', background: 'var(--color-bg-page)', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', color: 'var(--color-text-muted)' }}>
                                    {user.role_details?.role_name || 'User'}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>First Name</label>
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={!isEditing}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        background: isEditing ? 'var(--color-input-bg)' : 'var(--color-bg-page)',
                                        color: 'var(--color-text-main)'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Last Name</label>
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={!isEditing}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--color-border)',
                                        background: isEditing ? 'var(--color-input-bg)' : 'var(--color-bg-page)',
                                        color: 'var(--color-text-main)'
                                    }}
                                />
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            {isEditing ? (
                                <>
                                    <button className="btn" onClick={() => {
                                        setIsEditing(false);
                                        setFirstName(user.first_name || '');
                                        setLastName(user.last_name || '');
                                    }}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveProfile}>
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <button className="btn" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Org + Logout */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-main)' }}>Organization</h2>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {myOrg ? (
                                <div>
                                    <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4, color: 'var(--color-text-main)' }}>{myOrg.name}</p>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>ID: {myOrg.id}</p>
                                    <p style={{ marginTop: 8 }}>
                                        <span className={`badge ${myOrg.role === 'Super Admin' ? 'badge-error' : 'badge-primary'}`}>
                                            {myOrg.role}
                                        </span>
                                    </p>
                                </div>
                            ) : (
                                <p style={{ color: '#64748b' }}>You are not part of any organization.</p>
                            )}
                        </div>
                    </div>

                    <div style={{ background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                        <div style={{ padding: '24px' }}>
                            <button
                                onClick={logout}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s',
                                    width: '100%',
                                    justifyContent: 'center'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                            >
                                <LogOut size={16} />
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
