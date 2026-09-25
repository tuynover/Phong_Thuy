const fs = require('fs');
const Redis = require('ioredis');
const { v7: uuidv7 } = require('uuid');
const logger = require('../services/LoggerService');

let isConnected = false;
let isReconnecting = false;
let reconnectAttemptCount = 0;
let lastErrorLogTimestamp = 0;
let lastReconnectLogTimestamp = 0;
const LOG_SUPPRESSION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes quiet interval

/**
 * Detect if Node process is running inside a Docker/containerized environment.
 */
const isRunningInDocker = () => {
    try {
        if (process.env.IS_DOCKER === 'true' || process.env.DOCKER === 'true') return true;
        if (fs.existsSync('/.dockerenv') || fs.existsSync('/run/.containerenv')) return true;
        if (fs.existsSync('/proc/1/cgroup')) {
            const cgroup = fs.readFileSync('/proc/1/cgroup', 'utf8');
            if (cgroup.includes('docker') || cgroup.includes('containerd') || cgroup.includes('kubepods')) {
                return true;
            }
        }
        return false;
    } catch {
        return false;
    }
};

const inDocker = isRunningInDocker();

let redisHost = process.env.REDIS_HOST;
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisTls = process.env.REDIS_TLS === 'true' || (process.env.REDIS_URL && process.env.REDIS_URL.startsWith('rediss://'));

const isTestEnv = process.env.NODE_ENV === 'test';

// Smart host resolution:
if (!redisHost) {
    // If not specified, in Docker Compose or production default to 'redis', else '127.0.0.1'
    redisHost = (inDocker || process.env.NODE_ENV === 'production') ? 'redis' : '127.0.0.1';
} else if (inDocker && (redisHost === '127.0.0.1' || redisHost === 'localhost') && process.env.REDIS_FORCE_LOCALHOST !== 'true') {
    // Crucial: inside Docker container, 127.0.0.1 points to the container itself (where Redis isn't running),
    // which is the #1 mistake on production! Auto-redirect to docker compose service 'redis'.
    logger.warn(`[Redis Config] Đang chạy trong Docker nhưng REDIS_HOST=${redisHost} (loopback của container). Tự động chuyển hướng sang host 'redis' (service container). Nếu bạn cố ý nối ra host máy thật, hãy đặt REDIS_HOST=host.docker.internal.`);
    redisHost = 'redis';
}

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
        
        // Exponential backoff with jitter to eliminate CPU spin & socket congestion:
        // times = 1 -> ~1s
        // times = 2 -> ~2s
        // times = 3 -> ~4s
        // times = 4 -> ~8s
        // times = 5 -> ~16s
        // times >= 6 -> ~30s max
        const exponent = Math.min(times - 1, 5);
        const baseDelay = Math.min(Math.pow(2, exponent) * 1000, 30000);
        const jitter = Math.floor(Math.random() * (baseDelay * 0.15));
        return baseDelay + jitter;
    },
    maxRetriesPerRequest: 1
};

if (redisTls) {
    redisOptions.tls = {
        rejectUnauthorized: false
    };
}

let redisUrl = process.env.REDIS_URL;
if (redisUrl && inDocker && process.env.REDIS_FORCE_LOCALHOST !== 'true') {
    if (redisUrl.includes('://127.0.0.1') || redisUrl.includes('://localhost')) {
        logger.warn(`[Redis Config] Phát hiện REDIS_URL trỏ về localhost trong container Docker. Tự động chuyển hướng sang host 'redis'.`);
        redisUrl = redisUrl.replace('://127.0.0.1', '://redis').replace('://localhost', '://redis');
    }
}

let redisClient;
if (redisUrl) {
    redisClient = new Redis(redisUrl, redisOptions);
} else {
    redisClient = new Redis(redisOptions);
}

redisClient.on('connect', () => {
    logger.info(`[Redis] Đã thiết lập kết nối TCP tới Redis tại ${redisHost}:${redisPort}`);
});

redisClient.on('ready', () => {
    const wasReconnecting = isReconnecting || reconnectAttemptCount > 0;
    isConnected = true;
    isReconnecting = false;
    
    if (wasReconnecting) {
        logger.info(`[Redis] Đã kết nối lại thành công tới Redis tại ${redisHost}:${redisPort} (phục hồi sau ${reconnectAttemptCount} lần thử). Khôi phục bộ đệm L2 Redis.`);
    } else {
        logger.info(`[Redis] Kết nối Redis sẵn sàng hoạt động tại ${redisHost}:${redisPort}`);
    }
    
    reconnectAttemptCount = 0;
    lastErrorLogTimestamp = 0;
    lastReconnectLogTimestamp = 0;
});

redisClient.on('error', (err) => {
    const wasConnected = isConnected;
    isConnected = false;
    
    const isConnIssue = err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT';
    
    if (isConnIssue) {
        if (!isTestEnv) {
            const now = Date.now();
            // Ghi log WARN khi chuyển từ Connected -> Disconnected, hoặc chỉ ghi lặp lại sau mỗi 5 phút (chống tràn logs)
            if (wasConnected || (now - lastErrorLogTimestamp > LOG_SUPPRESSION_INTERVAL_MS)) {
                logger.warn(`[Redis] Không thể kết nối Redis tại ${redisHost}:${redisPort} (${err.code || err.message}). Hệ thống tự động chuyển sang dùng In-memory Cache (L1 RAM). Quá trình kết nối lại chạy ngầm chế độ êm dịu.`);
                lastErrorLogTimestamp = now;
            }
        }
    } else {
        if (!isTestEnv) {
            const now = Date.now();
            if (now - lastErrorLogTimestamp > LOG_SUPPRESSION_INTERVAL_MS) {
                logger.error(`[Redis] Lỗi Redis: ${err.message}`);
                lastErrorLogTimestamp = now;
            }
        }
    }
});

redisClient.on('close', () => {
    isConnected = false;
});

redisClient.on('reconnecting', (delay) => {
    isConnected = false;
    isReconnecting = true;
    reconnectAttemptCount++;
    
    if (!isTestEnv) {
        const now = Date.now();
        // Lần đầu tiên mất kết nối: Thông báo bắt đầu quy trình reconnect ngầm
        if (reconnectAttemptCount === 1) {
            logger.info(`[Redis] Mất kết nối tới Redis tại ${redisHost}:${redisPort}. Đang tiến hành kết nối lại ngầm (Exponential backoff, chế độ chống tràn log kích hoạt)...`);
            lastReconnectLogTimestamp = now;
        } else if (now - lastReconnectLogTimestamp > LOG_SUPPRESSION_INTERVAL_MS) {
            // Sau đó chỉ ghi log định kỳ mỗi 5 phút để thông báo trạng thái
            const nextDelaySec = Math.round((delay || 30000) / 1000);
            logger.info(`[Redis] Đang tiếp tục thử kết nối lại Redis tại ${redisHost}:${redisPort} (lần thứ #${reconnectAttemptCount}, thử lại sau ~${nextDelaySec}s). Bộ đệm RAM cục bộ vẫn hoạt động bình thường.`);
            lastReconnectLogTimestamp = now;
        }
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
// --- Local L1 RAM Cache for Distributed Mutex Lock ---
const lockRamCache = new Map();

const cacheCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of userProfileRamCache.entries()) {
        if (now > v.expiresAt) userProfileRamCache.delete(k);
    }
    for (const [k, v] of otpRamCache.entries()) {
        if (now > v.expiresAt) otpRamCache.delete(k);
    }
    for (const [k, v] of lockRamCache.entries()) {
        if (now > v.expiresAt) lockRamCache.delete(k);
    }
}, 5 * 60 * 1000);
if (cacheCleanupTimer.unref) cacheCleanupTimer.unref();

// --- Helper 1: User Profile Cache (Auth & Session Optimization - Hybrid L1 RAM + L2 Redis) ---
const setUserProfileCache = async (userId, userObj, ttlSec = 300) => {
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

        // 1. Write to L1 RAM Cache (0.001ms - 5 minutes TTL for single-server freshness)
        const ramTtl = Math.min(ttlSec, 300);
        userProfileRamCache.set(`user:profile:${userId}`, {
            value: profile,
            expiresAt: Date.now() + (ramTtl * 1000)
        });

        // 2. Write to L2 Redis Cache (fast timeout protected)
        if (isRedisConnected()) {
            const payload = JSON.stringify(profile);
            await withTimeout(redisClient.setex(`user:profile:${userId}`, ttlSec, payload), 500, null).catch(() => {});
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
            await withTimeout(redisClient.del(key), 500, null);
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
/**
 * Acquire distributed lock.
 * @param {string} lockKey - Identifier to lock
 * @param {number} ttlMs - Time to live in milliseconds (default: 3000ms)
 * @returns {Promise<string|null>} Returns lock token (string) if acquired successfully, or null if lock is held.
 */
const acquireRedisLock = async (lockKey, ttlMs = 3000) => {
    const now = Date.now();
    const existing = lockRamCache.get(lockKey);
    if (existing && existing.expiresAt > now) {
        return null; // Lock active in RAM
    }

    const token = uuidv7();
    lockRamCache.set(lockKey, { token, expiresAt: now + ttlMs });

    if (!isRedisConnected()) {
        return token; // Redis offline fallback -> acquired via L1 RAM
    }

    try {
        const result = await withTimeout(
            redisClient.set(`lock:${lockKey}`, token, 'PX', ttlMs, 'NX'),
            500,
            '__TIMEOUT__'
        );
        if (result === '__TIMEOUT__') {
            // Safe cleanup if timeout occurred to prevent ghost lock
            releaseRedisLock(lockKey, token).catch(() => {});
            lockRamCache.delete(lockKey);
            return null;
        }
        if (result !== 'OK') {
            lockRamCache.delete(lockKey);
            return null; // Lock already held in Redis
        }
        return token;
    } catch (err) {
        logger.warn(`[Redis] Failed to acquire lock [${lockKey}]: ${err.message}`);
        // If Redis failed, retain L1 RAM lock and return token
        return token;
    }
};

/**
 * Release distributed lock safely using token.
 * Prevents releasing another process's lock if TTL expired.
 * @param {string} lockKey - Identifier of the lock
 * @param {string} [token] - Token received from acquireRedisLock. If omitted, performs force release (backward compatible).
 */
const releaseRedisLock = async (lockKey, token = null) => {
    const cached = lockRamCache.get(lockKey);
    if (cached) {
        if (!token || cached.token === token) {
            lockRamCache.delete(lockKey);
        }
    }

    if (!isRedisConnected()) return;

    try {
        if (token) {
            // Atomic Lua script to only delete if token matches
            const luaScript = `
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
            `;
            await withTimeout(redisClient.eval(luaScript, 1, `lock:${lockKey}`, token), 500, null);
        } else {
            // Legacy / force delete
            await withTimeout(redisClient.del(`lock:${lockKey}`), 500, null);
        }
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
