const SymbolicAnalyzer = require('../shared/knowledge-engine/SymbolicAnalyzer');
const ZiweiFormatter = require('../services/ZiweiFormatter');
const ZiweiPrompts = require('../services/ZiweiPrompts');

const sampleCharts = [
  {
    name: "Nguyễn Văn A (Nam, Sinh 15/05/1990, 08:30)",
    chartData: {
      solarDate: "1990-05-15",
      lunarDate: "1990-04-21",
      gender: "Nam",
      baziStr: "Canh Ngọ - Tân Tị - Bính Thân - Nhâm Thìn",
      cuc: "Thổ Ngũ Cục",
      menhPalace: "Tị",
      thanPalace: "Dậu",
      palaces: [
        { name: "Mệnh", earthlyBranch: "Tỵ", majorStars: [{ name: "Tử Vi" }, { name: "Thất Sát" }], minorStars: [{ name: "Văn Xương" }] },
        { name: "Phụ Mẫu", earthlyBranch: "Ngọ", majorStars: [{ name: "Thiên Cơ" }, { name: "Thái Âm" }], minorStars: [] },
        { name: "Phúc Đức", earthlyBranch: "Mùi", majorStars: [{ name: "Thái Dương" }], minorStars: [] },
        { name: "Điền Trạch", earthlyBranch: "Thân", majorStars: [{ name: "Vũ Khúc" }, { name: "Tham Lang" }], minorStars: [] },
        { name: "Quan Lộc", earthlyBranch: "Dậu", majorStars: [{ name: "Liêm Trinh" }, { name: "Phá Quân" }], minorStars: [] },
        { name: "Nô Bộc", earthlyBranch: "Tuất", majorStars: [{ name: "Thiên Đồng" }], minorStars: [] },
        { name: "Thiên Di", earthlyBranch: "Hợi", majorStars: [{ name: "Thiên Phủ" }], minorStars: [] },
        { name: "Tật Ách", earthlyBranch: "Tý", majorStars: [{ name: "Thái Âm" }], minorStars: [] },
        { name: "Tài Bạch", earthlyBranch: "Sửu", majorStars: [{ name: "Thiên Cơ" }, { name: "Thiên Lương" }], minorStars: [] },
        { name: "Tử Tức", earthlyBranch: "Dần", majorStars: [{ name: "Thất Sát" }], minorStars: [] },
        { name: "Phu Thê", earthlyBranch: "Mão", majorStars: [{ name: "Cự Môn" }], minorStars: [] },
        { name: "Huynh Đệ", earthlyBranch: "Thìn", majorStars: [{ name: "Thiên Tướng" }], minorStars: [] }
      ]
    }
  }
];

console.log("=== KIỂM THỬ TẠO PROMPT LUẬN GIẢI TỬ VI NÂNG CẤP V4 ===");
sampleCharts.forEach((sample, idx) => {
  console.log(`\n--- Test Case ${idx + 1}: ${sample.name} ---`);
  const symbolicAnalysis = SymbolicAnalyzer.analyze(sample.chartData);
  const compressed = ZiweiFormatter.compressForAi({ chartData: sample.chartData, inputInfo: { name: sample.name } });
  const prompt = ZiweiPrompts.buildMarkdownPrompt(compressed, symbolicAnalysis);
  
  console.log(`- Độ dài Prompt: ${prompt.length} ký tự`);
  
  const requiredSections = [
    "### 1. Bản Mệnh : Khí Chất & Tiềm Năng Cốt Lõi",
    "### 2. Hôn Nhân & Tình Duyên : Cung Phu Thê",
    "### 3. Tài Lộc & Quản Lý Tiền Bạc : Cung Tài Bạch",
    "### 4. Phụ Mẫu & Gia Thế : Cung Phụ Mẫu",
    "### 5. Thiên Di & Xuất Hành : Cung Thiên Di",
    "### 6. Sức Khỏe & Tai Ương : Cung Tật Ách",
    "### 7. Nô Bộc & Mối Quan Hệ : Cung Nô Bộc",
    "### 8. Công Danh & Sự Nghiệp : Cung Quan Lộc",
    "### 9. Điền Trạch & Bất Động Sản : Cung Điền Trạch",
    "### 10. Đường Con Cái : Cung Tử Tức",
    "### 11. Anh Chị Em : Cung Huynh Đệ",
    "### 12. Phúc Đức & Sứ Mệnh Cuộc Đời : Cung Phúc Đức",
    "### 13. Đại Vận & Vận Hạn Năm 2026 : Cung Hạn",
    "### 14. 3 Bước Ngoặt Cuộc Đời & Tổng Luận Vận Hạn",
    "### 15. Chiến Lược Cải Vận & Thu Hút May Mắn"
  ];

  let missing = [];
  requiredSections.forEach(sec => {
    if (!prompt.includes(sec)) missing.push(sec);
  });

  if (missing.length === 0) {
    console.log(`✅ Tất cả 15 phần tiêu đề chi tiết đã được tích hợp chuẩn xác vào Prompt!`);
  } else {
    console.log(`❌ Thiếu tiêu đề:`, missing);
  }
});
