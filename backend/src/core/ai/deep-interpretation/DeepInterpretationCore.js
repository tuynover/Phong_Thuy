const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiService = require('../AiService');
const { AiRotator, GeminiRotator } = require('../AiRotator');
const logger = require('../../services/LoggerService');
const appConfig = require('../../config/appConfig');

/**
 * Dịch vụ gọi LLM Đa Nền Tảng (Thuần 100% Google Gemini SDK)
 */
class LlmProviderService {
  /**
   * Hướng dẫn hệ thống mặc định (Persona VIP): Bình dân hóa xuyên suốt, ấm áp, thấu cảm, xưng hô "bạn"
   */
  static SYSTEM_PERSONA_VIP = 
    `Bạn là Bậc Thầy Tri Mệnh Đông Phương (Tử Bình Bát Tự, Tử Vi Đẩu Số, Kinh Dịch Lục Hào, Hợp Hôn) với trí tuệ uyên bác, ngôn phong trầm tĩnh, ấm áp, thấu cảm và sâu sắc.\n` +
    `NGUYÊN TẮC VĂN PHONG & TIẾP CẬN BẮT BUỘC:\n` +
    `1. BẮT BUỘC xưng hô với đương số là "bạn", xưng "tôi" hoặc góc nhìn học thuật khách quan. TUYỆT ĐỐI NGHIÊM CẤM dùng từ "ngươi", "kẻ hèn".\n` +
    `2. BÌNH DÂN HÓA XUYÊN SUỐT QUÁ TRÌNH (BẮT ĐẦU NGAY TỪ DÒNG ĐẦU TIÊN & TRONG TỪNG ĐOẠN VĂN):\n` +
    `   - Bạn đang luận giải cho một người hoàn toàn không biết gì về thuật ngữ phong thủy, Bát Tự hay Kinh Dịch.\n` +
    `   - Bất kỳ khi nào đề cập tới một thuật ngữ chuyên môn (Nhật Chủ, Dụng Thần, Thập Thần, Can Chi, Xung Hợp, Hóa Kỵ, Cung Chức, Hào Quẻ...), BẮT BUỘC phải lồng ghép ngay lời giải thích bằng ngôn ngữ đời thường, gần gũi, kèm hình tượng ẩn dụ sinh động (như ngọn lửa trong đêm, dòng nước lớn, cỗ xe leo dốc, mảnh đất màu mỡ, con thuyền xuôi gió...).\n` +
    `   - TUYỆT ĐỐI KHÔNG viết lý thuyết hàn lâm khô cứng rồi mới tóm tắt máy móc ở cuối. Hãy để hơi thở đời thường thấm đượm trong từng câu chữ, giúp người đọc thấu suốt bản mệnh và an tâm hành động.\n` +
    `3. 100% tiếng Việt thuần túy, không dùng chữ Hán / tiếng Trung thô.\n` +
    `4. TUYỆT ĐỐI KHÔNG dùng từ "VIP", "CoT", "Prompt", "Replica", "Stage", "Gemini" hay bất kỳ thuật ngữ kỹ thuật nội bộ nào.`;

  /**
   * Gọi Google Gemini với key chỉ định (Sử dụng 100% Google Gemini SDK chính thức) kèm chuỗi đa mô hình fallback
   * Hỗ trợ systemInstruction để tận dụng cơ chế Implicit Context Caching máy chủ Google
   * Khi vào fallback hoặc gặp lỗi Rate Limit (429 / Resource Exhausted), tự động xoay tua sang khóa Gemini thứ hai
   */
  static async callGeminiWithKey(apiKey, prompt, modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite', retries = 2, systemInstruction = null) {
    let key = apiKey || GeminiRotator.getNextKey();
    if (!key) throw new Error('GEMINI_API_KEY is not set');

    const fallbackModels = Array.from(new Set([
      modelName,
      process.env.GEMINI_MODEL,
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest'
    ].filter(Boolean)));

    const activeSystemInstruction = systemInstruction || this.SYSTEM_PERSONA_VIP;
    let lastError = null;

    for (const activeModel of fallbackModels) {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const genAI = GeminiRotator.getGenAI(key);
          const modelParams = {
            model: activeModel,
            generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
          };
          if (activeSystemInstruction) {
            modelParams.systemInstruction = activeSystemInstruction;
          }
          const model = genAI.getGenerativeModel(modelParams);
          const result = await model.generateContent(prompt);
          return result.response.text();
        } catch (err) {
          lastError = err;

          const isRateLimit = 
            err.message?.includes('429') || 
            err.message?.includes('Resource has been exhausted') ||
            err.message?.includes('quota') ||
            err.message?.includes('RATE_LIMIT_EXCEEDED');

          if (isRateLimit) {
            GeminiRotator.markKeyRateLimited(key, 60000);
            const alternateKey = GeminiRotator.getFallbackKey(key);
            if (alternateKey && alternateKey !== key) {
              logger.warn(`[Gemini SDK] Key [${GeminiRotator.getKeyLabel(key)}] bị Rate Limit (429/Exhausted). Xoay tua tức thì sang [${GeminiRotator.getKeyLabel(alternateKey)}]...`);
              key = alternateKey;
              // Thử lại ngay lập tức với key mới
              continue;
            }
          }

          const isOverloadedOrUnavailable = 
            err.message?.includes('503') || 
            err.message?.includes('429') || 
            err.message?.includes('high demand') ||
            err.message?.includes('Resource has been exhausted') ||
            err.message?.includes('not found') ||
            err.message?.includes('Service Unavailable');

          if (isOverloadedOrUnavailable) {
            logger.warn(`[Gemini SDK] Model [${activeModel}] attempt ${attempt + 1} hit: ${err.message}.`);
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
              continue;
            }
            logger.warn(`[Gemini SDK] Model [${activeModel}] exhausted retries, falling back to next candidate model...`);
            break;
          }
          throw err;
        }
      }
    }

    throw lastError || new Error('All Gemini fallback models failed.');
  }

  /**
   * Tương thích ngược: Chuyển tiếp an toàn sang Gemini SDK
   */
  static async callOpenRouterEndpoint({ prompt, systemPrompt }) {
    logger.info('[LlmProviderService] callOpenRouterEndpoint được gọi -> Tự động chuyển hướng sang 100% Gemini SDK');
    return await this.callGeminiWithKey(null, prompt, undefined, 2, systemPrompt);
  }

  static async callOpenAiEndpoint({ prompt, systemPrompt }) {
    logger.info('[LlmProviderService] callOpenAiEndpoint được gọi -> Tự động chuyển hướng sang 100% Gemini SDK');
    return await this.callGeminiWithKey(null, prompt, undefined, 2, systemPrompt);
  }
}

/**
 * Tiện ích hỗ trợ Stream SSE và tiền xử lý văn bản
 */
class SseStreamHelper {
  static cleanMarkdown(text) {
    const rawCleaned = AiService.cleanMarkdown ? AiService.cleanMarkdown(text) : (text || '').trim();
    return rawCleaned
      .replace(/\bbản\s+(?:báo\s+cáo\s+)?luận\s+giải\s+vip\b/gi, 'bản luận giải chuyên sâu')
      .replace(/\bbáo\s+cáo\s+luận\s+giải\s+vip\b/gi, 'báo cáo luận giải chuyên sâu')
      .replace(/\bluận\s+giải\s+vip\b/gi, 'luận giải chuyên sâu')
      .replace(/\bbáo\s+cáo\s+vip\b/gi, 'báo cáo chuyên sâu')
      .replace(/\bgói\s+vip\b/gi, 'gói chuyên sâu')
      .replace(/\bphân\s+tích\s+vip\b/gi, 'phân tích chuyên sâu')
      .replace(/\bvip\b/gi, 'chuyên sâu')
      .replace(/\bbản\s+bản\b/gi, 'bản');
  }

  static sanitizeMetaIntro(text) {
    if (!text) return '';
    let cleaned = this.cleanMarkdown(text);
    
    // 1. Nếu có tiêu đề Markdown (# hoặc ##), kiểm tra xem có đoạn mở đầu đàm thoại / meta-talk trước nó không
    const firstHeaderMatch = cleaned.match(/(?:^|\n)(#{1,3}\s+[^\n]+)/);
    if (firstHeaderMatch) {
      const headerIdx = cleaned.indexOf(firstHeaderMatch[1]);
      if (headerIdx > 0) {
        const preamble = cleaned.substring(0, headerIdx).trim();
        // Nếu preamble chứa lời chào, tự nhận vai trò biên tập, hoặc câu dẫn meta-talk thì loại bỏ 100%
        if (/(?:chào|tư cách|tổng biên tập|thẩm định|yêu cầu của bạn|dưới đây là|kính gửi|bậc thầy|đại sư|sau khi rà soát)/i.test(preamble)) {
          cleaned = cleaned.substring(headerIdx).trim();
        }
      }
    }
    
    // 2. Cắt bỏ các dòng mở đầu xưng hô đàm thoại rác nếu xuất hiện ở đầu văn bản
    cleaned = cleaned.replace(/^(?:(?:chào\s+(?:bạn|đương số|anh\/chị)[^\n]*|với tư cách[^\n]*|tôi đã thẩm định[^\n]*|dưới đây là[^\n]*|sau khi rà soát[^\n]*|theo yêu cầu[^\n]*)\n*)+/gi, '').trim();

    // 3. Nếu ngay dưới tiêu đề Markdown có dòng chào hỏi xưng danh meta-talk -> cắt bỏ dòng đó
    cleaned = cleaned.replace(/^(#{1,3}\s+[^\n]+\n+)(?:(?:chào\s+(?:bạn|đương số|anh\/chị)[^\n]*|với tư cách[^\n]*)\n*)+/i, (m, p1) => p1).trim();

    return cleaned;
  }

  static cleanContextForVip(rawContext) {
    if (!rawContext) return '';
    const markers = [
      '--- CẤU TRÚC BẢN LUẬN GIẢI YÊU CẦU ĐẦU RA',
      '--- YÊU CẦU ĐẦU RA CHI TIẾT ---',
      '--- YÊU CẦU ĐẦU RA',
      '--- CẤU TRÚC BẢN LUẬN GIẢI',
      '--- YÊU CẦU ĐẦU RA BẮT BUỘC'
    ];
    let result = rawContext;
    for (const marker of markers) {
      const idx = result.indexOf(marker);
      if (idx !== -1) {
        result = result.substring(0, idx).trim();
      }
    }
    return result.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  static async streamTextChunks(controller, encoder, text, { chunkSize = 120, delayMs = 15 } = {}) {
    if (!text) return;
    for (let c = 0; c < text.length; c += chunkSize) {
      const chunk = text.slice(c, c + chunkSize);
      controller.enqueue(encoder.encode(chunk));
      if (delayMs > 0) {
        await new Promise(r => setTimeout(r, delayMs));
      }
    }
  }

  static dispatchProgress(onProgress, payload) {
    if (typeof onProgress === 'function') {
      try {
        onProgress(payload);
      } catch (e) {
        logger.warn('[SseStreamHelper] Error in onProgress callback:', e.message);
      }
    }
  }
}

module.exports = {
  AiRotator,
  GeminiRotator,
  LlmProviderService,
  SseStreamHelper
};
