const Redis = require('ioredis');
const logger = require('../services/LoggerService');

let isConnected = false;

const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    enableOfflineQueue: false, // Fail fast if offline so app can fallback to memory cache immediately
    lazyConnect: false,
    retryStrategy(times) {
        const delay = Math.min(times * 1000, 30000);
        return delay;
    },
    maxRetriesPerRequest: 1
});

redisClient.on('connect', () => {
    isConnected = true;
    logger.info(`[Redis] Successfully connected to Redis at ${redisHost}:${redisPort}`);
});

redisClient.on('ready', () => {
    isConnected = true;
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
    logger.info('[Redis] Reconnecting to Redis...');
});

const isRedisConnected = () => isConnected;

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
        await redisClient.setex(`user:profile:${userId}`, ttlSec, payload);
    } catch (err) {
        logger.warn(`[Redis] Failed to cache user profile for [${userId}]: ${err.message}`);
    }
};

const getUserProfileCache = async (userId) => {
    if (!isRedisConnected() || !userId) return null;
    try {
        const raw = await redisClient.get(`user:profile:${userId}`);
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
        await redisClient.del(`user:profile:${userId}`);
    } catch (err) {
        logger.warn(`[Redis] Failed to delete user profile cache for [${userId}]: ${err.message}`);
    }
};

// --- Helper 2: Redis OTP Management (No OTP in MongoDB) ---
const setOtpRedis = async (otpKey, otpCode, ttlSec = 900) => {
    if (!isRedisConnected()) return false;
    try {
        await redisClient.setex(`otp:${otpKey}`, ttlSec, otpCode);
        return true;
    } catch (err) {
        logger.warn(`[Redis] Failed to set OTP for key [${otpKey}]: ${err.message}`);
        return false;
    }
};

const getOtpRedis = async (otpKey) => {
    if (!isRedisConnected()) return null;
    try {
        return await redisClient.get(`otp:${otpKey}`);
    } catch (err) {
        logger.warn(`[Redis] Failed to get OTP for key [${otpKey}]: ${err.message}`);
        return null;
    }
};

const deleteOtpRedis = async (otpKey) => {
    if (!isRedisConnected()) return;
    try {
        await redisClient.del(`otp:${otpKey}`);
    } catch (err) {
        logger.warn(`[Redis] Failed to delete OTP for key [${otpKey}]: ${err.message}`);
    }
};

// --- Helper 3: Distributed Mutex Lock (Anti-Spam & Race Condition Protection) ---
const acquireRedisLock = async (lockKey, ttlMs = 3000) => {
    if (!isRedisConnected()) return true; // Fallback allow if Redis offline
    try {
        const result = await redisClient.set(`lock:${lockKey}`, '1', 'PX', ttlMs, 'NX');
        return result === 'OK';
    } catch (err) {
        logger.warn(`[Redis] Failed to acquire lock [${lockKey}]: ${err.message}`);
        return true;
    }
};

const releaseRedisLock = async (lockKey) => {
    if (!isRedisConnected()) return;
    try {
        await redisClient.del(`lock:${lockKey}`);
    } catch (err) {
        logger.warn(`[Redis] Failed to release lock [${lockKey}]: ${err.message}`);
    }
};

module.exports = {
    redisClient,
    isRedisConnected,
    setUserProfileCache,
    getUserProfileCache,
    clearUserProfileCache,
    setOtpRedis,
    getOtpRedis,
    deleteOtpRedis,
    acquireRedisLock,
    releaseRedisLock
};
