const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Middleware to strip function prefix if present (Catalyst specific fix)
app.use((req, res, next) => {
    if (req.url.startsWith('/server/workflow_function')) {
        req.url = req.url.replace('/server/workflow_function', '');
    }
    next();
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error (Workflow):", err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error', details: err.message });
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Workflow Routes
const workflowRoutes = require('./routes/workflow');
app.use('/', workflowRoutes);

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
