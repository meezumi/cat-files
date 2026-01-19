const express = require('express');
const router = express.Router();
const catalyst = require('zcatalyst-sdk-node');

// PUT /requests/:id/status - Update Request Status
router.put('/requests/:id/status', async (req, res) => {
    const requestId = req.params.id;
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ status: 'error', message: 'Status is required' });

    try {
        const catApp = catalyst.initialize(req);
        
        // Use SDK to update Request Row
        const updateData = {
            ROWID: requestId,
            Status: status
        };

        const updatedRow = await catApp.datastore().table('Requests').updateRow(updateData);
        res.json({ status: 'success', data: updatedRow });

    } catch (err) {
        console.error("Update Request Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /items/:id/status - Update Item Status
router.put('/items/:id/status', async (req, res) => {
    const itemId = req.params.id;
    const { status, feedback } = req.body;

    try {
        const catApp = catalyst.initialize(req);
        
        const updateData = {
            ROWID: itemId,
            Status: status,
            Feedback: feedback || ""
        };

        const updatedRow = await catApp.datastore().table('Items').updateRow(updateData);
        res.json({ status: 'success', data: updatedRow });

    } catch (err) {
        console.error("Update Item Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /requests/:id/remind
router.post('/requests/:id/remind', async (req, res) => {
    // TODO: Implement Email logic via SDK
    res.json({ status: 'success', message: 'Reminder sent (Mock)' });
});

module.exports = router;
