import React, { useState } from 'react';
import { Calendar, Clock, User } from 'lucide-react';

const BaziInput = ({ onComplete }) => {
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [hour, setHour] = useState('');
    const [minute, setMinute] = useState('');
    const [gender, setGender] = useState(1); // 1 = Nam, 0 = Nữ

    const handleSubmit = (e) => {
        e.preventDefault();
        
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

    return (
        <div className="flex flex-col items-center bg-white p-5 md:p-8 rounded-2xl md:rounded-[2rem] shadow-xl border border-gray-100 max-w-xl mx-auto font-sans">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 uppercase tracking-wide">Nhập Thông Tin Bát Tự</h3>
            <p className="text-gray-500 mb-8 text-center text-[15px]">Hệ thống phân tích Tứ Trụ Tử Bình sẽ tự động quy đổi Âm/Dương lịch và Tiết khí để lập lá số chính xác nhất.</p>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                
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

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Ngày - Tháng - Năm Sinh (Dương lịch)
                    </label>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">NGÀY</span>
                            <input type="number" required min="1" max="31" placeholder="DD" value={day} onChange={(e) => setDay(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-center text-gray-900 text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-bold transition-colors appearance-none" />
                        </div>
                        <div className="flex-1">
                            <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">THÁNG</span>
                            <input type="number" required min="1" max="12" placeholder="MM" value={month} onChange={(e) => setMonth(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-center text-gray-900 text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-bold transition-colors appearance-none" />
                        </div>
                        <div className="flex-[1.5]">
                            <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">NĂM</span>
                            <input type="number" required min="1900" max="2100" placeholder="YYYY" value={year} onChange={(e) => setYear(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-center text-gray-900 text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-bold transition-colors appearance-none" />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Thời Gian Sinh
                    </label>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">GIỜ (0-23)</span>
                            <input type="number" required min="0" max="23" placeholder="HH" value={hour} onChange={(e) => setHour(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-center text-gray-900 text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-bold transition-colors appearance-none" />
                        </div>
                        <div className="flex items-center pt-5 font-black text-gray-400 text-xl">:</div>
                        <div className="flex-1">
                            <span className="block text-xs text-gray-400 font-bold mb-1 ml-1 text-center">PHÚT (0-59)</span>
                            <input type="number" required min="0" max="59" placeholder="MM" value={minute} onChange={(e) => setMinute(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-center text-gray-900 text-lg rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-3 font-bold transition-colors appearance-none" />
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
