import React, { useState, useEffect, useContext, useRef } from 'react';
import CoinToss from './components/CoinToss';
import ProfileBoard from './components/ProfileBoard';
import ManualInput from './components/ManualInput';
import MaiHoaInput from './components/MaiHoaInput';
import DivinationBoard from './components/DivinationBoard';
import BaziInput from './components/BaziInput';
const BaziBoard = React.lazy(() => import('./components/BaziBoard'));
const TuViBoard = React.lazy(() => import('./components/TuViBoard'));
const HistoryBoard = React.lazy(() => import('./components/HistoryBoard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
import AuthModal from './components/AuthModal';
import UpdateBaziModal from './components/UpdateBaziModal';
import NotificationBell from './components/NotificationBell';
import { AuthContext } from './context/AuthContext';
import { calculateDivination, analyzeBazi, linkHexagram, linkBazi, getHexagramRecord } from './services/api';
import { UserCircle, LogOut, CalendarDays, Shield } from 'lucide-react';
import { Lunar } from 'lunar-javascript';

function App() {
  const [appMode, setAppMode] = useState(() => localStorage.getItem('appMode') || 'iching'); // 'iching' | 'bazi' | 'tuvi' | 'history'
  
  // Auth
  const { user, logout } = useContext(AuthContext);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tu Vi State
  const [historicalTuViId, setHistoricalTuViId] = useState(null);

  // I Ching State
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'coin'); // 'coin' | 'manual'
  const [result, setResult] = useState(() => {
    try {
      const saved = localStorage.getItem('result');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [question, setQuestion] = useState(() => localStorage.getItem('question') || '');
  
  // Bazi State
  const [baziResult, setBaziResult] = useState(() => {
    try {
      const saved = localStorage.getItem('baziResult');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  // Shared State
  const [loading, setLoading] = useState(false);
  const [currentRecordId, setCurrentRecordId] = useState(null);
  const [guestBaziId, setGuestBaziId] = useState(null);
  const [isUpdateBaziOpen, setIsUpdateBaziOpen] = useState(false);

  // Persist State across Refreshes
  useEffect(() => {
    localStorage.setItem('appMode', appMode);
  }, [appMode]);

  useEffect(() => {
    localStorage.setItem('mode', mode);
  }, [mode]);

  useEffect(() => {
    if (result) {
      localStorage.setItem('result', JSON.stringify(result));
    } else {
      localStorage.removeItem('result');
    }
  }, [result]);

  useEffect(() => {
    localStorage.setItem('question', question);
  }, [question]);

  useEffect(() => {
    if (baziResult) {
      localStorage.setItem('baziResult', JSON.stringify(baziResult));
    } else {
      localStorage.removeItem('baziResult');
    }
  }, [baziResult]);
  const handleDivinationComplete = async (lines, customDate, questionSuffix = '') => {
    setLoading(true);
    try {
      const baseQuestion = question.trim() || 'xem sức khỏe và công việc sắp tới có thuận lợi hay không';
      const actualQuestion = baseQuestion + questionSuffix;
      const userId = user ? user.id || user._id : 'guest';
      const res = await calculateDivination(lines, userId, actualQuestion, customDate);
      setResult(res.data);
      if (userId === 'guest' && res.data.recordId) {
        setCurrentRecordId(res.data.recordId);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server. Vui lòng thử lại sau.');
    }
    setLoading(false);
  };

  const handleLoginSuccess = async (loggedInUser) => {
    const activeUser = loggedInUser || user;
    if (!activeUser) return;
    const uid = activeUser.id || activeUser._id;
    if (!uid) return;

    let messages = [];
    if (currentRecordId) {
      try {
        await linkHexagram(currentRecordId, uid);
        setCurrentRecordId(null);
        messages.push('quẻ Kinh Dịch');
      } catch (err) {
        console.error("Lỗi khi gán quẻ:", err);
      }
    }
    if (guestBaziId) {
      try {
        await linkBazi(guestBaziId, uid);
        setGuestBaziId(null);
        messages.push('lá số Bát Tự');
      } catch (err) {
        console.error("Lỗi khi gán bát tự:", err);
      }
    }
    // No alert needed
  };

  const handleBaziComplete = async (date, time, gender) => {
    console.log("Current user from context:", user);
    setLoading(true);
    try {
      const userId = user ? (user.id || user._id) : 'guest';
      console.log("Using userId for analysis:", userId);
      const res = await analyzeBazi(date, time, gender, userId);
      setBaziResult(res.data);
      if (userId === 'guest' && res.data.recordId) {
        setGuestBaziId(res.data.recordId);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server phân tích Bát Tự.');
    }
    setLoading(false);
  };

  const handleViewHistoricalHexagram = (recordWrapper) => {
    // When clicking a record from HistoryBoard, it passes the entire record document as 'recordWrapper'
    setResult({
      recordId: recordWrapper._id || recordWrapper.id,
      primary: recordWrapper.primaryHexagram,
      secondary: recordWrapper.transformedHexagram,
      primaryLines: recordWrapper.primaryLines || [],
      secondaryLines: recordWrapper.secondaryLines || [],
      movingLines: recordWrapper.movingLines || [],
      dateInfo: recordWrapper.lunarDateInfo,
      aiInterpretation: recordWrapper.aiInterpretation || ''
    });
    setAppMode('iching');
  };

  const handleViewHistoricalBazi = (record) => {
    setBaziResult({
      ...record.baziData,
      recordId: record._id || record.id,
      aiInterpretation: record.aiInterpretation
    });
    setAppMode('bazi');
  };

  const handleViewHistoricalTuVi = (record) => {
    setHistoricalTuViId(record._id || record.id);
    setAppMode('tuvi');
  };

  const handleNotificationClick = async (hexagramId) => {
    setLoading(true);
    try {
      const res = await getHexagramRecord(hexagramId);
      handleViewHistoricalHexagram(res.data);
    } catch (err) {
      console.error("Lỗi khi tải thông tin quẻ từ thông báo:", err);
      alert("Không thể mở chi tiết quẻ này.");
    }
    setLoading(false);
  };

  const handleViewOwnBazi = async () => {
    if (!user) return;
    if (!user.baziInfo || !user.baziInfo.day) {
      setIsUpdateBaziOpen(true);
      return;
    }
    const { day, month, year, hour, minute } = user.baziInfo;
    const formattedDate = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
    const formattedTime = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
    await handleBaziComplete(formattedDate, formattedTime, user.gender !== undefined ? user.gender : 1);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] font-sans text-neutral-800 flex flex-col">
      {/* GLOBAL STICKY HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#f8f5f0]/95 backdrop-blur-md border-b border-gray-200/50 py-2.5 px-3 sm:px-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 sm:gap-6 w-full">
          
          {/* TABS (Horizontal Layout) */}
          <div className="bg-white p-1 flex gap-0.5 sm:gap-1 rounded-full shadow-sm border border-gray-200/50 justify-center items-center w-full sm:w-auto">
            <button 
              onClick={() => setAppMode('iching')} 
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-all text-[11px] sm:text-xs md:text-sm tracking-wider font-[Montserrat] uppercase ${appMode === 'iching' ? 'bg-amber-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-955 hover:bg-neutral-50'}`}
            >
              Dịch Lý
            </button>
            <button 
              onClick={() => setAppMode('bazi')} 
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-all text-[11px] sm:text-xs md:text-sm tracking-wider font-[Montserrat] uppercase ${appMode === 'bazi' ? 'bg-blue-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-955 hover:bg-neutral-50'}`}
            >
              Bát Tự
            </button>
            <button 
              onClick={() => {
                setHistoricalTuViId(null);
                setAppMode('tuvi');
              }} 
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-all text-[11px] sm:text-xs md:text-sm tracking-wider font-[Montserrat] uppercase ${appMode === 'tuvi' ? 'bg-purple-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-955 hover:bg-neutral-50'}`}
            >
              Tử Vi
            </button>
            {user && (
              <button 
                onClick={() => setAppMode('history')} 
                className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-all text-[11px] sm:text-xs md:text-sm tracking-wider font-[Montserrat] uppercase ${appMode === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-955 hover:bg-neutral-50'}`}
              >
                Lịch Sử
              </button>
            )}
          </div>

          {/* AUTH SECTION */}
          <div className="shrink-0 flex items-center" ref={userMenuRef}>
            {user ? (
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-200/50 text-xs sm:text-sm relative">
                <NotificationBell onNotificationClick={handleNotificationClick} />
                
                {/* User Dropdown Toggle */}
                <div className="relative">
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1 text-amber-900 font-semibold max-w-[80px] sm:max-w-none hover:text-amber-955 transition-colors focus:outline-none"
                    title="Hồ sơ cá nhân"
                  >
                    <UserCircle size={18} className="text-amber-800 shrink-0" />
                    <span className="hidden sm:inline truncate max-w-[100px]">{user.name}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-3 w-44 bg-white rounded-2xl shadow-xl border border-gray-150 z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button 
                        onClick={() => {
                          setAppMode('profile');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-955 font-bold transition-colors flex items-center gap-2"
                      >
                        <UserCircle size={15} className="text-amber-800" />
                        Hồ sơ cá nhân
                      </button>
                      {(user.role === 'admin' || user.role === 'co-admin') && (
                        <button 
                          onClick={() => {
                            setAppMode('admin');
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs sm:text-sm text-amber-900 hover:bg-amber-50 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                        >
                          <Shield size={15} className="text-amber-700" />
                          Trang quản trị
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          setAppMode('iching');
                        }}
                        className="w-full text-left px-4 py-2 text-xs sm:text-sm text-red-650 hover:bg-red-50 font-bold transition-colors flex items-center gap-2 border-t border-gray-100"
                      >
                        <LogOut size={15} />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-amber-800 hover:bg-amber-900 text-white px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-sm hover:shadow transition-all duration-200 font-bold text-xs sm:text-sm"
              >
                <UserCircle size={16} className="shrink-0" />
                <span className="hidden sm:inline">Đăng Nhập</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full max-w-6xl mx-auto py-6 md:py-10 px-4 space-y-8">


        {/* HEADER */}
        {appMode === 'iching' ? (
            <header className="text-center mb-12 pt-2">
            <div className="inline-block p-4 rounded-full bg-amber-100 border border-amber-200 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-amber-800 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-amber-800"></div>
                </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-amber-950 mb-4 drop-shadow-sm">Kinh Dịch Lục Hào</h1>
            <p className="text-amber-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium mb-6">Hệ thống gieo quẻ và luận giải diễn biến sự việc dựa trên nền tảng Âm Dương Ngũ Hành cổ học.</p>
            
            {!result && (
                <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 rounded-full text-amber-900 shadow-sm animate-in fade-in">
                    <CalendarDays size={18} className="text-amber-700" />
                    <span className="font-medium text-sm md:text-base">Hôm nay: {(() => {
                        const l = Lunar.fromDate(new Date());
                        return `Ngày ${l.getDay()} tháng ${l.getMonth()} năm ${l.getYear()} Âm lịch`;
                    })()}</span>
                </div>
            )}
            </header>
        ) : appMode === 'bazi' ? (
            <header className="text-center mb-16 pt-2">
            <div className="inline-block p-4 rounded-full bg-blue-100 border border-blue-200 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-blue-800 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-800"></div>
                </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-blue-955 mb-6 drop-shadow-sm">Khoa Học Tử Bình</h1>
            <p className="text-blue-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống phân tích Tứ Trụ, đo lường Ngũ Hành và định Dụng Thần cải vận.</p>
            </header>
        ) : appMode === 'tuvi' ? (
            <header className="text-center mb-16 pt-2">
            <div className="inline-block p-4 rounded-full bg-purple-100 border border-purple-200 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-purple-800 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-purple-800"></div>
                </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-purple-955 mb-6 drop-shadow-sm">Mệnh Số Tử Vi</h1>
            <p className="text-purple-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống lập lá số 12 Cung mệnh bàn, định hướng cát hung và luận giải Vận Hạn.</p>
            </header>
        ) : appMode === 'admin' ? (
            <header className="text-center mb-10 pt-2 animate-in fade-in duration-300">
            <div className="inline-block p-4 rounded-full bg-slate-800 border border-slate-700 mb-4">
                <Shield className="text-amber-500" size={32} />
            </div>
            <h1 className="text-3xl md:text-5xl font-[Lora] font-bold text-slate-100 mb-2">Hệ Thống Quản Trị Viên</h1>
            <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm font-medium">Bảo mật hệ thống, cấu hình thành viên, giải quyết khiếu nại và giám sát tài nguyên AI.</p>
            </header>
        ) : null}

        <React.Suspense fallback={
          <div className="text-center py-20 max-w-md mx-auto bg-white/40 border border-purple-100 rounded-3xl backdrop-blur-md p-8 shadow-sm">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-purple-900 font-extrabold text-sm tracking-wider uppercase animate-pulse">Đang tải phân hệ học thuật...</p>
          </div>
        }>
        {/* SYSTEM 1: I CHING */}
        <div className={`animate-in fade-in duration-500 ${appMode === 'iching' ? 'block' : 'hidden'}`}>
            {!result && !loading && (
                <div className="max-w-xl mx-auto mb-10 bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
                    <label className="block text-amber-900 font-bold mb-3 text-lg text-center">Sự việc cần hỏi (Ý niệm)</label>
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder='Ví dụ: "Xem sức khỏe và công việc sắp tới có thuận lợi hay không?"'
                        className="w-full px-4 py-3 border-2 border-amber-50 rounded-xl focus:border-amber-300 focus:ring-0 transition-colors resize-none text-gray-700 bg-amber-50/30"
                        rows="2"
                    ></textarea>
                    <p className="text-sm text-gray-400 text-center mt-2 italic">Hãy tập trung ý niệm vào câu hỏi trước khi gieo quẻ.</p>
                </div>
            )}

            {!result && (
                <div className="max-w-xl mx-auto bg-white p-5 sm:p-8 rounded-3xl border border-amber-100 shadow-lg relative z-10 space-y-6">
                    {/* 3 cách gieo quẻ trong 1 khung gói cho gọn, ấn vào cái nào thì sáng lên */}
                    <div className="flex bg-slate-100/80 p-0.5 sm:p-1 rounded-2xl border border-slate-200/40 w-full">
                        <button
                            onClick={() => setMode('coin')}
                            disabled={loading}
                            className={`flex-1 py-2.5 sm:py-3.5 px-0.5 sm:px-3 rounded-xl font-bold text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs sm:text-sm transition-all whitespace-nowrap text-center ${mode === 'coin' ? 'bg-white text-amber-900 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Gieo Đồng Xu
                        </button>
                        <button
                            onClick={() => setMode('maihoa')}
                            disabled={loading}
                            className={`flex-1 py-2.5 sm:py-3.5 px-0.5 sm:px-3 rounded-xl font-bold text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs sm:text-sm transition-all whitespace-nowrap text-center ${mode === 'maihoa' ? 'bg-white text-amber-900 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Mai Hoa Dịch
                        </button>
                        <button
                            onClick={() => setMode('manual')}
                            disabled={loading}
                            className={`flex-1 py-2.5 sm:py-3.5 px-0.5 sm:px-3 rounded-xl font-bold text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs sm:text-sm transition-all whitespace-nowrap text-center ${mode === 'manual' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            Nhập Thủ Công
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
                            <div className="text-base font-bold text-amber-800 animate-pulse">Đang kết nối thần linh...</div>
                        </div>
                    ) : (
                        <div className="transition-all duration-300">
                            {mode === 'coin' && <CoinToss onComplete={handleDivinationComplete} />}
                            {mode === 'maihoa' && <MaiHoaInput onComplete={handleDivinationComplete} />}
                            {mode === 'manual' && <ManualInput onComplete={handleDivinationComplete} />}
                        </div>
                    )}
                </div>
            )}

            {result && !loading && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
                <DivinationBoard result={result} onUpdateResult={setResult} user={user} onRequireLogin={() => setIsAuthModalOpen(true)} />
                <div className="text-center">
                <button 
                    onClick={() => setResult(null)} 
                    className="px-10 py-4 bg-white text-amber-900 border-2 border-amber-200 rounded-2xl shadow-md hover:bg-amber-50 hover:border-amber-300 font-bold text-lg transition-all hover:-translate-y-1"
                >
                    Gieo Quẻ Mới
                </button>
                </div>
            </div>
            )}
        </div>

        {/* SYSTEM 2: BAZI */}
        <div className={`animate-in fade-in duration-500 ${appMode === 'bazi' ? 'block' : 'hidden'}`}>
            {user && !baziResult && !loading && (
                <div className="max-w-xl mx-auto mb-10 text-center">
                    <button 
                        onClick={handleViewOwnBazi}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold shadow-lg transition-transform hover:-translate-y-1 text-lg w-full mb-4"
                    >
                        Xem Lá Số Của Bản Thân
                    </button>
                    <div className="flex items-center gap-4 py-4">
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-gray-400 font-medium text-sm uppercase">Hoặc lập lá số mới</span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                    </div>
                </div>
            )}

            {loading && (
                <div className="text-center py-20">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
                    <div className="text-xl font-bold text-blue-800 animate-pulse">Đang nạp thuật toán Tử Bình...</div>
                </div>
            )}

            {!baziResult && !loading && (
                <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
                    <BaziInput onComplete={handleBaziComplete} />
                </div>
            )}

            {baziResult && !loading && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
                <BaziBoard data={baziResult} onUpdateData={setBaziResult} onRequireLogin={() => setIsAuthModalOpen(true)} />
                <div className="text-center">
                <button 
                    onClick={() => setBaziResult(null)} 
                    className="px-10 py-4 bg-white text-blue-900 border-2 border-blue-200 rounded-2xl shadow-md hover:bg-blue-50 hover:border-blue-300 font-bold text-lg transition-all hover:-translate-y-1"
                >
                    Luận Lá Số Khác
                </button>
                </div>
            </div>
            )}
        </div>

        {/* SYSTEM 3: TỬ VI */}
        <div className={`animate-in fade-in duration-500 ${appMode === 'tuvi' ? 'block' : 'hidden'}`}>
            <TuViBoard 
                user={user} 
                onRequireLogin={() => setIsAuthModalOpen(true)} 
                historicalRecordId={historicalTuViId} 
            />
        </div>

        {/* SYSTEM 4: HISTORY */}
        {user && appMode === 'history' && (
            <div className="animate-in fade-in duration-500">
                <HistoryBoard 
                    onViewHexagram={handleViewHistoricalHexagram} 
                    onViewBazi={handleViewHistoricalBazi} 
                    onViewTuVi={handleViewHistoricalTuVi}
                />
            </div>
        )}

        {/* SYSTEM 5: USER PROFILE */}
        {user && appMode === 'profile' && (
            <div className="animate-in fade-in duration-500">
                <ProfileBoard />
            </div>
        )}

        {/* SYSTEM 6: ADMIN DASHBOARD */}
        {user && (user.role === 'admin' || user.role === 'co-admin') && appMode === 'admin' && (
            <div className="animate-in fade-in duration-500">
                <AdminDashboard />
            </div>
        )}
        </React.Suspense>

      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
      <UpdateBaziModal 
        isOpen={isUpdateBaziOpen} 
        onClose={() => setIsUpdateBaziOpen(false)} 
        onSuccess={(updatedUser) => {
          // If you have a setUser method from context you could call it.
          // For now, since user state updates might be complex, we just proceed.
          const { day, month, year, hour, minute } = updatedUser.baziInfo;
          const formattedDate = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
          const formattedTime = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
          handleBaziComplete(formattedDate, formattedTime, updatedUser.gender !== undefined ? updatedUser.gender : 1);
        }} 
      />
    </div>
  );
}

export default App;
