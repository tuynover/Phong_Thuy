const IChingDataService = require('../../src/services/IChingDataService');

describe('IChingDataService Unit Tests', () => {
    test('IChingDataService should reconstruct hexagram lines correctly', () => {
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

        // Verify moving lines
        expect(result.primaryLines[0].moving).toBe(true);
        expect(result.primaryLines[1].moving).toBe(false);
        expect(result.primaryLines[5].moving).toBe(true);
    });
});
