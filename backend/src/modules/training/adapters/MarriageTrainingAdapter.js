const BaseTrainingAdapter = require('./BaseTrainingAdapter');
const MarriageRecord = require('../../bazi/models/MarriageRecord');

class MarriageTrainingAdapter extends BaseTrainingAdapter {
  constructor() {
    super({
      system: 'marriage',
      displayName: 'Hợp Hôn Mệnh Lý',
      outputFileName: 'dataset_hophon_from_mongo.jsonl',
      minOutputLength: 800
    });
  }

  getModel() {
    return MarriageRecord;
  }

  getInstruction() {
    return 'Bạn là bậc thầy Hợp Hôn Mệnh Lý phương Đông. Hãy phân tích mức độ tương hợp Bát Tự, Can Chi, Ngũ Hành và Cung Phi của cặp đôi sau:';
  }

  buildTrainingInput(record) {
    const maleInfo = record.inputInfo?.male || {};
    const femaleInfo = record.inputInfo?.female || {};

    const mBazi = record.maleBaziData?.canChi || {};
    const fBazi = record.femaleBaziData?.canChi || {};

    const formatPillars = (canChi) => {
      const y = canChi.year?.canChi || `${canChi.year?.gan || ''} ${canChi.year?.zhi || ''}`.trim() || 'Không rõ';
      const m = canChi.month?.canChi || `${canChi.month?.gan || ''} ${canChi.month?.zhi || ''}`.trim() || 'Không rõ';
      const d = canChi.day?.canChi || `${canChi.day?.gan || ''} ${canChi.day?.zhi || ''}`.trim() || 'Không rõ';
      const h = canChi.hour?.canChi || `${canChi.hour?.gan || ''} ${canChi.hour?.zhi || ''}`.trim() || 'Không rõ';
      return `Năm ${y}, Tháng ${m}, Ngày ${d}, Giờ ${h}`;
    };

    let inputStr = `Hồ sơ Hợp Hôn Nam Nữ:\n`;
    inputStr += `- Nam mệnh sinh ngày ${maleInfo.date || 'Không rõ'} lúc ${maleInfo.time || 'Không rõ'}.\n`;
    inputStr += `  Tứ Trụ Nam: ${formatPillars(mBazi)}.\n`;
    inputStr += `- Nữ mệnh sinh ngày ${femaleInfo.date || 'Không rõ'} lúc ${femaleInfo.time || 'Không rõ'}.\n`;
    inputStr += `  Tứ Trụ Nữ: ${formatPillars(fBazi)}.\n`;

    return inputStr.trim();
  }
}

module.exports = MarriageTrainingAdapter;
