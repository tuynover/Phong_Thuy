const { AiRotator, ProviderKeyRotator } = require('../../src/core/ai/AiRotator');

describe('AiRotator Unified Multi-Provider Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    AiRotator.gemini.currentIndex = 0;
    AiRotator.gemini.fallbackIndex = 0;
    AiRotator.gemini.resetRateLimits();

    AiRotator.openrouter.currentIndex = 0;
    AiRotator.openrouter.fallbackIndex = 0;
    AiRotator.openrouter.resetRateLimits();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Provider Factory & Resolution', () => {
    test('AiRotator.for() should resolve correct provider instances', () => {
      expect(AiRotator.for('gemini')).toBe(AiRotator.gemini);
      expect(AiRotator.for('Google-Gemini')).toBe(AiRotator.gemini);
      expect(AiRotator.for('openrouter')).toBe(AiRotator.openrouter);
      expect(AiRotator.for('OpenRouter-Free')).toBe(AiRotator.openrouter);
      expect(AiRotator.for('deepseek')).toBe(AiRotator.deepseek);
      expect(AiRotator.for('unknown')).toBe(AiRotator.gemini); // default fallback
    });
  });

  describe('Gemini Provider Rotation', () => {
    test('should rotate across multiple Gemini keys per-request', () => {
      process.env.GEMINI_API_KEY = 'gemini_k1_1111111111';
      process.env.GEMINI_API_KEY_2 = 'gemini_k2_2222222222';
      process.env.GEMINI_API_KEY_3 = 'gemini_k3_3333333333';

      expect(AiRotator.gemini.getNextKey()).toBe('gemini_k1_1111111111');
      expect(AiRotator.gemini.getNextKey()).toBe('gemini_k2_2222222222');
      expect(AiRotator.gemini.getNextKey()).toBe('gemini_k3_3333333333');
      expect(AiRotator.gemini.getNextKey()).toBe('gemini_k1_1111111111');
    });

    test('should skip rate-limited Gemini key and handover gracefully', () => {
      process.env.GEMINI_API_KEY = 'gemini_active_11111111';
      process.env.GEMINI_API_KEY_2 = 'gemini_healthy_2222222';

      AiRotator.gemini.markKeyRateLimited('gemini_active_11111111', 10000);
      expect(AiRotator.gemini.isKeyRateLimited('gemini_active_11111111')).toBe(true);
      expect(AiRotator.gemini.isKeyRateLimited('gemini_healthy_2222222')).toBe(false);

      expect(AiRotator.gemini.getNextKey()).toBe('gemini_healthy_2222222');
    });
  });

  describe('OpenRouter Provider Rotation & Circuit Breaker', () => {
    test('should discover keys from OPENROUTER_API_KEYS and OPENROUTER_API_KEY_2', () => {
      process.env.OPENROUTER_API_KEYS = 'sk-or-key-a, sk-or-key-b';
      process.env.OPENROUTER_API_KEY_2 = 'sk-or-key-c';

      const keys = AiRotator.openrouter.getKeys();
      expect(keys).toEqual(['sk-or-key-a', 'sk-or-key-b', 'sk-or-key-c']);
    });

    test('should rotate OpenRouter keys per-request', () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-11111111111111';
      process.env.OPENROUTER_API_KEY_2 = 'sk-or-22222222222222';

      expect(AiRotator.openrouter.getNextKey()).toBe('sk-or-11111111111111');
      expect(AiRotator.openrouter.getNextKey()).toBe('sk-or-22222222222222');
      expect(AiRotator.openrouter.getNextKey()).toBe('sk-or-11111111111111');
    });

    test('should handle credit exhaustion circuit breaker for OpenRouter', () => {
      expect(AiRotator.openrouter.isCreditExhausted()).toBe(false);
      AiRotator.openrouter.markCreditExhausted(5000);
      expect(AiRotator.openrouter.isCreditExhausted()).toBe(true);

      AiRotator.openrouter.resetCreditStatus();
      expect(AiRotator.openrouter.isCreditExhausted()).toBe(false);
    });

    test('should support fallback handover away from failing OpenRouter key', () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-fail-111111111';
      process.env.OPENROUTER_API_KEY_2 = 'sk-or-backup-2222222';

      const backupKey = AiRotator.openrouter.getFallbackKey('sk-or-fail-111111111');
      expect(backupKey).toBe('sk-or-backup-2222222');
    });
  });

  describe('Custom ProviderKeyRotator Instance', () => {
    test('can instantiate independent custom rotator for future providers', () => {
      process.env.MISTRAL_API_KEY = 'mis-1';
      process.env.MISTRAL_API_KEY_2 = 'mis-2';

      const mistralRotator = new ProviderKeyRotator({
        providerName: 'Mistral',
        envPrefix: 'MISTRAL_API_KEY'
      });

      expect(mistralRotator.getKeys()).toEqual(['mis-1', 'mis-2']);
      expect(mistralRotator.getNextKey()).toBe('mis-1');
      expect(mistralRotator.getNextKey()).toBe('mis-2');
      expect(mistralRotator.getNextKey()).toBe('mis-1');
    });
  });
});
