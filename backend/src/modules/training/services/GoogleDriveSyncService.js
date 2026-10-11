const fs = require('fs');
const path = require('path');
const logger = require('../../../core/services/LoggerService');

class GoogleDriveSyncService {
  /**
   * Tự động quét và phát hiện các thư mục Google Drive đang gắn trên máy chủ/máy tính
   */
  static getTargetDirectories() {
    const candidateDirs = [
      'H:\\My Drive\\phong_thuy_train_ai\\dataset_train',
      'G:\\My Drive\\phong_thuy_train_ai\\dataset_train',
      path.join(__dirname, '../../../../data/dataset_train')
    ];

    const validDirs = candidateDirs.filter(dir => {
      try {
        const parent = path.dirname(dir);
        return fs.existsSync(parent);
      } catch (e) {
        return false;
      }
    });

    return validDirs;
  }

  /**
   * Ghi danh sách các mẫu huấn luyện ra file JSONL ở tất cả các thư mục đích
   * @param {string} fileName - Tên file (ví dụ: dataset_battu_from_mongo.jsonl)
   * @param {Array<Object>} samples - Danh sách mẫu JSON
   */
  static writeDataset(fileName, samples) {
    const targets = this.getTargetDirectories();
    const writtenPaths = [];

    if (!targets || targets.length === 0) {
      logger.warn('[GoogleDriveSyncService] Không tìm thấy thư mục lưu trữ nào.');
      return { success: false, writtenPaths: [] };
    }

    for (const dir of targets) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const filePath = path.join(dir, fileName);
        const stream = fs.createWriteStream(filePath, { flags: 'w', encoding: 'utf8' });

        for (const sample of samples) {
          stream.write(JSON.stringify(sample) + '\n');
        }
        stream.end();
        writtenPaths.push(filePath);
        logger.info(`[GoogleDriveSyncService] Đã đồng bộ thành công: ${filePath} (${samples.length} mẫu)`);
      } catch (err) {
        logger.error(`[GoogleDriveSyncService] Lỗi khi ghi file vào ${dir}:`, err);
      }
    }

    return {
      success: writtenPaths.length > 0,
      writtenPaths
    };
  }
}

module.exports = GoogleDriveSyncService;
