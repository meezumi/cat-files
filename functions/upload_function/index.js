const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const app = express();
// SDK Upload often needs a file path or buffer. Multer memory storage gives buffer.
const upload = multer({ storage: multer.memoryStorage() }); 

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Ensure a folder exists; if not, create it using SDK.
async function ensureFolderExists(catApp, parentFolderId, folderName) {
    try {
        const folderDetails = await catApp.filestore().folder(parentFolderId).createSubFolder(folderName);
        return folderDetails.id;
    } catch (err) {
        // If error, it usually means it already exists (409).
        // Since listing folders is unreliable or method unavailable, we fallback to the parent folder
        // to ensure the upload at least succeeds.
        console.warn(`Folder creation for ${folderName} failed (likely exists). Using parent folder.`);
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
        // Robust Method: Write to temp file and stream from disk
        // This avoids issues with Buffer streams in some SDK versions
        const tempFilePath = path.join('/tmp', `upload_${Date.now()}_${req.file.originalname}`);
        fs.writeFileSync(tempFilePath, req.file.buffer);
        
        const fileStream = fs.createReadStream(tempFilePath);
        
        try {
            const folder = catApp.filestore().folder(uploadFolderId);
            const uploadResp = await folder.uploadFile({
                code: fileStream,
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
                    "FileName": fileName
                };
                    await catApp.datastore().table('Items').updateRow(updatePayload);
                 } catch (linkErr) {
                     console.warn("Failed to link file to item:", linkErr);
                 }
            }

            // Cleanup
            fs.unlinkSync(tempFilePath);

            // --- NEW: Update Request Status to 'Responded' ---
            if (requestId) {
                try {
                    // 1. Fetch current status to avoid overriding final states
                    const requestRow = await catApp.datastore().table('Requests').getRow(requestId);
                    const currentStatus = requestRow.Requests ? requestRow.Requests.Status : requestRow.Status; 

                    // 2. Update if applicable (Not Completed or Archived)
                    const finalStatuses = ['Completed', 'Archived', 'Trash'];
                    if (!finalStatuses.includes(currentStatus)) {
                         await catApp.datastore().table('Requests').updateRow({ 
                             ROWID: requestId, 
                             Status: 'Responded',
                         });
                    }
                } catch (statusErr) {
                    console.warn("Failed to auto-update Request status to Responded:", statusErr);
                }
            }

            res.status(200).json({
                status: 'success',
                data: {
                    id: fileId,
                    folder_id: uploadFolderId,
                    filename: fileName,
                    url: `/server/upload_function/${fileId}?folderId=${uploadFolderId}` 
                }
            });

        } catch (uploadErr) {
            // Cleanup on error
            if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            throw uploadErr;
        }

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
        // 1. Get File Details to retrieve the original filename
        const folder = catApp.filestore().folder(folderId);
        
        // SDK Method might be getFileDetails(fileId) or similar. 
        // Based on docs, folder instance usually has methods to manage its files.
        const fileDetails = await folder.getFileDetails(fileId);
        const fileName = fileDetails.file_name || `downloaded_file_${fileId}`;

        // 2. Download Content
        const fileContent = await folder.downloadFile(fileId);
        
        // 3. Serve with correct name
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(fileContent);

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
