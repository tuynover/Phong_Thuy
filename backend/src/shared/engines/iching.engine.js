const IChingDataService = require('../../services/IChingDataService');

class IChingEngine {
  /**
   * Lập quẻ Kinh Dịch
   * @param {Object} params { lines }
   * @returns {Object} Dữ liệu quẻ dịch thô
   */
  generate(params) {
    const { lines } = params;
    return IChingDataService.calculate({ lines });
  }
}

module.exports = IChingEngine;
