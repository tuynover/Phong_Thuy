const NumerologyRecord = require('../models/NumerologyRecord');
const NumerologyRuleEngineService = require('../services/NumerologyRuleEngineService');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const InputValidator = require('../../../core/services/InputValidator');
const UserStatsService = require('../../../core/services/UserStatsService');
const GoogleIndexingService = require('../../../core/services/GoogleIndexingService');
const { acquireRedisLock, releaseRedisLock } = require('../../../core/config/redis');
const { findByIdFlex, updateByIdFlex } = require('../../../core/services/HistoryQueryHelper');

class NumerologyController {
  /**
   * Tính toán phong thủy số (Sim, Biển số xe, Tài khoản ngân hàng)
   */
  static async calculate(req, res) {
    let lockKey = null;
    let lockToken = null;
    try {
      const validation = InputValidator.validateNumerologyInput(req.body);
      if (!validation.isValid) {
        return res.status(400).json({ error: validation.error });
      }

      const userId = req.body.userId || (req.dbUser ? String(req.dbUser.id || req.dbUser._id) : 'guest');
      const {
        rawInput,
        targetNumber,
        type = 'sim',
        mode = 'quick',
        bankName = '',
        ownerName = 'Gia Chủ',
        birthDate = '',
        birthHour = '',
        gender = 1,
        year = null
      } = req.body;

      const inputNumber = (rawInput || targetNumber || '').trim();
      const sanitizedNumber = inputNumber.replace(/[^a-zA-Z0-9]/g, '');

      // In-flight concurrency lock 2.5s (Chống spam nhấp đúp race condition)
      lockKey = `inflight:numerology:${userId}:${type}:${sanitizedNumber}`;
      lockToken = await acquireRedisLock(lockKey, 2500);
      if (!lockToken) {
        return res.status(429).json({
          error: 'Yêu cầu phân tích số học đang được xử lý, vui lòng không nhấn gửi liên tục.'
        });
      }

      if (typeof res.on === 'function') {
        res.on('finish', () => {
          releaseRedisLock(lockKey, lockToken);
        });
      }

      let finalBirthDate = birthDate || req.body.ownerBirthInfo?.birthDate || '';
      const finalBirthHour = birthHour || req.body.ownerBirthInfo?.birthHour || '12:00';
      const calendarMode = req.body.calendarMode || req.body.ownerBirthInfo?.calendarMode || 'solar';
      const isLeap = !!req.body.isLeap;

      if (mode === 'bazi' && calendarMode === 'lunar' && finalBirthDate) {
        try {
          const { Lunar } = require('lunar-javascript');
          let dNum, mNum, yNum;
          if (finalBirthDate.includes('/')) {
            const parts = finalBirthDate.split('/');
            dNum = parseInt(parts[0], 10);
            mNum = parseInt(parts[1], 10);
            yNum = parseInt(parts[2], 10);
          } else if (finalBirthDate.includes('-')) {
            const parts = finalBirthDate.split('-');
            yNum = parseInt(parts[0], 10);
            mNum = parseInt(parts[1], 10);
            dNum = parseInt(parts[2], 10);
          }
          if (dNum && mNum && yNum) {
            const lunarObj = Lunar.fromYmd(yNum, isLeap ? -mNum : mNum, dNum);
            const solarObj = lunarObj.getSolar();
            finalBirthDate = `${String(solarObj.getDay()).padStart(2, '0')}/${String(solarObj.getMonth()).padStart(2, '0')}/${solarObj.getYear()}`;
          }
        } catch (e) {
          console.error('Lunar conversion error in NumerologyController:', e);
        }
      }

      const ownerBirthInfo = mode === 'bazi' ? {
        birthDate: finalBirthDate,
        birthHour: finalBirthHour,
        gender: gender !== undefined ? parseInt(gender, 10) : (req.body.ownerBirthInfo?.gender ?? 1),
        calendarType: calendarMode === 'lunar' ? 'lunar' : 'solar'
      } : {
        birthDate: '',
        birthHour: '',
        gender: 1,
        calendarType: 'solar'
      };

      // Tính toán học thuật hoàn toàn bằng Rule Engine
      const resultPayload = NumerologyRuleEngineService.executeAnalysis({
        rawInput: inputNumber,
        type,
        mode,
        ownerBirthInfo,
        ownerName,
        year
      });

      // Tạo bản ghi mới với UUIDv7 độc lập
      const record = new NumerologyRecord({
        userId,
        type,
        targetNumber: resultPayload.targetNumber,
        displayNumber: resultPayload.displayNumber,
        bankName: type === 'bank' ? bankName : '',
        mode,
        period: resultPayload.period,
        ownerName: resultPayload.ownerName,
        ownerBirthInfo,
        analysisSnapshot: resultPayload.analysisSnapshot
      });

      await record.save();

      // Cập nhật thống kê O(1)
      UserStatsService.incrementRecordCount(userId, 'numerology', 1);

      // Xóa cache lịch sử
      MemoryCacheService.clearUserHistoryCache(userId);

      // Thông báo Admin qua SSE
      try {
        const sseService = require('../../../core/services/SseService');
        sseService.sendToAdmins('new_calculation', { type: 'numerology', userId, recordId: record._id });
      } catch (e) {}

      releaseRedisLock(lockKey, lockToken);

      return res.json({
        ...resultPayload,
        recordId: record._id,
        _id: record._id,
        userId: record.userId,
        type: record.type,
        mode: record.mode,
        bankName: record.bankName,
        isPublic: record.isPublic,
        createdAt: record.createdAt
      });
    } catch (error) {
      if (lockKey) {
        releaseRedisLock(lockKey, lockToken);
      }
      console.error('Numerology Calculate Error:', error);
      return res.status(500).json({ error: error.message || 'Lỗi xử lý phân tích phong thủy số.' });
    }
  }

  /**
   * Lấy chi tiết bản ghi theo ID
   */
  static async getRecord(req, res) {
    try {
      const { id } = req.params;
      const record = req.record || await findByIdFlex(NumerologyRecord, id);
      if (!record || record.isDeleted) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi Phong Thủy Số.' });
      }
      return res.json(record);
    } catch (error) {
      console.error('Numerology getRecord Error:', error);
      return res.status(500).json({ error: 'Lỗi lấy thông tin bản ghi.' });
    }
  }

  /**
   * Lấy danh sách lịch sử của người dùng
   */
  static async getHistory(req, res) {
    try {
      const { userId } = req.params;
      if (!userId) return res.status(400).json({ error: 'User ID is required' });

      const limit = parseInt(req.query.limit, 10) || 100;
      const { buildFilterQuery } = require('../../../core/services/HistoryQueryHelper');
      const query = buildFilterQuery('numerology', req.query, userId);

      const records = await NumerologyRecord.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .select('-analysisSnapshot -aiInterpretation')
        .limit(limit)
        .lean();

      return res.json(records);
    } catch (error) {
      console.error('Numerology getHistory Error:', error);
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

      const updated = await updateByIdFlex(NumerologyRecord, id, {
        rating,
        feedback: feedback || ''
      });

      if (!updated) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
      }

      return res.json({ message: 'Đánh giá thành công.', rating: updated.rating });
    } catch (error) {
      console.error('Numerology rateRecord Error:', error);
      return res.status(500).json({ error: 'Lỗi lưu đánh giá.' });
    }
  }

  /**
   * Bật/Tắt chia sẻ công khai bản ghi
   */
  static async togglePublic(req, res) {
    try {
      const { id } = req.params;
      const record = await findByIdFlex(NumerologyRecord, id);
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

      // Ping Google Indexing API
      try {
        const url = `${process.env.APP_URL || 'https://phongthuy.vn'}/numerology/record/${record._id}`;
        if (newPublicState) {
          GoogleIndexingService.notifyUrlUpdated(url);
        } else {
          GoogleIndexingService.notifyUrlDeleted(url);
        }
      } catch (e) {}

      return res.json({ isPublic: record.isPublic });
    } catch (error) {
      console.error('Numerology togglePublic Error:', error);
      return res.status(500).json({ error: 'Lỗi cập nhật trạng thái chia sẻ.' });
    }
  }

  /**
   * Xóa mềm bản ghi
   */
  static async deleteRecord(req, res) {
    try {
      const { id } = req.params;
      const record = await findByIdFlex(NumerologyRecord, id);
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
      UserStatsService.incrementRecordCount(record.userId, 'numerology', -1);
      MemoryCacheService.clearUserHistoryCache(record.userId);

      return res.json({ message: 'Xóa bản ghi thành công.' });
    } catch (error) {
      console.error('Numerology deleteRecord Error:', error);
      return res.status(500).json({ error: 'Lỗi xóa bản ghi.' });
    }
  }
}

module.exports = NumerologyController;
