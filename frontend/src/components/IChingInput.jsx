import React, { useState, useEffect, useRef } from 'react';
import { Coins, RotateCcw, CalendarDays, Clock, Settings2, Sparkles, HelpCircle, ChevronDown } from 'lucide-react';
import { Lunar, Solar } from 'lunar-javascript';
import { validateInputDate, getMaxDaysInMonth } from '../utils/dateValidator';
import FloatingErrorToast from './FloatingErrorToast';

// ==========================================
// 1. COIN TOSS SUB-COMPONENT (GIEO ĐỒNG XU LỤC HÀO)
// ==========================================
export const CoinToss = ({ onComplete }) => {
    const [lines, setLines] = useState([]);
    const [tossing, setTossing] = useState(false);
    
    // Each coin state stores an absolute Y rotation and current face (1 = Sấp, 0 = Ngửa)
    const [coinStates, setCoinStates] = useState([
        { rotY: 0, face: 1 },
        { rotY: 0, face: 1 },
        { rotY: 0, face: 1 }
    ]);

    const handleToss = () => {
        if (lines.length >= 6 || tossing) return;
        setTossing(true);

        // Generate next toss results
        const coinsResults = [
            Math.random() > 0.5 ? 1 : 0,
            Math.random() > 0.5 ? 1 : 0,
            Math.random() > 0.5 ? 1 : 0,
        ];

        // Animate them flipping
        const newStates = coinStates.map((prev, i) => {
            const targetFace = coinsResults[i];
            const requiredMod = targetFace === 1 ? 0 : 180;
            const currentTotal = prev.rotY;
            const targetTotal = currentTotal - (currentTotal % 360) + 1800 + requiredMod;

            return {
                rotY: targetTotal,
                face: targetFace
            };
        });

        setCoinStates(newStates);

        // Wait for the CSS transition to finish + a little dramatic pause
        setTimeout(() => {
            const heads = coinsResults.filter(c => c === 1).length;
            
            let type = 0;
            let moving = false;

            if (heads === 2) { 
                type = 0; moving = false; 
            } else if (heads === 1) { 
                type = 1; moving = false; 
            } else if (heads === 3) { 
                type = 1; moving = true; 
            } else { 
                type = 0; moving = true; 
            }

            const newLines = [...lines, { type, moving, coins: coinsResults }];
            setLines(newLines);
            setTossing(false);

            if (newLines.length === 6) {
                setTimeout(() => onComplete(newLines), 1000);
            }
        }, 1600);
    };

    const handleReset = () => {
        setLines([]);
        setCoinStates([
            { rotY: 0, face: 1 },
            { rotY: 0, face: 1 },
            { rotY: 0, face: 1 }
        ]);
    };

    return (
        <div className="flex flex-col items-center bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl shadow-lg border border-amber-100 w-full max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-amber-900 mb-8 font-serif">Gieo Quẻ Mai Hoa</h3>
            
            {/* 3D COINS ARENA */}
            <div className="flex gap-6 mb-10 w-full justify-center items-center h-32 coin-flip-container bg-black/5 rounded-2xl border-t-2 border-b-2 border-amber-200/50 shadow-inner">
                {coinStates.map((coin, index) => (
                    <div 
                        key={index} 
                        className="coin-3d"
                        style={{ transform: `rotateY(${coin.rotY}deg)` }}
                    >
                        {/* Mặt SẤP (Hình) */}
                        <div className="coin-face coin-heads">
                            <div className="coin-inner-square"></div>
                            <span className="coin-text-top">乾</span>
                            <span className="coin-text-bottom">隆</span>
                            <span className="coin-text-left">通</span>
                            <span className="coin-text-right">寶</span>
                        </div>
                        {/* Mặt NGỬA (Chữ) */}
                        <div className="coin-face coin-tails">
                            <div className="coin-inner-square"></div>
                            <span className="text-[20px] font-bold opacity-30">滿</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* LINES LIST */}
            <div className="flex flex-col-reverse gap-3 mb-8 w-64 items-center bg-white p-6 rounded-2xl shadow-inner border border-gray-200 relative">
                {lines.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-400 font-medium italic z-0 opacity-50">Khu vực hiển thị Hào</div>}
                
                {[...Array(6)].map((_, i) => {
                    const line = lines[i];
                    return (
                        <div key={i} className="flex items-center gap-4 w-full h-8 relative z-10">
                            <span className="text-gray-400 font-bold w-12 text-right text-sm">Hào {i + 1}</span>
                            <div className={`flex-1 flex justify-center items-center rounded-sm transition-all duration-500 overflow-hidden ${
                                !line ? 'border border-dashed border-gray-300' : ''
                            }`}>
                                {line ? (
                                    <div className="flex w-full h-full justify-between items-center transition-all scale-100">
                                        {line.type === 1 ? (
                                            <div className="w-full h-4 bg-amber-700 shadow-sm relative overflow-hidden">
                                                {line.moving && <div className="absolute inset-0 bg-red-500 animate-pulse opacity-50"></div>}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-[45%] h-4 bg-gray-800 shadow-sm relative overflow-hidden">
                                                    {line.moving && <div className="absolute inset-0 bg-red-500 animate-pulse opacity-50"></div>}
                                                </div>
                                                <div className="w-[45%] h-4 bg-gray-800 shadow-sm relative overflow-hidden">
                                                    {line.moving && <div className="absolute inset-0 bg-red-500 animate-pulse opacity-50"></div>}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div className="w-full border-t-2 border-dashed border-gray-200"></div>
                                )}
                            </div>
                            <span className="text-red-500 font-bold w-4 text-left text-sm">{line?.moving ? 'O' : ' '}</span>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex gap-4 w-full justify-center">
                 <button 
                    type="button"
                    onClick={handleToss} 
                    disabled={lines.length >= 6 || tossing}
                    className="flex-1 flex justify-center items-center gap-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 rounded-xl shadow-xl font-bold text-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Coins className={tossing ? 'animate-bounce' : ''} />
                    {tossing ? 'Đang tung...' : (lines.length < 6 ? `Gieo Hào ${lines.length + 1}` : 'Hoàn Tất')}
                </button>
                {lines.length > 0 && (
                     <button type="button" onClick={handleReset} disabled={tossing} className="px-6 py-4 flex items-center justify-center bg-white rounded-xl shadow border border-gray-200 hover:bg-gray-50 text-gray-700 transition-all hover:-translate-y-1 disabled:opacity-50 cursor-pointer">
                         <RotateCcw className={`w-5 h-5 ${tossing ? 'animate-spin' : ''}`} />
                     </button>
                )}
            </div>
        </div>
    );
};

// ==========================================
// 2. MAI HOA INPUT SUB-COMPONENT (MAI HOA DỊCH SỐ)
// ==========================================
const BRANCH_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tị',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const BRANCH_MAP = {
    '子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
    '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
};

const TRIGRAM_NAMES = {
    1: 'Càn (Thiên)', 2: 'Đoài (Trạch)', 3: 'Ly (Hỏa)', 4: 'Chấn (Lôi)',
    5: 'Tốn (Phong)', 6: 'Khảm (Thủy)', 7: 'Cấn (Sơn)', 8: 'Khôn (Địa)'
};

const TRIGRAM_LINES = {
    1: [1, 1, 1], 2: [1, 1, 0], 3: [1, 0, 1], 4: [1, 0, 0],
    5: [0, 1, 1], 6: [0, 1, 0], 7: [0, 0, 1], 8: [0, 0, 0]
};

const LUNAR_HOURS = [
    { index: 0, name: "Tý (23:00 - 00:59)", hour: 23 },
    { index: 1, name: "Sửu (01:00 - 02:59)", hour: 1 },
    { index: 2, name: "Dần (03:00 - 04:59)", hour: 3 },
    { index: 3, name: "Mão (05:00 - 06:59)", hour: 5 },
    { index: 4, name: "Thìn (07:00 - 08:59)", hour: 7 },
    { index: 5, name: "Tị (09:00 - 10:59)", hour: 9 },
    { index: 6, name: "Ngọ (11:00 - 12:59)", hour: 11 },
    { index: 7, name: "Mùi (13:00 - 14:59)", hour: 13 },
    { index: 8, name: "Thân (15:00 - 16:59)", hour: 15 },
    { index: 9, name: "Dậu (17:00 - 18:59)", hour: 17 },
    { index: 10, name: "Tuất (19:00 - 20:59)", hour: 19 },
    { index: 11, name: "Hợi (21:00 - 22:59)", hour: 21 }
];

function CustomSelect({ value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setSearch(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch(value || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  const filteredOptions = options.filter(opt => opt.includes(String(search)));

  const handleInputChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      if (placeholder === 'DD' || placeholder === 'Ngày') {
        if (num > 31) val = '31';
        if (num === 0) val = '1';
      } else if (placeholder === 'MM' || placeholder === 'Tháng') {
        if (num > 12) val = '12';
        if (num === 0) val = '1';
      } else if (placeholder === 'YYYY' || placeholder === 'Năm') {
        if (val.length >= 4 && num > 2100) val = '2100';
      } else if (placeholder === 'HH' || placeholder === 'Giờ') {
        if (num > 23) val = '23';
      } else if (placeholder === 'MM' || placeholder === 'Phút') {
        if (num > 59) val = '59';
      }
    }
    setSearch(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-base rounded-xl block w-full p-2.5 font-bold transition-all focus:outline-none pr-7 shadow-sm ${isOpen ? 'ring-2 ring-amber-500 border-amber-500' : ''}`}
        />
        <ChevronDown
          size={14}
          className="absolute right-2 top-3.5 text-amber-600 cursor-pointer shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-amber-100 rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto text-center font-bold">
          {filteredOptions.map(opt => (
            <li
              key={opt}
              onClick={() => {
                onChange(opt);
                setSearch(opt);
                setIsOpen(false);
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-amber-50 hover:text-amber-900 ${String(value) === String(opt) ? 'bg-amber-50 text-amber-800 font-extrabold' : 'text-gray-700'}`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const MaiHoaInput = ({ onComplete }) => {
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const years = Array.from({ length: 97 }, (_, i) => String(2026 - i));

    const now = new Date();
    const [subMethod, setSubMethod] = useState('datetime');
    const [year, setYear] = useState(() => String(now.getFullYear()));
    const [month, setMonth] = useState(() => String(now.getMonth() + 1));
    const [day, setDay] = useState(() => String(now.getDate()));

    useEffect(() => {
        if (day && month && year) {
            const maxDays = getMaxDaysInMonth(month, year);
            const dNum = parseInt(day, 10);
            if (!isNaN(dNum) && dNum > maxDays) {
                setDay(String(maxDays));
            }
        }
    }, [month, year, day]);

    const getInitialHourIndex = (hr) => {
        if (hr >= 23 || hr < 1) return 0;
        return Math.floor((hr - 1) / 2) + 1;
    };
    const [hourIndex, setHourIndex] = useState(() => getInitialHourIndex(now.getHours()));

    const [lunarDetail, setLunarDetail] = useState(null);
    const [serialStr, setSerialStr] = useState('');
    const [serialDetail, setSerialDetail] = useState(null);
    const [serialError, setSerialError] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (subMethod === 'datetime') {
            if (day || month || year) {
                const val = validateInputDate(day, month, year);
                if (!val.isValid) {
                    setErrorMsg(val.message);
                } else {
                    setErrorMsg('');
                }
            } else {
                setErrorMsg('');
            }
        }
    }, [day, month, year, subMethod]);

    useEffect(() => {
        if (subMethod === 'serial' && serialStr) {
            if (isNaN(Number(serialStr))) {
                setErrorMsg('Dãy số seri chỉ được nhập chữ số, không chứa chữ hoặc ký tự đặc biệt.');
            } else if (serialStr.trim().length !== 8) {
                setErrorMsg('Dãy số seri tiền/sim phải có đúng 8 chữ số (ví dụ: 12345678).');
            } else {
                setErrorMsg('');
            }
        } else if (subMethod === 'serial' && !serialStr) {
            setErrorMsg('');
        }
    }, [serialStr, subMethod]);

    const getDaysInMonth = (m, y) => {
        const parsedM = parseInt(m);
        const parsedY = parseInt(y);
        if (isNaN(parsedM) || isNaN(parsedY)) return 31;
        return new Date(parsedY, parsedM, 0).getDate();
    };
    const daysInMonth = getDaysInMonth(month, year);

    useEffect(() => {
        if (day > daysInMonth) {
            setDay(daysInMonth);
        }
    }, [month, year, daysInMonth, day]);

    useEffect(() => {
        if (!day || !month || !year) return;
        try {
            const solarHour = LUNAR_HOURS[hourIndex].hour;
            const dateObj = new Date(year, month - 1, day, solarHour, 0, 0);
            const solar = Solar.fromDate(dateObj);
            const lunar = solar.getLunar();

            const yearZhi = lunar.getYearZhi();
            const yearBranchName = BRANCH_VI[yearZhi] || yearZhi;
            const yearNum = BRANCH_MAP[yearZhi] || 1;

            const monthNum = Math.abs(lunar.getMonth());
            const dayNum = lunar.getDay();

            const hourZhi = lunar.getTimeZhi();
            const hourBranchName = BRANCH_VI[hourZhi] || hourZhi;
            const hourNum = BRANCH_MAP[hourZhi] || 1;

            const upperSum = yearNum + monthNum + dayNum;
            const upperVal = upperSum % 8 || 8;

            const lowerSum = yearNum + monthNum + dayNum + hourNum;
            const lowerVal = lowerSum % 8 || 8;

            const movingSum = yearNum + monthNum + dayNum + hourNum;
            const movingVal = movingSum % 6 || 6;

            const yearCanChi = lunar.getYearInGanZhiExact();
            const monthCanChi = lunar.getMonthInGanZhiExact();
            const dayCanChi = lunar.getDayInGanZhiExact();
            const hourCanChi = lunar.getEightChar().getTime();

            const toVietnamese = (str) => {
                const GAN_VI = {
                    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
                    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
                };
                let res = str;
                for (const [k, v] of Object.entries(GAN_VI)) res = res.replace(k, v + ' ');
                for (const [k, v] of Object.entries(BRANCH_VI)) res = res.replace(k, v);
                return res.trim();
            };

            setLunarDetail({
                lunarDateStr: `Ngày ${lunar.getDay()} tháng ${lunar.getMonth()} năm ${lunar.getYear()} Âm lịch`,
                canChiStr: `${toVietnamese(hourCanChi)} - ${toVietnamese(dayCanChi)} - ${toVietnamese(monthCanChi)} - ${toVietnamese(yearCanChi)}`,
                math: {
                    yearBranchName, yearNum,
                    monthNum,
                    dayNum,
                    hourBranchName, hourNum,
                    upperSum, upperVal,
                    lowerSum, lowerVal,
                    movingSum, movingVal
                }
            });
        } catch (err) {
            console.error(err);
        }
    }, [year, month, day, hourIndex]);

    useEffect(() => {
        if (subMethod !== 'serial') return;

        const cleaned = serialStr.trim();
        if (!cleaned) {
            setSerialDetail(null);
            setSerialError('');
            return;
        }

        if (!/^\d{8}$/.test(cleaned)) {
            setSerialDetail(null);
            setSerialError('Dãy số seri phải có độ dài đúng 8 chữ số (ví dụ: 12345678).');
            return;
        }

        setSerialError('');

        const digits = cleaned.split('').map(Number);
        const first4 = digits.slice(0, 4);
        const last4 = digits.slice(4, 8);

        const upperSum = first4.reduce((a, b) => a + b, 0);
        const upperVal = upperSum % 8 || 8;

        const lowerSum = last4.reduce((a, b) => a + b, 0);
        const lowerVal = lowerSum % 8 || 8;

        const movingSum = digits.reduce((a, b) => a + b, 0);
        const movingVal = movingSum % 6 || 6;

        setSerialDetail({
            serialStr: cleaned,
            digits,
            first4,
            last4,
            math: {
                upperSum,
                upperVal,
                lowerSum,
                lowerVal,
                movingSum,
                movingVal
            }
        });
    }, [serialStr, subMethod]);

    const handleSubmit = () => {
        if (subMethod === 'datetime') {
            if (!lunarDetail) return;
            const { math } = lunarDetail;
            
            const lowerLines = TRIGRAM_LINES[math.lowerVal];
            const upperLines = TRIGRAM_LINES[math.upperVal];
            
            const primaryLines = [...lowerLines, ...upperLines];
            const finalLines = primaryLines.map((type, idx) => ({
                type,
                moving: (idx === (math.movingVal - 1))
            }));

            const solarHour = LUNAR_HOURS[hourIndex].hour;
            const selectedDate = new Date(year, month - 1, day, solarHour, 0, 0);
            onComplete(finalLines, selectedDate, " (Phương pháp: Mai Hoa Dịch Số - Giờ Động Tâm)");
        } else {
            if (!serialDetail) return;
            const { math } = serialDetail;
            
            const lowerLines = TRIGRAM_LINES[math.lowerVal];
            const upperLines = TRIGRAM_LINES[math.upperVal];
            
            const primaryLines = [...lowerLines, ...upperLines];
            const finalLines = primaryLines.map((type, idx) => ({
                type,
                moving: (idx === (math.movingVal - 1))
            }));

            onComplete(finalLines, new Date(), ` (Phương pháp: Mai Hoa Dịch Số - Seri Tiền ${serialStr})`);
        }
    };

    return (
        <>
            <FloatingErrorToast message={errorMsg} onClose={() => setErrorMsg('')} />
            <div className="flex flex-col items-center w-full max-w-xl mx-auto">
                <h3 className="text-2xl font-bold text-amber-900 mb-4 font-serif">Gieo Quẻ Mai Hoa Dịch Số</h3>
            
            {/* Hướng dẫn ngắn */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-xs text-amber-955/80 mb-6 leading-relaxed flex items-start gap-2.5 shadow-sm w-full">
                <Sparkles size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                    <strong>Mai Hoa Dịch Số (Tiên Thiên):</strong> Quẻ được lập hoàn toàn dựa trên sự tương tác năng lượng tại thời điểm khởi sinh sự việc (Giờ Động Tâm hoặc thông qua dãy số ngẫu nhiên của Seri Tiền). Các số lý được tổng hợp để định nên Thượng Quái, Hạ Quái và Hào Động tương ứng.
                </div>
            </div>

            {/* Sub-tab selection */}
            <div className="flex gap-2.5 mb-6 w-full">
                <button
                    type="button"
                    onClick={() => setSubMethod('datetime')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer ${
                        subMethod === 'datetime'
                            ? 'border-amber-600 bg-amber-50/30 text-amber-900 shadow-sm'
                            : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Clock size={16} />
                    Giờ Động Tâm
                </button>
                <button
                    type="button"
                    onClick={() => setSubMethod('serial')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer ${
                        subMethod === 'serial'
                            ? 'border-amber-600 bg-amber-50/30 text-amber-900 shadow-sm'
                            : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Sparkles size={16} />
                    Seri Tiền (8 Số)
                </button>
            </div>

            {/* Form chọn ngày giờ động tâm hoặc nhập seri tiền */}
            <div className="w-full bg-white p-5 rounded-2xl border border-amber-50 shadow-sm space-y-4 mb-6">
                {subMethod === 'datetime' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-black text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <CalendarDays size={15} className="text-amber-700" />
                                Thời Điểm Động Tâm (Dương Lịch)
                            </label>
                            
                            <div className="flex gap-3">
                                {/* Ngày */}
                                <div className="flex-1">
                                    <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">NGÀY</span>
                                    <CustomSelect
                                        value={String(day)}
                                        onChange={setDay}
                                        options={days}
                                        placeholder="DD"
                                    />
                                </div>

                                {/* Tháng */}
                                <div className="flex-1">
                                    <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">THÁNG</span>
                                    <CustomSelect
                                        value={String(month)}
                                        onChange={setMonth}
                                        options={months}
                                        placeholder="MM"
                                    />
                                </div>

                                {/* Năm */}
                                <div className="flex-1">
                                    <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">NĂM</span>
                                    <CustomSelect
                                        value={String(year)}
                                        onChange={setYear}
                                        options={years}
                                        placeholder="YYYY"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Clock size={15} className="text-amber-700" />
                                Giờ Động Tâm Can Chi
                            </label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                                {LUNAR_HOURS.map((hr) => (
                                    <button
                                        key={hr.index}
                                        type="button"
                                        onClick={() => setHourIndex(hr.index)}
                                        className={`py-2.5 px-1 text-center rounded-xl border-2 font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                                            hourIndex === hr.index
                                                ? 'border-amber-600 bg-amber-50/40 text-amber-900 shadow-sm'
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

                        {lunarDetail && (
                            <div className="border-t border-dashed border-amber-100 pt-4 space-y-3">
                                <div className="bg-amber-50/30 px-3 py-2 rounded-lg text-xs font-bold text-amber-900 flex flex-col gap-1">
                                    <span className="text-[10px] text-amber-700 uppercase tracking-widest">Thời gian Âm lịch</span>
                                    <span>{lunarDetail.lunarDateStr}</span>
                                    <span className="text-slate-500 font-medium text-[11px]">{lunarDetail.canChiStr}</span>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl text-slate-700 space-y-2 border border-slate-100">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 mb-2">Công thức số lý động tâm</h4>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                        <div>Năm ({lunarDetail.math.yearBranchName}): <span className="font-extrabold text-amber-800">{lunarDetail.math.yearNum}</span></div>
                                        <div>Tháng: <span className="font-extrabold text-amber-800">{lunarDetail.math.monthNum}</span></div>
                                        <div>Ngày: <span className="font-extrabold text-amber-800">{lunarDetail.math.dayNum}</span></div>
                                        <div>Giờ ({lunarDetail.math.hourBranchName}): <span className="font-extrabold text-amber-800">{lunarDetail.math.hourNum}</span></div>
                                    </div>

                                    <div className="border-t border-slate-200/60 pt-2 space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Thượng Quái (Quẻ trên)</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({lunarDetail.math.yearNum} + {lunarDetail.math.monthNum} + {lunarDetail.math.dayNum}) % 8 = <span className="text-amber-800 font-black">{lunarDetail.math.upperVal}</span> ({TRIGRAM_NAMES[lunarDetail.math.upperVal]})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Hạ Quái (Quẻ dưới)</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({lunarDetail.math.yearNum} + {lunarDetail.math.monthNum} + {lunarDetail.math.dayNum} + {lunarDetail.math.hourNum}) % 8 = <span className="text-amber-800 font-black">{lunarDetail.math.lowerVal}</span> ({TRIGRAM_NAMES[lunarDetail.math.lowerVal]})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Hào Động</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({lunarDetail.math.yearNum} + {lunarDetail.math.monthNum} + {lunarDetail.math.dayNum} + {lunarDetail.math.hourNum}) % 6 = Hào <span className="text-amber-800 font-black">{lunarDetail.math.movingVal}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-black text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles size={15} className="text-amber-700" />
                                Nhập Dãy Số Seri Tiền (8 Chữ Số)
                            </label>
                            <input
                                type="text"
                                maxLength={8}
                                placeholder="Nhập 8 chữ số, ví dụ: 68688888"
                                value={serialStr}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setSerialStr(val);
                                }}
                                className="bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-lg rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 block w-full py-3.5 font-bold transition-all placeholder:text-slate-300 tracking-widest"
                            />
                            {serialError && (
                                <p className="text-xs text-red-500 font-semibold mt-1">{serialError}</p>
                            )}
                        </div>

                        {serialDetail && (
                            <div className="border-t border-dashed border-amber-100 pt-4 space-y-3">
                                <div className="bg-amber-50/30 px-3 py-2 rounded-lg text-xs font-bold text-amber-900 flex flex-col gap-1">
                                    <span className="text-[10px] text-amber-700 uppercase tracking-widest">Phương pháp gieo quẻ</span>
                                    <span>Mai Hoa Dịch Số theo Seri Tiền</span>
                                    <span className="text-slate-500 font-medium text-[11px]">Dãy số: {serialDetail.serialStr.split('').join(' - ')}</span>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl text-slate-700 space-y-2 border border-slate-100">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 mb-2">Công thức số lý động tâm</h4>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                        <div>4 Số đầu: <span className="font-extrabold text-amber-800">{serialDetail.first4.join(', ')}</span></div>
                                        <div>4 Số cuối: <span className="font-extrabold text-amber-800">{serialDetail.last4.join(', ')}</span></div>
                                    </div>

                                    <div className="border-t border-slate-200/60 pt-2 space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Thượng Quái (Quẻ trên)</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({serialDetail.first4.join(' + ')} = {serialDetail.math.upperSum}) % 8 = <span className="text-amber-800 font-black">{serialDetail.math.upperVal}</span> ({TRIGRAM_NAMES[serialDetail.math.upperVal]})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Hạ Quái (Quẻ dưới)</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({serialDetail.last4.join(' + ')} = {serialDetail.math.lowerSum}) % 8 = <span className="text-amber-800 font-black">{serialDetail.math.lowerVal}</span> ({TRIGRAM_NAMES[serialDetail.math.lowerVal]})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Hào Động</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({serialDetail.digits.join(' + ')} = {serialDetail.math.movingSum}) % 6 = Hào <span className="text-amber-800 font-black">{serialDetail.math.movingVal}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button 
                type="button"
                onClick={handleSubmit} 
                disabled={(subMethod === 'datetime' ? !lunarDetail : !serialDetail) || !!errorMsg}
                className="w-full flex justify-center items-center gap-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-955 text-white px-8 py-4 rounded-xl shadow-xl font-bold text-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
                <Settings2 />
                Lập Quẻ Mai Hoa
            </button>
        </div>
        </>
    );
};

// ==========================================
// 3. MANUAL INPUT SUB-COMPONENT (NHẬP HÀO THỦ CÔNG)
// ==========================================
export const ManualInput = ({ onComplete }) => {
    const [lines, setLines] = useState(
        Array(6).fill({ type: 1, moving: false })
    );

    const updateLine = (index, field, value) => {
        const newLines = [...lines];
        newLines[index] = { ...newLines[index], [field]: value };
        setLines(newLines);
    };

    const handleSubmit = () => {
        onComplete(lines);
    };

    return (
        <div className="flex flex-col items-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-slate-200 w-full max-w-xl mx-auto font-sans">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 font-serif">Nhập Hào Thủ Công</h3>
            
            <div className="flex flex-col gap-3 w-full mb-8">
                {[...Array(6)].map((_, idx) => {
                    const i = 5 - idx;
                    const line = lines[i];
                    return (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
                            <span className="font-bold text-slate-600 w-full sm:w-20 text-center sm:text-left">Hào {i + 1}</span>
                            
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                                <div className="flex bg-slate-100 p-1 rounded-full">
                                    <button
                                        type="button"
                                        onClick={() => updateLine(i, 'type', 1)}
                                        className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all cursor-pointer ${line.type === 1 ? 'bg-rose-400 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                    >Dương</button>
                                    <button
                                        type="button"
                                        onClick={() => updateLine(i, 'type', 0)}
                                        className={`px-4 py-1.5 rounded-full font-bold text-sm transition-all cursor-pointer ${line.type === 0 ? 'bg-sky-400 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
                                    >Âm</button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => updateLine(i, 'moving', !line.moving)}
                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-sm transition-all border cursor-pointer ${line.moving ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    <span className={`w-3 h-3 rounded-full transition-all ${line.moving ? 'bg-amber-400' : 'bg-slate-300'}`}></span>
                                    Hào Động
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <button 
                type="button"
                onClick={handleSubmit} 
                className="w-full flex justify-center items-center gap-3 bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-black text-white px-8 py-4 rounded-xl shadow-xl font-bold text-lg transition-all hover:-translate-y-1 cursor-pointer active:scale-95"
            >
                <Settings2 />
                Lập Quẻ Nhanh
            </button>
        </div>
    );
};

// ==========================================
// 4. UNIFIED ICHING INPUT CONTAINER COMPONENT
// ==========================================
export default function IChingInput({ 
    question, 
    setQuestion, 
    onComplete, 
    loading 
}) {
    const [mode, setMode] = useState('coin');

    return (
        <>
            {/* 1. SỰ VIỆC CẦN HỎI (Ý NIỆM) */}
            {!loading && (
                <div id="iching-input-header" className="max-w-xl mx-auto mb-10 bg-white p-6 rounded-2xl shadow-sm border border-amber-100 font-sans">
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

            {/* 2. KHUNG CHỌN PHƯƠNG PHÁP & THỰC HIỆN GIEO QUẺ */}
            <div className="max-w-xl mx-auto bg-white p-5 sm:p-8 rounded-3xl border border-amber-100 shadow-lg relative z-10 space-y-6 font-sans">
                <div className="flex bg-slate-100/80 p-0.5 sm:p-1 rounded-2xl border border-slate-200/40 w-full">
                    <button
                        type="button"
                        onClick={() => setMode('coin')}
                        disabled={loading}
                        className={`flex-1 py-2.5 sm:py-3.5 px-0.5 sm:px-3 rounded-xl font-bold text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs sm:text-sm transition-all whitespace-nowrap text-center cursor-pointer ${mode === 'coin' ? 'bg-white text-amber-900 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Gieo Đồng Xu
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('maihoa')}
                        disabled={loading}
                        className={`flex-1 py-2.5 sm:py-3.5 px-0.5 sm:px-3 rounded-xl font-bold text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs sm:text-sm transition-all whitespace-nowrap text-center cursor-pointer ${mode === 'maihoa' ? 'bg-white text-amber-900 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        Mai Hoa Dịch
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('manual')}
                        disabled={loading}
                        className={`flex-1 py-2.5 sm:py-3.5 px-0.5 sm:px-3 rounded-xl font-bold text-[10px] min-[360px]:text-[11px] min-[400px]:text-xs sm:text-sm transition-all whitespace-nowrap text-center cursor-pointer ${mode === 'manual' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
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
                        {mode === 'coin' && <CoinToss onComplete={onComplete} />}
                        {mode === 'maihoa' && <MaiHoaInput onComplete={onComplete} />}
                        {mode === 'manual' && <ManualInput onComplete={onComplete} />}
                    </div>
                )}
            </div>
        </>
    );
}
