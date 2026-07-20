import React, { useState, useEffect, useRef } from 'react';
import { checkAuspiciousDate, consultAuspiciousDates } from '../services/api';
import { Calendar, Clock, ArrowRight, ArrowUp, ArrowDown, CheckCircle2, AlertTriangle, XCircle, Info, Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const ACTIVITIES = [
  { id: 'cuoi_hoi', name: 'Cưới hỏi, dạm ngõ' },
  { id: 'khai_truong', name: 'Khai trương, mở cửa hàng' },
  { id: 'dong_tho', name: 'Động thổ, đào móng' },
  { id: 'do_mai', name: 'Đổ mái, cất nóc, lên xà' },
  { id: 'nhap_trach', name: 'Nhập trạch, lên nhà mới' },
  { id: 'xuat_hanh', name: 'Xuất hành, đi xa' },
  { id: 'ky_hop_dong', name: 'Ký hợp đồng, giao dịch' },
  { id: 'cau_phuc', name: 'Tế tự, cầu phúc' },
  { id: 'an_tang', name: 'An táng, cải táng' }
];

// CUSTOM DATE PICKER COMPONENT - Requirement 2
function CustomDatePicker({ value, onChange, minDate, maxDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedDate = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(selectedDate);
  
  useEffect(() => {
    if (value) setViewDate(new Date(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const prevMonthDays = new Date(viewDate.getFullYear(), viewDate.getMonth(), 0).getDate();

  const selectDate = (day) => {
    const newD = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const y = newD.getFullYear();
    const m = String(newD.getMonth() + 1).padStart(2, '0');
    const d = String(newD.getDate()).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
    setIsOpen(false);
  };

  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const cells = [];
  
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ day: i, isCurrentMonth: true });
  }
  const totalCells = 42;
  const nextMonthPadding = totalCells - cells.length;
  for (let i = 1; i <= nextMonthPadding; i++) {
    cells.push({ day: i, isCurrentMonth: false });
  }

  const displayValue = () => {
    if (!value) return '';
    const parts = value.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-gray-700 bg-slate-50/40 text-sm focus:outline-none transition-all flex items-center justify-between shadow-sm"
      >
        <span>{displayValue()}</span>
        <Calendar size={16} className="text-emerald-800" />
      </button>
      {isOpen && (
        <div className="absolute z-[999] mt-2 p-4 bg-white border border-gray-150 rounded-2xl shadow-xl w-[280px] sm:w-[300px] left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
              <ChevronDown size={16} className="rotate-90" />
            </button>
            <span className="font-extrabold text-sm text-neutral-800">Tháng {viewDate.getMonth() + 1} - {viewDate.getFullYear()}</span>
            <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
              <ChevronDown size={16} className="-rotate-90" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {daysOfWeek.map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-gray-400 uppercase">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {cells.map((cell, idx) => {
              let isDisabled = !cell.isCurrentMonth;
              if (cell.isCurrentMonth) {
                const dateStr = viewDate.getFullYear() + '-' + 
                  String(viewDate.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(cell.day).padStart(2, '0');
                if (minDate && dateStr < minDate) isDisabled = true;
                if (maxDate && dateStr > maxDate) isDisabled = true;
              }

              const isSelected = cell.isCurrentMonth && 
                selectedDate.getDate() === cell.day && 
                selectedDate.getMonth() === viewDate.getMonth() && 
                selectedDate.getFullYear() === viewDate.getFullYear();
              
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isDisabled && selectDate(cell.day)}
                  disabled={isDisabled}
                  className={`h-7 w-7 text-xs rounded-full flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-emerald-800 text-white font-bold' 
                      : !isDisabled 
                        ? 'hover:bg-emerald-50 text-neutral-700 hover:text-emerald-900' 
                        : 'text-gray-300 pointer-events-none bg-gray-50/50 cursor-not-allowed'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// CUSTOM YEAR PICKER COMBOBOX - Requirement 3
function CustomYearPicker({ value, onChange }) {
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

  const years = [];
  for (let y = 2026; y >= 1930; y--) {
    years.push(String(y));
  }

  const filteredYears = years.filter(y => y.includes(search));

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder="Chọn hoặc nhập năm"
          className="w-full px-4 py-3 border-2 border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-gray-700 bg-slate-50/40 text-sm focus:outline-none transition-all pr-10 shadow-sm"
        />
        <ChevronDown
          size={16}
          className={`absolute right-3.5 top-3.5 text-emerald-800 cursor-pointer transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {isOpen && filteredYears.length > 0 && (
        <ul className="absolute z-50 w-full mt-1.5 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredYears.map(y => (
            <li
              key={y}
              onClick={() => {
                onChange(y);
                setSearch(y);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-emerald-50 hover:text-emerald-900 ${value === y ? 'bg-emerald-50/70 text-emerald-800 font-extrabold' : 'text-gray-700'}`}
            >
              Năm {y}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// CUSTOM HOUR SELECTOR (24H Format) - Requirement 3
function CustomHourPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hours = [];
  for (let h = 0; h < 24; h++) {
    hours.push(`${String(h).padStart(2, '0')}:00`);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border-2 border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-gray-700 bg-slate-50/40 text-sm focus:outline-none transition-all flex items-center justify-between shadow-sm"
      >
        <span>{value}</span>
        <Clock size={16} className="text-emerald-800" />
      </button>
      {isOpen && (
        <ul className="absolute z-50 w-full mt-1.5 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {hours.map(h => (
            <li
              key={h}
              onClick={() => {
                onChange(h);
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-emerald-50 hover:text-emerald-900 ${value === h ? 'bg-emerald-50/70 text-emerald-800 font-extrabold' : 'text-gray-700'}`}
            >
              {h}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function DateSelectionBoard({ user }) {
  const [activeTab, setActiveTab] = useState('check'); // 'check' | 'consult'

  const getHourClassifications = (hoursList) => {
    if (!hoursList || hoursList.length === 0) return { best: [], backup: [] };
    
    // Sort so "Rất tốt" is prioritized over "Nên"
    const sorted = [...hoursList].sort((a, b) => {
      if (a.rating === 'Rất tốt' && b.rating !== 'Rất tốt') return -1;
      if (a.rating !== 'Rất tốt' && b.rating === 'Rất tốt') return 1;
      return 0;
    });

    // Take top 2 as best, the rest as backup
    return {
      best: sorted.slice(0, 2),
      backup: sorted.slice(2)
    };
  };
  
  // Shared States (synchronized and persisted)
  const [birthYear, setBirthYear] = useState(() => {
    return localStorage.getItem('xemngay_birthYear') || (user?.baziInfo?.year ? String(user.baziInfo.year) : '');
  });
  const [activity, setActivity] = useState(() => {
    return localStorage.getItem('xemngay_activity') || 'cuoi_hoi';
  });

  // Tab 1: Xem ngày
  const [solarDate, setSolarDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [solarHour, setSolarHour] = useState('12:00');
  const [checkResult, setCheckResult] = useState(null);

  // Tab 2: Tư vấn ngày hoàng đạo
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // Default to 30 days range
    return date.toISOString().split('T')[0];
  });
  const [consultResult, setConsultResult] = useState(null);

  // Filter & Pagination States
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all' | 'Rất tốt' | 'Nên' | 'Bình hòa' | 'Không nên' | 'Không được'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const resultsTopRef = useRef(null);

  const scrollToResults = () => {
    setTimeout(() => {
      if (resultsTopRef.current) {
        resultsTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // Help/Accordion state
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  // Custom Dropdowns states & refs
  const [isCheckActivityOpen, setIsCheckActivityOpen] = useState(false);
  const [isConsultActivityOpen, setIsConsultActivityOpen] = useState(false);
  
  const checkDropdownRef = useRef(null);
  const consultDropdownRef = useRef(null);

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (checkDropdownRef.current && !checkDropdownRef.current.contains(event.target)) {
        setIsCheckActivityOpen(false);
      }
      if (consultDropdownRef.current && !consultDropdownRef.current.contains(event.target)) {
        setIsConsultActivityOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Persist shared states
  useEffect(() => {
    localStorage.setItem('xemngay_birthYear', birthYear);
  }, [birthYear]);

  useEffect(() => {
    localStorage.setItem('xemngay_activity', activity);
  }, [activity]);

  // Synchronize birth year from user profile if changed
  useEffect(() => {
    if (user?.baziInfo?.year && !birthYear) {
      setBirthYear(String(user.baziInfo.year));
    }
  }, [user]);

  const handleCheck = async (e) => {
    if (e) e.preventDefault();
    if (!birthYear) {
      setError('Vui lòng nhập năm sinh.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await checkAuspiciousDate(birthYear, solarDate, solarHour, activity);
      setCheckResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Đã xảy ra lỗi khi tính toán ngày.');
    }
    setLoading(false);
  };

  const handleConsult = async (e) => {
    if (e) e.preventDefault();
    if (!birthYear) {
      setError('Vui lòng nhập năm sinh.');
      return;
    }
    setLoading(true);
    setError(null);
    setCurrentPage(1); // Reset page on submit
    try {
      const res = await consultAuspiciousDates(birthYear, startDate, endDate, activity);
      setConsultResult(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Đã xảy ra lỗi khi tư vấn ngày.');
    }
    setLoading(false);
  };

  // Filtered and Paginated recommendations
  const getFilteredRecommendations = () => {
    if (!consultResult) return [];
    if (ratingFilter === 'all') return consultResult.recommendations;
    return consultResult.recommendations.filter(r => r.dayEvaluation.rating === ratingFilter);
  };

  const filteredRecs = getFilteredRecommendations();
  const totalPages = Math.ceil(filteredRecs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecs = filteredRecs.slice(startIndex, startIndex + itemsPerPage);

  const getRatingBadge = (rating) => {
    switch (rating) {
      case 'Rất tốt':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
            <Sparkles size={11} /> Rất Tốt
          </span>
        );
      case 'Nên':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-teal-100 text-teal-800 border border-teal-200 uppercase tracking-wider">
            <CheckCircle2 size={11} /> Nên Làm
          </span>
        );
      case 'Bình hòa':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-slate-100 text-slate-650 border border-slate-200 uppercase tracking-wider">
            <Info size={11} /> Bình Hòa
          </span>
        );
      case 'Không nên':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200 uppercase tracking-wider">
            <AlertTriangle size={11} /> Không Nên
          </span>
        );
      case 'Không được':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
            <XCircle size={11} /> Không Được
          </span>
        );
      default:
        return null;
    }
  };

  const getRatingCardStyle = (rating) => {
    switch (rating) {
      case 'Rất tốt':
        return 'bg-emerald-50/50 border-emerald-200/80 text-neutral-800';
      case 'Nên':
        return 'bg-teal-50/40 border-teal-200/80 text-neutral-800';
      case 'Bình hòa':
        return 'bg-slate-50/50 border-slate-200/60 text-neutral-800';
      case 'Không nên':
        return 'bg-amber-50/40 border-amber-200/80 text-neutral-800';
      case 'Không được':
        return 'bg-rose-50/40 border-rose-200/80 text-neutral-800';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getActivityName = (act) => {
    const match = ACTIVITIES.find(item => item.id === act);
    return match ? match.name : '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 relative pb-10">
      
      {/* FLOATING SCROLL BUTTONS */}
      <div className="fixed bottom-4 md:bottom-8 left-4 md:left-8 z-40 flex flex-col gap-1 pointer-events-auto bg-transparent border-none shadow-none">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent text-slate-400 hover:text-slate-700 active:scale-95 transition-all duration-300 shadow-none border-none pointer-events-auto"
          title="Cuộn lên đầu trang"
        >
          <ArrowUp size={24} />
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent text-slate-400 hover:text-slate-700 active:scale-95 transition-all duration-300 shadow-none border-none pointer-events-auto"
          title="Cuộn xuống cuối trang"
        >
          <ArrowDown size={24} />
        </button>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex bg-[#faf6f0] p-1.5 rounded-2xl border border-amber-250/30 max-w-sm mx-auto shadow-sm">
        <button
          onClick={() => {
            setActiveTab('check');
            setError(null);
          }}
          className={`flex-1 py-3 px-3 rounded-xl font-extrabold text-xs sm:text-sm tracking-wider transition-all font-[Montserrat] text-center ${activeTab === 'check' ? 'bg-white text-emerald-800 shadow-md border border-emerald-100/30' : 'text-neutral-500 hover:text-neutral-900'}`}
        >
          Xem ngày
        </button>
        <button
          onClick={() => {
            setActiveTab('consult');
            setError(null);
          }}
          className={`flex-1 py-3 px-3 rounded-xl font-extrabold text-xs sm:text-sm tracking-wider transition-all font-[Montserrat] text-center ${activeTab === 'consult' ? 'bg-white text-emerald-800 shadow-md border border-emerald-100/30' : 'text-neutral-500 hover:text-neutral-900'}`}
        >
          XEM NGÀY ĐẸP
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm flex items-center gap-2 max-w-md mx-auto animate-in shake duration-300">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* TAB 1: XEM NGÀY CỤ THỂ */}
      {activeTab === 'check' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Form Column */}
          <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-5">
            <h3 className="text-lg font-extrabold text-neutral-800 font-[Lora] border-b border-gray-100 pb-3">Nhập Thông Tin Tra Cứu</h3>
            <form onSubmit={handleCheck} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Năm Sinh Dương Lịch</label>
                {/* Searchable Combobox for Year - Requirement 3 */}
                <CustomYearPicker value={birthYear} onChange={setBirthYear} />
              </div>

              {/* Custom Select Box activity check */}
              <div ref={checkDropdownRef} className="relative">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Công Việc Muốn Xem</label>
                <button
                  type="button"
                  onClick={() => setIsCheckActivityOpen(!isCheckActivityOpen)}
                  className="w-full px-4 py-3 border-2 border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-gray-700 bg-slate-50/40 text-sm focus:outline-none transition-all flex items-center justify-between shadow-sm"
                >
                  <span className="truncate">{getActivityName(activity)}</span>
                  <ChevronDown size={16} className={`text-emerald-800 shrink-0 transition-transform duration-300 ${isCheckActivityOpen ? 'rotate-180' : ''}`} />
                </button>
                {isCheckActivityOpen && (
                  <ul className="absolute z-50 w-full mt-1.5 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {ACTIVITIES.map(act => (
                      <li
                        key={act.id}
                        onClick={() => {
                          setActivity(act.id);
                          setIsCheckActivityOpen(false);
                        }}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-emerald-50 hover:text-emerald-900 ${activity === act.id ? 'bg-emerald-50/70 text-emerald-800 font-extrabold' : 'text-gray-700'}`}
                      >
                        {act.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Ngày Dương Lịch Muốn Xem</label>
                {/* Custom Bo-tron Rounded Calendar picker - Requirement 2 */}
                <CustomDatePicker value={solarDate} onChange={setSolarDate} />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Giờ Dự Kiến</label>
                {/* 24-hour custom bo-tron picker - Requirement 3 */}
                <CustomHourPicker value={solarHour} onChange={setSolarHour} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3.5 px-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wider font-[Montserrat] hover:opacity-90 animate-in fade-in"
                style={{ backgroundColor: '#065f46' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>Xem ngày</>
                )}
              </button>
            </form>
          </div>

          {/* Result Column */}
          <div className="md:col-span-7 space-y-6">
            {checkResult ? (
              <div className={`p-6 sm:p-8 rounded-3xl border shadow-sm space-y-6 animate-in zoom-in-95 duration-500 ${getRatingCardStyle(checkResult.dayEvaluation.rating)}`}>
                
                {/* Heading */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/40 pb-4">
                  <div>
                    <h4 className="text-xl font-bold text-neutral-800 font-[Lora]">Đánh Giá Ngày & Giờ</h4>
                    <p className="text-xs text-neutral-500 mt-1">Tuổi của bạn: <strong className="text-neutral-700">{checkResult.userYearInfo.yearCanChi} ({checkResult.userYearInfo.naYin})</strong></p>
                  </div>
                  {getRatingBadge(checkResult.dayEvaluation.rating)}
                </div>

                {/* Date/Time Conversion info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 shadow-sm text-sm">
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Dương Lịch</p>
                    <p className="font-semibold text-neutral-700 flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> Ngày {checkResult.solarDateInfo.date}</p>
                    <p className="font-semibold text-neutral-700 flex items-center gap-1.5"><Clock size={14} className="text-gray-400" /> Giờ {checkResult.solarDateInfo.hour}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Âm Lịch</p>
                    <p className="font-semibold text-neutral-700">Ngày {checkResult.dayEvaluation.lunarDateInfo.day} tháng {checkResult.dayEvaluation.lunarDateInfo.month} năm {checkResult.dayEvaluation.lunarDateInfo.year}</p>
                    <p className="font-semibold text-neutral-700 italic">Ngày {checkResult.dayEvaluation.lunarDateInfo.dayCanChi} (Tháng {checkResult.dayEvaluation.lunarDateInfo.monthCanChi})</p>
                  </div>
                </div>

                {/* Day Details */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-sm text-neutral-700 uppercase tracking-wider flex items-center gap-1.5"><Info size={15} /> Đặc Điểm Ngày</h5>
                  <div className="text-sm space-y-1 bg-white/40 p-3.5 rounded-xl border border-gray-200/30">
                    <p>✨ Trực ngày: <strong className="text-neutral-800">{checkResult.dayEvaluation.lunarDateInfo.truc}</strong></p>
                    <p>👹 Thần cai quản: <strong className="text-neutral-800">{checkResult.dayEvaluation.lunarDateInfo.deity} ({checkResult.dayEvaluation.lunarDateInfo.deityType})</strong> - <span className="text-xs text-neutral-600 font-medium">{checkResult.dayEvaluation.lunarDateInfo.deityMeaning}</span></p>
                  </div>
                </div>

                {/* Logic Explanations */}
                <div className="space-y-4">
                  {checkResult.dayEvaluation.positiveFactors.length > 0 && (
                    <div className="space-y-2">
                      <h6 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Cát Thần / Sự Tương Hợp (+):</h6>
                      <ul className="text-xs sm:text-sm text-emerald-900 space-y-1 list-disc pl-5">
                        {checkResult.dayEvaluation.positiveFactors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {checkResult.dayEvaluation.negativeFactors.length > 0 && (
                    <div className="space-y-2">
                      <h6 className="text-xs font-bold text-rose-800 uppercase tracking-wider">Hung Thần / Sự Xung Khắc (-):</h6>
                      <ul className="text-xs sm:text-sm text-rose-900 space-y-1 list-disc pl-5">
                        {checkResult.dayEvaluation.negativeFactors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Hour Check Result */}
                <div className="bg-white/80 p-5 rounded-2xl border border-gray-200/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-150 pb-2">
                    <h5 className="font-extrabold text-sm text-neutral-800 uppercase tracking-wider flex items-center gap-1.5"><Clock size={15} /> Giờ Đã Chọn: Giờ {checkResult.hourEvaluation.hourName} ({checkResult.hourEvaluation.timeRange})</h5>
                    {getRatingBadge(checkResult.hourEvaluation.rating)}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-700 space-y-2.5">
                    <p>Giờ này có Can Chi là <strong>{checkResult.hourEvaluation.hourCanChi}</strong>, do thần <strong>{checkResult.hourEvaluation.deity} ({checkResult.hourEvaluation.deityType})</strong> trị nhật ({checkResult.hourEvaluation.deityMeaning}).</p>
                    
                    {checkResult.hourEvaluation.positiveFactors.length > 0 && (
                      <div className="text-xs text-emerald-800 font-semibold">
                        {checkResult.hourEvaluation.positiveFactors.map((f, i) => <p key={i}>✓ {f}</p>)}
                      </div>
                    )}
                    {checkResult.hourEvaluation.negativeFactors.length > 0 && (
                      <div className="text-xs text-rose-800 font-semibold">
                        {checkResult.hourEvaluation.negativeFactors.map((f, i) => <p key={i}>✗ {f}</p>)}
                      </div>
                    )}
                  </div>
                </div>

                {/* GOOD HOURS LIST */}
                <div className="bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-3.5">
                  <h5 className="font-extrabold text-xs sm:text-sm text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={15} />
                    {checkResult.dayEvaluation.rating === 'Không nên' || checkResult.dayEvaluation.rating === 'Không được'
                      ? 'Khung Giờ Đẹp Khuyên Dùng Hóa Giải (Nếu Buộc Phải Làm)'
                      : 'Các Khung Giờ Cát Lành Khác Trong Ngày'}
                  </h5>
                  {checkResult.goodHours && checkResult.goodHours.length > 0 ? (
                    <div className="space-y-4">
                      {/* Best hours */}
                      <div>
                        <span className="block text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center gap-1">✨ Giờ Hoàng Đạo Tốt Nhất (Ưu tiên)</span>
                        <div className="grid grid-cols-2 gap-2">
                          {getHourClassifications(checkResult.goodHours).best.map((h, i) => (
                            <div key={i} className="bg-emerald-50 border-2 border-emerald-200 p-2.5 rounded-xl text-xs flex flex-col shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 bg-emerald-200 text-emerald-900 px-2 py-0.5 text-[8px] font-black uppercase rounded-bl-lg">Tốt nhất</div>
                              <span className="font-extrabold text-neutral-800">Giờ {h.hourName} ({h.timeRange})</span>
                              <span className="text-[10px] text-emerald-700 font-semibold mt-0.5" title={h.deityMeaning}>Thần {h.deity} ({h.rating}) - <span className="italic text-[9.5px] text-emerald-650 font-normal">{h.deityMeaning}</span></span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Backup hours */}
                      {getHourClassifications(checkResult.goodHours).backup.length > 0 && (
                        <div>
                          <span className="block text-[10px] font-extrabold text-emerald-700/80 uppercase tracking-widest mb-1.5">✓ Khung giờ thay thế (Dự phòng)</span>
                          <div className="grid grid-cols-2 gap-2">
                            {getHourClassifications(checkResult.goodHours).backup.map((h, i) => (
                              <div key={i} className="bg-emerald-50/20 border border-emerald-100/70 p-2.5 rounded-xl text-xs flex flex-col shadow-sm">
                                <span className="font-semibold text-neutral-700">Giờ {h.hourName} ({h.timeRange})</span>
                                <span className="text-[10px] text-emerald-600/75 font-medium mt-0.5" title={h.deityMeaning}>Thần {h.deity} ({h.rating}) - <span className="italic text-[9.5px] text-emerald-600/60 font-normal">{h.deityMeaning}</span></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-rose-800 font-medium">Rất tiếc, ngày này không có khung giờ hoàng đạo nào hợp tuổi.</p>
                  )}
                </div>

                {/* CTA to Consult tab */}
                <div className="border-t border-gray-200/40 pt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setActiveTab('consult');
                      setConsultResult(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-800 hover:text-emerald-950 hover:underline transition-all"
                  >
                    Tìm thêm ngày Hoàng Đạo khác <ArrowRight size={14} />
                  </button>
                </div>

              </div>
            ) : (
              <div className="h-full min-h-[300px] border-2 border-dashed border-gray-250/60 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-white/40">
                <Calendar size={48} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-400 max-w-sm">Vui lòng nhập đầy đủ thông tin năm sinh và ngày giờ muốn xem ở cột bên trái để phân tích.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TƯ VẤN NGÀY HOÀNG ĐẠO */}
      {activeTab === 'consult' && (
        <div className="space-y-8">
          
          {/* Selection Banner - Customized grid columns layout */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <form onSubmit={handleConsult} className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* Year column: shortened to 2/12 - Custom Year Combobox */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Năm Sinh</label>
                <CustomYearPicker value={birthYear} onChange={setBirthYear} />
              </div>

              {/* Activity column: custom select component styled rounded-2xl (span 3/12) */}
              <div ref={consultDropdownRef} className="lg:col-span-3 relative">
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Công Việc Cần Tư Vấn</label>
                <button
                  type="button"
                  onClick={() => setIsConsultActivityOpen(!isConsultActivityOpen)}
                  className="w-full px-4 py-3 border-2 border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-gray-700 bg-slate-50/40 text-sm focus:outline-none transition-all flex items-center justify-between shadow-sm"
                >
                  <span className="truncate">{getActivityName(activity)}</span>
                  <ChevronDown size={16} className={`text-emerald-800 shrink-0 transition-transform duration-300 ${isConsultActivityOpen ? 'rotate-180' : ''}`} />
                </button>
                {isConsultActivityOpen && (
                  <ul className="absolute z-50 w-full mt-1.5 bg-white border border-gray-150 rounded-2xl shadow-xl py-2 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
                    {ACTIVITIES.map(act => (
                      <li
                        key={act.id}
                        onClick={() => {
                          setActivity(act.id);
                          setIsConsultActivityOpen(false);
                        }}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-emerald-50 hover:text-emerald-900 ${activity === act.id ? 'bg-emerald-50/70 text-emerald-800 font-extrabold' : 'text-gray-700'}`}
                      >
                        {act.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Dates columns: expanded to 4/12 (gives more width to fully display year) - Custom rounded calendar pickers */}
              <div className="lg:col-span-4 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Từ ngày</label>
                  <CustomDatePicker value={startDate} onChange={setStartDate} maxDate={endDate} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Đến ngày</label>
                  <CustomDatePicker value={endDate} onChange={setEndDate} minDate={startDate} />
                </div>
              </div>

              {/* Submit button: renamed to "Xem ngày" - Requirement 1 */}
              <div className="lg:col-span-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-3 px-4 rounded-2xl font-bold transition-all shadow-md flex items-center justify-center gap-2 text-sm uppercase tracking-wider font-[Montserrat] h-[48px] hover:opacity-90"
                  style={{ backgroundColor: '#065f46' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Xem ngày</>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Consultation Output List */}
          <div className="space-y-6" ref={resultsTopRef}>
            {consultResult ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                
                {/* Rating Filter Menu - 5 levels (All, Rất tốt, Nên, Bình hòa, Không nên, Không được) */}
                <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Lọc xếp hạng:</span>
                    <div className="flex flex-wrap gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                      <button
                        onClick={() => { setRatingFilter('all'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${ratingFilter === 'all' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
                      >
                        Tất cả ({consultResult.recommendations.length})
                      </button>
                      <button
                        onClick={() => { setRatingFilter('Rất tốt'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${ratingFilter === 'Rất tốt' ? 'bg-white text-emerald-800 shadow-sm font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
                      >
                        Rất tốt ({consultResult.recommendations.filter(r => r.dayEvaluation.rating === 'Rất tốt').length})
                      </button>
                      <button
                        onClick={() => { setRatingFilter('Nên'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${ratingFilter === 'Nên' ? 'bg-white text-teal-800 shadow-sm font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
                      >
                        Nên làm ({consultResult.recommendations.filter(r => r.dayEvaluation.rating === 'Nên').length})
                      </button>
                      <button
                        onClick={() => { setRatingFilter('Bình hòa'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${ratingFilter === 'Bình hòa' ? 'bg-white text-slate-800 shadow-sm font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
                      >
                        Bình hòa ({consultResult.recommendations.filter(r => r.dayEvaluation.rating === 'Bình hòa').length})
                      </button>
                      <button
                        onClick={() => { setRatingFilter('Không nên'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${ratingFilter === 'Không nên' ? 'bg-white text-amber-800 shadow-sm font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
                      >
                        Không nên ({consultResult.recommendations.filter(r => r.dayEvaluation.rating === 'Không nên').length})
                      </button>
                      <button
                        onClick={() => { setRatingFilter('Không được'); setCurrentPage(1); }}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${ratingFilter === 'Không được' ? 'bg-white text-rose-800 shadow-sm font-extrabold' : 'text-neutral-500 hover:text-neutral-800'}`}
                      >
                        Không được ({consultResult.recommendations.filter(r => r.dayEvaluation.rating === 'Không được').length})
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500">
                    Tuổi: <strong className="text-neutral-700">{consultResult.userYearInfo.yearCanChi} ({consultResult.userYearInfo.naYin})</strong>
                  </div>
                </div>

                {paginatedRecs.length > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      {paginatedRecs.map((rec, index) => (
                        <div
                          key={index}
                          className={`border rounded-3xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 transition-all hover:shadow-md ${getRatingCardStyle(rec.dayEvaluation.rating)}`}
                        >
                          
                          {/* Day Column (Left) */}
                          <div className="lg:col-span-5 space-y-4 border-b lg:border-b-0 lg:border-r border-gray-200/50 pb-4 lg:pb-0 lg:pr-6">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider">Thời Gian</span>
                              {getRatingBadge(rec.dayEvaluation.rating)}
                            </div>
                            <div>
                              <p className="text-lg font-bold text-neutral-800">Dương lịch: {rec.solarDate}</p>
                              <p className="text-sm font-semibold text-neutral-600 mt-1">
                                Âm lịch: Ngày {rec.dayEvaluation.lunarDateInfo.day} tháng {rec.dayEvaluation.lunarDateInfo.month} năm {rec.dayEvaluation.lunarDateInfo.year}
                              </p>
                              <p className="text-xs font-semibold text-neutral-500 italic mt-0.5">
                                Ngày {rec.dayEvaluation.lunarDateInfo.dayCanChi} (Tháng {rec.dayEvaluation.lunarDateInfo.monthCanChi})
                              </p>
                            </div>
                            <div className="text-xs bg-white/60 p-3 rounded-xl border border-gray-250/20 space-y-1">
                              <p>🎯 Trực ngày: <strong>{rec.dayEvaluation.lunarDateInfo.truc}</strong></p>
                              <p>👑 Thần hộ vệ: <strong>{rec.dayEvaluation.lunarDateInfo.deity} ({rec.dayEvaluation.lunarDateInfo.deityType})</strong></p>
                            </div>
                          </div>

                          {/* Analysis & Hours Column (Right) */}
                          <div className="lg:col-span-7 space-y-4">
                            
                            {/* Explanations */}
                            <div className="space-y-3">
                              <span className="text-xs font-extrabold text-neutral-500 uppercase tracking-wider block">Lý do đề xuất & Lợi hại</span>
                              <div className="text-xs sm:text-sm space-y-1">
                                {rec.dayEvaluation.positiveFactors.map((p, i) => (
                                  <p key={i} className="text-emerald-800 font-medium">✓ {p}</p>
                                ))}
                                {rec.dayEvaluation.negativeFactors.map((n, i) => (
                                  <p key={i} className="text-rose-800 font-medium">✗ {n}</p>
                                ))}
                              </div>
                            </div>

                            {/* Hours */}
                            <div className="bg-white/80 p-4 rounded-2xl border border-gray-150/40 space-y-3">
                              <span className="text-xs font-extrabold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5"><Clock size={13} /> Khung giờ cát lành trong ngày:</span>
                              {rec.goodHours.length > 0 ? (
                                <div className="space-y-3">
                                  {/* Best */}
                                  <div className="flex flex-wrap gap-1.5 items-center py-0.5">
                                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider min-w-[70px]">✨ Tốt nhất:</span>
                                    {getHourClassifications(rec.goodHours).best.map((h, i) => (
                                      <div key={i} className="bg-emerald-50 text-emerald-950 border-2 border-emerald-200 py-0.5 px-2 rounded-xl text-[11px] flex items-center gap-1 shrink-0" title={h.deityMeaning}>
                                        <span className="font-extrabold">{h.hourName} ({h.timeRange.replace(/\s+/g, '')})</span>
                                        <span className="text-[9.5px] text-emerald-650 font-semibold italic">({h.deity})</span>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Backup */}
                                  {getHourClassifications(rec.goodHours).backup.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 items-center border-t border-dashed border-emerald-100/50 pt-2 py-0.5">
                                      <span className="text-[10px] font-extrabold text-emerald-700/70 uppercase tracking-wider min-w-[70px]">✓ Thay thế:</span>
                                      {getHourClassifications(rec.goodHours).backup.map((h, i) => (
                                        <div key={i} className="bg-emerald-50/20 text-emerald-900/80 border border-emerald-100/40 py-0.5 px-2 rounded-xl text-[11px] flex items-center gap-1 shrink-0" title={h.deityMeaning}>
                                          <span className="font-semibold">{h.hourName} ({h.timeRange.replace(/\s+/g, '')})</span>
                                          <span className="text-[9.5px] text-emerald-600/60 font-semibold italic">({h.deity})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs text-rose-800 font-semibold">Không tìm thấy giờ hoàng đạo không bị xung kỵ cho ngày này.</p>
                              )}
                            </div>

                          </div>

                        </div>
                      ))}
                    </div>

                    {/* PAGINATION INTERFACES */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-200 pt-4 max-w-md mx-auto">
                        <button
                          onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); scrollToResults(); }}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          Trang trước
                        </button>
                        <span className="text-xs sm:text-sm font-bold text-neutral-600">Trang {currentPage} / {totalPages}</span>
                        <button
                          onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); scrollToResults(); }}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white border border-gray-300 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                          Trang sau
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-12 border-2 border-dashed border-amber-250/30 rounded-3xl text-center bg-white">
                    <Calendar size={48} className="text-amber-250/50 mx-auto mb-3" />
                    <p className="font-semibold text-neutral-700 mb-1">Không tìm thấy kết quả phù hợp</p>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">Không tìm thấy ngày nào khớp với bộ lọc xếp hạng bạn chọn trong khoảng thời gian này. Vui lòng mở rộng khoảng thời gian hoặc chọn xếp hạng khác.</p>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full min-h-[350px] border-2 border-dashed border-gray-250/60 rounded-3xl flex flex-col items-center justify-center text-center p-6 bg-white/40">
                <Sparkles size={48} className="text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-400 max-w-sm">Thiết lập khoảng thời gian dương lịch và năm sinh, sau đó nhấn "Xem ngày" để nhận danh sách gợi ý cát nhật.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ACCORDION: HELP SECTION */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden mt-8 transition-all">
        <button
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="w-full flex items-center justify-between p-5 bg-slate-50/50 border-b border-gray-100 text-left font-bold text-neutral-800 text-sm sm:text-base focus:outline-none"
        >
          <span className="flex items-center gap-2 text-emerald-800"><HelpCircle size={18} /> Hướng Dẫn Nghiệp Vụ Trạch Cát & Tra Cứu Thuật Số</span>
          {isHelpOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {isHelpOpen && (
          <div className="p-5 sm:p-7 space-y-6 text-sm text-neutral-700 leading-relaxed max-h-[500px] overflow-y-auto animate-in slide-in-from-top-4 duration-300">
            
            <div className="space-y-2">
              <h4 className="font-extrabold text-emerald-800">1. Ngũ Hành Nạp Âm Trong Chọn Ngày</h4>
              <p>Mỗi năm sinh và mỗi ngày trong năm đều có một ngũ hành nạp âm tương ứng (ví dụ: Hải Trung Kim, Lư Trung Hỏa, v.v.). Hệ thống tự động trích xuất Ngũ hành từ Nạp Âm này và so khớp:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong className="text-emerald-700">Tương Sinh (Tốt nhất):</strong> Ngũ hành ngày sinh cho ngũ hành tuổi (ví dụ: ngày Thổ sinh tuổi Kim). Tuổi bạn được nâng đỡ, tiếp năng lượng tốt lành.</li>
                <li><strong className="text-emerald-700">Tương Hòa (Rất tốt):</strong> Ngũ hành ngày trùng ngũ hành tuổi (ví dụ: ngày Kim gặp tuổi Kim). Mang lại sự cân bằng, vững bền.</li>
                <li><strong className="text-rose-700">Tương Khắc (Xấu):</strong> Ngũ hành ngày khắc ngũ hành tuổi (ví dụ: ngày Hỏa khắc tuổi Kim). Năng lượng của ngày kìm hãm, gây tổn hại hoặc cản trở gia chủ.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-emerald-800">2. Thập Nhị Thần (Hoàng Đạo / Hắc Đạo)</h4>
              <p>Chu kỳ 12 vị thần lần lượt cai quản các ngày/giờ. Có 6 Hoàng Đạo (Cát thần - lành) và 6 Hắc Đạo (Hung thần - cần tránh):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-2 bg-slate-55/30 p-3 rounded-xl">
                <div>
                  <h5 className="font-bold text-emerald-700 mb-1">6 Thần Hoàng Đạo (Tốt):</h5>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li><strong>Thanh Long:</strong> Hỷ sự, danh vọng.</li>
                    <li><strong>Minh Đường:</strong> Quý nhân, khởi đầu cát tường.</li>
                    <li><strong>Kim Quỹ:</strong> Cưới hỏi, tài lộc dồi dào.</li>
                    <li><strong>Bảo Quang:</strong> Thi cử, công danh hanh thông.</li>
                    <li><strong>Ngọc Đường:</strong> Xây dựng, mưu sự đại cát.</li>
                    <li><strong>Tư Mệnh:</strong> Tiêu tai giải ách, vạn sự tốt lành.</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-rose-700 mb-1">6 Thần Hắc Đạo (Xấu):</h5>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li><strong>Thiên Hình:</strong> Tranh chấp, kiện tụng hình luật.</li>
                    <li><strong>Chu Tước:</strong> Thị phi tai tiếng, hao tài.</li>
                    <li><strong>Bạch Hổ:</strong> Thương tích, xung kỵ huyết quang.</li>
                    <li><strong>Thiên Lao:</strong> Tù túng, khó khăn cản trở.</li>
                    <li><strong>Nguyên Vũ:</strong> Trộm cướp, âm mưu tiểu nhân.</li>
                    <li><strong>Câu Trận:</strong> Trì hoãn, cãi vã gia đạo.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-extrabold text-emerald-800">3. Thập Nhị Kiến Trừ (12 Trực) Tương Ứng Với Công Việc</h4>
              <p>Mỗi ngày mang năng lượng của 1 trong 12 Trực tuần hoàn. Mỗi Trực đại diện một trạng thái và phù hợp với các loại việc cụ thể:</p>
              <ul className="list-decimal pl-5 space-y-1.5 text-xs">
                <li><strong>Kiến (Tốt cho khởi đầu):</strong> Phù hợp khai trương, xuất hành, nhậm chức. Tránh động thổ, cải táng.</li>
                <li><strong>Trừ (Tốt cho giải trừ):</strong> Phù hợp cúng tế cầu an, chữa bệnh, cất bốc cải táng. Tránh cưới hỏi, ký hợp đồng.</li>
                <li><strong>Mãn (Đầy đủ):</strong> Phù hợp khai trương, cầu tài lộc, mở cửa hàng. Tránh an táng, động thổ.</li>
                <li><strong>Bình (Bằng phẳng):</strong> Phù hợp xây dựng, động thổ đắp nền, sơn sửa nhà. Tránh ký hợp đồng tranh chấp.</li>
                <li><strong>Định (Vững chắc):</strong> Phù hợp động thổ, khởi công, cưới hỏi trọn đời. Tránh đi xa (xuất hành).</li>
                <li><strong>Chấp (Giữ vững):</strong> Phù hợp cầu phúc tế tự, xây dựng nhà cửa, sửa chữa nhỏ. Tránh khai trương kinh doanh.</li>
                <li><strong>Phá (Đổ vỡ - Xấu nhất):</strong> Kỵ cưới hỏi, khai trương, làm nhà. Chỉ tốt cho phá dỡ nhà cũ, tiêu trừ ổ dịch.</li>
                <li><strong>Nguy (Nguy hiểm):</strong> Kỵ leo cao, đổ mái, đi thuyền, cưới hỏi. Tránh mọi việc đại sự mạo hiểm.</li>
                <li><strong>Thành (Thành tựu):</strong> Tốt cho kết hôn, ký hợp đồng làm ăn, khai trương buôn bán, dọn nhà mới.</li>
                <li><strong>Thu (Thu hoạch):</strong> Phù hợp ký kết hợp đồng, thu nợ, mua sắm tài sản. Tránh an táng, làm lễ cưới.</li>
                <li><strong>Khai (Khai mở):</strong> Tốt cho hôn nhân cưới gả, khai trương, động thổ làm nhà mới, xuất hành cầu tài.</li>
                <li><strong>Bế (Đóng kín):</strong> Phù hợp đắp đập, an táng (đóng cửa mộ phần). Kỵ cưới hỏi, khai trương mở cửa hiệu.</li>
              </ul>
            </div>

          </div>
        )}
      </div>

      {/* ACCORDION: FAQS SECTION */}
      <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden mt-6 transition-all">
        <button
          onClick={() => setIsFaqOpen(!isFaqOpen)}
          className="w-full flex items-center justify-between p-5 bg-slate-50/50 border-b border-gray-100 text-left font-bold text-neutral-800 text-sm sm:text-base focus:outline-none"
        >
          <span className="flex items-center gap-2 text-emerald-800"><HelpCircle size={18} /> Các Câu Hỏi Thường Gặp Về Trạch Cát (Chọn Ngày Đẹp)</span>
          {isFaqOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {isFaqOpen && (
          <div className="p-5 sm:p-7 space-y-6 text-sm text-neutral-700 leading-relaxed max-h-[500px] overflow-y-auto animate-in slide-in-from-top-4 duration-300">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70 text-left">
              <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-emerald-750 shrink-0" />
                Thế nào là ngày Hoàng Đạo và ngày Hắc Đạo?
              </h5>
              <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                Ngày Hoàng Đạo là ngày có các cát tinh (Thanh Long, Minh Đường, Kim Quỹ...) cai quản trị nhật, mang trường năng lượng tốt lành, hanh thông cho khởi sự. Ngày Hắc Đạo có các hung thần (Thiên Hình, Chu Tước, Bạch Hổ...) chủ sự, dễ xảy ra trục trặc, hao tài.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70 text-left">
              <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-emerald-750 shrink-0" />
                Tại sao một ngày Hoàng Đạo tốt với người này lại có thể xấu với người khác?
              </h5>
              <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                Vì xem ngày phải cá nhân hóa theo ngũ hành bản mệnh của gia chủ. Nếu ngũ hành của ngày đó tương khắc trực tiếp với Thiên can/Địa chi năm sinh của bạn (gọi là ngày xung tuổi), ngày đó dù là Hoàng Đạo chung bạn cũng không nên dùng để tránh rủi ro.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70 text-left">
              <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-emerald-750 shrink-0" />
                Nếu bắt buộc phải động thổ hoặc kết hôn vào ngày Hắc Đạo thì làm cách nào giảm tai họa?
              </h5>
              <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                Bạn có thể áp dụng phương pháp "Tránh ngày dùng giờ" (chọn khung giờ Hoàng Đạo cát lành nhất trong ngày đó để tiến hành đại sự) nhằm mượn năng lượng của cát thần hóa giải hung khí, hoặc thực hiện thêm các nghi thức thành kính tâm linh.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
