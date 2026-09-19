const AgeClassifier = require('../../src/shared/utils/AgeClassifier');

describe('AgeClassifier Utility Unit Tests', () => {
  const currentYear = 2026;

  test('should extract birth year from birthSolarYear in inputInfo', () => {
    const record = { inputInfo: { birthSolarYear: 2015 } };
    const info = AgeClassifier.getLunarAgeInfo(record, currentYear);
    expect(info.birthYear).toBe(2015);
    // 2026 - 2015 + 1 = 12 tuổi mụ
    expect(info.lunarAge).toBe(12);
    expect(info.ageGroup).toBe('CHILD');
  });

  test('should extract birth year from date string (DD/MM/YYYY)', () => {
    const record = { inputInfo: { date: '15/08/2000' } };
    const info = AgeClassifier.getLunarAgeInfo(record, currentYear);
    expect(info.birthYear).toBe(2000);
    // 2026 - 2000 + 1 = 27 tuổi mụ -> YOUNG_ADULT
    expect(info.lunarAge).toBe(27);
    expect(info.ageGroup).toBe('YOUNG_ADULT');
  });

  test('should extract birth year from date string (YYYY-MM-DD)', () => {
    const record = { inputInfo: { date: '1985-11-20' } };
    const info = AgeClassifier.getLunarAgeInfo(record, currentYear);
    expect(info.birthYear).toBe(1985);
    // 2026 - 1985 + 1 = 42 tuổi mụ -> ADULT
    expect(info.lunarAge).toBe(42);
    expect(info.ageGroup).toBe('ADULT');
  });

  test('should correctly classify senior over 55 lunar years', () => {
    const record = { inputInfo: { date: '01/01/1960' } };
    const info = AgeClassifier.getLunarAgeInfo(record, currentYear);
    expect(info.birthYear).toBe(1960);
    // 2026 - 1960 + 1 = 67 tuổi mụ -> SENIOR
    expect(info.lunarAge).toBe(67);
    expect(info.ageGroup).toBe('SENIOR');
  });

  test('should handle edge cases: 17 lunar years is CHILD, 18 lunar years is YOUNG_ADULT', () => {
    // Sinh 2010 -> 2026 - 2010 + 1 = 17 tuổi mụ -> CHILD
    const childRecord = { inputInfo: { birthSolarYear: 2010 } };
    expect(AgeClassifier.getLunarAgeInfo(childRecord, currentYear).ageGroup).toBe('CHILD');

    // Sinh 2009 -> 2026 - 2009 + 1 = 18 tuổi mụ -> YOUNG_ADULT
    const youngAdultRecord = { inputInfo: { birthSolarYear: 2009 } };
    expect(AgeClassifier.getLunarAgeInfo(youngAdultRecord, currentYear).ageGroup).toBe('YOUNG_ADULT');
  });

  test('should fallback safely when birth year cannot be determined', () => {
    const invalidRecord = { inputInfo: { date: 'Invalid Date' } };
    const info = AgeClassifier.getLunarAgeInfo(invalidRecord, currentYear);
    expect(info.ageGroup).toBe('ADULT');
    expect(info.isEstimated).toBe(true);
  });
});
