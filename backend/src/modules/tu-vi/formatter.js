const STAR_CODE_MAP = {
  "Tử Vi": "tu_vi",
  "Thiên Phủ": "thien_phu",
  "Vũ Khúc": "vu_khuc",
  "Thiên Tướng": "thien_tuong",
  "Thái Dương": "thai_duong",
  "Cự Môn": "cu_mon",
  "Thiên Cơ": "thien_co",
  "Thiên Đồng": "thien_dong",
  "Thái Âm": "thai_am",
  "Thiên Lương": "thien_luong",
  "Thất Sát": "that_sat",
  "Phá Quân": "pha_quan",
  "Tham Lang": "tham_lang",
  "Liêm Trinh": "liem_trinh",
  // Lục cát tinh
  "Văn Xương": "van_xuong",
  "Văn Khúc": "van_khuc",
  "Thiên Khôi": "thien_khoi",
  "Thiên Việt": "thien_viet",
  "Tả Phù": "ta_phu",
  "Hữu Bật": "huu_bat",
  // Lục sát tinh
  "Kình Dương": "kinh_duong",
  "Đà La": "da_la",
  "Hỏa Tinh": "hoa_tinh",
  "Linh Tinh": "linh_tinh",
  "Địa Không": "dia_khong",
  "Địa Kiếp": "dia_kiep"
};

const BRIGHTNESS_MAP = {
  "Miếu": "M",
  "Vượng": "V",
  "Đắc": "D",
  "Bình": "B",
  "Hãm": "H",
  "M": "M", "V": "V", "D": "D", "B": "B", "H": "H"
};

const MUTAGEN_MAP = {
  "Lộc": "hoa_loc",
  "Quyền": "hoa_quyen",
  "Khoa": "hoa_khoa",
  "Kỵ": "hoa_ky"
};

class TuViFormatter {
  /**
   * Định dạng dữ liệu thô sang Standard Output
   * @param {Object} astrolabe Lá số thô từ iztro
   * @param {string} chartId Mã định danh bản ghi lưu trong database
   * @param {Object} metadata Siêu dữ liệu phiên bản
   * @returns {Object} Standard Output Format
   */
  static toStandardOutput(astrolabe, chartId, metadata) {
    const formattedPalaces = astrolabe.palaces.map(p => {
      // Chuẩn hóa Tinh tú
      const majorStars = p.majorStars.map(s => ({
        name: s.name,
        code: STAR_CODE_MAP[s.name] || s.name.toLowerCase().replace(/\s+/g, '_'),
        brightness: BRIGHTNESS_MAP[s.brightness] || "B",
        mutagen: MUTAGEN_MAP[s.mutagen] || ""
      }));

      const minorStars = p.minorStars.map(s => ({
        name: s.name,
        code: STAR_CODE_MAP[s.name] || s.name.toLowerCase().replace(/\s+/g, '_'),
        brightness: BRIGHTNESS_MAP[s.brightness] || "B",
        mutagen: MUTAGEN_MAP[s.mutagen] || ""
      }));

      const adjectiveStars = p.adjectiveStars.map(s => ({
        name: s.name,
        code: s.name.toLowerCase().replace(/\s+/g, '_')
      }));

      // Bổ sung các sao vòng Bác Sĩ, Tuế Tiền và Tướng Tinh vào danh sách tạp tinh để hiển thị đầy đủ (không trùng lặp)
      const existingStarNames = new Set(adjectiveStars.map(s => s.name));
      const addExtraStar = (starName) => {
        if (starName && !existingStarNames.has(starName)) {
          adjectiveStars.push({
            name: starName,
            code: starName.toLowerCase().replace(/\s+/g, '_')
          });
          existingStarNames.add(starName);
        }
      };
      addExtraStar(p.boshi12);
      addExtraStar(p.suiqian12);
      addExtraStar(p.jiangqian12);

      return {
        index: p.index,
        name: p.name,
        isBodyPalace: p.isBodyPalace,
        heavenlyStem: p.heavenlyStem,
        earthlyBranch: p.earthlyBranch,
        majorStars,
        minorStars,
        adjectiveStars,
        changsheng12: p.changsheng12,
        boshi12: p.boshi12,
        decadal: {
          range: p.decadal ? p.decadal.range : [],
          heavenlyStem: p.decadal ? p.decadal.heavenlyStem : "",
          earthlyBranch: p.decadal ? p.decadal.earthlyBranch : ""
        },
        ages: p.ages
      };
    });

    return {
      system: "tu_vi",
      chart_id: chartId,
      title: `Lá Số Tử Vi Nam Mệnh - Ngày ${astrolabe.solarDate} (${astrolabe.gender})`,
      summary: "",
      chart_data: {
        gender: astrolabe.gender,
        solarDate: astrolabe.solarDate,
        zodiac: astrolabe.zodiac,
        sign: astrolabe.sign,
        soul: astrolabe.soul,
        body: astrolabe.body,
        fiveElementsClass: astrolabe.fiveElementsClass,
        chineseDate: astrolabe.chineseDate,
        palaces: formattedPalaces
      },
      sections: [],
      metadata: {
        engine_version: metadata.engine_version || "1.0.0",
        prompt_version: metadata.prompt_version || "tv_prompt_v1",
        knowledge_version: metadata.knowledge_version || "tv_know_v1",
        calendar_type: metadata.calendar_type || "solar",
        school: metadata.school || "bac_phai",
        timezone: metadata.timezone !== undefined ? metadata.timezone : 7
      },
      created_at: new Date().toISOString()
    };
  }

  /**
   * Nén dữ liệu lá số để gửi cho AI (tiết kiệm 80% tokens)
   * Lọc bỏ tọa độ vẽ, boshi12, jiangqian12, ages,... chỉ giữ lại các trường cột cốt lõi
   * @param {Object} chartData Biểu đồ chuẩn hóa Standard Output
   * @returns {Object} Dữ liệu tinh giản
   */
  static compressForAi(chartData) {
    if (!chartData || !chartData.chart_data) return {};

    const raw = chartData.chart_data;
    const simplifiedPalaces = raw.palaces.map(p => ({
      name: p.name,
      isBodyPalace: p.isBodyPalace,
      heavenlyStem: p.heavenlyStem,
      earthlyBranch: p.earthlyBranch,
      majorStars: p.majorStars.map(s => `${s.name}${s.brightness ? ` (${s.brightness})` : ''}${s.mutagen ? ` [Hóa ${s.mutagen.replace('hoa_', '')}]` : ''}`),
      minorStars: p.minorStars.map(s => `${s.name}${s.brightness ? ` (${s.brightness})` : ''}`),
      adjectiveStars: p.adjectiveStars.map(s => s.name),
      changsheng: p.changsheng12,
      decadal: p.decadal ? `${p.decadal.range[0]}-${p.decadal.range[1]} tuổi` : ""
    }));

    return {
      zodiac: raw.zodiac,
      sign: raw.sign,
      soul: raw.soul,
      body: raw.body,
      fiveElementsClass: raw.fiveElementsClass,
      chineseDate: raw.chineseDate,
      palaces: simplifiedPalaces
    };
  }
}

module.exports = TuViFormatter;
