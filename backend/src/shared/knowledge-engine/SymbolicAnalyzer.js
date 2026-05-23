const BRANCH_OPPOSITES = {
  "Tý": "Ngọ", "Ngọ": "Tý",
  "Sửu": "Mùi", "Mùi": "Sửu",
  "Dần": "Thân", "Thân": "Dần",
  "Mão": "Dậu", "Dậu": "Mão",
  "Thìn": "Tuất", "Tuất": "Thìn",
  "Tỵ": "Hợi", "Hợi": "Tỵ"
};

const BRANCH_TRIADS = {
  "Tý": ["Thân", "Thìn"], "Thân": ["Tý", "Thìn"], "Thìn": ["Thân", "Tý"],
  "Sửu": ["Tỵ", "Dậu"], "Tỵ": ["Sửu", "Dậu"], "Dậu": ["Tỵ", "Sửu"],
  "Dần": ["Ngọ", "Tuất"], "Ngọ": ["Dần", "Tuất"], "Tuất": ["Dần", "Ngọ"],
  "Hợi": ["Mão", "Mùi"], "Mão": ["Hợi", "Mùi"], "Mùi": ["Hợi", "Mão"]
};

class SymbolicAnalyzer {
  /**
   * Phân tích các mối liên kết giữa 12 Cung và các chòm sao chủ đạo
   * @param {Object} chartData Dữ liệu lá số chuẩn hóa (formatter output)
   * @returns {Object} Kết quả giải nghĩa cách cục & mối quan hệ
   */
  static analyze(chartData) {
    if (!chartData || !chartData.palaces) {
      return { patterns: [], palaceInteractions: {} };
    }

    const palaces = chartData.palaces;
    const palaceInteractions = {};
    const patterns = [];

    // Tìm cung Mệnh để phân tích cách cục Mệnh vị
    const menhPalace = palaces.find(p => p.name === "Mệnh");
    
    // 1. Phân tích Xung Chiếu và Tam Hợp cho từng cung
    for (const palace of palaces) {
      const branch = palace.earthlyBranch;
      
      // Xung chiếu
      const oppositeBranch = BRANCH_OPPOSITES[branch];
      const oppositePalace = palaces.find(p => p.earthlyBranch === oppositeBranch);
      
      // Tam hợp
      const triadBranches = BRANCH_TRIADS[branch] || [];
      const triadPalaces = palaces.filter(p => triadBranches.includes(p.earthlyBranch));

      palaceInteractions[palace.name] = {
        name: palace.name,
        branch: branch,
        opposite: {
          name: oppositePalace ? oppositePalace.name : "",
          branch: oppositeBranch,
          majorStars: oppositePalace ? oppositePalace.majorStars.map(s => s.name) : []
        },
        triad: triadPalaces.map(tp => ({
          name: tp.name,
          branch: tp.earthlyBranch,
          majorStars: tp.majorStars.map(s => s.name)
        }))
      };
    }

    // 2. Phân tích Cách Cục chính tại Cung Mệnh
    if (menhPalace) {
      const menhMajorStars = menhPalace.majorStars.map(s => s.name);
      
      // Lấy danh sách sao Tam hợp chiếu và Xung chiếu cung Mệnh
      const menhInteraction = palaceInteractions["Mệnh"];
      const surroundedMajorStars = new Set([
        ...menhMajorStars,
        ...(menhInteraction.opposite.majorStars || []),
        ...(menhInteraction.triad.flatMap(tp => tp.majorStars || []))
      ]);

      // A. Mệnh Vô Chính Diệu
      if (menhMajorStars.length === 0) {
        patterns.push("Mệnh Vô Chính Diệu");
        
        // Kiểm tra đắc Không vong (Tuần Không, Triệt Không, Địa Không, Thiên Không)
        const allMenhStars = [
          ...menhPalace.minorStars.map(s => s.name),
          ...menhPalace.adjectiveStars.map(s => s.name)
        ];
        const countKongs = allMenhStars.filter(name => 
          name.includes("Không") || name.includes("Triệt") || name.includes("Tuần")
        ).length;

        if (countKongs >= 2) {
          patterns.push("VCD Đắc Tam Không");
        }
      }

      // B. Sát Phá Tham
      const sptStars = ["Thất Sát", "Phá Quân", "Tham Lang"];
      if (menhMajorStars.some(s => sptStars.includes(s))) {
        patterns.push("Sát Phá Tham Cục");
      }

      // C. Tử Phủ Vũ Tướng
      const tpvtStars = ["Tử Vi", "Thiên Phủ", "Vũ Khúc", "Thiên Tướng"];
      if (menhMajorStars.some(s => tpvtStars.includes(s))) {
        patterns.push("Tử Phủ Vũ Tướng Cách");
      }

      // D. Cơ Nguyệt Đồng Lương
      const cndlStars = ["Thiên Cơ", "Thái Âm", "Thiên Đồng", "Thiên Lương"];
      if (menhMajorStars.some(s => cndlStars.includes(s))) {
        // Chỉ ghi nhận nếu không bị lẫn với Tử Phủ hay Sát Phá Tham nặng
        if (!patterns.includes("Tử Phủ Vũ Tướng Cách") && !patterns.includes("Sát Phá Tham Cục")) {
          patterns.push("Cơ Nguyệt Đồng Lương Cách");
        }
      }

      // E. Cự Nhật
      if (menhMajorStars.includes("Cự Môn") || menhMajorStars.includes("Thái Dương")) {
        patterns.push("Cự Nhật Đồng Cung Hoặc Chiếu");
      }

      // F. Nhật Nguyệt Đồng Lâm
      if (menhMajorStars.includes("Thái Dương") && menhMajorStars.includes("Thái Âm")) {
        patterns.push("Nhật Nguyệt Đồng Lâm");
      }

      // G. Phủ Tướng Triều Viên
      if (surroundedMajorStars.has("Thiên Phủ") && surroundedMajorStars.has("Thiên Tướng") && !menhMajorStars.includes("Tử Vi")) {
        patterns.push("Phủ Tướng Triều Viên");
      }

      // H. Tử Phủ Triều Viên
      if (surroundedMajorStars.has("Tử Vi") && surroundedMajorStars.has("Thiên Phủ")) {
        patterns.push("Tử Phủ Triều Viên");
      }
    }

    return {
      patterns,
      palaceInteractions
    };
  }
}

module.exports = SymbolicAnalyzer;
