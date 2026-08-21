const fs = require('fs');
const path = require('path');
const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziPrompts = require('../services/BaziPrompts');

const cases = [
  // 1. Nhóm Đại Phú & Doanh Nhân Mạng (VN & TQ)
  { id: 1, type: 'Đại phú / Doanh nhân VN', name: 'Phạm Nhật Vượng', desc: 'Tỷ phú số 1 VN, BĐS & Xe điện toàn cầu', date: '05/08/1968', time: '08:30', gender: 1 },
  { id: 2, type: 'Kỳ tài / Vua cà phê VN', name: 'Đặng Lê Nguyên Vũ', desc: 'Sáng lập Trung Nguyên, tư tưởng Thiền đạo độc đáo', date: '10/02/1971', time: '04:30', gender: 1 },
  { id: 3, type: 'Streamer / Doanh nhân biến cố VN', name: 'Nguyễn Phương Hằng', desc: 'Streamer chấn động MXH, vướng án 331 ngục tù 2022', date: '26/01/1971', time: '09:30', gender: 0 },
  { id: 4, type: 'Đại án tài chính / BĐS sụp đổ VN', name: 'Trương Mỹ Lan', desc: 'Đại án Vạn Thịnh Phát / SCB, án tử hình chấn động', date: '13/10/1956', time: '12:00', gender: 0 },
  { id: 5, type: 'Giang hồ mạng / Cờ bạc tù tội VN', name: 'Khá Bảnh (Ngô Bá Khá)', desc: 'Hiện tượng mạng, cờ bạc & tổ chức đánh bạc, tù 10 năm', date: '27/11/1993', time: '20:00', gender: 1 },

  // 2. Nhóm Nhân vật Lịch sử & Hắc bang / Buôn lậu / Đào hoa (TQ & HK)
  { id: 6, type: 'Đại phú hào / Trường thọ HK', name: 'Lý Gia Thành (Li Ka-shing)', desc: 'Tỷ phú giàu nhất HK, đầu tư bền bỉ đại thọ', date: '29/07/1928', time: '21:30', gender: 1 },
  { id: 7, type: 'Nữ quyền chuyên chế mạt Thanh TQ', name: 'Từ Hi Thái Hậu', desc: 'Nhiếp chính 47 năm, xa hoa tột đỉnh, triều đình suy sụp', date: '29/11/1835', time: '14:00', gender: 0 },
  { id: 8, type: 'Trùm xã hội đen / Cờ bạc nha phiến TQ', name: 'Đỗ Nguyệt Sênh (Du Yuesheng)', desc: 'Thủ lĩnh Thanh Bang Thượng Hải, cờ bạc vũ trang khét tiếng', date: '21/08/1888', time: '12:30', gender: 1 },
  { id: 9, type: 'Vua bắt cóc / Nghiện bạc tử hình HK', name: 'Trương Tử Cường (Cheung Tze-keung)', desc: 'Cướp bóc vũ trang, mê bạc thua hàng trăm triệu, tử hình 1998', date: '07/04/1955', time: '08:00', gender: 1 },
  { id: 10, type: 'Trùm buôn lậu / Lầu đỏ sa đọa TQ', name: 'Lại Xương Tinh (Lai Changxing)', desc: 'Vụ án buôn lậu lớn nhất TQ, Lầu Đỏ ăn chơi sa đọa, tù chung thân', date: '15/09/1958', time: '16:00', gender: 1 },

  // 3. Nhóm Scandal Đào Hoa / Tình Dục / Phong Sát (Showbiz TQ & HK)
  { id: 11, type: 'Scandal tình ái / Đào hoa sát HK', name: 'Trần Quán Hy (Edison Chen)', desc: 'Minh tinh dính đại án ảnh nóng đào hoa chấn động châu Á 2008', date: '07/10/1980', time: '08:30', gender: 1 },
  { id: 12, type: 'Đỉnh lưu / Tội phạm tình dục TQ', name: 'Ngô Diệc Phàm (Kris Wu)', desc: 'Thần tượng đỉnh cao dính án hiếp dâm, tù 13 năm, sự nghiệp tan tành', date: '06/11/1990', time: '10:00', gender: 1 },
  { id: 13, type: 'Nữ hoàng thảm đỏ / Trốn thuế phong sát TQ', name: 'Phạm Băng Băng (Fan Bingbing)', desc: 'Nhan sắc quyền lực, dính án trốn thuế phạt 3000 tỷ, bị phong sát', date: '16/09/1981', time: '06:15', gender: 0 },
  { id: 14, type: 'Minh tinh biến cố bắt cóc HK', name: 'Lưu Gia Linh (Carina Lau)', desc: 'Bị xã hội đen bắt cóc làm nhục năm 1990, vượt qua nghịch cảnh đại phú', date: '08/12/1965', time: '18:30', gender: 0 },

  // 4. Nhóm Ca Kinh Điển Mệnh Lý Cổ Học (Kẻ Cướp, Cờ Bạc, Dâm Loạn, Khất Cái, Yểu Mệnh)
  { id: 15, type: 'Kẻ cướp sát nhân / Dương Nhận ngục tù', name: 'Sát Nhân Đao Binh (Cổ Án)', desc: 'Hỏa diễm thiêu thân, Sát trọng vô chế, chết vì đao kiếm ngục tù', date: '12/06/1866', time: '12:00', gender: 1 },
  { id: 16, type: 'Con bạc phá sản / Kiếp tài đoạt sạch', name: 'Đổ Đồ Phá Gia (Cổ Án)', desc: 'Tỷ kiếp trùng trùng đoạt tài khố, mê đỏ đen khuynh gia bại sản', date: '14/04/1880', time: '08:00', gender: 1 },
  { id: 17, type: 'Kẻ trộm cắp / Tội phạm buôn người', name: 'Đạo Tặc Bất Lương (Cổ Án)', desc: 'Quan Sát hỗn tạp khắc Thân kiệt quệ, chuyên trộm cắp buôn người', date: '15/02/1894', time: '23:30', gender: 1 },
  { id: 18, type: 'Đào hoa dâm loạn / Đa phu trụy lạc', name: 'Thủy Đa Phiếm Lạm (Cổ Án)', desc: 'Thủy vượng vô cương, đào hoa đa tình phóng túng trụy lạc', date: '20/12/1893', time: '22:00', gender: 0 },
  { id: 19, type: 'Bần hàn khất cái / Ăn xin tha hương', name: 'Khất Cái Bần Hàn (Cổ Án)', desc: 'Tứ Mộ Khố xung tàn, Thổ trệ tuyệt khí, không nguồn sinh trợ', date: '08/10/1888', time: '02:00', gender: 1 },
  { id: 20, type: 'Yểu mệnh bạo bệnh / Hỏa Thủy giao tranh', name: 'Yểu Chiết Bạo Bệnh (Cổ Án)', desc: 'Tam Ngọ xung Nhất Tý, Thủy Hỏa bộc phát, chết trẻ vì bạo bệnh', date: '22/06/1870', time: '12:00', gender: 1 }
];

console.log('========================================================================================');
console.log('BENCHMARK 20 LÁ SỐ ĐẶC BIỆT & NGOẠI LỆ (ĐẠI PHÚ, NGỤC TÙ, CỜ BẠC, DÂM LOẠN, KHẤT CÁI)');
console.log('========================================================================================\n');

const results = [];

cases.forEach(c => {
  try {
    const res = BaziAnalyzer.analyze(c.date, c.time, c.gender);
    const cc = res.canChi;
    const pYear = cc ? `${cc.year.gan} ${cc.year.zhi}` : 'N/A';
    const pMonth = cc ? `${cc.month.gan} ${cc.month.zhi}` : 'N/A';
    const pDay = cc ? `${cc.day.gan} ${cc.day.zhi}` : 'N/A';
    const pHour = cc ? `${cc.hour.gan} ${cc.hour.zhi}` : 'N/A';
    
    const analysis = res.analysis || {};
    const dungThanInfo = res.dungThanInfo || analysis.dungThanInfo || {};
    const primary = dungThanInfo.primary || {};
    const climate = dungThanInfo.climateState || {};
    const mediation = dungThanInfo.mediationState || {};

    const prompt = BaziPrompts.getInterpretationPrompt({
      inputInfo: { date: c.date, time: c.time, gender: c.gender },
      baziData: res,
      solarTimeline: `${c.date} ${c.time}`,
      tietKhiTimeline: res.tietKhiName || 'Tiết Khí'
    });

    // Check prompt quality
    const hasDungThanSuggestion = prompt.includes('Gợi ý Dụng Thần Ưu Tiên 1');
    const hasAIReasoningGuide = prompt.includes('HƯỚNG DẪN BIỆN CHỨNG DÀNH CHO AI');
    const hasDieuHauCheck = prompt.includes('Đánh giá Điều Hậu');

    const itemResult = {
      id: c.id,
      type: c.type,
      name: c.name,
      desc: c.desc,
      date: c.date,
      time: c.time,
      tuTru: `${pYear} | ${pMonth} | ${pDay} | ${pHour}`,
      nhatChu: `${cc.day.gan} (${cc.day.element || 'N/A'})`,
      than: analysis.thanDegree || analysis.than,
      cachCuc: analysis.cachCuc,
      dungThanPrimary: primary.dungThan,
      hyThanPrimary: primary.hyThan,
      kyThanPrimary: primary.kyThan,
      mechanism: primary.mechanism,
      confidence: primary.confidence,
      rationale: primary.rationale,
      climate: climate.season ? `${climate.season} (Cần: ${climate.idealElement || 'Không'})` : 'Bình hòa',
      mediation: mediation.isConflict ? `Xung đột ${mediation.conflictingElements.join(' vs ')} -> Cầu nối: ${mediation.mediator}` : 'Không',
      scenariosCount: dungThanInfo.scenarios?.length || 0,
      promptChecks: {
        hasDungThanSuggestion,
        hasAIReasoningGuide,
        hasDieuHauCheck
      }
    };

    results.push(itemResult);

    console.log(`[#${c.id}] [${c.type}] ${c.name}`);
    console.log(`    Tiểu sử/Thực tế: ${c.desc}`);
    console.log(`    Tứ Trụ: [${pYear}] - [${pMonth}] - [${pDay}] - [${pHour}]`);
    console.log(`    Nhật Chủ: ${itemResult.nhatChu} | Vượng Suy: ${itemResult.than} | Cách Cục: ${itemResult.cachCuc}`);
    console.log(`    🎯 Gợi ý Dụng Thần 1: Dụng [${primary.dungThan}] | Hỷ [${primary.hyThan}] | Kỵ [${primary.kyThan}]`);
    console.log(`    ⚙️ Cơ chế: ${primary.mechanism} (Độ tin cậy: ${(primary.confidence * 100).toFixed(0)}%)`);
    console.log(`    🌡️ Điều Hậu: ${itemResult.climate} | 🌉 Thông Quan: ${itemResult.mediation}`);
    console.log(`    📜 Kịch bản Scenarios: ${itemResult.scenariosCount} kịch bản`);
    console.log(`    ✅ Prompt Grounding: Dụng Thần (${hasDungThanSuggestion ? 'OK' : 'MISS'}), Hướng dẫn Phản Biện (${hasAIReasoningGuide ? 'OK' : 'MISS'})`);
    console.log('----------------------------------------------------------------------------------------\n');
  } catch (err) {
    console.error(`[#${c.id}] Error with ${c.name}:`, err.message);
  }
});

const outputPath = path.join(__dirname, 'test_20_diverse_edge_cases_results.json');
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
console.log(`\nHoàn tất kiểm thử 20 ca đặc biệt! Đã lưu file kết quả tại ${outputPath}`);