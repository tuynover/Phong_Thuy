const ConversationContextService = require('../../src/services/ConversationContextService');

describe('ConversationContextService - extractVipContext & parseInterpretationSections', () => {
    const mockVipContent = `
# TỬ VI ĐẨU SỐ ĐẠI THÀNH

### CỤM 1: CỐT CÁCH BẢN MỆNH & THÂN MỆNH
Đương số mang mệnh Vũ Khúc Thất Sát tại Mão. Tính cách quyết đoán, can trường.

### CỤM 2: QUAN LỘC, TÀI BẠCH & ĐIỀN TRẠCH
Cung Quan Lộc có Tử Vi Phá Quân. Đường công danh có quý nhân trợ lực, đầu tư vào năm 2026 sẽ có biến động mạnh về dòng tiền.

### CỤM 3: PHU THÊ, TỬ TỨC & HUYNH ĐỆ
Cung Phu Thê có Thiên Tướng tọa thủ. Vợ/chồng là người chu đáo, hòa nhã nhưng cần chú ý tính gia trưởng.

### CỤM 4: TẬT ÁCH & THIÊN DI
Cung Tật Ách cần chú ý bệnh về đường hô hấp và phẫu thuật nhỏ vào năm Thân.

### CHIẾN LƯỢC ĐIỀU HÒA & XU CÁT TỊ HUNG
Cần tu tâm dưỡng tính, chọn phương vị Đông Nam để kích hoạt tài vận.
`;

    const mockVipRecord = {
        aiInterpretation: {
            mode: 'vip',
            summary: 'Mệnh Vũ Khúc Thất Sát, tài lộc dồi dào, gia đạo cần nhẫn nại.',
            content: mockVipContent
        }
    };

    test('parseInterpretationSections parses chapters properly', () => {
        const sections = ConversationContextService.parseInterpretationSections(mockVipContent, 'tu_vi');
        expect(sections.length).toBeGreaterThanOrEqual(4);
        expect(sections[0].id).toBe('tu_vi_ch_1');
        expect(sections[0].title).toContain('Cụm 1');
        expect(sections[1].id).toBe('tu_vi_ch_2');
        expect(sections[1].title).toContain('Cụm 2');
    });

    test('extractVipContext returns safe empty object when record has no aiInterpretation', () => {
        const res = ConversationContextService.extractVipContext({
            record: null,
            system: 'ziwei'
        });
        expect(res.isVipMode).toBe(false);
        expect(res.contextText).toBe('');
    });

    test('extractVipContext matches explicit activeSectionId', () => {
        const res = ConversationContextService.extractVipContext({
            record: mockVipRecord,
            system: 'ziwei',
            activeSectionId: 'tu_vi_ch_2',
            userQuestion: 'Hỏi câu bất kỳ'
        });
        expect(res.isVipMode).toBe(true);
        expect(res.activeSectionTitle).toContain('Cụm 2');
        expect(res.contextText).toContain('Quan Lộc');
        expect(res.contextText).toContain('Tử Vi Phá Quân');
    });

    test('extractVipContext routes semantic love intent when activeSectionId is null', () => {
        const res = ConversationContextService.extractVipContext({
            record: mockVipRecord,
            system: 'ziwei',
            activeSectionId: null,
            userQuestion: 'Thầy cho con hỏi chuyện vợ chồng hôn nhân có hòa hợp không?'
        });
        expect(res.isVipMode).toBe(true);
        expect(res.activeSectionTitle).toContain('Cụm 3');
        expect(res.contextText).toContain('Phu Thê');
    });

    test('extractVipContext routes semantic career/finance intent', () => {
        const res = ConversationContextService.extractVipContext({
            record: mockVipRecord,
            system: 'ziwei',
            activeSectionId: null,
            userQuestion: 'Năm nay đầu tư buôn bán tiền bạc có gặp rủi ro gì không ạ?'
        });
        expect(res.isVipMode).toBe(true);
        expect(res.activeSectionTitle).toContain('Cụm 2');
        expect(res.contextText).toContain('Quan Lộc');
    });

    test('extractVipContext routes semantic health intent', () => {
        const res = ConversationContextService.extractVipContext({
            record: mockVipRecord,
            system: 'ziwei',
            activeSectionId: null,
            userQuestion: 'Sức khỏe năm nay có nguy cơ phẫu thuật mổ xẻ gì không?'
        });
        expect(res.isVipMode).toBe(true);
        expect(res.activeSectionTitle).toContain('Cụm 4');
        expect(res.contextText).toContain('Tật Ách');
    });
});
