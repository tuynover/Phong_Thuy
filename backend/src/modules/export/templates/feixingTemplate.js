/**
 * feixingTemplate.js - Tạo Bố Cục PDF Phong Thủy Huyền Không Phi Tinh & Bát Trạch
 * Phiên bản Hoàng Gia: Đồ Hình Tinh Bàn Phóng Đại Tối Đa Trang Giấy A4 (Edge-to-Edge Vector)
 */

const {
  renderCoverPage,
  wrapCompleteHtml,
  parseInterpretationSections,
  markdownToHtml,
  escapeHtml
} = require('./templateUtils');
const { renderFeiXingDialSvg } = require('./feixingDialSvg');

function generateFeiXingHtml(record, scope = []) {
  const hasScope = scope && scope.length > 0;
  const includeCover = !hasScope || scope.includes('all') || scope.includes('cover');
  const includeOverview = !hasScope || scope.includes('all') || scope.includes('feixing_overview') || scope.includes('chart');
  const includeGrid = !hasScope || scope.includes('all') || scope.includes('feixing_grid') || scope.includes('chart');
  const includeMenhTrach = !hasScope || scope.includes('all') || scope.includes('feixing_menhtrach') || scope.includes('chart');

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
    scope.includes('feixing_interpretation');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    return scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`feixing_${sec.id}`);
  });

  const gridData = (Array.isArray(record.grid) && record.grid.length > 0)
    ? record.grid
    : (Array.isArray(record.analysisSnapshot?.grid) ? record.analysisSnapshot.grid : []);

  let contentHtml = '';

  // 1. TRANG BÌA HOÀNG GIA (Imperial Title Page)
  if (includeCover) {
    const ownerProfile = record.analysisSnapshot?.ownerProfile || record.ownerBirthInfo || {};
    contentHtml += renderCoverPage({
      system: 'feixing',
      title: record.title || 'HỒ SƠ THẨM ĐỊNH HUYỀN KHÔNG PHI TINH',
      subtitle: `TỌA SƠN ${record.sittingMountain || '-'} (${record.sittingPalace || '-'}) • HƯỚNG SƠN ${record.facingMountain || '-'} (${record.facingPalace || '-'}) • VẬN ${record.period || '9'}`,
      clientName: record.ownerName || 'Gia Chủ',
      gender: ownerProfile.genderLabel || (ownerProfile.gender === 1 ? 'Nam' : 'Nữ'),
      dateStr: `Vận ${record.period || 9} (Năm khởi tạo: ${record.buildingYear || '2024'})`,
      lunarStr: ownerProfile.birthDate ? `Ngày sinh: ${ownerProfile.birthDate}` : '',
      extraInfo: [
        { label: 'Tứ Đại Cách Cục', value: record.analysisSnapshot?.majorPatternName || 'Chính Quái Bàn' },
        { label: 'Tọa Độ Thực Tế', value: `Hướng ${record.facingDegree?.toFixed(1) || 0}° • Tọa ${record.sittingDegree?.toFixed(1) || 0}°` },
        { label: 'Phân Loại Khí Trường', value: record.isSubstitution ? 'Kiêm Hướng (Thế Quái Bàn)' : 'Thuần Khí (Chính Hướng Bàn)' }
      ],
      recordId: String(record._id || record.id || '')
    });
  }

  const hasAnalysisContent = includeOverview || includeMenhTrach;
  const hasInterpPages = filteredSections.length > 0;

  // 2. TRANG 2: ĐỒ HÌNH TINH BÀN HUYỀN KHÔNG & LA KINH 24 SƠN (Tối Đa Trang Giấy A4)
  if (includeGrid && gridData.length > 0) {
    const hasNextAfterDial = hasAnalysisContent || hasInterpPages;
    contentHtml += `
      <div class="page-container page-layout-standard" style="${hasNextAfterDial ? 'page-break-after: always;' : ''} padding: 10px 14px; min-height: 1000px; display: flex; flex-direction: column; justify-content: space-between;">
        <!-- Header Banner Đồ Hình -->
        <div style="border-bottom: 2px solid #b45309; padding-bottom: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 7.5pt; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px;">
              ĐỒ HÌNH TINH BÀN HUYỀN KHÔNG & LA KINH 24 SƠN HƯỚNG (NAM TRÊN - BẮC DƯỚI)
            </div>
            <div style="font-size: 13.5pt; font-weight: 900; color: #0f172a; margin-top: 1px; font-family: 'Playfair Display', serif;">
              ${escapeHtml(record.title || 'Lá Số Phong Thủy Nhà Ở')}
            </div>
            <div style="font-size: 8pt; color: #475569; margin-top: 1px;">
              Gia Chủ: <b>${escapeHtml(record.ownerName || 'Gia Chủ')}</b> • Vận <b>${escapeHtml(String(record.period || '9'))}</b> • Tọa <b>${escapeHtml(record.sittingMountain || '-')} (${escapeHtml(record.sittingPalace || '-')})</b> • Hướng <b>${escapeHtml(record.facingMountain || '-')} (${escapeHtml(record.facingPalace || '-')})</b>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; background: #fffbeb; border: 1px solid #fde68a; font-size: 7.5pt; font-weight: 800; color: #b45309;">
              ${escapeHtml(record.analysisSnapshot?.majorPatternName || 'Chính Quái Bàn')}
            </span>
          </div>
        </div>

        <!-- Đồ Hình Tinh Bàn Phóng Đại Tối Đa Trang Giấy (680px Edge-to-Edge) -->
        <div style="flex: 1; display: flex; align-items: center; justify-content: center; margin: 4px 0;">
          ${renderFeiXingDialSvg(record, gridData)}
        </div>

        <!-- Thanh Chú Giải Quy Ước Màu Sắc & Chiều Phi Tinh Chuẩn Web -->
        <div style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; border: 1.5px solid #fde68a; border-radius: 7px; padding: 5px 16px; font-size: 7.5pt; color: #334155; width: 100%; max-width: 680px; margin: 0 auto;">
          <div style="display: flex; gap: 10px; align-items: center;">
            <b>Quy ước Cát Hung:</b>
            <span style="color: #059669; font-weight: bold;">● Tối Cát / Vượng</span>
            <span style="color: #2563eb; font-weight: bold;">● Tiến Khí / Cát</span>
            <span style="color: #475569; font-weight: bold;">● Bình Hòa</span>
            <span style="color: #dc2626; font-weight: bold;">● Hung / Đại Hung</span>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="color: #16a34a; font-weight: 800;">↗ Thuận Phi (+)</span>
            <span style="color: #94a3b8;">|</span>
            <span style="color: #dc2626; font-weight: 800;">↘ Nghịch Phi (-)</span>
          </div>
        </div>
      </div>
    `;
  }

  // 3. TRANG 3: HỒ SƠ KHẢO LUẬN KHÍ TRƯỜNG & CHI TIẾT CÁCH CỤC
  if (hasAnalysisContent) {
    const snap = record.analysisSnapshot || {};
    const cg = snap.castleGate || {};
    const profile = snap.ownerProfile || record.ownerBirthInfo || {};
    const hasCungPhi = Boolean(profile.cungPhi);
    const isDongTu = ['Khảm', 'Ly', 'Chấn', 'Tốn'].includes(record.sittingPalace);
    const defaultTrachGroup = isDongTu ? 'Đông tứ trạch' : 'Tây tứ trạch';
    const hasCg = cg.left?.usable || cg.right?.usable || cg.left?.description || cg.right?.description;

    contentHtml += `
      <div class="page-container page-layout-standard" style="${hasInterpPages ? 'page-break-after: always;' : ''} padding: 16px 20px;">
        <div style="border-bottom: 2px solid #b45309; padding-bottom: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 7.5pt; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1.5px;">
              HỒ SƠ KHẢO LUẬN KHÍ TRƯỜNG & ĐẶC TÍNH CÁCH CỤC
            </div>
            <div style="font-size: 13.5pt; font-weight: 900; color: #0f172a; margin-top: 1px; font-family: 'Playfair Display', serif;">
              Định Lượng Khí Trường Bát Trạch & Huyền Không
            </div>
            <div style="font-size: 8pt; color: #475569; margin-top: 1px;">
              Gia Chủ: <b>${escapeHtml(record.ownerName || 'Gia Chủ')}</b> • Vận <b>${escapeHtml(String(record.period || '9'))}</b> • Nhập Trạch: <b>${escapeHtml(String(record.buildingYear || 'Vận 9'))}</b>
            </div>
          </div>
          <div style="text-align: right;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 6px; background: #fffbeb; border: 1px solid #fde68a; font-size: 7.5pt; font-weight: 800; color: #b45309;">
              ${escapeHtml(snap.majorPatternName || 'Chính Quái Bàn')}
            </span>
          </div>
        </div>
    `;

    // Khối 1: 4 Parameter Cards
    if (includeOverview) {
      contentHtml += `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 7pt; font-weight: 800; color: #64748b; text-transform: uppercase;">TỌA NHÀ (HẬU TRẠCH)</div>
            <div style="font-size: 11pt; font-weight: 900; color: #1e293b; margin-top: 2px;">
              Sơn ${escapeHtml(record.sittingMountain || '-')} (${escapeHtml(record.sittingPalace || '-')})
            </div>
            <div style="font-size: 7.5pt; color: #64748b;">${record.sittingDegree?.toFixed(1) || 0}°</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 7pt; font-weight: 800; color: #64748b; text-transform: uppercase;">HƯỚNG NHÀ (MINH ĐƯỜNG)</div>
            <div style="font-size: 11pt; font-weight: 900; color: #1e293b; margin-top: 2px;">
              Sơn ${escapeHtml(record.facingMountain || '-')} (${escapeHtml(record.facingPalace || '-')})
            </div>
            <div style="font-size: 7.5pt; color: #64748b;">${record.facingDegree?.toFixed(1) || 0}°</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 7pt; font-weight: 800; color: #64748b; text-transform: uppercase;">PHÂN LOẠI TINH BÀN</div>
            <div style="font-size: 10pt; font-weight: 900; color: #1e293b; margin-top: 2px;">
              ${record.chartType === 'CHINH_HUONG' ? 'Chính Quái Bàn' : record.chartType === 'KIEM_HUONG' ? 'Thế Quái Bàn' : 'Không Vong'}
            </div>
            <div style="font-size: 7.5pt; color: #64748b;">Độ lệch: ${record.deviationDegree || 0}°</div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
            <div style="font-size: 7pt; font-weight: 800; color: #64748b; text-transform: uppercase;">ĐẶC TÍNH KHÍ TRƯỜNG</div>
            <div style="font-size: 10pt; font-weight: 900; color: #1e293b; margin-top: 2px;">
              ${record.isSubstitution ? 'Kiêm Hướng' : 'Thuần Khí'}
            </div>
            <div style="font-size: 7.5pt; color: #64748b;">${record.isSubstitution ? 'Thế quái ca quyết' : 'Đắc nguyên thần'}</div>
          </div>
        </div>
      `;
    }

    // Khối 2: Sơ Đồ Mệnh Trạch Tương Phối
    if (includeMenhTrach) {
      contentHtml += `
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px;">
          <div style="font-size: 8pt; font-weight: 900; color: #b45309; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">
            SƠ ĐỒ MỆNH TRẠCH TƯƠNG PHỐI (BÁT TRẠCH MINH KÍNH & BÁT TỰ DỤNG THẦN)
          </div>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 8pt; color: #334155;">
            <div>
              <div>Cung Phi Mệnh Chủ: <b>${escapeHtml(hasCungPhi ? `${profile.cungPhi} (${profile.menhNguHanh || '-'})` : 'Chưa nhập năm sinh')}</b></div>
              <div>Nhóm Mệnh: <b>${escapeHtml(hasCungPhi ? (profile.menhTrachGroup || '-') : 'Chưa xác định')}</b></div>
            </div>
            <div>
              <div>Cung Tọa Trạch Đất: <b>${escapeHtml(record.sittingPalace || '-')}</b> (${escapeHtml(record.sittingMountain || '-')})</div>
              <div>Nhóm Trạch Đất: <b>${escapeHtml(profile.houseTrachGroup || defaultTrachGroup)}</b></div>
            </div>
            <div>
              <div>Mức Độ Hợp Trạch: <b style="color: ${hasCungPhi ? (profile.isMenhTrachMatch ? '#059669' : '#dc2626') : '#64748b'};">${hasCungPhi ? (profile.isMenhTrachMatch ? 'Thuận Hợp (Đắc Khí)' : 'Nghịch Trạch (Cần Hóa Giải)') : 'Cần năm sinh gia chủ'}</b></div>
              <div>Dụng Thần Bát Tự: <b>${escapeHtml(profile.dungThan || (hasCungPhi ? 'Theo Tứ Trụ' : 'Chưa thẩm định'))}</b></div>
            </div>
          </div>
          <div style="font-size: 7.5pt; color: #64748b; margin-top: 6px; font-style: italic;">
            * ${escapeHtml(profile.menhTrachSummary || (hasCungPhi ? 'Đã thẩm định tương quan Mệnh - Trạch theo Cổ pháp Bát Trạch Minh Kính.' : 'Nhập năm sinh gia chủ khi lập tinh bàn để kích hoạt tra cứu Bát Trạch Minh Kính chi tiết.'))}
          </div>
        </div>
      `;
    }

    // Khối 3: Đặc Tính Cách Cục & Quyết Pháp Thành Môn
    if (includeOverview && record.analysisSnapshot) {
      contentHtml += `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px;">
          <div style="font-size: 8pt; font-weight: 900; color: #1e293b; text-transform: uppercase; margin-bottom: 5px; letter-spacing: 0.5px;">
            ĐẶC TÍNH CÁCH CỤC & BÍ PHÁP THÀNH MÔN QUYẾT
          </div>
          <div style="font-size: 8pt; line-height: 1.5; color: #334155; margin-bottom: ${hasCg ? '6px' : '0'};">
            <b>${escapeHtml(snap.majorPatternName || 'Cách Cục')}:</b> ${escapeHtml(snap.majorPatternDescription || snap.summaryAdvice || 'Trạch vận vượng suy theo Cửu tinh')}
          </div>
          ${hasCg ? `
            <div style="display: flex; gap: 16px; font-size: 7.5pt; color: #475569; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
              ${cg.left ? `<div><b>Thành Môn Trái:</b> ${escapeHtml(cg.left.description || `Cung ${cg.left.palace}`)} ${cg.left.usable ? '<span style="color: #059669; font-weight: 800;">(Khí nạp tài vượng)</span>' : ''}</div>` : ''}
              ${cg.right ? `<div><b>Thành Môn Phải:</b> ${escapeHtml(cg.right.description || `Cung ${cg.right.palace}`)} ${cg.right.usable ? '<span style="color: #059669; font-weight: 800;">(Khí nạp tài vượng)</span>' : ''}</div>` : ''}
            </div>
          ` : ''}
        </div>
      `;
    }

    // Khối 4: Bảng Ma Trận Tổng Hợp Năng Lượng Cửu Cung Tinh Bàn
    if (includeOverview && gridData.length > 0) {
      contentHtml += `
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
          <div style="background: #1e293b; color: #ffffff; padding: 6px 12px; font-size: 8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
            BẢNG TỔNG HỢP NĂNG LƯỢNG CỬU CUNG TINH BÀN
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: center;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155; font-weight: 800; border-bottom: 1px solid #cbd5e1;">
                <th style="padding: 5px 6px; border-right: 1px solid #e2e8f0;">Cung Vị</th>
                <th style="padding: 5px 6px; border-right: 1px solid #e2e8f0;">Phương Hướng</th>
                <th style="padding: 5px 6px; border-right: 1px solid #e2e8f0;">Vận Tinh</th>
                <th style="padding: 5px 6px; border-right: 1px solid #e2e8f0;">Sơn Tinh</th>
                <th style="padding: 5px 6px; border-right: 1px solid #e2e8f0;">Hướng Tinh</th>
                <th style="padding: 5px 6px; border-right: 1px solid #e2e8f0;">Cặp Tinh</th>
                <th style="padding: 5px 6px;">Đánh Giá Khí Trường</th>
              </tr>
            </thead>
            <tbody>
              ${gridData.map(c => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 5px 6px; font-weight: 800; border-right: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(c.palaceName || '-')}</td>
                  <td style="padding: 5px 6px; border-right: 1px solid #e2e8f0; color: #475569;">${escapeHtml(c.directionName || 'Trung Tâm')}</td>
                  <td style="padding: 5px 6px; font-weight: 800; border-right: 1px solid #e2e8f0; color: #b45309;">${escapeHtml(String(c.periodStar ?? '-'))}</td>
                  <td style="padding: 5px 6px; font-weight: 800; border-right: 1px solid #e2e8f0; color: #1e1b4b;">${escapeHtml(String(c.mountainStar ?? '-'))} (${c.mountainFlight === 'FORWARD' ? '↗' : '↘'})</td>
                  <td style="padding: 5px 6px; font-weight: 800; border-right: 1px solid #e2e8f0; color: #881337;">${escapeHtml(String(c.waterStar ?? '-'))} (${c.waterFlight === 'FORWARD' ? '↗' : '↘'})</td>
                  <td style="padding: 5px 6px; font-weight: 800; border-right: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(String(c.mountainStar ?? '-'))}-${escapeHtml(String(c.waterStar ?? '-'))}</td>
                  <td style="padding: 5px 6px; font-weight: 700; color: ${c.auspiciousLevel === 'DAI_CAT' ? '#059669' : c.auspiciousLevel === 'CAT' ? '#2563eb' : c.auspiciousLevel?.includes('HUNG') ? '#dc2626' : '#64748b'};">
                    ${c.auspiciousLevel === 'DAI_CAT' ? 'Tối Cát' : c.auspiciousLevel === 'CAT' ? 'Tiến Khí / Cát' : c.auspiciousLevel === 'DAI_HUNG' ? 'Đại Hung' : c.auspiciousLevel === 'HUNG' ? 'Hung' : 'Bình Hòa'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    contentHtml += `</div>`;
  }

  // 4. TRANG 4+: TOÀN BỘ CÁC CHƯƠNG LUẬN GIẢI THẨM ĐỊNH CHI TIẾT
  if (hasInterpPages) {
    let interpPagesHtml = `
      <div class="page-container page-layout-standard" style="padding: 24px 30px;">
        <div style="border-bottom: 2px solid #b45309; padding-bottom: 8px; margin-bottom: 16px;">
          <div style="font-size: 8pt; font-weight: 800; color: #b45309; text-transform: uppercase; letter-spacing: 1px;">
            CẨM NANG LUẬN GIẢI THẨM ĐỊNH CHUYÊN SÂU
          </div>
          <div style="font-size: 14pt; font-weight: 900; color: #0f172a; font-family: 'Playfair Display', serif;">
            Chi Tiết Bố Trí Không Gian Sống & Phương Án Cải Vận Chu Kỳ Vận 9
          </div>
        </div>
    `;

    filteredSections.forEach((sec, idx) => {
      interpPagesHtml += `
        <div class="interpretation-chapter" style="margin-bottom: 20px; page-break-inside: avoid;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; background: #fefce8; border-left: 4px solid #b45309; padding: 6px 10px; border-radius: 0 6px 6px 0;">
            <span style="font-size: 9.5pt; font-weight: 900; color: #92400e;">
              ${escapeHtml(sec.title || `Mục ${idx + 1}`)}
            </span>
          </div>
          <div class="markdown-body" style="font-size: 8.5pt; line-height: 1.6; color: #334155; text-align: justify;">
            ${markdownToHtml(sec.content || '')}
          </div>
        </div>
      `;
    });

    interpPagesHtml += `</div>`;
    contentHtml += interpPagesHtml;
  }

  return wrapCompleteHtml(record.title || 'Hồ Sơ Phong Thủy Huyền Không Phi Tinh', contentHtml);
}

module.exports = {
  generateFeiXingHtml
};
