const creditCheck = require('../../src/core/middleware/creditCheck');
const chatCreditCheck = require('../../src/core/middleware/chatCreditCheck');
const User = require('../../src/core/models/User');
const jwt = require('jsonwebtoken');

describe('creditCheck & chatCreditCheck Middleware Unit Tests (Points System)', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = 'test_secret_key_123';
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('creditCheck should deduct 100 points for standard interpretation and attach refundCredit', async () => {
        const mockUser = {
            _id: 'user-test-uuid',
            role: 'user',
            credits: 500
        };

        const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);

        const req = {
            headers: {
                authorization: `Bearer ${token}`
            },
            body: {}
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            on: jest.fn()
        };
        const next = jest.fn();

        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        const findOneAndUpdateSpy = jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue({
            ...mockUser,
            credits: 400
        });

        await creditCheck(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.creditCost).toBe(100);
        expect(req.creditDecremented).toBe(true);
        expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
            { _id: 'user-test-uuid', credits: { $gte: 100 } },
            { $inc: { credits: -100 } },
            { new: true }
        );
        expect(typeof req.refundCredit).toBe('function');

        // Test refund execution
        const refundSpy = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
            ...mockUser,
            credits: 500
        });

        await req.refundCredit();
        expect(req.creditDecremented).toBe(false);
        expect(refundSpy).toHaveBeenCalledWith(
            'user-test-uuid',
            { $inc: { credits: 100 } },
            { new: true }
        );
    });

    test('creditCheck should deduct 500 points for VIP interpretation', async () => {
        const mockUser = {
            _id: 'user-test-uuid',
            role: 'user',
            credits: 1000
        };

        const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);

        const req = {
            headers: {
                authorization: `Bearer ${token}`
            },
            body: { mode: 'vip' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            on: jest.fn()
        };
        const next = jest.fn();

        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        const findOneAndUpdateSpy = jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue({
            ...mockUser,
            credits: 500
        });

        await creditCheck(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.creditCost).toBe(500);
        expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
            { _id: 'user-test-uuid', credits: { $gte: 500 } },
            { $inc: { credits: -500 } },
            { new: true }
        );
    });

    test('creditCheck should reject request with 402 when points are insufficient', async () => {
        const mockUser = {
            _id: 'user-test-uuid',
            role: 'user',
            credits: 50
        };

        const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);

        const req = {
            headers: {
                authorization: `Bearer ${token}`
            },
            body: {}
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        const next = jest.fn();

        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue(null);

        await creditCheck(req, res, next);

        expect(res.status).toHaveBeenCalledWith(402);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('Bạn không đủ lượt sử dụng (cần 100 points')
        }));
        expect(next).not.toHaveBeenCalled();
    });

    test('chatCreditCheck should deduct 50 points and refund 50 points on error', async () => {
        const mockUser = {
            _id: 'user-test-uuid',
            id: 'user-test-uuid',
            role: 'user',
            credits: 200
        };

        const token = jwt.sign({ id: mockUser._id }, process.env.JWT_SECRET);

        const req = {
            header: jest.fn().mockReturnValue(`Bearer ${token}`),
            headers: {},
            body: { question: 'Hôm nay sao gì chiếu?' }
        };
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            on: jest.fn()
        };
        const next = jest.fn();

        jest.spyOn(User, 'findById').mockResolvedValue(mockUser);
        const findOneAndUpdateSpy = jest.spyOn(User, 'findOneAndUpdate').mockResolvedValue({
            ...mockUser,
            credits: 150
        });

        await chatCreditCheck(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.creditDecremented).toBe(true);
        expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
            { _id: 'user-test-uuid', credits: { $gte: 50 } },
            { $inc: { credits: -50 } },
            { new: true }
        );

        // Test chat refund
        const refundSpy = jest.spyOn(User, 'findByIdAndUpdate').mockResolvedValue({
            ...mockUser,
            credits: 200
        });

        await req.refundChatCredit();
        expect(req.creditDecremented).toBe(false);
        expect(refundSpy).toHaveBeenCalledWith(
            'user-test-uuid',
            { $inc: { credits: 50 } },
            { new: true }
        );
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
