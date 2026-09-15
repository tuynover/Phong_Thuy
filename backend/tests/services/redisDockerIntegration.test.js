const {
    redisClient,
    isRedisConnected,
    acquireRedisLock,
    releaseRedisLock,
    setUserProfileCache,
    getUserProfileCache,
    clearUserProfileCache,
    setOtpRedis,
    getOtpRedis,
    deleteOtpRedis
} = require('../../src/core/config/redis');

describe('Redis Docker Live Integration Tests (127.0.0.1:6379)', () => {
    beforeAll(async () => {
        // Connect to local Docker Redis instance
        if (redisClient.status === 'wait') {
            await redisClient.connect();
        }
        if (redisClient.status !== 'ready') {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Timed out waiting for Docker Redis ready event')), 5000);
                redisClient.once('ready', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
    }, 10000);

    afterAll(async () => {
        // Clean up test keys
        try {
            const keys = await redisClient.keys('*docker-test*');
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
        } catch (e) {}
    });

    test('1. Should connect to Docker Redis container and reply PONG', async () => {
        expect(isRedisConnected()).toBe(true);
        const pong = await redisClient.ping();
        expect(pong).toBe('PONG');
    });

    test('2. Distributed Lock: Should acquire lock in Docker Redis with SET NX PX and verify TTL', async () => {
        const lockKey = 'docker-test-lock-1';
        const ttlMs = 4000;

        const token = await acquireRedisLock(lockKey, ttlMs);
        expect(token).toBeTruthy();
        expect(typeof token).toBe('string');

        // Verify key stored directly in Docker Redis engine
        const rawRedisVal = await redisClient.get(`lock:${lockKey}`);
        expect(rawRedisVal).toBe(token);

        // Verify TTL in Docker Redis
        const pttl = await redisClient.pttl(`lock:${lockKey}`);
        expect(pttl).toBeGreaterThan(1000);
        expect(pttl).toBeLessThanOrEqual(ttlMs);

        // Cleanup
        await releaseRedisLock(lockKey, token);
        const afterRelease = await redisClient.get(`lock:${lockKey}`);
        expect(afterRelease).toBeNull();
    });

    test('3. Atomic Lua Release: Must NOT release lock when token is mismatched', async () => {
        const lockKey = 'docker-test-lock-mismatch';
        const token = await acquireRedisLock(lockKey, 5000);
        expect(token).toBeTruthy();

        // Attempt release with wrong token
        await releaseRedisLock(lockKey, 'wrong-imposter-token');

        // Lock MUST still exist in Docker Redis!
        const stillInRedis = await redisClient.get(`lock:${lockKey}`);
        expect(stillInRedis).toBe(token);

        // Release with correct token
        await releaseRedisLock(lockKey, token);
        const deletedFromRedis = await redisClient.get(`lock:${lockKey}`);
        expect(deletedFromRedis).toBeNull();
    });

    test('4. Concurrency Race Condition: 10 parallel requests to same lock key -> Exactly 1 winner', async () => {
        const lockKey = 'docker-test-concurrent-race';
        
        // Fire 10 simultaneous lock requests in the same millisecond
        const results = await Promise.all([
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000),
            acquireRedisLock(lockKey, 3000)
        ]);

        const acquiredTokens = results.filter(t => t !== null);
        const rejectedLocks = results.filter(t => t === null);

        // Exactly 1 winner in Docker Redis
        expect(acquiredTokens.length).toBe(1);
        expect(rejectedLocks.length).toBe(9);

        // Cleanup winner lock
        await releaseRedisLock(lockKey, acquiredTokens[0]);
    });

    test('5. OTP Dual-Storage: Should save and retrieve OTP in Docker Redis', async () => {
        const email = 'docker-test-user@phongthuy.vn';
        const otpCode = '987654';

        await setOtpRedis(email, otpCode, 120);

        // Verify key in Docker Redis directly
        const rawOtp = await redisClient.get(`otp:${email}`);
        expect(rawOtp).toBe(otpCode);

        // Verify helper retrieval
        const retrievedOtp = await getOtpRedis(email);
        expect(retrievedOtp).toBe(otpCode);

        // Delete OTP
        await deleteOtpRedis(email);
        const afterDelete = await redisClient.get(`otp:${email}`);
        expect(afterDelete).toBeNull();
    });

    test('6. User Profile Cache: Should cache profile JSON in Docker Redis (L2)', async () => {
        const userId = 'docker-test-user-uuid-12345';
        const userProfile = {
            id: userId,
            email: 'admin@phongthuy.vn',
            name: 'Phong Thủy Master',
            role: 'admin',
            credits: 999900
        };

        await setUserProfileCache(userId, userProfile, 120);

        // Verify key in Docker Redis directly
        const rawJson = await redisClient.get(`user:profile:${userId}`);
        expect(rawJson).toBeTruthy();
        const parsed = JSON.parse(rawJson);
        expect(parsed.name).toBe('Phong Thủy Master');
        expect(parsed.credits).toBe(999900);

        // Verify helper retrieval
        const cachedProfile = await getUserProfileCache(userId);
        expect(cachedProfile.name).toBe('Phong Thủy Master');
        expect(cachedProfile.credits).toBe(999900);

        // Cleanup
        await clearUserProfileCache(userId);
        const afterClear = await redisClient.get(`user:profile:${userId}`);
        expect(afterClear).toBeNull();
    });
});
