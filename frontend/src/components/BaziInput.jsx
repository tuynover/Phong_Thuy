import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, ChevronDown } from 'lucide-react';

// UNIFIED COMBOBOX SELECTOR (BLUE THEME)
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
          className={`bg-gray-50 border border-gray-200 text-center text-gray-905 text-base rounded-xl block w-full p-2.5 font-bold transition-all focus:outline-none pr-8 shadow-sm ${isOpen ? 'ring-2 ring-blue-550 border-blue-550' : ''}`}
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

const BaziInput = ({ onComplete }) => {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [gender, setGender] = useState(1); // 1 = Nam, 0 = Nữ

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!day || !month || !year || !hour || !minute) {
            alert('Vui lòng điền đầy đủ ngày giờ sinh.');
            return;
        }

        // Pad single digits with leading zero
        const d = String(day).padStart(2, '0');
        const m = String(month).padStart(2, '0');
        const y = String(year);
        const h = String(hour).padStart(2, '0');
        const min = String(minute).padStart(2, '0');

        const formattedDate = `${d}/${m}/${y}`;
        const formattedTime = `${h}:${min}`;
        
        onComplete(formattedDate, formattedTime, gender);
    };

    // Arrays of options
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const years = Array.from({ length: 97 }, (_, i) => String(2026 - i));
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    return (
        <div className="flex flex-col items-center bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl border border-gray-100 max-w-xl mx-auto font-sans">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wide">Nhập Thông Tin Bát Tự</h3>
            <p className="text-gray-500 mb-8 text-center text-[15px]">Hệ thống phân tích Tứ Trụ Tử Bình sẽ tự động quy đổi Âm/Dương lịch và Tiết khí để lập lá số chính xác nhất.</p>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                
                {/* Giới tính */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Giới Tính (Quyết định chiều Đại Vận)</label>
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${gender === 1 ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <input type="radio" name="gender" value={1} checked={gender === 1} onChange={() => setGender(1)} className="hidden" />
                            <User className="w-5 h-5" /> Nam Mệnh
                        </label>
                        <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${gender === 0 ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                            <input type="radio" name="gender" value={0} checked={gender === 0} onChange={() => setGender(0)} className="hidden" />
                            <User className="w-5 h-5" /> Nữ Mệnh
                        </label>
                    </div>
                </div>

                {/* Ngày tháng năm */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Ngày - Tháng - Năm Sinh (Dương lịch)
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

                {/* Giờ phút */}
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Thời Gian Sinh
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
                              placeholder="MM"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <button 
                        type="submit"
                        className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-md text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-transform hover:-translate-y-1"
                    >
                        Lập Lá Số & Phân Tích
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BaziInput;
