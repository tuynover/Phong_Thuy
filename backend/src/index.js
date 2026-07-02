require('dotenv').config();
const logger = require('./services/LoggerService');

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
});

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const connectDB = require('./config/db');
const routes = require('./routes');

const auditLogger = require('./middleware/logging');

const app = express();

// Connect to Database
connectDB();

app.use(cors());

// Configure Gzip/Brotli compression with SSE bypass to prevent buffering
app.use(compression({
  filter: (req, res) => {
    if (req.headers['accept'] === 'text/event-stream' || res.getHeader('Content-Type') === 'text/event-stream') {
      return false;
    }
    return compression.filter(req, res);
  }
}));

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
  logger.info(`Backend is running on port ${PORT}`);

  // Start notifications scheduler
  const { startScheduler } = require('./services/NotificationScheduler');
  startScheduler();

  // Start self-pinging to keep server awake on Render or other hosting providers
  const https = require('https');
  const http = require('http');
  const url = process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL;
  if (url) {
    const healthUrl = `${url.replace(/\/$/, '')}/health`;
    logger.info(`[Self-Ping] Initialized: Pinging ${healthUrl} every 3 minutes.`);
    setInterval(() => {
      const client = healthUrl.startsWith('https') ? https : http;
      client.get(healthUrl, (res) => {
        res.resume();
        if (res.statusCode !== 200) {
          logger.warn(`[Self-Ping] Warning: Ping returned status ${res.statusCode}`);
        }
      }).on('error', (err) => {
        logger.error(`[Self-Ping] Error: ${err.message}`, err);
      });
    }, 180000); // 3 minutes
  } else {
    logger.info('[Self-Ping] Skipped: SERVER_URL or RENDER_EXTERNAL_URL env variable is not defined.');
  }
});
