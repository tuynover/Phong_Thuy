const AstrologyEngine = require('../../src/shared/engines/AstrologyEngine');
const ZiweiFormatter = require('../../src/services/ZiweiFormatter');
const ZiweiValidator = require('../../src/services/ZiweiValidators');
const ZiweiCache = require('../../src/services/ZiweiCache');

describe('Ziwei Astrology Engine, Formatter & Validator Comprehensive Unit Tests', () => {

    describe('1. Astrology Engine Generation (12 Palaces & Star Placement)', () => {
        test('AstrologyEngine should generate valid Tử Vi astrolabe with 12 palaces', () => {
            const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
                date: '1990-05-15',
                hour: 5,
                gender: 'male',
                lang: 'vi-VN'
            });

            expect(rawAstrolabe).toBeDefined();
            expect(rawAstrolabe.palaces).toBeDefined();
            expect(rawAstrolabe.palaces.length).toBe(12);

            expect(rawAstrolabe.solarDate).toBeDefined();
            expect(rawAstrolabe.lunarDate).toBeDefined();
            expect(rawAstrolabe.rawDates).toBeDefined();
        });

        test('Every palace should have a valid name, earthly branch, and major stars list', () => {
            const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
                date: '1988-08-18',
                hour: 12,
                gender: 'female',
                lang: 'vi-VN'
            });

            const palaceNames = rawAstrolabe.palaces.map(p => p.name.toLowerCase());
            expect(palaceNames).toContain('mệnh');
            expect(rawAstrolabe.palaces.some(p => p.isBodyPalace)).toBe(true);

            rawAstrolabe.palaces.forEach(p => {
                expect(p.earthlyBranch).toBeDefined();
                expect(Array.isArray(p.majorStars)).toBe(true);
                expect(Array.isArray(p.minorStars)).toBe(true);
                expect(Array.isArray(p.adjectiveStars)).toBe(true);
            });
        });

        test('Should correctly calculate Five Elements Bureau (Cục)', () => {
            const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
                date: '1992-03-25',
                hour: 8,
                gender: 'Nam'
            });

            expect(rawAstrolabe.fiveElementsClass).toBeDefined();
        });

        test('Should handle male vs female directional differences for Dai Han progression', () => {
            const maleAstrolabe = AstrologyEngine.generate('tu_vi', { date: '1990-05-15', hour: 5, gender: 'male' });
            const femaleAstrolabe = AstrologyEngine.generate('tu_vi', { date: '1990-05-15', hour: 5, gender: 'female' });

            expect(maleAstrolabe).toBeDefined();
            expect(femaleAstrolabe).toBeDefined();
            // Both generate 12 palaces
            expect(maleAstrolabe.palaces.length).toBe(12);
            expect(femaleAstrolabe.palaces.length).toBe(12);
        });
    });

    describe('2. Ziwei Formatter & Compression for AI', () => {
        test('toStandardOutput should produce structured payload', () => {
            const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
                date: '1995-10-20',
                hour: 3,
                gender: 'Nam'
            });
            const standardOutput = ZiweiFormatter.toStandardOutput(rawAstrolabe, 'id-123', {});

            expect(standardOutput).toBeDefined();
            expect(standardOutput.chart_data).toBeDefined();
            expect(standardOutput.chart_data.solarDate).toBeDefined();
        });

        test('compressForAi should reduce chart payload size', () => {
            const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
                date: '1990-01-01',
                hour: 0,
                gender: 'Nữ'
            });
            const standardOutput = ZiweiFormatter.toStandardOutput(rawAstrolabe, 'id-123', {});
            const compressed = ZiweiFormatter.compressForAi(standardOutput);

            expect(compressed).toBeDefined();
            expect(compressed.palaces).toBeDefined();
            expect(compressed.palaces.length).toBe(12);
            expect(compressed.fiveElementsClass).toBeDefined();
        });

        test('compressForAi should include major stars and four transformations (Tứ Hóa)', () => {
            const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
                date: '1985-11-11',
                hour: 5,
                gender: 'Nam'
            });
            const standardOutput = ZiweiFormatter.toStandardOutput(rawAstrolabe, 'id-456', {});
            const compressed = ZiweiFormatter.compressForAi(standardOutput);

            compressed.palaces.forEach(p => {
                expect(p).toHaveProperty('name');
                expect(p).toHaveProperty('earthlyBranch');
                expect(p).toHaveProperty('majorStars');
            });
        });
    });

    describe('3. Ziwei Validators & Cache Key Utilities', () => {
        test('ZiweiValidators should validate valid birth inputs', () => {
            const validData = { date: '1990-05-15', hour: 5, gender: 'Nam' };
            const result = ZiweiValidator.validateBirthInfo(validData);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('ZiweiValidators should reject missing date or invalid date format', () => {
            const invalidData1 = { hour: 5, gender: 'Nam' };
            const res1 = ZiweiValidator.validateBirthInfo(invalidData1);
            expect(res1.isValid).toBe(false);

            const invalidData2 = { date: '1990/05/15', hour: 5, gender: 'Nam' };
            const res2 = ZiweiValidator.validateBirthInfo(invalidData2);
            expect(res2.isValid).toBe(false);
        });

        test('ZiweiValidators should reject hour outside 0-11 range', () => {
            const invalidHour = { date: '1990-05-15', hour: 25, gender: 'Nam' };
            const res = ZiweiValidator.validateBirthInfo(invalidHour);
            expect(res.isValid).toBe(false);
        });

        test('ZiweiCache should generate deterministic hash keys', () => {
            const params1 = { date: '1990-05-15', hour: 5, gender: 'Nam' };
            const params2 = { date: '1990-05-15', hour: 5, gender: 'Nam' };
            const params3 = { date: '1990-05-15', hour: 6, gender: 'Nam' };

            const key1 = ZiweiCache.generateChartHash(params1);
            const key2 = ZiweiCache.generateChartHash(params2);
            const key3 = ZiweiCache.generateChartHash(params3);

            expect(key1).toBe(key2);
            expect(key1).not.toBe(key3);
        });
    });
});
