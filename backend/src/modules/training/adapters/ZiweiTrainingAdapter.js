const BaseTrainingAdapter = require('./BaseTrainingAdapter');
const ZiweiRecord = require('../../ziwei/models/ZiweiRecord');

class ZiweiTrainingAdapter extends BaseTrainingAdapter {
  constructor() {
    super({
      system: 'ziwei',
      displayName: 'Tử Vi Đẩu Số',
      outputFileName: 'dataset_tuvi_from_mongo.jsonl',
      minOutputLength: 800
    });
  }

  getModel() {
    return ZiweiRecord;
  }

  getInstruction() {
    return 'Bạn là bậc thầy Tử Vi Đẩu Số uyên bác. Hãy phân tích bản mệnh, cục số, cung Mệnh Thân và các cường cung trong lá số Tử Vi sau:';
  }

  buildTrainingInput(record) {
    const info = record.inputInfo || {};
    const cd = record.chartData || {};

    const gender = info.gender || (cd.gender === 'Nam' ? 'Nam mệnh' : 'Nữ mệnh') || 'Đương số';
    const birthDate = info.date || cd.solarDate || 'Không rõ';
    const birthHour = info.hour !== undefined ? `Giờ ${info.hour}` : '';

    let inputStr = `Lá số Tử Vi: ${gender}, sinh ngày ${birthDate} ${birthHour}.\n`.trim() + '\n';
    inputStr += `Mệnh Chủ: ${cd.soul || 'Không rõ'}, Thân Chủ: ${cd.body || 'Không rõ'}, Cục: ${cd.fiveElementsClass || 'Không rõ'}.\n`;

    if (Array.isArray(cd.palaces) && cd.palaces.length > 0) {
      inputStr += 'Thập Nhị Cung Chức:\n';
      cd.palaces.forEach(p => {
        const major = (p.majorStars || []).map(s => `${s.name}${s.brightness ? ' (' + s.brightness + ')' : ''}`).join(', ');
        const minor = (p.minorStars || []).map(s => s.name).join(', ');
        let palaceDetails = major ? major : 'Vô chính diệu';
        if (minor) palaceDetails += ` | Phụ tinh: ${minor}`;
        inputStr += `- Cung ${p.name}: ${palaceDetails}\n`;
      });
    }

    return inputStr.trim();
  }
}

module.exports = ZiweiTrainingAdapter;
