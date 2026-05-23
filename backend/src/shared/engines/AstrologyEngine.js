const IztroEngine = require('./iztro.engine');
const BaziEngine = require('./bazi.engine');
const IChingEngine = require('./iching.engine');

const engines = {
  tu_vi: new IztroEngine(),
  bat_tu: new BaziEngine(),
  kinh_dich: new IChingEngine()
};

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
    const engine = engines[system];
    if (!engine) {
      throw new Error(`Astrology Engine cho phân hệ '${system}' chưa được đăng ký.`);
    }
    return engine.generate(params);
  }
}

module.exports = AstrologyEngine;
