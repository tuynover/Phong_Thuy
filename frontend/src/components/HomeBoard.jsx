import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Calendar, 
  Heart, 
  History, 
  Sparkles, 
  Brain, 
  Clock, 
  ShieldCheck, 
  Database, 
  ArrowRight, 
  ChevronRight, 
  Users, 
  CheckCircle, 
  BarChart3, 
  Activity,
  Play,
  X
} from 'lucide-react';

// Custom clean animations for subtle modern rendering
const cardsContainerVariants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};
const cardItemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: "easeOut"
    }
  }
};

export default function HomeBoard({ onSelectModule, user, onRequireLogin, onViewDestiny }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  // Xem Vận Mệnh states
  const [isDestinyModalOpen, setIsDestinyModalOpen] = useState(false);
  const [destinyDay, setDestinyDay] = useState('');
  const [destinyMonth, setDestinyMonth] = useState('');
  const [destinyYear, setDestinyYear] = useState('');
  const [destinyHour, setDestinyHour] = useState('');
  const [destinyGender, setDestinyGender] = useState('Nam');

  const daysOptions = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const monthsOptions = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const yearsOptions = Array.from({ length: 97 }, (_, i) => String(2026 - i));
  const hoursOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  const handleDestinySubmit = (target) => {
    if (!destinyDay || !destinyMonth || !destinyYear || destinyHour === '') {
      alert('Vui lòng chọn đầy đủ ngày tháng năm giờ sinh.');
      return;
    }
    if (onViewDestiny) {
      onViewDestiny({
        day: destinyDay,
        month: destinyMonth,
        year: destinyYear,
        hour: destinyHour,
        gender: destinyGender,
        target
      });
      setIsDestinyModalOpen(false);
    }
  };

  // Modules catalog data
  const modules = [
    {
      id: 'iching',
      name: 'Kinh Dịch Lục Hào',
      slogan: 'Dịch Lý Tầm Khảo',
      desc: 'Gieo quẻ hỏi việc, phân tích quái tượng động hào để dự đoán cát hung cát tường cát khánh.',
      icon: Compass,
      color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30 hover:shadow-indigo-500/10',
      iconColor: 'text-indigo-600',
      glow: 'rgba(99, 102, 241, 0.15)',
      badge: 'Ý niệm & Hướng giải quyết'
    },
    {
      id: 'bazi',
      name: 'Tứ Trụ Bát Tự',
      slogan: 'Lược Đồ Sinh Mệnh',
      desc: 'Phân tích thiên can địa chi giờ ngày tháng năm sinh, định dụng thần cân bằng ngũ hành bản mệnh.',
      icon: Activity,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 hover:shadow-blue-500/10',
      iconColor: 'text-blue-600',
      glow: 'rgba(59, 130, 246, 0.15)',
      badge: 'Vượng suy ngũ hành'
    },
    {
      id: 'ziwei',
      name: 'Mệnh Số Tử Vi',
      slogan: 'Tinh Đồ Đại Hạn',
      desc: 'An sao lập mệnh bàn 12 cung chi tiết, luận giải công danh, tài lộc, gia đạo và đại tiểu hạn.',
      icon: BarChart3,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:shadow-purple-500/10',
      iconColor: 'text-purple-600',
      glow: 'rgba(168, 85, 247, 0.15)',
      badge: 'Đại vận 10 năm'
    },
    {
      id: 'marriage',
      name: 'Bát Tự Hợp Hôn',
      slogan: 'Duyên Phận Phu Thê',
      desc: 'Đối chiếu mệnh lý, thập thần, cung phi bát quái của cặp đôi để tìm ra điểm hòa hợp và hóa giải.',
      icon: Heart,
      color: 'from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:shadow-rose-500/10',
      iconColor: 'text-rose-600',
      glow: 'rgba(244, 63, 94, 0.15)',
      badge: 'Hôn nhân hạnh phúc'
    },
    {
      id: 'xemngay',
      name: 'Trạch Cát Nhật',
      slogan: 'Xem Ngày Đại Cát',
      desc: 'Chọn giờ hoàng đạo, ngày tốt động thổ, cưới hỏi, khai trương cá nhân hóa theo thiên can địa chi tuổi.',
      icon: Calendar,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:shadow-emerald-500/10',
      iconColor: 'text-emerald-600',
      glow: 'rgba(16, 185, 129, 0.15)',
      badge: 'Xu cát tị hung'
    }
  ];

  // Simulated live feed of analyses
  const liveFeeds = [
    { type: 'Kinh Dịch', detail: 'Quẻ Địa Thiên Thái - Xem thăng tiến sự nghiệp', status: 'Cát lợi', time: 'Vừa xong' },
    { type: 'Bát Tự', detail: 'Nam mạng Giáp Tuất - Dụng thần: Mộc, Hỏa', status: 'Thăng hoa', time: '1 phút trước' },
    { type: 'Tử Vi', detail: 'Mệnh Vô Chính Diệu đắc Tam Không - Cung Mệnh tại Thân', status: 'Kỳ tài', time: '3 phút trước' },
    { type: 'Hợp Hôn', detail: 'Bính Tý (96) & Canh Thìn (00) - Độ hợp: 88%', status: 'Hòa hợp', time: '5 phút trước' },
    { type: 'Trạch Cát', detail: 'Ngày Giáp Tý - Động thổ làm nhà hướng Nam', status: 'Giờ Ngọ đại cát', time: '8 phút trước' },
    { type: 'Kinh Dịch', detail: 'Quẻ Hỏa Lôi Phệ Hạp - Hỏi về tranh chấp tài sản', status: 'Phải kiên nhẫn', time: '10 phút trước' },
    { type: 'Bát Tự', detail: 'Nữ mạng Nhâm Thân - Thân nhược cần Ấn trợ', status: 'Bổ trợ Kim', time: '12 phút trước' }
  ];

  const marqueeItems = [...liveFeeds, ...liveFeeds, ...liveFeeds];

  return (
    <div className="relative w-full overflow-hidden bg-slate-50 font-sans pb-24 text-slate-800">
      <div className="noise-overlay" />

      {/* Dynamic Aurora Glow Spheres */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/30 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-200/25 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-20%] w-[50%] h-[50%] rounded-full bg-emerald-100/30 blur-[150px] pointer-events-none" />

      {/* 1. HERO SECTION */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative max-w-6xl mx-auto px-4 pt-12 md:pt-20 pb-16 md:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10"
      >
        <div className="lg:col-span-7 space-y-6 md:space-y-8">
          <motion.h1 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.08] font-[Montserrat]"
          >
            Khám phá vận mệnh <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent">
              bằng hệ thống luận giải chuyên sâu
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl"
          >
            Hệ thống phân tích Bát Tự chuyên sâu, gieo quẻ Kinh Dịch Lục Hào, định vận mệnh Tử Vi, xem tuổi kết hôn và lựa chọn ngày lành. Trình bày khoa học, chính xác và giải luận tức thời qua hệ thống luận giải chuyên sâu.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.18, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button
              onClick={() => setIsDestinyModalOpen(true)}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span>Xem Vận Mệnh</span>
              <Sparkles size={16} />
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('modules-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl font-semibold shadow-sm hover:shadow transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm flex items-center justify-center gap-2 focus:outline-none"
            >
              <Play size={14} className="fill-slate-800 text-slate-800" />
              <span>Khám phá tính năng</span>
            </button>
          </motion.div>
        </div>

        {/* Static SVG Bagua and Constellation Illustration */}
        <div className="lg:col-span-5 flex justify-center items-center relative">
          {/* Outer glowing halo */}
          <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 blur-[60px]" />
          
          <div className="relative w-72 h-72 sm:w-96 sm:h-96">
            {/* SVG Constellation RINGS & STARS */}
            <svg 
              viewBox="0 0 400 400" 
              className="w-full h-full overflow-visible"
              style={{
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Star paths and Concentric Rings */}
              <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="0.8" />
              <circle cx="200" cy="200" r="175" fill="none" stroke="rgba(99,102,241,0.09)" strokeWidth="1" strokeDasharray="3 5" />
              <circle cx="200" cy="200" r="145" fill="none" stroke="rgba(168,85,247,0.08)" strokeWidth="1.2" strokeDasharray="12 6" />
              <circle cx="200" cy="200" r="115" fill="none" stroke="rgba(16,185,129,0.07)" strokeWidth="1" strokeDasharray="6 6" />

              {/* Big Dipper Constellation (Chòm sao Bắc Đẩu) */}
              <polyline points="70,70 110,65 140,85 160,115 190,120 200,150 240,155" fill="none" stroke="rgba(99,102,241,0.18)" strokeWidth="1" strokeDasharray="2 2" />
              <circle cx="70" cy="70" r="3.5" fill="#818cf8" opacity="0.9" />
              <circle cx="110" cy="65" r="3" fill="#818cf8" opacity="0.85" />
              <circle cx="140" cy="85" r="3.5" fill="#818cf8" opacity="0.9" />
              <circle cx="160" cy="115" r="3" fill="#818cf8" opacity="0.8" />
              <circle cx="190" cy="120" r="4" fill="#a78bfa" opacity="0.95" />
              <circle cx="200" cy="150" r="3" fill="#818cf8" opacity="0.85" />
              <circle cx="240" cy="155" r="4.5" fill="#a78bfa" opacity="0.95" />

              {/* Mystical Constellation Stars */}
              <circle cx="50" cy="220" r="2.5" fill="#f43f5e" opacity="0.6" />
              <circle cx="350" cy="180" r="2" fill="#38bdf8" opacity="0.75" />
              <circle cx="320" cy="90" r="3" fill="#fbbf24" opacity="0.7" />
              <circle cx="130" cy="340" r="2" fill="#34d399" opacity="0.65" />
              <circle cx="280" cy="320" r="3.5" fill="#fb7185" opacity="0.75" />
              <circle cx="340" cy="280" r="2.5" fill="#a78bfa" opacity="0.8" />
              <circle cx="90" cy="290" r="3" fill="#f43f5e" opacity="0.7" />
              <circle cx="200" cy="25" r="4" fill="#60a5fa" opacity="0.9" />
              <circle cx="200" cy="375" r="3" fill="#34d399" opacity="0.8" />

              {/* CENTRAL BAGUA (BÁT QUÁI ĐẦY ĐỦ 8 QUẺ) */}
              <g>
                <circle cx="200" cy="200" r="74" fill="rgba(255,255,255,0.85)" stroke="rgba(148,163,184,0.25)" strokeWidth="1.5" className="backdrop-blur-sm" />
                <circle cx="200" cy="200" r="66" fill="none" stroke="rgba(99, 102, 241, 0.12)" strokeWidth="1.5" />
                
                {/* Yin Yang Symbol */}
                <path d="M 200,168 A 16,16 0 0,0 200,200 A 16,16 0 0,1 200,232 A 32,32 0 0,1 200,168 Z" fill="rgba(15,23,42,0.85)" />
                <path d="M 200,168 A 16,16 0 0,0 200,200 A 16,16 0 0,1 200,232 A 32,32 0 0,0 200,168 Z" fill="rgba(255,255,255,0.95)" stroke="rgba(15,23,42,0.1)" strokeWidth="0.8" />
                <circle cx="200" cy="184" r="4.5" fill="white" />
                <circle cx="200" cy="216" r="4.5" fill="rgba(15,23,42,0.85)" />
                
                {/* 1. CÀN (☰) - 0 deg */}
                <g transform="rotate(0 200 200)">
                  <rect x="185" y="112" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="119" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="126" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                </g>

                {/* 2. TỐN (☴) - 45 deg */}
                <g transform="rotate(45 200 200)">
                  <rect x="185" y="112" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="119" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="126" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="126" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                </g>

                {/* 3. KHẢM (☵) - 90 deg */}
                <g transform="rotate(90 200 200)">
                  <rect x="185" y="112" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="112" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="119" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="126" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="126" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                </g>

                {/* 4. CẤN (☶) - 135 deg */}
                <g transform="rotate(135 200 200)">
                  <rect x="185" y="112" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="119" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="119" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="126" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="126" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                </g>

                {/* 5. KHÔN (☷) - 180 deg */}
                <g transform="rotate(180 200 200)">
                  <rect x="185" y="112" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="112" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="119" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="119" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="126" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="126" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                </g>

                {/* 6. CHẤN (☳) - 225 deg */}
                <g transform="rotate(225 200 200)">
                  <rect x="185" y="112" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="112" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="119" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="119" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="126" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                </g>

                {/* 7. LY (☲) - 270 deg */}
                <g transform="rotate(270 200 200)">
                  <rect x="185" y="112" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="119" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="119" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="126" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                </g>

                {/* 8. ĐOÀI (☱) - 315 deg */}
                <g transform="rotate(315 200 200)">
                  <rect x="185" y="112" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="202" y="112" width="13" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="119" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                  <rect x="185" y="126" width="30" height="3" rx="1" fill="rgba(15,23,42,0.8)" />
                </g>

                {/* Text Labels for Trigrams */}
                <text x="200" y="58" textAnchor="middle" className="text-[10px] font-black fill-slate-700/80 font-serif">☰ CÀN</text>
                <text x="300" y="100" textAnchor="middle" className="text-[10px] font-black fill-slate-700/80 font-serif">☴ TỐN</text>
                <text x="342" y="204" textAnchor="middle" className="text-[10px] font-black fill-slate-700/80 font-serif">☵ KHẢM</text>
                <text x="300" y="308" textAnchor="middle" className="text-[10px] font-black fill-slate-700/80 font-serif">☶ CẤN</text>
                <text x="200" y="350" textAnchor="middle" className="text-[10px] font-black fill-slate-700/80 font-serif">☷ KHÔN</text>
                <text x="100" y="308" textAnchor="middle" className="text-[10px] font-black fill-slate-700/80 font-serif">☳ CHẤN</text>
                <text x="58" y="204" textAnchor="middle" className="text-[10px] font-black fill-slate-700/80 font-serif">☲ LY</text>
                <text x="100" y="100" textAnchor="middle" className="text-[10px] font-black fill-slate-700/80 font-serif">☱ ĐOÀI</text>
              </g>
            </svg>
          </div>
        </div>
      </motion.section>

      {/* 5. KIẾN THỨC PHONG THỦY CỔ HỌC */}
      <motion.section 
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="bg-white/60 border-y border-slate-200/50 py-16 md:py-24 relative z-10 backdrop-blur-md"
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest font-[Montserrat]">Tri Thức Cổ Học</span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-[Montserrat]">Kiến Thức Phong Thủy</h2>
            <p className="text-slate-500 font-medium text-sm sm:text-base leading-relaxed">Giải thích cơ bản về các học thuyết mệnh lý Đông Phương cổ học nền tảng.</p>
          </div>

          <motion.div 
            variants={cardsContainerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <motion.div variants={cardItemVariants} className="p-8 bg-white border border-slate-200/70 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100">
                <Compass size={22} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-3">Kinh Dịch</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
                Hệ thống triết học cổ đại dựa trên 64 quẻ dịch đại diện cho sự biến thiên âm dương của vạn vật. Kinh Dịch giúp người dùng thấu suốt bản chất diễn biến sự việc để đưa ra quyết định hành động sáng suốt phù hợp thời cơ cát hung.
              </p>
            </motion.div>

            <motion.div variants={cardItemVariants} className="p-8 bg-white border border-slate-200/70 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 border border-blue-100">
                <Activity size={22} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-3">Bát Tự</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
                Học thuyết Tứ Trụ Tử Bình phân tích tương quan ngũ hành nạp âm của 4 trụ: Giờ, Ngày, Tháng, Năm sinh. Bát Tự tìm kiếm thế cân bằng thông qua Dụng Thần cải mệnh, định hướng nghề nghiệp và đời sống.
              </p>
            </motion.div>

            <motion.div variants={cardItemVariants} className="p-8 bg-white border border-slate-200/70 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6 border border-purple-100">
                <BarChart3 size={22} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-3">Tử Vi</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
                Môn mệnh lý học đồ sộ lập bản đồ tinh bàn 12 cung số, định vị các cát tinh, hung tinh trên lá số mệnh cách. Tử Vi dự báo tổng quan từ tính cách, công danh đến các chu kỳ đại vận/tiểu hạn trong suốt đời người.
              </p>
            </motion.div>

            <motion.div variants={cardItemVariants} className="p-8 bg-white border border-slate-200/70 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100">
                <Calendar size={22} />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg mb-3">Trạch Cát Nhật</h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed font-sans">
                Phương pháp chọn lựa thời gian cát lành (Trạch cát nhật) dựa trên can chi, thập nhị kiến tinh và nhị thập bát tú. Trạch cát giúp chọn lựa thời gian động thổ, cưới hỏi, khai trương thu hút cát khí tốt nhất.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* 2. MODULE CARDS GRID */}
      <motion.section 
        id="modules-section" 
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative z-10"
      >
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20 space-y-4">
          <h2 className="text-sm font-extrabold text-indigo-600 uppercase tracking-widest font-[Montserrat]">Hệ Sinh Thái Phong Thủy</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-[Montserrat]">
            5 phân hệ tinh tuyển
          </p>
          <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
            Mỗi mô-đun được kế thừa trọn vẹn lý luận học thuật Cổ học Phương Đông, tích hợp hệ thống luận giải học thuật.
          </p>
        </div>

        <motion.div 
          variants={cardsContainerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {modules.map((item, idx) => {
            const Icon = item.icon;
            const isHovered = hoveredCard === item.id;
            return (
              <motion.div
                key={item.id}
                variants={cardItemVariants}
                onMouseEnter={() => setHoveredCard(item.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => onSelectModule(item.id)}
                className="group relative flex flex-col p-8 rounded-3xl bg-white/70 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-2xl hover:border-slate-300/50 cursor-pointer transition-all duration-550 h-full backdrop-blur-md"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isHovered ? 'translateY(-6px)' : 'none'
                }}
              >
                {/* Accent glow on hover */}
                <div 
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 50% 20%, ${item.glow}, transparent 65%)`
                  }}
                />

                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl bg-slate-100/80 group-hover:bg-white group-hover:shadow-md transition-all duration-300 ${item.iconColor}`}>
                    <Icon size={24} className="stroke-[2.2]" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100/60 px-2.5 py-1 rounded-full group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {item.badge}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">{item.slogan}</span>
                  <h3 className="text-xl font-extrabold text-slate-900 font-[Montserrat]">{item.name}</h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>

                <div className="mt-8 flex items-center text-xs font-bold text-slate-400 group-hover:text-indigo-600 transition-colors pt-4 border-t border-slate-100">
                  <span>Trải nghiệm mô-đun</span>
                  <ChevronRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.section>

      {/* 3. AI DIFFERENTIATOR SECTION */}
      <motion.section 
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative z-10"
      >
        <div className="p-8 md:p-16 rounded-[2.5rem] bg-gradient-to-tr from-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(126,34,206,0.18),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(16,185,129,0.08),transparent_50%)]" />
          
          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest font-[Montserrat]">Học thuật chính thống</span>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight font-[Montserrat] leading-none">
                Hệ thống luận giải logic
              </h2>
              <p className="text-slate-300 font-medium leading-relaxed text-sm sm:text-base">
                Chúng tôi có hệ thống luận giải logic học thuật chính xác 100% từ cổ học phương Đông, tách biệt hoàn toàn giữa tính toán an sao lập quẻ tĩnh và hệ thống luận giải logic.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="flex gap-4">
                  <div className="p-3 bg-white/10 rounded-xl h-fit shrink-0"><Brain size={18} className="text-indigo-300" /></div>
                  <div>
                    <h4 className="font-bold text-sm">Luận Giải Logic</h4>
                    <p className="text-xs text-slate-400 leading-normal mt-1">Hệ thống xâu chuỗi thông tin sao hạn để tự giải nghĩa phù hợp bối cảnh hiện đại.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="p-3 bg-white/10 rounded-xl h-fit shrink-0"><Clock size={18} className="text-indigo-300" /></div>
                  <div>
                    <h4 className="font-bold text-sm">Phản Hồi Siêu Tốc</h4>
                    <p className="text-xs text-slate-400 leading-normal mt-1">Cơ chế stream kết quả thời gian thực qua Server-Sent Events (SSE).</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="p-3 bg-white/10 rounded-xl h-fit shrink-0"><ShieldCheck size={18} className="text-indigo-300" /></div>
                  <div>
                    <h4 className="font-bold text-sm">Bảo Mật Quyền Sở Hữu</h4>
                    <p className="text-xs text-slate-400 leading-normal mt-1">Bản ghi lịch sử bảo mật nghiêm ngặt bằng JWT Token và checkOwnership.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="p-3 bg-white/10 rounded-xl h-fit shrink-0"><Database size={18} className="text-indigo-300" /></div>
                  <div>
                    <h4 className="font-bold text-sm">Đồng Bộ Cloud</h4>
                    <p className="text-xs text-slate-400 leading-normal mt-1">Dễ dàng lưu trữ và mở lại kết quả từ tài khoản cá nhân mọi lúc.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Illustration simulated analysis board */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative">
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Logic Consultation Engine</span>
                </div>
                <div className="space-y-4">
                  <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 text-xs">
                    <p className="text-slate-400 font-bold uppercase tracking-wide text-[9px] mb-1">Dữ liệu đầu vào học thuật</p>
                    <p className="text-slate-200 font-semibold font-[Lora]">Nam mạng Giáp Tuất - Ngày sinh âm lịch ngày 24/09 năm Giáp Tuất. Thân nhược cần trợ giúp bởi ngũ hành Mộc/Hỏa.</p>
                  </div>
                  <div className="p-3.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold uppercase tracking-wide text-[9px] mb-1">
                      <Sparkles size={10} className="animate-spin" style={{ animationDuration: '4s' }} />
                      <span>Luận giải logic hệ thống (Realtime stream)</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-medium font-[Lora]">
                      Lá số này có Dụng Thần là Mộc, Hỷ Thần là Hỏa. Trong đại vận Bính Dần sắp tới, hành Mộc vượng hỗ trợ bổ trợ đắc lực cho bản mệnh. Sự nghiệp hanh thông, nên chú trọng đầu tư các dự án...
                    </p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-2">
                    <span>Độ tin cậy: 98%</span>
                    <span>Phản hồi: 0.12s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. HOW IT WORKS (STORYTELLING TIMELINE) */}
      <motion.section 
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-6xl mx-auto px-4 py-16 md:py-24 relative z-10"
      >
        <div className="text-center max-w-2xl mx-auto mb-16 md:mb-20 space-y-3">
          <span className="text-xs font-extrabold text-indigo-600 uppercase tracking-widest font-[Montserrat]">3 bước đơn giản</span>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-[Montserrat]">Quy trình hoạt động</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Timeline Connector Line */}
          <div className="hidden md:block absolute top-16 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-indigo-200 via-purple-200 to-emerald-200 -z-10" />

          {/* Step 1 */}
          <div className="text-center space-y-6 group">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-extrabold text-xl text-indigo-600 mx-auto shadow-md group-hover:scale-110 transition-transform duration-300">
              01
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">Chọn Phân Hệ</h3>
              <p className="text-sm text-slate-500 font-medium px-4">Lựa chọn Kinh Dịch, Bát Tự, Tử Vi, Hôn Nhân hoặc Xem Ngày tùy nhu cầu chiêm nghiệm.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="text-center space-y-6 group">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center font-extrabold text-xl text-purple-600 mx-auto shadow-md group-hover:scale-110 transition-transform duration-300">
              02
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">Nhập Thông Tin</h3>
              <p className="text-sm text-slate-500 font-medium px-4">Cung cấp ngày giờ sinh (Bát tự/Tử vi) hoặc tập trung ý niệm gieo quẻ (Kinh Dịch).</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="text-center space-y-6 group">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center font-extrabold text-xl text-emerald-600 mx-auto shadow-md group-hover:scale-110 transition-transform duration-300">
              03
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">Nhận Luận Giải Học Thuật</h3>
              <p className="text-sm text-slate-500 font-medium px-4">Nhận ngay đồ hình học thuật bản mệnh và phân tích luận giải chi tiết từ hệ thống phân tích logic.</p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 6. RECENT ANALYSIS (INFINITE HORIZONTAL MARQUEE FLOW) */}
      <motion.section 
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="py-16 md:py-24 overflow-hidden relative z-10"
      >
        <div className="max-w-6xl mx-auto px-4 mb-12">
          <h2 className="text-sm font-extrabold text-purple-600 uppercase tracking-widest font-[Montserrat] mb-2">Hoạt động thời gian thực</h2>
          <p className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 font-[Montserrat]">
            Phân tích gần đây
          </p>
        </div>

        {/* Marquee scroll block */}
        <div className="w-full flex overflow-hidden relative py-4">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />
          
          <div className="animate-marquee gap-6 flex pr-6">
            {marqueeItems.map((item, idx) => (
              <div 
                key={idx} 
                className="w-[280px] sm:w-[320px] p-5 rounded-2xl bg-white border border-slate-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-slate-300 transition-all duration-300 flex flex-col justify-between shrink-0"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      item.type === 'Kinh Dịch' ? 'bg-indigo-50 text-indigo-700' :
                      item.type === 'Bát Tự' ? 'bg-blue-50 text-blue-700' :
                      item.type === 'Tử Vi' ? 'bg-purple-50 text-purple-700' :
                      item.type === 'Hợp Hôn' ? 'bg-rose-50 text-rose-700' :
                      'bg-emerald-50 text-emerald-700'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{item.time}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 font-medium font-[Lora] line-clamp-2 leading-relaxed mb-4">
                    "{item.detail}"
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-t border-slate-100 pt-3">
                  <span>Trạng thái</span>
                  <span className="text-slate-700 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* 5. KIẾN THỨC PHONG THỦY CỔ HỌC ĐÃ ĐƯỢC CHUYỂN LÊN ĐẦU */}

      {/* 7. MINIMAL ELEGANT FOOTER */}
      <footer className="w-full max-w-6xl mx-auto px-4 border-t border-slate-200/80 pt-12 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
                <span className="text-white font-serif font-extrabold text-sm">PT</span>
              </div>
              <span className="font-extrabold text-slate-900 tracking-wider text-sm font-[Montserrat]">PHONG THỦY</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs font-medium">
              Nền tảng ứng dụng mệnh lý học cổ học Đông Phương chính thống kết hợp phương pháp khoa học hiện đại vào đời sống.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Dịch Vụ</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-bold">
              <li><button onClick={() => onSelectModule('iching')} className="hover:text-indigo-600 transition-colors">Kinh Dịch Lục Hào</button></li>
              <li><button onClick={() => onSelectModule('bazi')} className="hover:text-indigo-600 transition-colors">Tứ Trụ Bát Tự</button></li>
              <li><button onClick={() => onSelectModule('ziwei')} className="hover:text-indigo-600 transition-colors">Mệnh Số Tử Vi</button></li>
              <li><button onClick={() => onSelectModule('marriage')} className="hover:text-indigo-600 transition-colors">Bát Tự Hợp Hôn</button></li>
              <li><button onClick={() => onSelectModule('xemngay')} className="hover:text-indigo-600 transition-colors">Chọn Ngày Hoàng Đạo</button></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Liên Kết</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-bold">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Điều khoản dịch vụ</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Liên hệ báo cáo</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest font-[Montserrat]">Cộng Đồng</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-bold">
              <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Github</a></li>
              <li><a href="https://zalo.me/0868960506" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">Zalo Hỗ Trợ</a></li>
              <li><a href="mailto:trinhtuyen270804@gmail.com" className="hover:text-indigo-600 transition-colors">Email Liên Hệ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-bold">
          <p>© 2026 PHONG THỦY. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <span>Bản quyền học thuật phương Đông</span>
            <span>•</span>
            <span>Hệ thống phân tích logic học thuật</span>
          </div>
        </div>
      </footer>

      {/* 8. DESTINY MODAL FORM */}
      <AnimatePresence>
        {isDestinyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDestinyModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            {/* Modal Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-6 md:p-8 max-w-lg w-full z-10 relative space-y-6"
            >
              <button 
                onClick={() => setIsDestinyModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X size={18} />
              </button>

              <div className="text-center space-y-2">
                <h3 className="text-2xl font-extrabold text-slate-900 font-[Montserrat]">Khám Phá Vận Mệnh</h3>
                <p className="text-xs text-slate-500 font-medium">Nhập thông tin ngày giờ sinh dương lịch để đối chiếu mệnh cách.</p>
              </div>

              <div className="space-y-4">
                {/* Giới Tính */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Giới Tính Mệnh Cách</span>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setDestinyGender('Nam')}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${destinyGender === 'Nam' ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Nam Mệnh
                    </button>
                    <button 
                      onClick={() => setDestinyGender('Nữ')}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${destinyGender === 'Nữ' ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Nữ Mệnh
                    </button>
                  </div>
                </div>

                {/* Ngày sinh */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Ngày - Tháng - Năm Sinh (Dương Lịch)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <select 
                      value={destinyDay}
                      onChange={(e) => setDestinyDay(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl block w-full p-2.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Ngày</option>
                      {daysOptions.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select 
                      value={destinyMonth}
                      onChange={(e) => setDestinyMonth(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl block w-full p-2.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Tháng</option>
                      {monthsOptions.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select 
                      value={destinyYear}
                      onChange={(e) => setDestinyYear(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl block w-full p-2.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Năm</option>
                      {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>

                {/* Giờ sinh */}
                <div>
                  <span className="block text-[11px] font-black uppercase text-slate-400 tracking-wider mb-2 ml-1">Giờ Sinh</span>
                  <select 
                    value={destinyHour}
                    onChange={(e) => setDestinyHour(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl block w-full p-2.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Chọn giờ sinh</option>
                    {hoursOptions.map(h => <option key={h} value={h}>{h} giờ</option>)}
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handleDestinySubmit('bazi')}
                  className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
                >
                  Xem Lá Số Bát Tự
                </button>
                <button 
                  onClick={() => handleDestinySubmit('ziwei')}
                  className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm"
                >
                  Xem Lá Số Tử Vi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
