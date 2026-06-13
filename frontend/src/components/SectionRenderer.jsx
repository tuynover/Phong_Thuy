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
  TrendingUp
} from 'lucide-react';

const sectionIcons = {
  // Tử Vi
  tong_quan: Sparkles,
  tinh_cach: User,
  su_nghiep_tai_loc: Briefcase,
  phu_the_tu_tuc: Heart,
  suc_khoe: Activity,
  
  // Bát Tự (Bazi)
  bazi_1: User,
  bazi_2: Layers,
  bazi_3: ShieldAlert,
  bazi_4: Sparkles,
  bazi_5: TrendingUp,
  
  // Kinh Dịch (I Ching)
  iching_1: Compass,
  iching_2: Users,
  iching_3: Zap,
  iching_4: Award
};

const sectionColors = {
  // Tử Vi
  tong_quan: "from-purple-500 to-indigo-600",
  tinh_cach: "from-indigo-500 to-blue-600",
  su_nghiep_tai_loc: "from-blue-500 to-cyan-600",
  phu_the_tu_tuc: "from-rose-500 to-pink-600",
  suc_khoe: "from-emerald-500 to-teal-600",
  
  // Bát Tự
  bazi_1: "from-blue-500 to-indigo-600",
  bazi_2: "from-emerald-500 to-teal-600",
  bazi_3: "from-rose-500 to-pink-600",
  bazi_4: "from-purple-500 to-indigo-600",
  bazi_5: "from-cyan-500 to-blue-600",
  
  // Kinh Dịch
  iching_1: "from-amber-500 to-orange-600",
  iching_2: "from-blue-500 to-indigo-600",
  iching_3: "from-rose-500 to-orange-600",
  iching_4: "from-emerald-500 to-teal-600"
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
        className={`w-full px-6 py-4.5 flex justify-between items-center text-left transition-all duration-200 ${styles.hoverBg}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4.5">
          <h3 className="font-extrabold text-slate-800 text-base md:text-lg tracking-tight shrink-0">
            {section.title}
          </h3>
          {section.sources && section.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
          <ReactMarkdown>{section.content}</ReactMarkdown>
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
