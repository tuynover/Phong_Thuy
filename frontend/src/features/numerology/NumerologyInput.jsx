import React, { useState, useMemo, useContext } from 'react';
import { 
  Smartphone, 
  Car, 
  CreditCard, 
  Sparkles, 
  Calendar, 
  Clock,
  User, 
  ArrowRight, 
  Coins, 
  CheckCircle2, 
  HelpCircle,
  Wifi, 
  Zap 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '@/context/AuthContext';
import CustomSelect from '@/components/common/CustomSelect';
import CanhGioGuideModal from '@/components/common/CanhGioGuideModal';
import { getCanhGioInfo } from '@/utils/canhGioHelper';
import { validateInputDate, getMaxDaysInMonth } from '@/utils/dateValidator';
import { LunarYear, LunarMonth } from 'lunar-javascript';

export default function NumerologyInput({ onSubmit, isLoading }) {
  const { user } = useContext(AuthContext);

  // Arrays for birth date & time options
  const days = useMemo(() => Array.from({ length: 31 }, (_, i) => String(i + 1)), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i + 1)), []);
  const years = useMemo(() => Array.from({ length: 97 }, (_, i) => String(2026 - i)), []);
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

  // Loại hình: 'sim', 'plate', 'bank'
  const [type, setType] = useState('sim');
  // Chế độ: 'quick' (Xem Nhanh) hoặc 'bazi' (Xem Phối Bát Tự)
  const [mode, setMode] = useState('quick');

  // Giá trị số nhập vào
  const [numberInput, setNumberInput] = useState('');

  // Form thông tin sinh thần Bát Tự (Chủ yếu tự nhập, kèm 1 nút "Sử dụng thông tin bản thân")
  const [calendarMode, setCalendarMode] = useState('solar'); // solar | lunar
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [isLeap, setIsLeap] = useState(false);
  const [showCanhGioModal, setShowCanhGioModal] = useState(false);
  const [ownerName, setOwnerName] = useState(() => user?.name || '');
  const [gender, setGender] = useState(() => {
    if (user?.gender !== undefined) {
      return (user.gender === 0 || user.gender === 'female') ? 0 : 1;
    }
    return 1;
  });
  const [autoFilledToast, setAutoFilledToast] = useState(false);
  const [formError, setFormError] = useState('');

  // Tự động kiểm tra tháng nhuận cho Âm lịch
  const hasLeap = useMemo(() => {
    if (calendarMode === 'lunar' && year && month) {
      try {
        const ly = LunarYear.fromYear(parseInt(year, 10));
        const leapMonth = ly ? ly.getLeapMonth() : 0;
        return leapMonth > 0 && parseInt(month, 10) === leapMonth;
      } catch {
        return false;
      }
    }
    return false;
  }, [calendarMode, year, month]);

  // Tự động giới hạn số ngày theo tháng/năm
  const maxDays = useMemo(() => {
    if (!month || !year) return 31;
    if (calendarMode === 'lunar') {
      try {
        const lm = LunarMonth.fromYm(parseInt(year, 10), isLeap && hasLeap ? -parseInt(month, 10) : parseInt(month, 10));
        return lm ? lm.getDayCount() : 30;
      } catch {
        return 30;
      }
    }
    return getMaxDaysInMonth(month, year);
  }, [calendarMode, month, year, isLeap, hasLeap]);

  const [prevClampKey, setPrevClampKey] = useState('');
  const currentClampKey = `${calendarMode}:${month}:${year}:${isLeap && hasLeap}`;
  if (currentClampKey !== prevClampKey) {
    setPrevClampKey(currentClampKey);
    const dNum = parseInt(day, 10);
    if (!isNaN(dNum) && dNum > maxDays) {
      setDay(String(maxDays));
    }
  }

  // Nút Sử dụng thông tin bản thân: tự động điền thông tin của user vào form
  const handleUseSelfInfo = () => {
    if (!user) {
      setFormError('Vui lòng đăng nhập để sử dụng thông tin bản thân.');
      return;
    }
    let uDay = '', uMonth = '', uYear = '', uHour = '12', uMinute = '00';
    if (user.baziInfo?.day && user.baziInfo?.month && user.baziInfo?.year) {
      uDay = String(user.baziInfo.day);
      uMonth = String(user.baziInfo.month);
      uYear = String(user.baziInfo.year);
      if (user.baziInfo.hour !== undefined && user.baziInfo.hour !== null) {
        uHour = String(user.baziInfo.hour).padStart(2, '0');
      }
      if (user.baziInfo.minute !== undefined && user.baziInfo.minute !== null) {
        uMinute = String(user.baziInfo.minute).padStart(2, '0');
      }
    } else if (user.birthDate) {
      const parts = user.birthDate.split('-');
      if (parts.length === 3) {
        uYear = parts[0];
        uMonth = String(parseInt(parts[1], 10));
        uDay = String(parseInt(parts[2], 10));
      }
      if (user.birthHour) {
        const tParts = user.birthHour.split(':');
        uHour = String(tParts[0] || '12').padStart(2, '0');
        uMinute = String(tParts[1] || '00').padStart(2, '0');
      }
    }

    if (!uDay || !uMonth || !uYear) {
      setFormError('Hồ sơ của bạn chưa có ngày sinh. Vui lòng cập nhật trong Hồ sơ cá nhân.');
      return;
    }

    setOwnerName(user.name || 'Gia Chủ');
    setCalendarMode('solar');
    setIsLeap(false);
    setDay(uDay);
    setMonth(uMonth);
    setYear(uYear);
    setHour(uHour);
    setMinute(uMinute);
    setGender((user.gender === 0 || user.gender === 'female') ? 0 : 1);
    setFormError('');
    setAutoFilledToast(true);
    setTimeout(() => setAutoFilledToast(false), 3000);
  };

  // Tên gia chủ hiển thị trên thẻ đồ họa
  const activeOwnerName = useMemo(() => {
    if (mode === 'bazi') {
      return ownerName.trim() || user?.name || 'Gia Chủ';
    }
    return user?.name || 'Gia Chủ';
  }, [mode, ownerName, user]);

  // Xử lý nhập liệu theo từng loại hình có cấu trúc định sẵn nghiêm ngặt
  const handleNumberChange = (val) => {
    setFormError('');
    if (type === 'plate') {
      // Biển số xe: chỉ lấy số, giới hạn đúng 5 chữ số
      const digitsOnly = val.replace(/\D/g, '').slice(0, 5);
      setNumberInput(digitsOnly);
      return;
    }
    if (type === 'sim') {
      // Sim số: chỉ lấy số, giới hạn đúng 10 chữ số
      const digitsOnly = val.replace(/\D/g, '').slice(0, 10);
      setNumberInput(digitsOnly);
      return;
    }
    if (type === 'bank') {
      // Tài khoản ngân hàng: chỉ lấy số, tối đa 16 số
      const digitsOnly = val.replace(/\D/g, '').slice(0, 16);
      setNumberInput(digitsOnly);
      return;
    }
    setNumberInput(val);
  };

  // Định dạng hiển thị trực quan trên thẻ đồ họa (Live graphic format)
  const formattedDisplay = useMemo(() => {
    const raw = numberInput.trim();

    if (type === 'plate') {
      if (!raw) return '591.23';
      if (raw.length === 5) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
      return raw;
    }

    if (type === 'sim') {
      if (!raw) return '0988.xxx.xxx';
      if (raw.length <= 4) return raw;
      if (raw.length <= 7) return `${raw.slice(0, 4)}.${raw.slice(4)}`;
      return `${raw.slice(0, 4)}.${raw.slice(4, 7)}.${raw.slice(7, 10)}`;
    }

    // Bank account: gom cụm 4 chữ số
    if (!raw) return 'xxxx xxxx xxxx';
    return raw.replace(/(\d{4})(?=\d)/g, '$1 ') || raw;
  }, [numberInput, type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const cleanDigits = numberInput.replace(/\D/g, '');

    // Kiểm tra chặt chẽ số lượng chữ số theo yêu cầu
    if (type === 'plate') {
      if (cleanDigits.length !== 5) {
        setFormError('Biển số xe yêu cầu nhập đủ đúng 5 chữ số (Ví dụ: 59123 -> hiển thị 591.23). Không cần nhập mã vùng tỉnh thành.');
        return;
      }
    } else if (type === 'sim') {
      if (cleanDigits.length !== 10) {
        setFormError('Số điện thoại (Sim) yêu cầu nhập đủ đúng 10 chữ số (Ví dụ: 0988199199).');
        return;
      }
    } else if (type === 'bank') {
      if (cleanDigits.length < 10 || cleanDigits.length > 16) {
        setFormError('Số tài khoản ngân hàng thông dụng phải từ 10 đến 16 chữ số.');
        return;
      }
    } else {
      if (cleanDigits.length < 3) {
        setFormError('Dãy số phải chứa tối thiểu 3 chữ số.');
        return;
      }
    }

    if (mode === 'bazi') {
      if (!day || !month || !year) {
        setFormError('Vui lòng chọn đầy đủ ngày, tháng và năm sinh của gia chủ.');
        return;
      }
      if (!hour || minute === '') {
        setFormError('Vui lòng chọn đầy đủ giờ và phút sinh của gia chủ.');
        return;
      }

      if (calendarMode === 'solar') {
        const val = validateInputDate(day, month, year, hour, minute);
        if (!val.isValid) {
          setFormError(val.message);
          return;
        }
      }
    }

    const formattedDate = (day && month && year) 
      ? `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}` 
      : '';
    const formattedTime = (hour !== '' && minute !== '') 
      ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` 
      : '12:00';

    onSubmit({
      rawInput: numberInput,
      type,
      mode,
      ownerName: mode === 'bazi' ? (ownerName.trim() || 'Gia Chủ') : 'Gia Chủ',
      birthDate: mode === 'bazi' ? formattedDate : '',
      birthHour: mode === 'bazi' ? formattedTime : '12:00',
      gender: mode === 'bazi' ? gender : 1,
      calendarMode: mode === 'bazi' ? calendarMode : 'solar',
      isLeap: mode === 'bazi' ? isLeap : false
    });
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        {/* HEADER SECTION */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-900 text-xs font-bold tracking-wider uppercase mb-3">
            <Sparkles size={14} className="text-amber-600" />
            Số Học Cát Tường Tam Nguyên
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight font-[Cinzel,serif]">
            Khảo Sát Số Lý & Cát Tường Khí Vận
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Ứng dụng phối hợp Huyền Không Phi Tinh Động Vận, Kinh Dịch Mai Hoa Lập Quẻ và Bát Tự Mệnh Chủ để tìm ra năng lượng số hòa hợp, hưng vượng tài lộc.
          </p>
        </div>

        {/* TARGET TABS (SIM - BIỂN SỐ 5 SỐ - SỐ TÀI KHOẢN) */}
        <div className="flex p-1.5 bg-slate-200/70 backdrop-blur-md rounded-2xl sm:rounded-3xl max-w-md mx-auto mb-8 border border-slate-300/50 shadow-inner">
          <button
            type="button"
            onClick={() => { setType('sim'); setNumberInput(''); setFormError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              type === 'sim'
                ? 'bg-white text-amber-900 shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Smartphone size={16} className={type === 'sim' ? 'text-amber-600' : ''} />
            <span>Sim Số</span>
          </button>

          <button
            type="button"
            onClick={() => { setType('plate'); setNumberInput(''); setFormError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              type === 'plate'
                ? 'bg-white text-blue-900 shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <Car size={16} className={type === 'plate' ? 'text-blue-600' : ''} />
            <span>Biển Số Xe</span>
          </button>

          <button
            type="button"
            onClick={() => { setType('bank'); setNumberInput(''); setFormError(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              type === 'bank'
                ? 'bg-white text-emerald-900 shadow-md scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            <CreditCard size={16} className={type === 'bank' ? 'text-emerald-600' : ''} />
            <span>Số Tài Khoản</span>
          </button>
        </div>

        {/* LIVE GRAPHIC PREVIEW CARD (3 LOẠI VỚI BỐ CỤC ĐẶC THÙ RIÊNG BIỆT) */}
        <div className="mb-8 flex justify-center">
          <AnimatePresence mode="wait">
            {/* 1. SIM CARD PREVIEW */}
            {type === 'sim' && (
              <motion.div
                key="sim-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-sm h-52 rounded-3xl p-6 bg-gradient-to-tr from-amber-700 via-amber-600 to-yellow-500 text-white shadow-xl shadow-amber-900/15 border-2 border-yellow-300/40 overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent pointer-events-none" />
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black tracking-widest uppercase bg-black/25 px-2.5 py-1 rounded-full border border-white/20">
                      SIM CÁT TƯỜNG
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-yellow-200">
                    <Wifi size={16} />
                    <span className="text-[11px] font-bold">5G LTE+</span>
                  </div>
                </div>

                {/* Gold Chip Graphic */}
                <div className="my-auto flex items-center gap-4 z-10">
                  <div className="w-14 h-11 rounded-lg bg-gradient-to-tr from-yellow-300 via-yellow-100 to-yellow-400 border border-yellow-500/60 shadow-inner relative flex items-center justify-center overflow-hidden shrink-0">
                    <div className="absolute inset-0 border border-amber-600/30 rounded-md m-1" />
                    <div className="w-full h-[1px] bg-amber-600/30 absolute" />
                    <div className="h-full w-[1px] bg-amber-600/30 absolute" />
                    <div className="w-4 h-4 rounded-full border border-amber-600/40 absolute" />
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-100 tracking-wider uppercase font-semibold">Sim Số Điện Thoại</div>
                    <div className="text-xl sm:text-2xl font-black tracking-widest text-white drop-shadow-sm font-mono">
                      {formattedDisplay}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end z-10 text-[11px] text-yellow-100 font-medium">
                  <span>Tam Nguyên Cửu Vận</span>
                  <span className="font-bold">{activeOwnerName}</span>
                </div>
              </motion.div>
            )}

            {/* 2. BIỂN SỐ XE 5 SỐ (CẤU TRÚC ĐỊNH SẴN 5 SỐ CHUẨN VIỆT NAM) */}
            {type === 'plate' && (
              <motion.div
                key="plate-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-sm h-48 rounded-2xl p-5 bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 shadow-xl shadow-slate-900/10 border-4 border-slate-800 overflow-hidden flex flex-col justify-between"
              >
                <div className="flex justify-between items-center z-10 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-red-600 rounded-xs flex items-center justify-center relative overflow-hidden">
                      <span className="text-[7px] text-yellow-300">★</span>
                    </div>
                    <span className="text-[11px] font-black tracking-widest text-slate-800">BIỂN SỐ 5 SỐ</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    DỊCH MÃ BÌNH AN
                  </span>
                </div>

                {/* 5-digit license plate styling */}
                <div className="text-center my-auto z-10 py-2">
                  <div className="inline-block px-5 py-2 rounded-xl bg-white border-2 border-slate-300 shadow-inner">
                    <div className="text-3xl sm:text-4xl font-black tracking-widest text-slate-900 font-mono drop-shadow-xs">
                      {formattedDisplay}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-1">Định dạng 5 số chuẩn: xxx.xx</div>
                </div>

                <div className="flex justify-between items-center z-10 text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-200">
                  <span>Vạn Dặm Bình An</span>
                  <span className="text-slate-800 font-bold">{activeOwnerName}</span>
                </div>
              </motion.div>
            )}

            {/* 3. TÀI KHOẢN NGÂN HÀNG (CẤU TRÚC CARD DIGITAL BANKING TÁCH NHÓM 4 SỐ) */}
            {type === 'bank' && (
              <motion.div
                key="bank-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-sm h-52 rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-neutral-900 to-black text-white shadow-2xl shadow-black/40 border border-neutral-700/80 overflow-hidden flex flex-col justify-between"
              >
                <div className="flex justify-between items-start z-10">
                  <div className="text-sm font-black tracking-wider text-amber-400 uppercase font-[Montserrat]">
                    TÀI KHOẢN NGÂN HÀNG
                  </div>
                  <div className="text-[10px] tracking-widest font-extrabold text-neutral-400 uppercase bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-700">
                    KIM KHỐ TỤ TÀI
                  </div>
                </div>

                <div className="my-auto z-10 flex items-center gap-3">
                  <div className="w-12 h-9 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-amber-600/40 shadow-md relative flex items-center justify-center shrink-0">
                    <div className="w-3 h-3 rounded-full border border-amber-800/40 absolute" />
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-neutral-400 font-medium">Số Tài Khoản</div>
                    <div className="text-base sm:text-lg font-bold tracking-widest text-neutral-100 font-mono">
                      {formattedDisplay}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-end z-10 text-[11px] text-neutral-400">
                  <div>
                    <div className="text-[9px] uppercase tracking-wider text-neutral-500">Chủ Tài Khoản</div>
                    <div className="font-bold text-neutral-200 uppercase">{activeOwnerName}</div>
                  </div>
                  <div className="text-amber-400 font-black tracking-wider text-xs">
                    CÁT TƯỜNG KHÍ
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FORM INPUTS */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-6 sm:p-8">
          
          {/* MODE SELECTOR (QUICK VS BAZI) - CHỈ HIỆN "Xem Phối Bát Tự", KHÔNG CÓ CHỮ "AI" */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Chế Độ Khảo Sát
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => { setMode('quick'); setFormError(''); }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  mode === 'quick'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap size={15} className={mode === 'quick' ? 'text-amber-500' : ''} />
                <span>Xem Nhanh (Số Học)</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode('bazi'); setFormError(''); }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  mode === 'bazi'
                    ? 'bg-white text-amber-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles size={15} className={mode === 'bazi' ? 'text-amber-600' : ''} />
                <span>Xem Phối Bát Tự</span>
              </button>
            </div>
          </div>

          {/* NUMBER INPUT (CẤU TRÚC ĐỊNH SẴN RIÊNG CHO TỪNG LOẠI VỚI ĐỘ DÀI NGHIÊM NGẶT) */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {type === 'sim' && 'Số Điện Thoại Cần Khảo Sát (Đủ đúng 10 số)'}
              {type === 'plate' && '5 Chữ Số Biển Xe (Đủ đúng 5 số, không cần mã vùng)'}
              {type === 'bank' && 'Số Tài Khoản Ngân Hàng (Từ 10 đến 16 số)'}
            </label>
            
            <div className="relative">
              {type === 'sim' && (
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={numberInput}
                    onChange={(e) => handleNumberChange(e.target.value)}
                    placeholder="Ví dụ: 0988199199"
                    maxLength={10}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all font-mono"
                  />
                </div>
              )}

              {type === 'plate' && (
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={numberInput}
                    onChange={(e) => handleNumberChange(e.target.value)}
                    placeholder="Ví dụ: 59123 hoặc 88888 (hiển thị 591.23)"
                    maxLength={5}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-lg font-black tracking-widest placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-mono text-center"
                  />
                </div>
              )}

              {type === 'bank' && (
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={numberInput}
                    onChange={(e) => handleNumberChange(e.target.value)}
                    placeholder="Ví dụ: 190368688888"
                    maxLength={16}
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono tracking-wider"
                  />
                </div>
              )}
            </div>

            <p className="mt-1.5 text-xs text-slate-500">
              {type === 'sim' && 'Phân tích Cửu Tinh Đương Vận, Ngũ Hành tương sinh và Quẻ Dịch Mai Hoa cho sim đúng 10 số.'}
              {type === 'plate' && 'Chỉ cần nhập đúng 5 chữ số trên biển kiểm soát xe (Ví dụ: 59123). Không cần nhập mã vùng tỉnh thành.'}
              {type === 'bank' && 'Chỉ cần nhập dãy số tài khoản ngân hàng (10-16 số). Đánh giá năng lượng Kim Khố và tụ tài sinh lộc.'}
            </p>
          </div>

          {/* OWNER & BIRTH INFO (KHI MODE === BAZI): FORM TỰ NHẬP CHUẨN MỰC + 1 NÚT SỬ DỤNG THÔNG TIN BẢN THÂN */}
          <AnimatePresence>
            {mode === 'bazi' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="pt-4 border-t border-slate-100 space-y-4 mb-6 overflow-hidden"
              >
                {/* Header khu vực Sinh Thần + Nút Sử Dụng Thông Tin Bản Thân */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-amber-600" />
                    <span>Thông Tin Sinh Thần (Bát Tự Phối Trạch)</span>
                  </div>

                  {user && (
                    <button
                      type="button"
                      onClick={handleUseSelfInfo}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95 self-start sm:self-auto"
                      title="Tự động điền ngày sinh từ tài khoản của bạn"
                    >
                      <User size={13} className="text-amber-700" />
                      <span>Sử Dụng Thông Tin Bản Thân</span>
                    </button>
                  )}
                </div>

                {/* Toast thông báo đã điền tự động */}
                {autoFilledToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                    <span>Đã điền thông tin sinh thần từ hồ sơ của bạn ({user?.name || 'Tài khoản cá nhân'}).</span>
                  </motion.div>
                )}

                {/* Form Tự Nhập Thông Tin Sinh Thần Theo Chuẩn Đồng Bộ Bát Tự & Tử Vi */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
                  {/* TAB CHUYỂN DƯƠNG LỊCH / ÂM LỊCH */}
                  <div className="flex bg-slate-200/80 p-1 rounded-2xl w-full max-w-xs mx-auto border border-slate-300/50 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setCalendarMode('solar')}
                      className={`flex-1 text-center py-2 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                        calendarMode === 'solar'
                          ? 'bg-white text-amber-900 shadow-md scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Dương lịch
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarMode('lunar')}
                      className={`flex-1 text-center py-2 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                        calendarMode === 'lunar'
                          ? 'bg-white text-amber-900 shadow-md scale-[1.02]'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      Âm lịch
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* TÊN GIA CHỦ */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tên Người Cần Xem
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn A"
                          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* GIỚI TÍNH */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Giới Tính
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setGender(1)}
                          className={`py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                            gender === 1
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Nam
                        </button>
                        <button
                          type="button"
                          onClick={() => setGender(0)}
                          className={`py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                            gender === 0
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          Nữ
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* NGÀY THÁNG NĂM SINH (3 COMBOBOX SELECTOR CHUẨN) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar size={14} className="text-amber-600" />
                      Ngày - Tháng - Năm Sinh ({calendarMode === 'solar' ? 'Dương Lịch' : 'Âm Lịch'})
                    </label>
                    <div className="flex gap-2.5 sm:gap-3">
                      <div className="flex-1">
                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">NGÀY</span>
                        <CustomSelect
                          value={day}
                          onChange={setDay}
                          options={days}
                          placeholder="DD"
                          editable={true}
                        />
                      </div>
                      <div className="flex-1">
                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">THÁNG</span>
                        <CustomSelect
                          value={month}
                          onChange={setMonth}
                          options={months}
                          placeholder="MM"
                          editable={true}
                        />
                      </div>
                      <div className="flex-[1.4]">
                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">NĂM</span>
                        <CustomSelect
                          value={year}
                          onChange={setYear}
                          options={years}
                          placeholder="YYYY"
                          editable={true}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Switch Tháng nhuận cho Âm lịch */}
                  {calendarMode === 'lunar' && hasLeap && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200/70 rounded-2xl shadow-xs">
                      <input
                        type="checkbox"
                        id="numerologyIsLeap"
                        checked={isLeap}
                        onChange={(e) => setIsLeap(e.target.checked)}
                        className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                      />
                      <label htmlFor="numerologyIsLeap" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                        Sinh vào tháng nhuận (Tháng {month} nhuận)
                      </label>
                    </div>
                  )}

                  {/* THỜI GIAN SINH (GIỜ & PHÚT CHUẨN) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={14} className="text-amber-600" /> Thời Gian Sinh
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCanhGioModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-950 font-bold cursor-pointer hover:underline"
                      >
                        <HelpCircle size={12} /> Hướng dẫn & 12 Canh Giờ
                      </button>
                    </div>
                    <div className="flex gap-2.5 sm:gap-3 items-center">
                      <div className="flex-1">
                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">GIỜ (0-23)</span>
                        <CustomSelect
                          value={hour}
                          onChange={setHour}
                          options={hours}
                          placeholder="HH"
                          editable={true}
                        />
                      </div>
                      <div className="pt-4 font-black text-slate-400 text-lg">:</div>
                      <div className="flex-1">
                        <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">PHÚT (0-59)</span>
                        <CustomSelect
                          value={minute}
                          onChange={setMinute}
                          options={minutes}
                          placeholder="Min"
                          editable={true}
                        />
                      </div>
                    </div>

                    {/* Reassuring note & Canh Giờ real-time detection */}
                    <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-800 font-extrabold shrink-0">💡 Lưu ý:</span>
                        <span className="text-[11px] leading-tight">Chỉ cần đúng khung giờ, số phút có thể ước lượng (mặc định 00 hoặc 30).</span>
                      </div>
                      {getCanhGioInfo(hour) && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 font-extrabold text-[11px] border border-amber-200 shrink-0 self-start sm:self-auto">
                          <span>Canh Giờ:</span>
                          <span className="text-amber-800 font-black">{getCanhGioInfo(hour).chi} ({getCanhGioInfo(hour).range})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ERROR BANNER */}
          {formError && (
            <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold">
              {formError}
            </div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-white font-extrabold text-sm sm:text-base tracking-wider uppercase shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang tính toán học thuật...</span>
              </div>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Khảo Sát Số Học</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {mode === 'bazi' && (
            <div className="mt-3 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Coins size={14} className="text-amber-600" />
              <span>Phân tích học thuật hoàn toàn miễn phí • Luận giải AI chuyên sâu tiêu hao <strong>100 Điểm</strong></span>
            </div>
          )}
        </form>
      </div>

      {/* Modal Hướng dẫn 12 Canh Giờ */}
      <CanhGioGuideModal 
        isOpen={showCanhGioModal} 
        onClose={() => setShowCanhGioModal(false)} 
        selectedHour={hour} 
      />
    </>
  );
}
