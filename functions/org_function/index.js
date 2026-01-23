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
// --- Organisations CRUD ---

// GET / - List all organisations
app.get('/', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const query = "SELECT * FROM Organisations";
        const result = await catApp.zcql().executeZCQLQuery(query);
        const orgs = result.map(row => row.Organisations);
        res.json({ status: 'success', data: orgs });
    } catch (err) {
        console.error("List Orgs Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET /:id - Get single organisation
app.get('/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const query = `SELECT * FROM Organisations WHERE ROWID = '${req.params.id}'`;
        const result = await catApp.zcql().executeZCQLQuery(query);
        if (result.length === 0) return res.status(404).json({ status: 'error', message: 'Organisation not found' });
        res.json({ status: 'success', data: result[0].Organisations });
    } catch (err) {
        console.error("Get Org Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST / - Create organisation
app.post('/', async (req, res) => {
    try {
        const { Name, Domain, Website, Address, Phone, LogoURL } = req.body;
        if (!Name) return res.status(400).json({ status: 'error', message: 'Name is required' });

        const catApp = catalyst.initialize(req);
        const rowData = { Name, Domain, Website, Address, Phone, LogoURL };
        const result = await catApp.datastore().table('Organisations').insertRow(rowData);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error("Create Org Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /:id - Update organisation
app.put('/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const updateData = { ROWID: req.params.id, ...req.body };
        const result = await catApp.datastore().table('Organisations').updateRow(updateData);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error("Update Org Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /:id - Delete organisation
app.delete('/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        await catApp.datastore().table('Organisations').deleteRow(req.params.id);
        res.json({ status: 'success', message: 'Organisation deleted' });
    } catch (err) {
        console.error("Delete Org Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- Contacts CRUD ---

// GET /:id/contacts - List contacts for an organisation
app.get('/:id/contacts', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        // Note: ZCQL uses single quotes for string values
        const query = `SELECT * FROM Contacts WHERE OrganisationID = '${req.params.id}'`;
        const result = await catApp.zcql().executeZCQLQuery(query);
        const contacts = result.map(row => row.Contacts);
        res.json({ status: 'success', data: contacts });
    } catch (err) {
        console.error("List Contacts Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST /:id/contacts - Create contact for an organisation
app.post('/:id/contacts', async (req, res) => {
    try {
        const { Name, Email, Role, Phone } = req.body;
        if (!Name || !Email) return res.status(400).json({ status: 'error', message: 'Name and Email are required' });

        const catApp = catalyst.initialize(req);
        const rowData = { 
            OrganisationID: req.params.id,
            Name, 
            Email, 
            Role, 
            Phone 
        };
        const result = await catApp.datastore().table('Contacts').insertRow(rowData);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error("Create Contact Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// PUT /contacts/:id - Update contact
app.put('/contacts/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        const updateData = { ROWID: req.params.id, ...req.body };
        const result = await catApp.datastore().table('Contacts').updateRow(updateData);
        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error("Update Contact Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// DELETE /contacts/:id - Delete contact
app.delete('/contacts/:id', async (req, res) => {
    try {
        const catApp = catalyst.initialize(req);
        await catApp.datastore().table('Contacts').deleteRow(req.params.id);
        res.json({ status: 'success', message: 'Contact deleted' });
    } catch (err) {
        console.error("Delete Contact Error:", err);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Catch-all
app.all('*', (req, res) => {
    res.status(404).json({ status: 'error', message: `Route ${req.method} ${req.path} not found` });
});

module.exports = app;
