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

  /**
   * Dọn dẹp Docker images không sử dụng và tối ưu hóa tài nguyên máy chủ VPS
   */
  static async pruneDockerStorage(req, res) {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      let spaceReclaimed = '0 B';
      let message = 'Đã quét và kiểm tra tài nguyên máy chủ.';
      let isDockerAvailable = false;

      try {
        const { stdout } = await execAsync('docker image prune -f', { timeout: 15000, windowsHide: true });
        isDockerAvailable = true;
        const match = stdout.match(/Total reclaimed space:\s*([^\r\n]+)/i);
        if (match && match[1]) {
          spaceReclaimed = match[1].trim();
        }
        message = `Đã dọn dẹp Docker Images không sử dụng thành công. Dung lượng thực tế thu hồi: ${spaceReclaimed}`;
      } catch (dockerErr) {
        isDockerAvailable = false;
        spaceReclaimed = '0 B';
        message = 'Docker Daemon chưa kích hoạt trên môi trường này (Chức năng dọn dẹp Docker Images sẽ tự động kích hoạt khi chạy trên Production VPS có Docker).';
      }

      logger.info(`[AdminConfigController.pruneDockerStorage] DockerAvailable: ${isDockerAvailable}, Reclaimed: ${spaceReclaimed} by ${req.user?.email || 'admin'}`);
      return res.json({
        success: true,
        isDockerAvailable,
        message,
        spaceReclaimed
      });
    } catch (error) {
      logger.error('[AdminConfigController.pruneDockerStorage] Error:', error);
      return res.status(500).json({ error: error.message || 'Lỗi khi dọn dẹp tài nguyên máy chủ.' });
    }
  }
}

module.exports = AdminConfigController;
