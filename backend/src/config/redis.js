const Redis = require('ioredis');
const logger = require('../services/LoggerService');

let isConnected = false;

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisTls = process.env.REDIS_TLS === 'true' || (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://'));

const isTestEnv = process.env.NODE_ENV === 'test';

const redisOptions = {
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    family: 4,                  // Force IPv4 to prevent 3000ms IPv6 AAAA DNS lookup delay on AWS EC2
    connectTimeout: 2000,      // Fast fail (2s max connection timeout instead of 10s default)
    commandTimeout: 1500,      // Max command timeout
    enableOfflineQueue: false, // Fail fast if offline so app can fallback to memory cache immediately
    lazyConnect: isTestEnv,
    keepAlive: 5000,           // Heartbeat keep-alive to prevent AWS VPC NAT Gateway from killing idle socket after 350s
    retryStrategy(times) {
        if (isTestEnv && times > 1) return null; // Stop infinite reconnect loops in test runner
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
        if (!isTestEnv) {
            logger.warn(`[Redis] Redis server unavailable at ${redisHost}:${redisPort}. Falling back to in-memory cache.`);
        }
    } else {
        if (!isTestEnv) {
            logger.error(`[Redis] Redis error: ${err.message}`);
        }
    }
});

redisClient.on('close', () => {
    isConnected = false;
});

redisClient.on('reconnecting', () => {
    isConnected = false;
    if (!isTestEnv) {
        logger.info('[Redis] Reconnecting to Redis...');
    }
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

// --- Local L1 RAM Cache for User Profiles (Sub-millisecond access) ---
const userProfileRamCache = new Map();
// --- Local L1 RAM Cache for OTP (Dual-Storage Fallback when Redis is offline) ---
const otpRamCache = new Map();

setInterval(() => {
    const now = Date.now();
    for (const [k, v] of userProfileRamCache.entries()) {
        if (now > v.expiresAt) userProfileRamCache.delete(k);
    }
    for (const [k, v] of otpRamCache.entries()) {
        if (now > v.expiresAt) otpRamCache.delete(k);
    }
}, 5 * 60 * 1000);

// --- Helper 1: User Profile Cache (Auth & Session Optimization - Hybrid L1 RAM + L2 Redis) ---
const setUserProfileCache = async (userId, userObj, ttlSec = 86400) => {
    if (!userId || !userObj) return;
    try {
        const profile = {
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
        };

        // 1. Write to L1 RAM Cache (0.001ms)
        userProfileRamCache.set(`user:profile:${userId}`, {
            value: profile,
            expiresAt: Date.now() + (ttlSec * 1000)
        });

        // 2. Write to L2 Redis Cache (async non-blocking)
        if (isRedisConnected()) {
            const payload = JSON.stringify(profile);
            withTimeout(redisClient.setex(`user:profile:${userId}`, ttlSec, payload), 500, null).catch(() => {});
        }
    } catch (err) {
        logger.warn(`[Redis] Failed to cache user profile for [${userId}]: ${err.message}`);
    }
};

const getUserProfileCache = async (userId) => {
    if (!userId) return null;
    const key = `user:profile:${userId}`;

    // 1. Try L1 RAM Cache first (0.001ms - Ultra fast)
    const ramItem = userProfileRamCache.get(key);
    if (ramItem && Date.now() < ramItem.expiresAt) {
        return ramItem.value;
    }

    // 2. Try L2 Redis Cache if L1 RAM missed
    if (isRedisConnected()) {
        try {
            const raw = await withTimeout(redisClient.get(key), 500, null);
            if (raw) {
                const parsed = JSON.parse(raw);
                // Populate L1 RAM for subsequent fast reads (5 minutes TTL in RAM)
                userProfileRamCache.set(key, { value: parsed, expiresAt: Date.now() + 300000 });
                return parsed;
            }
        } catch (err) {
            logger.warn(`[Redis] Failed to read user profile cache for [${userId}]: ${err.message}`);
        }
    }

    return null;
};

const clearUserProfileCache = async (userId) => {
    if (!userId) return;
    const key = `user:profile:${userId}`;
    userProfileRamCache.delete(key);
    if (isRedisConnected()) {
        try {
            withTimeout(redisClient.del(key), 500, null).catch(() => {});
        } catch (err) {
            logger.warn(`[Redis] Failed to delete user profile cache for [${userId}]: ${err.message}`);
        }
    }
};

// --- Helper 2: OTP Dual-Storage (Redis L2 + RAM L1 Fallback) ---
const setOtpRedis = async (otpKey, otpCode, ttlSec = 900) => {
    // Write to RAM L1 Cache (always active as fallback)
    otpRamCache.set(`otp:${otpKey}`, {
        code: String(otpCode),
        expiresAt: Date.now() + (ttlSec * 1000)
    });

    if (isRedisConnected()) {
        try {
            await withTimeout(redisClient.setex(`otp:${otpKey}`, ttlSec, otpCode), 500, null);
        } catch (err) {
            logger.warn(`[Redis] Failed to set OTP in Redis for key [${otpKey}]: ${err.message}`);
        }
    }
    return true;
};

const getOtpRedis = async (otpKey) => {
    const key = `otp:${otpKey}`;
    // 1. Check RAM L1 Cache
    const ramItem = otpRamCache.get(key);
    if (ramItem && Date.now() < ramItem.expiresAt) {
        return ramItem.code;
    }

    // 2. Fallback to Redis L2
    if (isRedisConnected()) {
        try {
            const redisVal = await withTimeout(redisClient.get(key), 500, null);
            if (redisVal) return redisVal;
        } catch (err) {
            logger.warn(`[Redis] Failed to get OTP from Redis for key [${otpKey}]: ${err.message}`);
        }
    }
    return null;
};

const deleteOtpRedis = async (otpKey) => {
    const key = `otp:${otpKey}`;
    otpRamCache.delete(key);
    if (isRedisConnected()) {
        try {
            await withTimeout(redisClient.del(key), 500, null);
        } catch (err) {
            logger.warn(`[Redis] Failed to delete OTP from Redis for key [${otpKey}]: ${err.message}`);
        }
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
