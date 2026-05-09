import React from 'react';

const stemElements = {
    "Giáp": "Moc", "Ất": "Moc", "Bính": "Hoa", "Đinh": "Hoa", "Mậu": "Tho",
    "Kỷ": "Tho", "Canh": "Kim", "Tân": "Kim", "Nhâm": "Thuy", "Quý": "Thuy"
};

const branchElements = {
    "Tý": "Thuy", "Sửu": "Tho", "Dần": "Moc", "Mão": "Moc", "Thìn": "Tho", "Tỵ": "Hoa",
    "Ngọ": "Hoa", "Mùi": "Tho", "Thân": "Kim", "Dậu": "Kim", "Tuất": "Tho", "Hợi": "Thuy"
};

const getColorClass = (element) => {
    switch (element) {
        case 'Moc': return 'text-emerald-600';
        case 'Hoa': return 'text-red-600';
        case 'Tho': return 'text-amber-700';
        case 'Kim': return 'text-slate-500';
        case 'Thuy': return 'text-blue-600';
        default: return 'text-gray-800';
    }
};

const getBgColorClass = (element) => {
    switch (element) {
        case 'Moc': return 'bg-emerald-50 border-emerald-200';
        case 'Hoa': return 'bg-red-50 border-red-200';
        case 'Tho': return 'bg-amber-50 border-amber-200';
        case 'Kim': return 'bg-slate-50 border-slate-200';
        case 'Thuy': return 'bg-blue-50 border-blue-200';
        default: return 'bg-gray-50 border-gray-200';
    }
};

const BaziBoard = ({ data }) => {
    if (!data) return null;

    const { canChi, nguHanh, analysis, dungThan, hyThan, daYun } = data;

    const Pillar = ({ title, pillarData, isDayMaster }) => {
        const { gan, zhi, thapThanGan, tangCan } = pillarData;
        const ganElem = stemElements[gan];
        const zhiElem = branchElements[zhi];

        return (
            <div className={`flex flex-col items-center p-4 rounded-xl shadow-sm border-2 ${isDayMaster ? 'border-amber-500 bg-amber-50/30 ring-4 ring-amber-100' : 'border-gray-200 bg-white'} min-w-[20%]`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${isDayMaster ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                    {title}
                </div>
                
                <div className="text-sm font-bold text-gray-400 mb-1 h-5">{thapThanGan !== 'Nhật Chủ' ? thapThanGan : ''}</div>
                <div className={`text-4xl font-black mb-2 ${getColorClass(ganElem)}`}>{gan}</div>
                <div className={`text-4xl font-black mb-6 ${getColorClass(zhiElem)}`}>{zhi}</div>
                
                <div className="w-full border-t border-dashed border-gray-300 pt-4 flex flex-col gap-2">
                    {tangCan.map((tc, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 px-2 py-1.5 rounded">
                            <span className={`text-lg font-bold ${getColorClass(stemElements[tc.gan])}`}>{tc.gan}</span>
                            <span className="text-xs font-bold text-gray-500">{tc.thapThan}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const ElementScore = ({ label, score, colorClass }) => (
        <div className="flex-1 min-w-[15%] bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-2xl font-black ${colorClass}`}>{score}</div>
        </div>
    );

    const formatThan = (thanStr) => {
        if (thanStr === 'vuong') return 'Thân Vượng';
        if (thanStr === 'nhuoc') return 'Thân Nhược';
        if (thanStr === 'can_bang') return 'Trạng Thái Cân Bằng';
        if (thanStr === 'tong_cach') return 'Tòng Cách';
        return thanStr;
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 max-w-[1240px] mx-auto my-10 font-sans">
            
            <div className="bg-[#0f172a] text-white p-8 md:p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-extrabold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-400">Kết Quả Phân Tích Bát Tự</h2>
                    <p className="text-blue-200/80 uppercase tracking-widest text-sm font-bold">Lá Số Tử Bình Chuyên Sâu</p>
                </div>
            </div>

            <div className="p-6 md:p-12 space-y-12">
                
                {/* Tứ Trụ */}
                <div>
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4 mb-6 uppercase">Cấu Trúc Tứ Trụ (Mệnh Cục)</h3>
                    <div className="flex flex-row-reverse justify-center gap-4 md:gap-8">
                        <Pillar title="Giờ Sinh" pillarData={canChi.hour} />
                        <Pillar title="Nhật Chủ" pillarData={canChi.day} isDayMaster={true} />
                        <Pillar title="Tháng Lệnh" pillarData={canChi.month} />
                        <Pillar title="Năm Sinh" pillarData={canChi.year} />
                    </div>
                </div>

                {/* Nhịp Đại Vận */}
                {daYun && daYun.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-purple-500 pl-4 mb-6 uppercase">Hành Trình Đại Vận (10 Năm)</h3>
                    <div className="flex overflow-x-auto pb-4 gap-3 hide-scrollbar">
                        {daYun.map((yun, idx) => {
                            const yunElem = stemElements[yun.gan];
                            return (
                                <div key={idx} className={`flex-shrink-0 flex flex-col items-center p-3 rounded-lg border-2 min-w-[80px] ${getBgColorClass(yunElem)}`}>
                                    <div className="text-xs font-bold text-gray-500 mb-2">{yun.startYear}</div>
                                    <div className={`text-xl font-black ${getColorClass(yunElem)}`}>{yun.gan}</div>
                                    <div className={`text-xl font-black ${getColorClass(branchElements[yun.zhi])}`}>{yun.zhi}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                )}

                {/* Ngũ Hành */}
                <div>
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-cyan-500 pl-4 mb-6 uppercase">đánh giá ngũ hành</h3>
                    <div className="flex flex-wrap justify-between gap-4">
                        <ElementScore label="Kim" score={nguHanh.Kim} colorClass="text-slate-500" />
                        <ElementScore label="Mộc" score={nguHanh.Moc} colorClass="text-emerald-600" />
                        <ElementScore label="Thủy" score={nguHanh.Thuy} colorClass="text-blue-600" />
                        <ElementScore label="Hỏa" score={nguHanh.Hoa} colorClass="text-red-600" />
                        <ElementScore label="Thổ" score={nguHanh.Tho} colorClass="text-amber-700" />
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Phân tích luận giải */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Cường Nhược */}
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2 uppercase">
                            <span className="w-2 h-6 bg-blue-600 rounded"></span> Phân Tích Cách Cục
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <span className="font-bold text-gray-600">Trạng Thái Nhật Chủ</span>
                                <span className="text-xl font-black text-rose-600">{formatThan(analysis.than)}</span>
                            </div>

                            {analysis.than === 'tong_cach' && (
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <span className="font-bold text-gray-600">Loại Tòng Cách</span>
                                    <span className="text-lg font-bold text-purple-700">{analysis.tongCachType}</span>
                                </div>
                            )}

                            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-emerald-500">
                                <span className="font-bold text-gray-600">Dụng Thần (Khuyên Chuyên)</span>
                                <span className="text-xl font-black text-emerald-600 uppercase tracking-widest">{dungThan}</span>
                            </div>

                            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-cyan-500">
                                <span className="font-bold text-gray-600">Hỷ Thần (Phụ Trợ)</span>
                                <span className="text-xl font-black text-cyan-600 uppercase tracking-widest">{hyThan}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quan Hệ Động */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase">
                            <span className="w-2 h-6 bg-slate-600 rounded"></span> Hóa Giải & Hình Xung
                        </h3>
                        
                        <div className="space-y-3">
                            {Object.entries(analysis.relations).map(([relType, arr]) => {
                                if (!arr || arr.length === 0) return null;
                                
                                const typeMap = {
                                    tamHop: 'Tam Hợp Cục', banTamHop: 'Bán Tam Hợp',
                                    lucHop: 'Lục Hợp', lucXung: 'Lục Xung',
                                    lucHai: 'Lục Hại', lucPha: 'Tương Phá'
                                };
                                const isBad = ['lucXung', 'lucHai', 'lucPha'].includes(relType);

                                return (
                                    <div key={relType} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                        <span className="font-bold text-gray-700">{typeMap[relType] || relType}</span>
                                        <div className="flex gap-2">
                                            {arr.map((item, i) => (
                                                <span key={i} className={`px-3 py-1 font-bold text-sm rounded ${isBad ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {Object.values(analysis.relations).every(arr => arr.length === 0) && (
                                <div className="text-center text-gray-400 py-8 italic font-medium">Bát Tự bình hòa, không vướng Tương Hình, Xung, Hại.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            
            <style jsx="true">{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default BaziBoard;
