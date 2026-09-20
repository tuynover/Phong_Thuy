import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { getInterpretationStreamUrl, rateBazi, togglePublicCalculation, getBaziRecord } from '@/services/api';
import { AlertCircle, BookOpen, ScrollText, MessageCircle, ArrowDown, ArrowUp, Star, Crown } from 'lucide-react';
import AiChatWidget from '@/components/widgets/AiChatWidget';
import InterpretationTierModal from '@/components/modals/InterpretationTierModal';
import VipUpgradeBanner from '@/components/widgets/VipUpgradeBanner';
import VipProgressTracker from '@/components/widgets/VipProgressTracker';
import { parseMarkdownSections } from '@/utils/markdownParser';
import SectionRenderer from '@/components/widgets/SectionRenderer';
import { TableOfContentsTrigger } from '@/components/widgets/TableOfContents';
import Tooltip from '@/components/common/Tooltip';
import FloatingNotificationToast from '@/components/common/FloatingNotificationToast';
import PdfExportModal from '@/components/modals/PdfExportModal';
import useInterpretationStream from '@/hooks/useInterpretationStream';
import useRecordRating from '@/hooks/useRecordRating';

import {
    getColorClass,
    getBgColorClass,
    formatThan,
    formatElement
} from '@/utils/astrologyHelpers';

import { getRemedyData } from '@/features/bazi/baziConstants';

import BaziProfileHeader from './components/BaziProfileHeader';
import BaziPillarsTable from './components/BaziPillarsTable';
import BaziDaiYunTimeline from './components/BaziDaiYunTimeline';
import BaziFiveElementsChart from './components/BaziFiveElementsChart';
import BaziRemedyAndRelations from './components/BaziRemedyAndRelations';
import ThapThanStrengthTable from './components/ThapThanStrengthTable';

const BaziBoard = ({ data: rawData, onUpdateData, onRequireLogin, onInvalidateHistory }) => {
    const { user, setUser, token } = useContext(AuthContext);

    // Unwrap nested baziData / analysisSnapshot if passing full DB record object
    const data = useMemo(() => {
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

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [activeConsultSection, setActiveConsultSection] = useState(null);
    const [showTierModal, setShowTierModal] = useState(false);
    const [isUpgradeModal, setIsUpgradeModal] = useState(false);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [uiError, setUiError] = useState('');

    const structureSectionRef = useRef(null);
    const prevIdRef = useRef(null);

    const {
        interpretation,
        setInterpretation,
        interpretationMode,
        setInterpretationMode,
        isInterpreting,
        vipChapter,
        vipCompletedChapters,
        vipActiveChapters,
        vipStreamingChapter,
        vipStatusMessage,
        isVipCompleted,
        streamError,
        setStreamError,
        startStream,
        resetStream
    } = useInterpretationStream({
        initialContent: data?.aiInterpretation?.content || '',
        initialMode: data?.aiInterpretation?.mode || 'standard',
        scrollTargetId: 'interpretation-section'
    });

    const error = uiError || streamError;
    const setError = (msg) => {
        setUiError(msg);
        setStreamError(msg);
    };

    const {
        rating,
        setRating,
        feedback,
        setFeedback,
        justRated,
        setJustRated,
        submitRating
    } = useRecordRating({
        recordId: data?.recordId || data?._id,
        initialRating: data?.rating || 0,
        initialFeedback: data?.feedback || '',
        onInvalidateHistory
    });

    // Auto-scroll to structure section on mobile & desktop & restore remote interpretation if cached
    useEffect(() => {
        const currentId = data?.recordId || data?._id;
        if (currentId && currentId !== prevIdRef.current) {
            prevIdRef.current = currentId;
            
            setTimeout(() => {
                if (structureSectionRef.current) {
                    structureSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    const el = document.getElementById('bazi-structure-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }

        if (!data?.aiInterpretation?.content && currentId) {
            getBaziRecord(currentId).then(res => {
                const remoteInterpretation = res.data?.aiInterpretation;
                if (remoteInterpretation?.content) {
                    setInterpretation(remoteInterpretation.content);
                    setInterpretationMode(remoteInterpretation.mode || 'standard');
                    if (onUpdateData) {
                        onUpdateData(prev => ({
                            ...(prev || data),
                            aiInterpretation: remoteInterpretation
                        }));
                    }
                }
            }).catch(() => {});
        }
    }, [data, onUpdateData, setInterpretation, setInterpretationMode]);

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

    const handleRatingSubmit = async (e) => {
        e.preventDefault();
        const success = await submitRating(rateBazi);
        if (success && onUpdateData) {
            onUpdateData({
                ...data,
                rating,
                feedback
            });
        }
    };

    const handleAILuanGiai = () => {
        if (!user) {
            if (onRequireLogin) onRequireLogin();
            return;
        }
        
        if (!data?.recordId) {
            alert("Lỗi: Lá số này chưa được lưu vào hệ thống, không thể luận giải.");
            return;
        }

        setIsUpgradeModal(false);
        setShowTierModal(true);
    };

    const triggerLuanGiai = async (tier = 'standard') => {
        setShowTierModal(false);
        setError('');

        const isVip = tier === 'vip';
        const isUpgrade = isUpgradeModal || (isVip && !!interpretation);
        const isAlreadyVip = data?.aiInterpretation?.mode === 'vip' && !!data?.aiInterpretation?.content;
        const isAlreadyStandard = !isVip && !!data?.aiInterpretation?.content;
        const isCacheHit = isAlreadyVip || isAlreadyStandard;
        const costToDeduct = isCacheHit ? 0 : (isUpgrade ? 400 : (isVip ? 500 : 100));

        const url = getInterpretationStreamUrl('bazi', data.recordId);
        await startStream({
            streamUrl: url,
            body: {
                userId: user?.id || user?._id || 'guest',
                mode: isVip ? 'vip' : 'standard'
            },
            token,
            isVip,
            onCreditDeduct: (newContent, newMode) => {
                if (onInvalidateHistory) onInvalidateHistory();
                const finalContent = newContent || interpretation;
                const finalMode = newMode || (isVip ? 'vip' : 'standard');
                if (onUpdateData) {
                    onUpdateData(prev => ({
                        ...(prev || data),
                        aiInterpretation: {
                            content: finalContent,
                            mode: finalMode
                        }
                    }));
                }
                if (user && user.role !== 'admin' && user.role !== 'co-admin') {
                    setUser(prev => {
                        if (!prev) return prev;
                        const updated = { ...prev, credits: Math.max(0, (prev.credits || 0) - costToDeduct) };
                        localStorage.setItem('user', JSON.stringify(updated));
                        return updated;
                    });
                }
            }
        });
    };

    if (!data) return null;

    const { 
        canChi = { year: {}, month: {}, day: {}, hour: {} }, 
        lunarYear = '', 
        nguHanh = {}, 
        analysis = {}, 
        dungThan = '', 
        hyThan = '', 
        daYun = [], 
        thapThanAnalysis = { groups: [] } 
    } = data;

    const effectiveDungThan = dungThan || data.dungThanInfo?.primary?.dungThan || analysis?.dungThan || '';
    const effectiveHyThan = hyThan || data.dungThanInfo?.primary?.hyThan || analysis?.hyThan || '';
    const remedyData = getRemedyData(effectiveDungThan);

    return (
        <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 max-w-[1240px] mx-auto my-4 md:my-10 font-sans pb-10">
            
            {/* Header thông tin bản mệnh & thao tác chia sẻ, xuất PDF */}
            <BaziProfileHeader
                data={data}
                user={user}
                isPublicState={isPublicState}
                handleTogglePublic={handleTogglePublic}
                setToastMsg={setToastMsg}
                setIsPdfModalOpen={setIsPdfModalOpen}
            />

            <div className="p-4 md:p-12 space-y-8 md:space-y-12">
                
                {/* Tứ Trụ */}
                <div id="bazi-pillars" className="scroll-mt-24">
                    <BaziPillarsTable
                        canChi={canChi}
                        lunarYear={lunarYear}
                        structureSectionRef={structureSectionRef}
                    />
                </div>

                {/* Nhịp Đại Vận & Lưu Niên */}
                <div id="bazi-dai-yun" className="scroll-mt-24">
                    <BaziDaiYunTimeline
                        daYun={daYun}
                        canChi={canChi}
                    />
                </div>

                {/* Ngũ Hành & Cách Cục Layout */}
                <div id="bazi-elements-cachcuc" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    {/* Ngũ Hành Diagram (Left Column) */}
                    <div className="lg:col-span-6 w-full flex flex-col">
                        <h3 className="text-xl font-bold text-gray-800 border-l-4 border-cyan-500 pl-4 mb-6 uppercase">Đánh Giá Ngũ Hành</h3>
                        <BaziFiveElementsChart scores={nguHanh} canChi={canChi} />
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
                <div id="bazi-thap-than" className="scroll-mt-24">
                    <ThapThanStrengthTable thapThanAnalysis={thapThanAnalysis} />
                </div>

                <hr className="border-gray-200" />

                {/* Lời Khuyên Cải Vận & Hóa Giải Hình Xung */}
                <div id="bazi-remedy" className="scroll-mt-24">
                    <BaziRemedyAndRelations remedyData={remedyData} relations={analysis.relations} />
                </div>

                {(interpretation || isInterpreting) && (
                    <div id="interpretation-section" className="w-full mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-3 mb-6 ml-1">
                            <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center shadow-md">
                                <BookOpen className="text-white" size={16} />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                                {interpretationMode === 'vip' ? 'Luận Giải Chuyên Sâu (6 Chương)' : 'Thầy Luận Giải Chi Tiết'}
                            </h3>
                        </div>

                        {/* Tracker 6 Chương */}
                        {interpretationMode === 'vip' && (
                            <VipProgressTracker
                                system="bazi"
                                recordData={data}
                                completedChapters={vipCompletedChapters}
                                activeChapters={vipActiveChapters}
                                streamingChapter={vipStreamingChapter}
                                currentChapter={vipChapter}
                                isCompleted={isVipCompleted || !isInterpreting}
                                statusMessage={vipStatusMessage}
                            />
                        )}

                        {isInterpreting && !interpretation && interpretationMode !== 'vip' && (
                            <div className="bg-blue-50/50 p-8 md:p-12 rounded-2xl border border-blue-200/60 shadow-xs text-center space-y-4 my-6 animate-in fade-in">
                                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-800 rounded-full animate-spin mx-auto"></div>
                                <p className="text-blue-900 font-bold text-base animate-pulse">
                                    Thầy Bát Tự đang đối chiếu dụng thần và phối mệnh...
                                </p>
                            </div>
                        )}

                        {interpretation && (
                            <SectionRenderer 
                                sections={parseMarkdownSections(interpretation, 'bazi')} 
                                theme="bazi" 
                                rawText={interpretation}
                                pageSections={[
                                    { id: 'bazi-pillars', title: 'Cấu Trúc Tứ Trụ' },
                                    { id: 'bazi-dai-yun', title: 'Lộ Trình Đại Vận & Lưu Niên' },
                                    { id: 'bazi-elements-cachcuc', title: 'Đánh Giá Ngũ Hành & Cách Cục' },
                                    { id: 'bazi-thap-than', title: 'Phân Bổ Thập Thần' },
                                    { id: 'bazi-remedy', title: 'Phương Pháp Dụng Thần' },
                                ]}
                                isChatOpen={isChatOpen}
                                onConsultSection={(sec) => {
                                    setActiveConsultSection(sec);
                                    setIsChatOpen(true);
                                }}
                            />
                        )}

                        {/* Banner Nâng Cấp VIP ở cuối bài luận giải thường */}
                        {interpretation && interpretationMode !== 'vip' && !isInterpreting && (
                            <div className="mt-8">
                                <VipUpgradeBanner
                                    userCredits={user?.credits || 0}
                                    onUpgradeClick={() => {
                                        setIsUpgradeModal(true);
                                        setShowTierModal(true);
                                    }}
                                />
                            </div>
                        )}

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
                            <span className="text-sm text-amber-300">
                                {interpretationMode === 'vip' ? (vipStatusMessage || `Đang Phân Tích C${vipChapter}...`) : 'Thầy luận giải Bát Tự...'}
                            </span>
                        </>
                    ) : (
                        <>
                            <ScrollText className="animate-pulse text-amber-400" size={20} />
                            <span className="hidden sm:inline">Thầy Luận Giải Bát Tự</span>
                        </>
                    )}
                </button>
            ) : !isChatOpen && user && (
                <div className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-50 flex flex-col items-end gap-2.5">
                    {/* Nút "Nâng Cấp Luận Giải" nằm ngay PHÍA TRÊN CÙNG nếu chưa có bản chuyên sâu */}
                    {interpretationMode !== 'vip' && (
                        <button
                            onClick={() => {
                                setIsUpgradeModal(true);
                                setShowTierModal(true);
                            }}
                            disabled={isInterpreting}
                            className="flex items-center gap-2 px-5 py-3 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-300/60 shadow-amber-500/30 hover:scale-105 active:scale-95 text-xs sm:text-sm uppercase tracking-wider ring-4 ring-amber-500/20"
                        >
                            <Crown className="w-4 h-4 fill-current animate-pulse text-slate-950" />
                            <span>Nâng Cấp Luận Giải</span>
                        </button>
                    )}

                    {/* Nút "Mục lục luận giải" ở dưới Nâng Cấp (hoặc trên cùng nếu đã VIP) */}
                    <TableOfContentsTrigger theme="bazi" />

                    {/* Nút "Hỏi Thêm Thầy" */}
                    <button
                        onClick={() => {
                            setActiveConsultSection(null);
                            setIsChatOpen(true);
                        }}
                        className="flex items-center gap-2.5 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 font-extrabold border bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 hover:from-blue-950 hover:to-indigo-950 text-amber-300 border-amber-400/40 shadow-blue-900/30 hover:scale-105 active:scale-95 text-xs sm:text-sm tracking-wider uppercase ring-4 ring-blue-500/20"
                    >
                        <MessageCircle className="animate-bounce text-amber-400 shrink-0" size={18} />
                        <span>Hỏi Thêm Thầy</span>
                    </button>
                </div>
            )}

            {(interpretation || data?.aiInterpretation?.content) && (data?.recordId || data?._id) && user && (
                <AiChatWidget 
                    type="bazi" 
                    recordId={data.recordId || data._id} 
                    userId={user?.id || user?._id} 
                    isOpen={isChatOpen}
                    setIsOpen={setIsChatOpen}
                    activeSection={activeConsultSection}
                    setActiveSection={setActiveConsultSection}
                />
            )}

            {/* FLOATING SCROLL BUTTONS */}
            <div className="fixed bottom-4 md:bottom-8 left-4 md:left-8 z-40 flex flex-col gap-1 pointer-events-auto bg-transparent border-none shadow-none">
                <button
                    onClick={() => window.scrollTo(0, 0)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent text-slate-400 hover:text-slate-700 active:scale-95 transition-all duration-300 shadow-none border-none pointer-events-auto"
                    title="Cuộn lên đầu trang"
                >
                    <ArrowUp size={24} />
                </button>
                <button
                    onClick={() => window.scrollTo(0, document.documentElement.scrollHeight)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-transparent text-slate-400 hover:text-slate-700 active:scale-95 transition-all duration-300 shadow-none border-none pointer-events-auto"
                    title="Cuộn xuống cuối trang"
                >
                    <ArrowDown size={24} />
                </button>
            </div>

            {/* TIER SELECTION / UPGRADE MODAL */}
            <InterpretationTierModal
                isOpen={showTierModal}
                onClose={() => setShowTierModal(false)}
                onConfirm={triggerLuanGiai}
                userCredits={user?.credits || 0}
                isAdmin={user?.role === 'admin' || user?.role === 'co-admin'}
                isUpgrade={isUpgradeModal}
                system="bazi"
                recordData={data}
            />
            {/* PDF EXPORT MODAL */}
            <PdfExportModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                system="bazi"
                recordId={data.recordId || data._id}
                recordData={data}
                hasInterpretation={Boolean(interpretation)}
                interpretationMode={interpretationMode}
                rawInterpretation={interpretation}
                onDownloadStart={(msg) => setToastMsg(msg)}
            />
            {toastMsg && <FloatingNotificationToast message={toastMsg} onClose={() => setToastMsg('')} />}
        </div>
    );
};

export default React.memo(BaziBoard);
