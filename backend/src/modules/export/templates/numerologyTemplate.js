/**
 * numerologyTemplate.js - Tạo Bố Cục PDF Phong Thủy Số Học (Sim, Biển Số Xe, Tài Khoản Ngân Hàng)
 * Thiết kế sang trọng Hoàng Gia Á Đông
 */

const {
  renderCoverPage,
  wrapCompleteHtml,
  parseInterpretationSections,
  markdownToHtml,
  escapeHtml
} = require('./templateUtils');

function generateNumerologyHtml(record, scope = []) {
  const hasScope = scope && scope.length > 0;
  const includeCover = !hasScope || scope.includes('all') || scope.includes('cover');
  const includeOverview = !hasScope || scope.includes('all') || scope.includes('numerology_overview') || scope.includes('chart');
  const includeIching = !hasScope || scope.includes('all') || scope.includes('numerology_iching') || scope.includes('chart');
  const includeBazi = !hasScope || scope.includes('all') || scope.includes('numerology_bazi') || scope.includes('chart');

  let rawInterp = record.aiInterpretation?.content || record.analysis || record.analysisSnapshot?.aiInterpretation || '';
  if (!rawInterp && Array.isArray(record.aiInterpretation?.sections) && record.aiInterpretation.sections.length > 0) {
    rawInterp = record.aiInterpretation.sections.map(s => `### ${s.title || ''}\n\n${s.content || ''}`).join('\n\n');
  }

  const sections = parseInterpretationSections(rawInterp);
  const isAllInterpRequested = !hasScope ||
    scope.includes('all') ||
    scope.includes('interpretation') ||
    scope.includes('interp') ||
    scope.includes('all_interpretation') ||
    scope.includes('numerology_interpretation');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    return scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`numerology_${sec.id}`);
  });

  const snapshot = record.analysisSnapshot || {};
  const feixing = snapshot.feixingAnalysis || {};
  const iching = snapshot.ichingHexagrams || {};
  const bazi = snapshot.baziCompatibility;
  const typeLabels = {
    sim: 'Sim Số Điện Thoại',
    plate: 'Biển Số Xe Cơ Giới',
    bank: 'Tài Khoản Ngân Hàng'
  };
  const typeName = typeLabels[record.type] || 'Phong Thủy Số Học';

  let contentHtml = '';

  // 1. TRANG BÌA HOÀNG GIA
  if (includeCover) {
    contentHtml += renderCoverPage({
      system: 'numerology',
      title: `HỒ SƠ ĐÁNH GIÁ ${typeName.toUpperCase()}`,
      subtitle: `${record.displayNumber || record.targetNumber} • CHU KỲ VẬN ${record.period || 9}`,
      clientName: record.ownerName || 'Gia Chủ',
      gender: record.ownerBirthInfo?.gender === 0 ? 'Nữ' : 'Nam',
      dateStr: `Vận ${record.period || 9} (Năm đánh giá: ${snapshot.calculatedAtYear || new Date().getFullYear()})`,
      lunarStr: record.ownerBirthInfo?.birthDate ? `Ngày sinh gia chủ: ${record.ownerBirthInfo.birthDate}` : '',
      extraInfo: [
        { label: 'Dãy Số Phân Tích', value: record.displayNumber || record.targetNumber },
        { label: 'Điểm Số Học Thuật', value: `${snapshot.overallScore || 0}/100 (${snapshot.levelLabel || 'Bình Hòa'})` },
        { label: 'Cân Bằng Âm Dương', value: feixing.balanceState || 'Bình Hòa' },
        { label: 'Quẻ Dịch Mai Hoa', value: iching.primaryHexagram ? `${iching.primaryHexagram.name} ➔ ${iching.transformedHexagram?.name}` : 'N/A' }
      ]
    });
  }

  // 2. KHỐI TỔNG QUAN HỌC THUẬT & CỬU TINH
  if (includeOverview) {
    const starCounts = feixing.starCounts || {};
    const pairs = feixing.pairs || [];

    contentHtml += `
    <div class="pdf-section page-break-after">
      <div class="section-header-gold">
        <h2>I. TỔNG QUAN PHONG THỦY SỐ HỌC & CỬU TINH VẬN ${record.period || 9}</h2>
        <div class="header-divider"></div>
      </div>

      <div class="grid-2-col" style="margin-top: 15px; margin-bottom: 20px;">
        <div class="card-bordered" style="text-align: center; padding: 18px;">
          <div style="font-size: 13px; color: #8c734b; text-transform: uppercase; letter-spacing: 1px;">DÃY SỐ KHẢO SÁT</div>
          <div style="font-size: 26px; font-weight: bold; color: #b8860b; margin: 8px 0; letter-spacing: 2px;">
            ${escapeHtml(record.displayNumber || record.targetNumber)}
          </div>
          <div style="font-size: 13px; color: #555;">
            Loại hình: <strong>${typeName}</strong> ${record.bankName ? `(${escapeHtml(record.bankName)})` : ''}
          </div>
        </div>

        <div class="card-bordered" style="text-align: center; padding: 18px;">
          <div style="font-size: 13px; color: #8c734b; text-transform: uppercase; letter-spacing: 1px;">ĐIỂM ĐÁNH GIÁ TỔNG HỢP</div>
          <div style="font-size: 32px; font-weight: bold; color: ${snapshot.overallScore >= 78 ? '#2e7d32' : '#c62828'}; margin: 4px 0;">
            ${snapshot.overallScore || 0}<span style="font-size: 18px; color: #777;">/100</span>
          </div>
          <div style="font-size: 14px; font-weight: bold; color: #333;">
            ${escapeHtml(snapshot.levelLabel || 'Bình Hòa')}
          </div>
        </div>
      </div>

      <table class="academic-table" style="width: 100%; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="width: 28%;">Hạng Mục Khảo Sát</th>
            <th style="width: 32%;">Kết Quả Thống Kê</th>
            <th style="width: 40%;">Ý Nghĩa Học Thuật</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Âm Dương Hòa Hợp</strong></td>
            <td>${feixing.oddCount || 0} Dương (lẻ) : ${feixing.evenCount || 0} Âm (chẵn)</td>
            <td>${escapeHtml(feixing.balanceState || 'Bình hòa')}</td>
          </tr>
          <tr>
            <td><strong>Khí Khẩu Đuôi Số</strong></td>
            <td>Đuôi số: <strong>${escapeHtml(feixing.tailDigits || '')}</strong></td>
            <td>${escapeHtml(feixing.tailEvaluation || 'Bình thường')}</td>
          </tr>
          <tr>
            <td><strong>Cửu Tinh Đương Vận</strong></td>
            <td>Sao Đương Lệnh: ${feixing.periodInfo?.rulingStar || 9} | Sao Tiến Khí: ${feixing.periodInfo?.futureStar || 1}</td>
            <td>Vận ${record.period || 9} quản trị khí trường.</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 15px;">
        <h3 style="font-size: 16px; color: #8c734b; border-bottom: 1px solid #e0d5be; padding-bottom: 6px; margin-bottom: 10px;">
          CÁC CẶP TINH TỔ ĐẶC THÙ (HÀ ĐỒ, HỢP THẬP, HUNG SÁT)
        </h3>
        ${pairs.length > 0 ? `
          <table class="academic-table" style="width: 100%;">
            <thead>
              <tr>
                <th style="width: 15%;">Cặp Số</th>
                <th style="width: 25%;">Tên Tinh Tổ</th>
                <th style="width: 18%;">Định Cát/Hung</th>
                <th style="width: 42%;">Ý Nghĩa Phân Tích</th>
              </tr>
            </thead>
            <tbody>
              ${pairs.map(p => `
                <tr>
                  <td style="font-weight: bold; text-align: center; color: #b8860b;">${escapeHtml(p.pair)}</td>
                  <td><strong>${escapeHtml(p.name)}</strong></td>
                  <td style="color: ${p.auspicious.includes('Cát') ? '#2e7d32' : (p.auspicious.includes('Hung') ? '#c62828' : '#555')}; font-weight: bold;">
                    ${escapeHtml(p.auspicious)}
                  </td>
                  <td style="font-size: 13px;">${escapeHtml(p.description)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <p style="font-style: italic; color: #666; padding: 10px 0;">Không phát hiện cặp sao hung sát hay tinh tổ đặc thù trong dãy số này.</p>
        `}
      </div>
    </div>
    `;
  }

  // 3. KHỐI KINH DỊCH MAI HOA LẬP QUẺ
  if (includeIching && iching.primaryHexagram) {
    contentHtml += `
    <div class="pdf-section page-break-after">
      <div class="section-header-gold">
        <h2>II. KINH DỊCH MAI HOA DỊCH SỐ LẬP QUẺ</h2>
        <div class="header-divider"></div>
      </div>

      <div class="grid-2-col" style="margin-top: 15px; margin-bottom: 20px;">
        <div class="card-bordered" style="padding: 16px;">
          <div style="font-size: 12px; color: #8c734b; text-transform: uppercase;">QUẺ CHỦ (CHÍNH QUÁI)</div>
          <div style="font-size: 20px; font-weight: bold; color: #b8860b; margin: 6px 0;">
            Quẻ ${iching.primaryHexagram.id}: ${escapeHtml(iching.primaryHexagram.name)}
          </div>
          <div style="font-size: 13px; color: #444; margin-bottom: 8px;">
            Cung: <strong>${escapeHtml(iching.primaryHexagram.palace)}</strong> • Ngũ Hành: <strong>${escapeHtml(iching.primaryHexagram.element)}</strong> • Cát hung: <strong>${escapeHtml(iching.primaryHexagram.auspicious)}</strong>
          </div>
          <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0;">
            ${escapeHtml(iching.primaryHexagram.description)}
          </p>
        </div>

        <div class="card-bordered" style="padding: 16px;">
          <div style="font-size: 12px; color: #8c734b; text-transform: uppercase;">QUẺ BIẾN (BIẾN QUÁI) • HÀO ${iching.movingLine} ĐỘNG</div>
          <div style="font-size: 20px; font-weight: bold; color: #2e7d32; margin: 6px 0;">
            Quẻ ${iching.transformedHexagram?.id}: ${escapeHtml(iching.transformedHexagram?.name || '')}
          </div>
          <div style="font-size: 13px; color: #444; margin-bottom: 8px;">
            Cung: <strong>${escapeHtml(iching.transformedHexagram?.palace || '')}</strong> • Ngũ Hành: <strong>${escapeHtml(iching.transformedHexagram?.element || '')}</strong> • Cát hung: <strong>${escapeHtml(iching.transformedHexagram?.auspicious || '')}</strong>
          </div>
          <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0;">
            ${escapeHtml(iching.transformedHexagram?.description || '')}
          </p>
        </div>
      </div>
    </div>
    `;
  }

  // 4. KHỐI BÁT TỰ MỆNH CHỦ (Nếu xem chế độ Bát tự)
  if (includeBazi && bazi) {
    contentHtml += `
    <div class="pdf-section page-break-after">
      <div class="section-header-gold">
        <h2>III. BÁT TỰ MỆNH CHỦ & ĐỘ TƯƠNG HỢP</h2>
        <div class="header-divider"></div>
      </div>

      <table class="academic-table" style="width: 100%; margin-top: 15px; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="width: 30%;">Thông Số Mệnh Lý</th>
            <th style="width: 35%;">Giá Trị Gia Chủ</th>
            <th style="width: 35%;">Đối Ứng Phong Thủy Số</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Nhật Chủ (Day Master)</strong></td>
            <td><strong>${escapeHtml(bazi.dayMasterStem)} ${escapeHtml(bazi.dayMasterElement)}</strong> (${escapeHtml(bazi.strength || 'Bình hòa')})</td>
            <td>Căn bản năng lượng của gia chủ</td>
          </tr>
          <tr>
            <td><strong>Ngũ Hành Vượng Nhất</strong></td>
            <td><strong>${escapeHtml(bazi.strongestElement || 'N/A')}</strong></td>
            <td>Tránh bồi thêm năng lượng quá vượng</td>
          </tr>
          <tr>
            <td><strong>Dụng Thần & Hỷ Thần</strong></td>
            <td>Dụng Thần: <strong>${escapeHtml(bazi.primaryDungThan)}</strong> • Hỷ: <strong>${escapeHtml(bazi.hyThan)}</strong></td>
            <td>Cần dãy số có ngũ hành sinh trợ</td>
          </tr>
          <tr>
            <td><strong>Cung Phi Mệnh Quái</strong></td>
            <td>Cung <strong>${escapeHtml(bazi.cungPhi)}</strong> (${escapeHtml(bazi.menhTrachGroup)})</td>
            <td>Ngũ hành mệnh quái: <strong>${escapeHtml(bazi.menhQuaiNguHanh || 'Thổ')}</strong></td>
          </tr>
          <tr>
            <td><strong>Độ Tương Hợp Dãy Số</strong></td>
            <td colspan="2" style="font-weight: bold; color: #2e7d32;">
              ${bazi.compatibilityScore}/100 ➔ ${escapeHtml(bazi.matchEvaluation || '')}
            </td>
          </tr>
          ${bazi.suitableFor ? `
          <tr>
            <td><strong>Thích Hợp Cho Đối Tượng</strong></td>
            <td colspan="2" style="font-size: 13px; color: #2e7d32;">
              ${escapeHtml(bazi.suitableFor)}
            </td>
          </tr>
          ` : ''}
          ${bazi.unsuitableFor ? `
          <tr>
            <td><strong>Cảnh Báo Không Thích Hợp</strong></td>
            <td colspan="2" style="font-size: 13px; color: #c62828;">
              ${escapeHtml(bazi.unsuitableFor)}
            </td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
    `;
  }

  // 5. LUẬN GIẢI CHUYÊN SÂU AI (NẾU CÓ)
  if (filteredSections.length > 0) {
    contentHtml += `
    <div class="pdf-section">
      <div class="section-header-gold">
        <h2>IV. BẢN LUẬN GIẢI HỌC THUẬT CHUYÊN SÂU</h2>
        <div class="header-divider"></div>
      </div>
      <div class="interpretation-body" style="margin-top: 15px;">
        ${filteredSections.map(sec => `
          <div class="interpretation-chapter" style="margin-bottom: 25px;">
            <h3 style="font-size: 16px; color: #8c734b; border-bottom: 1px solid #e0d5be; padding-bottom: 5px; margin-bottom: 10px;">
              ${escapeHtml(sec.title)}
            </h3>
            <div style="font-size: 13.5px; line-height: 1.6; color: #222;">
              ${markdownToHtml(sec.content)}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    `;
  }

  return wrapCompleteHtml(contentHtml, {
    title: `Bản Đánh Giá Phong Thủy Số - ${record.displayNumber || record.targetNumber}`,
    system: 'numerology'
  });
}

module.exports = {
  generateNumerologyHtml
};
