const RuleEngineService = require('../../src/services/RuleEngineService');

describe('RuleEngineService Unit Tests', () => {
    // ==================== EXISTING TESTS (4) ====================

    test('getDungThanByQuestion should return correct Dụng Thần for career questions', () => {
        const dungThan = RuleEngineService.getDungThanByQuestion('Tôi có được thăng chức công việc năm nay không?');
        expect(dungThan).toBe('Quan Quỷ');
    });

    test('getDungThanByQuestion should return correct Dụng Thần for wealth questions', () => {
        const dungThan = RuleEngineService.getDungThanByQuestion('Năm nay đầu tư mua bán bất động sản có lời không?');
        expect(dungThan).toBe('Thê Tài');
    });

    test('getDungThanByQuestion should return correct Dụng Thần for health questions', () => {
        const dungThan = RuleEngineService.getDungThanByQuestion('Sức khỏe người thân và bệnh tật năm nay ra sao?');
        expect(dungThan).toBe('Tử Tôn');
    });

    test('getStrength should categorize Vượng/Tướng as strong and Hưu/Tù/Tử as weak', () => {
        expect(RuleEngineService.getStrength('Vượng')).toBe('strong');
        expect(RuleEngineService.getStrength('Tướng')).toBe('strong');
        expect(RuleEngineService.getStrength('Hưu')).toBe('weak');
        expect(RuleEngineService.getStrength('Tử')).toBe('weak');
    });

    // ==================== NEW getDungThanByQuestion TESTS (5) ====================

    test('getDungThanByQuestion: female (gender=0) asking about marriage should return Quan Quỷ', () => {
        const dungThan = RuleEngineService.getDungThanByQuestion('Tôi muốn hỏi về hôn nhân năm nay', 0);
        expect(dungThan).toBe('Quan Quỷ');
    });

    test('getDungThanByQuestion: education question should return Phụ Mẫu', () => {
        const dungThan = RuleEngineService.getDungThanByQuestion('Chuyện học hành thi cử của con tôi ra sao?');
        expect(dungThan).toBe('Phụ Mẫu');
    });

    test('getDungThanByQuestion: partnership question should return Huynh Đệ', () => {
        const dungThan = RuleEngineService.getDungThanByQuestion('Tôi muốn hỏi về bạn bè hợp tác kinh doanh');
        // 'bạn bè' and 'hợp tác' match Huynh Đệ, but 'kinh doanh' matches Thê Tài.
        // The source code checks 'tiền/tài/kinh doanh/mua bán/đầu tư' BEFORE 'bạn bè/đối tác/anh em/hợp tác'.
        // So we need a question that only has partnership keywords, not wealth keywords.
        const dungThanClean = RuleEngineService.getDungThanByQuestion('Tôi muốn hỏi về bạn bè hợp tác');
        expect(dungThanClean).toBe('Huynh Đệ');
    });

    test('getDungThanByQuestion: generic question without keywords should return Thế', () => {
        const dungThan = RuleEngineService.getDungThanByQuestion('Năm nay mọi chuyện có thuận lợi không?');
        expect(dungThan).toBe('Thế');
    });

    test('getDungThanByQuestion: empty/null question should return Thế', () => {
        expect(RuleEngineService.getDungThanByQuestion('')).toBe('Thế');
        expect(RuleEngineService.getDungThanByQuestion(null)).toBe('Thế');
        expect(RuleEngineService.getDungThanByQuestion(undefined)).toBe('Thế');
    });

    // ==================== NEW analyze() TESTS (11) ====================

    // Helper to build a minimal line object
    const makeLine = (overrides = {}) => ({
        relative: 'Huynh Đệ',
        element: 'Thổ',
        vuong_suy: 'Hưu',
        stem_branch: 'Mậu Thìn',
        is_host: false,
        is_guest: false,
        moving: false,
        tk: '',
        ...overrides
    });

    // Helper to build a 6-line record
    const makeRecord = (question, primaryOverrides = [], secondaryOverrides = []) => {
        const primaryLines = [];
        for (let i = 0; i < 6; i++) {
            primaryLines.push(makeLine(primaryOverrides[i] || {}));
        }
        const secondaryLines = [];
        for (let i = 0; i < 6; i++) {
            secondaryLines.push(makeLine(secondaryOverrides[i] || {}));
        }
        return { question, primaryLines, secondaryLines };
    };

    test('analyze: Dung Than found on hexagram should populate dungThanDetails.relation', () => {
        const record = makeRecord('Tôi có thăng tiến công việc không?', [
            { relative: 'Quan Quỷ', element: 'Kim', vuong_suy: 'Vượng', stem_branch: 'Canh Thân' },
            {},
            {},
            {},
            {},
            {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.dungThan).toBe('Quan Quỷ');
        expect(result.dungThanDetails.relation).toBe('Quan Quỷ');
        expect(result.dungThanDetails.element).toBe('Kim');
    });

    test('analyze: Thế and Ứng lines should be identified correctly', () => {
        const record = makeRecord('Tôi hỏi chuyện tổng quát', [
            {},
            { is_host: true, relative: 'Thê Tài', element: 'Mộc', vuong_suy: 'Vượng', stem_branch: 'Giáp Dần' },
            {},
            {},
            { is_guest: true, relative: 'Phụ Mẫu', element: 'Thủy', vuong_suy: 'Hưu', stem_branch: 'Nhâm Tý' },
            {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.the).not.toBeNull();
        expect(result.the.relation).toBe('Thê Tài');
        expect(result.the.element).toBe('Mộc');
        expect(result.ung).not.toBeNull();
        expect(result.ung.relation).toBe('Phụ Mẫu');
        expect(result.ung.element).toBe('Thủy');
    });

    test('analyze: moving line same element + branch advance should be Hóa Tiến', () => {
        // Primary: Giáp Dần (Dần=idx 2), element=Mộc
        // Secondary: Ất Mão (Mão=idx 3), element=Mộc  → sIdx(3) > pIdx(2), diff=1 ≤ 2 → Hóa Tiến
        const record = makeRecord('Chuyện tổng quát', [
            { moving: true, element: 'Mộc', stem_branch: 'Giáp Dần', relative: 'Huynh Đệ' },
            {}, {}, {}, {}, {}
        ], [
            { element: 'Mộc', stem_branch: 'Ất Mão', relative: 'Huynh Đệ' },
            {}, {}, {}, {}, {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.movingLines).toHaveLength(1);
        expect(result.movingLines[0].effect).toBe('Hóa Tiến');
    });

    test('analyze: moving line same element + branch retreat should be Hóa Thoái', () => {
        // Primary: Ất Mão (Mão=idx 3), element=Mộc
        // Secondary: Giáp Dần (Dần=idx 2), element=Mộc → sIdx(2) < pIdx(3), diff=1, not >9 → Hóa Thoái
        const record = makeRecord('Chuyện tổng quát', [
            { moving: true, element: 'Mộc', stem_branch: 'Ất Mão', relative: 'Huynh Đệ' },
            {}, {}, {}, {}, {}
        ], [
            { element: 'Mộc', stem_branch: 'Giáp Dần', relative: 'Huynh Đệ' },
            {}, {}, {}, {}, {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.movingLines).toHaveLength(1);
        expect(result.movingLines[0].effect).toBe('Hóa Thoái');
    });

    test('analyze: moving line different element + secondary sinh primary should be Hóa Sinh (Tốt)', () => {
        // sinh map: sElement → pElement. If sElement=Thổ, sinh[Thổ]=Kim, so pElement must be Kim.
        // Primary: Kim element, Secondary: Thổ element → Thổ sinh Kim → Hóa Sinh (Tốt)
        const record = makeRecord('Chuyện tổng quát', [
            { moving: true, element: 'Kim', stem_branch: 'Canh Thân', relative: 'Huynh Đệ' },
            {}, {}, {}, {}, {}
        ], [
            { element: 'Thổ', stem_branch: 'Mậu Thìn', relative: 'Phụ Mẫu' },
            {}, {}, {}, {}, {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.movingLines).toHaveLength(1);
        expect(result.movingLines[0].effect).toBe('Hóa Sinh (Tốt)');
    });

    test('analyze: moving line different element + secondary khắc primary should be Hóa Khắc (Xấu)', () => {
        // khac map: sElement → pElement. If sElement=Kim, khac[Kim]=Mộc, so pElement must be Mộc.
        // Primary: Mộc element, Secondary: Kim element → Kim khắc Mộc → Hóa Khắc (Xấu)
        const record = makeRecord('Chuyện tổng quát', [
            { moving: true, element: 'Mộc', stem_branch: 'Giáp Dần', relative: 'Huynh Đệ' },
            {}, {}, {}, {}, {}
        ], [
            { element: 'Kim', stem_branch: 'Canh Thân', relative: 'Quan Quỷ' },
            {}, {}, {}, {}, {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.movingLines).toHaveLength(1);
        expect(result.movingLines[0].effect).toBe('Hóa Khắc (Xấu)');
    });

    test('analyze: moving line different element + neither sinh nor khắc should be Hóa Biến', () => {
        // Primary: Mộc element, Secondary: Thủy element
        // sinh[Thủy]=Mộc → that IS sinh! So we need a pair that is neither sinh nor khắc.
        // sinh: Kim→Thủy, Thủy→Mộc, Mộc→Hỏa, Hỏa→Thổ, Thổ→Kim
        // khac: Kim→Mộc, Mộc→Thổ, Thổ→Thủy, Thủy→Hỏa, Hỏa→Kim
        // Let sElement=Mộc, pElement=Thủy: sinh[Mộc]=Hỏa (not Thủy), khac[Mộc]=Thổ (not Thủy) → Hóa Biến
        const record = makeRecord('Chuyện tổng quát', [
            { moving: true, element: 'Thủy', stem_branch: 'Nhâm Tý', relative: 'Huynh Đệ' },
            {}, {}, {}, {}, {}
        ], [
            { element: 'Mộc', stem_branch: 'Giáp Dần', relative: 'Tử Tôn' },
            {}, {}, {}, {}, {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.movingLines).toHaveLength(1);
        expect(result.movingLines[0].effect).toBe('Hóa Biến');
    });

    test('analyze: line with tk=K should add Tuần Không to specialStates', () => {
        const record = makeRecord('Chuyện tổng quát', [
            { tk: 'K', relative: 'Thê Tài', element: 'Kim', stem_branch: 'Canh Thân' },
            {}, {}, {}, {}, {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.specialStates).toContain('Tuần Không');
    });

    test('analyze: Dung Than not found on hexagram should add Dụng Thần Phục Tàng (Ẩn)', () => {
        // Ask about career (Quan Quỷ), but no line has relative='Quan Quỷ'
        const record = makeRecord('Hỏi về công việc sự nghiệp', [
            { relative: 'Thê Tài' },
            { relative: 'Huynh Đệ' },
            { relative: 'Tử Tôn' },
            { relative: 'Phụ Mẫu' },
            { relative: 'Thê Tài' },
            { relative: 'Huynh Đệ' }
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.dungThan).toBe('Quan Quỷ');
        expect(result.dungThanDetails.relation).toBe('Không hiện trên quẻ');
        expect(result.specialStates).toContain('Dụng Thần Phục Tàng (Ẩn)');
    });

    test('analyze: Thế element sinh Ứng element should add Thế Sinh Ứng', () => {
        // sinh: Kim→Thủy. Thế=Kim, Ứng=Thủy → Thế Sinh Ứng
        const record = makeRecord('Chuyện tổng quát', [
            {},
            { is_host: true, element: 'Kim', relative: 'Huynh Đệ', vuong_suy: 'Vượng', stem_branch: 'Canh Thân' },
            {},
            {},
            { is_guest: true, element: 'Thủy', relative: 'Tử Tôn', vuong_suy: 'Hưu', stem_branch: 'Nhâm Tý' },
            {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.specialStates).toContain('Thế Sinh Ứng');
    });

    test('analyze: confidence score calculation with specific Dung Than found + strong + moving lines', () => {
        // baseline = 0.75
        // dungThanTarget = 'Quan Quỷ' (not 'Thế') and mainDungThan exists → +0.10
        // dungThanInfo.strength = 'strong' (vuong_suy = 'Vượng') → +0.05
        // movingLinesResult.length > 0 → +0.05
        // Total = 0.95, clamped to 0.95
        const record = makeRecord('Hỏi về công việc thăng tiến', [
            { relative: 'Quan Quỷ', element: 'Kim', vuong_suy: 'Vượng', stem_branch: 'Canh Thân', moving: true },
            { relative: 'Thê Tài', element: 'Mộc', vuong_suy: 'Hưu', stem_branch: 'Giáp Dần' },
            { relative: 'Huynh Đệ', element: 'Thổ', vuong_suy: 'Tù', stem_branch: 'Mậu Thìn' },
            { relative: 'Phụ Mẫu', element: 'Hỏa', vuong_suy: 'Tướng', stem_branch: 'Bính Ngọ' },
            { relative: 'Tử Tôn', element: 'Thủy', vuong_suy: 'Tử', stem_branch: 'Nhâm Tý' },
            { relative: 'Huynh Đệ', element: 'Thổ', vuong_suy: 'Hưu', stem_branch: 'Kỷ Sửu' }
        ], [
            { relative: 'Quan Quỷ', element: 'Kim', stem_branch: 'Tân Dậu' },
            {}, {}, {}, {}, {}
        ]);
        const result = RuleEngineService.analyze(record);
        expect(result.confidence).toBe(0.95);
    });
});
