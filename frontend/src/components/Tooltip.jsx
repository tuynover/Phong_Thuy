import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getConcept } from '../services/api';
import { conceptDictionary } from '../data/concepts';

const Tooltip = ({ term, children, className, placement = 'top', unstyled = false }) => {
    const [open, setOpen] = useState(false);
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 320, placement });
    const targetRef = useRef(null);
    const tooltipRef = useRef(null);
    const closeTimeoutRef = useRef(null);
    const isTouchDeviceRef = useRef(false);

    // Clean up timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    // Close tooltip on any scroll event (since it's position: fixed, we want to hide it on scroll)
    useEffect(() => {
        if (open) {
            const handleScroll = () => {
                setOpen(false);
            };
            window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
            return () => {
                window.removeEventListener('scroll', handleScroll, { capture: true });
            };
        }
    }, [open]);

    // Close tooltip when clicking outside on mobile or desktop
    useEffect(() => {
        if (open) {
            const handleOutsideClick = (e) => {
                if (targetRef.current && !targetRef.current.contains(e.target)) {
                    if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
                        setOpen(false);
                    }
                }
            };
            document.addEventListener('pointerdown', handleOutsideClick);
            return () => {
                document.removeEventListener('pointerdown', handleOutsideClick);
            };
        }
    }, [open]);

    const calculatePosition = () => {
        if (targetRef.current) {
            const rect = targetRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const tooltipWidth = Math.min(320, viewportWidth - 24);
            const padding = 12;
            
            let left = rect.left + rect.width / 2;
            const minLeft = tooltipWidth / 2 + padding;
            const maxLeft = viewportWidth - tooltipWidth / 2 - padding;
            left = Math.max(minLeft, Math.min(maxLeft, left));

            // Auto-flip placement if there is not enough room (using 310px to avoid tall tooltip clipping)
            let finalPlacement = placement;
            if (placement === 'top' && rect.top - 310 < 0) {
                finalPlacement = 'bottom';
            } else if (placement === 'bottom' && rect.bottom + 310 > viewportHeight) {
                finalPlacement = 'top';
            }

            if (finalPlacement === 'bottom') {
                setCoords({
                    left,
                    top: rect.bottom + 8,
                    width: tooltipWidth,
                    placement: 'bottom'
                });
            } else {
                setCoords({
                    left,
                    top: rect.top - 8,
                    width: tooltipWidth,
                    placement: 'top'
                });
            }
        }
    };

    const loadConceptData = async () => {
        if (!info && term) {
            const trimmedTerm = term.trim();
            if (conceptDictionary[trimmedTerm]) {
                setInfo(conceptDictionary[trimmedTerm]);
            } else {
                setLoading(true);
                try {
                    const res = await getConcept(trimmedTerm);
                    setInfo(res.data);
                } catch (err) {
                    setInfo({ short_description: 'Chưa có thông tin.' });
                }
                setLoading(false);
            }
        }
    };

    const handleMouseEnter = async () => {
        if (isTouchDeviceRef.current) return;
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
        calculatePosition();
        setOpen(true);
        await loadConceptData();
    };

    const handleMouseLeave = () => {
        if (isTouchDeviceRef.current) return;
        closeTimeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, 150);
    };

    const handleTouchStart = (e) => {
        isTouchDeviceRef.current = true;
        e.stopPropagation();
        if (open) {
            setOpen(false);
        } else {
            calculatePosition();
            setOpen(true);
            loadConceptData();
        }
    };

    const handleTooltipMouseEnter = () => {
        if (isTouchDeviceRef.current) return;
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current);
            closeTimeoutRef.current = null;
        }
    };

    const handleTooltipMouseLeave = () => {
        if (isTouchDeviceRef.current) return;
        closeTimeoutRef.current = setTimeout(() => {
            setOpen(false);
        }, 150);
    };

    if (!term) return <span>{children}</span>;

    const tooltipStyle = {
        position: 'fixed',
        left: `${coords.left}px`,
        top: `${coords.top}px`,
        width: `${coords.width}px`,
        transform: coords.placement === 'bottom' ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
        zIndex: 99999,
        minHeight: '80px',
        pointerEvents: 'auto',
    };

    return (
        <span 
            ref={targetRef}
            className="relative inline-block" 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
        >
            <span className={unstyled ? `cursor-help ${className || ''}` : `cursor-help border-b border-dashed border-gray-400 hover:text-blue-700 transition-colors ${className || ''}`}>
                {children || term}
            </span>
            {open && createPortal(
                <div
                    ref={tooltipRef}
                    className="p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-2xl text-left cursor-default text-gray-800 z-[99999]"
                    style={tooltipStyle}
                    onMouseEnter={handleTooltipMouseEnter}
                    onMouseLeave={handleTooltipMouseLeave}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-amber-300">
                        <span className="font-bold text-red-800 text-base">{term}</span>
                        {info?.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                                {info.category}
                            </span>
                        )}
                    </div>

                    {loading ? (
                        <p className="text-xs italic text-gray-500 animate-pulse">Đang tải...</p>
                    ) : (
                        <>
                            {/* Mô tả ngắn */}
                            {info?.short_description && (
                                <p className="text-[13px] font-semibold text-gray-800 mb-2">
                                    {info.short_description}
                                </p>
                            )}

                            {/* Chi tiết từng dòng */}
                            {info?.full_detail && (
                                <div className="mt-1 space-y-1 border-t border-amber-200 pt-2">
                                    {info.full_detail.split('\n').map((line, i) => {
                                        if (!line.trim()) return null;
                                        // Dòng bắt đầu bằng ▸ → highlight
                                        const isPoint = line.startsWith('▸');
                                        const label = isPoint ? line.substring(1).split(':')[0].trim() : null;
                                        const content = isPoint && line.includes(':')
                                            ? line.substring(line.indexOf(':') + 1).trim()
                                            : line.replace('▸', '').trim();
                                        return (
                                            <div key={i} className="flex gap-1.5 text-[12px] leading-relaxed">
                                                {isPoint && (
                                                    <span className="text-amber-700 font-bold shrink-0 min-w-[70px]">
                                                        {label}:
                                                    </span>
                                                )}
                                                <span className={`text-gray-700 ${!isPoint ? 'italic text-gray-500' : ''}`}>
                                                    {content}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>,
                document.body
            )}
        </span>
    );
};

export default Tooltip;

