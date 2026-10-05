const BaseAiController = require('../../../core/ai/BaseAiController');
const NumerologyRecord = require('../models/NumerologyRecord');
const NumerologyPrompts = require('../services/NumerologyPrompts');
const { NUMEROLOGY_PROMPT_VERSION = 'v1_0_numerology_feixing_iching_bazi' } = require('../../../core/config/ai');

class NumerologyAiController {
  /**
   * Luận giải AI chuyên sâu Phong Thủy Số qua SSE Stream
   * Chỉ áp dụng khi bản ghi có phối Bát Tự ngày sinh
   */
  static async interpretNumerology(req, res) {
    const { findByIdFlex } = require('../../../core/services/HistoryQueryHelper');
    const record = await findByIdFlex(NumerologyRecord, req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Không tìm thấy bản ghi Phong Thủy Số.' });
    }
    if (record.mode !== 'bazi' || !record.analysisSnapshot?.baziCompatibility) {
      return res.status(400).json({
        error: 'Chức năng Luận giải AI chuyên sâu chỉ áp dụng cho hồ sơ có phối Bát Tự ngày sinh. Vui lòng khảo sát lại với chế độ Xem Phối Bát Tự.'
      });
    }
    req.record = record;

    return BaseAiController.handleInterpret(req, res, {
      RecordModel: NumerologyRecord,
      system: 'numerology',
      promptVersion: NUMEROLOGY_PROMPT_VERSION,
      notFoundMessage: 'Không tìm thấy bản ghi Phong Thủy Số.',
      errorMessage: 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Phong Thủy Số.',
      buildPrompt: async (rec) => {
        return NumerologyPrompts.getInterpretationPrompt(rec, rec.analysisSnapshot || {});
      }
    });
  }

  /**
   * Hỏi đáp AI tiếp nối về phong thủy số qua SSE Stream
   */
  static async chatNumerology(req, res) {
    return BaseAiController.handleChat(req, res, {
      RecordModel: NumerologyRecord,
      system: 'numerology',
      notFoundMessage: 'Không tìm thấy bản ghi Phong Thủy Số.',
      notDivinationError: 'Tôi là chuyên gia tư vấn Phong Thủy Số Lý & Kinh Dịch. Vui lòng đặt các câu hỏi liên quan đến dãy số, cát hung số học, ngũ hành hoặc phong thủy cá nhân.',
      buildFollowUpPrompt: async ({ record, context, question }) => {
        return NumerologyPrompts.getFollowUpPrompt(
          record,
          record.analysisSnapshot || {},
          context,
          question
        );
      }
    });
  }
}

// Aliases
NumerologyAiController.interpret = NumerologyAiController.interpretNumerology;
NumerologyAiController.chat = NumerologyAiController.chatNumerology;

module.exports = NumerologyAiController;
