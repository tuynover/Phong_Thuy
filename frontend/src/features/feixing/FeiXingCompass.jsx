import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  RotateCw, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Navigation,
  Minus,
  Plus
} from 'lucide-react';

const TWENTY_FOUR_MOUNTAINS = [
  { name: 'Tý', palace: 'Khảm', long: 'Thiên', sign: '-', center: 0, min: 352.5, max: 7.5, element: 'Thủy', color: '#2563eb' },
  { name: 'Quý', palace: 'Khảm', long: 'Nhân', sign: '-', center: 15, min: 7.5, max: 22.5, element: 'Thủy', color: '#2563eb' },
  { name: 'Sửu', palace: 'Cấn', long: 'Địa', sign: '-', center: 30, min: 22.5, max: 37.5, element: 'Thổ', color: '#d97706' },
  { name: 'Cấn', palace: 'Cấn', long: 'Thiên', sign: '+', center: 45, min: 37.5, max: 52.5, element: 'Thổ', color: '#d97706' },
  { name: 'Dần', palace: 'Cấn', long: 'Nhân', sign: '+', center: 60, min: 52.5, max: 67.5, element: 'Mộc', color: '#16a34a' },
  { name: 'Giáp', palace: 'Chấn', long: 'Địa', sign: '+', center: 75, min: 67.5, max: 82.5, element: 'Mộc', color: '#16a34a' },
  { name: 'Mão', palace: 'Chấn', long: 'Thiên', sign: '-', center: 90, min: 82.5, max: 97.5, element: 'Mộc', color: '#16a34a' },
  { name: 'Ất', palace: 'Chấn', long: 'Nhân', sign: '-', center: 105, min: 97.5, max: 112.5, element: 'Mộc', color: '#16a34a' },
  { name: 'Thìn', palace: 'Tốn', long: 'Địa', sign: '-', center: 120, min: 112.5, max: 127.5, element: 'Thổ', color: '#d97706' },
  { name: 'Tốn', palace: 'Tốn', long: 'Thiên', sign: '+', center: 135, min: 127.5, max: 142.5, element: 'Mộc', color: '#16a34a' },
  { name: 'Tị', palace: 'Tốn', long: 'Nhân', sign: '+', center: 150, min: 142.5, max: 157.5, element: 'Hỏa', color: '#dc2626' },
  { name: 'Bính', palace: 'Ly', long: 'Địa', sign: '+', center: 165, min: 157.5, max: 172.5, element: 'Hỏa', color: '#dc2626' },
  { name: 'Ngọ', palace: 'Ly', long: 'Thiên', sign: '-', center: 180, min: 172.5, max: 187.5, element: 'Hỏa', color: '#dc2626' },
  { name: 'Đinh', palace: 'Ly', long: 'Nhân', sign: '-', center: 195, min: 187.5, max: 202.5, element: 'Hỏa', color: '#dc2626' },
  { name: 'Mùi', palace: 'Khôn', long: 'Địa', sign: '-', center: 210, min: 202.5, max: 217.5, element: 'Thổ', color: '#d97706' },
  { name: 'Khôn', palace: 'Khôn', long: 'Thiên', sign: '+', center: 225, min: 217.5, max: 232.5, element: 'Thổ', color: '#d97706' },
  { name: 'Thân', palace: 'Khôn', long: 'Nhân', sign: '+', center: 240, min: 232.5, max: 247.5, element: 'Kim', color: '#b45309' },
  { name: 'Canh', palace: 'Đoài', long: 'Địa', sign: '+', center: 255, min: 247.5, max: 262.5, element: 'Kim', color: '#b45309' },
  { name: 'Dậu', palace: 'Đoài', long: 'Thiên', sign: '-', center: 270, min: 262.5, max: 277.5, element: 'Kim', color: '#b45309' },
  { name: 'Tân', palace: 'Đoài', long: 'Nhân', sign: '-', center: 285, min: 277.5, max: 292.5, element: 'Kim', color: '#b45309' },
  { name: 'Tuất', palace: 'Càn', long: 'Địa', sign: '-', center: 300, min: 292.5, max: 307.5, element: 'Thổ', color: '#d97706' },
  { name: 'Càn', palace: 'Càn', long: 'Thiên', sign: '+', center: 315, min: 307.5, max: 322.5, element: 'Kim', color: '#b45309' },
  { name: 'Hợi', palace: 'Càn', long: 'Nhân', sign: '+', center: 330, min: 322.5, max: 337.5, element: 'Thủy', color: '#2563eb' },
  { name: 'Nhâm', palace: 'Khảm', long: 'Địa', sign: '+', center: 345, min: 337.5, max: 352.5, element: 'Thủy', color: '#2563eb' }
];

// 8 Quẻ Bát Quái Hậu Thiên (Hậu Thiên Bát Quái: Ly Nam ở trên, Khảm Bắc ở dưới)
const EIGHT_TRIGRAMS = [
  { key: 'LY', name: 'Ly', symbol: '☲', degree: 180, direction: 'Nam', element: 'Hỏa', color: '#dc2626' },
  { key: 'KHON', name: 'Khôn', symbol: '☷', degree: 225, direction: 'Tây Nam', element: 'Thổ', color: '#d97706' },
  { key: 'DOAI', name: 'Đoài', symbol: '☱', degree: 270, direction: 'Tây', element: 'Kim', color: '#b45309' },
  { key: 'CAN', name: 'Càn', symbol: '☰', degree: 315, direction: 'Tây Bắc', element: 'Kim', color: '#b45309' },
  { key: 'KHAM', name: 'Khảm', symbol: '☵', degree: 0, direction: 'Bắc', element: 'Thủy', color: '#2563eb' },
  { key: 'CAN_NE', name: 'Cấn', symbol: '☶', degree: 45, direction: 'Đông Bắc', element: 'Thổ', color: '#d97706' },
  { key: 'CHAN', name: 'Chấn', symbol: '☳', degree: 90, direction: 'Đông', element: 'Mộc', color: '#16a34a' },
  { key: 'TON', name: 'Tốn', symbol: '☴', degree: 135, direction: 'Đông Nam', element: 'Mộc', color: '#16a34a' }
];

const QUICK_DIRECTIONS = [
  { name: 'Nam (Ly)', deg: 180 },
  { name: 'Tây Nam (Khôn)', deg: 225 },
  { name: 'Tây (Đoài)', deg: 270 },
  { name: 'Tây Bắc (Càn)', deg: 315 },
  { name: 'Bắc (Khảm)', deg: 0 },
  { name: 'Đông Bắc (Cấn)', deg: 45 },
  { name: 'Đông (Chấn)', deg: 90 },
  { name: 'Đông Nam (Tốn)', deg: 135 }
];

const getAngularDist = (a1, a2) => {
  let diff = Math.abs(a1 - a2) % 360;
  return diff > 180 ? 360 - diff : diff;
};

const getMountainFromDegree = (degree) => {
  const deg = ((degree % 360) + 360) % 360;
  for (const m of TWENTY_FOUR_MOUNTAINS) {
    const isInside = m.min > m.max ? (deg >= m.min || deg < m.max) : (deg >= m.min && deg < m.max);
    if (isInside) {
      const dev = getAngularDist(deg, m.center);
      let type = 'CHINH_HUONG';
      if (dev > 6.0) {
        const dMin = getAngularDist(deg, m.min);
        const dMax = getAngularDist(deg, m.max);
        const bound = dMin < dMax ? m.min : m.max;
        const isPalaceBoundary = Math.abs((bound % 45) - 22.5) < 0.1;
        type = isPalaceBoundary ? 'DAI_KHONG_VONG' : 'TIEU_KHONG_VONG';
      } else if (dev >= 3.0) {
        type = 'KIEM_HUONG';
      }
      return { mountain: m, deviation: dev, type };
    }
  }
  return { mountain: TWENTY_FOUR_MOUNTAINS[0], deviation: 0, type: 'CHINH_HUONG' };
};

export default function FeiXingCompass({ value = 180, onChange }) {
  const [degree, setDegree] = useState(value);
  const compassRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setDegree(value);
  }, [value]);

  const updateDegree = useCallback((newDeg) => {
    const normalized = Math.round((((newDeg % 360) + 360) % 360) * 10) / 10;
    setDegree(normalized);
    if (onChange) onChange(normalized);
  }, [onChange]);

  // Pointer drag handler
  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current || !compassRef.current) return;
    const rect = compassRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - centerX;
    const deltaY = clientY - centerY;
    const rad = Math.atan2(deltaY, deltaX);
    let deg = rad * (180 / Math.PI) - 90;
    deg = ((deg % 360) + 360) % 360;
    updateDegree(deg);
  }, [updateDegree]);

  const handlePointerDown = (e) => {
    isDragging.current = true;
    handlePointerMove(e);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('touchmove', handlePointerMove);
    window.removeEventListener('touchend', handlePointerUp);
  };

  const currentFacing = getMountainFromDegree(degree);
  const currentSitting = getMountainFromDegree((degree + 180) % 360);

  // Tính góc xoay của kim và xác định khi nào chữ bị quay ngược để tự đảo chiều 180 độ
  const needleRotation = degree - 180;
  const normRot = ((needleRotation % 360) + 360) % 360;
  const isUpsideDown = normRot > 90 && normRot < 270;

  const getStatusBadge = () => {
    switch (currentFacing.type) {
      case 'CHINH_HUONG':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Chính Hướng (Thuần Khí: Lệch {currentFacing.deviation.toFixed(1)}°)
          </span>
        );
      case 'KIEM_HUONG':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Kiêm Hướng (Thế Quái Bàn: Lệch {currentFacing.deviation.toFixed(1)}°)
          </span>
        );
      case 'TIEU_KHONG_VONG':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 shadow-sm animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Tiểu Không Vong (Tạp Khí)
          </span>
        );
      case 'DAI_KHONG_VONG':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-950 border border-purple-300 shadow-sm animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
            Đại Không Vong (Tuyến Tuyệt Mạng)
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xl mx-auto select-none font-sans">
      
      {/* Imperial Luo Pan (La Kinh Bát Quái) - Khung Chứa Thích Ứng Chống Tràn Tuyệt Đối */}
      <div className="relative px-8 sm:px-12 py-6 sm:py-7 flex items-center justify-center overflow-visible">
        {/* Vòng Quay La Kinh Bát Quái - Chuẩn Cổ Học: Nam Ly 180° ở trên, Bắc Khảm 0° ở dưới */}
        <div 
          ref={compassRef}
          onPointerDown={handlePointerDown}
          className="relative w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] shrink-0 cursor-grab active:cursor-grabbing touch-none rounded-full bg-gradient-to-br from-[#FFFDF8] via-[#FAF5E8] to-[#F3E8D6] border-4 border-amber-400 shadow-2xl shadow-amber-950/15 flex items-center justify-center ring-4 ring-amber-200/50"
        >
          {/* Cardinal Direction Labels (4 nhãn phương vị thanh lịch không nền, không dính vòng, không tràn viền) */}
          <div className="absolute -top-6 sm:-top-7 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-600 pointer-events-none whitespace-nowrap select-none drop-shadow-sm">
            180° NAM (LY)
          </div>
          <div className="absolute -bottom-6 sm:-bottom-7 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-black uppercase tracking-wider text-blue-700 pointer-events-none whitespace-nowrap select-none drop-shadow-sm">
            0° BẮC (KHẢM)
          </div>
          <div className="absolute top-1/2 right-full mr-3 sm:mr-4 -translate-y-1/2 text-[9.5px] sm:text-xs font-black uppercase tracking-wider text-emerald-700 pointer-events-none whitespace-nowrap select-none drop-shadow-sm">
            90° ĐÔNG
          </div>
          <div className="absolute top-1/2 left-full ml-3 sm:ml-4 -translate-y-1/2 text-[9.5px] sm:text-xs font-black uppercase tracking-wider text-amber-700 pointer-events-none whitespace-nowrap select-none drop-shadow-sm">
            270° TÂY
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 440 440">
            <defs>
              {/* Radial Gold Foil Gradient */}
              <radialGradient id="luoPanPlate" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFDF7" />
                <stop offset="70%" stopColor="#F9F2E2" />
                <stop offset="100%" stopColor="#EDDFCA" />
              </radialGradient>
              {/* Center Heavenly Pool (Thiên Trì) */}
              <radialGradient id="heavenlyPool" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="85%" stopColor="#FBF7EE" />
                <stop offset="100%" stopColor="#E2D4BF" />
              </radialGradient>
            </defs>

            {/* Background Plate */}
            <circle cx="220" cy="220" r="216" fill="url(#luoPanPlate)" stroke="#B38F3F" strokeWidth="3" />
            <circle cx="220" cy="220" r="212" fill="none" stroke="#D4AF37" strokeWidth="1.5" />

            {/* ======================================================== */}
            {/* VÒNG NGOÀI CÙNG: 360 ĐỘ (R = 189 đến 212)                */}
            {/* ======================================================== */}
            <circle cx="220" cy="220" r="189" fill="none" stroke="#D4AF37" strokeWidth="1.2" />

            {/* Ticks 360 độ (mỗi 1°, 5°, 15°, 45°) ở rìa ngoài R = 205 đến 212 */}
            {Array.from({ length: 360 }, (_, deg) => {
              const is45 = deg % 45 === 0;
              const is15 = deg % 15 === 0;
              const is5 = deg % 5 === 0;
              // Công thức: Nam 180° ở trên (270° SVG), Bắc 0° ở dưới (90° SVG)
              const rad = (((deg + 90) % 360) * Math.PI) / 180;
              const rStart = is45 ? 204 : is15 ? 206 : is5 ? 208 : 210;
              const rEnd = 212;

              return (
                <line
                  key={`tick-${deg}`}
                  x1={220 + rStart * Math.cos(rad)}
                  y1={220 + rStart * Math.sin(rad)}
                  x2={220 + rEnd * Math.cos(rad)}
                  y2={220 + rEnd * Math.sin(rad)}
                  stroke={is45 ? '#b45309' : is15 ? '#78350f' : is5 ? '#92400e' : '#D4AF37'}
                  strokeWidth={is45 ? '1.8' : is15 ? '1.2' : is5 ? '0.8' : '0.4'}
                />
              );
            })}

            {/* Nhãn số Độ mỗi 30° đặt độc lập ở R = 197 (không có vạch nào cắt ngang) */}
            {Array.from({ length: 12 }, (_, i) => i * 30).map((deg) => {
              const rad = (((deg + 90) % 360) * Math.PI) / 180;
              const textX = 220 + 197 * Math.cos(rad);
              const textY = 220 + 197 * Math.sin(rad);

              return (
                <text
                  key={`deg-text-${deg}`}
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="7.5"
                  fontWeight="bold"
                  className="fill-amber-950 font-mono select-none"
                >
                  {deg}°
                </text>
              );
            })}

            {/* ======================================================== */}
            {/* VÒNG THỨ 2: 24 SƠN HƯỚNG (R = 138 đến 188)               */}
            {/* Vạch phân chia 24 Sơn dừng hẳn ở R = 188 chống đè số Độ  */}
            {/* ======================================================== */}
            <circle cx="220" cy="220" r="138" fill="none" stroke="#C5A059" strokeWidth="1.6" />

            {TWENTY_FOUR_MOUNTAINS.map((m, idx) => {
              const centerRad = (((m.center + 90) % 360) * Math.PI) / 180;
              const textX = 220 + 158 * Math.cos(centerRad);
              const textY = 220 + 158 * Math.sin(centerRad);
              const dotX = 220 + 178 * Math.cos(centerRad);
              const dotY = 220 + 178 * Math.sin(centerRad);

              const isFacing = m.name === currentFacing.mountain.name;
              const isSitting = m.name === currentSitting.mountain.name;

              // Vạch phân chia 24 sơn (chỉ chạy từ R = 138 đến R = 188)
              const tickRad = (((m.center - 7.5 + 90) % 360) * Math.PI) / 180;

              return (
                <g key={`mountain-${idx}`}>
                  {/* Vạch chia sơn an toàn dừng tại 188 */}
                  <line
                    x1={220 + 138 * Math.cos(tickRad)}
                    y1={220 + 138 * Math.sin(tickRad)}
                    x2={220 + 188 * Math.cos(tickRad)}
                    y2={220 + 188 * Math.sin(tickRad)}
                    stroke="#E2CCA0"
                    strokeWidth="0.8"
                  />

                  {/* Chấm màu ngũ hành */}
                  <circle cx={dotX} cy={dotY} r="2.4" fill={m.color} />

                  {/* Tên Sơn (Nhâm, Tý, Quý...) */}
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isFacing || isSitting ? "12.5" : "10.5"}
                    fontWeight={isFacing || isSitting ? "900" : "bold"}
                    className={`transition-all duration-150 select-none ${
                      isFacing 
                        ? 'fill-red-700 font-black' 
                        : isSitting 
                          ? 'fill-indigo-700 font-black' 
                          : 'fill-slate-800'
                    }`}
                  >
                    {m.name}
                  </text>
                </g>
              );
            })}

            {/* ======================================================== */}
            {/* VÒNG THỨ 3: 8 QUẺ BÁT QUÁI (R = 70 đến 138)               */}
            {/* Ly (Nam) ở trên, Khảm (Bắc) ở dưới                        */}
            {/* ======================================================== */}
            <circle cx="220" cy="220" r="70" fill="url(#heavenlyPool)" stroke="#B38F3F" strokeWidth="2" />

            {EIGHT_TRIGRAMS.map((t, idx) => {
              const bRad = (((t.degree - 22.5 + 90) % 360) * Math.PI) / 180;
              const midRad = (((t.degree + 90) % 360) * Math.PI) / 180;

              // Tọa độ tâm cung Bát Quái (Bán kính trung tâm R = 104 trong khoảng [70, 138])
              const cx = 220 + 104 * Math.cos(midRad);
              const cy = 220 + 104 * Math.sin(midRad);

              // Xếp dọc: Ký hiệu quẻ ở trên (cy - 9), Tên quẻ ở dưới (cy + 11) - Đảm bảo cân đối tuyệt đối 8 hướng, không đè lấn
              const symX = cx;
              const symY = cy - 9;
              const nameX = cx;
              const nameY = cy + 11;

              return (
                <g key={`trigram-${idx}`}>
                  {/* Vạch chia 8 cung Bát Quái */}
                  <line
                    x1={220 + 70 * Math.cos(bRad)}
                    y1={220 + 70 * Math.sin(bRad)}
                    x2={220 + 138 * Math.cos(bRad)}
                    y2={220 + 138 * Math.sin(bRad)}
                    stroke="#C5A059"
                    strokeWidth="1.2"
                  />

                  {/* Ký hiệu Dịch tượng Bát Quái (☲ ☷ ☱ ☰ ☵ ☶ ☳ ☴) */}
                  <text
                    x={symX}
                    y={symY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="17"
                    className="fill-amber-950 font-bold select-none"
                    style={{ fontFamily: "'Segoe UI Symbol', sans-serif" }}
                  >
                    {t.symbol}
                  </text>

                  {/* Tên Quẻ (Ly, Khôn, Đoài...) */}
                  <text
                    x={nameX}
                    y={nameY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="12"
                    fontWeight="900"
                    className="fill-amber-950 font-black tracking-wide select-none"
                  >
                    {t.name}
                  </text>
                </g>
              );
            })}

            {/* Thái Cực Âm Dương Đồ Nổi Bật Trong Thiên Trì (Chuẩn Cổ Học: Nam Ly Dương Trên, Bắc Khảm Âm Dưới) */}
            <g className="filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.25)]">
              {/* Nửa Nền Trắng (Dương Thể) */}
              <circle cx="220" cy="220" r="36" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1.8" />
              
              {/* Khối Đen (Âm Ngư - Đen Mực Cổ Điển) */}
              <path 
                d="M 220 184 A 36 36 0 0 1 220 256 A 18 18 0 0 1 220 220 A 18 18 0 0 0 220 184 Z" 
                fill="#18181B" 
              />
              
              {/* Mắt Trắng trong Khối Âm (Dương trong Âm - Dưới) */}
              <circle cx="220" cy="238" r="4.5" fill="#FFFFFF" />
              
              {/* Mắt Đen trong Khối Dương (Âm trong Dương - Trên) */}
              <circle cx="220" cy="202" r="4.5" fill="#18181B" />
              
              {/* Vành Kim Chỉ Vàng Viền Ngoài Tinh Xảo */}
              <circle cx="220" cy="220" r="36" fill="none" stroke="#D4AF37" strokeWidth="1.8" />
            </g>
          </svg>

          {/* Rotating Direction Indicators (2 Mũi Tên Ngoài Vòng Tròn & Nhãn Hướng Tọa Tự Xoay) */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-75 ease-out"
            style={{ transform: `rotate(${needleRotation}deg)` }}
          >
            {/* --- 2 MŨI TÊN Ở NGOÀI VÒNG TRÒN (HÌNH 2 & ẢNH MỚI: ĐỎ & XANH DƯƠNG DÁNG UỐN MỀM MẠI) --- */}
            {/* 1. Mũi tên ĐỎ chỉ HƯỚNG ở ngoài vòng tròn (Phía Hướng - Dáng uốn cánh phượng/mái đình mềm mại) */}
            <div className="absolute -top-[12px] sm:-top-[14px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <svg 
                viewBox="0 0 26 15" 
                className="w-[20px] h-[12px] sm:w-[24px] sm:h-[14px] overflow-visible drop-shadow-[0_2px_4px_rgba(220,38,38,0.45)]"
              >
                <path
                  d="M 13 0.5 
                     C 12.5 2.5, 12 4, 10.5 6.5 
                     C 8.5 9, 5 11, 0.5 11.5 
                     C 0.2 11.5, 0 11.8, 0 12.2 
                     C 0 12.8, 0.3 13.5, 0.8 13.5 
                     C 4.5 13.2, 8 11.5, 10.5 9.5 
                     C 10.8 11, 11.5 14.5, 13 14.5 
                     C 14.5 14.5, 15.2 11, 15.5 9.5 
                     C 18 11.5, 21.5 13.2, 25.2 13.5 
                     C 25.7 13.5, 26 12.8, 26 12.2 
                     C 26 11.8, 25.8 11.5, 25.5 11.5 
                     C 21 11, 17.5 9, 15.5 6.5 
                     C 14 4, 13.5 2.5, 13 0.5 Z"
                  fill="#dc2626"
                />
              </svg>
            </div>

            {/* 2. Mũi tên XANH DƯƠNG chỉ TỌA ở ngoài vòng tròn (Phía Tọa - Dáng uốn cánh phượng/mái đình mềm mại) */}
            <div className="absolute -bottom-[12px] sm:-bottom-[14px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
              <svg 
                viewBox="0 0 26 15" 
                className="w-[20px] h-[12px] sm:w-[24px] sm:h-[14px] rotate-180 overflow-visible drop-shadow-[0_2px_4px_rgba(37,99,235,0.45)]"
              >
                <path
                  d="M 13 0.5 
                     C 12.5 2.5, 12 4, 10.5 6.5 
                     C 8.5 9, 5 11, 0.5 11.5 
                     C 0.2 11.5, 0 11.8, 0 12.2 
                     C 0 12.8, 0.3 13.5, 0.8 13.5 
                     C 4.5 13.2, 8 11.5, 10.5 9.5 
                     C 10.8 11, 11.5 14.5, 13 14.5 
                     C 14.5 14.5, 15.2 11, 15.5 9.5 
                     C 18 11.5, 21.5 13.2, 25.2 13.5 
                     C 25.7 13.5, 26 12.8, 26 12.2 
                     C 26 11.8, 25.8 11.5, 25.5 11.5 
                     C 21 11, 17.5 9, 15.5 6.5 
                     C 14 4, 13.5 2.5, 13 0.5 Z"
                  fill="#2563eb"
                />
              </svg>
            </div>

            {/* --- NHÃN HƯỚNG / TỌA TRONG THIÊN TRÌ (BỎ NỀN, TỰ XOAY KHI QUAY NGƯỢC, ÔM NGOÀI THÁI CỰC ĐỒ) --- */}
            {/* Nhãn HƯỚNG (Đỏ, không nền, tự xoay lộn ngược để luôn đọc xuôi) */}
            <div className="absolute -translate-y-[29px] sm:-translate-y-[34px] z-10 pointer-events-none">
              <span 
                className="text-[8.5px] sm:text-[9.5px] font-black text-red-600 uppercase tracking-widest select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)] transition-transform duration-100 inline-block"
                style={{ transform: isUpsideDown ? 'rotate(180deg)' : 'none' }}
              >
                HƯỚNG
              </span>
            </div>

            {/* Nhãn TỌA (Xanh dương, không nền, tự xoay lộn ngược để luôn đọc xuôi) */}
            <div className="absolute translate-y-[29px] sm:translate-y-[34px] z-10 pointer-events-none">
              <span 
                className="text-[8.5px] sm:text-[9.5px] font-black text-blue-600 uppercase tracking-widest select-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.95)] transition-transform duration-100 inline-block"
                style={{ transform: isUpsideDown ? 'rotate(180deg)' : 'none' }}
              >
                TỌA
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Facing / Sitting Summary Card & Degree Fine-Tuning (Cân đối mọi kích thước màn hình - Yêu Cầu 3) */}
      <div className="w-full bg-gradient-to-b from-amber-50/60 to-white rounded-2xl p-3 sm:p-4 border border-amber-200/90 shadow-sm space-y-3">
        
        {/* === GIAO DIỆN DESKTOP (sm trở lên): 3 CỘT ĐỐI XỨNG CÂN ĐỐI === */}
        <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-3">
          {/* Cột Trái: Hướng Nhà */}
          <div className="space-y-0.5 min-w-0 flex-1">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">HƯỚNG NHÀ</span>
            <div className="text-lg font-black text-slate-900 truncate">
              Sơn {currentFacing.mountain.name} ({currentFacing.mountain.palace})
            </div>
            <div className="text-xs text-slate-500 truncate">
              {currentFacing.mountain.long} Nguyên Long • Hành {currentFacing.mountain.element}
            </div>
          </div>

          {/* Cột Giữa: Hộp Số Độ */}
          <div className="text-center px-4 py-2 rounded-2xl bg-white border-2 border-amber-400 shadow-md shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight leading-none">
              {degree.toFixed(1)}°
            </div>
            <div className="text-[10px] font-bold text-amber-700 uppercase mt-1">
              La Kinh 360°
            </div>
          </div>

          {/* Cột Phải: Tọa Nhà */}
          <div className="text-right space-y-0.5 min-w-0 flex-1">
            <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider block">TỌA NHÀ</span>
            <div className="text-lg font-black text-slate-900 truncate">
              Sơn {currentSitting.mountain.name} ({currentSitting.mountain.palace})
            </div>
            <div className="text-xs text-slate-500 truncate">
              {((degree + 180) % 360).toFixed(1)}° • Hành {currentSitting.mountain.element}
            </div>
          </div>
        </div>

        {/* === GIAO DIỆN MOBILE (< sm): HỘP ĐỘ Ở TRÊN, 2 THẺ HƯỚNG/TỌA CÂN XỨNG BÊN DƯỚI === */}
        <div className="sm:hidden space-y-2.5">
          {/* Hộp Số Độ Nằm Giữa Nổi Bật */}
          <div className="flex items-center justify-center">
            <div className="text-center px-5 py-1.5 rounded-2xl bg-white border-2 border-amber-400 shadow-md">
              <div className="text-2xl font-black text-amber-800 tracking-tight leading-none">
                {degree.toFixed(1)}°
              </div>
              <div className="text-[9px] font-bold text-amber-700 uppercase mt-0.5">
                La Kinh 360°
              </div>
            </div>
          </div>

          {/* 2 Cột Thẻ Hướng và Tọa Đối Xứng */}
          <div className="grid grid-cols-2 gap-2">
            {/* Thẻ Hướng Nhà */}
            <div className="p-2.5 rounded-xl bg-red-50/70 border border-red-200/80 text-center space-y-0.5 min-w-0">
              <span className="text-[9px] font-black text-red-700 uppercase tracking-wider block">HƯỚNG NHÀ</span>
              <div className="text-xs font-black text-slate-900 truncate">
                Sơn {currentFacing.mountain.name} ({currentFacing.mountain.palace})
              </div>
              <div className="text-[9.5px] text-slate-500 font-medium truncate">
                {currentFacing.mountain.long} • {currentFacing.mountain.element}
              </div>
            </div>

            {/* Thẻ Tọa Nhà */}
            <div className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-center space-y-0.5 min-w-0">
              <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider block">TỌA NHÀ</span>
              <div className="text-xs font-black text-slate-900 truncate">
                Sơn {currentSitting.mountain.name} ({currentSitting.mountain.palace})
              </div>
              <div className="text-[9.5px] text-slate-500 font-medium truncate">
                {((degree + 180) % 360).toFixed(1)}° • {currentSitting.mountain.element}
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-center">
          {getStatusBadge()}
        </div>

        {/* Nhập Độ (°) & Phút (') Cụ Thể */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2 px-3 bg-amber-100/60 rounded-2xl border border-amber-200">
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-black text-amber-950">Độ (°):</label>
            <input
              type="number"
              min="0"
              max="359"
              value={Math.floor(degree) % 360}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => {
                const d = Math.max(0, Math.min(359, parseInt(e.target.value, 10) || 0));
                const currentMin = Math.round((degree - Math.floor(degree)) * 60) % 60;
                updateDegree(d + currentMin / 60);
              }}
              className="w-14 sm:w-16 px-2 py-1 text-center font-black text-sm bg-white border border-amber-300 rounded-xl text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500"
              title="Nhập số độ chính xác (0 - 359°)"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-black text-amber-950">Phút ('):</label>
            <input
              type="number"
              min="0"
              max="59"
              value={Math.round((degree - Math.floor(degree)) * 60) % 60}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              onChange={(e) => {
                const m = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                const currentD = Math.floor(degree) % 360;
                updateDegree(currentD + m / 60);
              }}
              className="w-14 sm:w-16 px-2 py-1 text-center font-black text-sm bg-white border border-amber-300 rounded-xl text-slate-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500"
              title="Nhập số phút góc (0 - 59')"
            />
          </div>

          <span className="text-[10px] sm:text-[11px] text-amber-800 font-semibold italic">
            (Hệ thống tự định vị Sơn Hướng)
          </span>
        </div>

        {/* Manual Degree Slider & Fine Tuning Buttons */}
        <div className="space-y-2 pt-1 border-t border-amber-100">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateDegree(degree - 1)}
              className="p-2 rounded-xl bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 font-bold transition shadow-sm active:scale-95"
              title="Giảm 1 độ"
            >
              <Minus className="w-4 h-4" />
            </button>

            <input
              type="range"
              min="0"
              max="359.9"
              step="0.1"
              value={degree}
              onChange={(e) => updateDegree(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />

            <button
              type="button"
              onClick={() => updateDegree(degree + 1)}
              className="p-2 rounded-xl bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 font-bold transition shadow-sm active:scale-95"
              title="Tăng 1 độ"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Direction Preset Buttons */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center">
            {QUICK_DIRECTIONS.map((q) => (
              <button
                key={q.deg}
                type="button"
                onClick={() => updateDegree(q.deg)}
                className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold transition shadow-sm active:scale-95 ${
                  Math.abs(degree - q.deg) < 7.5
                    ? 'bg-amber-600 text-white shadow-amber-600/30'
                    : 'bg-white hover:bg-amber-50 text-slate-700 border border-amber-200'
                }`}
              >
                {q.name} ({q.deg}°)
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
