const BaziAnalyzer = require('../../services/BaziAnalyzer');

class BaziCalculator {
  /**
   * Lập bản đồ Tứ Trụ Bát Tự thô (Deterministic)
   * @param {string} date 'DD/MM/YYYY'
   * @param {string} time 'HH:MM'
   * @param {number} gender 1 (Nam) | 0 (Nữ)
   * @returns {Object} Dữ liệu Bát Tự thô
   */
  static calculate(date, time, gender) {
    return BaziAnalyzer.analyze(date, time, gender);
  }
}

module.exports = BaziCalculator;
