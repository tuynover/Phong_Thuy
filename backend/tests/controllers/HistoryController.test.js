const HistoryController = require('../../src/controllers/HistoryController');

// Mock all dependencies
jest.mock('../../src/models/IChingRecord');
jest.mock('../../src/models/BaziRecord');
jest.mock('../../src/models/ZiweiRecord');
jest.mock('../../src/models/MarriageRecord');
jest.mock('../../src/models/Conversation');
jest.mock('../../src/models/Message');
jest.mock('../../src/models/User');
jest.mock('../../src/services/IChingDataService');
jest.mock('../../src/services/BaziAnalyzer');
jest.mock('../../src/services/MemoryCacheService', () => ({
    get: jest.fn(),
    set: jest.fn(),
    clearUserHistoryCache: jest.fn()
}));
jest.mock('../../src/services/UserStatsService', () => ({
    incrementRecordCount: jest.fn(),
    updateUserStatsBackground: jest.fn()
}));
jest.mock('../../src/services/SseService', () => ({
    sendToAdmins: jest.fn()
}));
jest.mock('../../src/utils/transactionHelper', () => ({
    runInTransaction: jest.fn(async (fn) => fn(null)) // Execute callback with null session (no transaction)
}));

const IChingRecord = require('../../src/models/IChingRecord');
const BaziRecord = require('../../src/models/BaziRecord');
const User = require('../../src/models/User');
const MemoryCacheService = require('../../src/services/MemoryCacheService');
const { runInTransaction } = require('../../src/utils/transactionHelper');

// Helper to create chainable Mongoose query mock
const createChainableQuery = (resolvedValue) => {
    const query = {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(resolvedValue)
    };
    return query;
};

describe('HistoryController Unit Tests', () => {
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

    // ==================== getHexagramHistory ====================

    test('getHexagramHistory: should return paginated list with isDeleted filter', async () => {
        const mockRecords = [
            { _id: 'r1', question: 'Test 1' },
            { _id: 'r2', question: 'Test 2' }
        ];
        const chainableQuery = createChainableQuery(mockRecords);
        IChingRecord.find.mockReturnValue(chainableQuery);
        MemoryCacheService.get.mockReturnValue(null); // No cache

        const req = {
            params: { userId: 'user-123' },
            query: { limit: '10' }
        };

        await HistoryController.getHexagramHistory(req, res);

        expect(IChingRecord.find).toHaveBeenCalledWith(
            expect.objectContaining({
                userId: 'user-123',
                isDeleted: { $ne: true }
            })
        );
        expect(res.json).toHaveBeenCalledWith(mockRecords);
    });

    // ==================== getBaziHistory ====================

    test('getBaziHistory: should apply limit parameter', async () => {
        const mockRecords = [{ _id: 'b1' }];
        const chainableQuery = createChainableQuery(mockRecords);
        BaziRecord.find.mockReturnValue(chainableQuery);
        MemoryCacheService.get.mockReturnValue(null);

        const req = {
            params: { userId: 'user-123' },
            query: { limit: '5' }
        };

        await HistoryController.getBaziHistory(req, res);

        expect(chainableQuery.limit).toHaveBeenCalledWith(5);
        expect(res.json).toHaveBeenCalled();
    });

    // ==================== getBaziRecord via getHexagramRecord pattern ====================

    test('getHexagramRecord: record exists should return 200 with data', async () => {
        const mockRecord = {
            _id: 'hex-record-123',
            primaryHexagram: { binary_code: '101010', lines: [] },
            transformedHexagram: null,
            movingLines: [],
            lunarDateInfo: { dayCanChi: 'Giáp Tý', monthCanChi: 'Bính Dần' },
            toObject: jest.fn().mockReturnValue({
                _id: 'hex-record-123',
                primaryHexagram: { binary_code: '101010', lines: [] },
                transformedHexagram: null,
                movingLines: [],
                lunarDateInfo: { dayCanChi: 'Giáp Tý', monthCanChi: 'Bính Dần' }
            })
        };

        IChingRecord.findById.mockResolvedValue(mockRecord);
        const IChingDataService = require('../../src/services/IChingDataService');
        IChingDataService.parseLines.mockReturnValue({
            primaryLines: [], secondaryLines: []
        });

        const req = { params: { id: 'hex-record-123' } };
        await HistoryController.getHexagramRecord(req, res);

        expect(res.json).toHaveBeenCalled();
    });

    test('getHexagramRecord: record NOT found should return 404', async () => {
        IChingRecord.findById.mockResolvedValue(null);

        const req = { params: { id: 'nonexistent-id' } };
        await HistoryController.getHexagramRecord(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    // ==================== rateHexagram ====================

    test('rateHexagram: valid rating should update record', async () => {
        const updatedRecord = { _id: 'r1', rating: 4, userId: 'user-123' };
        IChingRecord.findByIdAndUpdate.mockResolvedValue(updatedRecord);

        const req = {
            params: { id: 'r1' },
            body: { rating: 4, feedback: 'Rất chính xác' }
        };

        await HistoryController.rateHexagram(req, res);

        expect(IChingRecord.findByIdAndUpdate).toHaveBeenCalledWith(
            'r1',
            { rating: 4, feedback: 'Rất chính xác' },
            { new: true }
        );
        expect(res.json).toHaveBeenCalledWith(updatedRecord);
    });

    test('rateHexagram: record not found should return 404', async () => {
        IChingRecord.findByIdAndUpdate.mockResolvedValue(null);

        const req = {
            params: { id: 'nonexistent' },
            body: { rating: 3 }
        };

        await HistoryController.rateHexagram(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    // ==================== deleteCalculation ====================

    test('deleteCalculation: should soft delete record (set isDeleted: true)', async () => {
        const mockRecord = { _id: 'del-123', userId: 'user-123' };
        BaziRecord.findById.mockResolvedValue(mockRecord);
        BaziRecord.updateOne.mockResolvedValue({ modifiedCount: 1 });
        User.updateOne.mockResolvedValue({ modifiedCount: 0 });

        const req = {
            params: { type: 'bazi', id: 'del-123' },
            user: { id: 'user-123' }
        };

        await HistoryController.deleteCalculation(req, res);

        expect(runInTransaction).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('thành công') })
        );
    });

    // ==================== pinCalculation ====================

    test('pinCalculation: should toggle isPinned from false to true', async () => {
        const mockRecord = { _id: 'pin-123', userId: 'user-123', isPinned: false };
        BaziRecord.findById.mockResolvedValue(mockRecord);
        const updatedRecord = { ...mockRecord, isPinned: true };
        BaziRecord.findByIdAndUpdate.mockResolvedValue(updatedRecord);

        const req = {
            params: { type: 'bazi', id: 'pin-123' },
            user: { id: 'user-123' }
        };

        await HistoryController.pinCalculation(req, res);

        expect(BaziRecord.findByIdAndUpdate).toHaveBeenCalledWith(
            'pin-123',
            { isPinned: true },
            { new: true }
        );
        expect(res.json).toHaveBeenCalledWith(updatedRecord);
    });
});
