const GoogleDriveSyncService = require('./GoogleDriveSyncService');
const SyncStateService = require('./SyncStateService');
const logger = require('../../../core/services/LoggerService');

// Nạp các Adapter bộ môn Phong Thủy
const BaziTrainingAdapter = require('../adapters/BaziTrainingAdapter');
const ZiweiTrainingAdapter = require('../adapters/ZiweiTrainingAdapter');
const IChingTrainingAdapter = require('../adapters/IChingTrainingAdapter');
const MarriageTrainingAdapter = require('../adapters/MarriageTrainingAdapter');
const FeiXingTrainingAdapter = require('../adapters/FeiXingTrainingAdapter');

class DatasetPipelineManager {
  constructor() {
    this.adapters = new Map();
    this.initDefaultAdapters();
  }

  /**
   * Khởi tạo và đăng ký sẵn các Adapter bộ môn cốt lõi
   */
  initDefaultAdapters() {
    this.registerAdapter(new BaziTrainingAdapter());
    this.registerAdapter(new ZiweiTrainingAdapter());
    this.registerAdapter(new IChingTrainingAdapter());
    this.registerAdapter(new MarriageTrainingAdapter());
    this.registerAdapter(new FeiXingTrainingAdapter());
  }

  /**
   * Đăng ký thêm một Adapter bộ môn mới (Hỗ trợ mở rộng không giới hạn)
   * @param {BaseTrainingAdapter} adapter
   */
  registerAdapter(adapter) {
    this.adapters.set(adapter.system, adapter);
  }

  /**
   * Lấy Adapter theo mã phân hệ
   * @param {string} system
   */
  getAdapter(system) {
    return this.adapters.get(system);
  }

  /**
   * Lấy danh sách tất cả các phân hệ đã đăng ký
   */
  getAllSystems() {
    return Array.from(this.adapters.keys());
  }

  /**
   * Xuất dataset của 1 bộ môn cụ thể
   * @param {string} system
   * @param {Object} options
   */
  async exportDiscipline(system, { force = false } = {}) {
    const adapter = this.getAdapter(system);
    if (!adapter) {
      throw new Error(`[DatasetPipelineManager] Phân hệ '${system}' chưa được đăng ký adapter.`);
    }

    logger.info(`[DatasetPipelineManager] Bắt đầu trích xuất dataset cho phân hệ [${adapter.displayName}]...`);
    const { samples, totalRaw, validCount } = await adapter.extractSamples();

    if (validCount === 0) {
      logger.warn(`[DatasetPipelineManager] Phân hệ [${adapter.displayName}] chưa có bài luận giải nào đạt tiêu chuẩn.`);
      return { success: false, system, totalRaw, validCount: 0 };
    }

    const syncResult = GoogleDriveSyncService.writeDataset(adapter.outputFileName, samples);
    if (syncResult.success) {
      SyncStateService.saveSystemState(system, totalRaw);
    }

    return {
      success: syncResult.success,
      system,
      displayName: adapter.displayName,
      outputFileName: adapter.outputFileName,
      totalRaw,
      validCount,
      targetPaths: syncResult.writtenPaths
    };
  }

  /**
   * Xuất toàn bộ dataset của TẤT CẢ các bộ môn
   * @param {Object} options
   */
  async exportAll({ force = false } = {}) {
    const results = {};
    for (const [system, adapter] of this.adapters.entries()) {
      try {
        results[system] = await this.exportDiscipline(system, { force });
      } catch (err) {
        logger.error(`[DatasetPipelineManager] Lỗi khi xuất phân hệ ${system}:`, err);
        results[system] = { success: false, error: err.message };
      }
    }
    return results;
  }

  /**
   * Xuất file TỔNG HỢP TOÀN BỘ CÁC BỘ MÔN (Cross-Domain Dataset)
   * Phục vụ bước huấn luyện Siêu AI Phong Thủy Đa Môn
   */
  async exportCombined() {
    logger.info('[DatasetPipelineManager] Đang tổng hợp dữ liệu toàn bộ các bộ môn...');
    const combinedSamples = [];
    const stats = {};

    for (const [system, adapter] of this.adapters.entries()) {
      try {
        const { samples, validCount } = await adapter.extractSamples();
        stats[system] = validCount;
        combinedSamples.push(...samples);
      } catch (err) {
        logger.error(`[DatasetPipelineManager] Lỗi khi nạp mẫu cho combined từ ${system}:`, err);
      }
    }

    if (combinedSamples.length === 0) {
      logger.warn('[DatasetPipelineManager] Không có mẫu nào để xuất file combined.');
      return { success: false, totalCount: 0 };
    }

    const combinedFileName = 'dataset_phongthuy_combined.jsonl';
    const syncResult = GoogleDriveSyncService.writeDataset(combinedFileName, combinedSamples);

    logger.info(`[DatasetPipelineManager] Đã xuất xong file tổng hợp đa môn: ${combinedSamples.length} mẫu.`);

    return {
      success: syncResult.success,
      combinedFileName,
      totalCount: combinedSamples.length,
      breakdown: stats,
      targetPaths: syncResult.writtenPaths
    };
  }

  /**
   * Hook được kích hoạt ngay khi một bài luận giải AI hoàn tất ở bất kỳ phân hệ nào
   * @param {string} system - Mã phân hệ vừa luận giải xong (bazi, ziwei, iching...)
   */
  async onInterpretationCompleted(system) {
    try {
      const adapter = this.getAdapter(system);
      if (!adapter) return;

      const Model = adapter.getModel();
      const currentCount = await Model.countDocuments({
        'aiInterpretation.content': { $exists: true, $ne: '' },
        isDeleted: { $ne: true }
      });

      const dueCheck = SyncStateService.isDue(system, currentCount, 3);
      if (dueCheck.isDue) {
        logger.info(`[DatasetPipelineManager] Phân hệ [${adapter.displayName}] đạt chu kỳ 3 ngày (Đã qua ${dueCheck.elapsedDays} ngày). Đang tự động xuất lên Google Drive...`);
        setImmediate(async () => {
          await this.exportDiscipline(system, { force: true });
        });
      }
    } catch (err) {
      logger.error(`[DatasetPipelineManager] Lỗi trong hook onInterpretationCompleted(${system}):`, err);
    }
  }

  /**
   * Hook được kích hoạt định kỳ mỗi ngày từ NotificationScheduler
   * Tự động quét tất cả các phân hệ và đồng bộ các phân hệ đã đến hạn 3 ngày
   */
  async checkAllDueSyncs() {
    try {
      for (const [system, adapter] of this.adapters.entries()) {
        const Model = adapter.getModel();
        const currentCount = await Model.countDocuments({
          'aiInterpretation.content': { $exists: true, $ne: '' },
          isDeleted: { $ne: true }
        });

        const dueCheck = SyncStateService.isDue(system, currentCount, 3);
        if (dueCheck.isDue) {
          logger.info(`[DatasetPipelineManager][Cron] Phân hệ [${adapter.displayName}] đến hạn đồng bộ (Đã qua ${dueCheck.elapsedDays} ngày, có ${currentCount} bản ghi).`);
          await this.exportDiscipline(system, { force: true });
        }
      }
    } catch (err) {
      logger.error('[DatasetPipelineManager] Lỗi khi chạy checkAllDueSyncs:', err);
    }
  }

  /**
   * Lấy báo cáo thống kê trạng thái của toàn bộ phân hệ
   */
  async getStatus() {
    const report = {};
    for (const [system, adapter] of this.adapters.entries()) {
      try {
        const Model = adapter.getModel();
        const totalRaw = await Model.countDocuments({ isDeleted: { $ne: true } });
        const withInterp = await Model.countDocuments({
          'aiInterpretation.content': { $exists: true, $ne: '' },
          isDeleted: { $ne: true }
        });
        const state = SyncStateService.getSystemState(system);
        const dueCheck = SyncStateService.isDue(system, withInterp, 3);

        report[system] = {
          displayName: adapter.displayName,
          outputFileName: adapter.outputFileName,
          totalRecords: totalRaw,
          withInterpretation: withInterp,
          lastSyncedCount: state.lastSyncedCount || 0,
          lastSyncedAt: state.lastSyncedAt || null,
          elapsedDays: dueCheck.elapsedDays || 0,
          isDue: dueCheck.isDue
        };
      } catch (err) {
        report[system] = { error: err.message };
      }
    }
    return report;
  }
}

// Khởi tạo Singleton
const instance = new DatasetPipelineManager();
module.exports = instance;
