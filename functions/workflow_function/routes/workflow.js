const express = require('express');
const router = express.Router();
const catalyst = require('zcatalyst-sdk-node');

// POST /requests/batch-status - Update Multiple Requests Status
router.post('/requests/batch-status', async (req, res) => {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) return res.status(400).json({ status: 'error', message: 'Invalid payload' });

    try {
        const catApp = catalyst.initialize(req);
        
        // Processing in chunks or sequential to handle archive logic properly
        // For Archive/Unarchive, we need current status, which requires querying.
        // If simply Trash/Draft/Etc, we can just bulk update provided we don't care about previousStatus history for non-archive.
        // But let's reuse logic for consistency.
        
        // Fetch all target requests first
        // Formulate query: ROWID in ('id1', 'id2', ...)
        const idList = ids.map(id => `'${id}'`).join(',');
        const query = `SELECT * FROM Requests WHERE ROWID IN (${idList})`;
        const result = await catApp.zcql().executeZCQLQuery(query);
        
        const updatePromises = result.map(async row => {
            const currentRequest = row.Requests;
            let updateData = {
                ROWID: currentRequest.ROWID,
                Status: status
            };
            
            if (status === 'Archived') {
                const metadata = currentRequest.Metadata ? JSON.parse(currentRequest.Metadata) : {};
                metadata.previousStatus = currentRequest.Status;
                updateData.Metadata = JSON.stringify(metadata);
            } else if (status === 'Unarchived') {
                const metadata = currentRequest.Metadata ? JSON.parse(currentRequest.Metadata) : {};
                updateData.Status = metadata.previousStatus || 'Sent';
                delete metadata.previousStatus;
                updateData.Metadata = JSON.stringify(metadata);
            }
            
            return catApp.datastore().table('Requests').updateRow(updateData);
        });

        await Promise.all(updatePromises);
        res.json({ status: 'success', count: ids.length, message: `Updated ${ids.length} requests to ${status}` });

    } catch (err) {
        console.error("Batch Update Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

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
    try {
        const catApp = catalyst.initialize(req);
        const requestId = req.params.id;

        // Fetch Request
        const query = `SELECT Subject, RecipientEmail, RecipientName, Message, Status FROM Requests WHERE ROWID = '${requestId}'`;
        const result = await catApp.zcql().executeZCQLQuery(query);

        if (result.length === 0) return res.status(404).json({ status: 'error', message: 'Request not found' });

        const request = result[0].Requests;

        if (!request.RecipientEmail) {
            return res.status(400).json({ status: 'error', message: 'No recipient email found for this request' });
        }

        // Construct Guest Link
        const link = `https://files-60057482421.development.catalystserverless.in/app/p/${requestId}`;

        // Send Email
        const emailConfig = {
            from_email: 'aaryank098@gmail.com', // Verified sender
            to_email: [request.RecipientEmail],
            subject: `Reminder: File Request - ${request.Subject}`,
            html_mode: true,
            content: `
                <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #fef3c7; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                        <h2 style="margin: 0; color: #92400e;">Reminder</h2>
                    </div>
                    <div style="padding: 24px;">
                        <p style="font-size: 16px;">Hi ${request.RecipientName || 'there'},</p>
                        <p>This is a gentle reminder that we are still waiting for the documents for the following request:</p>
                        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b;">
                            <p style="margin: 0; font-weight: bold;">${request.Subject}</p>
                        </div>
                        <p style="margin-bottom: 24px;">Please upload the requested documents at your earliest convenience.</p>
                        <div style="text-align: center;">
                            <a href="${link}" style="display: inline-block; background-color: #f59e0b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Request & Upload Files</a>
                        </div>
                        <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">Link: <a href="${link}" style="color: #2563eb;">${link}</a></p>
                    </div>
                </div>
            `
        };

        await catApp.email().sendMail(emailConfig);

        // Log Activity
        await catApp.datastore().table('ActivityLog').insertRow({
            RequestID: requestId,
            Action: 'Reminder Sent',
            Actor: 'System', 
            Details: `Reminder email sent to ${request.RecipientEmail}`
        });

        res.json({ status: 'success', message: 'Reminder sent successfully' });

    } catch (err) {
        console.error("Send Reminder Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
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
