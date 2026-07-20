const BaziController = require('../../src/controllers/BaziController');

// Mock all dependencies
jest.mock('../../src/models/BaziRecord');
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

const BaziRecord = require('../../src/models/BaziRecord');
const BaziAnalyzer = require('../../src/services/BaziAnalyzer');

const mockBaziResult = {
    solarTimeline: 'Dương lịch test',
    tietKhiTimeline: 'Tiết khí test',
    cungMenh: { gan: 'Giáp', chi: 'Tý' },
    tietKhiName: 'Tiểu Hàn',
    tuLenhCan: 'Quý',
    daYun: [{ tangCan: ['Giáp'] }]
};

describe('BaziController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                date: '05/09/2004',
                time: '14:30',
                gender: 1,
                userId: 'test-user-id',
                name: 'Nguyễn Văn A'
            },
            headers: {}
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

    test('analyze: valid date/time/gender should create record and return 200', async () => {
        BaziRecord.findOne.mockResolvedValue(null);
        const mockRecord = {
            _id: 'bazi-123',
            inputInfo: { name: 'Nguyễn Văn A', date: '05/09/2004', time: '14:30', gender: 1 },
            aiInterpretation: { content: '' },
            save: jest.fn().mockResolvedValue(true)
        };
        BaziRecord.mockImplementation(() => mockRecord);

        await BaziController.analyze(req, res);

        expect(BaziAnalyzer.analyze).toHaveBeenCalledWith('05/09/2004', '14:30', 1, 'midnight');
        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.recordId).toBe('bazi-123');
    });

    test('analyze: duplicate idempotency header key should return existing', async () => {
        req.headers['idempotency-key'] = 'dup-key-123';
        const existingRecord = {
            _id: 'existing-bazi-456',
            inputInfo: { name: 'Test', gender: 1 },
            baziData: { ...mockBaziResult, menhQuai: { cung: 'Khảm' } },
            aiInterpretation: { content: 'Luận giải cũ' },
            save: jest.fn().mockResolvedValue(true),
            markModified: jest.fn()
        };
        BaziRecord.findOne.mockResolvedValue(existingRecord);

        await BaziController.analyze(req, res);

        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.recordId).toBe('existing-bazi-456');
    });

    test('analyze: semantic duplicate (same date/time/gender) should return existing', async () => {
        // When no idempotency-key header, controller skips to semantic check (single findOne)
        BaziRecord.findOne.mockResolvedValue({
            _id: 'semantic-dup-789',
            inputInfo: { name: 'Test', gender: 1 },
            baziData: { ...mockBaziResult, menhQuai: { cung: 'Khảm' } },
            aiInterpretation: { content: '' },
            save: jest.fn().mockResolvedValue(true),
            markModified: jest.fn()
        });

        await BaziController.analyze(req, res);

        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.recordId).toBe('semantic-dup-789');
    });

    test('analyze: missing required fields should return 400', async () => {
        req.body = { date: '05/09/2004' }; // Missing time and gender

        await BaziController.analyze(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.any(String) })
        );
    });
});
