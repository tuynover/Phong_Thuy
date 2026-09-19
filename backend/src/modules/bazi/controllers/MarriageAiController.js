const BaseAiController = require('../../../core/ai/BaseAiController');
const MarriageRecord = require('../models/MarriageRecord');
const MarriagePrompts = require('../services/MarriagePrompts');
const MultiAgentPipelineService = require('../../../core/services/MultiAgentPipelineService');
const { MARRIAGE_PROMPT_VERSION } = require('../../../core/config/ai');

class MarriageAiController {
  static async interpretMarriage(req, res) {
    return BaseAiController.handleInterpret(req, res, {
      RecordModel: MarriageRecord,
      system: 'marriage',
      promptVersion: MARRIAGE_PROMPT_VERSION,
      notFoundMessage: 'Không tìm thấy bản ghi hôn nhân.',
      errorMessage: 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Hợp Hôn.',
      buildPrompt: (record) => {
        return MarriagePrompts.getInterpretationPrompt(record.toObject());
      },
      runVipPipeline: async ({ prompt, record, onProgress }) => {
        const birthYear = record.male?.birthSolarYear || record.male?.date?.split('/')?.[2] || record.female?.birthSolarYear || new Date().getFullYear();
        return await MultiAgentPipelineService.runMarriageVipPipelineStream(prompt, birthYear, { onProgress });
      }
    });
  }

  static async chatMarriage(req, res) {
    return BaseAiController.handleChat(req, res, {
      RecordModel: MarriageRecord,
      system: 'marriage',
      notFoundMessage: 'Không tìm thấy bản ghi Hợp Hôn.',
      notDivinationError: 'Tôi là trợ lý luận giải hôn nhân gia đạo. Vui lòng hỏi những câu hỏi liên quan đến tình duyên, gia đạo, con cái hoặc lá số này.',
      buildFollowUpPrompt: ({ record, context, question, vipContextText }) => {
        return MarriagePrompts.getFollowUpPrompt(record.toObject(), context, question, "v2.0-followup", vipContextText);
      }
    });
  }
}

module.exports = MarriageAiController;
