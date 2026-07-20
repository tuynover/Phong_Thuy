const ZiweiController = require('../../src/controllers/ZiweiController');

// Mock all dependencies
jest.mock('../../src/models/ZiweiRecord');
jest.mock('../../src/services/ZiweiValidators');
jest.mock('../../src/services/ZiweiFormatter');
jest.mock('../../src/services/ZiweiCache');
jest.mock('../../src/shared/engines/AstrologyEngine', () => ({
    generate: jest.fn()
}));
jest.mock('../../src/services/MemoryCacheService', () => ({
    clearUserHistoryCache: jest.fn()
}));
jest.mock('../../src/services/UserStatsService', () => ({
    incrementRecordCount: jest.fn()
}));
jest.mock('../../src/services/SseService', () => ({
    sendToAdmins: jest.fn()
}));
jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    return {
        ...actualMongoose,
        Types: {
            ObjectId: jest.fn().mockReturnValue({ toString: () => 'ziwei-new-id' })
        }
    };
});

const ZiweiRecord = require('../../src/models/ZiweiRecord');
const ZiweiValidator = require('../../src/services/ZiweiValidators');
const ZiweiFormatter = require('../../src/services/ZiweiFormatter');
const ZiweiCache = require('../../src/services/ZiweiCache');
const AstrologyEngine = require('../../src/shared/engines/AstrologyEngine');

describe('ZiweiController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                date: '2004-09-05',
                hour: 7,
                gender: 'Nam',
                timezone: 7,
                school: 'bac_phai',
                calendarType: 'solar',
                userId: 'test-user-id'
            },
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        ZiweiValidator.validateBirthInfo.mockReturnValue({
            isValid: true,
            sanitized: {
                date: '2004-09-05', hour: 7, gender: 'Nam',
                timezone: 7, school: 'bac_phai', calendarType: 'solar', name: null
            }
        });

        ZiweiCache.generateChartHash.mockReturnValue('hash-abc-123');
        ZiweiCache.getChart.mockReturnValue(null);
        ZiweiCache.setChart.mockImplementation(() => {});

        AstrologyEngine.generate.mockReturnValue({ palaces: [] });
        ZiweiFormatter.toStandardOutput.mockReturnValue({
            chart_data: { formatted: true }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('createChart: valid input should create record and return 200', async () => {
        ZiweiRecord.findOne.mockResolvedValue(null);
        const mockCreated = {
            _id: 'ziwei-new-id',
            chartData: { formatted: true },
            inputInfo: { name: 'Tử Vi - Nam Mệnh' }
        };
        ZiweiRecord.create.mockResolvedValue(mockCreated);

        await ZiweiController.createChart(req, res);

        expect(ZiweiRecord.create).toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(mockCreated);
    });

    test('createChart: duplicate idempotencyKey should return existing', async () => {
        req.headers['idempotency-key'] = 'dup-ziwei-key';
        const existingRecord = { _id: 'existing-ziwei-456', chartData: { old: true } };
        ZiweiRecord.findOne.mockResolvedValue(existingRecord);

        await ZiweiController.createChart(req, res);

        expect(ZiweiRecord.create).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(existingRecord);
    });

    test('createChart: duplicate chartHash in DB should return existing', async () => {
        // Without idempotency-key header, controller skips to chartHash DB check (single findOne)
        const existingRecord = { _id: 'hash-dup-789', chartData: { cached: true } };
        ZiweiRecord.findOne.mockResolvedValue(existingRecord);

        await ZiweiController.createChart(req, res);

        expect(ZiweiRecord.create).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalled();
    });

    test('createChart: invalid input should return 400', async () => {
        ZiweiValidator.validateBirthInfo.mockReturnValue({
            isValid: false,
            error: 'Thiếu ngày sinh'
        });

        await ZiweiController.createChart(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Thiếu ngày sinh' });
    });
});
