const HexagramDataService = require('../../services/HexagramDataService');

class IChingCalculator {
  /**
   * Lập quẻ dịch lý thô (Deterministic)
   * @param {Object} params { lines: Array }
   * @returns {Object} Dữ liệu Dịch Lý thô
   */
  static calculate(params) {
    return HexagramDataService.calculate(params);
  }
}

module.exports = IChingCalculator;
