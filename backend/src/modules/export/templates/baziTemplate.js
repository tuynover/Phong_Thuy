/**
 * baziTemplate.js - Tạo Bố Cục PDF Bát Tự Tứ Trụ
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
  abbreviateThapThan,
  getTruongSinh,
  formatMenhQuai,
  REMEDY_DATA,
  getRemedy,
  classifyShenSha,
  isCatThan
} = require('./templateUtils');

function generateBaziHtml(record, scope = []) {
  const baziData = record.baziData || record.analysisSnapshot || record.result || {};
  const inputInfo = record.inputInfo || {};
  const canChi = baziData.canChi || {};
  const daYun = baziData.daYun || [];
  const wuXing = baziData.nguHanh || baziData.wuXingScores || baziData.wuXing || {};
  const rawThanDegree = baziData.analysis?.thanDegree || baziData.thanDegree || 'Cân Bằng';
  const formatThanDegree = (td) => {
    if (!td) return 'Cân Bằng';
    const s = String(td).toLowerCase();
    if (s.includes('cuc_nhuoc') || s.includes('cực nhược')) return 'Cực Nhược / Tòng Cách';
    if (s.includes('cuc_vuong') || s.includes('cực vượng')) return 'Cực Vượng / Chuyên Vượng';
    if (s.includes('tong') || s.includes('tòng')) return 'Tòng Cách';
    if (s.includes('nhuoc') || s.includes('nhược')) return 'Thân Nhược';
    if (s.includes('vuong') || s.includes('vượng')) return 'Thân Vượng';
    if (s.includes('can_bang') || s.includes('cân bằng')) return 'Cân Bằng';
    return td;
  };
  const thanDegree = formatThanDegree(rawThanDegree);

  function formatElementName(elem) {
    if (!elem || elem === 'Chưa xác định') return elem || 'Chưa xác định';
    const key = String(elem).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const map = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
    return map[key] || elem;
  }

  const rawDungThan = baziData.dungThan?.dungThan || baziData.analysis?.dungThan || baziData.dungThan || 'Chưa xác định';
  const rawHyThan = baziData.dungThan?.hyThan || baziData.analysis?.hyThan || baziData.hyThan || 'Chưa xác định';
  const rawKyThan = baziData.dungThan?.kyThan || baziData.analysis?.kyThan || baziData.kyThan || 'Chưa xác định';

  const dungThan = formatElementName(rawDungThan);
  const hyThan = formatElementName(rawHyThan);
  const kyThan = formatElementName(rawKyThan);

  const remedy = getRemedy(dungThan);

  const hasScope = scope && scope.length > 0;
  const includeChart = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('bazi_pillars');
  const includeDaYun = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('bazi_dayun');
  const includeWuXing = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('bazi_wuxing');
  const includeShenSha = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('bazi_shensha');

  let rawInterp = '';
  if (typeof record.aiInterpretation === 'string') {
    rawInterp = record.aiInterpretation;
  } else if (record.aiInterpretation?.content) {
    rawInterp = record.aiInterpretation.content;
  } else if (typeof record.analysis === 'string') {
    rawInterp = record.analysis;
  } else if (typeof record.analysisSnapshot?.aiInterpretation === 'string') {
    rawInterp = record.analysisSnapshot.aiInterpretation;
  } else if (record.analysisSnapshot?.aiInterpretation?.content) {
    rawInterp = record.analysisSnapshot.aiInterpretation.content;
  }

  const sections = parseInterpretationSections(rawInterp);
  const isAllInterpRequested = !hasScope ||
    scope.includes('all') ||
    scope.includes('interpretation') ||
    scope.includes('interp') ||
    scope.includes('intro') ||
    scope.includes('all_interpretation');

  const hasSpecificStep = scope.some(s => s.startsWith('step_') || s.startsWith('ch') || s === 'nhat_chu' || s === 'harmonizer');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    if (scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`bazi_${sec.id}`)) return true;
    if (sec.id === 'intro' && hasSpecificStep) return true;
    return false;
  });

  let contentHtml = '';

  const includeCover = scope.includes('cover') || scope.includes('all') || (!hasScope);
  if (includeCover) {
    contentHtml += renderCoverPage({
      system: 'bazi',
      title: 'BÁT TỰ TỨ TRỤ BẢN MỆNH THƯ',
      subtitle: 'Khảo Cứu Tứ Trụ, Thần Sát, Cân Bằng Ngũ Hành & Đại Vận 100 Năm',
      clientName: inputInfo.name || 'Gia Chủ',
      gender: parseInt(inputInfo.gender) === 0 ? 'Nữ Mệnh (Âm Nữ)' : 'Nam Mệnh (Dương Nam)',
      dateStr: record.solarTimeline || inputInfo.date || 'Chưa xác định',
      lunarStr: record.tietKhiTimeline ? `Tiết khí: ${record.tietKhiTimeline}` : '',
      extraInfo: [
        ...(baziData.menhQuai ? [{ label: 'Mệnh Quái', value: formatMenhQuai(baziData.menhQuai) }] : []),
        ...(dungThan && dungThan !== 'Chưa xác định' ? [{ label: 'Dụng Thần', value: dungThan, highlight: true }] : [])
      ],
      recordId: record._id || '',
      sealText: ['TỨ', 'TRỤ', 'MỆNH', 'LÝ']
    });
  }

  // 1. HEADER & META TRANG 1
  contentHtml += `
    <div class="monograph-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="monograph-badge">Hồ Sơ Mệnh Lý Cá Nhân • Tứ Trụ Tử Bình</span>
          <h1 class="monograph-title serif-title">LÁ SỐ BÁT TỰ TỨ TRỤ & VẬN TRÌNH</h1>
        </div>
        <div style="text-align: right; font-size: 7.5pt; color: #78350f; font-weight: 700;">
          MÃ SỐ: ${record._id?.slice(0, 18) || 'N/A'}<br/>
          BẢN QUYỀN HỆ THỐNG
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <span class="meta-label">Họ và tên:</span>
          <span class="meta-value">${inputInfo.name || 'Gia Chủ'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Giới tính:</span>
          <span class="meta-value">${parseInt(inputInfo.gender) === 0 ? 'Nữ Mệnh (Âm Nữ)' : 'Nam Mệnh (Dương Nam)'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Dương lịch:</span>
          <span class="meta-value">${record.solarTimeline || inputInfo.date || 'Chưa xác định'}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Tiết khí:</span>
          <span class="meta-value">${record.tietKhiTimeline || 'Chưa xác định'}</span>
        </div>
        ${baziData.taiNguyen ? `
        <div class="meta-item">
          <span class="meta-label">Thai Nguyên:</span>
          <span class="meta-value">${baziData.taiNguyen.gan} ${baziData.taiNguyen.zhi} (${baziData.taiNguyen.naYin || ''})</span>
        </div>` : ''}
        ${baziData.cungMenh ? `
        <div class="meta-item">
          <span class="meta-label">Cung Mệnh:</span>
          <span class="meta-value">${baziData.cungMenh.gan} ${baziData.cungMenh.zhi} (${baziData.cungMenh.naYin || ''})</span>
        </div>` : ''}
        ${baziData.menhQuai ? `
        <div class="meta-item">
          <span class="meta-label">Mệnh Quái:</span>
          <span class="meta-value">${formatMenhQuai(baziData.menhQuai)}</span>
        </div>` : ''}
      </div>
    </div>
  `;

  // 2. BẢNG TỨ TRỤ HỌC THUẬT (XOAY NGƯỢC: TRỤ NĂM -> NGUYỆT LỆNH -> NHẬT CHỦ -> TRỤ GIỜ)
  if (includeChart) {
    const monthZhi = canChi.month?.zhi || '';
    const pillars = [
      { name: 'TRỤ NĂM', data: canChi.year, label: 'Tổ Tiên / Căn Cơ' },
      { name: 'NGUYỆT LỆNH', data: canChi.month, label: 'Cha Mẹ / Sự Nghiệp' },
      { name: 'NHẬT CHỦ', data: canChi.day, label: 'Bản Thân / Vợ Chồng', isDayMaster: true },
      { name: 'TRỤ GIỜ', data: canChi.hour, label: 'Cung Tử Tức / Hậu Vận' }
    ];

    // Tìm số lượng Thần Sát tối đa trong 4 trụ để pad dòng bằng nhau
    const maxShenShaCount = Math.max(
      3,
      ...pillars.map(p => (p.data?.shenSha || []).length)
    );

    contentHtml += `
      <div class="no-break">
        <div class="section-title">I. Cấu Trúc Tứ Trụ Bản Mệnh (Thiên Can - Địa Chi)</div>
        <table class="bazi-pillars-table">
          <thead>
            <tr>
              ${pillars.map(p => `<th>${p.name}<div style="font-size: 6.8pt; font-weight: 600; color: #64748b; margin-top: 1px;">${p.label}</div></th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <!-- Dòng 1: Thập Thần Thiên Can -->
            <tr>
              ${pillars.map(p => {
                const tt = p.isDayMaster ? '【NHẬT NGUYÊN】' : (p.data?.thapThanGan || '-');
                return `<td><div class="thap-than-tag">${tt}</div></td>`;
              }).join('')}
            </tr>
            <!-- Dòng 2: Thiên Can & Trạng Thái Trường Sinh so với Nguyệt Chi -->
            <tr>
              ${pillars.map(p => {
                const gan = p.data?.gan || '-';
                const el = STEM_ELEMENTS[gan] || 'Thổ';
                const elColor = ELEMENT_COLORS[el]?.text || '#0f172a';
                const ts = p.data?.truongSinh || getTruongSinh(gan, monthZhi) || '-';
                return `
                  <td>
                    <div class="stem-zhi-big" style="color: ${elColor};">${gan}</div>
                    <div class="truong-sinh-tag">${ts}</div>
                  </td>
                `;
              }).join('')}
            </tr>
            <!-- Dòng 3: Địa Chi & Nạp Âm -->
            <tr>
              ${pillars.map(p => {
                const zhi = p.data?.zhi || '-';
                const el = BRANCH_ELEMENTS[zhi] || 'Thổ';
                const elColor = ELEMENT_COLORS[el]?.text || '#0f172a';
                return `
                  <td>
                    <div class="stem-zhi-big" style="color: ${elColor};">${zhi}</div>
                    <div class="nayin-badge">${p.data?.naYin || '-'}</div>
                  </td>
                `;
              }).join('')}
            </tr>
            <!-- Dòng 4: Tàng Can (Chia đều 3 dòng, không có chữ Tàng Can:, viết tắt Thập Thần) -->
            <tr>
              ${pillars.map(p => {
                const tangCan = p.data?.tangCan || [];
                const paddedTangCan = [...tangCan];
                while (paddedTangCan.length < 3) {
                  paddedTangCan.push({ gan: '', thapThan: '' });
                }
                return `
                  <td>
                    <div class="tangcan-box">
                      ${paddedTangCan.map(tc => {
                        if (!tc.gan) {
                          return `<div class="tangcan-line empty">&nbsp;</div>`;
                        }
                        const el = STEM_ELEMENTS[tc.gan] || 'Thổ';
                        const elColor = ELEMENT_COLORS[el]?.text || '#0f172a';
                        return `
                          <div class="tangcan-line">
                            <span class="tangcan-line-stem" style="color: ${elColor};">${tc.gan}</span>
                            <span class="tangcan-line-tt">${abbreviateThapThan(tc.thapThan)}</span>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </td>
                `;
              }).join('')}
            </tr>
            <!-- Dòng 5: Thần Sát Bát Tự (Mỗi thần sát 1 dòng, màu cát/hung/lưỡng tính phân biệt, chỉ chữ không nền) -->
            ${includeShenSha ? `
            <tr>
              ${pillars.map(p => {
                const ssList = p.data?.shenSha || [];
                const paddedSs = [...ssList];
                while (paddedSs.length < maxShenShaCount) {
                  paddedSs.push('');
                }
                return `
                  <td>
                    <div class="shensha-box">
                      ${paddedSs.map(ss => {
                        if (!ss) {
                          return `<div class="shensha-line empty">&nbsp;</div>`;
                        }
                        const ssType = classifyShenSha(ss);
                        const cleanName = ss.replace(/ Quý Nhân/g, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
                        return `
                          <div class="shensha-line ${ssType}" title="${ss}">
                            ${cleanName}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </td>
                `;
              }).join('')}
            </tr>` : ''}
          </tbody>
        </table>
      </div>
    `;
  }

  // 3. BẢNG CÂN BẰNG NGŨ HÀNH & TRẠNG THÁI THÂN (HIỂN THỊ CHUẨN XÁC % VÀ DỤNG/HỶ/KỴ THẦN)
  if (includeWuXing) {
    const getElemScore = (elemName) => {
      const keys = {
        'Kim': ['Kim', 'kim'],
        'Mộc': ['Moc', 'moc', 'Mộc', 'mộc'],
        'Thủy': ['Thuy', 'thuy', 'Thủy', 'thủy', 'Thuỷ', 'thuỷ'],
        'Hỏa': ['Hoa', 'hoa', 'Hỏa', 'hỏa', 'Hoả', 'hoả'],
        'Thổ': ['Tho', 'tho', 'Thổ', 'thổ', 'Thô', 'thô']
      }[elemName] || [elemName];

      for (const k of keys) {
        if (wuXing[k] !== undefined) return Number(wuXing[k]);
      }
      return 0;
    };

    contentHtml += `
      <div class="no-break wuxing-summary-card">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">
          <strong style="font-size: 8.5pt; text-transform: uppercase; color: #1e293b;">Phân Bổ Khí Lực Ngũ Hành & Trạng Thái Thân</strong>
          <span style="font-size: 8pt; font-weight: 700; color: #b45309;">Trạng thái: ${thanDegree}</span>
        </div>
        <div class="wuxing-grid">
          ${Object.keys(ELEMENT_COLORS).map(elem => {
            const score = getElemScore(elem);
            const style = ELEMENT_COLORS[elem];
            return `
              <div class="wuxing-item" style="background: ${style.bg}; color: ${style.text}; border: 1px solid ${style.border};">
                <div>${elem}</div>
                <div style="font-size: 10pt; font-weight: 900;">${Math.round(score)}%</div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 8pt; margin-top: 4px; padding-top: 3px; border-top: 1px dashed #e2e8f0;">
          <div><strong>Dụng Thần:</strong> ${renderElementText(dungThan)}</div>
          <div><strong>Hỷ Thần:</strong> ${renderElementText(hyThan)}</div>
          <div><strong>Kỵ Thần:</strong> ${renderElementText(kyThan)}</div>
        </div>
      </div>
    `;

    // 3.1 KHỐI DỤNG THẦN & NGÀNH NGHỀ BỔ MỆNH (THỰC CHIẾN)
    if (remedy) {
      const hyFormatted = formatElementName(hyThan);
      const hyStyle = ELEMENT_COLORS[hyFormatted] || { text: getElemTextColor(hyThan), bg: '#eff6ff', border: '#bfdbfe' };
      contentHtml += `
        <div class="no-break remedy-card">
          <div class="remedy-title">
            <span>Dụng Thần & Phương Án Bổ Mệnh Khuyên Dùng (${renderElementText(dungThan)})</span>
            <span style="font-size: 7.5pt; font-weight: 700; color: ${hyStyle.text}; background: ${hyStyle.bg}; padding: 1px 6px; border-radius: 4px; border: 1px solid ${hyStyle.border};">Hỷ Thần Trợ Lực: ${hyThan}</span>
          </div>
          <div class="remedy-grid">
            <div class="remedy-item">
              <div class="remedy-item-label">Công việc / Ngành nghề bổ trợ</div>
              <div class="remedy-item-value">${remedy.careers}</div>
            </div>
            <div class="remedy-item">
              <div class="remedy-item-label">Màu sắc cát tường bổ mệnh</div>
              <div class="remedy-item-value">${remedy.colors}</div>
            </div>
            <div class="remedy-item">
              <div class="remedy-item-label">Phương vị cát lợi tương hỗ</div>
              <div class="remedy-item-value">${remedy.directions}</div>
            </div>
            <div class="remedy-item">
              <div class="remedy-item-label">Vật phẩm trợ mệnh phong thủy</div>
              <div class="remedy-item-value">${remedy.items}</div>
            </div>
          </div>
        </div>
      `;
    }
  }

  // 4. HÀNH TRÌNH ĐẠI VẬN 100 NĂM & NIÊN BIỂU LƯU NIÊN
  if (includeDaYun && daYun.length > 0) {
    const row1 = daYun.slice(0, 5);
    const row2 = daYun.slice(5, 10);

    const renderCard = (yun) => {
      const gan = yun.gan || '-';
      const zhi = yun.zhi || '-';
      const ganEl = STEM_ELEMENTS[gan] || 'Thổ';
      const color = ELEMENT_COLORS[ganEl]?.text || '#0f172a';

      let badgeClass = 'amber';
      let badgeText = 'Bình Hòa';
      if (dungThan.includes(ganEl) || hyThan.includes(ganEl)) {
        badgeClass = 'green';
        badgeText = 'Cát Vận';
      } else if (kyThan.includes(ganEl)) {
        badgeClass = 'red';
        badgeText = 'Thận Trọng';
      }

      const liuNianPreview = (yun.liuNian || []).slice(0, 5).map(ln => ln.year).join(', ');

      return `
        <div class="da-yun-card ${badgeClass === 'green' ? 'cat-van' : (badgeClass === 'red' ? 'than-trong' : 'binh-hoa')}">
          <div class="da-yun-age">${yun.startAge} - ${yun.startAge + 9}t</div>
          <div class="da-yun-year">${yun.startYear || ''}</div>
          <div class="da-yun-ganzhi" style="color: ${color};">${gan} ${zhi}</div>
          <div style="font-size: 6.5pt; color: #475569; font-weight: 700;">${yun.thapThanGan || '-'}</div>
          <div style="font-size: 6pt; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${yun.naYin || ''}</div>
          <span class="da-yun-badge ${badgeClass}">${badgeText}</span>
          ${liuNianPreview ? `<div style="font-size: 5.5pt; color: #94a3b8; margin-top: 2px;">${liuNianPreview}...</div>` : ''}
        </div>
      `;
    };

    contentHtml += `
      <div class="no-break" style="margin-top: 8px;">
        <div class="section-title">II. Hành Trình Đại Vận 100 Năm & Vận Trình Lưu Niên</div>
        <div style="font-size: 7pt; color: #64748b; margin-bottom: 4px; font-style: italic;">
          * Bố cục 2 Hàng x 5 Cột: Hàng trên 50 năm tiền vận (0-50t), hàng dưới 50 năm hậu vận (51-100t).
        </div>
        <div class="da-yun-matrix">
          ${row1.map(renderCard).join('')}
        </div>
        ${row2.length > 0 ? `
        <div class="da-yun-matrix">
          ${row2.map(renderCard).join('')}
        </div>` : ''}

        <!-- BẢNG TRA CỨU CHI TIẾT 10 ĐẠI VẬN KÈM 100 NĂM LƯU NIÊN -->
        <div style="margin-top: 6px;">
          <div style="font-size: 7.5pt; font-weight: 800; color: #334155; text-transform: uppercase; margin-bottom: 3px;">Bảng Tra Cứu Chi Tiết Lưu Niên Theo Từng Đại Vận:</div>
          <table class="da-yun-liunian-table">
            <thead>
              <tr>
                <th style="width: 22%;">Đại Vận (Can Chi & Độ Tuổi)</th>
                <th style="width: 18%;">Đặc Tính Mệnh Lý</th>
                <th style="width: 60%;">10 Năm Lưu Niên Thuộc Đại Vận</th>
              </tr>
            </thead>
            <tbody>
              ${daYun.slice(0, 10).map(yun => {
                const gan = yun.gan || '-';
                const zhi = yun.zhi || '-';
                const ganEl = STEM_ELEMENTS[gan] || 'Thổ';
                const color = ELEMENT_COLORS[ganEl]?.text || '#0f172a';

                let badgeColor = '#b45309';
                let badgeLabel = 'Bình Hòa';
                if (dungThan.includes(ganEl) || hyThan.includes(ganEl)) {
                  badgeColor = '#047857';
                  badgeLabel = 'Cát Vận';
                } else if (kyThan.includes(ganEl)) {
                  badgeColor = '#b91c1c';
                  badgeLabel = 'Thận Trọng';
                }

                const lnList = yun.liuNian && yun.liuNian.length > 0 
                  ? yun.liuNian 
                  : Array.from({ length: 10 }, (_, i) => ({ year: yun.startYear + i, canChi: '' }));

                return `
                  <tr>
                    <td>
                      <strong style="color: ${color}; font-size: 8pt;">${gan} ${zhi}</strong>
                      <span style="color: #475569; font-weight: 600;">(${yun.startAge} - ${yun.startAge + 9}t)</span>
                    </td>
                    <td>
                      <div>${yun.thapThanGan || '-'} • ${yun.naYin || ''}</div>
                      <span style="font-size: 6pt; font-weight: 800; color: ${badgeColor}; text-transform: uppercase;">[${badgeLabel}]</span>
                    </td>
                    <td>
                      <div class="liunian-pills-wrap">
                        ${lnList.map(ln => `
                          <span class="liunian-mini-pill">
                            <span class="ln-yr">${ln.year}</span>
                            <span class="ln-gc">${ln.canChi || ''}</span>
                          </span>
                        `).join('')}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // 5. CÁC PHẦN LUẬN GIẢI AI (TIÊU CHUẨN HOẶC CHUYÊN SÂU)
  if (filteredSections.length > 0) {
    const isVipRecord = record.interpretationMode === 'vip' || record.packageType === 'deep' || record.packageType === 'vip' || /(?:CHƯƠNG|Chương)\s*1/i.test(rawInterp);
    const interpHeader = isVipRecord ? 'Hồ Sơ Luận Giải Mệnh Lý Bát Tự (Chuyên Sâu)' : 'Hồ Sơ Luận Giải Mệnh Lý Bát Tự (Tiêu Chuẩn)';
    const interpTitle = isVipRecord ? 'TOÀN VĂN LUẬN GIẢI CHUYÊN SÂU' : 'BẢN LUẬN GIẢI BÁT TỰ TIÊU CHUẨN';

    contentHtml += `
      <div class="page-break">
        <div class="doc-page-header">
          <span>${interpHeader}</span>
          <span>Đương Số: ${inputInfo.name || 'Gia Chủ'}</span>
        </div>
        <div style="text-align: center; margin: 16px 0 20px 0;">
          <h2 class="serif-title" style="font-size: 15pt; color: #78350f; margin-bottom: 4px;">${interpTitle}</h2>
          <div style="font-size: 8pt; color: #64748b;">Biên soạn bởi Hệ Thống Trí Tuệ Nhân Tạo & Rule Engine Cổ Học Phương Đông</div>
        </div>
    `;

    filteredSections.forEach((sec, idx) => {
      // Chương 1 không có border-top, từ chương 2 trở đi dùng .chapter-block (khoảng cách vừa đủ, border-top nhẹ, KHÔNG page-break)
      contentHtml += `
        <div class="${idx > 0 ? 'chapter-block' : ''}">
          <h2 class="doc-h1 serif-title" style="margin-top: ${idx === 0 ? '0' : '2px'}; margin-bottom: 6px;">${sec.title}</h2>
          <div class="serif-body">
            ${markdownToHtml(sec.content)}
          </div>
        </div>
      `;
    });

    contentHtml += `</div>`;
  }

  return wrapCompleteHtml(`Lá Số Bát Tự - ${inputInfo.name || 'Gia Chủ'}`, contentHtml);
}

/**
 * Tạo HTML cho Tử Vi (Ziwei)
 */

module.exports = {
  generateBaziHtml
};
