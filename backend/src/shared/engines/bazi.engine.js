class BaziEngine {
  constructor(analyzer = null) {
    this._analyzer = analyzer;
  }

  get analyzer() {
    if (!this._analyzer) {
      this._analyzer = require('../../modules/bazi/services/BaziAnalyzer');
    }
    return this._analyzer;
  }

  /**
   * Lập lá số Bát Tự thô
   * @param {Object} params { date, time, gender }
   * @returns {Object} Dữ liệu Bát Tự thô
   */
  generate(params) {
    const { date, time, gender } = params;
    return this.analyzer.analyze(date, time, parseInt(gender));
  }
}

module.exports = BaziEngine;
