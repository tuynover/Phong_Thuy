import React, { useState, useEffect, useContext, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../context/AuthContext';
import { getInterpretationStreamUrl, rateMarriage, togglePublicCalculation } from '../services/api';
import { AlertCircle, BookOpen, ScrollText, Heart, X, ArrowUp, ArrowDown, MessageCircle, Star } from 'lucide-react';
import Tooltip from './Tooltip';
import SectionRenderer from './SectionRenderer';
import { parseMarkdownSections } from '../utils/markdownParser';
import AiChatWidget from './AiChatWidget';
import FloatingNotificationToast from './FloatingNotificationToast';

import {
    stemElements,
    branchElements,
    getColorClass,
    getBgColorClass,
} from '../utils/astrologyHelpers';

const MarriageBoard = ({ data, onUpdateData, onRequireLogin, onInvalidateHistory }) => {
    const { user, setUser, token } = useContext(AuthContext);

    // AI Interpretation States
    const [interpretation, setInterpretation] = useState('');
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [error, setError] = useState('');
    const [loadingStep, setLoadingStep] = useState(0);
    const [abortController, setAbortController] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [justRated, setJustRated] = useState(false);

    const prevIdRef = useRef(null);

    // Set initial interpretation and rating if cached
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

    // Fake progressive loading steps
    const loadingTexts = [
        "Đang tính toán Cung Phi...",
        "Đang hòa hợp Nhật Can...",
        "Đang đối chiếu Cung Phu Thê...",
        "Đang phân tích Dụng Thần..."
    ];

    useEffect(() => {
        let interval;
        if (isInterpreting) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isInterpreting]);

    // Clean up abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);

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
            await togglePublicCalculation('marriage', resolvedId, newStatus);
            setIsPublicState(newStatus);
            setToastMsg(`Đã ${newStatus ? 'bật' : 'tắt'} chia sẻ công khai kết quả Hợp Hôn!`);
            if (onInvalidateHistory) onInvalidateHistory();
            setResult(prev => prev ? { ...prev, isPublic: newStatus } : null);
            if (onUpdateData) {
                onUpdateData(prev => ({
                    ...prev,
                    isPublic: newStatus
                }));
            }
        } catch (err) {
            console.error('Lỗi khi đổi trạng thái công khai Marriage:', err);
            setToastMsg('Không thể thay đổi trạng thái chia sẻ. Vui lòng thử lại sau.');
        }
    };

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        const resolvedId = data?.recordId || data?._id;
        if (!resolvedId) return;
        try {
            await rateMarriage(resolvedId, rating, feedback);
            setJustRated(true);
            if (onInvalidateHistory) onInvalidateHistory();
            if (onUpdateData) {
                onUpdateData(prev => ({
                    ...prev,
                    rating,
                    feedback
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!data) return null;

    const { recordId, maleBaziData, femaleBaziData } = data;
    const resolvedRecordId = recordId || data._id;

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

    // radar chart element drawing helper
    const FiveElementsDiagram = ({ scores, canChi }) => {
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const getPercentage = (key) => {
            if (!totalScore) return 0;
            return Math.round(((scores[key] || 0) / totalScore) * 100);
        };
        
        const width = 360;
        const height = 280;
        const cx = width / 2;
        const cy = 140;
        const rLayout = 100; // Radius for grid
        const rLabel = 120; // Radius for label
        
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
            <div className="relative flex flex-col items-center justify-center max-w-sm mx-auto w-full select-none mt-2">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                    <defs>
                        <filter id="marriageGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#b91c1c" floodOpacity="0.1" />
                        </filter>
                        <radialGradient id="marriageGrad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.05" />
                            <stop offset="85%" stopColor="#f43f5e" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#e11d48" stopOpacity="0.35" />
                        </radialGradient>
                    </defs>

                    {gridLevels.map(level => {
                        const rLevel = rLayout * (level / 5);
                        const points = elementsDef.map(el => {
                            const x = cx + rLevel * Math.cos(el.angle);
                            const y = cy + rLevel * Math.sin(el.angle);
                            return `${x},${y}`;
                        }).join(' ');
                        const isOuter = level === 5;
                        return (
                            <polygon 
                                key={`grid-${level}`}
                                points={points} 
                                fill="none" 
                                stroke={isOuter ? "rgba(226, 115, 150, 0.4)" : "rgba(226, 115, 150, 0.15)"} 
                                strokeWidth={isOuter ? "1.5" : "1"} 
                                strokeDasharray={isOuter ? "none" : "3,3"}
                            />
                        );
                    })}
                    
                    {elementsDef.map((el, idx) => {
                        const xOuter = cx + rLayout * Math.cos(el.angle);
                        const yOuter = cy + rLayout * Math.sin(el.angle);
                        return (
                            <line 
                                key={`spoke-${idx}`} 
                                x1={cx} y1={cy} 
                                x2={xOuter} y2={yOuter} 
                                stroke="rgba(226, 115, 150, 0.25)" 
                                strokeWidth="1" 
                                strokeDasharray="2,2"
                            />
                        );
                    })}

                    <circle cx={cx} cy={cy} r="3" fill="#f43f5e" opacity="0.6" />
                    
                    <path 
                        d={getBezierPath(nodes, 0.08)} 
                        fill="url(#marriageGrad)" 
                        stroke="#f43f5e" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#marriageGlow)"
                    />
                    
                    {nodes.map((node, idx) => (
                        <g key={`marker-${idx}`}>
                            <circle cx={node.x} cy={node.y} r="4" fill={node.color} stroke="#white" strokeWidth="1" />
                            <foreignObject 
                                x={node.xLabel - 32} 
                                y={node.yLabel - 20} 
                                width="64" 
                                height="44"
                                className="overflow-visible"
                            >
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div 
                                        className="text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-sm border flex items-center gap-0.5"
                                        style={{ backgroundColor: node.bgColor, borderColor: node.color + '20', color: node.color }}
                                    >
                                        <span>{node.emoji}</span>
                                        <span>{node.label} ({node.pct}%)</span>
                                    </div>
                                    {node.subLabel && (
                                        <div className="text-[7.5px] font-extrabold text-neutral-400 mt-0.5 tracking-wider uppercase">{node.subLabel}</div>
                                    )}
                                </div>
                            </foreignObject>
                        </g>
                    ))}
                </svg>
            </div>
        );
    };

    const handleInterpretClick = () => {
        if (!user) {
            onRequireLogin();
            return;
        }

        if (!resolvedRecordId) {
            alert("Lỗi: Bản ghi hợp hôn chưa được lưu thành công.");
            return;
        }

        setShowConfirmModal(true);
    };

    const triggerLuanGiai = async () => {
        setShowConfirmModal(false);
        setIsInterpreting(true);
        setError('');
        setInterpretation('');

        const controller = new AbortController();
        setAbortController(controller);

        let currentText = "";
        try {
            const streamUrl = getInterpretationStreamUrl('marriage', resolvedRecordId);
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(streamUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ userId: user?.id || user?._id || 'guest' }),
                signal: controller.signal
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Lỗi khi gọi dịch vụ giải đoán.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') {
                            break;
                        }
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.chunk) {
                                const isFirstChunk = !currentText;
                                currentText += parsed.chunk;
                                setInterpretation(currentText);
                                if (isFirstChunk) {
                                    setTimeout(() => {
                                        const element = document.getElementById('marriage-interpretation-section');
                                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }, 100);
                                }
                            }
                            if (parsed.error) {
                                setError(parsed.error);
                            }
                        } catch (e) {
                            console.error("Lỗi parse SSE chunk:", e);
                        }
                    }
                }
            }

            // Sync updated record interpretation to parent if exists
            if (onUpdateData) {
                onUpdateData(prev => ({
                    ...prev,
                    aiInterpretation: {
                        content: currentText,
                        generatedAt: new Date()
                    }
                }));
            }

            // Decrement credit locally for non-admin accounts
            if (user && user.role !== 'admin' && user.role !== 'co-admin') {
                setUser(prev => {
                    if (!prev) return prev;
                    const updated = { ...prev, credits: Math.max(0, prev.credits - 1) };
                    localStorage.setItem('user', JSON.stringify(updated));
                    return updated;
                });
            }

        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
                setError(err.message || 'Lỗi kết nối hoặc đứt quãng luồng giải đoán.');
            }
        } finally {
            setIsInterpreting(false);
            setAbortController(null);
        }
    };

    const SHEN_SHA_COLORS = {
        'Thiên Ất': 'text-emerald-605',
        'Thái Cực': 'text-emerald-605',
        'Thiên Đức': 'text-emerald-605',
        'Nguyệt Đức': 'text-emerald-605',
        'Lộc Thần': 'text-emerald-605',
        'Văn Xương': 'text-emerald-605',
        'Tướng Tinh': 'text-emerald-605',
        'Phúc Tinh': 'text-emerald-605',
        'Quốc Ấn': 'text-emerald-605',
        'Thiên Y': 'text-emerald-605',
        'Hồng Loan': 'text-emerald-605',
        'Thiên Hỷ': 'text-emerald-605',
        'Kim Dư': 'text-emerald-605',
        'Kình Dương': 'text-rose-600',
        'Kiếp Sát': 'text-rose-600',
        'Vong Thần': 'text-rose-600',
        'Cô Thần': 'text-rose-600',
        'Quả Tú': 'text-rose-600',
        'Không Vong': 'text-rose-600',
        'Dịch Mã': 'text-slate-700',
        'Hoa Cái': 'text-slate-700',
        'Đào Hoa': 'text-slate-700'
    };

    const getAbbreviatedThapThan = (name) => {
        if (!name) return '';
        return name.trim();
    };

    const PillarCard = ({ title, gan, zhi, thapThanGan, tangCan = [], naYin, truongSinh, shenSha = [], isFemale, isDayMaster }) => {
        const ganElem = stemElements[gan];
        const zhiElem = branchElements[zhi];
        const showTruongSinh = truongSinh;

        const isHighlighted = isDayMaster;
        const themeBorder = isFemale
            ? (isHighlighted ? 'border-rose-500 bg-rose-50/20 ring-4 ring-rose-100' : 'border-rose-100 bg-white hover:border-rose-300')
            : (isHighlighted ? 'border-blue-500 bg-blue-50/20 ring-4 ring-blue-100' : 'border-blue-100 bg-white hover:border-blue-300');

        return (
            <div className={`relative flex flex-col items-center py-4 sm:py-6 rounded-2xl shadow-sm border-2 transition-all hover:scale-[1.02] flex-1 min-h-[385px] sm:min-h-[415px] md:min-h-[455px] px-3 sm:px-5 md:px-6 mx-0.5 sm:mx-1 ${themeBorder}`}>
                <Tooltip term={title} unstyled={true}>
                    <div className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isDayMaster ? (isFemale ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800') : 'bg-gray-100 text-gray-505'}`}>
                        {title}
                    </div>
                </Tooltip>

                {/* Horizontal dashed divider line */}
                <div className="w-full border-t border-dashed border-gray-200 my-2"></div>
                
                <div className="text-[10px] sm:text-sm font-bold text-gray-400 mb-1.5 h-4 sm:h-5">
                    {thapThanGan !== 'Nhật Chủ' && thapThanGan !== 'Bản Thể' ? (
                        <Tooltip term={thapThanGan} unstyled={true}>
                            <span className="cursor-help hover:text-rose-700 transition-colors">{thapThanGan}</span>
                        </Tooltip>
                    ) : ''}
                </div>
                
                <Tooltip term={gan} unstyled={true}>
                    <div className={`text-2xl sm:text-4xl font-black mt-1 mb-1 sm:mb-2 hover:scale-110 transition-transform ${getColorClass(ganElem)}`}>{gan}</div>
                </Tooltip>
                
                {/* Địa chi và Trường sinh ngang hàng (xoay dọc sát mép trái giống bên Bát Tự) */}
                <div className="flex items-center justify-center relative w-full select-none">
                    {showTruongSinh && (
                        <div className="absolute -left-3 sm:-left-4 md:-left-5 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-8 select-none">
                            <Tooltip term={truongSinh} unstyled={true}>
                                <span className={`text-[10px] sm:text-[11.5px] font-black cursor-help transition-colors transform -rotate-90 origin-center inline-block whitespace-nowrap leading-none tracking-tighter ${isFemale ? 'text-rose-650 hover:text-rose-850' : 'text-blue-650 hover:text-blue-850'}`}>
                                    {getAbbreviatedTruongSinh(truongSinh)}
                                </span>
                            </Tooltip>
                        </div>
                    )}
                    <Tooltip term={zhi} unstyled={true}>
                        <div className={`text-2xl sm:text-4xl font-black mb-1 sm:mb-2 hover:scale-110 transition-transform ${getColorClass(zhiElem)}`}>{zhi}</div>
                    </Tooltip>
                </div>
                
                {naYin && (
                    <Tooltip term={naYin} unstyled={true}>
                        <div className={`text-[8.5px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border my-1 text-center max-w-full truncate hover:brightness-95 transition-all ${getNaYinColorClass(naYin)}`}>
                            {naYin}
                        </div>
                    </Tooltip>
                )}
                
                {/* Tàng can: pad lên đủ 3 dòng cố định chiều cao */}
                <div className="w-full border-t border-dashed border-gray-200 mt-2.5 pt-2 flex flex-col items-center justify-center">
                    <div className="w-full max-w-[125px] sm:max-w-[145px] flex flex-col gap-1 mt-1">
                        {(() => {
                            const paddedTangCan = [...tangCan];
                            while (paddedTangCan.length < 3) {
                                paddedTangCan.push({ gan: '', thapThan: '' });
                            }
                            return paddedTangCan.map((tc, idx) => (
                                <div key={idx} className="flex justify-between items-center text-[10px] sm:text-[12.5px] leading-tight w-full font-sans h-[15px] sm:h-[18px]">
                                    {tc.gan ? (
                                        <>
                                            <Tooltip term={tc.gan} unstyled={true}>
                                                <span className={`font-bold shrink-0 text-left hover:scale-110 transition-transform ${getColorClass(stemElements[tc.gan])}`}>{tc.gan}</span>
                                            </Tooltip>
                                            <Tooltip term={tc.thapThan} unstyled={true}>
                                                <span className={`font-bold text-right truncate pl-1 hover:underline transition-all ${isFemale ? 'text-rose-800 hover:text-rose-950' : 'text-blue-800 hover:text-blue-950'}`}>{getAbbreviatedThapThan(tc.thapThan)}</span>
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

                {/* Thần Sát Bát Tự: pad lên đủ 4 dòng cố định chiều cao */}
                <div className="w-full border-t border-dashed border-gray-200 mt-2.5 pt-2 flex flex-col items-center justify-center">
                    <div className="w-full max-w-[125px] sm:max-w-[145px] flex flex-col gap-1 mt-1">
                        {(() => {
                            const paddedShenSha = [...shenSha];
                            while (paddedShenSha.length < 4) {
                                paddedShenSha.push('');
                            }
                            return paddedShenSha.map((ss, idx) => {
                                const colorClass = SHEN_SHA_COLORS[ss] || (isFemale ? 'text-rose-700' : 'text-blue-700');
                                return (
                                    <div key={idx} className="flex justify-center items-center text-[10px] sm:text-[12px] leading-tight w-full font-black h-[15px] sm:h-[18px]">
                                        {ss ? (
                                            <Tooltip term={ss} unstyled={true}>
                                                <span className={`${colorClass} hover:scale-105 transition-transform cursor-help`}>
                                                    {ss}
                                                </span>
                                            </Tooltip>
                                        ) : (
                                            <span className="invisible">&nbsp;</span>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>
        );
    };

    const BaziPillarsSection = ({ canChi, isFemale }) => {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 justify-center w-full pb-2">
                <PillarCard title="Năm Sinh" gan={canChi.year.gan} zhi={canChi.year.zhi} thapThanGan={canChi.year.thapThanGan} tangCan={canChi.year.tangCan} naYin={canChi.year.naYin} truongSinh={canChi.year.truongSinh} shenSha={canChi.year.shenSha} isFemale={isFemale} isDayMaster={false} />
                <PillarCard title="Nguyệt Lệnh" gan={canChi.month.gan} zhi={canChi.month.zhi} thapThanGan={canChi.month.thapThanGan} tangCan={canChi.month.tangCan} naYin={canChi.month.naYin} truongSinh={canChi.month.truongSinh} shenSha={canChi.month.shenSha} isFemale={isFemale} isDayMaster={false} />
                <PillarCard title="Nhật Chủ" gan={canChi.day.gan} zhi={canChi.day.zhi} thapThanGan="Nhật Chủ" tangCan={canChi.day.tangCan} naYin={canChi.day.naYin} truongSinh={canChi.day.truongSinh} shenSha={canChi.day.shenSha} isFemale={isFemale} isDayMaster={true} />
                <PillarCard title="Giờ Sinh" gan={canChi.hour.gan} zhi={canChi.hour.zhi} thapThanGan={canChi.hour.thapThanGan} tangCan={canChi.hour.tangCan} naYin={canChi.hour.naYin} truongSinh={canChi.hour.truongSinh} shenSha={canChi.hour.shenSha} isFemale={isFemale} isDayMaster={false} />
            </div>
        );
    };

    return (
        <div className="space-y-6 md:space-y-8 pb-20 font-sans relative">

            {/* Công tắc chia sẻ công khai kết quả Hợp Hôn */}
            {(!window.location.pathname.includes('/record/') || (user && (result?.userId === user.id || result?.userId === user._id))) && (
                <div className="p-5 bg-rose-50/40 border border-rose-100 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-sm font-extrabold text-slate-800">Chia sẻ công khai kết quả hợp hôn</span>
                        <span className="text-[11px] text-gray-500 font-medium">Bật để cho phép người khác truy cập xem kết quả so hợp tuổi này qua liên kết công khai</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {isPublicState && (
                            <button
                                type="button"
                                onClick={() => {
                                    const shareUrl = `${window.location.origin}/marriage/record/${data._id || data.recordId}`;
                                    navigator.clipboard.writeText(shareUrl);
                                    setToastMsg('Đã sao chép liên kết chia sẻ công khai Hợp Hôn!');
                                }}
                                className="px-3 py-1 bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            >
                                Sao chép liên kết
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleTogglePublic}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPublicState ? 'bg-rose-700' : 'bg-gray-300'}`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPublicState ? 'translate-x-5' : 'translate-x-0'}`}
                            />
                        </button>
                    </div>
                </div>
            )}
            
            {/* SECTION 1: BASIC INFO DIVIDED IN HALF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* MALE BASIC INFO */}
                <div className="p-6 bg-white/70 backdrop-blur-sm border border-blue-100 rounded-3xl shadow-md space-y-4">
                    <h3 className="text-xl font-bold text-blue-900 border-l-4 border-blue-500 pl-4 uppercase">Đại Diện Nam Mệnh</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-gray-400 block text-xs font-bold uppercase mb-0.5">Sinh Dương Lịch</span>
                            <span className="font-extrabold text-slate-800">{maleBaziData.solarTimeline}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-gray-400 block text-xs font-bold uppercase mb-0.5">Sinh Âm Lịch</span>
                            <span className="font-extrabold text-slate-800">{maleBaziData.lunarDateStr}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-gray-400 block text-xs font-bold uppercase mb-0.5">Nạp Âm Bản Mệnh</span>
                            <span className={`font-extrabold px-2 py-0.5 rounded border inline-block ${getNaYinColorClass(maleBaziData.canChi.day.naYin)}`}>
                                {maleBaziData.canChi.day.naYin}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-gray-400 block text-xs font-bold uppercase mb-0.5">Cung Phi (Mệnh Quái)</span>
                            {maleBaziData.menhQuai ? (
                                <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded inline-block">
                                    {maleBaziData.menhQuai.cung} ({maleBaziData.menhQuai.element} - {maleBaziData.menhQuai.group})
                                </span>
                            ) : 'Chưa xác định'}
                        </div>
                    </div>
                </div>

                {/* FEMALE BASIC INFO */}
                <div className="p-6 bg-white/70 backdrop-blur-sm border border-rose-100 rounded-3xl shadow-md space-y-4">
                    <h3 className="text-xl font-bold text-rose-900 border-l-4 border-rose-500 pl-4 uppercase">Đại Diện Nữ Mệnh</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-gray-400 block text-xs font-bold uppercase mb-0.5">Sinh Dương Lịch</span>
                            <span className="font-extrabold text-slate-800">{femaleBaziData.solarTimeline}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-gray-400 block text-xs font-bold uppercase mb-0.5">Sinh Âm Lịch</span>
                            <span className="font-extrabold text-slate-800">{femaleBaziData.lunarDateStr}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-gray-400 block text-xs font-bold uppercase mb-0.5">Nạp Âm Bản Mệnh</span>
                            <span className={`font-extrabold px-2 py-0.5 rounded border inline-block ${getNaYinColorClass(femaleBaziData.canChi.day.naYin)}`}>
                                {femaleBaziData.canChi.day.naYin}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-gray-400 block text-xs font-bold uppercase mb-0.5">Cung Phi (Mệnh Quái)</span>
                            {femaleBaziData.menhQuai ? (
                                <span className="font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded inline-block">
                                    {femaleBaziData.menhQuai.cung} ({femaleBaziData.menhQuai.element} - {femaleBaziData.menhQuai.group})
                                </span>
                            ) : 'Chưa xác định'}
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: STRUCTURE OF FOUR PILLARS (Nam top, Nữ bottom - enlarged cards) */}
            <div className="space-y-6 bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-lg">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-amber-600 pl-4 mb-4 uppercase">Cấu Trúc Tứ Trụ Nam Mệnh (Chồng)</h3>
                    <BaziPillarsSection canChi={maleBaziData.canChi} isFemale={false} />
                </div>
                <hr className="border-gray-100" />
                <div>
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-rose-600 pl-4 mb-4 uppercase">Cấu Trúc Tứ Trụ Nữ Mệnh (Vợ)</h3>
                    <BaziPillarsSection canChi={femaleBaziData.canChi} isFemale={true} />
                </div>
            </div>

            {/* SECTION 3: ELEMENT ASSESSMENT (Side by side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-lg">
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-bold text-blue-900 border-l-4 border-blue-500 pl-4 mb-4 uppercase w-full text-left">Đánh Giá Ngũ Hành - Nam Mệnh</h3>
                    <FiveElementsDiagram scores={maleBaziData.nguHanh} canChi={maleBaziData.canChi} />
                </div>
                <div className="flex flex-col items-center">
                    <h3 className="text-lg font-bold text-rose-900 border-l-4 border-rose-500 pl-4 mb-4 uppercase w-full text-left">Đánh Giá Ngũ Hành - Nữ Mệnh</h3>
                    <FiveElementsDiagram scores={femaleBaziData.nguHanh} canChi={femaleBaziData.canChi} />
                </div>
            </div>

            {interpretation && (
                <div id="marriage-interpretation-section" className="bg-transparent space-y-6">
                    <div className="flex items-center gap-3 mb-6 ml-1">
                        <div className="w-8 h-8 bg-rose-800 rounded-lg flex items-center justify-center shadow-md">
                            <BookOpen className="text-white" size={16} />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Thầy Luận Giải Bát Tự Hợp Hôn</h3>
                    </div>
                    <SectionRenderer sections={parseMarkdownSections(interpretation, 'marriage')} theme="marriage" />

                    {/* ĐÁNH GIÁ PHẢN HỒI */}
                    {(!data?.rating || justRated) && (
                        <div className="mt-12 bg-white/60 border border-rose-100 p-6 rounded-3xl backdrop-blur-md max-w-xl mx-auto shadow-md">
                            <h4 className="font-extrabold text-slate-800 text-center mb-2">Đánh Giá Luận Giải Thầy Hợp Hôn</h4>
                            <p className="text-center text-xs text-slate-400 mb-6">Nhận xét của bạn sẽ giúp bổ sung tri thức và cải thiện chất lượng của AI tốt hơn.</p>

                            {justRated ? (
                                <div className="text-center py-4 text-rose-600 font-bold animate-in zoom-in-95">
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
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition-all font-bold placeholder:text-slate-300 focus:outline-none"
                                    rows={2}
                                />
                                <button
                                    type="submit"
                                    disabled={!rating}
                                    className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-md disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none transition-all active:scale-[0.98]"
                                >
                                    Gửi Nhận Xét
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </div>
        )}

            {isInterpreting && !interpretation && (
                <div className="bg-[#faf6f0] p-10 md:p-20 rounded-[2rem] border border-amber-200/50 shadow-sm text-center space-y-4">
                    <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin mx-auto"></div>
                    <p className="text-amber-900 font-bold text-base animate-pulse">{loadingTexts[loadingStep]}</p>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-red-750 flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <span className="font-bold">Lỗi luận giải: </span>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {isInterpreting && interpretation && (
                <div className="flex items-center gap-2 text-amber-800/80 font-bold text-xs mt-4 animate-pulse px-4">
                    <div className="w-2 h-2 bg-amber-800 rounded-full animate-ping"></div>
                    <span>Đại sư đang soạn tiếp lời giải đoán...</span>
                </div>
            )}

            {/* FLOATING ACTION BUTTON */}
            {!interpretation ? (
                <button
                    onClick={handleInterpretClick}
                    disabled={isInterpreting}
                    className={`fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 font-bold border ${isInterpreting ? 'bg-rose-100 border-rose-200 text-rose-500 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-rose-800 to-rose-950 hover:from-rose-900 hover:to-rose-950 text-white border-rose-700 hover:scale-105 hover:shadow-rose-900/40'}`}
                >
                    {isInterpreting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
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
                    className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2 px-6 py-3.5 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-rose-800 to-rose-950 hover:from-rose-900 hover:to-rose-950 text-white border-rose-700 hover:scale-105 hover:shadow-rose-900/40 uppercase text-xs tracking-wider animate-pulse"
                >
                    <MessageCircle size={20} />
                    <span>Hỏi Đáp AI</span>
                </button>
            )}

            {interpretation && resolvedRecordId && user && (
                <AiChatWidget 
                    type="marriage" 
                    recordId={resolvedRecordId} 
                    userId={user?.id || user?._id} 
                    isOpen={isChatOpen}
                    setIsOpen={setIsChatOpen}
                />
            )}

            {/* CONFIRMATION MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md p-6 relative shadow-2xl space-y-4 font-sans text-left">
                        <button
                            type="button"
                            onClick={() => setShowConfirmModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 transition-colors"
                        >
                            <X size={20} />
                        </button>
                        
                        <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                            <Heart size={20} className="text-rose-600" />
                            Xác Nhận Luận Giải AI
                        </h3>

                        {user?.role === 'admin' || user?.role === 'co-admin' ? (
                            <>
                                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                                    Tài khoản quản trị viên có quyền luận giải không giới hạn. Bạn có chắc chắn muốn khởi động luận giải hợp hôn chi tiết của cặp đôi này không?
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => setShowConfirmModal(false)}
                                        className="px-4 py-2 text-gray-500 hover:bg-gray-150 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button 
                                        onClick={triggerLuanGiai}
                                        className="px-5 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-bold text-sm shadow transition-colors"
                                    >
                                        Đồng ý
                                    </button>
                                </div>
                            </>
                        ) : user?.credits > 0 ? (
                            <>
                                <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                                    Bạn còn <span className="font-extrabold text-rose-850">{user?.credits}</span> lượt sử dụng. Mỗi lần luận giải AI sẽ tiêu thụ <span className="font-bold">1 credit</span>. Bạn có chắc chắn muốn khởi động luận giải hợp hôn chi tiết của cặp đôi này không?
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => setShowConfirmModal(false)}
                                        className="px-4 py-2 text-gray-505 hover:bg-gray-100 rounded-lg font-bold text-sm transition-colors"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button 
                                        onClick={triggerLuanGiai}
                                        className="px-5 py-2 bg-rose-800 hover:bg-rose-900 text-white rounded-lg font-bold text-sm shadow transition-colors"
                                    >
                                        Đồng ý
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-red-750 bg-red-50 border border-red-100 p-3.5 rounded-xl mb-6 leading-relaxed text-xs sm:text-sm font-medium">
                                    ⚠️ Bạn đã hết lượt luận giải (0 credits). Mỗi ngày hệ thống sẽ tự động tặng bạn +1 credit. Hãy liên hệ Ban Quản Trị hoặc nâng cấp để tiếp tục sử dụng.
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
                        )}
                    </div>
                </div>
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
            {toastMsg && <FloatingNotificationToast message={toastMsg} onClose={() => setToastMsg('')} />}
        </div>
    );
};

export default MarriageBoard;
