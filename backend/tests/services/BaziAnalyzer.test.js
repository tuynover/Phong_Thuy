const BaziAnalyzer = require('../../src/services/BaziAnalyzer');

describe('BaziAnalyzer Service Unit Tests', () => {
    test('BaziAnalyzer should be defined and expose analyze method', () => {
        expect(BaziAnalyzer).toBeDefined();
        expect(typeof BaziAnalyzer.analyze).toBe('function');
    });

    test('analyze should correctly analyze Bazi chart for male born on 1990-05-15 10:30', () => {
        const result = BaziAnalyzer.analyze('1990-05-15', '10:30', 1);

        expect(result).toBeDefined();
        expect(result.canChi).toBeDefined();
        expect(result.canChi.year.gan).toBeDefined();
        expect(result.canChi.year.zhi).toBeDefined();
        expect(result.canChi.month.gan).toBeDefined();
        expect(result.canChi.day.gan).toBeDefined();
        expect(result.canChi.hour.gan).toBeDefined();
        expect(result.nguHanh).toBeDefined();
        expect(result.dungThan).toBeDefined();
        expect(result.hyThan).toBeDefined();

        // Total normalized percentage of 5 elements should sum close to 100%
        const totalPercentage = Object.values(result.nguHanh).reduce((acc, val) => acc + val, 0);
        expect(totalPercentage).toBeGreaterThanOrEqual(99.9);
        expect(totalPercentage).toBeLessThanOrEqual(100.1);
    });

    test('analyze should analyze Bazi chart for female born on 1995-08-20 14:00', () => {
        const result = BaziAnalyzer.analyze('1995-08-20', '14:00', 0);

        expect(result).toBeDefined();
        expect(result.canChi.year.gan).toBeDefined();
        expect(result.canChi.year.zhi).toBeDefined();
        expect(result.metadata.solarTimestamp).toBeGreaterThan(0);
    });
});
