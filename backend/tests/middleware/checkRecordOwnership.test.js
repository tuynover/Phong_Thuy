jest.mock('../../src/models/IChingRecord');
jest.mock('../../src/models/BaziRecord');
jest.mock('../../src/models/ZiweiRecord');
jest.mock('../../src/models/MarriageRecord');

const BaziRecord = require('../../src/models/BaziRecord');
const checkRecordOwnership = require('../../src/middleware/checkRecordOwnership');

describe('checkRecordOwnership Middleware Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            params: { id: 'record-123' },
            originalUrl: '/api/history/bazi/record/record-123',
            dbUser: { id: 'user-123', _id: 'user-123', role: 'user' }
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

    test('user owns record should call next() and set req.record', async () => {
        const mockRecord = {
            _id: 'record-123',
            userId: 'user-123',
            baziData: { some: 'data' }
        };
        BaziRecord.findById.mockResolvedValue(mockRecord);

        await checkRecordOwnership(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.record).toEqual(mockRecord);
    });

    test('user does NOT own record and is NOT admin should return 403', async () => {
        const mockRecord = {
            _id: 'record-123',
            userId: 'other-user-456', // Different userId
            baziData: { some: 'data' }
        };
        BaziRecord.findById.mockResolvedValue(mockRecord);

        await checkRecordOwnership(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });

    test('record not found should call next() (controller handles 404)', async () => {
        BaziRecord.findById.mockResolvedValue(null);

        await checkRecordOwnership(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.record).toBeUndefined();
    });
});
