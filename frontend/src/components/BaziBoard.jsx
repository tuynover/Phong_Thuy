import React, { useState, useEffect, useContext, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../context/AuthContext';
import { getInterpretationStreamUrl, rateBazi } from '../services/api';
import { AlertCircle, BookOpen, ScrollText, MessageCircle, ArrowDown, ArrowUp, Star } from 'lucide-react';
import AiChatWidget from './AiChatWidget';
import { parseMarkdownSections } from '../utils/markdownParser';
import SectionRenderer from './SectionRenderer';
import Tooltip from './Tooltip';

import {
    stemElements,
    branchElements,
    getColorClass,
    getBgColorClass,
    formatThan,
    formatElement
} from '../utils/astrologyHelpers';

const BaziBoard = ({ data, onUpdateData, onRequireLogin, onInvalidateHistory }) => {
    const { user, setUser, token } = useContext(AuthContext);

    // AI Interpretation States
    const [interpretation, setInterpretation] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [error, setError] = useState('');
    const [loadingStep, setLoadingStep] = useState(0);
    const [abortController, setAbortController] = useState(null);

    // Đánh giá sao
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [justRated, setJustRated] = useState(false);

    const prevIdRef = useRef(null);

    // Set initial interpretation and rating if cached in data
    useEffect(() => {
        const currentId = data?.recordId || data?._id;
        if (currentId !== prevIdRef.current) {
            setJustRated(false);
            prevIdRef.current = currentId;
        }
        if (data?.aiInterpretation && data.aiInterpretation.content) {
            setInterpretation(data.aiInterpretation.content);
        } else {
            setInterpretation('');
        }
        setRating(data?.rating || 0);
        setFeedback(data?.feedback || '');
    }, [data]);

    // Loading texts
    const loadingTexts = [
        "Đang phân tích Nhật Chủ...",
        "Đang cân bằng Ngũ Hành...",
        "Đang suy diễn Đại Vận..."
    ];

    // Progressive fake steps transition
    useEffect(() => {
        let interval;
        if (isInterpreting) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [isInterpreting]);

    // Cancel active stream on unmount
    useEffect(() => {
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        const resolvedId = data?.recordId || data?._id;
        if (!resolvedId) return;
        try {
            await rateBazi(resolvedId, rating, feedback);
            setJustRated(true);
            if (onInvalidateHistory) onInvalidateHistory();
            if (onUpdateData) {
                onUpdateData({
                    ...data,
                    rating,
                    feedback
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!data) return null;

    const { canChi, lunarDateStr, lunarYear, nguHanh, analysis, dungThan, hyThan, daYun } = data;

    const getRemedyData = (element) => {
        const remedies = {
            'Moc': {
                colors: "Xanh lá cây, xanh lục, xanh ngọc, xanh bộ đội.",
                directions: "Đông, Đông Nam (tương ứng cung Chấn, Tốn).",
                careers: "Lâm nghiệp, chế biến gỗ, nông nghiệp, giáo dục, viết lách, y dược, dệt may, thiết kế thời trang.",
                items: "Vòng dâu tằm, trang sức đá Thạch Anh Xanh (Aventurine), Ngọc Cẩm Thạch, Ngọc Bích, trồng nhiều cây xanh."
            },
            'Hoa': {
                colors: "Đỏ, hồng, tím, cam, đỏ rực.",
                directions: "Nam (tương ứng cung Ly).",
                careers: "Công nghệ thông tin, điện tử, viễn thông, ẩm thực, năng lượng, nhà hàng, mỹ phẩm, nghệ thuật, nhiếp ảnh.",
                items: "Trang sức đá Thạch Anh Hồng, đá Ruby, Thạch Anh Tím, đá Mắt Hổ Đỏ, dùng nến thơm hoặc đèn ấm trong nhà."
            },
            'Tho': {
                colors: "Vàng, nâu đất, cam đất, vàng cát.",
                directions: "Trung cung (trung tâm), Đông Bắc, Tây Nam.",
                careers: "Bất động sản, xây dựng, kiến trúc, khai khoáng, gốm sứ, nông nghiệp sạch, quản trị nhân sự, luật pháp.",
                items: "Trang sức đá Thạch Anh Vàng (Citrine), Thạch Anh Tóc Vàng, đá Mắt Hổ Vàng Nâu, bài trí đồ gốm sứ thủ công."
            },
            'Kim': {
                colors: "Trắng, xám, ghi, vàng ánh kim, bạc.",
                directions: "Tây, Tây Bắc (tương ứng cung Đoài, Càn).",
                careers: "Cơ khí, kim khí, tài chính, ngân hàng, trang sức, công nghệ cao, hành chính công, quân sự, thiết bị y tế.",
                items: "Trang sức bạc, vàng trắng, đá Thạch Anh Trắng, Thạch Anh Khói, đá Mặt Trăng (Moonstone), trang sức kim loại."
            },
            'Thuy': {
                colors: "Đen, xanh dương, xanh nước biển, xanh navy.",
                directions: "Bắc (tương ứng cung Khảm).",
                careers: "Vận tải, du lịch, thủy hải sản, ngoại giao, báo chí, truyền thông, dịch vụ khách hàng, hóa chất, giặt ủi.",
                items: "Trang sức đá Obsidian Đen, Thạch Anh Tóc Đen, Aquamarine, đặt bể cá cảnh hoặc thác nước phong thủy mini."
            }
        };
        return remedies[element] || null;
    };

    const remedyData = getRemedyData(dungThan);

    const renderCanChiSpans = (canChiStr) => {
        if (!canChiStr) return '';
        const parts = canChiStr.trim().split(/\s+/);
        if (parts.length !== 2) return <span className="font-extrabold">{canChiStr}</span>;
        const [gan, zhi] = parts;
        const ganElem = stemElements[gan];
        const zhiElem = branchElements[zhi];
        return (
            <span className="font-extrabold inline-flex items-center">
                <Tooltip term={gan} unstyled={true}>
                    <span className={`hover:scale-105 transition-transform inline-block ${getColorClass(ganElem)}`}>{gan}</span>
                </Tooltip>
                <span className="text-slate-400 font-normal mx-0.5">&nbsp;</span>
                <Tooltip term={zhi} unstyled={true}>
                    <span className={`hover:scale-105 transition-transform inline-block ${getColorClass(zhiElem)}`}>{zhi}</span>
                </Tooltip>
            </span>
        );
    };

    const getNaYinTextColorClass = (naYinText) => {
        if (!naYinText) return 'text-slate-800';
        const cleanText = naYinText.trim();
        const words = cleanText.split(/\s+/);
        const lastWord = words[words.length - 1];
        
        if (lastWord.includes('Kim')) return 'text-slate-500 font-extrabold';
        if (lastWord.includes('Mộc') || lastWord.includes('Moc') || lastWord.includes('Lâm')) return 'text-emerald-600 font-extrabold';
        if (lastWord.includes('Thủy') || lastWord.includes('Thuỷ') || lastWord.includes('Hải')) return 'text-blue-600 font-extrabold';
        if (lastWord.includes('Hỏa') || lastWord.includes('Hoả')) return 'text-red-600 font-extrabold';
        if (lastWord.includes('Thổ') || lastWord.includes('Thô')) return 'text-amber-800 font-extrabold';
        
        if (cleanText.includes('Kim')) return 'text-slate-500 font-extrabold';
        if (cleanText.includes('Mộc') || cleanText.includes('Moc')) return 'text-emerald-600 font-extrabold';
        if (cleanText.includes('Thủy') || cleanText.includes('Thuỷ')) return 'text-blue-600 font-extrabold';
        if (cleanText.includes('Hỏa') || cleanText.includes('Hoả')) return 'text-red-600 font-extrabold';
        if (cleanText.includes('Thổ') || cleanText.includes('Thô')) return 'text-amber-800 font-extrabold';
        return 'text-slate-800';
    };

    const cleanLunarDate = (lunarStr) => {
        if (!lunarStr) return '';
        return lunarStr
            .replace(/ngày\s+/i, '')
            .replace(/\s*tháng\s*/i, '/')
            .replace(/\s*năm\s*/i, '/')
            .replace(/\s*Âm\s+lịch/i, '')
            .trim();
    };

    const getNaYinColorClass = (naYinText) => {
        if (!naYinText) return 'text-slate-500 bg-slate-100/80 border-slate-200/40';
        if (naYinText.includes('Kim')) return 'text-slate-700 bg-slate-100 border-slate-350';
        if (naYinText.includes('Mộc')) return 'text-emerald-700 bg-emerald-50 border-emerald-250/30';
        if (naYinText.includes('Thủy')) return 'text-blue-700 bg-blue-50 border-blue-200/40';
        if (naYinText.includes('Hỏa')) return 'text-red-700 bg-red-50 border-red-200/40';
        if (naYinText.includes('Thổ')) return 'text-amber-800 bg-amber-50/60 border-amber-250/30';
        return 'text-slate-500 bg-slate-100/80 border-slate-200/40';
    };

    const getAbbreviatedTruongSinh = (name) => {
        if (!name) return '';
        const abbrev = {
            'Trường Sinh': 'T.Sinh',
            'Mộc Dục': 'M.Dục',
            'Quan Đới': 'Q.Đới',
            'Lâm Quan': 'L.Quan',
            'Đế Vượng': 'Đ.Vượng',
            'Suy': 'Suy',
            'Bệnh': 'Bệnh',
            'Tử': 'Tử',
            'Mộ': 'Mộ',
            'Tuyệt': 'Tuyệt',
            'Thai': 'Thai',
            'Dưỡng': 'Dưỡng'
        };
        return abbrev[name] || name;
    };

    const getAbbreviatedThapThan = (name) => {
        if (!name) return '';
        const trimmed = name.trim();
        const map = {
            'Tỷ Kiên': 'Tỷ',
            'Kiếp Tài': 'Kiếp',
            'Thực Thần': 'Thực',
            'Thương Quan': 'Thương',
            'Thiên Tài': 'T.Tài',
            'Chính Tài': 'Tài',
            'Thất Sát': 'Sát',
            'Chính Quan': 'Quan',
            'Thiên Ấn': 'Kiêu',
            'Chính Ấn': 'Ấn'
        };
        return map[trimmed] || trimmed;
    };

    const getBatCung = (zhi) => {
        if (!zhi) return '';
        const map = {
            'Tý': 'Cung Khảm Thủy',
            'Sửu': 'Cung Cấn Thổ',
            'Dần': 'Cung Cấn Thổ',
            'Mão': 'Cung Chấn Mộc',
            'Thìn': 'Cung Tốn Mộc',
            'Tỵ': 'Cung Tốn Mộc',
            'Ngọ': 'Cung Ly Hỏa',
            'Mùi': 'Cung Khôn Thổ',
            'Thân': 'Cung Khôn Thổ',
            'Dậu': 'Cung Đoài Kim',
            'Tuất': 'Cung Càn Kim',
            'Hợi': 'Cung Càn Kim'
        };
        return map[zhi.trim()] || '';
    };

    const Pillar = ({ title, pillarData, isDayMaster }) => {
        if (!pillarData || !pillarData.gan || !pillarData.zhi) return null;
        const { gan, zhi, thapThanGan, tangCan = [], naYin, truongSinh } = pillarData;
        const ganElem = stemElements[gan];
        const zhiElem = branchElements[zhi];

        return (
            <div className={`relative ${truongSinh ? 'pl-6 sm:pl-7 pr-1.5 sm:pr-3 md:pr-4' : 'px-1.5 sm:px-3 md:px-4'} flex flex-col items-center py-1.5 sm:py-3 md:py-4 rounded-xl shadow-sm border-2 ${isDayMaster ? 'border-amber-500 bg-amber-50/30 ring-4 ring-amber-100' : 'border-gray-200 bg-white'} flex-1 md:flex-initial md:min-w-[15%] md:max-w-[20%] md:flex-shrink-0`}>
                {truongSinh && (
                    <div 
                        className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center text-[9px] sm:text-[11px] font-black text-slate-800 [writing-mode:vertical-lr] rotate-180 select-none"
                        style={{ minWidth: '16px' }}
                    >
                        <Tooltip term={truongSinh} unstyled={true}>
                            <span className="cursor-help hover:text-blue-700 transition-colors">{getAbbreviatedTruongSinh(truongSinh)}</span>
                        </Tooltip>
                    </div>
                )}

                <Tooltip term={title} unstyled={true}>
                    <div className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${isDayMaster ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                        {title}
                    </div>
                </Tooltip>

                {/* Horizontal dashed divider line */}
                <div className="w-full border-t border-dashed border-gray-200 my-1.5 sm:my-2"></div>
                
                <div className="text-[9px] sm:text-sm font-bold text-gray-400 mb-1.5 h-4 sm:h-5">
                    {thapThanGan !== 'Nhật Chủ' ? (
                        <Tooltip term={thapThanGan} unstyled={true}>
                            <span className="cursor-help hover:text-blue-700 transition-colors">{getAbbreviatedThapThan(thapThanGan)}</span>
                        </Tooltip>
                    ) : ''}
                </div>
                
                <Tooltip term={gan} unstyled={true}>
                    <div className={`text-2xl sm:text-4xl font-black mt-1 mb-1 sm:mb-2 hover:scale-110 transition-transform ${getColorClass(ganElem)}`}>{gan}</div>
                </Tooltip>
                <Tooltip term={zhi} unstyled={true}>
                    <div className={`text-2xl sm:text-4xl font-black mb-1 sm:mb-2 hover:scale-110 transition-transform ${getColorClass(zhiElem)}`}>{zhi}</div>
                </Tooltip>
                
                {naYin && (
                    <Tooltip term={naYin} unstyled={true}>
                        <div className={`text-[8px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border my-1 text-center max-w-full truncate hover:brightness-95 transition-all ${getNaYinColorClass(naYin)}`}>
                            {naYin}
                        </div>
                    </Tooltip>
                )}
                
                <div className="w-full border-t border-dashed border-gray-200 mt-2.5 pt-2 flex flex-col items-center justify-center">
                    <div className="w-full max-w-[95px] sm:max-w-[115px] flex flex-col gap-1 mt-1">
                        {tangCan.map((tc, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] sm:text-[12.5px] leading-tight w-full">
                                <Tooltip term={tc.gan} unstyled={true}>
                                    <span className={`font-bold shrink-0 text-left hover:scale-110 transition-transform ${getColorClass(stemElements[tc.gan])}`}>{tc.gan}</span>
                                </Tooltip>
                                <Tooltip term={tc.thapThan} unstyled={true}>
                                    <span className="text-slate-800 font-bold text-right truncate pl-1 hover:text-blue-700 transition-colors">{getAbbreviatedThapThan(tc.thapThan)}</span>
                                </Tooltip>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const FiveElementsDiagram = ({ scores }) => {
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const getPercentage = (key) => {
            if (!totalScore) return 0;
            return Math.round(((scores[key] || 0) / totalScore) * 100);
        };
        
        const width = 480;
        const height = 360;
        const cx = width / 2;
        const cy = 180;
        const rLayout = 155; // Maximum radius for grid
        const rLabel = 175; // Distance of foreignObject center from center
        
        const order = ['Moc', 'Hoa', 'Tho', 'Kim', 'Thuy'];
        const dmElem = canChi && canChi.day && canChi.day.gan ? stemElements[canChi.day.gan] : null;
        const dmIndex = dmElem ? order.indexOf(dmElem) : -1;
        
        const getSubLabel = (key) => {
            if (dmIndex === -1) return '';
            const idx = order.indexOf(key);
            const diff = (idx - dmIndex + 5) % 5;
            const subLabels = {
                0: 'KẾT NỐI',
                1: 'SÁNG TẠO',
                2: 'QUẢN LÝ',
                3: 'HỖ TRỢ',
                4: 'TƯ DUY'
            };
            return subLabels[diff] || '';
        };

        const getBezierPath = (points, tension = 0.08) => {
            if (points.length === 0) return '';
            let d = `M ${points[0].x} ${points[0].y}`;
            const n = points.length;
            for (let i = 0; i < n; i++) {
                const p0 = points[(i - 1 + n) % n];
                const p1 = points[i];
                const p2 = points[(i + 1) % n];
                const p3 = points[(i + 2) % n];
                
                const cp1x = p1.x + (p2.x - p0.x) * tension;
                const cp1y = p1.y + (p2.y - p0.y) * tension;
                const cp2x = p2.x - (p3.x - p1.x) * tension;
                const cp2y = p2.y - (p3.y - p1.y) * tension;
                
                d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
            }
            return d;
        };
        
        const elementsDef = [
            { key: 'Hoa', label: 'Hỏa', color: '#b91c1c', bgColor: '#fee2e2', char: '火', emoji: '🔥', subLabel: getSubLabel('Hoa'), angle: -Math.PI / 2 },
            { key: 'Tho', label: 'Thổ', color: '#854d0e', bgColor: '#fef3c7', char: '土', emoji: '⛰️', subLabel: getSubLabel('Tho'), angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
            { key: 'Kim', label: 'Kim', color: '#4b5563', bgColor: '#f3f4f6', char: '金', emoji: '🪙', subLabel: getSubLabel('Kim'), angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
            { key: 'Thuy', label: 'Thủy', color: '#1d4ed8', bgColor: '#dbeafe', char: '水', emoji: '💧', subLabel: getSubLabel('Thuy'), angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
            { key: 'Moc', label: 'Mộc', color: '#15803d', bgColor: '#d1fae5', char: '木', emoji: '🌲', subLabel: getSubLabel('Moc'), angle: -Math.PI / 2 + (8 * Math.PI) / 5 }
        ];
        
        const nodes = elementsDef.map(el => {
            const pct = getPercentage(el.key);
            const rData = rLayout * (pct / 100);
            
            return {
                ...el,
                x: cx + rData * Math.cos(el.angle),
                y: cy + rData * Math.sin(el.angle),
                xLabel: cx + rLabel * Math.cos(el.angle),
                yLabel: cy + rLabel * Math.sin(el.angle),
                pct
            };
        });
        
        const gridLevels = [1, 2, 3, 4, 5];
        
        return (
            <div className="relative flex flex-col items-center justify-center max-w-xl mx-auto w-full select-none" style={{ marginTop: 'calc(0.5rem + 0.5cm)', marginBottom: 'calc(0.5rem - 0.5cm)' }}>
                <div className="relative w-full flex justify-center overflow-visible">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto max-w-[440px] overflow-visible">
                        <defs>
                            {/* Glow filter for the soft aesthetic */}
                            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#047857" floodOpacity="0.12" />
                            </filter>
                            
                            {/* Radial gradient for the polygon area */}
                            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
                                <stop offset="85%" stopColor="#10b981" stopOpacity="0.28" />
                                <stop offset="100%" stopColor="#059669" stopOpacity="0.42" />
                            </radialGradient>
                        </defs>

                        {/* 1. Draw Concentric Pentagons & Circular Guides (Grid) */}
                        {gridLevels.map(level => {
                            const rLevel = rLayout * (level / 5);
                            const points = elementsDef.map(el => {
                                const x = cx + rLevel * Math.cos(el.angle);
                                const y = cy + rLevel * Math.sin(el.angle);
                                return `${x},${y}`;
                            }).join(' ');
                            const isOuter = level === 5;
                            return (
                                <g key={`grid-${level}`}>
                                    {/* Concentric Pentagon */}
                                    <polygon 
                                        points={points} 
                                        fill="none" 
                                        stroke={isOuter ? "rgba(251, 146, 60, 0.4)" : "rgba(251, 146, 60, 0.15)"} 
                                        strokeWidth={isOuter ? "1.5" : "1"} 
                                        strokeDasharray={isOuter ? "none" : "3,3"}
                                    />
                                    {/* Matching concentric circles for astrology / compass feel */}
                                    <circle 
                                        cx={cx} cy={cy} 
                                        r={rLevel} 
                                        fill="none" 
                                        stroke="rgba(251, 146, 60, 0.04)" 
                                        strokeWidth="1" 
                                    />
                                </g>
                            );
                        })}
                        
                        {/* 2. Draw Spokes / Axes from Center */}
                        {elementsDef.map((el, idx) => {
                            const xOuter = cx + rLayout * Math.cos(el.angle);
                            const yOuter = cy + rLayout * Math.sin(el.angle);
                            return (
                                <line 
                                    key={`spoke-${idx}`} 
                                    x1={cx} y1={cy} 
                                    x2={xOuter} y2={yOuter} 
                                    stroke="rgba(251, 146, 60, 0.25)" 
                                    strokeWidth="1" 
                                    strokeDasharray="2,2"
                                />
                            );
                        })}

                        {/* Center decorative ring */}
                        <circle cx={cx} cy={cy} r="4" fill="#fdba74" opacity="0.6" />
                        
                        {/* 3. Draw Data Polygon using smooth Bezier curve */}
                        <path 
                            d={getBezierPath(nodes, 0.08)} 
                            fill="url(#radarGrad)" 
                            stroke="#10b981" 
                            strokeWidth="3" 
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#radarGlow)"
                        />
                        
                        {/* 4. Draw Markers at data vertices */}
                        {nodes.map((node, idx) => {
                            return (
                                <g key={`marker-${idx}`}>
                                    <circle 
                                        cx={node.x} cy={node.y} 
                                        r="5.5" 
                                        fill="#10b981" 
                                        stroke="#ffffff" 
                                        strokeWidth="2"
                                    />
                                </g>
                            );
                        })}
                        
                        {/* 5. Draw Vertex Icons and Labels using foreignObject */}
                        {nodes.map((node, idx) => {
                            const labelWidth = 120;
                            const labelHeight = 110;
                            
                            return (
                                <foreignObject 
                                    key={`label-${idx}`}
                                    x={node.xLabel - labelWidth / 2} 
                                    y={node.yLabel - labelHeight / 2 - Math.sin(node.angle) * 15} 
                                    width={labelWidth} 
                                    height={labelHeight}
                                    className="overflow-visible"
                                >
                                    <div className="flex flex-col items-center justify-center text-center">
                                        {/* Circle Icon with Chinese Character and Emoji */}
                                        <div 
                                            className="w-14 h-14 rounded-full flex flex-col items-center justify-center text-white shadow-lg border-2 border-white relative overflow-hidden transform hover:scale-105 transition-transform duration-300"
                                            style={{ backgroundColor: node.color }}
                                        >
                                            <span className="text-[12px] leading-none mb-1">{node.emoji}</span>
                                            <span className="text-[16px] font-black leading-none">{node.char}</span>
                                        </div>
                                        {/* Label Tag */}
                                        <div 
                                            className="mt-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-extrabold text-white shadow-md tracking-wider uppercase flex items-center gap-1"
                                            style={{ backgroundColor: node.color }}
                                        >
                                            <span>{node.label}</span>
                                            <span className="opacity-95 font-black">({node.pct}%)</span>
                                        </div>
                                        {/* Sub-label */}
                                        <div className="text-[9.5px] font-black text-slate-500/80 uppercase mt-1 whitespace-nowrap tracking-widest">
                                            {node.subLabel}
                                        </div>
                                    </div>
                                </foreignObject>
                            );
                        })}
                    </svg>
                </div>
            </div>
        );
    };



    const handleAILuanGiai = () => {
        if (!user) {
            if (onRequireLogin) onRequireLogin();
            return;
        }
        
        if (!data.recordId) {
            alert("Lỗi: Lá số này chưa được lưu vào hệ thống, không thể luận giải.");
            return;
        }

        setShowConfirmModal(true);
    };

    const triggerLuanGiai = async () => {
        setShowConfirmModal(false);
        setIsInterpreting(true);
        setError('');
        setInterpretation('');

        const abortCtrl = new AbortController();
        setAbortController(abortCtrl);

        let currentText = "";
        try {
            const url = getInterpretationStreamUrl('bazi', data.recordId);
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ userId: user?.id || user?._id || 'guest' }),
                signal: abortCtrl.signal
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Lỗi kết nối từ server (HTTP ${response.status})`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    const chunk = decoder.decode(value, { stream: !done });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed.startsWith('data: ')) {
                            const dataStr = trimmed.slice(6);
                            if (dataStr === '[DONE]') {
                                done = true;
                                break;
                            }
                            try {
                                const parsed = JSON.parse(dataStr);
                                if (parsed.error) {
                                    throw new Error(parsed.error);
                                }
                                if (parsed.chunk) {
                                    const isFirstChunk = !currentText;
                                    currentText += parsed.chunk;
                                    setInterpretation(currentText);
                                    if (isFirstChunk) {
                                        setTimeout(() => {
                                            const element = document.getElementById('interpretation-section');
                                            element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }, 100);
                                    }
                                }
                            } catch (e) {
                                if (e.message.includes('SAFETY') || e.message.includes('luận giải') || e.message.includes('quá tải')) {
                                    throw e;
                                }
                            }
                        }
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log("Interpretation stream aborted.");
            } else {
                console.error(err);
                setError(err.message || "Hệ thống luận giải đang bận hoặc gặp lỗi. Vui lòng thử lại sau.");
            }
        } finally {
            setIsInterpreting(false);
            setAbortController(null);

            if (currentText && onUpdateData) {
                onUpdateData({
                    ...data,
                    aiInterpretation: {
                        ...data.aiInterpretation,
                        content: currentText
                    }
                });

                // Decrement credit locally for non-admin accounts
                if (user && user.role !== 'admin' && user.role !== 'co-admin') {
                    setUser(prev => {
                        if (!prev) return prev;
                        const updated = { ...prev, credits: Math.max(0, prev.credits - 1) };
                        localStorage.setItem('user', JSON.stringify(updated));
                        return updated;
                    });
                }
            }
        }
    };

    return (
        <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 max-w-[1240px] mx-auto my-4 md:my-10 font-sans pb-10">
            
            <div className="bg-slate-50/50 p-4 md:p-5 relative overflow-hidden border-b border-gray-200/60">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 max-w-4xl">
                    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-6 gap-y-1 text-sm sm:text-base pl-2">
                        {(data.name || data.inputInfo?.name) && (
                            <>
                                <div className="font-extrabold text-slate-800">Họ và tên:</div>
                                <div className="font-bold text-blue-800">{data.name || data.inputInfo?.name}</div>
                            </>
                        )}
                        <div className="font-extrabold text-slate-800">Giới tính:</div>
                        <div className="font-bold text-slate-800">
                            {parseInt(data.gender) === 0 ? 'Nữ' : 'Nam'}
                        </div>
                        
                        <div className="font-extrabold text-slate-800">Dương / Âm lịch:</div>
                        <div className="font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                            <span className="text-blue-750 font-extrabold">{data.solarTimeline}</span>
                            <span className="text-slate-400 font-normal"> - </span>
                            <span className="text-emerald-700 font-extrabold">{cleanLunarDate(data.lunarDateStr)}</span>
                            {data.tietKhiName && (
                                <>
                                    <span className="text-slate-400 font-normal"> - </span>
                                    <span className="text-amber-800 font-extrabold">
                                        {data.tietKhiName.startsWith('Tiết') ? data.tietKhiName : `Tiết ${data.tietKhiName}`}
                                    </span>
                                </>
                            )}
                        </div>

                        {data.taiNguyen && (
                            <>
                                <div className="font-extrabold text-slate-800">
                                    <Tooltip term="Thai Nguyên">Thai Nguyên:</Tooltip>
                                </div>
                                <div className="font-bold text-slate-800 flex flex-wrap items-center gap-3">
                                    <Tooltip term={data.taiNguyen.naYin} unstyled={true}>
                                        <span className={`text-[13px] font-bold cursor-help hover:text-blue-750 transition-colors ${getNaYinTextColorClass(data.taiNguyen.naYin)}`}>{data.taiNguyen.naYin}</span>
                                    </Tooltip>
                                </div>
                            </>
                        )}

                        {data.cungMenh && (
                            <>
                                <div className="font-extrabold text-slate-800">
                                    <Tooltip term="Cung Mệnh">Cung Mệnh:</Tooltip>
                                </div>
                                <div className="font-bold text-slate-800 flex flex-wrap items-center gap-3">
                                    <Tooltip term={data.cungMenh.naYin} unstyled={true}>
                                        <span className={`text-[13px] font-bold cursor-help hover:text-blue-750 transition-colors ${getNaYinTextColorClass(data.cungMenh.naYin)}`}>{data.cungMenh.naYin}</span>
                                    </Tooltip>
                                </div>
                            </>
                        )}

                        {data.menhQuai && (
                            <>
                                <div className="font-extrabold text-slate-800">
                                    <Tooltip term="Mệnh Quái">Mệnh Quái:</Tooltip>
                                </div>
                                <div className="font-bold flex items-center gap-3">
                                    {(() => {
                                        const quai = data.menhQuai;
                                        const elemColor = {
                                            'Thủy': 'text-blue-700 bg-blue-50 border-blue-200/50',
                                            'Thổ': 'text-amber-800 bg-amber-50 border-amber-200/50',
                                            'Mộc': 'text-emerald-700 bg-emerald-50 border-emerald-250/30',
                                            'Hỏa': 'text-red-700 bg-red-50 border-red-200/40',
                                            'Kim': 'text-slate-700 bg-slate-100 border-slate-350'
                                        }[quai.element] || 'text-slate-700';

                                        return (
                                            <>
                                                <Tooltip term={`Cung ${quai.cung}`} unstyled={true}>
                                                    <span className={`px-2.5 py-0.5 rounded-full border text-xs sm:text-[13px] font-extrabold hover:brightness-95 transition-all ${elemColor}`}>
                                                        Cung {quai.cung} {quai.element}
                                                    </span>
                                                </Tooltip>
                                                <Tooltip term="Mệnh Quái" unstyled={true}>
                                                    <span className="text-red-605 font-extrabold text-xs sm:text-[13px] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-100 hover:bg-red-100 transition-colors">
                                                        {quai.group}
                                                    </span>
                                                </Tooltip>
                                            </>
                                        );
                                    })()}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-12 space-y-8 md:space-y-12">
                
                {/* Tứ Trụ */}
                <div>
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4 mb-6 uppercase flex items-center justify-between flex-wrap gap-4">
                        <span>Cấu Trúc Tứ Trụ (Mệnh Cục)</span>
                        {data.lunarYear && (
                            <span className="text-xs font-semibold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-100 italic normal-case">
                                * Lưu ý: Trụ Năm Bát Tự đổi tại Lập Xuân. Năm sinh Âm lịch của bạn là năm {data.lunarYear.replace(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?=[A-Z])/g, '$1 ')}.
                            </span>
                        )}
                    </h3>
                    <div className="flex flex-row-reverse justify-center gap-1.5 md:gap-4 lg:gap-6 w-full flex-wrap md:flex-nowrap">
                        {data.cungMenh && <Pillar title="Cung Mệnh" pillarData={data.cungMenh} />}
                        {data.taiNguyen && <Pillar title="Thai Nguyên" pillarData={data.taiNguyen} />}
                        <Pillar title="Giờ Sinh" pillarData={canChi.hour} />
                        <Pillar title="Nhật Chủ" pillarData={canChi.day} isDayMaster={true} />
                        <Pillar title="Nguyệt Lệnh" pillarData={canChi.month} />
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
                                <div key={idx} className={`flex-shrink-0 flex flex-col items-center p-3.5 rounded-xl border-2 min-w-[95px] transition-all hover:scale-105 shadow-sm ${getBgColorClass(yunElem)}`}>
                                    <div className="text-xs font-black text-slate-700/80 mb-1">{yun.startAge} Tuổi</div>
                                    <Tooltip term={yun.gan} unstyled={true}>
                                        <div className={`text-2xl font-black hover:scale-110 transition-transform ${getColorClass(yunElem)}`}>{yun.gan}</div>
                                    </Tooltip>
                                    <Tooltip term={yun.zhi} unstyled={true}>
                                        <div className={`text-2xl font-black mb-1.5 hover:scale-110 transition-transform ${getColorClass(branchElements[yun.zhi])}`}>{yun.zhi}</div>
                                    </Tooltip>
                                    <div className="text-[10px] font-bold text-gray-400 mt-auto">{yun.startYear}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                )}

                {/* Ngũ Hành & Cách Cục Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Ngũ Hành Diagram (Left Column) */}
                    <div className="lg:col-span-6 w-full flex flex-col">
                        <h3 className="text-xl font-bold text-gray-800 border-l-4 border-cyan-500 pl-4 mb-6 uppercase">Đánh Giá Ngũ Hành</h3>
                        <FiveElementsDiagram scores={nguHanh} />
                    </div>
                    
                    {/* Phân Tích Cách Cục (Right Column) */}
                    <div className="lg:col-span-6 w-full flex flex-col justify-between">
                        <div className="h-full flex flex-col">
                            <h3 className="text-xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4 mb-6 uppercase">Phân Tích Cách Cục</h3>
                            <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex-1 flex flex-col justify-center space-y-4">
                                {analysis.cachCuc && (
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <span className="font-bold text-gray-600 text-sm sm:text-base">
                                            <Tooltip term="Cách Cục">Cách Cục Lá Số</Tooltip>
                                        </span>
                                        <Tooltip term="Cách Cục" unstyled={true}>
                                            <span className="text-base sm:text-lg font-bold text-blue-755 cursor-help hover:text-blue-900 transition-colors">{analysis.cachCuc}</span>
                                        </Tooltip>
                                    </div>
                                )}

                                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <span className="font-bold text-gray-600 text-sm sm:text-base">
                                        <Tooltip term="Trạng Thái Nhật Chủ">Trạng Thái Nhật Chủ</Tooltip>
                                    </span>
                                    <Tooltip term="Trạng Thái Nhật Chủ" unstyled={true}>
                                        <span className="text-lg sm:text-xl font-black text-rose-600 cursor-help hover:scale-105 transition-transform">{formatThan(analysis.than)}</span>
                                    </Tooltip>
                                </div>

                                {analysis.than === 'tong_cach' && (
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <span className="font-bold text-gray-600 text-sm sm:text-base">Loại Tòng Cách</span>
                                        <span className="text-base sm:text-lg font-bold text-purple-700">{analysis.tongCachType}</span>
                                    </div>
                                )}

                                <div className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 ${getBgColorClass(dungThan).replace('bg-', 'border-l-').replace(/border-\w+-200/, '')}`}>
                                    <span className="font-bold text-gray-650 text-sm sm:text-base">
                                        <Tooltip term="Dụng Thần">Dụng Thần (Khuyên Dùng)</Tooltip>
                                    </span>
                                    <Tooltip term={formatElement(dungThan)} unstyled={true}>
                                        <span className={`text-lg sm:text-xl font-black uppercase tracking-widest cursor-help hover:scale-105 transition-transform ${getColorClass(dungThan)}`}>{formatElement(dungThan)}</span>
                                    </Tooltip>
                                </div>

                                <div className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 ${getBgColorClass(hyThan).replace('bg-', 'border-l-').replace(/border-\w+-200/, '')}`}>
                                    <span className="font-bold text-gray-650 text-sm sm:text-base">
                                        <Tooltip term="Hỷ Thần">Hỷ Thần (Phụ Trợ)</Tooltip>
                                    </span>
                                    <Tooltip term={formatElement(hyThan)} unstyled={true}>
                                        <span className={`text-lg sm:text-xl font-black uppercase tracking-widest cursor-help hover:scale-105 transition-transform ${getColorClass(hyThan)}`}>{formatElement(hyThan)}</span>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Lời Khuyên Cải Vận & Hóa Giải */}
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
                            {Object.entries(analysis.relations).map(([relType, arr]) => {
                                if (!arr || arr.length === 0) return null;
                                
                                const typeMap = {
                                    tamHop: 'Tam Hợp Cục', banTamHop: 'Bán Tam Hợp',
                                    lucHop: 'Lục Hợp', lucXung: 'Lục Xung',
                                    lucHai: 'Lục Hại', lucPha: 'Tương Phá'
                                };
                                const isBad = ['lucXung', 'lucHai', 'lucPha'].includes(relType);

                                return (
                                    <div key={relType} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                        <span className="font-bold text-gray-700 text-sm sm:text-base">{typeMap[relType] || relType}</span>
                                        <div className="flex flex-wrap gap-1.5 justify-start sm:justify-end">
                                            {arr.map((item, i) => (
                                                <span key={i} className={`px-2.5 py-1 font-bold text-xs sm:text-sm rounded ${isBad ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
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

                {interpretation && (
                    <div id="interpretation-section" className="w-full mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6 ml-1">
                            <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center shadow-md">
                                <BookOpen className="text-white" size={16} />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Thầy Luận Giải Chi Tiết</h3>
                        </div>
                        <SectionRenderer sections={parseMarkdownSections(interpretation, 'bazi')} theme="bazi" />

                        {/* ĐÁNH GIÁ PHẢN HỒI */}
                        {(!data?.rating || justRated) && (
                            <div className="mt-12 bg-white/60 border border-blue-100 p-6 rounded-3xl backdrop-blur-md max-w-xl mx-auto shadow-md">
                                <h4 className="font-extrabold text-slate-800 text-center mb-2">Đánh Giá Luận Giải Thầy Bát Tự</h4>
                                <p className="text-center text-xs text-slate-400 mb-6">Nhận xét của bạn sẽ giúp bổ sung tri thức và cải thiện chất lượng của AI tốt hơn.</p>

                                {justRated ? (
                                    <div className="text-center py-4 text-blue-600 font-bold animate-in zoom-in-95">
                                        Xin chân thành cảm ơn ý kiến đánh giá của bạn!
                                    </div>
                                ) : (
                                    <form onSubmit={handleRatingSubmit} className="space-y-4">
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className="transition-transform duration-100 active:scale-95"
                                            >
                                                <Star
                                                    size={28}
                                                    className={`stroke-2 cursor-pointer ${
                                                        star <= rating ? 'fill-amber-400 stroke-amber-500' : 'text-slate-200 hover:text-amber-300'
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        placeholder="Ý kiến nhận xét hoặc lưu ý thực tế của bạn..."
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all font-bold placeholder:text-slate-300 focus:outline-none"
                                        rows={2}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!rating}
                                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl shadow-md disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-[0.98]"
                                    >
                                        Gửi Nhận Xét
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            )}

                {error && (
                    <div className="w-full mt-4 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <p className="text-red-800 font-medium">{error}</p>
                    </div>
                )}
            </div>

            {/* FLOATING ACTION BUTTON */}
            {!interpretation ? (
                <button
                    onClick={handleAILuanGiai}
                    disabled={isInterpreting}
                    className={`fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 font-bold border ${isInterpreting ? 'bg-blue-100 border-blue-200 text-blue-500 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-blue-800 to-slate-900 hover:from-blue-900 hover:to-stone-900 text-white border-blue-700 hover:scale-105 hover:shadow-blue-900/40'}`}
                >
                    {isInterpreting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">{loadingTexts[loadingStep]}</span>
                        </>
                    ) : (
                        <>
                            <ScrollText className="animate-pulse" size={20} />
                            <span className="hidden sm:inline">Thầy Luận Giải</span>
                        </>
                    )}
                </button>
            ) : !isChatOpen && user && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2 px-6 py-3.5 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-blue-800 to-cyan-950 hover:from-blue-900 hover:to-stone-900 text-white border-blue-700 hover:scale-105 hover:shadow-blue-900/40 uppercase text-xs tracking-wider animate-pulse"
                >
                    <MessageCircle className="animate-bounce shrink-0" size={18} />
                    <span>Hỏi Thêm Thầy</span>
                </button>
            )}

            {interpretation && data?.recordId && user && (
                <AiChatWidget 
                    type="bazi" 
                    recordId={data.recordId} 
                    userId={user?.id || user?._id} 
                    isOpen={isChatOpen}
                    setIsOpen={setIsChatOpen}
                />
            )}

            {/* FLOATING SCROLL BUTTONS */}
            <div className="fixed bottom-4 md:bottom-8 left-4 md:left-8 z-40 flex flex-col gap-1 pointer-events-auto bg-transparent border-none shadow-none">
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent text-slate-400 hover:text-slate-700 active:scale-95 transition-all duration-300 shadow-none border-none pointer-events-auto"
                    title="Cuộn lên đầu trang"
                >
                    <ArrowUp size={24} />
                </button>
                <button
                    onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent text-slate-400 hover:text-slate-700 active:scale-95 transition-all duration-300 shadow-none border-none pointer-events-auto"
                    title="Cuộn xuống cuối trang"
                >
                    <ArrowDown size={24} />
                </button>
            </div>

            {/* CONFIRMATION MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex justify-center items-center p-4">
                    <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-8 border-t-blue-800">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-800 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <ScrollText className="text-blue-800" size={24} />
                            Thầy Luận Giải Bát Tự
                        </h3>
                        {(() => {
                            const isStaff = user?.role === 'admin' || user?.role === 'co-admin';
                            const hasCredits = isStaff || (user?.credits > 0);

                            if (isStaff) {
                                return (
                                    <>
                                        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                                            Tài khoản quản trị viên có quyền luận giải không giới hạn. Bạn có chắc chắn muốn khởi động luận giải chi tiết lá số Bát Tự của mình không?
                                        </p>
                                        <div className="flex justify-end gap-3">
                                            <button 
                                                onClick={() => setShowConfirmModal(false)}
                                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button 
                                                onClick={triggerLuanGiai}
                                                className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-bold text-sm shadow transition-colors"
                                            >
                                                Đồng ý
                                            </button>
                                        </div>
                                    </>
                                );
                            } else if (hasCredits) {
                                return (
                                    <>
                                        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                                            Bạn còn <span className="font-extrabold text-blue-850">{user?.credits}</span> lượt sử dụng. Mỗi lần luận giải AI sẽ tiêu thụ <span className="font-bold">1 credit</span>. Bạn có chắc chắn muốn khởi động luận giải chi tiết lá số Bát Tự của mình không?
                                        </p>
                                        <div className="flex justify-end gap-3">
                                            <button 
                                                onClick={() => setShowConfirmModal(false)}
                                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button 
                                                onClick={triggerLuanGiai}
                                                className="px-5 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg font-bold text-sm shadow transition-colors"
                                            >
                                                Đồng ý
                                            </button>
                                        </div>
                                    </>
                                );
                            } else {
                                return (
                                    <>
                                        <p className="text-red-750 bg-red-50 border border-red-100 p-3.5 rounded-xl mb-6 leading-relaxed text-xs sm:text-sm font-medium">
                                            ⚠️ Bạn đã hết lượt luận giải (0 credits). Mỗi ngày hệ thống sẽ tự động tặng bạn +1 credit. Hãy liên hệ Ban Quản Trị hoặc nâng cấp để tiếp tục luận giải Bát Tự chi tiết.
                                        </p>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => setShowConfirmModal(false)}
                                                className="px-5 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm transition-colors shadow"
                                            >
                                                Đóng
                                            </button>
                                        </div>
                                    </>
                                );
                            }
                        })()}
                    </div>
                </div>
            )}
            
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
