import React from 'react';

const ThapThanStrengthTable = ({ thapThanAnalysis }) => {
    if (!thapThanAnalysis || !thapThanAnalysis.groups) return null;

    const groupMeta = {
        tyKiep: { label: 'Tỷ Kiếp', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-800', bg: 'bg-emerald-50/60', border: 'border-emerald-200', bar: 'bg-emerald-500', desc: 'Đồng loại trợ giúp, bạn bè, anh em' },
        thucThuong: { label: 'Thực Thương', color: 'from-amber-500 to-orange-600', text: 'text-amber-800', bg: 'bg-amber-50/60', border: 'border-amber-200', bar: 'bg-amber-500', desc: 'Tài năng, sự sáng tạo, con cái' },
        taiTinh: { label: 'Tài Tinh', color: 'from-yellow-500 to-amber-600', text: 'text-yellow-900', bg: 'bg-yellow-50/60', border: 'border-yellow-200', bar: 'bg-yellow-500', desc: 'Tài lộc, tiền tài, của cải, người vợ' },
        quanSat: { label: 'Quan Sát', color: 'from-purple-500 to-indigo-600', text: 'text-purple-800', bg: 'bg-purple-50/60', border: 'border-purple-200', bar: 'bg-purple-500', desc: 'Chức vị, quyền lực, kỷ luật, người chồng' },
        anTinh: { label: 'Ấn Tinh', color: 'from-blue-500 to-cyan-600', text: 'text-blue-800', bg: 'bg-blue-50/60', border: 'border-blue-200', bar: 'bg-blue-500', desc: 'Học vấn, bằng cấp, quý nhân, mẹ đẻ' }
    };

    const getStrengthBadge = (pct) => {
        if (pct >= 30) return { label: 'Độc Vượng', color: 'bg-rose-100 text-rose-700 border-rose-200' };
        if (pct >= 15) return { label: 'Vượng', color: 'bg-amber-100 text-amber-800 border-amber-200' };
        if (pct >= 5) return { label: 'Vừa', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        if (pct > 0) return { label: 'Yếu', color: 'bg-slate-100 text-slate-600 border-slate-200' };
        return { label: 'Khuyết', color: 'bg-gray-100 text-gray-400 border-gray-200' };
    };

    return (
        <div className="mt-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 border-l-4 border-purple-600 pl-4 uppercase tracking-wide">
                        Phân Tích Sức Mạnh Thập Thần
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 pl-4 mt-1">
                        Đánh giá định lượng tỷ lệ lực lượng của 10 Thập Thần trong Tứ Trụ
                    </p>
                </div>
                <div className="self-start sm:self-auto bg-purple-50 border border-purple-200 text-purple-800 px-4 py-1.5 rounded-full text-xs font-semibold">
                    Tổng lực lượng: {thapThanAnalysis.totalScore} điểm
                </div>
            </div>

            {/* 5 Nhóm Thập Thần Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                {thapThanAnalysis.groups.map(group => {
                    const meta = groupMeta[group.key] || { label: group.name, color: 'from-slate-500 to-slate-600', text: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200', bar: 'bg-slate-500', desc: '' };
                    return (
                        <div key={group.key} className={`${meta.bg} border ${meta.border} p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-transform hover:-translate-y-0.5 shadow-sm`}>
                            <div className="flex justify-between items-center">
                                <span className={`font-bold text-sm sm:text-base ${meta.text}`}>{group.name}</span>
                                <span className="text-xs font-black bg-white/80 backdrop-blur px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700">
                                    {group.percentage}%
                                </span>
                            </div>
                            
                            <div className="w-full bg-slate-200/70 h-2.5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full bg-gradient-to-r ${meta.color} transition-all duration-500 rounded-full`} 
                                    style={{ width: `${Math.min(100, group.percentage)}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                <span>{group.score} điểm</span>
                                <span className="text-[11px] italic opacity-80">{meta.desc.split(',')[0]}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chi tiết Bảng 10 Thập Thần */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 text-slate-600 text-xs sm:text-sm font-semibold border-b border-slate-200">
                            <th className="py-3 px-4 rounded-l-xl">Phân Nhóm</th>
                            <th className="py-3 px-4">Thập Thần Chi Tiết</th>
                            <th className="py-3 px-4 text-center">Điểm Số</th>
                            <th className="py-3 px-4 text-center">Tỷ Lệ (%)</th>
                            <th className="py-3 px-4 text-center rounded-r-xl">Trạng Thái Lực Lượng</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                        {thapThanAnalysis.groups.map(group => {
                            const meta = groupMeta[group.key] || { label: group.name, text: 'text-slate-800' };
                            return group.items.map((item, idx) => {
                                const badge = getStrengthBadge(item.percentage);
                                return (
                                    <tr key={item.name} className="hover:bg-slate-50/50 transition-colors">
                                        {idx === 0 && (
                                            <td rowSpan={2} className={`py-4 px-4 font-bold ${meta.text} border-r border-slate-100 align-middle bg-slate-50/30`}>
                                                <div>{group.name}</div>
                                                <div className="text-xs font-normal opacity-70 mt-0.5">{group.percentage}% lực lượng</div>
                                            </td>
                                        )}
                                        <td className="py-3.5 px-4 font-medium text-slate-800 flex items-center space-x-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                                            <span>{item.name}</span>
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                                            {item.score}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center space-x-3 max-w-[160px] mx-auto">
                                                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-purple-600 rounded-full transition-all duration-500" 
                                                        style={{ width: `${Math.min(100, item.percentage * 2.5)}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-xs text-slate-700 w-10 text-right">{item.percentage}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            });
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ThapThanStrengthTable;
