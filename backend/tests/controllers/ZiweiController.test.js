const ZiweiController = require('../../src/modules/ziwei/controllers/ZiweiController');

// Mock dependencies
jest.mock('../../src/modules/ziwei/models/ZiweiRecord');
jest.mock('../../src/core/services/InputValidator');
jest.mock('../../src/modules/ziwei/services/ZiweiFormatter');
jest.mock('../../src/modules/ziwei/services/ZiweiCache');
jest.mock('../../src/shared/engines/AstrologyEngine', () => ({
    generate: jest.fn()
}));
jest.mock('../../src/core/services/MemoryCacheService', () => ({
    clearUserHistoryCache: jest.fn()
}));
jest.mock('../../src/core/services/UserStatsService', () => ({
    incrementRecordCount: jest.fn()
}));
jest.mock('../../src/core/services/SseService', () => ({
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

const ZiweiRecord = require('../../src/modules/ziwei/models/ZiweiRecord');
const InputValidator = require('../../src/core/services/InputValidator');
const ZiweiFormatter = require('../../src/modules/ziwei/services/ZiweiFormatter');
const ZiweiCache = require('../../src/modules/ziwei/services/ZiweiCache');
const AstrologyEngine = require('../../src/shared/engines/AstrologyEngine');

describe('ZiweiController Comprehensive Unit Tests', () => {
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

        InputValidator.validateZiweiInput.mockReturnValue({
            isValid: true,
            sanitized: {
                date: '2004-09-05', hour: 7, gender: 'Nam',
                timezone: 7, school: 'bac_phai', calendarType: 'solar', name: 'Tử Vi - Nam Mệnh'
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

    test('createChart: invalid input should return 400 with error message', async () => {
        InputValidator.validateZiweiInput.mockReturnValue({
            isValid: false,
            error: 'Thiếu ngày sinh'
        });

        await ZiweiController.createChart(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Thiếu ngày sinh' });
    });

    test('createChart: server exception should return 500 error', async () => {
        ZiweiRecord.create.mockRejectedValue(new Error('Database Connection Error'));

        await ZiweiController.createChart(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Database Connection Error' });
    });
});
