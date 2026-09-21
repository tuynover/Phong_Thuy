import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Compass, 
  Briefcase, 
  Coins, 
  Heart,
  RotateCcw
} from 'lucide-react';
import { 
  getDailyFortune, 
  getTodayDateString, 
  checkHasDrawnDailyFortune, 
  saveDailyFortuneResult,
  getDailyFortuneStorageKey,
  DAILY_FORTUNE_EVENT,
  HEXAGRAM_PALACES,
  PALACE_ELEMENT_THEMES
} from '@/features/iching/data/dailyFortuneData';
import BambooShakerScene from './bamboo/BambooShakerScene';

const RANK_BADGES = {
  "Đại Cát": {
    bg: "border-amber-400/40 text-amber-800",
    pill: "bg-amber-100 text-amber-800 border border-amber-300"
  },
  "Thượng Cát": {
    bg: "border-emerald-500/40 text-emerald-800",
    pill: "bg-emerald-100 text-emerald-800 border border-emerald-300"
  },
  "Trung Cát": {
    bg: "border-sky-500/40 text-sky-800",
    pill: "bg-sky-100 text-sky-800 border border-sky-300"
  },
  "Cẩn Trọng": {
    bg: "border-rose-400/40 text-rose-800",
    pill: "bg-rose-100 text-rose-800 border border-rose-300"
  }
};

// Helper phân tách tên quẻ và ý nghĩa trong ngoặc đơn để xuống dòng thanh thoát
function parseHexagramTitle(fullName) {
  if (!fullName) return { title: '', subtitle: '' };
  const match = fullName.match(/^(.*?)\s*(\(.*?\))$/);
  if (match) {
    return { title: match[1], subtitle: match[2] };
  }
  return { title: fullName, subtitle: '' };
}

export default function DailyFortuneModal({ isOpen, onClose, user }) {
  const [revealedFortune, setRevealedFortune] = useState(null);
  const modalBodyRef = useRef(null);

  const userId = user?.id || user?._id || 'guest';
  const todayStr = getTodayDateString();

  // Tự động cuộn lên đầu khi hiển thị kết quả quẻ
  useEffect(() => {
    if (revealedFortune && modalBodyRef.current) {
      modalBodyRef.current.scrollTop = 0;
    }
  }, [revealedFortune]);

  // Khởi tạo quẻ hôm nay deterministically theo user + ngày
  const destinedFortune = React.useMemo(() => {
    return getDailyFortune(todayStr, userId);
  }, [todayStr, userId]);

  // Đọc kết quả đã lưu trong ngày nếu người dùng đã từng lắc
  useEffect(() => {
    if (isOpen) {
      try {
        const storageKey = getDailyFortuneStorageKey(userId);
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.date === todayStr && parsed.fortune) {
            setRevealedFortune(parsed.fortune);
          } else {
            setRevealedFortune(null);
          }
        } else {
          setRevealedFortune(null);
        }
      } catch (e) {
        setRevealedFortune(null);
      }
    }
  }, [isOpen, userId, todayStr]);

  // Xử lý khi ống tre hoàn thành lắc và thẻ tiếp đất
  const handleShakingComplete = (drawnFortune) => {
    const fortuneToSave = drawnFortune || destinedFortune;
    setRevealedFortune(fortuneToSave);
    saveDailyFortuneResult({
      date: todayStr,
      fortune: fortuneToSave,
      drawnAt: new Date().toISOString()
    }, userId);
  };

  // Nút Reset Phục Vụ Kiểm Thử (Xóa cache hôm nay và hiển thị lại chấm đỏ)
  const handleResetDailyFortune = () => {
    try {
      const storageKey = getDailyFortuneStorageKey(userId);
      localStorage.removeItem(storageKey);
      setRevealedFortune(null);
      window.dispatchEvent(new CustomEvent(DAILY_FORTUNE_EVENT, { detail: { userId, hasDrawn: false } }));
    } catch (e) {
      setRevealedFortune(null);
    }
  };

  if (!isOpen) return null;

  const currentRank = revealedFortune ? (RANK_BADGES[revealedFortune.rank] || RANK_BADGES["Đại Cát"]) : null;

  // Lấy Họ Quẻ & Bảng màu ngũ hành tương ứng cho Hình 1
  const hexagramPalaceInfo = revealedFortune ? (HEXAGRAM_PALACES[revealedFortune.id] || { palace: "Càn", element: "Kim" }) : null;
  const palaceTheme = hexagramPalaceInfo ? (PALACE_ELEMENT_THEMES[hexagramPalaceInfo.element] || PALACE_ELEMENT_THEMES.Kim) : null;
  const { title: hexTitle, subtitle: hexSubtitle } = revealedFortune ? parseHexagramTitle(revealedFortune.hexagramName) : { title: '', subtitle: '' };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
        {/* Backdrop sẫm tập trung thị giác */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm"
        />

        {/* Modal Container: Nền xanh lá tươi mới vô cùng nhẹ (Fresh Spring Celadon Theme) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.12 }}
          className="relative w-full max-w-lg rounded-3xl border border-emerald-200/70 shadow-2xl shadow-emerald-950/15 overflow-hidden my-auto z-10 max-h-[92vh] flex flex-col bg-gradient-to-b from-[#F2FBF7] via-white to-[#F0FAF5]"
        >
          {/* Header Bar: Nền sáng ngọc thanh khiết - Responsive chuẩn mọi màn hình */}
          <div 
            className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 shrink-0 bg-white/90 backdrop-blur-sm border-b border-emerald-100/70 gap-2"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg sm:text-xl shrink-0">🎋</span>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-base font-bold text-slate-900 font-serif flex items-center gap-1.5 flex-wrap">
                  <span className="whitespace-nowrap">Quẻ Xăm Ngày Mới</span>
                  <span className="text-[9px] sm:text-[10px] font-sans font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300/80 tracking-wider whitespace-nowrap shrink-0">
                    NHẬT KHÓA
                  </span>
                </h3>
                <p className="text-[10px] sm:text-[11px] text-emerald-800/70 font-sans truncate">
                  {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                onClick={onClose}
                className="p-1 sm:p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
                aria-label="Đóng"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div 
            ref={modalBodyRef} 
            className={`p-3 sm:p-3.5 ${!revealedFortune ? 'overflow-hidden' : 'overflow-y-auto max-h-[86vh]'}`}
          >
            {!revealedFortune ? (
              /* MÀN HÌNH 1: SÂN KHẤU ỐNG XĂM TRE TRÊN NỀN XANH LÁ TƯƠI MỚI NHẸ NHÀNG */
              <div className="py-0.5 text-center space-y-1.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-serif tracking-[0.2em] uppercase font-bold text-emerald-700">
                    Tâm Tịnh Ý Khởi
                  </span>
                  <h4 className="text-base sm:text-lg font-bold font-serif text-slate-900">
                    Khởi Tâm Chiêm Nghiệm Nhật Khóa
                  </h4>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-tight">
                    Ấn & giữ chuột vào ống quẻ rồi lắc qua lại theo nhịp tay để rút thẻ quẻ cát lành hôm nay.
                  </p>
                </div>

                {/* KHUNG BỤC CHIÊM NGHIỆM: TONE XANH LÁ TƯƠI MỚI VÔ CÙNG NHẸ CHO BUỔI SÁNG HỨNG KHỞI */}
                <div className="bg-gradient-to-b from-[#EBF7F1]/80 via-white to-[#E8F6EF]/90 rounded-2xl p-2 sm:p-2.5 border border-emerald-200/60 shadow-xs relative overflow-hidden">
                  {/* Ánh hào quang xanh ngọc dịu êm phía sau ống tre */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(16,185,129,0.08)_0%,transparent_70%)] pointer-events-none" />
                  <BambooShakerScene 
                    onComplete={handleShakingComplete} 
                    destinedFortune={destinedFortune}
                  />
                </div>
              </div>
            ) : (
              /* MÀN HÌNH 2: KẾT QUẢ THẺ QUẺ TRANG NHÃ - NỀN SÁNG VĂN NHÃ */
              <motion.div 
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* 1. Thẻ Tiêu Đề Quẻ & Phẩm Vị */}
                <div 
                  className="p-4 sm:p-5 rounded-2xl border text-center relative overflow-hidden bg-white/95 border-emerald-100 shadow-sm"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-2 bg-emerald-50/60 border border-emerald-200/80">
                    <span>🧧</span>
                    <span className="text-emerald-900 font-medium">Quẻ Ngày Của Bạn</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentRank.pill}`}>
                      {revealedFortune.rank}
                    </span>
                  </div>

                  {/* THẺ QUẺ TRE HÌNH 1: MÀU NỀN BIẾN ĐỔI THEO HỌ QUẺ (NGŨ HÀNH BÁT CUNG) */}
                  <div className="flex items-center justify-center my-2.5">
                    <div 
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all"
                      style={{
                        background: palaceTheme?.bg || 'linear-gradient(135deg, #FFFBEB 0%, #FDE68A 45%, #EAB308 100%)',
                        border: `1px solid ${palaceTheme?.border || 'rgba(217, 119, 6, 0.65)'}`,
                        boxShadow: palaceTheme?.shadow || '0 2px 8px rgba(217, 119, 6, 0.25)'
                      }}
                    >
                      <span 
                        className="text-xs sm:text-sm font-serif font-bold tracking-widest select-none"
                        style={{ color: palaceTheme?.text || '#78350F' }}
                      >
                        {revealedFortune.chineseName}
                      </span>
                      <span 
                        className="text-[11px] font-serif font-semibold" 
                        style={{ color: palaceTheme?.symbolText || '#92400E' }}
                      >
                        ({revealedFortune.symbol})
                      </span>
                    </div>
                  </div>

                  {/* HÌNH 3: TÊN QUẺ TO RÕ & XUỐNG HÀNG Ý NGHĨA TRONG NGOẶC () ĐỘC LẬP */}
                  <div className="space-y-1 my-1.5">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-serif">
                      {hexTitle}
                    </h3>
                    {hexSubtitle && (
                      <p className="text-xs sm:text-sm font-serif font-medium text-emerald-800">
                        {hexSubtitle}
                      </p>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 font-medium italic mt-2 max-w-md mx-auto leading-relaxed font-serif">
                    "{revealedFortune.tagline}"
                  </p>
                </div>

                {/* 2. Thơ Quẻ Sấm Truyền Cổ Điển */}
                <div 
                  className="p-4 rounded-2xl text-center relative bg-[#F4FAF6]/80 border border-emerald-100 shadow-xs"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2 font-serif text-emerald-700">
                    📜 Thơ Sấm Quẻ Ngày
                  </span>
                  <div className="space-y-1 font-serif text-sm sm:text-base text-slate-800 font-medium italic leading-relaxed">
                    {revealedFortune.poem.map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>

                {/* 3. Ba Trục Vận Thế Hôm Nay (Công Danh - Tài Lộc - Tình Duyên) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Công danh */}
                  <div 
                    className="p-3 rounded-xl space-y-1 bg-blue-50/50 border border-blue-100 shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700">
                      <Briefcase size={13} />
                      <span>Công Danh</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
                      {revealedFortune.career}
                    </p>
                  </div>

                  {/* Tài lộc */}
                  <div 
                    className="p-3 rounded-xl space-y-1 bg-amber-50/50 border border-amber-100 shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                      <Coins size={13} />
                      <span>Tài Lộc</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
                      {revealedFortune.wealth}
                    </p>
                  </div>

                  {/* Tình cảm */}
                  <div 
                    className="p-3 rounded-xl space-y-1 bg-rose-50/50 border border-rose-100 shadow-xs"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                      <Heart size={13} />
                      <span>Tình Duyên</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-700 leading-relaxed">
                      {revealedFortune.love}
                    </p>
                  </div>
                </div>

                {/* 4. Khối Chỉ Dẫn Cát Nhật Xuất Hành */}
                <div 
                  className="p-3.5 rounded-xl space-y-1.5 text-xs bg-slate-50/80 border border-slate-200/80 shadow-xs"
                >
                  <div className="font-bold flex items-center gap-1.5 text-xs text-slate-900">
                    <Compass size={14} className="text-emerald-600" />
                    <span>Chỉ Dẫn May Mắn Trong Ngày</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 pt-0.5">
                    <div>
                      <span className="font-semibold text-slate-900">🧭 Hướng Cát: </span>
                      <span>{revealedFortune.luckyDirections}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">⏰ Giờ Cát: </span>
                      <span>{revealedFortune.luckyHours}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">🔢 Số May Mắn: </span>
                      <span className="font-bold text-emerald-700">{revealedFortune.luckyNumbers}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">🎨 Màu Trợ Mệnh: </span>
                      <span>{revealedFortune.luckyColor}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Kim Chỉ Nam Đạo Dịch - SÂU LẮNG HIỆN ĐẠI */}
                <div 
                  className="p-4 rounded-xl space-y-1.5 shadow-sm bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100 border border-slate-700/60"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Sparkles size={13} />
                    <span>Kim Chỉ Nam Đạo Dịch Hôm Nay</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 font-serif leading-relaxed">
                    {revealedFortune.advice}
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
