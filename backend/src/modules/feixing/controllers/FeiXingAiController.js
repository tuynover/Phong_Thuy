const BaseAiController = require('../../../core/ai/BaseAiController');
const FeiXingRecord = require('../models/FeiXingRecord');
const FeiXingPrompts = require('../services/FeiXingPrompts');
const { FEIXING_PROMPT_VERSION = 'v1_0_feixing_9palaces' } = require('../../../core/config/ai');

class FeiXingAiController {
  /**
   * Luận giải AI chuyên sâu Huyền Không Phi Tinh qua SSE Stream
   */
  static async interpretChart(req, res) {
    return BaseAiController.handleInterpret(req, res, {
      RecordModel: FeiXingRecord,
      system: 'feixing',
      promptVersion: FEIXING_PROMPT_VERSION,
      notFoundMessage: 'Không tìm thấy bản ghi Huyền Không Phi Tinh.',
      errorMessage: 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Huyền Không Phi Tinh.',
      buildPrompt: async (record) => {
        return FeiXingPrompts.getInterpretationPrompt(record, record.analysisSnapshot || {});
      }
    });
  }

  /**
   * Hỏi đáp AI tiếp nối về phong thủy nhà ở qua SSE Stream
   */
  static async chatChart(req, res) {
    return BaseAiController.handleChat(req, res, {
      RecordModel: FeiXingRecord,
      system: 'feixing',
      notFoundMessage: 'Không tìm thấy bản ghi Huyền Không Phi Tinh.',
      notDivinationError: 'Tôi là chuyên gia tư vấn Huyền Không Phi Tinh. Vui lòng đặt các câu hỏi liên quan đến phong thủy nhà ở, phương vị hoặc bố trí không gian sống.',
      buildFollowUpPrompt: async ({ record, context, question }) => {
        return FeiXingPrompts.getFollowUpPrompt(
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
FeiXingAiController.interpretFeiXing = FeiXingAiController.interpretChart;
FeiXingAiController.chatFeiXing = FeiXingAiController.chatChart;

module.exports = FeiXingAiController;
