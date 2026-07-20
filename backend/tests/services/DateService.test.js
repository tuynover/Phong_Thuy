const DateService = require('../../src/services/DateService');

describe('DateService Unit Tests', () => {
    // ==================== getUserYearInfo (3 tests) ====================

    test('getUserYearInfo: year 1990 should return Canh Ngọ, Lộ Bàng Thổ', () => {
        const info = DateService.getUserYearInfo(1990);
        expect(info.yearCanChi).toBe('Canh Ngọ');
        expect(info.naYin).toBe('Lộ Bàng Thổ');
        expect(info.gan).toBe('Canh');
        expect(info.zhi).toBe('Ngọ');
    });

    test('getUserYearInfo: year 2000 should return Canh Thìn, Bạch Lạp Kim', () => {
        const info = DateService.getUserYearInfo(2000);
        expect(info.yearCanChi).toBe('Canh Thìn');
        expect(info.naYin).toBe('Bạch Lạp Kim');
    });

    test('getUserYearInfo: year 2004 should return Giáp Thân, Tuyền Trung Thủy', () => {
        const info = DateService.getUserYearInfo(2004);
        expect(info.yearCanChi).toBe('Giáp Thân');
        expect(info.naYin).toBe('Tuyền Trung Thủy');
    });

    // ==================== checkDate (5 tests) ====================

    test('checkDate: DD/MM/YYYY format should parse correctly', () => {
        const result = DateService.checkDate(1990, '15/06/2025', '08:00', 'cuoi_hoi');
        expect(result.solarDateInfo.date).toBe('15/06/2025');
        expect(result.solarDateInfo.hour).toBe('08:00');
    });

    test('checkDate: YYYY-MM-DD format should parse correctly', () => {
        const result = DateService.checkDate(1990, '2025-06-15', '10:00', 'cuoi_hoi');
        expect(result.solarDateInfo.date).toBe('15/06/2025');
    });

    test('checkDate: result should contain all required keys', () => {
        const result = DateService.checkDate(1990, '15/06/2025', '08:00', 'cuoi_hoi');
        expect(result).toHaveProperty('userYearInfo');
        expect(result).toHaveProperty('dayEvaluation');
        expect(result).toHaveProperty('hourEvaluation');
        expect(result).toHaveProperty('goodHours');
        expect(result).toHaveProperty('solarDateInfo');
    });

    test('checkDate: dayEvaluation.rating should be a valid rating string', () => {
        const result = DateService.checkDate(1990, '15/06/2025', '08:00', 'cuoi_hoi');
        const validRatings = ['Rất tốt', 'Nên', 'Bình hòa', 'Không nên', 'Không được'];
        expect(validRatings).toContain(result.dayEvaluation.rating);
    });

    test('checkDate: goodHours should be an array', () => {
        const result = DateService.checkDate(1990, '15/06/2025', '08:00', 'cuoi_hoi');
        expect(Array.isArray(result.goodHours)).toBe(true);
    });

    // ==================== evaluateDay (tested indirectly via checkDate) (2 tests) ====================

    test('checkDate: dayEvaluation should have positiveFactors and negativeFactors arrays', () => {
        const result = DateService.checkDate(2000, '01/01/2025', '12:00', 'khai_truong');
        expect(Array.isArray(result.dayEvaluation.positiveFactors)).toBe(true);
        expect(Array.isArray(result.dayEvaluation.negativeFactors)).toBe(true);
    });

    test('checkDate: dayEvaluation should have lunarDateInfo with required fields', () => {
        const result = DateService.checkDate(2000, '01/01/2025', '12:00', 'khai_truong');
        const lunarInfo = result.dayEvaluation.lunarDateInfo;
        expect(lunarInfo).toHaveProperty('year');
        expect(lunarInfo).toHaveProperty('month');
        expect(lunarInfo).toHaveProperty('day');
        expect(lunarInfo).toHaveProperty('dayCanChi');
        expect(lunarInfo).toHaveProperty('truc');
        expect(lunarInfo).toHaveProperty('deity');
        expect(lunarInfo).toHaveProperty('deityType');
        expect(['Hoàng Đạo', 'Hắc Đạo']).toContain(lunarInfo.deityType);
    });

    // ==================== consultDates (2 tests) ====================

    test('consultDates: range of 3 days should return 3 recommendations', () => {
        const result = DateService.consultDates(1990, '01/06/2025', '03/06/2025', 'cuoi_hoi');
        expect(result.recommendations).toHaveLength(3);
        expect(result).toHaveProperty('userYearInfo');
    });

    test('consultDates: each recommendation should have solarDate, dayEvaluation, goodHours', () => {
        const result = DateService.consultDates(1990, '01/06/2025', '02/06/2025', 'nhap_trach');
        result.recommendations.forEach(rec => {
            expect(rec).toHaveProperty('solarDate');
            expect(rec).toHaveProperty('dayEvaluation');
            expect(rec).toHaveProperty('goodHours');
            expect(Array.isArray(rec.goodHours)).toBe(true);
        });
    });
});
