const IztroEngine = require('../../src/shared/engines/iztro.engine');
const ZiweiFormatter = require('../../src/services/ZiweiFormatter');

describe('Ziwei Hồi Quy & Snapshot Testing (60+ Ca)', () => {
    test('Xác thực đầu ra của 60+ cấu hình Tử Vi đại diện', () => {
        const engine = new IztroEngine();
        
        const generateCases = () => {
            const cases = [];
            const hours = [0, 2, 4, 6, 8, 10, 1, 3, 5, 7, 9, 11];
            const genders = ['Nam', 'Nữ'];
            let rotator = 0;
            for (let y = 1975; y <= 2020; y += 3) {
                // Xoay vòng tháng, ngày, giờ, giới tính
                const m = String((rotator % 12) + 1).padStart(2, '0');
                const d = String((rotator % 28) + 1).padStart(2, '0');
                const hour = hours[rotator % hours.length];
                const gender = genders[rotator % 2];
                cases.push({ date: `${y}-${m}-${d}`, hour, gender });
                rotator++;
            }
            return cases;
        };

        const testCases = generateCases();
        const results = testCases.map(c => {
            const rawAstrolabe = engine.generate({
                date: c.date,
                hour: c.hour,
                gender: c.gender
            });
            const formatted = ZiweiFormatter.toStandardOutput(rawAstrolabe, 'mock-chart-id', { version: '1.0' });
            
            // Trích xuất thông tin cốt lõi để snapshot gọn gàng
            const cleanPalaces = formatted.chart_data.palaces.map(p => ({
                index: p.index,
                name: p.name,
                isBodyPalace: p.isBodyPalace,
                heavenlyStem: p.heavenlyStem,
                earthlyBranch: p.earthlyBranch,
                majorStars: p.majorStars.map(s => `${s.name}(${s.brightness})${s.mutagen ? ':' + s.mutagen : ''}`).sort(),
                minorStars: p.minorStars.map(s => `${s.name}(${s.brightness})${s.mutagen ? ':' + s.mutagen : ''}`).sort(),
                adjectiveStars: p.adjectiveStars.map(s => s.name).sort()
            }));

            return {
                date: c.date,
                hour: c.hour,
                gender: c.gender,
                solarDate: formatted.chart_data.solarDate,
                zodiac: formatted.chart_data.zodiac,
                sign: formatted.chart_data.sign,
                soul: formatted.chart_data.soul,
                body: formatted.chart_data.body,
                fiveElementsClass: formatted.chart_data.fiveElementsClass,
                chineseDate: formatted.chart_data.chineseDate,
                palaces: cleanPalaces
            };
        });

        expect(results).toMatchSnapshot();
    });
});
