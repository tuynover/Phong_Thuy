const IChingController = require('../../src/modules/iching/controllers/IChingController');

// Mock all dependencies
jest.mock('../../src/modules/iching/models/IChingRecord');
jest.mock('../../src/modules/iching/services/IChingDataService');
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

const IChingRecord = require('../../src/modules/iching/models/IChingRecord');
const IChingDataService = require('../../src/modules/iching/services/IChingDataService');
const InputValidator = require('../../src/core/services/InputValidator');

describe('IChingController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {
                lines: [
                    { value: 7, moving: false }, { value: 8, moving: false },
                    { value: 7, moving: false }, { value: 9, moving: true },
                    { value: 8, moving: false }, { value: 6, moving: true }
                ],
                userId: 'test-user-id',
                question: 'Hỏi về công việc'
            }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        InputValidator.validateIChingInput.mockReturnValue({
            isValid: true,
            sanitized: {
                lines: req.body.lines,
                question: 'Hỏi về công việc'
            }
        });

        IChingDataService.calculate.mockReturnValue({
            primary: { binary_code: '101010', name: 'Càn' },
            secondary: { binary_code: '010101', name: 'Khôn' },
            dateInfo: { lunarDay: 1, lunarMonth: 6, lunarYear: 2025 }
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('calculate: valid 6-line input should create record and return 200', async () => {
        const mockSavedRecord = { _id: 'record-123', save: jest.fn().mockResolvedValue(true) };
        IChingRecord.mockImplementation(() => mockSavedRecord);

        await IChingController.calculate(req, res);

        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.recordId).toBe('record-123');
    });

    test('calculate: missing lines should return 400', async () => {
        InputValidator.validateIChingInput.mockReturnValue({
            isValid: false,
            error: 'Require exactly 6 lines.'
        });

        await IChingController.calculate(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Require exactly 6 lines.' });
    });

    test('calculate: guest userId should still create record', async () => {
        req.body.userId = undefined; // No userId → defaults to 'guest'
        IChingRecord.findOne.mockResolvedValue(null);
        const mockRecord = { _id: 'guest-record-123', save: jest.fn().mockResolvedValue(true) };
        IChingRecord.mockImplementation(() => mockRecord);

        await IChingController.calculate(req, res);

        expect(res.json).toHaveBeenCalled();
        const response = res.json.mock.calls[0][0];
        expect(response.recordId).toBe('guest-record-123');
    });
});
