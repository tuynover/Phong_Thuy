/**
 * PdfTemplateService.js - Facade Điều Phối Xuất Bản PDF Phong Thủy & Mệnh Lý
 * Tích hợp kiến trúc Modular Template:
 * - Bát Tự (baziTemplate.js)
 * - Tử Vi (ziweiTemplate.js)
 * - Kinh Dịch (ichingTemplate.js)
 * - Hợp Hôn (marriageTemplate.js)
 * - Định dạng & Tiện ích in ấn (templateUtils.js, templateStyles.js)
 */

const { generateBaziHtml } = require('../templates/baziTemplate');
const { generateZiweiHtml } = require('../templates/ziweiTemplate');
const { generateIChingHtml } = require('../templates/ichingTemplate');
const { generateMarriageHtml } = require('../templates/marriageTemplate');
const { parseInterpretationSections } = require('../templates/templateUtils');

module.exports = {
  generateBaziHtml,
  generateZiweiHtml,
  generateIChingHtml,
  generateMarriageHtml,
  parseInterpretationSections
};
