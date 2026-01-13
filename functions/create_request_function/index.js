const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// Helper to insert item
const insertItem = async (datastore, sectionId, item) => {
    const itemData = {
        SectionID: sectionId,
        Title: item.title,
        Type: item.type || 'File',
        Status: 'Pending',
        IsRequired: true,
        ReviewModifiedAt: null
    };
    return datastore.table('Items').insertRow(itemData);
};

// POST / - Create new request
app.post('/', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const datastore = catApp.datastore();

        const { recipientName, recipientEmail, subject, description, message, metadata, dueDate, items, sections } = req.body;

        // 1. Insert Request
        const requestData = {
            RecipientName: recipientName,
            RecipientEmail: recipientEmail,
            Subject: subject,
            Description: description || '',
            Message: message || '',
            Metadata: metadata ? JSON.stringify(metadata) : '{}',
            Status: 'Draft',
            DueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null, // YYYY-MM-DD
            Progress: '0/0', // Initial progress
            IsTemplateMode: false
        };

        const requestRow = await datastore.table('Requests').insertRow(requestData);
        const requestId = requestRow.ROWID;

        // 2. Insert Sections & Items
        // Normalize: If no sections provided, wrap items in "General"
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
            const sectionRow = await datastore.table('Sections').insertRow(sectionData);
            const sectionId = sectionRow.ROWID;

            // Insert Items for this Section
            const processedItems = [];
            if (section.items && section.items.length > 0) {
                for (const item of section.items) {
                    const itemRow = await insertItem(datastore, sectionId, item);
                    processedItems.push({
                        id: itemRow.ROWID,
                        ...item,
                        status: 'Pending'
                    });
                }
            }

            processedSections.push({
                id: sectionId,
                title: section.title,
                items: processedItems
            });
        }

        // 3. Log Activity
        try {
            // Get user info from Catalyst Auth (if available in req.user)
            // const user = req.user; 
            await datastore.table('ActivityLog').insertRow({
                RequestID: requestId,
                Action: 'Created',
                Actor: 'Sender', // Replace with user.email if auth enabled
                Details: `Request created for ${recipientName}`
            });
        } catch (e) {
             console.warn('Logging failed', e);
        }

        // Return the fully constructed object with ROWIDs
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
