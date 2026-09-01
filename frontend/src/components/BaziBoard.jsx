import React, { useState, useEffect, useContext, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../context/AuthContext';
import { getInterpretationStreamUrl, rateBazi, togglePublicCalculation } from '../services/api';
import { AlertCircle, BookOpen, ScrollText, MessageCircle, ArrowDown, ArrowUp, Star } from 'lucide-react';
import AiChatWidget from './AiChatWidget';
import { parseMarkdownSections } from '../utils/markdownParser';
import SectionRenderer from './SectionRenderer';
import Tooltip from './Tooltip';
import FloatingNotificationToast from './FloatingNotificationToast';

import {
    stemElements,
    branchElements,
    getColorClass,
    getBgColorClass,
    formatThan,
    formatElement
} from '../utils/astrologyHelpers';

import {
    getSeasonColorClass,
    getRemedyData,
    renderCanChiSpans,
    getNaYinTextColorClass,
    cleanLunarDate,
    getNaYinColorClass,
    getAbbreviatedTruongSinh,
    getAbbreviatedThapThan,
    SHEN_SHA_COLORS
} from './bazi/baziConstants.jsx';

const BaziBoard = ({ data: rawData, onUpdateData, onRequireLogin, onInvalidateHistory }) => {
    const { user, setUser, token } = useContext(AuthContext);

    // Unwrap nested baziData / analysisSnapshot if passing full DB record object
    const data = React.useMemo(() => {
        if (!rawData) return null;
        const baziObj = rawData.baziData || rawData.analysisSnapshot || rawData.result || rawData;
        return {
            ...baziObj,
            _id: rawData._id || rawData.id || baziObj._id,
            recordId: rawData.recordId || rawData._id || rawData.id || baziObj.recordId,
            userId: rawData.userId || baziObj.userId,
            isPublic: rawData.isPublic !== undefined ? rawData.isPublic : baziObj.isPublic,
            name: rawData.inputInfo?.name || rawData.name || baziObj.name,
            gender: rawData.inputInfo?.gender !== undefined ? rawData.inputInfo.gender : (rawData.gender !== undefined ? rawData.gender : baziObj.gender),
            inputInfo: rawData.inputInfo || baziObj.inputInfo,
            aiInterpretation: rawData.aiInterpretation || baziObj.aiInterpretation,
            rating: rawData.rating !== undefined ? rawData.rating : baziObj.rating,
            feedback: rawData.feedback !== undefined ? rawData.feedback : baziObj.feedback
        };
    }, [rawData]);

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

    const [selectedYunIndex, setSelectedYunIndex] = useState(0);
    const [selectedLuuNianYear, setSelectedLuuNianYear] = useState(null);

    // Mouse drag-to-scroll & touchpad scroll for DaYun timeline
    const daYunScrollRef = useRef(null);
    const structureSectionRef = useRef(null);
    const [isDaYunDragging, setIsDaYunDragging] = useState(false);
    const [daYunStartX, setDaYunStartX] = useState(0);
    const [daYunScrollLeft, setDaYunScrollLeft] = useState(0);
    const [daYunHasDragged, setDaYunHasDragged] = useState(false);

    const handleDaYunMouseDown = (e) => {
        if (!daYunScrollRef.current) return;
        setIsDaYunDragging(true);
        setDaYunHasDragged(false);
        setDaYunStartX(e.pageX - daYunScrollRef.current.offsetLeft);
        setDaYunScrollLeft(daYunScrollRef.current.scrollLeft);
    };

    const handleDaYunMouseLeaveOrUp = () => {
        setIsDaYunDragging(false);
    };

    const handleDaYunMouseMove = (e) => {
        if (!isDaYunDragging || !daYunScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - daYunScrollRef.current.offsetLeft;
        const walk = (x - daYunStartX) * 1.8;
        if (Math.abs(walk) > 5) {
            setDaYunHasDragged(true);
        }
        daYunScrollRef.current.scrollLeft = daYunScrollLeft - walk;
    };

    const handleDaYunWheel = (e) => {
        if (!daYunScrollRef.current) return;
        if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
            daYunScrollRef.current.scrollLeft += e.deltaY * 0.8;
        }
    };

    // Tự động chọn Đại Vận và Lưu Niên phù hợp với năm hiện tại (2026) khi dữ liệu Bát Tự thay đổi
    useEffect(() => {
        if (data?.daYun && data.daYun.length > 0) {
            const currentYear = new Date().getFullYear();
            const defaultYunIdx = data.daYun.findIndex(yun => currentYear >= yun.startYear && currentYear <= yun.startYear + 9);
            const activeIdx = defaultYunIdx !== -1 ? defaultYunIdx : 0;
            setSelectedYunIndex(activeIdx);
            
            const activeYun = data.daYun[activeIdx];
            if (activeYun && activeYun.liuNian && activeYun.liuNian.length > 0) {
                const hasCurrentYear = activeYun.liuNian.some(ln => ln.year === currentYear);
                setSelectedLuuNianYear(hasCurrentYear ? currentYear : activeYun.liuNian[0].year);
            }
        }
    }, [data?.daYun]);

    const handleSelectYun = (idx) => {
        setSelectedYunIndex(idx);
        const activeYun = data?.daYun?.[idx];
        if (activeYun && activeYun.liuNian && activeYun.liuNian.length > 0) {
            const currentYear = new Date().getFullYear();
            const hasCurrentYear = activeYun.liuNian.some(ln => ln.year === currentYear);
            setSelectedLuuNianYear(hasCurrentYear ? currentYear : activeYun.liuNian[0].year);
        }
    };

    const prevIdRef = useRef(null);

    // Set initial interpretation and rating if cached in data & auto scroll to structure section
    useEffect(() => {
        const currentId = data?.recordId || data?._id;
        if (currentId && currentId !== prevIdRef.current) {
            setJustRated(false);
            prevIdRef.current = currentId;
            
            // Auto-scroll to structure section on mobile & desktop
            setTimeout(() => {
                if (structureSectionRef.current) {
                    structureSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    const el = document.getElementById('bazi-structure-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 150);
        }
        if (data?.aiInterpretation && data.aiInterpretation.content) {
            setInterpretation(data.aiInterpretation.content);
        } else {
            setInterpretation('');
        }
        setRating(data?.rating || 0);
        setFeedback(data?.feedback || '');
    }, [data]);

    const [result, setResult] = useState(data);
    const [isPublicState, setIsPublicState] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    useEffect(() => {
        setResult(data);
    }, [data]);

    useEffect(() => {
        setIsPublicState(result?.isPublic || false);
    }, [result]);

    const handleTogglePublic = async () => {
        const resolvedId = result?.recordId || result?._id;
        if (!resolvedId) return;
        try {
            const newStatus = !isPublicState;
            await togglePublicCalculation('bazi', resolvedId, newStatus);
            setIsPublicState(newStatus);
            setToastMsg(`Đã ${newStatus ? 'bật' : 'tắt'} chia sẻ công khai lá số Bát Tự!`);
            if (onInvalidateHistory) onInvalidateHistory();
            setResult(prev => prev ? { ...prev, isPublic: newStatus } : null);
            if (onUpdateData) {
                onUpdateData({
                    ...result,
                    isPublic: newStatus
                });
            }
        } catch (err) {
            console.error('Lỗi khi đổi trạng thái công khai Bazi:', err);
            setToastMsg('Không thể thay đổi trạng thái chia sẻ. Vui lòng thử lại sau.');
        }
    };

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

    const { 
        canChi = { year: {}, month: {}, day: {}, hour: {} }, 
        lunarDateStr = '', 
        lunarYear = '', 
        nguHanh = {}, 
        analysis = {}, 
        dungThan = '', 
        hyThan = '', 
        daYun = [], 
        thapThanAnalysis = { groups: [] } 
    } = data;

    const effectiveDungThan = dungThan || data.dungThanInfo?.primary?.dungThan || analysis?.dungThan || data.dungThanInfo?.primary?.dungThan || '';
    const effectiveHyThan = hyThan || data.dungThanInfo?.primary?.hyThan || analysis?.hyThan || data.dungThanInfo?.primary?.hyThan || '';

    const remedyData = getRemedyData(effectiveDungThan);

    const getShenShaColorClass = (ss) => {
        if (!ss) return 'text-slate-800';
        if (SHEN_SHA_COLORS[ss]) return SHEN_SHA_COLORS[ss];

        const baseTerm = ss.split(' (')[0].trim();
        if (SHEN_SHA_COLORS[baseTerm]) return SHEN_SHA_COLORS[baseTerm];

        const lower = ss.toLowerCase();
        // Cát Thần (Xanh)
        if (lower.includes('lộc') || lower.includes('đức') || lower.includes('quý nhân') || lower.includes('ấn') || lower.includes('y') || lower.includes('hỷ') || lower.includes('xương') || lower.includes('đường') || lower.includes('quán') || lower.includes('dư') || lower.includes('tinh') || lower.includes('phúc')) {
            return 'text-emerald-600';
        }
        // Hung Sát (Đỏ)
        if (lower.includes('sát') || lower.includes('phù') || lower.includes('đại bại') || lower.includes('vong') || lower.includes('cô') || lower.includes('tú') || lower.includes('dương') || lower.includes('đà') || lower.includes('hao') || lower.includes('nhận') || lower.includes('kiến quan') || lower.includes('phế') || lower.includes('quỷ') || lower.includes('giác') || lower.includes('môn') || lower.includes('khách') || lower.includes('hổ')) {
            return 'text-rose-600';
        }

        return 'text-slate-800';
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

    const Pillar = ({ title, pillarData, isDayMaster, hideTruongSinh, hideNaYin, hideShenSha, isMainBazi, minShenShaLines = 4 }) => {
        if (!pillarData || !pillarData.gan || !pillarData.zhi) return null;
        const { gan, zhi, thapThanGan, tangCan = [], naYin, truongSinh, shenSha = [] } = pillarData;
        const ganElem = stemElements[gan];
        const zhiElem = branchElements[zhi];
        const showTruongSinh = truongSinh && !hideTruongSinh;
        const showNaYin = naYin && !hideNaYin;
        const isMainBaziPillar = isMainBazi;

        return (
            <div className={`relative flex flex-col items-center py-2.5 sm:py-4 md:py-5.5 rounded-xl shadow-sm border-2 ${isDayMaster ? 'border-amber-500 bg-amber-50/30 ring-4 ring-amber-100' : 'border-gray-200 bg-white'} flex-1 ${isMainBaziPillar ? 'md:min-w-[170px] md:max-w-[200px] px-3 sm:px-5 md:px-6 mx-1 sm:mx-1.5' : 'md:min-w-[15%] md:max-w-[20%] px-1.5 sm:px-3 md:px-4'} self-stretch`}>
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
                
                {/* Địa chi và Vòng Trường sinh hiển thị ngang hàng (Trường sinh xoay 90 độ ngược kim đồng hồ absolute bên trái Địa chi) */}
                <div className="flex items-center justify-center relative w-full select-none">
                    {showTruongSinh && (
                        <div className={`absolute ${isMainBaziPillar ? '-left-3 sm:-left-4 md:-left-5' : '-left-1 sm:-left-2.5 md:-left-3.5'} top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-8 select-none`}>
                            <Tooltip term={truongSinh} unstyled={true}>
                                <span className="text-[10px] sm:text-[11.5px] font-black text-slate-700 cursor-help hover:text-blue-750 transition-colors transform -rotate-90 origin-center inline-block whitespace-nowrap leading-none tracking-tighter">
                                    {getAbbreviatedTruongSinh(truongSinh)}
                                </span>
                            </Tooltip>
                        </div>
                    )}
                    <Tooltip term={zhi} unstyled={true}>
                        <div className={`text-2xl sm:text-4xl font-black mb-1 sm:mb-2 hover:scale-110 transition-transform ${getColorClass(zhiElem)}`}>{zhi}</div>
                    </Tooltip>
                </div>
                
                {showNaYin && (
                    <Tooltip term={naYin} unstyled={true}>
                        <div className={`text-[8px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border my-1 text-center max-w-full truncate hover:brightness-95 transition-all ${getNaYinColorClass(naYin)}`}>
                            {naYin}
                        </div>
                    </Tooltip>
                )}
                
                {/* Container Tàng Can & Thần Sát tự căn đáy */}
                <div className="w-full border-t border-dashed border-gray-200 mt-4 pt-2 flex flex-col items-center justify-center">
                    <div className="w-full max-w-[130px] sm:max-w-[150px] flex flex-col gap-1.5 mt-1">
                        {(() => {
                            const paddedTangCan = [...tangCan];
                            while (paddedTangCan.length < 3) {
                                paddedTangCan.push({ gan: '', thapThan: '' });
                            }
                            return paddedTangCan.map((tc, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[11px] sm:text-[13px] leading-tight w-full h-[16px] sm:h-[18px]">
                                    {tc.gan ? (
                                        <>
                                            <Tooltip term={tc.gan} unstyled={true}>
                                                <span className={`font-bold shrink-0 text-left hover:scale-110 transition-transform ${getColorClass(stemElements[tc.gan])}`}>{tc.gan}</span>
                                            </Tooltip>
                                            <Tooltip term={tc.thapThan} unstyled={true}>
                                                <span className="text-slate-800 font-bold text-right truncate pl-1 hover:text-blue-700 transition-colors">{getAbbreviatedThapThan(tc.thapThan)}</span>
                                            </Tooltip>
                                        </>
                                    ) : (
                                        <span className="invisible">&nbsp;</span>
                                    )}
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Thần Sát Bát Tự - Padded đủ số dòng để chiều cao luôn luôn bằng nhau 100% */}
                {!hideShenSha && (
                    <div className="w-full border-t border-dashed border-gray-200 mt-2 pt-2 flex flex-col items-center justify-center">
                        <div className="w-full max-w-[130px] sm:max-w-[150px] flex flex-col gap-1.5 mt-1">
                            {(() => {
                                const paddedShenSha = [...shenSha];
                                while (paddedShenSha.length < minShenShaLines) {
                                    paddedShenSha.push('');
                                }
                                return paddedShenSha.map((ss, idx) => {
                                    if (!ss) {
                                        return (
                                            <div key={idx} className="flex justify-center items-center text-[10.5px] sm:text-[12.5px] leading-normal w-full min-h-[18px] py-0.5 select-none">
                                                <span className="invisible">&nbsp;</span>
                                            </div>
                                        );
                                    }
                                    const baseTerm = ss.split(' (')[0].replace(/ Quý Nhân/g, '').trim();
                                    const displayName = ss.replace(/ Quý Nhân/g, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
                                    const colorClass = getShenShaColorClass(ss);
                                    return (
                                        <div key={idx} className="flex justify-center items-center text-[10.5px] sm:text-[12.5px] leading-normal w-full font-black min-h-[18px] py-0.5 text-center">
                                            <Tooltip term={baseTerm} unstyled={true}>
                                                <span className={`${colorClass} hover:scale-105 transition-transform cursor-help inline-block leading-tight whitespace-nowrap`}>
                                                    {displayName}
                                                </span>
                                            </Tooltip>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                )}
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
                
                <div className="relative z-10 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1.2fr] gap-6">
                        {/* Cột trái: Thông tin lá số */}
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
                            </div>
                            
                            <div className="font-extrabold text-slate-800">Tiết khí:</div>
                            <div className="font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                                {data.tietKhiName && (
                                    <Tooltip term={data.tietKhiName} unstyled={true}>
                                        <span className={`font-extrabold hover:underline transition-all ${getSeasonColorClass(data.tietKhiName)}`}>
                                            {data.tietKhiName.startsWith('Tiết') ? data.tietKhiName : `Tiết ${data.tietKhiName}`}
                                        </span>
                                    </Tooltip>
                                )}
                                {data.tuLenhCan && (
                                    <>
                                        <span className="text-slate-400 font-normal"> - Ngày </span>
                                        <span className={`font-black ${getColorClass(stemElements[data.tuLenhCan])}`}>
                                            {data.tuLenhCan}
                                        </span>
                                        <span className="text-slate-800 font-bold"> vượng</span>
                                    </>
                                )}
                            </div>

                            {data.taiNguyen && (
                                <>
                                    <div className="text-sm sm:text-[15px] font-extrabold text-slate-800">
                                        <Tooltip term="Thai Nguyên">Thai Nguyên:</Tooltip>
                                    </div>
                                    <div className="text-sm sm:text-[15px] font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                                        <span className={`font-black ${getColorClass(stemElements[data.taiNguyen.gan])}`}>{data.taiNguyen.gan}</span>
                                        <span className={`font-black ${getColorClass(branchElements[data.taiNguyen.zhi])}`}>{data.taiNguyen.zhi}</span>
                                        <span className="text-slate-400 font-normal">-</span>
                                        <Tooltip term={data.taiNguyen.naYin} unstyled={true}>
                                            <span className={`font-bold cursor-help hover:text-blue-750 transition-colors ${getNaYinTextColorClass(data.taiNguyen.naYin)}`}>{data.taiNguyen.naYin}</span>
                                        </Tooltip>
                                    </div>
                                </>
                            )}

                            {data.cungMenh && (
                                <>
                                    <div className="text-sm sm:text-[15px] font-extrabold text-slate-800">
                                        <Tooltip term="Cung Mệnh">Cung Mệnh:</Tooltip>
                                    </div>
                                    <div className="text-sm sm:text-[15px] font-bold text-slate-800 flex flex-wrap items-center gap-1.5">
                                        <span className={`font-black ${getColorClass(stemElements[data.cungMenh.gan])}`}>{data.cungMenh.gan}</span>
                                        <span className={`font-black ${getColorClass(branchElements[data.cungMenh.zhi])}`}>{data.cungMenh.zhi}</span>
                                        <span className="text-slate-400 font-normal">-</span>
                                        <Tooltip term={data.cungMenh.naYin} unstyled={true}>
                                            <span className={`font-bold cursor-help hover:text-blue-750 transition-colors ${getNaYinTextColorClass(data.cungMenh.naYin)}`}>{data.cungMenh.naYin}</span>
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

                        {/* Cột phải: Toggle Share */}
                        {(!window.location.pathname.includes('/record/') || (user && (result?.userId === user.id || result?.userId === user._id))) && (
                            <div className="flex flex-col justify-start md:border-l md:border-slate-200/60 md:pl-6 space-y-3 pt-4 md:pt-0">
                                <div className="flex flex-col">
                                    <span className="text-sm font-extrabold text-slate-800">Chia sẻ công khai lá số</span>
                                    <span className="text-[11px] text-slate-400 font-bold leading-relaxed">Bật công khai để cho phép người khác xem lá số này qua liên kết chia sẻ</span>
                                </div>
                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleTogglePublic}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPublicState ? 'bg-emerald-600' : 'bg-gray-300'}`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublicState ? 'translate-x-5' : 'translate-x-0'}`}
                                        />
                                    </button>
                                    {isPublicState && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const shareUrl = `${window.location.origin}/bazi/record/${data.recordId || data._id}`;
                                                navigator.clipboard.writeText(shareUrl);
                                                setToastMsg('Đã sao chép liên kết chia sẻ công khai Bát Tự!');
                                            }}
                                            className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                        >
                                            Sao chép liên kết
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-12 space-y-8 md:space-y-12">
                
                {/* Tứ Trụ */}
                <div id="bazi-structure-section" ref={structureSectionRef} className="scroll-mt-24">
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4 mb-6 uppercase flex items-center justify-between flex-wrap gap-4">
                        <span>Cấu Trúc Tứ Trụ (Mệnh Cục)</span>
                        {data.lunarYear && (
                            <span className="text-xs font-semibold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-100 italic normal-case">
                                * Lưu ý: Trụ Năm Bát Tự đổi tại Lập Xuân. Năm sinh Âm lịch của bạn là năm {data.lunarYear.replace(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?=[A-Z])/g, '$1 ')}.
                            </span>
                        )}
                    </h3>
                    {(() => {
                        const maxBaziShenSha = Math.max(
                            canChi.year?.shenSha?.length || 0,
                            canChi.month?.shenSha?.length || 0,
                            canChi.day?.shenSha?.length || 0,
                            canChi.hour?.shenSha?.length || 0,
                            3
                        );
                        return (
                            <>
                                {/* Desktop layout: horizontal flex row (4 pillars, wide gap, equal height) */}
                                <div className="hidden md:flex flex-row-reverse justify-center items-stretch gap-6 lg:gap-8 w-full flex-nowrap">
                                    <Pillar title="Giờ Sinh" pillarData={canChi.hour} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                                    <Pillar title="Nhật Chủ" pillarData={canChi.day} isDayMaster={true} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                                    <Pillar title="Nguyệt Lệnh" pillarData={canChi.month} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                                    <Pillar title="Năm Sinh" pillarData={canChi.year} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                                </div>

                                {/* Mobile layout: 2 rows x 2 columns (spacious, equal height) */}
                                <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:hidden w-full items-stretch">
                                    <Pillar title="Giờ Sinh" pillarData={canChi.hour} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                                    <Pillar title="Nhật Chủ" pillarData={canChi.day} isDayMaster={true} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                                    <Pillar title="Nguyệt Lệnh" pillarData={canChi.month} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                                    <Pillar title="Năm Sinh" pillarData={canChi.year} isMainBazi={true} minShenShaLines={maxBaziShenSha} />
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Nhịp Đại Vận & Lưu Niên */}
                {daYun && daYun.length > 0 && (
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 border-l-4 border-purple-500 pl-4 mb-6 uppercase">Hành Trình Đại Vận (10 Năm)</h3>
                        <div 
                            ref={daYunScrollRef}
                            onMouseDown={handleDaYunMouseDown}
                            onMouseLeave={handleDaYunMouseLeaveOrUp}
                            onMouseUp={handleDaYunMouseLeaveOrUp}
                            onMouseMove={handleDaYunMouseMove}
                            onWheel={handleDaYunWheel}
                            className="flex overflow-x-auto p-3 -m-3 gap-3 hide-scrollbar select-none cursor-grab active:cursor-grabbing"
                        >
                            {daYun.map((yun, idx) => {
                                const yunElem = stemElements[yun.gan];
                                const isSelected = selectedYunIndex === idx;
                                return (
                                    <div 
                                        key={idx} 
                                        onClick={() => {
                                            if (daYunHasDragged) return;
                                            handleSelectYun(idx);
                                        }}
                                        className={`flex-shrink-0 flex flex-col items-center p-3.5 rounded-xl border-2 min-w-[115px] transition-all hover:scale-105 shadow-sm cursor-pointer ${
                                            isSelected 
                                                ? 'border-purple-600 bg-purple-50/55 ring-4 ring-purple-100 scale-105' 
                                                : `${getBgColorClass(yunElem)} border-gray-250 bg-white`
                                        }`}
                                    >
                                        <div className="text-xs font-black text-slate-700/80 mb-0.5">{yun.startAge} Tuổi</div>
                                        <div className="text-[9px] font-bold text-gray-400 mb-1">{yun.startYear}</div>
                                        
                                        {/* Horizontal dashed divider line */}
                                        <div className="w-full border-t border-dashed border-gray-200 my-1"></div>
                                        
                                        {/* Thập Thần của Thiên Can */}
                                        <div className="text-[9px] sm:text-xs font-bold text-gray-400 h-4 flex items-center justify-center">
                                            <Tooltip term={yun.thapThanGan} unstyled={true}>
                                                <span className="cursor-help hover:text-blue-700 transition-colors">{getAbbreviatedThapThan(yun.thapThanGan)}</span>
                                            </Tooltip>
                                        </div>
                                        
                                        {/* Thiên Can & Địa Chi */}
                                        <Tooltip term={yun.gan} unstyled={true}>
                                            <div className={`text-2xl font-black hover:scale-110 transition-transform ${getColorClass(yunElem)}`}>{yun.gan}</div>
                                        </Tooltip>
                                        <Tooltip term={yun.zhi} unstyled={true}>
                                            <div className={`text-2xl font-black mb-1 hover:scale-110 transition-transform ${getColorClass(branchElements[yun.zhi])}`}>{yun.zhi}</div>
                                        </Tooltip>

                                        {/* Nạp Âm của Đại Vận */}
                                        {yun.naYin && (
                                            <Tooltip term={yun.naYin} unstyled={true}>
                                                <div className={`text-[8px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border my-1 text-center max-w-full truncate hover:brightness-95 transition-all ${getNaYinColorClass(yun.naYin)}`}>
                                                    {yun.naYin}
                                                </div>
                                            </Tooltip>
                                        )}
                                        
                                        {/* Tàng can & Thập thần */}
                                        <div className="w-full border-t border-dashed border-gray-200 mt-1.5 pt-1.5 flex flex-col items-center justify-center">
                                            <div className="w-full flex flex-col gap-0.5 mt-0.5">
                                                {(() => {
                                                    const paddedTangCan = [...(yun.tangCan || [])];
                                                    while (paddedTangCan.length < 3) {
                                                        paddedTangCan.push({ gan: '', thapThan: '' });
                                                    }
                                                    return paddedTangCan.map((tc, tcIdx) => (
                                                        <div key={tcIdx} className="flex justify-between items-center text-[10px] leading-tight w-full gap-1 h-[14px]">
                                                            {tc.gan ? (
                                                                <>
                                                                    <Tooltip term={tc.gan} unstyled={true}>
                                                                        <span className={`font-bold shrink-0 text-left hover:scale-110 transition-transform ${getColorClass(stemElements[tc.gan])}`}>{tc.gan}</span>
                                                                    </Tooltip>
                                                                    <Tooltip term={tc.thapThan} unstyled={true}>
                                                                        <span className="text-slate-800 font-bold text-right truncate pl-1 hover:text-blue-700 transition-colors text-[9px]">{getAbbreviatedThapThan(tc.thapThan)}</span>
                                                                    </Tooltip>
                                                                </>
                                                            ) : (
                                                                <span className="invisible">&nbsp;</span>
                                                            )}
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Hàng chọn năm Lưu Niên */}
                    {daYun[selectedYunIndex] && daYun[selectedYunIndex].liuNian && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                            <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2 text-center sm:text-left">Chọn năm Lưu Niên để đối chiếu:</span>
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                {daYun[selectedYunIndex].liuNian.map((ln) => {
                                    const isYearSelected = selectedLuuNianYear === ln.year;
                                    return (
                                        <button
                                            key={ln.year}
                                            onClick={() => setSelectedLuuNianYear(ln.year)}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                isYearSelected
                                                    ? 'bg-purple-600 text-white shadow-sm scale-105'
                                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                            }`}
                                        >
                                            {ln.year} ( {ln.age} tuổi )
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Biểu đồ đối chiếu 6 cột */}
                    {(() => {
                        const activeLuuNianPillar = daYun[selectedYunIndex]?.liuNian?.find(ln => ln.year === selectedLuuNianYear);
                        if (!activeLuuNianPillar) return null;

                        const maxStaticStars = Math.max(
                            canChi.hour?.shenSha?.length || 0,
                            canChi.day?.shenSha?.length || 0,
                            canChi.month?.shenSha?.length || 0,
                            canChi.year?.shenSha?.length || 0,
                            1
                        );

                        const maxDynamicStars = Math.max(
                            activeLuuNianPillar.annualShenSha?.hour?.length || 0,
                            activeLuuNianPillar.annualShenSha?.day?.length || 0,
                            activeLuuNianPillar.annualShenSha?.month?.length || 0,
                            activeLuuNianPillar.annualShenSha?.year?.length || 0,
                            1
                        );
                        
                        const mergedYear = canChi.year;
                        const mergedMonth = canChi.month;
                        const mergedDay = canChi.day;
                        const mergedHour = canChi.hour;

                        const maxVanhHanShenSha = Math.max(
                            daYun[selectedYunIndex]?.shenSha?.length || 0,
                            activeLuuNianPillar?.shenSha?.length || 0,
                            mergedYear?.shenSha?.length || 0,
                            mergedMonth?.shenSha?.length || 0,
                            mergedDay?.shenSha?.length || 0,
                            mergedHour?.shenSha?.length || 0,
                            3
                        );

                        return (
                            <div className="border border-purple-100 bg-purple-50/10 p-4 sm:p-6 rounded-[2rem] space-y-8">
                                <h4 className="text-base font-extrabold text-slate-800 uppercase flex items-center justify-between flex-wrap gap-4 border-b border-purple-100/50 pb-3">
                                    <span>Bảng Đối Chiếu Vận Hạn Năm {selectedLuuNianYear} ( {activeLuuNianPillar.gan} {activeLuuNianPillar.zhi} )</span>
                                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 normal-case">
                                        Đại Vận {daYun[selectedYunIndex].gan} {daYun[selectedYunIndex].zhi} ( {daYun[selectedYunIndex].startAge} - {daYun[selectedYunIndex].startAge + 9} Tuổi )
                                    </span>
                                </h4>

                                {/* Niên Vận Tinh & Niên Biểu Thần Sát */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                                    {/* Niên Vận Tinh (Cột Trái) */}
                                    <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="bg-emerald-800 text-white font-extrabold text-center py-2 px-4 rounded-xl text-xs sm:text-sm mb-4 uppercase tracking-wider">
                                                Niên Vận Tinh {selectedLuuNianYear}
                                            </div>
                                            <div className="flex flex-col divide-y divide-gray-100 text-xs sm:text-sm">
                                                {(activeLuuNianPillar.nienVanTinh || []).map((vt, idx) => (
                                                    <div key={idx} className="flex justify-between py-2 items-center">
                                                        <span className="font-bold text-gray-600">{vt.name}</span>
                                                        <span className="font-black text-xs sm:text-sm flex gap-1 items-center italic">
                                                            {vt.zhi.split(';').map((p, pIdx, arr) => {
                                                                const trimmed = p.trim();
                                                                const elem = branchElements[trimmed] || stemElements[trimmed];
                                                                const colorClass = elem ? getColorClass(elem) : 'text-slate-800';
                                                                return (
                                                                    <React.Fragment key={pIdx}>
                                                                        <span className={`${colorClass} hover:scale-110 transition-transform inline-block`}>
                                                                            {trimmed}
                                                                        </span>
                                                                        {pIdx < arr.length - 1 && <span className="text-gray-400 font-normal">;</span>}
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </span>
                                                    </div>
                                                ))}
                                                {(!activeLuuNianPillar.nienVanTinh || activeLuuNianPillar.nienVanTinh.length === 0) && (
                                                    <div className="text-center py-6 text-gray-400 italic">Không có niên vận tinh</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Niên Biểu Thần Sát (Cột Phải) */}
                                    <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <div className="bg-emerald-800 text-white font-extrabold text-center py-2 px-4 rounded-xl text-xs sm:text-sm mb-4 uppercase tracking-wider">
                                                Niên Biểu Thần Sát {selectedLuuNianYear}
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-center divide-x divide-gray-150">
                                                {['hour', 'day', 'month', 'year'].map((key) => {
                                                    const titleMap = { hour: 'GIỜ', day: 'NGÀY', month: 'THÁNG', year: 'NĂM' };
                                                    const staticStars = canChi[key]?.shenSha || [];
                                                    const dynamicStars = activeLuuNianPillar.annualShenSha?.[key] || [];
                                                    return (
                                                        <div key={key} className="flex flex-col gap-2 min-h-[160px] px-1 sm:px-2">
                                                            <div className="font-extrabold text-gray-800 border-b border-gray-100 pb-2 text-[10px] sm:text-[13px] tracking-wider">
                                                                {titleMap[key]}
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 mt-2 justify-start items-center flex-1 w-full">
                                                                {staticStars.length > 0 || dynamicStars.length > 0 ? (
                                                                    <>
                                                                        {/* Thần Sát Gốc (Bên trên) */}
                                                                        <div 
                                                                            className="flex flex-col gap-1.5 items-center w-full"
                                                                            style={{ minHeight: `${maxStaticStars * 1.5}rem` }}
                                                                        >
                                                                            {staticStars.map((ss, idx) => {
                                                                                const colorClass = getShenShaColorClass(ss);
                                                                                const baseTerm = ss.split(' (')[0].replace(/ Quý Nhân/g, '').trim();
                                                                                const displayName = ss.replace(/ Quý Nhân/g, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
                                                                                return (
                                                                                    <Tooltip key={`static-${idx}`} term={baseTerm} unstyled={true}>
                                                                                        <span className={`${colorClass} font-black text-[9.5px] sm:text-[12.5px] leading-tight hover:scale-105 transition-transform cursor-help block text-center break-words max-w-full`}>
                                                                                            {displayName}
                                                                                        </span>
                                                                                    </Tooltip>
                                                                                );
                                                                            })}
                                                                        </div>

                                                                        {/* Gạch nét đứt phân chia */}
                                                                        <div className="w-full border-t border-dashed border-slate-300 my-2" />

                                                                        {/* Thần Sát Thái Tuế (Bên dưới) */}
                                                                        <div 
                                                                            className="flex flex-col gap-1.5 items-center w-full"
                                                                            style={{ minHeight: `${maxDynamicStars * 1.5}rem` }}
                                                                        >
                                                                            {dynamicStars.map((ss, idx) => {
                                                                                const colorClass = getShenShaColorClass(ss);
                                                                                const baseTerm = ss.split(' (')[0].replace(/ Quý Nhân/g, '').trim();
                                                                                const displayName = ss.replace(/ Quý Nhân/g, '').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')');
                                                                                return (
                                                                                    <Tooltip key={`dynamic-${idx}`} term={baseTerm} unstyled={true}>
                                                                                        <span className={`${colorClass} font-black text-[9.5px] sm:text-[12.5px] leading-tight hover:scale-105 transition-transform cursor-help block text-center break-words max-w-full`}>
                                                                                            {displayName}
                                                                                        </span>
                                                                                    </Tooltip>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-gray-300 text-[10px] sm:text-xs italic select-none my-auto">Không có</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Đối Chiếu Trụ Vận Hạn (Tổng Hợp)</div>
                                    
                                    {/* Layout Desktop: 6 cột xếp ngang đồng đều chiều cao (items-stretch) */}
                                    <div className="hidden md:flex flex-row justify-center items-stretch gap-2 lg:gap-4 w-full flex-nowrap">
                                        <Pillar title="Đại Vận" pillarData={daYun[selectedYunIndex]} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title={`Lưu Niên ${selectedLuuNianYear}`} pillarData={activeLuuNianPillar} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title="Trụ Năm" pillarData={mergedYear} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title="Trụ Tháng" pillarData={mergedMonth} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title="Trụ Ngày" pillarData={mergedDay} isDayMaster={true} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title="Trụ Giờ" pillarData={mergedHour} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                    </div>

                                    {/* Layout Mobile: Grid 2 cột x 3 hàng đồng đều chiều cao (items-stretch, equal height cards) */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:hidden w-full items-stretch">
                                        <Pillar title="Đại Vận" pillarData={daYun[selectedYunIndex]} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title={`Lưu Niên ${selectedLuuNianYear}`} pillarData={activeLuuNianPillar} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title="Trụ Ngày" pillarData={mergedDay} isDayMaster={true} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title="Trụ Giờ" pillarData={mergedHour} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title="Trụ Năm" pillarData={mergedYear} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                        <Pillar title="Trụ Tháng" pillarData={mergedMonth} hideTruongSinh={false} hideNaYin={false} minShenShaLines={maxVanhHanShenSha} />
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
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
                                    <Tooltip term={analysis.energy7Levels?.description || formatThan(analysis.than)} unstyled={true}>
                                        <span className={`px-3 py-1 text-sm sm:text-base font-black rounded-full border shadow-sm cursor-help hover:scale-105 transition-transform ${
                                            analysis.energy7Levels?.code === 'cuc_vuong' ? 'bg-indigo-100 text-indigo-900 border-indigo-300' :
                                            analysis.energy7Levels?.code === 'cuong_vuong' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                                            analysis.energy7Levels?.code === 'vuong' ? 'bg-sky-100 text-sky-800 border-sky-300' :
                                            analysis.energy7Levels?.code === 'can_bang' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                                            analysis.energy7Levels?.code === 'suy' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                                            analysis.energy7Levels?.code === 'nhuoc' ? 'bg-orange-100 text-orange-900 border-orange-300' :
                                            'bg-rose-100 text-rose-900 border-rose-300'
                                        }`}>
                                            {analysis.energy7Levels?.level || formatThan(analysis.than)}
                                        </span>
                                    </Tooltip>
                                </div>

                                {analysis.than === 'tong_cach' && (
                                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <span className="font-bold text-gray-600 text-sm sm:text-base">Loại Tòng Cách</span>
                                        <span className="text-base sm:text-lg font-bold text-purple-700">{analysis.tongCachType}</span>
                                    </div>
                                )}

                                <div className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 ${getBgColorClass(effectiveDungThan).replace('bg-', 'border-l-').replace(/border-\w+-200/, '')}`}>
                                    <span className="font-bold text-gray-650 text-sm sm:text-base">
                                        <Tooltip term="Dụng Thần">Dụng Thần (Khuyên Dùng)</Tooltip>
                                    </span>
                                    <Tooltip term={formatElement(effectiveDungThan)} unstyled={true}>
                                        <span className={`text-lg sm:text-xl font-black uppercase tracking-widest cursor-help hover:scale-105 transition-transform ${getColorClass(effectiveDungThan)}`}>{formatElement(effectiveDungThan)}</span>
                                    </Tooltip>
                                </div>

                                <div className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 ${getBgColorClass(effectiveHyThan).replace('bg-', 'border-l-').replace(/border-\w+-200/, '')}`}>
                                    <span className="font-bold text-gray-650 text-sm sm:text-base">
                                        <Tooltip term="Hỷ Thần">Hỷ Thần (Phụ Trợ)</Tooltip>
                                    </span>
                                    <Tooltip term={formatElement(effectiveHyThan)} unstyled={true}>
                                        <span className={`text-lg sm:text-xl font-black uppercase tracking-widest cursor-help hover:scale-105 transition-transform ${getColorClass(effectiveHyThan)}`}>{formatElement(effectiveHyThan)}</span>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Phân Tích Sức Mạnh Thập Thần Table */}
                <ThapThanStrengthTable thapThanAnalysis={thapThanAnalysis} />

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
                            
                            {Object.values(analysis.relations).every(arr => !arr || arr.length === 0) && (
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
                    className={`fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2.5 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 font-extrabold border ${isInterpreting ? 'bg-blue-100 border-blue-200 text-blue-500 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 hover:from-blue-950 hover:to-indigo-950 text-amber-300 border-amber-400/40 shadow-blue-900/30 hover:scale-105 active:scale-95 text-xs sm:text-sm tracking-wider uppercase ring-4 ring-blue-500/20'}`}
                >
                    {isInterpreting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-amber-300">{loadingTexts[loadingStep]}</span>
                        </>
                    ) : (
                        <>
                            <ScrollText className="animate-pulse text-amber-400" size={20} />
                            <span className="hidden sm:inline">Thầy Luận Giải Bát Tự</span>
                        </>
                    )}
                </button>
            ) : !isChatOpen && user && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2.5 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 hover:from-blue-950 hover:to-indigo-950 text-amber-300 border-amber-400/40 shadow-blue-900/30 hover:scale-105 active:scale-95 text-xs sm:text-sm tracking-wider uppercase ring-4 ring-blue-500/20"
                >
                    <MessageCircle className="animate-bounce text-amber-400 shrink-0" size={18} />
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
            {toastMsg && <FloatingNotificationToast message={toastMsg} onClose={() => setToastMsg('')} />}
            
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

export default BaziBoard;
