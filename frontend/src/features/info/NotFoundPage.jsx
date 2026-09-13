import React from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, BookOpen, Heart, Calendar, Activity, Sparkles, ArrowLeft } from 'lucide-react';

export default function NotFoundPage({ onGoHome, onSelectModule }) {
  const handleNavigate = (mode) => {
    if (mode === 'home' && onGoHome) {
      onGoHome();
    } else if (onSelectModule) {
      onSelectModule(mode);
    }
  };

  const quickLinks = [
    { mode: 'home', label: 'Trang Chủ', icon: Home, color: 'from-amber-500 to-amber-700', desc: 'Trở về màn hình chính' },
    { mode: 'iching', label: 'Gieo Quẻ Kinh Dịch', icon: Compass, color: 'from-amber-600 to-red-700', desc: 'Lập quẻ Lục Hào & Mai Hoa' },
    { mode: 'bazi', label: 'Lá Số Bát Tự', icon: Activity, color: 'from-emerald-600 to-teal-800', desc: 'Tứ Trụ & Ngũ Hành vượng suy' },
    { mode: 'ziwei', label: 'Tử Vi Đẩu Số', icon: Sparkles, color: 'from-purple-600 to-indigo-800', desc: 'Mệnh bàn 12 cung chi tiết' },
    { mode: 'marriage', label: 'Bát Tự Hợp Hôn', icon: Heart, color: 'from-rose-500 to-pink-700', desc: 'Xem tuổi kết hôn & gia đạo' },
    { mode: 'xemngay', label: 'Xem Ngày Hoàng Đạo', icon: Calendar, color: 'from-yellow-600 to-amber-700', desc: 'Trạch cát âm dương lịch pháp' },
    { mode: 'blog', label: 'Bài Viết Học Thuật', icon: BookOpen, color: 'from-blue-600 to-cyan-700', desc: 'Chiêm nghiệm kiến thức cổ học' },
  ];

  return (
    <div className="min-h-[85vh] bg-[#f8f5f0] flex items-center justify-center px-4 py-12 font-sans relative overflow-hidden">
      {/* Dynamic Background Haze */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-red-200/20 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl w-full bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-amber-200/60 shadow-xl shadow-amber-900/5 relative z-10 text-center"
      >
        {/* Ancient Diagram Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-800 to-amber-950 text-amber-200 shadow-lg shadow-amber-900/20 mb-6 border-2 border-amber-300/40 relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-1 rounded-full border border-dashed border-amber-400/40 pointer-events-none"
          />
          <span className="font-serif text-3xl font-bold tracking-widest">卦</span>
        </div>

        {/* Title & Badge */}
        <div className="inline-block px-3 py-1 bg-amber-100/80 border border-amber-300 text-amber-900 font-extrabold text-xs tracking-widest uppercase rounded-full mb-3">
          Error 404 • Cung Đường Vô Định
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-amber-950 mb-3 tracking-wide">
          Phương Vi Không Tồn Tại
        </h1>
        
        <p className="text-amber-800/80 max-w-lg mx-auto text-sm sm:text-base mb-8 leading-relaxed">
          Đường dẫn quý khách đang tìm kiếm không nằm trong quái trận hoặc đã bị di chuyển. Hãy quay về bản vị hoặc khám phá các phân hệ học thuật bên dưới.
        </p>

        {/* Return Button */}
        <div className="mb-10">
          <button
            onClick={() => handleNavigate('home')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-900 text-amber-50 font-bold text-sm shadow-md hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Trở Về Trang Chủ
          </button>
        </div>

        {/* Quick Navigation Cards */}
        <div className="border-t border-amber-100 pt-8">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-amber-900/60 mb-6">
            Điều Hướng Nhanh Đến Các Phân Hệ
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
            {quickLinks.slice(1).map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.mode}
                  onClick={() => handleNavigate(item.mode)}
                  className="group p-4 rounded-2xl bg-white border border-amber-100 hover:border-amber-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-3.5 hover:-translate-y-0.5"
                >
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 group-hover:text-amber-900 transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
