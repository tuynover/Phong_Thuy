const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../services/LoggerService');

/**
 * ProviderKeyRotator
 * Lớp điều phối xoay tua và quản lý trạng thái API Keys độc lập cho từng AI Provider.
 * Hỗ trợ:
 * - Dynamic key discovery qua biến môi trường (mảng comma-separated hoặc tiền tố _1, _2, _3...)
 * - Xoay tua nguyên tử theo từng request (Round-Robin)
 * - Circuit Breaker theo từng key (Rate Limit 429 hoặc Hết hạn mức Credit 402)
 * - Fallback handover né key lỗi lập tức
 * - Caching client instance (Singleton Map)
 */
class ProviderKeyRotator {
  constructor(options = {}) {
    this.providerName = options.providerName || 'AI';
    this.envPrefix = options.envPrefix || `${this.providerName.toUpperCase()}_API_KEY`;
    this.envArrayKey = options.envArrayKey || `${this.envPrefix}S`;
    this.defaultCooldownMs = options.defaultCooldownMs || 60000;
    this.clientFactory = options.clientFactory || null;

    this.currentIndex = 0;
    this.fallbackIndex = 0;
    this.rateLimitedUntil = new Map(); // key -> timestamp
    this.creditExhaustedUntil = 0; // toàn provider hoặc theo key
    this.clientCache = new Map(); // key -> client instance
  }

  /**
   * Lấy danh sách toàn bộ API Keys khả dụng trong môi trường
   */
  getKeys() {
    const keys = [];

    // 1. Quét biến danh sách phân tách bởi dấu phẩy (vd: GEMINI_API_KEYS, OPENROUTER_API_KEYS)
    if (process.env[this.envArrayKey]) {
      const splitKeys = process.env[this.envArrayKey].split(',').map(k => k.trim()).filter(Boolean);
      for (const k of splitKeys) {
        if (!keys.includes(k)) keys.push(k);
      }
    }

    // 2. Quét các biến dạng PREFIX, PREFIX_2, PREFIX_3, PREFIX_4, PREFIX_5
    const standardEnvNames = [
      this.envPrefix,
      `${this.envPrefix}_2`,
      `${this.envPrefix}_3`,
      `${this.envPrefix}_4`,
      `${this.envPrefix}_5`
    ];
    for (const varName of standardEnvNames) {
      const val = process.env[varName];
      if (val && val.trim()) {
        const trimmed = val.trim();
        if (!keys.includes(trimmed)) {
          keys.push(trimmed);
        }
      }
    }

    // 3. Quét động bất kỳ biến nào bắt đầu bằng PREFIX_
    const dynamicPrefix = `${this.envPrefix}_`;
    for (const [envKey, val] of Object.entries(process.env)) {
      if (envKey.startsWith(dynamicPrefix) && val && val.trim()) {
        const trimmed = val.trim();
        if (!keys.includes(trimmed)) {
          keys.push(trimmed);
        }
      }
    }

    // 4. Fallback biến chính nếu chưa được thêm
    const fallbackPrimary = process.env[this.envPrefix];
    if (keys.length === 0 && fallbackPrimary && fallbackPrimary.trim()) {
      keys.push(fallbackPrimary.trim());
    }

    return keys;
  }

  /**
   * Lấy nhãn bảo mật đại diện cho key (ẩn phần lớn chuỗi key khi ghi log)
   */
  getKeyLabel(key, fallbackIdx = null) {
    if (!key) return `${this.providerName}-Key-None`;
    const keys = this.getKeys();
    let idx = fallbackIdx !== null ? fallbackIdx : keys.indexOf(key);
    const masked = key.length > 12 ? `${key.slice(0, 6)}...${key.slice(-4)}` : '***';
    const name = idx !== -1 ? `${this.providerName}-Key-${idx + 1}` : `${this.providerName}-Key`;
    return `${name} [${masked}]`;
  }

  /**
   * Đánh dấu key đang bị Rate Limit (429 / RESOURCE_EXHAUSTED) trong khoảng thời gian nhất định
   */
  markKeyRateLimited(key, durationMs = this.defaultCooldownMs) {
    if (!key) return;
    const until = Date.now() + durationMs;
    this.rateLimitedUntil.set(key, until);
    logger.warn(`[${this.providerName}Rotator] Khóa [${this.getKeyLabel(key)}] bị kích hoạt Rate Limit. Tạm dừng điều phối vào key này trong ${durationMs / 1000}s.`);
  }

  /**
   * Kiểm tra key có đang trong thời gian cách ly Rate Limit không
   */
  isKeyRateLimited(key) {
    if (!key) return false;
    const until = this.rateLimitedUntil.get(key) || 0;
    return Date.now() < until;
  }

  /**
   * Đánh dấu toàn provider hoặc key bị cạn kiệt credit (lỗi 402 Payment Required)
   */
  markCreditExhausted(durationMs = 15 * 60 * 1000) {
    this.creditExhaustedUntil = Date.now() + durationMs;
    logger.warn(`[${this.providerName}Rotator] Tạm ngắt toàn bộ các request tới ${this.providerName} do cạn credit trong ${durationMs / 60000} phút.`);
  }

  /**
   * Kiểm tra provider có đang bị ngắt do cạn credit không
   */
  isCreditExhausted() {
    return Date.now() < this.creditExhaustedUntil;
  }

  /**
   * Reset trạng thái circuit breaker & rate limits
   */
  resetRateLimits() {
    this.rateLimitedUntil.clear();
    this.creditExhaustedUntil = 0;
  }

  resetCreditStatus() {
    this.creditExhaustedUntil = 0;
  }

  /**
   * Lấy key tiếp theo theo vòng tròn (Round-Robin) nguyên tử theo từng request
   */
  getNextKey() {
    const keys = this.getKeys();
    if (keys.length === 0) return process.env[this.envPrefix] || null;

    // Tìm key khả dụng không bị rate limit theo thứ tự xoay tua
    for (let i = 0; i < keys.length; i++) {
      const idx = (this.currentIndex + i) % keys.length;
      const candidateKey = keys[idx];
      if (!this.isKeyRateLimited(candidateKey)) {
        this.currentIndex = (idx + 1) % keys.length;
        logger.info(`[${this.providerName}Rotator] Per-request rotating sang [${this.getKeyLabel(candidateKey, idx)}] (Key ${idx + 1}/${keys.length})`);
        return candidateKey;
      }
    }

    // Nếu tất cả đều bị rate limit, vẫn trả về theo round-robin kèm cảnh báo
    const fallbackIdx = this.currentIndex % keys.length;
    const fallback = keys[fallbackIdx];
    this.currentIndex = (this.currentIndex + 1) % keys.length;
    logger.warn(`[${this.providerName}Rotator] Toàn bộ keys đang trong trạng thái cooldown. Sử dụng [${this.getKeyLabel(fallback, fallbackIdx)}]`);
    return fallback;
  }

  /**
   * Lấy key chuyên biệt dành cho Fallback:
   * Luân phiên giữa các key có sẵn, tự động né key đang bị lỗi hoặc vừa chạm rate limit.
   */
  getFallbackKey(excludeKey = null) {
    const keys = this.getKeys();
    if (keys.length === 0) return process.env[this.envPrefix] || null;
    if (keys.length === 1) return keys[0];

    // 1. Nếu có excludeKey (key vừa bị lỗi), ưu tiên chọn key khác không bị rate-limited
    if (excludeKey) {
      const candidates = keys.filter(k => k !== excludeKey);
      if (candidates.length > 0) {
        const healthyCandidate = candidates.find(k => !this.isKeyRateLimited(k));
        if (healthyCandidate) {
          const chosenIdx = keys.indexOf(healthyCandidate);
          this.fallbackIndex = (chosenIdx + 1) % keys.length;
          logger.info(`[${this.providerName}Rotator] Fallback handover từ [${this.getKeyLabel(excludeKey)}] sang [${this.getKeyLabel(healthyCandidate, chosenIdx)}]`);
          return healthyCandidate;
        }
        const chosen = candidates[0];
        const chosenIdx = keys.indexOf(chosen);
        this.fallbackIndex = (chosenIdx + 1) % keys.length;
        return chosen;
      }
    }

    // 2. Xoay tua thông thường cho fallback
    for (let i = 0; i < keys.length; i++) {
      const idx = (this.fallbackIndex + i) % keys.length;
      const candidateKey = keys[idx];
      if (!this.isKeyRateLimited(candidateKey)) {
        this.fallbackIndex = (idx + 1) % keys.length;
        return candidateKey;
      }
    }

    const fallbackIdx = this.fallbackIndex % keys.length;
    const chosen = keys[fallbackIdx];
    this.fallbackIndex = (this.fallbackIndex + 1) % keys.length;
    return chosen;
  }

  /**
   * Lấy client instance từ Cache Singleton (nếu có cấu hình clientFactory)
   */
  getClient(key) {
    const activeKey = key || this.getNextKey();
    if (!activeKey) return null;

    if (!this.clientCache.has(activeKey)) {
      if (this.clientFactory) {
        this.clientCache.set(activeKey, this.clientFactory(activeKey));
      } else {
        return null;
      }
    }
    return this.clientCache.get(activeKey);
  }

  /**
   * Alias đặc thù cho Google Generative AI
   */
  getGenAI(key) {
    return this.getClient(key);
  }
}

/**
 * AiRotator - Trung tâm Quản lý & Xoay tua API Keys cho toàn bộ các nhà cung cấp AI
 */
class AiRotator {
  /**
   * Bộ xoay tua cho Google Gemini SDK
   */
  static gemini = new ProviderKeyRotator({
    providerName: 'Gemini',
    envPrefix: 'GEMINI_API_KEY',
    envArrayKey: 'GEMINI_API_KEYS',
    defaultCooldownMs: 60000,
    clientFactory: (key) => new GoogleGenerativeAI(key)
  });

  /**
   * Bộ xoay tua cho OpenRouter
   */
  static openrouter = new ProviderKeyRotator({
    providerName: 'OpenRouter',
    envPrefix: 'OPENROUTER_API_KEY',
    envArrayKey: 'OPENROUTER_API_KEYS',
    defaultCooldownMs: 60000
  });

  /**
   * Bộ xoay tua cho DeepSeek (sẵn sàng khi kích hoạt)
   */
  static deepseek = new ProviderKeyRotator({
    providerName: 'DeepSeek',
    envPrefix: 'DEEPSEEK_API_KEY',
    envArrayKey: 'DEEPSEEK_API_KEYS',
    defaultCooldownMs: 60000
  });

  /**
   * Lấy bộ điều phối theo tên nhà cung cấp
   * @param {string} providerName - 'gemini' | 'openrouter' | 'deepseek'
   */
  static for(providerName) {
    const normalized = (providerName || '').toLowerCase().trim();
    if (normalized.includes('gemini')) return this.gemini;
    if (normalized.includes('openrouter')) return this.openrouter;
    if (normalized.includes('deepseek')) return this.deepseek;
    return this.gemini;
  }
}

module.exports = {
  AiRotator,
  ProviderKeyRotator,
  GeminiRotator: AiRotator.gemini,
  OpenRouterRotator: AiRotator.openrouter
};
