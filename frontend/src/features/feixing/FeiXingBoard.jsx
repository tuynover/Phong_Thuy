import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { 
  Compass, 
  Sparkles, 
  Share2, 
  Copy, 
  Star, 
  MessageCircle, 
  RotateCcw, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle,
  Building,
  User,
  ArrowRight,
  Info,
  Crown,
  ScrollText,
  ShieldCheck,
  Check,
  Flame,
  Droplets,
  Layers,
  FileDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  calculateFeiXing, 
  getFeiXingRecord, 
  rateFeiXing, 
  togglePublicFeiXing, 
  getInterpretationStreamUrl 
} from '@/services/api';
import { AuthContext } from '@/context/AuthContext';
import FeiXingInput from './FeiXingInput';
import FeiXingGrid from './FeiXingGrid';
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

const FEIXING_PAGE_SECTIONS = [
  { id: 'section-overview', title: '1. Tổng Quan Tinh Bàn & La Kinh', label: '1. Tổng Quan Tinh Bàn & La Kinh' },
  { id: 'section-menhtrach', title: '2. Mệnh Trạch Tương Phối', label: '2. Mệnh Trạch Tương Phối' },
  { id: 'section-grid', title: '3. Cửu Cung Phi Tinh Trạch Bàn', label: '3. Cửu Cung Phi Tinh Trạch Bàn' },
  { id: 'section-interpretation', title: '4. Cẩm Nang Luận Giải Của Thầy', label: '4. Cẩm Nang Luận Giải Của Thầy' },
  { id: 'section-rating', title: '5. Đánh Giá & Nhận Xét', label: '5. Đánh Giá & Nhận Xét' }
];

export default function FeiXingBoard({ 
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
      const saved = localStorage.getItem('feixingResult');
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

  // Tự động dọn sạch bài luận giải cũ khi đổi sang bản ghi tinh bàn mới
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
        localStorage.setItem('feixingResult', JSON.stringify(result));
      } catch (e) {
        console.error('Error saving feixingResult to localStorage', e);
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
      getFeiXingRecord(historicalRecordId)
        .then((res) => {
          if (isMounted && res.data) {
            setResult(res.data);
          }
        })
        .catch((err) => {
          if (isMounted) {
            setUiError(err.response?.data?.error || 'Không thể tải bản ghi phong thủy.');
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });

      return () => { isMounted = false; };
    }
  }, [historicalRecordId, resetStream]);

  // Handle New Calculation (Xóa sạch luận giải cũ khi bấm lập tinh bàn mới - Sửa Lỗi 1)
  const handleCalculate = async (formData) => {
    setLoading(true);
    setUiError('');
    resetStream();
    try {
      const payload = {
        ...formData,
        userId: activeUser ? (activeUser.id || activeUser._id) : 'guest'
      };
      const res = await calculateFeiXing(payload);
      if (res.data) {
        setResult(res.data);
        resetStream();
        if (onCalculationComplete) onCalculationComplete(res.data);
        if (onInvalidateHistory) onInvalidateHistory();
        setTimeout(() => {
          const el = document.getElementById('section-grid') || document.getElementById('section-overview');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    } catch (err) {
      console.error('Calculate FeiXing error:', err);
      setUiError(err.response?.data?.error || 'Có lỗi xảy ra khi lập tinh bàn Huyền Không.');
    } finally {
      setLoading(false);
    }
  };

  // Start AI Interpretation via Tier Modal selection
  const handleInterpretTier = (tier) => {
    if (!recordId) return;
    setShowTierModal(false);
    setIsUpgradeModal(false);

    const streamUrl = getInterpretationStreamUrl('feixing', recordId);
    startStream({
      streamUrl,
      body: { mode: tier },
      token,
      isVip: tier === 'vip',
      onCreditDeduct: () => {
        setToastMessage(`Đã khởi tạo luận giải ${tier === 'vip' ? 'thẩm định chuyên sâu VIP' : 'tiêu chuẩn'}.`);
      }
    });
  };

  // Toggle Public Link
  const handleTogglePublic = async () => {
    if (!recordId) return;
    if (!activeUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    try {
      const res = await togglePublicFeiXing(recordId);
      if (res.data) {
        const nextState = res.data.isPublic;
        setResult(prev => prev ? { ...prev, isPublic: nextState } : prev);
        setToastMessage(nextState ? 'Đã bật chia sẻ công khai lá số!' : 'Đã tắt chia sẻ công khai.');
      }
    } catch (err) {
      setUiError(err.response?.data?.error || 'Lỗi cập nhật trạng thái chia sẻ.');
    }
  };

  // Copy Public Link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/feixing/record/${recordId}`;
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage('Đã sao chép liên kết lá số vào khay nhớ tạm!');
    }).catch(() => {
      setUiError('Không thể sao chép liên kết.');
    });
  };

  // Rating & Feedback Submit (Yêu Cầu 6)
  const handleRatingSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!rating) return;
    const ok = await submitRating(rateFeiXing, recordId);
    if (ok) {
      setToastMessage('Xin chân thành cảm ơn ý kiến đánh giá & nhận xét của bạn!');
    }
  };

  // Reset to form
  const handleReset = () => {
    resetStream();
    setResult(null);
    localStorage.removeItem('feixingResult');
  };

  const ownerProfile = result?.analysisSnapshot?.ownerProfile || result?.ownerBirthInfo;
  const currentInterpretationMode = result?.aiInterpretation?.mode || 'standard';

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8 font-sans">
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
        <FeiXingInput
          onSubmit={handleCalculate}
          loading={loading}
        />
      ) : (
        /* Screen 2: Flying Star Chart Result Dashboard (100% Light Theme) */
        <div className="space-y-8 animate-fadeIn">
          {/* Top Actions & Breadcrumb Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-amber-200/90 shadow-md">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-950 transition bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              Lập Tinh Bàn Mới
            </button>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Copy Link Button */}
              {result.isPublic && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition flex items-center gap-1.5 shadow-sm active:scale-95"
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
                className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 border border-amber-300/80 transition flex items-center gap-1.5 shadow-sm active:scale-95"
                title="Xuất hồ sơ phong thủy định dạng PDF chuẩn in ấn A4"
              >
                <FileDown className="w-4 h-4 text-amber-700" />
                <span>Xuất PDF</span>
              </button>

              {/* Thanh Gạt (Toggle Switch) Chia Sẻ Công Khai (Yêu Cầu 3) */}
              {activeUser && (
                <div className="flex items-center gap-2 pl-2 border-l border-amber-200">
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
                    title={result.isPublic ? 'Nhấp để tắt chia sẻ công khai' : 'Nhấp để bật chia sẻ công khai'}
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

          {/* SƠ ĐỒ 1: TỔNG QUAN TINH BÀN & LA KINH HƯỚNG NHÀ */}
          <div id="section-overview" className="bg-white rounded-3xl p-4 sm:p-8 border border-amber-200/90 shadow-xl shadow-amber-900/5 space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-5 gap-4">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Vận {result.period} (2024 - 2043: Cửu Tử Ly Hỏa)
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  {result.title || 'Lá Số Phong Thủy Nhà Ở'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Gia Chủ: <b className="text-slate-900">{result.ownerName}</b> • Xây dựng/Nhập trạch: <b className="text-slate-900">{result.buildingYear || 'Vận 9'}</b>
                </p>
              </div>

              {/* Major Formation Badge */}
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase">TỨ ĐẠI CÁCH CỤC</span>
                <div className="text-base sm:text-lg font-black text-amber-800">
                  {result.analysisSnapshot.majorPatternName}
                </div>
                <div className="text-xs text-slate-600 max-w-xs sm:ml-auto">
                  {result.analysisSnapshot.majorPatternDescription}
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
                <div className="text-[10px] sm:text-xs font-bold text-amber-700">TỌA NHÀ (HẬU TRẠCH)</div>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                  Sơn {result.sittingMountain} ({result.sittingPalace})
                </div>
                <div className="text-[11px] text-slate-500">{result.sittingDegree.toFixed(1)}°</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
                <div className="text-[10px] sm:text-xs font-bold text-amber-700">HƯỚNG NHÀ (MINH ĐƯỜNG)</div>
                <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5 truncate">
                  Sơn {result.facingMountain} ({result.facingPalace})
                </div>
                <div className="text-[11px] text-slate-500">{result.facingDegree.toFixed(1)}°</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
                <div className="text-[10px] sm:text-xs font-bold text-amber-700">PHÂN LOẠI TINH BÀN</div>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 truncate">
                  {result.chartType === 'CHINH_HUONG' ? 'Chính Quái Bàn' : result.chartType === 'KIEM_HUONG' ? 'Thế Quái Bàn' : 'Không Vong Bàn'}
                </div>
                <div className="text-[11px] text-slate-500">Lệch {result.deviationDegree}°</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
                <div className="text-[10px] sm:text-xs font-bold text-amber-700">ĐẶC TÍNH KHÍ TRƯỜNG</div>
                <div className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 truncate">
                  {result.isSubstitution ? 'Kiêm Hướng (Thế Quái)' : 'Thuần Khí Chính Hướng'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {result.substitutionInfo ? 'Áp dụng ca quyết' : 'Đắc nguyên thần khí'}
                </div>
              </div>
            </div>
          </div>

          {/* SƠ ĐỒ 2: MỆNH TRẠCH TƯƠNG PHỐI (YÊU CẦU 3 & 5: DỄ NHÌN, SANG TRỌNG) */}
          {ownerProfile && ownerProfile.cungPhi && (
            <div id="section-menhtrach" className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 rounded-3xl p-4 sm:p-8 border-2 border-amber-300 shadow-xl shadow-amber-900/5 space-y-5 sm:space-y-6">
              <div className="border-b border-amber-200/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-amber-800 uppercase tracking-wider bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                    Bát Trạch Minh Kính & Huyền Không Đồng Quy
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                    Sơ Đồ Mệnh Trạch Tương Phối
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Thẩm định mức độ tương sinh tương hợp giữa Bản Mệnh Gia Chủ và Cung Tọa Trạch Đất
                  </p>
                </div>

                {/* Compatibility Verdict Badge */}
                <div className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-black border shadow-sm self-start sm:self-auto ${
                  ownerProfile.isMenhTrachMatch 
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {ownerProfile.isMenhTrachMatch ? '⭐ HỢP TRẠCH (ĐẠI CÁT)' : '⚡ NGHỊCH TRẠCH (CẦN HÓA GIẢI)'}
                </div>
              </div>

              {/* Side-by-side comparison: Gia Chủ vs Trạch Đất */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Card: Bản Mệnh Gia Chủ */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm border-b border-amber-100 pb-2">
                    <User className="w-4 h-4 text-amber-600" />
                    Bản Mệnh Gia Chủ ({result.ownerName})
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Năm sinh:</span>
                      <span className="font-bold text-slate-900">{ownerProfile.solarYear || 'Chưa rõ'} ({ownerProfile.genderLabel})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cung Phi Bát Trạch:</span>
                      <span className="font-black text-amber-900 text-sm">Cung {ownerProfile.cungPhi} (Hành {ownerProfile.menhNguHanh})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nhóm Bản Mệnh:</span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{ownerProfile.menhTrachGroup}</span>
                    </div>
                  </div>
                </div>

                {/* Right Card: Trạch Đất Ngôi Nhà */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm border-b border-amber-100 pb-2">
                    <Building className="w-4 h-4 text-amber-600" />
                    Trạch Đất Ngôi Nhà
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tọa Hướng:</span>
                      <span className="font-bold text-slate-900">Tọa {result.sittingMountain} ({result.sittingPalace}) Hướng {result.facingMountain} ({result.facingPalace})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trạch Quái Ngôi Nhà:</span>
                      <span className="font-black text-amber-900 text-sm">{result.sittingPalace} Trạch</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nhóm Trạch Đất:</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{ownerProfile.houseTrachGroup}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Summary Advice */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-slate-800 leading-relaxed flex items-start gap-2.5">
                <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-950 mb-0.5">Lời Khuyên Chiến Lược Bát Trạch & Huyền Không:</div>
                  <p>{ownerProfile.menhTrachSummary}</p>
                </div>
              </div>
            </div>
          )}

          {/* SƠ ĐỒ 3: MA TRẬN 3X3 CỬU CUNG LẠC THƯ (YÊU CẦU 5) */}
          <div id="section-grid" className="bg-white rounded-3xl p-3.5 sm:p-8 border border-amber-200/90 shadow-xl shadow-amber-900/5 space-y-5 sm:space-y-6">
            <div className="border-b border-amber-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  Cửu Cung Phi Tinh Bàn
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Ma Trận Tinh Bàn 9 Cung
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 font-bold text-indigo-700">
                  <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" /> Sơn Tinh (Đinh/Sức Khỏe)
                </span>
                <span className="flex items-center gap-1 font-bold text-rose-700">
                  <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" /> Hướng Tinh (Tài Lộc)
                </span>
              </div>
            </div>

            {/* Grid component */}
            <FeiXingGrid
              grid={result.analysisSnapshot.grid}
              facingPalace={result.facingPalace}
              sittingPalace={result.sittingPalace}
              facingMountain={result.facingMountain}
              sittingMountain={result.sittingMountain}
              ownerProfile={ownerProfile}
            />
          </div>

          {/* SƠ ĐỒ 4: THÀNH MÔN QUYẾT & BỐ CỤC ĐẶC BIỆT */}
          {result.analysisSnapshot.castleGate && (
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-amber-200/90 shadow-xl shadow-amber-900/5 space-y-4">
              <div className="border-b border-amber-100 pb-3">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-600" />
                  Thành Môn Quyết (Khẩu Khí Nạp Tài Phụ)
                </h3>
                <p className="text-xs text-slate-500">
                  Phương vị mở cổng, cửa phụ hoặc đường nước phụ trợ giúp đón vượng tài tối đa cho căn nhà.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                  <div className="font-bold text-amber-900 mb-1">Cánh Trái:</div>
                  <p className="text-slate-700">{result.analysisSnapshot.castleGate.left?.description || 'Không khả dụng'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200">
                  <div className="font-bold text-amber-900 mb-1">Cánh Phải:</div>
                  <p className="text-slate-700">{result.analysisSnapshot.castleGate.right?.description || 'Không khả dụng'}</p>
                </div>
              </div>
            </div>
          )}

          {/* AI INTERPRETATION BANNER (KHI CHƯA LUẬN GIẢI) */}
          {!interpretation && !isInterpreting && (
            <div className="rounded-3xl p-8 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center justify-center sm:justify-start gap-1.5">
                  <Sparkles className="w-4 h-4" /> Trí Tuệ Nhân Tạo Cao Cấp
                </span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Luận Giải Thẩm Định Phong Thủy Toàn Diện
                </h3>
                <p className="text-sm text-amber-100 max-w-xl">
                  Bố trí chuẩn xác vị trí Bếp Táo, Ban Thờ, Phòng Ngủ Master, Bàn Làm Việc, Điểm đặt Nước kích tài và pháp bảo hóa giải đại sát.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsUpgradeModal(false);
                  setShowTierModal(true);
                }}
                className="px-8 py-4 rounded-2xl bg-white text-amber-800 hover:bg-amber-50 font-black text-sm sm:text-base shadow-xl hover:shadow-2xl transition transform active:scale-95 whitespace-nowrap"
              >
                LUẬN GIẢI NGAY
              </button>
            </div>
          )}

          {/* AI INTERPRETATION STREAM DISPLAY AREA */}
          {(interpretation || isInterpreting) && (
            <div id="section-interpretation" className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-amber-300 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-100 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                      Cẩm Nang Luận Giải Huyền Không & Bát Trạch
                      {currentInterpretationMode === 'vip' && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-black flex items-center gap-1">
                          <Crown className="w-3 h-3 fill-current" /> VIP
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Tư vấn bài trí không gian sống, an gia thịnh vượng chu kỳ Vận 9
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Nút Mục Lục Luận Giải nhanh ở tiêu đề (Yêu Cầu 2) */}
                  <TableOfContentsTrigger theme="feixing" />

                  {isInterpreting && (
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 animate-pulse">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      Đang truyền luồng luận giải từ Đại Sư...
                    </div>
                  )}
                </div>
              </div>

              {/* Structured Chapters via SectionRenderer (Phong cách chương hồi sang trọng như các phân hệ khác) */}
              <SectionRenderer
                sections={parseMarkdownSections(typeof interpretation === 'string' ? interpretation : (interpretation?.content || rawAiContent || ''), 'feixing')}
                pageSections={FEIXING_PAGE_SECTIONS}
                theme="feixing"
                rawText={typeof interpretation === 'string' ? interpretation : (interpretation?.content || rawAiContent || '')}
                isChatOpen={isChatOpen}
                onConsultSection={() => {
                  setIsChatOpen(true);
                }}
              />
            </div>
          )}

          {/* User Feedback & Star Rating (Yêu Cầu 6: Thêm bình luận nhận xét) */}
          <div id="section-rating" className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100 pb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Đánh giá chất lượng tinh bàn & luận giải
                </h4>
                <p className="text-xs text-slate-500">
                  Ý kiến nhận xét của bạn giúp hệ thống hoàn thiện thuật toán phong thủy tốt hơn.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-slate-300 hover:text-amber-500 focus:outline-none transition active:scale-95"
                    title={`Đánh giá ${star} sao`}
                  >
                    <Star
                      className={`w-7 h-7 transition ${
                        star <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {justRated ? (
              <div className="text-center py-3 text-emerald-700 font-bold bg-emerald-50 rounded-2xl border border-emerald-200">
                Xin chân thành cảm ơn ý kiến đánh giá & nhận xét của bạn!
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-3">
                <textarea
                  placeholder="Ý kiến nhận xét hoặc lưu ý thực tế của bạn về ngôi nhà..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-3 bg-amber-50/30 border border-amber-200 rounded-2xl text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition placeholder:text-slate-400 focus:outline-none"
                  rows={2}
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!rating || isRatingSubmitting}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-[0.98] text-sm"
                  >
                    {isRatingSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá & Nhận Xét'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Nút Lập Tinh Bàn Mới Ở Cuối Trang (Yêu Cầu 6: Cho nút lập tinh bàn mới xuống dưới cùng) */}
          <div className="flex justify-center pt-2 pb-6">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-amber-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-100 hover:from-amber-200 hover:to-amber-300 border border-amber-300 shadow-md hover:shadow-lg transition transform active:scale-95 text-sm uppercase tracking-wider"
            >
              <RotateCcw className="w-5 h-5 text-amber-800" />
              Lập Tinh Bàn Phong Thủy Mới
            </button>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON (CHỈ HIỂN THỊ KHI ĐÃ CÓ KẾT QUẢ RESULT - FIX LỖI HÌNH 5) */}
      {result && (
        !interpretation ? (
          <button
            onClick={() => {
              setIsUpgradeModal(false);
              setShowTierModal(true);
            }}
            disabled={isInterpreting}
            className={`fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2.5 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 font-extrabold border ${
              isInterpreting
                ? 'bg-amber-100 border-amber-200 text-amber-600 cursor-not-allowed scale-95'
                : 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white border-amber-400 shadow-amber-900/30 hover:scale-105 active:scale-95 text-xs sm:text-sm tracking-wider uppercase ring-4 ring-amber-500/20'
            }`}
          >
            {isInterpreting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang Luận Giải...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 animate-pulse text-amber-200" />
                <span>Thầy Luận Giải Phong Thủy</span>
              </>
            )}
          </button>
        ) : !isChatOpen && (
          <div className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex flex-col items-end gap-2.5">
            {/* Nút "Nâng Cấp Luận Giải" nếu đang ở gói Standard */}
            {currentInterpretationMode !== 'vip' && (
              <button
                onClick={() => {
                  setIsUpgradeModal(true);
                  setShowTierModal(true);
                }}
                disabled={isInterpreting}
                className="flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white border-amber-300 shadow-amber-500/30 hover:scale-105 active:scale-95 text-xs sm:text-sm uppercase tracking-wider ring-4 ring-amber-500/20"
              >
                <Crown className="w-4 h-4 fill-current animate-pulse text-amber-200" />
                <span>Nâng Cấp Luận Giải VIP</span>
              </button>
            )}

            {/* Nút "Mục lục luận giải" ở cụm nút nổi (Yêu Cầu 2) */}
            <TableOfContentsTrigger theme="feixing" />

            {/* Nút "Hỏi Thêm Thầy" */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 text-white border-slate-700 shadow-slate-900/40 hover:scale-105 active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
            >
              <MessageCircle className="w-4 h-4 text-amber-400" />
              <span>Hỏi Thêm Thầy Phong Thủy</span>
            </button>
          </div>
        )
      )}

      {/* Interpretation Tier Selection Modal */}
      <InterpretationTierModal
        isOpen={showTierModal}
        onClose={() => {
          setShowTierModal(false);
          setIsUpgradeModal(false);
        }}
        onConfirm={handleInterpretTier}
        userCredits={activeUser?.credits ?? 0}
        isAdmin={activeUser?.role === 'admin'}
        system="feixing"
        isUpgrade={isUpgradeModal}
        recordData={result}
      />

      {/* Follow-up Chat Widget */}
      {result && recordId && (
        <AiChatWidget
          system="feixing"
          recordId={recordId}
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(prev => !prev)}
          title="Tư Vấn Phong Thủy Nhà Ở"
        />
      )}

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        system="feixing"
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
