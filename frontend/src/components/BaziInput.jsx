import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, User, ChevronDown, HelpCircle } from 'lucide-react';

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
        <div className="flex flex-col items-center bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl border border-gray-100 max-w-3xl mx-auto font-sans">
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
    );
};

export default BaziInput;
