import React from 'react';
import { Loader2, CheckCircle2, Sparkles, Radio } from 'lucide-react';

const BAZI_CHAPTERS = [
  { id: 1, title: 'Sự Nghiệp & Công Danh' },
  { id: 2, title: 'Tài Chính & Dòng Tiền' },
  { id: 3, title: 'Hôn Nhân & Gia Đạo' },
  { id: 4, title: 'Sức Khỏe & Tạng Phủ' },
  { id: 5, title: 'Phong Thủy & Cải Vận' },
  { id: 6, title: 'Mốc Đại Vận 100 Năm' }
];

const ZIWEI_CHAPTERS = [
  { id: 1, title: 'Mệnh - Thân - Phúc Đức' },
  { id: 2, title: 'Quan Lộc - Tài - Điền Trạch' },
  { id: 3, title: 'Phu Thê - Tử Tức' },
  { id: 4, title: 'Tật Ách - Thiên Di' },
  { id: 5, title: 'Nô Bộc - Phụ Mẫu - Huynh Đệ' }
];

const MARRIAGE_CHAPTERS = [
  { id: 1, title: 'Cốt Cách & Tâm Lý Phối Ngẫu' },
  { id: 2, title: 'Tài Chính & Kinh Tế Gia Đình' },
  { id: 3, title: 'Hóa Giải Xung Khắc Cung Phu Thê' },
  { id: 4, title: 'Con Cái & Vận Trình Hậu Vận' }
];

const ICHING_CHAPTERS = [
  { id: 1, title: 'Biện Chứng Lục Hào Cốt Lõi' },
  { id: 2, title: '3 Kịch Bản Diễn Biến & Xác Suất' },
  { id: 3, title: 'Mốc Thời Gian Ứng Kỳ & Đạo Dịch' }
];

const getChaptersBySystem = (sys) => {
  switch (sys) {
    case 'ziwei':
    case 'tu_vi':
      return ZIWEI_CHAPTERS;
    case 'marriage':
    case 'hop_hon':
      return MARRIAGE_CHAPTERS;
    case 'iching':
    case 'kinh_dich':
      return ICHING_CHAPTERS;
    case 'bazi':
    case 'bat_tu':
    default:
      return BAZI_CHAPTERS;
  }
};

const VipProgressTracker = ({
  completedChapters = [],
  activeChapters = [],
  streamingChapter = null,
  currentChapter = 1,
  isCompleted = false,
  statusMessage = '',
  system = 'bazi',
  chapters = null
}) => {
  const chapterList = chapters || getChaptersBySystem(system);
  const hasCompletedList = Array.isArray(completedChapters) && completedChapters.length > 0;
  const prefixLabel = 'Chương ';

  return (
    <div className="w-full bg-white border border-amber-200/80 rounded-2xl p-4 mb-6 shadow-sm text-slate-800 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <h4 className="text-sm font-bold text-amber-900 tracking-wide">
            {isCompleted ? 'Hoàn Thành Phân Tích (Bản Chuyên Sâu)' : 'Tiến Độ Phân Tích (Bản Chuyên Sâu)'}
          </h4>
        </div>
        {statusMessage && !isCompleted && (
          <span className="text-[11px] text-amber-800 font-medium bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/70 inline-flex items-center gap-1.5 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            {statusMessage}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {chapterList.map((ch) => {
          const isDone = isCompleted || (hasCompletedList ? completedChapters.includes(ch.id) : currentChapter > ch.id);
          const isStreaming = !isCompleted && streamingChapter === ch.id;
          const isCurrent = !isCompleted && !isDone && (
            activeChapters.includes(ch.id) ||
            (!hasCompletedList && currentChapter === ch.id)
          );

          return (
            <div
              key={ch.id}
              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                isStreaming
                  ? 'bg-amber-100/70 border-amber-400 text-amber-950 font-semibold shadow-xs ring-2 ring-amber-300/40'
                  : isDone
                  ? 'bg-emerald-50 border-emerald-200/90 text-emerald-900 shadow-2xs'
                  : isCurrent
                  ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-2xs animate-pulse font-medium'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="truncate font-medium pr-1">
                <span className="text-[10px] opacity-70 font-semibold mr-1.5">{prefixLabel}{ch.id}:</span>
                {ch.title}
              </div>
              <div className="shrink-0">
                {isStreaming ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                    <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Đang xuất...
                  </span>
                ) : isDone ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Xong
                  </span>
                ) : isCurrent ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" /> Đang luận...
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Chờ...</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VipProgressTracker;
