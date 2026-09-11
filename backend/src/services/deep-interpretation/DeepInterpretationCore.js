const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiService = require('../AiService');
const logger = require('../LoggerService');

/**
 * Bộ quản lý xoay tua tài khoản OpenRouter (Round-Robin & Fallback)
 */
class OpenRouterRotator {
  static currentIndex = 0;

  static getKeys() {
    const keys = [];
    if (process.env.OPENROUTER_API_KEYS) {
      keys.push(...process.env.OPENROUTER_API_KEYS.split(',').map(k => k.trim()).filter(Boolean));
    }
    if (process.env.OPENROUTER_API_KEY && !keys.includes(process.env.OPENROUTER_API_KEY.trim())) {
      keys.push(process.env.OPENROUTER_API_KEY.trim());
    }
    if (process.env.OPENROUTER_API_KEY_2 && !keys.includes(process.env.OPENROUTER_API_KEY_2.trim())) {
      keys.push(process.env.OPENROUTER_API_KEY_2.trim());
    }
    return keys;
  }

  static getNextKey() {
    const keys = this.getKeys();
    if (keys.length === 0) return null;
    const key = keys[this.currentIndex % keys.length];
    this.currentIndex = (this.currentIndex + 1) % keys.length;
    return key;
  }
}

/**
 * Dịch vụ gọi LLM Đa Nền Tảng (OpenRouter, Gemini SDK, OpenAI-Compatible)
 */
class LlmProviderService {
  /**
   * Gọi OpenRouter API endpoint với cơ chế xoay tua 2+ key & tự động retry khi gặp Rate Limit (429/502/503)
   */
  static async callOpenRouterEndpoint({ model, systemPrompt, prompt, timeoutMs = 75000, temperature = 0.7, maxTokens = 3000 }) {
    const keys = OpenRouterRotator.getKeys();
    if (keys.length === 0) {
      throw new Error('OPENROUTER_API_KEY is not configured.');
    }

    let lastError = null;
    const maxAttempts = Math.max(keys.length * 2, 3);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const apiKey = OpenRouterRotator.getNextKey();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const maskedKey = `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`;
        logger.info(`[OpenRouter] Requesting model [${model}] using key [${maskedKey}] (attempt ${attempt + 1}/${maxAttempts})...`);

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://tuynover.ddns.net',
            'X-Title': 'Phong Thuy AI - Co Hoc Phuong Dong'
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ],
            temperature,
            max_tokens: maxTokens
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text();
          const errMessage = `OpenRouter Error ${res.status}: ${errText.slice(0, 250)}`;
          logger.warn(`[OpenRouter] Key [${maskedKey}] returned ${res.status}: ${errMessage}`);

          if (res.status === 429 || res.status === 502 || res.status === 503) {
            lastError = new Error(errMessage);
            const waitMs = 1500 * (attempt + 1);
            logger.info(`[OpenRouter] Rate limited (429/503). Waiting ${waitMs}ms before retry/rotation...`);
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }

          if ((res.status === 402 || res.status === 401) && keys.length > 1) {
            lastError = new Error(errMessage);
            continue;
          }

          throw new Error(errMessage);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (!content) {
          throw new Error(`OpenRouter returned empty content for model ${model}`);
        }
        return content;
      } catch (err) {
        clearTimeout(timeout);
        lastError = err;
        logger.warn(`[OpenRouter] Attempt ${attempt + 1} failed: ${err.message}.`);
        if (attempt < maxAttempts - 1) {
          await new Promise(r => setTimeout(r, 1200));
        }
      }
    }

    throw lastError || new Error('All OpenRouter keys/attempts failed.');
  }

  /**
   * Gọi OpenAI-compatible endpoints (Grok, Groq, OpenRouter)
   */
  static async callOpenAiEndpoint({ url, apiKey, model, systemPrompt, prompt, timeoutMs = 60000, temperature = 0.7, maxTokens = 4096 }) {
    if (!apiKey) {
      throw new Error(`API Key for ${model} is not configured.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Gọi Google Gemini với key chỉ định (Sử dụng 100% Google Gemini SDK chính thức)
   */
  static async callGeminiWithKey(apiKey, prompt, modelName = 'gemini-3.1-flash-lite', retries = 2) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not set');
    const genAI = new GoogleGenerativeAI(key);
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        if (attempt < retries && (err.message?.includes('503') || err.message?.includes('429'))) {
          logger.warn(`[Gemini SDK] Attempt ${attempt + 1} hit ${err.message}. Retrying in 1.5s...`);
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
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

  static cleanContextForVip(rawContext) {
    if (!rawContext) return '';
    const marker = '--- CẤU TRÚC BẢN LUẬN GIẢI YÊU CẦU ĐẦU RA';
    const idx = rawContext.indexOf(marker);
    if (idx !== -1) {
      return rawContext.substring(0, idx).trim();
    }
    return rawContext.trim();
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
  OpenRouterRotator,
  LlmProviderService,
  SseStreamHelper
};
