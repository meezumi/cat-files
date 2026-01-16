const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("Global Error:", err);
    res.status(500).json({ status: 'error', message: 'Internal Server Error', details: err.message });
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/', authRoutes);

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
