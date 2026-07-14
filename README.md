# Torn Stats Tracker

A personal dashboard to track your Torn.com stats, daily activity, and Xanax intake.

## Features

✅ **Real-time Stats** - Displays your current level, experience, battle stats (strength, defense, speed, dexterity)  
✅ **Resource Bars** - Energy, nerve, happiness, and health tracking with visual progress bars  
✅ **Xanax Logger** - Log your daily Xanax intake with timestamps and notes  
✅ **Historical Data** - Track Xanax usage over the last 7 days  
✅ **Auto-refresh** - Updates every 5 minutes automatically  
✅ **Secure API** - Your Torn API key stays on the backend, never exposed to the frontend

## Setup

### Prerequisites

- Node.js 14+ installed
- Your Torn.com API key (get it from your Torn account settings)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/karilix/torn-stats-tracker.git
   cd torn-stats-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Open `.env` and add your Torn API key:
   ```
   TORN_API_KEY=your_16_character_api_key_here
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   Or with auto-reload (requires nodemon):
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## Usage

### Viewing Stats
- Click **"🔄 Refresh Now"** to fetch your latest stats from Torn
- Stats auto-update every 5 minutes
- View your current bars, battle stats, and player info

### Logging Xanax
1. Enter the **amount** (e.g., 1, 2, 0.5)
2. Optionally add **notes** (e.g., "morning dose")
3. Click **"Log Xanax"**
4. Your entry appears immediately in the daily log
5. Historical data shows the last 7 days

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/current` | Fetch current stats from Torn (stored in DB) |
| GET | `/api/stats/history` | Get stored stats history |
| POST | `/api/xanax/log` | Log Xanax intake |
| GET | `/api/xanax/today` | Get today's Xanax entries |
| GET | `/api/xanax/history?days=7` | Get Xanax history (7 days default) |
| GET | `/api/activity/today` | Get last action timestamp |

## Database

Uses **SQLite** for simplicity. Data is stored in `stats.db` (auto-created).

Two tables:
- **stats** - Historical stats snapshots from Torn API
- **xanax_log** - Xanax intake logs with timestamps and notes

## Security

⚠️ **IMPORTANT:**
- Your Torn API key is stored securely in `.env` (never commit this file)
- Never share your API key with anyone
- The backend handles all API calls; your frontend never touches the key
- `.env` is in `.gitignore` so it won't be pushed to GitHub

## File Structure

```
torn-stats-tracker/
├── server.js           # Express backend
├── db.js               # SQLite database manager
├── public/
│   └── index.html      # Dashboard frontend
├── package.json        # Dependencies
├── .env.example        # Environment template
├── .gitignore          # Protects secrets
└── README.md           # This file
```

## Troubleshooting

### "TORN_API_KEY not set"
- Make sure you created `.env` file
- Copy from `.env.example` and add your actual API key

### "Cannot find module 'express'"
```bash
npm install
```

### Port already in use
Change the PORT in `.env`:
```
PORT=3001
```

### Stats not loading
- Check that your Torn API key is correct (16 characters)
- Verify your Torn account is accessible
- Check browser console for error messages

## Future Enhancements

- Charts/graphs for activity trends
- Export data as CSV
- Multiple user support
- Dark mode toggle
- Mobile app version

## License

ISC
