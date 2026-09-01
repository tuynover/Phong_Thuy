import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

// UNIFIED COMBOBOX SELECTOR (BLUE THEME)
function CustomSelect({ value, onChange, options, placeholder, editable = true }) {
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

  const filteredOptions = options.filter(opt => {
    if (!editable || !search) return true;
    return String(opt).includes(String(search));
  });

  const handleInputChange = (e) => {
    if (!editable) return;
    let val = e.target.value;
    if (['DD', 'Ngày', 'MM', 'Tháng', 'YYYY', 'Năm', 'HH', 'Giờ', 'Min', 'Phút'].includes(placeholder)) {
      val = val.replace(/\D/g, '');
    }
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
      } else if (placeholder === 'Min' || placeholder === 'Phút') {
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
          readOnly={!editable}
          placeholder={placeholder}
          className={`bg-gray-50 border border-gray-200 text-center text-gray-905 text-base rounded-xl block w-full p-2.5 font-bold transition-all focus:outline-none pr-8 shadow-sm cursor-pointer ${isOpen ? 'ring-2 ring-blue-550 border-blue-550' : ''}`}
        />
        <ChevronDown
          size={14}
          className="absolute right-2 top-4 text-blue-500 cursor-pointer shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-blue-100 rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto text-center font-bold">
          {filteredOptions.map(opt => (
            <li
              key={opt}
              onClick={() => {
                onChange(opt);
                setSearch(opt);
                setIsOpen(false);
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer transition-colors hover:bg-blue-50 hover:text-blue-900 ${value === opt ? 'bg-blue-50 text-blue-800 font-extrabold' : 'text-gray-700'}`}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { validateInputDate, getMaxDaysInMonth } from '../utils/dateValidator';

import FloatingErrorToast from './FloatingErrorToast';

import { LunarYear, LunarMonth } from 'lunar-javascript';

const BaziInput = ({ onComplete }) => {
    const [calendarMode, setCalendarMode] = useState('solar'); // solar | lunar | manual
    
    // Solar & Lunar States
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [isLeap, setIsLeap] = useState(false);
    const [hasLeap, setHasLeap] = useState(false);

    // Manual States
    const [manualYear, setManualYear] = useState('');
    const [manualYearGan, setManualYearGan] = useState('');
    const [manualYearZhi, setManualYearZhi] = useState('');
    const [manualMonthGan, setManualMonthGan] = useState('');
    const [manualMonthZhi, setManualMonthZhi] = useState('');
    const [manualDayGan, setManualDayGan] = useState('');
    const [manualDayZhi, setManualDayZhi] = useState('');
    const [manualHourGan, setManualHourGan] = useState('');
    const [manualHourZhi, setManualHourZhi] = useState('');

    const [gender, setGender] = useState(1); // 1 = Nam, 0 = Nữ
    const [name, setName] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const stems = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
    const zhis = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const YANG_STEMS = ['Giáp', 'Bính', 'Mậu', 'Canh', 'Nhâm'];
    const YANG_ZHIS = ['Tý', 'Dần', 'Thìn', 'Ngọ', 'Thân', 'Tuất'];
    const AM_ZHIS = ['Sửu', 'Mão', 'Tỵ', 'Mùi', 'Dậu', 'Hợi'];

    // Lọc chi khả dụng dựa vào can (Dương đi với Dương, Âm đi với Âm)
    const getZhiOptionsForStem = (stem) => {
        if (!stem) return zhis;
        return YANG_STEMS.includes(stem) ? YANG_ZHIS : AM_ZHIS;
    };
    // Lọc can khả dụng dựa vào chi
    const getStemOptionsForZhi = (zhi) => {
        if (!zhi) return stems;
        return YANG_ZHIS.includes(zhi) ? YANG_STEMS : stems.filter(s => !YANG_STEMS.includes(s));
    };

    // Auto-check lunar leap month
    useEffect(() => {
        if (calendarMode === 'lunar' && year && month) {
            try {
                const ly = LunarYear.fromYear(parseInt(year, 10));
                const leapMonth = ly ? ly.getLeapMonth() : 0;
                const isCandidate = leapMonth > 0 && parseInt(month, 10) === leapMonth;
                setHasLeap(isCandidate);
                if (!isCandidate) setIsLeap(false);
            } catch (e) {
                setHasLeap(false);
                setIsLeap(false);
            }
        } else {
            setHasLeap(false);
            setIsLeap(false);
        }
    }, [calendarMode, year, month]);

    // Auto-clamp Day when Month or Year changes
    useEffect(() => {
        if (day && month && year) {
            let maxDays = 31;
            if (calendarMode === 'lunar') {
                try {
                    const lm = LunarMonth.fromYm(parseInt(year, 10), isLeap ? -parseInt(month, 10) : parseInt(month, 10));
                    maxDays = lm ? lm.getDayCount() : 30;
                } catch (e) {
                    maxDays = 30;
                }
            } else {
                maxDays = getMaxDaysInMonth(month, year);
            }
            const dNum = parseInt(day, 10);
            if (!isNaN(dNum) && dNum > maxDays) {
                setDay(String(maxDays));
            }
        }
    }, [calendarMode, month, year, day, isLeap]);

    // Real-time dynamic validation for Solar/Lunar mode
    useEffect(() => {
        if (calendarMode !== 'manual' && (day || month || year || hour || minute)) {
            const val = validateInputDate(day, month, year, hour, minute);
            if (!val.isValid) {
                setErrorMsg(val.message);
            } else {
                setErrorMsg('');
            }
        } else {
            setErrorMsg('');
        }
    }, [calendarMode, day, month, year, hour, minute]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg('');
        
        if (calendarMode === 'manual') {
            if (!manualYear || !manualYearGan || !manualYearZhi || !manualMonthGan || !manualMonthZhi || !manualDayGan || !manualDayZhi || !manualHourGan || !manualHourZhi) {
                setErrorMsg('Vui lòng chọn đầy đủ 8 ô Can Chi và Năm sinh dương lịch.');
                return;
            }
            const yNum = parseInt(manualYear, 10);
            if (isNaN(yNum) || yNum < 1900 || yNum > 2100) {
                setErrorMsg('Năm sinh dương lịch phải nằm trong khoảng từ 1900 đến 2100.');
                return;
            }

            onComplete(null, null, gender, name, {
                calendarMode: 'manual',
                birthSolarYear: yNum,
                manualData: {
                    yearGan: manualYearGan,
                    yearZhi: manualYearZhi,
                    monthGan: manualMonthGan,
                    monthZhi: manualMonthZhi,
                    dayGan: manualDayGan,
                    dayZhi: manualDayZhi,
                    hourGan: manualHourGan,
                    hourZhi: manualHourZhi
                }
            });
            return;
        }

        if (!day || !month || !year || !hour || !minute) {
            setErrorMsg('Vui lòng chọn đầy đủ ngày, tháng, năm, giờ và phút sinh.');
            return;
        }

        const dNum = parseInt(day, 10);
        const mNum = parseInt(month, 10);
        const yNum = parseInt(year, 10);
        const hNum = parseInt(hour, 10);
        const minNum = parseInt(minute, 10);

        if (isNaN(dNum) || isNaN(mNum) || isNaN(yNum) || isNaN(hNum) || isNaN(minNum)) {
            setErrorMsg('Vui lòng nhập ngày giờ sinh hợp lệ.');
            return;
        }

        if (yNum < 1900 || yNum > 2100) {
            setErrorMsg('Năm sinh phải nằm trong khoảng từ 1900 đến 2100.');
            return;
        }

        if (calendarMode === 'solar') {
            const testDate = new Date(Date.UTC(yNum, mNum - 1, dNum));
            if (testDate.getUTCFullYear() !== yNum || (testDate.getUTCMonth() + 1) !== mNum || testDate.getUTCDate() !== dNum) {
                setErrorMsg(`Ngày sinh ${dNum}/${mNum}/${yNum} không tồn tại trên thực tế.`);
                return;
            }

            if (testDate.getTime() > Date.now()) {
                setErrorMsg('Ngày sinh không thể nằm ở tương lai.');
                return;
            }
        }

        if (hNum < 0 || hNum > 23 || minNum < 0 || minNum > 59) {
            setErrorMsg('Giờ sinh (0-23h) hoặc phút sinh (0-59m) không hợp lệ.');
            return;
        }

        const d = String(day).padStart(2, '0');
        const m = String(month).padStart(2, '0');
        const y = String(year);
        const h = String(hour).padStart(2, '0');
        const min = String(minute).padStart(2, '0');

        const formattedDate = `${d}/${m}/${y}`;
        const formattedTime = `${h}:${min}`;
        
        onComplete(formattedDate, formattedTime, gender, name, {
            calendarMode,
            isLeap
        });
    };

    // Arrays of options
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const years = Array.from({ length: 127 }, (_, i) => String(2026 - i)); // Nới rộng đến 127 năm
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    const isSubmitDisabled = () => {
        if (!!errorMsg) return true;
        if (calendarMode === 'manual') {
            return !manualYear || !manualYearGan || !manualYearZhi || !manualMonthGan || !manualMonthZhi || !manualDayGan || !manualDayZhi || !manualHourGan || !manualHourZhi;
        }
        return !day || !month || !year || !hour || !minute;
    };

    return (
        <>
            <FloatingErrorToast message={errorMsg} onClose={() => setErrorMsg('')} />
            <div className="flex flex-col items-center bg-white/95 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-200/80 max-w-3xl mx-auto font-sans">
                <h3 id="bazi-input-header" className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Nhập Thông Tin Bát Tự</h3>
                <p className="text-slate-500 mb-8 text-center text-sm md:text-base leading-relaxed">Hệ thống phân tích Tứ Trụ Tử Bình hỗ trợ cả Dương lịch, Âm lịch và nhập thủ công 8 chữ Can Chi để an sao cải vận.</p>

                {/* TAB SELECTOR */}
                <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full max-w-md mx-auto mb-8 border border-slate-200/50 shadow-inner">
                    <button type="button" onClick={() => setCalendarMode('solar')} className={`flex-1 text-center py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${calendarMode === 'solar' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>Dương lịch</button>
                    <button type="button" onClick={() => setCalendarMode('lunar')} className={`flex-1 text-center py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${calendarMode === 'lunar' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>Âm lịch</button>
                    <button type="button" onClick={() => setCalendarMode('manual')} className={`flex-1 text-center py-2.5 rounded-xl text-sm font-extrabold transition-all duration-300 ${calendarMode === 'manual' ? 'bg-white text-blue-600 shadow-md shadow-blue-500/5 scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>Thủ công</button>
                </div>

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                
                {/* Họ và tên */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Họ và Tên (Không bắt buộc)</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nhập họ và tên..."
                        className="bg-gray-50 border border-gray-200 text-gray-905 text-base rounded-2xl block w-full p-3 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                </div>

                {/* Giới tính */}
                <div>
                    <label id="bazi-input-gender" className="block text-sm font-bold text-gray-700 mb-3">Giới Tính (Quyết định chiều Đại Vận)</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${gender === 1 ? 'border-blue-500 bg-blue-50/30 text-blue-700 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <input type="radio" name="gender" value={1} checked={gender === 1} onChange={() => setGender(1)} className="hidden" />
                            <User className="w-5 h-5" /> Nam Mệnh
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${gender === 0 ? 'border-rose-500 bg-rose-50/30 text-rose-700 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <input type="radio" name="gender" value={0} checked={gender === 0} onChange={() => setGender(0)} className="hidden" />
                            <User className="w-5 h-5" /> Nữ Mệnh
                        </label>
                    </div>
                </div>

                {calendarMode !== 'manual' ? (
                    <>
                        {/* Ngày tháng năm */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" /> Ngày - Tháng - Năm Sinh ({calendarMode === 'solar' ? 'Dương lịch' : 'Âm lịch'})
                            </label>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">NGÀY</span>
                                    <CustomSelect
                                      value={day}
                                      onChange={setDay}
                                      options={days}
                                      placeholder="DD"
                                    />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">THÁNG</span>
                                    <CustomSelect
                                      value={month}
                                      onChange={setMonth}
                                      options={months}
                                      placeholder="MM"
                                    />
                                </div>
                                <div className="flex-[1.5]">
                                    <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">NĂM</span>
                                    <CustomSelect
                                      value={year}
                                      onChange={setYear}
                                      options={years}
                                      placeholder="YYYY"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Switch Tháng nhuận cho Âm lịch */}
                        {calendarMode === 'lunar' && hasLeap && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="checkbox"
                                    id="isLeap"
                                    checked={isLeap}
                                    onChange={(e) => setIsLeap(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="isLeap" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                                    Sinh vào tháng nhuận (Tháng {month} nhuận)
                                </label>
                            </div>
                        )}

                        {/* Giờ phút */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" /> Thời Gian Sinh
                            </label>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">GIỜ (0-23)</span>
                                    <CustomSelect
                                      value={hour}
                                      onChange={setHour}
                                      options={hours}
                                      placeholder="HH"
                                    />
                                </div>
                                <div className="flex items-center pt-5 font-black text-gray-400 text-xl">:</div>
                                <div className="flex-1">
                                    <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">PHÚT (0-59)</span>
                                    <CustomSelect
                                      value={minute}
                                      onChange={setMinute}
                                      options={minutes}
                                      placeholder="Min"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* NHẬP THỦ CÔNG 8 Ô CAN CHI */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-blue-500" /> Nhập Thủ Công 8 Chữ Bát Tự (Dương đi với Dương, Âm đi với Âm)
                            </label>

                            <div className="grid grid-cols-4 gap-4 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 shadow-inner">
                                {/* Trụ Giờ */}
                                <div className="space-y-3">
                                    <span className="block text-xs font-black text-slate-500 text-center uppercase tracking-widest">Trụ Giờ</span>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">CAN GIỜ</span>
                                        <CustomSelect
                                          value={manualHourGan}
                                          onChange={(val) => {
                                              setManualHourGan(val);
                                              // Tự động reset chi nếu ko đồng hành
                                              if (val && manualHourZhi && !getZhiOptionsForStem(val).includes(manualHourZhi)) {
                                                  setManualHourZhi('');
                                              }
                                          }}
                                          options={getStemOptionsForZhi(manualHourZhi)}
                                          placeholder="Can"
                                          editable={false}
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">CHI GIỜ</span>
                                        <CustomSelect
                                          value={manualHourZhi}
                                          onChange={(val) => {
                                              setManualHourZhi(val);
                                              if (val && manualHourGan && !getStemOptionsForZhi(val).includes(manualHourGan)) {
                                                  setManualHourGan('');
                                              }
                                          }}
                                          options={getZhiOptionsForStem(manualHourGan)}
                                          placeholder="Chi"
                                          editable={false}
                                        />
                                    </div>
                                </div>

                                {/* Trụ Ngày */}
                                <div className="space-y-3">
                                    <span className="block text-xs font-black text-slate-500 text-center uppercase tracking-widest">Trụ Ngày</span>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">CAN NGÀY</span>
                                        <CustomSelect
                                          value={manualDayGan}
                                          onChange={(val) => {
                                              setManualDayGan(val);
                                              if (val && manualDayZhi && !getZhiOptionsForStem(val).includes(manualDayZhi)) {
                                                  setManualDayZhi('');
                                              }
                                          }}
                                          options={getStemOptionsForZhi(manualDayZhi)}
                                          placeholder="Can"
                                          editable={false}
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">CHI NGÀY</span>
                                        <CustomSelect
                                          value={manualDayZhi}
                                          onChange={(val) => {
                                              setManualDayZhi(val);
                                              if (val && manualDayGan && !getStemOptionsForZhi(val).includes(manualDayGan)) {
                                                  setManualDayGan('');
                                              }
                                          }}
                                          options={getZhiOptionsForStem(manualDayGan)}
                                          placeholder="Chi"
                                          editable={false}
                                        />
                                    </div>
                                </div>

                                {/* Trụ Tháng */}
                                <div className="space-y-3">
                                    <span className="block text-xs font-black text-slate-500 text-center uppercase tracking-widest">Trụ Tháng</span>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">CAN THÁNG</span>
                                        <CustomSelect
                                          value={manualMonthGan}
                                          onChange={(val) => {
                                              setManualMonthGan(val);
                                              if (val && manualMonthZhi && !getZhiOptionsForStem(val).includes(manualMonthZhi)) {
                                                  setManualMonthZhi('');
                                              }
                                          }}
                                          options={getStemOptionsForZhi(manualMonthZhi)}
                                          placeholder="Can"
                                          editable={false}
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">CHI THÁNG</span>
                                        <CustomSelect
                                          value={manualMonthZhi}
                                          onChange={(val) => {
                                              setManualMonthZhi(val);
                                              if (val && manualMonthGan && !getStemOptionsForZhi(val).includes(manualMonthGan)) {
                                                  setManualMonthGan('');
                                              }
                                          }}
                                          options={getZhiOptionsForStem(manualMonthGan)}
                                          placeholder="Chi"
                                          editable={false}
                                        />
                                    </div>
                                </div>

                                {/* Trụ Năm */}
                                <div className="space-y-3">
                                    <span className="block text-xs font-black text-slate-500 text-center uppercase tracking-widest">Trụ Năm</span>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">CAN NĂM</span>
                                        <CustomSelect
                                          value={manualYearGan}
                                          onChange={(val) => {
                                              setManualYearGan(val);
                                              if (val && manualYearZhi && !getZhiOptionsForStem(val).includes(manualYearZhi)) {
                                                  setManualYearZhi('');
                                              }
                                          }}
                                          options={getStemOptionsForZhi(manualYearZhi)}
                                          placeholder="Can"
                                          editable={false}
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">CHI NĂM</span>
                                        <CustomSelect
                                          value={manualYearZhi}
                                          onChange={(val) => {
                                              setManualYearZhi(val);
                                              if (val && manualYearGan && !getStemOptionsForZhi(val).includes(manualYearGan)) {
                                                  setManualYearGan('');
                                              }
                                          }}
                                          options={getZhiOptionsForStem(manualYearGan)}
                                          placeholder="Chi"
                                          editable={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Năm sinh dương lịch */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-500" /> Năm Sinh Dương Lịch (Bắt buộc để tính Vận Tinh)
                            </label>
                            <input
                                type="text"
                                value={manualYear}
                                onChange={(e) => setManualYear(e.target.value.replace(/\D/g, ''))}
                                placeholder="Nhập năm sinh dương lịch (ví dụ: 1995)"
                                maxLength={4}
                                className="bg-gray-50 border border-gray-200 text-gray-905 text-base rounded-2xl block w-full p-3 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            />
                        </div>
                    </>
                )}

                <div className="pt-6">
                    <button 
                        type="submit"
                        disabled={isSubmitDisabled()}
                        className="w-full flex justify-center items-center py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/25 text-lg font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer"
                    >
                        Lập Lá Số & Phân Tích
                    </button>
                </div>
            </form>


            {/* Academic Informational Cards & FAQs */}
            <div className="mt-10 border-t border-slate-100 pt-8 w-full space-y-8 text-left font-sans">
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-blue-50 shadow-sm space-y-6">
                <h4 className="text-sm font-extrabold text-blue-800 uppercase tracking-widest text-center">Kiến thức học thuật Bát Tự</h4>
                
                <div className="space-y-6">
                  {/* Item 1 */}
                  <div className="border-b border-slate-100 pb-5">
                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-blue-600 block"></span>
                      1. Bát Tự Tứ Trụ là gì?
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Tứ Trụ Bát Tự là hệ thống dự đoán mệnh lý Đông Phương dựa trên Giờ, Ngày, Tháng, Năm sinh dương lịch quy đổi sang Can Chi tiết khí. Gồm 8 chữ (4 Thiên Can, 4 Địa Chi) đại diện cho phân bổ năng lượng Ngũ Hành bản nguyên.
                    </p>
                    <ul className="list-disc pl-8 text-xs text-slate-500 space-y-1 font-medium">
                      <li><strong>Thiên Can (10):</strong> Giáp, Ất, Bính, Đinh, Mậu, Kỷ, Canh, Tân, Nhâm, Quý. Phản ánh năng lượng bên ngoài lộ diện.</li>
                      <li><strong>Địa Chi (12):</strong> Tí, Sửu, Dần, Mão, Thìn, Tỵ, Ngọ, Mùi, Thân, Dậu, Tuất, Hợi. Phản ánh thực thể, căn cơ ẩn giấu.</li>
                    </ul>
                  </div>

                  {/* Item 2 */}
                  <div className="border-b border-slate-100 pb-5">
                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-blue-600 block"></span>
                      2. Quy trình phân tích Tứ Trụ chuyên sâu
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Phương pháp xem Tử Bình chuyên nghiệp bao gồm các bước:
                    </p>
                    <ul className="list-disc pl-8 text-xs text-slate-500 space-y-1.5 font-medium">
                      <li><strong>Nhật Can (Mệnh chủ):</strong> Thiên can ngày sinh là đại diện cho bạn. Các Can Chi còn lại tương tác với Nhật Can để phân định Mệnh Cách.</li>
                      <li><strong>Xác định Thể Vượng Suy:</strong> Đo lường năng lượng tương tác ngũ hành để xác định Nhật Can là Vượng, Nhược, hay tòng cách cực đoan.</li>
                      <li><strong>Định vị Dụng Thần & Hỷ Thần:</strong> Tìm ra ngũ hành có nhiệm vụ cân bằng, hòa giải xung đột cho lá số (Ví dụ: Thân nhược cần Ấn/Tỷ, Thân vượng cần Quan/Sát/Thực/Tài).</li>
                    </ul>
                  </div>

                  {/* Item 3 */}
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-blue-600 block"></span>
                      3. Bản phân tích học thuật cung cấp chi tiết gì?
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Hệ thống luận giải chuyên sâu cung cấp báo cáo chi tiết bao gồm các mục học thuật:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3.5 mt-3">
                      <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/50">
                        <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">✓ Phân tích Thập Thần</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Phân tích mối quan hệ giữa Mệnh chủ với Chính Tài, Thiên Tài, Chính Quan, Thiên Quan... định hình năng lực xã hội.</span>
                      </div>
                      <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/50">
                        <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">✓ Vận trình Đại Vận 10 năm</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Biểu đồ thăng trầm của các giai đoạn cuộc đời lớn giúp bạn chủ động chuẩn bị nắm bắt hoặc phòng thủ.</span>
                      </div>
                      <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/50">
                        <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">✓ Phương án Cải Vận</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Lời khuyên ứng dụng Dụng Thần qua màu sắc bổ trợ, phương hướng phong thủy, ngành nghề tối ưu.</span>
                      </div>
                      <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/50">
                        <span className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">✓ Thần Sát luận cát hung</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Xác định các sao tốt/xấu ảnh hưởng bản mệnh như Thiên Ất Quý Nhân, Văn Xương Tinh, Cô Thần, Quả Tú.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQs section */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
                <h4 className="text-sm font-extrabold text-blue-800 uppercase tracking-widest text-center">Các câu hỏi thường gặp về Bát Tự</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                      <HelpCircle size={15} className="text-blue-600 shrink-0" />
                      Nếu không nhớ chính xác giờ sinh thì có lập được lá số Bát Tự không?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                      Có thể lập được dựa trên Ngày, Tháng, Năm sinh (gọi là Tam Trụ). Tuy nhiên, thiếu Trụ Giờ sẽ làm giảm độ chính xác khoảng 25-30% vì giờ sinh quyết định cung con cái và hậu vận tuổi già.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                      <HelpCircle size={15} className="text-blue-600 shrink-0" />
                      Nhật Can là gì và tại sao nó lại quan trọng nhất trong Bát Tự?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                      Nhật Can (Thiên can của ngày sinh) đại diện cho chính bản thể cốt lõi của bạn. Toàn bộ các tương tác sinh khắc chế hóa của các can chi khác trong lá số đều xoay quanh việc hỗ trợ hay kìm hãm Nhật Can này, quyết định tính cách và tài lộc.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                      <HelpCircle size={15} className="text-blue-600 shrink-0" />
                      Dụng Thần và Hỷ Thần giúp ích gì cho cuộc sống thực tế?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                      Dụng Thần và Hỷ Thần là các hành ngũ hành giúp cân bằng năng lượng lá số của bạn. Bạn có thể ứng dụng qua màu sắc trang phục, hướng làm việc, nghề nghiệp hoặc vật phẩm phong thủy bổ trợ để chủ động tăng cát khí, chiêu tài đón lộc.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
    );
};

export default BaziInput;
