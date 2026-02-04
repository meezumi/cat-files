import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
    const { user, logout, getOrganisation } = useAuth();
    const [stats, setStats] = useState({ sent: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    // Get Organisation Details
    const myOrg = user?.organisation;

    useEffect(() => {
        // Mock stats or fetch from backend if available
        setStats({ sent: 12, completed: 5 });
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
                            <input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={!isEditing}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    background: isEditing ? 'white' : '#f8fafc'
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
                                    border: '1px solid #e2e8f0',
                                    background: isEditing ? 'white' : '#f8fafc'
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

            <div style={{ marginTop: '32px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>Organization</h2>
                </div>
                <div style={{ padding: '24px' }}>
                    {myOrg ? (
                        <div>
                            <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{myOrg.name}</p>
                            <p style={{ color: '#64748b', fontSize: 13 }}>ID: {myOrg.id}</p>
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

            <div style={{ marginTop: '32px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
                            transition: 'background 0.2s'
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
    );
};

export default ProfilePage;
