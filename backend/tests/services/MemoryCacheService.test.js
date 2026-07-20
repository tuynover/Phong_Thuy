const MemoryCacheService = require('../../src/services/MemoryCacheService');

describe('MemoryCacheService LRU & Eviction Unit Tests', () => {
    beforeEach(() => {
        MemoryCacheService.clearAll();
    });

    test('should store and retrieve item within TTL', () => {
        MemoryCacheService.set('test:key1', { name: 'Phong Thủy' }, 5000);
        const retrieved = MemoryCacheService.get('test:key1');
        expect(retrieved).toEqual({ name: 'Phong Thủy' });
    });

    test('should return null for expired items', () => {
        MemoryCacheService.set('test:expired', 'data', -100); // Expired 100ms ago
        const retrieved = MemoryCacheService.get('test:expired');
        expect(retrieved).toBeNull();
    });

    test('should evict oldest item when maxCapacity is reached (LRU)', () => {
        const originalCapacity = MemoryCacheService.maxCapacity;
        MemoryCacheService.maxCapacity = 3; // Temporary limit for testing

        MemoryCacheService.set('key1', 'val1');
        MemoryCacheService.set('key2', 'val2');
        MemoryCacheService.set('key3', 'val3');

        expect(MemoryCacheService.get('key1')).toBe('val1');

        // Adding 4th item should evict key2 (since key1 was touched by get)
        MemoryCacheService.set('key4', 'val4');

        expect(MemoryCacheService.get('key2')).toBeNull(); // Evicted!
        expect(MemoryCacheService.get('key1')).toBe('val1'); // Kept!
        expect(MemoryCacheService.get('key3')).toBe('val3');
        expect(MemoryCacheService.get('key4')).toBe('val4');

        MemoryCacheService.maxCapacity = originalCapacity;
    });

    test('getStats should return current size and maxCapacity', () => {
        const stats = MemoryCacheService.getStats();
        expect(stats).toBeDefined();
        expect(stats.maxCapacity).toBe(3000);
        expect(stats.defaultTtlMs).toBe(180000); // 3 minutes
    });
});
