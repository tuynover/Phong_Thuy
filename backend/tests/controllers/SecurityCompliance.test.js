const AuthController = require('../../src/controllers/AuthController');
const User = require('../../src/models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

describe('Security & SSE Compliance Tests', () => {
    test('changePassword should increment tokenVersion to invalidate legacy JWT sessions', async () => {
        const mockUser = {
            id: 'user-uuid',
            email: 'test@example.com',
            password: await bcrypt.hash('OldPassword123!', 10),
            tokenVersion: 1,
            save: jest.fn().mockResolvedValue(true)
        };

        const req = {
            dbUser: { id: 'user-uuid' },
            body: {
                currentPassword: 'OldPassword123!',
                newPassword: 'NewPassword456!'
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);

        await AuthController.changePassword(req, res);

        expect(mockUser.tokenVersion).toBe(2);
        expect(mockUser.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Đổi mật khẩu thành công.'
        }));

        User.findById.mockRestore();
    });

    test('crypto.randomInt generates valid 6-digit OTP strings', () => {
        for (let i = 0; i < 50; i++) {
            const otp = crypto.randomInt(100000, 1000000).toString();
            expect(otp).toMatch(/^[1-9][0-9]{5}$/);
            expect(otp.length).toBe(6);
        }
    });
});
