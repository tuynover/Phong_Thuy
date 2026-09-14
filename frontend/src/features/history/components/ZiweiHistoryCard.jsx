import React from 'react';
import { Clock, Tag, Share2, Pin, Eye, Trash2 } from 'lucide-react';

const LUNAR_HOURS_MAP = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"
];

export default function ZiweiHistoryCard({
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
    const formattedTitle = (() => {
        const name = record.inputInfo?.name?.trim();
        const hasCustomName = name && !name.startsWith('Bát Tự -') && !name.startsWith('Tử Vi -') && name.toLowerCase() !== 'bát tự' && name.toLowerCase() !== 'tử vi';
        const dateInfo = `${record.inputInfo?.date || ''} (${record.inputInfo?.gender || ''} Mệnh)`.trim();
        return hasCustomName ? `${name} : ${dateInfo}` : dateInfo;
    })();

    return (
        <div 
            key={record._id} 
            onClick={() => onView(record)} 
            onMouseEnter={() => onPreload('ziwei', record._id)}
            onTouchStart={() => onPreload('ziwei', record._id)}
            className={`border ${record.isPinned ? 'border-purple-300 bg-purple-50/45 shadow-sm' : 'border-purple-100 bg-purple-50/20'} rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer`}
        >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-purple-900 break-words">
                        {formattedTitle}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={12}/> 
                            Giờ sinh: {record.inputInfo?.hour !== undefined ? LUNAR_HOURS_MAP[record.inputInfo.hour] : ''}
                        </span>
                        {record.isPinned && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                Đã ghim
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenTagModal({ type: 'ziwei', record });
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100/70 text-purple-900 hover:bg-purple-200/80 border border-purple-300/60 transition-all shadow-2xs cursor-pointer"
                            title="Chọn thẻ (thư mục) cho lá số này"
                        >
                            <Tag size={10} className="text-purple-700 shrink-0" />
                            <span>{(record.tags && record.tags.length > 0) ? record.tags.join(', ') : 'Chung'}</span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-start shrink-0" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 mr-1">
                        <span className="text-[10px] font-bold text-slate-500 hidden md:inline">Chia sẻ:</span>
                        <button
                            type="button"
                            onClick={() => onTogglePublic('ziwei', record._id, record.isPublic)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${record.isPublic ? 'bg-purple-600' : 'bg-gray-300'}`}
                            title={record.isPublic ? "Đang chia sẻ công khai - Nhấp để tắt" : "Đã tắt chia sẻ - Nhấp để bật"}
                        >
                            <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${record.isPublic ? 'translate-x-4' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>
                    {record.isPublic && (
                        <button 
                            onClick={() => onCopyLink('ziwei', record._id)} 
                            className="p-1.5 rounded-xl hover:bg-purple-50 text-purple-800 hover:text-purple-900 transition-colors cursor-pointer"
                            title="Sao chép liên kết chia sẻ công khai"
                        >
                            <Share2 size={15} />
                        </button>
                    )}
                    <button 
                        onClick={() => onTogglePin('ziwei', record._id)} 
                        className={`p-1.5 rounded-xl transition-colors hover:bg-purple-50 ${record.isPinned ? 'text-purple-600' : 'text-slate-350 hover:text-purple-500'}`}
                        title={record.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                    >
                        <Pin size={15} className={record.isPinned ? 'fill-current' : ''} />
                    </button>
                    <button 
                        onClick={() => onOpenTagModal({ type: 'ziwei', record })} 
                        className="p-1.5 rounded-xl hover:bg-purple-50 text-purple-800 hover:text-purple-900 transition-colors cursor-pointer"
                        title="Chọn thẻ (thư mục)"
                    >
                        <Tag size={15} />
                    </button>
                    <button 
                        onClick={() => onView(record)} 
                        className="flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-855 border border-purple-200/50 rounded-xl hover:bg-purple-100 transition-all text-xs font-bold shadow-sm"
                    >
                        <Eye size={13} />
                        <span className="hidden sm:inline">Xem chi tiết</span>
                    </button>
                    <button 
                        onClick={() => onDelete('ziwei', record._id)} 
                        className="p-1.5 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-755 transition-colors"
                        title="Xóa vĩnh viễn"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>
            
            {/* Rating Section */}
            <div onClick={(e) => e.stopPropagation()} className="mt-4 pt-4 border-t border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-default">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-slate-700">Đánh giá:</span>
                    {renderStars(record.rating, (rating) => onRate('ziwei', record._id, rating, document.getElementById(`feedback-ziwei-${record._id}`)?.value || record.feedback))}
                </div>
                <div className="w-full sm:flex-1 flex items-center gap-2">
                    <input 
                        type="text" 
                        id={`feedback-ziwei-${record._id}`}
                        placeholder="Nhận xét..." 
                        className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-purple-400 focus:outline-none transition-all"
                        defaultValue={record.feedback}
                    />
                    <button 
                        onClick={() => {
                            const val = document.getElementById(`feedback-ziwei-${record._id}`).value;
                            if (val !== record.feedback || !record.rating) {
                                onRate('ziwei', record._id, record.rating, val);
                            }
                        }}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95 shrink-0"
                    >
                        Lưu
                    </button>
                </div>
            </div>
        </div>
    );
}
