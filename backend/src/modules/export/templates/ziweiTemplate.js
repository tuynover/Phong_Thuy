/**
 * ziweiTemplate.js - Tạo Bố Cục PDF Mệnh Bàn Tử Vi Đẩu Số 4x4
 */

const {
  renderCoverPage,
  wrapCompleteHtml,
  parseInterpretationSections,
  markdownToHtml,
  getElemTextColor,
  renderElementText,
  ELEMENT_COLORS
} = require('./templateUtils');

function generateZiweiHtml(record, scope = []) {
  const chartData = record.chartData || record.analysisSnapshot || record.result || {};
  const inputInfo = record.inputInfo || {};
  const rawPalaces = chartData.palaces || [];

  const hasScope = scope && scope.length > 0;
  const includeChart = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('ziwei_grid');

  let rawInterp = record.aiInterpretation?.content || record.analysis || record.analysisSnapshot?.aiInterpretation || '';
  if (!rawInterp && Array.isArray(record.aiInterpretation?.sections) && record.aiInterpretation.sections.length > 0) {
    rawInterp = record.aiInterpretation.sections.map(s => `### ${s.title || ''}\n\n${s.content || ''}`).join('\n\n');
  }

  const sections = parseInterpretationSections(rawInterp);
  const isAllInterpRequested = !hasScope ||
    scope.includes('all') ||
    scope.includes('interpretation') ||
    scope.includes('interp') ||
    scope.includes('intro') ||
    scope.includes('all_interpretation');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    return scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`ziwei_${sec.id}`);
  });

  const ZIWEI_GRID_COORDINATES = {
    "Tỵ": { row: 1, col: 1 },
    "Ngọ": { row: 1, col: 2 },
    "Mùi": { row: 1, col: 3 },
    "Thân": { row: 1, col: 4 },
    "Dậu": { row: 2, col: 4 },
    "Tuất": { row: 3, col: 4 },
    "Hợi": { row: 4, col: 4 },
    "Tý": { row: 4, col: 3 },
    "Sửu": { row: 4, col: 2 },
    "Dần": { row: 4, col: 1 },
    "Mão": { row: 3, col: 1 },
    "Thìn": { row: 2, col: 1 }
  };

  const ZIWEI_BRANCHES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

  const ZIWEI_BRANCH_ELEMENTS = {
    "Tý": "Thủy", "Hợi": "Thủy",
    "Dần": "Mộc", "Mão": "Mộc",
    "Tỵ": "Hỏa", "Ngọ": "Hỏa",
    "Thân": "Kim", "Dậu": "Kim",
    "Thìn": "Thổ", "Tuất": "Thổ", "Sửu": "Thổ", "Mùi": "Thổ"
  };

  const ZIWEI_STAR_ELEMENTS = {
    // Chính tinh
    "Tử Vi": "Thổ", "Thiên Phủ": "Thổ", "Vũ Khúc": "Kim", "Thiên Tướng": "Thủy",
    "Thái Dương": "Hỏa", "Cự Môn": "Thủy", "Thiên Cơ": "Mộc", "Thiên Đồng": "Thủy",
    "Thái Âm": "Thủy", "Thiên Lương": "Mộc", "Thất Sát": "Kim", "Phá Quân": "Thủy",
    "Tham Lang": "Thủy", "Liêm Trinh": "Hỏa",
    // Cát tinh & phụ tinh
    "Văn Xương": "Kim", "Văn Khúc": "Thủy", "Thiên Khôi": "Hỏa", "Thiên Việt": "Hỏa",
    "Tả Phù": "Thổ", "Hữu Bật": "Thủy", "Lộc Tồn": "Thổ", "Thiên Mã": "Hỏa",
    "Hóa Lộc": "Mộc", "Hóa Quyền": "Thủy", "Hóa Khoa": "Mộc", "Hóa Kỵ": "Thủy",
    "Đào Hoa": "Mộc", "Hồng Loan": "Thủy", "Thiên Hỷ": "Thủy", "Hỷ Thần": "Hỏa",
    "Long Trì": "Thủy", "Phượng Các": "Thổ", "Giải Thần": "Mộc", "Thanh Long": "Thủy",
    "Bác Sĩ": "Thủy", "Bác Sỹ": "Thủy", "Lực Sĩ": "Hỏa", "Tướng Quân": "Mộc",
    "Tấu Thư": "Kim", "Quốc Ấn": "Thổ", "Tam Thai": "Thủy", "Bát Tọa": "Thổ",
    "Phong Cáo": "Thổ", "Thiên Quan": "Hỏa", "Thiên Phúc": "Thổ", "Thiên Đức": "Thủy",
    "Nguyệt Đức": "Hỏa", "Thiên Quý": "Thổ", "Thiên Tài": "Thổ", "Thiên Thọ": "Thổ",
    "Thiên Trù": "Thổ", "Thai Phụ": "Kim", "Ân Quang": "Mộc", "Thiên Y": "Thủy",
    // Sát tinh & hung bại tinh
    "Kình Dương": "Kim", "Đà La": "Kim", "Hỏa Tinh": "Hỏa", "Linh Tinh": "Hỏa",
    "Địa Không": "Hỏa", "Địa Kiếp": "Hỏa", "Thiên Khốc": "Thủy", "Thiên Hư": "Thủy",
    "Thiên Hình": "Hỏa", "Thiên Diêu": "Thủy", "Cô Thần": "Thổ", "Quả Tú": "Thổ",
    "Đại Hao": "Hỏa", "Tiểu Hao": "Hỏa", "Tang Môn": "Mộc", "Bạch Hổ": "Kim",
    "Điếu Khách": "Hỏa", "Quan Phù": "Hỏa", "Phục Binh": "Hỏa", "Kiếp Sát": "Hỏa",
    "Tuần": "Hỏa", "Triệt": "Kim", "Tuần Không": "Hỏa", "Triệt Lộ": "Kim",
    "Bệnh Phù": "Thổ", "Trực Phù": "Hỏa", "Phi Liêm": "Hỏa", "Tuế Dịch": "Hỏa",
    "Lưu Hà": "Thủy", "Thiên Thương": "Thủy", "Thiên Sứ": "Thủy", "Phá Toái": "Hỏa"
  };

  const ZIWEI_ELEMENT_COLORS = {
    "Kim": "#475569",    // Xám bạc
    "Mộc": "#059669",    // Xanh lục
    "Thủy": "#0f172a",   // Đen / Xanh đen
    "Hỏa": "#dc2626",    // Đỏ
    "Thổ": "#b45309"     // Vàng cam đất
  };

  const ZIWEI_AUSPICIOUS_STARS = new Set([
    "Văn Xương", "Văn Khúc", "Thiên Khôi", "Thiên Việt", "Tả Phù", "Hữu Bật",
    "Lộc Tồn", "Thiên Mã", "Hóa Lộc", "Hóa Quyền", "Hóa Khoa", "Giải Thần",
    "Đường Phù", "Quốc Ấn", "Tam Thai", "Bát Tọa", "Thiên Hỷ", "Hỷ Thần",
    "Phượng Các", "Thanh Long", "Tướng Quân", "Bác Sĩ", "Bác Sỹ", "Lực Sĩ",
    "Tấu Thư", "Trực Phù", "Thiên Quan", "Thiên Phúc", "Thiên Quý", "Thiên Đức",
    "Nguyệt Đức", "Long Đức", "Phúc Đức", "Đào Hoa", "Hồng Loan", "Thiên Tài",
    "Thiên Thọ", "Phong Cáo", "Nguyệt Giải", "Thai Phụ", "Long Trì", "Thiên Trù",
    "Ân Quang", "Bát Tòa", "Thiên Trù", "Quốc ấn", "Phượng các"
  ]);

  function isAuspiciousStar(name) {
    if (!name) return true;
    const trimmed = name.trim();
    if (ZIWEI_AUSPICIOUS_STARS.has(trimmed)) return true;
    const lower = trimmed.toLowerCase();
    if (lower.includes("không") || lower.includes("kiếp") || lower.includes("kình") || 
        lower.includes("đà") || lower.includes("hỏa") || lower.includes("linh") || 
        lower.includes("khốc") || lower.includes("hư") || lower.includes("hình") || 
        lower.includes("sát") || lower.includes("diêu") || lower.includes("cô") || 
        lower.includes("quả") || lower.includes("toái") || lower.includes("phá") || 
        lower.includes("hao") || lower.includes("tang") || lower.includes("hổ") || 
        lower.includes("khách") || lower.includes("la") || lower.includes("võng") || 
        lower.includes("triệt") || lower.includes("tuần") || lower.includes("bệnh") || 
        lower.includes("tử") || lower.includes("kỵ") || lower.includes("binh") || lower.includes("thương")) {
      return false;
    }
    if (lower.includes("lộc") || lower.includes("quyền") || lower.includes("khoa") || 
        lower.includes("trì") || lower.includes("hỷ") || lower.includes("giải") || 
        lower.includes("phúc") || lower.includes("đức") || lower.includes("long") || 
        lower.includes("phượng") || lower.includes("thanh") || lower.includes("trù") || 
        lower.includes("quý") || lower.includes("thọ") || lower.includes("quang")) {
      return true;
    }
    return true;
  }

  function formatAbbrevStemBranch(stem, branch) {
    const stemMap = {
      "Giáp": "G.", "Ất": "Ấ.", "Bính": "B.", "Đinh": "Đ.", "Mậu": "M.",
      "Kỷ": "K.", "Canh": "C.", "Tân": "T.", "Nhâm": "N.", "Quý": "Q."
    };
    const abbr = stemMap[stem] || stem || "";
    return `${abbr}${branch || ''}`;
  }

  function getStarColor(starName) {
    const elem = ZIWEI_STAR_ELEMENTS[starName] || "Thủy";
    return ZIWEI_ELEMENT_COLORS[elem] || "#0f172a";
  }

  function getBranchColor(branchName) {
    const elem = ZIWEI_BRANCH_ELEMENTS[branchName] || "Thủy";
    return ZIWEI_ELEMENT_COLORS[elem] || "#0f172a";
  }

  const menhPalace = rawPalaces.find(p => p.name === 'Mệnh' || p.name === 'MỆNH');
  const bodyPalace = rawPalaces.find(p => p.isBodyPalace || p.name?.includes('Thân'));

  const includeCover = scope.includes('cover') || scope.includes('all') || (!hasScope);
  let coverHtml = '';
  if (includeCover) {
    coverHtml = renderCoverPage({
      system: 'ziwei',
      title: 'TỬ VI ĐẨU SỐ TOÀN THƯ MỆNH BÀN',
      subtitle: 'Khảo Luận 12 Cung Vị, Tinh Đẩu Đắc Hãm & Tứ Hóa Phi Tinh Biến Hóa',
      clientName: chartData.name || inputInfo.name || 'Gia Chủ',
      gender: inputInfo.gender === 'female' || parseInt(inputInfo.gender) === 0 ? 'Nữ Mệnh' : 'Nam Mệnh',
      dateStr: inputInfo.birthday || inputInfo.date || 'Chưa xác định',
      lunarStr: record.lunarDate ? `Âm lịch: ${record.lunarDate}` : '',
      extraInfo: [
        ...(record.cuc ? [{ label: 'Cục vị', value: record.cuc }] : []),
        ...(record.menhChu ? [{ label: 'Mệnh Chủ', value: `${record.menhChu} | Thân: ${record.thanChu || ''}` }] : [])
      ],
      recordId: record._id || '',
      sealText: ['TỬ', 'VI', 'ĐẨU', 'SỐ']
    });
  }

  let contentHtml = coverHtml + `
    <div class="monograph-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="monograph-badge" style="background: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe;">Hồ Sơ Tử Vi Cá Nhân • Bắc Phái Mệnh Lý</span>
          <h1 class="monograph-title serif-title">MỆNH BÀN 12 CUNG & VẬN HẠN ĐẨU SỐ</h1>
        </div>
        <div style="text-align: right; font-size: 7.5pt; color: #78350f; font-weight: 700;">
          MÃ LÁ SỐ: ${record._id?.slice(0, 18) || 'N/A'}
        </div>
      </div>
    </div>
  `;

  if (includeChart && rawPalaces.length > 0) {
    const currentYear = new Date().getFullYear();
    const currentYearBranchIdx = (currentYear - 4) % 12;

    function formatBirthDate(dateStr) {
      if (!dateStr) return '-';
      const parts = dateStr.split(' ')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    }
    const solarDateFormatted = formatBirthDate(chartData.solarDate || inputInfo.date);

    const LUNAR_HOURS_NAMES = [
      "Tý (23:00 - 00:59)", "Sửu (01:00 - 02:59)", "Dần (03:00 - 04:59)", "Mão (05:00 - 06:59)",
      "Thìn (07:00 - 08:59)", "Tỵ (09:00 - 10:59)", "Ngọ (11:00 - 12:59)", "Mùi (13:00 - 14:59)",
      "Thân (15:00 - 16:59)", "Dậu (17:00 - 18:59)", "Tuất (19:00 - 20:59)", "Hợi (21:00 - 22:59)"
    ];
    let hourDisplay = '-';
    if (inputInfo.hour !== undefined && LUNAR_HOURS_NAMES[inputInfo.hour]) {
      hourDisplay = LUNAR_HOURS_NAMES[inputInfo.hour];
    } else if (chartData.chineseDate) {
      const hourBranch = chartData.chineseDate.split('-').pop()?.trim() || '';
      hourDisplay = 'Giờ ' + hourBranch;
    }

    contentHtml += `
      <div class="no-break">
        <div class="section-title">I. Mệnh Bàn 12 Cung Số (Đồ Hình 4x4)</div>
        <div class="ziwei-grid">
          <!-- 12 Cung Vị theo Tọa Độ Vòng Địa Bàn -->
          ${rawPalaces.map((p) => {
            const rawBranch = p.earthlyBranch || p.earthBranch || 'Dần';
            const branch = rawBranch.charAt(0).toUpperCase() + rawBranch.slice(1);
            const coord = ZIWEI_GRID_COORDINATES[branch] || { row: 1, col: 1 };
            const isMenh = p.name === 'Mệnh' || p.name === 'MỆNH';
            const isBody = p.isBodyPalace || p.name?.includes('Thân');
            const palaceClass = isMenh ? 'menh-palace' : (isBody ? 'body-palace' : '');

            const branchColor = getBranchColor(branch);
            const stem = p.heavenlyStem || p.heavenStem || '';
            const abbrStemBranch = formatAbbrevStemBranch(stem, branch);

            const majorStars = p.majorStars || [];
            const minorStars = p.minorStars || [];
            const adjectiveStars = p.adjectiveStars || [];

            const allOtherStars = [
              ...minorStars.map(s => ({ name: s.name, brightness: s.brightness, mutagen: s.mutagen })),
              ...adjectiveStars.map(s => ({ name: s.name, brightness: '', mutagen: '' }))
            ];
            const majorNames = new Set(majorStars.map(s => s.name));
            const filteredMinorStars = allOtherStars.filter(s => !majorNames.has(s.name));

            const leftStars = [];
            const rightStars = [];
            filteredMinorStars.forEach(s => {
              if (isAuspiciousStar(s.name)) {
                leftStars.push(s);
              } else {
                rightStars.push(s);
              }
            });

            // Tiểu hạn & Nguyệt hạn
            const branchIdx = ZIWEI_BRANCHES.indexOf(branch);
            const tieuHanIdx = (branchIdx - 2 + 12) % 12;
            const tieuHanBranch = ZIWEI_BRANCHES[tieuHanIdx] || '';
            const tieuHanColor = getBranchColor(tieuHanBranch);
            const nguyetHanMonth = (branchIdx - currentYearBranchIdx + 12) % 12 + 1;
            const nguyetHanText = 'Th.' + nguyetHanMonth;

            return `
              <div class="ziwei-cell ${palaceClass}" style="grid-row: ${coord.row}; grid-column: ${coord.col};">
                <!-- Đỉnh cung -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 0.5px solid #f1f5f9; padding-bottom: 1.5px; line-height: 1;">
                  <span style="font-size: 6.8pt; font-weight: 700; color: #475569;">${abbrStemBranch}</span>
                  <span style="font-size: 8.5pt; font-weight: 900; color: ${branchColor}; text-transform: uppercase;">
                    ${p.name}${isBody && !p.name?.includes('Thân') ? ' <span style="font-size: 6.8pt; color: #4338ca; font-weight: 800;">(Thân)</span>' : ''}
                  </span>
                  <span style="font-size: 6.8pt; font-weight: 700; color: #64748b;">${p.decadal?.range ? p.decadal.range[0] + 't' : ''}</span>
                </div>

                <!-- Chính tinh (Căn giữa) -->
                <div style="margin: 2px 0; text-align: center; min-height: 22px; display: flex; flex-direction: column; justify-content: center; gap: 1px;">
                  ${majorStars.length > 0 ? majorStars.map(s => {
                    const sColor = getStarColor(s.name);
                    let mutagenHtml = '';
                    if (s.mutagen) {
                      const mut = String(s.mutagen).toLowerCase();
                      if (mut.includes('loc')) {
                        mutagenHtml = '<span style="font-size: 5.5pt; font-weight: 900; background: #dcfce7; color: #15803d; border: 0.5px solid #86efac; padding: 0 2px; border-radius: 2px; margin-left: 2px;">LỘC</span>';
                      } else if (mut.includes('quyen')) {
                        mutagenHtml = '<span style="font-size: 5.5pt; font-weight: 900; background: #fef3c7; color: #b45309; border: 0.5px solid #fde68a; padding: 0 2px; border-radius: 2px; margin-left: 2px;">QUYỀN</span>';
                      } else if (mut.includes('khoa')) {
                        mutagenHtml = '<span style="font-size: 5.5pt; font-weight: 900; background: #dbeafe; color: #1d4ed8; border: 0.5px solid #bfdbfe; padding: 0 2px; border-radius: 2px; margin-left: 2px;">KHOA</span>';
                      } else if (mut.includes('ky')) {
                        mutagenHtml = '<span style="font-size: 5.5pt; font-weight: 900; background: #ffe4e6; color: #be123c; border: 0.5px solid #fecdd3; padding: 0 2px; border-radius: 2px; margin-left: 2px;">KỴ</span>';
                      }
                    }
                    return `
                      <div style="font-size: 8pt; font-weight: 900; color: ${sColor}; line-height: 1.15;">
                        ${s.name}${s.brightness ? ` <span style="font-size: 6.5pt; font-weight: 600; color: #64748b;">(${s.brightness})</span>` : ''}${mutagenHtml}
                      </div>
                    `;
                  }).join('') : '<div style="font-size: 7.2pt; font-weight: 800; color: #94a3b8; font-style: italic;">VÔ CHÍNH DIỆU</div>'}
                </div>

                <!-- Phụ tinh 2 cột (Trái: Cát tinh, Phải: Sát tinh) -->
                <div style="display: flex; justify-content: space-between; gap: 2px; border-top: 0.5px solid #f8fafc; padding-top: 2px; flex: 1; min-height: 46px; max-height: 56px; overflow: hidden; font-size: 6.2pt; line-height: 1.2;">
                  <div style="width: 50%; text-align: left; overflow: hidden;">
                    ${leftStars.slice(0, 5).map(s => `<div style="color: ${getStarColor(s.name)}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}${s.brightness ? ` <span style="color: #94a3b8; font-size: 5.5pt;">(${s.brightness})</span>` : ''}</div>`).join('')}
                  </div>
                  <div style="width: 50%; text-align: right; overflow: hidden;">
                    ${rightStars.slice(0, 5).map(s => `<div style="color: ${getStarColor(s.name)}; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${s.name}${s.brightness ? ` <span style="color: #94a3b8; font-size: 5.5pt;">(${s.brightness})</span>` : ''}</div>`).join('')}
                  </div>
                </div>

                <!-- Đáy cung -->
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 0.5px solid #f1f5f9; padding-top: 1.5px; font-size: 6.8pt; line-height: 1;">
                  <span style="font-weight: 800; color: ${tieuHanColor};">${tieuHanBranch}</span>
                  <span style="font-weight: 600; color: #64748b;">${p.changsheng12 || ''}</span>
                  <span style="font-weight: 700; color: #4338ca; background: #e0e7ff; padding: 0.5px 3px; border-radius: 2px; font-size: 6pt;">${nguyetHanText}</span>
                </div>
              </div>
            `;
          }).join('')}

          <!-- TRUNG CUNG (THIÊN BÀN - 2x2 Ô Ở GIỮA) -->
          <div class="ziwei-center">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                <span style="font-size: 7.2pt; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.5px;">THIÊN BÀN TỬ VI ĐẨU SỐ</span>
                <span style="font-size: 6.8pt; font-weight: 800; text-transform: uppercase; padding: 1.5px 7px; border-radius: 8px; ${chartData.gender === 'Nữ' ? 'background: #fff1f2; color: #be123c; border: 0.5px solid #fecdd3;' : 'background: #eff6ff; color: #1d4ed8; border: 0.5px solid #bfdbfe;'}">
                  ${chartData.gender || 'Nam'} Mệnh
                </span>
              </div>
            </div>

            <div style="background: rgba(255, 255, 255, 0.9); border: 1px solid #e9d5ff; border-radius: 5px; padding: 6px 10px; margin: 4px 0; font-size: 7.2pt; line-height: 1.5; text-align: left;">
              <div style="display: flex; justify-content: space-between; border-bottom: 0.5px dashed #e9d5ff; padding-bottom: 2px; margin-bottom: 2px;">
                <div><span style="color: #64748b;">Bản Mệnh Cục:</span> <strong style="color: #0f172a; font-weight: 800;">${chartData.fiveElementsClass || '-'}</strong></div>
                <div><span style="color: #64748b;">Mệnh / Thân Chủ:</span> <strong style="color: #0f172a; font-weight: 800;">${chartData.soul || '-'} / ${chartData.body || '-'}</strong></div>
              </div>
              <div style="border-bottom: 0.5px dashed #e9d5ff; padding-bottom: 2px; margin-bottom: 2px;">
                <span style="color: #64748b;">Tứ Trụ Can Chi:</span> <strong style="color: #6b21a8; font-weight: 800;">${chartData.chineseDate || '-'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <div><span style="color: #64748b;">Dương Lịch:</span> <strong style="color: #0f172a; font-weight: 800;">${solarDateFormatted}</strong></div>
                <div><span style="color: #64748b;">Giờ Sinh:</span> <strong style="color: #0f172a; font-weight: 800;">${hourDisplay}</strong></div>
              </div>
            </div>

            <div style="font-size: 7pt; color: #6b21a8; font-weight: 700; background: #f3e8ff; border-radius: 3px; padding: 2.5px 6px;">
              <span>Cung Mệnh: <strong>An tại ${menhPalace?.earthlyBranch || '-'}</strong></span>
              <span style="margin: 0 6px; color: #c084fc;">•</span>
              <span>Thân Cư: <strong>${bodyPalace?.name || '-'} (${bodyPalace?.earthlyBranch || '-'})</strong></span>
            </div>
          </div>
        </div>

        <!-- Chú giải ngũ hành & Đắc Hãm ở chân lá số -->
        <div class="ziwei-legend-card">
          <div style="color: #475569;">
            <strong>Đắc Hãm:</strong> 
            <span style="color: #6b21a8; font-weight: 700;">(M)</span>: Miếu &nbsp;|&nbsp; 
            <span style="color: #6b21a8; font-weight: 700;">(V)</span>: Vượng &nbsp;|&nbsp; 
            <span style="color: #6b21a8; font-weight: 700;">(Đ)</span>: Đắc &nbsp;|&nbsp; 
            <span style="color: #6b21a8; font-weight: 700;">(B)</span>: Bình &nbsp;|&nbsp; 
            <span style="color: #6b21a8; font-weight: 700;">(H)</span>: Hãm
          </div>
          <div style="display: flex; gap: 8px; align-items: center; font-weight: 700;">
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #475569; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Kim</span>
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #059669; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Mộc</span>
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #0f172a; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Thủy</span>
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #dc2626; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Hỏa</span>
            <span><span style="display: inline-block; width: 7px; height: 7px; background: #b45309; border-radius: 1.5px; margin-right: 2px; vertical-align: middle;"></span>Thổ</span>
          </div>
        </div>
      </div>
    `;
  }

  // Luận giải Tử Vi: Áp dụng chapter-block tự nhiên, không ngắt trang cưỡng bức giữa các chương
  if (filteredSections.length > 0) {
    contentHtml += `
      <div class="page-break">
        <div class="doc-page-header">
          <span>Hồ Sơ Luận Giải Tử Vi Đẩu Số</span>
          <span>Đương Số: ${chartData.name || inputInfo.name || 'Gia Chủ'}</span>
        </div>
        <div style="text-align: center; margin: 16px 0 20px 0;">
          <h2 class="serif-title" style="font-size: 15pt; color: #78350f; margin-bottom: 4px;">TOÀN VĂN LUẬN ĐOÁN 12 CUNG & VẬN HẠN</h2>
          <div style="font-size: 8pt; color: #64748b;">Hệ thống phân tích học thuật Tử Vi kết hợp Đại Trí Tuệ Nhân Tạo Mệnh Lý</div>
        </div>
    `;

    filteredSections.forEach((sec, idx) => {
      contentHtml += `
        <div class="${idx > 0 ? 'chapter-block' : ''}">
          <h2 class="doc-h1 serif-title">${sec.title}</h2>
          <div class="serif-body">
            ${markdownToHtml(sec.content)}
          </div>
        </div>
      `;
    });

    contentHtml += `</div>`;
  }

  return wrapCompleteHtml(`Lá Số Tử Vi - ${chartData.name || inputInfo.name || 'Gia Chủ'}`, contentHtml);
}

/**
 * Tạo HTML cho Kinh Dịch (IChing) - Chu Dịch Chiêm Bốc & Lục Hào Lạc Giáp Cổ Pháp
 */

module.exports = {
  generateZiweiHtml
};
