const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// POST / - Handle Upload
app.post('/', (req, res) => {
    try {
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
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
