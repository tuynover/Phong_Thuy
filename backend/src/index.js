require('dotenv').config();
require('./config/env');
const logger = require('./services/LoggerService');

let server = null;

const gracefulShutdown = (signal, err) => {
  logger.error(`[Graceful Shutdown] Kích hoạt bởi tín hiệu ${signal}`, err || '');

  const cleanupAndExit = async () => {
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        logger.info('[Graceful Shutdown] Đã đóng kết nối MongoDB.');
      }
    } catch (dbErr) {
      logger.error('[Graceful Shutdown] Lỗi khi đóng kết nối MongoDB:', dbErr);
    } finally {
      process.exit(1);
    }
  };

  if (server) {
    server.close(() => {
      logger.info('[Graceful Shutdown] HTTP Server đã ngắt nhận request mới.');
      cleanupAndExit();
    });

    // Ép ngắt cứng sau 10 giây nếu server.close() bị treo connection
    setTimeout(() => {
      logger.error('[Graceful Shutdown] Ép ngắt server sau 10 giây timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    cleanupAndExit();
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'Lý do:', reason);
  gracefulShutdown('unhandledRejection', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  gracefulShutdown('uncaughtException', error);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received');
  gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received');
  gracefulShutdown('SIGINT');
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/db');
const routes = require('./routes');
const seoRouter = require('./routes/seo');

const auditLogger = require('./middleware/logging');

const app = express();

// Security HTTP Headers Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false
}));

// Connect to Database
connectDB();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:3000', 'https://tuynover.ddns.net', 'https://tuynover.giize.com', 'https://tuynover.duckdns.org'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*') || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS Policy: Access from this origin is denied.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

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

// Lightweight Health Check Route for AWS ALB / Nginx / Monitoring
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Swagger UI Documentation Route
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/', seoRouter);
app.use('/api', routes);

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error(`[Global Error Handler] ${err.message || 'Lỗi hệ thống nội bộ'}`, err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'Đã xảy ra lỗi hệ thống nội bộ. Vui lòng thử lại sau.'
  });
});

const PORT = process.env.PORT || 3001;
server = app.listen(PORT, () => {
  logger.info(`Backend is running on port ${PORT}`);

  // Start notifications scheduler
  const { startScheduler } = require('./services/NotificationScheduler');
  startScheduler();
});
