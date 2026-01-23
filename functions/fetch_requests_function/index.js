const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// ============================================
// AUTH ROUTES (Temporary workaround)
// ============================================

// GET /auth/me - Get current authenticated user
app.get('/auth/me', async (req, res) => {
    try {
        console.log('=== AUTH /me REQUEST ===');
        
        // Check for Catalyst user headers
        const userId = req.headers['x-zc-user-id'];
        console.log('User ID from header:', userId);
        
        if (!userId) {
            console.log('✗ No user ID in headers - not authenticated');
            return res.status(200).json({ status: 'success', data: null });
        }
        
        const catApp = catalyst.initialize(req);
        let userDetails = null;
        
        try {
            // Get full user details from Catalyst User Management
            const userManagement = catApp.userManagement();
            userDetails = await userManagement.getUserDetails(userId);
            console.log('✓ Got user via getUserDetails:', userDetails.email_id);
            
            res.status(200).json({ status: 'success', data: userDetails });
        } catch (err) {
            console.log('✗ getUserDetails failed, using header data:', err.message);
            
            // Fallback: Use header information
            userDetails = {
                user_id: userId,
                email_id: req.headers['x-zc-user-email'] || 'user@example.com',
                first_name: req.headers['x-zc-user-firstname'] || 'User',
                last_name: req.headers['x-zc-user-lastname'] || '',
                user_type: req.headers['x-zc-user-type'],
                role_details: {
                    role_name: req.headers['x-zc-user-type'] === 'admin' ? 'App Admin' : 'User'
                }
            };
            console.log('✓ Using user from headers');
            
            res.status(200).json({ status: 'success', data: userDetails });
        }
    } catch (err) {
        console.error('Critical error in /auth/me:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /auth/logout - Redirect to Catalyst logout
app.get('/auth/logout', (req, res) => {
    try {
        // Catalyst logout URL format
        const projectId = process.env.CATALYST_PROJECT_ID || '25342000000014733';
        const logoutUrl = `/baas/v1/project/${projectId}/user/logout`;
        
        console.log('Logout redirect to:', logoutUrl);
        res.redirect(logoutUrl);
    } catch (err) {
        console.error('Error in /auth/logout:', err);
        res.status(500).json({ status: 'error', message: err.message });
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
// ORGANISATION ROUTES (Temporary workaround)
// ============================================

// GET /orgs - List all organisations
app.get('/orgs', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const query = "SELECT * FROM Organisations";
        const result = await catApp.zcql().executeZCQLQuery(query);
        const orgs = result.map(row => row.Organisations);
        res.json({ status: 'success', data: orgs });
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
        const rowData = { Name, Domain, Website, Address, Phone, LogoURL };
        const result = await catApp.datastore().table('Organisations').insertRow(rowData);
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

        // 2. Status Filter
        if (status && status !== 'all') {
            const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
            conditions.push(`Status = '${capitalizedStatus}'`);
        }

        // 3. Search Filter
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
