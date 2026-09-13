const MarriageController = require('../../src/modules/bazi/controllers/MarriageController');

// Mock all dependencies
jest.mock('../../src/modules/bazi/models/MarriageRecord');
jest.mock('../../src/modules/bazi/services/BaziAnalyzer');
jest.mock('../../src/core/services/MemoryCacheService', () => ({
    clearUserHistoryCache: jest.fn()
}));
jest.mock('../../src/core/services/UserStatsService', () => ({
    incrementRecordCount: jest.fn()
}));
jest.mock('../../src/core/services/SseService', () => ({
    sendToAdmins: jest.fn()
}));

const MarriageRecord = require('../../src/modules/bazi/models/MarriageRecord');
const BaziAnalyzer = require('../../src/modules/bazi/services/BaziAnalyzer');

const mockBaziResult = {
    solarTimeline: 'Test',
    tietKhiTimeline: 'Test',
    cungMenh: { gan: 'Giáp' }
};

describe('MarriageController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                male: { date: '27/08/2004', time: '07:30' },
                female: { date: '02/01/2001', time: '03:02' },
                userId: 'test-user-id'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        BaziAnalyzer.analyze.mockReturnValue({ ...mockBaziResult });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('analyze: valid male + female input should create record and return 200', async () => {
        const mockRecord = {
            _id: 'marriage-123',
            inputInfo: { male: { date: '27/08/2004', time: '07:30' }, female: { date: '02/01/2001', time: '03:02' } },
            maleBaziData: mockBaziResult,
            femaleBaziData: mockBaziResult,
            aiInterpretation: { content: '' },
            save: jest.fn().mockResolvedValue(true)
        };
        MarriageRecord.mockImplementation(() => mockRecord);

        await MarriageController.analyze(req, res);

        expect(BaziAnalyzer.analyze).toHaveBeenCalledTimes(2); // Male + Female
        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.recordId).toBe('marriage-123');
    });

    test('analyze: missing required fields should return 400', async () => {
        req.body = { male: { date: '27/08/2004' } }; // Missing female entirely

        await MarriageController.analyze(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
