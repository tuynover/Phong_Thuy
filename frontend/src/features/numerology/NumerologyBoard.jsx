import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { 
  Smartphone, 
  Car, 
  CreditCard, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  FileDown, 
  Crown, 
  Zap, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight, 
  Coins, 
  User, 
  Calendar,
  Layers,
  Compass,
  Star,
  Activity,
  Flame,
  Check,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  calculateNumerology, 
  getNumerologyRecord, 
  rateNumerology, 
  togglePublicNumerology, 
  getInterpretationStreamUrl 
} from '@/services/api';
import { AuthContext } from '@/context/AuthContext';
import NumerologyInput from './NumerologyInput';
import AiChatWidget from '@/components/widgets/AiChatWidget';
import FloatingNotificationToast from '@/components/common/FloatingNotificationToast';
import FloatingErrorToast from '@/components/common/FloatingErrorToast';
import InterpretationTierModal from '@/components/modals/InterpretationTierModal';
import PdfExportModal from '@/components/modals/PdfExportModal';
import { TableOfContentsTrigger } from '@/components/widgets/TableOfContents';
import { useInterpretationStream } from '@/hooks/useInterpretationStream';
import { useRecordRating } from '@/hooks/useRecordRating';
import SectionRenderer from '@/components/widgets/SectionRenderer';
import { parseMarkdownSections } from '@/utils/markdownParser';

const NUMEROLOGY_PAGE_SECTIONS = [
  { id: 'section-overview', title: '1. Tổng Quan Điểm Số & Ngũ Hành', label: '1. Tổng Quan Điểm Số & Ngũ Hành' },
  { id: 'section-feixing', title: '2. Cửu Tinh Động Vận & Tinh Tổ', label: '2. Cửu Tinh Động Vận & Tinh Tổ' },
  { id: 'section-iching', title: '3. Kinh Dịch Mai Hoa Lập Quẻ', label: '3. Kinh Dịch Mai Hoa Lập Quẻ' },
  { id: 'section-bazi', title: '4. Tương Phối Bát Tự Mệnh Chủ', label: '4. Tương Phối Bát Tự Mệnh Chủ' },
  { id: 'section-interpretation', title: '5. Luận Giải Học Thuật AI', label: '5. Luận Giải Học Thuật AI' },
  { id: 'section-rating', title: '6. Đánh Giá & Nhận Xét', label: '6. Đánh Giá & Nhận Xét' }
];

const parseHexagramNameAndMeaning = (hex) => {
  if (!hex) return { mainTitle: '', meaning: '' };
  const raw = hex.fullName || hex.name || '';
  const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return {
      mainTitle: `Quẻ ${hex.id}: ${match[1].trim()}`,
      meaning: match[2].trim()
    };
  }
  return {
    mainTitle: `Quẻ ${hex.id}: ${raw}`,
    meaning: ''
  };
};

export default function NumerologyBoard({ 
  user, 
  onRequireLogin, 
  historicalRecordId, 
  onCalculationComplete, 
  onResultChange, 
  onInvalidateHistory 
}) {
  const { user: ctxUser, token } = useContext(AuthContext);
  const activeUser = ctxUser || user;

  const [loading, setLoading] = useState(false);
  const [uiError, setUiError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [isUpgradeModal, setIsUpgradeModal] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Result state with localStorage persistence
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem('numerologyResult');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const recordId = result?._id || result?.recordId || historicalRecordId;

  // Rating hook
  const {
    rating,
    setRating,
    feedback,
    setFeedback,
    justRated,
    isSubmitting: isRatingSubmitting,
    submitRating
  } = useRecordRating({
    recordId,
    initialRating: result?.rating || 0,
    initialFeedback: result?.feedback || '',
    onInvalidateHistory
  });

  // Interpretation Stream hook
  const rawAiContent = typeof result?.aiInterpretation === 'string'
    ? result.aiInterpretation
    : (typeof result?.aiInterpretation?.content === 'string' ? result.aiInterpretation.content : '');

  const {
    interpretation,
    isInterpreting,
    streamError,
    startStream,
    abortStream,
    resetStream
  } = useInterpretationStream({
    initialContent: rawAiContent,
    initialMode: result?.aiInterpretation?.mode || 'standard'
  });

  // Tự động dọn sạch bài luận giải cũ khi đổi sang bản ghi mới
  const prevRecordIdRef = useRef(recordId);
  useEffect(() => {
    if (prevRecordIdRef.current !== recordId) {
      prevRecordIdRef.current = recordId;
      if (!rawAiContent) {
        resetStream();
      }
    }
  }, [recordId, rawAiContent, resetStream]);

  // Save result to localStorage
  useEffect(() => {
    if (result) {
      try {
        localStorage.setItem('numerologyResult', JSON.stringify(result));
      } catch (e) {
        console.error('Error saving numerologyResult to localStorage', e);
      }
      if (onResultChange) onResultChange(result);
    }
  }, [result, onResultChange]);

  // Load historical record if provided
  useEffect(() => {
    if (historicalRecordId) {
      let isMounted = true;
      setLoading(true);
      resetStream();
      getNumerologyRecord(historicalRecordId)
        .then((res) => {
          if (isMounted && res.data) {
            setResult(res.data);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setUiError(err.response?.data?.error || 'Không thể tải bản ghi phong thủy số.');
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => { isMounted = false; };
    }
  }, [historicalRecordId, resetStream]);

  // Handle New Calculation
  const handleCalculate = async (formData) => {
    setLoading(true);
    setUiError('');
    resetStream();
    try {
      const payload = {
        ...formData,
        userId: activeUser ? (activeUser.id || activeUser._id) : 'guest'
      };
      const res = await calculateNumerology(payload);
      if (res.data) {
        setResult(res.data);
        resetStream();
        if (onCalculationComplete) onCalculationComplete(res.data);
        if (onInvalidateHistory) onInvalidateHistory();
        setTimeout(() => {
          const el = document.getElementById('section-overview');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    } catch (err) {
      console.error('Calculate Numerology error:', err);
      setUiError(err.response?.data?.error || 'Có lỗi xảy ra khi phân tích số học.');
    } finally {
      setLoading(false);
    }
  };

  // Start AI Interpretation via Tier Modal selection
  const handleInterpretTier = (tier) => {
    if (!recordId) return;
    setShowTierModal(false);
    setIsUpgradeModal(false);

    const streamUrl = getInterpretationStreamUrl('numerology', recordId);
    startStream({
      streamUrl,
      body: { mode: tier },
      token,
      isVip: tier === 'vip',
      onCreditDeduct: () => {
        setToastMessage(`Đã khởi tạo luận giải ${tier === 'vip' ? 'chuyên sâu VIP (500 Points)' : 'tiêu chuẩn (100 Points)'}.`);
      }
    });
  };

  // Toggle Public Link (Sử dụng local state nội bộ theo quy tắc AGENTS.md rule 3.4)
  const handleTogglePublic = async () => {
    if (!recordId) return;
    if (!activeUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    try {
      const res = await togglePublicNumerology(recordId);
      if (res.data) {
        const nextState = res.data.isPublic;
        setResult(prev => prev ? { ...prev, isPublic: nextState } : prev);
        setToastMessage(nextState ? 'Đã bật chia sẻ công khai dãy số!' : 'Đã tắt chia sẻ công khai.');
      }
    } catch (err) {
      setUiError(err.response?.data?.error || 'Lỗi cập nhật trạng thái chia sẻ.');
    }
  };

  // Copy Public Link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/numerology/record/${recordId}`;
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage('Đã sao chép liên kết hồ sơ số học vào khay nhớ tạm!');
    }).catch(() => {
      setUiError('Không thể sao chép liên kết.');
    });
  };

  // Rating & Feedback Submit
  const handleRatingSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!rating) return;
    const ok = await submitRating(rateNumerology, recordId);
    if (ok) {
      setToastMessage('Xin chân thành cảm ơn ý kiến đánh giá & nhận xét của bạn!');
    }
  };

  // Reset to form
  const handleReset = () => {
    resetStream();
    setResult(null);
    localStorage.removeItem('numerologyResult');
  };

  // Data helpers
  const snapshot = result?.analysisSnapshot || {};
  const feixing = snapshot?.feixingAnalysis || {};
  const elements = snapshot?.elementAnalysis || {};
  const iching = snapshot?.ichingHexagrams || {};
  const bazi = snapshot?.baziCompatibility;
  const currentInterpretationMode = result?.aiInterpretation?.mode || 'standard';

  // Deduplicate feixing.pairs by pair key so each combination appears ONLY ONCE
  const uniquePairs = useMemo(() => {
    if (!feixing?.pairs || !Array.isArray(feixing.pairs)) return [];
    const seen = new Map();
    feixing.pairs.forEach(p => {
      const key = String(p.pair);
      if (!seen.has(key)) {
        seen.set(key, { ...p, count: p.count || 1 });
      } else {
        const existing = seen.get(key);
        existing.count = (existing.count || 1) + (p.count || 1);
      }
    });
    return Array.from(seen.values());
  }, [feixing?.pairs]);

  // Helper màu sắc cho xếp hạng quẻ Dịch (Đại Cát, Thượng Cát, Trung Cát, Cẩn Trọng, Hung, Đại Hung)
  const getRankBadgeClass = (rank) => {
    switch (rank) {
      case 'Đại Cát':
        return 'bg-emerald-600 text-white';
      case 'Thượng Cát':
        return 'bg-teal-600 text-white';
      case 'Trung Cát':
        return 'bg-sky-600 text-white';
      case 'Cẩn Trọng':
        return 'bg-amber-600 text-white';
      case 'Hung':
        return 'bg-rose-600 text-white shadow-xs';
      case 'Đại Hung':
        return 'bg-red-700 text-white shadow-sm ring-1 ring-red-400';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  // Helper class cho thẻ quẻ Dịch theo độ Cát/Hung
  const getHexCardClass = (rank) => {
    if (rank === 'Đại Hung') return 'p-5 rounded-3xl bg-red-50/40 border-2 border-red-400/80 shadow-xs flex flex-col justify-between transition-all';
    if (rank === 'Hung') return 'p-5 rounded-3xl bg-rose-50/30 border border-rose-300 shadow-2xs flex flex-col justify-between transition-all';
    return 'p-5 rounded-3xl bg-slate-50 border border-amber-200/90 flex flex-col justify-between transition-all';
  };

  // Render Hexagram 6 lines visual bars
  const renderHexagramLines = (binaryCode, movingLineNumber = null) => {
    if (!binaryCode || binaryCode.length !== 6) return null;
    const lines = binaryCode.split('');
    return (
      <div className="flex flex-col gap-1.5 w-24 mx-auto my-3">
        {lines.map((bit, idx) => {
          const lineNumber = 6 - idx; // 6 to 1
          const isYang = bit === '1';
          const isMoving = movingLineNumber === lineNumber;

          return (
            <div key={idx} className="relative flex items-center justify-center">
              {isYang ? (
                <div className={`w-full h-3 rounded-sm transition-all ${
                  isMoving ? 'bg-amber-500 shadow-sm shadow-amber-500/50 ring-2 ring-amber-300' : 'bg-slate-800'
                }`} />
              ) : (
                <div className="w-full flex justify-between gap-2">
                  <div className={`w-[45%] h-3 rounded-sm transition-all ${
                    isMoving ? 'bg-amber-500 shadow-sm shadow-amber-500/50 ring-2 ring-amber-300' : 'bg-slate-800'
                  }`} />
                  <div className={`w-[45%] h-3 rounded-sm transition-all ${
                    isMoving ? 'bg-amber-500 shadow-sm shadow-amber-500/50 ring-2 ring-amber-300' : 'bg-slate-800'
                  }`} />
                </div>
              )}
              {isMoving && (
                <span className="absolute -right-5 text-[10px] font-bold text-amber-600">
                  ●
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Toast Notifications */}
      {toastMessage && (
        <FloatingNotificationToast
          message={toastMessage}
          onClose={() => setToastMessage('')}
        />
      )}
      {uiError && (
        <FloatingErrorToast
          message={uiError}
          onClose={() => setUiError('')}
        />
      )}

      {/* Screen 1: Input Form if no result */}
      {!result ? (
        <NumerologyInput
          onSubmit={handleCalculate}
          isLoading={loading}
        />
      ) : (
        /* Screen 2: Numerology Dashboard */
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-amber-200/90 shadow-md">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 hover:text-amber-950 transition bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-2xl border border-amber-200 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              Khảo Sát Số Khác
            </button>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Copy Link Button */}
              {result.isPublic && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-2xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  title="Sao chép liên kết chia sẻ công khai"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-700" />
                  Sao Chép Link
                </button>
              )}

              {/* Nút Xuất PDF */}
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(true)}
                className="px-4 py-2 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer"
                title="Xuất hồ sơ số học định dạng PDF chuẩn in ấn A4"
              >
                <FileDown className="w-4 h-4 text-white" />
                <span>Xuất PDF</span>
              </button>

              {/* Toggle Switch Chia Sẻ Công Khai */}
              {activeUser && (
                <div className="flex items-center gap-2 pl-3 border-l border-amber-200">
                  <span className="text-xs font-bold text-slate-700">
                    {result.isPublic ? 'Chia sẻ: Bật' : 'Chia sẻ: Tắt'}
                  </span>
                  <button
                    type="button"
                    onClick={handleTogglePublic}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      result.isPublic ? 'bg-amber-600' : 'bg-slate-300'
                    }`}
                    role="switch"
                    aria-checked={result.isPublic}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        result.isPublic ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1: HERO SCORE CARD & FIVE ELEMENTS BREAKDOWN */}
          <div id="section-overview" className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xl shadow-amber-900/5 space-y-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-amber-100">
              <div className="text-center lg:text-left space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                  {result.type === 'sim' && <Smartphone size={14} className="text-amber-700" />}
                  {result.type === 'plate' && <Car size={14} className="text-blue-700" />}
                  {result.type === 'bank' && <CreditCard size={14} className="text-emerald-700" />}
                  <span>
                    {result.type === 'sim' ? 'Sim Số Điện Thoại' : (result.type === 'plate' ? 'Biển Số Xe' : 'Tài Khoản Ngân Hàng')}
                  </span>
                  {result.bankName && <span className="font-semibold text-slate-600">• {result.bankName}</span>}
                </div>

                {/* Display Number with Colored Badges according to Five Elements */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
                  {elements.analyzedDigits && elements.analyzedDigits.length > 0 ? (
                    elements.analyzedDigits.map((item, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center justify-center w-8 h-9 sm:w-9 sm:h-10 rounded-xl font-mono text-lg sm:text-xl font-black border shadow-xs transition-transform hover:scale-105 ${item.bgClass} ${item.colorClass}`}
                        title={`Số ${item.digit} - Hành ${item.element} (${item.polarity})`}
                      >
                        {item.digit}
                      </span>
                    ))
                  ) : (
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-wider">
                      {result.displayNumber || result.targetNumber}
                    </h2>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Gia chủ: <strong>{result.ownerName || 'Gia Chủ'}</strong> • Vận chu kỳ: <strong>Vận {result.period} ({feixing.periodInfo?.years || 'Hiện tại'})</strong>
                </p>
              </div>

              {/* Big Score Hero Box */}
              <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 text-center min-w-[220px]">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800">Điểm Số Học Thuật</span>
                <div className="flex items-baseline justify-center gap-1 my-1">
                  <span className={`text-5xl font-black ${
                    snapshot.overallScore >= 86 ? 'text-emerald-600' :
                    (snapshot.overallScore >= 75 ? 'text-teal-600' :
                    (snapshot.overallScore >= 60 ? 'text-amber-600' : 'text-rose-600'))
                  }`}>
                    {snapshot.overallScore || 0}
                  </span>
                  <span className="text-base font-bold text-slate-400">/100</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-extrabold shadow-sm ${
                  snapshot.auspiciousLevel === 'DAI_CAT' ? 'bg-emerald-600 text-white' :
                  (snapshot.auspiciousLevel === 'CAT' ? 'bg-teal-600 text-white' :
                  (snapshot.auspiciousLevel === 'BINH' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'))
                }`}>
                  {snapshot.levelLabel || 'Bình Hòa'}
                </span>
              </div>
            </div>

            {/* VISUAL FIVE ELEMENTS ROW & DISTRIBUTION */}
            {elements.analyzedDigits && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-600" />
                      Phổ Ngũ Hành & Bản Mệnh Dãy Số
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Từng chữ số mang sắc màu ngũ hành riêng biệt: Kim (Bạc), Mộc (Lá), Thủy (Lam), Hỏa (Đỏ), Thổ (Nâu đất).
                    </p>
                  </div>
                  {elements.dominantElement && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 self-start sm:self-auto">
                      <span>Bản Mệnh Dãy Số:</span>
                      <strong className="text-amber-950 font-black">Hành {elements.dominantElement}</strong>
                    </div>
                  )}
                </div>

                {/* Percentage Distribution Bar */}
                {elements.elementPercentages && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                      <span>Tỷ Lệ Phân Bổ Ngũ Hành</span>
                      <span className="text-amber-900 font-semibold">{elements.flowEvaluation || ''}</span>
                    </div>
                    <div className="w-full h-3.5 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                      {elements.elementPercentages.Kim > 0 && (
                        <div style={{ width: `${elements.elementPercentages.Kim}%` }} className="bg-slate-500 h-full" title={`Kim: ${elements.elementPercentages.Kim}%`} />
                      )}
                      {elements.elementPercentages.Mộc > 0 && (
                        <div style={{ width: `${elements.elementPercentages.Mộc}%` }} className="bg-emerald-500 h-full" title={`Mộc: ${elements.elementPercentages.Mộc}%`} />
                      )}
                      {elements.elementPercentages.Thủy > 0 && (
                        <div style={{ width: `${elements.elementPercentages.Thủy}%` }} className="bg-sky-500 h-full" title={`Thủy: ${elements.elementPercentages.Thủy}%`} />
                      )}
                      {elements.elementPercentages.Hỏa > 0 && (
                        <div style={{ width: `${elements.elementPercentages.Hỏa}%` }} className="bg-rose-500 h-full" title={`Hỏa: ${elements.elementPercentages.Hỏa}%`} />
                      )}
                      {elements.elementPercentages.Thổ > 0 && (
                        <div style={{ width: `${elements.elementPercentages.Thổ}%` }} className="bg-amber-600 h-full" title={`Thổ: ${elements.elementPercentages.Thổ}%`} />
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-semibold text-slate-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500" /> Kim: {elements.elementPercentages?.Kim || 0}% ({elements.elementCounts?.Kim || 0} số)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mộc: {elements.elementPercentages?.Mộc || 0}% ({elements.elementCounts?.Mộc || 0} số)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Thủy: {elements.elementPercentages?.Thủy || 0}% ({elements.elementCounts?.Thủy || 0} số)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Hỏa: {elements.elementPercentages?.Hỏa || 0}% ({elements.elementCounts?.Hỏa || 0} số)
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Thổ: {elements.elementPercentages?.Thổ || 0}% ({elements.elementCounts?.Thổ || 0} số)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Yin-Yang & Tail Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Yin Yang Bar */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Cân Bằng Âm Dương</span>
                  <span className="text-amber-800">{feixing.balanceState || 'Bình hòa'}</span>
                </div>
                <div className="w-full h-3.5 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                  <div 
                    style={{ width: `${(feixing.oddCount / (feixing.oddCount + feixing.evenCount || 1)) * 100}%` }}
                    className="h-full bg-amber-500 transition-all duration-500"
                    title={`Dương (Lẻ): ${feixing.oddCount}`}
                  />
                  <div 
                    style={{ width: `${(feixing.evenCount / (feixing.oddCount + feixing.evenCount || 1)) * 100}%` }}
                    className="h-full bg-slate-700 transition-all duration-500"
                    title={`Âm (Chẵn): ${feixing.evenCount}`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Dương: {feixing.oddCount || 0} chữ số
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-slate-700" /> Âm: {feixing.evenCount || 0} chữ số
                  </span>
                </div>
              </div>

              {/* Tail Evaluation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5 flex flex-col justify-center">
                <div className="text-xs font-bold text-slate-700">Khí Khẩu Đuôi Số ({feixing.tailDigits || ''})</div>
                <p className="text-xs font-semibold text-amber-900 leading-relaxed">
                  {feixing.tailEvaluation || 'Đuôi số bình ổn, duy trì dòng năng lượng ổn định.'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: FLYING STARS (CỬU TINH ĐỘNG VẬN & CẶP TINH TỔ) */}
          <div id="section-feixing" className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xl shadow-amber-900/5 space-y-6">
            <div className="border-b border-amber-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="text-amber-600" size={20} />
                  Cửu Tinh Động Vận & Các Cặp Tinh Tổ (Vận {result.period})
                </h3>
                <p className="text-xs text-slate-500">
                  Tương quan với Đương Lệnh (Sao {feixing.periodInfo?.rulingStar}) và Tiến Khí (Sao {feixing.periodInfo?.futureStar}) theo Tam Nguyên Cửu Vận.
                </p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                Chu kỳ {feixing.periodInfo?.years || 'Hiện tại'}
              </div>
            </div>

            {/* Star Classification Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Đương Lệnh (Vượng)</span>
                <span className="text-base font-extrabold text-emerald-900">
                  Sao {feixing.periodInfo?.rulingStar} ({feixing.starCounts?.[feixing.periodInfo?.rulingStar] || 0} lần)
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-center">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Tiến Khí (Sinh Khí)</span>
                <span className="text-base font-extrabold text-blue-900">
                  Sao {feixing.periodInfo?.futureStar} ({feixing.starCounts?.[feixing.periodInfo?.futureStar] || 0} lần)
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Thoái Khí</span>
                <span className="text-base font-extrabold text-amber-900">
                  Sao {feixing.periodInfo?.retiredStar} ({feixing.starCounts?.[feixing.periodInfo?.retiredStar] || 0} lần)
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Sát Tinh (2, 3, 7)</span>
                <span className="text-base font-extrabold text-rose-900">
                  {[2, 3, 7].reduce((acc, s) => acc + (feixing.starCounts?.[s] || 0), 0)} vị trí
                </span>
              </div>
            </div>

            {/* Star Pairs Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Danh Sách Cặp Sao Tinh Tổ Xuất Hiện
              </h4>
              {uniquePairs && uniquePairs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {uniquePairs.map((p, idx) => {
                    const isSat = p.badgeType === 'hung' || (p.label && typeof p.label === 'string' && p.label.includes('Sát'));
                    const isCat = p.badgeType === 'cat';
                    const badgeText = p.badgeType === 'hung' ? 'Hung Sát' : (p.badgeType === 'cat' ? 'Cát Khí' : 'Bình Hòa');

                    return (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all ${
                          isSat 
                            ? 'bg-rose-50/70 border-rose-300 shadow-sm'
                            : (isCat ? 'bg-emerald-50/60 border-emerald-300' : 'bg-slate-50 border-slate-200')
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-white border border-slate-300 text-slate-900 font-mono shadow-xs">
                              {p.pair}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900">
                              {p.label || p.name}
                            </span>
                            {p.count > 1 && (
                              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                x{p.count}
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isSat ? 'bg-rose-600 text-white' : (isCat ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700')
                          }`}>
                            {badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {p.desc || p.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
                  Dãy số có trường khí bình ổn, không phát hiện tổ hợp hung sát hay tinh tổ biến dịch đặc thù.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: ICHING MEI HUA (KINH DỊCH MAI HOA LẬP QUẺ - CHUẨN 64 QUẺ HẰNG NGÀY) */}
          <div id="section-iching" className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xl shadow-amber-900/5 space-y-6">
            <div className="border-b border-amber-100 pb-3">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Layers className="text-amber-600" size={20} />
                Kinh Dịch Mai Hoa Lập Quẻ (Quẻ Chủ & Quẻ Biến)
              </h3>
              <p className="text-xs text-slate-500">
                Đánh giá theo Thoán Từ và bảng 64 quẻ Dịch kinh điển: Quẻ Chủ qua Hào {iching.movingLine} Động hóa Quẻ Biến.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Quẻ Chủ */}
              <div className={getHexCardClass(iching.primaryHexagram?.auspicious)}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                      Quẻ Chủ (Chính Quái)
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Cung {iching.primaryHexagram?.palace} • Hành {iching.primaryHexagram?.element}
                    </span>
                  </div>

                  {(() => {
                    const parsed = parseHexagramNameAndMeaning(iching.primaryHexagram);
                    return (
                      <div className="text-center my-4 space-y-1">
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">
                          {parsed.mainTitle}
                        </h4>
                        {parsed.meaning && (
                          <div className="text-sm font-bold text-amber-900/80">
                            {parsed.meaning}
                          </div>
                        )}
                        <div className="pt-1">
                          <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-extrabold shadow-xs ${
                            getRankBadgeClass(iching.primaryHexagram?.auspicious)
                          }`}>
                            {iching.primaryHexagram?.auspicious}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 6 lines visual bars */}
                  {renderHexagramLines(iching.primaryHexagram?.binary, iching.movingLine)}
                </div>

                <div className="space-y-2 mt-3">
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-2xl border border-slate-200 text-center font-medium">
                    "{iching.primaryHexagram?.description}"
                  </p>
                  {iching.primaryHexagram?.advice && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/70 text-center italic">
                      Lời khuyên: {iching.primaryHexagram.advice}
                    </p>
                  )}
                </div>
              </div>

              {/* Quẻ Biến */}
              <div className={getHexCardClass(iching.transformedHexagram?.auspicious)}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles size={12} /> Quẻ Biến (Hào {iching.movingLine} Động)
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Cung {iching.transformedHexagram?.palace} • Hành {iching.transformedHexagram?.element}
                    </span>
                  </div>

                  {(() => {
                    const parsed = parseHexagramNameAndMeaning(iching.transformedHexagram);
                    return (
                      <div className="text-center my-4 space-y-1">
                        <h4 className="text-xl font-black text-slate-900 tracking-tight">
                          {parsed.mainTitle}
                        </h4>
                        {parsed.meaning && (
                          <div className="text-sm font-bold text-emerald-900/80">
                            {parsed.meaning}
                          </div>
                        )}
                        <div className="pt-1">
                          <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-extrabold shadow-xs ${
                            getRankBadgeClass(iching.transformedHexagram?.auspicious)
                          }`}>
                            {iching.transformedHexagram?.auspicious}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 6 lines visual bars */}
                  {renderHexagramLines(iching.transformedHexagram?.binary, null)}
                </div>

                <div className="space-y-2 mt-3">
                  <p className="text-xs text-slate-700 bg-white p-3 rounded-2xl border border-slate-200 text-center font-medium">
                    "{iching.transformedHexagram?.description}"
                  </p>
                  {iching.transformedHexagram?.advice && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200/70 text-center italic">
                      Lời khuyên: {iching.transformedHexagram.advice}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: BAZI COMPATIBILITY (CHỈ HIỆN KHI CHỌN CHẾ ĐỘ PHỐI BÁT TỰ) */}
          {bazi && (
            <div id="section-bazi" className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xl shadow-amber-900/5 space-y-6">
              <div className="border-b border-amber-100 pb-3">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <User className="text-amber-600" size={20} />
                  Tương Phối Bát Tự & Mệnh Quái Gia Chủ
                </h3>
                <p className="text-xs text-slate-500">
                  Đối chiếu ngũ hành dãy số với sinh thần Bát tự, xác định ngũ hành vượng nhất, Dụng Thần và đối tượng phù hợp.
                </p>
              </div>

              {/* Bazi Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nhật Chủ (Day Master)</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {bazi.dayMasterStem} {bazi.dayMasterElement}
                  </span>
                  <span className="text-[10px] text-slate-500 block">({bazi.strength || 'Bình hòa'})</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-center">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Ngũ Hành Vượng Nhất</span>
                  <span className="text-base font-extrabold text-purple-900">
                    {bazi.strongestElement || 'N/A'}
                  </span>
                  <span className="text-[10px] text-purple-600 block">Khuyết suy: {bazi.weakestElement || 'N/A'}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Dụng Thần Cần Bổ</span>
                  <span className="text-base font-extrabold text-emerald-900">
                    Hành {bazi.primaryDungThan}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">Hỷ Thần: {bazi.hyThan}</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">Kỵ Thần Cần Tránh</span>
                  <span className="text-base font-extrabold text-rose-900">
                    Hành {bazi.kyThan}
                  </span>
                  <span className="text-[10px] text-rose-600 block">Cung Phi: Cung {bazi.cungPhi}</span>
                </div>
              </div>

              {/* Compatibility Score Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Độ Hòa Hợp Bát Tự & Dãy Số:</div>
                  <div className="text-sm font-extrabold text-emerald-900 mt-0.5">
                    {bazi.matchEvaluation}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-black text-emerald-700 font-mono">
                    {bazi.compatibilityScore}/100
                  </div>
                </div>
              </div>

              {/* Suitable For & Unsuitable For Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                  <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Thích Hợp Cho Đối Tượng</span>
                  </div>
                  <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                    {bazi.suitableFor || 'Phù hợp với người cần bổ khuyết ngũ hành và năng lượng tương sinh.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1.5">
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <span>Cảnh Báo Không Thích Hợp</span>
                  </div>
                  <p className="text-xs text-rose-950 leading-relaxed font-medium">
                    {bazi.unsuitableFor || 'Cẩn trọng nếu bản mệnh bị trùng lặp Kỵ thần hoặc quá vượng.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: AI IN-DEPTH INTERPRETATION (CHỈ ÁP DỤNG KHI CÓ PHỐI BÁT TỰ) */}
          {result.mode === 'bazi' && bazi ? (
            <>
              {/* TRIGGER BANNER NẾU CHƯA CÓ BÀI LUẬN */}
              {!interpretation && !isInterpreting && (
                <div className="rounded-3xl p-8 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center justify-center sm:justify-start gap-1.5">
                      <Sparkles className="w-4 h-4" /> Trí Tuệ Nhân Tạo Chuyên Sâu
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black">
                      Luận Giải Phong Thủy Số Toàn Diện 5 Chương
                    </h3>
                    <p className="text-sm text-amber-100 max-w-xl">
                      {result.type === 'sim' && 'Chi tiết dòng năng lượng giao tế, đón đầu vận hội ngoại giao, chiêu tài và kích hoạt danh tiếng theo Bát Tự.'}
                      {result.type === 'plate' && 'Luận đoán trường khí chuyển động, bảo vệ an toàn lộ trình và phương pháp hóa giải xung sát theo mệnh chủ.'}
                      {result.type === 'bank' && 'Giải mã năng lượng Kim Khố tụ tài, tránh thất thoát dòng tiền và tối ưu tích lũy tài sản theo Dụng Thần.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUpgradeModal(false);
                      setShowTierModal(true);
                    }}
                    className="px-8 py-4 rounded-2xl bg-white text-amber-900 hover:bg-amber-50 font-black text-sm sm:text-base shadow-xl hover:shadow-2xl transition transform active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles size={18} className="text-amber-600" />
                    <span>LUẬN GIẢI NGAY</span>
                  </button>
                </div>
              )}

              {/* AI INTERPRETATION STREAM DISPLAY AREA */}
              {(interpretation || isInterpreting) && (
                <div id="section-interpretation" className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-amber-300 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-md">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                          Bản Luận Giải Phong Thủy Số Học
                          {currentInterpretationMode === 'vip' && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-black flex items-center gap-1">
                              <Crown className="w-3 h-3 fill-current" /> VIP
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Đại Sư Phong Thủy Số Lý & Kinh Dịch Chu Đạo
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <TableOfContentsTrigger theme="numerology" />

                      {isInterpreting && (
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 animate-pulse">
                          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                          Đang sinh luận giải trực tiếp từ Đại Sư...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Structured Chapters via SectionRenderer */}
                  <SectionRenderer
                    sections={parseMarkdownSections(typeof interpretation === 'string' ? interpretation : (interpretation?.content || rawAiContent || ''), 'numerology')}
                    pageSections={NUMEROLOGY_PAGE_SECTIONS}
                    theme="numerology"
                    rawText={typeof interpretation === 'string' ? interpretation : (interpretation?.content || rawAiContent || '')}
                    isChatOpen={isChatOpen}
                    onConsultSection={() => {
                      setIsChatOpen(true);
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            /* THÔNG BÁO CHO CHẾ ĐỘ XEM NHANH: LUẬN GIẢI AI CHỈ ÁP DỤNG KHI PHỐI BÁT TỰ */
            <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-800 via-slate-900 to-amber-950 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-amber-500/20">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles size={14} className="text-amber-400" /> Luận Giải Chuyên Sâu AI
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  Chỉ Áp Dụng Khi Khảo Sát Phối Bát Tự
                </h3>
                <p className="text-sm text-slate-300 max-w-xl">
                  Để nhận bài Luận Giải Phong Thủy Số 5 Chương chi tiết từ Đại Sư AI theo đúng ngày giờ sinh và Dụng Thần của bạn, vui lòng chọn chế độ <strong>Xem Phối Bát Tự</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm shadow-lg shadow-amber-600/30 transition transform active:scale-95 whitespace-nowrap cursor-pointer flex items-center gap-2"
              >
                <RotateCcw size={16} />
                <span>Xem Lại Với Bát Tự</span>
              </button>
            </div>
          )}

          {/* SECTION 6: USER FEEDBACK & STAR RATING */}
          <div id="section-rating" className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Đánh giá chất lượng khảo sát phong thủy số
                </h4>
                <p className="text-xs text-slate-500">
                  Ý kiến của bạn giúp chúng tôi không ngừng hoàn thiện học thuật số lý.
                </p>
              </div>

              {/* Star Selector */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (rating || 0)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {rating > 0 && !justRated && (
              <form onSubmit={handleRatingSubmit} className="space-y-3 pt-2">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Để lại nhận xét hoặc cảm nhận của bạn về dãy số này (không bắt buộc)..."
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none h-20"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isRatingSubmitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {isRatingSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                  </button>
                </div>
              </form>
            )}

            {justRated && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} /> Cảm ơn bạn đã gửi đánh giá!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tier Selection Modal (Chỉ mở khi xem Phối Bát Tự) */}
      <InterpretationTierModal
        isOpen={showTierModal}
        onClose={() => {
          setShowTierModal(false);
          setIsUpgradeModal(false);
        }}
        onConfirm={handleInterpretTier}
        userCredits={activeUser?.credits ?? 0}
        isAdmin={activeUser?.role === 'admin'}
        system="numerology"
        isUpgrade={isUpgradeModal}
        recordData={result}
      />

      {/* Follow-up Chat Widget (Chỉ mở khi xem Phối Bát Tự) */}
      {result && recordId && result.mode === 'bazi' && (
        <AiChatWidget
          system="numerology"
          recordId={recordId}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(prev => !prev)}
          title="Tư Vấn Phong Thủy Số Lý"
        />
      )}

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        system="numerology"
        recordId={recordId}
        recordData={result}
        hasInterpretation={Boolean(interpretation || result?.aiInterpretation?.content || rawAiContent)}
        interpretationMode={currentInterpretationMode}
        rawInterpretation={typeof interpretation === 'string' ? interpretation : (interpretation?.content || rawAiContent || '')}
        onDownloadStart={(msg) => setToastMessage(msg)}
      />
    </div>
  );
}
