import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  User, 
  Briefcase, 
  Heart, 
  Activity, 
  Sparkles, 
  ChevronDown, 
  Bookmark 
} from 'lucide-react';

const sectionIcons = {
  tong_quan: Sparkles,
  tinh_cach: User,
  su_nghiep_tai_loc: Briefcase,
  phu_the_tu_tuc: Heart,
  suc_khoe: Activity
};

const sectionColors = {
  tong_quan: "from-purple-500 to-indigo-600",
  tinh_cach: "from-indigo-500 to-blue-600",
  su_nghiep_tai_loc: "from-blue-500 to-cyan-600",
  phu_the_tu_tuc: "from-rose-500 to-pink-600",
  suc_khoe: "from-emerald-500 to-teal-600"
};

const SectionCard = ({ section }) => {
  const [isOpen, setIsOpen] = useState(true);
  const IconComponent = sectionIcons[section.id] || Bookmark;
  const gradientColor = sectionColors[section.id] || "from-slate-500 to-slate-700";

  return (
    <div className="mb-6 bg-white/70 backdrop-blur-md rounded-2xl border border-purple-100 shadow-lg shadow-purple-950/5 overflow-hidden transition-all duration-300 hover:shadow-purple-900/10 hover:border-purple-200">
      {/* Header Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4.5 flex justify-between items-center text-left transition-all duration-200 hover:bg-purple-50/20"
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientColor} text-white shadow-md shrink-0`}>
            <IconComponent size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-base md:text-lg tracking-tight">
              {section.title}
            </h3>
            {section.sources && section.sources.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {section.sources.map((src, idx) => (
                  <span 
                    key={idx} 
                    className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 font-bold uppercase tracking-wider"
                  >
                    {src.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className={`p-1.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-purple-50 text-purple-500 border-purple-200' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>

      {/* Accordion Content Panel */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[3000px] border-t border-purple-50 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="p-6 md:p-8 text-slate-700 leading-relaxed text-sm md:text-base prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-purple-950 prose-a:text-purple-600 prose-strong:text-purple-900 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
          <ReactMarkdown>{section.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

const SectionRenderer = ({ sections }) => {
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
        <SectionCard key={section.id || idx} section={section} />
      ))}
    </div>
  );
};

export default SectionRenderer;
