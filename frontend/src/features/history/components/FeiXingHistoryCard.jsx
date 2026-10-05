import React from 'react';
import { Clock, Tag, Share2, Pin, Eye, Trash2, Compass, Building } from 'lucide-react';

export default function FeiXingHistoryCard({
    record,
    onView,
    onPreload,
    onTogglePublic,
    onCopyLink,
    onTogglePin,
    onOpenTagModal,
    onDelete,
    onRate,
    renderStars
}) {
    return (
        <div 
            onClick={() => onView(record)} 
            onMouseEnter={() => onPreload && onPreload('feixing', record._id)}
            onTouchStart={() => onPreload && onPreload('feixing', record._id)}
            className={`border ${record.isPinned ? 'border-amber-300 bg-amber-50/45 shadow-sm' : 'border-amber-100 bg-amber-50/20'} rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer`}
        >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-700 text-xs font-bold border border-amber-500/20">
                            Vận {record.period}
                        </span>
                        <h3 className="font-bold text-base sm:text-lg text-amber-900 break-words">
                            Tọa {record.sittingMountain} ({record.sittingPalace}) – Hướng {record.facingMountain} ({record.facingPalace}) • {record.facingDegree?.toFixed(1)}°
                        </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-650 break-words flex items-center gap-1.5">
                        <Building size={14} className="text-amber-600 shrink-0" />
                        <span>Gia chủ: <b>{record.ownerName}</b> {record.title ? `(${record.title})` : ''}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock size={12}/> 
                            {new Date(record.createdAt).toLocaleString('vi-VN')}
                        </span>
                        {record.isPinned && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Đã ghim
                            </span>
                        )}
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {record.chartType === 'CHINH_HUONG' ? 'Chính Hướng' : 'Kiêm Hướng / Thế Quái'}
                        </span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenTagModal({ type: 'feixing', record });
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100/70 text-amber-900 hover:bg-amber-200/80 border border-amber-300/60 transition-all shadow-2xs cursor-pointer"
                            title="Chọn thẻ cho bản ghi này"
                        >
                            <Tag size={10} className="text-amber-700 shrink-0" />
                            <span>{(record.tags && record.tags.length > 0) ? record.tags.join(', ') : 'Huyền Không'}</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-start shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 mr-1">
                        <span className="text-[10px] font-bold text-slate-500 hidden md:inline">Chia sẻ:</span>
                        <button
                            type="button"
                            onClick={() => onTogglePublic('feixing', record._id, record.isPublic)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${record.isPublic ? 'bg-amber-600' : 'bg-gray-300'}`}
                            title={record.isPublic ? "Đang chia sẻ công khai - Nhấp để tắt" : "Đã tắt chia sẻ - Nhấp để bật"}
                        >
                            <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${record.isPublic ? 'translate-x-4' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>

                    {record.isPublic && (
                        <button
                            type="button"
                            onClick={() => onCopyLink('feixing', record._id)}
                            className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
                            title="Sao chép liên kết chia sẻ"
                        >
                            <Share2 size={15} />
                        </button>
                    )}

                    <button 
                        type="button"
                        onClick={() => onTogglePin('feixing', record._id)} 
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${record.isPinned ? 'bg-amber-100 border-amber-300 text-amber-900' : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-600'}`}
                        title={record.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                    >
                        <Pin size={15} />
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => onView(record)} 
                        className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200 transition-colors cursor-pointer"
                        title="Xem chi tiết tinh bàn"
                    >
                        <Eye size={15} />
                    </button>
                    
                    <button 
                        type="button"
                        onClick={() => onDelete('feixing', record._id)} 
                        className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                        title="Xóa khỏi lịch sử"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-amber-100/60 text-xs">
                <span className="text-slate-500 font-medium">Đánh giá độ chính xác:</span>
                <div onClick={(e) => e.stopPropagation()}>
                    {renderStars(record.rating, (star) => onRate('feixing', record._id, star, record.feedback))}
                </div>
            </div>
        </div>
    );
}
