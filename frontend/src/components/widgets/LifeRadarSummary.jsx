import React from 'react';
import { 
  Sparkles, 
  ShieldAlert, 
  Target, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Zap,
  Briefcase,
  Coins,
  Heart,
  Activity,
  Users
} from 'lucide-react';
import { extractExecutiveSummary } from '@/utils/markdownParser';

const themeConfigs = {
  bazi: {
    border: 'border-slate-200/90',
    shadow: 'shadow-slate-500/5',
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    gradientHeader: 'from-slate-800 via-indigo-950 to-slate-900',
    progressBar: 'bg-indigo-600',
    accentText: 'text-indigo-900',
    badgeText: 'Tóm Tắt Vận Mệnh 1 Phút',
    badgeSub: '5 Trục Khí Số Ngũ Hành',
    mainTitle: '⚡ Bản Đúc Kết Cốt Lõi Vận Trình Bát Tự',
    overallLabel: 'Chỉ số bình hòa',
    overallSub: 'Tổng quan khí số',
    tldrTitle: '3 Đúc Kết Bản Thể Cốt Lõi (TL;DR)',
    col1Title: '3 Điểm Sáng Vận Trình',
    col2Title: '3 Tử Huyệt Cần Phòng',
    col3Title: '1 Hành Động Cải Vận',
    defaultStrengths: [
      'Bản tính kiên định, có chí tiến thủ mạnh mẽ',
      'Được ấn thụ hoặc quý nhân nâng đỡ khi gặp khó',
      'Có tiềm năng khai phá vận thế vững vàng'
    ],
    defaultPitfalls: [
      'Đề phòng nóng nảy, thiên lệch ngũ hành khi gặp năm xung',
      'Cần quản trị tài chính cẩn trọng, tránh đầu cơ mạo hiểm',
      'Cân bằng giữa công việc và sức khỏe gia đạo'
    ],
    defaultActionAdvice: 'Dưỡng tâm định tính, bổ trợ ngũ hành hỷ dụng và kiên định theo đuổi định hướng dài hạn.',
    labels: {
      career: 'Sự Nghiệp',
      wealth: 'Tài Chính',
      love: 'Tình Cảm',
      health: 'Sức Khỏe',
      mentors: 'Quý Nhân'
    }
  },
  ziwei: {
    border: 'border-purple-200/80',
    shadow: 'shadow-purple-500/5',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    gradientHeader: 'from-purple-900 via-indigo-900 to-purple-950',
    progressBar: 'bg-purple-600',
    accentText: 'text-purple-900',
    badgeText: 'Tóm Tắt Mệnh Bàn 1 Phút',
    badgeSub: '5 Cung Mệnh Trọng Yếu',
    mainTitle: '⚡ Bản Đúc Kết Cốt Lõi Mệnh Bàn Tử Vi',
    overallLabel: 'Chỉ số cát lợi',
    overallSub: 'Tổng quan mệnh số',
    tldrTitle: '3 Đúc Kết Mệnh Bàn Cốt Lõi (TL;DR)',
    col1Title: '3 Cát Tinh Trợ Mệnh',
    col2Title: '3 Hung Sát Cần Phòng',
    col3Title: '1 Hành Động Khai Vận',
    defaultStrengths: [
      'Mệnh Thân vững vàng, hội tụ cát tinh trợ lực',
      'Khả năng ứng biến linh hoạt, tư duy sắc bén',
      'Cơ hội phát triển rộng mở trong đại vận thuận lợi'
    ],
    defaultPitfalls: [
      'Đề phòng ám tinh sát tinh gây thị phi tiểu nhân',
      'Cẩn trọng trong giấy tờ, pháp lý và đầu tư',
      'Chú ý giữ gìn sức khỏe ở các cung tật ách hạn xấu'
    ],
    defaultActionAdvice: 'Phát huy năng lực các cung tam hợp tốt, dĩ hòa vi quý để hóa giải sát tinh chiếu mệnh.',
    labels: {
      career: 'Quan Lộc',
      wealth: 'Tài Bạch',
      love: 'Phu Thê',
      health: 'Tật Ách',
      mentors: 'Quý Nhân'
    }
  },
  tu_vi: {
    border: 'border-purple-200/80',
    shadow: 'shadow-purple-500/5',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    gradientHeader: 'from-purple-900 via-indigo-900 to-purple-950',
    progressBar: 'bg-purple-600',
    accentText: 'text-purple-900',
    badgeText: 'Tóm Tắt Mệnh Bàn 1 Phút',
    badgeSub: '5 Cung Mệnh Trọng Yếu',
    mainTitle: '⚡ Bản Đúc Kết Cốt Lõi Mệnh Bàn Tử Vi',
    overallLabel: 'Chỉ số cát lợi',
    overallSub: 'Tổng quan mệnh số',
    tldrTitle: '3 Đúc Kết Mệnh Bàn Cốt Lõi (TL;DR)',
    col1Title: '3 Cát Tinh Trợ Mệnh',
    col2Title: '3 Hung Sát Cần Phòng',
    col3Title: '1 Hành Động Khai Vận',
    defaultStrengths: [
      'Mệnh Thân vững vàng, hội tụ cát tinh trợ lực',
      'Khả năng ứng biến linh hoạt, tư duy sắc bén',
      'Cơ hội phát triển rộng mở trong đại vận thuận lợi'
    ],
    defaultPitfalls: [
      'Đề phòng ám tinh sát tinh gây thị phi tiểu nhân',
      'Cẩn trọng trong giấy tờ, pháp lý và đầu tư',
      'Chú ý giữ gìn sức khỏe ở các cung tật ách hạn xấu'
    ],
    defaultActionAdvice: 'Phát huy năng lực các cung tam hợp tốt, dĩ hòa vi quý để hóa giải sát tinh chiếu mệnh.',
    labels: {
      career: 'Quan Lộc',
      wealth: 'Tài Bạch',
      love: 'Phu Thê',
      health: 'Tật Ách',
      mentors: 'Quý Nhân'
    }
  },
  iching: {
    border: 'border-amber-200/80',
    shadow: 'shadow-amber-500/5',
    badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
    gradientHeader: 'from-stone-900 via-amber-950 to-stone-900',
    progressBar: 'bg-amber-600',
    accentText: 'text-amber-900',
    badgeText: 'Tóm Tắt Quẻ Dịch 1 Phút',
    badgeSub: '5 Trục Biện Chứng Quẻ Tượng',
    mainTitle: '⚡ Bản Đúc Kết Cốt Lõi Quẻ Tượng & Sự Việc',
    overallLabel: 'Thời vận sự việc',
    overallSub: 'Khí số quẻ dịch',
    tldrTitle: '3 Điểm Cốt Yếu Của Quẻ Tượng (TL;DR)',
    col1Title: '3 Yếu Tố Thuận Lợi (Cát Khí)',
    col2Title: '3 Điểm Hung Hiểm Cần Phòng',
    col3Title: '1 Diệu Kế Hành Động Đạo Dịch',
    defaultStrengths: [
      'Quẻ có hào Thế vượng tướng hoặc đắc thời đắc vị',
      'Có cơ hội thuận lợi để chuyển biến tình thế',
      'Được hào Ứng hoặc quý nhân tương trợ'
    ],
    defaultPitfalls: [
      'Cẩn trọng hào Động biến xung khắc hao tổn',
      'Tránh hành động nôn nóng khi thời chưa tới',
      'Đề phòng khẩu thiệt, hiểu lầm hoặc cản trở ngoại cảnh'
    ],
    defaultActionAdvice: 'Nắm rõ thời cơ đắc thất của quẻ, hành xử tùy thời biến dịch để đạt cát tránh hung.',
    labels: {
      career: 'Thời Thế',
      wealth: 'Tài Vận',
      love: 'Nhân Hòa',
      health: 'Khí Sắc',
      mentors: 'Trợ Lực'
    }
  },
  marriage: {
    border: 'border-rose-200/80',
    shadow: 'shadow-rose-500/5',
    badgeBg: 'bg-rose-50 text-rose-900 border-rose-300',
    gradientHeader: 'from-rose-900 via-pink-950 to-rose-950',
    progressBar: 'bg-rose-600',
    accentText: 'text-rose-900',
    badgeText: 'Tóm Tắt Hợp Hôn 1 Phút',
    badgeSub: '5 Trụ Cột Hòa Hợp Gia Đạo',
    mainTitle: '⚡ Bản Đúc Kết Cốt Lõi Hôn Phối & Duyên Phận',
    overallLabel: 'Chỉ số hòa hợp',
    overallSub: 'Tổng quan duyên số',
    tldrTitle: '3 Đúc Kết Hôn Phối Cốt Lõi (TL;DR)',
    col1Title: '3 Điểm Tương Hợp Gắn Kết',
    col2Title: '3 Điểm Xung Khắc Cần Nhường Nhịn',
    col3Title: '1 Bí Quyết Gìn Giữ Hạnh Phúc',
    defaultStrengths: [
      'Can Chi tương sinh, vợ chồng có tiếng nói chung',
      'Cung Mệnh hòa hợp tạo điểm tựa kinh tế vững vàng',
      'Hai bên biết thấu hiểu và san sẻ trách nhiệm'
    ],
    defaultPitfalls: [
      'Có yếu tố khắc khẩu hoặc cái tôi đôi bên quá cao',
      'Cần thống nhất cách quản lý tài chính gia đình',
      'Đề phòng áp lực công việc ảnh hưởng đến hạnh phúc lứa đôi'
    ],
    defaultActionAdvice: 'Lấy sự bao dung và lắng nghe làm gốc, cùng nhau vun đắp để chuyển hung thành cát trọn đời.',
    labels: {
      career: 'Chí Hướng',
      wealth: 'Kinh Tế',
      love: 'Tình Cảm',
      health: 'Gia Đạo',
      mentors: 'Nội Ngoại'
    }
  }
};

const aspectIcons = {
  career: Briefcase,
  wealth: Coins,
  love: Heart,
  health: Activity,
  mentors: Users
};

export const LifeRadarSummary = ({ summary: propSummary, rawText, theme = 'bazi', sections = [] }) => {
  const textToParse = rawText || (Array.isArray(sections) && sections.length > 0 ? sections.map(s => `${s.title}\n${s.content}`).join('\n\n') : '');
  const summary = propSummary || extractExecutiveSummary(textToParse, theme).summary;

  if (!summary) return null;

  const cfg = themeConfigs[theme] || themeConfigs.bazi;
  const { tldr = [], scores = {}, strengths = [], pitfalls = [], actionAdvice = '' } = summary;

  const aspectItems = [
    { key: 'career', label: cfg.labels.career, score: scores.career ?? 80, icon: aspectIcons.career },
    { key: 'wealth', label: cfg.labels.wealth, score: scores.wealth ?? 75, icon: aspectIcons.wealth },
    { key: 'love', label: cfg.labels.love, score: scores.love ?? 70, icon: aspectIcons.love },
    { key: 'health', label: cfg.labels.health, score: scores.health ?? 80, icon: aspectIcons.health },
    { key: 'mentors', label: cfg.labels.mentors, score: scores.mentors ?? 85, icon: aspectIcons.mentors },
  ];

  const avgScore = Math.round(
    aspectItems.reduce((acc, curr) => acc + (curr.score || 75), 0) / aspectItems.length
  );

  return (
    <div 
      id="life-radar-summary" 
      className={`w-full mb-8 scroll-mt-24 bg-white/95 backdrop-blur-md rounded-3xl border ${cfg.border} shadow-xl ${cfg.shadow} p-5 sm:p-7 md:p-8 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative`}
    >
      {/* Decorative gradient corner light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-200/15 via-blue-200/15 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border ${cfg.badgeBg} flex items-center gap-1.5`}>
              <Zap size={13} className="text-amber-500 fill-amber-500" />
              {cfg.badgeText}
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {cfg.badgeSub}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>{cfg.mainTitle}</span>
          </h2>
        </div>

        {/* Aggregate Score Pill */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-slate-50 to-white px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">{cfg.overallLabel}</div>
            <div className="text-xs font-bold text-slate-700">{cfg.overallSub}</div>
          </div>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cfg.gradientHeader} flex items-center justify-center text-white font-black text-lg shadow-md`}>
            {avgScore}
          </div>
        </div>
      </div>

      {/* 2. Block: 5 Trục Năng Lượng Cuộc Đời (5 Score Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5 mb-6">
        {aspectItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <div 
              key={item.key} 
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-slate-700 truncate">{item.label}</span>
                <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                  <IconComponent size={13} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{item.score}</span>
                  <span className="text-[11px] font-semibold text-slate-400">/100</span>
                </div>
                <div className="w-full bg-slate-200/80 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }} 
                    className={`h-full rounded-full ${cfg.progressBar}`}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Block: 3 Câu Đúc Kết Cốt Lõi (TL;DR) */}
      {tldr.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md mb-5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2.5">
            <Sparkles size={14} className="fill-amber-400" />
            <span>{cfg.tldrTitle}</span>
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            {tldr.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="text-amber-400 font-bold text-base shrink-0 leading-none mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Block: 3 Cột Chiến Lược Trực Quan (Điểm Sáng, Tử Huyệt, Lời Khuyên) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Cột 1: Điểm Sáng / Cát Khí / Tương Hợp */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider mb-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{cfg.col1Title}</span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-[13px] text-emerald-950 leading-relaxed">
              {(strengths.length > 0 ? strengths : cfg.defaultStrengths).map((st, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-black text-xs shrink-0 mt-0.5">✓</span>
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cột 2: Tử Huyệt / Hung Hiểm / Xung Khắc */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-rose-50/80 border border-rose-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs uppercase tracking-wider mb-2.5">
              <ShieldAlert size={16} className="text-rose-600 shrink-0" />
              <span>{cfg.col2Title}</span>
            </div>
            <ul className="space-y-1.5 text-xs sm:text-[13px] text-rose-950 leading-relaxed">
              {(pitfalls.length > 0 ? pitfalls : cfg.defaultPitfalls).map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-600 font-black text-xs shrink-0 mt-0.5">✕</span>
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cột 3: Hành Động Chiến Lược / Diệu Kế / Bí Quyết */}
        <div className="p-4 sm:p-4.5 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs uppercase tracking-wider mb-2.5">
              <Target size={16} className="text-amber-600 shrink-0" />
              <span>{cfg.col3Title}</span>
            </div>
            <p className="text-xs sm:text-[13px] font-medium text-amber-950 leading-relaxed">
              {actionAdvice || cfg.defaultActionAdvice}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeRadarSummary;
