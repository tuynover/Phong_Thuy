import React, { useState, useEffect, useContext, useRef } from 'react';
import { Calendar, Clock, User, Sparkles, MessageCircle, RefreshCw, Star, ShieldAlert, ScrollText, ArrowUp, ArrowDown, ChevronDown, HelpCircle } from 'lucide-react';
import { createZiweiChart, getZiweiRecord, rateZiwei, getInterpretationStreamUrl, updateBaziInfo, togglePublicCalculation } from '../services/api';
import ChartRenderer from './ChartRenderer';
import FloatingNotificationToast from './FloatingNotificationToast';
import SectionRenderer from './SectionRenderer';
import AiChatWidget from './AiChatWidget';
import UpdateBaziModal from './UpdateBaziModal';
import { AuthContext } from '../context/AuthContext';
import { parseMarkdownSections } from '../utils/markdownParser';
import { validateInputDate, getMaxDaysInMonth } from '../utils/dateValidator';
import FloatingErrorToast from './FloatingErrorToast';
import CustomSelect from './CustomSelect';
import ZiweiInput from './ZiweiInput';

// 12 Can Chi Giờ Sinh trong Tử Vi
const LUNAR_HOURS = [
  { index: 0, name: "Tý (23:00 - 00:59)" },
  { index: 1, name: "Sửu (01:00 - 02:59)" },
  { index: 2, name: "Dần (03:00 - 04:59)" },
  { index: 3, name: "Mão (05:00 - 06:59)" },
  { index: 4, name: "Thìn (07:00 - 08:59)" },
  { index: 5, name: "Tỵ (09:00 - 10:59)" },
  { index: 6, name: "Ngọ (11:00 - 12:59)" },
  { index: 7, name: "Mùi (13:00 - 14:59)" },
  { index: 8, name: "Thân (15:00 - 16:59)" },
  { index: 9, name: "Dậu (17:00 - 18:59)" },
  { index: 10, name: "Tuất (19:00 - 20:59)" },
  { index: 11, name: "Hợi (21:00 - 22:59)" }
];

const ZiweiBoard = ({ user, onRequireLogin, historicalRecordId, onCalculationComplete, onResultChange, autoSubmitInfo, onClearAutoSubmit, onInvalidateHistory }) => {
  const { user: ctxUser, setUser, token } = useContext(AuthContext);
  const activeUser = ctxUser || user;

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const years = Array.from({ length: 97 }, (_, i) => String(2026 - i));
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [gender, setGender] = useState('Nam');
  const [name, setName] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('Đang lập mệnh bàn...');
  
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem('tuViResult');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // AI Interpretation States
  const [interpretation, setInterpretation] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState('');

  // Auto-clamp Day when Month or Year changes (e.g. 29/02/2023 -> automatically pushes to 28)
  useEffect(() => {
    if (day && month && year) {
      const maxDays = getMaxDaysInMonth(month, year);
      const dNum = parseInt(day, 10);
      if (!isNaN(dNum) && dNum > maxDays) {
        setDay(String(maxDays));
      }
    }
  }, [month, year, day]);

  // Real-time dynamic validation for ZiweiBoard
  useEffect(() => {
    if (day || month || year) {
      const val = validateInputDate(day, month, year);
      if (!val.isValid) {
        setError(val.message);
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  }, [day, month, year]);

  // Đánh giá sao
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [justRated, setJustRated] = useState(false);

  const prevIdRef = useRef(null);

  useEffect(() => {
    if (result) {
      localStorage.setItem('tuViResult', JSON.stringify(result));
      const currentId = result._id || result.id;
      if (currentId !== prevIdRef.current) {
        setJustRated(false);
        prevIdRef.current = currentId;
      }
      if (result.aiInterpretation && result.aiInterpretation.content) {
        setInterpretation(result.aiInterpretation.content);
      } else {
        setInterpretation('');
      }
      setRating(result.rating || 0);
      setFeedback(result.feedback || '');
      if (onResultChange) onResultChange(true);
    } else {
      localStorage.removeItem('tuViResult');
      setInterpretation('');
      setRating(0);
      setFeedback('');
      setJustRated(false);
      if (onResultChange) onResultChange(false);
    }
  }, [result, onResultChange]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const [isPublicState, setIsPublicState] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    setIsPublicState(result?.isPublic || false);
  }, [result]);

  const handleTogglePublic = async () => {
    const resolvedId = result?._id || result?.id;
    if (!resolvedId) return;
    try {
      const newStatus = !isPublicState;
      await togglePublicCalculation('ziwei', resolvedId, newStatus);
      setIsPublicState(newStatus);
      setToastMsg(`Đã ${newStatus ? 'bật' : 'tắt'} chia sẻ công khai lá số Tử Vi!`);
      if (onInvalidateHistory) onInvalidateHistory();
      setResult(prev => prev ? { ...prev, isPublic: newStatus } : null);
    } catch (err) {
      console.error('Lỗi khi đổi trạng thái công khai Ziwei:', err);
      setToastMsg('Không thể thay đổi trạng thái chia sẻ. Vui lòng thử lại sau.');
    }
  };

  // Xem lá số của bản thân
  const [isUpdateBaziOpen, setIsUpdateBaziOpen] = useState(false);

  const getZiweiHourIndex = (hour) => {
    if (hour >= 23 || hour < 1) return 0;
    return Math.floor((hour - 1) / 2) + 1;
  };

  const handleZiweiComplete = async (dateStr, hourStr, genderStr, nameStr, calendarMode = 'solar', isLeap = false) => {
    setError(null);
    setLoading(true);
    setResult(null);
    setJustRated(false);
    setRating(0);
    setFeedback('');

    const parsedHour = parseInt(hourStr) || 0;
    const hourIndexConverted = getZiweiHourIndex(parsedHour);
    const uid = activeUser ? activeUser.id || activeUser._id : 'guest';

    try {
      setLoadingStep('Đang lập mệnh bàn Tử Vi...');
      setProgress(50);
      const chartRes = await createZiweiChart(dateStr, hourIndexConverted, genderStr, uid, nameStr, { calendarMode, isLeap });
      const record = chartRes.data;
      setResult(record);
      setProgress(100);
      setLoading(false);
      if (onCalculationComplete) onCalculationComplete();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Lỗi xảy ra trong quá trình lập lá số.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoSubmitInfo && autoSubmitInfo.dateStr) {
      handleZiweiComplete(autoSubmitInfo.dateStr, autoSubmitInfo.hourStr, autoSubmitInfo.genderStr, autoSubmitInfo.nameStr || activeUser?.name, autoSubmitInfo.calendarMode || 'solar', autoSubmitInfo.isLeap || false);
      if (onClearAutoSubmit) onClearAutoSubmit();
    }
  }, [autoSubmitInfo]);

  const handleViewOwnZiwei = async () => {
    if (!activeUser || !activeUser.baziInfo || !activeUser.baziInfo.day || !activeUser.baziInfo.month || !activeUser.baziInfo.year) {
      if (!activeUser) {
        onRequireLogin();
      } else {
        setIsUpdateBaziOpen(true);
      }
      return;
    }
    const { day, month, year, hour } = activeUser.baziInfo;
    const genderStr = activeUser.gender === 0 ? "Nữ" : "Nam";
    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let h = hour !== undefined ? hour : 0;
    const parsedHour = parseInt(h) || 0;
    const hourIndexConverted = getZiweiHourIndex(parsedHour);

    if (activeUser.baziInfo.ownZiweiRecordId) {
      setLoading(true);
      setError('');
      try {
        const res = await getZiweiRecord(activeUser.baziInfo.ownZiweiRecordId);
        const record = res.data;
        if (record && record.inputInfo && 
            record.inputInfo.date === formattedDate && 
            record.inputInfo.hour === hourIndexConverted && 
            record.inputInfo.gender === genderStr &&
            !record.isDeleted) {
          setResult(record);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi tải lá số Tử Vi bản thân:", err);
      }
    }

    setError(null);
    setLoading(true);
    setResult(null);
    setJustRated(false);
    setRating(0);
    setFeedback('');

    const uid = activeUser.id || activeUser._id;
    try {
      setLoadingStep('Đang lập mệnh bàn Tử Vi...');
      setProgress(50);
      const chartRes = await createZiweiChart(formattedDate, hourIndexConverted, genderStr, uid, activeUser.name);
      const record = chartRes.data;
      setResult(record);
      setProgress(100);
      setLoading(false);
      if (onCalculationComplete) onCalculationComplete();

      const newRecordId = record._id || record.id;
      if (newRecordId) {
        const updateRes = await updateBaziInfo(
          uid, 
          day, month, year, hour, activeUser.baziInfo.minute || 0,
          activeUser.baziInfo.ownBaziRecordId,
          newRecordId // pass ownZiweiRecordId
        );
        if (updateRes.data && updateRes.data.user) {
          setUser(updateRes.data.user);
          localStorage.setItem('user', JSON.stringify(updateRes.data.user));
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Lỗi xảy ra trong quá trình lập lá số.');
      setLoading(false);
    }
  };

  // Nếu tải từ lịch sử (historicalRecordId)
  useEffect(() => {
    if (historicalRecordId) {
      loadHistoricalRecord(historicalRecordId);
    }
  }, [historicalRecordId]);

  const loadHistoricalRecord = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await getZiweiRecord(id);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể nạp lá số từ lịch sử.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!day || !month || !year) {
      setError('Vui lòng chọn đầy đủ ngày, tháng và năm sinh.');
      return;
    }

    const val = validateInputDate(day, month, year);
    if (!val.isValid) {
      setError(val.message);
      return;
    }

    setLoading(true);
    setProgress(0);
    setResult(null);
    setJustRated(false);
    setRating(0);
    setFeedback('');

    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const uid = activeUser?.id || activeUser?._id || 'guest';

    try {
      setLoadingStep('Đang lập mệnh bàn Tử Vi...');
      setProgress(50);
      const parsedH = parseInt(hour, 10) || 0;
      const calcHourIndex = getZiweiHourIndex(parsedH);
      const chartRes = await createZiweiChart(formattedDate, calcHourIndex, gender, uid, name);
      const record = chartRes.data;
      setResult(record);
      setProgress(100);
      setLoading(false);
      if (onCalculationComplete) onCalculationComplete();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Lỗi xảy ra trong quá trình lập lá số.');
      setLoading(false);
    }
  };

  const decrementCreditLocally = () => {
    if (activeUser && activeUser.role !== 'admin' && activeUser.role !== 'co-admin') {
      setUser(prev => {
        if (!prev) return prev;
        const updated = { ...prev, credits: Math.max(0, prev.credits - 1) };
        localStorage.setItem('user', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleTriggerInterpretation = async () => {
    if (!activeUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!result || !result._id) return;
    setIsInterpreting(true);
    setError('');
    setInterpretation('');

    const abortCtrl = new AbortController();
    setAbortController(abortCtrl);

    let currentText = "";
    try {
      const url = getInterpretationStreamUrl('tu_vi', result._id);
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: activeUser.id || activeUser._id || 'guest' }),
        signal: abortCtrl.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi kết nối từ server (HTTP ${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
                if (parsed.chunk) {
                  const isFirstChunk = !currentText;
                  currentText += parsed.chunk;
                  setInterpretation(currentText);
                  if (isFirstChunk) {
                    setTimeout(() => {
                      const element = document.getElementById('ziwei-interpretation-section');
                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }
                }
              } catch (e) {
                if (e.message.includes('bảo trì') || e.message.includes('SAFETY') || e.message.includes('luận giải') || e.message.includes('quá tải')) {
                  throw e;
                }
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("Interpretation stream aborted.");
      } else {
        console.error(err);
        setError(err.message || "Hệ thống luận giải đang bận hoặc gặp lỗi. Vui lòng thử lại sau.");
      }
    } finally {
      setIsInterpreting(false);
      setAbortController(null);

      if (currentText) {
        setResult(prev => ({
          ...prev,
          aiInterpretation: {
            ...prev.aiInterpretation,
            content: currentText
          }
        }));
        decrementCreditLocally();
      }
    }
  };

  // Auto-resume polling if the loaded record is currently generating AI interpretation
  useEffect(() => {
    if (result && result._id && result.isGeneratingInterpretation && !isInterpreting && activeUser) {
      handleTriggerInterpretation();
    }
  }, [result, isInterpreting, activeUser]);

  const handleAILuanGiaiClick = () => {
    if (!activeUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    setShowConfirmModal(true);
  };

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!result?._id) return;
    try {
      await rateZiwei(result._id, rating, feedback);
      setJustRated(true);
      if (onInvalidateHistory) onInvalidateHistory();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <FloatingErrorToast message={error} onClose={() => setError('')} />
      <div className="w-full max-w-6xl mx-auto px-4 pb-24 font-sans">
      
      {/* 1. DEDICATED ZIWEI INPUT COMPONENT */}
      {!result && !loading && (
        <ZiweiInput 
          onSubmit={({ day, month, year, hour, minute, gender, name, calendarMode, isLeap }) => {
            setDay(day);
            setMonth(month);
            setYear(year);
            setHour(hour);
            setMinute(minute);
            setGender(gender);
            setName(name);
            handleZiweiComplete(
              `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
              hour,
              gender,
              name,
              calendarMode,
              isLeap
            );
          }}
          activeUser={activeUser}
          onRequireLogin={onRequireLogin}
          handleViewOwnZiwei={handleViewOwnZiwei}
        />
      )}

      {/* 2. PROGRESS QUEUE LOADING BAR */}
      {loading && (
        <div className="text-center py-20 max-w-md mx-auto animate-in fade-in duration-300">
          <div className="relative inline-block mb-8">
            <div className="w-20 h-20 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-600">
              <RefreshCw size={24} className="animate-pulse" />
            </div>
          </div>
          
          <h4 className="text-xl font-extrabold text-purple-950 mb-2">{loadingStep}</h4>
          <p className="text-slate-400 text-xs tracking-wider uppercase font-bold mb-6">Đang tải: {progress}%</p>
          
          {/* Purple progress bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div 
              style={{ width: `${progress}%` }} 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-500 rounded-full"
            ></div>
          </div>
        </div>
      )}

      {/* ERROR FRAME */}
      {error && (
        <div className="max-w-xl mx-auto mt-6 bg-rose-50 border-l-4 border-rose-500 p-5 rounded-r-2xl flex items-start gap-3.5 shadow-md">
          <ShieldAlert className="text-rose-500 shrink-0 mt-0.5" size={22} />
          <div>
            <h4 className="font-extrabold text-rose-950 text-sm md:text-base">Có lỗi xảy ra</h4>
            <p className="text-rose-800 text-xs md:text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
      {/* 3. COMPLETED RESULT BOARD PANEL */}
      {result && !loading && (
        <div className="space-y-12 animate-in fade-in duration-500">
          {/* Công tắc chia sẻ công khai lá số Tử Vi */}
          {(!window.location.pathname.includes('/record/') || (activeUser && (result?.userId === activeUser.id || result?.userId === activeUser._id))) && (
            <div className="max-w-4xl mx-auto p-5 bg-purple-50/40 border border-purple-100 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-sm mb-6">
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-slate-800">Chia sẻ công khai lá số Tử Vi</span>
                <span className="text-[11px] text-gray-500 font-medium">Bật công khai để cho phép người khác truy cập xem bản đồ mệnh bàn này</span>
              </div>
              <div className="flex items-center gap-3">
                {isPublicState && (
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/ziwei/record/${result._id || result.id}`;
                      navigator.clipboard.writeText(shareUrl);
                      setToastMsg('Đã sao chép liên kết chia sẻ công khai lá số Tử Vi!');
                    }}
                    className="px-3 py-1 bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Sao chép liên kết
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTogglePublic}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPublicState ? 'bg-purple-700' : 'bg-gray-300'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublicState ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Ép Vẽ lá số 12 cung truyền thống thông qua Registry ChartRenderer */}
          <ChartRenderer 
            system={result.system || 'ziwei'} 
            chartData={{
              ...result.chartData,
              name: result.name || result.inputInfo?.name,
              solarDate: result.chartData?.solarDate || result.inputInfo?.date
            }} 
          />

          {/* Render các Accordion phân tích AI thông qua SectionRenderer */}
          {(interpretation || result.aiInterpretation?.content || (result.aiInterpretation?.sections?.length > 0)) && (
            <div id="ziwei-interpretation-section" className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-6 ml-1">
                <Sparkles className="text-purple-500" size={20} />
                <h2 className="font-extrabold text-slate-800 text-lg md:text-xl">Luận Giải Chuyên Sâu Cát Hung</h2>
              </div>
              <SectionRenderer 
                sections={
                  interpretation 
                    ? parseMarkdownSections(interpretation, 'tu_vi') 
                    : (result.aiInterpretation?.content 
                        ? parseMarkdownSections(result.aiInterpretation.content, 'tu_vi')
                        : result.aiInterpretation?.sections || [])
                } 
                theme="tu_vi"
              />
            </div>
          )}

          {/* ĐÁNH GIÁ PHẢN HỒI */}
          {(interpretation || result.aiInterpretation?.content || result.aiInterpretation?.sections?.length > 0) && (!result.rating || justRated) && (
            <div className="mt-12 bg-white/60 border border-purple-100 p-6 rounded-3xl backdrop-blur-md max-w-xl mx-auto shadow-md">
              <h4 className="font-extrabold text-slate-800 text-center mb-2">Đánh Giá Luận Giải Thầy Tử Vi</h4>
              <p className="text-center text-xs text-slate-400 mb-6">Nhận xét của bạn sẽ giúp bổ sung tri thức và cải thiện chất lượng của AI tốt hơn.</p>

              {justRated ? (
                <div className="text-center py-4 text-purple-600 font-bold animate-in zoom-in-95">
                  Xin chân thành cảm ơn ý kiến đánh giá của bạn!
                </div>
              ) : (
                <form onSubmit={handleRatingSubmit} className="space-y-4">
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform duration-100 active:scale-95"
                      >
                        <Star
                          size={28}
                          className={`stroke-2 cursor-pointer ${
                            star <= rating ? 'fill-amber-400 stroke-amber-500' : 'text-slate-200 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Ý kiến nhận xét hoặc lưu ý thực tế của bạn..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all font-bold placeholder:text-slate-300"
                    rows={2}
                  />
                  <button
                    type="submit"
                    disabled={!rating}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-2xl shadow-md disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-[0.98]"
                  >
                    Gửi Nhận Xét
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Gieo lại quẻ/Luận lá số mới */}
          <div className="text-center">
            <button
              onClick={() => {
                setResult(null);
                setTimeout(() => {
                  const element = document.getElementById('ziwei-input-gender');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }, 50);
              }}
              className="px-10 py-4 bg-white text-purple-900 border-2 border-purple-200 rounded-2xl shadow-md hover:bg-purple-50 hover:border-purple-300 font-extrabold text-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Luận Giải Lá Số Khác
            </button>
          </div>
        </div>
      )}

      {/* FLOATING ACTION BUTTON */}
      {result && !loading && (
        <>
          {!(interpretation || result.aiInterpretation?.content || result.aiInterpretation?.sections?.length > 0) ? (
            <button
              onClick={handleAILuanGiaiClick}
              disabled={isInterpreting}
              className={`fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2.5 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 font-extrabold border ${isInterpreting ? 'bg-purple-100 border-purple-200 text-purple-500 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-950 hover:from-purple-900 hover:to-indigo-950 text-amber-300 border-amber-400/40 shadow-purple-950/30 hover:scale-105 active:scale-95 text-xs sm:text-sm tracking-wider uppercase ring-4 ring-purple-500/20'}`}
            >
              {isInterpreting ? (
                <>
                  <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-amber-300">Thầy giải nghĩa...</span>
                </>
              ) : (
                <>
                  <ScrollText className="animate-pulse text-amber-400" size={20} />
                  <span className="hidden sm:inline">Thầy Luận Giải Tử Vi</span>
                </>
              )}
            </button>
          ) : !isChatOpen && activeUser && (
            <button
              onClick={() => setIsChatOpen(true)}
              className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2.5 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-950 hover:from-purple-900 hover:to-indigo-950 text-amber-300 border-amber-400/40 shadow-purple-950/30 hover:scale-105 active:scale-95 text-xs sm:text-sm tracking-wider uppercase ring-4 ring-purple-500/20"
            >
              <MessageCircle className="animate-bounce text-amber-400 shrink-0" size={18} />
              <span>Hỏi Thêm Thầy</span>
            </button>
          )}

          {/* Unified chat widget với type="tu_vi" */}
          {(interpretation || result.aiInterpretation?.content || result.aiInterpretation?.sections?.length > 0) && activeUser && (
            <AiChatWidget
              type="tu_vi"
              recordId={result._id}
              userId={activeUser?.id || activeUser?._id}
              isOpen={isChatOpen}
              setIsOpen={setIsChatOpen}
            />
          )}
        </>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex justify-center items-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-8 border-t-purple-800">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-800 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <h3 className="text-xl font-bold text-purple-950 mb-3 flex items-center gap-2">
              <ScrollText className="text-purple-850" size={24} />
              Thầy Luận Giải Tử Vi
            </h3>
            {(() => {
              const isStaff = activeUser?.role === 'admin' || activeUser?.role === 'co-admin';
              const hasCredits = isStaff || (activeUser?.credits > 0);

              if (isStaff) {
                return (
                  <>
                    <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                      Tài khoản quản trị viên có quyền luận giải không giới hạn. Bạn có chắc chắn muốn khởi động luận giải chi tiết lá số Tử Vi này không?
                    </p>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setShowConfirmModal(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button 
                        onClick={() => {
                          setShowConfirmModal(false);
                          handleTriggerInterpretation();
                        }}
                        className="px-5 py-2 bg-purple-800 text-white rounded-xl hover:bg-purple-900 font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                      >
                        Bắt đầu luận giải
                      </button>
                    </div>
                  </>
                );
              } else if (hasCredits) {
                return (
                  <>
                    <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                      Bạn còn <span className="font-extrabold text-purple-800">{activeUser?.credits}</span> lượt sử dụng. Mỗi lần luận giải AI sẽ tiêu thụ <span className="font-bold">1 credit</span>. Bạn có chắc chắn muốn khởi động luận giải chi tiết lá số Tử Vi này không?
                    </p>
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setShowConfirmModal(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors"
                      >
                        Hủy bỏ
                      </button>
                      <button 
                        onClick={() => {
                          setShowConfirmModal(false);
                          handleTriggerInterpretation();
                        }}
                        className="px-5 py-2 bg-purple-800 text-white rounded-xl hover:bg-purple-900 font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                      >
                        Bắt đầu luận giải
                      </button>
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    <p className="text-red-700 bg-red-50 border border-red-100 p-3.5 rounded-xl mb-6 leading-relaxed text-xs sm:text-sm font-medium">
                      ⚠️ Bạn đã hết lượt luận giải (0 credits). Mỗi ngày hệ thống sẽ tự động tặng bạn +1 credit. Hãy liên hệ Ban Quản Trị hoặc nâng cấp để tiếp tục sử dụng AI luận giải chi tiết Tử Vi.
                    </p>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => setShowConfirmModal(false)}
                        className="px-5 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 font-semibold text-sm transition-colors shadow-md"
                      >
                        Đóng
                      </button>
                    </div>
                  </>
                );
              }
            })()}
          </div>
        </div>
      )}

      {/* Modal Cập nhật thông tin sinh thần Bát tự / Tử vi dùng chung */}
      <UpdateBaziModal 
        isOpen={isUpdateBaziOpen} 
        onClose={() => setIsUpdateBaziOpen(false)} 
        onSuccess={async (updatedUser) => {
          const { day: d, month: m, year: y, hour: h } = updatedUser.baziInfo;
          const formattedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const genderStr = updatedUser.gender === 0 ? 'Nữ' : 'Nam';
          await handleZiweiComplete(formattedDate, String(h), genderStr, updatedUser.name);
        }} 
      />

      {toastMsg && <FloatingNotificationToast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
    </>
  );
};

export default ZiweiBoard;
