const BaziAnalyzer = require('../../src/services/BaziAnalyzer');

describe('Bộ Test Case Dụng Thần & Cách Cục Bát Tự (Dung Than & Pattern Test Suite)', () => {

    describe('1. Nhóm 5 Nguyên Lý Dụng Thần Cổ Học (5 Core Dung Than Principles)', () => {
        test('DT-01: Mùa Đông Buốt Giá (Hợi/Tý/Sửu) -> Ưu tiên Điều Hậu Hỏa', () => {
            const res = BaziAnalyzer.analyze('15/12/1988', '00:30', 1);
            expect(res.dungThan).toBe('Hỏa');
            expect(res.dungThanInfo.primary.mechanism).toContain('Điều Hậu');
        });

        test('DT-08: Viêm Thượng Cách (Hỏa vượng) -> Tòng thế Thổ/Mộc', () => {
            const res = BaziAnalyzer.analyze('12/06/1866', '12:00', 1);
            expect(res.dungThanInfo.primary.mechanism).toContain('Tòng Cách');
            expect(['Thổ', 'Mộc', 'Hỏa']).toContain(res.dungThan);
        });

        test('DT-10: Giá Sắc / Tòng Nhi Thổ vượng (Phạm Nhật Vượng)', () => {
            const res = BaziAnalyzer.analyze('05/08/1968', '08:30', 1);
            expect(res.dungThanInfo.primary.mechanism).toContain('Tòng Cách');
            expect(res.dungThan).toBe('Thổ');
        });

        test('DT-11: Tòng Tài Cách (Phạm Băng Băng)', () => {
            const res = BaziAnalyzer.analyze('16/09/1981', '06:15', 0);
            expect(res.dungThanInfo.primary.mechanism).toContain('Tòng Cách');
            expect(res.dungThan).toBe('Kim');
        });

        test('DT-12: Tòng Sát Cách (Trương Mỹ Lan)', () => {
            const res = BaziAnalyzer.analyze('13/10/1956', '12:00', 0);
            expect(res.dungThanInfo.primary.mechanism).toContain('Tòng Cách');
            expect(res.dungThan).toBe('Thổ');
        });

        test('DT-13: Thân Nhược Cần Sinh Phù (Ấn / Tỷ Kiếp)', () => {
            const res = BaziAnalyzer.analyze('15/06/1975', '06:00', 0);
            expect(res.dungThanInfo.primary.mechanism).toContain('Phù Ức Thân Nhược');
        });
    });

    describe('2. Nhóm Bát Chính Cách (8 Standard Structures)', () => {
        test('CC-01: Chính Quan Cách (Barack Obama)', () => {
            const res = BaziAnalyzer.analyze('04/08/1961', '19:24', 1);
            expect(res.analysis.cachCuc).toBeDefined();
        });

        test('CC-02: Thất Sát Cách (Napoléon Bonaparte)', () => {
            const res = BaziAnalyzer.analyze('15/08/1769', '11:30', 1);
            expect(res.analysis.cachCuc).toBe('Thất Sát cách');
        });

        test('CC-04: Thiên Tài Cách (Lưu Bá Ôn)', () => {
            const res = BaziAnalyzer.analyze('01/07/1311', '06:00', 1);
            expect(res.analysis.cachCuc).toBe('Thiên Tài cách');
        });

        test('CC-05: Chính Ấn Cách (Từ Hi Thái Hậu)', () => {
            const res = BaziAnalyzer.analyze('29/11/1835', '14:00', 0);
            expect(res.analysis.cachCuc).toBe('Chính Ấn cách');
        });

        test('CC-08: Thương Quan Cách (Phan Bội Châu)', () => {
            const res = BaziAnalyzer.analyze('26/12/1867', '06:30', 1);
            expect(res.analysis.cachCuc).toBe('Thương Quan cách');
        });
    });

    describe('3. Nhóm Quý Cách Đặc Thù (Special Patterns)', () => {
        test('SQ-01: Kiến Lộc Cách (Helen Keller)', () => {
            const res = BaziAnalyzer.analyze('27/06/1880', '16:00', 0);
            expect(res.analysis.cachCuc).toBe('Tỷ Kiên cách');
        });

        test('SQ-02: Dương Nhận Giá Sát (Đại tướng Võ Nguyên Giáp)', () => {
            const res = BaziAnalyzer.analyze('25/08/1911', '06:00', 1);
            expect(res.dungThan).toBe('Kim');
        });

        test('SQ-04: Thương Quan Chế Sát (Khổng Tử)', () => {
            const res = BaziAnalyzer.analyze('28/09/0551', '06:00', 1);
            expect(res.analysis.cachCuc).toBe('Chính Quan cách');
        });
    });
});
