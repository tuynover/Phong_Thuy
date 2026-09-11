import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  BookOpen,
  MessageSquare,
  Volume2,
  Play,
  Pause,
  Headphones
} from 'lucide-react';
import { ttsEngine } from '../utils/ttsEngine';

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

  // Bát Tự VIP Chapters & Nhật Chủ
  bazi_ch_1: Award,       // Sự Nghiệp & Công Danh
  bazi_ch_2: Briefcase,   // Tài Chính & Dòng Tiền
  bazi_ch_3: Heart,       // Hôn Nhân & Gia Đạo
  bazi_ch_4: ShieldAlert, // Sức Khỏe & Tạng Phủ
  bazi_ch_5: Sparkles,    // Phong Thủy & Cải Vận
  bazi_ch_6: TrendingUp,  // Mốc Đại Vận 100 Năm
  bazi_nhat_chu: User,    // Phân Tích Nhật Chủ
  bazi_intro: BookOpen,   // Tổng Quan Bản Mệnh

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

  // Tử Vi VIP Clusters & Intro
  tu_vi_intro: BookOpen,
  tu_vi_ch_1: Sparkles,     // Cụm 1: Mệnh Thân Phúc Đức
  tu_vi_ch_2: Award,        // Cụm 2: Quan Lộc Tài Bạch Điền Trạch
  tu_vi_ch_3: Heart,        // Cụm 3: Phu Thê Tử Tức Huynh Đệ
  tu_vi_ch_4: ShieldAlert,  // Cụm 4: Tật Ách Thiên Di
  tu_vi_ch_5: Users,        // Cụm 5: Nô Bộc Phụ Mẫu Huynh Đệ
  tu_vi_dieu_hoa: TrendingUp, // Điều Hòa & Đại Vận
  ziwei_intro: BookOpen,
  ziwei_ch_1: Sparkles,
  ziwei_ch_2: Award,
  ziwei_ch_3: Heart,
  ziwei_ch_4: ShieldAlert,
  ziwei_ch_5: Users,
  ziwei_dieu_hoa: TrendingUp,

  // Marriage VIP
  marriage_intro: BookOpen,
  marriage_ch_1: Heart,
  marriage_ch_2: Sparkles,
  marriage_ch_3: ShieldAlert,
  marriage_ch_4: Users,
  marriage_dieu_hoa: TrendingUp,

  // IChing VIP
  iching_intro: BookOpen,
  iching_ch_1: Compass,
  iching_ch_2: Zap,
  iching_ch_3: Award,
  iching_dieu_hoa: TrendingUp,

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
  // Tử Vi VIP Clusters & Intro
  tu_vi_intro: "from-purple-600 to-indigo-700",
  tu_vi_ch_1: "from-purple-500 to-indigo-600",
  tu_vi_ch_2: "from-indigo-500 to-purple-600",
  tu_vi_ch_3: "from-rose-500 to-pink-600",
  tu_vi_ch_4: "from-red-500 to-rose-600",
  tu_vi_ch_5: "from-amber-500 to-orange-600",
  tu_vi_dieu_hoa: "from-purple-600 to-amber-600",
  ziwei_intro: "from-purple-600 to-indigo-700",
  ziwei_ch_1: "from-purple-500 to-indigo-600",
  ziwei_ch_2: "from-indigo-500 to-purple-600",
  ziwei_ch_3: "from-rose-500 to-pink-600",
  ziwei_ch_4: "from-red-500 to-rose-600",
  ziwei_ch_5: "from-amber-500 to-orange-600",
  ziwei_dieu_hoa: "from-purple-600 to-amber-600",

  // Marriage VIP
  marriage_intro: "from-rose-500 to-pink-600",
  marriage_ch_1: "from-rose-500 to-pink-600",
  marriage_ch_2: "from-purple-500 to-rose-600",
  marriage_ch_3: "from-red-500 to-rose-600",
  marriage_ch_4: "from-rose-700 to-slate-900",
  marriage_dieu_hoa: "from-rose-800 to-amber-600",

  // IChing VIP
  iching_intro: "from-amber-500 to-orange-600",
  iching_ch_1: "from-amber-500 to-orange-600",
  iching_ch_2: "from-blue-500 to-indigo-600",
  iching_ch_3: "from-emerald-500 to-teal-600",
  iching_dieu_hoa: "from-purple-600 to-amber-600",

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

  // Bát Tự VIP Chapters & Nhật Chủ
  bazi_ch_1: "from-blue-600 to-indigo-700",
  bazi_ch_2: "from-emerald-500 to-teal-600",
  bazi_ch_3: "from-rose-500 to-pink-600",
  bazi_ch_4: "from-amber-500 to-red-600",
  bazi_ch_5: "from-purple-500 to-indigo-600",
  bazi_ch_6: "from-indigo-600 to-slate-800",
  bazi_nhat_chu: "from-cyan-600 to-blue-700",
  bazi_intro: "from-amber-500 to-indigo-600",

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
    consultBtn: "bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border-purple-200/80 hover:border-purple-300",
    consultIcon: "text-purple-600",
    prose: "prose-slate prose-headings:text-purple-950 prose-a:text-purple-600 prose-strong:text-purple-900 prose-code:text-purple-600 prose-code:bg-purple-50",
    playAllBanner: "from-purple-950 via-indigo-950 to-slate-900 border-purple-500/30",
    playAllBtn: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40",
    bannerBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30"
  },
  tu_vi: {
    border: "border-purple-100 hover:border-purple-200",
    shadow: "shadow-purple-950/5 hover:shadow-purple-900/10",
    hoverBg: "hover:bg-purple-50/20",
    chevronActive: "bg-purple-50 text-purple-500 border-purple-200",
    consultBtn: "bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border-purple-200/80 hover:border-purple-300",
    consultIcon: "text-purple-600",
    prose: "prose-slate prose-headings:text-purple-950 prose-a:text-purple-600 prose-strong:text-purple-900 prose-code:text-purple-600 prose-code:bg-purple-50",
    playAllBanner: "from-purple-950 via-indigo-950 to-slate-900 border-purple-500/30",
    playAllBtn: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40",
    bannerBadge: "bg-purple-500/20 text-purple-300 border-purple-500/30"
  },
  bazi: {
    border: "border-blue-100 hover:border-blue-200",
    shadow: "shadow-blue-950/5 hover:shadow-blue-900/10",
    hoverBg: "hover:bg-blue-50/20",
    chevronActive: "bg-blue-50 text-blue-500 border-blue-200",
    consultBtn: "bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-900 border-blue-200/80 hover:border-blue-300",
    consultIcon: "text-blue-600",
    prose: "prose-blue prose-headings:text-blue-950 prose-a:text-blue-600 prose-strong:text-blue-900 prose-code:text-blue-600 prose-code:bg-blue-50",
    playAllBanner: "from-blue-950 via-sky-950 to-slate-900 border-blue-500/30",
    playAllBtn: "bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white shadow-blue-900/40",
    bannerBadge: "bg-blue-500/20 text-blue-300 border-blue-500/30"
  },
  iching: {
    border: "border-amber-100 hover:border-amber-200",
    shadow: "shadow-amber-950/5 hover:shadow-amber-900/10",
    hoverBg: "hover:bg-amber-50/20",
    chevronActive: "bg-amber-50 text-amber-500 border-amber-200",
    consultBtn: "bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-900 border-amber-200/80 hover:border-amber-300",
    consultIcon: "text-amber-600",
    prose: "prose-amber prose-headings:text-amber-950 prose-a:text-amber-600 prose-strong:text-amber-900 prose-code:text-amber-600 prose-code:bg-amber-50",
    playAllBanner: "from-amber-950 via-orange-950 to-slate-900 border-amber-500/30",
    playAllBtn: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-amber-900/40",
    bannerBadge: "bg-amber-500/20 text-amber-300 border-amber-500/30"
  },
  marriage: {
    border: "border-rose-100 hover:border-rose-200",
    shadow: "shadow-rose-950/5 hover:shadow-rose-900/10",
    hoverBg: "hover:bg-rose-50/20",
    chevronActive: "bg-rose-50 text-rose-500 border-rose-200",
    consultBtn: "bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border-rose-200/80 hover:border-rose-300",
    consultIcon: "text-rose-600",
    prose: "prose-rose prose-headings:text-rose-950 prose-a:text-rose-600 prose-strong:text-rose-900 prose-code:text-rose-600 prose-code:bg-rose-50",
    playAllBanner: "from-rose-950 via-pink-950 to-slate-900 border-rose-500/30",
    playAllBtn: "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-900/40",
    bannerBadge: "bg-rose-500/20 text-rose-300 border-rose-500/30"
  }
};

const cleanAndNormalizeMarkdown = (content) => {
  if (!content || typeof content !== 'string') return '';
  // 0. Khử triệt để mọi từ ngữ VIP, chuẩn hóa thành "luận giải chuyên sâu"
  let text = content
    .replace(/\bbản\s+(?:báo\s+cáo\s+)?luận\s+giải\s+vip\b/gi, 'bản luận giải chuyên sâu')
    .replace(/\bbáo\s+cáo\s+luận\s+giải\s+vip\b/gi, 'báo cáo luận giải chuyên sâu')
    .replace(/\bluận\s+giải\s+vip\b/gi, 'luận giải chuyên sâu')
    .replace(/\bbáo\s+cáo\s+vip\b/gi, 'báo cáo chuyên sâu')
    .replace(/\bgói\s+vip\b/gi, 'gói chuyên sâu')
    .replace(/\bphân\s+tích\s+vip\b/gi, 'phân tích chuyên sâu')
    .replace(/\bvip\b/gi, 'chuyên sâu')
    .replace(/\bbản\s+bản\b/gi, 'bản');

  // 1. Replace double pipe row separators: "| |" -> "|\n|"
  text = text.replace(/\|\s*\|\s*/g, '|\n|');

  // 2. Fix delimiter stuck to next row: "| :--- | :--- | |" -> "| :--- | :--- |\n|"
  text = text.replace(/(\|[\s:-]+\|)\s*(\|)/g, '$1\n$2');

  // 3. Fix lines that have an orphaned row start like "|9 - 18\n| Tân Tỵ"
  text = text.replace(/\|\s*(\d+\s*-\s*\d+)\s*\n\s*\|\s*/g, '| $1 | ');

  // 4. Line-by-line table preservation & proper spacing
  const lines = text.split(/\r?\n/);
  const resultLines = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const isTableRow = trimmed.startsWith('|') && trimmed.endsWith('|');

    if (isTableRow) {
      if (!inTable) {
        // Table starts: Ensure there is a blank line before it if preceded by non-empty text
        if (resultLines.length > 0 && resultLines[resultLines.length - 1] !== '') {
          resultLines.push('');
        }
        inTable = true;
      }
      resultLines.push(trimmed);
    } else {
      if (inTable) {
        // Table ends: Ensure there is a blank line after it
        if (trimmed !== '') {
          resultLines.push('');
        }
        inTable = false;
      }
      resultLines.push(line);
    }
  }

  text = resultLines.join('\n');

  // 5. Ensure bold headings on standalone lines become h3 subtopics
  text = text.replace(/(?:^|\n)\s*\*\*(Phân Tích|Lộ Trình|Dự Báo|Chiến Lược|Đặc Trưng|Bước Ngoặt|Năng Lực|Định Vị|Môi Trường|Tiểu Nhân|Thời Điểm|Chính Tài|Kho Tài|Rủi Ro|Phong Cách|Mô Hình|Chân Dung|Đào Hoa|Đường Con|Bí Quyết|Mất Cân Bằng|Cảnh Báo|Nguy Cơ|Hạn Mổ|Phương Pháp|Persona|Màu Sắc|Cải Vận|Khung Giờ|Bố Trí|Chu Kỳ|Điểm Gãy|Hoàng Kim)[^:\n]*:\*\*/gi, (match) => {
    return `\n\n### ${match.trim()}`;
  });

  // 6. Ensure clean double newlines outside tables
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
};

const SectionCard = ({ section, idx = 0, sections = [], theme, onConsultSection, ttsState }) => {
  const [isOpen, setIsOpen] = useState(true);
  const IconComponent = sectionIcons[section.id] || Bookmark;
  const gradientColor = sectionColors[section.id] || "from-slate-500 to-slate-700";
  const styles = themeStyles[theme] || themeStyles.tuvi;

  const isCurrentSpeaking = ttsState?.currentSectionId === section.id;
  const isSpeakingNow = isCurrentSpeaking && ttsState?.isPlaying && !ttsState?.isPaused;
  const isSpeakingPaused = isCurrentSpeaking && ttsState?.isPaused;

  const handleToggleSpeech = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
    }
    if (isCurrentSpeaking) {
      ttsEngine.togglePlayPause();
    } else {
      ttsEngine.playSection({
        sectionId: section.id,
        sectionTitle: section.title,
        content: section.content,
        startIndex: 0,
        playlist: sections,
        playlistIndex: idx
      });
    }
  };

  return (
    <div className={`mb-6 bg-white/70 backdrop-blur-md rounded-2xl border ${styles.border} shadow-lg ${styles.shadow} overflow-hidden transition-all duration-300`}>
      {/* Header Bar */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`w-full px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4 text-left transition-all duration-200 cursor-pointer select-none ${styles.hoverBg}`}
      >
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-9.5 h-9.5 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white shadow-md shrink-0`}>
              <IconComponent size={18} />
            </div>
            <h3 className="font-black text-slate-800 text-base sm:text-[18px] md:text-[19.5px] tracking-wide leading-snug break-words">
              {(section.title || '').replace(/\bvip\b/gi, 'chuyên sâu')}
            </h3>
          </div>
          {section.sources && section.sources.length > 0 && (
            <div className="flex flex-wrap gap-1.5 shrink-0">
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
        
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-1 sm:ml-2">
          {/* TTS Audio Read Button */}
          <button
            type="button"
            onClick={handleToggleSpeech}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 group ${
              isSpeakingNow
                ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/30 ring-2 ring-purple-400/40'
                : isSpeakingPaused
                ? 'bg-amber-500 text-white border-amber-500 shadow-amber-500/30'
                : styles.consultBtn
            }`}
            title={
              isSpeakingNow
                ? "Tạm dừng giọng đọc AI"
                : isSpeakingPaused
                ? "Tiếp tục đọc"
                : "Nghe đọc bằng giọng AI tự nhiên"
            }
          >
            {isSpeakingNow ? (
              <>
                <div className="flex items-end gap-0.5 h-3.5 px-0.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1 h-3.5 bg-white rounded-full animate-bounce"></span>
                </div>
                <span className="hidden sm:inline">Tạm dừng</span>
                <span className="sm:hidden text-[11px]">Dừng</span>
              </>
            ) : isSpeakingPaused ? (
              <>
                <Play size={13} fill="currentColor" className="text-white" />
                <span className="hidden sm:inline">Tiếp tục</span>
                <span className="sm:hidden text-[11px]">Tiếp</span>
              </>
            ) : (
              <>
                <Volume2 size={13} className={`${styles.consultIcon} group-hover:scale-110 transition-transform`} />
                <span className="hidden sm:inline">Nghe đọc</span>
                <span className="sm:hidden text-[11px]">Nghe</span>
              </>
            )}
          </button>

          {onConsultSection && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConsultSection(section);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 group ${styles.consultBtn}`}
              title="Đàm đạo chuyên sâu cùng Thầy về mục này"
            >
              <MessageSquare size={13} className={`${styles.consultIcon} group-hover:scale-110 transition-transform`} />
              <span className="hidden sm:inline">Đàm đạo mục này</span>
              <span className="sm:hidden text-[11px]">Đàm đạo</span>
            </button>
          )}
          <div className={`p-1.5 rounded-full bg-slate-50 text-slate-400 border border-slate-200 transition-transform duration-300 ${isOpen ? `rotate-180 ${styles.chevronActive}` : ''}`}>
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* Accordion Content Panel */}
      <div 
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[5000px] border-t border-slate-100 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className={`px-6 pt-4 pb-6 md:px-8 md:pt-5 md:pb-7 text-slate-700 leading-relaxed text-sm md:text-base prose max-w-none ${styles.prose}`}>
          {/* Karaoke Realtime Sentence Highlight */}
          {isCurrentSpeaking && ttsState?.currentSentence && (
            <div className="not-prose mb-5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 border border-purple-200/90 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-600"></span>
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                    Đang đọc câu {ttsState.currentIndex + 1} / {ttsState.totalSentences}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-purple-600 bg-white/80 px-2 py-0.5 rounded-full border border-purple-100 shadow-2xs">
                  {Math.round(ttsState.progressPercent || 0)}%
                </span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-purple-950 leading-relaxed italic">
                &ldquo;{ttsState.currentSentence}&rdquo;
              </p>
            </div>
          )}

          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="mb-5 last:mb-0 leading-relaxed font-normal text-slate-700">{children}</p>,
              h1: ({ children }) => <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-6 mb-3 tracking-wide">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-6 mb-3 tracking-wide">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base md:text-lg font-bold text-slate-900 mt-6 mb-2.5 tracking-wide">{children}</h3>,
              h4: ({ children }) => <h4 className="text-sm md:text-base font-bold text-slate-900 mt-4 mb-2 tracking-wide">{children}</h4>,
              strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-5 space-y-2 text-slate-700 font-normal">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-5 space-y-2 text-slate-700 font-normal">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed font-normal">{children}</li>,
              blockquote: ({ children }) => <blockquote className="pl-4 border-l-4 border-amber-400 italic text-slate-600 bg-amber-50/40 p-3.5 rounded-r-xl my-5 font-normal">{children}</blockquote>,
              table: ({ children }) => (
                <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200/90 shadow-2xs bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs md:text-sm">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => <thead className="bg-slate-100/90 font-bold text-slate-900 font-sans">{children}</thead>,
              tbody: ({ children }) => <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>,
              tr: ({ children }) => <tr className="hover:bg-slate-50/80 transition-colors">{children}</tr>,
              th: ({ children }) => <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] md:text-xs text-slate-800 border-b border-slate-200">{children}</th>,
              td: ({ children }) => <td className="px-4 py-3 text-slate-700 font-normal leading-relaxed border-b border-slate-100">{children}</td>,
            }}
          >
            {cleanAndNormalizeMarkdown(section.content)}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

const SectionRenderer = ({ sections, theme = 'tuvi', onConsultSection }) => {
  const [ttsState, setTtsState] = useState(() => ttsEngine.getState());

  useEffect(() => {
    const unsubscribe = ttsEngine.subscribe((state) => {
      setTtsState(state);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (sections && Array.isArray(sections) && sections.length > 0) {
      ttsEngine.setPlaylist(sections);
    }
  }, [sections]);

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

  const styles = themeStyles[theme] || themeStyles.tuvi;
  const isAnyPlaying = ttsState?.isPlaying;
  const isSpeakingNow = isAnyPlaying && !ttsState?.isPaused;
  const isSpeakingPaused = isAnyPlaying && ttsState?.isPaused;

  const handlePlayAll = () => {
    if (isAnyPlaying) {
      ttsEngine.togglePlayPause();
    } else {
      ttsEngine.playAll(sections);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Banner Nghe Toàn Bài Luận Giải (Áp dụng 4 phân hệ) */}
      <div className={`mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-r ${styles.playAllBanner} border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl text-white`}>
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-white shadow-inner">
            <Headphones size={22} className={isSpeakingNow ? 'animate-bounce text-amber-300' : 'text-white'} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.bannerBadge}`}>
                Nghe Toàn Bài • {sections.length} Mục
              </span>
              {isSpeakingNow && (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Đang phát: Mục {(ttsState.playlistIndex ?? 0) + 1}/{sections.length}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white mt-1 leading-tight truncate">
              Nghe Toàn Bộ Luận Giải Bằng Giọng Đọc AI Tự Nhiên
            </h3>
            <p className="text-xs text-white/75 mt-0.5 hidden sm:block">
              Tự động chuyển tiếp liên tục qua tất cả {sections.length} mục từ đầu đến cuối không ngắt quãng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePlayAll}
            className={`w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-75 active:scale-95 cursor-pointer ${
              isSpeakingNow
                ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-900/40 ring-2 ring-white/30'
                : isSpeakingPaused
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40 ring-2 ring-white/30'
                : styles.playAllBtn
            }`}
          >
            {isSpeakingNow ? (
              <>
                <Pause size={16} fill="currentColor" />
                <span>Tạm Dừng Toàn Bài</span>
              </>
            ) : isSpeakingPaused ? (
              <>
                <Play size={16} fill="currentColor" />
                <span>Tiếp Tục Toàn Bài</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>🎧 Nghe Toàn Bài</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Danh sách các thẻ mục luận giải */}
      {sections.map((section, idx) => (
        <SectionCard 
          key={section.id || idx} 
          section={section} 
          idx={idx}
          sections={sections}
          theme={theme} 
          onConsultSection={onConsultSection}
          ttsState={ttsState}
        />
      ))}
    </div>
  );
};

export default SectionRenderer;
