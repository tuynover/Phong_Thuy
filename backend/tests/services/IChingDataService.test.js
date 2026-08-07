const IChingDataService = require('../../src/services/IChingDataService');

describe('IChingDataService Comprehensive Unit Tests', () => {

    test('reconstructLines should correctly reconstruct 6 lines for Thuần Càn (111111) moving at lines 1 & 6', () => {
        const record = {
            primaryHexagram: {
                binary_code: '111111',
                name: 'Thuần Càn',
                palace: 'Càn',
                palace_element: 'Kim'
            },
            movingLines: [1, 6],
            lunarDateInfo: {
                dayCanChi: 'Giáp Tý',
                monthCanChi: 'Bính Dần',
                tuankhong: 'Tuất Hợi'
            }
        };

        const result = IChingDataService.reconstructLines(record);

        expect(result).toBeDefined();
        expect(result.primaryHexagram).toBeDefined();
        expect(result.transformedHexagram).toBeDefined();
        expect(result.primaryLines).toHaveLength(6);
        expect(result.secondaryLines).toHaveLength(6);

        // Verify moving lines status
        expect(result.primaryLines[0].moving).toBe(true);
        expect(result.primaryLines[1].moving).toBe(false);
        expect(result.primaryLines[5].moving).toBe(true);
    });

    test('reconstructLines should handle non-moving lines correctly (pure hexagram without transformation)', () => {
        const record = {
            primaryHexagram: {
                binary_code: '000000',
                name: 'Thuần Khôn',
                palace: 'Khôn',
                palace_element: 'Thổ'
            },
            movingLines: [],
            lunarDateInfo: {
                dayCanChi: 'Ất Sửu',
                monthCanChi: 'Mậu Thìn',
                tuankhong: 'Hải Kim'
            }
        };

        const result = IChingDataService.reconstructLines(record);

        expect(result.primaryLines).toHaveLength(6);
        expect(result.primaryLines.every(l => l.moving === false)).toBe(true);
    });

    test('reconstructLines should correctly attach Six Animals (Lục Thú - luc_thu) based on Day Stem', () => {
        const recordGiap = {
            primaryHexagram: { binary_code: '101010', name: 'Thủy Hỏa Ký Tế', palace: 'Ly', palace_element: 'Hỏa' },
            movingLines: [2],
            lunarDateInfo: { dayCanChi: 'Giáp Tý', monthCanChi: 'Bính Dần', tuankhong: 'Tuất Hợi' }
        };

        const resGiap = IChingDataService.reconstructLines(recordGiap);
        expect(resGiap.primaryLines[0].luc_thu).toBeDefined();
        expect(typeof resGiap.primaryLines[0].luc_thu).toBe('string');
    });

    describe('IChingDataService.calculate Method', () => {
        const lines = [
            { type: 1, moving: false },
            { type: 1, moving: false },
            { type: 1, moving: false },
            { type: 1, moving: false },
            { type: 1, moving: false },
            { type: 1, moving: false }
        ];

        test('Should correctly calculate and map pure hexagram with no moving lines', () => {
            const fixedDate = new Date('2026-08-07T14:30:00Z'); // Fixed deterministic date
            const result = IChingDataService.calculate({ lines, now: fixedDate });

            expect(result).toBeDefined();
            expect(result.primary).toBeDefined();
            expect(result.secondary).toBeDefined();
            expect(result.primaryLines).toHaveLength(6);
            expect(result.secondaryLines).toHaveLength(6);
            
            // For a pure hexagram with no moving lines, secondary should be same as primary
            expect(result.secondary.binary_code).toBe(result.primary.binary_code);
            
            // Check that dateInfo keys are present and correctly populated
            expect(result.dateInfo).toBeDefined();
            expect(result.dateInfo.solarDate).toBeDefined();
            expect(result.dateInfo.lunarDateStr).toBeDefined();
            expect(result.dateInfo.dayCanChi).toBeDefined();
            expect(result.dateInfo.monthCanChi).toBeDefined();
        });

        test('Should throw error if lines array is invalid or missing', () => {
            expect(() => IChingDataService.calculate({ lines: null })).toThrow();
            expect(() => IChingDataService.calculate({ lines: lines.slice(0, 5) })).toThrow();
        });
    });
});
