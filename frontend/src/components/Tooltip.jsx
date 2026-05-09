import React, { useState } from 'react';
import { getConcept } from '../services/api';

const Tooltip = ({ term, children, className }) => {
    const [open, setOpen] = useState(false);
    const [info, setInfo] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleMouseEnter = async () => {
        setOpen(true);
        if (!info && term) {
            setLoading(true);
            try {
                const res = await getConcept(term);
                setInfo(res.data);
            } catch (err) {
                setInfo({ short_description: 'Chưa có thông tin.' });
            }
            setLoading(false);
        }
    };

    const handleMouseLeave = () => {
        setOpen(false);
    };

    if (!term) return <span>{children}</span>;

    return (
        <span className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <span className={`cursor-help border-b border-dashed border-gray-400 hover:text-blue-700 transition-colors ${className}`}>
                {children || term}
            </span>
            {open && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[320px] p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-2xl text-left cursor-default text-gray-800 z-[9999]"
                    style={{ minHeight: '80px' }}
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
                </div>
            )}
        </span>
    );
};

export default Tooltip;
