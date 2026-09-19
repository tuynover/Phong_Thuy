const BaziPrompts = require('../../src/modules/bazi/services/BaziPrompts');
const ZiweiPrompts = require('../../src/modules/ziwei/services/ZiweiPrompts');
const { BAZI_VIP_CONFIG, ZIWEI_VIP_CONFIG } = require('../../src/core/ai/deep-interpretation/DeepInterpretationConfigs');
const AgeClassifier = require('../../src/shared/utils/AgeClassifier');

describe('Prompt Age Optimization Regression Tests', () => {
  const currentYear = 2026;

  // Mock sample Bazi Record
  const mockBaziChild = {
    inputInfo: { gender: 1, birthSolarYear: 2015, date: '01/06/2015', time: '08:30' },
    solarTimeline: '01/06/2015 08:30',
    tietKhiTimeline: 'Mang Chủng',
    baziData: {
      canChi: {
        year: { gan: 'Ất', zhi: 'Mùi', thapThanGan: 'Chính Ấn', tangCan: [{ gan: 'Kỷ', thapThan: 'Chính Tài' }], naYin: 'Sa Trung Kim', shenSha: [] },
        month: { gan: 'Tân', zhi: 'Tị', thapThanGan: 'Chính Quan', tangCan: [{ gan: 'Bính', thapThan: 'Thực Thần' }], naYin: 'Bạch Lạp Kim', shenSha: [] },
        day: { gan: 'Giáp', zhi: 'Tý', tangCan: [{ gan: 'Quý', thapThan: 'Chính Ấn' }], naYin: 'Hải Trung Kim', shenSha: ['Thiên Ất Quý Nhân'] },
        hour: { gan: 'Mậu', zhi: 'Thìn', thapThanGan: 'Thiên Tài', tangCan: [{ gan: 'Mậu', thapThan: 'Thiên Tài' }], naYin: 'Đại Lâm Mộc', shenSha: ['Văn Xương'] }
      },
      taiNguyen: { canChi: 'Nhâm Thân', naYin: 'Kiếm Phong Kim', shenSha: [] },
      cungMenh: { canChi: 'Bính Tuất', naYin: 'Ốc Thượng Thổ', shenSha: [] },
      analysis: { relations: {}, academicFlags: { ducTuLenh: true, dacDia: true, duocSinh: true, duocTroGiup: true }, thanDegree: 'Thân Vượng' }
    }
  };

  const mockBaziYoungAdult = {
    ...mockBaziChild,
    inputInfo: { gender: 1, birthSolarYear: 2004, date: '15/09/2004', time: '14:30' }
  };

  test('Bazi Standard Prompt for CHILD (< 18) must focus on education and omit marriage', () => {
    const ageInfo = AgeClassifier.getLunarAgeInfo(mockBaziChild, currentYear);
    expect(ageInfo.ageGroup).toBe('CHILD');
    expect(ageInfo.lunarAge).toBe(12);

    const prompt = BaziPrompts.getStandardPrompt(mockBaziChild, ageInfo);

    // Kiểm tra các đề mục giáo dục, học tập, nuôi dạy
    expect(prompt).toContain('ĐỊNH HƯỚNG PHÁT TRIỂN & GIÁO DỤC');
    expect(prompt).toContain('Phân Tích Tư Chất Trí Tuệ & Điểm Mạnh/Yếu Bẩm Sinh');
    expect(prompt).toContain('Phân Tích Định Hướng Học Tập & Khối Ngành Phù Hợp');
    expect(prompt).toContain('Phân Tích Phương Pháp Nuôi Dạy & Môi Trường Giáo Dục Tối Ưu');
    expect(prompt).toContain('Phân Tích Sức Khỏe Thiếu Thời & Tạng Phủ Nhi Khoa');

    // Phải có chỉ dẫn cấm luận hôn nhân tình duyên
    expect(prompt).toContain('BẮT BUỘC BỎ QUA HOÀN TOÀN các vấn đề tình duyên, hôn nhân');

    // Không được chứa đề mục hôn nhân vợ chồng của người lớn trong Chương 3
    expect(prompt).not.toContain('**Phân Tích Tình Duyên & Hôn Nhân (Phối Ngẫu & Cung Thê/Phu)**');
  });

  test('Bazi Standard Prompt for YOUNG_ADULT (18-29) must analyze all life domains', () => {
    const ageInfo = AgeClassifier.getLunarAgeInfo(mockBaziYoungAdult, currentYear);
    expect(ageInfo.ageGroup).toBe('YOUNG_ADULT');
    expect(ageInfo.lunarAge).toBe(23);

    const prompt = BaziPrompts.getStandardPrompt(mockBaziYoungAdult, ageInfo);

    // Luận giải đầy đủ 4 phương diện chuẩn
    expect(prompt).toContain('**Phân Tích Sự Nghiệp & Công Danh (Quan/Sát/Thương)**');
    expect(prompt).toContain('**Phân Tích Tiền Bạc & Tài Chính (Tài/Thương)**');
    expect(prompt).toContain('**Phân Tích Tình Duyên & Hôn Nhân (Phối Ngẫu & Cung Thê/Phu)**');
    expect(prompt).toContain('**Phân Tích Sức Khỏe & Tật Ách (Ngũ Hành Biện Chứng & Bệnh Lý Tạng Phủ)**');
  });

  test('Bazi VIP Replicas for YOUNG_ADULT must include personality analysis in Replica 1', () => {
    const ageInfo = { ageGroup: 'YOUNG_ADULT', lunarAge: 24 };
    const replicas = BAZI_VIP_CONFIG.getReplicas(ageInfo);
    expect(replicas[0].id).toBe(1);
    expect(replicas[0].title).toContain('Khí Chất Cốt Lõi');
    expect(replicas[0].subtopics.some(s => s.includes('tính cách') || s.includes('khí chất cốt lõi'))).toBe(true);

    const instruction = BAZI_VIP_CONFIG.getChapterSpecificInstructions(1, ageInfo);
    expect(instruction).toContain('tính cách, khí chất cốt lõi');
  });

  test('Bazi VIP Replicas for CHILD must supply child-tailored 6 Replicas', () => {
    const ageInfo = { ageGroup: 'CHILD', lunarAge: 10 };
    const replicas = BAZI_VIP_CONFIG.getReplicas(ageInfo);
    expect(replicas).toHaveLength(6);
    expect(replicas[0].title).toContain('Tư Chất & Khí Chất Trí Tuệ');
    expect(replicas[1].title).toContain('Định Hướng Học Vấn');
    expect(replicas[2].title).toContain('Tương Tác Gia Đình & Phương Pháp Giáo Dục');
    expect(replicas[3].title).toContain('Sức Khỏe Thể Chất & Tạng Phủ Nhi Khoa');
    expect(replicas[4].title).toContain('Phong Thủy Phòng Học');
    expect(replicas[5].title).toContain('Lộ Trình Thi Cử');

    const instruction3 = BAZI_VIP_CONFIG.getChapterSpecificInstructions(3, ageInfo);
    expect(instruction3).toContain('TUYỆT ĐỐI CẤM nhắc đến chuyện tình duyên, vợ chồng, hôn nhân hay con cái');
  });

  test('Ziwei Markdown Prompt for CHILD (< 18) must tailor sections for student age', () => {
    const mockChart = {
      chart_data: {
        solarDate: '2016-05-10',
        palaces: []
      }
    };
    const symbolicAnalysis = { patterns: [], palaceInteractions: {} };
    const ageInfo = AgeClassifier.getLunarAgeInfo(mockChart, currentYear);
    expect(ageInfo.ageGroup).toBe('CHILD');

    const prompt = ZiweiPrompts.buildMarkdownPrompt(mockChart, symbolicAnalysis, ageInfo);
    expect(prompt).toContain('### 1. Bản Mệnh : Khí Chất & Tiềm Năng Trí Tuệ');
    expect(prompt).toContain('TUYỆT ĐỐI KHÔNG bàn về kết hôn, vợ/chồng');
    expect(prompt).toContain('TUYỆT ĐỐI KHÔNG bàn chuyện đầu tư làm giàu');
    expect(prompt).toContain('### 8. Học Vấn & Khối Ngành Thế Mạnh : Cung Quan Lộc');
    expect(prompt).toContain('### 15. Phong Thủy Bàn Học & Chiến Lược Kích Hoạt Văn Vận');
  });
});
