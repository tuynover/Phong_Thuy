import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Share2, 
  Palette, 
  Layers, 
  User, 
  Calendar, 
  Clock, 
  QrCode as QrIcon 
} from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import QRCode from 'qrcode';

const THEMES = [
  {
    id: 'obsidian',
    name: 'Huyền Vũ',
    sub: 'Đen nhũ vàng',
    cardBg: 'bg-gradient-to-b from-[#16181f] via-[#1a1d26] to-[#0f1117] text-white border-amber-500/40',
    headerBadge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300',
    accentColor: 'text-amber-400',
    boxBg: 'bg-white/5 border-amber-500/20',
    tagBg: 'bg-amber-950/60 text-amber-200 border-amber-500/30',
    secondaryText: 'text-slate-300',
    footerText: 'text-slate-400',
    qrBg: '#1a1d26',
    qrColor: '#f59e0b'
  },
  {
    id: 'bamboo',
    name: 'Trúc Thanh',
    sub: 'Xanh ngọc thiền',
    cardBg: 'bg-gradient-to-b from-[#f0f7f2] via-[#e6f2e9] to-[#d8ebdd] text-slate-800 border-emerald-300/80',
    headerBadge: 'bg-emerald-600/10 text-emerald-900 border-emerald-300',
    titleColor: 'text-emerald-950',
    accentColor: 'text-emerald-700',
    boxBg: 'bg-white/80 border-emerald-200/80 shadow-xs',
    tagBg: 'bg-emerald-100/90 text-emerald-900 border-emerald-300',
    secondaryText: 'text-slate-700',
    footerText: 'text-emerald-800/80',
    qrBg: '#ffffff',
    qrColor: '#064e3b'
  },
  {
    id: 'vermilion',
    name: 'Chu Sa',
    sub: 'Đỏ son cát tường',
    cardBg: 'bg-gradient-to-b from-[#801b1b] via-[#6e1515] to-[#4d0e0e] text-amber-50 border-amber-400/50',
    headerBadge: 'bg-amber-400/20 text-amber-200 border-amber-400/50',
    titleColor: 'text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-yellow-200 to-amber-100',
    accentColor: 'text-amber-300',
    boxBg: 'bg-black/25 border-amber-400/25',
    tagBg: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    secondaryText: 'text-amber-100/90',
    footerText: 'text-amber-200/70',
    qrBg: '#5c1414',
    qrColor: '#fde68a'
  },
  {
    id: 'jade',
    name: 'Ngọc Bích',
    sub: 'Kem ngà cổ điển',
    cardBg: 'bg-gradient-to-b from-[#faf7f2] via-[#f5efe6] to-[#ebe1d3] text-stone-800 border-amber-700/30',
    headerBadge: 'bg-stone-200 text-stone-800 border-stone-300',
    titleColor: 'text-stone-900',
    accentColor: 'text-amber-800',
    boxBg: 'bg-white/70 border-stone-300/80 shadow-xs',
    tagBg: 'bg-amber-100/80 text-amber-900 border-amber-300',
    secondaryText: 'text-stone-700',
    footerText: 'text-stone-600',
    qrBg: '#ffffff',
    qrColor: '#451a03'
  }
];

export default function ShareableStoryModal({ 
  isOpen, 
  onClose, 
  data = {}, 
  type = 'fortune', // 'fortune' | 'almanac'
  user 
}) {
  const [selectedThemeId, setSelectedThemeId] = useState('obsidian');
  const [aspectRatio, setAspectRatio] = useState('9:16'); // '9:16' | '1:1'
  const [displayName, setDisplayName] = useState(user?.name || 'Đương Số');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const cardRef = useRef(null);
  const theme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0];

  // Generate QR Code on mount or theme change
  useEffect(() => {
    const siteUrl = window.location.origin;
    QRCode.toDataURL(siteUrl, {
      width: 140,
      margin: 1,
      color: {
        dark: theme.qrColor,
        light: theme.qrBg
      }
    }).then(url => setQrDataUrl(url)).catch(() => {});
  }, [theme]);

  if (!isOpen) return null;

  // Handle Download PNG
  const handleDownload = async () => {
    if (!cardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      const scale = 3; // 3x scale for crisp 1080p
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: scale,
        cacheBust: true
      });

      const link = document.createElement('a');
      const filename = `PhongThuy_${type === 'fortune' ? 'QueNgay' : 'VanTrinh'}_${Date.now()}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Copy to Clipboard
  const handleCopy = async () => {
    if (!cardRef.current || isExporting) return;
    try {
      setIsExporting(true);
      const blob = await toBlob(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true
      });
      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('Copy error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Resolve titles and info
  const title = type === 'fortune' 
    ? (data?.fortune?.hexagramName || data?.fortune?.name || data?.name || 'Quẻ Xăm Ngày Mới')
    : `Vận Trình Bát Tự • ${data?.dayCanChi || 'Ngày Cát Tường'}`;

  const subtitle = type === 'fortune'
    ? (data?.fortune?.chineseName ? `${data.fortune.chineseName} (${data.fortune.symbol || ''}) • Kinh Dịch Lục Hào` : (data?.fortune?.categoryName || 'Kinh Dịch Lục Hào • Nhật Quái'))
    : `Điểm vận khí: ${data?.score || 85}/100 • ${data?.thapThan || 'Vượng Khí'}`;

  const poemRaw = data?.fortune?.poem || data?.poem || 'Thuận theo đạo lý tự nhiên\nTâm an trí sáng, bình yên tháng ngày.';
  const poem = Array.isArray(poemRaw) ? poemRaw.join('\n') : String(poemRaw);
  const advice = data?.fortune?.advice || data?.fortune?.tagline || data?.fortune?.actionAdvice || data?.highlights?.[0] || 'Khởi tâm thiện lương, nắm bắt thời cơ xuất hành cát lợi.';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        >
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <Share2 size={18} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Xuất Thiệp Ảnh Chia Sẻ
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Chuẩn tỷ lệ Story 9:16 & Bài đăng 1:1 cho mạng xã hội
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* CONTROLS BAR */}
          <div className="px-5 sm:px-6 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* RATIO SELECTOR */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs font-bold">
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${aspectRatio === '9:16' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                9:16 Story
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${aspectRatio === '1:1' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                1:1 Vuông
              </button>
            </div>

            {/* THEME PICKER */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">Màu:</span>
              <div className="flex items-center gap-1.5">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedThemeId(t.id)}
                    title={`${t.name} - ${t.sub}`}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer ${selectedThemeId === t.id ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50 text-indigo-900 shadow-xs' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* ANONYMOUS TOGGLE */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <span className="text-slate-600 font-semibold text-[11px]">Ẩn danh</span>
            </label>
          </div>

          {/* PREVIEW CONTAINER */}
          <div className="p-4 sm:p-6 bg-slate-200/50 flex justify-center items-center overflow-x-auto min-h-[380px]">
            {/* THE EXPORTABLE CARD */}
            <div
              ref={cardRef}
              style={{
                width: aspectRatio === '9:16' ? '340px' : '360px',
                height: aspectRatio === '9:16' ? '604px' : '360px',
                fontFamily: "'Be Vietnam Pro', sans-serif"
              }}
              className={`relative rounded-3xl border-2 shadow-2xl p-5 flex flex-col justify-between overflow-hidden transition-all duration-300 shrink-0 ${theme.cardBg}`}
            >
              {/* CORNER DECORATIVE ACCENTS */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-current opacity-40 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-current opacity-40 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-current opacity-40 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-current opacity-40 pointer-events-none" />

              {/* CARD TOP HEADER */}
              <div>
                <div className="flex items-center justify-between border-b border-current/15 pb-2.5 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">🎋</span>
                    <span className="text-[10px] uppercase tracking-widest font-black opacity-90">
                      PHONG THỦY TUYNOVER
                    </span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${theme.headerBadge}`}>
                    {type === 'fortune' ? 'Nhật Quái Cát Tường' : 'Lịch Bát Tự'}
                  </span>
                </div>

                {/* DATE BADGE */}
                <div className="flex items-center justify-between text-[11px] font-medium opacity-85 mb-2">
                  <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                  <span className="font-bold">{data?.dayCanChi ? `Ngày ${data.dayCanChi}` : ''}</span>
                </div>
              </div>

              {/* CARD CENTER CONTENT */}
              <div className="my-auto space-y-3 text-center">
                <div className="space-y-1">
                  <span className={`inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${theme.tagBg}`}>
                    {subtitle}
                  </span>
                  <h2 className={`text-xl sm:text-2xl font-black tracking-tight leading-snug font-[Montserrat] pt-1 ${theme.titleColor}`}>
                    {title}
                  </h2>
                </div>

                {/* POEM / QUOTE BOX */}
                <div className={`p-3.5 rounded-2xl border backdrop-blur-xs text-xs sm:text-sm font-medium leading-relaxed italic ${theme.boxBg} ${theme.secondaryText}`}>
                  "{poem}"
                </div>

                {/* ADVICE CHIP */}
                {aspectRatio === '9:16' && (
                  <div className="text-[11px] font-semibold opacity-90 pt-1 leading-normal">
                    <span className={theme.accentColor}>✦ Lời khuyên: </span>
                    <span>{advice}</span>
                  </div>
                )}
              </div>

              {/* CARD FOOTER WITH QR & ATTRIBUTION */}
              <div className="pt-2.5 border-t border-current/15 flex items-center justify-between">
                <div className="text-left space-y-0.5">
                  <div className="text-xs font-black tracking-wide">
                    {isAnonymous ? 'Đương Số Ẩn Danh' : displayName}
                  </div>
                  <div className={`text-[9px] ${theme.footerText}`}>
                    phongthuy.tuynover.com
                  </div>
                </div>

                {/* QR CODE */}
                {qrDataUrl && (
                  <div className="p-1 rounded-xl bg-white shadow-xs border border-white/40">
                    <img 
                      src={qrDataUrl} 
                      alt="QR Code" 
                      className="w-11 h-11 rounded-lg block"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MODAL FOOTER BUTTONS */}
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-4 bg-white border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={isExporting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{isCopied ? 'Đã chép ảnh!' : 'Sao chép'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isExporting}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-700/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download size={15} />
              <span>{isExporting ? 'Đang xuất ảnh...' : 'Tải Ảnh PNG'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
