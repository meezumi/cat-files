const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Import member management routes
const membersRoutes = require('./routes/members');

// ============================================
// AUTH ROUTES (Temporary workaround)
// ============================================

// GET /auth/me - Get current authenticated user
app.get('/auth/me', async (req, res) => {
    try {
        // Prevent caching of auth responses
        res.set({
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        console.log('=== AUTH /me REQUEST ===');
        
        // Check for Catalyst user headers
        const userId = req.headers['x-zc-user-id'];
        console.log('User ID from header:', userId);
        
        if (!userId) {
            console.log('✗ No user ID in headers - not authenticated');
            return res.status(200).json({ status: 'success', data: null });
        }
        
        const catApp = catalyst.initialize(req);
        
        try {
            // Get full user details from Catalyst User Management
            const userManagement = catApp.userManagement();
            const userDetails = await userManagement.getUserDetails(userId);
            console.log('✓ Got user via getUserDetails:', userDetails.email_id);
            
            // Fetch user's organisation membership
            const orgQuery = `SELECT * FROM OrganisationMembers WHERE UserID = '${userId}' AND Status = 'Active'`;
            const orgMemberRows = await catApp.zcql().executeZCQLQuery(orgQuery);
            
            let organisationInfo = null;
            
            if (orgMemberRows.length > 0) {
                const membership = orgMemberRows[0].OrganisationMembers;
                
                // Fetch organisation details
                const orgDetailsQuery = `SELECT * FROM Organisations WHERE ROWID = '${membership.OrganisationID}'`;
                const orgRows = await catApp.zcql().executeZCQLQuery(orgDetailsQuery);
                
                if (orgRows.length > 0) {
                    const org = orgRows[0].Organisations;
                    organisationInfo = {
                        id: org.ROWID,
                        name: org.Name,
                        role: membership.Role,
                        status: membership.Status,
                        joinedAt: membership.JoinedAt,
                        domain: org.Domain,
                        logoURL: org.LogoURL
                    };
                    console.log('✓ User belongs to organisation (Member):', org.Name, '(Role:', membership.Role + ')');
                }
            } else {
                // FALLBACK: Check if user is an OWNER of an organisation (even if member record is missing)
                console.log('ℹ User has no direct membership, checking ownership...');
                const ownerQuery = `SELECT * FROM Organisations WHERE OwnerID = '${userId}'`;
                const ownerRows = await catApp.zcql().executeZCQLQuery(ownerQuery);

                if (ownerRows.length > 0) {
                    const org = ownerRows[0].Organisations;
                    // Auto-grant Super Admin role context for owner
                    organisationInfo = {
                        id: org.ROWID,
                        name: org.Name,
                        role: 'Super Admin',
                        status: 'Active',
                        joinedAt: org.CREATEDTIME,
                        domain: org.Domain,
                        logoURL: org.LogoURL
                    };
                    console.log('✓ User belongs to organisation (Owner):', org.Name, '(Role: Super Admin)');
                } else {
                    console.log('ℹ User has no organisation membership or ownership');
                }
            }
            
            res.status(200).json({ 
                status: 'success', 
                data: {
                    ...userDetails,
                    organisation: organisationInfo
                }
            });
        } catch (err) {
            console.log('✗ getUserDetails failed - treating as logged out:', err.message);
            // If we can't get user details, treat as not authenticated
            res.status(200).json({ status: 'success', data: null });
        }
    } catch (err) {
        console.error('Critical error in /auth/me:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /auth/logout - Clear session
app.post('/auth/logout', async (req, res) => {
    // Prevent caching
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    
    console.log('=== LOGOUT REQUEST START ===');
    
    try {
        const catApp = catalyst.initialize(req);
        
        // Sign out using Catalyst SDK to invalidate session
        // This MUST complete before we respond
        console.log('Calling signOutUser()...');
        await catApp.userManagement().signOutUser();
        console.log('✓✓✓ User signed out via SDK - session invalidated ✓✓✓');
        
        // Clear all Catalyst session cookies
        const cookiesToClear = [
            'ZCATALYST_SESSION',
            'catalyst-auth',
            'JSESSIONID',
            'ZD_CSRF_TOKEN',
            'ZCNEWUISESSIONID',
            '_zcsr_tmp',
            '_iamadt_client_50037651022',
            '_iambdt_client_50037651022',
            '__Secure-iamsdt_client_50037651022'
        ];
        
        cookiesToClear.forEach(cookieName => {
            res.clearCookie(cookieName, { 
                path: '/',
                domain: '.catalystserverless.in'
            });
            res.clearCookie(cookieName, { path: '/' });
        });
        
        console.log('✓ Cookies cleared from response');
        console.log('=== LOGOUT REQUEST END - SUCCESS ===');
        
        // Only respond after everything is done
        res.json({ status: 'success', message: 'Logged out successfully', sessionInvalidated: true });
        
    } catch (err) {
        console.error('✗✗✗ Error during logout:', err);
        console.error('Error details:', err.message, err.stack);
        console.log('=== LOGOUT REQUEST END - ERROR ===');
        
        // Still try to clear cookies even if signOut fails
        res.clearCookie('ZCATALYST_SESSION', { path: '/' });
        res.clearCookie('catalyst-auth', { path: '/' });
        
        res.status(500).json({ 
            status: 'error', 
            message: err.message,
            sessionInvalidated: false 
        });
    }
});

// GET /auth/logout - Redirect-based logout fallback
app.get('/auth/logout', async (req, res) => {
    try {
        console.log('Logout requested (GET)');
        
        const catApp = catalyst.initialize(req);
        
        // Try to sign out using Catalyst SDK
        try {
            await catApp.userManagement().signOutUser();
            console.log('✓ User signed out via SDK');
        } catch (err) {
            console.log('Note: SDK signout not available:', err.message);
        }
        
        // Redirect to login with a flag to prevent auto-login
        res.redirect('/login');
    } catch (err) {
        console.error('Error in /auth/logout:', err);
        res.redirect('/login');
    }
});

// GET /auth/debug - Debug authentication status
app.get('/auth/debug', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const debugInfo = {
            cookies: req.headers.cookie,
            allHeaders: req.headers,
            catalystHeaders: {}
        };
        
        // Try to get any Catalyst context
        try {
            const user = await catApp.user().getCurrentUser();
            debugInfo.user = user;
            debugInfo.authenticated = true;
        } catch (err) {
            debugInfo.authenticated = false;
            debugInfo.error = {
                message: err.message,
                code: err.code,
                stack: err.stack
            };
        }
        
        res.status(200).json({ status: 'debug', data: debugInfo });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /auth/invite - Invite a new user
app.post('/auth/invite', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const { email, first_name, last_name } = req.body;
        
        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Email is required' });
        }
        
        console.log(`Invite request for: ${email}`);
        
        res.status(200).json({ 
            status: 'success', 
            message: 'User invitation sent',
            data: { email, first_name, last_name }
        });
    } catch (err) {
        console.error('Error in /auth/invite:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============================================
// MEMBER MANAGEMENT ROUTES
// ============================================
app.use('/', membersRoutes);

// ============================================
// ORGANISATION ROUTES (Temporary workaround)
// ============================================

// GET /orgs - List all organisations
app.get('/orgs', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const userId = req.headers['x-zc-user-id'];
        
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        // 1. Get orgs where user is Owner
        const ownerQuery = `SELECT * FROM Organisations WHERE OwnerID = '${userId}'`;
        const ownerResult = await catApp.zcql().executeZCQLQuery(ownerQuery);
        const ownedOrgs = ownerResult.map(row => row.Organisations);

        // 2. Get orgs where user is a Member
        const memberQuery = `SELECT OrganisationID FROM OrganisationMembers WHERE UserID = '${userId}' AND Status = 'Active'`;
        const memberResult = await catApp.zcql().executeZCQLQuery(memberQuery);
        
        let memberOrgIds = [];
        if (memberResult.length > 0) {
            memberOrgIds = memberResult.map(m => m.OrganisationMembers.OrganisationID);
        }

        // Filter out orgs we already have from owner list
        const ownedOrgIds = ownedOrgs.map(o => o.ROWID);
        const newOrgIds = memberOrgIds.filter(id => !ownedOrgIds.includes(id));

        let memberOrgs = [];
        if (newOrgIds.length > 0) {
            const orgQuery = `SELECT * FROM Organisations WHERE ROWID IN (${newOrgIds.map(id => `'${id}'`).join(',')})`;
            const result = await catApp.zcql().executeZCQLQuery(orgQuery);
            memberOrgs = result.map(row => row.Organisations);
        }

        // Combine
        const allOrgs = [...ownedOrgs, ...memberOrgs];
        
        res.json({ status: 'success', data: allOrgs });
    } catch (err) {
        console.error("List Orgs Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /orgs/:id - Get single organisation
app.get('/orgs/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const query = `SELECT * FROM Organisations WHERE ROWID = '${req.params.id}'`;
        const result = await catApp.zcql().executeZCQLQuery(query);
        if (result.length === 0) return res.status(404).json({ status: 'error', message: 'Organisation not found' });
        res.json({ status: 'success', data: result[0].Organisations });
    } catch (err) {
        console.error("Get Org Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});


// POST /orgs - Create organisation
app.post('/orgs', async (req, res) => {
    try {
        const { Name, Domain, Website, Address, Phone, LogoURL } = req.body;
        if (!Name) return res.status(400).json({ status: 'error', message: 'Name is required' });

        const catApp = catalyst.initialize(req);
        const userId = req.headers['x-zc-user-id'];
        
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }

        // Create organisation
        const rowData = { 
            Name, 
            Domain, 
            Website, 
            Address, 
            Phone, 
            LogoURL, 
            OwnerID: userId, 
            MemberCount: 1,
            Status: 'Active'  // Default status for new organisations
        };
        const result = await catApp.datastore().table('Organisations').insertRow(rowData);
        const orgId = result.ROWID;

        // Auto-add creator as Super Admin
        console.log('=== AUTO-ADD CREATOR AS SUPER ADMIN ===');
        console.log('Org ID:', orgId);
        console.log('User ID:', userId);
        try {
            const memberData = {
                OrganisationID: String(orgId),
                UserID: String(userId),
                Role: 'Super Admin',
                Status: 'Active'
            };
            console.log('Inserting member:', JSON.stringify(memberData, null, 2));
            const memberResult = await catApp.datastore().table('OrganisationMembers').insertRow(memberData);
            console.log('✓ MEMBER CREATED:', memberResult);
            console.log('Member ROWID:', memberResult.ROWID);
        } catch (memberErr) {
            console.error('❌ FAILED TO ADD CREATOR AS MEMBER:', memberErr);
            console.error('Error details:', JSON.stringify(memberErr, null, 2));
            console.error('Error message:', memberErr.message);
            console.error('Error stack:', memberErr.stack);
            // Don't fail org creation, but log extensively
        }

        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error("Create Org Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /orgs/:id - Update organisation
app.put('/orgs/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const updateData = { ROWID: req.params.id, ...req.body };
        const result = await catApp.datastore().table('Organisations').updateRow(updateData);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error("Update Org Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /orgs/:id - Delete organisation
app.delete('/orgs/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        await catApp.datastore().table('Organisations').deleteRow(req.params.id);
        res.json({ status: 'success', message: 'Organisation deleted' });
    } catch (err) {
        console.error("Delete Org Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============================================
// CONTACTS ROUTES (Temporary workaround)
// ============================================

// GET /orgs/:id/contacts - List contacts for an organisation
app.get('/orgs/:id/contacts', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const query = `SELECT * FROM Contacts WHERE OrganisationID = '${req.params.id}'`;
        const result = await catApp.zcql().executeZCQLQuery(query);
        const contacts = result.map(row => row.Contacts);
        res.json({ status: 'success', data: contacts });
    } catch (err) {
        console.error("List Contacts Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /orgs/:id/contacts - Create contact for an organisation
app.post('/orgs/:id/contacts', async (req, res) => {
    try {
        const { Name, Email, Role, Phone } = req.body;
        if (!Name || !Email) return res.status(400).json({ status: 'error', message: 'Name and Email are required' });

        const catApp = catalyst.initialize(req);
        const rowData = { 
            OrganisationID: req.params.id,
            Name, 
            Email, 
            Role, 
            Phone 
        };
        const result = await catApp.datastore().table('Contacts').insertRow(rowData);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error("Create Contact Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /orgs/contacts/:id - Update contact
app.put('/orgs/contacts/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const updateData = { ROWID: req.params.id, ...req.body };
        const result = await catApp.datastore().table('Contacts').updateRow(updateData);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error("Update Contact Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /orgs/contacts/:id - Delete contact
app.delete('/orgs/contacts/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        await catApp.datastore().table('Contacts').deleteRow(req.params.id);
        res.json({ status: 'success', message: 'Contact deleted' });
    } catch (err) {
        console.error("Delete Contact Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============================================
// REQUEST ROUTES
// ============================================

// Fetch Details Helper (Recursively fetch Sections and Items)
const fetchRequestDetails = async (catApp, requestId) => {
    // 1. Fetch Sections
    const sectionQuery = `SELECT * FROM Sections WHERE RequestID = '${requestId}' ORDER BY SortOrder ASC`;
    const sectionRows = await catApp.zcql().executeZCQLQuery(sectionQuery);
    
    const sections = [];
    
    for (const row of sectionRows) {
        const sectionData = row.Sections;
        // 2. Fetch Items for Section
        const itemQuery = `SELECT * FROM Items WHERE SectionID = '${sectionData.ROWID}'`;
        const itemRows = await catApp.zcql().executeZCQLQuery(itemQuery);
        
        const items = itemRows.map(i => ({
            id: i.Items.ROWID,
            title: i.Items.Title,
            type: i.Items.Type,
            status: i.Items.Status,
            isRequired: i.Items.IsRequired,
            reviewModifiedAt: i.Items.ReviewModifiedAt,
            fileId: i.Items.FileID,
            fileName: i.Items.FileName,
            folderId: i.Items.FolderID,
            allowedFileTypes: i.Items.AllowedFileTypes || ''
        }));

        sections.push({
            id: sectionData.ROWID,
            title: sectionData.Title,
            description: sectionData.Description,
            items: items
        });
    }
    
    return sections;
};

// GET / - List all requests (Pagination: page=1, per_page=10)
app.get('/', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        
        // Get authenticated user
        const userId = req.headers['x-zc-user-id'];
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.per_page) || 10;
        const offset = (page - 1) * limit;
        const status = req.query.status;

        const search = req.query.search;

        // Build Query
        let baseQuery = "SELECT * FROM Requests WHERE";
        const conditions = [];

        // 1. Template Mode
        if (req.query.type === 'template') {
            conditions.push("IsTemplateMode = true");
        } else {
            conditions.push("IsTemplateMode = false");
        }

        // 2. USER SCOPE - Only show user's own requests OR org requests if user is in an org
        // First, check if user belongs to an organisation with proper role
        let userOrgId = null;
        let userRole = null;
        
        try {
            const orgQuery = `SELECT OrganisationID, Role FROM OrganisationMembers WHERE UserID = '${userId}' AND Status = 'Active' LIMIT 1`;
            const orgResult = await catApp.zcql().executeZCQLQuery(orgQuery);
            if (orgResult.length > 0) {
                userOrgId = orgResult[0].OrganisationMembers.OrganisationID;
                userRole = orgResult[0].OrganisationMembers.Role;
            }
        } catch (err) {
            console.warn('Could not fetch user org:', err.message);
        }

        // Apply user/org filtering
        if (userOrgId && (userRole === 'Super Admin' || userRole === 'Admin' || userRole === 'Viewer')) {
            // Admins and Viewers can see all org requests
            conditions.push(`OrganisationID = '${userOrgId}'`);
        } else {
            // Contributors and users without org see only their own requests
            conditions.push(`CREATORID = '${userId}'`);
        }

        // 3. Status Filter
        if (status && status !== 'all') {
            const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
            conditions.push(`Status = '${capitalizedStatus}'`);
        }

        // 4. Search Filter
        if (search) {
            conditions.push(`(Subject LIKE '%${search}%' OR RecipientName LIKE '%${search}%' OR RecipientEmail LIKE '%${search}%')`);
        }

        baseQuery += " " + conditions.join(" AND ");
        
        baseQuery += ` ORDER BY CREATEDTIME DESC LIMIT ${limit} OFFSET ${offset}`;
        
        const queryResult = await catApp.zcql().executeZCQLQuery(baseQuery);
        
        const requests = queryResult.map(row => row.Requests);
        
        // Dynamic Progress Calculation
        // 1. Get all Request IDs
        const requestIds = requests.map(r => r.ROWID);
        
        if (requestIds.length > 0) {
             const idsStr = requestIds.map(id => `'${id}'`).join(',');
             
             // 2. Fetch Sections for these Requests
             const sectionsQuery = `SELECT ROWID, RequestID FROM Sections WHERE RequestID IN (${idsStr})`;
             const sectionRows = await catApp.zcql().executeZCQLQuery(sectionsQuery);
             const sections = sectionRows.map(row => row.Sections);
             
             // 3. Status Map: SectionID -> List of Item Statuses
             const sectionIds = sections.map(s => s.ROWID);
             const sectionStatusMap = {};
             
             if (sectionIds.length > 0) {
                 const sIdsStr = sectionIds.map(id => `'${id}'`).join(',');
                 const itemsQuery = `SELECT SectionID, Status FROM Items WHERE SectionID IN (${sIdsStr})`;
                 const itemRows = await catApp.zcql().executeZCQLQuery(itemsQuery);
                 
                 itemRows.forEach(row => {
                     const item = row.Items;
                     if (!sectionStatusMap[item.SectionID]) sectionStatusMap[item.SectionID] = [];
                     sectionStatusMap[item.SectionID].push(item.Status);
                 });
             }
             
             // 4. Map back to Requests
             const requestProgressMap = {};
             sections.forEach(sec => {
                 const statuses = sectionStatusMap[sec.ROWID] || [];
                 if (!requestProgressMap[sec.RequestID]) {
                     requestProgressMap[sec.RequestID] = { total: 0, completed: 0 };
                 }
                 requestProgressMap[sec.RequestID].total += statuses.length;
                 requestProgressMap[sec.RequestID].completed += statuses.filter(s => s !== 'Pending').length;
             });

             // Apply to requests
             const processedRequests = requests.map(r => {
                 const prog = requestProgressMap[r.ROWID] || { total: 0, completed: 0 };
                 return {
                    id: r.ROWID,
                    recipient: { name: r.RecipientName, email: r.RecipientEmail },
                    subject: r.Subject,
                    description: r.Description,
                    status: r.Status,
                    progress: `${prog.completed}/${prog.total}`,
                    date: r.CREATEDTIME,
                    dueDate: r.DueDate
                 };
             });
             
             res.status(200).json({ 
                status: 'success', 
                data: processedRequests,
                meta: { page, limit }
            });
        } else {
            res.status(200).json({ 
                status: 'success', 
                data: [],
                meta: { page, limit }
            });
        }
    } catch (err) {
        console.error('Fetch Requests Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /:id - Get single request with full details
app.get('/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const requestId = req.params.id;

        // 1. Fetch Request
        const requestQuery = `SELECT * FROM Requests WHERE ROWID = '${requestId}'`;
        const requestResult = await catApp.zcql().executeZCQLQuery(requestQuery);
        
        if (requestResult.length === 0) {
             return res.status(404).json({ status: 'error', message: 'Request not found' });
        }
        
        const r = requestResult[0].Requests;
        
        // 2. Fetch Sections and Items
        const sections = await fetchRequestDetails(catApp, requestId);
        
        // 3. Visibility Logic
        const isGuest = req.query.view === 'guest';
        if (isGuest && r.Status === 'Sent') {
            try {
                // Update Row via SDK
                await catApp.datastore().table('Requests').updateRow({ ROWID: r.ROWID, Status: 'Seen' });
                
                // Log via SDK
                await catApp.datastore().table('ActivityLog').insertRow({
                    RequestID: r.ROWID,
                    Action: 'Viewed',
                    Actor: 'Guest',
                    Details: 'Recipient viewed the request page'
                });
                
            } catch (logErr) {
                console.error('Failed to update visibility:', logErr);
            }
        }
        
        // Calculate Progress dynamically
        let totalItems = 0;
        let completedItems = 0;
        sections.forEach(sec => {
            if (sec.items) {
                totalItems += sec.items.length;
                completedItems += sec.items.filter(i => i.status !== 'Pending').length;
            }
        });

        const requestData = {
            id: r.ROWID,
            recipient: { name: r.RecipientName, email: r.RecipientEmail },
            subject: r.Subject,
            description: r.Description,
            ccRecipients: r.CCRecipients ? JSON.parse(r.CCRecipients) : [],
            // Return updated status appropriately without extra fetch if we just updated it
            status: (isGuest && r.Status === 'Sent') ? 'Seen' : r.Status,
            metadata: r.Metadata ? JSON.parse(r.Metadata) : {},
            progress: `${completedItems}/${totalItems}`,
            date: r.CREATEDTIME,
            dueDate: r.DueDate,
            sections: sections
        };

        res.status(200).json({ status: 'success', data: requestData });
    } catch (err) {
         console.error('Fetch Detail Error:', err);
         res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
