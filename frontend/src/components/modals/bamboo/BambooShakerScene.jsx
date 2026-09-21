import React, { useState, useRef, useMemo, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Hand } from 'lucide-react';
import { 
  playBambooClickSound, 
  playStickRevealSound, 
  playStickDropSound, 
  playResultChimeSound 
} from '@/utils/bambooSound';

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * BAMBOO SHAKER SCENE - HERITAGE CYLINDRICAL DIVINATION TUBE (AUTHENTIC 3D VESSEL)
 * - Ống xăm hình trụ tròn 3D hoàn chỉnh: Rộng 120px, Cao 162px, thành ống dày dặn có miệng oval sâu.
 * - Thân ống kín hoàn toàn ở đáy, bao bọc 75% chiều dài các que tre.
 * - 13 que tre cắm tự nhiên bên trong lòng ống, không bao giờ lòi ra khỏi hai bên hoặc đáy.
 * - Tương tác vật lý: Ấn và giữ chuột để lắc ống qua lại theo trỏ chuột của người dùng.
 * - Thẻ định mệnh: Nhô lên -> Tạm dừng -> Rơi parabol 3D -> Tiếp đất foreground -> Mở kết quả.
 */
export default function BambooShakerScene({ onComplete, destinedFortune }) {
  const shouldReduceMotion = useReducedMotion();
  const [phase, setPhase] = useState('idle');

  // Trạng thái tương tác chuột
  const [isPressing, setIsPressing] = useState(false);
  const [interactiveTilt, setInteractiveTilt] = useState({ rotateZ: 0, x: 0 });
  const [shakeProgress, setShakeProgress] = useState(0);

  const containerRef = useRef(null);
  const isPressingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const lastPosRef = useRef({ x: 0, y: 0, time: 0 });
  const lastDirRef = useRef(0);
  const swingCountRef = useRef(0);
  const soundCooldownRef = useRef(0);
  const stopTimerRef = useRef(null);

  // 15 Thẻ tre tự nhiên tách rời độc lập, phân bổ hình cánh quạt đều quanh chu vi miệng bình:
  // - Bổ sung thêm 2 quẻ bên cánh trái (id: 13, 14) tạo độ dày dặn, ấm cúng và cân xứng, không bị trống.
  // - Chiều cao tăng thêm 0.35cm (~13px) đạt 179px - 189px, thò lên miệng bình thanh thoát và vừa vặn.
  // - Chân que gom gọn [-6.0px, +6.0px], cắm sâu trong lòng bình, tuyệt đối không lòi đáy.
  // - Sắc độ tre đan xen (tone) để mỗi que là một thanh đũa tre riêng biệt, không hòa lẫn vào nhau.
  const sticks = useMemo(() => {
    return [
      // Lớp sau (Rear Lip - 5 que cắm sát vành sau của miệng oval, ngả nhẹ ra sau)
      { id: 0,  char: null, angle: -11.5, rotateY: -45, rotateX: -6, posZ: -8,  x: 2.5,  height: 181, z: 4,  isRear: true, widthScale: 0.85, brightness: 0.88, tone: 0, vibZ: [-3.2, 1.4],  vibY: -11, vibX: -1.5, vibRotY: 16,  vibDuration: 0.21, vibDelay: 0.01 },
      { id: 13, char: null, angle: -10.5, rotateY: 30,  rotateX: -7, posZ: -10, x: 3.5,  height: 183, z: 5,  isRear: true, widthScale: 0.86, brightness: 0.96, tone: 1, vibZ: [-2.4, 1.8],  vibY: -10, vibX: -1.0, vibRotY: -14, vibDuration: 0.23, vibDelay: 0.02 },
      { id: 1,  char: '坤',  angle: -4.0,  rotateY: 25,  rotateX: -8, posZ: -12, x: 1.6,  height: 186, z: 5,  isRear: true, widthScale: 0.95, brightness: 1.05, tone: 1, vibZ: [-1.4, 2.8],  vibY: -9,  vibX: 1.0,  vibRotY: -14, vibDuration: 0.26, vibDelay: 0.04 },
      { id: 2,  char: '乾',  angle: 4.0,   rotateY: -25, rotateX: -8, posZ: -12, x: -1.6, height: 186, z: 5,  isRear: true, widthScale: 0.96, brightness: 0.94, tone: 0, vibZ: [1.6, -2.2],  vibY: -10, vibX: 0.8,  vibRotY: -12, vibDuration: 0.24, vibDelay: 0.03 },
      { id: 3,  char: null, angle: 11.5,  rotateY: 40,  rotateX: -6, posZ: -8,  x: -2.5, height: 181, z: 4,  isRear: true, widthScale: 0.85, brightness: 1.02, tone: 1, vibZ: [2.8, -1.2],  vibY: -11, vibX: 1.4,  vibRotY: 15,  vibDuration: 0.22, vibDelay: 0.02 },
      
      // Lớp giữa (Mid Ring - 5 que so le tạo chiều sâu trung tâm)
      { id: 4,  char: '艮',  angle: -9.0,  rotateY: 40,  rotateX: 0,  posZ: 0,   x: 3.4,  height: 183, z: 7,  isRear: false, widthScale: 0.90, brightness: 0.93, tone: 1, vibZ: [-2.6, 1.6],  vibY: -10, vibX: -1.2, vibRotY: -14, vibDuration: 0.24, vibDelay: 0.03 },
      { id: 14, char: '巽',  angle: -7.5,  rotateY: -30, rotateX: 4,  posZ: 6,   x: 2.2,  height: 184, z: 8,  isRear: false, widthScale: 0.90, brightness: 1.03, tone: 0, vibZ: [1.6, -2.5],  vibY: -11, vibX: 1.2,  vibRotY: 15,  vibDuration: 0.22, vibDelay: 0.03 },
      { id: 5,  char: null, angle: -2.0,  rotateY: -20, rotateX: -1, posZ: -2,  x: 0.8,  height: 187, z: 8,  isRear: false, widthScale: 0.80, brightness: 1.07, tone: 0, vibZ: [1.2, -2.4],  vibY: -12, vibX: 1.2,  vibRotY: 18,  vibDuration: 0.20, vibDelay: 0.02 },
      { id: 6,  char: '吉',  angle: 2.0,   rotateY: 0,   rotateX: 1,  posZ: 2,   x: -0.8, height: 189, z: 9,  isRear: false, isDestined: true, widthScale: 1.0, brightness: 1.06, tone: 1, vibZ: [-1.8, 2.0], vibY: -11, vibX: 0.0, vibRotY: 10, vibDuration: 0.23, vibDelay: 0.00 }, // Thẻ định mệnh
      { id: 7,  char: '泰',  angle: 9.0,   rotateY: -30, rotateX: 0,  posZ: 0,   x: -3.4, height: 183, z: 8,  isRear: false, widthScale: 0.92, brightness: 0.95, tone: 0, vibZ: [2.2, -1.4],  vibY: -11, vibX: -0.9, vibRotY: -15, vibDuration: 0.22, vibDelay: 0.04 },

      // Lớp trước (Front Lip - 5 que cắm sát vành trước của miệng oval, chúc nhẹ ra trước)
      { id: 8,  char: null, angle: -13.5, rotateY: -35, rotateX: 6,  posZ: 8,   x: 6.0,  height: 179, z: 12, isRear: false, widthScale: 0.82, brightness: 0.92, tone: 0, vibZ: [-2.8, 1.2],  vibY: -11, vibX: -1.2, vibRotY: 15,  vibDuration: 0.22, vibDelay: 0.02 },
      { id: 9,  char: '震',  angle: -6.5,  rotateY: 30,  rotateX: 8,  posZ: 12,  x: 2.5,  height: 185, z: 13, isRear: false, widthScale: 0.88, brightness: 1.04, tone: 1, vibZ: [1.4, -2.6],  vibY: -12, vibX: 1.1,  vibRotY: -16, vibDuration: 0.21, vibDelay: 0.03 },
      { id: 10, char: '恒',  angle: 0.0,   rotateY: 10,  rotateX: 9,  posZ: 14,  x: 0.0,  height: 188, z: 14, isRear: false, widthScale: 0.96, brightness: 0.98, tone: 0, vibZ: [-1.8, 2.0],  vibY: -9,  vibX: -0.5, vibRotY: 12,  vibDuration: 0.25, vibDelay: 0.01 },
      { id: 11, char: '離',  angle: 6.5,   rotateY: -25, rotateX: 8,  posZ: 12,  x: -2.5, height: 185, z: 13, isRear: false, widthScale: 0.88, brightness: 1.03, tone: 1, vibZ: [-1.2, 2.8],  vibY: -10, vibX: -0.8, vibRotY: 16,  vibDuration: 0.24, vibDelay: 0.02 },
      { id: 12, char: null, angle: 13.5,  rotateY: 35,  rotateX: 6,  posZ: 8,   x: -6.0, height: 179, z: 12, isRear: false, widthScale: 0.82, brightness: 0.91, tone: 0, vibZ: [3.0, -1.0],  vibY: -11, vibX: 1.4,  vibRotY: -18, vibDuration: 0.21, vibDelay: 0.04 }
    ];
  }, []);

  // Kích hoạt chu kỳ bật thẻ định mệnh (State Machine)
  const triggerDrawSequence = useCallback(() => {
    if (phase !== 'idle' && phase !== 'shaking') return;

    // 1. SELECTING: Ống ổn định, thẻ định mệnh bắt đầu rung nhô lên
    setPhase('selecting');
    setInteractiveTilt({ rotateZ: 0, x: 0, y: 0, intensity: 0 });
    playBambooClickSound(1.2);

    setTimeout(() => {
      // 2. RISING: Thẻ định mệnh vươn cao vượt hẳn khỏi miệng ống
      setPhase('rising');
      playStickRevealSound();

      setTimeout(() => {
        // 3. PAUSE: Dừng ngập ngừng nghệ thuật 260ms trên đỉnh
        setPhase('pause');

        setTimeout(() => {
          // 4. FALLING: Thẻ lượn vòng parabol 3D rơi xuống bên góc phải của bình
          setPhase('falling');

          setTimeout(() => {
            // 5. LANDED: Thẻ tiếp đất nảy nhẹ và nằm chếch xuống 20 độ ở góc phải của bình
            setPhase('landed');
            playStickDropSound();
            playResultChimeSound();

            // 6. Cho người dùng quan sát thẻ quẻ nằm góc phải 1400ms rồi mở kết quả
            setTimeout(() => {
              onComplete?.(destinedFortune);
            }, 1400);
          }, 550);
        }, 260);
      }, 650);
    }, 350);
  }, [phase, destinedFortune, onComplete]);

  // Nhấn giữ chuột / chạm tay để bắt đầu lắc
  const handlePointerDown = (e) => {
    if (phase !== 'idle') return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    isPressingRef.current = true;
    setIsPressing(true);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    lastPosRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    lastDirRef.current = 0;
    swingCountRef.current = 0;
    setShakeProgress(0);

    // Khi vừa ấn chuột xuống: đứng yên tuyệt đối 100%, không rung giật
    setInteractiveTilt({
      rotateZ: 0,
      x: 0,
      y: 0,
      intensity: 0
    });
  };

  // Di chuyển chuột khi đang nhấn giữ: CHỈ rung động khi người dùng thực sự lắc chuột
  const handlePointerMove = (e) => {
    if (!isPressingRef.current || phase !== 'idle') return;

    const now = performance.now();
    const clientX = e.clientX;
    const clientY = e.clientY;

    const startX = startPosRef.current.x;
    const deltaXFromStart = clientX - startX;

    const prev = lastPosRef.current;
    let instantSpeed = 0;
    let dt = 16;
    let dx = 0;

    if (prev.time > 0) {
      dt = Math.max(1, now - prev.time);
      dx = clientX - prev.x;
      const dy = clientY - prev.y;
      instantSpeed = Math.hypot(dx, dy) / dt; // Tốc độ di chuyển chuột (px/ms)
    }

    lastPosRef.current = { x: clientX, y: clientY, time: now };

    // Ngưỡng vận tốc: Nếu di chuyển rất chậm (< 0.12 px/ms) hoặc giữ yên chuột thì intensity = 0
    const activeSpeed = Math.max(0, instantSpeed - 0.12);
    const intensity = Math.min(1.0, activeSpeed / 1.4);

    // 1. Góc nghiêng theo vị trí kéo chuột từ điểm bắt đầu
    const baseTilt = Math.max(-22, Math.min(22, deltaXFromStart * 0.35));
    const baseShiftX = Math.max(-26, Math.min(26, deltaXFromStart * 0.24));

    // 2. Chấn động rung lắc CHỈ XẢY RA KHI INTENSITY > 0.08 (tức người dùng thực sự lắc tay)
    const jitterZ = intensity > 0.08 ? (Math.random() - 0.5) * (intensity * 10) : 0;
    const jitterX = intensity > 0.08 ? (Math.random() - 0.5) * (intensity * 6) : 0;
    const jitterY = intensity > 0.08 ? -Math.abs(Math.sin(now * 0.04)) * (intensity * 7) : 0;

    setInteractiveTilt({
      rotateZ: baseTilt + jitterZ,
      x: baseShiftX + jitterX,
      y: jitterY,
      intensity: intensity
    });

    // Tự động tắt chấn động (decay về 0) ngay khi người dùng dừng di chuyển chuột (sau 75ms)
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      if (isPressingRef.current && phase === 'idle') {
        setInteractiveTilt((prev) => ({
          ...prev,
          y: 0,
          intensity: 0
        }));
      }
    }, 75);

    // 3. Tính toán nhịp đảo chiều và tiến trình xóc quẻ
    if (prev.time > 0 && Math.abs(dx) > 2) {
      const currentDir = dx > 0 ? 1 : -1;
      if (currentDir !== lastDirRef.current) {
        lastDirRef.current = currentDir;

        // Âm thanh va đập nan tre có âm lượng và cao độ tương ứng với lực lắc mạnh hay nhẹ
        if (now - soundCooldownRef.current > Math.max(75, 170 - intensity * 95)) {
          soundCooldownRef.current = now;
          playBambooClickSound(Math.min(1.25, 0.35 + intensity * 0.85));
        }

        // Tích lũy tiến trình: lắc mạnh thì tích lũy nhanh hơn lắc nhẹ
        const step = Math.max(8, Math.min(26, Math.round(intensity * 24)));
        swingCountRef.current += 1;
        setShakeProgress((prevProg) => {
          const nextProg = Math.min(100, prevProg + step);
          if (nextProg >= 100) {
            isPressingRef.current = false;
            setIsPressing(false);
            triggerDrawSequence();
          }
          return nextProg;
        });
      }
    }
  };

  // Thả chuột / rời tay
  const handlePointerUp = (e) => {
    if (!isPressingRef.current) return;

    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    isPressingRef.current = false;
    setIsPressing(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Ống tự động đàn hồi về vị trí cân bằng
    if (phase === 'idle') {
      setInteractiveTilt({ rotateZ: 0, x: 0, y: 0, intensity: 0 });
      swingCountRef.current = Math.max(0, swingCountRef.current - 2);
    }
  };

  // Kích hoạt qua nút bấm (fallback cho người muốn bấm nhanh)
  const handleButtonClick = () => {
    if (phase !== 'idle') return;
    setPhase('shaking');

    let clickTimer = setInterval(() => {
      playBambooClickSound(randomBetween(0.7, 1.1));
    }, 110);

    setTimeout(() => {
      clearInterval(clickTimer);
      triggerDrawSequence();
    }, 1400);
  };

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col items-center justify-center select-none py-0.5">
      {/* KHÔNG GIAN SÂN KHẤU TƯƠNG TÁC ỐNG QUẺ HÌNH THANG NAN TRE */}
      <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-72 h-[260px] flex flex-col items-center justify-end touch-none select-none ${
          phase === 'idle' 
            ? (isPressing ? 'cursor-grabbing' : 'cursor-grab') 
            : 'cursor-default'
        }`}
        title="Ấn và giữ chuột vào ống quẻ rồi lắc qua lại theo nhịp tay"
      >
        {/* RIG ỐNG TRE HÌNH THANG 3D */}
        <motion.div
          animate={
            phase === 'shaking' ? {
              rotateZ: [-12, 12, -9, 9, -11, 11, -6, 6, 0],
              x: [-10, 10, -7, 7, -9, 9, -4, 4, 0],
              y: [0, -5, 2, -4, 0, -5, 2, 0]
            } : phase === 'selecting' ? {
              rotateZ: [-2, 2, 0],
              x: [-2, 2, 0],
              y: [0, -2, 0]
            } : phase === 'rising' || phase === 'pause' ? {
              rotateZ: 2,
              x: -3,
              y: 0
            } : phase === 'falling' || phase === 'landed' ? {
              rotateZ: -1,
              x: 0,
              y: 0
            } : {
              // IDLE: Lắc trực tiếp và rung động theo vận tốc con trỏ chuột
              rotateZ: interactiveTilt.rotateZ,
              x: interactiveTilt.x,
              y: interactiveTilt.y || 0
            }
          }
          transition={
            phase === 'shaking' ? {
              repeat: Infinity,
              duration: 0.42,
              ease: "easeInOut"
            } : phase === 'idle' ? {
              type: "spring",
              stiffness: 300,
              damping: 18,
              mass: 0.65
            } : {
              type: "spring",
              stiffness: 260,
              damping: 22
            }
          }
          className="relative w-32 h-[250px] flex flex-col items-center justify-end"
          style={{ transformOrigin: 'bottom center', perspective: '1000px' }}
        >
          {/* ========================================================================= */}
          {/* LỚP 1: NỬA SAU BÌNH & KHOANG LÒNG TRONG CÓ ĐỔ BÓNG SÂU (Inner Cavity & Rear Rim) */}
          {/* ========================================================================= */}
          <svg 
            width="76" 
            height="176" 
            viewBox="0 0 76 176" 
            className="absolute bottom-0 pointer-events-none"
            style={{ zIndex: 2 }}
          >
            <defs>
              {/* Bóng đổ từ vành ngoài vào sâu trong lòng bình (Perspective Inner Cavity Shadow) */}
              <radialGradient id="innerCavityShadow" cx="50%" cy="30%" r="75%" fx="50%" fy="15%">
                <stop offset="0%" stopColor="#2D190B" />
                <stop offset="35%" stopColor="#180B04" />
                <stop offset="70%" stopColor="#080301" />
                <stop offset="100%" stopColor="#000000" />
              </radialGradient>

              {/* Gradient màu tre mộc ĐỒNG NHẤT cho toàn bộ vành miệng (Unified Rim - Không lệch màu) */}
              <linearGradient id="unifiedRimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8C5F28" />
                <stop offset="20%" stopColor="#C49A58" />
                <stop offset="50%" stopColor="#DFBA7D" />
                <stop offset="80%" stopColor="#C49A58" />
                <stop offset="100%" stopColor="#8C5F28" />
              </linearGradient>

              {/* Gradient thành trong phía sau của bình */}
              <linearGradient id="innerBackWallGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A1608" />
                <stop offset="35%" stopColor="#140A03" />
                <stop offset="100%" stopColor="#020100" />
              </linearGradient>
            </defs>

            {/* Thành trong phía sau của bình (nhìn thấy qua lỗ mở Oval) */}
            <path 
              d="M 9,15 L 18,162 A 20,5.5 0 0,0 58,162 L 67,15 Z" 
              fill="url(#innerBackWallGrad)" 
            />

            {/* Lỗ mở Oval bên trong với bóng đổ sâu nhìn từ ngoài vào trong bình */}
            <ellipse 
              cx="38" 
              cy="15" 
              rx="29" 
              ry="8.5" 
              fill="url(#innerCavityShadow)" 
            />

            {/* Nửa sau của vành miệng Oval (Tô cùng màu unifiedRimGrad, KHÔNG có stroke ngang ở 2 mút nối) */}
            <path 
              d="M 2,15 A 36,12 0 0,1 74,15 L 67,15 A 29,8.5 0 0,0 9,15 Z" 
              fill="url(#unifiedRimGrad)" 
            />
            {/* Viền ngoài cung sau */}
            <path 
              d="M 2,15 A 36,12 0 0,1 74,15" 
              fill="none" 
              stroke="#3E2208" 
              strokeWidth="1.2" 
            />
            {/* Viền trong cung sau */}
            <path 
              d="M 9,15 A 29,8.5 0 0,1 67,15" 
              fill="none" 
              stroke="#220E02" 
              strokeWidth="0.9" 
            />
          </svg>

          {/* ========================================================================= */}
          {/* LỚP 2: CỤM THẺ TRE CẮM TỰ NHIÊN TRONG LÒNG OVAL (Slender Fortune Sticks) */}
          {/* ========================================================================= */}
          <div 
            className="absolute overflow-visible flex items-end justify-center pointer-events-none"
            style={{ 
              width: '44px',
              height: '255px',
              bottom: '24px',
              zIndex: 10,
              perspective: '600px',
              transformStyle: 'preserve-3d'
            }}
          >
            {sticks.map((stick) => {
              const isDestined = stick.isDestined;

              // Khi thẻ định mệnh bay ra, ẩn nó trong cụm
              if (isDestined && (phase === 'rising' || phase === 'pause' || phase === 'falling' || phase === 'landed')) {
                return null;
              }

              const isMouseShaking = isPressing && (interactiveTilt.intensity || 0) > 0.08;

              return (
                <motion.div
                  key={stick.id}
                  initial={{
                    y: 0,
                    x: 0,
                    rotateZ: stick.angle,
                    rotateY: stick.rotateY,
                    rotateX: stick.rotateX || 0,
                    z: stick.posZ || 0
                  }}
                  animate={
                    phase === 'shaking' ? {
                      y: [0, stick.vibY, 0, stick.vibY * 0.45, 0],
                      x: [0, stick.vibX, -stick.vibX * 0.6, 0],
                      rotateZ: [stick.angle + stick.vibZ[0], stick.angle + stick.vibZ[1], stick.angle],
                      rotateY: [stick.rotateY, stick.rotateY + stick.vibRotY, stick.rotateY - stick.vibRotY * 0.5, stick.rotateY],
                      rotateX: stick.rotateX || 0,
                      z: stick.posZ || 0
                    } : isMouseShaking ? {
                      // CHỈ rung nảy khi người dùng thực sự di chuyển lắc chuột (không rung khi giữ yên)
                      y: stick.vibY * interactiveTilt.intensity,
                      x: stick.vibX * interactiveTilt.intensity,
                      rotateZ: stick.angle + stick.vibZ[0] * interactiveTilt.intensity,
                      rotateY: stick.rotateY + stick.vibRotY * interactiveTilt.intensity * 0.7,
                      rotateX: stick.rotateX || 0,
                      z: stick.posZ || 0
                    } : phase === 'selecting' && isDestined ? {
                      y: [0, -10, -6, -12],
                      rotateZ: [stick.angle - 1, stick.angle + 1, stick.angle],
                      rotateX: stick.rotateX || 0,
                      z: stick.posZ || 0
                    } : {
                      y: 0,
                      x: 0,
                      rotateZ: stick.angle,
                      rotateY: stick.rotateY,
                      rotateX: stick.rotateX || 0,
                      z: stick.posZ || 0
                    }
                  }
                  transition={
                    phase === 'shaking' ? {
                      repeat: Infinity,
                      duration: stick.vibDuration,
                      delay: stick.vibDelay,
                      ease: "easeInOut"
                    } : isMouseShaking ? {
                      duration: 0.06,
                      ease: "linear"
                    } : {
                      duration: 0.16,
                      ease: "easeOut"
                    }
                  }
                  style={{
                    left: `calc(50% + ${stick.x}px)`,
                    bottom: 0,
                    width: '4.4px',
                    height: `${stick.height}px`,
                    transformOrigin: 'bottom center',
                    transform: `scaleX(${stick.widthScale || 1})`,
                    zIndex: stick.z,
                    // Màu đũa tre mộc tự nhiên với sắc thái riêng biệt từng thanh tre
                    background: stick.tone === 1
                      ? 'linear-gradient(to top, #AD783B 0%, #C4904C 30%, #D8AA66 70%, #E7C68B 100%)'
                      : 'linear-gradient(to top, #BA9054 0%, #CEAA6E 30%, #DFBE84 70%, #ECD39E 100%)',
                    borderRadius: '2px 2px 1px 1px',
                    boxShadow: stick.isRear 
                      ? '-1px 0 2px rgba(35,15,5,0.6), 1px 0 1px rgba(255,255,255,0.25)' 
                      : '-1.5px 0 3px rgba(30,15,5,0.5), 1px 0 2px rgba(255,255,255,0.35)',
                    borderLeft: '1px solid rgba(255,255,255,0.75)',
                    borderRight: '1.2px solid rgba(50,25,10,0.65)',
                    filter: `brightness(${stick.brightness}) contrast(1.06)`
                  }}
                  className="absolute flex flex-col items-center justify-start overflow-hidden pt-1"
                >
                  {/* Chữ Hán thư pháp mực đen thuần túy, không có màu đỏ */}
                  {stick.char && (
                    <span 
                      className="text-[6px] font-serif font-bold select-none leading-none pt-0.5"
                      style={{
                        color: '#15110E',
                        opacity: 0.95
                      }}
                    >
                      {stick.char}
                    </span>
                  )}
                </motion.div>
              );
            })}

            {/* ========================================================================= */}
            {/* LỚP 3: THẺ ĐỊNH MỆNH TRỖI DẬY & RƠI XUỐNG BÊN GÓC PHẢI CHẾCH 20 ĐỘ */}
            {/* ========================================================================= */}
            {(phase === 'rising' || phase === 'pause' || phase === 'falling' || phase === 'landed') && (
              <motion.div
                initial={{ y: 0, x: 2, rotateZ: 0 }}
                animate={
                  phase === 'rising' ? {
                    y: -100,
                    x: 4,
                    rotateZ: 2,
                    scale: 1.05
                  } : phase === 'pause' ? {
                    y: -105,
                    x: 10,
                    rotateZ: 5,
                    scale: 1.06
                  } : phase === 'falling' ? {
                    // Quỹ đạo rơi parabol lượn xuống bên góc phải của bình
                    y: [ -105, -42, 0 ],
                    x: [ 10, 32, 48 ],
                    rotateZ: [ 5, 22, 20 ],
                    rotateY: [ 0, 35, 0 ],
                    scale: 1.02
                  } : { // landed: Tiếp đất nằm chếch 20 độ bên góc phải của bình
                    y: 0,
                    x: 48,
                    rotateZ: 20,
                    rotateY: 0,
                    scale: 1
                  }
                }
                transition={
                  phase === 'rising' ? {
                    duration: 0.65,
                    ease: [0.22, 1, 0.36, 1]
                  } : phase === 'pause' ? {
                    duration: 0.26
                  } : phase === 'falling' ? {
                    duration: 0.55,
                    ease: [0.45, 0.05, 0.55, 0.95]
                  } : {
                    type: "spring",
                    stiffness: 340,
                    damping: 24
                  }
                }
                style={{
                  left: 'calc(50% - 3.5px)',
                  bottom: 0,
                  width: '7.0px',
                  height: '168px',
                  transformOrigin: 'bottom center',
                  zIndex: 45,
                  // Màu đũa tre mộc đồng nhất, không có màu đỏ
                  background: 'linear-gradient(to top, #BA9054 0%, #CEAA6E 30%, #DFBE84 70%, #ECD39E 100%)',
                  borderRadius: '2px 2px 1px 1px',
                  boxShadow: '0 4px 12px rgba(80,50,20,0.45)',
                  borderLeft: '1px solid rgba(255,255,255,0.55)',
                  borderRight: '1px solid rgba(110,75,30,0.35)'
                }}
                className="absolute flex flex-col items-center justify-start overflow-hidden pt-1.5"
              >
                {/* Tên Quẻ chữ Hán viết dọc - Mực đen thuần túy */}
                <div className="flex flex-col items-center gap-1 pt-0.5 w-full">
                  {destinedFortune?.chineseName ? (
                    destinedFortune.chineseName.split('').map((char, idx) => (
                      <span 
                        key={idx}
                        className="text-[7.5px] font-serif font-bold select-none leading-none"
                        style={{
                          color: '#15110E',
                          opacity: 0.95
                        }}
                      >
                        {char}
                      </span>
                    ))
                  ) : (
                    <span 
                      className="text-[7.5px] font-serif font-bold select-none leading-none"
                      style={{
                        color: '#15110E',
                        opacity: 0.95
                      }}
                    >
                      吉
                    </span>
                  )}
                </div>

                {/* Điểm thắt chỉ đen sẫm mộc ở chân thẻ */}
                <div className="mt-auto mb-2 w-1.5 h-1 rounded-full bg-[#2A1E14]/60" />
              </motion.div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* LỚP 4: THÂN BÌNH HÌNH THANG PHÍA TRƯỚC + VÀNH TRƯỚC MIỆNG OVAL 3D */}
          {/* ========================================================================= */}
          <svg 
            width="76" 
            height="176" 
            viewBox="0 0 76 176" 
            className="absolute bottom-0 pointer-events-none"
            style={{ zIndex: 20 }}
          >
            <defs>
              {/* Gradient thân bình tre mộc tự nhiên */}
              <linearGradient id="bodyBambooGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7E5624" />
                <stop offset="10%" stopColor="#9C7238" />
                <stop offset="25%" stopColor="#BE9556" />
                <stop offset="50%" stopColor="#DFBA7D" />
                <stop offset="75%" stopColor="#BE9556" />
                <stop offset="90%" stopColor="#9C7238" />
                <stop offset="100%" stopColor="#6E481B" />
              </linearGradient>

              {/* Gradient màu tre mộc ĐỒNG NHẤT cho toàn bộ vành miệng (Unified Rim - Không lệch màu) */}
              <linearGradient id="unifiedRimGradFront" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8C5F28" />
                <stop offset="20%" stopColor="#C49A58" />
                <stop offset="50%" stopColor="#DFBA7D" />
                <stop offset="80%" stopColor="#C49A58" />
                <stop offset="100%" stopColor="#8C5F28" />
              </linearGradient>

              {/* Gradient đai niềng mây đồng */}
              <linearGradient id="hoopBandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4B2C0E" />
                <stop offset="25%" stopColor="#9E763B" />
                <stop offset="50%" stopColor="#D8AF6E" />
                <stop offset="75%" stopColor="#9E763B" />
                <stop offset="100%" stopColor="#4B2C0E" />
              </linearGradient>
            </defs>

            {/* 1. Thân bình hình thang: Các mảnh tre ghép kéo dài xuống tận mép đáy tiếp sàn (Không có oval nâu) */}
            <path 
              d="M 2,15 A 36,12 0 0,0 74,15 L 58,164 A 20,6 0 0,1 18,164 Z" 
              fill="url(#bodyBambooGrad)" 
              stroke="#3E2208" 
              strokeWidth="1.2" 
            />

            {/* 2. Các rãnh nan tre hội tụ chạy dọc thân bình kéo dài xuống tận mép đáy cong */}
            {[0.16, 0.28, 0.40, 0.50, 0.60, 0.72, 0.84].map((ratio, idx) => {
              const topX = 2 + 72 * ratio;
              const topY = 15 + 12 * Math.sin(Math.PI * ratio);
              const botX = 18 + 40 * ratio;
              const botY = 164 + 6 * Math.sin(Math.PI * ratio);
              return (
                <g key={idx}>
                  {/* Rãnh bóng đổ giữa các nan tre */}
                  <line 
                    x1={topX} 
                    y1={topY} 
                    x2={botX} 
                    y2={botY} 
                    stroke="rgba(50, 25, 5, 0.45)" 
                    strokeWidth="1" 
                  />
                  {/* Sợi highlight sáng cạnh nan tre */}
                  <line 
                    x1={topX + 0.6} 
                    y1={topY} 
                    x2={botX + 0.4} 
                    y2={botY} 
                    stroke="rgba(255, 255, 255, 0.22)" 
                    strokeWidth="0.5" 
                  />
                </g>
              );
            })}

            {/* 3. Đai niềng ngang trên (Upper Hoop Band) uốn theo cung tròn 3D */}
            <path 
              d="M 6.5,52 A 32,9.5 0 0,0 69.5,52 L 68.5,57.5 A 31,9.2 0 0,1 7.5,57.5 Z" 
              fill="url(#hoopBandGrad)" 
              stroke="#2E1604" 
              strokeWidth="0.8" 
            />

            {/* 4. Đai niềng ngang dưới (Lower Hoop Band) uốn theo cung tròn 3D */}
            <path 
              d="M 14,118 A 24,7 0 0,0 62,118 L 61.2,123.5 A 23.5,6.8 0 0,1 14.8,123.5 Z" 
              fill="url(#hoopBandGrad)" 
              stroke="#2E1604" 
              strokeWidth="0.8" 
            />

            {/* 5. VÀNH TRƯỚC CỦA MIỆNG OVAL (Front Rim Lip) - CÙNG MÀU ĐỒNG NHẤT, KHÔNG CÓ GẠCH NỐI Ở 2 MÚT */}
            {/* Tô cùng màu unifiedRimGradFront với vành sau, chỉ vẽ viền elip ngoài & trong, không vẽ vạch ngăn cách */}
            <path 
              d="M 2,15 A 36,12 0 0,0 74,15 L 67,15 A 29,8.5 0 0,1 9,15 Z" 
              fill="url(#unifiedRimGradFront)" 
            />

            {/* Viền ngoài cung trước (Nối mượt mà với cung sau thành elip ngoài hoàn chỉnh) */}
            <path 
              d="M 2,15 A 36,12 0 0,0 74,15" 
              fill="none" 
              stroke="#3E2208" 
              strokeWidth="1.2" 
            />

            {/* Viền trong cung trước (Nối mượt mà với cung sau thành elip trong hoàn chỉnh) */}
            <path 
              d="M 9,15 A 29,8.5 0 0,0 67,15" 
              fill="none" 
              stroke="rgba(0, 0, 0, 0.85)" 
              strokeWidth="1.6" 
            />

            {/* Highlight sáng nhẹ mép ngoài của vành trước */}
            <path 
              d="M 4,16.5 A 34,11 0 0,0 72,16.5" 
              fill="none" 
              stroke="rgba(255, 255, 255, 0.45)" 
              strokeWidth="0.8" 
            />

            {/* 6. Mép cong đáy bình tiếp xúc sàn (Chỉ là đường viền đáy, không có mảng oval nâu) */}
            <path 
              d="M 18,164 A 20,6 0 0,0 58,164" 
              fill="none" 
              stroke="#3E2208" 
              strokeWidth="1.2" 
            />
          </svg>

          {/* ========================================================================= */}
          {/* LỚP 5: BÓNG ĐỔ CHÂN ỐNG TRÊN SÀN (Contact Ground Shadow) */}
          {/* ========================================================================= */}
          <motion.div 
            animate={
              phase === 'shaking' || isPressing ? {
                scaleX: [1, 1.2, 0.9, 1.15, 1],
                opacity: [0.4, 0.6, 0.35, 0.55, 0.4]
              } : {
                scaleX: 1 + Math.abs(interactiveTilt.rotateZ) * 0.02,
                opacity: 0.45
              }
            }
            transition={{ duration: 0.35 }}
            className="rounded-[50%] -mt-1 z-1 pointer-events-none"
            style={{
              width: '68px',
              height: '10px',
              background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.22) 0%, rgba(15,23,42,0.05) 65%, transparent 100%)',
              filter: 'blur(2.5px)'
            }}
          />
        </motion.div>
      </div>

      {/* CHỈ DẪN TƯƠNG TÁC THÔNG MINH */}
      <div className="text-center pt-0.5 space-y-1">
        {phase === 'idle' && (
          <p className="text-[11px] font-sans font-medium flex items-center justify-center gap-1.5 text-emerald-900/80 select-none">
            <Hand size={12} className={isPressing ? "text-emerald-600 animate-bounce" : "text-emerald-600"} />
            <span>
              {isPressing 
                ? "Đang lắc theo nhịp tay... Lắc qua lại để rút thẻ!" 
                : "Ấn & giữ chuột vào ống tre để lắc theo nhịp tay"}
            </span>
          </p>
        )}

        {/* Thanh tiến độ năng lượng lắc (Hiện khi đang nhấn giữ) */}
        {isPressing && phase === 'idle' && (
          <div className="w-28 h-1.5 bg-emerald-100 rounded-full mx-auto overflow-hidden shadow-inner">
            <motion.div 
              className="h-full rounded-full"
              style={{ 
                width: `${shakeProgress}%`,
                background: 'linear-gradient(to right, #10B981, #047857)'
              }}
            />
          </div>
        )}
      </div>

      {/* NÚT BẤM HÀNH ĐỘNG XANH TRÚC PHỈ THÚY HOÀNG GIA (Imperial Jade Emerald - Hứng khởi & Thanh tịnh) */}
      <div className="pt-1.5 w-full flex justify-center">
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={phase !== 'idle' || isPressing}
          className="w-full sm:w-auto min-w-[200px] px-6 py-2.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.98] shadow-md hover:shadow-lg"
          style={{
            background: phase === 'idle' 
              ? 'linear-gradient(to right, #047857, #059669, #047857)'
              : '#064E3B',
            color: '#FFFFFF',
            border: '1px solid #10B981',
            boxShadow: '0 4px 14px rgba(5,150,105,0.28)'
          }}
          aria-label="Xóc Quẻ Ngày Mới"
        >
          <Sparkles size={13} className={phase === 'shaking' ? "animate-spin text-emerald-200" : "text-emerald-200"} />
          <span className="tracking-wide">
            {phase === 'idle' 
              ? (isPressing ? `Đang Lắc Khí Vận (${shakeProgress}%)` : "Xóc Quẻ Ngày Mới")
              : phase === 'shaking' 
              ? "Đang Hòa Khí Vận..." 
              : "Thẻ Quẻ Đang Rơi Ra..."}
          </span>
        </button>
      </div>
    </div>
  );
}
