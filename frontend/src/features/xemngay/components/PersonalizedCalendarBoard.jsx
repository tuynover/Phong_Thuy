import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Sparkles, 
  Clock, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Share2, 
  User as UserIcon, 
  Info,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  Lock,
  CalendarDays,
  Layers,
  Save,
  Search
} from 'lucide-react';
import { getPersonalizedMonthCalendar, getPersonalizedDayDetail, updateProfile } from '@/services/api';
import ShareableStoryModal from '@/components/modals/ShareableStoryModal';

const DAY_NAMES = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const CON_GIAP = ['Chuột', 'Trâu', 'Hổ', 'Mèo', 'Rồng', 'Rắn', 'Ngựa', 'Dê', 'Khỉ', 'Gà', 'Chó', 'Lợn'];

const getYearCanChiVi = (y) => {
  const can = CAN[(y + 6) % 10];
  const chi = CHI[(y + 8) % 12];
  const animal = CON_GIAP[(y + 8) % 12];
  return `${can} ${chi} (${animal})`;
};

const YEARS_LIST = Array.from({ length: 87 }, (_, i) => 2026 - i);
const CALENDAR_YEARS = Array.from({ length: 2050 - 1940 + 1 }, (_, i) => 2050 - i);

// Custom Searchable Year Picker Combobox (copy chuẩn giao diện từ Xem Ngày)
function CustomYearSearchPicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredYears = YEARS_LIST.filter(y => {
    if (!search) return true;
    const canChi = getYearCanChiVi(y).toLowerCase();
    return String(y).includes(search) || canChi.includes(search.toLowerCase());
  });

  const displayVal = value ? `Năm ${value} — ${getYearCanChiVi(Number(value))}` : '';

  return (
    <div ref={containerRef} className="relative w-full sm:w-72">
      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : displayVal}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearch('');
          }}
          placeholder="Chọn hoặc nhập năm sinh..."
          className="w-full px-4 py-3 border-2 border-slate-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-800 bg-slate-50/50 text-xs sm:text-sm font-bold focus:outline-none transition-all pr-10 shadow-xs cursor-pointer"
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
                onChange(Number(y));
                setIsOpen(false);
                setSearch('');
              }}
              className={`px-4 py-2.5 text-xs sm:text-sm cursor-pointer transition-colors hover:bg-emerald-50 hover:text-emerald-900 flex items-center justify-between ${Number(value) === Number(y) ? 'bg-emerald-50/70 text-emerald-800 font-extrabold' : 'text-slate-700'}`}
            >
              <span>Năm {y}</span>
              <span className="text-[11px] text-slate-400 font-medium">{getYearCanChiVi(y)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PersonalizedCalendarBoard({ 
  user, 
  setUser, 
  setIsAuthModalOpen,
  mode: propMode,
  onSwitchMode: propOnSwitchMode
}) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  // 2-Version Mode: 'year' (Theo Năm Sinh / Cơ bản) | 'bazi' (Theo Bát Tự / Nâng cao)
  // Mặc định là 'year' (Cơ bản - không cần đăng nhập) nếu là khách
  const [internalMode, setInternalMode] = useState(() => {
    if (!user) return 'year';
    return localStorage.getItem('phongthuy_calendar_mode') || 'year';
  });

  const calendarMode = propMode || internalMode;

  useEffect(() => {
    if (propMode) {
      setInternalMode(propMode);
    }
  }, [propMode]);

  // Năm sinh được chọn để tra cứu (cho chế độ năm sinh)
  const [selectedBirthYear, setSelectedBirthYear] = useState(() => {
    return user?.baziInfo?.year || Number(localStorage.getItem('phongthuy_selected_birth_year')) || 1995;
  });

  const [calendarData, setCalendarData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayDetail, setDayDetail] = useState(null);
  const [isLoadingDay, setIsLoadingDay] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Interactive Month & Year Picker Dropdowns
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const [yearPickerSearch, setYearPickerSearch] = useState('');
  const monthPickerRef = useRef(null);
  const yearPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target)) {
        setIsMonthPickerOpen(false);
      }
      if (yearPickerRef.current && !yearPickerRef.current.contains(e.target)) {
        setIsYearPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMonth = (m) => {
    setCurrentMonth(m);
    setSelectedDay(null);
    setDayDetail(null);
    setIsMonthPickerOpen(false);
  };

  const handleSelectYear = (y) => {
    setCurrentYear(y);
    setSelectedDay(null);
    setDayDetail(null);
    setIsYearPickerOpen(false);
    setYearPickerSearch('');
  };

  // Onboarding Birth Date Form states (if user has not entered birth date in DB)
  const [onboardDate, setOnboardDate] = useState('');
  const [onboardTime, setOnboardTime] = useState('10:30');
  const [onboardGender, setOnboardGender] = useState(user?.gender !== undefined ? user.gender : 1);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [onboardError, setOnboardError] = useState('');

  // Check whether user has birth info in database
  const hasBirthInfo = Boolean(
    user?.baziInfo && 
    user.baziInfo.year && 
    user.baziInfo.month && 
    user.baziInfo.day
  );

  // Sync mode to localStorage and check auth
  const handleSwitchMode = (mode) => {
    if (mode === 'bazi' && !user) {
      if (setIsAuthModalOpen) setIsAuthModalOpen(true);
      return;
    }
    if (propOnSwitchMode) {
      propOnSwitchMode(mode);
    } else {
      setInternalMode(mode);
    }
    localStorage.setItem('phongthuy_calendar_mode', mode);
    setSelectedDay(null);
    setDayDetail(null);
  };

  // Synchronize birth year if user profile changes
  useEffect(() => {
    if (user?.baziInfo?.year) {
      setSelectedBirthYear(user.baziInfo.year);
    }
  }, [user?.baziInfo?.year]);

  // Thay đổi năm sinh tra cứu cho chế độ 'year'
  const handleChangeBirthYear = (yearNum) => {
    setSelectedBirthYear(yearNum);
    localStorage.setItem('phongthuy_selected_birth_year', String(yearNum));
    setSelectedDay(null);
    setDayDetail(null);
    fetchMonthCalendar(currentYear, currentMonth, 'year', yearNum);
  };

  // Fetch Calendar Data for Month
  const fetchMonthCalendar = useCallback(async (year, month, mode = calendarMode, customBirthYear = selectedBirthYear) => {
    try {
      setIsLoading(true);
      let baziPayload = null;
      if (user?.baziInfo && hasBirthInfo) {
        baziPayload = {
          day: user.baziInfo.day,
          month: user.baziInfo.month,
          year: user.baziInfo.year,
          hour: user.baziInfo.hour !== undefined ? user.baziInfo.hour : 12,
          minute: user.baziInfo.minute !== undefined ? user.baziInfo.minute : 0,
          gender: user.gender !== undefined ? user.gender : 1
        };
      }

      const res = await getPersonalizedMonthCalendar({
        year,
        month,
        mode,
        birthYear: customBirthYear,
        baziInfo: mode === 'bazi' ? baziPayload : null
      });

      if (res?.data?.success) {
        setCalendarData(res.data);
      }
    } catch (err) {
      console.error('Fetch month calendar error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, calendarMode, hasBirthInfo, selectedBirthYear]);

  // Initial load effect and auto-recalculate whenever birth date or profile changes
  useEffect(() => {
    if (calendarMode === 'year') {
      fetchMonthCalendar(currentYear, currentMonth, 'year', selectedBirthYear);
    } else if (calendarMode === 'bazi') {
      if (user && hasBirthInfo) {
        fetchMonthCalendar(currentYear, currentMonth, 'bazi');
      }
    }
  }, [
    user?.baziInfo?.day,
    user?.baziInfo?.month,
    user?.baziInfo?.year,
    user?.baziInfo?.hour,
    user?.baziInfo?.minute,
    user?.gender,
    hasBirthInfo,
    currentYear,
    currentMonth,
    calendarMode,
    selectedBirthYear,
    fetchMonthCalendar
  ]);

  // Handle saving birth info to database
  const handleSaveOnboardProfile = async (e) => {
    e.preventDefault();
    setOnboardError('');

    if (!onboardDate) {
      setOnboardError('Vui lòng chọn hoặc nhập ngày sinh.');
      return;
    }

    let day, month, year;
    if (onboardDate.includes('/')) {
      const parts = onboardDate.split('/');
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else if (onboardDate.includes('-')) {
      const parts = onboardDate.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }

    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
      setOnboardError('Định dạng ngày sinh không hợp lệ. Vui lòng nhập DD/MM/YYYY.');
      return;
    }

    let hour = 10;
    let minute = 30;
    if (onboardTime && onboardTime.includes(':')) {
      const tParts = onboardTime.split(':');
      hour = parseInt(tParts[0], 10) || 0;
      minute = parseInt(tParts[1], 10) || 0;
    }

    try {
      setIsSavingProfile(true);
      const res = await updateProfile({
        day,
        month,
        year,
        hour,
        minute,
        gender: onboardGender
      });

      if (res?.data?.user) {
        const updatedUser = res.data.user;
        if (setUser) setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Automatically recalculate calendar for the updated birth date
        fetchMonthCalendar(currentYear, currentMonth, calendarMode, updatedUser?.baziInfo?.year || selectedBirthYear);
      }
    } catch (err) {
      console.error('Save birth info error:', err);
      setOnboardError('Không thể lưu thông tin sinh mệnh. Vui lòng thử lại.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Month Change
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(12);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setSelectedDay(null);
    setDayDetail(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setSelectedDay(null);
    setDayDetail(null);
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth() + 1);
    setSelectedDay(null);
    setDayDetail(null);
  };

  // Handle click on a Day cell
  const handleSelectDay = async (dayObj) => {
    setSelectedDay(dayObj);
    try {
      setIsLoadingDay(true);
      let baziPayload = null;
      if (user?.baziInfo && hasBirthInfo) {
        baziPayload = {
          day: user.baziInfo.day,
          month: user.baziInfo.month,
          year: user.baziInfo.year,
          hour: user.baziInfo.hour || 12,
          minute: user.baziInfo.minute || 0,
          gender: user?.gender !== undefined ? user.gender : 1
        };
      }

      const res = await getPersonalizedDayDetail({
        dateStr: dayObj.dateStr,
        mode: calendarMode,
        birthYear: selectedBirthYear,
        baziInfo: calendarMode === 'bazi' ? baziPayload : null
      });

      if (res?.data?.success) {
        setDayDetail(res.data);
      }
    } catch (err) {
      console.error('Fetch day detail error:', err);
    } finally {
      setIsLoadingDay(false);
    }
  };

  // ==========================================
  // SCENARIO: BAZI MODE REQUIRES AUTH / BIRTH DATA
  // ==========================================
  if (calendarMode === 'bazi' && !user) {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 border border-slate-200/80 shadow-sm text-center max-w-xl mx-auto space-y-5 my-8 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
          <Lock size={28} />
        </div>
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
            Dành Riêng Cho Thành Viên
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-[Montserrat]">
            Mở Khóa Phiên Bản Bát Tự Nâng Cao
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Phiên bản Bát Tự Tứ Trụ phân tích chuyên sâu Nhật Chủ, Thập Thần, Dụng Thần &amp; Kỵ Thần theo thời khắc sinh. Đăng nhập để lưu giữ thông tin và khai mở cuốn lịch độc bản.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setIsAuthModalOpen?.(true)}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            <span>Đăng Nhập Ngay Để Mở Khóa</span>
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('year')}
            className="w-full sm:w-auto px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            🌿 Xem Bản Theo Năm Sinh (Miễn Phí)
          </button>
        </div>
      </div>
    );
  }

  if (calendarMode === 'bazi' && user && !hasBirthInfo) {
    return (
      <div className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm max-w-lg mx-auto space-y-6 my-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 font-[Montserrat]">
              Thiết Lập Hồ Sơ Sinh Mệnh
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Nhập ngày sinh để lưu vào tài khoản và tính toán Cuốn Lịch Bát Tự.
            </p>
          </div>
        </div>

        {onboardError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle size={15} />
            <span>{onboardError}</span>
          </div>
        )}

        <form onSubmit={handleSaveOnboardProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Ngày Tháng Năm Sinh Dương Lịch
            </label>
            <input
              type="text"
              value={onboardDate}
              onChange={e => setOnboardDate(e.target.value)}
              placeholder="VD: 24/10/1994 hoặc 1994-10-24"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Dùng để xác định Thiên Can, Địa Chi và Ngũ Hành bản mệnh.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Giờ Sinh (HH:mm)
              </label>
              <input
                type="text"
                value={onboardTime}
                onChange={e => setOnboardTime(e.target.value)}
                placeholder="10:30"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Giới Tính
              </label>
              <select
                value={onboardGender}
                onChange={e => setOnboardGender(parseInt(e.target.value, 10))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={1}>Nam Mệnh</option>
                <option value={0}>Nữ Mệnh</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSwitchMode('year')}
              className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer transition-colors"
            >
              🌿 Xem Bản Năm Sinh
            </button>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSavingProfile ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Lưu &amp; Mở Lịch Bát Tự</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // MAIN SCENARIO: RENDER CALENDAR GRID
  // ==========================================
  const firstDayOfWeek = calendarData?.days?.[0]?.dayOfWeek ?? 1;
  const paddingBlanks = (firstDayOfWeek === 0 ? 7 : firstDayOfWeek) - 1;
  const outlook = calendarData?.monthlyOutlook;

  return (
    <div className="space-y-6">
      {/* 1. TOP CONTROL BAR (REDESIGNED) */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
              {calendarMode === 'year' ? <CalendarDays size={22} /> : <Sparkles size={22} />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 font-[Montserrat]">
                {calendarMode === 'year' ? 'Lịch Vạn Niên Theo Tuổi' : 'Lịch Vạn Niên Theo Bát Tự'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {calendarMode === 'year' 
                  ? 'Tra cứu cát hung, tương hợp & tương xung theo năm sinh tuổi mệnh' 
                  : (user?.name ? `Tính toán cá nhân hóa cho đương số: ${user.name} (${user?.baziInfo?.day}/${user?.baziInfo?.month}/${user?.baziInfo?.year})` : 'Tính toán chuyên sâu theo Tứ Trụ Bát Tự, Nhật Chủ & Dụng Thần')}
              </p>
            </div>
          </div>

          {/* Controls: Custom Year Search Picker for year mode */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {calendarMode === 'year' && (
              <CustomYearSearchPicker
                value={selectedBirthYear}
                onChange={handleChangeBirthYear}
              />
            )}
          </div>
        </div>
      </div>

      {/* 2. MONTHLY OUTLOOK BANNER */}
      {outlook && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 border border-slate-200 shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 uppercase tracking-wider">
                  Âm Lịch: Tháng {outlook.monthCanChi} ({outlook.yearCanChi})
                </span>
                {outlook.thapThan && (
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                    {outlook.thapThan}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-[Montserrat] pt-1">
                {outlook.themeTitle}
              </h3>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${outlook.status === 'favorable' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : (outlook.status === 'caution' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-700 border-slate-200')}`}>
              {outlook.status === 'favorable' ? '✦ Thuận Phong Đắc Ý' : (outlook.status === 'caution' ? '⚠ Thủ Thế Bồi Đắp' : '⚖ Quân Bình Hòa')}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {outlook.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 space-y-1.5">
              <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                <span>Việc Nên Ưu Tiên Trong Tháng:</span>
              </div>
              <ul className="space-y-1 text-slate-700 pl-5 list-disc">
                {outlook.favorableActivities?.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-1.5">
              <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-amber-600" />
                <span>Điều Thận Trọng Đề Phòng:</span>
              </div>
              <ul className="space-y-1 text-slate-700 pl-5 list-disc">
                {outlook.cautions?.map((cau, idx) => (
                  <li key={idx}>{cau}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. MAIN CALENDAR GRID */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-sm overflow-hidden">
        {/* CALENDAR HEADER WITH MONTH & YEAR CONTROLS (SÁT CUỐN LỊCH) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Month Picker Dropdown */}
            <div className="relative" ref={monthPickerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsMonthPickerOpen(!isMonthPickerOpen);
                  setIsYearPickerOpen(false);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 -ml-1 rounded-xl text-base sm:text-xl font-black text-slate-900 font-[Montserrat] hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer group"
                title="Nhấp để chọn tháng"
              >
                <span>Tháng {currentMonth}</span>
                <ChevronDown size={16} className={`text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 ${isMonthPickerOpen ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>

              {isMonthPickerOpen && (
                <div className="absolute top-full left-0 mt-1.5 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 w-64 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                    Chọn Tháng ({currentYear})
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleSelectMonth(m)}
                        className={`py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          m === currentMonth
                            ? 'bg-indigo-600 text-white shadow-xs font-black'
                            : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                      >
                        Tháng {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="text-slate-300 font-black text-base sm:text-xl select-none">/</span>

            {/* Year Picker Dropdown */}
            <div className="relative" ref={yearPickerRef}>
              <button
                type="button"
                onClick={() => {
                  setIsYearPickerOpen(!isYearPickerOpen);
                  setIsMonthPickerOpen(false);
                  setYearPickerSearch('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-base sm:text-xl font-black text-slate-900 font-[Montserrat] hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer group"
                title="Nhấp để chọn năm"
              >
                <span>{currentYear}</span>
                <ChevronDown size={16} className={`text-slate-400 group-hover:text-indigo-600 transition-transform duration-200 ${isYearPickerOpen ? 'rotate-180 text-indigo-600' : ''}`} />
              </button>

              {isYearPickerOpen && (
                <div className="absolute top-full left-0 mt-1.5 p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 w-60 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                    <span>Chọn Năm Lịch</span>
                    <button
                      type="button"
                      onClick={() => handleSelectYear(today.getFullYear())}
                      className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      Năm nay ({today.getFullYear()})
                    </button>
                  </div>

                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Gõ năm (VD: 2027)..."
                      value={yearPickerSearch}
                      onChange={(e) => setYearPickerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      autoFocus
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {CALENDAR_YEARS
                      .filter((y) => !yearPickerSearch || String(y).includes(yearPickerSearch.trim()))
                      .map((y) => (
                        <button
                          key={y}
                          type="button"
                          onClick={() => handleSelectYear(y)}
                          className={`w-full py-1.5 px-3 text-left text-xs font-bold rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                            y === currentYear
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          <span>Năm {y}</span>
                          <span className={`text-[10px] font-normal truncate max-w-[120px] ${
                            y === currentYear ? 'text-indigo-100' : 'text-slate-400'
                          }`}>
                            {getYearCanChiVi(y)}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {outlook?.monthCanChi && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                Tháng {outlook.monthCanChi} Âm Lịch
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={handleGoToday}
              className="px-3.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-xl text-slate-700 transition-colors cursor-pointer"
                title="Tháng trước"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-xl text-slate-700 transition-colors cursor-pointer"
                title="Tháng sau"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* DAYS OF WEEK HEADER */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-xs font-black text-slate-500 uppercase tracking-wider py-1.5 font-[Montserrat]">
          {DAY_NAMES.map((name, i) => (
            <div key={name} className={i >= 5 ? 'text-rose-500' : ''}>
              {name}
            </div>
          ))}
        </div>

        {/* CALENDAR CELLS */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="animate-spin text-indigo-600" size={24} />
            <span className="text-xs font-bold">Đang tính toán cuốn lịch cá nhân hóa...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 sm:gap-2.5">
            {/* Blank padding offset */}
            {Array.from({ length: paddingBlanks }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-18 sm:h-26 rounded-2xl bg-slate-50/40 border border-transparent" />
            ))}

            {/* Calendar Days */}
            {calendarData?.days?.map((d) => {
              const isAuspicious = d.energyTier === 'auspicious';
              const isCaution = d.energyTier === 'caution';
              const isSelected = selectedDay?.dateStr === d.dateStr;
              const isSpecialLunar = d.lunarDay === 1 || d.lunarDay === 15;
              const isToday = d.isToday;
              const isPast = d.isPast && !isToday;

              return (
                <motion.div
                  key={d.dateStr}
                  whileHover={!isPast ? { y: -2 } : {}}
                  onClick={() => handleSelectDay(d)}
                  className={`relative h-18 sm:h-26 p-1.5 sm:p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                    isSelected 
                      ? 'ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/80 shadow-md z-10' 
                      : isToday
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-500/80'
                        : isPast
                          ? (isAuspicious 
                              ? 'border-emerald-200/50 bg-emerald-50/20 opacity-70 text-slate-600' 
                              : (isCaution 
                                  ? 'border-rose-200/50 bg-rose-50/20 opacity-70 text-slate-600' 
                                  : 'border-slate-100 bg-white opacity-40 text-slate-400'))
                          : isAuspicious
                            ? 'border-emerald-300/80 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-50 shadow-2xs'
                            : isCaution
                              ? 'border-rose-300/80 bg-rose-50/50 hover:border-rose-400 hover:bg-rose-50 shadow-2xs'
                              : 'border-slate-200/70 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  {/* TOP ROW: SOLAR DAY & TODAY BADGE / ENERGY DOT */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className={`text-xs sm:text-base font-black font-[Montserrat] ${
                        isToday ? 'text-indigo-700' : (isPast ? 'text-slate-400' : 'text-slate-800')
                      }`}>
                        {d.day}
                      </span>
                      {isToday && (
                        <span className="hidden sm:inline-block text-[8px] font-black px-1.5 py-0.2 rounded bg-indigo-600 text-white uppercase tracking-wider shadow-2xs">
                          Nay
                        </span>
                      )}
                    </div>

                    {/* Energy Dot: Chỉ tô màu cho ngày tốt (xanh) và ngày xấu (đỏ), ngày bình thường giữ trung tính */}
                    {isAuspicious ? (
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" title={`Ngày tốt: ${d.score}đ`} />
                    ) : isCaution ? (
                      <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0" title={`Ngày xấu/thận trọng: ${d.score}đ`} />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0 opacity-40" title={`Bình thường: ${d.score}đ`} />
                    )}
                  </div>

                  {/* MIDDLE: TAG / THAP THAN (DESKTOP) */}
                  <div className="hidden sm:block my-0.5">
                    {d.tag && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md truncate block text-center ${
                        isPast
                          ? 'bg-slate-100 text-slate-400'
                          : (isAuspicious ? 'bg-emerald-100/90 text-emerald-800' : (isCaution ? 'bg-rose-100/90 text-rose-800' : 'bg-slate-100 text-slate-600'))
                      }`}>
                        {d.tag}
                      </span>
                    )}
                  </div>

                  {/* BOTTOM ROW: LUNAR DAY & CAN CHI */}
                  <div className={`flex items-center justify-between text-[10px] pt-1 border-t ${
                    isPast ? 'border-slate-200/50' : 'border-slate-100/80'
                  }`}>
                    {/* Lunar Day */}
                    <span className={`font-bold ${
                      isPast 
                        ? 'text-slate-400' 
                        : (isSpecialLunar ? 'text-rose-600 font-extrabold' : 'text-slate-500')
                    }`}>
                      {d.lunarDay === 1 ? `1/${d.lunarMonth}` : (d.lunarDay === 15 ? '15' : d.lunarDay)}
                    </span>

                    {/* Can Chi Ngày */}
                    <span className="text-[9px] text-slate-400 font-medium hidden sm:inline truncate">
                      {d.dayCanChi}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 3.5. 1-LINE COMPACT FOOTER NOTE */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center">
            {/* Ngày Tốt */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
              <span className="font-extrabold text-emerald-900">Ngày Tốt</span>
            </div>

            {/* Bình Thường */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
              <span className="font-bold text-slate-700">Bình Thường</span>
            </div>

            {/* Ngày Xấu / Thận Trọng */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0" />
              <span className="font-extrabold text-rose-800">Ngày Xấu / Thận Trọng</span>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-medium shrink-0">
            *Nhấp ngày bất kỳ để xem chi tiết giờ hoàng đạo
          </span>
        </div>
      </div>

      {/* 4. DAY DETAIL PANEL */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-sm">
                  {selectedDay.day}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 font-[Montserrat]">
                    {selectedDay.dayCanChi} • {selectedDay.dateStr}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Âm lịch: Ngày {selectedDay.lunarDay} tháng {selectedDay.lunarMonth} • {selectedDay.truc} • {selectedDay.deityName} ({selectedDay.deityType})
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStoryModalOpen(true)}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>Xuất Thiệp Story</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedDay(null); setDayDetail(null); }}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {isLoadingDay ? (
              <div className="py-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
                <RefreshCw size={16} className="animate-spin text-indigo-600" />
                <span>Đang tải chi tiết ngày...</span>
              </div>
            ) : dayDetail ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Col 1: Điểm số & Tương tác */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Điểm Vận Khí Ngày:</span>
                    <span className="text-lg font-black text-indigo-700">{dayDetail.score}/100</span>
                  </div>
                  {dayDetail.thapThan && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        {calendarMode === 'year' ? 'Mệnh Niên:' : 'Thập Thần Ngày:'}
                      </span>
                      <span className="font-bold text-slate-800">{dayDetail.thapThan}</span>
                    </div>
                  )}
                  {dayDetail.highlights?.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block">
                        Tương tác bản mệnh:
                      </span>
                      {dayDetail.highlights.map((hl, i) => (
                        <p key={i} className="text-xs text-slate-700 font-medium">✦ {hl}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Col 2: Top 3 Giờ Hoàng Đạo */}
                <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-900">
                    <Clock size={15} className="text-indigo-600" />
                    <span>3 Giờ Hoàng Đạo Hợp Bản Mệnh:</span>
                  </div>
                  <div className="space-y-1.5">
                    {dayDetail.luckyHours?.map((h, i) => (
                      <div key={i} className="p-2 rounded-xl bg-white border border-indigo-100/70 flex items-center justify-between text-xs">
                        <span className="font-black text-indigo-950">Giờ {h.canChi}</span>
                        <span className="font-medium text-slate-600">{h.range}</span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {h.deity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 3: Việc nên & không nên làm */}
                <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 space-y-2 text-xs">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Việc Nên Làm:</span>
                  </div>
                  <ul className="space-y-0.5 text-slate-700 pl-4 list-disc text-[11px]">
                    {dayDetail.adviceDo?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <div className="font-extrabold text-amber-900 flex items-center gap-1 pt-1.5 border-t border-emerald-100">
                    <AlertTriangle size={14} className="text-amber-600" />
                    <span>Điều Kiêng Kỵ:</span>
                  </div>
                  <ul className="space-y-0.5 text-slate-700 pl-4 list-disc text-[11px]">
                    {dayDetail.adviceDont?.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. SHAREABLE STORY MODAL */}
      <ShareableStoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        data={dayDetail || selectedDay}
        type="almanac"
        user={user}
      />
    </div>
  );
}
