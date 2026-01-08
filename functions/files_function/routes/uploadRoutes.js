const express = require('express');
const router = express.Router();

// POST /api/upload
router.post('/', (req, res) => {
    // In a real app, we would use 'busboy' or 'multer' to handle multipart/form-data
    // and stream to Catalyst File Store.
    // For this mock, we just return a success response with a fake file URL.
    
    // Simulate processing delay
    setTimeout(() => {
        res.status(200).json({
            status: 'success',
            data: {
                id: `file_${Date.now()}`,
                filename: 'uploaded_document.pdf',
                url: 'https://via.placeholder.com/150', // Mock URL
                size: 1024 * 50 // 50KB
            }
        });
    }, 500);
});

module.exports = router;
