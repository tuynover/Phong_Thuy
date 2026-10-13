const BaseTrainingAdapter = require('./BaseTrainingAdapter');
const FeiXingRecord = require('../../feixing/models/FeiXingRecord');

class FeiXingTrainingAdapter extends BaseTrainingAdapter {
  constructor() {
    super({
      system: 'feixing',
      displayName: 'Huyền Không Phi Tinh',
      outputFileName: 'dataset_huyenkhong_from_mongo.jsonl',
      minOutputLength: 500
    });
  }

  getModel() {
    return FeiXingRecord;
  }

  getInstruction() {
    return 'Bạn là bậc thầy Phong Thủy Huyền Không Phi Tinh. Hãy phân tích tinh bàn, cửu cung bát quái và đưa ra phương án bố trí không gian, hóa giải hung sát cho trạch bàn sau:';
  }

  buildTrainingInput(record) {
    const title = record.title || 'Trạch bàn Nhà ở';
    const period = record.period || 9;
    const sitting = record.sittingMountain || 'Không rõ';
    const facing = record.facingMountain || 'Không rõ';
    const facingDegree = record.facingDegree !== undefined ? `${record.facingDegree}°` : '';
    const sittingDegree = record.sittingDegree !== undefined ? `${record.sittingDegree}°` : '';
    const chartType = record.chartType || 'Chính hướng';

    let inputStr = `Hồ sơ Phong Thủy Huyền Không: ${title}\n`;
    inputStr += `Vận xây dựng/nhập trạch: Vận ${period}\n`;
    inputStr += `Tọa độ la kinh: Tọa ${sitting} (${sittingDegree}) Hướng ${facing} (${facingDegree})\n`;
    inputStr += `Cấu trúc tinh bàn: ${chartType}\n`;

    return inputStr.trim();
  }
}

module.exports = FeiXingTrainingAdapter;
