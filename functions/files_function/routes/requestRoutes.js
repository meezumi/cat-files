const express = require('express');
const router = express.Router();

// Mock Data
let requests = [
    {
        id: 'req_001',
        recipient: { name: 'Aaryan', email: 'aaryan@example.com' },
        subject: 'Test',
        status: 'Draft',
        progress: '2 / 2',
        date: '2025-10-30T10:00:00Z',
        items: [
             { id: 'item_1', title: 'Photo', status: 'Approved' },
             { id: 'item_2', title: 'Driving License', status: 'Approved' }
        ]
    },
    {
        id: 'req_002',
        recipient: { name: 'Jane Doe', email: 'jane@example.com' },
        subject: 'Secure Document Upload',
        status: 'Sent',
        progress: '0 / 1',
        date: '2025-10-30T11:00:00Z',
        items: [
             { id: 'item_3', title: 'Passport', status: 'Pending' }
        ]
    }
];

// GET /api/requests
router.get('/', (req, res) => {
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

// POST /api/requests
router.post('/', (req, res) => {
    try {
        const newRequest = {
            id: `req_${Date.now()}`,
            ...req.body,
            date: new Date().toISOString(),
            progress: '0 / ' + (req.body.items ? req.body.items.length : 0)
        };
        requests.unshift(newRequest);
        res.status(201).json({ status: 'success', data: newRequest });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

module.exports = router;
