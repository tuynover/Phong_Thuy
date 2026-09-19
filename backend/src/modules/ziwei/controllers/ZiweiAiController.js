const BaseAiController = require('../../../core/ai/BaseAiController');
const ZiweiRecord = require('../models/ZiweiRecord');
const SymbolicAnalyzer = require('../../../shared/knowledge-engine/SymbolicAnalyzer');
const ZiweiFormatter = require('../services/ZiweiFormatter');
const ZiweiPrompts = require('../services/ZiweiPrompts');
const MultiAgentPipelineService = require('../../../core/services/MultiAgentPipelineService');
const { ZIWEI_PROMPT_VERSION } = require('../../../core/config/ai');

class ZiweiAiController {
  static async interpretZiwei(req, res) {
    return BaseAiController.handleInterpret(req, res, {
      RecordModel: ZiweiRecord,
      system: 'ziwei',
      promptVersion: ZIWEI_PROMPT_VERSION,
      notFoundMessage: 'Không tìm thấy bản ghi Tử Vi.',
      errorMessage: 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Tử Vi.',
      buildPrompt: (record) => {
        const symbolicAnalysis = SymbolicAnalyzer.analyze(record.chartData);
        const compressed = ZiweiFormatter.compressForAi(record);
        return ZiweiPrompts.buildMarkdownPrompt(compressed, symbolicAnalysis);
      },
      runVipPipeline: async ({ prompt, record, onProgress }) => {
        const birthYear = record.inputInfo?.birthSolarYear || record.inputInfo?.date?.split('/')?.[2];
        return await MultiAgentPipelineService.runZiweiVipPipelineStream(prompt, birthYear, { onProgress });
      }
    });
  }

  static async chatZiwei(req, res) {
    return BaseAiController.handleChat(req, res, {
      RecordModel: ZiweiRecord,
      system: 'ziwei',
      notFoundMessage: 'Không tìm thấy bản ghi Tử Vi.',
      notDivinationError: 'Tôi là trợ lý luận giải Tử Vi Đẩu Số. Vui lòng hỏi những câu hỏi liên quan đến vận thế, công danh, tài lộc, gia đạo hoặc các cung chức trong lá số này.',
      buildFollowUpPrompt: ({ record, context, question, vipContextText }) => {
        const compressedChart = ZiweiFormatter.compressForAi(record);
        const symbolicAnalysis = record.analysisSnapshot || SymbolicAnalyzer.analyze(record.chartData);
        return ZiweiPrompts.buildFollowUpPrompt(compressedChart, symbolicAnalysis, "", context, question, vipContextText);
      }
    });
  }
}

module.exports = ZiweiAiController;
