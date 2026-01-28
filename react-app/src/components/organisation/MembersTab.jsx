import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import { UserPlus, Shield, ShieldAlert, Eye, Users, Trash2, Edit2 } from 'lucide-react';

const MembersTab = ({ orgId }) => {
    const { canManageMembers, getOrganisation } = useAuth();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [addForm, setAddForm] = useState({ targetUserId: '', role: 'Contributor' });

    useEffect(() => {
        fetchMembers();
    }, [orgId]);

    const fetchMembers = async () => {
        try {
            console.log('Fetching members for org:', orgId);
            const res = await fetch(`/server/fetch_requests_function/orgs/${orgId}/members`, {
                credentials: 'include'
            });
            console.log('Response status:', res.status);
            const result = await res.json();
            console.log('Members result:', result);
            if (result.status === 'success') {
                console.log('✓ Setting', result.data.length, 'members');
                setMembers(result.data);
            } else {
                console.error('Failed to fetch members:', result.message);
            }
        } catch (err) {
            console.error('Failed to fetch members:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMember = async () => {
        if (!addForm.targetUserId) {
            alert('Please provide User ID');
            return;
        }

        try {
            const res = await fetch(`/server/fetch_requests_function/orgs/${orgId}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(addForm)
            });
            const result = await res.json();

            if (result.status === 'success') {
                await fetchMembers();
                setShowAddModal(false);
                setAddForm({ targetUserId: '', role: 'Contributor' });
            } else {
                alert('Failed to add member: ' + result.message);
            }
        } catch (err) {
            console.error('Add member error:', err);
            alert('Failed to add member');
        }
    };

    const handleUpdateRole = async (memberId, newRole) => {
        try {
            const res = await fetch(`/server/fetch_requests_function/orgs/${orgId}/members/${memberId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: newRole })
            });
            const result = await res.json();

            if (result.status === 'success') {
                await fetchMembers();
                setShowEditModal(false);
                setSelectedMember(null);
            } else {
                alert('Failed to update role: ' + result.message);
            }
        } catch (err) {
            console.error('Update role error:', err);
            alert('Failed to update role');
        }
    };

    const handleRemoveMember = async (memberId, memberRole) => {
        if (memberRole === 'Super Admin') {
            alert('Cannot remove Super Admin');
            return;
        }

        if (!window.confirm('Are you sure you want to remove this member?')) return;

        try {
            const res = await fetch(`/server/fetch_requests_function/orgs/${orgId}/members/${memberId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const result = await res.json();

            if (result.status === 'success') {
                await fetchMembers();
            } else {
                alert('Failed to remove member: ' + result.message);
            }
        } catch (err) {
            console.error('Remove member error:', err);
            alert('Failed to remove member');
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'Super Admin': return <ShieldAlert size={14} color="#dc2626" />;
            case 'Admin': return <Shield size={14} color="#f59e0b" />;
            case 'Viewer': return <Eye size={14} color="#3b82f6" />;
            default: return <Users size={14} color="#10b981" />;
        }
    };

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'Super Admin': return '#dc2626';
            case 'Admin': return '#f59e0b';
            case 'Viewer': return '#3b82f6';
            default: return '#10b981';
        }
    };

    if (loading) {
        return <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>Loading members...</div>;
    }

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, margin: 0 }}>Team Members ({members.length})</h2>
                {canManageMembers() && (
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowAddModal(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <UserPlus size={16} />
                        Add Member
                    </button>
                )}
            </div>

            {members.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
                    <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>No members in this organisation yet</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {members.map(member => (
                        <div
                            key={member.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 16,
                                border: '1px solid #e2e8f0',
                                borderRadius: 8,
                                background: member.status === 'Active' ? 'white' : '#f8fafc'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 600,
                                    fontSize: 14
                                }}>
                                    {member.firstName?.[0]}{member.lastName?.[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontWeight: 500, fontSize: 14 }}>
                                            {member.firstName} {member.lastName}
                                        </span>
                                        <span
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '2px 8px',
                                                borderRadius: 12,
                                                fontSize: 11,
                                                fontWeight: 500,
                                                background: `${getRoleBadgeColor(member.role)}15`,
                                                color: getRoleBadgeColor(member.role)
                                            }}
                                        >
                                            {getRoleIcon(member.role)}
                                            {member.role}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                                        {member.email}
                                    </div>
                                </div>
                            </div>

                            {canManageMembers() && member.role !== 'Super Admin' && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        onClick={() => {
                                            setSelectedMember(member);
                                            setShowEditModal(true);
                                        }}
                                        style={{
                                            padding: '6px 12px',
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 6,
                                            background: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            fontSize: 13,
                                            color: '#475569'
                                        }}
                                        title="Change Role"
                                    >
                                        <Edit2 size={14} />
                                        Change Role
                                    </button>
                                    <button
                                        onClick={() => handleRemoveMember(member.id, member.role)}
                                        style={{
                                            padding: '6px 12px',
                                            border: '1px solid #fee2e2',
                                            borderRadius: 6,
                                            background: '#fef2f2',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            fontSize: 13,
                                            color: '#dc2626'
                                        }}
                                        title="Remove Member"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add Member Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Team Member"
                primaryAction={
                    <button className="btn btn-primary" onClick={handleAddMember}>
                        Add Member
                    </button>
                }
            >
                <div style={{ padding: '0 0 16px' }}>
                    <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                        Note: You need the Catalyst User ID to add a member. Email-based invitations will be available in a future update.
                    </p>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                            User ID *
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Catalyst User ID"
                            value={addForm.targetUserId}
                            onChange={(e) => setAddForm({ ...addForm, targetUserId: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                fontSize: 14
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                            Role *
                        </label>
                        <select
                            value={addForm.role}
                            onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: 6,
                                fontSize: 14
                            }}
                        >
                            <option value="Contributor">Contributor</option>
                            <option value="Viewer">Viewer</option>
                            <option value="Admin">Admin</option>
                            <option value="Super Admin">Super Admin</option>
                        </select>
                    </div>
                </div>
            </Modal>

            {/* Edit Role Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                }}
                title="Change Member Role"
                primaryAction={
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (selectedMember) {
                                const select = document.getElementById('roleSelect');
                                handleUpdateRole(selectedMember.id, select.value);
                            }
                        }}
                    >
                        Update Role
                    </button>
                }
            >
                {selectedMember && (
                    <div style={{ padding: '0 0 16px' }}>
                        <p style={{ fontSize: 14, marginBottom: 16 }}>
                            Change role for <strong>{selectedMember.firstName} {selectedMember.lastName}</strong>
                        </p>
                        <div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>
                                New Role
                            </label>
                            <select
                                id="roleSelect"
                                defaultValue={selectedMember.role}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: 6,
                                    fontSize: 14
                                }}
                            >
                                <option value="Contributor">Contributor</option>
                                <option value="Viewer">Viewer</option>
                                <option value="Admin">Admin</option>
                                <option value="Super Admin">Super Admin</option>
                            </select>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MembersTab;
