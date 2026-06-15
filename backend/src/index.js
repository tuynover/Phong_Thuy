require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const routes = require('./routes');

const auditLogger = require('./middleware/logging');

const app = express();

// Connect to Database
connectDB();

app.use(cors());
app.use(express.json());

// Premium Audit Logger Middleware (logs User, Time, Action, Parameters, and Performance)
app.use(auditLogger);

// Health check route - extremely lightweight to keep the server awake and monitor uptime
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

app.use('/api', routes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);

  // Start notifications scheduler
  const { startScheduler } = require('./services/NotificationScheduler');
  startScheduler();

  // Start self-pinging to keep server awake on Render or other hosting providers
  const https = require('https');
  const http = require('http');
  const url = process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL;
  if (url) {
    const healthUrl = `${url.replace(/\/$/, '')}/health`;
    console.log(`[Self-Ping] Initialized: Pinging ${healthUrl} every 3 minutes.`);
    setInterval(() => {
      const client = healthUrl.startsWith('https') ? https : http;
      client.get(healthUrl, (res) => {
        res.resume();
        if (res.statusCode !== 200) {
          console.warn(`[Self-Ping] Warning: Ping returned status ${res.statusCode}`);
        }
      }).on('error', (err) => {
        console.error(`[Self-Ping] Error: ${err.message}`);
      });
    }, 180000); // 3 minutes
  } else {
    console.log('[Self-Ping] Skipped: SERVER_URL or RENDER_EXTERNAL_URL env variable is not defined.');
  }
});
