const { redisClient, isRedisConnected, withTimeout } = require('../config/redis');
const logger = require('./LoggerService');

class MemoryCacheService {
    constructor() {
        this.cache = new Map();
        this.maxCapacity = process.env.MEMORY_CACHE_MAX_ITEMS ? parseInt(process.env.MEMORY_CACHE_MAX_ITEMS) : 3000;
        this.defaultTtlMs = 180000; // 3 phút
        this.startPeriodicSweep();
    }

    /**
     * Start periodic background sweep for expired cache keys (every 60 seconds)
     */
    startPeriodicSweep() {
        const sweepTimer = setInterval(() => {
            const now = Date.now();
            let sweptCount = 0;
            for (const [key, item] of this.cache.entries()) {
                if (now > item.expiresAt) {
                    this.cache.delete(key);
                    sweptCount++;
                }
            }
            if (sweptCount > 0) {
                logger.info(`[MemoryCacheService] Swept ${sweptCount} expired L1 cache keys.`);
            }
        }, 60000);

        if (sweepTimer.unref) {
            sweepTimer.unref();
        }
    }

    /**
     * Set a value in cache (L1 RAM with LRU Eviction + L2 Redis)
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlMs Default: 3 minutes (180,000 ms)
     */
    set(key, value, ttlMs = this.defaultTtlMs) {
        const expiresAt = Date.now() + ttlMs;

        // If key already exists, delete it first to update insertion order
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxCapacity) {
            // LRU Eviction: Remove the oldest inserted item
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }

        // Insert new item at the end of Map order
        this.cache.set(key, { value, expiresAt });

        // L2: Asynchronously write to Redis if connected
        if (isRedisConnected()) {
            const ttlSeconds = Math.max(1, Math.ceil(ttlMs / 1000));
            try {
                const serialized = JSON.stringify(value);
                withTimeout(redisClient.setex(key, ttlSeconds, serialized), 500, null).catch(err => {
                    logger.warn(`[MemoryCacheService] Redis setex failed for key ${key}: ${err.message}`);
                });
            } catch (err) {
                logger.warn(`[MemoryCacheService] Serialization failed for key ${key}: ${err.message}`);
            }
        }
    }

    /**
     * Get a value from local L1 cache synchronously with LRU touch
     * @param {string} key 
     * @returns {any|null}
     */
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // LRU Touch: Move key to the end of Map order (most recently used)
        this.cache.delete(key);
        this.cache.set(key, item);

        return item.value;
    }

    /**
     * Async get that checks L1 cache first, then falls back to L2 Redis
     * @param {string} key 
     * @returns {Promise<any|null>}
     */
    async getAsync(key) {
        // 1. Try L1 local cache
        const localValue = this.get(key);
        if (localValue !== null) {
            return localValue;
        }

        // 2. If L1 missed and Redis is connected, try L2 Redis with timeout
        if (isRedisConnected()) {
            try {
                const data = await withTimeout(redisClient.get(key), 500, null);
                if (data) {
                    const parsed = JSON.parse(data);
                    // Populate L1 cache for subsequent fast reads (default 3 mins)
                    this.set(key, parsed, this.defaultTtlMs);
                    return parsed;
                }
            } catch (err) {
                logger.warn(`[MemoryCacheService] Redis get failed for key ${key}: ${err.message}`);
            }
        }

        return null;
    }

    /**
     * Delete a specific cache key from L1 & L2
     * @param {string} key 
     */
    delete(key) {
        // L1: Delete local
        this.cache.delete(key);

        // L2: Delete Redis
        if (isRedisConnected()) {
            withTimeout(redisClient.del(key), 500, null).catch(err => {
                logger.warn(`[MemoryCacheService] Redis del failed for key ${key}: ${err.message}`);
            });
        }
    }

    /**
     * Clear all cache keys starting with a prefix from L1 & L2
     * @param {string} prefix 
     */
    deleteByPrefix(prefix) {
        // L1: Delete matching local keys
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }

        // L2: Delete matching Redis keys via SCAN
        if (isRedisConnected()) {
            try {
                const stream = redisClient.scanStream({
                    match: `${prefix}*`,
                    count: 100
                });

                stream.on('data', (keys) => {
                    if (keys && keys.length > 0) {
                        const pipeline = redisClient.pipeline();
                        keys.forEach(k => pipeline.del(k));
                        withTimeout(pipeline.exec(), 1000, null).catch(err => {
                            logger.warn(`[MemoryCacheService] Redis deleteByPrefix pipeline failed: ${err.message}`);
                        });
                    }
                });

                stream.on('error', (err) => {
                    logger.warn(`[MemoryCacheService] Redis deleteByPrefix scan failed for prefix ${prefix}: ${err.message}`);
                });
            } catch (err) {
                logger.warn(`[MemoryCacheService] Redis deleteByPrefix exception: ${err.message}`);
            }
        }
    }

    /**
     * Clear cache for a specific user's history
     * @param {string} userId 
     */
    clearUserHistoryCache(userId) {
        if (!userId) return;
        const prefix = `history:${userId}:`;
        this.deleteByPrefix(prefix);
    }

    /**
     * Clear chat cache for a specific record
     * @param {string} type 'hexagrams' or 'bazi'
     * @param {string} recordId 
     */
    clearChatCache(type, recordId) {
        if (!type || !recordId) return;
        const prefix = `history:chat:${type}:${recordId}:`;
        this.deleteByPrefix(prefix);
    }

    /**
     * Clear all cached data
     */
    clearAll() {
        this.cache.clear();
        if (isRedisConnected()) {
            redisClient.flushdb().catch(err => {
                logger.warn(`[MemoryCacheService] Redis flushdb failed: ${err.message}`);
            });
        }
    }

    /**
     * Get current cache stats for monitoring
     */
    getStats() {
        return {
            size: this.cache.size,
            maxCapacity: this.maxCapacity,
            defaultTtlMs: this.defaultTtlMs,
            isRedisConnected: isRedisConnected()
        };
    }
}

// Singleton instance
module.exports = new MemoryCacheService();
