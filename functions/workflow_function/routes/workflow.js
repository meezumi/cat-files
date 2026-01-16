const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

async function getAccessToken(catalystApp) {
    // Return token strategy (Connector or Env)
    return process.env.CATALYST_ADMIN_TOKEN || ''; 
}

// PUT /requests/:id/status - Update Request Status
router.put('/requests/:id/status', async (req, res) => {
    const requestId = req.params.id; // This is the ROWID
    const { status } = req.body;
    
    if (!status) return res.status(400).json({ status: 'error', message: 'Status is required' });

    // TODO: Verify user permission (e.g., only Owner/Admin)

    try {
        const projectId = process.env.CATALYST_PROJECT_ID;
        const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
        const accessToken = await getAccessToken(req); // Passing req as placeholder if we need catalyst app context later

        // REST API: PUT /baas/v1/project/{project_id}/table/{tableIdentifier}/row
        const url = `${apiDomain}/baas/v1/project/${projectId}/table/Requests/row`;
        
        const payload = [
            {
                "ROWID": requestId,
                "Status": status, // Assuming column name is 'Status'
                "ModifiedAt": new Date().toISOString() // Logic for timestamp
            }
        ];

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ status: 'success', data: data });
        } else {
            res.status(response.status).json({ status: 'error', message: 'Failed to update request status', details: data });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /items/:id/status - Update Item Status (Approved/Returned)
router.put('/items/:id/status', async (req, res) => {
    const itemId = req.params.id;
    const { status, feedback } = req.body;

    try {
        const projectId = process.env.CATALYST_PROJECT_ID;
        const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
        const accessToken = await getAccessToken(req);

        const url = `${apiDomain}/baas/v1/project/${projectId}/table/Items/row`;
        
        const payload = [
            {
                "ROWID": itemId,
                "Status": status,
                "Feedback": feedback || ""
            }
        ];

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            res.json({ status: 'success', data: data });
        } else {
            res.status(response.status).json({ status: 'error', message: 'Failed to update item status', details: data });
        }
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /requests/:id/remind - Send Reminder (Logic Placeholder)
router.post('/requests/:id/remind', async (req, res) => {
    res.json({ status: 'success', message: 'Reminder sent (Mock)' });
});

module.exports = router;
