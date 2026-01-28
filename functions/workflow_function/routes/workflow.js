const express = require('express');
const router = express.Router();
const catalyst = require('zcatalyst-sdk-node');

// PUT /requests/:id/status - Update Request Status
router.put('/requests/:id/status', async (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ status: 'error', message: 'Status is required' });

    try {
        const catApp = catalyst.initialize(req);
        
        // If archiving, first fetch current status to store it
        let updateData = {
            ROWID: requestId,
            Status: status
        };

        if (status === 'Archived') {
            // Fetch current request to save its status before archiving
            const query = `SELECT * FROM Requests WHERE ROWID = '${requestId}'`;
            const result = await catApp.zcql().executeZCQLQuery(query);
            if (result.length > 0) {
                const currentRequest = result[0].Requests;
                // Store previous status in Metadata field (as JSON)
                const metadata = currentRequest.Metadata ? JSON.parse(currentRequest.Metadata) : {};
                metadata.previousStatus = currentRequest.Status;
                updateData.Metadata = JSON.stringify(metadata);
            }
        } else if (status === 'Unarchived') {
            // Restore from archive - get previous status from metadata
            const query = `SELECT * FROM Requests WHERE ROWID = '${requestId}'`;
            const result = await catApp.zcql().executeZCQLQuery(query);
            if (result.length > 0) {
                const currentRequest = result[0].Requests;
                const metadata = currentRequest.Metadata ? JSON.parse(currentRequest.Metadata) : {};
                // Restore to previous status, or default to 'Sent'
                updateData.Status = metadata.previousStatus || 'Sent';
                // Clear the previousStatus from metadata
                delete metadata.previousStatus;
                updateData.Metadata = JSON.stringify(metadata);
            }
        }

        const updatedRow = await catApp.datastore().table('Requests').updateRow(updateData);
        res.json({ status: 'success', data: updatedRow });

    } catch (err) {
        console.error("Update Request Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /requests/:id - Update General Request Details (DueDate, etc.)
router.put('/requests/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const updateData = {
            ROWID: req.params.id,
            ...req.body
        };
        
        // Remove restricted fields just in case
        delete updateData.CREATORID;
        delete updateData.CREATEDTIME;
        
        // If updating DueDate, ensure valid key
        if (req.body.dueDate) {
            updateData.DueDate = new Date(req.body.dueDate).toISOString().split('T')[0];
        }

        const updatedRow = await catApp.datastore().table('Requests').updateRow(updateData);
        res.json({ status: 'success', data: updatedRow });

    } catch (err) {
        console.error("Update Request General Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /requests/:id/cc - Add CC Recipient
router.post('/requests/:id/cc', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const { name, email } = req.body;
        const requestId = req.params.id;

        if (!name || !email) return res.status(400).json({ status: 'error', message: 'Name and email are required' });

        // 1. Fetch current request to get existing CCs
        const query = `SELECT CCRecipients, Subject, RecipientName FROM Requests WHERE ROWID = '${requestId}'`;
        const result = await catApp.zcql().executeZCQLQuery(query);
        
        if (result.length === 0) return res.status(404).json({ status: 'error', message: 'Request not found' });

        const request = result[0].Requests;
        
        // 2. Parse existing CCs
        let ccList = [];
        try {
            if (request.CCRecipients) {
                ccList = JSON.parse(request.CCRecipients);
            }
        } catch (e) {
            ccList = [];
        }

        // 3. Add new CC
        const newCC = {
            id: Date.now().toString(),
            name,
            email,
            addedAt: new Date().toISOString()
        };
        ccList.push(newCC);

        // 4. Update Database
        await catApp.datastore().table('Requests').updateRow({
            ROWID: requestId,
            CCRecipients: JSON.stringify(ccList)
        });

        // 5. TODO: Trigger Email Notification to new recipient
        
        res.json({ status: 'success', data: ccList, message: 'CC Recipient added successfully' });

    } catch (err) {
        console.error('Add CC Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /items/:id/status - Update Item Status
router.put('/items/:id/status', async (req, res) => {
    const itemId = req.params.id;
    const { status, feedback } = req.body;

    try {
        const catApp = catalyst.initialize(req);
        
        const updateData = {
            ROWID: itemId,
            Status: status
            // Feedback: feedback || "" // Feedback column does not exist in schema yet
        };

        const updatedRow = await catApp.datastore().table('Items').updateRow(updateData);
        res.json({ status: 'success', data: updatedRow });

    } catch (err) {
        console.error("Update Item Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /requests/:id/remind
router.post('/requests/:id/remind', async (req, res) => {
    // TODO: Implement Email logic via SDK
    res.json({ status: 'success', message: 'Reminder sent (Mock)' });
});

// DELETE /trash - Parmanently delete all requests in Trash
router.delete('/trash', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        
        // Use ZCQL to delete all requests with Status = 'Trash'
        // Note: Delete only works on ROWID usually in SDK, but ZCQL supports conditions.
        const query = "DELETE FROM Requests WHERE Status = 'Trash'";
        
        // executeZCQLQuery for DELETE returns the deleted rows usually or generic response
        const result = await catApp.zcql().executeZCQLQuery(query);
        
        res.json({ status: 'success', message: 'Trash emptied successfully', data: result });

    } catch (err) {
        console.error("Empty Trash Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /cron/expire-requests - Check and expire overdue requests
router.post('/cron/expire-requests', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        
        // Get today's start of day string (YYYY-MM-DD)
        // Requests with DueDate < Today are expired
        const today = new Date().toISOString().split('T')[0];
        
        console.log(`Running Expiry Job. Checking for requests due before: ${today}`);
        
        // Fetch candidates: Active requests with DueDate strictly less than today
        // Exclude already Expired, Completed, Archived, or Draft (assuming drafts don't expire?)
        // Actually, Drafts might have due dates, but usually we expire "Sent" or "In Review" requests.
        // Let's stick to expiring anything that isn't final.
        // Final statuses: Completed, Archived, Expired, Trash.
        
        const query = `SELECT ROWID, DueDate, Status FROM Requests WHERE DueDate < '${today}' AND Status != 'Expired' AND Status != 'Completed' AND Status != 'Archived' AND Status != 'Trash'`;
        
        const result = await catApp.zcql().executeZCQLQuery(query);
        const expiredIds = [];
        
        if (result.length > 0) {
            console.log(`Found ${result.length} overdue requests.`);
            
            const updatePromises = result.map(async row => {
                const r = row.Requests;
                expiredIds.push(r.ROWID);
                
                // Update Status
                await catApp.datastore().table('Requests').updateRow({
                    ROWID: r.ROWID,
                    Status: 'Expired'
                });
                
                // Log Activity
                await catApp.datastore().table('ActivityLog').insertRow({
                    RequestID: r.ROWID,
                    Action: 'Expired',
                    Actor: 'System', 
                    Details: `Request expired automatically (Due Date: ${r.DueDate})`
                });
            });
            
            await Promise.all(updatePromises);
        } else {
            console.log('No overdue requests found.');
        }
        
        res.json({ 
            status: 'success', 
            message: `Expired ${expiredIds.length} requests`, 
            expiredCount: expiredIds.length,
            expiredIds 
        });

    } catch (err) {
        console.error("Expire Requests Cron Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
