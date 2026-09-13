/**
 * marriageTemplate.js - Tạo Bố Cục PDF Hợp Hôn Phu Thê & Gia Đạo
 */

const {
  renderCoverPage,
  wrapCompleteHtml,
  parseInterpretationSections,
  markdownToHtml,
  getElemTextColor,
  renderElementText,
  ELEMENT_COLORS,
  STEM_ELEMENTS,
  BRANCH_ELEMENTS,
  THAP_THAN_ABBREV,
  BAT_TRACH_PAIRS,
  BAT_TRACH_NATURE,
  CAN_HOP,
  CHI_LUC_HOP,
  CHI_TAM_HOP,
  CHI_LUC_XUNG,
  CHI_LUC_HAI,
  formatMenhQuai,
  evaluateNaYinRelation,
  evaluateCanRelation,
  evaluateZhiRelation
} = require('./templateUtils');

function extractDungHyKy(data) {
  if (!data) return { dungThan: '-', hyThan: '-', kyThan: '-' };

  // 1. Dụng Thần
  let dungThan = '';
  if (typeof data.dungThan === 'string' && data.dungThan.trim()) {
    dungThan = data.dungThan.trim();
  } else if (data.dungThan && typeof data.dungThan === 'object') {
    dungThan = data.dungThan.dungThan || data.dungThan.primary || data.dungThan.name || data.dungThan.element || '';
  }
  if (!dungThan && data.analysis) {
    dungThan = typeof data.analysis.dungThan === 'string' ? data.analysis.dungThan : (data.analysis.dungThan?.dungThan || '');
  }
  if (!dungThan && data.dungThanInfo?.primary) {
    dungThan = data.dungThanInfo.primary.dungThan || '';
  }
  if (!dungThan && data.analysisSnapshot?.dungThan) {
    dungThan = typeof data.analysisSnapshot.dungThan === 'string' ? data.analysisSnapshot.dungThan : (data.analysisSnapshot.dungThan?.dungThan || '');
  }

  // 2. Hỷ Thần
  let hyThan = '';
  if (typeof data.hyThan === 'string' && data.hyThan.trim()) {
    hyThan = data.hyThan.trim();
  } else if (data.dungThan && typeof data.dungThan === 'object' && data.dungThan.hyThan) {
    hyThan = data.dungThan.hyThan;
  }
  if (!hyThan && data.analysis) {
    hyThan = typeof data.analysis.hyThan === 'string' ? data.analysis.hyThan : (data.analysis.hyThan?.hyThan || '');
  }
  if (!hyThan && data.dungThanInfo?.primary) {
    hyThan = data.dungThanInfo.primary.hyThan || '';
  }
  if (!hyThan && data.analysisSnapshot?.hyThan) {
    hyThan = typeof data.analysisSnapshot.hyThan === 'string' ? data.analysisSnapshot.hyThan : (data.analysisSnapshot.hyThan?.hyThan || '');
  }

  // 3. Kỵ Thần
  let kyThan = '';
  if (typeof data.kyThan === 'string' && data.kyThan.trim()) {
    kyThan = data.kyThan.trim();
  } else if (data.dungThan && typeof data.dungThan === 'object' && data.dungThan.kyThan) {
    kyThan = data.dungThan.kyThan;
  }
  if (!kyThan && data.analysis) {
    kyThan = typeof data.analysis.kyThan === 'string' ? data.analysis.kyThan : (data.analysis.kyThan?.kyThan || '');
  }
  if (!kyThan && data.dungThanInfo?.primary) {
    kyThan = data.dungThanInfo.primary.kyThan || '';
  }
  if (!kyThan && data.analysisSnapshot?.kyThan) {
    kyThan = typeof data.analysisSnapshot.kyThan === 'string' ? data.analysisSnapshot.kyThan : (data.analysisSnapshot.kyThan?.kyThan || '');
  }

  return {
    dungThan: dungThan || '-',
    hyThan: hyThan || '-',
    kyThan: kyThan || '-'
  };
}

/**
 * Render bảng Tứ Trụ Can Chi đối chiếu (cho Trang 1 Hợp Hôn: 4 cột rộng rãi 100% chiều ngang)
 */
function renderMarriagePillarsMiniTable(canChi, isFemale) {
  const safeCanChi = {
    year: canChi?.year || {},
    month: canChi?.month || {},
    day: canChi?.day || {},
    hour: canChi?.hour || {}
  };
  const pillars = [
    { key: 'year', label: 'TRỤ NĂM', data: safeCanChi.year },
    { key: 'month', label: 'NGUYỆT LỆNH', data: safeCanChi.month },
    { key: 'day', label: 'NHẬT CHỦ', data: safeCanChi.day },
    { key: 'hour', label: 'TRỤ GIỜ', data: safeCanChi.hour }
  ];

  const headerColor = isFemale ? '#be123c' : '#1e3a8a';
  const tableBorder = isFemale ? '#fecdd3' : '#bfdbfe';

  return `
    <table style="width: 100%; table-layout: fixed; border-collapse: collapse; font-size: 7.2pt; text-align: center; border: 1.5px solid ${tableBorder}; border-radius: 6px; overflow: hidden; background: #ffffff; margin-bottom: 2px;">
      <thead>
        <tr style="color: ${headerColor}; font-size: 7.2pt; font-weight: 900; text-transform: uppercase; border-bottom: 1.5px solid ${tableBorder};">
          ${pillars.map(p => `<th style="padding: 4px 2px; width: 25%; letter-spacing: 0.3px;">${p.label}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <!-- Thập Thần -->
        <tr style="background: #fafafa; height: 16px; border-bottom: 1px solid #f1f5f9;">
          ${pillars.map(p => {
            const isDay = p.key === 'day';
            const tt = isDay ? (isFemale ? 'Bản Thể' : 'Nhật Chủ') : (p.data?.thapThanGan || '-');
            return `<td style="font-weight: 700; color: #64748b; font-size: 6.8pt; padding: 1px 2px;">${tt}</td>`;
          }).join('')}
        </tr>
        <!-- Thiên Can -->
        <tr style="height: 22px; border-bottom: 1px solid #f1f5f9;">
          ${pillars.map(p => {
            const gan = p.data?.gan || '-';
            const elem = STEM_ELEMENTS[gan] || '';
            const color = ELEMENT_COLORS[elem]?.text || '#0f172a';
            return `<td style="font-size: 13pt; font-weight: 900; color: ${color}; line-height: 1;">${gan}</td>`;
          }).join('')}
        </tr>
        <!-- Địa Chi -->
        <tr style="height: 22px; border-bottom: 1px solid #f1f5f9;">
          ${pillars.map(p => {
            const zhi = p.data?.zhi || '-';
            const elem = BRANCH_ELEMENTS[zhi] || '';
            const color = ELEMENT_COLORS[elem]?.text || '#0f172a';
            return `<td style="font-size: 13pt; font-weight: 900; color: ${color}; line-height: 1;">${zhi}</td>`;
          }).join('')}
        </tr>
        <!-- Nạp Âm -->
        <tr style="height: 17px; border-bottom: 1px solid #f1f5f9; background: #fdfdfd;">
          ${pillars.map(p => {
            const naYin = p.data?.naYin || '-';
            return `<td style="font-size: 6.6pt; color: #334155; font-weight: 600; padding: 1px 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${naYin}</td>`;
          }).join('')}
        </tr>
        <!-- Tàng Can -->
        <tr style="background: #fafbfc;">
          ${pillars.map(p => {
            const tcList = p.data?.tangCan || [];
            if (!tcList || tcList.length === 0) {
              return `<td style="padding: 2px; font-size: 6.2pt; color: #94a3b8;">-</td>`;
            }
            return `
              <td style="padding: 2px 4px; vertical-align: top;">
                <div style="display: flex; flex-direction: column; gap: 1.5px;">
                  ${tcList.slice(0, 3).map(tc => {
                    const color = ELEMENT_COLORS[STEM_ELEMENTS[tc.gan]]?.text || '#334155';
                    return `
                      <div style="display: flex; justify-content: space-between; font-size: 6.2pt; padding: 0 4px; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 2px;">
                        <span style="font-weight: 800; color: ${color};">${tc.gan}</span>
                        <span style="color: #64748b; font-size: 5.8pt;">${tc.thapThan || ''}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </td>
            `;
          }).join('')}
        </tr>
      </tbody>
    </table>
  `;
}

/**
 * Tạo HTML cho Hợp Hôn (Marriage) - Bát Tự & Bát Trạch Phối Cung Cổ Pháp
 */
function generateMarriageHtml(record, scope = []) {
  const inputInfo = record.inputInfo || {};
  const male = inputInfo.male || {};
  const female = inputInfo.female || {};
  const maleData = record.maleBaziData || record.analysisSnapshot?.maleBaziData || record.analysisSnapshot?.male || {};
  const femaleData = record.femaleBaziData || record.analysisSnapshot?.femaleBaziData || record.analysisSnapshot?.female || {};

  const hasScope = scope && scope.length > 0;
  const includeCompare = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('marriage_compare');
  const includePillars = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('marriage_pillars');

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
    scope.includes('all_interpretation') ||
    scope.includes('marriage_interpretation');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    return scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`marriage_${sec.id}`);
  });

  // Đánh giá 5 tiêu chí cổ học
  const mYearNaYin = maleData.canChi?.year?.naYin || '';
  const fYearNaYin = femaleData.canChi?.year?.naYin || '';
  const naYinRel = evaluateNaYinRelation(mYearNaYin, fYearNaYin);

  const mDayGan = maleData.canChi?.day?.gan || '';
  const fDayGan = femaleData.canChi?.day?.gan || '';
  const dayCanRel = evaluateCanRelation(mDayGan, fDayGan);

  const mDayZhi = maleData.canChi?.day?.zhi || '';
  const fDayZhi = femaleData.canChi?.day?.zhi || '';
  const dayZhiRel = evaluateZhiRelation(mDayZhi, fDayZhi);

  const mGua = maleData.menhQuai?.cung || '';
  const fGua = femaleData.menhQuai?.cung || '';
  const batTrachName = BAT_TRACH_PAIRS[mGua]?.[fGua] || '';
  const batTrachInfo = BAT_TRACH_NATURE[batTrachName] || { color: '#475569', bg: '#f8fafc', desc: 'Chưa xác định', type: 'bình' };

  const mDHK = extractDungHyKy(maleData);
  const fDHK = extractDungHyKy(femaleData);

  let contentHtml = '';

  const includeCover = scope.includes('cover') || scope.includes('all') || (!hasScope);
  if (includeCover) {
    contentHtml += renderCoverPage({
      system: 'marriage',
      title: 'HỢP HÔN ĐỐI CHIẾU GIA ĐẠO BẢN THƯ',
      subtitle: 'Tương Quan Bát Tự, Cung Phi Bát Trạch & Phác Đồ Hòa Hợp Gia Đạo',
      clientName: `${male.name || 'Gia Chủ Nam'} & ${female.name || 'Gia Chủ Nữ'}`,
      gender: 'Hợp Hôn Phu Thê',
      dateStr: `Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`,
      lunarStr: '',
      extraInfo: [
        { label: 'Chồng', value: `${male.name || 'Nam'} (${male.canChiYear || male.year || maleData.canChi?.year?.gan + ' ' + maleData.canChi?.year?.zhi || ''})` },
        { label: 'Vợ', value: `${female.name || 'Nữ'} (${female.canChiYear || female.year || femaleData.canChi?.year?.gan + ' ' + femaleData.canChi?.year?.zhi || ''})` },
        ...(batTrachName ? [{ label: 'Bát Trạch', value: `${batTrachName} (${batTrachInfo.desc})`, highlight: true }] : [])
      ],
      recordId: record._id || '',
      sealText: ['HỢP', 'HÔN', 'GIA', 'ĐẠO']
    });
  }

  const hasPage1 = includeCompare || includePillars;
  if (hasPage1) {
    contentHtml += `
      <!-- TRANG 1: HỒ SƠ TỔNG QUAN, 5 TIÊU CHÍ & TỨ TRỤ CAN CHI -->
      <div class="monograph-header" style="border: 1.5px solid #be123c; background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%); border-radius: 8px; padding: 7px 12px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="background: #be123c; color: #ffffff; font-size: 6.8pt; font-weight: 800; text-transform: uppercase; padding: 1.5px 7px; border-radius: 9999px;">Hồ Sơ Hợp Hôn Cá Nhân • Bát Tự & Bát Trạch</span>
          <span style="font-size: 7pt; color: #64748b; font-weight: 600;">MÃ HỒ SƠ: ${String(record._id || '').slice(0, 18)}</span>
        </div>
        <h1 class="serif-title" style="color: #881337; font-size: 14pt; font-weight: 900; margin: 3px 0 6px 0;">HỒ SƠ ĐỐI CHIẾU ĐỘ HÒA HỢP CẶP ĐÔI</h1>
        
        <div style="display: flex; gap: 10px;">
          <!-- Nam -->
          <div style="flex: 1; background: #ffffff; border: 1.5px solid #bfdbfe; border-radius: 6px; padding: 5px 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #dbeafe; padding-bottom: 2px; margin-bottom: 3px;">
              <span style="font-weight: 900; color: #1e40af; font-size: 8pt; text-transform: uppercase;">Đại Diện Nam Mệnh (Chồng): ${male.name || 'Gia Chủ Nam'}</span>
              <span style="font-size: 6.5pt; font-weight: 800; color: #2563eb; background: #eff6ff; padding: 1px 5px; border-radius: 3px;">Dương Cương</span>
            </div>
            <div style="font-size: 7.2pt; line-height: 1.4; color: #1e293b;">
              <div><strong>Dương Lịch:</strong> ${male.date || maleData.solarTimeline || '-'} (${male.time || ''})</div>
              <div><strong>Âm Lịch:</strong> ${maleData.lunarDateStr || '-'}</div>
              <div><strong>Nạp Âm Bản Mệnh:</strong> <span style="font-weight: 700; color: #b45309;">${mYearNaYin || maleData.canChi?.day?.naYin || '-'}</span></div>
              <div><strong>Cung Phi (Mệnh Quái):</strong> <span style="font-weight: 700; color: #1e40af;">${maleData.menhQuai ? formatMenhQuai(maleData.menhQuai) : '-'}</span></div>
            </div>
          </div>

          <!-- Nữ -->
          <div style="flex: 1; background: #ffffff; border: 1.5px solid #fecdd3; border-radius: 6px; padding: 5px 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ffe4e6; padding-bottom: 2px; margin-bottom: 3px;">
              <span style="font-weight: 900; color: #be123c; font-size: 8pt; text-transform: uppercase;">Đại Diện Nữ Mệnh (Vợ): ${female.name || 'Gia Chủ Nữ'}</span>
              <span style="font-size: 6.5pt; font-weight: 800; color: #f43f5e; background: #fff1f2; padding: 1px 5px; border-radius: 3px;">Âm Nhu</span>
            </div>
            <div style="font-size: 7.2pt; line-height: 1.4; color: #1e293b;">
              <div><strong>Dương Lịch:</strong> ${female.date || femaleData.solarTimeline || '-'} (${female.time || ''})</div>
              <div><strong>Âm Lịch:</strong> ${femaleData.lunarDateStr || '-'}</div>
              <div><strong>Nạp Âm Bản Mệnh:</strong> <span style="font-weight: 700; color: #64748b;">${fYearNaYin || femaleData.canChi?.day?.naYin || '-'}</span></div>
              <div><strong>Cung Phi (Mệnh Quái):</strong> <span style="font-weight: 700; color: #be123c;">${femaleData.menhQuai ? formatMenhQuai(femaleData.menhQuai) : '-'}</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (includeCompare) {
      contentHtml += `
        <!-- I. BẢNG ĐỐI CHIẾU 5 TIÊU CHÍ CỐT LÕI -->
        <div class="no-break" style="margin-bottom: 8px;">
          <div style="display: align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 3.5px; height: 13px; background-color: #be123c; border-radius: 2px; vertical-align: middle; margin-right: 6px;"></span>
            <span class="serif-title" style="font-size: 9pt; font-weight: 900; color: #881337; text-transform: uppercase; letter-spacing: 0.3px; vertical-align: middle;">
              I. BẢNG ĐỐI CHIẾU 5 TIÊU CHÍ HỢP HÔN CỔ PHÁP
            </span>
          </div>
          <table class="gfm-table" style="margin-bottom: 0;">
            <thead>
              <tr style="background: #f8fafc; color: #334155; font-size: 7pt; font-weight: 800;">
                <th style="width: 22%;">Học Thuật Đối Chiếu</th>
                <th style="width: 24%;">Bên Nam (Chồng)</th>
                <th style="width: 24%;">Bên Nữ (Vợ)</th>
                <th style="width: 30%;">Đánh Giá Mức Độ Tương Hợp</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. Bản Mệnh Nạp Âm -->
              <tr>
                <td><strong>1. Bản Mệnh Nạp Âm</strong></td>
                <td>${mYearNaYin || '-'}</td>
                <td>${fYearNaYin || '-'}</td>
                <td>
                  <span style="font-weight: 800; color: ${naYinRel.color}; background: ${naYinRel.bg}; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-bottom: 1px;">${naYinRel.text}</span>
                  <div style="font-size: 6.5pt; color: #64748b;">${naYinRel.desc}</div>
                </td>
              </tr>
              <!-- 2. Thiên Can (Nhật Can) -->
              <tr>
                <td><strong>2. Thiên Can Bản Thể</strong><br><span style="font-size: 6.2pt; color: #64748b;">Nhật Can (Tư tưởng, cốt cách)</span></td>
                <td>${mDayGan || '-'} (Hành ${STEM_ELEMENTS[mDayGan] || ''})</td>
                <td>${fDayGan || '-'} (Hành ${STEM_ELEMENTS[fDayGan] || ''})</td>
                <td>
                  <span style="font-weight: 800; color: ${dayCanRel.color}; background: ${dayCanRel.bg}; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-bottom: 1px;">${dayCanRel.text}</span>
                  <div style="font-size: 6.5pt; color: #64748b;">${dayCanRel.desc}</div>
                </td>
              </tr>
              <!-- 3. Địa Chi (Cung Phu Thê) -->
              <tr>
                <td><strong>3. Địa Chi Phu Thê</strong><br><span style="font-size: 6.2pt; color: #64748b;">Nhật Chi (Tình cảm, gia đạo)</span></td>
                <td>Chi ${mDayZhi || '-'} (${maleData.canChi?.day?.canChi || '-'})</td>
                <td>Chi ${fDayZhi || '-'} (${femaleData.canChi?.day?.canChi || '-'})</td>
                <td>
                  <span style="font-weight: 800; color: ${dayZhiRel.color}; background: ${dayZhiRel.bg}; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-bottom: 1px;">${dayZhiRel.text}</span>
                  <div style="font-size: 6.5pt; color: #64748b;">${dayZhiRel.desc}</div>
                </td>
              </tr>
              <!-- 4. Cung Phi Bát Trạch -->
              <tr>
                <td><strong>4. Cung Phi Bát Trạch</strong><br><span style="font-size: 6.2pt; color: #64748b;">Khí trường không gian sống</span></td>
                <td>${maleData.menhQuai?.cung || '-'} (${maleData.menhQuai?.group || '-'})</td>
                <td>${femaleData.menhQuai?.cung || '-'} (${femaleData.menhQuai?.group || '-'})</td>
                <td>
                  <span style="font-weight: 800; color: ${batTrachInfo.color}; background: ${batTrachInfo.bg}; padding: 1px 6px; border-radius: 3px; display: inline-block; margin-bottom: 1px;">Cung ${batTrachName || 'Chưa rõ'} (${batTrachInfo.type === 'cát' ? 'Cát' : 'Hung'})</span>
                  <div style="font-size: 6.5pt; color: #64748b;">${batTrachInfo.desc}</div>
                </td>
              </tr>
              <!-- 5. Hỷ Kỵ Dụng Thần -->
              <tr>
                <td><strong>5. Hỷ Kỵ Dụng Thần</strong><br><span style="font-size: 6.2pt; color: #64748b;">Trợ lực bổ khuyết năng lượng</span></td>
                <td>Dụng: <strong>${renderElementText(mDHK.dungThan)}</strong> | Hỷ: <strong>${renderElementText(mDHK.hyThan)}</strong> | Kỵ: <strong>${renderElementText(mDHK.kyThan)}</strong></td>
                <td>Dụng: <strong>${renderElementText(fDHK.dungThan)}</strong> | Hỷ: <strong>${renderElementText(fDHK.hyThan)}</strong> | Kỵ: <strong>${renderElementText(fDHK.kyThan)}</strong></td>
                <td>
                  <span style="font-weight: 700; color: #047857; background: #ecfdf5; padding: 1px 6px; border-radius: 3px; display: inline-block;">Cân bằng đa chiều</span>
                  <div style="font-size: 6.5pt; color: #64748b;">Khí lực hỗ trợ bổ khuyết cho nhau</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- II. SO SÁNH TỶ LỆ NGŨ HÀNH -->
        <div class="no-break" style="margin-bottom: 8px;">
          <div style="display: align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 3.5px; height: 13px; background-color: #b45309; border-radius: 2px; vertical-align: middle; margin-right: 6px;"></span>
            <span class="serif-title" style="font-size: 9pt; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px; vertical-align: middle;">
              II. ĐÁNH GIÁ CÂN BẰNG TỶ LỆ NGŨ HÀNH (NAM & NỮ)
            </span>
          </div>
          <table class="gfm-table" style="margin-bottom: 0; text-align: center;">
            <thead>
              <tr style="background: #f8fafc; font-size: 7pt; font-weight: 800;">
                <th style="width: 16%; text-align: left;">Đương Số</th>
                <th style="width: 16.8%; color: #64748b;">Kim 🪙</th>
                <th style="width: 16.8%; color: #059669;">Mộc 🌲</th>
                <th style="width: 16.8%; color: #2563eb;">Thủy 💧</th>
                <th style="width: 16.8%; color: #dc2626;">Hỏa 🔥</th>
                <th style="width: 16.8%; color: #b45309;">Thổ ⛰️</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: left; font-weight: 800; color: #1e40af;">Bên Nam</td>
                <td><strong>${Math.round(maleData.nguHanh?.Kim || 0)}%</strong></td>
                <td><strong>${Math.round(maleData.nguHanh?.Moc || 0)}%</strong></td>
                <td><strong>${Math.round(maleData.nguHanh?.Thuy || 0)}%</strong></td>
                <td><strong>${Math.round(maleData.nguHanh?.Hoa || 0)}%</strong></td>
                <td><strong>${Math.round(maleData.nguHanh?.Tho || 0)}%</strong></td>
              </tr>
              <tr>
                <td style="text-align: left; font-weight: 800; color: #be123c;">Bên Nữ</td>
                <td><strong>${Math.round(femaleData.nguHanh?.Kim || 0)}%</strong></td>
                <td><strong>${Math.round(femaleData.nguHanh?.Moc || 0)}%</strong></td>
                <td><strong>${Math.round(femaleData.nguHanh?.Thuy || 0)}%</strong></td>
                <td><strong>${Math.round(femaleData.nguHanh?.Hoa || 0)}%</strong></td>
                <td><strong>${Math.round(femaleData.nguHanh?.Tho || 0)}%</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    if (includePillars) {
      contentHtml += `
        <!-- III. CẤU TRÚC TỨ TRỤ CAN CHI NAM - NỮ -->
        <div class="no-break" style="margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 3.5px; height: 13px; background-color: #881337; border-radius: 2px; vertical-align: middle; margin-right: 6px;"></span>
            <span class="serif-title" style="font-size: 8.8pt; font-weight: 900; color: #1e293b; text-transform: uppercase; letter-spacing: 0.3px; vertical-align: middle;">
              III. CẤU TRÚC TỨ TRỤ CAN CHI (ĐỐI CHIẾU NAM TRÊN - NỮ DƯỚI)
            </span>
          </div>

          <!-- BẢNG 1: NAM MỆNH (CHỒNG) -->
          <div style="margin-bottom: 5px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-size: 7.2pt; font-weight: 900; color: #1e40af; text-transform: uppercase;">
                ♂ TỨ TRỤ NAM MỆNH (CHỒNG): ${male.name || 'Gia Chủ Nam'}
              </span>
              <span style="font-size: 6.2pt; color: #64748b;">(Trụ Năm - Nguyệt Lệnh - Nhật Chủ - Trụ Giờ)</span>
            </div>
            ${renderMarriagePillarsMiniTable(maleData.canChi, false)}
          </div>

          <!-- BẢNG 2: NỮ MỆNH (VỢ) -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
              <span style="font-size: 7.2pt; font-weight: 900; color: #be123c; text-transform: uppercase;">
                ♀ TỨ TRỤ NỮ MỆNH (VỢ): ${female.name || 'Gia Chủ Nữ'}
              </span>
              <span style="font-size: 6.2pt; color: #64748b;">(Trụ Năm - Nguyệt Lệnh - Nhật Chủ - Trụ Giờ)</span>
            </div>
            ${renderMarriagePillarsMiniTable(femaleData.canChi, true)}
        </div>
      `;
    }
  }

  // Luận giải (Trang 2+)
  if (filteredSections.length > 0) {
    if (hasPage1) {
      contentHtml += `<div class="page-break" style="padding-top: 5px;">`;
    } else {
      contentHtml += `<div style="padding-top: 5px;">`;
    }

    contentHtml += `
      <div class="doc-page-header">
        <span>Hồ Sơ Luận Giải Hợp Hôn Cổ Pháp</span>
        <span>Nam: ${male.name || 'Nam'} & Nữ: ${female.name || 'Nữ'}</span>
      </div>
      <div style="text-align: center; margin: 12px 0 16px 0;">
        <h2 class="serif-title" style="font-size: 14pt; color: #881337; margin-bottom: 3px;">TOÀN VĂN BẢN LUẬN GIẢI HÔN NHÂN & CHIẾN LƯỢC HÒA HỢP</h2>
        <div style="font-size: 7.5pt; color: #64748b;">Hệ Thống Trí Tuệ Nhân Tạo Mệnh Lý & Quy Tắc Cổ Học Bát Tự Phối Ngẫu</div>
      </div>

      ${filteredSections.map((sec, idx) => `
        <div class="${idx > 0 ? 'chapter-block' : ''}">
          <h2 class="doc-h1 serif-title" style="color: #881337; border-left: 3px solid #be123c; padding-left: 6px; margin-top: ${idx === 0 ? '0' : '6px'}; margin-bottom: 6px;">${sec.title}</h2>
          <div class="serif-body">
            ${markdownToHtml(sec.content)}
          </div>
        </div>
      `).join('')}
    </div>
    `;
  }

  return wrapCompleteHtml(`Hợp Hôn - ${male.name || 'Nam'} & ${female.name || 'Nữ'}`, contentHtml);
}

/**
 * Bọc toàn bộ trang HTML chuẩn in ấn
 */

module.exports = {
  extractDungHyKy,
  renderMarriagePillarsMiniTable,
  generateMarriageHtml
};
