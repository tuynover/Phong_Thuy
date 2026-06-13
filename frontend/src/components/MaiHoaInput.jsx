import React, { useState, useEffect } from 'react';
import { Lunar, Solar } from 'lunar-javascript';
import { CalendarDays, Clock, Settings2, Sparkles, HelpCircle, ChevronDown } from 'lucide-react';

const BRANCH_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tị',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const BRANCH_MAP = {
    '子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
    '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12
};

const TRIGRAM_NAMES = {
    1: 'Càn (Thiên)',
    2: 'Đoài (Trạch)',
    3: 'Ly (Hỏa)',
    4: 'Chấn (Lôi)',
    5: 'Tốn (Phong)',
    6: 'Khảm (Thủy)',
    7: 'Cấn (Sơn)',
    8: 'Khôn (Địa)'
};

const TRIGRAM_LINES = {
    1: [1, 1, 1], // Càn
    2: [1, 1, 0], // Đoài
    3: [1, 0, 1], // Ly
    4: [1, 0, 0], // Chấn
    5: [0, 1, 1], // Tốn
    6: [0, 1, 0], // Khảm
    7: [0, 0, 1], // Cấn
    8: [0, 0, 0]  // Khôn
};

const LUNAR_HOURS = [
    { index: 0, name: "Tý (23:00 - 00:59)", hour: 23 },
    { index: 1, name: "Sửu (01:00 - 02:59)", hour: 1 },
    { index: 2, name: "Dần (03:00 - 04:59)", hour: 3 },
    { index: 3, name: "Mão (05:00 - 06:59)", hour: 5 },
    { index: 4, name: "Thìn (07:00 - 08:59)", hour: 7 },
    { index: 5, name: "Tị (09:00 - 10:59)", hour: 9 },
    { index: 6, name: "Ngọ (11:00 - 12:59)", hour: 11 },
    { index: 7, name: "Mùi (13:00 - 14:59)", hour: 13 },
    { index: 8, name: "Thân (15:00 - 16:59)", hour: 15 },
    { index: 9, name: "Dậu (17:00 - 18:59)", hour: 17 },
    { index: 10, name: "Tuất (19:00 - 20:59)", hour: 19 },
    { index: 11, name: "Hợi (21:00 - 22:59)", hour: 21 }
];

const MaiHoaInput = ({ onComplete }) => {
    const now = new Date();
    const [subMethod, setSubMethod] = useState('datetime'); // 'datetime' | 'serial'
    const [year, setYear] = useState(() => now.getFullYear());
    const [month, setMonth] = useState(() => now.getMonth() + 1);
    const [day, setDay] = useState(() => now.getDate());

    const getInitialHourIndex = (hr) => {
        if (hr >= 23 || hr < 1) return 0;
        return Math.floor((hr - 1) / 2) + 1;
    };
    const [hourIndex, setHourIndex] = useState(() => getInitialHourIndex(now.getHours()));

    const [lunarDetail, setLunarDetail] = useState(null);

    // States for serial number gieo quẻ
    const [serialStr, setSerialStr] = useState('');
    const [serialDetail, setSerialDetail] = useState(null);
    const [serialError, setSerialError] = useState('');

    const getDaysInMonth = (m, y) => {
        const parsedM = parseInt(m);
        const parsedY = parseInt(y);
        if (isNaN(parsedM) || isNaN(parsedY)) return 31;
        return new Date(parsedY, parsedM, 0).getDate();
    };
    const daysInMonth = getDaysInMonth(month, year);

    useEffect(() => {
        if (day > daysInMonth) {
            setDay(daysInMonth);
        }
    }, [month, year, daysInMonth, day]);

    // Calculate Datetime Divination
    useEffect(() => {
        if (!day || !month || !year) return;
        try {
            const solarHour = LUNAR_HOURS[hourIndex].hour;
            const dateObj = new Date(year, month - 1, day, solarHour, 0, 0);
            const solar = Solar.fromDate(dateObj);
            const lunar = solar.getLunar();

            const yearZhi = lunar.getYearZhi();
            const yearBranchName = BRANCH_VI[yearZhi] || yearZhi;
            const yearNum = BRANCH_MAP[yearZhi] || 1;

            const monthNum = Math.abs(lunar.getMonth());
            const dayNum = lunar.getDay();

            const hourZhi = lunar.getTimeZhi();
            const hourBranchName = BRANCH_VI[hourZhi] || hourZhi;
            const hourNum = BRANCH_MAP[hourZhi] || 1;

            // Tính toán Mai Hoa
            const upperSum = yearNum + monthNum + dayNum;
            const upperVal = upperSum % 8 || 8;

            const lowerSum = yearNum + monthNum + dayNum + hourNum;
            const lowerVal = lowerSum % 8 || 8;

            const movingSum = yearNum + monthNum + dayNum + hourNum;
            const movingVal = movingSum % 6 || 6;

            // Chuyển Can Chi sang Tiếng Việt
            const yearCanChi = lunar.getYearInGanZhiExact();
            const monthCanChi = lunar.getMonthInGanZhiExact();
            const dayCanChi = lunar.getDayInGanZhiExact();
            const hourCanChi = lunar.getEightChar().getTime();

            // Hàm chuyển đổi sang tiếng Việt
            const toVietnamese = (str) => {
                const GAN_VI = {
                    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
                    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
                };
                let res = str;
                for (const [k, v] of Object.entries(GAN_VI)) res = res.replace(k, v + ' ');
                for (const [k, v] of Object.entries(BRANCH_VI)) res = res.replace(k, v);
                return res.trim();
            };

            setLunarDetail({
                lunarDateStr: `Ngày ${lunar.getDay()} tháng ${lunar.getMonth()} năm ${lunar.getYear()} Âm lịch`,
                canChiStr: `${toVietnamese(hourCanChi)} - ${toVietnamese(dayCanChi)} - ${toVietnamese(monthCanChi)} - ${toVietnamese(yearCanChi)}`,
                math: {
                    yearBranchName, yearNum,
                    monthNum,
                    dayNum,
                    hourBranchName, hourNum,
                    upperSum, upperVal,
                    lowerSum, lowerVal,
                    movingSum, movingVal
                }
            });
        } catch (err) {
            console.error(err);
        }
    }, [year, month, day, hourIndex]);

    // Calculate Serial Divination
    useEffect(() => {
        if (subMethod !== 'serial') return;

        const cleaned = serialStr.trim();
        if (!cleaned) {
            setSerialDetail(null);
            setSerialError('');
            return;
        }

        if (!/^\d{8}$/.test(cleaned)) {
            setSerialDetail(null);
            setSerialError('Dãy số seri phải có độ dài đúng 8 chữ số (ví dụ: 12345678).');
            return;
        }

        setSerialError('');

        const digits = cleaned.split('').map(Number);
        const first4 = digits.slice(0, 4);
        const last4 = digits.slice(4, 8);

        const upperSum = first4.reduce((a, b) => a + b, 0);
        const upperVal = upperSum % 8 || 8;

        const lowerSum = last4.reduce((a, b) => a + b, 0);
        const lowerVal = lowerSum % 8 || 8;

        const movingSum = digits.reduce((a, b) => a + b, 0);
        const movingVal = movingSum % 6 || 6;

        setSerialDetail({
            serialStr: cleaned,
            digits,
            first4,
            last4,
            math: {
                upperSum,
                upperVal,
                lowerSum,
                lowerVal,
                movingSum,
                movingVal
            }
        });
    }, [serialStr, subMethod]);

    const handleSubmit = () => {
        if (subMethod === 'datetime') {
            if (!lunarDetail) return;
            const { math } = lunarDetail;
            
            const lowerLines = TRIGRAM_LINES[math.lowerVal];
            const upperLines = TRIGRAM_LINES[math.upperVal];
            
            const primaryLines = [...lowerLines, ...upperLines];
            const finalLines = primaryLines.map((type, idx) => ({
                type,
                moving: (idx === (math.movingVal - 1))
            }));

            const solarHour = LUNAR_HOURS[hourIndex].hour;
            const selectedDate = new Date(year, month - 1, day, solarHour, 0, 0);
            onComplete(finalLines, selectedDate, " (Phương pháp: Mai Hoa Dịch Số - Giờ Động Tâm)");
        } else {
            if (!serialDetail) return;
            const { math } = serialDetail;
            
            const lowerLines = TRIGRAM_LINES[math.lowerVal];
            const upperLines = TRIGRAM_LINES[math.upperVal];
            
            const primaryLines = [...lowerLines, ...upperLines];
            const finalLines = primaryLines.map((type, idx) => ({
                type,
                moving: (idx === (math.movingVal - 1))
            }));

            onComplete(finalLines, new Date(), ` (Phương pháp: Mai Hoa Dịch Số - Seri Tiền ${serialStr})`);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-xl mx-auto">
            <h3 className="text-2xl font-bold text-amber-900 mb-4 font-serif">Gieo Quẻ Mai Hoa Dịch Số</h3>
            
            {/* Hướng dẫn ngắn */}
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-xs text-amber-955/80 mb-6 leading-relaxed flex items-start gap-2.5 shadow-sm w-full">
                <Sparkles size={16} className="text-amber-700 shrink-0 mt-0.5" />
                <div>
                    <strong>Mai Hoa Dịch Số (Tiên Thiên):</strong> Quẻ được lập hoàn toàn dựa trên sự tương tác năng lượng tại thời điểm khởi sinh sự việc (Giờ Động Tâm hoặc thông qua dãy số ngẫu nhiên của Seri Tiền). Các số lý được tổng hợp để định nên Thượng Quái, Hạ Quái và Hào Động tương ứng.
                </div>
            </div>

            {/* Sub-tab selection */}
            <div className="flex gap-2.5 mb-6 w-full">
                <button
                    type="button"
                    onClick={() => setSubMethod('datetime')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-2 ${
                        subMethod === 'datetime'
                            ? 'border-amber-600 bg-amber-50/30 text-amber-900 shadow-sm'
                            : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Clock size={16} />
                    Giờ Động Tâm
                </button>
                <button
                    type="button"
                    onClick={() => setSubMethod('serial')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold transition-all text-xs sm:text-sm flex items-center justify-center gap-2 ${
                        subMethod === 'serial'
                            ? 'border-amber-600 bg-amber-50/30 text-amber-900 shadow-sm'
                            : 'border-slate-100 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <Sparkles size={16} />
                    Seri Tiền (8 Số)
                </button>
            </div>

            {/* Form chọn ngày giờ động tâm hoặc nhập seri tiền */}
            <div className="w-full bg-white p-5 rounded-2xl border border-amber-50 shadow-sm space-y-4 mb-6">
                {subMethod === 'datetime' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-black text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <CalendarDays size={15} className="text-amber-700" />
                                Thời Điểm Động Tâm (Dương Lịch)
                            </label>
                            
                            <div className="grid grid-cols-3 gap-3">
                                {/* Ngày */}
                                <div>
                                    <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">NGÀY</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={daysInMonth}
                                        placeholder="DD"
                                        value={day || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setDay(isNaN(val) ? '' : val);
                                        }}
                                        className="bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-base rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 block w-full py-2.5 font-bold transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                {/* Tháng */}
                                <div>
                                    <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">THÁNG</span>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="12"
                                        placeholder="MM"
                                        value={month || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setMonth(isNaN(val) ? '' : val);
                                        }}
                                        className="bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-base rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 block w-full py-2.5 font-bold transition-all placeholder:text-slate-300"
                                    />
                                </div>

                                {/* Năm */}
                                <div>
                                    <span className="block text-[10px] text-slate-400 font-bold mb-1 text-center">NĂM</span>
                                    <input
                                        type="number"
                                        required
                                        min="1900"
                                        max="2100"
                                        placeholder="YYYY"
                                        value={year || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setYear(isNaN(val) ? '' : val);
                                        }}
                                        className="bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-base rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 block w-full py-2.5 font-bold transition-all placeholder:text-slate-300"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-black text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <Clock size={15} className="text-amber-700" />
                                Giờ Động Tâm Can Chi
                            </label>
                            <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                                {LUNAR_HOURS.map((hr) => (
                                    <button
                                        key={hr.index}
                                        type="button"
                                        onClick={() => setHourIndex(hr.index)}
                                        className={`py-2.5 px-1 text-center rounded-xl border-2 font-bold text-xs sm:text-sm transition-all ${
                                            hourIndex === hr.index
                                                ? 'border-amber-600 bg-amber-50/40 text-amber-900 shadow-sm'
                                                : 'border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="font-extrabold">{hr.name.split(' ')[0]}</div>
                                        <div className="text-[9.5px] text-slate-400 font-medium mt-0.5">
                                            {hr.name.substring(hr.name.indexOf('('))}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {lunarDetail && (
                            <div className="border-t border-dashed border-amber-100 pt-4 space-y-3">
                                <div className="bg-amber-50/30 px-3 py-2 rounded-lg text-xs font-bold text-amber-900 flex flex-col gap-1">
                                    <span className="text-[10px] text-amber-700 uppercase tracking-widest">Thời gian Âm lịch</span>
                                    <span>{lunarDetail.lunarDateStr}</span>
                                    <span className="text-slate-500 font-medium text-[11px]">{lunarDetail.canChiStr}</span>
                                </div>

                                {/* Chi tiết tính toán số lý */}
                                <div className="bg-slate-50 p-4 rounded-xl text-slate-700 space-y-2 border border-slate-100">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 mb-2">Công thức số lý động tâm</h4>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                        <div>Năm ({lunarDetail.math.yearBranchName}): <span className="font-extrabold text-amber-800">{lunarDetail.math.yearNum}</span></div>
                                        <div>Tháng: <span className="font-extrabold text-amber-800">{lunarDetail.math.monthNum}</span></div>
                                        <div>Ngày: <span className="font-extrabold text-amber-800">{lunarDetail.math.dayNum}</span></div>
                                        <div>Giờ ({lunarDetail.math.hourBranchName}): <span className="font-extrabold text-amber-800">{lunarDetail.math.hourNum}</span></div>
                                    </div>

                                    <div className="border-t border-slate-200/60 pt-2 space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Thượng Quái (Quẻ trên)</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({lunarDetail.math.yearNum} + {lunarDetail.math.monthNum} + {lunarDetail.math.dayNum}) % 8 = <span className="text-amber-800 font-black">{lunarDetail.math.upperVal}</span> ({TRIGRAM_NAMES[lunarDetail.math.upperVal]})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Hạ Quái (Quẻ dưới)</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({lunarDetail.math.yearNum} + {lunarDetail.math.monthNum} + {lunarDetail.math.dayNum} + {lunarDetail.math.hourNum}) % 8 = <span className="text-amber-800 font-black">{lunarDetail.math.lowerVal}</span> ({TRIGRAM_NAMES[lunarDetail.math.lowerVal]})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Hào Động</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({lunarDetail.math.yearNum} + {lunarDetail.math.monthNum} + {lunarDetail.math.dayNum} + {lunarDetail.math.hourNum}) % 6 = Hào <span className="text-amber-800 font-black">{lunarDetail.math.movingVal}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-black text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles size={15} className="text-amber-700" />
                                Nhập Dãy Số Seri Tiền (8 Chữ Số)
                            </label>
                            <input
                                type="text"
                                maxLength={8}
                                placeholder="Nhập 8 chữ số, ví dụ: 68688888"
                                value={serialStr}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, ''); // only allow digits
                                    setSerialStr(val);
                                }}
                                className="bg-slate-50/80 border border-slate-200 text-center text-slate-800 text-lg rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-amber-400 block w-full py-3.5 font-bold transition-all placeholder:text-slate-300 tracking-widest"
                            />
                            {serialError && (
                                <p className="text-xs text-red-500 font-semibold mt-1">{serialError}</p>
                            )}
                        </div>

                        {serialDetail && (
                            <div className="border-t border-dashed border-amber-100 pt-4 space-y-3">
                                <div className="bg-amber-50/30 px-3 py-2 rounded-lg text-xs font-bold text-amber-900 flex flex-col gap-1">
                                    <span className="text-[10px] text-amber-700 uppercase tracking-widest">Phương pháp gieo quẻ</span>
                                    <span>Mai Hoa Dịch Số theo Seri Tiền</span>
                                    <span className="text-slate-500 font-medium text-[11px]">Dãy số: {serialDetail.serialStr.split('').join(' - ')}</span>
                                </div>

                                {/* Chi tiết tính toán số lý */}
                                <div className="bg-slate-50 p-4 rounded-xl text-slate-700 space-y-2 border border-slate-100">
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200/60 pb-1.5 mb-2">Công thức số lý động tâm</h4>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                                        <div>4 Số đầu: <span className="font-extrabold text-amber-800">{serialDetail.first4.join(', ')}</span></div>
                                        <div>4 Số cuối: <span className="font-extrabold text-amber-800">{serialDetail.last4.join(', ')}</span></div>
                                    </div>

                                    <div className="border-t border-slate-200/60 pt-2 space-y-1.5 text-xs">
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Thượng Quái (Quẻ trên)</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({serialDetail.first4.join(' + ')} = {serialDetail.math.upperSum}) % 8 = <span className="text-amber-800 font-black">{serialDetail.math.upperVal}</span> ({TRIGRAM_NAMES[serialDetail.math.upperVal]})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Hạ Quái (Quẻ dưới)</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({serialDetail.last4.join(' + ')} = {serialDetail.math.lowerSum}) % 8 = <span className="text-amber-800 font-black">{serialDetail.math.lowerVal}</span> ({TRIGRAM_NAMES[serialDetail.math.lowerVal]})
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded border border-slate-100">
                                            <span className="text-slate-500">Hào Động</span>
                                            <span className="font-bold text-slate-800 text-[11px]">
                                                ({serialDetail.digits.join(' + ')} = {serialDetail.math.movingSum}) % 6 = Hào <span className="text-amber-800 font-black">{serialDetail.math.movingVal}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button 
                onClick={handleSubmit} 
                disabled={subMethod === 'datetime' ? !lunarDetail : !serialDetail}
                className="w-full flex justify-center items-center gap-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-955 text-white px-8 py-4 rounded-xl shadow-xl font-bold text-lg transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Settings2 />
                Lập Quẻ Mai Hoa
            </button>
        </div>
    );
};

export default MaiHoaInput;
