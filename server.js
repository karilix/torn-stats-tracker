require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const Database = require('./db');

const app = express();
const db = new Database();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const TORN_API_KEY = process.env.TORN_API_KEY;
const TORN_API_BASE = 'https://api.torn.com';

if (!TORN_API_KEY) {
  console.error('ERROR: TORN_API_KEY not set in .env file');
  process.exit(1);
}

// Initialize database
db.init();

// Fetch latest stats from Torn API
async function fetchTornStats() {
  try {
    const response = await axios.get(`${TORN_API_BASE}/user/?selections=basic,stat,bars&key=${TORN_API_KEY}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching Torn stats:', error.message);
    throw error;
  }
}

// API endpoint: Get current stats (fresh from Torn)
app.get('/api/stats/current', async (req, res) => {
  try {
    const stats = await fetchTornStats();
    
    // Store in database
    db.saveStats(stats);
    
    // Log activity based on last_action
    const lastAction = stats.last_action?.relative || null;
    if (stats.last_action) {
      await db.logActivity(stats.last_action.timestamp);
    }
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// API endpoint: Get historical stats
app.get('/api/stats/history', (req, res) => {
  try {
    const limit = req.query.limit || 30;
    const history = db.getStatsHistory(limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// API endpoint: Log Xanax intake
app.post('/api/xanax/log', (req, res) => {
  try {
    const { amount, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }
    
    db.logXanax(amount, notes || '');
    res.json({ success: true, message: 'Xanax logged' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log Xanax' });
  }
});

// API endpoint: Get Xanax history for today
app.get('/api/xanax/today', (req, res) => {
  try {
    const today = db.getXanaxToday();
    res.json(today);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Xanax data' });
  }
});

// API endpoint: Get Xanax history (last N days)
app.get('/api/xanax/history', (req, res) => {
  try {
    const days = req.query.days || 7;
    const history = db.getXanaxHistory(days);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Xanax history' });
  }
});

// API endpoint: Get activity time for today (in minutes)
app.get('/api/activity/today', async (req, res) => {
  try {
    const activity = await db.getActivityToday();
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
});

// API endpoint: Get activity history (last N days)
app.get('/api/activity/history', async (req, res) => {
  try {
    const days = req.query.days || 7;
    const history = await db.getActivityHistory(days);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activity history' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Torn Stats Tracker running on http://localhost:${PORT}`);
});
