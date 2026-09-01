import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Sparkles } from 'lucide-react';
import CustomSelect from './CustomSelect';
import FloatingErrorToast from './FloatingErrorToast';
import { validateInputDate, getMaxDaysInMonth } from '../utils/dateValidator';
import { LunarYear, LunarMonth } from 'lunar-javascript';

export default function ZiweiInput({ 
    onSubmit, 
    activeUser, 
    onRequireLogin, 
    handleViewOwnZiwei 
}) {
    const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
    const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const years = Array.from({ length: 97 }, (_, i) => String(2026 - i));
    const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

    // Không nhập sẵn giá trị mặc định cho Ziwei
    const [calendarMode, setCalendarMode] = useState('solar'); // solar | lunar
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [gender, setGender] = useState('Nam');
    const [name, setName] = useState('');
    const [isLeap, setIsLeap] = useState(false);
    const [hasLeap, setHasLeap] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');



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

    // Real-time dynamic validation for ZiweiInput
    useEffect(() => {
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
    }, [day, month, year]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!day || !month || !year) {
            setErrorMsg('Vui lòng chọn đầy đủ ngày, tháng và năm sinh.');
            return;
        }

        if (!hour || minute === undefined || minute === '') {
            setErrorMsg('Vui lòng nhập đầy đủ giờ và phút sinh.');
            return;
        }

        if (calendarMode === 'solar') {
            const val = validateInputDate(day, month, year);
            if (!val.isValid) {
                setErrorMsg(val.message);
                return;
            }
        }

        if (onSubmit) {
            onSubmit({
                day,
                month,
                year,
                hour,
                minute,
                gender,
                name,
                calendarMode,
                isLeap
            });
        }
    };

    return (
        <>
            <FloatingErrorToast message={errorMsg} onClose={() => setErrorMsg('')} />
            <div className="w-full max-w-6xl mx-auto px-4 pb-12 font-sans">
                {/* Xem lá số của bản thân */}
                {activeUser && (
                    <div className="max-w-xl mx-auto mb-10 text-center animate-in fade-in duration-300">
                        <button 
                            type="button"
                            onClick={handleViewOwnZiwei}
                            className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 border border-amber-400/40 text-amber-300 px-8 py-4 rounded-2xl font-extrabold shadow-lg shadow-purple-950/20 hover:shadow-purple-900/40 hover:scale-[1.01] active:scale-[0.99] transition-all text-lg w-full mb-4 cursor-pointer flex items-center justify-center gap-2"
                        >
                            <Sparkles size={20} className="text-amber-400" />
                            Xem Lá Số Của Bản Thân
                        </button>
                        <div className="flex items-center gap-4 py-2">
                            <div className="h-px bg-purple-200/60 flex-1"></div>
                            <span className="text-purple-600 font-extrabold text-xs uppercase tracking-wider">Hoặc lập lá số mới</span>
                            <div className="h-px bg-purple-200/60 flex-1"></div>
                        </div>
                    </div>
                )}

                {/* INPUT FORM */}
                <div className="bg-white/95 backdrop-blur-md p-6 md:p-10 rounded-3xl shadow-xl shadow-purple-900/5 border border-purple-100 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
                    <div className="flex items-center gap-3 justify-center mb-6">
                        <div className="p-2 rounded-xl bg-purple-500 text-white shadow-md shadow-purple-500/20">
                            <Sparkles size={20} />
                        </div>
                        <h3 id="ziwei-input-header" className="text-xl md:text-2xl font-extrabold text-slate-800 uppercase tracking-tight">
                            Nhập Thông Tin Tử Vi
                        </h3>
                    </div>
                    <p className="text-slate-500 text-center text-sm md:text-base leading-relaxed mb-8">
                        Hệ thống an sao Bắc Phái tự động quy đổi lịch pháp để lập đồ hình 12 Cung và truyền đạt bài luận chi tiết chính xác nhất.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* TAB SELECTOR */}
                        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-full max-w-sm mx-auto mb-6 border border-slate-200/50 shadow-inner">
                            <button type="button" onClick={() => setCalendarMode('solar')} className={`flex-1 text-center py-2 rounded-xl text-xs font-extrabold transition-all duration-300 ${calendarMode === 'solar' ? 'bg-white text-purple-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>Dương lịch</button>
                            <button type="button" onClick={() => setCalendarMode('lunar')} className={`flex-1 text-center py-2 rounded-xl text-xs font-extrabold transition-all duration-300 ${calendarMode === 'lunar' ? 'bg-white text-purple-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700'}`}>Âm lịch</button>
                        </div>

                        {/* Họ và tên */}
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2.5 ml-1">
                                Họ và Tên (Không bắt buộc)
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nhập họ và tên..."
                                className="w-full bg-slate-50 border border-slate-200 text-slate-905 text-sm rounded-2xl block p-3.5 font-bold transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm"
                            />
                        </div>

                        {/* Giới Tính */}
                        <div>
                            <label id="ziwei-input-gender" className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2.5 ml-1">
                                Giới Tính Mệnh Cách
                            </label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 cursor-pointer transition-all ${gender === 'Nam' ? 'border-purple-500 bg-purple-50/30 text-purple-700 font-extrabold shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                    <input type="radio" name="gender" value="Nam" checked={gender === 'Nam'} onChange={() => setGender('Nam')} className="hidden" />
                                    <User size={18} /> Nam Mệnh
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 cursor-pointer transition-all ${gender === 'Nữ' ? 'border-purple-500 bg-purple-50/30 text-purple-700 font-extrabold shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'}`}>
                                    <input type="radio" name="gender" value="Nữ" checked={gender === 'Nữ'} onChange={() => setGender('Nữ')} className="hidden" />
                                    <User size={18} /> Nữ Mệnh
                                </label>
                            </div>
                        </div>

                        {/* Ngày Tháng Năm Sinh */}
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2.5 ml-1 flex items-center gap-1.5">
                                <Calendar size={14} className="text-purple-500" /> Ngày - Tháng - Năm Sinh ({calendarMode === 'solar' ? 'Dương Lịch' : 'Âm Lịch'})
                            </label>
                            <div className="flex gap-3">
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
                                <div className="flex-[1.5]">
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
                            <div className="flex items-center gap-3 p-3 bg-purple-50/50 border border-purple-100/50 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="checkbox"
                                    id="ziweiIsLeap"
                                    checked={isLeap}
                                    onChange={(e) => setIsLeap(e.target.checked)}
                                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                                />
                                <label htmlFor="ziweiIsLeap" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                                    Sinh vào tháng nhuận (Tháng {month} nhuận)
                                </label>
                            </div>
                        )}

                        {/* Thời Gian Sinh */}
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-500 tracking-wider mb-2.5 ml-1 flex items-center gap-1.5">
                                <Clock size={14} className="text-purple-500" /> Thời Gian Sinh
                            </label>
                            <div className="flex gap-3">
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
                                <div className="flex items-center pt-5 font-black text-slate-400 text-xl">:</div>
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
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={!day || !month || !year || !hour || minute === '' || !!errorMsg}
                                className="w-full flex justify-center items-center py-4 px-6 rounded-2xl shadow-lg text-base font-extrabold text-white bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 focus:outline-none transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none cursor-pointer"
                            >
                                Lập Lá Số & Xem Giải Đoán
                            </button>
                        </div>
                    </form>

                    {/* Academic Informational Cards */}
                    <div className="mt-10 border-t border-slate-100 pt-8 w-full space-y-8 text-left font-sans animate-in fade-in duration-300">
                        <div className="bg-white p-6 md:p-8 rounded-3xl border border-purple-50 shadow-sm space-y-6">
                            <h4 className="text-sm font-extrabold text-purple-800 uppercase tracking-widest text-center">Kiến thức học thuật Tử Vi</h4>
                            
                            <div className="space-y-6">
                                <div className="border-b border-slate-100 pb-5">
                                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-6 rounded bg-purple-600 block"></span>
                                        1. Tử Vi Đẩu Số là gì?
                                    </h5>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                                        Tử Vi Đẩu Số là môn mệnh lý học đồ sộ dựa trên giờ sinh và ngày tháng năm sinh âm lịch để thiết lập một sơ đồ an sao gọi là Mệnh Bàn Tinh Đồ. Mệnh bàn gồm 12 cung số, mô tả chi tiết các khía cạnh cuộc đời con người.
                                    </p>
                                    <ul className="list-disc pl-8 text-xs text-slate-500 space-y-1 font-medium">
                                        <li><strong>Tinh hệ chính tinh (14):</strong> Gồm các sao chủ quản lớn như Tử Vi, Thiên Phủ, Vũ Khúc, Thái Dương... quyết định tính chất căn bản của cung vị.</li>
                                        <li><strong>Các trục đối cung:</strong> Cung đối xứng trực tiếp (như Mệnh và Di, Quan và Thê) tương tác năng lượng mạnh mẽ bổ trợ lẫn nhau.</li>
                                    </ul>
                                </div>

                                <div className="border-b border-slate-100 pb-5">
                                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-6 rounded bg-purple-600 block"></span>
                                        2. Phương pháp luận Mệnh Bàn chuyên sâu
                                    </h5>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                                        Quy trình đọc hiểu lá số Tử Vi kết hợp giữa tiên thiên mệnh cách và hậu thiên nỗ lực hành động:
                                    </p>
                                    <ul className="list-disc pl-8 text-xs text-slate-500 space-y-1.5 font-medium">
                                        <li><strong>Cung Mệnh / Thân:</strong> Cung Mệnh là tư chất tiên thiên (trước 30 tuổi), Cung Thân là nỗ lực hậu thiên và hậu vận (sau 30 tuổi).</li>
                                        <li><strong>Tam Phương Tứ Chính:</strong> Xem xét sự tương tác của cụm 3 cung tam hợp (ví dụ: Mệnh - Tài - Quan) và cung xung chiếu để đánh giá tổng thể thời vận.</li>
                                        <li><strong>Cát Tinh & Hung Tinh:</strong> Đánh giá mức độ đắc địa hãm địa của Văn Xương, Văn Khúc, Tả Phụ, Hữu Bật (cát) đối chiếu với Kình Dương, Đà La, Hỏa Tinh, Linh Tinh (hung).</li>
                                    </ul>
                                </div>

                                <div>
                                    <h5 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-6 rounded bg-purple-600 block"></span>
                                        3. Bản luận giải mệnh lý cung cấp những gì?
                                    </h5>
                                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed pl-3.5 mb-2">
                                        Bài phân tích mệnh bàn chi tiết cung cấp:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-3.5 mt-3">
                                        <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/50">
                                            <span className="block text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">✓ Đồ hình Mệnh Bàn 12 Cung</span>
                                            <span className="text-[11px] text-slate-500 font-medium block">Bản đồ trực quan hiển thị vị trí đắc/hãm địa của hơn 100 sao tại Mệnh, Phụ, Phúc, Điền, Quan, Nô, Di, Tật, Tài, Tử, Phu, Huynh.</span>
                                        </div>
                                        <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/50">
                                            <span className="block text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">✓ Phân tích Cung Mệnh cốt lõi</span>
                                            <span className="text-[11px] text-slate-500 font-medium block">Chi tiết về năng lực bản thân, tính cách bẩm sinh, ngoại hình và xu hướng tư duy nghề nghiệp phù hợp.</span>
                                        </div>
                                        <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/50">
                                            <span className="block text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">✓ Vận trình Tài Bạch & Quan Lộc</span>
                                            <span className="text-[11px] text-slate-500 font-medium block">Dự đoán tài vận hanh thông hay bấp bênh, ngành nghề thăng tiến vượt trội và thời cơ làm ăn.</span>
                                        </div>
                                        <div className="bg-purple-50/40 p-3 rounded-xl border border-purple-100/50">
                                            <span className="block text-xs font-bold text-purple-800 uppercase tracking-wider mb-1">✓ Dự báo Lưu Niên / Hạn Năm</span>
                                            <span className="text-[11px] text-slate-500 font-medium block">Cảnh báo cụ thể về sức khỏe, đi lại, cơ hội công việc trong năm hiện tại giúp chủ động đón cát lánh hung.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
