import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
    const { user, logout } = useAuth();

    const [loading, setLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const myOrg = user?.organisation;

    useEffect(() => {
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
                toast.success('Profile updated successfully');
                setIsEditing(false);
                window.location.reload();
            } else {
                toast.error('Failed to update: ' + result.message);
            }
        } catch (err) {
            console.error(err);
            toast.error('An error occurred');
        }
    };

    if (loading || !user) return <Loader text="Loading profile..." />;

    return (
        <div className={styles.container}>
            <h1 className={styles.pageTitle}>Account Settings</h1>

            <div className={styles.grid}>
                {/* ── Left: Profile card ── */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2>Profile Information</h2>
                        <p>Your personal details and contact info.</p>
                    </div>

                    <div className={styles.cardBody}>
                        {/* Avatar + name row */}
                        <div className={styles.avatarRow}>
                            <div className={styles.avatar}>
                                {user.first_name?.[0]?.toUpperCase()}
                            </div>
                            <div className={styles.avatarInfo}>
                                <div className={styles.avatarName}>
                                    {user.first_name} {user.last_name}
                                </div>
                                <div className={styles.avatarEmail}>{user.email_id}</div>
                                <span className={styles.rolePill}>
                                    {user.role_details?.role_name || 'App User'}
                                </span>
                            </div>
                        </div>

                        {/* Name fields */}
                        <div className={styles.nameGrid}>
                            <div className={styles.formField}>
                                <label>First Name</label>
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                            <div className={styles.formField}>
                                <label>Last Name</label>
                                <input
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    disabled={!isEditing}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={styles.profileActions}>
                            {isEditing ? (
                                <>
                                    <button
                                        className="btn"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFirstName(user.first_name || '');
                                            setLastName(user.last_name || '');
                                        }}
                                    >
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

                {/* ── Right column ── */}
                <div className={styles.rightColumn}>
                    {/* Organisation card */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2>Organization</h2>
                        </div>
                        <div className={styles.cardBody}>
                            {myOrg ? (
                                <>
                                    <p className={styles.orgName}>{myOrg.name}</p>
                                    <p className={styles.orgId}>ID: {myOrg.id}</p>
                                    <span className={`badge ${myOrg.role === 'Super Admin' ? 'badge-error' : 'badge-primary'}`}>
                                        {myOrg.role}
                                    </span>
                                </>
                            ) : (
                                <p style={{ color: 'var(--color-text-muted)' }}>
                                    You are not part of any organization.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Log out card */}
                    <div className={styles.card}>
                        <div className={styles.cardBody}>
                            <button className={styles.logoutBtn} onClick={logout}>
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
