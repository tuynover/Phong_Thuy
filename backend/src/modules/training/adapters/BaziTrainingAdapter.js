const BaseTrainingAdapter = require('./BaseTrainingAdapter');
const BaziRecord = require('../../bazi/models/BaziRecord');

class BaziTrainingAdapter extends BaseTrainingAdapter {
  constructor() {
    super({
      system: 'bazi',
      displayName: 'Bát Tự Tử Bình',
      outputFileName: 'dataset_battu_from_mongo.jsonl',
      minOutputLength: 800
    });
  }

  getModel() {
    return BaziRecord;
  }

  getInstruction() {
    return 'Bạn là bậc thầy Bát Tự Tử Bình uyên bác. Hãy phân tích ngũ hành, vượng suy của Nhật chủ, xác định Cách cục, định Dụng thần - Hỷ thần và luận giải vận hạn cho lá số sau:';
  }

  buildTrainingInput(record) {
    const info = record.inputInfo || {};
    const bazi = record.baziData || {};
    const canChi = bazi.canChi || {};

    const genderText = info.gender === 1 ? 'Nam mệnh' : (info.gender === 0 ? 'Nữ mệnh' : 'Đương số');
    const dateText = info.date || 'Không rõ';
    const timeText = info.time || 'Không rõ';

    const yearStr = canChi.year?.name || `${canChi.year?.can || ''} ${canChi.year?.chi || ''}`.trim() || 'Không rõ';
    const monthStr = canChi.month?.name || `${canChi.month?.can || ''} ${canChi.month?.chi || ''}`.trim() || 'Không rõ';
    const dayStr = canChi.day?.name || `${canChi.day?.can || ''} ${canChi.day?.chi || ''}`.trim() || 'Không rõ';
    const hourStr = canChi.hour?.name || `${canChi.hour?.can || ''} ${canChi.hour?.chi || ''}`.trim() || 'Không rõ';

    let inputStr = `${genderText}, sinh ngày ${dateText} lúc ${timeText}.\n`;
    inputStr += `Tứ Trụ: Năm ${yearStr}, Tháng ${monthStr}, Ngày ${dayStr}, Giờ ${hourStr}.\n`;

    if (bazi.tietKhiName) {
      inputStr += `Tiết khí: ${bazi.tietKhiName}.\n`;
    }

    if (bazi.dungThan || bazi.hyThan) {
      inputStr += `Dụng Thần: ${bazi.dungThan || 'Chưa định'}, Hỷ Thần: ${bazi.hyThan || 'Chưa định'}.\n`;
    }

    if (Array.isArray(bazi.daYun) && bazi.daYun.length > 0) {
      const daYunList = bazi.daYun
        .slice(0, 8)
        .map(dy => `${dy.canChi || (dy.gan + ' ' + dy.zhi)} (${dy.age || ''} tuổi)`)
        .filter(s => s.trim().length > 3)
        .join(', ');
      if (daYunList) {
        inputStr += `Đại vận: ${daYunList}.\n`;
      }
    }

    return inputStr.trim();
  }
}

module.exports = BaziTrainingAdapter;
