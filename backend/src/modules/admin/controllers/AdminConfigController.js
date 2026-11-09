const ConfigService = require('../../../core/services/ConfigService');
const logger = require('../../../core/services/LoggerService');

class AdminConfigController {
  /**
   * Lấy danh sách cấu hình hệ thống (đã che giấu mặt nạ cho các key bí mật)
   */
  static async getConfigs(req, res) {
    try {
      const configs = await ConfigService.getMaskedConfigs();
      return res.json({
        success: true,
        configs
      });
    } catch (error) {
      logger.error('[AdminConfigController.getConfigs] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải danh sách cấu hình hệ thống.' });
    }
  }

  /**
   * Cập nhật danh sách cấu hình và tự động kích hoạt Hot-Reload
   */
  static async updateConfigs(req, res) {
    try {
      const { configs } = req.body;
      if (!Array.isArray(configs)) {
        return res.status(400).json({ error: 'Dữ liệu cấu hình gửi lên phải là danh sách mảng.' });
      }

      const updatedBy = req.user?.email || req.user?.name || 'admin';
      const result = await ConfigService.updateConfigs(configs, updatedBy);

      return res.json(result);
    } catch (error) {
      logger.error('[AdminConfigController.updateConfigs] Error:', error);
      return res.status(500).json({ error: error.message || 'Lỗi cập nhật cấu hình hệ thống.' });
    }
  }

  /**
   * Kiểm tra khả năng kết nối và độ trễ tới Google Gemini AI
   */
  static async testAiConnection(req, res) {
    try {
      const { apiKey, model } = req.body;
      const result = await ConfigService.testGeminiConnection({ apiKey, model });
      return res.json(result);
    } catch (error) {
      logger.error('[AdminConfigController.testAiConnection] Error:', error);
      return res.status(500).json({ error: error.message || 'Lỗi kiểm tra kết nối AI.' });
    }
  }

  /**
   * Kiểm tra kết nối tới máy chủ SMTP gửi thư OTP
   */
  static async testSmtpConnection(req, res) {
    try {
      const { host, port, user, pass } = req.body;
      const result = await ConfigService.testSmtpConnection({ host, port, user, pass });
      return res.json(result);
    } catch (error) {
      logger.error('[AdminConfigController.testSmtpConnection] Error:', error);
      return res.status(500).json({ error: error.message || 'Lỗi kiểm tra kết nối SMTP.' });
    }
  }
}

module.exports = AdminConfigController;
