const express = require('express');
const router = express.Router();
const catalyst = require('zcatalyst-sdk-node');
const fetch = require('node-fetch');

// Helper to get Access Token (simulated or real)
// In a real scenario, we might use the Connector or a refresh token flow.
// For now, we'll try to use the SDK's internal token if available, or assume a process.env token for "invite" operations which are admin-only.
async function getAccessToken(catalystApp) {
    // Strategy: Try to get it from the connection if available
    // const connector = catalystApp.connection({ connectorName: 'catalyst' });
    // return connector.getAccessToken();
    
    // FALLBACK: In local Dev or specific setups, we might just need to pass the user's token or use the execution context.
    // For Invite (Project Level), we need an Admin Token. 
    // This is a placeholder for the robust token retrieval logic.
    return process.env.CATALYST_ADMIN_TOKEN || ''; 
}

// GET /me - Get Current User Details
router.get('/me', async (req, res) => {
    try {
        const app = catalyst.initialize(req);
        // Use Native SDK as per plan
        const userConfig = app.user();
        const userDetails = await userConfig.getCurrentUser();
        
        // Enhance with Org ID if available in session/cookie or just return what we have
        res.status(200).json({
            status: 'success',
            data: userDetails
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /capabilities - List Permissions (Mock for now, or derive from Role)
router.get('/capabilities', async (req, res) => {
     try {
        const app = catalyst.initialize(req);
        const userConfig = app.user();
        const userDetails = await userConfig.getCurrentUser();
        
        // Simple role-based capability logic
        const role = userDetails.role_details ? userDetails.role_details.role_name : 'Guest';
        
        const capabilities = [];
        if (role === 'App Admin' || role === 'Super Admin') {
            capabilities.push('invite_users', 'manage_org', 'view_all_requests');
        } else {
            capabilities.push('view_assigned_requests');
        }

        res.status(200).json({
            status: 'success',
            data: capabilities
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /invite - Invite New User (REST API)
router.post('/invite', async (req, res) => {
    const { email, first_name, last_name } = req.body;
    
    if (!email) {
        return res.status(400).json({ status: 'error', message: 'Email is required' });
    }

    try {
        const app = catalyst.initialize(req);
        // We need the project ID. 
        // In Catalyst Functions, it's often in process.env or accessible via SDK?
        // Let's rely on a reliable Env Variable if possible, or extract from context.
        const projectId = process.env.CATALYST_PROJECT_ID || '4000000006007'; // Fallback/Placeholder
        const apiDomain = process.env.CATALYST_API_DOMAIN || 'https://api.catalyst.zoho.com';
        
        // Note: Signing up a user requires an OAuth Token with 'ZohoCatalyst.projects.users.CREATE' scope.
        // The simple execution token of the function MIGHT NOT have this scope if triggered by a regular user.
        // It relies on the Function's identity or a configured Connector.
        const accessToken = await getAccessToken(app);

        const url = `${apiDomain}/baas/v1/project/${projectId}/project-user/signup`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email_id: email,
                first_name: first_name || '',
                last_name: last_name || '',
                role_id: 'App User' // Default or lookup
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            res.status(200).json({ status: 'success', data: data });
        } else {
            res.status(response.status).json({ status: 'error', message: 'Failed to invite user', details: data });
        }

    } catch (err) {
        console.error("Invite Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /logout
router.get('/logout', (req, res) => {
    // Redirect logic handled by Client usually, but if hit directly:
    const projectId = process.env.CATALYST_PROJECT_ID;
    const appDomain = process.env.CATALYST_APP_DOMAIN || ''; // Needs to be set
    const logoutUrl = `${appDomain}/baas/logout?logout=true&PROJECT_ID=${projectId}`;
    
    res.redirect(logoutUrl);
});

module.exports = router;
