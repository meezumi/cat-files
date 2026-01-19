const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Debug Logger
app.use((req, res, next) => {
    console.log(`[AUTH_FN_INLINED] Request: ${req.method} ${req.url}`);
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /me
app.get('/me', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        let userDetails = null;
        try {
            userDetails = await catApp.user().getCurrentUser();
        } catch (authErr) {
            console.log("No active session:", authErr.message);
        }
        res.status(200).json({ status: 'success', data: userDetails });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /invite
app.post('/invite', async (req, res) => {
     try {
        const catApp = catalyst.initialize(req);
        const { email, first_name, last_name } = req.body;
        // ... (Simplified for debug, just basic check)
        const projectId = process.env.APP_PROJECT_ID || '4000000006007';
        
        // Mock success or implement basic signup trigger if needed
        // For now, let's just log the attempt.
        console.log(`Invite attempt for ${email}`);
        
        res.status(200).json({ status: 'success', message: 'Invite logic stubbed' });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/logout', (req, res) => {
    const projectId = process.env.APP_PROJECT_ID;
    const appDomain = process.env.CATALYST_APP_DOMAIN || ''; 
    const logoutUrl = `${appDomain}/baas/logout?logout=true&PROJECT_ID=${projectId}`;
    res.redirect(logoutUrl);
});

// Catch-all
app.all('*', (req, res) => {
    console.log(`[AUTH_FN] 404 Hit: ${req.path}`);
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
