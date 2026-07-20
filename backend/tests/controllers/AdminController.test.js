const AdminController = require('../../src/controllers/AdminController');
const User = require('../../src/models/User');
const BanAppeal = require('../../src/models/BanAppeal');

describe('AdminController Co-Admin Authorization Tests', () => {
    test('resolveAppeal should reject Co-Admin attempting to unlock an Admin account', async () => {
        const mockCoAdmin = {
            id: 'coadmin-uuid',
            role: 'co-admin'
        };

        const mockTargetAdmin = {
            id: 'admin-uuid',
            role: 'admin',
            status: 'locked'
        };

        const mockAppeal = {
            _id: 'appeal-uuid',
            userId: 'admin-uuid',
            status: 'pending',
            save: jest.fn()
        };

        const req = {
            params: { id: 'appeal-uuid' },
            body: { action: 'approve' },
            user: mockCoAdmin,
            hasAuthorityOver: (target) => {
                if (mockCoAdmin.role === 'admin') return true;
                if (mockCoAdmin.role === 'co-admin') return target.role === 'user' || target.role === 'vip';
                return false;
            }
        };

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.spyOn(BanAppeal, 'findById').mockResolvedValue(mockAppeal);
        jest.spyOn(User, 'findById').mockResolvedValue(mockTargetAdmin);

        await AdminController.resolveAppeal(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: 'Bạn không có quyền mở khóa cho tài khoản Quản trị viên này.'
        }));

        BanAppeal.findById.mockRestore();
        User.findById.mockRestore();
    });
});
