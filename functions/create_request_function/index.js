const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();

app.use(express.json());
app.use(cors());

// --- REST API HELPERS ---

async function getAccessToken(catalystApp) {
    // In a real function, the SDK handles auth context, but for 'internal' REST calls 
    // we need a token. 
    // If native auth is enabled, req.headers['x-zc-user-token'] might exist? 
    // Or we use the connector. 
    // For this implementation, we assume we can get a connector token OR env token.
    // Simplifying: Use Process Env for Admin actions or assume we are 'God Mode' via Admin Token.
    // Ideally: const connector = catalystApp.connection({ ... }); return connector.getAccessToken();
    return process.env.CATALYST_ADMIN_TOKEN || ''; 
}

async function insertRowRest(tableName, dataObj, accessToken, projectId, apiDomain) {
    // URL: POST /baas/v1/project/{project_id}/table/{tableIdentifier}/row
    const url = `${apiDomain}/baas/v1/project/${projectId}/table/${tableName}/row`;
    
    // Payload must be an array: [ { ... } ]
    const payload = [ dataObj ];

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const respData = await response.json();

    if (!response.ok) {
        throw new Error(`Data Store Insert Failed (${tableName}): ${JSON.stringify(respData)}`);
    }

    // Success response: { status: 'success', data: [ { ROWID: ... } ] }
    return respData.data[0];
}

// --- LOGIC ---

// Helper to insert item via REST
const insertItem = async (sectionId, item, accessToken, projectId, apiDomain) => {
    const itemData = {
        SectionID: sectionId,
        Title: item.title,
        Type: item.type || 'File',
        Status: 'Pending',
        IsRequired: true,
        ReviewModifiedAt: null
    };
    return insertRowRest('Items', itemData, accessToken, projectId, apiDomain);
};

// POST / - Create new request
app.post('/', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        
        // Configuration
        const projectId = process.env.CATALYST_PROJECT_ID || '4000000006007'; // Fallback
        const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
        const accessToken = await getAccessToken(catApp);

        // Input
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
            DueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
            Progress: '0/0',
            IsTemplateMode: false,
            // CreatorID: ... (Would come from Auth logic)
        };

        const requestRow = await insertRowRest('Requests', requestData, accessToken, projectId, apiDomain);
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
            const sectionRow = await insertRowRest('Sections', sectionData, accessToken, projectId, apiDomain);
            const sectionId = sectionRow.ROWID;

            // Insert Items
            const processedItems = [];
            if (section.items && section.items.length > 0) {
                for (const item of section.items) {
                    const itemRow = await insertItem(sectionId, item, accessToken, projectId, apiDomain);
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
            await insertRowRest('ActivityLog', {
                RequestID: requestId,
                Action: 'Created',
                Actor: 'Sender', // Placeholder
                Details: `Request created for ${recipientName}`
            }, accessToken, projectId, apiDomain);
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
