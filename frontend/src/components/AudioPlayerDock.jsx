import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, 
    Pause, 
    SkipBack, 
    SkipForward, 
    Volume2, 
    Volume1, 
    VolumeX, 
    X, 
    Minimize2, 
    Maximize2, 
    Sparkles,
    ChevronDown,
    Check,
    ListMusic,
    Loader2
} from 'lucide-react';
import { ttsEngine, VOICES, formatAudioTime } from '../utils/ttsEngine';

/**
 * Cấu hình giao diện chuyên biệt cho 4 phân hệ phong thủy
 */
const THEMES = {
    tuvi: {
        id: 'tuvi',
        systemLabel: 'Tử Vi Đàm Đạo',
        border: 'border-purple-200/90',
        shadow: 'shadow-[0_20px_50px_rgba(76,29,149,0.22)]',
        headerGradient: 'from-purple-950 via-indigo-950 to-slate-900',
        badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        bars: ['bg-purple-300', 'bg-amber-300', 'bg-indigo-300'],
        previewBg: 'bg-purple-50/60 border-purple-100/80',
        sparkleColor: 'text-purple-600',
        trackBg: 'bg-purple-200/70',
        progressFill: 'bg-gradient-to-r from-purple-600 to-indigo-600',
        thumbBg: 'bg-purple-600',
        percentText: 'text-purple-700',
        playButton: 'bg-gradient-to-tr from-purple-700 via-indigo-600 to-purple-600 shadow-purple-500/30',
        activeSpeed: 'bg-purple-700 text-white',
        genderBadge: 'border-purple-200 bg-purple-50/70 hover:bg-purple-100 text-purple-800',
        sliderAccent: 'accent-purple-600',
        pillBorder: 'border-purple-400/30',
        pillPing: 'bg-purple-400',
        pillDot: 'bg-purple-500',
        pillIcon: 'text-purple-300',
    },
    bazi: {
        id: 'bazi',
        systemLabel: 'Bát Tự Đàm Đạo',
        border: 'border-blue-200/90',
        shadow: 'shadow-[0_20px_50px_rgba(30,58,138,0.22)]',
        headerGradient: 'from-blue-950 via-sky-950 to-slate-900',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        bars: ['bg-blue-300', 'bg-cyan-300', 'bg-sky-300'],
        previewBg: 'bg-blue-50/60 border-blue-100/80',
        sparkleColor: 'text-blue-600',
        trackBg: 'bg-blue-200/70',
        progressFill: 'bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600',
        thumbBg: 'bg-blue-600',
        percentText: 'text-blue-700',
        playButton: 'bg-gradient-to-tr from-blue-700 via-sky-600 to-blue-600 shadow-blue-500/30',
        activeSpeed: 'bg-blue-700 text-white',
        genderBadge: 'border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-800',
        sliderAccent: 'accent-blue-600',
        pillBorder: 'border-blue-400/30',
        pillPing: 'bg-blue-400',
        pillDot: 'bg-blue-500',
        pillIcon: 'text-blue-300',
    },
    iching: {
        id: 'iching',
        systemLabel: 'Kinh Dịch Luận Đạo',
        border: 'border-amber-200/90',
        shadow: 'shadow-[0_20px_50px_rgba(180,83,9,0.22)]',
        headerGradient: 'from-amber-950 via-orange-950 to-slate-900',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        bars: ['bg-amber-300', 'bg-yellow-300', 'bg-orange-300'],
        previewBg: 'bg-amber-50/60 border-amber-100/80',
        sparkleColor: 'text-amber-600',
        trackBg: 'bg-amber-200/70',
        progressFill: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500',
        thumbBg: 'bg-amber-600',
        percentText: 'text-amber-700',
        playButton: 'bg-gradient-to-tr from-amber-700 via-orange-600 to-amber-600 shadow-amber-500/30',
        activeSpeed: 'bg-amber-700 text-white',
        genderBadge: 'border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800',
        sliderAccent: 'accent-amber-600',
        pillBorder: 'border-amber-400/30',
        pillPing: 'bg-amber-400',
        pillDot: 'bg-amber-500',
        pillIcon: 'text-amber-300',
    },
    marriage: {
        id: 'marriage',
        systemLabel: 'Hôn Nhân Đồng Điệu',
        border: 'border-rose-200/90',
        shadow: 'shadow-[0_20px_50px_rgba(190,18,60,0.22)]',
        headerGradient: 'from-rose-950 via-pink-950 to-slate-900',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        bars: ['bg-rose-300', 'bg-pink-300', 'bg-red-300'],
        previewBg: 'bg-rose-50/60 border-rose-100/80',
        sparkleColor: 'text-rose-600',
        trackBg: 'bg-rose-200/70',
        progressFill: 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500',
        thumbBg: 'bg-rose-600',
        percentText: 'text-rose-700',
        playButton: 'bg-gradient-to-tr from-rose-700 via-pink-600 to-rose-600 shadow-rose-500/30',
        activeSpeed: 'bg-rose-700 text-white',
        genderBadge: 'border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-800',
        sliderAccent: 'accent-rose-600',
        pillBorder: 'border-rose-400/30',
        pillPing: 'bg-rose-400',
        pillDot: 'bg-rose-500',
        pillIcon: 'text-rose-300',
    }
};

/**
 * Tự động nhận diện phân hệ đang chạy dựa trên sectionId hoặc đường dẫn trình duyệt
 */
function getSubsystemTheme(sectionId) {
    const id = (sectionId || '').toLowerCase();
    const path = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';

    if (
        id.startsWith('bazi') || 
        id.startsWith('bat_tu') || 
        path.includes('bazi') || 
        path.includes('bat-tu')
    ) {
        return THEMES.bazi;
    }
    if (
        id.startsWith('iching') || 
        id.startsWith('kinh_dich') || 
        path.includes('iching') || 
        path.includes('kinh-dich') || 
        path.includes('hexagram')
    ) {
        return THEMES.iching;
    }
    if (
        id.startsWith('marriage') || 
        id.startsWith('hon_nhan') || 
        path.includes('marriage') || 
        path.includes('hon-nhan')
    ) {
        return THEMES.marriage;
    }
    return THEMES.tuvi;
}

export default function AudioPlayerDock() {
    const [ttsState, setTtsState] = useState(ttsEngine.getState());
    const [isMinimized, setIsMinimized] = useState(false);
    const [hoverPercent, setHoverPercent] = useState(null);
    const [isDraggingSeek, setIsDraggingSeek] = useState(false);
    const [showVolumePopover, setShowVolumePopover] = useState(false);
    const [showVoiceMenu, setShowVoiceMenu] = useState(false);

    const progressBarRef = useRef(null);
    const volumeContainerRef = useRef(null);
    const voiceContainerRef = useRef(null);

    // Lắng nghe thay đổi trạng thái từ ttsEngine
    useEffect(() => {
        const unsubscribe = ttsEngine.subscribe((state) => {
            setTtsState(state);
        });
        return () => unsubscribe();
    }, []);

    // Xử lý đóng Popover khi click ra ngoài
    useEffect(() => {
        const handleDocumentClick = (e) => {
            if (volumeContainerRef.current && !volumeContainerRef.current.contains(e.target)) {
                setShowVolumePopover(false);
            }
            if (voiceContainerRef.current && !voiceContainerRef.current.contains(e.target)) {
                setShowVoiceMenu(false);
            }
        };

        if (showVolumePopover || showVoiceMenu) {
            document.addEventListener('mousedown', handleDocumentClick);
            document.addEventListener('touchstart', handleDocumentClick);
        }
        return () => {
            document.removeEventListener('mousedown', handleDocumentClick);
            document.removeEventListener('touchstart', handleDocumentClick);
        };
    }, [showVolumePopover, showVoiceMenu]);

    const { 
        isPlaying, 
        isPaused, 
        isLoading,
        currentSectionId,
        currentSectionTitle, 
        currentExcerpt,
        currentTime,
        duration,
        formattedCurrentTime,
        formattedDuration,
        rate, 
        currentVoiceId,
        currentVoice,
        volume,
        isMuted,
        progressPercent,
        playlistLength,
        playlistIndex,
        hasNextSection,
        hasPrevSection
    } = ttsState;

    // Nhận diện theme màu sắc theo phân hệ
    const theme = getSubsystemTheme(currentSectionId);

    // Xử lý tua tiến trình theo tọa độ chuột
    const handleSeekToX = (clientX) => {
        if (!progressBarRef.current || duration <= 0) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = clickX / rect.width;
        ttsEngine.seekTime(percentage * duration);
    };

    const handleSeekClick = (e) => {
        e.stopPropagation();
        handleSeekToX(e.clientX);
    };

    const handleSeekMouseDown = (e) => {
        e.stopPropagation();
        setIsDraggingSeek(true);
        handleSeekToX(e.clientX);
    };

    useEffect(() => {
        if (!isDraggingSeek) return;
        const handleWindowMouseMove = (e) => {
            handleSeekToX(e.clientX);
        };
        const handleWindowMouseUp = () => {
            setIsDraggingSeek(false);
        };
        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [isDraggingSeek, duration]);

    const handleSeekMouseMove = (e) => {
        if (!progressBarRef.current || duration <= 0) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const hoverX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const pct = Math.round((hoverX / rect.width) * 100);
        setHoverPercent(pct);
    };

    // Nếu không phát và không tạm dừng -> Ẩn dock hoàn toàn (Nút X tắt dứt điểm)
    if (!isPlaying && !isPaused) {
        return null;
    }

    // GIAO DIỆN THU NHỎ (MINI FLOATING PILL)
    if (isMinimized) {
        return (
            <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-6 fade-in duration-200 select-none">
                <div className={`bg-slate-900/95 text-white backdrop-blur-xl border ${theme.pillBorder} rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3`}>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            {isPlaying && !isPaused && (
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${theme.pillPing} opacity-75`}></span>
                            )}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${theme.pillDot}`}></span>
                        </span>
                        <Volume2 size={16} className={theme.pillIcon} />
                        <span className="text-xs font-bold truncate max-w-[130px] sm:max-w-[180px]" title={currentSectionTitle}>
                            {(currentSectionTitle || '').replace(/\bvip\b/gi, 'chuyên sâu')}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => ttsEngine.togglePlayPause()}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-all duration-75 active:scale-95 cursor-pointer"
                            title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                        >
                            {isPaused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsMinimized(false)}
                            className="p-1.5 rounded-full hover:bg-white/20 text-slate-300 hover:text-white transition-all duration-75 active:scale-95 cursor-pointer"
                            title="Mở rộng trình phát"
                        >
                            <Maximize2 size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => ttsEngine.stop()}
                            className="p-1.5 rounded-full hover:bg-red-500/40 text-slate-400 hover:text-red-300 transition-all duration-75 active:scale-95 cursor-pointer"
                            title="Đóng phát âm"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // GIAO DIỆN ĐẦY ĐỦ (MASTER AUDIO PLAYER DOCK)
    return (
        <div className="fixed bottom-4 sm:bottom-6 right-4 left-4 sm:left-auto sm:right-6 sm:w-[500px] z-50 animate-in slide-in-from-bottom-6 fade-in duration-200 select-none">
            <div className={`bg-white/95 backdrop-blur-2xl rounded-3xl border ${theme.border} ${theme.shadow} overflow-visible`}>
                
                {/* Header Thanh Phát (Chuyên biệt hóa màu sắc phân hệ) */}
                <div className={`bg-gradient-to-r ${theme.headerGradient} px-4 py-2.5 text-white flex items-center justify-between rounded-t-3xl`}>
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {/* Visualizer Waveform Animation */}
                        <div className="flex items-end gap-0.5 h-4 w-4 shrink-0">
                            <span className={`w-1 ${theme.bars[0]} rounded-full transition-all duration-200 ${isPlaying && !isPaused && !isLoading ? 'h-4 animate-pulse' : 'h-1.5'}`}></span>
                            <span className={`w-1 ${theme.bars[1]} rounded-full transition-all duration-200 ${isPlaying && !isPaused && !isLoading ? 'h-2.5 animate-bounce' : 'h-2'}`}></span>
                            <span className={`w-1 ${theme.bars[2]} rounded-full transition-all duration-200 ${isPlaying && !isPaused && !isLoading ? 'h-3.5 animate-pulse' : 'h-1'}`}></span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${theme.badgeBg}`}>
                                    {theme.systemLabel}
                                </span>
                                {playlistLength > 1 && (
                                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/90 font-bold flex items-center gap-1">
                                        <ListMusic size={10} />
                                        Mục {playlistIndex + 1}/{playlistLength}
                                    </span>
                                )}
                                <span className="text-[11px] text-white/75 font-medium tabular-nums">
                                    {formattedCurrentTime} / {formattedDuration}
                                </span>
                            </div>
                            <h4 className="font-bold text-xs sm:text-sm truncate leading-tight text-white/95 mt-0.5" title={currentSectionTitle}>
                                {(currentSectionTitle || '').replace(/\bvip\b/gi, 'chuyên sâu')}
                            </h4>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => setIsMinimized(true)}
                            className="p-1.5 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition-all duration-75 active:scale-95 cursor-pointer"
                            title="Thu nhỏ"
                        >
                            <Minimize2 size={15} />
                        </button>
                        <button
                            type="button"
                            onClick={() => ttsEngine.stop()}
                            className="p-1.5 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition-all duration-75 active:scale-95 cursor-pointer"
                            title="Đóng trình phát (Tắt hẳn)"
                        >
                            <X size={17} />
                        </button>
                    </div>
                </div>

                {/* Nội dung đoạn văn đang phát (Karaoke Preview) */}
                <div className={`px-4 py-2.5 ${theme.previewBg} border-b`}>
                    <div className="flex items-start gap-2 min-h-[40px]">
                        <Sparkles size={14} className={`${theme.sparkleColor} mt-0.5 shrink-0`} />
                        <p className="text-xs sm:text-[13px] text-slate-800 leading-snug font-medium italic line-clamp-2">
                            {isLoading 
                                ? "Đang kết nối & tổng hợp giọng đọc AI chất lượng cao..."
                                : (currentExcerpt || "Đang phát giọng đọc phong thủy...").replace(/\bvip\b/gi, 'chuyên sâu').replace(/\bbản\s+bản\b/gi, 'bản')}
                        </p>
                    </div>

                    {/* Thanh Tiến Trình Tương Tác (Interactive Timeline Scrubber) */}
                    <div className="mt-2 flex items-center gap-2.5">
                        <span className={`text-[10px] font-bold ${theme.percentText} min-w-[32px] tabular-nums`}>
                            {formattedCurrentTime}
                        </span>

                        <div 
                            ref={progressBarRef}
                            onClick={handleSeekClick}
                            onMouseDown={handleSeekMouseDown}
                            onMouseMove={handleSeekMouseMove}
                            onMouseLeave={() => setHoverPercent(null)}
                            className="group/seek relative flex-1 h-4 flex items-center cursor-pointer select-none"
                            title="Bấm hoặc kéo để tua thời gian bất kỳ"
                        >
                            {/* Thanh nền */}
                            <div className={`w-full ${theme.trackBg} rounded-full h-1.5 group-hover/seek:h-2 transition-all relative overflow-hidden`}>
                                {/* Thanh tiến trình hiện tại */}
                                <div 
                                    className={`${theme.progressFill} h-full rounded-full transition-all duration-100`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            
                            {/* Nút tròn tua (Scrubber Thumb) */}
                            <div 
                                className={`absolute w-3.5 h-3.5 rounded-full shadow-md border-2 border-white ${theme.thumbBg} pointer-events-none transition-transform duration-75 ${
                                    isDraggingSeek ? 'scale-125 opacity-100' : 'opacity-0 group-hover/seek:opacity-100 group-hover/seek:scale-110'
                                }`}
                                style={{ left: `calc(${progressPercent}% - 7px)` }}
                            />

                            {/* Hover Tooltip gợi ý thời gian */}
                            {hoverPercent !== null && duration > 0 && (
                                <div 
                                    className="absolute -top-7 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10 tabular-nums"
                                    style={{ left: `${hoverPercent}%` }}
                                >
                                    {currentVoiceId === 'thayluan'
                                        ? `Câu ${Math.max(1, Math.round((hoverPercent / 100) * duration))}`
                                        : formatAudioTime((hoverPercent / 100) * duration)}
                                </div>
                            )}
                        </div>

                        <span className={`text-[10px] font-bold ${theme.percentText} min-w-[32px] text-right tabular-nums`}>
                            {formattedDuration}
                        </span>
                    </div>
                </div>

                {/* Bảng Nút Điều Khiển Chính - GỌN GÀNG 1 HÀNG DUY NHẤT */}
                <div className="px-3.5 py-2.5 bg-white flex items-center justify-between gap-1 sm:gap-2 rounded-b-3xl">
                    
                    {/* CỤM BÊN TRÁI: ICON LOA ÂM LƯỢNG (POPUP DỌC) + TỐC ĐỘ ĐỌC (1x, 1.25x, 1.5x) */}
                    <div className="flex items-center gap-1 shrink-0 relative">
                        
                        {/* NÚT LOA & CỘT ÂM LƯỢNG DỌC (VERTICAL POPUP SLIDER) */}
                        <div ref={volumeContainerRef} className="relative">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowVolumePopover(prev => !prev);
                                    setShowVoiceMenu(false);
                                }}
                                className={`p-1.5 rounded-xl border transition-all duration-75 active:scale-95 cursor-pointer ${
                                    showVolumePopover 
                                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80'
                                }`}
                                title="Điều chỉnh âm lượng (Cột trượt dọc)"
                            >
                                {isMuted || volume === 0 ? (
                                    <VolumeX size={15} className="text-red-500" />
                                ) : volume < 0.5 ? (
                                    <Volume1 size={15} />
                                ) : (
                                    <Volume2 size={15} />
                                )}
                            </button>

                            {/* Flyout Cột Trượt Âm Lượng Dọc */}
                            {showVolumePopover && (
                                <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute bottom-full mb-3 left-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 flex flex-col items-center gap-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 min-w-[56px]"
                                >
                                    <span className="text-[11px] font-black text-slate-700">
                                        {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                                    </span>

                                    {/* Vertical Slider */}
                                    <div className="h-28 flex items-center justify-center py-1">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={isMuted ? 0 : Math.round(volume * 100)}
                                            onChange={(e) => ttsEngine.setVolume(Number(e.target.value) / 100)}
                                            className={`h-24 w-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer ${theme.sliderAccent} [writing-mode:vertical-lr] [direction:rtl]`}
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => ttsEngine.toggleMute()}
                                        className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                        title={isMuted ? "Bật âm" : "Tắt âm"}
                                    >
                                        {isMuted ? <VolumeX size={14} className="text-red-500" /> : <Volume2 size={14} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Chọn Tốc Độ Đọc (Rate Pill: Đã Bỏ 0.75x, Chỉ Còn 1x, 1.25x, 1.5x) */}
                        <div className="flex items-center bg-slate-100/90 rounded-xl p-0.5 text-[11px] font-bold text-slate-600 border border-slate-200/60">
                            {[1.0, 1.25, 1.5].map((speed) => (
                                <button
                                    key={speed}
                                    type="button"
                                    onClick={() => ttsEngine.setRate(speed)}
                                    className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all duration-75 active:scale-95 cursor-pointer ${
                                        rate === speed 
                                            ? `${theme.activeSpeed} shadow-xs font-black` 
                                            : 'hover:text-slate-900 hover:bg-white/60'
                                    }`}
                                    title={`Tốc độ đọc ${speed}x`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CỤM TRUNG TÂM: NÚT NHẢY CHƯƠNG LÙI / TIẾN & PHÁT / TẠM DỪNG */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                        <button
                            type="button"
                            onClick={() => ttsEngine.skipPrevSection()}
                            disabled={!hasPrevSection && currentTime <= 2}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all duration-75 active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={hasPrevSection ? "Chương trước" : "Về đầu chương"}
                        >
                            <SkipBack size={16} />
                        </button>

                        <button
                            type="button"
                            onClick={() => ttsEngine.togglePlayPause()}
                            disabled={isLoading}
                            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-75 cursor-pointer shadow-md ${theme.playButton} ${isLoading ? 'opacity-85 cursor-wait' : ''}`}
                            title={isLoading ? "Đang chuẩn bị âm thanh..." : isPaused ? "Tiếp tục đọc" : "Tạm dừng"}
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin text-white" />
                            ) : isPaused ? (
                                <Play size={18} className="ml-0.5" fill="currentColor" />
                            ) : (
                                <Pause size={18} fill="currentColor" />
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => ttsEngine.skipNextSection()}
                            disabled={!hasNextSection}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all duration-75 active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Nhảy sang chương kế tiếp"
                        >
                            <SkipForward size={16} />
                        </button>
                    </div>

                    {/* CỤM BÊN PHẢI: POPOVER CHỌN 4 GIỌNG ĐỌC AI ĐA DẠNG */}
                    <div ref={voiceContainerRef} className="relative shrink-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowVoiceMenu(prev => !prev);
                                setShowVolumePopover(false);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all duration-75 active:scale-95 shadow-2xs cursor-pointer ${theme.genderBadge}`}
                            title="Bấm để chọn giọng đọc khác"
                        >
                            <span className="text-sm">{currentVoice?.icon || '🌸'}</span>
                            <span className="max-w-[70px] sm:max-w-none truncate">{currentVoice?.name || 'Hoài My'}</span>
                            <ChevronDown size={12} className={`transition-transform duration-100 ${showVoiceMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Menu Popover Danh Sách Giọng Đọc */}
                        {showVoiceMenu && (
                            <div 
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-full mb-3 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 w-56 sm:w-64"
                            >
                                <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 flex items-center justify-between">
                                    <span>Chọn giọng đọc</span>
                                    <Sparkles size={11} className={theme.sparkleColor} />
                                </div>
                                <div className="space-y-1">
                                    {VOICES.map((v) => {
                                        const isSelected = currentVoiceId === v.id;
                                        return (
                                            <button
                                                key={v.id}
                                                type="button"
                                                onClick={() => {
                                                    ttsEngine.setVoiceId(v.id);
                                                    setShowVoiceMenu(false);
                                                }}
                                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all duration-75 active:scale-95 cursor-pointer ${
                                                    isSelected 
                                                        ? `${theme.previewBg} ${theme.border} font-bold text-slate-900 shadow-2xs border` 
                                                        : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-lg shrink-0">{v.icon}</span>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-900 truncate leading-tight">
                                                            {v.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 truncate">
                                                            {v.tone}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isSelected && <Check size={14} className={theme.sparkleColor} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
}
