const BaziAnalyzer = require('../../services/BaziAnalyzer');

class BaziEngine {
  /**
   * Lập lá số Bát Tự thô
   * @param {Object} params { date, time, gender }
   * @returns {Object} Dữ liệu Bát Tự thô
   */
  generate(params) {
    const { date, time, gender } = params;
    return BaziAnalyzer.analyze(date, time, parseInt(gender));
  }
}

module.exports = BaziEngine;
