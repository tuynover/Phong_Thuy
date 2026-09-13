const BaziRecord = require('../../bazi/models/BaziRecord');
const ZiweiRecord = require('../../ziwei/models/ZiweiRecord');
const IChingRecord = require('../../iching/models/IChingRecord');
const MarriageRecord = require('../../bazi/models/MarriageRecord');
const pdfTemplateService = require('../services/PdfTemplateService');
const pdfGeneratorService = require('../services/PdfGeneratorService');
const logger = require('../../../core/services/LoggerService');

/**
 * Chuẩn hóa tên tệp không dấu cho tải file
 */
function sanitizeFileName(str) {
  if (!str) return 'La_So_Phong_Thuy';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Controller Xử Lý Xuất Bản Tệp PDF Học Thuật
 */
class ExportController {
  async exportPdf(req, res) {
    const startTime = Date.now();
    const requestId = req.requestId || req.headers['x-request-id'] || 'N/A';
    const { type, id } = req.params;

    // 1. Phân giải Model học thuật tương ứng
    let Model = null;
    let normalizedType = (type || '').toLowerCase();

    if (normalizedType === 'bazi') {
      Model = BaziRecord;
    } else if (normalizedType === 'ziwei' || normalizedType === 'tu-vi') {
      Model = ZiweiRecord;
      normalizedType = 'ziwei';
    } else if (normalizedType === 'iching' || normalizedType === 'hexagrams') {
      Model = IChingRecord;
      normalizedType = 'iching';
    } else if (normalizedType === 'marriage') {
      Model = MarriageRecord;
    }

    if (!Model) {
      logger.warn(`[PDF_EXPORT] Loại bản ghi không hợp lệ: ${type}`, { requestId, action: 'EXPORT_PDF', ip: req.ip });
      return res.status(400).json({ error: 'Loại phân hệ học thuật không hợp lệ.' });
    }

    try {
      // 2. Tìm bản ghi trong CSDL
      const record = await Model.findById(id);
      if (!record || record.isDeleted) {
        logger.warn(`[PDF_EXPORT] Không tìm thấy bản ghi: ${type}/${id}`, { requestId, action: 'EXPORT_PDF', ip: req.ip });
        return res.status(404).json({ error: 'Không tìm thấy bản ghi tương ứng trên hệ thống.' });
      }

      // 3. Phân quyền truy cập nghiêm ngặt
      const isPublic = record.isPublic === true || record.userId === 'guest';
      const currentUser = req.dbUser || req.user;
      const currentUserId = currentUser ? String(currentUser.id || currentUser._id) : null;
      const recordOwnerId = String(record.userId);
      const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'co-admin');

      if (!isPublic) {
        if (!currentUser) {
          logger.warn(`[PDF_EXPORT_DENIED] Bản ghi riêng tư yêu cầu đăng nhập: ${type}/${id}`, {
            requestId,
            action: 'EXPORT_PDF',
            ip: req.ip
          });
          return res.status(401).json({ error: 'Vui lòng đăng nhập để tải bản ghi riêng tư này.' });
        }

        const isOwner = currentUserId === recordOwnerId;
        if (!isOwner && !isAdmin) {
          logger.warn(`[PDF_EXPORT_DENIED] Người dùng ${currentUserId} không phải chủ sở hữu của bản ghi private ${recordOwnerId}`, {
            requestId,
            user: currentUserId,
            action: 'EXPORT_PDF',
            ip: req.ip
          });
          return res.status(403).json({
            error: 'Bản ghi này ở chế độ riêng tư. Chỉ chính chủ sở hữu mới có quyền tải tệp PDF.'
          });
        }
      }

      // 4. Phân tích tham số Scope
      let scope = [];
      if (req.body && req.body.scope) {
        scope = Array.isArray(req.body.scope) ? req.body.scope : [req.body.scope];
      } else if (req.query && req.query.scope) {
        scope = typeof req.query.scope === 'string' ? req.query.scope.split(',') : req.query.scope;
      }

      if (scope.length === 0) {
        return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 mục nội dung cần xuất PDF.' });
      }

      // 5. Tạo nội dung HTML theo từng phân hệ
      let htmlContent = '';
      let defaultFileName = 'La_So_Phong_Thuy';

      if (normalizedType === 'bazi') {
        htmlContent = pdfTemplateService.generateBaziHtml(record, scope);
        const name = record.inputInfo?.name || 'Gia_Chu';
        defaultFileName = `La_So_Bat_Tu_${sanitizeFileName(name)}`;
      } else if (normalizedType === 'ziwei') {
        htmlContent = pdfTemplateService.generateZiweiHtml(record, scope);
        const name = record.chartData?.name || record.inputInfo?.name || 'Gia_Chu';
        defaultFileName = `La_So_Tu_Vi_${sanitizeFileName(name)}`;
      } else if (normalizedType === 'iching') {
        htmlContent = pdfTemplateService.generateIChingHtml(record, scope);
        const hexName = record.primaryHexagram?.name || 'Que_Dich';
        defaultFileName = `Que_Dich_${sanitizeFileName(hexName)}`;
      } else if (normalizedType === 'marriage') {
        htmlContent = pdfTemplateService.generateMarriageHtml(record, scope);
        const maleName = record.inputInfo?.male?.name || 'Nam';
        const femaleName = record.inputInfo?.female?.name || 'Nu';
        defaultFileName = `Hop_Hon_${sanitizeFileName(maleName)}_${sanitizeFileName(femaleName)}`;
      }

      // 6. Tạo khóa Cache Redis dựa trên Scope và thời gian sửa đổi bản ghi
      const scopeKey = scope.sort().join('_');
      const recordUpdatedMs = record.updatedAt ? new Date(record.updatedAt).getTime() : 0;
      const cacheKey = `pdf:cache:v5:${normalizedType}:${id}:${scopeKey}:${recordUpdatedMs}`;

      // 7. Gọi Generator kết xuất PDF Buffer
      const { buffer, isCacheHit } = await pdfGeneratorService.renderHtmlToPdf(htmlContent, cacheKey);
      const durationMs = Date.now() - startTime;
      const fileSizeKb = Math.round(buffer.length / 1024);

      // 8. Ghi Audit Log thành công có Request ID
      logger.info(
        `[PDF_EXPORT_SUCCESS] [ReqID: ${requestId}] [User: ${currentUserId || 'guest'}] Type: ${normalizedType} | RecordId: ${id} | Scope: [${scope.join(', ')}] | Size: ${fileSizeKb}KB | Duration: ${durationMs}ms | Cache: ${isCacheHit ? 'HIT' : 'MISS'}`,
        {
          requestId,
          user: currentUserId || 'guest',
          action: 'EXPORT_PDF',
          ip: req.ip,
          duration: durationMs
        }
      );

      // 9. Thiết lập Header phản hồi tệp đính kèm
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${defaultFileName}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('X-Request-ID', requestId);
      res.setHeader('X-PDF-Cache', isCacheHit ? 'HIT' : 'MISS');

      return res.send(buffer);
    } catch (err) {
      const durationMs = Date.now() - startTime;
      logger.error(`[PDF_EXPORT_ERROR] [ReqID: ${requestId}] Lỗi khi xuất PDF: ${err.message}`, err.stack, {
        requestId,
        action: 'EXPORT_PDF',
        ip: req.ip,
        duration: durationMs
      });
      const statusCode = err.status || 500;
      const errorMessage = err.status
        ? err.message
        : 'Đã xảy ra lỗi trong quá trình tạo tệp PDF. Vui lòng thử lại sau.';
      return res.status(statusCode).json({ error: errorMessage });
    }
  }
}

module.exports = new ExportController();
