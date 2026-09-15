const { acquireRedisLock, releaseRedisLock } = require('../../src/core/config/redis');

describe('Distributed Mutex Lock Unit Tests', () => {
    const testLockKey = 'unit-test-lock-key';

    afterEach(async () => {
        // Force cleanup lock after each test
        await releaseRedisLock(testLockKey);
    });

    test('should acquire lock and return a valid string token', async () => {
        const token = await acquireRedisLock(testLockKey, 3000);
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(10);
    });

    test('should reject second acquisition while lock is held', async () => {
        const token1 = await acquireRedisLock(testLockKey, 3000);
        expect(token1).toBeTruthy();

        const token2 = await acquireRedisLock(testLockKey, 3000);
        expect(token2).toBeNull();
    });

    test('should allow re-acquisition after release with valid token', async () => {
        const token1 = await acquireRedisLock(testLockKey, 3000);
        expect(token1).toBeTruthy();

        await releaseRedisLock(testLockKey, token1);

        const token2 = await acquireRedisLock(testLockKey, 3000);
        expect(token2).toBeTruthy();
        expect(token2).not.toBe(token1);
    });

    test('should not release lock if incorrect token is provided', async () => {
        const token1 = await acquireRedisLock(testLockKey, 3000);
        expect(token1).toBeTruthy();

        // Attempt to release with a wrong token
        await releaseRedisLock(testLockKey, 'wrong-fake-token-1234');

        // Lock should still be held!
        const token2 = await acquireRedisLock(testLockKey, 3000);
        expect(token2).toBeNull();
    });

    test('should allow force release without token (backward compatibility)', async () => {
        const token1 = await acquireRedisLock(testLockKey, 3000);
        expect(token1).toBeTruthy();

        // Release without passing token
        await releaseRedisLock(testLockKey);

        const token2 = await acquireRedisLock(testLockKey, 3000);
        expect(token2).toBeTruthy();
    });

    test('should automatically acquire lock after TTL expiration', async () => {
        const shortTtlMs = 150;
        const token1 = await acquireRedisLock(testLockKey, shortTtlMs);
        expect(token1).toBeTruthy();

        // Wait for TTL to expire
        await new Promise(resolve => setTimeout(resolve, 200));

        const token2 = await acquireRedisLock(testLockKey, 3000);
        expect(token2).toBeTruthy();
    });
});
