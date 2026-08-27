const { setOtpRedis, getOtpRedis, deleteOtpRedis } = require('../../src/config/redis');

describe('OTP Dual-Storage (Redis L2 + RAM L1 Fallback)', () => {
    it('Nên lưu và đọc mã OTP từ RAM fallback khi Redis offline', async () => {
        const testKey = 'test_user@example.com';
        const testOtp = '123456';

        // 1. Set OTP
        const setRes = await setOtpRedis(`reset_password:${testKey}`, testOtp, 900);
        expect(setRes).toBe(true);

        // 2. Get OTP
        const cachedOtp = await getOtpRedis(`reset_password:${testKey}`);
        expect(cachedOtp).toBe(testOtp);

        // 3. Delete OTP
        await deleteOtpRedis(`reset_password:${testKey}`);
        const deletedOtp = await getOtpRedis(`reset_password:${testKey}`);
        expect(deletedOtp).toBeNull();
    });
});
