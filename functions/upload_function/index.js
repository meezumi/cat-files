const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
// SDK Upload often needs a file path or buffer. Multer memory storage gives buffer.
const upload = multer({ storage: multer.memoryStorage() }); 

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Ensure a folder exists; if not, create it using SDK.
async function ensureFolderExists(catApp, parentFolderId, folderName) {
    try {
        // SDK doesn't have a direct "create if not exists".
        // We try to create. If it fails, we assume it exists.
        // There is no easy "Search" for folder by name in SDK either without listing.
        // Just Try Create.
        const folderDetails = await catApp.filestore().folder(parentFolderId).createSubFolder(folderName);
        return folderDetails.id;
    } catch (err) {
        // If error, it might already exist.
        // We can try to list children of parent and find it?
        // Or we just return the Parent ID to be safe if we can't find it.
        // NOTE: SDK 'createSubFolder' throws if exists? Or returns existing?
        // Catalyst API behavior: Conflict (409).
        // If conflict, we need to FIND the folder.
        // SDK: app.filestore().folder(parentFolderId).getFolders() -> returns list.
        try {
             // Fallback: list folders in parent
            const folders = await catApp.filestore().folder(parentFolderId).getSubFolders();
            const existing = folders.find(f => f.folder_name === folderName);
            if (existing) return existing.id;
        } catch (findErr) {
            console.warn("Could not list folders to find existing:", findErr);
        }
        
        console.warn(`Folder creation for ${folderName} failed. Using parent.`);
        return parentFolderId;
    }
}


// POST / - Upload File
app.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file provided' });
    }

    try {
        const catApp = catalyst.initialize(req);
        let uploadFolderId = process.env.UPLOAD_FOLDER_ID;

        // Context from Body (Multer parses body too)
        const { requestId, sectionId, itemId } = req.body;

        if (!uploadFolderId) throw new Error("UPLOAD_FOLDER_ID not configured");

        // --- DYNAMIC FOLDER LOGIC ---
        // 1. Request Folder
        if (requestId) {
            uploadFolderId = await ensureFolderExists(catApp, uploadFolderId, `Request_${requestId}`);
        }
        // 2. Section Folder
        if (sectionId) {
             uploadFolderId = await ensureFolderExists(catApp, uploadFolderId, `Section_${sectionId}`);
        }
        // 3. Item Folder
        if (itemId) {
             uploadFolderId = await ensureFolderExists(catApp, uploadFolderId, `Item_${itemId}`);
        }
        // -----------------------------

        // Upload using SDK
        // SDK Method: folder.uploadFile(config)
        // Check SDK docs: usually requires { code: buffer, name: string }
        
        // Hint: SDK nodejs uploadFile accepts: { code: Stream/Buffer, name: 'filename' }
        const folder = catApp.filestore().folder(uploadFolderId);
        const uploadResp = await folder.uploadFile({
            code: req.file.buffer,
            name: req.file.originalname
        });
        
        // uploadResp contains { id: ..., file_name: ... }
        
        const fileId = uploadResp.id;
        const fileName = uploadResp.file_name;

        // Link to Item (if itemId provided)
        if (itemId) {
             try {
                const updatePayload = {
                    "ROWID": itemId,
                    "Status": "Uploaded", 
                    "FileID": fileId,
                    "FolderID": uploadFolderId 
                };
                await catApp.datastore().table('Items').updateRow(updatePayload);
             } catch (linkErr) {
                 console.warn("Failed to link file to item:", linkErr);
             }
        }

        res.status(200).json({
            status: 'success',
            data: {
                id: fileId,
                folder_id: uploadFolderId,
                filename: fileName,
                // We construct a generic download link proxy
                url: `/server/upload_function/${fileId}?folderId=${uploadFolderId}` 
            }
        });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /:id - Download
app.get('/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const fileId = req.params.id;
        let folderId = req.query.folderId || process.env.UPLOAD_FOLDER_ID;

        if (!folderId) return res.status(400).send("Missing Folder ID");

        // Download using SDK
        // SDK: folder(id).file(id).download() -> returns Promise<Buffer> or Stream?
        
        const fileObj = catApp.filestore().folder(folderId).file(fileId);
        const fileStream = await fileObj.download(); // Usually returns stream in recent SDK, or buffer.
        
        // If buffer, send it. If stream, pipe.
        // SDK documentation says download() returns `client.request()` promise which is body.
        // It might be blob or buffer.
        
        // Safe bet: set headers and send.
        // In Node SDK, download() might return the file content directly.
        
        res.setHeader('Content-Disposition', `attachment; filename="downloaded_file"`); // SDK might not give name easily here without extra fetch
        res.send(fileStream);

    } catch (err) {
        console.error("Download Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.delete('/:id', async (req, res) => {
     try {
        const catApp = catalyst.initialize(req);
        const fileId = req.params.id;
        let folderId = req.query.folderId || process.env.UPLOAD_FOLDER_ID;

        await catApp.filestore().folder(folderId).file(fileId).delete();
        
        res.json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
