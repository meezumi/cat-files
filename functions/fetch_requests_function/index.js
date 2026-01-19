const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

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
            folderId: i.Items.FolderID
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

        // Build Query
        let baseQuery = "SELECT * FROM Requests";
        if (status && status !== 'all') {
            const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
             baseQuery += ` WHERE Status = '${capitalizedStatus}' AND IsTemplateMode = false`;
        } else if (req.query.type === 'template') {
             baseQuery += ` WHERE IsTemplateMode = true`;
        } else {
             baseQuery += ` WHERE IsTemplateMode = false`;
        }
        
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
