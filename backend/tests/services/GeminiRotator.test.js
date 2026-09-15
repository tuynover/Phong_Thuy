const GeminiRotator = require('../../src/core/ai/GeminiRotator');

describe('GeminiRotator Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    GeminiRotator.currentIndex = 0;
    GeminiRotator.fallbackIndex = 0;
    GeminiRotator.resetRateLimits();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should return 2 keys when GEMINI_API_KEY and GEMINI_API_KEY_2 are configured', () => {
    process.env.GEMINI_API_KEY = 'test_gemini_key_1111111111';
    process.env.GEMINI_API_KEY_2 = 'test_gemini_key_2222222222';

    const keys = GeminiRotator.getKeys();
    expect(keys.length).toBe(2);
    expect(keys[0]).toBe('test_gemini_key_1111111111');
    expect(keys[1]).toBe('test_gemini_key_2222222222');
  });

  test('should rotate round-robin with getNextKey', () => {
    process.env.GEMINI_API_KEY = 'key_A_1234567890';
    process.env.GEMINI_API_KEY_2 = 'key_B_1234567890';

    const k1 = GeminiRotator.getNextKey();
    const k2 = GeminiRotator.getNextKey();
    const k3 = GeminiRotator.getNextKey();

    expect(k1).toBe('key_A_1234567890');
    expect(k2).toBe('key_B_1234567890');
    expect(k3).toBe('key_A_1234567890');
  });

  test('should rotate between 2 keys in fallback mode with getFallbackKey', () => {
    process.env.GEMINI_API_KEY = 'key_A_1234567890';
    process.env.GEMINI_API_KEY_2 = 'key_B_1234567890';

    const fb1 = GeminiRotator.getFallbackKey();
    const fb2 = GeminiRotator.getFallbackKey();
    const fb3 = GeminiRotator.getFallbackKey();

    expect(fb1).toBe('key_A_1234567890');
    expect(fb2).toBe('key_B_1234567890');
    expect(fb3).toBe('key_A_1234567890');
  });

  test('should handover to alternate key when excludeKey is provided', () => {
    process.env.GEMINI_API_KEY = 'key_primary_1234567890';
    process.env.GEMINI_API_KEY_2 = 'key_secondary_1234567890';

    // Key primary failed, fallback should choose secondary
    const selected = GeminiRotator.getFallbackKey('key_primary_1234567890');
    expect(selected).toBe('key_secondary_1234567890');

    // Key secondary failed, fallback should choose primary
    const nextSelected = GeminiRotator.getFallbackKey('key_secondary_1234567890');
    expect(nextSelected).toBe('key_primary_1234567890');
  });

  test('should skip rate-limited key and choose healthy key', () => {
    process.env.GEMINI_API_KEY = 'key_rate_limited_123456';
    process.env.GEMINI_API_KEY_2 = 'key_healthy_1234567890';

    // Mark key 1 as rate limited for 30 seconds
    GeminiRotator.markKeyRateLimited('key_rate_limited_123456', 30000);
    expect(GeminiRotator.isKeyRateLimited('key_rate_limited_123456')).toBe(true);
    expect(GeminiRotator.isKeyRateLimited('key_healthy_1234567890')).toBe(false);

    // Both getNextKey and getFallbackKey must select the healthy key
    const nextKey = GeminiRotator.getNextKey();
    expect(nextKey).toBe('key_healthy_1234567890');

    const fallbackKey = GeminiRotator.getFallbackKey();
    expect(fallbackKey).toBe('key_healthy_1234567890');
  });

  test('should return safe masked labels with getKeyLabel', () => {
    process.env.GEMINI_API_KEY = 'AIzaSySecretKey12345';
    process.env.GEMINI_API_KEY_2 = 'AIzaSySecretKey67890';

    const label1 = GeminiRotator.getKeyLabel('AIzaSySecretKey12345');
    const label2 = GeminiRotator.getKeyLabel('AIzaSySecretKey67890');

    expect(label1).toContain('Gemini-Key-1');
    expect(label1).toContain('AIzaSy...2345');
    expect(label2).toContain('Gemini-Key-2');
    expect(label2).toContain('AIzaSy...7890');
  });

  test('should cache GoogleGenerativeAI client instances with getGenAI', () => {
    process.env.GEMINI_API_KEY = 'test_key_client_cache';
    const client1 = GeminiRotator.getGenAI('test_key_client_cache');
    const client2 = GeminiRotator.getGenAI('test_key_client_cache');

    expect(client1).toBeDefined();
    expect(client1).toBe(client2); // Same cached instance
  });

  test('should rotate seamlessly across 3 keys in per-request round-robin', () => {
    process.env.GEMINI_API_KEY = 'key_slot_1_1111111111';
    process.env.GEMINI_API_KEY_2 = 'key_slot_2_2222222222';
    process.env.GEMINI_API_KEY_3 = 'key_slot_3_3333333333';

    const keys = GeminiRotator.getKeys();
    expect(keys.length).toBe(3);

    expect(GeminiRotator.getNextKey()).toBe('key_slot_1_1111111111');
    expect(GeminiRotator.getNextKey()).toBe('key_slot_2_2222222222');
    expect(GeminiRotator.getNextKey()).toBe('key_slot_3_3333333333');
    expect(GeminiRotator.getNextKey()).toBe('key_slot_1_1111111111');
    expect(GeminiRotator.getNextKey()).toBe('key_slot_2_2222222222');
  });
});

