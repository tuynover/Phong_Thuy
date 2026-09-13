/**
 * deep-interpretation/index.js
 * Entrypoint và Quản lý Facade cho các luồng Luận Giải Chuyên Sâu
 */

const {
  OpenRouterRotator,
  LlmProviderService,
  SseStreamHelper
} = require('./DeepInterpretationCore');

const {
  BAZI_VIP_CONFIG,
  ZIWEI_VIP_CONFIG,
  MARRIAGE_VIP_CONFIG,
  ICHING_VIP_CONFIG
} = require('./DeepInterpretationConfigs');

const {
  BaziDeepPipeline,
  ZiweiDeepPipeline,
  MarriageDeepPipeline,
  IChingDeepPipeline
} = require('./DeepInterpretationPipelines');

class DeepInterpretationManager {
  static getPipeline(system) {
    switch (system?.toLowerCase()) {
      case 'bazi':
      case 'bat_tu':
        return BaziDeepPipeline;
      case 'ziwei':
      case 'tu_vi':
        return ZiweiDeepPipeline;
      case 'marriage':
      case 'hop_hon':
        return MarriageDeepPipeline;
      case 'iching':
      case 'kinh_dich':
        return IChingDeepPipeline;
      default:
        throw new Error(`Hệ thống luận giải [${system}] chưa được hỗ trợ deep pipeline.`);
    }
  }
}

module.exports = {
  DeepInterpretationManager,
  BaziDeepPipeline,
  ZiweiDeepPipeline,
  MarriageDeepPipeline,
  IChingDeepPipeline,
  OpenRouterRotator,
  LlmProviderService,
  SseStreamHelper,
  BAZI_VIP_CONFIG,
  ZIWEI_VIP_CONFIG,
  MARRIAGE_VIP_CONFIG,
  ICHING_VIP_CONFIG,
  AiConcurrencyLimiter: require('./AiConcurrencyLimiter')
};
