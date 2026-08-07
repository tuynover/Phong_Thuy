const InputValidator = require('../../src/services/InputValidator');

describe('InputValidator Comprehensive Unit Tests', () => {

    describe('1. isValidRealDate Method', () => {
        test('Should approve valid real calendar dates', () => {
            expect(InputValidator.isValidRealDate(1990, 5, 15)).toBe(true);
            expect(InputValidator.isValidRealDate(2024, 2, 29)).toBe(true); // Leap year
        });

        test('Should reject invalid calendar dates', () => {
            expect(InputValidator.isValidRealDate(2023, 2, 29)).toBe(false); // Non-leap year
            expect(InputValidator.isValidRealDate(2023, 4, 31)).toBe(false); // April has 30 days
            expect(InputValidator.isValidRealDate(1899, 12, 31)).toBe(false); // Year < 1900
            expect(InputValidator.isValidRealDate(2101, 1, 1)).toBe(false); // Year > 2100
        });

        test('Should reject future dates', () => {
            const nextYear = new Date().getFullYear() + 1;
            expect(InputValidator.isValidRealDate(nextYear, 1, 1)).toBe(false);
        });
    });

    describe('2. validateBaziInput Method', () => {
        test('Should validate and format correct Bazi input with DD/MM/YYYY', () => {
            const result = InputValidator.validateBaziInput({
                date: '15/05/1990',
                time: '08:30',
                gender: 'Nam',
                name: ' Nguyễn Văn A '
            });
            expect(result.isValid).toBe(true);
            expect(result.sanitized.date).toBe('15/05/1990');
            expect(result.sanitized.time).toBe('08:30');
            expect(result.sanitized.gender).toBe(1);
            expect(result.sanitized.name).toBe('Nguyễn Văn A');
        });

        test('Should validate and format correct Bazi input with YYYY-MM-DD', () => {
            const result = InputValidator.validateBaziInput({
                date: '1990-05-15',
                time: '8:5',
                gender: 'nữ',
                name: 'Trần Thị B'
            });
            expect(result.isValid).toBe(true);
            expect(result.sanitized.date).toBe('15/05/1990');
            expect(result.sanitized.time).toBe('08:05');
            expect(result.sanitized.gender).toBe(0);
        });

        test('Should reject invalid Bazi dates, times, or gender', () => {
            // Invalid date format
            expect(InputValidator.validateBaziInput({ date: '1990/05/15', time: '08:30', gender: 1 }).isValid).toBe(false);
            // Non-existent date
            expect(InputValidator.validateBaziInput({ date: '31/04/1990', time: '08:30', gender: 1 }).isValid).toBe(false);
            // Invalid hours/minutes
            expect(InputValidator.validateBaziInput({ date: '15/05/1990', time: '24:00', gender: 1 }).isValid).toBe(false);
            expect(InputValidator.validateBaziInput({ date: '15/05/1990', time: '08:60', gender: 1 }).isValid).toBe(false);
            // Invalid gender
            expect(InputValidator.validateBaziInput({ date: '15/05/1990', time: '08:30', gender: 'other' }).isValid).toBe(false);
        });
    });

    describe('3. validateZiweiInput Method', () => {
        test('Should validate and format correct Ziwei input', () => {
            const result = InputValidator.validateZiweiInput({
                date: '1990-05-15',
                hour: 5,
                gender: 1,
                timezone: 7,
                school: 'bac_phai',
                name: 'Nguyễn Tử Vi'
            });
            expect(result.isValid).toBe(true);
            expect(result.sanitized.date).toBe('1990-05-15');
            expect(result.sanitized.hour).toBe(5);
            expect(result.sanitized.gender).toBe('Nam');
            expect(result.sanitized.timezone).toBe(7);
        });

        test('Should support DD/MM/YYYY and time string conversion to hour index', () => {
            const result = InputValidator.validateZiweiInput({
                date: '15/05/1990',
                time: '02:30', // Converts to hour index 1 (Sửu: 1-3h)
                gender: '0',
                timezone: '8'
            });
            expect(result.isValid).toBe(true);
            expect(result.sanitized.date).toBe('1990-05-15');
            expect(result.sanitized.hour).toBe(1);
            expect(result.sanitized.gender).toBe('Nữ');
            expect(result.sanitized.timezone).toBe(8);
        });

        test('Should reject invalid timezone or hour index', () => {
            expect(InputValidator.validateZiweiInput({ date: '1990-05-15', hour: 12, gender: 1 }).isValid).toBe(false); // Hour > 11
            expect(InputValidator.validateZiweiInput({ date: '1990-05-15', hour: 5, gender: 1, timezone: 15 }).isValid).toBe(false); // Timezone > 14
        });
    });

    describe('4. validateMarriageInput Method', () => {
        test('Should validate valid male and female inputs', () => {
            const result = InputValidator.validateMarriageInput({
                male: { date: '15/05/1990', time: '08:30', name: 'Nam Test' },
                female: { date: '20/10/1992', time: '14:00', name: 'Nữ Test' }
            });
            expect(result.isValid).toBe(true);
            expect(result.sanitized.male.gender).toBe(1);
            expect(result.sanitized.female.gender).toBe(0);
        });

        test('Should reject if male or female data is missing or invalid', () => {
            expect(InputValidator.validateMarriageInput({ male: {} }).isValid).toBe(false);
            expect(InputValidator.validateMarriageInput({
                male: { date: '15/05/1990', time: '08:30' },
                female: { date: '31/04/1992', time: '14:00' } // Invalid date
            }).isValid).toBe(false);
        });
    });

    describe('5. validateIChingInput Method', () => {
        const buildValidLines = () => [
            { type: 1, moving: false },
            { type: 0, moving: true },
            { type: 1, moving: false },
            { type: 0, moving: false },
            { type: 1, moving: false },
            { type: 0, moving: false }
        ];

        test('Should validate correct 6 lines and question', () => {
            const result = InputValidator.validateIChingInput({
                lines: buildValidLines(),
                question: 'Hỏi về sự nghiệp?'
            });
            expect(result.isValid).toBe(true);
        });

        test('Should reject invalid hexagram lines structure', () => {
            // Missing lines
            expect(InputValidator.validateIChingInput({ lines: [] }).isValid).toBe(false);
            // 5 lines only
            expect(InputValidator.validateIChingInput({ lines: buildValidLines().slice(0, 5) }).isValid).toBe(false);
            // Invalid type
            const badLines1 = buildValidLines();
            badLines1[0].type = 3;
            expect(InputValidator.validateIChingInput({ lines: badLines1 }).isValid).toBe(false);
            // Invalid moving type
            const badLines2 = buildValidLines();
            badLines2[0].moving = 'yes';
            expect(InputValidator.validateIChingInput({ lines: badLines2 }).isValid).toBe(false);
        });

        test('Should reject long question over 500 characters', () => {
            const longQuestion = 'a'.repeat(501);
            const result = InputValidator.validateIChingInput({
                lines: buildValidLines(),
                question: longQuestion
            });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('không được vượt quá 500 ký tự');
        });
    });
});
