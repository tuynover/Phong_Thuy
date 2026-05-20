import React, { useState, useEffect, useContext } from 'react';
import CoinToss from './components/CoinToss';
import ManualInput from './components/ManualInput';
import DivinationBoard from './components/DivinationBoard';
import BaziInput from './components/BaziInput';
import BaziBoard from './components/BaziBoard';
import HistoryBoard from './components/HistoryBoard';
import AuthModal from './components/AuthModal';
import UpdateBaziModal from './components/UpdateBaziModal';
import { AuthContext } from './context/AuthContext';
import { calculateDivination, analyzeBazi, linkHexagram, linkBazi } from './services/api';
import { UserCircle, LogOut } from 'lucide-react';

function App() {
  const [appMode, setAppMode] = useState(() => localStorage.getItem('appMode') || 'iching'); // 'iching' | 'bazi' | 'history'
  
  // Auth
  const { user, logout } = useContext(AuthContext);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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
  const handleDivinationComplete = async (lines) => {
    setLoading(true);
    try {
      const actualQuestion = question.trim() || 'xem sức khỏe và công việc sắp tới có thuận lợi hay không';
      const userId = user ? user.id || user._id : 'guest';
      const res = await calculateDivination(lines, userId, actualQuestion);
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
    <div className="min-h-screen bg-[#f8f5f0] py-12 px-4 font-sans text-neutral-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TOP NAVIGATION TABS & AUTH */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <div className="w-full md:w-1/3"></div>
            <div className="bg-white p-2 flex flex-wrap gap-2 rounded-full shadow border border-gray-100 justify-center">
                <button 
                  onClick={() => setAppMode('iching')} 
                  className={`px-8 py-3 rounded-full font-bold transition-all ${appMode === 'iching' ? 'bg-amber-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Dịch Lý Lục Hào
                </button>
                <button 
                  onClick={() => setAppMode('bazi')} 
                  className={`px-8 py-3 rounded-full font-bold transition-all ${appMode === 'bazi' ? 'bg-blue-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                  Bát Tự Tử Bình
                </button>
                {user && (
                  <button 
                    onClick={() => setAppMode('history')} 
                    className={`px-8 py-3 rounded-full font-bold transition-all ${appMode === 'history' ? 'bg-slate-800 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    Lịch Sử
                  </button>
                )}
            </div>
            <div className="w-full md:w-1/3 flex justify-center md:justify-end">
              {user ? (
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 text-amber-900 font-medium">
                    <UserCircle size={20} />
                    <span>{user.name}</span>
                  </div>
                  <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors" title="Đăng xuất">
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-2 bg-amber-800 text-white px-6 py-2 rounded-full shadow hover:bg-amber-900 font-medium transition-colors"
                >
                  <UserCircle size={20} />
                  <span>Đăng Nhập</span>
                </button>
              )}
            </div>
        </div>

        {/* HEADER */}
        {appMode === 'iching' ? (
            <header className="text-center mb-16 pt-2">
            <div className="inline-block p-4 rounded-full bg-amber-100 border border-amber-200 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-amber-800 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-amber-800"></div>
                </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-amber-950 mb-6 tracking-tight drop-shadow-sm">Kinh Dịch Lục Hào</h1>
            <p className="text-amber-800/80 max-w-2xl mx-auto text-lg font-medium">Hệ thống gieo quẻ và luận giải diễn biến sự việc dựa trên nền tảng Âm Dương Ngũ Hành cổ học.</p>
            </header>
        ) : appMode === 'bazi' ? (
            <header className="text-center mb-16 pt-2">
            <div className="inline-block p-4 rounded-full bg-blue-100 border border-blue-200 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-blue-800 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-800"></div>
                </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-blue-950 mb-6 tracking-tight drop-shadow-sm">Khoa Học Tử Bình</h1>
            <p className="text-blue-800/80 max-w-2xl mx-auto text-lg font-medium">Hệ thống phân tích Tứ Trụ, đo lường Ngũ Hành và định Dụng Thần cải vận.</p>
            </header>
        ) : null}

        {/* SYSTEM 1: I CHING */}
        {appMode === 'iching' && (
            <div className="animate-in fade-in duration-500">
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
                <div className="flex justify-center mb-10 gap-4 relative z-10">
                    <button 
                    onClick={() => setMode('coin')} 
                    className={`px-8 py-3 rounded-full font-bold transition-all ${mode === 'coin' ? 'bg-amber-700 text-white shadow-lg scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                    Gieo Bằng Đồng Xu
                    </button>
                    <button 
                    onClick={() => setMode('manual')} 
                    className={`px-8 py-3 rounded-full font-bold transition-all ${mode === 'manual' ? 'bg-slate-800 text-white shadow-lg scale-105' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                    Nhập Hào Thủ Công
                    </button>
                </div>
                )}

                {loading && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <div className="text-xl font-bold text-amber-800 animate-pulse">Đang kết nối thần linh...</div>
                    </div>
                )}

                {!result && !loading && (
                <div className="transition-all duration-500 animate-in fade-in slide-in-from-bottom-8">
                    {mode === 'coin' ? <CoinToss onComplete={handleDivinationComplete} /> : <ManualInput onComplete={handleDivinationComplete} />}
                </div>
                )}

                {result && !loading && (
                <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700 pb-20">
                    <DivinationBoard result={result} user={user} onRequireLogin={() => setIsAuthModalOpen(true)} />
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
        )}

        {/* SYSTEM 2: BAZI */}
        {appMode === 'bazi' && (
            <div className="animate-in fade-in duration-500">
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
                    <BaziBoard data={baziResult} onRequireLogin={() => setIsAuthModalOpen(true)} />
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
        )}

        {/* SYSTEM 3: HISTORY */}
        {appMode === 'history' && (
            <div className="animate-in fade-in duration-500">
                <HistoryBoard 
                    onViewHexagram={handleViewHistoricalHexagram} 
                    onViewBazi={handleViewHistoricalBazi} 
                />
            </div>
        )}

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
