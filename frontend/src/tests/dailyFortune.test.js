import { describe, it, expect, beforeEach } from 'vitest';
import { 
  DAILY_FORTUNES, 
  getRandomDailyFortune, 
  getDailyFortune, 
  HEXAGRAM_PALACES, 
  PALACE_ELEMENT_THEMES,
  getTodayDateString,
  getDailyFortuneStorageKey,
  checkHasDrawnDailyFortune,
  saveDailyFortuneResult
} from '../features/iching/data/dailyFortuneData';

describe('Daily Fortune (64 Quẻ Dịch Hằng Ngày)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('phải có đủ chính xác 64 quẻ Dịch', () => {
    expect(DAILY_FORTUNES).toHaveLength(64);
  });

  it('mỗi quẻ phải có ID từ 1 đến 64 và đầy đủ các trường học thuật', () => {
    DAILY_FORTUNES.forEach((f, idx) => {
      expect(f.id).toBe(idx + 1);
      expect(f.hexagramName).toBeTruthy();
      expect(f.chineseName).toBeTruthy();
      expect(['Đại Cát', 'Thượng Cát', 'Trung Cát', 'Cẩn Trọng']).toContain(f.rank);
      expect(f.symbol).toBeTruthy();
      expect(f.tagline).toBeTruthy();
      expect(Array.isArray(f.poem)).toBe(true);
      expect(f.poem.length).toBe(4);
      expect(f.career).toBeTruthy();
      expect(f.wealth).toBeTruthy();
      expect(f.love).toBeTruthy();
      expect(f.luckyDirections).toBeTruthy();
      expect(f.luckyHours).toBeTruthy();
      expect(f.luckyNumbers).toBeTruthy();
      expect(f.luckyColor).toBeTruthy();
      expect(f.advice).toBeTruthy();

      // Kiểm tra ánh xạ Họ quẻ & Ngũ hành
      const palace = HEXAGRAM_PALACES[f.id];
      expect(palace).toBeDefined();
      expect(PALACE_ELEMENT_THEMES[palace.element]).toBeDefined();
    });
  });

  it('getRandomDailyFortune() phải trả về quẻ ngẫu nhiên hợp lệ trong 64 quẻ', () => {
    const fortune = getRandomDailyFortune();
    expect(fortune).toBeDefined();
    expect(fortune.id).toBeGreaterThanOrEqual(1);
    expect(fortune.id).toBeLessThanOrEqual(64);
  });

  it('getDailyFortune() tương thích ngược và trả về quẻ ngẫu nhiên', () => {
    const fortune = getDailyFortune();
    expect(fortune).toBeDefined();
    expect(fortune.id).toBeGreaterThanOrEqual(1);
    expect(fortune.id).toBeLessThanOrEqual(64);
  });

  it('quản lý trạng thái đã lắc quẻ trong ngày trên localStorage', () => {
    const testUser = 'user_test_99';
    expect(checkHasDrawnDailyFortune(testUser)).toBe(false);

    const randomFortune = getRandomDailyFortune();
    const today = getTodayDateString();
    saveDailyFortuneResult({
      date: today,
      fortune: randomFortune,
      drawnAt: new Date().toISOString()
    }, testUser);

    expect(checkHasDrawnDailyFortune(testUser)).toBe(true);
  });
});
