const creditCheck = require('../../src/middleware/creditCheck');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

describe('creditCheck Middleware & Refund Unit Tests', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = 'test_secret_key_123';
    });

    test('creditCheck should attach req.refundCredit helper function', async () => {
        const mockUser = {
            _id: 'user-test-uuid',
            role: 'user',
            credits: 5
        };

        const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);

        const req = {
            headers: {
                authorization: `Bearer ${token}`
            }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            on: jest.fn()
        };
        const next = jest.fn();

        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue({
            ...mockUser,
            credits: 4
        });

        await creditCheck(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.creditDecremented).toBe(true);
        expect(typeof req.refundCredit).toBe('function');

        // Test refund execution
        jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
            ...mockUser,
            credits: 5
        });

        await req.refundCredit();
        expect(req.creditDecremented).toBe(false);

        User.findById.mockRestore();
        User.findOneAndUpdate.mockRestore();
        User.findByIdAndUpdate.mockRestore();
    });

    test('creditCheck should reject request with 401 when token is missing', async () => {
        const req = { headers: {} };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        await creditCheck(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});
