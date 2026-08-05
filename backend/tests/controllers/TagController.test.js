const TagController = require('../../src/controllers/TagController');

jest.mock('../../src/models/User');
jest.mock('../../src/models/IChingRecord');
jest.mock('../../src/models/BaziRecord');
jest.mock('../../src/models/ZiweiRecord');
jest.mock('../../src/models/MarriageRecord');
jest.mock('../../src/services/MemoryCacheService', () => ({
    get: jest.fn(),
    set: jest.fn(),
    clearUserHistoryCache: jest.fn()
}));

const User = require('../../src/models/User');
const IChingRecord = require('../../src/models/IChingRecord');
const BaziRecord = require('../../src/models/BaziRecord');
const ZiweiRecord = require('../../src/models/ZiweiRecord');
const MarriageRecord = require('../../src/models/MarriageRecord');

describe('TagController Unit Tests', () => {
    let res;

    beforeEach(() => {
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ==================== getUserTags ====================
    describe('getUserTags', () => {
        test('should return default tag "Chung" if user has no tags', async () => {
            const mockUser = {
                _id: 'user-1',
                tags: [],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);
            IChingRecord.countDocuments.mockResolvedValue(0);
            BaziRecord.countDocuments.mockResolvedValue(0);
            ZiweiRecord.countDocuments.mockResolvedValue(0);
            MarriageRecord.countDocuments.mockResolvedValue(0);

            const req = { user: { id: 'user-1' } };
            await TagController.getUserTags(req, res);

            expect(mockUser.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Chung', isDefault: true })
                ])
            );
        });

        test('should return tag list with record counts', async () => {
            const mockUser = {
                _id: 'user-1',
                tags: [
                    { _id: 't1', name: 'Chung', isDefault: true },
                    { _id: 't2', name: 'Gia đình', isDefault: false }
                ]
            };
            User.findById.mockResolvedValue(mockUser);
            IChingRecord.countDocuments.mockResolvedValue(2);
            BaziRecord.countDocuments.mockResolvedValue(3);
            ZiweiRecord.countDocuments.mockResolvedValue(1);
            MarriageRecord.countDocuments.mockResolvedValue(0);

            const req = { user: { id: 'user-1' } };
            await TagController.getUserTags(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Chung',
                        counts: expect.objectContaining({ total: 6, bazi: 3 })
                    })
                ])
            );
        });
    });

    // ==================== createTag ====================
    describe('createTag', () => {
        test('should create a new tag successfully', async () => {
            const mockUser = {
                _id: 'user-1',
                tags: [{ _id: 't1', name: 'Chung', isDefault: true }],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);

            const req = { user: { id: 'user-1' }, body: { name: 'Bạn bè' } };
            await TagController.createTag(req, res);

            expect(mockUser.tags).toHaveLength(2);
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Bạn bè', isDefault: false })
            );
        });

        test('should reject duplicate tag name (case-insensitive)', async () => {
            const mockUser = {
                _id: 'user-1',
                tags: [{ _id: 't1', name: 'Chung', isDefault: true }]
            };
            User.findById.mockResolvedValue(mockUser);

            const req = { user: { id: 'user-1' }, body: { name: 'chung' } };
            await TagController.createTag(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Thẻ hoặc thư mục này đã tồn tại.' })
            );
        });
    });

    // ==================== updateTag ====================
    describe('updateTag', () => {
        test('should reject editing default tag "Chung"', async () => {
            const mockUser = {
                _id: 'user-1',
                tags: [{ _id: 'default', name: 'Chung', isDefault: true }]
            };
            User.findById.mockResolvedValue(mockUser);

            const req = { user: { id: 'user-1' }, params: { tagId: 'default' }, body: { name: 'Mới' } };
            await TagController.updateTag(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Không thể đổi tên thư mục mặc định.' })
            );
        });

        test('should update custom tag name and sync all 4 record collections', async () => {
            const mockUser = {
                _id: 'user-1',
                tags: [
                    { _id: 't1', name: 'Chung', isDefault: true },
                    { _id: 't2', name: 'Gia đình', isDefault: false }
                ],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);
            IChingRecord.updateMany.mockResolvedValue({ modifiedCount: 1 });
            BaziRecord.updateMany.mockResolvedValue({ modifiedCount: 1 });
            ZiweiRecord.updateMany.mockResolvedValue({ modifiedCount: 0 });
            MarriageRecord.updateMany.mockResolvedValue({ modifiedCount: 0 });

            const req = { user: { id: 'user-1' }, params: { tagId: 't2' }, body: { name: 'Người thân' } };
            await TagController.updateTag(req, res);

            expect(mockUser.tags[1].name).toBe('Người thân');
            expect(IChingRecord.updateMany).toHaveBeenCalledWith(
                { userId: 'user-1', tags: 'Gia đình' },
                { $set: { "tags.$": 'Người thân' } }
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ name: 'Người thân' })
            );
        });
    });

    // ==================== deleteTag ====================
    describe('deleteTag', () => {
        test('should reject deleting default tag "Chung"', async () => {
            const mockUser = {
                _id: 'user-1',
                tags: [{ _id: 'default', name: 'Chung', isDefault: true }]
            };
            User.findById.mockResolvedValue(mockUser);

            const req = { user: { id: 'user-1' }, params: { tagId: 'default' } };
            await TagController.deleteTag(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Không thể xóa thư mục mặc định.' })
            );
        });

        test('should delete custom tag and reset empty tags to "Chung"', async () => {
            const mockUser = {
                _id: 'user-1',
                tags: [
                    { _id: 'default', name: 'Chung', isDefault: true },
                    { _id: 't2', name: 'Bạn bè', isDefault: false }
                ],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);
            IChingRecord.updateMany.mockResolvedValue({ modifiedCount: 1 });
            BaziRecord.updateMany.mockResolvedValue({ modifiedCount: 1 });
            ZiweiRecord.updateMany.mockResolvedValue({ modifiedCount: 0 });
            MarriageRecord.updateMany.mockResolvedValue({ modifiedCount: 0 });

            const req = { user: { id: 'user-1' }, params: { tagId: 't2' } };
            await TagController.deleteTag(req, res);

            expect(mockUser.tags).toHaveLength(1);
            expect(IChingRecord.updateMany).toHaveBeenCalledWith(
                { userId: 'user-1', tags: 'Bạn bè' },
                { $pull: { tags: 'Bạn bè' } }
            );
            expect(IChingRecord.updateMany).toHaveBeenCalledWith(
                { userId: 'user-1', tags: { $size: 0 } },
                { $set: { tags: ['Chung'] } }
            );
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: expect.stringContaining('Bạn bè') })
            );
        });
    });

    // ==================== updateRecordTags ====================
    describe('updateRecordTags', () => {
        test('should return 403 if user is not the owner of the record', async () => {
            const mockRecord = {
                _id: 'rec-1',
                userId: 'user-999',
                tags: ['Chung']
            };
            BaziRecord.findById.mockResolvedValue(mockRecord);

            const req = {
                user: { id: 'user-123' },
                params: { type: 'bazi', id: 'rec-1' },
                body: { tags: ['Gia đình'] }
            };

            await TagController.updateRecordTags(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Bạn không có quyền sửa đổi thẻ của bản ghi này.' })
            );
        });

        test('should update record tags if user is the owner', async () => {
            const mockRecord = {
                _id: 'rec-1',
                userId: 'user-123',
                tags: ['Chung'],
                save: jest.fn().mockResolvedValue(true)
            };
            BaziRecord.findById.mockResolvedValue(mockRecord);

            const req = {
                user: { id: 'user-123' },
                params: { type: 'bazi', id: 'rec-1' },
                body: { tags: ['Gia đình', 'Bạn bè'] }
            };

            await TagController.updateRecordTags(req, res);

            expect(mockRecord.tags).toEqual(['Gia đình', 'Bạn bè']);
            expect(mockRecord.save).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Cập nhật thẻ thành công.', tags: ['Gia đình', 'Bạn bè'] })
            );
        });
    });
});
