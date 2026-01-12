const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// Mock Data (Shared for now, ideally in Catalyst Data Store)
const requests = [
    {
        id: 'req_001',
        recipient: { name: 'Aaryan', email: 'aaryan@example.com' },
        subject: 'Test',
        status: 'Draft',
        progress: '2 / 2',
        date: '2025-10-30T10:00:00Z',
        sections: [
            {
                id: 'sec_1',
                title: 'Personal Identification',
                items: [
                    { id: 'item_1', title: 'Photo', status: 'Approved' },
                    { id: 'item_2', title: 'Driving License', status: 'Approved' }
                ]
            }
        ]
    },
    {
        id: 'req_002',
        recipient: { name: 'Jane Doe', email: 'jane@example.com' },
        subject: 'Secure Document Upload',
        status: 'Sent',
        progress: '0 / 1',
        date: '2025-10-30T11:00:00Z',
        sections: [
            {
                id: 'sec_2',
                title: 'General Documents',
                items: [
                     { id: 'item_3', title: 'Passport', status: 'Pending' }
                ]
            }
        ]
    }
];

// GET / - List all requests
app.get('/', (req, res) => {
    try {
        const { status } = req.query;
        let filtered = requests;
        if (status) {
            filtered = requests.filter(r => r.status.toLowerCase() === status.toLowerCase());
        }
        res.status(200).json({ status: 'success', data: filtered });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /:id - Get single request
app.get('/:id', (req, res) => {
    try {
        const request = requests.find(r => r.id === req.params.id);
        if (!request) {
            return res.status(404).json({ status: 'error', message: 'Request not found' });
        }
        res.status(200).json({ status: 'success', data: request });
    } catch (err) {
         res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
