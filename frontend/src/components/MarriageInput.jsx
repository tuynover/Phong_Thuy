import React, { useState } from 'react';
import { Calendar, Clock, User } from 'lucide-react';

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
                                <div className="flex-1">
                                    <input type="number" required min="1" max="31" placeholder="Ngày" value={mDay} onChange={(e) => setMDay(e.target.value)}
                                        className="bg-white border border-blue-200 text-center text-gray-900 text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
                                <div className="flex-1">
                                    <input type="number" required min="1" max="12" placeholder="Tháng" value={mMonth} onChange={(e) => setMMonth(e.target.value)}
                                        className="bg-white border border-blue-200 text-center text-gray-900 text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
                                <div className="flex-[1.5]">
                                    <input type="number" required min="1900" max="2100" placeholder="Năm" value={mYear} onChange={(e) => setMYear(e.target.value)}
                                        className="bg-white border border-blue-200 text-center text-gray-900 text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Birth time */}
                        <div>
                            <label className="block text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Giờ & Phút Sinh
                            </label>
                            <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                    <input type="number" required min="0" max="23" placeholder="Giờ" value={mHour} onChange={(e) => setMHour(e.target.value)}
                                        className="bg-white border border-blue-200 text-center text-gray-900 text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
                                <div className="text-gray-400 font-bold">:</div>
                                <div className="flex-1">
                                    <input type="number" required min="0" max="59" placeholder="Phút" value={mMinute} onChange={(e) => setMMinute(e.target.value)}
                                        className="bg-white border border-blue-200 text-center text-gray-900 text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
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
                                <div className="flex-1">
                                    <input type="number" required min="1" max="31" placeholder="Ngày" value={fDay} onChange={(e) => setFDay(e.target.value)}
                                        className="bg-white border border-rose-200 text-center text-gray-900 text-base rounded-xl focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
                                <div className="flex-1">
                                    <input type="number" required min="1" max="12" placeholder="Tháng" value={fMonth} onChange={(e) => setFMonth(e.target.value)}
                                        className="bg-white border border-rose-200 text-center text-gray-900 text-base rounded-xl focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
                                <div className="flex-[1.5]">
                                    <input type="number" required min="1900" max="2100" placeholder="Năm" value={fYear} onChange={(e) => setFYear(e.target.value)}
                                        className="bg-white border border-rose-200 text-center text-gray-900 text-base rounded-xl focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Birth time */}
                        <div>
                            <label className="block text-xs font-bold text-rose-700 uppercase mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Giờ & Phút Sinh
                            </label>
                            <div className="flex gap-2 items-center">
                                <div className="flex-1">
                                    <input type="number" required min="0" max="23" placeholder="Giờ" value={fHour} onChange={(e) => setFHour(e.target.value)}
                                        className="bg-white border border-rose-200 text-center text-gray-900 text-base rounded-xl focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
                                <div className="text-gray-400 font-bold">:</div>
                                <div className="flex-1">
                                    <input type="number" required min="0" max="59" placeholder="Phút" value={fMinute} onChange={(e) => setFMinute(e.target.value)}
                                        className="bg-white border border-rose-200 text-center text-gray-900 text-base rounded-xl focus:ring-rose-500 focus:border-rose-500 block w-full p-2.5 font-bold transition-colors appearance-none focus:outline-none" />
                                </div>
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
