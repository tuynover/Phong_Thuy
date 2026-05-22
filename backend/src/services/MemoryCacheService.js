class MemoryCacheService {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Set a value in the cache with a Time-to-Live (TTL)
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlMs Default: 5 minutes (300000 ms)
     */
    set(key, value, ttlMs = 300000) {
        const expiresAt = Date.now() + ttlMs;
        this.cache.set(key, { value, expiresAt });
    }

    /**
     * Get a value from cache if it exists and has not expired
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

        return item.value;
    }

    /**
     * Delete a specific cache key
     * @param {string} key 
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * Clear all cache keys starting with a prefix
     * @param {string} prefix 
     */
    deleteByPrefix(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
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
    }
}

// Singleton instance
module.exports = new MemoryCacheService();
