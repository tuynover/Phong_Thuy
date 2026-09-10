/**
 * MultiAgentPipelineService.js
 * Facade tương thích ngược, chuyển tiếp toàn bộ yêu cầu sang kiến trúc mô-đun
 * src/services/deep-interpretation/
 */

const {
  DeepInterpretationManager,
  BaziDeepPipeline,
  ZiweiDeepPipeline,
  OpenRouterRotator,
  LlmProviderService,
  SseStreamHelper,
  BAZI_VIP_CONFIG
} = require('./deep-interpretation');

class MultiAgentPipelineService {
  static OpenRouterRotator = OpenRouterRotator;

  static async callOpenRouterEndpoint(params) {
    return await LlmProviderService.callOpenRouterEndpoint(params);
  }

  static async callOpenAiEndpoint(params) {
    return await LlmProviderService.callOpenAiEndpoint(params);
  }

  static async callGeminiWithKey(apiKey, prompt, modelName, retries) {
    return await LlmProviderService.callGeminiWithKey(apiKey, prompt, modelName, retries);
  }

  static getChapterSpecificInstructions(chapterId) {
    return BAZI_VIP_CONFIG.getChapterSpecificInstructions(chapterId);
  }

  static cleanContextForVip(rawContext) {
    return SseStreamHelper.cleanContextForVip(rawContext);
  }

  static getOpenRouterModelForChapter(chapterId) {
    return BAZI_VIP_CONFIG.getOpenRouterModelForChapter(chapterId);
  }

  static async executeReplica(replica, fullContext) {
    return await BaziDeepPipeline.executeReplica(replica, fullContext);
  }

  /**
   * Luận Giải Chuyên Sâu Bát Tự (Mặc định cho tương thích ngược)
   */
  static async runVipPipelineStream(prompt, birthYear, options = {}) {
    return await DeepInterpretationManager.getPipeline('bazi').runVipPipelineStream(prompt, birthYear, options);
  }

  /**
   * Luận Giải Chuyên Sâu Tử Vi Đẩu Số
   */
  static async runZiweiVipPipelineStream(prompt, birthYear, options = {}) {
    return await DeepInterpretationManager.getPipeline('ziwei').runVipPipelineStream(prompt, birthYear, options);
  }

  /**
   * Luận Giải Chuyên Sâu Hợp Hôn (4 Trụ Cột Hạnh Phúc)
   */
  static async runMarriageVipPipelineStream(prompt, birthYear, options = {}) {
    return await DeepInterpretationManager.getPipeline('marriage').runVipPipelineStream(prompt, birthYear, options);
  }

  /**
   * Luận Giải Chuyên Sâu Kinh Dịch Lục Hào (3 Kịch Bản Tương Lai)
   */
  static async runIChingVipPipelineStream(prompt, birthYear, options = {}) {
    return await DeepInterpretationManager.getPipeline('iching').runVipPipelineStream(prompt, birthYear, options);
  }
}

module.exports = MultiAgentPipelineService;
