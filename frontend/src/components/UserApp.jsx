import React, { useState, useEffect, useContext, useRef } from 'react';
import CoinToss from './CoinToss';
import ProfileBoard from './ProfileBoard';
import ManualInput from './ManualInput';
import MaiHoaInput from './MaiHoaInput';
import IChingBoard from './IChingBoard';
import BaziInput from './BaziInput';
import AuthModal from './AuthModal';
import UpdateBaziModal from './UpdateBaziModal';
import NotificationBell from './NotificationBell';
import { AuthContext } from '../context/AuthContext';
import { calculateDivination, analyzeBazi, linkIChing, linkBazi, getIChingRecord, getIChingHistory, getBaziHistory, getZiweiHistory, analyzeMarriage } from '../services/api';
import { UserCircle, LogOut, CalendarDays, Shield } from 'lucide-react';
import { Lunar } from 'lunar-javascript';
import MarriageInput from './MarriageInput';

import HistoryBoard from './HistoryBoard';

const BaziBoard = React.lazy(() => import('./BaziBoard'));
const ZiweiBoard = React.lazy(() => import('./ZiweiBoard'));
const MarriageBoard = React.lazy(() => import('./MarriageBoard'));
const DateSelectionBoard = React.lazy(() => import('./DateSelectionBoard'));

export default function UserApp({ onSwitchToAdmin }) {
  const [appMode, setAppMode] = useState(() => {
    const saved = localStorage.getItem('appMode');
    return saved === 'tuvi' ? 'ziwei' : (saved || 'iching');
  }); // 'iching' | 'bazi' | 'ziwei' | 'marriage' | 'xemngay' | 'history' | 'profile'
  
  // Auth
  const { user, logout } = useContext(AuthContext);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const [preloadedHistory, setPreloadedHistory] = useState(null);

  const preloadHistoryLists = () => {
    if (!user || preloadedHistory) return;
    const userId = user.id || user._id;
    const promise = Promise.all([
      getIChingHistory(userId),
      getBaziHistory(userId),
      getZiweiHistory(userId),
      getMarriageHistory(userId)
    ]).then(([hexRes, baziRes, ziweiRes, marriageRes]) => {
      const data = {
        hexagrams: hexRes.data,
        bazis: baziRes.data,
        tuvis: ziweiRes.data, // keep key name for history component compatibility
        marriages: marriageRes.data,
        promise: null
      };
      setPreloadedHistory(data);
      return data;
    }).catch(err => {
      console.error("Error preloading history lists:", err);
      setPreloadedHistory(null);
    });

    setPreloadedHistory({
      hexagrams: null,
      bazis: null,
      tuvis: null,
      marriages: null,
      promise
    });
  };

  const invalidateHistoryCache = () => {
    setPreloadedHistory(null);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Ziwei State
  const [historicalZiweiId, setHistoricalZiweiId] = useState(null);

  // I Ching State
  const [mode, setMode] = useState(() => localStorage.getItem('mode') || 'coin'); // 'coin' | 'manual' | 'maihoa'
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

  const [marriageResult, setMarriageResult] = useState(() => {
    try {
      const saved = localStorage.getItem('marriageResult');
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
  const [isZiweiResultLoaded, setIsZiweiResultLoaded] = useState(false);

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

  useEffect(() => {
    if (marriageResult) {
      localStorage.setItem('marriageResult', JSON.stringify(marriageResult));
    } else {
      localStorage.removeItem('marriageResult');
    }
  }, [marriageResult]);

  // Clear history cache when user logs out or switches accounts
  useEffect(() => {
    setPreloadedHistory(null);
  }, [user?.id, user?._id]);

  const handleDivinationComplete = async (lines, customDate, questionSuffix = '') => {
    setLoading(true);
    try {
      const baseQuestion = question.trim() || 'xem sức khỏe và công việc sắp tới có thuận lợi hay không';
      const actualQuestion = baseQuestion + questionSuffix;
      const userId = user ? user.id || user._id : 'guest';
      const res = await calculateDivination(lines, userId, actualQuestion, customDate);
      setResult(res.data);
      invalidateHistoryCache();
      if (userId === 'guest' && res.data.recordId) {
        setCurrentRecordId(res.data.recordId);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server. Vui lòng thử lại sau.');
    }
    setLoading(false);
  };

  const handleLoginSuccess = (loggedInUser) => {
    const activeUser = loggedInUser || user;
    if (!activeUser) return;
    const uid = activeUser.id || activeUser._id;
    if (!uid) return;

    const promises = [];
    if (currentRecordId) {
      promises.push(
        linkIChing(currentRecordId, uid)
          .then(() => setCurrentRecordId(null))
          .catch(err => console.error("Lỗi khi gán quẻ Kinh Dịch:", err))
      );
    }
    if (guestBaziId) {
      promises.push(
        linkBazi(guestBaziId, uid)
          .then(() => setGuestBaziId(null))
          .catch(err => console.error("Lỗi khi gán lá số Bát Tự:", err))
      );
    }

    if (promises.length > 0) {
      Promise.all(promises);
    }
  };

  const handleBaziComplete = async (date, time, gender) => {
    setLoading(true);
    try {
      const userId = user ? (user.id || user._id) : 'guest';
      const res = await analyzeBazi(date, time, gender, userId);
      setBaziResult(res.data);
      invalidateHistoryCache();
      if (userId === 'guest' && res.data.recordId) {
        setGuestBaziId(res.data.recordId);
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server phân tích Bát Tự.');
    }
    setLoading(false);
  };

  const handleMarriageComplete = async (male, female) => {
    setLoading(true);
    try {
      const userId = user ? (user.id || user._id) : 'guest';
      const res = await analyzeMarriage(male, female, userId);
      setMarriageResult(res.data);
      invalidateHistoryCache();
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server phân tích Hợp Hôn.');
    }
    setLoading(false);
  };

  const handleViewHistoricalHexagram = (recordWrapper) => {
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

  const handleViewHistoricalZiwei = (record) => {
    setHistoricalZiweiId(record._id || record.id);
    setAppMode('ziwei');
  };

  const handleViewHistoricalMarriage = (record) => {
    setMarriageResult(record);
    setAppMode('marriage');
  };

  const handleNotificationClick = async (hexagramId) => {
    setLoading(true);
    try {
      const res = await getIChingRecord(hexagramId);
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
    <div className="min-h-screen bg-[#f8f5f0] font-sans text-neutral-800 flex flex-col animate-in fade-in duration-300">
      {/* GLOBAL STICKY HEADER */}
      <header className="sticky top-0 z-40 w-full bg-[#f8f5f0]/95 backdrop-blur-md border-b border-gray-200/50 py-2.5 px-3 sm:px-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 sm:gap-6 w-full">
          
          {/* TABS (Horizontal Layout) */}
          <div className="bg-white p-1 flex gap-0.5 sm:gap-1 rounded-full shadow-sm border border-gray-200/50 justify-center items-center w-full sm:w-auto overflow-x-auto">
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
                setHistoricalZiweiId(null);
                setAppMode('ziwei');
              }} 
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-all text-[11px] sm:text-xs md:text-sm tracking-wider font-[Montserrat] uppercase ${appMode === 'ziwei' ? 'bg-purple-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-955 hover:bg-neutral-50'}`}
            >
              Tử Vi
            </button>
            <button 
              onClick={() => setAppMode('marriage')} 
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-all text-[11px] sm:text-xs md:text-sm tracking-wider font-[Montserrat] uppercase ${appMode === 'marriage' ? 'bg-rose-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-955 hover:bg-neutral-50'}`}
            >
              Hôn Nhân
            </button>
            <button 
              onClick={() => setAppMode('xemngay')} 
              className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-all text-[11px] sm:text-xs md:text-sm tracking-wider font-[Montserrat] uppercase ${appMode === 'xemngay' ? 'text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-955 hover:bg-neutral-50'}`}
              style={appMode === 'xemngay' ? { backgroundColor: '#065f46', color: '#ffffff' } : {}}
            >
              Xem ngày
            </button>
            {user && (
              <button 
                onClick={() => setAppMode('history')} 
                onMouseEnter={preloadHistoryLists}
                onTouchStart={preloadHistoryLists}
                className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-5 sm:py-2 rounded-full font-bold transition-all text-[11px] sm:text-xs md:text-sm tracking-wider font-[Montserrat] uppercase ${appMode === 'history' ? 'bg-slate-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-955 hover:bg-neutral-50'}`}
              >
                Lịch Sử
              </button>
            )}
          </div>

          {/* RIGHT SIDE SECTION: ADMIN TOGGLE & AUTH */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Sliding Pill Toggle Switch for Admin/Co-admin in UserApp */}
            {user && (user.role === 'admin' || user.role === 'co-admin') && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider hidden md:inline">Giao diện:</span>
                <div className="relative inline-flex items-center bg-gray-200/70 rounded-full p-1 cursor-pointer select-none w-36 h-9 border border-gray-350/40">
                  <div 
                    onClick={onSwitchToAdmin}
                    className="absolute top-1 bottom-1 left-1 bg-amber-800 rounded-full transition-all duration-300 shadow-sm"
                    style={{
                      width: 'calc(50% - 4px)',
                      transform: 'translateX(68px)'
                    }}
                  />
                  <div className="flex w-full text-center text-[10px] font-extrabold tracking-wider z-10">
                    <span onClick={onSwitchToAdmin} className="flex-1 text-neutral-550 hover:text-neutral-900 transition-colors select-none py-1">ADMIN</span>
                    <span className="flex-1 text-white select-none pointer-events-none py-1">USER</span>
                  </div>
                </div>
              </div>
            )}

            {/* AUTH MENU */}
            <div className="relative" ref={userMenuRef}>
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
                        {(user?.role === 'admin' || user?.role === 'co-admin') && (
                          <button 
                            onClick={() => {
                              onSwitchToAdmin();
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

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full max-w-6xl mx-auto py-6 md:py-10 px-4 space-y-8">

        {/* HEADER */}
        {appMode === 'iching' && !result ? (
          <header className="text-center mb-12 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-amber-100 border border-amber-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-amber-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-amber-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-amber-955 mb-4 drop-shadow-sm">Kinh Dịch Lục Hào</h1>
            <p className="text-amber-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium mb-6">Hệ thống gieo quẻ và luận giải diễn biến sự việc dựa trên nền tảng Âm Dương Ngũ Hành cổ học.</p>
            
            <div className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 rounded-full text-amber-900 shadow-sm animate-in fade-in">
              <CalendarDays size={18} className="text-amber-700" />
              <span className="font-medium text-sm md:text-base">Hôm nay: {(() => {
                const l = Lunar.fromDate(new Date());
                return `Ngày ${l.getDay()} tháng ${l.getMonth()} năm ${l.getYear()} Âm lịch`;
              })()}</span>
            </div>
          </header>
        ) : appMode === 'bazi' && !baziResult ? (
          <header className="text-center mb-16 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-blue-100 border border-blue-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-blue-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-blue-955 mb-6 drop-shadow-sm">Khoa Học Tử Bình</h1>
            <p className="text-blue-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống phân tích Tứ Trụ, đo lường Ngũ Hành và định Dụng Thần cải vận.</p>
          </header>
        ) : appMode === 'ziwei' && !isZiweiResultLoaded ? (
          <header className="text-center mb-16 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-purple-100 border border-purple-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-purple-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-purple-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-purple-955 mb-6 drop-shadow-sm">Mệnh Số Tử Vi</h1>
            <p className="text-purple-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống lập lá số 12 Cung mệnh bàn, định hướng cát hung và luận giải Vận Hạn.</p>
          </header>
        ) : appMode === 'marriage' && !marriageResult ? (
          <header className="text-center mb-16 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-rose-100 border border-rose-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-rose-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-rose-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-rose-955 mb-6 drop-shadow-sm">Bát Tự Hợp Hôn</h1>
            <p className="text-rose-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống đối chiếu âm dương ngũ hành, cung phi bản mệnh của hai phối ngẫu.</p>
          </header>
        ) : appMode === 'xemngay' ? (
          <header className="text-center mb-16 pt-2 animate-in fade-in duration-300 font-sans">
            <div className="inline-block p-4 rounded-full bg-emerald-100 border border-emerald-200 mb-6">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-800 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-800"></div>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-[Lora] font-bold text-emerald-955 mb-6 drop-shadow-sm">XEM NGÀY ĐẸP</h1>
            <p className="text-emerald-800/80 max-w-2xl mx-auto text-base md:text-lg font-medium">Hệ thống chọn lựa ngày lành tháng tốt, xem cát hung giờ hoàng đạo cá nhân hóa theo phong thủy tuổi mệnh.</p>
          </header>
        ) : null}

        {/* SYSTEM BOARDS */}
        {/* SYSTEM 1: I CHING */}
        <div className={`animate-in fade-in duration-500 ${appMode === 'iching' ? 'block' : 'hidden'}`}>
          {!result && !loading && (
            <div className="max-w-xl mx-auto mb-10 bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
              <label className="block text-amber-900 font-bold mb-3 text-lg text-center">Sự việc cần hỏi (Ý niệm)</label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder='Ví dụ: "Xem sức khỏe và công việc sắp tới có thuận lợi hay không?"'
                className="w-full px-4 py-3 border-2 border-amber-50 rounded-xl focus:border-amber-300 focus:ring-0 transition-colors resize-none text-gray-700 bg-amber-50/30 text-sm sm:text-base focus:outline-none"
                rows="2"
              ></textarea>
              <p className="text-xs sm:text-sm text-gray-400 text-center mt-2 italic">Hãy tập trung ý niệm vào câu hỏi trước khi gieo quẻ.</p>
            </div>
          )}

          {!result && (
            <div className="max-w-xl mx-auto bg-white p-5 sm:p-8 rounded-3xl border border-amber-100 shadow-lg relative z-10 space-y-6">
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
                  <div className="text-base font-bold text-amber-800 animate-pulse">Đang kết nối tâm linh...</div>
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
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20 font-sans">
              <IChingBoard result={result} onUpdateResult={setResult} user={user} onRequireLogin={() => setIsAuthModalOpen(true)} />
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
                className="bg-[#faf6f0] border-2 border-amber-200/60 text-amber-900 px-8 py-4 rounded-2xl font-bold shadow-md transition-all hover:bg-blue-600 hover:border-blue-600 hover:text-white hover:shadow-lg hover:shadow-blue-600/20 active:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 text-lg w-full mb-4"
              >
                Xem Lá Số Của Bản Thân
              </button>
              <div className="flex items-center gap-4 py-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-gray-400 font-medium text-xs sm:text-sm uppercase">Hoặc lập lá số mới</span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-20 animate-in fade-in">
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
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20 font-sans">
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
        <div className={`animate-in fade-in duration-500 ${appMode === 'ziwei' ? 'block' : 'hidden'}`}>
          <React.Suspense fallback={
            <div className="text-center py-20 animate-in fade-in">
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-purple-900 font-extrabold text-sm tracking-wider uppercase">Đang nạp dữ liệu Tử Vi...</p>
            </div>
          }>
            <ZiweiBoard 
              user={user} 
              onRequireLogin={() => setIsAuthModalOpen(true)} 
              historicalRecordId={historicalZiweiId} 
              onCalculationComplete={invalidateHistoryCache}
              onResultChange={setIsZiweiResultLoaded}
            />
          </React.Suspense>
        </div>

        {/* SYSTEM 5: HÔN NHÂN */}
        <div className={`animate-in fade-in duration-500 ${appMode === 'marriage' ? 'block' : 'hidden'}`}>
          {loading && (
            <div className="text-center py-20 animate-in fade-in">
              <div className="w-16 h-16 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="text-xl font-bold text-rose-800 animate-pulse">Đang đối chiếu lá số hợp hôn...</div>
            </div>
          )}

          {!marriageResult && !loading && (
            <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
              <MarriageInput onComplete={handleMarriageComplete} />
            </div>
          )}

          {marriageResult && !loading && (
            <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20 font-sans">
              <React.Suspense fallback={
                <div className="text-center py-20 animate-in fade-in">
                  <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-rose-955 font-extrabold text-sm tracking-wider uppercase">Đang nạp dữ liệu Hợp Hôn...</p>
                </div>
              }>
                <MarriageBoard data={marriageResult} onUpdateData={setMarriageResult} onRequireLogin={() => setIsAuthModalOpen(true)} />
              </React.Suspense>
              <div className="text-center">
                <button 
                  onClick={() => setMarriageResult(null)} 
                  className="px-10 py-4 bg-white text-rose-900 border-2 border-rose-200 rounded-2xl shadow-md hover:bg-rose-50 hover:border-rose-300 font-bold text-lg transition-all hover:-translate-y-1"
                >
                  Xem Cặp Đôi Khác
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* SYSTEM 6: DATE SELECTION */}
        <div className={`animate-in fade-in duration-500 ${appMode === 'xemngay' ? 'block' : 'hidden'}`}>
          <React.Suspense fallback={
            <div className="text-center py-20 animate-in fade-in">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-emerald-955 font-extrabold text-sm tracking-wider uppercase animate-pulse">Đang nạp dữ liệu Trạch Cát...</p>
            </div>
          }>
            <DateSelectionBoard user={user} />
          </React.Suspense>
        </div>

        {/* SYSTEM 4: HISTORY */}
        {user && (
          <div className={`animate-in fade-in duration-500 ${appMode === 'history' ? 'block' : 'hidden'}`}>
            <HistoryBoard 
              onViewHexagram={handleViewHistoricalHexagram} 
              onViewBazi={handleViewHistoricalBazi} 
              onViewZiwei={handleViewHistoricalZiwei}
              onViewMarriage={handleViewHistoricalMarriage}
              preloadedData={preloadedHistory}
              onCacheInvalidate={invalidateHistoryCache}
              onSaveCache={setPreloadedHistory}
              active={appMode === 'history'}
            />
          </div>
        )}

        {/* SYSTEM 5: USER PROFILE */}
        {user && appMode === 'profile' && (
          <div className="animate-in fade-in duration-500">
            <ProfileBoard />
          </div>
        )}

      </div>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLoginSuccess={handleLoginSuccess} />
      <UpdateBaziModal 
        isOpen={isUpdateBaziOpen} 
        onClose={() => setIsUpdateBaziOpen(false)} 
        onSuccess={(updatedUser) => {
          const { day, month, year, hour, minute } = updatedUser.baziInfo;
          const formattedDate = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year}`;
          const formattedTime = `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
          handleBaziComplete(formattedDate, formattedTime, updatedUser.gender !== undefined ? updatedUser.gender : 1);
        }} 
      />
    </div>
  );
}
