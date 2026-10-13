const BaseTrainingAdapter = require('./BaseTrainingAdapter');
const IChingRecord = require('../../iching/models/IChingRecord');

class IChingTrainingAdapter extends BaseTrainingAdapter {
  constructor() {
    super({
      system: 'iching',
      displayName: 'Kinh Dịch Lục Hào',
      outputFileName: 'dataset_kinhdich_from_mongo.jsonl',
      minOutputLength: 500
    });
  }

  getModel() {
    return IChingRecord;
  }

  getInstruction() {
    return 'Bạn là bậc thầy Kinh Dịch Lục Hào cao cấp. Hãy phân tích quẻ chính, quẻ biến, hào động và ứng kỳ để biện chứng quẻ Dịch cho câu hỏi sau:';
  }

  buildTrainingInput(record) {
    const question = record.question || 'Chiêm bái công việc và tài vận.';
    const primary = record.primaryHexagram?.name || 'Không rõ';
    const transformed = record.transformedHexagram?.name || primary;
    const moving = Array.isArray(record.movingLines) && record.movingLines.length > 0
      ? record.movingLines.map(l => `Hào ${l}`).join(', ')
      : 'Tĩnh quẻ';

    let inputStr = `Câu hỏi chiêm bái: ${question}\n`;
    inputStr += `Quẻ Chính: ${primary}\n`;
    inputStr += `Quẻ Biến: ${transformed}\n`;
    inputStr += `Hào Động: ${moving}\n`;

    if (record.dateCast) {
      inputStr += `Thời điểm gieo: ${new Date(record.dateCast).toLocaleString('vi-VN')}\n`;
    }

    return inputStr.trim();
  }
}

module.exports = IChingTrainingAdapter;
