import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, User, Sparkles, MessageCircle, RefreshCw, Star, ShieldAlert, ScrollText } from 'lucide-react';
import { createTuViChart, interpretTuVi, checkTuViJob, getTuViRecord, rateTuVi } from '../services/api';
import ChartRenderer from './ChartRenderer';
import SectionRenderer from './SectionRenderer';
import AiChatWidget from './AiChatWidget';
import UpdateBaziModal from './UpdateBaziModal';
import { AuthContext } from '../context/AuthContext';

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

const TuViBoard = ({ user, onRequireLogin, historicalRecordId }) => {
  const { user: ctxUser, setUser } = useContext(AuthContext);
  const activeUser = ctxUser || user;
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hourIndex, setHourIndex] = useState(0);
  const [gender, setGender] = useState('Nam');
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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [error, setError] = useState('');

  // Đánh giá sao
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [rated, setRated] = useState(false);

  useEffect(() => {
    if (result) {
      localStorage.setItem('tuViResult', JSON.stringify(result));
    } else {
      localStorage.removeItem('tuViResult');
    }
  }, [result]);

  // Xem lá số của bản thân
  const [isUpdateBaziOpen, setIsUpdateBaziOpen] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const getTuViHourIndex = (hour) => {
    if (hour >= 23 || hour < 1) return 0;
    return Math.floor((hour - 1) / 2) + 1;
  };

  const handleTuViComplete = async (dateStr, hourStr, genderStr) => {
    setLoading(true);
    setProgress(0);
    setError('');
    setResult(null);
    setRated(false);
    setRating(0);
    setFeedback('');

    const parsedHour = parseInt(hourStr) || 0;
    const hourIndexConverted = getTuViHourIndex(parsedHour);
    const uid = activeUser?.id || activeUser?._id || 'guest';

    try {
      setLoadingStep('Đang lập mệnh bàn Tử Vi...');
      setProgress(50);
      const chartRes = await createTuViChart(dateStr, hourIndexConverted, genderStr, uid);
      const record = chartRes.data;
      setResult(record);
      setProgress(100);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Lỗi xảy ra trong quá trình lập lá số.');
      setLoading(false);
    }
  };

  const handleViewOwnTuVi = async () => {
    if (!activeUser) {
      onRequireLogin();
      return;
    }
    if (!activeUser.baziInfo || !activeUser.baziInfo.day) {
      setIsUpdateBaziOpen(true);
      return;
    }
    const { day: d, month: m, year: y, hour: h } = activeUser.baziInfo;
    const formattedDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const genderStr = activeUser.gender === 0 ? 'Nữ' : 'Nam';
    await handleTuViComplete(formattedDate, String(h), genderStr);
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
      const res = await getTuViRecord(id);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Không thể nạp lá số từ lịch sử.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgress(0);
    setError('');
    setResult(null);
    setRated(false);
    setRating(0);
    setFeedback('');

    const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const uid = activeUser?.id || activeUser?._id || 'guest';

    try {
      setLoadingStep('Đang lập mệnh bàn Tử Vi...');
      setProgress(50);
      const chartRes = await createTuViChart(formattedDate, hourIndex, gender, uid);
      const record = chartRes.data;
      setResult(record);
      setProgress(100);
      setLoading(false);
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

  // Tiến trình kiểm tra ngầm (Job Polling)
  const pollJobStatus = (jobId, recordId) => {
    const interval = setInterval(async () => {
      try {
        const jobRes = await checkTuViJob(jobId);
        const job = jobRes.data;

        if (job.status === 'processing') {
          setProgress(job.progress || 50);
          setLoadingStep('Đại sư đang giải nghĩa tổ hợp tinh tú...');
        } else if (job.status === 'completed') {
          clearInterval(interval);
          setProgress(100);
          
          // Nạp lại chi tiết lá số đã hoàn tất bài giải luận
          const recordRes = await getTuViRecord(recordId);
          setResult(recordRes.data);
          setLoading(false);
          setLoadingAi(false);
          decrementCreditLocally();
        } else if (job.status === 'failed') {
          clearInterval(interval);
          setError(job.error || 'Quá trình giải đoán AI ngầm bị lỗi.');
          setLoading(false);
          setLoadingAi(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError('Mất kết nối kiểm tra hàng đợi.');
        setLoading(false);
        setLoadingAi(false);
      }
    }, 2000); // Poll mỗi 2 giây
  };

  const handleTriggerInterpretation = async () => {
    if (!activeUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }
    if (!result || !result._id) return;
    setLoadingAi(true);
    setProgress(0);
    setError('');
    setLoadingStep('Đang đưa lá số vào hàng đợi AI...');

    try {
      setProgress(10);
      const interpretRes = await interpretTuVi(result._id);

      if (interpretRes.data.status === 'completed') {
        setResult(prev => ({
          ...prev,
          aiInterpretation: interpretRes.data.result
        }));
        setProgress(100);
        setLoadingAi(false);
        decrementCreditLocally();
      } else {
        const jobId = interpretRes.data.jobId;
        pollJobStatus(jobId, result._id);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Lỗi gửi yêu cầu luận giải AI.');
      setLoadingAi(false);
    }
  };

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
      await rateTuVi(result._id, rating, feedback);
      setRated(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 pb-24 font-sans">
      
      {/* Xem lá số của bản thân */}
      {activeUser && !result && !loading && (
        <div className="max-w-xl mx-auto mb-10 text-center animate-in fade-in duration-300">
          <button 
            type="button"
            onClick={handleViewOwnTuVi}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-2xl font-extrabold shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0 text-lg w-full mb-4"
          >
            Xem Lá Số Của Bản Thân
          </button>
          <div className="flex items-center gap-4 py-4">
            <div className="h-px bg-purple-100 flex-1"></div>
            <span className="text-purple-400 font-bold text-xs uppercase tracking-wider">Hoặc lập lá số mới</span>
            <div className="h-px bg-purple-100 flex-1"></div>
          </div>
        </div>
      )}

      {/* 1. INPUT BIRTH INFO FORM */}
      {!result && !loading && (
        <div className="bg-white/80 backdrop-blur-xl p-5 md:p-10 rounded-2xl md:rounded-[2rem] shadow-xl border border-purple-100 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="flex items-center gap-3 justify-center mb-6">
            <div className="p-2 rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/20">
              <Sparkles size={20} />
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 uppercase tracking-tight">
              Nhập Thông Tin Tử Vi
            </h3>
          </div>
          <p className="text-slate-500 text-center text-sm md:text-base leading-relaxed mb-8">
            Hệ thống an sao Bắc Phái tự động quy đổi lịch pháp để lập đồ hình 12 Cung và truyền đạt bài luận chi tiết chính xác nhất.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Giới Tính */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2.5 ml-1">
                Giới Tính Mệnh Cách
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 cursor-pointer transition-all ${gender === 'Nam' ? 'border-purple-500 bg-purple-50/30 text-purple-700 font-extrabold shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                  <input type="radio" name="gender" value="Nam" checked={gender === 'Nam'} onChange={() => setGender('Nam')} className="hidden" />
                  <User size={18} /> Nam Mệnh
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 cursor-pointer transition-all ${gender === 'Nữ' ? 'border-purple-500 bg-purple-50/30 text-purple-700 font-extrabold shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                  <input type="radio" name="gender" value="Nữ" checked={gender === 'Nữ'} onChange={() => setGender('Nữ')} className="hidden" />
                  <User size={18} /> Nữ Mệnh
                </label>
              </div>
            </div>

            {/* Ngày Tháng Năm Sinh */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2.5 ml-1 flex items-center gap-1.5">
                <Calendar size={14} className="text-purple-500" /> Ngày - Tháng - Năm Sinh (Dương Lịch)
              </label>
              <div className="flex gap-3">
                <div className="flex-1">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">NGÀY</span>
                  <input type="number" required min="1" max="31" placeholder="DD" value={day} onChange={(e) => setDay(e.target.value)}
                    className="bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-lg rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 block w-full py-3.5 font-bold transition-all placeholder:text-slate-300" />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">THÁNG</span>
                  <input type="number" required min="1" max="12" placeholder="MM" value={month} onChange={(e) => setMonth(e.target.value)}
                    className="bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-lg rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 block w-full py-3.5 font-bold transition-all placeholder:text-slate-300" />
                </div>
                <div className="flex-[1.5]">
                  <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">NĂM</span>
                  <input type="number" required min="1900" max="2100" placeholder="YYYY" value={year} onChange={(e) => setYear(e.target.value)}
                    className="bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-lg rounded-2xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 block w-full py-3.5 font-bold transition-all placeholder:text-slate-300" />
                </div>
              </div>
            </div>

            {/* Giờ Sinh Can Chi Grid Selector */}
            <div>
              <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-3 ml-1 flex items-center gap-1.5">
                <Clock size={14} className="text-purple-500" /> Giờ Sinh Can Chi Mệnh Vị
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {LUNAR_HOURS.map((hr) => (
                  <button
                    key={hr.index}
                    type="button"
                    onClick={() => setHourIndex(hr.index)}
                    className={`py-3 px-1 text-center rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all ${
                      hourIndex === hr.index
                        ? 'border-purple-600 bg-purple-50/30 text-purple-800 shadow-sm'
                        : 'border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <div className="font-extrabold">{hr.name.split(' ')[0]}</div>
                    <div className="text-[9.5px] text-slate-400 font-medium mt-0.5">
                      {hr.name.substring(hr.name.indexOf('('))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-4 px-6 rounded-2xl shadow-lg text-base font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 focus:outline-none transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Lập Lá Số & Xem Giải Đoán
              </button>
            </div>
          </form>
        </div>
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
          {/* Ép Vẽ lá số 12 cung truyền thống thông qua Registry ChartRenderer */}
          <ChartRenderer 
            system={result.system || 'tu_vi'} 
            chartData={{
              ...result.chartData,
              solarDate: result.chartData?.solarDate || result.inputInfo?.date
            }} 
          />

          {/* Render các Accordion phân tích AI thông qua SectionRenderer hoặc nút Yêu cầu luận giải */}
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-6 ml-1">
              <Sparkles className="text-purple-500" size={20} />
              <h2 className="font-extrabold text-slate-800 text-lg md:text-xl">Luận Giải Chuyên Sâu Cát Hung</h2>
            </div>
            
            {(!result.aiInterpretation || !result.aiInterpretation.sections || result.aiInterpretation.sections.length === 0) ? (
              <div className="bg-white p-8 border border-purple-100 rounded-3xl text-center shadow-md max-w-xl mx-auto animate-in fade-in duration-300">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-4 border border-purple-100">
                  <Sparkles size={20} />
                </div>
                <h4 className="font-extrabold text-slate-800 text-lg mb-2">Chưa Có Luận Giải Thầy Tử Vi</h4>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                  Mệnh bàn đã được lập thành công. Hãy bấm nút dưới đây để kết nối trí tuệ AI luận giải cát hung 12 cung bản mệnh của bạn.
                </p>
                <button
                  type="button"
                  onClick={handleAILuanGiaiClick}
                  disabled={loadingAi}
                  className="bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-lg shadow-purple-500/20 transition-transform active:scale-[0.98] w-full flex items-center justify-center gap-2"
                >
                  {loadingAi ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>{loadingStep || 'Đang giải nghĩa cát hung...'} ({progress}%)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Yêu Cầu Đại Sư Luận Giải Chi Tiết</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <SectionRenderer sections={result.aiInterpretation.sections} />
            )}

            {/* ĐÁNH GIÁ PHẢN HỒI */}
            {result.aiInterpretation?.sections?.length > 0 && (
              <div className="mt-12 bg-white/60 border border-purple-100 p-6 rounded-3xl backdrop-blur-md max-w-xl mx-auto shadow-md">
                <h4 className="font-extrabold text-slate-800 text-center mb-2">Đánh Giá Luận Giải Thầy Tử Vi</h4>
                <p className="text-center text-xs text-slate-400 mb-6">Nhận xét của bạn sẽ giúp bổ sung tri thức và cải thiện chất lượng của AI tốt hơn.</p>

                {rated ? (
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
          </div>

          {/* Gieo lại quẻ/Luận lá số mới */}
          <div className="text-center">
            <button
              onClick={() => setResult(null)}
              className="px-10 py-4 bg-white text-purple-900 border-2 border-purple-200 rounded-2xl shadow-md hover:bg-purple-50 hover:border-purple-300 font-extrabold text-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Luận Giải Lá Số Khác
            </button>
          </div>
        </div>
      )}

      {/* 4. CHAT HỎI ĐÁP TIẾP THEO (AI CHAT WIDGET CONTROLLED MODE) */}
      {result && result._id && (
        <>
          {/* Nút bấm Hỏi thêm nổi bật - Tự động ẩn đi khi Khung chat mở */}
          {!isChatOpen && (
            <button
              onClick={() => {
                if (!activeUser) onRequireLogin();
                else setIsChatOpen(true);
              }}
              className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2 px-6 py-3.5 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-purple-800 to-indigo-950 hover:from-purple-900 hover:to-stone-900 text-white border-purple-700 hover:scale-105 hover:shadow-purple-900/40 uppercase text-xs tracking-wider animate-pulse"
            >
              <MessageCircle className="animate-bounce shrink-0" size={18} />
              <span>Hỏi Thêm Thầy</span>
            </button>
          )}

          {/* Unified chat widget với type="tu_vi" */}
          <AiChatWidget
            type="tu_vi"
            recordId={result._id}
            userId={activeUser?.id || activeUser?._id || 'guest'}
            isOpen={isChatOpen}
            setIsOpen={setIsChatOpen}
          />
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
          await handleTuViComplete(formattedDate, String(h), genderStr);
        }} 
      />

    </div>
  );
};

export default TuViBoard;
