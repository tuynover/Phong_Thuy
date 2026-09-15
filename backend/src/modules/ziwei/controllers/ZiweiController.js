const ZiweiRecord = require('../models/ZiweiRecord');
const ZiweiFormatter = require('../services/ZiweiFormatter');
const ZiweiCache = require('../services/ZiweiCache');
const AstrologyEngine = require('../../../shared/engines/AstrologyEngine');
const InputValidator = require('../../../core/services/InputValidator');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const UserStatsService = require('../../../core/services/UserStatsService');
const { acquireRedisLock, releaseRedisLock } = require('../../../core/config/redis');
const { v7: uuidv7 } = require('uuid');

class ZiweiController {
  /**
   * Tạo đồ hình lá số thô (Deterministic)
   */
  static async createChart(req, res) {
    let lockKey = null;
    let lockToken = null;
    try {
      const valResult = InputValidator.validateZiweiInput(req.body);
      if (!valResult.isValid) {
        return res.status(400).json({ error: valResult.error });
      }

      let { date, hour, gender, timezone, school, calendarType, name, calendarMode = 'solar', isLeap } = valResult.sanitized;
      const userId = req.body.userId || 'guest';
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];
      const rawDate = req.body.date;

      if (calendarMode === 'lunar') {
        const { Lunar } = require('lunar-javascript');
        const parts = date.split('-');
        const yNum = parseInt(parts[0], 10);
        const mNum = parseInt(parts[1], 10);
        const dNum = parseInt(parts[2], 10);
        
        const lunarObj = Lunar.fromYmd(yNum, isLeap ? -mNum : mNum, dNum);
        const solarObj = lunarObj.getSolar();
        
        date = `${solarObj.getYear()}-${String(solarObj.getMonth()).padStart(2, '0')}-${String(solarObj.getDay()).padStart(2, '0')}`;
      }

      const chartHash = ZiweiCache.generateChartHash({ date, hour, gender, timezone, school, calendarType });
      lockKey = `inflight:ziwei:${userId}:${chartHash}`;

      lockToken = await acquireRedisLock(lockKey, 2500);
      if (!lockToken) {
        return res.status(429).json({
          error: 'Yêu cầu của bạn đang được hệ thống xử lý, vui lòng không nhấn gửi liên tục.'
        });
      }
      if (typeof res.on === 'function') {
        res.on('finish', () => {
          releaseRedisLock(lockKey, lockToken);
        });
      }

      const rawAstrolabe = AstrologyEngine.generate('tu_vi', { date, hour, gender, lang: 'vi-VN' });
      
      const recordId = uuidv7();
      const metadata = { engine_version: "1.0.0", prompt_version: "tv_prompt_v1", knowledge_version: "tv_know_v1", calendar_type: calendarType, school, timezone };
      const formattedOutput = ZiweiFormatter.toStandardOutput(rawAstrolabe, recordId, metadata);

      const formattedName = name?.trim() || `Tử Vi - ${gender} Mệnh`;

      const inputInfo = { 
        name: formattedName, 
        date, 
        hour, 
        gender, 
        timezone, 
        school, 
        calendarType,
        calendarMode,
        isLeap,
        lunarDate: calendarMode === 'lunar' ? rawDate : ''
      };

      const newRecord = await ZiweiRecord.create({
        _id: recordId,
        userId,
        system: 'ziwei',
        idempotencyKey: idempotencyKey || `${userId}:${chartHash}:${Date.now()}`,
        inputInfo,
        chartHash,
        chartData: formattedOutput.chart_data,
        aiInterpretation: { summary: "", sections: [] }
      });

      UserStatsService.incrementRecordCount(userId, 'ziwei', 1);
      
      MemoryCacheService.clearUserHistoryCache(userId);

      try {
        const sseService = require('../../../core/services/SseService');
        sseService.sendToAdmins('new_calculation', { type: 'ziwei', userId, recordId: newRecord._id });
      } catch (e) {}

      releaseRedisLock(lockKey, lockToken);
      return res.json(newRecord);
    } catch (error) {
      if (lockKey) {
        releaseRedisLock(lockKey, lockToken);
      }
      console.error("[ZiweiController.createChart] Error:", error);
      return res.status(500).json({ error: error.message || 'Lỗi xảy ra khi tính toán lá số Tử Vi.' });
    }
  }
}

module.exports = ZiweiController;
