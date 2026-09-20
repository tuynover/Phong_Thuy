import React, { useState, useEffect } from 'react';
import { 
  ListOrdered, 
  ChevronRight, 
  ChevronDown, 
  X, 
  ArrowUp,
  LayoutGrid,
  ScrollText,
  Zap
} from 'lucide-react';

const themeColors = {
  bazi: {
    activeBg: 'bg-slate-100 text-slate-900 border-slate-300 font-bold',
    activeDot: 'bg-slate-700',
    activeSubText: 'text-indigo-900 font-bold',
    accentBorder: 'border-slate-500',
    fabBg: 'bg-slate-800 hover:bg-slate-900 text-slate-100 shadow-slate-900/30 border border-slate-700/60',
    headerBadge: 'bg-slate-100 text-slate-800 border-slate-300',
    groupHeader: 'text-slate-500'
  },
  ziwei: {
    activeBg: 'bg-purple-50 text-purple-950 border-purple-200 font-bold',
    activeDot: 'bg-purple-700',
    activeSubText: 'text-purple-900 font-bold',
    accentBorder: 'border-purple-500',
    fabBg: 'bg-purple-900 hover:bg-purple-950 text-purple-100 shadow-purple-950/30 border border-purple-800/60',
    headerBadge: 'bg-purple-50 text-purple-800 border-purple-200',
    groupHeader: 'text-purple-600'
  },
  tu_vi: {
    activeBg: 'bg-purple-50 text-purple-950 border-purple-200 font-bold',
    activeDot: 'bg-purple-700',
    activeSubText: 'text-purple-900 font-bold',
    accentBorder: 'border-purple-500',
    fabBg: 'bg-purple-900 hover:bg-purple-950 text-purple-100 shadow-purple-950/30 border border-purple-800/60',
    headerBadge: 'bg-purple-50 text-purple-800 border-purple-200',
    groupHeader: 'text-purple-600'
  },
  iching: {
    activeBg: 'bg-amber-50 text-amber-950 border-amber-200 font-bold',
    activeDot: 'bg-amber-700',
    activeSubText: 'text-amber-900 font-bold',
    accentBorder: 'border-amber-500',
    fabBg: 'bg-stone-800 hover:bg-stone-900 text-amber-100 shadow-stone-950/30 border border-amber-900/40',
    headerBadge: 'bg-amber-50 text-amber-800 border-amber-200',
    groupHeader: 'text-amber-700'
  },
  marriage: {
    activeBg: 'bg-rose-50 text-rose-950 border-rose-200 font-bold',
    activeDot: 'bg-rose-700',
    activeSubText: 'text-rose-900 font-bold',
    accentBorder: 'border-rose-500',
    fabBg: 'bg-rose-900 hover:bg-rose-950 text-rose-100 shadow-rose-950/30 border border-rose-800/60',
    headerBadge: 'bg-rose-50 text-rose-800 border-rose-200',
    groupHeader: 'text-rose-600'
  }
};

// Nút bấm Mục Lục có thể đặt linh hoạt ở bất kỳ đâu (như trong cụm Floating Action Buttons)
export const TableOfContentsTrigger = ({ theme = 'bazi', className = '', onClick }) => {
  const colors = themeColors[theme] || themeColors.bazi;
  const handleClick = (e) => {
    if (onClick) onClick(e);
    else window.dispatchEvent(new CustomEvent('toggle-toc-drawer'));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Mở mục lục điều hướng toàn trang"
      className={`flex items-center gap-2 px-5 py-3 rounded-full font-extrabold text-xs sm:text-sm shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md uppercase tracking-wider group ${colors.fabBg} ${className}`}
    >
      <ListOrdered size={16} className="shrink-0 transition-transform group-hover:rotate-6" />
      <span>Mục lục luận giải</span>
    </button>
  );
};

export const TableOfContents = ({ 
  sections = [], 
  pageSections = [],
  theme = 'bazi', 
  onSelectSection,
  isChatOpen: externalIsChatOpen = false,
  showFloatingTrigger = false,
  className = '' 
}) => {
  const [activeId, setActiveId] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [chatOpen, setChatOpen] = useState(externalIsChatOpen);

  const colors = themeColors[theme] || themeColors.bazi;

  // Lắng nghe sự kiện toggle drawer từ nút bấm trigger ở ngoài
  useEffect(() => {
    const handleToggle = (e) => {
      if (e?.detail?.isOpen !== undefined) {
        setIsDrawerOpen(Boolean(e.detail.isOpen));
      } else {
        setIsDrawerOpen(prev => !prev);
      }
    };
    window.addEventListener('toggle-toc-drawer', handleToggle);
    return () => window.removeEventListener('toggle-toc-drawer', handleToggle);
  }, []);

  // Đồng bộ trạng thái mở chat từ prop hoặc custom DOM event
  useEffect(() => {
    setChatOpen(externalIsChatOpen);
  }, [externalIsChatOpen]);

  useEffect(() => {
    const handleChatEvent = (e) => {
      if (e?.detail?.isOpen !== undefined) {
        setChatOpen(Boolean(e.detail.isOpen));
      }
    };
    window.addEventListener('ai-chat-state-change', handleChatEvent);
    return () => window.removeEventListener('ai-chat-state-change', handleChatEvent);
  }, []);

  // Tổng hợp toàn bộ ID để ScrollSpy theo dõi vị trí cuộn trang
  useEffect(() => {
    const allIds = [];

    // 1. Chart / Page sections
    if (Array.isArray(pageSections)) {
      pageSections.forEach(ps => {
        if (ps.id) allIds.push(ps.id);
      });
    }

    // 2. Summary box
    allIds.push('life-radar-summary');

    // 3. AI interpretation sections
    if (Array.isArray(sections)) {
      sections.forEach(sec => {
        if (sec.id) allIds.push(sec.id);
        if (Array.isArray(sec.subsections)) {
          sec.subsections.forEach(sub => {
            if (sub.id) allIds.push(sub.id);
          });
        }
      });
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      let current = '';

      for (let i = 0; i < allIds.length; i++) {
        const id = allIds[i];
        const element = document.getElementById(id);
        if (element) {
          const top = element.getBoundingClientRect().top + window.scrollY;
          if (scrollPosition >= top - 30) {
            current = id;
          }
        }
      }

      if (current && current !== activeId) {
        setActiveId(current);
        const parentSec = sections.find(s => 
          s.id === current || (s.subsections && s.subsections.some(sub => sub.id === current))
        );
        if (parentSec && !expandedSections[parentSec.id]) {
          setExpandedSections(prev => ({ ...prev, [parentSec.id]: true }));
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, pageSections, activeId]);

  // Đóng Drawer khi nhấn phím Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Nếu không có bất kỳ mục nào (cả học thuật tĩnh và luận giải), không render
  const hasPageSections = Array.isArray(pageSections) && pageSections.length > 0;
  const hasAiSections = Array.isArray(sections) && sections.length > 0;
  if (!hasPageSections && !hasAiSections) return null;

  const toggleExpand = (secId, e) => {
    e.stopPropagation();
    setExpandedSections(prev => ({ ...prev, [secId]: !prev[secId] }));
  };

  const scrollToElement = (targetId) => {
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNavigatePageSection = (targetId) => {
    setActiveId(targetId);
    scrollToElement(targetId);
    setTimeout(() => scrollToElement(targetId), 100);
    setIsDrawerOpen(false);
  };

  const handleNavigateAiSection = (secId, subId = null) => {
    const targetId = subId || secId;
    
    // Mở bung accordion nếu đang thu gọn
    if (onSelectSection) {
      onSelectSection(secId, subId);
    }

    setExpandedSections(prev => ({ ...prev, [secId]: true }));
    setActiveId(targetId);

    scrollToElement(targetId);
    setTimeout(() => scrollToElement(targetId), 150);

    setIsDrawerOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* 1. NÚT NỔI BẤM MỤC LỤC (Chỉ render nếu showFloatingTrigger = true) */}
      {showFloatingTrigger && (
        <div 
          className={`fixed right-4 sm:right-6 bottom-36 sm:bottom-40 z-[60] transition-all duration-300 ${
            chatOpen 
              ? 'opacity-0 pointer-events-none scale-90 translate-y-3' 
              : 'opacity-100 pointer-events-auto scale-100 translate-y-0'
          } ${className}`}
        >
          <TableOfContentsTrigger theme={theme} onClick={() => setIsDrawerOpen(prev => !prev)} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. OVERLAY BACKDROP & OFFCANVAS SLIDE-OVER DRAWER                         */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[75] animate-in fade-in duration-200">
          {/* Backdrop làm mờ */}
          <div 
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          ></div>

          {/* Slide-over Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-80 sm:w-96 max-w-[90vw] bg-white/95 backdrop-blur-xl shadow-2xl border-l border-slate-200 z-[80] flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs">
                  <ListOrdered size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight">
                    Mục Lục Toàn Trang
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Lá số học thuật & Luận giải chi tiết
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng mục lục (Esc)"
              >
                <X size={17} />
              </button>
            </div>

            {/* Drawer Section List */}
            <nav className="overflow-y-auto p-3.5 space-y-4 flex-1 custom-scrollbar">
              
              {/* NHÓM 1: CÁC THÀNH PHẦN LÁ SỐ HỌC THUẬT (Từ trên xuống dưới) */}
              {hasPageSections && (
                <div className="space-y-1.5">
                  <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5 mb-1.5">
                    <LayoutGrid size={13} />
                    <span>Lá Số & Bàn Tính Học Thuật</span>
                  </div>
                  {pageSections.map((ps) => {
                    const isPsActive = activeId === ps.id;
                    return (
                      <div
                        key={ps.id}
                        onClick={() => handleNavigatePageSection(ps.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all duration-150 text-xs sm:text-[13px] ${
                          isPsActive 
                            ? `${colors.activeBg} shadow-xs` 
                            : 'bg-slate-50/70 text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          isPsActive ? colors.activeDot : 'bg-slate-300'
                        }`}></span>
                        <span className="truncate">{ps.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* NHÓM 2: PHẦN TÓM TẮT & LUẬN GIẢI CỦA THẦY */}
              {(hasAiSections || document.getElementById('life-radar-summary')) && (
                <div className="space-y-1.5">
                  <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5 mb-1.5">
                    <ScrollText size={13} />
                    <span>Tóm Tắt & Luận Giải Chi Tiết</span>
                  </div>

                  {/* Mục Tóm Tắt 1 Phút */}
                  <div
                    onClick={() => handleNavigatePageSection('life-radar-summary')}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all duration-150 text-xs sm:text-[13px] ${
                      activeId === 'life-radar-summary'
                        ? `${colors.activeBg} shadow-xs`
                        : 'bg-slate-50/70 text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Zap size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                    <span className="truncate font-bold">
                      {theme === 'iching' || theme === 'kinh_dich' 
                        ? '⚡ Tóm Tắt Quẻ Dịch 1 Phút'
                        : theme === 'marriage' || theme === 'hop_hon'
                        ? '⚡ Tóm Tắt Hợp Hôn 1 Phút'
                        : theme === 'ziwei' || theme === 'tu_vi'
                        ? '⚡ Tóm Tắt Mệnh Bàn 1 Phút'
                        : '⚡ Tóm Tắt Vận Mệnh 1 Phút'}
                    </span>
                  </div>

                  {/* Các chương mục luận giải chi tiết H2 / H3 */}
                  {sections.map((sec, idx) => {
                    const isSectionActive = activeId === sec.id || (sec.subsections && sec.subsections.some(sub => sub.id === activeId));
                    const isExpanded = expandedSections[sec.id] ?? isSectionActive;
                    const hasSubs = Array.isArray(sec.subsections) && sec.subsections.length > 0;

                    return (
                      <div key={sec.id || idx} className="space-y-1">
                        {/* Level 1: Chương lớn H2 */}
                        <div
                          onClick={() => handleNavigateAiSection(sec.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all duration-150 text-xs sm:text-[13px] ${
                            isSectionActive 
                              ? `${colors.activeBg} shadow-xs` 
                              : 'bg-slate-50/70 text-slate-700 font-semibold hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              isSectionActive ? colors.activeDot : 'bg-slate-300'
                            }`}></span>
                            <span className="truncate">
                              {sec.title}
                            </span>
                          </div>

                          {hasSubs && (
                            <button
                              type="button"
                              onClick={(e) => toggleExpand(sec.id, e)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white/70 transition-transform shrink-0"
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                          )}
                        </div>

                        {/* Level 2: Tiểu mục con H3 */}
                        {hasSubs && isExpanded && (
                          <div className="pl-4 pr-1 py-1 space-y-1 border-l-2 border-slate-200 ml-3">
                            {sec.subsections.map((sub, sIdx) => {
                              const isSubActive = activeId === sub.id;
                              return (
                                <div
                                  key={sub.id || sIdx}
                                  onClick={() => handleNavigateAiSection(sec.id, sub.id)}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-lg cursor-pointer text-xs flex items-center gap-2 transition-colors ${
                                    isSubActive
                                      ? `${colors.activeSubText} bg-slate-100 font-bold shadow-2xs`
                                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium'
                                  }`}
                                >
                                  <span className="text-slate-300 text-xs shrink-0">•</span>
                                  <span className="truncate">{sub.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </nav>

            {/* Drawer Footer: Lên đầu trang */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <button
                type="button"
                onClick={scrollToTop}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <ArrowUp size={14} />
                <span>Cuộn lên đầu trang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TableOfContents;
