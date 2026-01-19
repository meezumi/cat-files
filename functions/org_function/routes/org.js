const express = require('express');
const router = express.Router();
const catalyst = require('zcatalyst-sdk-node');
const fetch = require('node-fetch');

// Helper to get Access Token (Placeholder)
async function getAccessToken(catalystApp) {
    return process.env.APP_ADMIN_TOKEN || ''; 
}

// GET / - List User's Organizations (Using SDK)
router.get('/', async (req, res) => {
    try {
        const app = catalyst.initialize(req);
        // SDK doesn't always expose "List My Orgs" easily if it's not a multi-org environment in the standard way.
        // But we can get current org details.
        // For this project, we might assume single org or rely on manual DB if we were building a SaaS.
        // Let's return the current Project/Org details from the execution context.
        
        const projectDetails = app.getProjectDetails(); // Sync method in some SDK versions, or just config.
        // Actually, let's just return what we know about the current environment + default "My Org"
        
        res.json({
            status: 'success',
            data: [
                {
                    id: process.env.APP_PROJECT_ID || 'default_project',
                    name: 'My Organization',
                    role: 'Admin' // derived
                }
            ]
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /:id/members - List Members (REST API)
router.get('/:id/members', async (req, res) => {
    const projectId = req.params.id; // Or use process.env.APP_PROJECT_ID if ID is internal
    
    try {
        const app = catalyst.initialize(req);
        // Confirm user has permission (optional logic here)

        const apiDomain = process.env.APP_API_DOMAIN || 'https://api.catalyst.zoho.com';
        const accessToken = await getAccessToken(app);
        
        // Pagination params
        const start = req.query.start || 1;
        const end = req.query.end || 20;

        // REST API: GET /baas/v1/project/{project_id}/project-user
        const url = `${apiDomain}/baas/v1/project/${projectId}/project-user?start=${start}&end=${end}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            res.status(200).json({ status: 'success', data: data });
        } else {
            res.status(response.status).json({ status: 'error', message: 'Failed to fetch members', details: data });
        }

    } catch (err) {
        console.error("Fetch Members Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /:id/subscription - Placeholder
router.get('/:id/subscription', (req, res) => {
    // Mock response for now
    res.json({
        status: 'success',
        data: {
            plan: 'Pro',
            status: 'Active',
            next_billing: '2026-02-01'
        }
    });
});

module.exports = router;
