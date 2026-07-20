const AstrologyEngine = require('../../src/shared/engines/AstrologyEngine');
const ZiweiFormatter = require('../../src/services/ZiweiFormatter');

describe('Ziwei Astrology Engine & Formatter Unit Tests', () => {
    test('AstrologyEngine should generate valid Tử Vi astrolabe with 12 palaces', () => {
        const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
            date: '1990-05-15',
            hour: 5,
            gender: 'male',
            lang: 'vi-VN'
        });

        expect(rawAstrolabe).toBeDefined();
        // iztro astrolabe should contain 12 palaces
        expect(rawAstrolabe.palaces).toBeDefined();
        expect(rawAstrolabe.palaces.length).toBe(12);

        // Verify solar / lunar date info exists in astrolabe
        expect(rawAstrolabe.solarDate).toBeDefined();
        expect(rawAstrolabe.lunarDate).toBeDefined();
        expect(rawAstrolabe.rawDates).toBeDefined();
    });

    test('ZiweiFormatter should format raw astrolabe to standard output', () => {
        const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
            date: '1995-08-20',
            hour: 7,
            gender: 'female',
            lang: 'vi-VN'
        });

        const metadata = { engine_version: '1.0.0', school: 'nam_phai' };
        const standardOutput = ZiweiFormatter.toStandardOutput(rawAstrolabe, 'test-id-123', metadata);

        expect(standardOutput).toBeDefined();
        expect(standardOutput.chart_id).toBe('test-id-123');
        expect(standardOutput.chart_data).toBeDefined();
        expect(standardOutput.metadata.engine_version).toBe('1.0.0');
        expect(standardOutput.metadata.school).toBe('nam_phai');
    });

    test('ZiweiFormatter compressForAi should return compressed object for AI prompt', () => {
        const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
            date: '1990-05-15',
            hour: 5,
            gender: 'male'
        });
        const standardOutput = ZiweiFormatter.toStandardOutput(rawAstrolabe, 'test-id-123', {});

        const compressed = ZiweiFormatter.compressForAi(standardOutput);

        expect(compressed).toBeDefined();
        expect(compressed.palaces).toBeDefined();
        expect(compressed.palaces.length).toBe(12);
        expect(compressed.fiveElementsClass).toBeDefined();
    });
});
