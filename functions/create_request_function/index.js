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
        
        // Input
        const { recipientName, recipientEmail, subject, description, message, metadata, dueDate, items, sections, tags } = req.body;

        // 1. Insert Request
        const requestData = {
            RecipientName: recipientName,
            RecipientEmail: recipientEmail,
            Subject: subject,
            Description: description || '',
            Message: message || '',
            Metadata: metadata ? JSON.stringify(metadata) : '{}',
            Status: 'Draft',
            DueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
            Progress: '0/0',
            IsTemplateMode: req.body.isTemplate || false
            // CreatorID: catApp.user().getCurrentUser().id // e.g.
        };

        const requestRow = await catApp.datastore().table('Requests').insertRow(requestData);
        const requestId = requestRow.ROWID;

        // 2. Insert Sections & Items
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

        // Response
        const responseData = {
            id: requestId,
            ...requestData,
            sections: processedSections
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
