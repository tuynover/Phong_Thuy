const hexagramsData = require('../../iching/data/hexagrams.json');
const dailyJudgments = require('../data/hexagramDailyJudgments.json');
const BaziAnalyzer = require('../../bazi/services/BaziAnalyzer');

/**
 * NumerologyRuleEngineService
 * Bộ não tính toán học thuật Phong Thủy Số (Sim, Biển Số Xe, Tài Khoản Ngân Hàng)
 * Tích hợp:
 * 1. Huyền Không Phi Tinh: Cửu Tinh Động Vận theo năm (không áp cứng), Cặp sao Tinh Tổ, Khí Khẩu, Âm Dương
 * 2. Ngũ Hành Dãy Số: Phân tích ngũ hành từng chữ số, tỷ lệ % ngũ hành, dòng chảy tương sinh/tương khắc liên hoàn
 * 3. Kinh Dịch: Mai Hoa Lập Quẻ (Quẻ Chủ & Quẻ Biến, bỏ Quẻ Hỗ) - Sử dụng chuẩn mực đánh giá từ 64 quẻ Dịch hằng ngày
 * 4. Bát Tự Tương Phối: Dụng Thần, Hỷ Thần, Kỵ Thần, Ngũ hành vượng nhất, Thích hợp cho ai, Cung Phi Mệnh Quái
 * 5. Chấm Điểm Phân Hóa Đa Tầng: Thuật toán chấm điểm thực tế, biên độ điểm 40 - 95 phản ánh chuẩn xác cát hung
 */

// Bát Quái Tiên Thiên: Số thứ tự 1-8 -> Tên quẻ, Hành, Binary 3-bit (Từ trên xuống dưới)
const TRIGRAM_MAP = {
  1: { number: 1, name: 'Càn', symbol: '☰', element: 'Kim', nature: 'Trời', binary: '111' },
  2: { number: 2, name: 'Đoài', symbol: '☱', element: 'Kim', nature: 'Đầm', binary: '011' },
  3: { number: 3, name: 'Ly', symbol: '☲', element: 'Hỏa', nature: 'Lửa', binary: '101' },
  4: { number: 4, name: 'Chấn', symbol: '☳', element: 'Mộc', nature: 'Sấm', binary: '001' },
  5: { number: 5, name: 'Tốn', symbol: '☴', element: 'Mộc', nature: 'Gió', binary: '110' },
  6: { number: 6, name: 'Khảm', symbol: '☵', element: 'Thủy', nature: 'Nước', binary: '010' },
  7: { number: 7, name: 'Cấn', symbol: '☶', element: 'Thổ', nature: 'Núi', binary: '100' },
  8: { number: 8, name: 'Khôn', symbol: '☷', element: 'Thổ', nature: 'Đất', binary: '000' }
};

// Cửu Tinh Lạc Thư (1 đến 9)
const NINE_STARS_INFO = {
  1: { star: 'Nhất Bạch', name: 'Tham Lang', palace: 'Khảm', element: 'Thủy', keywords: 'Văn chương, trí tuệ, dòng tiền lưu chuyển, danh tiếng, cơ hội mới' },
  2: { star: 'Nhị Hắc', name: 'Cự Môn', palace: 'Khôn', element: 'Thổ', keywords: 'Bệnh phù tinh, quả phụ, điền sản đất đai, tích lũy chậm' },
  3: { star: 'Tam Bích', name: 'Lộc Tồn', palace: 'Chấn', element: 'Mộc', keywords: 'Si phỉ tinh, thị phi, quan phi tranh chấp, tiểu nhân, trộm cắp' },
  4: { star: 'Tứ Lục', name: 'Văn Khúc', palace: 'Tốn', element: 'Mộc', keywords: 'Văn xương tinh, thi cử, nghệ thuật, danh vọng truyền thông, tình duyên' },
  5: { star: 'Ngũ Hoàng', name: 'Liêm Trinh', palace: 'Trung Cung', element: 'Thổ', keywords: 'Đại sát tinh, độc dược, tai ách bất ngờ, bế tắc tài lộc' },
  6: { star: 'Lục Bạch', name: 'Vũ Khúc', palace: 'Càn', element: 'Kim', keywords: 'Quan tinh, quyền uy, lãnh đạo, kỷ luật, tài lộc võ chức' },
  7: { star: 'Thất Xích', name: 'Phá Quân', palace: 'Đoài', element: 'Kim', keywords: 'Tặc đạo tinh, hao tài phá sản, tranh đoạt, mổ xẻ, khẩu thiệt' },
  8: { star: 'Bát Bạch', name: 'Tả Phụ', palace: 'Cấn', element: 'Thổ', keywords: 'Đại tài tinh, thiện lương, tích lũy bền vững, bất động sản' },
  9: { star: 'Cửu Tử', name: 'Hữu Bật', palace: 'Ly', element: 'Hỏa', keywords: 'Hỷ khánh tinh, danh vọng bùng nổ, công nghệ, trí tuệ, phát tài nhanh' }
};

// Bảng ánh xạ Ngũ Hành, Âm Dương & Màu sắc cho từng chữ số (0 - 9)
const DIGIT_ELEMENT_MAP = {
  1: { digit: 1, element: 'Thủy', polarity: 'Dương', colorName: 'Xanh Lam', colorClass: 'text-sky-600', bgClass: 'bg-sky-50 border-sky-300', hex: '#0284C7', star: 'Nhất Bạch' },
  2: { digit: 2, element: 'Thổ', polarity: 'Âm', colorName: 'Vàng Nâu', colorClass: 'text-amber-700', bgClass: 'bg-amber-50 border-amber-300', hex: '#B45309', star: 'Nhị Hắc' },
  3: { digit: 3, element: 'Mộc', polarity: 'Dương', colorName: 'Xanh Lá', colorClass: 'text-emerald-600', bgClass: 'bg-emerald-50 border-emerald-300', hex: '#059669', star: 'Tam Bích' },
  4: { digit: 4, element: 'Mộc', polarity: 'Âm', colorName: 'Xanh Ngọc', colorClass: 'text-emerald-500', bgClass: 'bg-emerald-50 border-emerald-300', hex: '#10B981', star: 'Tứ Lục' },
  5: { digit: 5, element: 'Thổ', polarity: 'Dương', colorName: 'Vàng Đậm', colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50 border-yellow-300', hex: '#CA8A04', star: 'Ngũ Hoàng' },
  6: { digit: 6, element: 'Kim', polarity: 'Dương', colorName: 'Trắng Bạc', colorClass: 'text-slate-600', bgClass: 'bg-slate-100 border-slate-300', hex: '#475569', star: 'Lục Bạch' },
  7: { digit: 7, element: 'Kim', polarity: 'Âm', colorName: 'Vàng Kim', colorClass: 'text-slate-500', bgClass: 'bg-slate-100 border-slate-300', hex: '#64748B', star: 'Thất Xích' },
  8: { digit: 8, element: 'Thổ', polarity: 'Âm', colorName: 'Nâu Trầm', colorClass: 'text-amber-800', bgClass: 'bg-amber-50 border-amber-300', hex: '#92400E', star: 'Bát Bạch' },
  9: { digit: 9, element: 'Hỏa', polarity: 'Dương', colorName: 'Đỏ Lửa', colorClass: 'text-rose-600', bgClass: 'bg-rose-50 border-rose-300', hex: '#E11D48', star: 'Cửu Tử' },
  0: { digit: 0, element: 'Thủy', polarity: 'Âm', colorName: 'Xanh Thẫm', colorClass: 'text-blue-600', bgClass: 'bg-blue-50 border-blue-300', hex: '#2563EB', star: 'Thủy Khố' }
};

// Vòng tương sinh ngũ hành
const GENERATING_CYCLE = {
  Kim: 'Thủy',
  Thủy: 'Mộc',
  Mộc: 'Hỏa',
  Hỏa: 'Thổ',
  Thổ: 'Kim'
};

// Vòng tương khắc ngũ hành
const OVERCOMING_CYCLE = {
  Kim: 'Mộc',
  Mộc: 'Thổ',
  Thổ: 'Thủy',
  Thủy: 'Hỏa',
  Hỏa: 'Kim'
};

// Hướng dẫn phù hợp ngũ hành theo ngành nghề và bản mệnh
const SUITABLE_GUIDE = {
  Kim: {
    suitableFor: 'Người khuyết Kim, người mệnh Thủy (được Kim dưỡng), người làm trong ngành tài chính, chứng khoán, ngân hàng, quản trị doanh nghiệp, luật sư, cơ khí.',
    unsuitableFor: 'Người bản mệnh Kim đã cực vượng (> 40%) hoặc người lấy Kim làm Kỵ thần (dễ phát sinh tính khí nóng nảy, căng thẳng thần kinh, bệnh lý phế quản).'
  },
  Mộc: {
    suitableFor: 'Người khuyết Mộc, người mệnh Hỏa (được Mộc sinh), người hoạt động trong ngành giáo dục, xuất bản, sáng tạo nghệ thuật, y dược đông y, nông lâm nghiệp.',
    unsuitableFor: 'Người bản mệnh Mộc đã quá vượng (> 40%) hoặc Kỵ thần là Mộc (dễ gặp dao động cảm xúc, gan khí uất trệ, hao tài cho người khác).'
  },
  Thủy: {
    suitableFor: 'Người khuyết Thủy, người mệnh Mộc (được Thủy sinh), người làm kinh doanh xuất nhập khẩu, du lịch vận tải, truyền thông giải trí, tư vấn tài chính.',
    unsuitableFor: 'Người bản mệnh Thủy tràn ngập (> 40%) hoặc Kỵ thần là Thủy (dễ vướng thị phi đào hoa xấu, thất thoát dòng tiền, tỳ vị hàn lạnh).'
  },
  Hỏa: {
    suitableFor: 'Người khuyết Hỏa, người mệnh Thổ (được Hỏa sinh), người công tác trong lĩnh vực công nghệ cao, truyền thông, marketing, năng lượng, nhà hàng, ẩm thực.',
    unsuitableFor: 'Người bản mệnh Hỏa bốc vượng (> 40%) hoặc Kỵ thần là Hỏa (dễ bốc đồng, tranh chấp nóng nảy, mất ngủ, huyết áp tim mạch).'
  },
  Thổ: {
    suitableFor: 'Người khuyết Thổ, người mệnh Kim (được Thổ sinh), người làm bất động sản, xây dựng, kiến trúc, lưu kho, bảo hiểm, nông sản khoáng vật.',
    unsuitableFor: 'Người bản mệnh Thổ ứ trệ (> 40%) hoặc Kỵ thần là Thổ (dễ sinh tâm lý bảo thủ, trì trệ trong nắm bắt cơ hội mới, tiêu hóa kém).'
  }
};

class NumerologyRuleEngineService {
  /**
   * Tính Vận (Tam Nguyên Cửu Vận) động theo năm bất kỳ (Mặc định năm hiện tại)
   * Không bao giờ áp cứng Vận 9!
   * @param {number} year - Năm cần tính
   * @returns {number} Vận từ 1 đến 9
   */
  getPeriodFromYear(year = new Date().getFullYear()) {
    const y = parseInt(year, 10) || new Date().getFullYear();
    const baseYear = 1864; // Bắt đầu Vận 1 Thượng Nguyên (1864 - 1883)
    const diff = y - baseYear;
    const cycleOffset = ((diff % 180) + 180) % 180;
    return Math.floor(cycleOffset / 20) + 1;
  }

  /**
   * Lấy thông tin chu kỳ Vận đầy đủ
   */
  getPeriodDetails(period) {
    const p = parseInt(period, 10);
    const startYear = 1864 + (p - 1) * 20;
    const currentYear = new Date().getFullYear();
    let displayStart = startYear;
    while (displayStart + 180 <= currentYear + 20) {
      displayStart += 180;
    }
    const displayEnd = displayStart + 19;

    const names = {
      1: { name: 'Nhất Bạch Khảm Thủy', yuan: 'Thượng Nguyên', element: 'Thủy' },
      2: { name: 'Nhị Hắc Khôn Thổ', yuan: 'Thượng Nguyên', element: 'Thổ' },
      3: { name: 'Tam Bích Chấn Mộc', yuan: 'Thượng Nguyên', element: 'Mộc' },
      4: { name: 'Tứ Lục Tốn Mộc', yuan: 'Trung Nguyên', element: 'Mộc' },
      5: { name: 'Ngũ Hoàng Trung Cung', yuan: 'Trung Nguyên', element: 'Thổ' },
      6: { name: 'Lục Bạch Càn Kim', yuan: 'Trung Nguyên', element: 'Kim' },
      7: { name: 'Thất Xích Đoài Kim', yuan: 'Hạ Nguyên', element: 'Kim' },
      8: { name: 'Bát Bạch Cấn Thổ', yuan: 'Hạ Nguyên', element: 'Thổ' },
      9: { name: 'Cửu Tử Ly Hỏa', yuan: 'Hạ Nguyên', element: 'Hỏa' }
    };

    const info = names[p] || names[9];
    return {
      period: p,
      name: `Vận ${p} (${info.name})`,
      yuan: info.yuan,
      element: info.element,
      yearsRange: `${displayStart} - ${displayEnd}`,
      years: `${displayStart} - ${displayEnd}`,
      rulingStar: p, // Sao Đương Lệnh Vượng Khí
      futureStar: (p % 9) + 1, // Sao Tiến Khí Vượng Tinh
      retiredStar: p === 1 ? 9 : p - 1 // Sao Thoái Khí
    };
  }

  /**
   * Chuẩn hóa dãy số đầu vào
   * @param {string} rawInput 
   * @param {string} type - 'sim', 'plate', 'bank'
   */
  normalizeTargetNumber(rawInput, type = 'sim') {
    if (!rawInput) return { normalized: '', display: '' };
    const raw = String(rawInput).trim();

    if (type === 'plate') {
      const digitsOnly = raw.replace(/\D/g, '');
      let display = digitsOnly;
      if (digitsOnly.length === 5) {
        display = `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3)}`;
      }
      return {
        normalized: digitsOnly,
        display: display || digitsOnly
      };
    }

    if (type === 'bank') {
      const digitsOnly = raw.replace(/\D/g, '');
      const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
      return {
        normalized: digitsOnly,
        display: formatted || digitsOnly
      };
    }

    const digits = raw.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length === 10) {
      formatted = `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
    }
    return {
      normalized: digits,
      display: formatted || digits
    };
  }

  /**
   * Phân tích Ngũ Hành dãy số (từng chữ số, tỷ lệ % và dòng chảy tương sinh tương khắc)
   * @param {number[]} digits 
   */
  analyzeDigitElements(digits) {
    const analyzedDigits = digits.map((d, index) => {
      const info = DIGIT_ELEMENT_MAP[d] || DIGIT_ELEMENT_MAP[0];
      return {
        index,
        digit: d,
        element: info.element,
        polarity: info.polarity,
        star: info.star,
        colorName: info.colorName,
        colorClass: info.colorClass,
        bgClass: info.bgClass,
        hex: info.hex
      };
    });

    const elementCounts = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
    digits.forEach(d => {
      const el = DIGIT_ELEMENT_MAP[d]?.element || 'Thủy';
      elementCounts[el] = (elementCounts[el] || 0) + 1;
    });

    const total = digits.length || 1;
    const elementPercentages = {
      Kim: Math.round((elementCounts.Kim / total) * 100),
      Mộc: Math.round((elementCounts.Mộc / total) * 100),
      Thủy: Math.round((elementCounts.Thủy / total) * 100),
      Hỏa: Math.round((elementCounts.Hỏa / total) * 100),
      Thổ: Math.round((elementCounts.Thổ / total) * 100)
    };

    // Tìm ngũ hành vượng nhất của dãy số (dominant element)
    let dominantElement = 'Kim';
    let maxCount = -1;
    for (const [el, count] of Object.entries(elementCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantElement = el;
      }
    }

    // Phân tích dòng chảy tương sinh tương khắc giữa các số liền kề
    let generatingCount = 0;
    let overcomingCount = 0;
    let sameCount = 0;
    const flows = [];

    for (let i = 0; i < digits.length - 1; i++) {
      const d1 = digits[i];
      const d2 = digits[i + 1];
      const el1 = DIGIT_ELEMENT_MAP[d1].element;
      const el2 = DIGIT_ELEMENT_MAP[d2].element;

      if (GENERATING_CYCLE[el1] === el2) {
        generatingCount++;
        flows.push({ from: d1, to: d2, el1, el2, relation: 'Tương Sinh', desc: `${el1} sinh ${el2}`, type: 'sinh' });
      } else if (OVERCOMING_CYCLE[el1] === el2) {
        overcomingCount++;
        flows.push({ from: d1, to: d2, el1, el2, relation: 'Tương Khắc', desc: `${el1} khắc ${el2}`, type: 'khac' });
      } else if (el1 === el2) {
        sameCount++;
        flows.push({ from: d1, to: d2, el1, el2, relation: 'Tỷ Hòa', desc: `Đồng khí ${el1}`, type: 'tyhoa' });
      } else {
        flows.push({ from: d1, to: d2, el1, el2, relation: 'Bình Hòa', desc: `${el1} gặp ${el2}`, type: 'binh' });
      }
    }

    let flowEvaluation = 'Khí Trường Bình Hòa';
    let flowRating = 'BINH';
    if (generatingCount >= 3 && overcomingCount <= 1) {
      flowEvaluation = 'Dòng Chảy Tương Sinh Liên Hoàn (Khí Vượng Cát Lợi)';
      flowRating = 'CAT';
    } else if (overcomingCount >= 3) {
      flowEvaluation = 'Dòng Chảy Nhiều Tương Khắc (Khí Trường Va Chạm)';
      flowRating = 'HUNG';
    } else if (sameCount >= 3) {
      flowEvaluation = 'Tụ Khí Tỷ Hòa Vững Vàng';
      flowRating = 'CAT';
    }

    return {
      analyzedDigits,
      elementCounts,
      elementPercentages,
      dominantElement,
      flows,
      generatingCount,
      overcomingCount,
      sameCount,
      flowEvaluation,
      flowRating
    };
  }

  /**
   * Phân tích Cửu Tinh Huyền Không Động Vận
   */
  analyzeFeiXing(targetNumber, type = 'sim', period = 9) {
    const periodInfo = this.getPeriodDetails(period);
    const digits = String(targetNumber).replace(/\D/g, '').split('').map(Number);
    if (digits.length === 0) return null;

    const rulingStar = periodInfo.rulingStar;   // Ví dụ Vận 9 thì số 9
    const futureStar = periodInfo.futureStar;   // Ví dụ Vận 9 thì số 1
    const retiredStar = periodInfo.retiredStar; // Ví dụ Vận 9 thì số 8

    // 1. Đếm tần suất xuất hiện của từng số (1 đến 9, 0)
    const starCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 0: 0 };
    digits.forEach(d => { starCounts[d] = (starCounts[d] || 0) + 1; });

    // 2. Phân loại vai trò từng sao theo Vận
    const starClassification = {};
    for (let s = 1; s <= 9; s++) {
      let role = 'BINH_HOA';
      let roleName = 'Bình Hòa';
      let tagColor = 'neutral';

      if (s === rulingStar) {
        role = 'VUONG_LENH';
        roleName = 'Đương Lệnh Vượng Tinh (Tối Cát)';
        tagColor = 'green';
      } else if (s === futureStar) {
        role = 'TIEN_KHI';
        roleName = 'Tiến Khí Vượng Tinh (Thứ Cát)';
        tagColor = 'blue';
      } else if (s === retiredStar) {
        role = 'THOAI_KHI';
        roleName = 'Thoái Khí Tinh (Bình Hòa / Giảm Uy Lực)';
        tagColor = 'amber';
      } else if (s === 5) {
        role = 'DAI_SAT';
        roleName = 'Ngũ Hoàng Đại Sát';
        tagColor = 'red';
      } else if ([2, 3, 7].includes(s)) {
        role = 'SAT_TINH';
        roleName = 'Thất Vận Sát Tinh';
        tagColor = 'red';
      }

      starClassification[s] = {
        starNumber: s,
        count: starCounts[s] || 0,
        role,
        roleName,
        tagColor,
        ...NINE_STARS_INFO[s]
      };
    }

    // 3. Phân tích các cặp Tinh Tổ liền kề
    const pairs = [];
    for (let i = 0; i < digits.length - 1; i++) {
      const a = digits[i];
      const b = digits[i + 1];
      const pairStr = `${a}${b}`;

      let nature = 'NORMAL';
      let label = 'Bình thường';
      let desc = '';
      let badgeType = 'neutral';

      // A. CÁC CẶP HỢP HÀ ĐỒ (1-6, 2-7, 3-8, 4-9, 5-0)
      if (['16', '61'].includes(pairStr)) {
        nature = 'HA_DO'; label = 'Nhất Lục Cộng Tông (Thủy)'; badgeType = 'cat';
        desc = 'Hà Đồ sinh Thủy: Chủ về trí tuệ thông tuệ, giao tiếp hanh thông, quý nhân phù trợ.';
      } else if (['27', '72'].includes(pairStr)) {
        nature = 'HA_DO'; label = 'Nhị Thất Đồng Đạo (Hỏa)'; badgeType = 'cat';
        desc = 'Hà Đồ sinh Hỏa: Chủ về điền sản, danh vọng, nhiệt huyết kinh doanh.';
      } else if (['38', '83'].includes(pairStr)) {
        nature = 'HA_DO'; label = 'Tam Bát Vi Bằng (Mộc)'; badgeType = 'cat';
        desc = 'Hà Đồ sinh Mộc: Chủ về sinh sôi nảy nở, sáng tạo, phát triển công việc.';
      } else if (['49', '94'].includes(pairStr)) {
        nature = 'HA_DO'; label = 'Tứ Cửu Vi Hữu (Kim)'; badgeType = 'cat';
        desc = 'Hà Đồ sinh Kim: Danh tiếng, quyền lực, thương mại đắc tài lộc lớn.';
      } else if (['50', '05'].includes(pairStr)) {
        nature = 'HA_DO'; label = 'Ngũ Thập Đồng Đồ (Thổ)'; badgeType = 'cat';
        desc = 'Hà Đồ sinh Thổ: Nền móng vững chãi, tích lũy điền sản lâu dài.';
      }

      // B. CÁC CẶP HỢP THẬP (Tổng bằng 10)
      else if (a + b === 10) {
        nature = 'HOP_THAP'; label = `Hợp Thập (${a}-${b})`; badgeType = 'cat';
        desc = `Viên mãn Hợp Thập: Âm dương giao hội, tuần hoàn viên mãn, hóa giải xung sát.`;
        if (['19', '91'].includes(pairStr)) {
          desc = `Thủy Hỏa Ký Tế Hợp Thập: Đương Lệnh Vận ${period} gặp Tiến Khí, công danh tài lộc rực rỡ bậc nhất.`;
        }
      }

      // C. CÁC CẶP CÁT TINH ĐẶC BIỆT
      else if (['14', '41'].includes(pairStr)) {
        nature = 'SPECIAL_CAT'; label = 'Danh Văn Quán Thiên Hạ (1-4)'; badgeType = 'cat';
        desc = 'Nhất Tứ đồng cung: Văn Xương cực vượng, thi cử đỗ đạt, học thức danh giá.';
      } else if (['89', '98'].includes(pairStr)) {
        nature = 'SPECIAL_CAT'; label = 'Hỷ Khánh Trùng Phùng (8-9)'; badgeType = 'cat';
        desc = 'Bát Bạch gặp Cửu Tử: Điềm lành liên tiếp, đất đai sinh sôi tài lộc, gia đạo hưng vượng.';
      }

      // D. CÁC CẶP HUNG SÁT (Đặc thù Xe, Bank, Sim)
      else if (['67', '76'].includes(pairStr)) {
        nature = 'GIAO_KIEM_SAT'; label = 'Giao Kiếm Sát (6-7)'; badgeType = 'hung';
        desc = type === 'plate'
          ? 'Cực kỵ cho xe cộ: Càn Kim gặp Đoài Kim như đao kiếm va chạm, rất dễ bị va quẹt, tai nạn đâm đụng, móp méo thân vỏ.'
          : 'Đao kiếm tranh phong: Dễ gặp xích mích, tranh chấp, khẩu thiệt, thương tích dao kéo.';
      } else if (['97', '79'].includes(pairStr)) {
        nature = 'HOI_LOC_SAT'; label = 'Hồi Lộc Chi Tai (9-7)'; badgeType = 'hung';
        desc = type === 'plate'
          ? 'Hỏa thiêu Phế Kim: Quá nhiệt động cơ, nguy cơ cháy nổ chập điện, tài xế dễ nóng giận bốc hỏa.'
          : type === 'bank'
            ? 'Hao tài phá sản: Tiền vào cửa trước ra cửa sau, khó giữ được của, đầu tư dễ thua lỗ.'
            : 'Hỏa Kim giao chiến: Hao tài tốn của bất ngờ, xung đột tình cảm, bệnh hô hấp máu huyết.';
      } else if (['25', '52'].includes(pairStr)) {
        nature = 'NHI_NGU_SAT'; label = 'Nhị Ngũ Giao Gia (2-5)'; badgeType = 'hung';
        desc = type === 'plate'
          ? 'Đại sát bệnh tật: Xe hay hỏng hóc vặt khó sửa, người ngồi dễ mệt mỏi say xe suy kiệt.'
          : type === 'bank'
            ? 'Tắc nghẽn dòng tiền: Tài chính đình trệ, nợ xấu khó đòi, công việc bế tắc.'
            : 'Bệnh phù gặp Ngũ hoàng: Tai họa bất ngờ, sức khỏe sa sút, công việc bế tắc nghiêm trọng.';
      } else if (['37', '73'].includes(pairStr)) {
        nature = 'XUYEN_TAM_SAT'; label = 'Xuyên Tâm Sát (3-7)'; badgeType = 'hung';
        desc = type === 'plate'
          ? 'Tặc đạo xâm phạm: Rất dễ bị bắn tốc độ, phạt nguội, xước sơn vô cớ hoặc bị trộm cắp phụ tùng gương xe.'
          : type === 'bank'
            ? 'Lừa đảo chiếm đoạt: Dễ bị tiểu nhân lừa gạt, mất tiền oan, chuyển nhầm tiền hoặc tranh chấp tài sản.'
            : 'Mộc Kim giao chiến: Tranh chấp pháp luật, bị lừa dối, trộm cắp, phá tài thất thoát.';
      } else if (['23', '32'].includes(pairStr)) {
        nature = 'DAU_NGUU_SAT'; label = 'Đấu Ngưu Sát (2-3)'; badgeType = 'hung';
        desc = type === 'plate'
          ? 'Trâu bò húc nhau: Tài xế dễ nóng nảy, bị chèn ép tạt đầu, dễ xảy ra va chạm cãi cọ trên đường.'
          : 'Khẩu thiệt thị phi: Bất hòa gay gắt trong các mối quan hệ, tranh giành quyền lợi mệt mỏi.';
      }

      pairs.push({
        pair: pairStr,
        pos: i + 1,
        nature,
        label,
        badgeType,
        desc
      });
    }

    // Khử trùng lặp: mỗi tổ hợp cặp số chỉ xuất hiện 1 lần duy nhất trong danh sách
    const uniquePairsMap = new Map();
    for (const p of pairs) {
      if (!uniquePairsMap.has(p.pair)) {
        uniquePairsMap.set(p.pair, { ...p, count: 1 });
      } else {
        uniquePairsMap.get(p.pair).count += 1;
      }
    }
    const uniquePairs = Array.from(uniquePairsMap.values()).map(p => ({
      ...p,
      count: p.count,
      label: p.count > 1 ? `${p.label} (x${p.count})` : p.label
    }));

    // 4. Khí Khẩu Đuôi Số (Tụ khí tại các chữ số cuối)
    const tailLength = type === 'plate' ? 2 : 4;
    const tailDigits = digits.slice(-tailLength);
    const tailStr = tailDigits.join('');
    const hasRulingStarInTail = tailDigits.includes(rulingStar);
    const hasFutureStarInTail = tailDigits.includes(futureStar);
    const lastDigit = digits[digits.length - 1];

    let tailEvaluation = 'Bình Hòa';
    if (hasRulingStarInTail && hasFutureStarInTail) {
      tailEvaluation = `Thượng Cát (Đắc trọn Đương Vận ${rulingStar} & Tiến Khí ${futureStar})`;
    } else if (hasRulingStarInTail) {
      tailEvaluation = `Cát Lợi (Tụ khí Đương Lệnh Vận ${period})`;
    } else if (hasFutureStarInTail) {
      tailEvaluation = `Tiến Khí (Đón đầu vận hội tương lai)`;
    } else if (lastDigit === 5) {
      tailEvaluation = `Hung Sát (Đuôi số kết thúc bằng Ngũ Hoàng Đại Sát 5)`;
    }

    // 5. Cân Bằng Âm Dương (Chẵn: Âm, Lẻ: Dương)
    const oddCount = digits.filter(d => d % 2 !== 0).length; // Dương
    const evenCount = digits.filter(d => d % 2 === 0).length; // Âm
    const totalDigits = digits.length;
    let balanceState = 'Cân Bằng Hoàn Hảo';
    let balanceRating = 'CAT';

    const diff = Math.abs(oddCount - evenCount);
    if (diff <= (totalDigits <= 5 ? 1 : 2)) {
      balanceState = `Âm Dương Hòa Hợp (${oddCount} Dương : ${evenCount} Âm)`;
      balanceRating = 'CAT';
    } else if (oddCount > evenCount) {
      balanceState = `Thiên Dương (${oddCount} Dương : ${evenCount} Âm)`;
      balanceRating = (oddCount === totalDigits || diff >= 5) ? 'HUNG' : 'BINH';
    } else {
      balanceState = `Thiên Âm (${evenCount} Âm : ${oddCount} Dương)`;
      balanceRating = (evenCount === totalDigits || diff >= 5) ? 'HUNG' : 'BINH';
    }

    return {
      periodInfo,
      digits,
      starCounts,
      starClassification,
      pairs: uniquePairs,
      tailDigits: tailStr,
      tailEvaluation,
      oddCount,
      evenCount,
      balanceState,
      balanceRating
    };
  }

  /**
   * Mai Hoa Dịch Số Lập Quẻ (Chỉ Quẻ Chủ & Quẻ Biến - Bỏ Quẻ Hỗ)
   * Sử dụng kết quả đánh giá chuẩn xác từ 64 quẻ Dịch hằng ngày (dailyFortuneData)
   */
  calculateIChingHexagrams(targetNumber, type = 'sim') {
    const digits = String(targetNumber).replace(/\D/g, '').split('').map(Number);
    if (digits.length === 0) return null;

    const mid = Math.floor(digits.length / 2);
    const firstHalf = digits.slice(0, mid);
    const secondHalf = digits.slice(mid);

    const sumFirst = firstHalf.reduce((a, b) => a + b, 0);
    const sumSecond = secondHalf.reduce((a, b) => a + b, 0);
    const totalSum = digits.reduce((a, b) => a + b, 0);

    // Tính Thượng Quái & Hạ Quái (chia 8 lấy dư, dư 0 lấy 8)
    const upperGuaNum = (sumFirst % 8 === 0) ? 8 : (sumFirst % 8);
    const lowerGuaNum = (sumSecond % 8 === 0) ? 8 : (sumSecond % 8);

    // Hào Động (chia 6 lấy dư, dư 0 lấy 6: Hào 1 đến Hào 6)
    const movingLine = (totalSum % 6 === 0) ? 6 : (totalSum % 6);

    const upperTrigram = TRIGRAM_MAP[upperGuaNum] || TRIGRAM_MAP[1];
    const lowerTrigram = TRIGRAM_MAP[lowerGuaNum] || TRIGRAM_MAP[1];

    // Tạo mã Binary 6-bit cho Quẻ Chủ: Upper 3 bits + Lower 3 bits
    const primaryBinary = `${upperTrigram.binary}${lowerTrigram.binary}`;
    const primaryHex = hexagramsData.find(h => h.binary_code === primaryBinary) || {
      id: 1, name: 'Thuần Càn', palace: 'Càn', palace_element: 'Kim'
    };

    // Tạo Quẻ Biến: Đảo hào tại vị trí movingLine
    const flipIndex = 6 - movingLine;
    const transformedBinaryChars = primaryBinary.split('');
    transformedBinaryChars[flipIndex] = transformedBinaryChars[flipIndex] === '1' ? '0' : '1';
    const transformedBinary = transformedBinaryChars.join('');

    const transformedHex = hexagramsData.find(h => h.binary_code === transformedBinary) || {
      id: 1, name: 'Thuần Càn', palace: 'Càn', palace_element: 'Kim'
    };

    // Lấy phán đoán chuẩn từ bộ 64 quẻ Dịch hằng ngày
    const primaryDaily = dailyJudgments[primaryHex.id] || {
      rank: 'Trung Cát',
      tagline: 'Vạn sự hanh thông khi giữ chính tâm, thời cơ tích lũy bền vững.',
      advice: 'Giữ tâm bình khí hòa, tích lũy công đức ắt gặt quả ngọt.'
    };
    const transformedDaily = dailyJudgments[transformedHex.id] || {
      rank: 'Trung Cát',
      tagline: 'Tương lai bình ổn, tích lũy công đức sinh tài lộc lâu dài.',
      advice: 'Biết đủ là đủ, kiên định trên con đường chính đạo.'
    };

    return {
      upperTrigram,
      lowerTrigram,
      movingLine,
      primaryHexagram: {
        id: primaryHex.id,
        name: primaryHex.name,
        fullName: primaryDaily.fullName || primaryHex.name,
        binary: primaryBinary,
        palace: primaryHex.palace,
        element: primaryHex.palace_element,
        auspicious: primaryDaily.rank, // 'Đại Cát', 'Thượng Cát', 'Trung Cát', 'Cẩn Trọng'
        description: primaryDaily.tagline,
        advice: primaryDaily.advice
      },
      transformedHexagram: {
        id: transformedHex.id,
        name: transformedHex.name,
        fullName: transformedDaily.fullName || transformedHex.name,
        binary: transformedBinary,
        palace: transformedHex.palace,
        element: transformedHex.palace_element,
        auspicious: transformedDaily.rank,
        description: transformedDaily.tagline,
        advice: transformedDaily.advice
      }
    };
  }

  /**
   * Tương Phối Bát Tự (Dụng Thần, Ngũ Hành Vượng Nhất, Thích Hợp Cho Ai)
   */
  calculateBaziCompatibility(targetNumber, ownerBirthInfo, feixingAnalysis, elementAnalysis) {
    if (!ownerBirthInfo || !ownerBirthInfo.birthDate) return null;

    try {
      const birthDate = ownerBirthInfo.birthDate;
      const birthHour = ownerBirthInfo.birthHour || '12:00';
      const gender = ownerBirthInfo.gender !== undefined ? parseInt(ownerBirthInfo.gender, 10) : 1;

      // Phân tích Bát Tự thực sự qua BaziAnalyzer
      const baziResult = BaziAnalyzer.analyze(birthDate, birthHour, gender, 'midnight');
      if (!baziResult) return null;

      const dayMaster = baziResult.canChi?.day || {};
      const dayMasterStem = dayMaster.gan || 'Giáp';
      const dayMasterElement = dayMaster.naYin?.slice(-3) || 'Kim';

      const primaryDungThan = baziResult.dungThan || 'Kim';
      const hyThan = baziResult.hyThan || 'Thủy';
      const kyThan = baziResult.kyThan || 'Hỏa';

      // 1. Phân tích ngũ hành bản mệnh Bát Tự (%) và tìm ngũ hành vượng nhất
      const rawNguHanh = baziResult.nguHanh || {};
      const baziElements = {
        Kim: Number(rawNguHanh.Kim || 0),
        Mộc: Number(rawNguHanh.Moc || 0),
        Thủy: Number(rawNguHanh.Thuy || 0),
        Hỏa: Number(rawNguHanh.Hoa || 0),
        Thổ: Number(rawNguHanh.Tho || 0)
      };

      let strongestElement = 'Kim';
      let strongestPct = -1;
      let weakestElement = 'Thủy';
      let weakestPct = 999;

      for (const [el, pct] of Object.entries(baziElements)) {
        if (pct > strongestPct) {
          strongestPct = pct;
          strongestElement = el;
        }
        if (pct < weakestPct) {
          weakestPct = pct;
          weakestElement = el;
        }
      }

      // 2. Cung Phi Mệnh Quái
      const cungPhi = baziResult.cungMenh?.zhi || 'Càn';
      const menhTrachGroup = ['Khảm', 'Ly', 'Chấn', 'Tốn'].includes(cungPhi) ? 'Đông tứ mệnh' : 'Tây tứ mệnh';

      // 3. Phân tích tương thích giữa dãy số và Bát tự
      const numberElementCounts = elementAnalysis.elementCounts;
      const dungThanCount = numberElementCounts[primaryDungThan] || 0;
      const hyThanCount = numberElementCounts[hyThan] || 0;
      const kyThanCount = numberElementCounts[kyThan] || 0;
      const dominantElement = elementAnalysis.dominantElement;

      let compatibilityScore = 60; // Base score tương hợp Bát tự

      // Thưởng điểm Dụng thần
      if (dungThanCount >= 3) compatibilityScore += 22;
      else if (dungThanCount === 2) compatibilityScore += 16;
      else if (dungThanCount === 1) compatibilityScore += 8;
      else compatibilityScore -= 6; // Không có chữ số nào thuộc hành Dụng thần

      // Thưởng điểm Hỷ thần
      if (hyThanCount >= 2) compatibilityScore += 10;
      else if (hyThanCount === 1) compatibilityScore += 5;

      // Phạt điểm Kỵ thần
      if (kyThanCount >= 3) compatibilityScore -= 20;
      else if (kyThanCount === 2) compatibilityScore -= 12;
      else if (kyThanCount === 1) compatibilityScore -= 4;

      // Phạt nếu dãy số bồi dưỡng thêm cho ngũ hành vốn đã Cực Vượng trong bản mệnh (> 40%)
      if (strongestPct >= 40 && numberElementCounts[strongestElement] >= 3) {
        compatibilityScore -= 10; // Bệnh quá vượng gây mất cân bằng sinh khí
      }

      // Thưởng nếu ngũ hành vượng nhất của dãy số bổ khuyết cho ngũ hành khuyết nhất (< 5%)
      if (weakestPct <= 5 && dominantElement === weakestElement) {
        compatibilityScore += 10; // Bổ khuyết thần diệu
      }

      compatibilityScore = Math.max(35, Math.min(98, Math.round(compatibilityScore)));

      let matchEvaluation = 'Bình Hòa Tương Hợp';
      if (compatibilityScore >= 85) {
        matchEvaluation = `Đại Cát (Bổ trợ mạnh mẽ Dụng Thần ${primaryDungThan} & Hỷ Thần ${hyThan})`;
      } else if (compatibilityScore >= 72) {
        matchEvaluation = `Cát Lợi (Tương sinh bồi dưỡng Dụng Thần ${primaryDungThan})`;
      } else if (compatibilityScore < 55) {
        matchEvaluation = `Cần Chế Hóa (Chứa nhiều Kỵ Thần ${kyThan} hoặc phạm quá vượng)`;
      }

      // 4. Xác định Thích Hợp Cho Ai & Không Thích Hợp Cho Ai
      const guide = SUITABLE_GUIDE[dominantElement] || SUITABLE_GUIDE.Kim;
      const suitableFor = `${guide.suitableFor} Đặc biệt trợ lực tối đa cho người có Dụng Thần là ${dominantElement}.`;
      const unsuitableFor = guide.unsuitableFor;

      return {
        dayMasterStem,
        dayMasterElement,
        strength: baziResult.analysis?.energy7Levels?.level || 'Bình hòa',
        primaryDungThan,
        hyThan,
        kyThan,
        cungPhi,
        menhTrachGroup,
        baziElements,
        strongestElement: `${strongestElement} (${strongestPct.toFixed(1)}%)`,
        weakestElement: `${weakestElement} (${weakestPct.toFixed(1)}%)`,
        suitableFor,
        unsuitableFor,
        compatibilityScore,
        matchEvaluation
      };
    } catch (err) {
      console.error('Error calculating Bazi compatibility in Numerology:', err);
      return null;
    }
  }

  /**
   * Tính toán chấm điểm tổng thể toàn diện (Differentiated Overall Scoring: 40 - 95)
   */
  calculateOverallScore(feixingAnalysis, ichingHexagrams, baziCompat, elementAnalysis, type = 'sim') {
    let score = 50; // Điểm cơ sở cân bằng trung tính

    // 1. Điểm từ Quẻ Kinh Dịch Mai Hoa (Chuẩn hóa từ 64 quẻ Dịch: Đại Cát, Thượng Cát, Trung Cát, Cẩn Trọng, Hung, Đại Hung)
    const primRank = ichingHexagrams.primaryHexagram.auspicious;
    const transRank = ichingHexagrams.transformedHexagram.auspicious;

    if (primRank === 'Đại Cát') score += 14;
    else if (primRank === 'Thượng Cát') score += 8;
    else if (primRank === 'Trung Cát') score += 3;
    else if (primRank === 'Cẩn Trọng') score -= 4;
    else if (primRank === 'Hung') score -= 12;
    else if (primRank === 'Đại Hung') score -= 20;

    if (transRank === 'Đại Cát') score += 12;
    else if (transRank === 'Thượng Cát') score += 6;
    else if (transRank === 'Trung Cát') score += 2;
    else if (transRank === 'Cẩn Trọng') score -= 4;
    else if (transRank === 'Hung') score -= 10;
    else if (transRank === 'Đại Hung') score -= 16;

    // 2. Điểm từ Cửu Tinh Động Vận theo Tam Nguyên Cửu Vận
    const rulingCount = feixingAnalysis.starCounts[feixingAnalysis.periodInfo.rulingStar] || 0;
    const futureCount = feixingAnalysis.starCounts[feixingAnalysis.periodInfo.futureStar] || 0;
    const retiredCount = feixingAnalysis.starCounts[feixingAnalysis.periodInfo.retiredStar] || 0;
    const satCount = [2, 3, 7].reduce((acc, s) => acc + (feixingAnalysis.starCounts[s] || 0), 0);
    const star5Count = feixingAnalysis.starCounts[5] || 0;

    score += Math.min(12, rulingCount * 4); // Đương vận tối đa +12
    score += Math.min(9, futureCount * 3);  // Tiến khí tối đa +9
    score += Math.min(3, retiredCount * 1); // Thoái khí tối đa +3

    // Trừ điểm sát tinh nếu xuất hiện nhiều
    if (satCount > 2) {
      score -= (satCount - 2) * 3;
    }
    // Trừ điểm Ngũ Hoàng Đại Sát 5
    score -= star5Count * 4;

    // 3. Điểm từ Cặp Sao Tinh Tổ Liền Kề
    feixingAnalysis.pairs.forEach(p => {
      if (p.badgeType === 'cat') {
        score += 4;
      } else if (p.badgeType === 'hung') {
        if (type === 'plate') {
          score -= ['GIAO_KIEM_SAT', 'HOI_LOC_SAT'].includes(p.nature) ? 12 : 8;
        } else if (type === 'bank') {
          score -= ['HOI_LOC_SAT', 'NHI_NGU_SAT'].includes(p.nature) ? 12 : 8;
        } else {
          score -= 8;
        }
      }
    });

    // 4. Khí Khẩu Đuôi Số
    const digits = feixingAnalysis.digits;
    const lastDigit = digits[digits.length - 1];
    if (feixingAnalysis.tailEvaluation.includes('Thượng Cát')) score += 8;
    else if (feixingAnalysis.tailEvaluation.includes('Cát Lợi')) score += 5;
    else if (feixingAnalysis.tailEvaluation.includes('Tiến Khí')) score += 3;
    else if (lastDigit === 5 || feixingAnalysis.tailEvaluation.includes('Hung Sát')) score -= 8;

    // 5. Cân Bằng Âm Dương
    if (feixingAnalysis.balanceRating === 'CAT') score += 5;
    else if (feixingAnalysis.balanceRating === 'BINH') score -= 2;
    else if (feixingAnalysis.balanceRating === 'HUNG') score -= 10; // Độc âm/độc dương

    // 6. Dòng Chảy Ngũ Hành Dãy Số
    if (elementAnalysis.flowRating === 'CAT') score += 5;
    else if (elementAnalysis.flowRating === 'HUNG') score -= 6;

    // 7. Tương Phối Bát Tự (Nếu có chế độ Bát tự)
    if (baziCompat) {
      const baziDelta = (baziCompat.compatibilityScore - 65) * 0.45;
      score += baziDelta;
    }

    // Giới hạn dải điểm thực tế: từ 38 đến 97
    score = Math.max(38, Math.min(97, Math.round(score)));

    let auspiciousLevel = 'BINH';
    let levelLabel = 'Bình Hòa Vừa Phải';

    if (score >= 86) {
      auspiciousLevel = 'DAI_CAT';
      levelLabel = 'Tối Cát Thượng Đẳng';
    } else if (score >= 75) {
      auspiciousLevel = 'CAT';
      levelLabel = 'Cát Lợi Hanh Thông';
    } else if (score >= 60) {
      auspiciousLevel = 'BINH';
      levelLabel = 'Bình Hòa Vừa Phải';
    } else {
      auspiciousLevel = 'HUNG';
      levelLabel = 'Cẩn Trọng Chế Hóa';
    }

    return {
      score,
      auspiciousLevel,
      levelLabel
    };
  }

  /**
   * Hàm thực thi toàn diện cho Controller
   */
  executeAnalysis({ rawInput, type = 'sim', mode = 'quick', ownerBirthInfo = null, ownerName = 'Gia Chủ', year = null }) {
    const currentYear = year || new Date().getFullYear();
    const period = this.getPeriodFromYear(currentYear);

    const { normalized, display } = this.normalizeTargetNumber(rawInput, type);
    if (!normalized) {
      throw new Error('Dãy số không hợp lệ. Vui lòng nhập số chính xác.');
    }

    // 1. Phân tích Cửu Tinh Động Vận
    const feixingAnalysis = this.analyzeFeiXing(normalized, type, period);

    // 2. Phân tích Ngũ Hành dãy số (từng chữ số, tỷ lệ % và dòng chảy tương sinh)
    const elementAnalysis = this.analyzeDigitElements(feixingAnalysis.digits);

    // 3. Phân tích Kinh Dịch Mai Hoa Lập Quẻ (chuẩn 64 quẻ Dịch hằng ngày, bỏ Quẻ Hỗ)
    const ichingHexagrams = this.calculateIChingHexagrams(normalized, type);

    // 4. Phân tích Bát Tự (chỉ khi mode === 'bazi')
    const baziCompatibility = (mode === 'bazi' && ownerBirthInfo?.birthDate)
      ? this.calculateBaziCompatibility(normalized, ownerBirthInfo, feixingAnalysis, elementAnalysis)
      : null;

    // 5. Chấm điểm tổng quan toàn diện
    const overall = this.calculateOverallScore(feixingAnalysis, ichingHexagrams, baziCompatibility, elementAnalysis, type);

    const analysisSnapshot = {
      calculatedAtYear: currentYear,
      period,
      periodDetails: feixingAnalysis.periodInfo,
      feixingAnalysis,
      elementAnalysis,
      ichingHexagrams,
      baziCompatibility,
      overallScore: overall.score,
      auspiciousLevel: overall.auspiciousLevel,
      levelLabel: overall.levelLabel
    };

    return {
      targetNumber: normalized,
      displayNumber: display,
      period,
      ownerName: ownerName || 'Gia Chủ',
      analysisSnapshot
    };
  }
}

module.exports = new NumerologyRuleEngineService();
