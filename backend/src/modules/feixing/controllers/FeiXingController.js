const FeiXingRecord = require('../models/FeiXingRecord');
const FeiXingEngineService = require('../services/FeiXingEngineService');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const InputValidator = require('../../../core/services/InputValidator');
const UserStatsService = require('../../../core/services/UserStatsService');
const GoogleIndexingService = require('../../../core/services/GoogleIndexingService');
const { acquireRedisLock, releaseRedisLock } = require('../../../core/config/redis');
const { findByIdFlex, updateByIdFlex } = require('../../../core/services/HistoryQueryHelper');

class FeiXingController {
  /**
   * Lập Tinh Bàn Huyền Không Phi Tinh (Calculation API)
   */
  static async calculate(req, res) {
    let lockKey = null;
    let lockToken = null;
    try {
      const validation = InputValidator.validateFeiXingInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const userId = req.body.userId || (req.dbUser ? String(req.dbUser.id || req.dbUser._id) : 'guest');
      const {
        period = 9,
        facingDegree,
        ownerName = 'Gia Chủ',
        buildingYear = null,
        birthDate = '',
        birthHour = null,
        gender = 1,
        title = 'Lá Số Huyền Không Phi Tinh'
      } = req.body;

      // In-flight concurrency lock 2.5s (Chống spam nhấp đúp)
      lockKey = `inflight:feixing:${userId}:${period}:${parseFloat(facingDegree).toFixed(1)}`;
      lockToken = await acquireRedisLock(lockKey, 2500);
      if (!lockToken) {
        return res.status(429).json({
          error: 'Yêu cầu lập tinh bàn đang được xử lý, vui lòng không nhấn gửi liên tục.'
        });
      }

      if (typeof res.on === 'function') {
        res.on('finish', () => {
          releaseRedisLock(lockKey, lockToken);
        });
      }

      // Tính toán học thuật hoàn toàn tĩnh bằng Rule Engine
      const resultPayload = FeiXingEngineService.calculateChart({
        period: parseInt(period, 10),
        facingDegree: parseFloat(facingDegree),
        ownerName,
        buildingYear: buildingYear ? parseInt(buildingYear, 10) : null,
        birthDate: birthDate || req.body.ownerBirthInfo?.birthDate || '',
        birthHour: birthHour !== null && birthHour !== undefined ? parseInt(birthHour, 10) : (req.body.ownerBirthInfo?.birthHour ?? null),
        gender: gender !== undefined ? parseInt(gender, 10) : (req.body.ownerBirthInfo?.gender ?? 1)
      });

      // Lưu bản ghi mới với UUIDv7
      const record = new FeiXingRecord({
        userId,
        ownerName,
        ownerBirthInfo: resultPayload.ownerBirthInfo,
        title,
        buildingYear: resultPayload.buildingYear,
        period: resultPayload.period,
        facingDegree: resultPayload.facingDegree,
        sittingDegree: resultPayload.sittingDegree,
        facingMountain: resultPayload.facingMountain,
        sittingMountain: resultPayload.sittingMountain,
        facingPalace: resultPayload.facingPalace,
        sittingPalace: resultPayload.sittingPalace,
        chartType: resultPayload.chartType,
        isSubstitution: resultPayload.isSubstitution,
        substitutionInfo: resultPayload.substitutionInfo,
        deviationDegree: resultPayload.deviationDegree,
        analysisSnapshot: resultPayload.analysisSnapshot
      });

      await record.save();

      // Cập nhật thống kê O(1)
      UserStatsService.incrementRecordCount(userId, 'feixing', 1);

      // Xóa cache lịch sử
      MemoryCacheService.clearUserHistoryCache(userId);

      // Thông báo Admin qua SSE
      try {
        const sseService = require('../../../core/services/SseService');
        sseService.sendToAdmins('new_calculation', { type: 'feixing', userId, recordId: record._id });
      } catch (e) {}

      releaseRedisLock(lockKey, lockToken);
      return res.json({
        ...resultPayload,
        recordId: record._id,
        _id: record._id,
        createdAt: record.createdAt
      });
    } catch (error) {
      if (lockKey) {
        releaseRedisLock(lockKey, lockToken);
      }
      console.error('FeiXing Calculate Error:', error);
      return res.status(500).json({ error: error.message || 'Lỗi xử lý lập tinh bàn Huyền Không.' });
    }
  }

  /**
   * Lấy chi tiết bản ghi tinh bàn theo ID
   */
  static async getRecord(req, res) {
    try {
      const { id } = req.params;
      const record = req.record || await findByIdFlex(FeiXingRecord, id);
      if (!record || record.isDeleted) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi Huyền Không Phi Tinh.' });
      }
      return res.json(record);
    } catch (error) {
      console.error('FeiXing getRecord Error:', error);
      return res.status(500).json({ error: 'Lỗi lấy thông tin bản ghi.' });
    }
  }

  /**
   * Lấy danh sách lịch sử lập tinh bàn của người dùng
   */
  static async getHistory(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: 'User ID is required' });

      const limit = parseInt(req.query.limit, 10) || 100;
      const { buildFilterQuery } = require('../../../core/services/HistoryQueryHelper');
      const query = buildFilterQuery('feixing', req.query, userId);

      const records = await FeiXingRecord.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .select('-analysisSnapshot -aiInterpretation')
        .limit(limit)
        .lean();

      return res.json(records);
    } catch (error) {
      console.error('FeiXing getHistory Error:', error);
      return res.status(500).json({ error: 'Lỗi lấy danh sách lịch sử.' });
    }
  }

  /**
   * Đánh giá bản ghi (Rating 1-5 sao)
   */
  static async rateRecord(req, res) {
    try {
      const { id } = req.params;
      const { rating, feedback } = req.body;
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Số sao đánh giá phải từ 1 đến 5.' });
      }

      const updated = await updateByIdFlex(FeiXingRecord, id, {
        rating,
        feedback: feedback || ''
      });

      if (!updated) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
      }

      return res.json({ message: 'Đánh giá thành công.', rating: updated.rating });
    } catch (error) {
      console.error('FeiXing rateRecord Error:', error);
      return res.status(500).json({ error: 'Lỗi lưu đánh giá.' });
    }
  }

  /**
   * Bật/Tắt chia sẻ công khai bản ghi
   */
  static async togglePublic(req, res) {
    try {
      const { id } = req.params;
      const record = await findByIdFlex(FeiXingRecord, id);
      if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
      }

      // Check ownership
      const currentUserId = req.dbUser ? String(req.dbUser.id || req.dbUser._id) : null;
      if (record.userId !== currentUserId && req.dbUser?.role !== 'admin') {
        return res.status(403).json({ error: 'Bạn không có quyền thay đổi trạng thái bản ghi này.' });
      }

      const newPublicState = !record.isPublic;
      record.isPublic = newPublicState;
      await record.save();

      // Ping Google Indexing API nếu có cấu hình
      try {
        const url = `${process.env.APP_URL || 'https://phongthuy.vn'}/feixing/record/${record._id}`;
        if (newPublicState) {
          GoogleIndexingService.notifyUrlUpdated(url);
        } else {
          GoogleIndexingService.notifyUrlDeleted(url);
        }
      } catch (e) {}

      return res.json({ isPublic: record.isPublic });
    } catch (error) {
      console.error('FeiXing togglePublic Error:', error);
      return res.status(500).json({ error: 'Lỗi cập nhật trạng thái chia sẻ.' });
    }
  }

  /**
   * Xóa mềm bản ghi
   */
  static async deleteRecord(req, res) {
    try {
      const { id } = req.params;
      const record = await findByIdFlex(FeiXingRecord, id);
      if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
      }

      const currentUserId = req.dbUser ? String(req.dbUser.id || req.dbUser._id) : null;
      if (record.userId !== currentUserId && req.dbUser?.role !== 'admin') {
        return res.status(403).json({ error: 'Bạn không có quyền xóa bản ghi này.' });
      }

      record.isDeleted = true;
      await record.save();

      // Giảm thống kê O(1)
      UserStatsService.incrementRecordCount(record.userId, 'feixing', -1);
      MemoryCacheService.clearUserHistoryCache(record.userId);

      return res.json({ message: 'Xóa bản ghi thành công.' });
    } catch (error) {
      console.error('FeiXing deleteRecord Error:', error);
      return res.status(500).json({ error: 'Lỗi xóa bản ghi.' });
    }
  }
}

module.exports = FeiXingController;
