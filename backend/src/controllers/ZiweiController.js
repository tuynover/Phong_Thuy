const ZiweiRecord = require('../models/ZiweiRecord');
const ZiweiFormatter = require('../services/ZiweiFormatter');
const ZiweiCache = require('../services/ZiweiCache');
const AstrologyEngine = require('../shared/engines/AstrologyEngine');
const InputValidator = require('../services/InputValidator');
const MemoryCacheService = require('../services/MemoryCacheService');
const mongoose = require('mongoose');

class ZiweiController {
  /**
   * Tạo đồ hình lá số thô (Deterministic)
   */
  static async createChart(req, res) {
    try {
      const valResult = InputValidator.validateZiweiInput(req.body);
      if (!valResult.isValid) {
        return res.status(400).json({ error: valResult.error });
      }

      let { date, hour, gender, timezone, school, calendarType, name, calendarMode = 'solar', isLeap } = valResult.sanitized;
      const userId = req.body.userId || 'guest';
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];
      const rawDate = req.body.date; // Ngày âm lịch gốc dạng chuỗi từ client

      if (calendarMode === 'lunar') {
        const { Lunar } = require('lunar-javascript');
        const parts = date.split('-');
        const yNum = parseInt(parts[0], 10);
        const mNum = parseInt(parts[1], 10);
        const dNum = parseInt(parts[2], 10);
        
        const lunarObj = Lunar.fromYmd(yNum, isLeap ? -mNum : mNum, dNum);
        const solarObj = lunarObj.getSolar();
        
        // Quy đổi sang dương lịch YYYY-MM-DD
        date = `${solarObj.getYear()}-${String(solarObj.getMonth()).padStart(2, '0')}-${String(solarObj.getDay()).padStart(2, '0')}`;
      }

      // Chống spam 10 request đồng thời cùng bộ dữ liệu (In-Flight Concurrency Protection 2.5s)
      const { acquireRedisLock, releaseRedisLock } = require('../config/redis');
      const chartHash = ZiweiCache.generateChartHash({ date, hour, gender, timezone, school, calendarType });
      const lockKey = `inflight:ziwei:${userId}:${chartHash}`;

      const acquired = await acquireRedisLock(lockKey, 2500);
      if (!acquired) {
        return res.status(429).json({
          error: 'Yêu cầu của bạn đang được hệ thống xử lý, vui lòng không nhấn gửi liên tục.'
        });
      }
      res.on('finish', () => {
        releaseRedisLock(lockKey);
      });

      // 3. Chạy bộ máy tính toán an sao thô độc lập
      const rawAstrolabe = AstrologyEngine.generate('tu_vi', { date, hour, gender, lang: 'vi-VN' });
      
      // 4. Tạo ID mới và chuẩn hóa dữ liệu Standard Output
      const { v7: uuidv7 } = require('uuid');
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

      // 5. Lưu bản ghi thô vào database
      const newRecord = await ZiweiRecord.create({
        _id: recordId,
        userId,
        system: 'ziwei',
        idempotencyKey: idempotencyKey || `${userId}:${chartHash}`,
        inputInfo,
        chartHash,
        chartData: formattedOutput.chart_data,
        aiInterpretation: { summary: "", sections: [] }
      });

      // 5. Thiết lập cache và trả về
      ZiweiCache.setChart(chartHash, newRecord);

      // Increment user ziwei record count O(1)
      const UserStatsService = require('../services/UserStatsService');
      UserStatsService.incrementRecordCount(userId, 'ziwei', 1);
      
      // Hủy cache lịch sử cũ của người dùng này để tải danh sách mới
      MemoryCacheService.clearUserHistoryCache(userId);

      // Broadcast to admins
      const sseService = require('../services/SseService');
      sseService.sendToAdmins('new_calculation', { type: 'ziwei', userId, recordId: newRecord._id });

      return res.json(newRecord);
    } catch (error) {
      console.error("[ZiweiController.createChart] Error:", error);
      return res.status(500).json({ error: error.message || 'Lỗi xảy ra khi tính toán lá số Tử Vi.' });
    }
  }
}

module.exports = ZiweiController;
