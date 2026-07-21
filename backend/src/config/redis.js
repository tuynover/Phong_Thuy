const Redis = require('ioredis');
const logger = require('../services/LoggerService');

let isConnected = false;

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisTls = process.env.REDIS_TLS === 'true' || (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://'));

const redisOptions = {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    family: 4,                  // Force IPv4 to prevent 3000ms IPv6 AAAA DNS lookup delay on AWS EC2
    connectTimeout: 2000,      // Fast fail (2s max connection timeout instead of 10s default)
    commandTimeout: 1500,      // Max command timeout
    enableOfflineQueue: false, // Fail fast if offline so app can fallback to memory cache immediately
    lazyConnect: false,
    keepAlive: 5000,           // Heartbeat keep-alive to prevent AWS VPC NAT Gateway from killing idle socket after 350s
    retryStrategy(times) {
        const delay = Math.min(times * 500, 5000);
        return delay;
    },
    maxRetriesPerRequest: 1
};

if (redisTls) {
    redisOptions.tls = {
        rejectUnauthorized: false
    };
}

let redisClient;
if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, redisOptions);
} else {
    redisClient = new Redis(redisOptions);
}

redisClient.on('connect', () => {
    logger.info(`[Redis] TCP connected to Redis at ${redisHost}:${redisPort}`);
});

redisClient.on('ready', () => {
    isConnected = true;
    logger.info(`[Redis] Successfully ready at ${redisHost}:${redisPort}`);
});

redisClient.on('error', (err) => {
    isConnected = false;
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        logger.warn(`[Redis] Redis server unavailable at ${redisHost}:${redisPort}. Falling back to in-memory cache.`);
    } else {
        logger.error(`[Redis] Redis error: ${err.message}`);
    }
});

redisClient.on('close', () => {
    isConnected = false;
});

redisClient.on('reconnecting', () => {
    isConnected = false;
    logger.info('[Redis] Reconnecting to Redis...');
});

/**
 * Returns true ONLY when Redis client status is 'ready'.
 */
const isRedisConnected = () => {
    return isConnected && redisClient && redisClient.status === 'ready';
};

/**
 * Hard timeout wrapper to ensure Redis ops never block the Node.js event loop for more than `ms` milliseconds.
 * If Redis hangs or is slow on AWS, returns `fallbackValue` immediately.
 */
const withTimeout = (promise, ms = 500, fallbackValue = null) => {
    let timer = null;
    const timeoutPromise = new Promise(resolve => {
        timer = setTimeout(() => resolve(fallbackValue), ms);
    });
    return Promise.race([
        promise.then(res => {
            if (timer) clearTimeout(timer);
            return res;
        }).catch(err => {
            if (timer) clearTimeout(timer);
            return fallbackValue;
        }),
        timeoutPromise
    ]);
};

// --- Helper 1: User Profile Cache (Auth & Session Optimization) ---
const setUserProfileCache = async (userId, userObj, ttlSec = 86400) => {
    if (!isRedisConnected() || !userId || !userObj) return;
    try {
        const payload = JSON.stringify({
            id: userObj.id || userObj._id?.toString(),
            _id: userObj._id?.toString() || userObj.id,
            email: userObj.email,
            name: userObj.name,
            phone: userObj.phone || '',
            gender: userObj.gender,
            role: userObj.role,
            credits: userObj.credits,
            status: userObj.status,
            lockReason: userObj.lockReason || '',
            isDeleted: !!userObj.isDeleted,
            isEmailVerified: !!userObj.isEmailVerified,
            tokenVersion: userObj.tokenVersion || 0,
            baziInfo: userObj.baziInfo || null
        });
        await withTimeout(redisClient.setex(`user:profile:${userId}`, ttlSec, payload), 500, null);
    } catch (err) {
        logger.warn(`[Redis] Failed to cache user profile for [${userId}]: ${err.message}`);
    }
};

const getUserProfileCache = async (userId) => {
    if (!isRedisConnected() || !userId) return null;
    try {
        const raw = await withTimeout(redisClient.get(`user:profile:${userId}`), 500, null);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (err) {
        logger.warn(`[Redis] Failed to read user profile cache for [${userId}]: ${err.message}`);
        return null;
    }
};

const clearUserProfileCache = async (userId) => {
    if (!isRedisConnected() || !userId) return;
    try {
        await withTimeout(redisClient.del(`user:profile:${userId}`), 500, null);
    } catch (err) {
        logger.warn(`[Redis] Failed to delete user profile cache for [${userId}]: ${err.message}`);
    }
};

// --- Helper 2: Redis OTP Management (No OTP in MongoDB) ---
const setOtpRedis = async (otpKey, otpCode, ttlSec = 900) => {
    if (!isRedisConnected()) return false;
    try {
        const res = await withTimeout(redisClient.setex(`otp:${otpKey}`, ttlSec, otpCode), 500, null);
        return res !== null;
    } catch (err) {
        logger.warn(`[Redis] Failed to set OTP for key [${otpKey}]: ${err.message}`);
        return false;
    }
};

const getOtpRedis = async (otpKey) => {
    if (!isRedisConnected()) return null;
    try {
        return await withTimeout(redisClient.get(`otp:${otpKey}`), 500, null);
    } catch (err) {
        logger.warn(`[Redis] Failed to get OTP for key [${otpKey}]: ${err.message}`);
        return null;
    }
};

const deleteOtpRedis = async (otpKey) => {
    if (!isRedisConnected()) return;
    try {
        await withTimeout(redisClient.del(`otp:${otpKey}`), 500, null);
    } catch (err) {
        logger.warn(`[Redis] Failed to delete OTP for key [${otpKey}]: ${err.message}`);
    }
};

// --- Helper 3: Distributed Mutex Lock (Anti-Spam & Race Condition Protection) ---
const acquireRedisLock = async (lockKey, ttlMs = 3000) => {
    if (!isRedisConnected()) return true; // Fallback allow if Redis offline
    try {
        const result = await withTimeout(redisClient.set(`lock:${lockKey}`, '1', 'PX', ttlMs, 'NX'), 500, 'OK');
        return result === 'OK';
    } catch (err) {
        logger.warn(`[Redis] Failed to acquire lock [${lockKey}]: ${err.message}`);
        return true;
    }
};

const releaseRedisLock = async (lockKey) => {
    if (!isRedisConnected()) return;
    try {
        await withTimeout(redisClient.del(`lock:${lockKey}`), 500, null);
    } catch (err) {
        logger.warn(`[Redis] Failed to release lock [${lockKey}]: ${err.message}`);
    }
};

module.exports = {
    redisClient,
    isRedisConnected,
    withTimeout,
    setUserProfileCache,
    getUserProfileCache,
    clearUserProfileCache,
    setOtpRedis,
    getOtpRedis,
    deleteOtpRedis,
    acquireRedisLock,
    releaseRedisLock
};
