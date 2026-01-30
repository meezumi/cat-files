const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const router = express.Router();

// Cron Job Endpoint: Process Automated Reminders
router.post('/scheduler/process-reminders', async (req, res) => {
    console.log("Starting Scheduled Reminder Check...");
    const catApp = catalyst.initialize(req);

    try {
        // 1. Fetch Active Requests
        // Note: For large scale, implement pagination or cursor-based fetching
        const query = "SELECT ROWID, RecipientEmail, RecipientName, Subject, Metadata, Status, CreatedTime FROM Requests WHERE Status != 'Completed' AND Status != 'Draft' LIMIT 200";
        const result = await catApp.zcql().executeZCQLQuery(query);

        if (!result || result.length === 0) {
            console.log("No active requests found.");
            return res.json({ status: 'success', processed: 0, sent: 0, message: 'No active requests.' });
        }

        let processedCount = 0;
        let sentCount = 0;
        const updates = [];
        const activityLogs = [];

        // 2. Iterate and Check Logic
        for (const row of result) {
            const reqData = row.Requests;
            processedCount++;

            try {
                // Parse Metadata
                let metadata = {};
                if (reqData.Metadata) {
                    try {
                        metadata = JSON.parse(reqData.Metadata);
                    } catch (e) {
                        console.warn(`Invalid Metadata for Request ${reqData.ROWID}:`, e);
                        continue;
                    }
                }

                const settings = metadata.reminderSettings;

                // Check if auto-remind is enabled
                if (settings && settings.autoRemind) {
                    const now = new Date();
                    const intervalDays = parseInt(settings.remindInterval) || 3;
                    
                    // Determine Last Sent Time or Creation Time
                    let lastActionTime = new Date(reqData.CreatedTime);
                    if (settings.reminderStats && settings.reminderStats.lastSent) {
                        lastActionTime = new Date(settings.reminderStats.lastSent);
                    }

                    // Calculate Next Reminder Time
                    const nextReminderTime = new Date(lastActionTime);
                    nextReminderTime.setDate(lastActionTime.getDate() + intervalDays);

                    // If Due (Now >= NextReminderTime)
                    if (now >= nextReminderTime) {
                        console.log(`Sending reminder for Request ${reqData.ROWID} (Recipient: ${reqData.RecipientEmail})`);
                        
                        // Send Email
                        await sendReminderEmail(catApp, reqData);
                        sentCount++;

                        // Update Metadata
                        const newStats = {
                            sentCount: (settings.reminderStats?.sentCount || 0) + 1,
                            lastSent: now.toISOString()
                        };
                        
                        // Update Object
                        metadata.reminderSettings.reminderStats = newStats;
                        
                        updates.push({
                            ROWID: reqData.ROWID,
                            Metadata: JSON.stringify(metadata)
                        });

                        activityLogs.push({
                            RequestID: reqData.ROWID,
                            Action: 'Auto-Reminder Sent',
                            Actor: 'System (Cron)',
                            Details: `Automated reminder #${newStats.sentCount} sent to ${reqData.RecipientEmail}`
                        });
                    }
                }
            } catch (err) {
                console.error(`Error processing request ${reqData.ROWID}:`, err);
            }
        }

        // 3. Batch Updates
        if (updates.length > 0) {
            console.log(`Updating ${updates.length} requests with new reminder stats...`);
            await catApp.datastore().table('Requests').updateRows(updates);
        }

        if (activityLogs.length > 0) {
             await catApp.datastore().table('ActivityLog').insertRows(activityLogs);
        }

        console.log(`Reminder Check Complete. Processed: ${processedCount}, Sent: ${sentCount}`);
        res.json({ status: 'success', processed: processedCount, sent: sentCount });

    } catch (err) {
        console.error("Scheduler Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Helper for sending email
async function sendReminderEmail(catApp, request) {
    const link = `https://files-60057482421.development.catalystserverless.in/app/p/${request.ROWID}`;
    
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
                    <p>This is an automated reminder that we are waiting for documents for:</p>
                    <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 0; font-weight: bold;">${request.Subject}</p>
                    </div>
                    <p style="margin-bottom: 24px;">Please upload the requested documents at your earliest convenience.</p>
                    <div style="text-align: center;">
                        <a href="${link}" style="display: inline-block; background-color: #f59e0b; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Request & Upload Files</a>
                    </div>
                    <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">Link: <a href="${link}" style="color: #2563eb;">${link}</a></p>
                </div>
                 <div style="background-color: #f8f9fa; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e0e0e0;">
                    Automated Message via File Request System
                </div>
            </div>
        `
    };

    return catApp.email().sendMail(emailConfig);
}

module.exports = router;
