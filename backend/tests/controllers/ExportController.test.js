const ExportController = require('../../src/controllers/ExportController');

// Mock models and services
jest.mock('../../src/models/BaziRecord');
jest.mock('../../src/models/ZiweiRecord');
jest.mock('../../src/models/IChingRecord');
jest.mock('../../src/models/MarriageRecord');
jest.mock('../../src/models/SystemLog', () => ({
    create: jest.fn().mockResolvedValue({})
}));
jest.mock('../../src/services/PdfGeneratorService', () => ({
    renderHtmlToPdf: jest.fn().mockResolvedValue({
        buffer: Buffer.from('%PDF-1.4 mock pdf content'),
        isCacheHit: false
    })
}));
jest.mock('../../src/services/LoggerService', () => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
}));

const BaziRecord = require('../../src/models/BaziRecord');
const ZiweiRecord = require('../../src/models/ZiweiRecord');
const IChingRecord = require('../../src/models/IChingRecord');
const MarriageRecord = require('../../src/models/MarriageRecord');
const PdfGeneratorService = require('../../src/services/PdfGeneratorService');

describe('ExportController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            params: { type: 'bazi', id: 'bazi-test-123' },
            query: { scope: 'full' },
            ip: '127.0.0.1',
            requestId: '01925b42-1234-7abc-8def-123456789abc',
            user: null
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            setHeader: jest.fn(),
            send: jest.fn()
        };
        jest.clearAllMocks();
    });

    test('should return 400 for invalid system type', async () => {
        req.params.type = 'unknown_type';
        await ExportController.exportPdf(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('không hợp lệ')
        }));
    });

    test('should return 400 when scope is missing or empty', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue({
            _id: 'bazi-test-123',
            userId: 'owner-user-id',
            isPublic: true
        });
        req.query.scope = '';
        await ExportController.exportPdf(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('Vui lòng chọn ít nhất 1 mục nội dung')
        }));
    });

    test('should return 404 when record is not found', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue(null);

        await ExportController.exportPdf(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('Không tìm thấy')
        }));
    });

    test('should return 401 when private record is accessed without authentication', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue({
            _id: 'bazi-test-123',
            userId: 'owner-user-id',
            isPublic: false
        });

        req.user = null;
        await ExportController.exportPdf(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('Vui lòng đăng nhập')
        }));
    });

    test('should return 403 when private record is accessed by a different user', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue({
            _id: 'bazi-test-123',
            userId: 'owner-user-id',
            isPublic: false
        });

        req.user = { id: 'attacker-user-id' };
        await ExportController.exportPdf(req, res);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            error: expect.stringContaining('chế độ riêng tư')
        }));
    });

    test('should succeed when private record is accessed by the owner', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue({
            _id: 'bazi-test-123',
            userId: 'owner-user-id',
            isPublic: false,
            name: 'Nguyen Van A',
            gender: 'Nam',
            solarDate: '1990-01-01',
            solarTime: '12:00',
            canChi: { year: { gan: 'Canh', zhi: 'Ngọ' } }
        });

        req.user = { id: 'owner-user-id' };
        await ExportController.exportPdf(req, res);

        expect(PdfGeneratorService.renderHtmlToPdf).toHaveBeenCalled();
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', expect.stringContaining('attachment; filename='));
        expect(res.send).toHaveBeenCalled();
    });

    test('should succeed when public record is accessed by an unauthenticated guest', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue({
            _id: 'bazi-public-123',
            userId: 'owner-user-id',
            isPublic: true,
            name: 'Tran Thi B',
            gender: 'Nữ',
            solarDate: '1995-05-15',
            solarTime: '08:00'
        });

        req.user = null;
        await ExportController.exportPdf(req, res);

        expect(PdfGeneratorService.renderHtmlToPdf).toHaveBeenCalled();
        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
        expect(res.send).toHaveBeenCalled();
    });

    test('should support specific scope selection (e.g. chart only)', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue({
            _id: 'bazi-public-123',
            userId: 'owner-user-id',
            isPublic: true,
            name: 'Tran Thi B'
        });

        req.query.scope = 'chart';
        await ExportController.exportPdf(req, res);

        expect(PdfGeneratorService.renderHtmlToPdf).toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
    });

    test('should succeed when guest-created record (userId === "guest") is accessed by an unauthenticated user', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue({
            _id: 'bazi-guest-123',
            userId: 'guest',
            isPublic: false,
            name: 'Khach Vang Lai'
        });

        req.user = null;
        req.dbUser = null;
        await ExportController.exportPdf(req, res);

        expect(PdfGeneratorService.renderHtmlToPdf).toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
    });

    test('should succeed when private record is accessed by an admin user', async () => {
        BaziRecord.findById = jest.fn().mockResolvedValue({
            _id: 'bazi-private-123',
            userId: 'another-user-id',
            isPublic: false,
            name: 'Nguyen Van C'
        });

        req.user = { id: 'admin-id', role: 'admin' };
        req.dbUser = { id: 'admin-id', role: 'admin' };
        await ExportController.exportPdf(req, res);

        expect(PdfGeneratorService.renderHtmlToPdf).toHaveBeenCalled();
        expect(res.send).toHaveBeenCalled();
    });
});
