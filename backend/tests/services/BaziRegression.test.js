const BaziAnalyzer = require('../../src/services/BaziAnalyzer');

describe('Bazi Hồi Quy & Snapshot Testing (200+ Ca)', () => {
    test('Xác thực đầu ra của 260+ cấu hình Bát Tự đại diện', () => {
        const generateCases = () => {
            const cases = [];
            let hourRotator = 0;
            const hours = ['02:00', '08:00', '14:00', '20:00', '05:00', '11:00', '17:00', '23:00'];
            let genderRotator = 0;
            for (let y = 1990; y <= 2000; y++) {
                for (let m = 1; m <= 12; m++) {
                    for (const d of [7, 22]) {
                        const hour = hours[hourRotator % hours.length];
                        const gender = genderRotator % 2;
                        cases.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, time: hour, gender });
                        hourRotator++;
                        genderRotator++;
                    }
                }
            }
            return cases;
        };

        const testCases = generateCases();
        const results = testCases.map(c => {
            const res = BaziAnalyzer.analyze(c.date, c.time, c.gender);
            
            // Trích xuất các trường cốt lõi để snapshot gọn gàng, tránh phình to kích thước file
            const allShenSha = [
                ...res.canChi.year.shenSha,
                ...res.canChi.month.shenSha,
                ...res.canChi.day.shenSha,
                ...res.canChi.hour.shenSha
            ];
            
            return {
                d: c.date,
                t: c.time,
                g: c.gender,
                cc: `${res.canChi.year.canChi} - ${res.canChi.month.canChi} - ${res.canChi.day.canChi} - ${res.canChi.hour.canChi}`,
                nh: res.nguHanh,
                el: res.analysis.energy7Levels.level,
                cuc: res.analysis.cachCuc,
                dt: res.dungThan,
                ht: res.hyThan,
                kt: res.kyThan,
                ss: allShenSha.sort()
            };
        });

        expect(results).toMatchSnapshot();
    });
});
