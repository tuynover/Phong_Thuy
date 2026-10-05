import React, { useState, useEffect, useContext, useMemo } from 'react';
import { 
  Compass, 
  Sparkles, 
  Building, 
  Calendar, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Check, 
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { AuthContext } from '@/context/AuthContext';
import FeiXingCompass from './FeiXingCompass';
import CustomSelect from '@/components/common/CustomSelect';

const PERIOD_OPTIONS = [
  { value: 9, label: 'Vận 9 (2024 – 2043) • Cửu Tử Ly Hỏa (Đương Vận)', years: '2024 - 2043' },
  { value: 8, label: 'Vận 8 (2004 – 2023) • Bát Bạch Cấn Thổ', years: '2004 - 2023' },
  { value: 7, label: 'Vận 7 (1984 – 2003) • Thất Xích Đoài Kim', years: '1984 - 2003' },
  { value: 6, label: 'Vận 6 (1964 – 1983) • Lục Bạch Càn Kim', years: '1964 - 1983' },
  { value: 5, label: 'Vận 5 (1944 – 1963) • Ngũ Hoàng Trung Cung', years: '1944 - 1963' },
  { value: 4, label: 'Vận 4 (1924 – 1943) • Tứ Lục Tốn Mộc', years: '1924 - 1943' },
  { value: 3, label: 'Vận 3 (1904 – 1923) • Tam Bích Chấn Mộc', years: '1904 - 1923' },
  { value: 2, label: 'Vận 2 (1884 – 1903) • Nhị Hắc Khôn Thổ', years: '1884 - 1903' },
  { value: 1, label: 'Vận 1 (1864 – 1883) • Nhất Bạch Khảm Thủy', years: '1864 - 1883' }
];

const CAN_CHI_HOURS = [
  { value: '', label: 'Chưa rõ giờ sinh' },
  { value: '23', label: 'Giờ Tý (23h00 - 00h59)' },
  { value: '1', label: 'Giờ Sửu (01h00 - 02h59)' },
  { value: '3', label: 'Giờ Dần (03h00 - 04h59)' },
  { value: '5', label: 'Giờ Mão (05h00 - 06h59)' },
  { value: '7', label: 'Giờ Thìn (07h00 - 08h59)' },
  { value: '9', label: 'Giờ Tị (09h00 - 10h59)' },
  { value: '11', label: 'Giờ Ngọ (11h00 - 12h59)' },
  { value: '13', label: 'Giờ Mùi (13h00 - 14h59)' },
  { value: '15', label: 'Giờ Thân (15h00 - 16h59)' },
  { value: '17', label: 'Giờ Dậu (17h00 - 18h59)' },
  { value: '19', label: 'Giờ Tuất (19h00 - 20h59)' },
  { value: '21', label: 'Giờ Hợi (21h00 - 22h59)' }
];

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: String(i + 1),
  label: `Ngày ${i + 1}`
}));

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`
}));

const currentYearNum = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 101 }, (_, i) => {
  const y = currentYearNum - i;
  return { value: String(y), label: `Năm ${y}` };
});

const parseInitialBirth = (rawDate) => {
  if (!rawDate) return { day: '', month: '', year: '' };
  const str = String(rawDate).trim();
  const parts = str.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return { year: parts[0], month: String(parseInt(parts[1], 10)), day: String(parseInt(parts[2], 10)) };
    } else if (parts[2].length === 4) {
      return { year: parts[2], month: String(parseInt(parts[1], 10)), day: String(parseInt(parts[0], 10)) };
    }
  } else if (/^\d{4}$/.test(str)) {
    return { year: str, month: '', day: '' };
  }
  return { day: '', month: '', year: '' };
};

// Helper tính Mệnh Quái preview
const GUA_LOOKUP = {
  1: { cung: 'Khảm', element: 'Thủy', group: 'Đông tứ mệnh' },
  2: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
  3: { cung: 'Chấn', element: 'Mộc', group: 'Đông tứ mệnh' },
  4: { cung: 'Tốn', element: 'Mộc', group: 'Đông tứ mệnh' },
  5: { 
    male: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
    female: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' }
  },
  6: { cung: 'Càn', element: 'Kim', group: 'Tây tứ mệnh' },
  7: { cung: 'Đoài', element: 'Kim', group: 'Tây tứ mệnh' },
  8: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' },
  9: { cung: 'Ly', element: 'Hỏa', group: 'Đông tứ mệnh' }
};

const getMenhQuaiPreview = (solarYear, gender) => {
  const y = parseInt(solarYear, 10);
  if (isNaN(y) || y < 1900 || y > 2100) return null;
  let sum = y;
  while (sum >= 10) {
    sum = String(sum).split('').reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  let guaNum;
  if (parseInt(gender, 10) === 1) {
    guaNum = 11 - sum;
    if (guaNum <= 0) guaNum += 9;
    while (guaNum > 9) guaNum -= 9;
  } else {
    guaNum = 4 + sum;
    while (guaNum > 9) guaNum -= 9;
  }
  const gua = GUA_LOOKUP[guaNum];
  if (guaNum === 5) {
    return parseInt(gender, 10) === 1 ? gua.male : gua.female;
  }
  return gua;
};

export default function FeiXingInput({ onSubmit, loading = false, initialData = null }) {
  const { user } = useContext(AuthContext);

  // Năm hiện tại: 2026 (thuộc Vận 9)
  const currentYear = new Date().getFullYear();

  const [ownerName, setOwnerName] = useState(initialData?.ownerName || (user?.name || 'Gia Chủ'));
  const [title, setTitle] = useState(initialData?.title || 'Lá Số Phong Thủy Nhà Ở');
  const [buildingYear, setBuildingYear] = useState(initialData?.buildingYear !== undefined && initialData?.buildingYear !== null ? initialData.buildingYear : currentYear);
  const [period, setPeriod] = useState(initialData?.period || 9);
  const [facingDegree, setFacingDegree] = useState(initialData?.facingDegree || 180);

  // Thông tin ngày tháng năm sinh gia chủ (Tách rời 3 ô: Ngày, Tháng, Năm - Yêu Cầu 2)
  const initialBirth = parseInitialBirth(initialData?.ownerBirthInfo?.birthDate || user?.birthDate || user?.baziInfo?.birthDate);
  const [birthDay, setBirthDay] = useState(initialBirth.day);
  const [birthMonth, setBirthMonth] = useState(initialBirth.month);
  const [birthYear, setBirthYear] = useState(initialBirth.year);
  const [birthHour, setBirthHour] = useState(initialData?.ownerBirthInfo?.birthHour !== null && initialData?.ownerBirthInfo?.birthHour !== undefined ? String(initialData.ownerBirthInfo.birthHour) : '');
  const [gender, setGender] = useState(initialData?.ownerBirthInfo?.gender !== undefined ? initialData.ownerBirthInfo.gender : (user?.gender === 'female' || user?.gender === 0 ? 0 : 1));

  // Tự động nhận diện Vận khi khởi tạo hoặc khi năm xây dựng thay đổi
  const determinePeriodFromYear = (yr) => {
    const yrNum = parseInt(yr, 10);
    if (!isNaN(yrNum)) {
      if (yrNum >= 2024 && yrNum <= 2043) return 9;
      if (yrNum >= 2004 && yrNum <= 2023) return 8;
      if (yrNum >= 1984 && yrNum <= 2003) return 7;
      if (yrNum >= 1964 && yrNum <= 1983) return 6;
      if (yrNum >= 1944 && yrNum <= 1963) return 5;
      if (yrNum >= 1924 && yrNum <= 1943) return 4;
      if (yrNum >= 1904 && yrNum <= 1923) return 3;
      if (yrNum >= 1884 && yrNum <= 1903) return 2;
      if (yrNum >= 1864 && yrNum <= 1883) return 1;
    }
    return 9;
  };

  const handleYearChange = (e) => {
    const yr = e.target.value;
    setBuildingYear(yr);
    if (yr) {
      const p = determinePeriodFromYear(yr);
      setPeriod(p);
    }
  };

  // Preview Mệnh Quái gia chủ (tính theo năm sinh gia chủ)
  const menhQuaiPreview = useMemo(() => {
    if (!birthYear) return null;
    return getMenhQuaiPreview(birthYear, gender);
  }, [birthYear, gender]);

  // Autofill user's info
  const handleUseMyInfo = () => {
    if (!user) return;
    if (user.name) setOwnerName(user.name);
    if (user.gender === 'female' || user.gender === 0) setGender(0);
    else setGender(1);
    
    const parsed = parseInitialBirth(user.birthDate || user.baziInfo?.birthDate);
    if (user.baziInfo?.year) parsed.year = String(user.baziInfo.year);
    if (user.baziInfo?.month) parsed.month = String(user.baziInfo.month);
    if (user.baziInfo?.day) parsed.day = String(user.baziInfo.day);

    if (parsed.day) setBirthDay(parsed.day);
    if (parsed.month) setBirthMonth(parsed.month);
    if (parsed.year) setBirthYear(parsed.year);

    if (user.birthHour !== undefined && user.birthHour !== null) {
      setBirthHour(String(user.birthHour));
    } else if (user.baziInfo?.hour !== undefined && user.baziInfo?.hour !== null) {
      setBirthHour(String(user.baziInfo.hour));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let computedBirthDate = '';
    if (birthYear) {
      if (birthMonth && birthDay) {
        computedBirthDate = `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`;
      } else {
        computedBirthDate = String(birthYear);
      }
    }

    if (onSubmit) {
      onSubmit({
        ownerName: ownerName.trim() || 'Gia Chủ',
        title: title.trim() || 'Lá Số Phong Thủy Nhà Ở',
        period: parseInt(period, 10),
        buildingYear: buildingYear ? parseInt(buildingYear, 10) : null,
        facingDegree: parseFloat(facingDegree),
        birthDate: computedBirthDate,
        birthHour: birthHour !== '' ? parseInt(birthHour, 10) : null,
        gender: parseInt(gender, 10)
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 shadow-sm">
          <Compass className="w-4 h-4 text-amber-700 animate-spin-slow" />
          Huyền Không Phi Tinh & Bát Trạch Minh Kính Cổ Truyền
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Lập Tinh Bàn Phong Thủy Nhà Ở
        </h2>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Khảo sát Cửu Cung Lạc Thư, 24 Sơn Hướng, Thế Quái Bàn và tương phối giữa <b className="text-amber-800">Bản Mệnh Gia Chủ</b> với <b className="text-amber-800">Trạch Đất</b>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Fields (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Section 1: Thông Tin Trạch Đất */}
          <div className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-lg shadow-amber-900/5 space-y-4">
            <div className="border-b border-amber-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-600" />
                Thông Tin Trạch Đất & Công Trình
              </h3>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                Tam Nguyên Cửu Vận
              </span>
            </div>

            {/* Tên Công Trình */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tên Công Trình / Ghi Chú</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Ví dụ: Nhà riêng số 18, Căn hộ 1205..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-amber-50/30 border border-amber-200 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition text-sm"
              />
            </div>

            {/* Năm Xây Dựng & Tự Động Xác Định Vận (Yêu Cầu 1) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  Năm Xây Dựng / Nhập Trạch
                </label>
                <span className="text-xs font-black text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Vận {period} (Tự động xác định)
                </span>
              </div>
              <input
                type="number"
                min="1864"
                max="2100"
                value={buildingYear}
                onChange={handleYearChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                placeholder={`Mặc định: ${currentYear}`}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-amber-50/30 border border-amber-200 text-slate-800 font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition text-sm"
                required
              />
            </div>

            {/* Banner Thông Báo Tự Động Xác Định Vận */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Hệ thống <b>tự động xác định Vận {period}</b> cho năm {buildingYear || currentYear} ({PERIOD_OPTIONS.find(p => p.value === period)?.label || 'Cửu Tử Ly Hỏa'}).
              </span>
            </div>
          </div>

          {/* Section 2: Thông Tin Bản Mệnh Gia Chủ (Yêu Cầu 3) */}
          <div className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-lg shadow-amber-900/5 space-y-4">
            <div className="border-b border-amber-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" />
                Bản Mệnh Gia Chủ (Bát Trạch Phối Mệnh)
              </h3>
              {user && (
                <button
                  type="button"
                  onClick={handleUseMyInfo}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100/80 hover:bg-amber-200/80 text-amber-800 text-[11px] font-bold transition border border-amber-300"
                >
                  <UserCheck className="w-3 h-3 text-amber-700" />
                  Dùng thông tin của tôi
                </button>
              )}
            </div>

            {/* Họ Tên & Giới Tính */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
              <div className="sm:col-span-7 space-y-1">
                <label className="text-xs font-bold text-slate-700">Họ Tên Gia Chủ</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-amber-50/30 border border-amber-200 text-slate-800 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-none transition text-sm"
                  required
                />
              </div>

              {/* Giới tính toggle Nam / Nữ */}
              <div className="sm:col-span-5 space-y-1">
                <label className="text-xs font-bold text-slate-700">Giới Tính</label>
                <div className="flex rounded-2xl p-1 bg-amber-50/50 border border-amber-200">
                  <button
                    type="button"
                    onClick={() => setGender(1)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      gender === 1
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Nam
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender(0)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      gender === 0
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Nữ
                  </button>
                </div>
              </div>
            </div>

            {/* Ngày Tháng Năm Sinh Tách Rời (Yêu Cầu 2: Tách ra các ô độc lập cho người dùng nhập nhanh) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Ngày - Tháng - Năm Sinh (Dương Lịch)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold mb-1 ml-1 text-center">NGÀY</span>
                  <CustomSelect
                    value={birthDay}
                    onChange={setBirthDay}
                    options={DAY_OPTIONS}
                    placeholder="Ngày"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold mb-1 ml-1 text-center">THÁNG</span>
                  <CustomSelect
                    value={birthMonth}
                    onChange={setBirthMonth}
                    options={MONTH_OPTIONS}
                    placeholder="Tháng"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold mb-1 ml-1 text-center">NĂM</span>
                  <CustomSelect
                    value={birthYear}
                    onChange={setBirthYear}
                    options={YEAR_OPTIONS}
                    placeholder="Năm"
                  />
                </div>
              </div>
            </div>

            {/* Giờ Sinh Can Chi */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Giờ Sinh Can Chi
              </label>
              <CustomSelect
                value={birthHour}
                onChange={setBirthHour}
                options={CAN_CHI_HOURS}
                placeholder="Chọn giờ sinh (tùy chọn)..."
              />
            </div>

            {/* Cung Phi Preview Pill */}
            {menhQuaiPreview ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Cung Phi: <b>Cung {menhQuaiPreview.cung} ({menhQuaiPreview.element})</b>
                </span>
                <span className="font-black px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {menhQuaiPreview.group}
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                * Nhập ngày tháng năm sinh để hệ thống tính Cung Phi Bát Trạch và đối soát tương phối với Tọa Hướng ngôi nhà.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Virtual Compass (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-3.5 sm:p-6 border border-amber-200/90 shadow-lg shadow-amber-900/5 flex flex-col items-center">
          <div className="w-full border-b border-amber-100 pb-3 mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-600" />
              La Kinh Bát Quái Hoàng Gia (24 Sơn Hướng)
            </h3>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
              Chạm xoay 360°
            </span>
          </div>

          <FeiXingCompass
            value={facingDegree}
            onChange={(deg) => setFacingDegree(deg)}
          />

          {/* Submit Action Button (Tối ưu scale gọn gàng trên mobile, không bị thô to) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold sm:font-black text-sm sm:text-base tracking-wide bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:from-amber-700 hover:to-amber-800 shadow-md sm:shadow-xl shadow-amber-600/25 hover:shadow-amber-600/40 transform active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-xs sm:text-sm">Đang Lập Tinh Bàn Cửu Cung...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>LẬP TINH BÀN HUYỀN KHÔNG</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
