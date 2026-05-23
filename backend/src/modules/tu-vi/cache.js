const crypto = require('crypto');
const MemoryCacheService = require('../../services/MemoryCacheService');

class TuViCache {
  /**
   * Tạo mã hash độc nhất cho bộ máy lập lá số thô (deterministic)
   * @param {Object} params { date, hour, gender, timezone, school, calendarType }
   * @returns {string} SHA-256 hash
   */
  static generateChartHash(params) {
    const { date, hour, gender, timezone = 7, school = 'bac_phai', calendarType = 'solar' } = params;
    const rawString = `chart:${date}_${hour}_${gender}_${timezone}_${school}_${calendarType}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  /**
   * Tạo mã hash độc nhất cho bài luận AI giải đoán (generative)
   * @param {string} chartHash Mã băm của lá số thô
   * @param {Object} params { promptVersion, model, lang, knowledgeVersion }
   * @returns {string} SHA-256 hash
   */
  static generateAiHash(chartHash, params) {
    const { promptVersion, model, lang = 'vi-VN', knowledgeVersion = 'tv_know_v1' } = params;
    const rawString = `ai:${chartHash}_${promptVersion}_${model}_${lang}_${knowledgeVersion}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
  }

  // --- Tầng 1: Cache Đồ Hình Thô ---
  static getChart(chartHash) {
    return MemoryCacheService.get(`tu_vi:raw_chart:${chartHash}`);
  }

  static setChart(chartHash, chartData) {
    // Lá số thô không bao giờ thay đổi, lưu trữ trong RAM lâu dài (24h)
    MemoryCacheService.set(`tu_vi:raw_chart:${chartHash}`, chartData, 86400000);
  }

  // --- Tầng 2: Cache Bài Luận AI ---
  static getInterpretation(aiHash) {
    return MemoryCacheService.get(`tu_vi:ai_interp:${aiHash}`);
  }

  static setInterpretation(aiHash, interpretationData) {
    // Bài luận AI lưu trữ trong 12h
    MemoryCacheService.set(`tu_vi:ai_interp:${aiHash}`, interpretationData, 43200000);
  }

  /**
   * Hủy bỏ toàn bộ cache của một lá số cụ thể khi có sửa đổi
   * @param {string} chartHash 
   */
  static invalidate(chartHash) {
    if (!chartHash) return;
    // Xóa cache đồ hình
    MemoryCacheService.delete(`tu_vi:raw_chart:${chartHash}`);
    // Xóa tất cả cache AI luận giải của lá số này (sử dụng prefix)
    MemoryCacheService.deleteByPrefix(`tu_vi:ai_interp:${chartHash}`);
  }
}

module.exports = TuViCache;
