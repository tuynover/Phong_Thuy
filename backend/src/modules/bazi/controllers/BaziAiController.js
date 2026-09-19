const BaseAiController = require('../../../core/ai/BaseAiController');
const BaziRecord = require('../models/BaziRecord');
const BaziPrompts = require('../services/BaziPrompts');
const MultiAgentPipelineService = require('../../../core/services/MultiAgentPipelineService');
const { updateByIdFlex } = require('../../../core/services/HistoryQueryHelper');
const { BAZI_PROMPT_VERSION } = require('../../../core/config/ai');
const AgeClassifier = require('../../../shared/utils/AgeClassifier');

class BaziAiController {
  static async interpretBazi(req, res) {
    return BaseAiController.handleInterpret(req, res, {
      RecordModel: BaziRecord,
      system: 'bazi',
      promptVersion: BAZI_PROMPT_VERSION,
      notFoundMessage: 'Không tìm thấy bản ghi Bát Tự.',
      errorMessage: 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Bát Tự.',
      buildPrompt: (record, isVipMode) => {
        const ageInfo = AgeClassifier.getLunarAgeInfo(record);
        return isVipMode
          ? BaziPrompts.getDeepPrompt(record.toObject(), ageInfo)
          : BaziPrompts.getStandardPrompt(record.toObject(), ageInfo);
      },
      runVipPipeline: async ({ prompt, record, onProgress }) => {
        const ageInfo = AgeClassifier.getLunarAgeInfo(record);
        const birthYear = record.inputInfo?.birthSolarYear || record.inputInfo?.date?.split('/')?.[2];
        return await MultiAgentPipelineService.runVipPipelineStream(prompt, birthYear, { onProgress, ageInfo });
      }
    });
  }

  static async chatBazi(req, res) {
    return BaseAiController.handleChat(req, res, {
      RecordModel: BaziRecord,
      system: 'bazi',
      notFoundMessage: 'Không tìm thấy bản ghi Bát Tự.',
      notDivinationError: 'Tôi là trợ lý luận giải Bát Tự mệnh lý. Vui lòng hỏi những câu hỏi liên quan đến vận thế, công việc, tình duyên, gia đạo, thời tiết hoặc lá số này.',
      ensureAnalysisSnapshot: async (record, id) => {
        if (!record.analysisSnapshot) {
          const analyzedData = record.baziData;
          await updateByIdFlex(BaziRecord, id, { analysisSnapshot: analyzedData });
        }
      },
      buildFollowUpPrompt: ({ record, context, question, vipContextText }) => {
        return BaziPrompts.getFollowUpPrompt(record.toObject(), context, question, vipContextText);
      }
    });
  }
}

module.exports = BaziAiController;
