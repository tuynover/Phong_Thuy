class IChingEngine {
  constructor(dataService = null) {
    this._dataService = dataService;
  }

  get dataService() {
    if (!this._dataService) {
      this._dataService = require('../../modules/iching/services/IChingDataService');
    }
    return this._dataService;
  }

  /**
   * Lập quẻ Kinh Dịch
   * @param {Object} params { lines }
   * @returns {Object} Dữ liệu quẻ dịch thô
   */
  generate(params) {
    const { lines } = params;
    return this.dataService.calculate({ lines });
  }
}

module.exports = IChingEngine;
