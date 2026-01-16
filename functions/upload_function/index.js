const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');
const fetch = require('node-fetch');
const FormData = require('form-data');
const multer = require('multer');

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Store in memory for simplicity

app.use(express.json());
app.use(cors());

// --- REST API HELPERS ---
async function getAccessToken(req) {
     return process.env.CATALYST_ADMIN_TOKEN || ''; 
}

// POST / - Upload File
app.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file provided' });
    }

    try {
        const catApp = catalyst.initialize(req);
        const projectId = process.env.CATALYST_PROJECT_ID || '4000000006007';
        const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
        const uploadFolderId = process.env.UPLOAD_FOLDER_ID; // Must be set in Env
        const accessToken = await getAccessToken(req);

        if (!uploadFolderId) {
             throw new Error("UPLOAD_FOLDER_ID is not configured");
        }

        // 1. Upload to Catalyst File Store via REST
        const url = `${apiDomain}/baas/v1/project/${projectId}/folder/${uploadFolderId}/file`;
        
        const form = new FormData();
        form.append('file', req.file.buffer, req.file.originalname);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                ...form.getHeaders()
            },
            body: form
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Upload Failed: ${JSON.stringify(data)}`);
        }

        // Catalyst returns: { status: 'success', data: [ { file_id: ..., file_name: ... } ] }
        const fileRecord = data.data[0];

        // 2. Link logic (Optional/Specific to implementation)
        // If query params provided (e.g. ?itemId=...), we can update the Item status.
        const itemId = req.body.itemId || req.query.itemId;
        if (itemId) {
             try {
                // Update Item Status to 'Uploaded' via Data Store REST API
                const rowUpdateUrl = `${apiDomain}/baas/v1/project/${projectId}/table/Items/row`;
                await fetch(rowUpdateUrl, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Zoho-oauthtoken ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify([{
                        "ROWID": itemId,
                        "Status": "Uploaded", 
                        "FileID": fileRecord.file_id // Assuming we track this
                    }])
                });
             } catch (linkErr) {
                 console.warn("Failed to link file to item:", linkErr);
             }
        }

        res.status(200).json({
            status: 'success',
            data: {
                id: fileRecord.file_id,
                filename: fileRecord.file_name,
                size: fileRecord.file_size,
                url: `${apiDomain}/baas/v1/project/${projectId}/folder/${uploadFolderId}/file/${fileRecord.file_id}/download` 
            }
        });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /:id - Download/Stream File
app.get('/:id', async (req, res) => {
    try {
        const fileId = req.params.id;
        const projectId = process.env.CATALYST_PROJECT_ID || '4000000006007';
        const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
        const uploadFolderId = process.env.UPLOAD_FOLDER_ID;
        const accessToken = await getAccessToken(req);

        const url = `${apiDomain}/baas/v1/project/${projectId}/folder/${uploadFolderId}/file/${fileId}/download`;

        const response = await fetch(url, {
             method: 'GET',
             headers: {
                 'Authorization': `Zoho-oauthtoken ${accessToken}`
             }
        });

        if (!response.ok) {
            // Try to consume body to avoid hang?
            return res.status(response.status).json({ status: 'error', message: 'Download failed' });
        }

        // Pipe stream
        response.body.pipe(res);

    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /:id
app.delete('/:id', async (req, res) => {
     try {
        const fileId = req.params.id;
        const projectId = process.env.CATALYST_PROJECT_ID || '4000000006007';
        const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
        const uploadFolderId = process.env.UPLOAD_FOLDER_ID;
        const accessToken = await getAccessToken(req);

        const url = `${apiDomain}/baas/v1/project/${projectId}/folder/${uploadFolderId}/file/${fileId}`;

        const response = await fetch(url, {
             method: 'DELETE',
             headers: {
                 'Authorization': `Zoho-oauthtoken ${accessToken}`
             }
        });
        
        const data = await response.json();

        if (response.ok) {
            res.json({ status: 'success', data: data });
        } else {
            res.status(response.status).json({ status: 'error', message: 'Delete failed', details: data });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
