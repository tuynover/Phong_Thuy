import React, { useState, useEffect, useContext } from 'react';
import Tooltip from './Tooltip';
import { hexagramDictionary } from '../data/hexagrams';
import ReactMarkdown from 'react-markdown';
import { getInterpretationStreamUrl } from '../services/api';
import { AlertCircle, BookOpen, ScrollText, MessageCircle } from 'lucide-react';
import AiChatWidget from './AiChatWidget';
import { parseMarkdownSections } from '../utils/markdownParser';
import SectionRenderer from './SectionRenderer';
import { getColorClass, getBgColorClass, HAO_VI_MEANING, getChiOnly } from '../utils/phongthuyHelpers';
import { AuthContext } from '../context/AuthContext';

const LineVisual = ({ type, isRed }) => {
    const colorClass = isRed ? 'bg-red-600' : 'bg-blue-800';
    return (
        <div className="flex w-12 sm:w-16 md:w-20 h-2.5 justify-between items-center">
            {type === 1 ? (
                <div className={`w-full h-full ${colorClass}`}></div>
            ) : (
                <>
                    <div className={`w-[45%] h-full ${colorClass}`}></div>
                    <div className={`w-[45%] h-full ${colorClass}`}></div>
                </>
            )}
        </div>
    );
};

const LineWithTooltip = ({ type, isRed, isMoving, index }) => {
    const [show, setShow] = useState(false);
    const movingLabel = isMoving ? ' · Động 🔴' : '';
    const haoInfo = HAO_VI_MEANING[index] || {};
    return (
        <div
            className="relative inline-flex items-center gap-2 cursor-pointer h-full"
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <LineVisual type={type} isRed={isRed} />
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[9999] w-[260px] bg-amber-50 border border-amber-200 rounded-lg shadow-xl p-3 text-left">
                    <div className="font-bold text-red-800 text-sm border-b border-amber-300 pb-1 mb-2">
                        {haoInfo.ten}{movingLabel}
                    </div>
                    <div className="text-[12px] space-y-1.5 text-gray-800">
                        <div className="text-amber-900 font-medium italic">{haoInfo.y_nghia}</div>
                        <div><span className="text-gray-500">Đại diện:</span> <span className="font-semibold">{haoInfo.dai_dien}</span></div>
                    </div>
                </div>
            )}
        </div>
    );
};

const HexagramVisual = ({ lines }) => {
    const reversedLines = [...lines].reverse();
    return (
        <div className="flex flex-col items-center gap-[6px] my-3">
            {reversedLines.map((line, idx) => {
                const isRed = line.moving;
                return <LineVisual key={idx} type={line.line_type} isRed={isRed} />;
            })}
        </div>
    );
};

const DivinationBoard = ({ result, onUpdateResult, user, onRequireLogin }) => {
    const { setUser, token } = useContext(AuthContext);
    const [selectedHex, setSelectedHex] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [abortController, setAbortController] = useState(null);
    
    // Help parse legacy and structured interpretations cleanly
    const getInitialInterpretationText = (aiInt) => {
        if (!aiInt) return '';
        if (typeof aiInt === 'string') return aiInt;
        return aiInt.content || '';
    };

    const [interpretation, setInterpretation] = useState(getInitialInterpretationText(result?.aiInterpretation));
    const [error, setError] = useState('');
    const [loadingStep, setLoadingStep] = useState(0);

    // Update interpretation if result changes (e.g. user clicks another history item)
    useEffect(() => {
        setInterpretation(getInitialInterpretationText(result?.aiInterpretation));
    }, [result]);

    // Elegant minimalist loading texts
    const loadingTexts = [
        "Đang tra cứu Tượng Quẻ...",
        "Đang luận giải Thế Ứng...",
        "Đang định vị Hào Động..."
    ];

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

    // Auto abort on component destruction
    useEffect(() => {
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);

    const triggerLuanGiai = async () => {
        setShowConfirmModal(false);
        setIsInterpreting(true);
        setError('');
        setInterpretation('');

        const abortCtrl = new AbortController();
        setAbortController(abortCtrl);

        let currentText = "";
        try {
            const url = getInterpretationStreamUrl('hexagrams', result.recordId);
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
                                    currentText += parsed.chunk;
                                    setInterpretation(currentText);
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
                console.log("Interpretation aborted.");
            } else {
                console.error(err);
                setError(err.message || "Hệ thống luận giải đang bận hoặc gặp lỗi. Vui lòng thử lại sau.");
            }
        } finally {
            setIsInterpreting(false);
            setAbortController(null);

            if (currentText && onUpdateResult) {
                onUpdateResult({
                    ...result,
                    aiInterpretation: {
                        ...result.aiInterpretation,
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

    const handleAILuanGiai = async () => {
        if (!user) {
            if (onRequireLogin) onRequireLogin();
            return;
        }
        
        if (!result.recordId) {
            alert("Lỗi: Quẻ này chưa được lưu vào hệ thống, không thể luận giải.");
            return;
        }

        setShowConfirmModal(true);
    };

    if (!result) return null;

    const { primary, secondary, primaryLines, secondaryLines, dateInfo } = result;
    const renderSecondarySide = secondary.binary_code !== primary.binary_code;

    const rows = [];
    for (let i = 5; i >= 0; i--) {
        const pLine = primaryLines[i] || {};
        const sLine = secondaryLines[i] || {};
        rows.push({ pLine, sLine, index: i + 1 });
    }

    const HexTitle = ({ hexagram }) => {
        const hexData = hexagramDictionary[hexagram.binary_code] || {
            summary: "Chưa có thông tin", type: "Chưa Rõ", image: "...", desc: "..."
        };
        const color = getColorClass(hexagram.palace_element);
        
        return (
            <div className="relative group cursor-pointer inline-block text-center z-20" onClick={() => setSelectedHex({ ...hexagram, ...hexData })}>
                <h3 className={`text-2xl font-black uppercase tracking-widest mb-1 hover:underline transition-all ${color}`}>
                    {hexData.name || hexagram.name}
                </h3>
                {/* TOOLTIP */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999] w-[300px] bg-slate-800 text-white shadow-2xl p-4 rounded-xl text-left border border-slate-600">
                    <span className="block text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">{hexData.type}</span>
                    <span className="text-sm font-medium leading-relaxed">{hexData.summary}</span>
                    <div className="mt-2 text-xs text-gray-400 italic">Nhấp vào để xem chi tiết quẻ</div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white px-4 md:px-12 py-6 md:py-10 max-w-[1240px] mx-auto my-4 md:my-10 font-sans text-gray-900 shadow-2xl rounded-2xl border-t-8 border-t-red-800 relative">
            
            <h1 className="text-3xl font-black mb-6 tracking-wide text-gray-800 uppercase">TRANG DỊCH QUÁI</h1>
            
            {dateInfo && (
                <div className="space-y-3.5 text-[15px] font-medium text-gray-800">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="w-40 sm:shrink-0 text-gray-500 font-bold sm:font-normal">Thời gian lập quẻ:</span>
                        <span>{dateInfo.time} - {dateInfo.solarDate} ({dateInfo.lunarDateStr})</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="w-40 sm:shrink-0 text-gray-500 font-bold sm:font-normal">Can Chi:</span>
                        <span>Giờ <strong className="text-red-700">{dateInfo.hourCanChi}</strong>, ngày <strong className="text-red-700">{dateInfo.dayCanChi}</strong>, tháng <strong className="text-amber-700">{dateInfo.monthCanChi}</strong>, năm <strong className="text-amber-700">{dateInfo.yearCanChi}</strong></span>
                    </div>
                    <div className="flex flex-wrap gap-x-12 gap-y-3">
                        <div className="flex gap-2">
                            <span className="text-gray-500 font-bold sm:font-normal">Nhật thần:</span>
                            <span className="font-bold text-red-800">{dateInfo.nhatThan}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-gray-500 font-bold sm:font-normal">Nguyệt lệnh:</span>
                            <span className="font-bold text-amber-800">{dateInfo.nguyetLenh}</span>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 pt-2">
                        <span className="w-40 sm:shrink-0 text-gray-500 font-bold sm:font-normal">Phương pháp gieo:</span>
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded inline-block w-fit">Lục Hào Truyền Thống</span>
                    </div>
                </div>
            )}

            <hr className="border-t-2 border-amber-500 my-8 shadow-sm" />

            <div className="flex flex-col md:flex-row mb-8">
                <div className="flex-1 flex flex-col items-center relative">
                    <HexTitle hexagram={primary} />
                    <HexagramVisual lines={primaryLines} />
                    <span className={`text-[13px] font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full border ${getBgColorClass(primary.palace_element)} ${getColorClass(primary.palace_element)}`}>HỌ {primary.palace} - {primary.palace_element}</span>
                </div>
                
                {renderSecondarySide && (
                    <div className="flex-1 flex flex-col items-center border-t md:border-t-0 md:border-l-[1.5px] border-amber-300 pt-8 md:pt-0 relative">
                        <HexTitle hexagram={secondary} />
                        <HexagramVisual lines={secondaryLines} />
                        <span className={`text-[13px] font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full border ${getBgColorClass(secondary.palace_element)} ${getColorClass(secondary.palace_element)}`}>HỌ {secondary.palace} - {secondary.palace_element}</span>
                    </div>
                )}
            </div>

            <hr className="border-t-2 border-gray-300 mb-0" />

            {/* TABLE */}
            <div className="w-full pb-20 relative z-10">
                {renderSecondarySide ? (
                    <div className="flex flex-col lg:flex-row gap-6 lg:gap-0">
                        <div className="flex-1 min-w-0 border-b border-dashed border-gray-300 lg:border-b-0 lg:border-r-2 lg:border-gray-300 pb-6 lg:pb-0">
                            <div className="overflow-x-auto w-full custom-scrollbar">
                                <table className="w-full text-left text-xs sm:text-[14px] border-collapse relative">
                                    <thead>
                                        <tr className="border-b-2 border-gray-400 bg-slate-50/50 h-10">
                                            <th className="font-extrabold text-gray-800 w-[16%] text-center align-middle">Hào</th>
                                            <th className="font-bold text-gray-700 w-[10%] align-middle text-center">T/Ư</th>
                                            <th className="font-bold text-gray-700 w-[28%] align-middle">Lục Thân</th>
                                            <th className="font-bold text-gray-700 w-[28%] align-middle">Địa Chi</th>
                                            <th className="font-bold text-gray-700 w-[10%] align-middle">PT</th>
                                            <th className="font-bold text-gray-700 w-[8%] pr-2 align-middle">TK</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, idx) => {
                                            const { pLine, index } = row;
                                            const isMoving = pLine.moving;
                                            const trClass = `border-b border-gray-200 hover:bg-yellow-50/60 transition-colors h-[48px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`;
                                            return (
                                                <tr key={index} className={trClass}>
                                                    <td className="pl-0 text-center align-middle h-full">
                                                        <div className="flex items-center justify-center h-full">
                                                            <LineWithTooltip type={pLine.line_type} isRed={isMoving} isMoving={isMoving} index={index} />
                                                        </div>
                                                    </td>
                                                    <td className="text-[13px] font-extrabold text-blue-800 align-middle text-center">
                                                        {pLine.is_host ? 'Thế' : pLine.is_guest ? 'Ứng' : ''}
                                                    </td>
                                                    <td className={`font-medium align-middle ${isMoving ? 'font-bold' : ''}`}>
                                                        {pLine.relative ? <Tooltip term={pLine.relative}>{pLine.relative}</Tooltip> : ''}
                                                    </td>
                                                    <td className={`font-medium align-middle ${getColorClass(pLine.element)} ${isMoving ? 'font-bold' : ''}`}>
                                                        {getChiOnly(pLine.stem_branch)} {pLine.element}
                                                    </td>
                                                    <td className="text-[13px] text-gray-600 font-bold align-middle">
                                                        {pLine.hidden_spirit ? <Tooltip term={pLine.hidden_spirit}>{pLine.hidden_spirit}</Tooltip> : ''}
                                                    </td>
                                                    <td className="font-semibold text-gray-400 pr-2 align-middle">{pLine.tk}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0 pt-6 lg:pt-0 lg:pl-0">
                            <div className="overflow-x-auto w-full custom-scrollbar">
                                <table className="w-full text-left text-xs sm:text-[14px] border-collapse relative">
                                    <thead>
                                        <tr className="border-b-2 border-gray-400 bg-slate-50/50 h-10">
                                            <th className="pl-3 font-bold text-gray-700 w-[28%] align-middle">Lục Thân</th>
                                            <th className="font-bold text-gray-700 w-[28%] align-middle">Địa Chi</th>
                                            <th className="font-bold text-gray-700 w-[10%] align-middle">TK</th>
                                            <th className="font-bold text-gray-700 w-[26%] align-middle">Lục Thú</th>
                                            <th className="pr-0 font-extrabold text-gray-800 w-[8%] text-center align-middle">Hào</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((row, idx) => {
                                            const { pLine, sLine, index } = row;
                                            const isMoving = pLine.moving;
                                            const trClass = `border-b border-gray-200 hover:bg-yellow-50/60 transition-colors h-[48px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`;
                                            return (
                                                <tr key={index} className={trClass}>
                                                    <td className={`pl-3 font-medium align-middle ${isMoving ? 'font-bold' : ''}`}>
                                                        {sLine.relative ? <Tooltip term={sLine.relative}>{sLine.relative}</Tooltip> : ''}
                                                    </td>
                                                    <td className={`font-medium align-middle ${getColorClass(sLine.element)} ${isMoving ? 'font-bold' : ''}`}>
                                                        {getChiOnly(sLine.stem_branch)} {sLine.element}
                                                    </td>
                                                    <td className={`font-semibold align-middle ${isMoving ? 'text-red-400' : 'text-gray-400'}`}>{sLine.tk}</td>
                                                    <td className="font-semibold text-slate-700 align-middle">
                                                        <Tooltip term={pLine.luc_thu}>{pLine.luc_thu}</Tooltip>
                                                    </td>
                                                    <td className="pr-0 text-center align-middle h-full">
                                                        <div className="flex items-center justify-center h-full">
                                                            <LineWithTooltip type={sLine.line_type} isRed={isMoving} isMoving={isMoving} index={index} />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto w-full custom-scrollbar">
                        <table className="w-full text-left text-xs sm:text-[14px] border-collapse relative">
                            <thead>
                                <tr className="border-b-2 border-gray-400 bg-slate-50/50 h-10">
                                    <th className="font-extrabold text-gray-800 w-[16%] text-center align-middle">Hào</th>
                                    <th className="font-bold text-gray-700 w-[10%] align-middle text-center">T/Ư</th>
                                    <th className="font-bold text-gray-700 w-[22%] align-middle">Lục Thân</th>
                                    <th className="font-bold text-gray-700 w-[22%] align-middle">Địa Chi</th>
                                    <th className="font-bold text-gray-700 w-[18%] align-middle">Phục Thần</th>
                                    <th className="font-bold text-gray-700 w-[12%] align-middle">Lục Thú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => {
                                    const { pLine, index } = row;
                                    const isMoving = pLine.moving;
                                    const trClass = `border-b border-gray-200 hover:bg-yellow-50/60 transition-colors h-[48px] ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`;
                                    return (
                                        <tr key={index} className={trClass}>
                                            <td className="pl-0 text-center align-middle h-full">
                                                <div className="flex items-center justify-center h-full">
                                                    <LineWithTooltip type={pLine.line_type} isRed={isMoving} isMoving={isMoving} index={index} />
                                                </div>
                                            </td>
                                            <td className="text-[14px] font-extrabold text-blue-800 align-middle text-center">
                                                {pLine.is_host ? 'Thế' : pLine.is_guest ? 'Ứng' : ''}
                                            </td>
                                            <td className={`font-medium align-middle ${isMoving ? 'font-bold' : ''}`}>
                                                {pLine.relative}
                                            </td>
                                            <td className={`font-medium align-middle ${getColorClass(pLine.element)} ${isMoving ? 'font-bold' : ''}`}>
                                                {getChiOnly(pLine.stem_branch)} {pLine.element}
                                            </td>
                                            <td className="text-[14px] text-gray-600 font-bold align-middle">
                                                {pLine.hidden_spirit ? <Tooltip term={pLine.hidden_spirit}>{pLine.hidden_spirit}</Tooltip> : ''}
                                            </td>
                                            <td className="font-semibold text-slate-700 align-middle">
                                                <Tooltip term={pLine.luc_thu}>{pLine.luc_thu}</Tooltip>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* VƯỢNG SUY CỦA HÀO */}
            <div className="w-full pb-10">
                <h3 className="text-xl font-bold text-gray-800 mb-6 uppercase tracking-wider border-b-2 border-red-800 pb-2 inline-block">Trạng Thái Vượng Suy Các Hào</h3>
                
                <div className="flex flex-col md:flex-row gap-6 md:gap-0">
                    {/* QUẺ CHÍNH */}
                    <div className="flex-1 flex flex-col md:pr-4">
                        <div className="flex justify-end items-center mb-3">
                            {primary.quai_than && <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full text-sm border border-purple-200 shadow-sm">Quái Thân: {primary.quai_than}</span>}
                        </div>
                        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                            <div className="overflow-x-auto w-full custom-scrollbar">
                                <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                    <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="py-2.5 px-3 w-[40%]">Hào / Can Chi</th>
                                            <th className="py-2.5 px-3 w-[20%]">Vượng Suy</th>
                                            <th className="py-2.5 px-3 w-[20%]">TS Ngày</th>
                                            <th className="py-2.5 px-3 w-[20%]">TS Tháng</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {rows.map((row, idx) => {
                                            const { pLine, index } = row;
                                            const isVuongTuong = pLine.vuong_suy === 'Vượng' || pLine.vuong_suy === 'Tướng';
                                            const vuongSuyColor = isVuongTuong ? 'text-red-600 bg-red-50' : 'text-gray-700';
                                            
                                            return (
                                                <tr key={`p-${index}`} className="hover:bg-amber-50/50 transition-colors">
                                                    <td className="py-2.5 px-3 align-middle">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`font-semibold ${getColorClass(pLine.element)}`}>
                                                                {pLine.stem_branch}
                                                            </span>
                                                            {pLine.qt && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded uppercase tracking-wider">QT</span>}
                                                        </div>
                                                    </td>
                                                    <td className={`py-2.5 px-3 align-middle font-bold ${vuongSuyColor}`}>
                                                        <span className={isVuongTuong ? 'px-2 py-0.5 rounded bg-white border border-red-100 shadow-sm' : ''}>{pLine.vuong_suy}</span>
                                                    </td>
                                                    <td className="py-2.5 px-3 align-middle text-blue-800 font-semibold">{pLine.ts_ngay}</td>
                                                    <td className="py-2.5 px-3 align-middle text-amber-700 font-semibold">{pLine.ts_thang}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* QUẺ BIẾN */}
                    {renderSecondarySide && (
                        <div className="flex-1 flex flex-col border-t md:border-t-0 md:border-l-[1.5px] border-gray-300 pt-6 md:pt-0 md:pl-4">
                            <div className="flex justify-end items-center mb-3">
                                {secondary.quai_than && <span className="bg-purple-100 text-purple-800 font-bold px-3 py-1 rounded-full text-sm border border-purple-200 shadow-sm">Quái Thân: {secondary.quai_than}</span>}
                            </div>
                            <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                                <div className="overflow-x-auto w-full custom-scrollbar">
                                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                                        <thead className="bg-slate-50 border-b border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="py-2.5 px-3 w-[40%]">Hào / Can Chi</th>
                                                <th className="py-2.5 px-3 w-[20%]">Vượng Suy</th>
                                                <th className="py-2.5 px-3 w-[20%]">TS Ngày</th>
                                                <th className="py-2.5 px-3 w-[20%]">TS Tháng</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rows.map((row, idx) => {
                                                const { sLine, index } = row;
                                                const isVuongTuong = sLine.vuong_suy === 'Vượng' || sLine.vuong_suy === 'Tướng';
                                                const vuongSuyColor = isVuongTuong ? 'text-red-600 bg-red-50' : 'text-gray-700';
                                                
                                                return (
                                                    <tr key={`s-${index}`} className="hover:bg-amber-50/50 transition-colors">
                                                        <td className="py-2.5 px-3 align-middle">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`font-semibold ${getColorClass(sLine.element)}`}>
                                                                    {sLine.stem_branch}
                                                                </span>
                                                                {sLine.qt && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded uppercase tracking-wider">QT</span>}
                                                            </div>
                                                        </td>
                                                        <td className={`py-2.5 px-3 align-middle font-bold ${vuongSuyColor}`}>
                                                            <span className={isVuongTuong ? 'px-2 py-0.5 rounded bg-white border border-red-100 shadow-sm' : ''}>{sLine.vuong_suy}</span>
                                                        </td>
                                                        <td className="py-2.5 px-3 align-middle text-blue-800 font-semibold">{sLine.ts_ngay}</td>
                                                        <td className="py-2.5 px-3 align-middle text-amber-700 font-semibold">{sLine.ts_thang}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* KẾT QUẢ THẦY DỊCH GIẢI */}
            {interpretation && (
                <div className="w-full mt-4 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6 ml-1">
                        <div className="w-8 h-8 bg-amber-800 rounded-lg flex items-center justify-center shadow-md">
                            <BookOpen className="text-white" size={16} />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Thầy Dịch Giải Chi Tiết</h3>
                    </div>
                    <SectionRenderer sections={parseMarkdownSections(interpretation, 'iching')} theme="iching" />
                </div>
            )}

            {error && (
                <div className="w-full mt-4 mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <p className="text-red-800 font-medium">{error}</p>
                </div>
            )}

            {/* FLOATING ACTION BUTTON & FOLLOW-UP CHAT WIDGET */}
            {!interpretation ? (
                <button
                    onClick={handleAILuanGiai}
                    disabled={isInterpreting}
                    className={`fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 font-bold border ${isInterpreting ? 'bg-amber-100 border-amber-200 text-amber-500 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-900 text-white border-amber-700 hover:scale-105 hover:shadow-amber-900/40'}`}
                >
                    {isInterpreting ? (
                        <>
                            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm">{loadingTexts[loadingStep]}</span>
                        </>
                    ) : (
                        <>
                            <ScrollText className="animate-pulse" size={20} />
                            <span className="hidden sm:inline">Thầy Dịch Giải</span>
                        </>
                    )}
                </button>
            ) : !isChatOpen && (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex items-center gap-2 px-6 py-3.5 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-amber-800 to-amber-950 hover:from-amber-900 hover:to-stone-900 text-white border-amber-700 hover:scale-105 hover:shadow-amber-900/40 uppercase text-xs tracking-wider animate-pulse"
                >
                    <MessageCircle className="animate-bounce shrink-0" size={18} />
                    <span>Hỏi Thêm Thầy</span>
                </button>
            )}

            {interpretation && result?.recordId && (
                <AiChatWidget 
                    type="hexagrams" 
                    recordId={result.recordId} 
                    userId={user?.id || user?._id || 'guest'} 
                    isOpen={isChatOpen}
                    setIsOpen={setIsChatOpen}
                />
            )}

            {/* CONFIRMATION MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex justify-center items-center p-4">
                    <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-8 border-t-amber-800">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-800 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-xl font-bold text-amber-950 mb-3 flex items-center gap-2">
                            <ScrollText className="text-amber-800" size={24} />
                            Thầy Dịch Giải Chi Tiết
                        </h3>
                        {(() => {
                            const isStaff = user?.role === 'admin' || user?.role === 'co-admin';
                            const hasCredits = isStaff || (user?.credits > 0);

                            if (isStaff) {
                                return (
                                    <>
                                        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                                            Tài khoản quản trị viên có quyền luận giải không giới hạn. Bạn có chắc chắn muốn bắt đầu dịch giải chi tiết quẻ này không?
                                        </p>
                                        <div className="flex justify-end gap-3">
                                            <button 
                                                onClick={() => setShowConfirmModal(false)}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setShowConfirmModal(false);
                                                    triggerLuanGiai();
                                                }}
                                                className="px-5 py-2 bg-amber-800 text-white rounded-xl hover:bg-amber-900 font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                                            >
                                                Bắt đầu dịch giải
                                            </button>
                                        </div>
                                    </>
                                );
                            } else if (hasCredits) {
                                return (
                                    <>
                                        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                                            Bạn còn <span className="font-extrabold text-amber-800">{user?.credits}</span> lượt sử dụng. Mỗi lần luận giải AI sẽ tiêu thụ <span className="font-bold">1 credit</span>. Bạn có chắc chắn muốn bắt đầu dịch giải chi tiết quẻ này không?
                                        </p>
                                        <div className="flex justify-end gap-3">
                                            <button 
                                                onClick={() => setShowConfirmModal(false)}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors"
                                            >
                                                Hủy bỏ
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    setShowConfirmModal(false);
                                                    triggerLuanGiai();
                                                }}
                                                className="px-5 py-2 bg-amber-800 text-white rounded-xl hover:bg-amber-900 font-semibold text-sm transition-colors shadow-md hover:shadow-lg"
                                            >
                                                Bắt đầu dịch giải
                                            </button>
                                        </div>
                                    </>
                                );
                            } else {
                                return (
                                    <>
                                        <p className="text-red-700 bg-red-50 border border-red-100 p-3.5 rounded-xl mb-6 leading-relaxed text-xs sm:text-sm font-medium">
                                            ⚠️ Bạn đã hết lượt luận giải (0 credits). Mỗi ngày hệ thống sẽ tự động tặng bạn +1 credit. Hãy liên hệ Ban Quản Trị hoặc nâng cấp để tiếp tục sử dụng AI luận giải chi tiết.
                                        </p>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => setShowConfirmModal(false)}
                                                className="px-5 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-900 font-semibold text-sm transition-colors shadow-md"
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

            {/* HEXAGRAM DETAIL MODAL */}
            {selectedHex && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex justify-center items-center p-4">
                    <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                        
                        <div className="absolute top-4 right-4">
                            <button onClick={() => setSelectedHex(null)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-500 rounded-full transition-colors font-bold">✕</button>
                        </div>

                        <div className={`p-8 border-b-4 ${getBgColorClass(selectedHex.palace_element)} ${getColorClass(selectedHex.palace_element)}`}>
                            <div className="text-sm font-bold uppercase tracking-widest mb-1 opacity-80">
                                Quẻ Số {selectedHex.number || '??'} - {selectedHex.type}
                            </div>
                            <h2 className="text-4xl font-black mb-3">{selectedHex.name}</h2>
                            <div className="text-lg italic text-gray-700 font-medium border-l-4 border-current pl-4">Hình tượng: {selectedHex.image}</div>
                        </div>

                        <div className="p-8 pb-10 max-h-[60vh] overflow-y-auto">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Tóm Lược Yếu Quyết</h3>
                            <p className="text-xl text-gray-800 font-medium mb-8 leading-relaxed bg-slate-50 p-4 border-l-4 border-amber-500 rounded-r">{selectedHex.summary}</p>
                            
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Luận Giải Chi Tiết</h3>
                            <div className="text-gray-700 leading-loose text-justify space-y-4">
                                {selectedHex.desc.split('\n').map((para, i) => {
                                    if (para.includes(':')) {
                                        const [title, ...rest] = para.split(':');
                                        return (
                                            <div key={i} className="mb-2">
                                                <span className="font-bold text-slate-800 mb-1 block">📌 {title}:</span>
                                                <span className="block pl-5">{rest.join(':')}</span>
                                            </div>
                                        )
                                    }
                                    return <p key={i}>{para}</p>;
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            )}
            <style jsx="true">{`
                @media (max-width: 1024px) {
                    .custom-scrollbar table {
                        font-size: 11px !important;
                    }
                    .custom-scrollbar th, 
                    .custom-scrollbar td {
                        padding-left: 2px !important;
                        padding-right: 2px !important;
                        padding-top: 6px !important;
                        padding-bottom: 6px !important;
                    }
                    .custom-scrollbar td div.flex.w-12 {
                        margin: 0 auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default DivinationBoard;
