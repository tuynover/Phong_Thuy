const ConversationContextService = require('../../src/services/ConversationContextService');

describe('ConversationContextService - isDivinationRelated (Weighted Intent Scoring)', () => {
    test('rejects programming, code generation and jailbreak queries', () => {
        expect(ConversationContextService.isDivinationRelated('Hãy viết code javascript tính ngũ hành can chi')).toBe(false);
        expect(ConversationContextService.isDivinationRelated('viết hàm python giải lá số tử vi')).toBe(false);
        expect(ConversationContextService.isDivinationRelated('React component bị re-render liên tục làm sao fix')).toBe(false);
        expect(ConversationContextService.isDivinationRelated('giải giúp bài tập phương trình hóa học lớp 10')).toBe(false);
        expect(ConversationContextService.isDivinationRelated('dịch đoạn này sang tiếng anh giúp tôi')).toBe(false);
    });

    test('accepts subtle emotional dilemmas and life guidance without explicit feng shui terms', () => {
        expect(ConversationContextService.isDivinationRelated('Dạo này con cảm thấy rất bế tắc và mất phương hướng trong cuộc sống, con nên làm gì?')).toBe(true);
        expect(ConversationContextService.isDivinationRelated('Tôi đang rất kiệt quệ và hoang mang về tương lai')).toBe(true);
        expect(ConversationContextService.isDivinationRelated('Liệu tôi có nên buông bỏ công việc hiện tại để tìm hướng đi mới?')).toBe(true);
    });

    test('accepts multi-intent career, health, family and financial queries', () => {
        expect(ConversationContextService.isDivinationRelated('Công việc năm nay áp lực có ảnh hưởng xấu tới sức khỏe và gia đình tôi không?')).toBe(true);
        expect(ConversationContextService.isDivinationRelated('Năm nay đầu tư buôn bán bất động sản có sinh lời không?')).toBe(true);
        expect(ConversationContextService.isDivinationRelated('Chuyện vợ chồng con cái năm tới có hòa hợp không?')).toBe(true);
    });

    test('accepts short conversational and weather planning queries', () => {
        expect(ConversationContextService.isDivinationRelated('thầy thấy sao ạ')).toBe(true);
        expect(ConversationContextService.isDivinationRelated('giải thích thêm giúp con')).toBe(true);
        expect(ConversationContextService.isDivinationRelated('Thời tiết ngày mai có mưa để xuất hành không?')).toBe(true);
    });
});

describe('ConversationContextService - BM25 Paragraph Ranker & extractVipContext', () => {
    const mockVipContent = `
# TỬ VI ĐẨU SỐ ĐẠI THÀNH

### CỤM 1: CỐT CÁCH BẢN MỆNH & THÂN MỆNH
Đương số mang mệnh Vũ Khúc Thất Sát tại Mão. Tính cách quyết đoán, can trường, dám nghĩ dám làm nhưng nội tâm hay cô độc.
Văn Xương tọa thủ giúp trí tuệ sáng suốt, thích học hỏi và nghiên cứu chiều sâu.

### CỤM 2: QUAN LỘC, TÀI BẠCH & ĐIỀN TRẠCH
Cung Quan Lộc có Tử Vi Phá Quân. Đường công danh có quý nhân trợ lực, thăng tiến thuận lợi trong môi trường kinh doanh hoặc quản lý doanh nghiệp.
Đầu tư vào năm 2026 sẽ có biến động mạnh về dòng tiền, cần kiểm soát chi tiêu và tránh hùn hạp rủi ro.

### CỤM 3: PHU THÊ, TỬ TỨC & HUYNH ĐỆ
Cung Phu Thê có Thiên Tướng tọa thủ. Vợ/chồng là người chu đáo, hòa nhã nhưng cần chú ý tính gia trưởng và bất đồng quan điểm khi áp lực công việc gia tăng.
Gia đạo cần sự lắng nghe và chia sẻ để tránh rạn nứt trong các giai đoạn biến động.

### CỤM 4: TẬT ÁCH & THIÊN DI
Cung Tật Ách có Liêm Trinh Hóa Kỵ. Cần chú ý bệnh về đường hô hấp, dạ dày và chứng mất ngủ do áp lực công việc quá mức.
Đặc biệt lưu ý nguy cơ phẫu thuật mổ xẻ nhỏ hoặc tai nạn xe cộ vào năm Thân.

### CHIẾN LƯỢC ĐIỀU HÒA & XU CÁT TỊ HUNG
Cần tu tâm dưỡng tính, chọn phương vị Đông Nam để kích hoạt tài vận. Tập luyện thể thao nhẹ nhàng và ngủ trước 23h để bổ trợ tạng phủ.
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

    test('chunkInterpretationSections breaks sections into semantic chunks', () => {
        const sections = ConversationContextService.parseInterpretationSections(mockVipContent, 'tu_vi');
        const chunks = ConversationContextService.chunkInterpretationSections(sections);
        expect(chunks.length).toBeGreaterThanOrEqual(sections.length);
        expect(chunks[0]).toHaveProperty('tokens');
        expect(chunks[0]).toHaveProperty('sectionId');
        expect(chunks[0].tokens.length).toBeGreaterThan(0);
    });

    test('rankChunksBM25 ranks most relevant chunk on top', () => {
        const sections = ConversationContextService.parseInterpretationSections(mockVipContent, 'tu_vi');
        const chunks = ConversationContextService.chunkInterpretationSections(sections);
        const ranked = ConversationContextService.rankChunksBM25('phẫu thuật mổ xẻ tai nạn bệnh tật', chunks);
        expect(ranked.length).toBeGreaterThan(0);
        expect(ranked[0].sectionId).toBe('tu_vi_ch_4'); // Tật Ách
    });

    test('extractVipContext handles multi-intent query and returns multiple matched sections', () => {
        const res = ConversationContextService.extractVipContext({
            record: mockVipRecord,
            system: 'ziwei',
            activeSectionId: null,
            userQuestion: 'Công việc năm nay áp lực có ảnh hưởng xấu tới sức khỏe và gia đình tôi không?'
        });
        expect(res.isVipMode).toBe(true);
        expect(res.matchedSections.length).toBeGreaterThanOrEqual(2);
        const matchedTitles = res.matchedSections.map(s => s.title).join(' ').toUpperCase();
        expect(matchedTitles).toContain('TẬT ÁCH'); // Sức khỏe
        expect(matchedTitles).toContain('PHU THÊ'); // Gia đình
        expect(res.contextText.toUpperCase()).toContain('TẬT ÁCH');
    });

    test('extractVipContext matches explicit activeSectionId and pins it', () => {
        const res = ConversationContextService.extractVipContext({
            record: mockVipRecord,
            system: 'ziwei',
            activeSectionId: 'tu_vi_ch_2',
            userQuestion: 'Hỏi câu bất kỳ về đầu tư dòng tiền'
        });
        expect(res.isVipMode).toBe(true);
        expect(res.activeSectionTitle).toContain('Cụm 2');
        expect(res.contextText).toContain('Quan Lộc');
        expect(res.contextText).toContain('Tử Vi Phá Quân');
    });

    test('extractVipContext returns safe empty object when record has no aiInterpretation', () => {
        const res = ConversationContextService.extractVipContext({
            record: null,
            system: 'ziwei'
        });
        expect(res.isVipMode).toBe(false);
        expect(res.contextText).toBe('');
    });
});
