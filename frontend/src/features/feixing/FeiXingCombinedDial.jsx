import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  X, 
  Move,
  Compass 
} from 'lucide-react';

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

// Thứ tự hiển thị 3x3 Cửu Cung chuẩn Phương Đông (Nam ở trên, Bắc ở dưới)
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
  DAI_CAT: {
    borderColor: '#10b981',
    textColor: '#059669',
    badgeText: 'Tối Cát'
  },
  CAT: {
    borderColor: '#3b82f6',
    textColor: '#2563eb',
    badgeText: 'Tiến Khí / Cát'
  },
  BINH: {
    borderColor: '#94a3b8',
    textColor: '#475569',
    badgeText: 'Bình Hòa'
  },
  HUNG: {
    borderColor: '#ef4444',
    textColor: '#dc2626',
    badgeText: 'Hung'
  },
  DAI_HUNG: {
    borderColor: '#ef4444',
    textColor: '#dc2626',
    badgeText: 'Đại Hung'
  }
};

export default function FeiXingCombinedDial({
  grid = [],
  facingPalace,
  sittingPalace,
  facingMountain,
  sittingMountain,
  onSelectCell
}) {
  const cellMap = {};
  for (const cell of grid) {
    cellMap[cell.palaceKey] = cell;
  }

  // Toạ độ hệ trục SVG (Kích thước chuẩn 1040x1040 để tạo khoảng đệm ngoài thoáng đãng, không đè chữ)
  const cx = 520;
  const cy = 520;
  const BASE_SIZE = 1040;

  // Tính toán ViewBox vector theo scale và pan thực tế:
  // Giúp trình duyệt vẽ lại (vector re-rasterization) 100% sắc nét ở mọi mức thu phóng, triệt tiêu hoàn toàn hiện tượng mờ nhòe của CSS scale()!
  const getComputedViewBox = (s, p) => {
    const curScale = Math.max(1, s || 1);
    const viewW = BASE_SIZE / curScale;
    const viewH = BASE_SIZE / curScale;
    const maxPan = (BASE_SIZE - viewW) / 2;
    const clampedPanX = Math.max(-maxPan, Math.min(maxPan, p?.x || 0));
    const clampedPanY = Math.max(-maxPan, Math.min(maxPan, p?.y || 0));
    const minX = cx - viewW / 2 - clampedPanX;
    const minY = cy - viewH / 2 - clampedPanY;
    return `${minX.toFixed(2)} ${minY.toFixed(2)} ${viewW.toFixed(2)} ${viewH.toFixed(2)}`;
  };

  // Cấu hình Kích thước Thẻ 9 Cung Trung Tâm (Hình 2 phóng to tối ưu)
  const cardW = 140;
  const cardH = 140;
  const cardGap = 8;
  const gridTotalSize = cardW * 3 + cardGap * 2; // 436px
  const gridHalfSize = gridTotalSize / 2; // 218px
  const gridLeft = cx - gridHalfSize; // 302
  const gridTop = cy - gridHalfSize;  // 302

  // Bán kính các vành La Kinh Ngoại Vi (Hình 1 chuẩn tỷ lệ cổ học)
  const rPlate = 430;
  const rTicksOuter = 426;
  const rTicksInner = 384;
  const rMountainsOuter = 384;
  const rMountainsInner = 316;

  // Mũi tên cánh phượng chỉ hướng ngoại vi
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

  // In-place Zoom & Pan State (Tối ưu cho mobile và laptop)
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const pointerStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const hasMovedRef = useRef(false);
  const touchDistRef = useRef(null);
  const touchStartScaleRef = useRef(1);

  // Fullscreen Zoom & Pan State (Chế độ Xem Toàn Màn Hình Cực Đại)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsScale, setFsScale] = useState(1.25);
  const [fsPan, setFsPan] = useState({ x: 0, y: 0 });
  const [isFsDragging, setIsFsDragging] = useState(false);
  const fsContainerRef = useRef(null);
  const fsPointerStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const fsTouchDistRef = useRef(null);
  const fsTouchStartScaleRef = useRef(1.25);

  useEffect(() => {
    if (isFullscreen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setIsFullscreen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prev;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFullscreen]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, Math.round((prev + 0.35) * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, Math.round((prev - 0.35) * 100) / 100);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePointerDown = (e) => {
    if (scale <= 1) return;
    setIsDragging(true);
    hasMovedRef.current = false;
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e) => {
    if (!isDragging || scale <= 1) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }
    const maxPan = (BASE_SIZE - (BASE_SIZE / scale)) / 2;
    const containerWidth = containerRef.current?.clientWidth || 540;
    const currentViewW = BASE_SIZE / scale;
    const ratio = currentViewW / containerWidth;
    const nextX = pointerStartRef.current.panX + dx * ratio;
    const nextY = pointerStartRef.current.panY + dy * ratio;

    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, nextX)),
      y: Math.max(-maxPan, Math.min(maxPan, nextY))
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(1.75);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchDistRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartScaleRef.current = scale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchDistRef.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchDistRef.current;
      const nextScale = Math.min(2.5, Math.max(1, Math.round(touchStartScaleRef.current * factor * 100) / 100));
      setScale(nextScale);
      if (nextScale === 1) setPan({ x: 0, y: 0 });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      touchDistRef.current = null;
    }
  };

  // Fullscreen Handlers
  const handleFsPointerDown = (e) => {
    setIsFsDragging(true);
    hasMovedRef.current = false;
    fsPointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: fsPan.x,
      panY: fsPan.y
    };
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handleFsPointerMove = (e) => {
    if (!isFsDragging) return;
    const dx = e.clientX - fsPointerStartRef.current.x;
    const dy = e.clientY - fsPointerStartRef.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }
    const containerWidth = fsContainerRef.current?.clientWidth || 700;
    const currentViewW = BASE_SIZE / fsScale;
    const ratio = currentViewW / containerWidth;
    const maxPan = (BASE_SIZE - currentViewW) / 2;
    const nextX = fsPointerStartRef.current.panX + dx * ratio;
    const nextY = fsPointerStartRef.current.panY + dy * ratio;

    setFsPan({
      x: Math.max(-maxPan, Math.min(maxPan, nextX)),
      y: Math.max(-maxPan, Math.min(maxPan, nextY))
    });
  };

  const handleFsPointerUp = (e) => {
    setIsFsDragging(false);
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch (_) {}
  };

  const handleFsDoubleClick = () => {
    if (fsScale > 1.1) {
      setFsScale(1.0);
      setFsPan({ x: 0, y: 0 });
    } else {
      setFsScale(1.85);
    }
  };

  const handleFsTouchStart = (e) => {
    if (e.touches.length === 2) {
      fsTouchDistRef.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      fsTouchStartScaleRef.current = fsScale;
    }
  };

  const handleFsTouchMove = (e) => {
    if (e.touches.length === 2 && fsTouchDistRef.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / fsTouchDistRef.current;
      const nextScale = Math.min(3.0, Math.max(0.85, Math.round(fsTouchStartScaleRef.current * factor * 100) / 100));
      setFsScale(nextScale);
    }
  };

  const handleFsTouchEnd = (e) => {
    if (e.touches.length < 2) {
      fsTouchDistRef.current = null;
    }
  };

  const renderSvgContent = (viewBoxStr = "0 0 1040 1040") => (
    <svg 
      viewBox={viewBoxStr} 
      className="w-full h-full drop-shadow-2xl overflow-hidden pointer-events-auto select-none"
      shapeRendering="geometricPrecision"
      textRendering="geometricPrecision"
    >
          <defs>
            {/* Radial Gold Foil Gradient */}
            <radialGradient id="dialBgMaster" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFDF7" />
              <stop offset="65%" stopColor="#FAF4E5" />
              <stop offset="100%" stopColor="#EADCC2" />
            </radialGradient>

            {/* Bóng đổ thẻ Cửu Cung */}
            <filter id="cardShadowMaster" x="-10%" y="-10%" width="120%" height="125%">
              <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>

            {/* Bóng đổ quầng sáng mũi tên Hướng & Tọa */}
            <filter id="arrowGlowRedMaster" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#dc2626" floodOpacity="0.5" />
            </filter>
            <filter id="arrowGlowBlueMaster" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2563eb" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* ======================================================== */}
          {/* LỚP 1: 4 NHÃN PHƯƠNG VỊ CHÍNH NGOẠI VI (HÌNH 1)          */}
          {/* ======================================================== */}
          <text x={cx} y={35} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" fill="#dc2626" className="tracking-wider">
            180° NAM (LY)
          </text>
          <text x={cx} y={1005} textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="900" fill="#2563eb" className="tracking-wider">
            0° BẮC (KHẢM)
          </text>
          <text x={40} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="900" fill="#059669" className="tracking-wider">
            90° ĐÔNG
          </text>
          <text x={1000} y={cy} textAnchor="middle" dominantBaseline="central" fontSize="13" fontWeight="900" fill="#b45309" className="tracking-wider">
            270° TÂY
          </text>

          {/* ======================================================== */}
          {/* LỚP 2: ĐĨA LA KINH NGOẠI VI & VÀNH 360 ĐỘ (VIỀN VÀNG HOÀNG GIA CHUẨN INPUT) */}
          {/* ======================================================== */}
          {/* 1. Vòng hào quang vàng nhạt ngoài cùng (tương đương ring-4 ring-amber-200/50 ở phần input) */}
          <circle
            cx={cx}
            cy={cy}
            r={rPlate + 8}
            fill="none"
            stroke="#FDE68A"
            strokeWidth="7"
            opacity="0.65"
          />

          {/* 2. Đai viền vàng kim hoàng gia rực rỡ (tương đương border-4 border-amber-400 ở phần input) */}
          <circle
            cx={cx}
            cy={cy}
            r={rPlate + 3}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="5.5"
            opacity="0.95"
          />

          {/* 3. Vòng sáng vàng kim ánh kim (highlight lấp lánh bên trong) */}
          <circle
            cx={cx}
            cy={cy}
            r={rPlate + 0.5}
            fill="none"
            stroke="#FEF3C7"
            strokeWidth="1.8"
            opacity="0.9"
          />

          {/* 4. Thân đĩa La Kinh phong thủy cổ học với viền đồng thau cổ điển (#B38F3F) */}
          <circle
            cx={cx}
            cy={cy}
            r={rPlate}
            fill="url(#dialBgMaster)"
            stroke="#B38F3F"
            strokeWidth="3"
          />

          {/* 5. Vòng chỉ giới 360 độ vàng hổ phách (tương đương r=212 stroke="#D4AF37" ở phần input) */}
          <circle
            cx={cx}
            cy={cy}
            r={rTicksOuter}
            fill="none"
            stroke="#D4AF37"
            strokeWidth="2"
          />

          {/* Vòng phân ranh giới độ số & 24 sơn */}
          <circle cx={cx} cy={cy} r={rTicksInner} fill="none" stroke="#C5A059" strokeWidth="1.2" />

          {/* Ticks 360 độ (mỗi 1°, 5°, 15°, 45°) */}
          {Array.from({ length: 360 }, (_, deg) => {
            if (deg % 5 !== 0 && deg % 1 !== 0) return null;
            const is45 = deg % 45 === 0;
            const is15 = deg % 15 === 0;
            const is5 = deg % 5 === 0;
            const rad = (((deg + 90) % 360) * Math.PI) / 180;
            const rStart = is45 ? 400 : is15 ? 404 : is5 ? 408 : 414;
            const rEnd = rTicksOuter;

            return (
              <line
                key={`master-tick-${deg}`}
                x1={cx + rStart * Math.cos(rad)}
                y1={cy + rStart * Math.sin(rad)}
                x2={cx + rEnd * Math.cos(rad)}
                y2={cy + rEnd * Math.sin(rad)}
                stroke={is45 ? '#b45309' : is15 ? '#78350f' : is5 ? '#92400e' : '#D4AF37'}
                strokeWidth={is45 ? '1.8' : is15 ? '1.2' : is5 ? '0.8' : '0.4'}
              />
            );
          })}

          {/* Nhãn Độ Số mỗi 30° độc lập */}
          {Array.from({ length: 12 }, (_, i) => i * 30).map((deg) => {
            const rad = (((deg + 90) % 360) * Math.PI) / 180;
            const textX = cx + 394 * Math.cos(rad);
            const textY = cy + 394 * Math.sin(rad);

            return (
              <text
                key={`master-deg-${deg}`}
                x={textX}
                y={textY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="9.5"
                fontWeight="bold"
                fill="#78350f"
                className="select-none font-mono"
              >
                {deg}°
              </text>
            );
          })}

          {/* ======================================================== */}
          {/* LỚP 3: VÀNH 24 SƠN HƯỚNG (HÌNH 1 - R = 316 đến 384)       */}
          {/* ======================================================== */}
          <circle cx={cx} cy={cy} r={rMountainsInner} fill="none" stroke="#B38F3F" strokeWidth="2" />

          {TWENTY_FOUR_MOUNTAINS.map((m, idx) => {
            const centerRad = (((m.center + 90) % 360) * Math.PI) / 180;
            const dividerDeg = (m.center - 7.5 + 360) % 360;
            const dividerRad = (((dividerDeg + 90) % 360) * Math.PI) / 180;
            const isPalaceBoundary = dividerDeg % 45 === 22.5;

            const isFacingM = m.name === facingMountain;
            const isSittingM = m.name === sittingMountain;

            const textX = cx + 348 * Math.cos(centerRad);
            const textY = cy + 348 * Math.sin(centerRad);

            const dotX = cx + 371 * Math.cos(centerRad);
            const dotY = cy + 371 * Math.sin(centerRad);

            return (
              <g key={`master-mountain-${idx}`}>
                {/* Vạch phân chia 24 sơn */}
                <line
                  x1={cx + rMountainsInner * Math.cos(dividerRad)}
                  y1={cy + rMountainsInner * Math.sin(dividerRad)}
                  x2={cx + rMountainsOuter * Math.cos(dividerRad)}
                  y2={cy + rMountainsOuter * Math.sin(dividerRad)}
                  stroke={isPalaceBoundary ? '#b45309' : '#E2CCA0'}
                  strokeWidth={isPalaceBoundary ? '1.8' : '0.8'}
                />

                {/* Quầng sáng nổi bật nếu là Sơn Hướng hoặc Sơn Tọa của căn nhà */}
                {isFacingM && (
                  <circle cx={textX} cy={textY} r="16.5" fill="#fee2e2" stroke="#dc2626" strokeWidth="2.2" />
                )}
                {isSittingM && (
                  <circle cx={textX} cy={textY} r="16.5" fill="#e0e7ff" stroke="#2563eb" strokeWidth="2.2" />
                )}

                {/* Chấm màu Ngũ Hành */}
                <circle cx={dotX} cy={dotY} r="3.2" fill={m.color} />

                {/* Tên Sơn */}
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isFacingM || isSittingM ? "15.5" : "14"}
                  fontWeight={isFacingM || isSittingM ? "900" : "bold"}
                  fill={isFacingM ? "#dc2626" : isSittingM ? "#2563eb" : "#334155"}
                  className="select-none"
                >
                  {m.name}
                </text>
              </g>
            );
          })}

          {/* ======================================================== */}
          {/* LỚP 4: 2 MŨI TÊN CÁNH PHƯỢNG CHỈ HƯỚNG/TỌA NGOÀI VÀNH     */}
          {/* ======================================================== */}
          {/* Mũi tên ĐỎ chỉ HƯỚNG */}
          <g 
            transform={`translate(${facingArrowX}, ${facingArrowY}) rotate(${facingArrowAngle})`}
            filter="url(#arrowGlowRedMaster)"
          >
            <path
              d="M 0 -13 
                 C -1 -11, -2 -9.5, -4.5 -7 
                 C -7 -4.5, -11 -2.5, -15 -2 
                 C -15.3 -2, -15.5 -1.7, -15.5 -1.3 
                 C -15.5 -0.7, -15.2 0, -14.7 0 
                 C -11 -0.3, -7.5 -2, -5 -4 
                 C -4.7 -2.5, -4 1, -2.5 1 
                 C -1 1, -0.3 -2.5, 0 -4 
                 C 2.5 -2, 6 -0.3, 9.7 0 
                 C 10.2 0, 10.5 -0.7, 10.5 -1.3 
                 C 10.5 -1.7, 10.3 -2, 10 -2 
                 C 6 -2.5, 2 -4.5, -0.5 -7 
                 C -1.5 -9.5, -1 -11, 0 -13 Z"
              fill="#dc2626"
            />
          </g>

          {/* Mũi tên XANH DƯƠNG chỉ TỌA */}
          <g 
            transform={`translate(${sittingArrowX}, ${sittingArrowY}) rotate(${sittingArrowAngle})`}
            filter="url(#arrowGlowBlueMaster)"
          >
            <path
              d="M 0 -13 
                 C -1 -11, -2 -9.5, -4.5 -7 
                 C -7 -4.5, -11 -2.5, -15 -2 
                 C -15.3 -2, -15.5 -1.7, -15.5 -1.3 
                 C -15.5 -0.7, -15.2 0, -14.7 0 
                 C -11 -0.3, -7.5 -2, -5 -4 
                 C -4.7 -2.5, -4 1, -2.5 1 
                 C -1 1, -0.3 -2.5, 0 -4 
                 C 2.5 -2, 6 -0.3, 9.7 0 
                 C 10.2 0, 10.5 -0.7, 10.5 -1.3 
                 C 10.5 -1.7, 10.3 -2, 10 -2 
                 C 6 -2.5, 2 -4.5, -0.5 -7 
                 C -1.5 -9.5, -1 -11, 0 -13 Z"
              fill="#2563eb"
            />
          </g>

          {/* ======================================================== */}
          {/* LỚP 5: CÁC VẠCH NÉT ĐỨT NỐI TỪ 24 SƠN VÀO LƯỚI MA TRẬN   */}
          {/* ======================================================== */}
          {(() => {
            const boundaryDegs = Array.from({ length: 24 }, (_, i) => 7.5 + i * 15);
            const centerDegs = [0, 45, 90, 135, 180, 225, 270, 315];
            const palaceDivisions = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

            const allRays = [
              ...boundaryDegs.map((deg) => ({
                deg,
                isPalaceBoundary: palaceDivisions.includes(deg),
                isCenter: false
              })),
              ...centerDegs.map((deg) => ({
                deg,
                isPalaceBoundary: false,
                isCenter: true
              }))
            ];

            return allRays.map(({ deg, isPalaceBoundary, isCenter: isRayCenter }) => {
              const rad = (((deg + 90) % 360) * Math.PI) / 180;
              const maxCosSin = Math.max(Math.abs(Math.cos(rad)), Math.abs(Math.sin(rad)));
              const rInner = (gridHalfSize + 2) / maxCosSin;

              // Chỉ vẽ tia khi điểm xuất phát nằm trong khoảng đệm giữa ma trận và vành 24 sơn
              if (rInner >= rMountainsInner - 3) return null;

              const x1 = cx + rInner * Math.cos(rad);
              const y1 = cy + rInner * Math.sin(rad);
              const x2 = cx + rMountainsInner * Math.cos(rad);
              const y2 = cy + rMountainsInner * Math.sin(rad);

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

              return (
                <line
                  key={`ray-${deg}-${isRayCenter ? 'ctr' : 'bnd'}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  opacity={opacity}
                />
              );
            });
          })()}

          {/* ======================================================== */}
          {/* LỚP 6: MA TRẬN 3X3 CỬU CUNG LẠC THƯ (HÌNH 2)              */}
          {/* ======================================================== */}
          {GRID_CELLS_LAYOUT.map((pos) => {
            const cell = cellMap[pos.key];
            const rx = gridLeft + pos.col * (cardW + cardGap);
            const ry = gridTop + pos.row * (cardH + cardGap);

            const isFacing = cell && cell.palaceName === facingPalace;
            const isSitting = cell && cell.palaceName === sittingPalace;
            const isCenter = pos.key === 'TRUNG';

            const cfg = cell ? (AUSPICIOUS_CONFIG[cell.auspiciousLevel] || AUSPICIOUS_CONFIG.BINH) : AUSPICIOUS_CONFIG.BINH;

            const cxCard = rx + cardW / 2;
            const hasTopGap = isFacing || isSitting;
            const gapHalf = isFacing ? 25 : isSitting ? 19 : 0;

            // Đường viền bo tròn có khe hở ở giữa đỉnh để chữ HƯỚNG / TỌA chia đôi viền tự nhiên
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

            return (
              <g
                key={`master-card-${pos.key}`}
                className="cursor-pointer transition-transform hover:opacity-95"
                onClick={() => {
                  if (hasMovedRef.current) return;
                  if (cell && onSelectCell) onSelectCell(cell);
                }}
              >
                {/* 1. Lòng thẻ trắng chuẩn mực có bóng đổ */}
                <rect
                  x={rx}
                  y={ry}
                  width={cardW}
                  height={cardH}
                  rx="16"
                  fill="#FFFFFF"
                  stroke={hasTopGap ? "none" : cfg.borderColor}
                  strokeWidth={hasTopGap ? "0" : "1.8"}
                  filter="url(#cardShadowMaster)"
                />

                {/* 2. Viền thẻ bo tròn: nếu là Hướng/Tọa thì dùng path có khe hở, viền tự dừng 2 bên chữ */}
                {hasTopGap && (
                  <path
                    d={borderPath}
                    fill="none"
                    stroke={cfg.borderColor}
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* 3. Chữ HƯỚNG hoặc TỌA: Không dùng bất kỳ ô nền nào, viền ô chia đôi chữ tuyệt đối */}
                {isFacing && (
                  <text
                    x={cxCard}
                    y={ry}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="900"
                    fill="#dc2626"
                    className="tracking-widest select-none font-sans"
                  >
                    HƯỚNG
                  </text>
                )}
                {isSitting && (
                  <text
                    x={cxCard}
                    y={ry}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="11"
                    fontWeight="900"
                    fill="#2563eb"
                    className="tracking-widest select-none font-sans"
                  >
                    TỌA
                  </text>
                )}

                {/* --- HÀNG ĐỈNH TRONG THẺ: SƠN TINH - CÁT HUNG (BỎ HẾT NỀN) - HƯỚNG TINH --- */}
                {cell && (
                  <g>
                    {/* Góc Trái: SƠN Tinh */}
                    <text x={rx + 9} y={ry + 13} fontSize="8" fontWeight="bold" fill="#4338ca">
                      SƠN
                    </text>
                    <text x={rx + 9} y={ry + 30} fontSize="21" fontWeight="900" fill="#1e1b4b">
                      {cell.mountainStar}
                    </text>
                    <text
                      x={rx + 24}
                      y={ry + 30}
                      fontSize="12"
                      fontWeight="900"
                      fill={cell.mountainFlight === 'FORWARD' ? '#16a34a' : '#dc2626'}
                    >
                      {cell.mountainFlight === 'FORWARD' ? '↗' : '↘'}
                    </text>

                    {/* Trung Tâm Đỉnh: Trạng thái Cát Hung (BỎ HẾT NỀN THEO YÊU CẦU NGƯỜI DÙNG) */}
                    <text
                      x={rx + cardW / 2}
                      y={ry + 18}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="9.5"
                      fontWeight="800"
                      fill={cfg.textColor}
                      className="select-none tracking-wide"
                    >
                      {cfg.badgeText}
                    </text>

                    {/* Góc Phải: HƯỚNG Tinh */}
                    <text x={rx + cardW - 9} y={ry + 13} textAnchor="end" fontSize="8" fontWeight="bold" fill="#be123c">
                      HƯỚNG
                    </text>
                    <text x={rx + cardW - 22} y={ry + 30} textAnchor="end" fontSize="21" fontWeight="900" fill="#881337">
                      {cell.waterStar}
                    </text>
                    <text
                      x={rx + cardW - 8}
                      y={ry + 30}
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="900"
                      fill={cell.waterFlight === 'FORWARD' ? '#16a34a' : '#dc2626'}
                    >
                      {cell.waterFlight === 'FORWARD' ? '↗' : '↘'}
                    </text>
                  </g>
                )}

                {/* --- TRUNG TÂM THẺ: TÊN CUNG QUÁI & HƯỚNG (BỎ DẤU NGOẶC ĐƠN) & VẬN TINH --- */}
                {isCenter ? (
                  <g>
                    <text
                      x={rx + cardW / 2}
                      y={ry + 60}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="16"
                      fontWeight="900"
                      fill="#0f172a"
                    >
                      Trung Cung
                    </text>
                    <text
                      x={rx + cardW / 2}
                      y={ry + 85}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#78350f"
                    >
                      Vận Tinh: <tspan fontWeight="900" fontSize="13" fill="#451a03">{cell?.periodStar}</tspan>
                    </text>
                  </g>
                ) : (
                  <g>
                    {/* Tên Quẻ (Ly, Khảm, Tốn...) */}
                    <text
                      x={rx + cardW / 2}
                      y={ry + 54}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="17"
                      fontWeight="900"
                      fill="#0f172a"
                    >
                      {cell?.palaceName}
                    </text>
                    {/* Hướng Địa Lý (BỎ HOÀN TOÀN DẤU NGOẶC ĐƠN ()) */}
                    {cell?.directionName && cell.directionName !== 'Trung Tâm' && (
                      <text
                        x={rx + cardW / 2}
                        y={ry + 72}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="11.5"
                        fontWeight="700"
                        fill="#64748b"
                      >
                        {cell.directionName}
                      </text>
                    )}
                    {/* Vận Tinh */}
                    <text
                      x={rx + cardW / 2}
                      y={ry + 89}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#78350f"
                    >
                      Vận Tinh: <tspan fontWeight="900" fontSize="13" fill="#451a03">{cell?.periodStar}</tspan>
                    </text>
                  </g>
                )}

                {/* --- ĐÁY THẺ: ĐƯỜNG KẺ NGĂN CÁCH & NGUYÊN LONG / CẶP SƠN HƯỚNG --- */}
                {cell && (
                  <g>
                    <line
                      x1={rx + 9}
                      y1={ry + 110}
                      x2={rx + cardW - 9}
                      y2={ry + 110}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                    />
                    <text
                      x={rx + 10}
                      y={ry + 125}
                      dominantBaseline="central"
                      fontSize="9.5"
                      fill="#94a3b8"
                    >
                      Nguyên: {cell.baseStar || 9}
                    </text>
                    <text
                      x={rx + cardW - 10}
                      y={ry + 125}
                      textAnchor="end"
                      dominantBaseline="central"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#475569"
                    >
                      Cặp {cell.mountainStar}-{cell.waterStar}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
  );

  return (
    <div className="w-full flex flex-col items-center select-none font-sans">
      {/* 1. THANH ĐIỀU KHIỂN THU PHÓNG (Nằm bên ngoài, ở đỉnh Tinh Bàn - Hoàn toàn không che lấp bất kỳ chi tiết nào của đĩa La Kinh) */}
      <div className="w-full max-w-[540px] sm:max-w-[580px] lg:max-w-[620px] flex items-center justify-between gap-2 px-1 mb-2.5">
        <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold bg-amber-50/90 border border-amber-200/90 px-3 py-1.5 rounded-xl shadow-sm">
          <Compass className="w-4 h-4 text-amber-700" />
          <span>La Kinh 24 Sơn Hướng</span>
        </div>

        {/* Thanh Công Cụ Phóng To Thu Nhỏ Nằm Ngoài Đĩa */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-2xl bg-white border border-amber-300 shadow-sm">
          {/* Nút Phóng To (+) */}
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 2.5}
            title="Phóng to tinh bàn"
            className="p-1.5 sm:p-2 rounded-xl text-amber-900 hover:bg-amber-100 active:bg-amber-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <ZoomIn className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Chỉ số phóng to (%) */}
          <span className="text-[10px] sm:text-xs font-black text-amber-900 px-1 font-mono min-w-[36px] sm:min-w-[40px] text-center select-none">
            {Math.round(scale * 100)}%
          </span>

          {/* Nút Thu Nhỏ (-) */}
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            title="Thu nhỏ tinh bàn"
            className="p-1.5 sm:p-2 rounded-xl text-amber-900 hover:bg-amber-100 active:bg-amber-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
          >
            <ZoomOut className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Nút Khôi phục 100% */}
          {(scale > 1 || pan.x !== 0 || pan.y !== 0) && (
            <button
              type="button"
              onClick={handleResetZoom}
              title="Khôi phục 100%"
              className="p-1.5 sm:p-2 rounded-xl text-amber-800 hover:bg-amber-100 active:bg-amber-200 transition border-l border-amber-200 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* Nút Toàn Màn Hình */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            title="Xem toàn màn hình (Phóng to cực đại)"
            className="p-1.5 sm:p-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold transition shadow-sm flex items-center gap-1 ml-0.5 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline text-xs font-semibold">Toàn màn hình</span>
          </button>
        </div>
      </div>

      {/* 2. Vành La Kinh Bát Quái Hoàng Gia Kết Hợp Tinh Bàn Cửu Cung */}
      <div 
        ref={containerRef}
        className={`relative w-full max-w-[540px] sm:max-w-[580px] lg:max-w-[620px] aspect-square flex items-center justify-center mx-auto rounded-3xl transition-all shadow-md shadow-amber-950/5 ${
          scale > 1 
            ? 'overflow-hidden border-2 border-amber-400 cursor-grab active:cursor-grabbing' 
            : 'overflow-hidden'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        {/* Vector SVG Native ViewBox Container: Vẽ lại 100% độ nét vector gốc, triệt tiêu hoàn toàn mờ nhòe */}
        <div 
          className="w-full h-full flex items-center justify-center select-none"
          style={{
            touchAction: scale > 1 ? 'none' : 'auto'
          }}
        >
          {renderSvgContent(getComputedViewBox(scale, pan))}
        </div>
      </div>

      {/* Trạng thái hướng dẫn kéo / hint khi đang zoom */}
      {scale > 1 && (
        <div className="flex items-center gap-1.5 mt-2.5 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full animate-in fade-in">
          <Move className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>Vuốt để di chuyển các cung • {Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={handleResetZoom}
            className="underline font-bold text-amber-900 ml-1.5 hover:text-amber-700 cursor-pointer"
          >
            Khôi phục 100%
          </button>
        </div>
      )}

      {/* Gợi ý phóng to nhanh trên Mobile */}
      {scale === 1 && (
        <div className="sm:hidden flex items-center gap-2 mt-2 text-[10.5px] text-slate-500">
          <span className="inline-flex items-center gap-1 bg-amber-50/80 border border-amber-200/80 text-amber-800 px-2.5 py-0.5 rounded-full font-medium">
            <ZoomIn className="w-3 h-3 text-amber-600" />
            Chạm 2 lần hoặc dùng nút (+) để phóng to
          </span>
        </div>
      )}

      {/* Chú giải chân trang đồ hình */}
      <div className="w-full max-w-[760px] mt-2 px-3.5 py-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-slate-700 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1.5 font-bold text-red-700 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shadow-sm"></span> Hướng: Sơn {facingMountain} ({facingPalace})
          </span>
          <span className="flex items-center gap-1.5 font-bold text-blue-700 whitespace-nowrap">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shadow-sm"></span> Tọa: Sơn {sittingMountain} ({sittingPalace})
          </span>
        </div>
        <div className="text-[11px] text-slate-500 italic text-center sm:text-right">
          * Nhấp vào từng ô để xem chi tiết bố trí & hóa giải
        </div>
      </div>

      {/* Fullscreen Zoom Modal (Portal to body) */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col font-sans select-none animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          {/* Header Fullscreen - Light Luxury Đồng Bộ Toàn Hệ Thống */}
          <div className="w-full px-4 py-3 bg-white/95 border-b border-amber-200/90 flex items-center justify-between gap-3 shrink-0 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-amber-900 font-black text-sm sm:text-base flex items-center gap-1.5">
                  <Compass className="w-5 h-5 text-amber-700" />
                  Tinh Bàn Cửu Cung Master (Toàn Màn Hình)
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-mono font-black border border-amber-300">
                  {Math.round(fsScale * 100)}%
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 hidden xs:block">
                Dùng nút (+ / -) hoặc chụm 2 ngón tay để phóng to • Kéo để khám phá từng cung
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFsScale((s) => Math.min(3.0, Math.round((s + 0.35) * 100) / 100))}
                disabled={fsScale >= 3.0}
                title="Phóng to"
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setFsScale((s) => Math.max(1.0, Math.round((s - 0.35) * 100) / 100))}
                disabled={fsScale <= 1.0}
                title="Thu nhỏ"
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 border border-amber-300 transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => { setFsScale(1.0); setFsPan({ x: 0, y: 0 }); }}
                title="Khôi phục 100%"
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-800 border border-amber-300 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                title="Đóng chế độ toàn màn hình"
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition ml-1 flex items-center gap-1 px-3 cursor-pointer font-bold"
              >
                <X className="w-4 h-4" />
                <span className="text-xs hidden sm:inline">Đóng</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Viewport Area */}
          <div 
            ref={fsContainerRef}
            className="flex-1 w-full relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing touch-none p-2 sm:p-4 bg-amber-50/40"
            onPointerDown={handleFsPointerDown}
            onPointerMove={handleFsPointerMove}
            onPointerUp={handleFsPointerUp}
            onPointerCancel={handleFsPointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={handleFsDoubleClick}
          >
            <div 
              className="w-[92vw] h-[92vw] max-w-[700px] max-h-[700px] flex items-center justify-center select-none"
            >
              {renderSvgContent(getComputedViewBox(fsScale, fsPan))}
            </div>
          </div>

          {/* Bottom Bar Fullscreen */}
          <div className="w-full px-4 py-2.5 bg-white/95 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 shadow-sm">
            <div className="flex items-center gap-3 text-slate-700 text-[11px] sm:text-xs">
              <span className="flex items-center gap-1 text-red-700 font-bold">
                ● Hướng: Sơn {facingMountain} ({facingPalace})
              </span>
              <span className="flex items-center gap-1 text-blue-700 font-bold">
                ● Tọa: Sơn {sittingMountain} ({sittingPalace})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              * Nhấp vào ô bất kỳ để xem chi tiết bố trí & hóa giải
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
