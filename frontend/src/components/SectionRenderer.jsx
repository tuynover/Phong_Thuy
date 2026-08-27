import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  User, 
  Briefcase, 
  Heart, 
  Activity, 
  Sparkles, 
  ChevronDown, 
  Bookmark,
  Layers,
  ShieldAlert,
  Compass,
  Zap,
  Award,
  Users,
  TrendingUp,
  BookOpen
} from 'lucide-react';

const sectionIcons = {
  // Tử Vi - Markdown parsed (tu_vi_1 to tu_vi_14)
  tu_vi_1: Sparkles,     // Bản Mệnh
  tu_vi_2: Heart,        // Hôn Nhân & Tình Cảm
  tu_vi_3: Briefcase,    // Tài Sản & Nghề Nghiệp
  tu_vi_4: Users,        // Cha Mẹ & Gia Đình
  tu_vi_5: Compass,      // Xuất Hành & Ngoại Giao
  tu_vi_6: ShieldAlert,  // Sức Khỏe & Tai Ương
  tu_vi_7: Users,        // Bạn Bè & Đồng Nghiệp
  tu_vi_8: Award,        // Sự Nghiệp & Công Danh
  tu_vi_9: Layers,       // Đất Đai & Nhà Cửa
  tu_vi_10: User,        // Đường Con Cái
  tu_vi_11: Users,       // Anh Chị Em
  tu_vi_12: Zap,         // Phúc Đức & Tổ Nghiệp
  tu_vi_13: Zap,         // Đại Vận & Vận Hạn Năm 2026
  tu_vi_14: TrendingUp,  // Tổng Kết Vận Hạn Cuộc Đời
  tu_vi_15: Sparkles,    // Chiến Lược Cải Vận & Thu Hút May Mắn

  // Tử Vi - JSON keys
  menh: Sparkles,
  phu_the: Heart,
  tai_bach: Briefcase,
  phu_mau: Users,
  thien_di: Compass,
  tat_ach: ShieldAlert,
  no_boc: Users,
  quan_loc: Award,
  dien_trach: Layers,
  tu_tuc: User,
  huynh_de: Users,
  phuc_duc: Zap,
  dai_van_2026: Zap,
  tong_ket_van_han: TrendingUp,
  cai_van_phong_thuy: Sparkles,

  // Bát Tự (parsed from markdown sections using prefix 'bazi')
  bazi_1: User,          // Nhật Chủ
  bazi_2: Layers,        // Cách cục & Dụng thần
  bazi_3: BookOpen,      // Các phương diện đời người - Intro
  'bazi_3.1': Award,     // Sự nghiệp (Quan Lộc)
  'bazi_3.2': Briefcase, // Tiền bạc (Tài Bạch)
  'bazi_3.3': Heart,     // Tình cảm (Phu Thê)
  'bazi_3.4': ShieldAlert, // Sức khỏe (Tật Ách)
  bazi_4: Award,         // Thần Sát
  bazi_5: TrendingUp,    // Đại vận & Lưu niên - Intro
  'bazi_5.1': Layers,    // Lộ trình Đại vận
  'bazi_5.2': Zap,       // Dự báo Lưu niên
  bazi_6: Compass,       // Xu cát tị hung

  // Legacy keys (if any)
  tong_quan: Sparkles,
  tinh_cach: User,
  su_nghiep_tai_loc: Briefcase,
  phu_the_tu_tuc: Heart,
  suc_khoe: Activity,
  
  // Kinh Dịch (I Ching)
  iching_1: Compass,
  iching_2: Users,
  iching_3: Zap,
  iching_4: Award,

  // Hôn Nhân (parsed from markdown sections using prefix 'marriage')
  marriage_1: Sparkles,     // Cung phi cát hung
  marriage_2: Heart,        // Nhật can tương hợp
  marriage_3: Compass,      // Nhật chi bình ổn (Cung Phu Thê)
  marriage_4: Zap,          // Ngũ hành tương tế
  marriage_5: ShieldAlert,  // Thần sát hình khắc
  marriage_6: TrendingUp,   // Đồng điệu đại vận
  marriage_7: Users,        // Trụ năm & Trụ tháng (Gia đạo)
  marriage_8: User,         // Trụ giờ (Con cái)
  marriage_9: BookOpen      // Kết luận & Hóa giải
};

const sectionColors = {
  // Tử Vi - Markdown parsed (tu_vi_1 to tu_vi_14)
  tu_vi_1: "from-purple-500 to-indigo-600",
  tu_vi_2: "from-rose-500 to-pink-600",
  tu_vi_3: "from-emerald-500 to-teal-600",
  tu_vi_4: "from-blue-500 to-indigo-600",
  tu_vi_5: "from-cyan-500 to-blue-600",
  tu_vi_6: "from-red-500 to-rose-600",
  tu_vi_7: "from-amber-500 to-orange-600",
  tu_vi_8: "from-indigo-500 to-purple-600",
  tu_vi_9: "from-yellow-500 to-amber-600",
  tu_vi_10: "from-pink-500 to-rose-600",
  tu_vi_11: "from-teal-500 to-emerald-600",
  tu_vi_12: "from-violet-500 to-purple-600",
  tu_vi_13: "from-orange-500 to-red-600",
  tu_vi_14: "from-slate-700 to-slate-900",
  tu_vi_15: "from-purple-600 to-amber-600",

  // Tử Vi - JSON keys
  menh: "from-purple-500 to-indigo-600",
  phu_the: "from-rose-500 to-pink-600",
  tai_bach: "from-emerald-500 to-teal-600",
  phu_mau: "from-blue-500 to-indigo-600",
  thien_di: "from-cyan-500 to-blue-600",
  tat_ach: "from-red-500 to-rose-600",
  no_boc: "from-amber-500 to-orange-600",
  quan_loc: "from-indigo-500 to-purple-600",
  dien_trach: "from-yellow-500 to-amber-600",
  tu_tuc: "from-pink-500 to-rose-600",
  huynh_de: "from-teal-500 to-emerald-600",
  phuc_duc: "from-violet-500 to-purple-600",
  dai_van_2026: "from-orange-500 to-red-600",
  tong_ket_van_han: "from-slate-700 to-slate-900",
  cai_van_phong_thuy: "from-purple-600 to-amber-600",

  // Bát Tự
  bazi_1: "from-blue-500 to-indigo-600",
  bazi_2: "from-indigo-500 to-blue-600",
  bazi_3: "from-emerald-500 to-teal-600",
  'bazi_3.1': "from-indigo-500 to-purple-600",
  'bazi_3.2': "from-emerald-500 to-teal-600",
  'bazi_3.3': "from-rose-500 to-pink-600",
  'bazi_3.4': "from-red-500 to-rose-600",
  bazi_4: "from-amber-500 to-orange-600",
  bazi_5: "from-cyan-500 to-blue-600",
  'bazi_5.1': "from-indigo-500 to-blue-600",
  'bazi_5.2': "from-orange-500 to-red-600",
  bazi_6: "from-rose-500 to-pink-600",

  // Legacy keys
  tong_quan: "from-purple-500 to-indigo-600",
  tinh_cach: "from-indigo-500 to-blue-600",
  su_nghiep_tai_loc: "from-blue-500 to-cyan-600",
  phu_the_tu_tuc: "from-rose-500 to-pink-600",
  suc_khoe: "from-emerald-500 to-teal-600",
  
  // Kinh Dịch
  iching_1: "from-amber-500 to-orange-600",
  iching_2: "from-blue-500 to-indigo-600",
  iching_3: "from-rose-500 to-orange-600",
  iching_4: "from-emerald-500 to-teal-600",

  // Hôn Nhân
  marriage_1: "from-rose-500 to-pink-650",
  marriage_2: "from-pink-500 to-rose-600",
  marriage_3: "from-rose-600 to-red-650",
  marriage_4: "from-red-500 to-rose-600",
  marriage_5: "from-pink-600 to-pink-700",
  marriage_6: "from-rose-700 to-slate-900",
  marriage_7: "from-rose-500 to-pink-500",
  marriage_8: "from-pink-400 to-rose-500",
  marriage_9: "from-rose-800 to-rose-950"
};

const themeStyles = {
  tuvi: {
    border: "border-purple-100 hover:border-purple-200",
    shadow: "shadow-purple-950/5 hover:shadow-purple-900/10",
    hoverBg: "hover:bg-purple-50/20",
    chevronActive: "bg-purple-50 text-purple-500 border-purple-200",
    prose: "prose-slate prose-headings:text-purple-950 prose-a:text-purple-600 prose-strong:text-purple-900 prose-code:text-purple-600 prose-code:bg-purple-50"
  },
  bazi: {
    border: "border-blue-100 hover:border-blue-200",
    shadow: "shadow-blue-950/5 hover:shadow-blue-900/10",
    hoverBg: "hover:bg-blue-50/20",
    chevronActive: "bg-blue-50 text-blue-500 border-blue-200",
    prose: "prose-blue prose-headings:text-blue-950 prose-a:text-blue-600 prose-strong:text-blue-900 prose-code:text-blue-600 prose-code:bg-blue-50"
  },
  iching: {
    border: "border-amber-100 hover:border-amber-200",
    shadow: "shadow-amber-950/5 hover:shadow-amber-900/10",
    hoverBg: "hover:bg-amber-50/20",
    chevronActive: "bg-amber-50 text-amber-500 border-amber-200",
    prose: "prose-amber prose-headings:text-amber-950 prose-a:text-amber-600 prose-strong:text-amber-900 prose-code:text-amber-600 prose-code:bg-amber-50"
  },
  marriage: {
    border: "border-rose-100 hover:border-rose-200",
    shadow: "shadow-rose-950/5 hover:shadow-rose-900/10",
    hoverBg: "hover:bg-rose-50/20",
    chevronActive: "bg-rose-50 text-rose-500 border-rose-200",
    prose: "prose-rose prose-headings:text-rose-950 prose-a:text-rose-600 prose-strong:text-rose-900 prose-code:text-rose-600 prose-code:bg-rose-50"
  }
};

const SectionCard = ({ section, theme }) => {
  const [isOpen, setIsOpen] = useState(true);
  const IconComponent = sectionIcons[section.id] || Bookmark;
  const gradientColor = sectionColors[section.id] || "from-slate-500 to-slate-700";
  const styles = themeStyles[theme] || themeStyles.tuvi;

  return (
    <div className={`mb-6 bg-white/70 backdrop-blur-md rounded-2xl border ${styles.border} shadow-lg ${styles.shadow} overflow-hidden transition-all duration-300`}>
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-6 py-3.5 sm:py-4 flex justify-between items-center text-left transition-all duration-200 ${styles.hoverBg}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-9.5 h-9.5 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white shadow-md shrink-0`}>
              <IconComponent size={18} />
            </div>
            <h3 className="font-black text-slate-800 text-base sm:text-[18px] md:text-[19.5px] tracking-wide leading-normal">
              {section.title}
            </h3>
          </div>
          {section.sources && section.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 ml-0 sm:ml-2">
              {section.sources.map((src, idx) => (
                <span 
                  key={idx} 
                  className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-bold uppercase tracking-wider whitespace-nowrap"
                >
                  {src.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className={`p-1.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200 transition-transform duration-300 ${isOpen ? `rotate-180 ${styles.chevronActive}` : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Accordion Content Panel */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[3000px] border-t border-slate-100 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className={`px-6 pt-3 pb-5 md:px-8 md:pt-4 md:pb-6 text-slate-700 leading-relaxed text-sm md:text-base prose max-w-none ${styles.prose}`}>
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-7 last:mb-0 leading-relaxed">{children}</p>
            }}
          >
            {section.content 
              ? section.content.replace(/\s*\*\*(Phân Tích|Lộ Trình|Dự Báo)/g, '\n\n**$1').replace(/\n{3,}/g, '\n\n').trim() 
              : ''}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

const SectionRenderer = ({ sections, theme = 'tuvi' }) => {
  if (!sections || sections.length === 0) {
    return (
      <div className="p-12 text-center bg-white/50 border border-purple-100 rounded-3xl backdrop-blur-md">
        <div className="w-16 h-16 bg-purple-50 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100 animate-pulse">
          <Sparkles size={28} />
        </div>
        <h4 className="font-bold text-slate-700 text-lg mb-1">Đang chuẩn bị luận giải...</h4>
        <p className="text-slate-400 text-sm max-w-sm mx-auto">AI đang phân tích các tổ hợp cát hung và chòm sao chiếu mệnh của bạn.</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
      {sections.map((section, idx) => (
        <SectionCard key={section.id || idx} section={section} theme={theme} />
      ))}
    </div>
  );
};

export default SectionRenderer;
