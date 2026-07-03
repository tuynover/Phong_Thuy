import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, ChevronDown } from 'lucide-react';

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

  const filteredOptions = options.filter(opt => opt.includes(search));

  const handleInputChange = (e) => {
    const val = e.target.value;
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

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!mDay || !mMonth || !mYear || !mHour || !mMinute || !fDay || !fMonth || !fYear || !fHour || !fMinute) {
            alert('Vui lòng chọn đầy đủ thông tin ngày giờ sinh cho cả Nam và Nữ.');
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
        <div className="flex flex-col items-center bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl border border-gray-100 max-w-4xl mx-auto font-sans">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wide text-center">Lập Lá Số Hợp Hôn (Bát Tự Hợp Hôn)</h3>
            <p className="text-gray-500 mb-8 text-center text-[15px] max-w-2xl">Nhập đầy đủ thông tin ngày giờ sinh Dương lịch của Nam và Nữ để hệ thống quy đổi tiết khí và đối chiếu tương sinh hợp khắc.</p>

            <form onSubmit={handleSubmit} className="w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* MALE BLOCK */}
                    <div className="p-6 rounded-2xl border-2 border-blue-100 bg-blue-50/10 space-y-6">
                        <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                <User className="w-4 h-4" />
                            </div>
                            <h4 className="text-lg font-bold text-blue-900 uppercase">Thông Tin Nam Mệnh</h4>
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
                        className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-md text-lg font-bold text-white bg-gradient-to-r from-blue-700 to-rose-700 hover:from-blue-800 hover:to-rose-800 focus:outline-none transition-transform hover:-translate-y-1"
                    >
                        Lập Lá Số Hợp Hôn
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MarriageInput;
