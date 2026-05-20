import React, { useState, useEffect, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../context/AuthContext';
import { getInterpretationStreamUrl } from '../services/api';
import { AlertCircle, BookOpen, ScrollText } from 'lucide-react';

const stemElements = {
    "Giáp": "Moc", "Ất": "Moc", "Bính": "Hoa", "Đinh": "Hoa", "Mậu": "Tho",
    "Kỷ": "Tho", "Canh": "Kim", "Tân": "Kim", "Nhâm": "Thuy", "Quý": "Thuy"
};

const branchElements = {
    "Tý": "Thuy", "Sửu": "Tho", "Dần": "Moc", "Mão": "Moc", "Thìn": "Tho", "Tỵ": "Hoa",
    "Ngọ": "Hoa", "Mùi": "Tho", "Thân": "Kim", "Dậu": "Kim", "Tuất": "Tho", "Hợi": "Thuy"
};

const getColorClass = (element) => {
    switch (element) {
        case 'Moc': return 'text-emerald-600';
        case 'Hoa': return 'text-red-600';
        case 'Tho': return 'text-amber-700';
        case 'Kim': return 'text-slate-500';
        case 'Thuy': return 'text-blue-600';
        default: return 'text-gray-800';
    }
};

const getBgColorClass = (element) => {
    switch (element) {
        case 'Moc': return 'bg-emerald-50 border-emerald-200';
        case 'Hoa': return 'bg-red-50 border-red-200';
        case 'Tho': return 'bg-amber-50 border-amber-200';
        case 'Kim': return 'bg-slate-50 border-slate-200';
        case 'Thuy': return 'bg-blue-50 border-blue-200';
        default: return 'bg-gray-50 border-gray-200';
    }
};

const BaziBoard = ({ data, onRequireLogin }) => {
    const { user } = useContext(AuthContext);

    // AI Interpretation States
    const [interpretation, setInterpretation] = useState('');
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [error, setError] = useState('');
    const [loadingStep, setLoadingStep] = useState(0);
    const [abortController, setAbortController] = useState(null);

    // Set initial interpretation if cached in data
    useEffect(() => {
        if (data?.aiInterpretation && data.aiInterpretation.content) {
            setInterpretation(data.aiInterpretation.content);
        } else {
            setInterpretation('');
        }
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

    if (!data) return null;

    const { canChi, nguHanh, analysis, dungThan, hyThan, daYun } = data;

    const Pillar = ({ title, pillarData, isDayMaster }) => {
        const { gan, zhi, thapThanGan, tangCan } = pillarData;
        const ganElem = stemElements[gan];
        const zhiElem = branchElements[zhi];

        return (
            <div className={`flex flex-col items-center p-4 rounded-xl shadow-sm border-2 ${isDayMaster ? 'border-amber-500 bg-amber-50/30 ring-4 ring-amber-100' : 'border-gray-200 bg-white'} min-w-[20%]`}>
                <div className={`text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1 rounded-full ${isDayMaster ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                    {title}
                </div>
                
                <div className="text-sm font-bold text-gray-400 mb-1 h-5">{thapThanGan !== 'Nhật Chủ' ? thapThanGan : ''}</div>
                <div className={`text-4xl font-black mb-2 ${getColorClass(ganElem)}`}>{gan}</div>
                <div className={`text-4xl font-black mb-6 ${getColorClass(zhiElem)}`}>{zhi}</div>
                
                <div className="w-full border-t border-dashed border-gray-300 pt-4 flex flex-col gap-2">
                    {tangCan.map((tc, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-gray-50 px-2 py-1.5 rounded">
                            <span className={`text-lg font-bold ${getColorClass(stemElements[tc.gan])}`}>{tc.gan}</span>
                            <span className="text-xs font-bold text-gray-500">{tc.thapThan}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const ElementScore = ({ label, score, colorClass }) => (
        <div className="flex-1 min-w-[15%] bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-2xl font-black ${colorClass}`}>{score}</div>
        </div>
    );

    const formatThan = (thanStr) => {
        if (thanStr === 'vuong') return 'Thân Vượng';
        if (thanStr === 'nhuoc') return 'Thân Nhược';
        if (thanStr === 'can_bang') return 'Trạng Thái Cân Bằng';
        if (thanStr === 'tong_cach') return 'Tòng Cách';
        return thanStr;
    };

    const formatElement = (el) => {
        switch (el) {
            case 'Moc': return 'Mộc';
            case 'Hoa': return 'Hỏa';
            case 'Tho': return 'Thổ';
            case 'Kim': return 'Kim';
            case 'Thuy': return 'Thủy';
            default: return el;
        }
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

        try {
            const url = getInterpretationStreamUrl('bazi', data.recordId);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
            let currentText = "";

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
                console.log("Interpretation stream aborted.");
            } else {
                console.error(err);
                setError(err.message || "Hệ thống luận giải đang bận hoặc gặp lỗi. Vui lòng thử lại sau.");
            }
        } finally {
            setIsInterpreting(false);
            setAbortController(null);
        }
    };

    return (
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 max-w-[1240px] mx-auto my-10 font-sans pb-10">
            
            <div className="bg-[#0f172a] text-white p-8 md:p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
                <div className="relative z-10">
                    <h2 className="text-4xl font-extrabold mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-400">Kết Quả Phân Tích Bát Tự</h2>
                    <p className="text-blue-200/80 uppercase tracking-widest text-sm font-bold">Lá Số Tử Bình Chuyên Sâu</p>
                </div>
            </div>

            <div className="p-6 md:p-12 space-y-12">
                
                {/* Tứ Trụ */}
                <div>
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-blue-600 pl-4 mb-6 uppercase">Cấu Trúc Tứ Trụ (Mệnh Cục)</h3>
                    <div className="flex flex-row-reverse justify-center gap-4 md:gap-8">
                        <Pillar title="Giờ Sinh" pillarData={canChi.hour} />
                        <Pillar title="Nhật Chủ" pillarData={canChi.day} isDayMaster={true} />
                        <Pillar title="Tháng Lệnh" pillarData={canChi.month} />
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
                                <div key={idx} className={`flex-shrink-0 flex flex-col items-center p-3 rounded-lg border-2 min-w-[80px] ${getBgColorClass(yunElem)}`}>
                                    <div className="text-xs font-bold text-gray-500 mb-2">{yun.startYear}</div>
                                    <div className={`text-xl font-black ${getColorClass(yunElem)}`}>{yun.gan}</div>
                                    <div className={`text-xl font-black ${getColorClass(branchElements[yun.zhi])}`}>{yun.zhi}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                )}

                {/* Ngũ Hành */}
                <div>
                    <h3 className="text-xl font-bold text-gray-800 border-l-4 border-cyan-500 pl-4 mb-6 uppercase">đánh giá ngũ hành</h3>
                    <div className="flex flex-wrap justify-between gap-4">
                        <ElementScore label="Kim" score={nguHanh.Kim} colorClass="text-slate-500" />
                        <ElementScore label="Mộc" score={nguHanh.Moc} colorClass="text-emerald-600" />
                        <ElementScore label="Thủy" score={nguHanh.Thuy} colorClass="text-blue-600" />
                        <ElementScore label="Hỏa" score={nguHanh.Hoa} colorClass="text-red-600" />
                        <ElementScore label="Thổ" score={nguHanh.Tho} colorClass="text-amber-700" />
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Phân tích luận giải */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Cường Nhược */}
                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                        <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2 uppercase">
                            <span className="w-2 h-6 bg-blue-600 rounded"></span> Phân Tích Cách Cục
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <span className="font-bold text-gray-600">Trạng Thái Nhật Chủ</span>
                                <span className="text-xl font-black text-rose-600">{formatThan(analysis.than)}</span>
                            </div>

                            {analysis.than === 'tong_cach' && (
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                    <span className="font-bold text-gray-600">Loại Tòng Cách</span>
                                    <span className="text-lg font-bold text-purple-700">{analysis.tongCachType}</span>
                                </div>
                            )}

                            <div className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 ${getBgColorClass(dungThan).replace('bg-', 'border-l-').replace(/border-\w+-200/, '')}`}>
                                <span className="font-bold text-gray-600">Dụng Thần (Khuyên Dùng)</span>
                                <span className={`text-xl font-black uppercase tracking-widest ${getColorClass(dungThan)}`}>{formatElement(dungThan)}</span>
                            </div>

                            <div className={`flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border-l-4 ${getBgColorClass(hyThan).replace('bg-', 'border-l-').replace(/border-\w+-200/, '')}`}>
                                <span className="font-bold text-gray-600">Hỷ Thần (Phụ Trợ)</span>
                                <span className={`text-xl font-black uppercase tracking-widest ${getColorClass(hyThan)}`}>{formatElement(hyThan)}</span>
                            </div>
                        </div>
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
                                    <div key={relType} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                                        <span className="font-bold text-gray-700">{typeMap[relType] || relType}</span>
                                        <div className="flex gap-2">
                                            {arr.map((item, i) => (
                                                <span key={i} className={`px-3 py-1 font-bold text-sm rounded ${isBad ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
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

                {/* LUẬN GIẢI CHI TIẾT TỪ THẦY */}
                {interpretation && (
                    <div className="w-full mt-10 bg-gradient-to-br from-blue-50/60 to-slate-50/40 border border-blue-200 rounded-2xl shadow-lg p-6 md:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-800 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="flex items-center gap-3 mb-6 border-b border-blue-200 pb-4">
                            <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center shadow-md">
                                <BookOpen className="text-white" size={20} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Thầy Luận Giải Chi Tiết</h3>
                        </div>
                        <div className="prose prose-blue max-w-none text-gray-800 leading-relaxed font-medium">
                            <ReactMarkdown skipHtml={true}>{interpretation}</ReactMarkdown>
                        </div>
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
            {!interpretation && (
                <button
                    onClick={handleAILuanGiai}
                    disabled={isInterpreting}
                    className={`fixed bottom-[calc(96px+env(safe-area-inset-bottom,0px))] right-4 md:right-8 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 font-bold border ${isInterpreting ? 'bg-blue-100 border-blue-200 text-blue-500 cursor-not-allowed scale-95' : 'bg-gradient-to-r from-blue-800 to-slate-900 hover:from-blue-900 hover:to-stone-900 text-white border-blue-700 hover:scale-105 hover:shadow-blue-900/40'}`}
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
            )}

            {/* CONFIRMATION MODAL */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex justify-center items-center p-4">
                    <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-t-8 border-t-blue-800">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-800 opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                            <ScrollText className="text-blue-800" size={24} />
                            Thầy Luận Giải Bát Tự
                        </h3>
                        <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                            Bạn có muốn khởi động luận giải chi tiết lá số Bát Tự của mình không? Quá trình phân tích Tứ Trụ, cân bằng Ngũ Hành và dự thảo Đại Vận sẽ mất khoảng 15-25 giây.
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
