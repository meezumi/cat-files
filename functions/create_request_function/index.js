const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// POST / - Create new request
app.post('/', (req, res) => {
    try {
        // In a real implementation we would save to Catalyst Data Store
        const newRequest = {
            id: `req_${Date.now()}`,
            ...req.body,
            date: new Date().toISOString(),
            // Ensure payload has sections, or wrap items in default section
            sections: req.body.sections || [
                {
                    id: `sec_${Date.now()}`,
                    title: 'General',
                    items: req.body.items || []
                }
            ],
            progress: '0 / ' + (req.body.items ? req.body.items.length : 0)
        };
        
        // Return success with the mock created object
        res.status(201).json({ status: 'success', data: newRequest });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
