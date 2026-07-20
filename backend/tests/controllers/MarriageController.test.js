const MarriageController = require('../../src/controllers/MarriageController');

// Mock all dependencies
jest.mock('../../src/models/MarriageRecord');
jest.mock('../../src/services/BaziAnalyzer');
jest.mock('../../src/services/MemoryCacheService', () => ({
    clearUserHistoryCache: jest.fn()
}));
jest.mock('../../src/services/UserStatsService', () => ({
    incrementRecordCount: jest.fn()
}));
jest.mock('../../src/services/SseService', () => ({
    sendToAdmins: jest.fn()
}));

const MarriageRecord = require('../../src/models/MarriageRecord');
const BaziAnalyzer = require('../../src/services/BaziAnalyzer');

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
        MarriageRecord.findOne.mockResolvedValue(null);
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

    test('analyze: semantic duplicate should return existing record', async () => {
        const existingRecord = {
            _id: 'existing-marriage-456',
            maleBaziData: mockBaziResult,
            femaleBaziData: mockBaziResult,
            aiInterpretation: { content: 'Luận giải hợp hôn' }
        };
        MarriageRecord.findOne.mockResolvedValue(existingRecord);

        await MarriageController.analyze(req, res);

        expect(BaziAnalyzer.analyze).not.toHaveBeenCalled(); // Should NOT recalculate
        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.recordId).toBe('existing-marriage-456');
    });

    test('analyze: missing required fields should return 400', async () => {
        req.body = { male: { date: '27/08/2004' } }; // Missing female entirely

        await MarriageController.analyze(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });
});
