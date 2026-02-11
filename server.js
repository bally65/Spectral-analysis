const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HISTORY_FILE = path.join(__dirname, 'data', 'history.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialize history file if it doesn't exist
if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify([]));
}

// API: Get all history
app.get('/api/history', (req, res) => {
    const data = JSON.parse(fs.readFileSync(HISTORY_FILE));
    res.json(data);
});

// API: Save a new analysis result
app.post('/api/save', (req, res) => {
    const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        model: req.body.model, // {m, b, r2}
        sampleCount: req.body.sampleCount
    };
    
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE));
    history.unshift(newEntry); // Add to beginning
    
    // Keep last 50 entries
    const limitedHistory = history.slice(0, 50);
    
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(limitedHistory, null, 2));
    res.json({ success: true, entry: newEntry });
});

app.listen(PORT, () => {
    console.log(`🚀 Spectral Analysis Server running at http://localhost:${PORT}`);
});
