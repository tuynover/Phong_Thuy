const BaziController = require('../../src/modules/bazi/controllers/BaziController');

// Mock all dependencies
jest.mock('../../src/modules/bazi/models/BaziRecord');
jest.mock('../../src/modules/bazi/services/BaziAnalyzer');
jest.mock('../../src/core/services/InputValidator');
jest.mock('../../src/core/services/MemoryCacheService', () => ({
    clearUserHistoryCache: jest.fn()
}));
jest.mock('../../src/core/services/UserStatsService', () => ({
    incrementRecordCount: jest.fn()
}));
jest.mock('../../src/core/services/SseService', () => ({
    sendToAdmins: jest.fn()
}));

const BaziRecord = require('../../src/modules/bazi/models/BaziRecord');
const BaziAnalyzer = require('../../src/modules/bazi/services/BaziAnalyzer');
const InputValidator = require('../../src/core/services/InputValidator');

const mockBaziResult = {
    solarTimeline: 'Dương lịch test',
    tietKhiTimeline: 'Tiết khí test',
    cungMenh: { gan: 'Giáp', chi: 'Tý' },
    tietKhiName: 'Tiểu Hàn',
    tuLenhCan: 'Quý',
    daYun: [{ tangCan: ['Giáp'] }]
};

describe('BaziController Comprehensive Unit Tests', () => {
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

        InputValidator.validateBaziInput.mockReturnValue({
            isValid: true,
            sanitized: {
                date: '05/09/2004', time: '14:30', gender: 1, name: 'Nguyễn Văn A', midnightMode: 'midnight'
            }
        });

        BaziAnalyzer.analyze.mockReturnValue({ ...mockBaziResult });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('analyze: valid date/time/gender should create record and return 200', async () => {
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

    test('analyze: invalid input should return 400', async () => {
        InputValidator.validateBaziInput.mockReturnValue({
            isValid: false,
            error: 'Thiếu ngày sinh'
        });

        await BaziController.analyze(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Thiếu ngày sinh' });
    });

    test('analyze: database exception should return 500 error', async () => {
        BaziRecord.mockImplementation(() => ({
            save: jest.fn().mockRejectedValue(new Error('Internal Mongo Error'))
        }));

        await BaziController.analyze(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
});
