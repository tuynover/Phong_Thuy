const BaseAiController = require('../../../core/ai/BaseAiController');
const IChingRecord = require('../models/IChingRecord');
const User = require('../../../core/models/User');
const IChingPrompts = require('../services/IChingPrompts');
const IChingDataService = require('../services/IChingDataService');
const RuleEngineService = require('../services/RuleEngineService');
const MultiAgentPipelineService = require('../../../core/services/MultiAgentPipelineService');
const { ICHING_PROMPT_VERSION } = require('../../../core/config/ai');

class IChingAiController {
  static async _buildFullRecordAndAnalysis(record) {
    const reconstructed = IChingDataService.parseLines({
      primaryHexagram: record.primaryHexagram,
      secondaryHexagram: record.transformedHexagram || record.primaryHexagram,
      movingLines: record.movingLines,
      dayGanZhi: record.lunarDateInfo?.dayCanChi,
      monthGanZhi: record.lunarDateInfo?.monthCanChi
    });

    const fullRecord = {
      ...record.toObject(),
      primaryLines: reconstructed.primaryLines,
      secondaryLines: reconstructed.secondaryLines,
      primaryHexagram: reconstructed.primaryHexagram,
      transformedHexagram: reconstructed.transformedHexagram
    };

    let userGender = 1;
    if (record.userId && record.userId !== 'guest') {
      const user = await User.findById(record.userId).lean();
      if (user && user.gender !== undefined) {
        userGender = user.gender;
      }
    }

    const analyzedData = RuleEngineService.analyze(fullRecord, userGender);
    return { fullRecord, analyzedData };
  }

  static async interpretHexagram(req, res) {
    return BaseAiController.handleInterpret(req, res, {
      RecordModel: IChingRecord,
      system: 'iching',
      promptVersion: ICHING_PROMPT_VERSION,
      notFoundMessage: 'Không tìm thấy bản ghi Kinh Dịch.',
      errorMessage: 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Kinh Dịch.',
      buildPrompt: async (record) => {
        const { fullRecord, analyzedData } = await IChingAiController._buildFullRecordAndAnalysis(record);
        return IChingPrompts.getInterpretationPrompt(fullRecord, analyzedData);
      },
      runVipPipeline: async ({ prompt, record, onProgress }) => {
        const birthYear = record.lunarDateInfo?.solarYear || record.solarYear || new Date().getFullYear();
        const castDate = record.lunarDateInfo?.solarDate || record.createdAt || new Date();
        return await MultiAgentPipelineService.runIChingVipPipelineStream(prompt, birthYear, {
          onProgress,
          castDate
        });
      }
    });
  }

  static async chatHexagram(req, res) {
    return BaseAiController.handleChat(req, res, {
      RecordModel: IChingRecord,
      system: 'iching',
      notFoundMessage: 'Không tìm thấy bản ghi Kinh Dịch.',
      notDivinationError: 'Tôi là trợ lý luận giải Kinh Dịch Lục Hào. Vui lòng hỏi những câu hỏi liên quan đến sự việc cần chiêm đoán hoặc quẻ dịch này.',
      buildFollowUpPrompt: async ({ record, context, question, vipContextText }) => {
        const { fullRecord, analyzedData } = await IChingAiController._buildFullRecordAndAnalysis(record);
        return IChingPrompts.getFollowUpPrompt(fullRecord, analyzedData, context, question, vipContextText);
      }
    });
  }
}

// Backward compatible aliases
IChingAiController.interpretIChing = IChingAiController.interpretHexagram;
IChingAiController.chatIChing = IChingAiController.chatHexagram;

module.exports = IChingAiController;
