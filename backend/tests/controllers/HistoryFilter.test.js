const HistoryController = require('../../src/controllers/HistoryController');

jest.mock('../../src/models/IChingRecord');
jest.mock('../../src/models/BaziRecord');
jest.mock('../../src/models/ZiweiRecord');
jest.mock('../../src/models/MarriageRecord');
jest.mock('../../src/models/Conversation');
jest.mock('../../src/models/Message');
jest.mock('../../src/models/User');
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
    runInTransaction: jest.fn(async (fn) => fn(null))
}));

const IChingRecord = require('../../src/models/IChingRecord');
const BaziRecord = require('../../src/models/BaziRecord');
const ZiweiRecord = require('../../src/models/ZiweiRecord');
const MarriageRecord = require('../../src/models/MarriageRecord');

const createChainableQuery = (resolvedValue) => {
    return {
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(resolvedValue)
    };
};

describe('HistoryFilter Unit Tests', () => {
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

    describe('getBaziHistory with advanced filters', () => {
        test('should apply tag, isPublic, and search filters', async () => {
            const mockBazis = [
                { _id: 'b1', inputInfo: { name: 'Nguyễn Văn A', date: '27/08/1995', time: '14:30', gender: 1 }, tags: ['Gia đình'], isPublic: true },
                { _id: 'b2', inputInfo: { name: 'Trần Thị B', date: '10/05/2000', time: '09:15', gender: 0 }, tags: ['Gia đình'], isPublic: false }
            ];
            BaziRecord.find.mockReturnValue(createChainableQuery(mockBazis));

            const req = {
                params: { userId: 'user-123' },
                query: {
                    tag: 'Gia đình',
                    isPublic: 'true',
                    search: 'Nguyễn'
                }
            };

            await HistoryController.getBaziHistory(req, res);

            expect(BaziRecord.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 'user-123',
                    tags: 'Gia đình',
                    isPublic: true,
                    'inputInfo.name': expect.any(RegExp)
                })
            );
        });

        test('should filter birthDay, birthMonth, birthYear, and birthHour correctly in memory', async () => {
            const mockBazis = [
                { _id: 'b1', inputInfo: { name: 'Nguyễn Văn A', date: '27/08/1995', time: '14:30', gender: 1 } },
                { _id: 'b2', inputInfo: { name: 'Trần Thị B', date: '15/08/1995', time: '08:00', gender: 0 } },
                { _id: 'b3', inputInfo: { name: 'Lê Văn C', date: '27/09/1995', time: '14:00', gender: 1 } }
            ];
            BaziRecord.find.mockReturnValue(createChainableQuery(mockBazis));

            const req = {
                params: { userId: 'user-123' },
                query: {
                    birthDay: '27',
                    birthMonth: '8',
                    birthYear: '1995',
                    birthHour: '14'
                }
            };

            await HistoryController.getBaziHistory(req, res);

            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({ _id: 'b1' })
            ]);
        });
    });

    describe('getAllHistory', () => {
        test('should query all 4 subsystems and return combined counts', async () => {
            IChingRecord.find.mockReturnValue(createChainableQuery([{ _id: 'i1', question: 'Gieo quẻ 1' }]));
            BaziRecord.find.mockReturnValue(createChainableQuery([{ _id: 'b1', inputInfo: { name: 'Nam 1', date: '01/01/1990' } }]));
            ZiweiRecord.find.mockReturnValue(createChainableQuery([{ _id: 'z1', inputInfo: { name: 'Nam 2', date: '1990-01-01', hour: 2 } }]));
            MarriageRecord.find.mockReturnValue(createChainableQuery([]));

            const req = {
                params: { userId: 'user-123' },
                query: {}
            };

            await HistoryController.getAllHistory(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    counts: {
                        hexagrams: 1,
                        bazis: 1,
                        ziweis: 1,
                        marriages: 0,
                        total: 3
                    }
                })
            );
        });
    });
});
