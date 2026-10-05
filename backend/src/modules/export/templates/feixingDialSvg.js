/**
 * feixingDialSvg.js - Kết Xuất Đồ Hình Vector SVG Tinh Bàn Huyền Không & La Kinh 24 Sơn
 * Tái tạo 100% chuẩn xác đồ hình hiển thị trên Web cho bản in PDF A4
 */

const TWENTY_FOUR_MOUNTAINS = [
  { name: 'Tý', palace: 'Khảm', palaceKey: 'KHAM', center: 0, element: 'Thủy', color: '#2563eb' },
  { name: 'Quý', palace: 'Khảm', palaceKey: 'KHAM', center: 15, element: 'Thủy', color: '#2563eb' },
  { name: 'Sửu', palace: 'Cấn', palaceKey: 'CAN_NE', center: 30, element: 'Thổ', color: '#d97706' },
  { name: 'Cấn', palace: 'Cấn', palaceKey: 'CAN_NE', center: 45, element: 'Thổ', color: '#d97706' },
  { name: 'Dần', palace: 'Cấn', palaceKey: 'CAN_NE', center: 60, element: 'Mộc', color: '#16a34a' },
  { name: 'Giáp', palace: 'Chấn', palaceKey: 'CHAN', center: 75, element: 'Mộc', color: '#16a34a' },
  { name: 'Mão', palace: 'Chấn', palaceKey: 'CHAN', center: 90, element: 'Mộc', color: '#16a34a' },
  { name: 'Ất', palace: 'Chấn', palaceKey: 'CHAN', center: 105, element: 'Mộc', color: '#16a34a' },
  { name: 'Thìn', palace: 'Tốn', palaceKey: 'TON', center: 120, element: 'Thổ', color: '#d97706' },
  { name: 'Tốn', palace: 'Tốn', palaceKey: 'TON', center: 135, element: 'Mộc', color: '#16a34a' },
  { name: 'Tị', palace: 'Tốn', palaceKey: 'TON', center: 150, element: 'Hỏa', color: '#dc2626' },
  { name: 'Bính', palace: 'Ly', palaceKey: 'LY', center: 165, element: 'Hỏa', color: '#dc2626' },
  { name: 'Ngọ', palace: 'Ly', palaceKey: 'LY', center: 180, element: 'Hỏa', color: '#dc2626' },
  { name: 'Đinh', palace: 'Ly', palaceKey: 'LY', center: 195, element: 'Hỏa', color: '#dc2626' },
  { name: 'Mùi', palace: 'Khôn', palaceKey: 'KHON', center: 210, element: 'Thổ', color: '#d97706' },
  { name: 'Khôn', palace: 'Khôn', palaceKey: 'KHON', center: 225, element: 'Thổ', color: '#d97706' },
  { name: 'Thân', palace: 'Khôn', palaceKey: 'KHON', center: 240, element: 'Kim', color: '#b45309' },
  { name: 'Canh', palace: 'Đoài', palaceKey: 'DOAI', center: 255, element: 'Kim', color: '#b45309' },
  { name: 'Dậu', palace: 'Đoài', palaceKey: 'DOAI', center: 270, element: 'Kim', color: '#b45309' },
  { name: 'Tân', palace: 'Đoài', palaceKey: 'DOAI', center: 285, element: 'Kim', color: '#b45309' },
  { name: 'Tuất', palace: 'Càn', palaceKey: 'CAN', center: 300, element: 'Thổ', color: '#d97706' },
  { name: 'Càn', palace: 'Càn', palaceKey: 'CAN', center: 315, element: 'Kim', color: '#b45309' },
  { name: 'Hợi', palace: 'Càn', palaceKey: 'CAN', center: 330, element: 'Thủy', color: '#2563eb' },
  { name: 'Nhâm', palace: 'Khảm', palaceKey: 'KHAM', center: 345, element: 'Thủy', color: '#2563eb' }
];

const GRID_CELLS_LAYOUT = [
  { key: 'TON', row: 0, col: 0, palace: 'Tốn', dir: 'Đông Nam', angle: 135 },
  { key: 'LY', row: 0, col: 1, palace: 'Ly', dir: 'Nam', angle: 180 },
  { key: 'KHON', row: 0, col: 2, palace: 'Khôn', dir: 'Tây Nam', angle: 225 },
  { key: 'CHAN', row: 1, col: 0, palace: 'Chấn', dir: 'Đông', angle: 90 },
  { key: 'TRUNG', row: 1, col: 1, palace: 'Trung Cung', dir: '', angle: null },
  { key: 'DOAI', row: 1, col: 2, palace: 'Đoài', dir: 'Tây', angle: 270 },
  { key: 'CAN_NE', row: 2, col: 0, palace: 'Cấn', dir: 'Đông Bắc', angle: 45 },
  { key: 'KHAM', row: 2, col: 1, palace: 'Khảm', dir: 'Bắc', angle: 0 },
  { key: 'CAN', row: 2, col: 2, palace: 'Càn', dir: 'Tây Bắc', angle: 315 }
];

const AUSPICIOUS_CONFIG = {
  DAI_CAT: { borderColor: '#10b981', textColor: '#059669', badgeText: 'Tối Cát' },
  CAT: { borderColor: '#3b82f6', textColor: '#2563eb', badgeText: 'Tiến Khí / Cát' },
  BINH: { borderColor: '#94a3b8', textColor: '#475569', badgeText: 'Bình Hòa' },
  HUNG: { borderColor: '#ef4444', textColor: '#dc2626', badgeText: 'Hung' },
  DAI_HUNG: { borderColor: '#ef4444', textColor: '#dc2626', badgeText: 'Đại Hung' }
};

const PHOENIX_ARROW_PATH = "M 0 -13 C -1 -11, -2 -9.5, -4.5 -7 C -7 -4.5, -11 -2.5, -15 -2 C -15.3 -2, -15.5 -1.7, -15.5 -1.3 C -15.5 -0.7, -15.2 0, -14.7 0 C -11 -0.3, -7.5 -2, -5 -4 C -4.7 -2.5, -4 1, -2.5 1 C -1 1, -0.3 -2.5, 0 -4 C 2.5 -2, 6 -0.3, 9.7 0 C 10.2 0, 10.5 -0.7, 10.5 -1.3 C 10.5 -1.7, 10.3 -2, 10 -2 C 6 -2.5, 2 -4.5, -0.5 -7 C -1.5 -9.5, -1 -11, 0 -13 Z";

/**
 * Tạo chuỗi SVG thuần túy (Pure Vector SVG) của Tinh Bàn Kết Hợp La Kinh 24 Sơn & Cửu Cung
 * @param {Object} record - Bản ghi FeiXingRecord
 * @param {Array} gridData - Dữ liệu 9 ô Cửu Cung
 * @returns {string} Mã nguồn SVG
 */
function renderFeiXingDialSvg(record, gridData = []) {
  const cellMap = {};
  for (const cell of gridData) {
    cellMap[cell.palaceKey] = cell;
  }

  const cx = 520;
  const cy = 520;

  const cardW = 140;
  const cardH = 140;
  const cardGap = 8;
  const gridTotalSize = cardW * 3 + cardGap * 2; // 436
  const gridHalfSize = gridTotalSize / 2; // 218
  const gridLeft = cx - gridHalfSize; // 302
  const gridTop = cy - gridHalfSize;  // 302

  const rPlate = 430;
  const rTicksOuter = 426;
  const rTicksInner = 384;
  const rMountainsOuter = 384;
  const rMountainsInner = 316;

  const facingMountain = record.facingMountain || 'Ngọ';
  const sittingMountain = record.sittingMountain || 'Tý';
  const facingPalace = record.facingPalace || 'Ly';
  const sittingPalace = record.sittingPalace || 'Khảm';

  const facingM = TWENTY_FOUR_MOUNTAINS.find(m => m.name === facingMountain) || { center: 180 };
  const sittingM = TWENTY_FOUR_MOUNTAINS.find(m => m.name === sittingMountain) || { center: 0 };

  const facingRad = (((facingM.center + 90) % 360) * Math.PI) / 180;
  const sittingRad = (((sittingM.center + 90) % 360) * Math.PI) / 180;

  const facingArrowX = cx + (rPlate + 8) * Math.cos(facingRad);
  const facingArrowY = cy + (rPlate + 8) * Math.sin(facingRad);
  const facingArrowAngle = (facingM.center + 180) % 360;

  const sittingArrowX = cx + (rPlate + 8) * Math.cos(sittingRad);
  const sittingArrowY = cy + (rPlate + 8) * Math.sin(sittingRad);
  const sittingArrowAngle = (sittingM.center + 180) % 360;

  // 1. Ticks 360 độ
  let ticksSvg = '';
  for (let deg = 0; deg < 360; deg++) {
    if (deg % 5 !== 0 && deg % 1 !== 0) continue;
    const is45 = deg % 45 === 0;
    const is15 = deg % 15 === 0;
    const is5 = deg % 5 === 0;
    const rad = (((deg + 90) % 360) * Math.PI) / 180;
    const rStart = is45 ? 400 : is15 ? 404 : is5 ? 408 : 414;
    const rEnd = rTicksOuter;

    const stroke = is45 ? '#b45309' : is15 ? '#78350f' : is5 ? '#92400e' : '#D4AF37';
    const strokeWidth = is45 ? '1.8' : is15 ? '1.2' : is5 ? '0.8' : '0.4';

    ticksSvg += `<line x1="${(cx + rStart * Math.cos(rad)).toFixed(2)}" y1="${(cy + rStart * Math.sin(rad)).toFixed(2)}" x2="${(cx + rEnd * Math.cos(rad)).toFixed(2)}" y2="${(cy + rEnd * Math.sin(rad)).toFixed(2)}" stroke="${stroke}" stroke-width="${strokeWidth}" />`;
  }

  // 2. Nhãn độ số mỗi 30°
  let degTextSvg = '';
  for (let i = 0; i < 12; i++) {
    const deg = i * 30;
    const rad = (((deg + 90) % 360) * Math.PI) / 180;
    const textX = (cx + 394 * Math.cos(rad)).toFixed(2);
    const textY = (cy + 394 * Math.sin(rad)).toFixed(2);
    degTextSvg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="central" font-size="9.5" font-weight="bold" fill="#78350f" font-family="'Courier New', monospace">${deg}°</text>`;
  }

  // 3. Vành 24 Sơn Hướng
  let mountainsSvg = '';
  TWENTY_FOUR_MOUNTAINS.forEach((m) => {
    const centerRad = (((m.center + 90) % 360) * Math.PI) / 180;
    const dividerDeg = (m.center - 7.5 + 360) % 360;
    const dividerRad = (((dividerDeg + 90) % 360) * Math.PI) / 180;
    const isPalaceBoundary = dividerDeg % 45 === 22.5;

    const isFacingM = m.name === facingMountain;
    const isSittingM = m.name === sittingMountain;

    const textX = (cx + 348 * Math.cos(centerRad)).toFixed(2);
    const textY = (cy + 348 * Math.sin(centerRad)).toFixed(2);
    const dotX = (cx + 371 * Math.cos(centerRad)).toFixed(2);
    const dotY = (cy + 371 * Math.sin(centerRad)).toFixed(2);

    const x1 = (cx + rMountainsInner * Math.cos(dividerRad)).toFixed(2);
    const y1 = (cy + rMountainsInner * Math.sin(dividerRad)).toFixed(2);
    const x2 = (cx + rMountainsOuter * Math.cos(dividerRad)).toFixed(2);
    const y2 = (cy + rMountainsOuter * Math.sin(dividerRad)).toFixed(2);

    const lineStroke = isPalaceBoundary ? '#b45309' : '#E2CCA0';
    const lineStrokeWidth = isPalaceBoundary ? '1.8' : '0.8';

    mountainsSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${lineStroke}" stroke-width="${lineStrokeWidth}" />`;

    if (isFacingM) {
      mountainsSvg += `<circle cx="${textX}" cy="${textY}" r="16.5" fill="#fee2e2" stroke="#dc2626" stroke-width="2.2" />`;
    }
    if (isSittingM) {
      mountainsSvg += `<circle cx="${textX}" cy="${textY}" r="16.5" fill="#e0e7ff" stroke="#2563eb" stroke-width="2.2" />`;
    }

    mountainsSvg += `<circle cx="${dotX}" cy="${dotY}" r="3.2" fill="${m.color}" />`;

    const textColor = isFacingM ? '#dc2626' : isSittingM ? '#2563eb' : '#334155';
    const fontSize = isFacingM || isSittingM ? '15.5' : '14';
    const fontWeight = isFacingM || isSittingM ? '900' : 'bold';

    mountainsSvg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="central" font-size="${fontSize}" font-weight="${fontWeight}" fill="${textColor}">${m.name}</text>`;
  });

  // 4. Vạch nét đứt nối từ 24 sơn vào ma trận
  let raysSvg = '';
  const boundaryDegs = Array.from({ length: 24 }, (_, i) => 7.5 + i * 15);
  const centerDegs = [0, 45, 90, 135, 180, 225, 270, 315];
  const palaceDivisions = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

  const allRays = [
    ...boundaryDegs.map(deg => ({ deg, isPalaceBoundary: palaceDivisions.includes(deg), isCenter: false })),
    ...centerDegs.map(deg => ({ deg, isPalaceBoundary: false, isCenter: true }))
  ];

  allRays.forEach(({ deg, isPalaceBoundary, isCenter: isRayCenter }) => {
    const rad = (((deg + 90) % 360) * Math.PI) / 180;
    const maxCosSin = Math.max(Math.abs(Math.cos(rad)), Math.abs(Math.sin(rad)));
    const rInner = (gridHalfSize + 2) / maxCosSin;

    if (rInner >= rMountainsInner - 3) return;

    const x1 = (cx + rInner * Math.cos(rad)).toFixed(2);
    const y1 = (cy + rInner * Math.sin(rad)).toFixed(2);
    const x2 = (cx + rMountainsInner * Math.cos(rad)).toFixed(2);
    const y2 = (cy + rMountainsInner * Math.sin(rad)).toFixed(2);

    let stroke = '#b45309';
    let strokeWidth = '1.1';
    let strokeDasharray = '3.5 3';
    let opacity = '0.55';

    if (isPalaceBoundary) {
      stroke = '#d97706';
      strokeWidth = '1.6';
      strokeDasharray = '5 3';
      opacity = '0.85';
    } else if (isRayCenter) {
      stroke = '#92400e';
      strokeWidth = '1.0';
      strokeDasharray = '2.5 3';
      opacity = '0.4';
    }

    raysSvg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDasharray}" opacity="${opacity}" />`;
  });

  // 5. Ma Trận Cửu Cung 3x3 (Thẻ bài chuẩn web)
  let cardsSvg = '';
  GRID_CELLS_LAYOUT.forEach((pos) => {
    const cell = cellMap[pos.key] || {};
    const rx = gridLeft + pos.col * (cardW + cardGap);
    const ry = gridTop + pos.row * (cardH + cardGap);

    const isFacing = cell.palaceName === facingPalace;
    const isSitting = cell.palaceName === sittingPalace;
    const isCenter = pos.key === 'TRUNG';

    const cfg = AUSPICIOUS_CONFIG[cell.auspiciousLevel] || AUSPICIOUS_CONFIG.BINH;
    const cxCard = rx + cardW / 2;
    const hasTopGap = isFacing || isSitting;
    const gapHalf = isFacing ? 25 : isSitting ? 19 : 0;

    const borderPath = hasTopGap
      ? `M ${cxCard + gapHalf} ${ry}
         L ${rx + cardW - 16} ${ry}
         A 16 16 0 0 1 ${rx + cardW} ${ry + 16}
         L ${rx + cardW} ${ry + cardH - 16}
         A 16 16 0 0 1 ${rx + cardW - 16} ${ry + cardH}
         L ${rx + 16} ${ry + cardH}
         A 16 16 0 0 1 ${rx} ${ry + cardH - 16}
         L ${rx} ${ry + 16}
         A 16 16 0 0 1 ${rx + 16} ${ry}
         L ${cxCard - gapHalf} ${ry}`
      : null;

    cardsSvg += `
      <g>
        <!-- Nền thẻ -->
        <rect
          x="${rx}"
          y="${ry}"
          width="${cardW}"
          height="${cardH}"
          rx="16"
          fill="#FFFFFF"
          stroke="${hasTopGap ? 'none' : cfg.borderColor}"
          stroke-width="${hasTopGap ? '0' : '1.8'}"
          filter="url(#cardShadowMaster)"
        />
        ${hasTopGap ? `
          <path
            d="${borderPath}"
            fill="none"
            stroke="${cfg.borderColor}"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        ` : ''}

        <!-- Chữ HƯỚNG / TỌA căn giữa chia đôi viền (không nền) -->
        ${isFacing ? `
          <text x="${cxCard}" y="${ry}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="900" fill="#dc2626" letter-spacing="2">HƯỚNG</text>
        ` : ''}
        ${isSitting ? `
          <text x="${cxCard}" y="${ry}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="900" fill="#2563eb" letter-spacing="2">TỌA</text>
        ` : ''}

        <!-- Hàng đỉnh: Sơn Tinh - Cát Hung - Hướng Tinh -->
        <text x="${rx + 9}" y="${ry + 13}" font-size="8" font-weight="bold" fill="#4338ca">SƠN</text>
        <text x="${rx + 9}" y="${ry + 30}" font-size="21" font-weight="900" fill="#1e1b4b">${cell.mountainStar ?? '-'}</text>
        <text x="${rx + 24}" y="${ry + 30}" font-size="12" font-weight="900" fill="${cell.mountainFlight === 'FORWARD' ? '#16a34a' : '#dc2626'}">${cell.mountainFlight === 'FORWARD' ? '↗' : '↘'}</text>

        <!-- Trạng thái Cát Hung ở giữa (không nền) -->
        <text x="${rx + cardW / 2}" y="${ry + 18}" text-anchor="middle" dominant-baseline="central" font-size="9.5" font-weight="800" fill="${cfg.textColor}">${cfg.badgeText}</text>

        <text x="${rx + cardW - 9}" y="${ry + 13}" text-anchor="end" font-size="8" font-weight="bold" fill="#be123c">HƯỚNG</text>
        <text x="${rx + cardW - 22}" y="${ry + 30}" text-anchor="end" font-size="21" font-weight="900" fill="#881337">${cell.waterStar ?? '-'}</text>
        <text x="${rx + cardW - 8}" y="${ry + 30}" text-anchor="end" font-size="12" font-weight="900" fill="${cell.waterFlight === 'FORWARD' ? '#16a34a' : '#dc2626'}">${cell.waterFlight === 'FORWARD' ? '↗' : '↘'}</text>

        <!-- Trung tâm thẻ -->
        ${isCenter ? `
          <text x="${rx + cardW / 2}" y="${ry + 60}" text-anchor="middle" dominant-baseline="central" font-size="16" font-weight="900" fill="#0f172a">Trung Cung</text>
          <text x="${rx + cardW / 2}" y="${ry + 85}" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="bold" fill="#78350f">
            Vận Tinh: <tspan font-weight="900" font-size="13" fill="#451a03">${cell.periodStar ?? '-'}</tspan>
          </text>
        ` : `
          <text x="${rx + cardW / 2}" y="${ry + 54}" text-anchor="middle" dominant-baseline="central" font-size="17" font-weight="900" fill="#0f172a">${cell.palaceName || ''}</text>
          ${cell.directionName && cell.directionName !== 'Trung Tâm' ? `
            <text x="${rx + cardW / 2}" y="${ry + 72}" text-anchor="middle" dominant-baseline="central" font-size="11.5" font-weight="700" fill="#64748b">${cell.directionName}</text>
          ` : ''}
          <text x="${rx + cardW / 2}" y="${ry + 89}" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="bold" fill="#78350f">
            Vận Tinh: <tspan font-weight="900" font-size="13" fill="#451a03">${cell.periodStar ?? '-'}</tspan>
          </text>
        `}

        <!-- Đáy thẻ -->
        <line x1="${rx + 9}" y1="${ry + 110}" x2="${rx + cardW - 9}" y2="${ry + 110}" stroke="#f1f5f9" stroke-width="1" />
        <text x="${rx + 10}" y="${ry + 125}" dominant-baseline="central" font-size="9.5" fill="#94a3b8">Nguyên: ${cell.baseStar ?? 9}</text>
        <text x="${rx + cardW - 10}" y="${ry + 125}" text-anchor="end" dominant-baseline="central" font-size="10" font-weight="bold" fill="#475569">Cặp ${cell.mountainStar ?? '-'}-${cell.waterStar ?? '-'}</text>
      </g>
    `;
  });

  return `
    <svg 
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1040 1040" 
      style="width: 100%; max-width: 680px; height: auto; display: block; margin: 0 auto;"
      shape-rendering="geometricPrecision"
      text-rendering="geometricPrecision"
    >
      <defs>
        <radialGradient id="dialBgMaster" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#FFFDF7" />
          <stop offset="65%" stop-color="#FAF4E5" />
          <stop offset="100%" stop-color="#EADCC2" />
        </radialGradient>
        <filter id="cardShadowMaster" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#0f172a" flood-opacity="0.10" />
        </filter>
        <filter id="arrowGlowRedMaster" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#dc2626" flood-opacity="0.5" />
        </filter>
        <filter id="arrowGlowBlueMaster" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#2563eb" flood-opacity="0.5" />
        </filter>
      </defs>

      <!-- 4 NHÃN PHƯƠNG VỊ NGOẠI VI -->
      <text x="${cx}" y="35" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="900" fill="#dc2626" letter-spacing="1">180° NAM (LY)</text>
      <text x="${cx}" y="1005" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="900" fill="#2563eb" letter-spacing="1">0° BẮC (KHẢM)</text>
      <text x="40" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="900" fill="#059669" letter-spacing="1">90° ĐÔNG</text>
      <text x="1000" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="13" font-weight="900" fill="#b45309" letter-spacing="1">270° TÂY</text>

      <!-- ĐĨA LA KINH & VÀNH 360 ĐỘ HOÀNG GIA -->
      <circle cx="${cx}" cy="${cy}" r="${rPlate + 8}" fill="none" stroke="#FDE68A" stroke-width="7" opacity="0.65" />
      <circle cx="${cx}" cy="${cy}" r="${rPlate + 3}" fill="none" stroke="#F59E0B" stroke-width="5.5" opacity="0.95" />
      <circle cx="${cx}" cy="${cy}" r="${rPlate + 0.5}" fill="none" stroke="#FEF3C7" stroke-width="1.8" opacity="0.9" />
      <circle cx="${cx}" cy="${cy}" r="${rPlate}" fill="url(#dialBgMaster)" stroke="#B38F3F" stroke-width="3" />
      <circle cx="${cx}" cy="${cy}" r="${rTicksOuter}" fill="none" stroke="#D4AF37" stroke-width="2" />
      <circle cx="${cx}" cy="${cy}" r="${rTicksInner}" fill="none" stroke="#C5A059" stroke-width="1.2" />

      <!-- TICKS VÀ ĐỘ SỐ -->
      ${ticksSvg}
      ${degTextSvg}

      <!-- VÀNH 24 SƠN HƯỚNG -->
      <circle cx="${cx}" cy="${cy}" r="${rMountainsInner}" fill="none" stroke="#B38F3F" stroke-width="2" />
      ${mountainsSvg}

      <!-- MŨI TÊN CÁNH PHƯỢNG CHỈ HƯỚNG / TỌA -->
      <g transform="translate(${facingArrowX.toFixed(2)}, ${facingArrowY.toFixed(2)}) rotate(${facingArrowAngle})" filter="url(#arrowGlowRedMaster)">
        <path d="${PHOENIX_ARROW_PATH}" fill="#dc2626" />
      </g>
      <g transform="translate(${sittingArrowX.toFixed(2)}, ${sittingArrowY.toFixed(2)}) rotate(${sittingArrowAngle})" filter="url(#arrowGlowBlueMaster)">
        <path d="${PHOENIX_ARROW_PATH}" fill="#2563eb" />
      </g>

      <!-- TIA NÉT ĐỨT NỐI VÀO MA TRẬN -->
      ${raysSvg}

      <!-- MA TRẬN 3X3 CỬU CUNG -->
      ${cardsSvg}
    </svg>
  `;
}

module.exports = {
  renderFeiXingDialSvg
};
