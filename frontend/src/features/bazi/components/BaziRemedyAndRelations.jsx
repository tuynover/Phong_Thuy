import React from 'react';

const BaziRemedyAndRelations = ({ remedyData, relations = {} }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Lời Khuyên Cải Vận (Theo Dụng Thần) */}
            <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                <h3 className="text-lg font-bold text-amber-900 mb-6 flex items-center gap-2 uppercase">
                    <span className="w-2 h-6 bg-amber-600 rounded"></span> Cải Vận (Theo Dụng Thần)
                </h3>
                {remedyData ? (
                    <div className="space-y-3 text-slate-700 text-sm">
                        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <span className="font-bold text-gray-400 text-[9.5px] uppercase tracking-wider mb-0.5">Màu sắc bổ trợ</span>
                            <span className="font-black text-slate-800 text-[13.5px]">{remedyData.colors}</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <span className="font-bold text-gray-400 text-[9.5px] uppercase tracking-wider mb-0.5">Phương vị tốt</span>
                            <span className="font-black text-slate-800 text-[13.5px]">{remedyData.directions}</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <span className="font-bold text-gray-400 text-[9.5px] uppercase tracking-wider mb-0.5">Công việc / Ngành nghề</span>
                            <span className="font-black text-slate-800 text-[13.5px]">{remedyData.careers}</span>
                        </div>
                        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-gray-100 flex flex-col">
                            <span className="font-bold text-gray-400 text-[9.5px] uppercase tracking-wider mb-0.5">Vật phẩm trợ lực</span>
                            <span className="font-black text-slate-800 text-[13.5px]">{remedyData.items}</span>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-8 italic font-medium">Chưa xác định được Dụng Thần để đưa ra lời khuyên trợ mệnh.</div>
                )}
            </div>

            {/* Quan Hệ Động */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 uppercase">
                    <span className="w-2 h-6 bg-slate-600 rounded"></span> Hóa Giải & Hình Xung
                </h3>
                
                <div className="space-y-3">
                    {Object.entries(relations).map(([relType, arr]) => {
                        if (!arr || arr.length === 0) return null;
                        
                        const typeMap = {
                            tamHop: 'Tam Hợp Cục', banTamHop: 'Bán Tam Hợp',
                            lucHop: 'Lục Hợp', lucXung: 'Lục Xung',
                            lucHai: 'Lục Hại', lucPha: 'Tương Phá',
                            tuHinh: 'Tứ Tự Hình', amHop: 'Chi Chi Ám Hợp',
                            canChiAmHop: 'Can Chi Ám Hợp'
                        };
                        const isBad = ['lucXung', 'lucHai', 'lucPha'].includes(relType);

                        return (
                            <div key={relType} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                <span className="font-bold text-gray-700 text-sm sm:text-base">{typeMap[relType] || relType}</span>
                                <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                                    {arr.map((item, i) => {
                                        let text = typeof item === 'string' ? item : '';
                                        let isSuccessItem = !isBad;
                                        if (relType === 'tuHinh') {
                                            text = `${item.zhi}-${item.zhi} (${item.isSuccess ? 'Hóa ' + item.transElem : 'Không hóa: ' + item.reason})`;
                                            isSuccessItem = item.isSuccess;
                                        } else if (relType === 'amHop') {
                                            text = `${item.p1}-${item.p2}: ${item.label}`;
                                        } else if (relType === 'canChiAmHop') {
                                            text = `${item.pillar}: ${item.label}`;
                                        }

                                        return (
                                            <span key={i} className={`px-2.5 py-1 font-bold text-xs sm:text-sm rounded ${!isSuccessItem ? 'bg-amber-50 text-amber-800 border border-amber-200' : isBad ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                                                {text}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                    
                    {Object.values(relations).every(arr => !arr || arr.length === 0) && (
                        <div className="text-center text-gray-400 py-8 italic font-medium">Bát Tự bình hòa, không vướng Tương Hình, Xung, Hại.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BaziRemedyAndRelations;
