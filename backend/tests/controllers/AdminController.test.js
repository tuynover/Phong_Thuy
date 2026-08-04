const AdminController = require('../../src/controllers/AdminController');
const User = require('../../src/models/User');
const BanAppeal = require('../../src/models/BanAppeal');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/models/BanAppeal');
jest.mock('../../src/models/SystemLog');
jest.mock('../../src/services/MemoryCacheService', () => ({
    getUserProfileRamCache: jest.fn(),
    setUserProfileRamCache: jest.fn()
}));
jest.mock('../../src/config/redis', () => ({
    clearUserProfileCache: jest.fn()
}));

describe('AdminController Comprehensive Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: {},
            query: {},
            body: {},
            user: { _id: 'admin-1', role: 'admin' },
            hasAuthorityOver: jest.fn().mockReturnValue(true)
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('resolveAppeal should reject Co-Admin attempting to unlock an Admin account', async () => {
        const mockCoAdmin = { id: 'coadmin-uuid', role: 'co-admin' };
        const mockTargetAdmin = { id: 'admin-uuid', role: 'admin', status: 'locked' };
        const mockAppeal = {
            _id: 'appeal-uuid',
            userId: 'admin-uuid',
            status: 'pending',
            save: jest.fn()
        };

        req.params = { id: 'appeal-uuid' };
        req.body = { action: 'approve' };
        req.user = mockCoAdmin;
        req.hasAuthorityOver = (target) => {
            if (mockCoAdmin.role === 'admin') return true;
            if (mockCoAdmin.role === 'co-admin') return target.role === 'user' || target.role === 'vip';
            return false;
        };

        BanAppeal.findById.mockResolvedValue(mockAppeal);
        User.findById.mockResolvedValue(mockTargetAdmin);

        await AdminController.resolveAppeal(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Bạn không có quyền mở khóa cho tài khoản Quản trị viên này.'
        }));
    });

    test('updateUserCredits should adjust user credits correctly', async () => {
        req.params = { id: 'user-123' };
        req.body = { credits: 150 };

        const targetUser = {
            _id: 'user-123',
            role: 'user',
            credits: 100,
            save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(targetUser);

        await AdminController.updateUserCredits(req, res);

        expect(targetUser.credits).toBe(150);
        expect(targetUser.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Cập nhật lượt sử dụng thành công.'
        }));
    });

    test('lockUser should update status to locked', async () => {
        req.params = { id: 'user-456' };
        req.body = { reason: 'Vi phạm quy định' };

        const targetUser = {
            _id: 'user-456',
            role: 'user',
            status: 'active',
            save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(targetUser);

        await AdminController.lockUser(req, res);

        expect(targetUser.status).toBe('locked');
        expect(targetUser.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Khóa tài khoản thành công.'
        }));
    });

    test('unlockUser should restore user status to active', async () => {
        req.params = { id: 'user-789' };

        const targetUser = {
            _id: 'user-789',
            role: 'user',
            status: 'locked',
            save: jest.fn().mockResolvedValue(true)
        };
        User.findById.mockResolvedValue(targetUser);

        await AdminController.unlockUser(req, res);

        expect(targetUser.status).toBe('active');
        expect(targetUser.save).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Mở khóa tài khoản thành công.'
        }));
    });

    test('getUsers should return paginated list of users', async () => {
        req.query = { limit: 10 };
        const mockUsersList = [{ _id: 'u1', name: 'User 1' }, { _id: 'u2', name: 'User 2' }];
        
        User.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockUsersList)
        });
        User.countDocuments.mockResolvedValue(2);

        await AdminController.getUsers(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            users: mockUsersList,
            total: 2
        }));
    });
});
