const IChingDataService = require('../../services/IChingDataService');

class IChingCalculator {
  /**
   * Lập quẻ dịch lý thô (Deterministic)
   * @param {Object} params { lines: Array }
   * @returns {Object} Dữ liệu Dịch Lý thô
   */
  static calculate(params) {
    return IChingDataService.calculate(params);
  }
}

module.exports = IChingCalculator;
