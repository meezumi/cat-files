const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// GET /me - Get current authenticated user
app.get('/me', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        let userDetails = null;
        
        try {
            userDetails = await catApp.userManagement().getCurrentUser();
            console.log('User authenticated:', userDetails.email_id);
        } catch (authErr) {
            console.log('No active session:', authErr.message);
            return res.status(200).json({ status: 'success', data: null });
        }
        
        res.status(200).json({ status: 'success', data: userDetails });
    } catch (err) {
        console.error('Error in /me:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /invite - Invite a new user
app.post('/invite', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const { email, first_name, last_name } = req.body;
        
        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Email is required' });
        }
        
        console.log(`Invite request for: ${email}`);
        
        // TODO: Implement actual user invitation logic via Catalyst SDK
        res.status(200).json({ 
            status: 'success', 
            message: 'User invitation sent',
            data: { email, first_name, last_name }
        });
    } catch (err) {
        console.error('Error in /invite:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /logout - Redirect to Catalyst logout
app.get('/logout', (req, res) => {
    try {
        // Redirect to Catalyst native logout
        res.redirect('/__catalyst/auth/logout');
    } catch (err) {
        console.error('Error in /logout:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all for undefined routes
app.all('*', (req, res) => {
    res.status(404).json({ 
        status: 'error', 
        message: `Route ${req.method} ${req.path} not found in user_auth` 
    });
});

module.exports = app;
