const DatasetPipelineManager = require('../services/DatasetPipelineManager');
const logger = require('../../../core/services/LoggerService');

class TrainingController {
  /**
   * Lấy báo cáo trạng thái dataset của toàn bộ các phân hệ
   * GET /api/training/status
   */
  static async getStatus(req, res) {
    try {
      const status = await DatasetPipelineManager.getStatus();
      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (err) {
      logger.error('[TrainingController] getStatus error:', err);
      return res.status(500).json({ error: err.message || 'Lỗi khi lấy trạng thái dataset.' });
    }
  }

  /**
   * Kích hoạt xuất dataset theo phân hệ hoặc tất cả
   * POST /api/training/export/:system?
   */
  static async exportDataset(req, res) {
    try {
      const { system } = req.params;
      if (system && system !== 'all') {
        const result = await DatasetPipelineManager.exportDiscipline(system, { force: true });
        return res.status(200).json({
          success: true,
          message: `Đã kích hoạt xuất dataset cho phân hệ [${system}].`,
          result
        });
      }

      const results = await DatasetPipelineManager.exportAll({ force: true });
      return res.status(200).json({
        success: true,
        message: 'Đã kích hoạt xuất dataset cho toàn bộ các phân hệ.',
        results
      });
    } catch (err) {
      logger.error('[TrainingController] exportDataset error:', err);
      return res.status(500).json({ error: err.message || 'Lỗi khi xuất dataset.' });
    }
  }

  /**
   * Kích hoạt xuất file dataset tổng hợp đa môn
   * POST /api/training/export-combined
   */
  static async exportCombined(req, res) {
    try {
      const result = await DatasetPipelineManager.exportCombined();
      return res.status(200).json({
        success: true,
        message: 'Đã xuất file dataset tổng hợp đa môn thành công.',
        result
      });
    } catch (err) {
      logger.error('[TrainingController] exportCombined error:', err);
      return res.status(500).json({ error: err.message || 'Lỗi khi xuất dataset tổng hợp.' });
    }
  }
}

module.exports = TrainingController;
