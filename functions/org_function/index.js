const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error (Org):", err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error', details: err.message });
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Org Routes
const orgRoutes = require('./routes/org');
app.use('/', orgRoutes);

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
