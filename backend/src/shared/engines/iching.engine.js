const IChingCalculator = require('../../modules/kinh-dich/calculator');

class IChingEngine {
  /**
   * Lập quẻ Kinh Dịch
   * @param {Object} params { lines }
   * @returns {Object} Dữ liệu quẻ dịch thô
   */
  generate(params) {
    const { lines } = params;
    return IChingCalculator.calculate({ lines });
  }
}

module.exports = IChingEngine;
