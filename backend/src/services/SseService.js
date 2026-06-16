const logger = require('./LoggerService');

class SseService {
  constructor() {
    this.adminClients = new Set();
    this.userClients = new Map(); // userId -> Set of response objects
  }

  addAdminClient(req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    this.adminClients.add(res);
    logger.info(`[SSE] Admin client connected. Total admin clients: ${this.adminClients.size}`);

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE Admin connection established' })}\n\n`);

    // Ping every 30 seconds to keep connection alive
    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
      this.adminClients.delete(res);
      logger.info(`[SSE] Admin client disconnected. Remaining: ${this.adminClients.size}`);
    });
  }

  addUserClient(userId, req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    if (!this.userClients.has(userId)) {
      this.userClients.set(userId, new Set());
    }
    this.userClients.get(userId).add(res);
    logger.info(`[SSE] User client [${userId}] connected. Total sessions: ${this.userClients.get(userId).size}`);

    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE User connection established' })}\n\n`);

    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 30000);

    req.on('close', () => {
      clearInterval(keepAlive);
      const userSessions = this.userClients.get(userId);
      if (userSessions) {
        userSessions.delete(res);
        if (userSessions.size === 0) {
          this.userClients.delete(userId);
        }
      }
      logger.info(`[SSE] User client [${userId}] disconnected.`);
    });
  }

  sendToAdmins(event, data) {
    const payload = JSON.stringify({ type: event, data });
    logger.info(`[SSE] Broadcasting event [${event}] to all admins`);
    for (const client of this.adminClients) {
      client.write(`data: ${payload}\n\n`);
    }
  }

  sendToUser(userId, event, data) {
    const userSessions = this.userClients.get(userId);
    if (!userSessions || userSessions.size === 0) {
      logger.info(`[SSE] No active sessions for user [${userId}] to send event [${event}]`);
      return;
    }
    const payload = JSON.stringify({ type: event, data });
    logger.info(`[SSE] Sending event [${event}] to user [${userId}]`);
    for (const client of userSessions) {
      client.write(`data: ${payload}\n\n`);
    }
  }
}

module.exports = new SseService();
