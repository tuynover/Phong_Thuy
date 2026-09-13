/**
 * ichingTemplate.js - Tạo Bố Cục PDF Chu Dịch & Lục Hào Chiêm Bốc
 */

const IChingDataService = require('../../iching/services/IChingDataService');
const RuleEngineService = require('../../iching/services/RuleEngineService');
const hexagramsData = require('../../iching/data/hexagrams.json');

const {
  renderCoverPage,
  wrapCompleteHtml,
  parseInterpretationSections,
  markdownToHtml,
  getElemTextColor,
  renderElementText,
  ELEMENT_COLORS
} = require('./templateUtils');

function generateIChingHtml(record, scope = []) {
  const primary = record.primaryHexagram || {};
  const transformed = record.transformedHexagram || {};
  const question = record.question || 'Chiêm đoán sự việc';
  const movingLines = Array.isArray(record.movingLines) ? record.movingLines : [];
  const lunarDateInfo = record.lunarDateInfo || {};

  function formatElementName(elem) {
    if (!elem || elem === 'Chưa xác định' || elem === 'Unknown') return elem || '-';
    const key = String(elem).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const map = { kim: 'Kim', moc: 'Mộc', thuy: 'Thủy', hoa: 'Hỏa', tho: 'Thổ' };
    return map[key] || elem;
  }

  function formatElementBadge(stemBranch, element) {
    const elem = formatElementName(element);
    const color = ELEMENT_COLORS[elem] || { text: '#334155', bg: '#f8fafc', border: '#cbd5e1' };
    return `<span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-weight: 700; font-size: 7pt; color: ${color.text}; background: ${color.bg}; border: 1px solid ${color.border}; white-space: nowrap;">${stemBranch || ''} (${elem})</span>`;
  }

  const hasScope = scope && scope.length > 0;
  const includeTable = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('iching_table') || scope.includes('iching_hexagram');
  const includeAnalysis = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('iching_analysis') || scope.includes('iching_hexagram');
  const includeUngKy = !hasScope || scope.includes('all') || scope.includes('chart') || scope.includes('iching_ungky');

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
    scope.includes('iching_interpretation');

  const filteredSections = sections.filter(sec => {
    if (isAllInterpRequested) return true;
    return scope.includes(sec.id) || scope.includes(`interp_${sec.id}`) || scope.includes(`iching_${sec.id}`);
  });

  // Xác định mã nhị phân quẻ chủ (6 ký tự: binary_code[0] là Hào 6, binary_code[5] là Hào 1)
  let primaryBinary = primary.binary_code;
  if (!primaryBinary && Array.isArray(primary.lines)) {
    primaryBinary = primary.lines.map(l => (typeof l === 'object' ? (l.type ?? l.is_yang ?? 1) : l)).reverse().join('');
  }
  if (!primaryBinary) {
    const found = hexagramsData.find(h => h.name && h.name.includes(primary.name));
    primaryBinary = found ? found.binary_code : '111111';
  }

  // Quẻ Hỗ (Nuclear Hexagram):
  // Hỗ Thượng (hào 5, 4, 3) = primaryBinary[1] + primaryBinary[2] + primaryBinary[3]
  // Hỗ Hạ (hào 4, 3, 2) = primaryBinary[2] + primaryBinary[3] + primaryBinary[4]
  let nuclearHexagram = null;
  if (primaryBinary && primaryBinary.length === 6) {
    const nucBin = primaryBinary[1] + primaryBinary[2] + primaryBinary[3] + primaryBinary[2] + primaryBinary[3] + primaryBinary[4];
    const foundNuc = hexagramsData.find(h => h.binary_code === nucBin);
    nuclearHexagram = foundNuc || {
      name: 'Quẻ Hỗ (' + nucBin + ')',
      binary_code: nucBin,
      palace: 'Hỗ Cung',
      palace_element: 'Trung Khí'
    };
  }

  // Chuẩn bị tái cấu trúc Lục Hào Lạc Giáp
  const safeRecord = {
    ...record,
    primaryHexagram: { ...primary, binary_code: primaryBinary },
    movingLines,
    lunarDateInfo: {
      dayCanChi: lunarDateInfo.dayCanChi || 'Giáp Tý',
      monthCanChi: lunarDateInfo.monthCanChi || 'Bính Dần',
      yearCanChi: lunarDateInfo.yearCanChi || 'Giáp Thìn',
      hourCanChi: lunarDateInfo.hourCanChi || 'Giáp Tý',
      tuankhong: lunarDateInfo.tuankhong || ''
    }
  };

  let reconstructed = null;
  try {
    reconstructed = IChingDataService.reconstructLines(safeRecord);
  } catch (e) {
    // Dự phòng khi dữ liệu đặc thù
  }

  const primaryLines = reconstructed?.primaryLines || [];
  const secondaryLines = reconstructed?.secondaryLines || [];
  const primaryQtBranch = reconstructed?.primaryHexagram?.quai_than || '';
  const secondaryQtBranch = reconstructed?.transformedHexagram?.quai_than || transformed.quai_than || '';

  // Phân tích Dịch Lý
  let analysis = record.analysisSnapshot || {};
  if (!analysis.dungThan && primaryLines.length > 0) {
    try {
      analysis = RuleEngineService.analyze({
        primaryLines,
        secondaryLines,
        question
      }, 1) || {};
    } catch (e) {
      analysis = {};
    }
  }

  const dateCastStr = record.dateCast ? new Date(record.dateCast).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) : 'Chưa xác định';

  const yearCanChi = lunarDateInfo.yearCanChi || 'Bính Ngọ';
  const monthCanChi = lunarDateInfo.monthCanChi || 'Bính Thân';
  const dayCanChi = lunarDateInfo.dayCanChi || 'Tân Tị';
  const hourCanChi = lunarDateInfo.hourCanChi || 'Quý Tị';
  const tuankhong = lunarDateInfo.tuankhong || 'Thân Dậu';
  const nhatThan = lunarDateInfo.nhatThan || `${dayCanChi.split(' ').pop() || ''}-Hỏa`;
  const nguyetLenh = lunarDateInfo.nguyetLenh || `${monthCanChi.split(' ').pop() || ''}-Kim`;

  const includeCover = scope.includes('cover') || scope.includes('all') || (!hasScope);
  let coverHtml = '';
  if (includeCover) {
    coverHtml = renderCoverPage({
      system: 'iching',
      title: 'CHU DỊCH QUÁI TƯỢNG & LỤC HÀO BIỆN CHỨNG',
      subtitle: 'Bốc Phệ Chiêm Đoán, Biện Chứng Tượng - Hào & Định Lượng Ứng Kỳ',
      clientName: record.userName || 'Đương Số',
      gender: '',
      dateStr: dateCastStr,
      lunarStr: lunarDateInfo.lunarDateStr ? `Âm lịch: ${lunarDateInfo.lunarDateStr}` : `${dayCanChi} | ${monthCanChi}`,
      extraInfo: [
        { label: 'Tâm điểm', value: `"${question}"`, fullWidth: true, highlight: true },
        { label: 'Quẻ Chủ', value: `${primary.name || 'N/A'} (${primary.palace || ''})` },
        { label: 'Quẻ Biến', value: transformed?.name ? `${transformed.name} (${transformed.palace || ''})` : 'Không có quẻ biến' },
        ...(tuankhong ? [{ label: 'Tuần Không', value: tuankhong }] : [])
      ],
      recordId: record._id || '',
      sealText: ['DỊCH', 'LÝ', 'CHÍNH', 'TÔNG']
    });
  }

  let contentHtml = coverHtml + `
    <div class="monograph-header">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <span class="monograph-badge">Hồ Sơ Dịch Lý Cá Nhân • Chu Dịch Lục Hào</span>
          <h1 class="monograph-title serif-title">HỒ SƠ QUẺ DỊCH & DỰ ĐOÁN ỨNG KỲ</h1>
        </div>
        <div style="text-align: right; font-size: 7.5pt; color: #78350f; font-weight: 700;">
          MÃ SỐ: ${record._id?.slice(0, 18) || 'N/A'}<br/>
          BẢN QUYỀN HỆ THỐNG
        </div>
      </div>

      <div style="margin-top: 5px; font-size: 9pt; color: #1e293b; background: #fffbeb; border: 1px solid #fde68a; border-radius: 5px; padding: 4px 8px;">
        <strong style="color: #92400e; text-transform: uppercase; font-size: 7.5pt;">Tâm Điểm Chiêm Đoán:</strong> 
        <span style="font-weight: 600; font-style: italic;">"${question}"</span>
      </div>

      <div class="iching-meta-grid">
        <div><strong>Thời gian lập quẻ:</strong> ${dateCastStr} ${lunarDateInfo.lunarDateStr ? `(${lunarDateInfo.lunarDateStr})` : ''}</div>
        <div><strong>Phương pháp gieo:</strong> ${record.methodName || record.method || 'Lục Hào Truyền Thống'}</div>
        <div><strong>Nhật Thần / Nguyệt Lệnh:</strong> Nhật: ${nhatThan} | Nguyệt: ${nguyetLenh}</div>
        <div><strong>Tuần Không (Không Vong):</strong> <span class="${tuankhong ? 'tk-tag' : ''}">${tuankhong || 'Không có'}</span></div>
        <div><strong>Quái Thân Bản Quẻ:</strong> ${primaryQtBranch ? `<span class="qt-tag">Chi ${primaryQtBranch}</span>` : 'Không hiện'}</div>
      </div>
    </div>
  `;

  // I. Bảng Lục Hào & Đồ Hình 3 Quẻ
  if (includeTable) {
    const hasTransformed = transformed && transformed.name;
    const transBin = transformed.binary_code || reconstructed?.transformedHexagram?.binary_code;

    function getChiOnly(stemBranch) {
      if (!stemBranch) return '';
      const parts = stemBranch.trim().split(' ');
      return parts.length >= 2 ? parts[parts.length - 1] : stemBranch;
    }

    function getElementColor(element) {
      const elem = formatElementName(element);
      switch (elem) {
        case 'Mộc': return '#059669';
        case 'Hỏa': return '#dc2626';
        case 'Thổ': return '#b45309';
        case 'Kim': return '#64748b';
        case 'Thủy': return '#2563eb';
        default: return '#1e293b';
      }
    }

    function renderHaoBar(isYang, isMoving) {
      const color = isMoving ? '#dc2626' : '#1e40af';
      if (isYang) {
        return `<div style="width: 36px; height: 5px; background: ${color}; border-radius: 1px; margin: 0 auto;"></div>`;
      } else {
        return `<div style="width: 36px; height: 5px; display: flex; justify-content: space-between; margin: 0 auto;">
          <div style="width: 44%; height: 5px; background: ${color}; border-radius: 1px;"></div>
          <div style="width: 44%; height: 5px; background: ${color}; border-radius: 1px;"></div>
        </div>`;
      }
    }

    contentHtml += `
      <!-- 1. ĐỒ HÌNH 3 QUẺ (CHUẨN ẢNH 1) -->
      <div class="no-break" style="margin-bottom: 8px;">
        <div class="section-title">I. Đồ Hình 3 Quẻ: Quẻ Chủ - Quẻ Hỗ - Quẻ Biến</div>
        
        <div class="iching-tri-overview ${nuclearHexagram ? 'has-nuclear' : ''}" style="margin-bottom: 0;">
          <!-- Quẻ Chủ -->
          <div class="iching-hex-card primary" style="padding: 5px 8px;">
            <div class="iching-hex-card-title" style="color: #1e3a8a; font-size: 8.8pt;">Quẻ Chủ: ${primary.name || 'Quẻ Gốc'}</div>
            <div class="iching-hex-card-subtitle" style="font-size: 6.8pt; margin-bottom: 4px;">Cung ${primary.palace || 'Bản Cung'} (${formatElementName(primary.palace_element)})</div>
            <div class="iching-lines-mini" style="gap: 2.5px;">
              ${[6, 5, 4, 3, 2, 1].map(lNum => {
                const isYang = primaryBinary[6 - lNum] === '1';
                const isMoving = movingLines.includes(lNum);
                return `
                  <div class="iching-line-row">
                    ${renderHaoBar(isYang, isMoving)}
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Quẻ Hỗ (Nuclear Hexagram) -->
          ${nuclearHexagram ? `
          <div class="iching-hex-card nuclear" style="padding: 5px 8px;">
            <div class="iching-hex-card-title" style="color: #b45309; font-size: 8.8pt;">Quẻ Hỗ: ${nuclearHexagram.name}</div>
            <div class="iching-hex-card-subtitle" style="font-size: 6.8pt; margin-bottom: 4px;">Hỗ Thể (Hào 2-3-4-5) - Cung ${nuclearHexagram.palace || 'Hỗ Cung'}</div>
            <div class="iching-lines-mini" style="gap: 2.5px;">
              ${[6, 5, 4, 3, 2, 1].map(lNum => {
                const isYang = nuclearHexagram.binary_code[6 - lNum] === '1';
                return `
                  <div class="iching-line-row">
                    ${renderHaoBar(isYang, false)}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Quẻ Biến -->
          ${hasTransformed ? `
          <div class="iching-hex-card transformed" style="padding: 5px 8px;">
            <div class="iching-hex-card-title" style="color: #b91c1c; font-size: 8.8pt;">Quẻ Biến: ${transformed.name}</div>
            <div class="iching-hex-card-subtitle" style="font-size: 6.8pt; margin-bottom: 4px;">Cung ${transformed.palace || 'Biến Cung'} (${formatElementName(transformed.palace_element)})</div>
            <div class="iching-lines-mini" style="gap: 2.5px;">
              ${[6, 5, 4, 3, 2, 1].map(lNum => {
                const isYang = transBin ? (transBin[6 - lNum] === '1') : false;
                const isMoving = movingLines.includes(lNum);
                return `
                  <div class="iching-line-row">
                    ${renderHaoBar(isYang, isMoving)}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : `
          <div class="iching-hex-card" style="display: flex; flex-direction: column; justify-content: center; background: #ffffff; border-color: #cbd5e1; padding: 5px 8px;">
            <div style="font-weight: 700; color: #64748b; font-size: 8.8pt;">Quẻ Tĩnh Thuần Nhất</div>
            <div style="font-size: 6.8pt; color: #94a3b8; margin-top: 2px;">Không có hào động, giữ nguyên tượng quẻ chủ</div>
          </div>
          `}
        </div>
      </div>

      <!-- 2. BẢNG LỤC HÀO NẠP GIÁP (ĐỐI CHIẾU QUẺ CHỦ & QUẺ BIẾN - CHUẨN ẢNH 1) -->
      <div class="no-break" style="margin-bottom: 8px; border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
        <div style="background: #ffffff; padding: 5px 10px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 6px;">
          <div style="width: 3.5px; height: 14px; background-color: #b45309; border-radius: 2px;"></div>
          <div class="serif-title" style="font-size: 8.8pt; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.3px;">
            BẢNG LỤC HÀO NẠP GIÁP (ĐỐI CHIẾU QUẺ CHỦ & QUẺ BIẾN)
          </div>
        </div>
        ${hasTransformed ? `
        <table class="luchao-web-table" style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left; table-layout: fixed; margin-bottom: 0; border: none; border-radius: 0;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #334155; font-size: 7.2pt; font-weight: 800; height: 26px;">
              <th style="width: 8%; text-align: center;">Hào</th>
              <th style="width: 7%; text-align: center;">T/Ứ</th>
              <th style="width: 15%; padding-left: 4px;">Lục Thân</th>
              <th style="width: 15%;">Địa Chi</th>
              <th style="width: 8%; text-align: center;">PT</th>
              <th style="width: 6%; text-align: center; border-right: 1.5px dashed #cbd5e1;">TK</th>
              <th style="width: 15%; padding-left: 8px;">Lục Thân</th>
              <th style="width: 15%;">Địa Chi</th>
              <th style="width: 6%; text-align: center;">TK</th>
              <th style="width: 15%;">Lục Thú</th>
              <th style="width: 8%; text-align: center;">Hào</th>
            </tr>
          </thead>
          <tbody>
            ${[5, 4, 3, 2, 1, 0].map(idx => {
              const lNum = idx + 1;
              const pLine = primaryLines[idx] || {};
              const sLine = secondaryLines ? secondaryLines[idx] : null;
              const isMoving = movingLines.includes(lNum) || pLine.moving;
              const isPrimaryYang = pLine.line_type === 1 || pLine.is_yang === 1 || primaryBinary[6 - lNum] === '1';
              const isSecondaryYang = sLine ? (sLine.line_type === 1 || sLine.is_yang === 1 || (transBin && transBin[6 - lNum] === '1')) : isPrimaryYang;

              const rowBg = idx % 2 === 1 ? '#ffffff' : '#fafbfc';

              return `
                <tr style="background-color: ${rowBg}; border-bottom: 1px solid #f1f5f9; height: 26px;">
                  <!-- Quẻ Chủ (Trái) -->
                  <td style="text-align: center; padding: 2px;">
                    ${renderHaoBar(isPrimaryYang, isMoving)}
                  </td>
                  <td style="text-align: center; padding: 2px; font-weight: 800; color: #1e40af; font-size: 7.5pt;">
                    ${pLine.is_host ? 'Thế' : pLine.is_guest ? 'Ứng' : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: ${isMoving ? '800' : '600'}; color: #1e293b;">
                    ${pLine.relative || ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: ${isMoving ? '800' : '600'}; color: ${getElementColor(pLine.element)};">
                    ${getChiOnly(pLine.stem_branch)} ${pLine.element || ''}
                  </td>
                  <td style="text-align: center; padding: 2px; font-weight: 600; color: #64748b; font-size: 6.8pt;">
                    ${pLine.hidden_spirit ? pLine.hidden_spirit.replace(/^Phục:?\s*/i, '') : ''}
                  </td>
                  <td style="text-align: center; padding: 2px; border-right: 1.5px dashed #cbd5e1;">
                    ${pLine.tk ? `<span style="color: #dc2626; font-weight: 800; font-size: 7.2pt;">${pLine.tk}</span>` : ''}
                  </td>

                  <!-- Quẻ Biến (Phải) -->
                  <td style="padding: 2px 4px 2px 8px; font-weight: ${isMoving ? '800' : '600'}; color: #1e293b;">
                    ${sLine ? (sLine.relative || '') : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: ${isMoving ? '800' : '600'}; color: ${sLine ? getElementColor(sLine.element) : '#1e293b'};">
                    ${sLine ? `${getChiOnly(sLine.stem_branch)} ${sLine.element || ''}` : ''}
                  </td>
                  <td style="text-align: center; padding: 2px;">
                    ${sLine && sLine.tk ? `<span style="color: #dc2626; font-weight: 800; font-size: 7.2pt;">${sLine.tk}</span>` : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: 700; color: #334155;">
                    ${pLine.luc_thu || (sLine ? sLine.luc_thu : '') || ''}
                  </td>
                  <td style="text-align: center; padding: 2px;">
                    ${sLine ? renderHaoBar(isSecondaryYang, isMoving) : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ` : `
        <table class="luchao-web-table" style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left; margin-bottom: 0; border: none; border-radius: 0;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #334155; font-size: 7.2pt; font-weight: 800; height: 26px;">
              <th style="width: 12%; text-align: center;">Hào</th>
              <th style="width: 10%; text-align: center;">T/Ứ</th>
              <th style="width: 22%;">Lục Thân</th>
              <th style="width: 22%;">Địa Chi</th>
              <th style="width: 14%; text-align: center;">Phục Thần</th>
              <th style="width: 8%; text-align: center;">TK</th>
              <th style="width: 18%;">Lục Thú</th>
            </tr>
          </thead>
          <tbody>
            ${[5, 4, 3, 2, 1, 0].map(idx => {
              const lNum = idx + 1;
              const pLine = primaryLines[idx] || {};
              const isPrimaryYang = pLine.line_type === 1 || pLine.is_yang === 1 || primaryBinary[6 - lNum] === '1';
              const rowBg = idx % 2 === 1 ? '#ffffff' : '#fafbfc';

              return `
                <tr style="background-color: ${rowBg}; border-bottom: 1px solid #f1f5f9; height: 26px;">
                  <td style="text-align: center; padding: 2px;">
                    ${renderHaoBar(isPrimaryYang, false)}
                  </td>
                  <td style="text-align: center; padding: 2px; font-weight: 800; color: #1e40af; font-size: 7.5pt;">
                    ${pLine.is_host ? 'Thế' : pLine.is_guest ? 'Ứng' : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: 600; color: #1e293b;">
                    ${pLine.relative || ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: 600; color: ${getElementColor(pLine.element)};">
                    ${getChiOnly(pLine.stem_branch)} ${pLine.element || ''}
                  </td>
                  <td style="text-align: center; padding: 2px; font-weight: 600; color: #64748b; font-size: 6.8pt;">
                    ${pLine.hidden_spirit ? pLine.hidden_spirit.replace(/^Phục:?\s*/i, '') : ''}
                  </td>
                  <td style="text-align: center; padding: 2px;">
                    ${pLine.tk ? `<span style="color: #dc2626; font-weight: 800; font-size: 7.2pt;">${pLine.tk}</span>` : ''}
                  </td>
                  <td style="padding: 2px 4px; font-weight: 700; color: #334155;">
                    ${pLine.luc_thu || ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        `}
      </div>

      <!-- 3. TRẠNG THÁI VƯỢNG SUY CÁC HÀO (CHUẨN HÌNH 2) -->
      <div class="no-break" style="margin-bottom: 8px;">
        <div style="margin-bottom: 4px;">
          <h3 class="serif-title" style="font-size: 9.5pt; font-weight: 800; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #881337; padding-bottom: 2px; display: inline-block;">
            TRẠNG THÁI VƯỢNG SUY CÁC HÀO
          </h3>
        </div>

        <div style="display: flex; gap: 10px;">
          <!-- Quẻ Chính (Trái) -->
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 3px; height: 18px;">
              ${primaryQtBranch ? `<span style="background: #f3e8ff; color: #6b21a8; font-weight: 700; font-size: 7pt; padding: 1px 8px; border-radius: 9999px; border: 1px solid #e9d5ff;">Quái Thân: ${primaryQtBranch}</span>` : ''}
            </div>
            <div style="border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left;">
                <thead style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-size: 6.8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">
                  <tr>
                    <th style="padding: 4px 6px; width: 40%;">HÀO / CAN CHI</th>
                    <th style="padding: 4px 6px; width: 22%;">VƯỢNG SUY</th>
                    <th style="padding: 4px 6px; width: 19%;">TS NGÀY</th>
                    <th style="padding: 4px 6px; width: 19%;">TS THÁNG</th>
                  </tr>
                </thead>
                <tbody>
                  ${[5, 4, 3, 2, 1, 0].map(idx => {
                    const pLine = primaryLines[idx] || {};
                    const isVuongTuong = pLine.vuong_suy === 'Vượng' || pLine.vuong_suy === 'Tướng';
                    const elemColor = getElementColor(pLine.element);
                    return `
                      <tr style="border-bottom: 1px solid #f1f5f9; height: 24px; ${idx % 2 === 1 ? 'background-color: #fafbfc;' : ''}">
                        <td style="padding: 3px 6px; font-weight: 700; color: ${elemColor};">
                          ${pLine.stem_branch || '-'}
                          ${pLine.qt ? `<span style="margin-left: 3px; padding: 0.5px 3px; background: #f3e8ff; color: #6b21a8; font-size: 6pt; font-weight: 800; border-radius: 2px; text-transform: uppercase;">QT</span>` : ''}
                        </td>
                        <td style="padding: 3px 6px;">
                          ${isVuongTuong ? `<span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-weight: 800; font-size: 6.8pt; color: #dc2626; background: #fff1f2; border: 1px solid #fee2e2;">${pLine.vuong_suy}</span>` : `<span style="font-weight: 700; color: #1e293b;">${pLine.vuong_suy || 'Hưu'}</span>`}
                        </td>
                        <td style="padding: 3px 6px; color: #1e40af; font-weight: 700;">${pLine.ts_ngay || '-'}</td>
                        <td style="padding: 3px 6px; color: #b45309; font-weight: 700;">${pLine.ts_thang || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Quẻ Biến (Phải - nếu có quẻ biến) -->
          ${hasTransformed ? `
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: 3px; height: 18px;">
              ${secondaryQtBranch ? `<span style="background: #f3e8ff; color: #6b21a8; font-weight: 700; font-size: 7pt; padding: 1px 8px; border-radius: 9999px; border: 1px solid #e9d5ff;">Quái Thân: ${secondaryQtBranch}</span>` : ''}
            </div>
            <div style="border: 1.5px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; font-size: 7.5pt; text-align: left;">
                <thead style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; color: #475569; font-size: 6.8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px;">
                  <tr>
                    <th style="padding: 4px 6px; width: 40%;">HÀO / CAN CHI</th>
                    <th style="padding: 4px 6px; width: 22%;">VƯỢNG SUY</th>
                    <th style="padding: 4px 6px; width: 19%;">TS NGÀY</th>
                    <th style="padding: 4px 6px; width: 19%;">TS THÁNG</th>
                  </tr>
                </thead>
                <tbody>
                  ${[5, 4, 3, 2, 1, 0].map(idx => {
                    const sLine = secondaryLines ? secondaryLines[idx] : null;
                    if (!sLine) return '';
                    const isVuongTuong = sLine.vuong_suy === 'Vượng' || sLine.vuong_suy === 'Tướng';
                    const elemColor = getElementColor(sLine.element);
                    return `
                      <tr style="border-bottom: 1px solid #f1f5f9; height: 24px; ${idx % 2 === 1 ? 'background-color: #fafbfc;' : ''}">
                        <td style="padding: 3px 6px; font-weight: 700; color: ${elemColor};">
                          ${sLine.stem_branch || '-'}
                          ${sLine.qt ? `<span style="margin-left: 3px; padding: 0.5px 3px; background: #f3e8ff; color: #6b21a8; font-size: 6pt; font-weight: 800; border-radius: 2px; text-transform: uppercase;">QT</span>` : ''}
                        </td>
                        <td style="padding: 3px 6px;">
                          ${isVuongTuong ? `<span style="display: inline-block; padding: 1px 5px; border-radius: 3px; font-weight: 800; font-size: 6.8pt; color: #dc2626; background: #fff1f2; border: 1px solid #fee2e2;">${sLine.vuong_suy}</span>` : `<span style="font-weight: 700; color: #1e293b;">${sLine.vuong_suy || 'Hưu'}</span>`}
                        </td>
                        <td style="padding: 3px 6px; color: #1e40af; font-weight: 700;">${sLine.ts_ngay || '-'}</td>
                        <td style="padding: 3px 6px; color: #b45309; font-weight: 700;">${sLine.ts_thang || '-'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // II. Khối Phân Tích Dịch Lý Cốt Lõi
  if (includeAnalysis) {
    const dungThanDetails = analysis.dungThanDetails || {};
    const the = analysis.the || {};
    const ung = analysis.ung || {};
    const movingList = analysis.movingLines || [];
    const specialStates = analysis.specialStates || [];
    const confidencePct = Math.round((analysis.confidence || 0.75) * 100);

    contentHtml += `
      <div class="no-break" style="margin-top: 10px;">
        <div class="section-title">II. Phân Tích Dịch Lý & Tương Quan Lực Lượng Cốt Lõi</div>
        
        <div class="iching-cards-grid">
          <!-- Card 1: Dụng Thần -->
          <div class="iching-card-box highlight">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #fde68a; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #92400e;">1. Dụng Thần (Tâm Điểm Dự Đoán)</span>
              <span style="font-size: 7pt; font-weight: 800; color: #b45309; background: #fef3c7; padding: 1px 5px; border-radius: 3px;">Mục Tiêu Chiêm Bốc</span>
            </div>
            <div style="font-size: 8pt; line-height: 1.45; color: #1e293b;">
              <div><strong>Dụng Thần Xác Định:</strong> <span style="font-weight: 900; color: #b45309; font-size: 9pt;">${analysis.dungThan || 'Hào Thế'}</span> (${formatElementName(dungThanDetails.element)})</div>
              <div><strong>Khí Lực Ngũ Hành:</strong> ${dungThanDetails.strength === 'strong' ? '<span style="color: #047857; font-weight: 800;">Vượng Tướng (Đắc lệnh, sinh trợ cát lợi)</span>' : dungThanDetails.strength === 'weak' ? '<span style="color: #b91c1c; font-weight: 800;">Hưu Tù Tử (Suy kiệt, thời vận chưa thông)</span>' : '<span style="color: #b45309; font-weight: 700;">Bình Hòa (Trung bình)</span>'}</div>
              <div><strong>Trạng Thái Tuần Không:</strong> ${dungThanDetails.is_tuankhong ? '<span class="tk-tag">[Phạm Không Vong - Cần chờ ngày xung/xuất không]</span>' : '<span style="color: #047857; font-weight: 600;">Không phạm Tuần Không</span>'}</div>
            </div>
          </div>

          <!-- Card 2: Thế - Ứng -->
          <div class="iching-card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #1e293b;">2. Tương Quan Thế - Ứng (Chủ & Khách)</span>
              <span style="font-size: 7pt; font-weight: 700; color: #475569;">Mình & Đối Tác</span>
            </div>
            <div style="font-size: 8pt; line-height: 1.45; color: #1e293b;">
              <div><strong>Hào Thế (Bản thân / Phía mình):</strong> ${the.relation || 'Thế'} (${formatElementName(the.element)}) - ${the.strength === 'strong' ? '<span style="color: #047857; font-weight: 700;">Vượng tướng, có quyền chủ động</span>' : '<span style="color: #b91c1c; font-weight: 700;">Hưu tù, lực bất tòng tâm</span>'}</div>
              <div><strong>Hào Ứng (Đối phương / Môi trường):</strong> ${ung.relation || 'Ứng'} (${formatElementName(ung.element)}) - ${ung.strength === 'strong' ? '<span style="color: #047857; font-weight: 700;">Lực lượng mạnh mẽ</span>' : '<span style="color: #64748b;">Lực lượng bình thường</span>'}</div>
              <div><strong>Tương Phối:</strong> ${specialStates.find(s => s.includes('Sinh') || s.includes('Khắc')) || 'Âm Dương hòa hợp, tương sinh hỗ trợ'}</div>
            </div>
          </div>

          <!-- Card 3: Hào Động & Biến Hóa -->
          <div class="iching-card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #1e293b;">3. Hào Động & Cơ Duyên Chuyển Hóa</span>
              <span style="font-size: 7pt; font-weight: 700; color: ${movingList.length > 0 ? '#b91c1c' : '#64748b'};">${movingList.length > 0 ? `${movingList.length} Hào Động` : 'Quẻ Tĩnh'}</span>
            </div>
            <div style="font-size: 8pt; line-height: 1.45; color: #1e293b;">
              ${movingList.length > 0 ? movingList.map(m => `
                <div style="margin-bottom: 2px;">
                  <strong style="color: #b91c1c;">Hào ${m.line}:</strong> ${m.effect} (${m.from} → ${m.to})
                </div>
              `).join('') : '<div style="color: #64748b; font-style: italic;">Quẻ không có hào động. Cục diện tĩnh tại, sự việc diễn ra theo quán tính tự nhiên, không có đột biến bất thường.</div>'}
            </div>
          </div>

          <!-- Card 4: Trạng Thái Đặc Biệt & Ứng Nghiệm -->
          <div class="iching-card-box">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 3px; margin-bottom: 5px;">
              <span style="font-size: 8pt; font-weight: 800; text-transform: uppercase; color: #1e293b;">4. Cách Cục & Độ Ứng Nghiệm</span>
              <span style="font-size: 7pt; font-weight: 800; color: #047857; background: #ecfdf5; padding: 1px 5px; border-radius: 3px;">Tin Cậy: ${confidencePct}%</span>
            </div>
            <div style="font-size: 8pt; line-height: 1.45; color: #1e293b;">
              <div><strong>Đặc Thái Học Thuật:</strong> ${specialStates.length > 0 ? specialStates.join(' • ') : 'Cục diện bình hòa, thuần khiết'}</div>
              <div><strong>Quái Thân Hỗ Trợ:</strong> ${primaryQtBranch ? `Trực tại địa chi <strong>${primaryQtBranch}</strong>` : 'Quái Thân ẩn tàng'}</div>
              <div><strong>Khuyến Cáo Dịch Học:</strong> ${dungThanDetails.strength === 'strong' ? 'Thời cơ chín muồi, nên quyết đoán nắm bắt.' : 'Nên tĩnh tại tích lũy, chờ đợi thời cơ ứng kỳ.'}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // III. Bảng Niên Lịch Ứng Kỳ Dự Báo
  if (includeUngKy && record.ungKy && record.ungKy.length > 0) {
    contentHtml += `
      <div class="no-break" style="margin-top: 10px;">
        <div class="section-title">III. Bảng Niên Lịch Ứng Kỳ Dự Báo Cát Hung</div>
        <table class="gfm-table">
          <thead>
            <tr>
              <th style="width: 32%;">Thời Điểm Ứng Kỳ (Âm Lịch)</th>
              <th style="width: 25%;">Dương Lịch Quy Chiếu</th>
              <th style="width: 43%;">Dự Đoán Sự Việc & Biến Chuyển Cát Hung</th>
            </tr>
          </thead>
          <tbody>
            ${record.ungKy.map(u => `
              <tr>
                <td><strong>Ngày ${u.lunarDay || '-'} Tháng ${u.lunarMonth} Năm ${u.lunarYear}</strong></td>
                <td>${u.solarDate ? new Date(u.solarDate).toLocaleDateString('vi-VN') : '-'}</td>
                <td>${u.originalText || 'Ứng kỳ biến chuyển cát hung theo dịch tượng'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // IV. Toàn Văn Luận Giải Chu Dịch
  if (filteredSections.length > 0) {
    contentHtml += `
      <div class="page-break">
        <div class="doc-page-header">
          <span>Hồ Sơ Luận Giải Chu Dịch Chiêm Bốc</span>
          <span>Câu hỏi: ${question.slice(0, 35)}...</span>
        </div>
        <div style="text-align: center; margin: 16px 0 20px 0;">
          <h2 class="serif-title" style="font-size: 15pt; color: #78350f; margin-bottom: 4px;">TOÀN VĂN LUẬN ĐOÁN CHU DỊCH & DIỄN TƯỢNG</h2>
          <div style="font-size: 8pt; color: #64748b;">Hệ thống phân tích học thuật kết hợp Đại Trí Tuệ Nhân Tạo Mệnh Lý</div>
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

  return wrapCompleteHtml(`Quẻ Dịch - ${primary.name || 'Chu Dịch Chiêm Bốc'}`, contentHtml);
}

/**
 * Trích xuất Hỷ, Kỵ, Dụng Thần linh hoạt từ cấu trúc dữ liệu Bát Tự
 */

module.exports = {
  generateIChingHtml
};
