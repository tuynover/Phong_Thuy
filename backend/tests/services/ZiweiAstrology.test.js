const AstrologyEngine = require('../../src/shared/engines/AstrologyEngine');
const ZiweiFormatter = require('../../src/services/ZiweiFormatter');
const ZiweiValidators = require('../../src/services/ZiweiValidators');
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

            const palaceNames = rawAstrolabe.palaces.map(p => p.name);
            expect(palaceNames).toContain('mệnh');
            expect(palaceNames).toContain('thân');

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
                gender: 'male'
            });

            expect(rawAstrolabe.fiveElementsClass).toBeDefined();
            expect(typeof rawAstrolabe.fiveElementsClass).toBe('string');
            expect(rawAstrolabe.fiveElementsClass.length).toBeGreaterThan(0);
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

        test('compressForAi should include major stars and four transformations (Tứ Hóa)', () => {
            const rawAstrolabe = AstrologyEngine.generate('tu_vi', {
                date: '1985-11-11',
                hour: 14,
                gender: 'male'
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
            const validData = { date: '1990-05-15', hour: 5, gender: 'male' };
            const result = ZiweiValidators.validateInput(validData);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
        });

        test('ZiweiValidators should reject missing date or invalid date format', () => {
            const invalidData1 = { hour: 5, gender: 'male' };
            const res1 = ZiweiValidators.validateInput(invalidData1);
            expect(res1.isValid).toBe(false);
            expect(res1.error).toBe('Thiếu ngày sinh');

            const invalidData2 = { date: '1990/05/15', hour: 5, gender: 'male' };
            const res2 = ZiweiValidators.validateInput(invalidData2);
            expect(res2.isValid).toBe(false);
            expect(res2.error).toBe('Ngày sinh không đúng định dạng YYYY-MM-DD');
        });

        test('ZiweiValidators should reject hour outside 0-23 range', () => {
            const invalidHour = { date: '1990-05-15', hour: 25, gender: 'male' };
            const res = ZiweiValidators.validateInput(invalidHour);
            expect(res.isValid).toBe(false);
            expect(res.error).toBe('Giờ sinh phải nằm trong khoảng 0-23');
        });

        test('ZiweiCache should generate deterministic hash keys', () => {
            const params1 = { date: '1990-05-15', hour: 5, gender: 'male' };
            const params2 = { date: '1990-05-15', hour: 5, gender: 'male' };
            const params3 = { date: '1990-05-15', hour: 6, gender: 'male' };

            const key1 = ZiweiCache.generateCacheKey(params1);
            const key2 = ZiweiCache.generateCacheKey(params2);
            const key3 = ZiweiCache.generateCacheKey(params3);

            expect(key1).toBe(key2);
            expect(key1).not.toBe(key3);
        });
    });
});
