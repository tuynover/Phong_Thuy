const fs = require('fs');
const path = require('path');
const logger = require('../../../core/services/LoggerService');

class GoogleDriveSyncService {
  /**
   * Tự động quét và phát hiện các thư mục Google Drive đang gắn trên máy chủ/máy tính
   */
  static getTargetDirectories() {
    const isWindows = process.platform === 'win32';
    const envDir = process.env.GOOGLE_DRIVE_DATASET_DIR || process.env.DATASET_EXPORT_DIR;

    const candidateDirs = [
      // 1. Ưu tiên biến môi trường cấu hình động trên server Linux/Docker
      envDir,
      // 2. Đường dẫn máy Windows (khi chạy ở máy dev/local)
      isWindows ? 'H:\\My Drive\\phong_thuy_train_ai\\dataset_train' : null,
      isWindows ? 'G:\\My Drive\\phong_thuy_train_ai\\dataset_train' : null,
      // 3. Đường dẫn mount chuẩn trên Linux server (rclone / fuse / docker volume)
      !isWindows ? '/mnt/gdrive/phong_thuy_train_ai/dataset_train' : null,
      !isWindows ? '/app/data/dataset_train' : null,
      // 4. Luôn ghi vào thư mục đệm cục bộ của backend (chạy được trên mọi hệ điều hành)
      path.join(__dirname, '../../../../data/dataset_train')
    ].filter(Boolean);

    const validDirs = candidateDirs.filter(dir => {
      try {
        const parent = path.dirname(dir);
        return fs.existsSync(parent) || fs.existsSync(dir);
      } catch (e) {
        return false;
      }
    });

    return Array.from(new Set(validDirs));
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
        const fileContent = samples.map(sample => JSON.stringify(sample)).join('\n') + '\n';
        fs.writeFileSync(filePath, fileContent, 'utf8');
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
