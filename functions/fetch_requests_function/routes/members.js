const express = require('express');
const router = express.Router();
const catalyst = require('zcatalyst-sdk-node');

// ============================================
// ORGANISATION MEMBER MANAGEMENT ROUTES
// ============================================

// GET /orgs/:id/members - List all members of an organisation
router.get('/orgs/:id/members', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const orgId = req.params.id;
        let userId = req.headers['x-zc-user-id'];

        if (!userId) {
            try {
                const currentUser = await catApp.userManagement().getCurrentUser();
                if (currentUser && currentUser.user_id) userId = currentUser.user_id;
            } catch (e) {}
        }
        
        console.log('=== FETCH MEMBERS DEBUG ===');
        console.log('Org ID:', orgId);
        console.log('User ID:', userId);
        
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        // Verify user has permission to view members (must be a member themselves)
        const authQuery = `SELECT Role FROM OrganisationMembers WHERE OrganisationID = '${orgId}' AND UserID = '${userId}' AND Status = 'Active'`;
        console.log('Auth query:', authQuery);
        const authResult = await catApp.zcql().executeZCQLQuery(authQuery);
        console.log('Auth result:', authResult.length, 'rows');
        
        // TEMPORARY: Bypass auth to debug
        /*
        if (authResult.length === 0) {
            console.log('❌ User not authorized');
            return res.status(403).json({ status: 'error', message: 'You do not have access to this organisation' });
        }
        */

        // Fetch all members
        const query = `SELECT * FROM OrganisationMembers WHERE OrganisationID = '${orgId}' ORDER BY CREATEDTIME DESC`;
        console.log('Fetch query:', query);
        const result = await catApp.zcql().executeZCQLQuery(query);
        console.log('✓ Found', result.length, 'members');
        const members = result.map(row => row.OrganisationMembers);

        // Check if Owner is in the list, if not add them
        const orgQuery = `SELECT OwnerID FROM Organisations WHERE ROWID = '${orgId}'`;
        const orgResult = await catApp.zcql().executeZCQLQuery(orgQuery);
        
        if (orgResult.length > 0) {
            const ownerId = orgResult[0].Organisations.OwnerID;
            const isOwnerInList = members.some(m => m.UserID === ownerId);
            
            if (!isOwnerInList && ownerId) {
                console.log('ℹ Owner not in member list, adding manually:', ownerId);
                members.push({
                    ROWID: 'owner_' + ownerId, // Virtual ID
                    UserID: ownerId,
                    Role: 'Super Admin',
                    Status: 'Active',
                    JoinedAt: new Date().toISOString(),
                    CREATEDTIME: new Date().toISOString()
                });
            }
        }

        // Fetch user details for each member
        const userManagement = catApp.userManagement();
        const enrichedMembers = await Promise.all(members.map(async (member) => {
            try {
                const userDetails = await userManagement.getUserDetails(member.UserID);
                return {
                    id: member.ROWID,
                    userId: member.UserID,
                    email: userDetails.email_id,
                    firstName: userDetails.first_name,
                    lastName: userDetails.last_name,
                    role: member.Role,
                    status: member.Status,
                    joinedAt: member.JoinedAt,
                    invitedBy: member.InvitedBy,
                    createdTime: member.CREATEDTIME
                };
            } catch (err) {
                console.warn('Could not fetch user details for:', member.UserID);
                return {
                    id: member.ROWID,
                    userId: member.UserID,
                    email: 'unknown',
                    role: member.Role,
                    status: member.Status,
                    joinedAt: member.JoinedAt,
                    invitedBy: member.InvitedBy,
                    createdTime: member.CREATEDTIME
                };
            }
        }));

        res.json({ status: 'success', data: enrichedMembers });
    } catch (err) {
        console.error('List Members Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// EMERGENCY FIX: Add current user as Super Admin to an org
router.post('/orgs/:id/fix-membership', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const orgId = req.params.id;
        const userId = req.headers['x-zc-user-id'];
        
        console.log('=== FIX MEMBERSHIP ===');
        console.log('Org ID:', orgId);
        console.log('User ID:', userId);
        
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        // Check if member already exists
        const checkQuery = `SELECT * FROM OrganisationMembers WHERE OrganisationID = '${orgId}' AND UserID = '${userId}'`;
        const existing = await catApp.zcql().executeZCQLQuery(checkQuery);
        
        if (existing.length > 0) {
            return res.json({ status: 'success', message: 'Membership already exists', data: existing[0].OrganisationMembers });
        }

        // Add as Super Admin
        const memberData = {
            OrganisationID: orgId,
            UserID: userId,
            Role: 'Super Admin',
            Status: 'Active',
            JoinedAt: new Date().toISOString()
        };
        
        console.log('Adding member:', JSON.stringify(memberData, null, 2));
        const result = await catApp.datastore().table('OrganisationMembers').insertRow(memberData);
        console.log('✓ Member added:', result);

        res.json({ status: 'success', message: 'Membership created', data: result });
    } catch (err) {
        console.error('Fix Membership Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /orgs/:id/members - Add a member to an organisation
router.post('/orgs/:id/members', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const orgId = req.params.id;
        const userId = req.headers['x-zc-user-id'];
        const { email, role } = req.body;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        if (!email || !role) {
            return res.status(400).json({ status: 'error', message: 'Email and role are required' });
        }

        // Validate role
        const validRoles = ['Super Admin', 'Admin', 'Contributor', 'Viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ status: 'error', message: 'Invalid role. Must be one of: ' + validRoles.join(', ') });
        }

        // Verify user has permission to add members (must be Super Admin or Admin)
        const authQuery = `SELECT Role FROM OrganisationMembers WHERE OrganisationID = '${orgId}' AND UserID = '${userId}' AND Status = 'Active'`;
        const authResult = await catApp.zcql().executeZCQLQuery(authQuery);
        
        if (authResult.length === 0) {
            return res.status(403).json({ status: 'error', message: 'You do not have access to this organisation' });
        }

        const currentUserRole = authResult[0].OrganisationMembers.Role;
        if (currentUserRole !== 'Super Admin' && currentUserRole !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Super Admin or Admin can add members' });
        }

        // Find user by email in Catalyst User Management
        const userManagement = catApp.userManagement();
        let targetUserId = null;
        
        try {
            // Note: Catalyst might not have a direct email lookup, so we'll need to handle invitations differently
            // For now, we'll assume the user provides the UserID or we store it
            // This is a placeholder - you may need to implement email invitation flow
            
            // If we had the user ID from req.body.userId:
            if (req.body.targetUserId) {
                targetUserId = req.body.targetUserId;
            } else {
                return res.status(400).json({ 
                    status: 'error', 
                    message: 'Please provide targetUserId. Email-based invitation will be implemented separately.' 
                });
            }
        } catch (err) {
            return res.status(404).json({ status: 'error', message: 'User not found with that email' });
        }

        // Check if user is already a member
        const existingQuery = `SELECT * FROM OrganisationMembers WHERE OrganisationID = '${orgId}' AND UserID = '${targetUserId}'`;
        const existing = await catApp.zcql().executeZCQLQuery(existingQuery);
        
        if (existing.length > 0) {
            return res.status(409).json({ status: 'error', message: 'User is already a member of this organisation' });
        }

        // Add member
        const memberData = {
            OrganisationID: orgId,
            UserID: targetUserId,
            Role: role,
            Status: 'Active',
            InvitedBy: userId,
            JoinedAt: new Date().toISOString()
        };

        const result = await catApp.datastore().table('OrganisationMembers').insertRow(memberData);

        // Update organisation member count
        try {
            const countQuery = `SELECT COUNT(*) as count FROM OrganisationMembers WHERE OrganisationID = '${orgId}' AND Status = 'Active'`;
            const countResult = await catApp.zcql().executeZCQLQuery(countQuery);
            const memberCount = countResult[0].count || 0;
            
            await catApp.datastore().table('Organisations').updateRow({
                ROWID: orgId,
                MemberCount: memberCount
            });
        } catch (updateErr) {
            console.warn('Could not update member count:', updateErr.message);
        }

        res.json({ status: 'success', data: result, message: 'Member added successfully' });
    } catch (err) {
        console.error('Add Member Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /orgs/:id/members/:memberId - Update member role
router.put('/orgs/:id/members/:memberId', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const orgId = req.params.id;
        const memberId = req.params.memberId;
        const userId = req.headers['x-zc-user-id'];
        const { role } = req.body;

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        // Validate role
        const validRoles = ['Super Admin', 'Admin', 'Contributor', 'Viewer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ status: 'error', message: 'Invalid role' });
        }

        // Verify user has permission (must be Super Admin or Admin)
        const authQuery = `SELECT Role FROM OrganisationMembers WHERE OrganisationID = '${orgId}' AND UserID = '${userId}' AND Status = 'Active'`;
        const authResult = await catApp.zcql().executeZCQLQuery(authQuery);
        
        if (authResult.length === 0) {
            return res.status(403).json({ status: 'error', message: 'You do not have access to this organisation' });
        }

        const currentUserRole = authResult[0].OrganisationMembers.Role;
        if (currentUserRole !== 'Super Admin' && currentUserRole !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Super Admin or Admin can update roles' });
        }

        // Prevent changing Super Admin role (only Super Admin can do that)
        const memberQuery = `SELECT Role FROM OrganisationMembers WHERE ROWID = '${memberId}'`;
        const memberResult = await catApp.zcql().executeZCQLQuery(memberQuery);
        
        if (memberResult.length > 0 && memberResult[0].OrganisationMembers.Role === 'Super Admin' && currentUserRole !== 'Super Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Super Admin can modify Super Admin roles' });
        }

        // Update role
        const result = await catApp.datastore().table('OrganisationMembers').updateRow({
            ROWID: memberId,
            Role: role
        });

        res.json({ status: 'success', data: result, message: 'Member role updated successfully' });
    } catch (err) {
        console.error('Update Member Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /orgs/:id/members/:memberId - Remove member from organisation
router.delete('/orgs/:id/members/:memberId', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const orgId = req.params.id;
        const memberId = req.params.memberId;
        const userId = req.headers['x-zc-user-id'];

        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        // Verify user has permission (must be Super Admin or Admin)
        const authQuery = `SELECT Role FROM OrganisationMembers WHERE OrganisationID = '${orgId}' AND UserID = '${userId}' AND Status = 'Active'`;
        const authResult = await catApp.zcql().executeZCQLQuery(authQuery);
        
        if (authResult.length === 0) {
            return res.status(403).json({ status: 'error', message: 'You do not have access to this organisation' });
        }

        const currentUserRole = authResult[0].OrganisationMembers.Role;
        if (currentUserRole !== 'Super Admin' && currentUserRole !== 'Admin') {
            return res.status(403).json({ status: 'error', message: 'Only Super Admin or Admin can remove members' });
        }

        // Prevent removing Super Admin
        const memberQuery = `SELECT Role FROM OrganisationMembers WHERE ROWID = '${memberId}'`;
        const memberResult = await catApp.zcql().executeZCQLQuery(memberQuery);
        
        if (memberResult.length > 0 && memberResult[0].OrganisationMembers.Role === 'Super Admin') {
            return res.status(403).json({ status: 'error', message: 'Cannot remove Super Admin from organisation' });
        }

        // Soft delete - update status to Suspended
        await catApp.datastore().table('OrganisationMembers').updateRow({
            ROWID: memberId,
            Status: 'Suspended'
        });

        // Update organisation member count
        try {
            const countQuery = `SELECT COUNT(*) as count FROM OrganisationMembers WHERE OrganisationID = '${orgId}' AND Status = 'Active'`;
            const countResult = await catApp.zcql().executeZCQLQuery(countQuery);
            const memberCount = countResult[0].count || 0;
            
            await catApp.datastore().table('Organisations').updateRow({
                ROWID: orgId,
                MemberCount: memberCount
            });
        } catch (updateErr) {
            console.warn('Could not update member count:', updateErr.message);
        }

        res.json({ status: 'success', message: 'Member removed successfully' });
    } catch (err) {
        console.error('Remove Member Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
