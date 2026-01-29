const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// GET /tags - List all tags
app.get('/tags', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const query = 'SELECT * FROM Tags';
        const result = await catApp.zcql().executeZCQLQuery(query);
        const tags = result.map(row => row.Tags);
        res.status(200).json({ status: 'success', data: tags });
    } catch (err) {
        console.error('Fetch Tags Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /tags - Create a new tag
app.post('/tags', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const { name, color, type } = req.body;

        // Check duplicates
        const query = `SELECT * FROM Tags WHERE Name = '${name}'`;
        const existing = await catApp.zcql().executeZCQLQuery(query);
        
        if (existing.length > 0) {
             return res.status(200).json({ status: 'success', data: existing[0].Tags });
        }

        const tagData = {
            Name: name,
            Color: color || '#2eb85c',
            Type: type || 'User'
        };

        const row = await catApp.datastore().table('Tags').insertRow(tagData);
        res.status(201).json({ status: 'success', data: { ...tagData, ROWID: row.ROWID } });
    } catch (err) {
        console.error('Create Tag Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST / - Create new request
app.post('/', async (req, res) => {
    try {
        // Initialize SDK
        const catApp = catalyst.initialize(req);
        
        // Get authenticated user ID
        const userId = req.headers['x-zc-user-id'];
        if (!userId) {
            return res.status(401).json({ status: 'error', message: 'Authentication required' });
        }
        
        // Input
        const { recipientName, recipientEmail, subject, description, message, metadata, dueDate, items, sections, tags } = req.body;

        // Get user's organisation (auto-assign)
        let organisationId = null;
        try {
            const orgQuery = `SELECT OrganisationID FROM OrganisationMembers WHERE UserID = '${userId}' AND Status = 'Active' LIMIT 1`;
            const orgResult = await catApp.zcql().executeZCQLQuery(orgQuery);
            if (orgResult.length > 0) {
                organisationId = orgResult[0].OrganisationMembers.OrganisationID;
                console.log('✓ Auto-assigned request to organisation:', organisationId);
            }
        } catch (orgErr) {
            console.warn('Could not fetch user organisation:', orgErr.message);
        }

        // 1. Insert Request
        const currentStatus = req.body.status || 'Draft';
        const requestData = {
            RecipientName: recipientName,
            RecipientEmail: recipientEmail,
            Subject: subject,
            Description: description || '',
            Message: message || '',
            Metadata: metadata ? JSON.stringify(metadata) : '{}',
            Status: currentStatus,
            DueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
            Progress: '0/0',
            IsTemplateMode: req.body.isTemplate || false,
            // AUTO-ASSIGN CREATOR & ORGANISATION
            OrganisationID: organisationId
            // CREATORID is auto-populated by Catalyst
        };

        const requestRow = await catApp.datastore().table('Requests').insertRow(requestData);
        const requestId = requestRow.ROWID;

        // 2. Insert Sections & Items - (Keep existing logic below, but we need to trigger email if Sent)
        
        // ... (We will insert items first in next blocks, but email can be sent async or after)
        // Let's send email AFTER items are inserted to ensure link is valid/ready? 
        // Actually, items don't affect the link heavily, but it's good practice.
        // I will add the email logic at the END of the function before res.json
        
        // Storing reference for email
        req.requestId = requestId; 
        req.startEmail = currentStatus === 'Sent';

        // 2. Insert Sections & Items (Original Code resumes here normally, I'm just replacing the Insert Block)
        // Normalize
        const sectionsToInsert = sections && sections.length > 0 ? sections : [
            { title: 'General Documents', items: items || [] }
        ];

        const processedSections = [];

        for (const [index, section] of sectionsToInsert.entries()) {
            // Insert Section
            const sectionData = {
                RequestID: requestId,
                Title: section.title,
                Description: section.description || '',
                SortOrder: index
            };
            const sectionRow = await catApp.datastore().table('Sections').insertRow(sectionData);
            const sectionId = sectionRow.ROWID;

            // Insert Items
            const processedItems = [];
            if (section.items && section.items.length > 0) {
                const itemsData = section.items.map(item => ({
                    SectionID: sectionId,
                    Title: item.title,
                    Type: item.type || 'File',
                    Status: 'Pending',
                    IsRequired: true,
                    AllowedFileTypes: item.allowedFileTypes || ''
                }));
                // Bulk Insert Items for efficiency
                const itemRows = await catApp.datastore().table('Items').insertRows(itemsData);
                
                processedItems.push(...itemRows.map((row, i) => ({
                    id: row.ROWID,
                    ...section.items[i],
                    status: 'Pending'
                })));
            }

            processedSections.push({
                id: sectionId,
                title: section.title,
                items: processedItems
            });
        }



        // 2b. Insert Request Tags
        if (tags && tags.length > 0) {
            try {
                const tagRows = tags.map(tagId => ({
                    RequestID: requestId,
                    TagID: tagId
                }));
                await catApp.datastore().table('RequestTags').insertRows(tagRows);
            } catch (tagErr) {
                console.warn('Failed to link tags:', tagErr);
            }
        }

        // 3. Log Activity
        try {
            await catApp.datastore().table('ActivityLog').insertRow({
                RequestID: requestId,
                Action: 'Created',
                Actor: 'Sender', 
                Details: `Request created for ${recipientName}`
            });
        } catch (e) {
             console.warn('Logging failed', e);
        }

        // 4. Send Email Notification if Status is 'Sent'
        let guestLink = null;
        if (currentStatus === 'Sent') {
             guestLink = `https://files-60057482421.development.catalystserverless.in/app/p/${requestId}`;
        }
        
        let emailResult = { attempted: false };

        if (req.startEmail && recipientEmail) {
            emailResult.attempted = true;
            try {
                const emailConfig = {
                    from_email: 'aaryank098@gmail.com', // Verified sender
                    to_email: [recipientEmail],
                    subject: `File Request: ${subject}`,
                    html_mode: true,
                    content: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                                <h2 style="margin: 0; color: #0f172a;">File Request</h2>
                            </div>
                            <div style="padding: 24px;">
                                <p style="font-size: 16px;">Hi ${recipientName || 'there'},</p>
                                <p>You have received a new file request.</p>
                                <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 16px 0;">
                                    <p style="margin: 0; font-weight: bold;">${subject}</p>
                                    ${message ? `<p style="margin: 8px 0 0; color: #64748b;">${message}</p>` : ''}
                                </div>
                                <p style="margin-bottom: 24px;">Please upload the requested documents by clicking the button below:</p>
                                <div style="text-align: center;">
                                    <a href="${guestLink}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">View Request & Upload Files</a>
                                </div>
                                <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">Link: <a href="${guestLink}" style="color: #2563eb;">${guestLink}</a></p>
                            </div>
                             <div style="background-color: #f8f9fa; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e0e0e0;">
                                Sent via File Request System
                            </div>
                        </div>
                    `
                };
                
                const mailRes = await catApp.email().sendMail(emailConfig);
                console.log(`✓ Email sent to ${recipientEmail}`);
                emailResult.success = true;
                emailResult.details = mailRes;
                
                // Log Email Activity
                await catApp.datastore().table('ActivityLog').insertRow({
                    RequestID: requestId,
                    Action: 'Email Sent',
                    Actor: 'System', 
                    Details: `Invitation email sent to ${recipientEmail}`
                });

            } catch (emailErr) {
                console.error("Failed to send email:", emailErr);
                emailResult.success = false;
                emailResult.error = emailErr.message || emailErr.toString();
                // Do not fail the request creation, just log it
            }
        }

        // Response
        const responseData = {
            id: requestId,
            ...requestData,
            sections: processedSections,
            emailDebug: emailResult,
            guestLink: guestLink
        };

        res.status(201).json({ status: 'success', data: responseData });

    } catch (err) {
        console.error('Create Request Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
