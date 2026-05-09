import React, { useState } from 'react';
import CoinToss from './components/CoinToss';
import ManualInput from './components/ManualInput';
import DivinationBoard from './components/DivinationBoard';
import BaziInput from './components/BaziInput';
import BaziBoard from './components/BaziBoard';
import { calculateDivination, analyzeBazi } from './services/api';

function App() {
  const [appMode, setAppMode] = useState('iching'); // 'iching' | 'bazi'
  
  // I Ching State
  const [mode, setMode] = useState('coin'); // 'coin' | 'manual'
  const [result, setResult] = useState(null);
  
  // Bazi State
  const [baziResult, setBaziResult] = useState(null);
  
  // Shared State
  const [loading, setLoading] = useState(false);

  const handleDivinationComplete = async (lines) => {
    setLoading(true);
    try {
      const res = await calculateDivination(lines);
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server. Vui lòng thử lại sau.');
    }
    setLoading(false);
  };

  const handleBaziComplete = async (date, time, gender) => {
    setLoading(true);
    try {
      const res = await analyzeBazi(date, time, gender);
      setBaziResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối tới server phân tích Bát Tự.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f5f0] py-12 px-4 font-sans text-neutral-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* TOP NAVIGATION TABS */}
        <div className="flex justify-center mb-12">
            <div className="bg-white p-2 flex gap-2 rounded-full shadow border border-gray-100">
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
        ) : (
            <header className="text-center mb-16 pt-2">
            <div className="inline-block p-4 rounded-full bg-blue-100 border border-blue-200 mb-6">
                <div className="w-16 h-16 rounded-full border-4 border-blue-800 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-blue-800"></div>
                </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-blue-950 mb-6 tracking-tight drop-shadow-sm">Khoa Học Tử Bình</h1>
            <p className="text-blue-800/80 max-w-2xl mx-auto text-lg font-medium">Hệ thống phân tích Tứ Trụ, đo lường Ngũ Hành và định Dụng Thần cải vận.</p>
            </header>
        )}

        {/* SYSTEM 1: I CHING */}
        {appMode === 'iching' && (
            <div className="animate-in fade-in duration-500">
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
                    <DivinationBoard result={result} />
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
                    <BaziBoard data={baziResult} />
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

      </div>
    </div>
  );
}

export default App;
