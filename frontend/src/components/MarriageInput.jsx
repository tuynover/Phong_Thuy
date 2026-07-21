import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, ChevronDown, HelpCircle } from 'lucide-react';

// UNIFIED COMBOBOX COMPONENT - ALLOWS TYPING AND SELECTING
function CustomSelect({ value, onChange, options, placeholder, borderClass, focusBorderClass, hoverClass, activeClass }) {
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

  const filteredOptions = options.filter(opt => String(opt).includes(String(search)));

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
          className={`bg-white border text-center text-gray-950 text-base rounded-xl block w-full p-2.5 font-bold transition-all focus:outline-none pr-8 shadow-sm ${borderClass} ${isOpen ? focusBorderClass : ''}`}
        />
        <ChevronDown
          size={14}
          className="absolute right-2 top-4 text-gray-400 cursor-pointer shrink-0"
          onClick={() => setIsOpen(!isOpen)}
        />
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg py-1.5 max-h-48 overflow-y-auto text-center font-bold">
          {filteredOptions.map(opt => (
            <li
              key={opt}
              onClick={() => {
                onChange(opt);
                setSearch(opt);
                setIsOpen(false);
              }}
              className={`px-3 py-1.5 text-sm cursor-pointer transition-colors ${hoverClass} ${value === opt ? activeClass : 'text-gray-700'}`}
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

const MarriageInput = ({ onComplete }) => {
    // Male state
    const [mDay, setMDay] = useState('');
    const [mMonth, setMMonth] = useState('');
    const [mYear, setMYear] = useState('');
    const [mHour, setMHour] = useState('');
    const [mMinute, setMMinute] = useState('');

    // Female state
    const [fDay, setFDay] = useState('');
    const [fMonth, setFMonth] = useState('');
    const [fYear, setFYear] = useState('');
    const [fHour, setFHour] = useState('');
    const [fMinute, setFMinute] = useState('');

    const [errorMsg, setErrorMsg] = useState('');

    // Auto-clamp Male Day when Month or Year changes
    useEffect(() => {
        if (mDay && mMonth && mYear) {
            const maxDays = getMaxDaysInMonth(mMonth, mYear);
            const dNum = parseInt(mDay, 10);
            if (!isNaN(dNum) && dNum > maxDays) {
                setMDay(String(maxDays));
            }
        }
    }, [mMonth, mYear, mDay]);

    // Auto-clamp Female Day when Month or Year changes
    useEffect(() => {
        if (fDay && fMonth && fYear) {
            const maxDays = getMaxDaysInMonth(fMonth, fYear);
            const dNum = parseInt(fDay, 10);
            if (!isNaN(dNum) && dNum > maxDays) {
                setFDay(String(maxDays));
            }
        }
    }, [fMonth, fYear, fDay]);

    // Real-time dynamic validation for Male & Female
    useEffect(() => {
        if (mDay || mMonth || mYear || mHour || mMinute) {
            const valM = validateInputDate(mDay, mMonth, mYear, mHour, mMinute);
            if (!valM.isValid) {
                setErrorMsg(`Thông tin Nam: ${valM.message}`);
                return;
            }
        }
        if (fDay || fMonth || fYear || fHour || fMinute) {
            const valF = validateInputDate(fDay, fMonth, fYear, fHour, fMinute);
            if (!valF.isValid) {
                setErrorMsg(`Thông tin Nữ: ${valF.message}`);
                return;
            }
        }
        setErrorMsg('');
    }, [mDay, mMonth, mYear, mHour, mMinute, fDay, fMonth, fYear, fHour, fMinute]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg('');
        
        if (!mDay || !mMonth || !mYear || !mHour || !mMinute || !fDay || !fMonth || !fYear || !fHour || !fMinute) {
            setErrorMsg('Vui lòng chọn đầy đủ thông tin ngày giờ sinh cho cả Nam và Nữ.');
            return;
        }

        const valM = validateInputDate(mDay, mMonth, mYear, mHour, mMinute);
        if (!valM.isValid) {
            setErrorMsg(`Thông tin Nam: ${valM.message}`);
            return;
        }

        const valF = validateInputDate(fDay, fMonth, fYear, fHour, fMinute);
        if (!valF.isValid) {
            setErrorMsg(`Thông tin Nữ: ${valF.message}`);
            return;
        }

        // Pad and construct dates/times
        const mD = String(mDay).padStart(2, '0');
        const mM = String(mMonth).padStart(2, '0');
        const mY = String(mYear);
        const mH = String(mHour).padStart(2, '0');
        const mMin = String(mMinute).padStart(2, '0');

        const fD = String(fDay).padStart(2, '0');
        const fM = String(fMonth).padStart(2, '0');
        const fY = String(fYear);
        const fH = String(fHour).padStart(2, '0');
        const fMin = String(fMinute).padStart(2, '0');

        const maleData = {
            date: `${mD}/${mM}/${mY}`,
            time: `${mH}:${mMin}`
        };

        const femaleData = {
            date: `${fD}/${fM}/${fY}`,
            time: `${fH}:${fMin}`
        };
        
        onComplete(maleData, femaleData);
    };

    // Arrays of options
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const years = Array.from({ length: 97 }, (_, i) => String(2026 - i));
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    return (
        <>
            <FloatingErrorToast message={errorMsg} onClose={() => setErrorMsg('')} />
            <div className="flex flex-col items-center bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl border border-gray-100 max-w-4xl mx-auto font-sans">
                <h3 id="marriage-input-header" className="text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wide text-center">Lập Lá Số Hợp Hôn (Bát Tự Hợp Hôn)</h3>
                <p className="text-gray-500 mb-8 text-center text-[15px] max-w-2xl">Nhập đầy đủ thông tin ngày giờ sinh Dương lịch của Nam và Nữ để hệ thống quy đổi tiết khí và đối chiếu tương sinh hợp khắc.</p>

                <form onSubmit={handleSubmit} className="w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* MALE BLOCK */}
                    <div className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/10 space-y-6">
                        <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                <User className="w-4 h-4" />
                            </div>
                            <h4 id="marriage-input-nam" className="text-lg font-bold text-blue-900 uppercase">Thông Tin Nam Mệnh</h4>
                        </div>

                        {/* Birth date */}
                        <div>
                            <label className="block text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Ngày - Tháng - Năm Sinh (Dương lịch)
                            </label>
                            <div className="flex gap-2">
                                <CustomSelect
                                  value={mDay}
                                  onChange={setMDay}
                                  options={days}
                                  placeholder="Ngày"
                                  borderClass="border-blue-200"
                                  focusBorderClass="border-blue-500 ring-1 ring-blue-500"
                                  hoverClass="hover:bg-blue-50 hover:text-blue-900"
                                  activeClass="bg-blue-50 text-blue-800 font-extrabold"
                                />
                                <CustomSelect
                                  value={mMonth}
                                  onChange={setMMonth}
                                  options={months}
                                  placeholder="Tháng"
                                  borderClass="border-blue-200"
                                  focusBorderClass="border-blue-500 ring-1 ring-blue-500"
                                  hoverClass="hover:bg-blue-50 hover:text-blue-900"
                                  activeClass="bg-blue-50 text-blue-800 font-extrabold"
                                />
                                <CustomSelect
                                  value={mYear}
                                  onChange={setMYear}
                                  options={years}
                                  placeholder="Năm"
                                  borderClass="border-blue-200"
                                  focusBorderClass="border-blue-500 ring-1 ring-blue-500"
                                  hoverClass="hover:bg-blue-50 hover:text-blue-900"
                                  activeClass="bg-blue-50 text-blue-800 font-extrabold"
                                />
                            </div>
                        </div>

                        {/* Birth time */}
                        <div>
                            <label className="block text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Giờ & Phút Sinh
                            </label>
                            <div className="flex gap-2 items-center">
                                <CustomSelect
                                  value={mHour}
                                  onChange={setMHour}
                                  options={hours}
                                  placeholder="Giờ"
                                  borderClass="border-blue-200"
                                  focusBorderClass="border-blue-500 ring-1 ring-blue-500"
                                  hoverClass="hover:bg-blue-50 hover:text-blue-900"
                                  activeClass="bg-blue-50 text-blue-800 font-extrabold"
                                />
                                <div className="text-gray-400 font-bold">:</div>
                                <CustomSelect
                                  value={mMinute}
                                  onChange={setMMinute}
                                  options={minutes}
                                  placeholder="Phút"
                                  borderClass="border-blue-200"
                                  focusBorderClass="border-blue-500 ring-1 ring-blue-500"
                                  hoverClass="hover:bg-blue-50 hover:text-blue-900"
                                  activeClass="bg-blue-50 text-blue-800 font-extrabold"
                                />
                            </div>
                        </div>
                    </div>

                    {/* FEMALE BLOCK */}
                    <div className="p-6 rounded-2xl border-2 border-rose-100 bg-rose-50/10 space-y-6">
                        <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
                            <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white">
                                <User className="w-4 h-4" />
                            </div>
                            <h4 className="text-lg font-bold text-rose-900 uppercase">Thông Tin Nữ Mệnh</h4>
                        </div>

                        {/* Birth date */}
                        <div>
                            <label className="block text-xs font-bold text-rose-700 uppercase mb-2 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Ngày - Tháng - Năm Sinh (Dương lịch)
                            </label>
                            <div className="flex gap-2">
                                <CustomSelect
                                  value={fDay}
                                  onChange={setFDay}
                                  options={days}
                                  placeholder="Ngày"
                                  borderClass="border-rose-200"
                                  focusBorderClass="border-rose-500 ring-1 ring-rose-500"
                                  hoverClass="hover:bg-rose-50 hover:text-rose-900"
                                  activeClass="bg-rose-50 text-rose-800 font-extrabold"
                                />
                                <CustomSelect
                                  value={fMonth}
                                  onChange={setFMonth}
                                  options={months}
                                  placeholder="Tháng"
                                  borderClass="border-rose-200"
                                  focusBorderClass="border-rose-500 ring-1 ring-rose-500"
                                  hoverClass="hover:bg-rose-50 hover:text-rose-900"
                                  activeClass="bg-rose-50 text-rose-800 font-extrabold"
                                />
                                <CustomSelect
                                  value={fYear}
                                  onChange={setFYear}
                                  options={years}
                                  placeholder="Năm"
                                  borderClass="border-rose-200"
                                  focusBorderClass="border-rose-500 ring-1 ring-rose-500"
                                  hoverClass="hover:bg-rose-50 hover:text-rose-900"
                                  activeClass="bg-rose-50 text-rose-800 font-extrabold"
                                />
                            </div>
                        </div>

                        {/* Birth time */}
                        <div>
                            <label className="block text-xs font-bold text-rose-700 uppercase mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Giờ & Phút Sinh
                            </label>
                            <div className="flex gap-2 items-center">
                                <CustomSelect
                                  value={fHour}
                                  onChange={setFHour}
                                  options={hours}
                                  placeholder="Giờ"
                                  borderClass="border-rose-200"
                                  focusBorderClass="border-rose-500 ring-1 ring-rose-500"
                                  hoverClass="hover:bg-rose-50 hover:text-rose-900"
                                  activeClass="bg-rose-50 text-rose-800 font-extrabold"
                                />
                                <div className="text-gray-400 font-bold">:</div>
                                <CustomSelect
                                  value={fMinute}
                                  onChange={setFMinute}
                                  options={minutes}
                                  placeholder="Phút"
                                  borderClass="border-rose-200"
                                  focusBorderClass="border-rose-500 ring-1 ring-rose-500"
                                  hoverClass="hover:bg-rose-50 hover:text-rose-900"
                                  activeClass="bg-rose-50 text-rose-800 font-extrabold"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 max-w-sm mx-auto">
                    <button 
                        type="submit"
                        disabled={!mDay || !mMonth || !mYear || !mHour || !mMinute || !fDay || !fMonth || !fYear || !fHour || !fMinute || !!errorMsg}
                        className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-md text-lg font-bold text-white bg-gradient-to-r from-blue-700 to-rose-700 hover:from-blue-800 hover:to-rose-800 focus:outline-none transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        Lập Lá Số Hợp Hôn
                    </button>
                </div>
            </form>

            {/* Academic Informational Cards & FAQs */}
            <div className="mt-10 border-t border-slate-100 pt-8 w-full space-y-8 text-left font-sans">
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-rose-50 shadow-sm space-y-6">
                <h4 className="text-sm font-extrabold text-rose-800 uppercase tracking-widest text-center">Kiến thức học thuật Bát Tự Hợp Hôn</h4>
                
                <div className="space-y-6">
                  {/* Item 1 */}
                  <div className="border-b border-slate-100 pb-5">
                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-rose-600 block"></span>
                      1. Bát Tự Hợp Hôn là gì?
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Bát Tự Hợp Hôn (hay còn gọi là đối chiếu lá số phu thê) là phương pháp xem tuổi vợ chồng khoa học và chuyên sâu nhất. Phương pháp này xem xét sự hòa hợp của toàn bộ 8 chữ (Giờ, Ngày, Tháng, Năm sinh) của cả hai người thay vì chỉ xem tuổi con giáp sơ sài.
                    </p>
                    <ul className="list-disc pl-8 text-xs text-slate-500 space-y-1 font-medium">
                      <li><strong>Độ hòa hợp Can Chi:</strong> Đo lường sự đồng điệu bẩm sinh trong mối quan hệ vợ chồng.</li>
                      <li><strong>Ngũ hành bổ trợ:</strong> Xem xét ngũ hành của người này có là Hỷ/Dụng thần bù đắp cho người kia hay không.</li>
                    </ul>
                  </div>

                  {/* Item 2 */}
                  <div className="border-b border-slate-100 pb-5">
                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-rose-600 block"></span>
                      2. Quy trình đối sánh lá số phu thê
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Thuật số đối sánh hợp hôn sử dụng các trụ cột thông tin cốt lõi sau:
                    </p>
                    <ul className="list-disc pl-8 text-xs text-slate-500 space-y-1.5 font-medium">
                      <li><strong>Nhật Chi (Phu Thê Cung):</strong> Địa chi của ngày sinh đại diện cho người phối ngẫu. Sự tương tác sinh khắc giữa hai Nhật Chi thể hiện sự hòa hợp trong cuộc sống hằng ngày.</li>
                      <li><strong>Cung Phi Bát Quái:</strong> Xác định các cung phi bát quái (Càn, Khôn, Chấn, Tốn...) kết hợp xem thuộc nhóm Diên Niên, Sinh Khí (tốt) hay Tuyệt Mệnh, Họa Hại (hung).</li>
                      <li><strong>Ngũ Hành Nạp Âm:</strong> Đối sánh tương sinh tương khắc giữa mệnh nạp âm (ví dụ Hải Trung Kim và Lộ Bàng Thổ).</li>
                    </ul>
                  </div>

                  {/* Item 3 */}
                  <div>
                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-6 rounded bg-rose-600 block"></span>
                      3. Bản phân tích phu thê cung cấp chi tiết gì?
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                      Bài luận giải hợp hôn chuyên sâu cung cấp báo cáo:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3.5 mt-3">
                      <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50">
                        <span className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">✓ Chỉ số hòa hợp tổng quan (%)</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Điểm số phần trăm phản ánh độ tương hợp tổng thể dựa trên thuật toán tích hợp các tiêu chí Can, Chi, Cung Phi, Nạp Âm.</span>
                      </div>
                      <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50">
                        <span className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">✓ Đánh giá chi tiết 5 Trụ Cột</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Phân tích từng khía cạnh: Can ngày (tâm tính), Chi ngày (phu thê), Trụ năm (tổ tông), Cung phi (gia đạo), Nạp âm (mệnh).</span>
                      </div>
                      <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50">
                        <span className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">✓ Ưu thế duyên phận</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Liệt kê các điểm mạnh giúp vợ chồng nâng đỡ sự nghiệp, tài lộc và gắn kết tình cảm.</span>
                      </div>
                      <div className="bg-rose-50/40 p-3 rounded-xl border border-rose-100/50">
                        <span className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">✓ Giải pháp hóa giải xung khắc</span>
                        <span className="text-[11px] text-slate-500 font-medium block">Phương pháp hóa giải thực tế (hướng giường ngủ, bếp, năm sinh con) giúp chuyển hung thành cát nếu gặp xung khắc.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQs section */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-150 shadow-sm space-y-6">
                <h4 className="text-sm font-extrabold text-rose-800 uppercase tracking-widest text-center">Các câu hỏi thường gặp về Hợp Hôn</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                      <HelpCircle size={15} className="text-rose-600 shrink-0" />
                      Hai tuổi phạm "Tứ Hành Xung" thì có kết hôn được không?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                      Hoàn toàn có thể kết hôn. Tứ hành xung chỉ xét theo Địa Chi năm sinh (rất sơ sài). Hợp hôn chuyên sâu cần xem xét tương tác ngũ hành toàn diện của 8 chữ (Bát Tự) của cả hai người, đặc biệt là Nhật Can và Phu Thê Cung để tìm phương án hóa giải thực tế.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                      <HelpCircle size={15} className="text-rose-600 shrink-0" />
                      Cung Phi Bát Quái có vai trò gì trong việc xem tuổi vợ chồng?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                      Cung Phi Bát Quái (như Càn kết hợp Khôn được Diên Niên, Ly kết hợp Chấn được Sinh Khí...) giúp đánh giá mức độ đồng điệu về phong cách sống, thế giới quan và định hướng xây dựng tổ ấm chung của hai vợ chồng.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/70">
                    <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm mb-1.5 flex items-center gap-1.5">
                      <HelpCircle size={15} className="text-rose-600 shrink-0" />
                      Làm sao để hóa giải khi vợ chồng gặp phải xung khắc lớn trên lá số?
                    </h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed pl-5">
                      Có nhiều cách hóa giải hiệu quả như: chọn năm sinh con hợp tuổi bố mẹ để tạo cầu nối điều hòa ngũ hành, thiết kế phong thủy nhà ở (đặt hướng bếp, giường ngủ quay về hướng cát lành của người gánh vác chính) để giải trừ xung khắc.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
    );
};

export default MarriageInput;
