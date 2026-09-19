const IztroEngine = require('./iztro.engine');

const engines = {
  tu_vi: new IztroEngine()
};

function getEngine(system) {
  if (engines[system]) return engines[system];
  if (system === 'bat_tu') {
    const BaziEngine = require('./bazi.engine');
    engines[system] = new BaziEngine();
    return engines[system];
  }
  if (system === 'kinh_dich') {
    const IChingEngine = require('./iching.engine');
    engines[system] = new IChingEngine();
    return engines[system];
  }
  return null;
}

class AstrologyEngine {
  /**
   * Đăng ký một bộ máy tính toán mới
   * @param {string} system Tên phân hệ ('tu_vi', 'bat_tu', 'kinh_dich')
   * @param {Object} engineInstance Thực thể lớp engine
   */
  static register(system, engineInstance) {
    engines[system] = engineInstance;
  }

  /**
   * Gọi lập biểu đồ / lá số / quẻ
   * @param {string} system Tên phân hệ ('tu_vi', 'bat_tu', 'kinh_dich')
   * @param {Object} params Tham số đầu vào cụ thể của từng bộ máy
   * @returns {Object} Kết quả lá số thô từ engine
   */
  static generate(system, params) {
    const engine = getEngine(system);
    if (!engine) {
      throw new Error(`Astrology Engine cho phân hệ '${system}' chưa được đăng ký.`);
    }
    return engine.generate(params);
  }
}

module.exports = AstrologyEngine;
