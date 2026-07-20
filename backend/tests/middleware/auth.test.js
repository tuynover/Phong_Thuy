// Mock dependencies BEFORE requiring the middleware
jest.mock('jsonwebtoken');
jest.mock('../../src/models/User');
jest.mock('../../src/config/redis', () => ({
    getUserProfileCache: jest.fn(),
    setUserProfileCache: jest.fn()
}));

const jwt = require('jsonwebtoken');
const User = require('../../src/models/User');
const { getUserProfileCache, setUserProfileCache } = require('../../src/config/redis');
const authMiddleware = require('../../src/middleware/auth');

describe('Auth Middleware Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            header: jest.fn()
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('valid token + matching tokenVersion should call next() and set req.user/req.dbUser', async () => {
        const mockDbUser = {
            _id: 'user-123',
            id: 'user-123',
            role: 'user',
            tokenVersion: 1,
            isDeleted: false,
            status: 'active'
        };
        req.header.mockReturnValue('Bearer valid-token-123');
        jwt.verify.mockReturnValue({
            user: { id: 'user-123', tokenVersion: 1 }
        });
        getUserProfileCache.mockResolvedValue(mockDbUser);

        await authMiddleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({ id: 'user-123', tokenVersion: 1 });
        expect(req.dbUser).toBeDefined();
        expect(req.dbUser._id).toBe('user-123');
    });

    test('expired/invalid token should return 401', async () => {
        req.header.mockReturnValue('Bearer expired-token');
        jwt.verify.mockImplementation(() => {
            throw new Error('jwt expired');
        });

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test('no Authorization header should return 401 with "No token"', async () => {
        req.header.mockReturnValue(null);

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'No token, authorization denied' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    test('token with wrong tokenVersion (revoked) should return 401', async () => {
        const mockDbUser = {
            _id: 'user-123',
            id: 'user-123',
            role: 'user',
            tokenVersion: 2, // DB has version 2
            isDeleted: false,
            status: 'active'
        };
        req.header.mockReturnValue('Bearer old-token');
        jwt.verify.mockReturnValue({
            user: { id: 'user-123', tokenVersion: 1 } // Token has version 1 (old)
        });
        getUserProfileCache.mockResolvedValue(mockDbUser);

        await authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('Phiên đăng nhập') })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
