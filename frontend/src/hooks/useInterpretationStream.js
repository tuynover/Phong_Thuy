import { useState, useEffect, useRef, useCallback } from 'react';
import { getInterpretationStreamUrl } from '@/services/api';

/**
 * Custom hook managing the SSE streaming lifecycle for AI interpretations.
 * Supports standard single-pass streaming and VIP multi-chapter progression.
 */
export function useInterpretationStream({
    moduleType, // 'bazi' | 'ziwei' | 'marriage' | 'iching'
    recordId,
    initialInterpretation = '',
    initialMode = 'standard',
    token,
    user,
    setUser,
    onSuccess,
    loadingTexts = [
        "Đang phân tích dữ liệu...",
        "Đang tính toán ngũ hành...",
        "Đang tổng hợp luận giải..."
    ]
}) {
    const [interpretation, setInterpretation] = useState(initialInterpretation);
    const [interpretationMode, setInterpretationMode] = useState(initialMode);
    const [isInterpreting, setIsInterpreting] = useState(false);
    const [showTierModal, setShowTierModal] = useState(false);
    const [isUpgradeModal, setIsUpgradeModal] = useState(false);
    const [vipChapter, setVipChapter] = useState(1);
    const [vipCompletedChapters, setVipCompletedChapters] = useState([]);
    const [vipActiveChapters, setVipActiveChapters] = useState([]);
    const [vipStreamingChapter, setVipStreamingChapter] = useState(null);
    const [vipStatusMessage, setVipStatusMessage] = useState('');
    const [isVipCompleted, setIsVipCompleted] = useState(false);
    const [error, setError] = useState('');
    const [loadingStep, setLoadingStep] = useState(0);
    const [abortController, setAbortController] = useState(null);

    // Sync initial state when recordId or initial content changes
    useEffect(() => {
        setInterpretation(initialInterpretation || '');
        setInterpretationMode(initialMode || 'standard');
    }, [recordId, initialInterpretation, initialMode]);

    // Progressive loading steps transition
    useEffect(() => {
        let interval;
        if (isInterpreting) {
            setLoadingStep(0);
            interval = setInterval(() => {
                setLoadingStep(prev => (prev < loadingTexts.length - 1 ? prev + 1 : prev));
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [isInterpreting, loadingTexts.length]);

    // Auto-cancel active stream on unmount
    useEffect(() => {
        return () => {
            if (abortController) {
                abortController.abort();
            }
        };
    }, [abortController]);

    const handleCancelStream = useCallback(() => {
        if (abortController) {
            abortController.abort();
            setAbortController(null);
        }
        setIsInterpreting(false);
    }, [abortController]);

    const triggerLuanGiai = useCallback(async (tier = 'standard', extraPayload = {}) => {
        if (!recordId) {
            alert("Lỗi: Bản ghi chưa được lưu vào hệ thống, không thể luận giải.");
            return;
        }

        setShowTierModal(false);
        setIsInterpreting(true);
        setError('');

        const isVip = tier === 'vip';
        const isUpgrade = isUpgradeModal || (isVip && !!interpretation);
        const costToDeduct = isUpgrade ? 4 : (isVip ? 5 : 1);

        // 0ms Instant Reset
        setInterpretation('');
        setInterpretationMode(isVip ? 'vip' : 'standard');
        setVipChapter(1);
        setVipCompletedChapters([]);
        setVipActiveChapters([]);
        setVipStreamingChapter(null);
        setVipStatusMessage(isVip ? 'Đang khởi động hệ thống phân tích...' : '');
        setIsVipCompleted(false);

        const abortCtrl = new AbortController();
        setAbortController(abortCtrl);

        let currentText = "";
        try {
            const url = getInterpretationStreamUrl(moduleType, recordId);
            const headers = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: user?.id || user?._id || 'guest',
                    mode: isVip ? 'vip' : 'standard',
                    ...extraPayload
                }),
                signal: abortCtrl.signal
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Lỗi kết nối từ server (HTTP ${response.status})`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let done = false;
            let buffer = '';

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                if (value) {
                    buffer += decoder.decode(value, { stream: !done });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();
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
                                if (parsed.message) {
                                    setVipStatusMessage(parsed.message);
                                }
                                if (parsed.stage === 'streaming' && parsed.streamingChapterId) {
                                    setVipStreamingChapter(parsed.streamingChapterId);
                                }
                                if (parsed.chapterId) {
                                    setVipChapter(parsed.chapterId);
                                    if (parsed.status === 'completed') {
                                        setVipCompletedChapters(prev => prev.includes(parsed.chapterId) ? prev : [...prev, parsed.chapterId]);
                                        setVipActiveChapters(prev => prev.filter(id => id !== parsed.chapterId));
                                    } else if (parsed.status === 'in_progress') {
                                        setVipActiveChapters(prev => prev.includes(parsed.chapterId) ? prev : [...prev, parsed.chapterId]);
                                    }
                                }
                                if (parsed.isCompleted || (parsed.stage === 'completed')) {
                                    setIsVipCompleted(true);
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
                                if (e.message && (e.message.includes('SAFETY') || e.message.includes('luận giải') || e.message.includes('quá tải'))) {
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
            if (isVip) setIsVipCompleted(true);

            if (currentText && onSuccess) {
                onSuccess(currentText, isVip ? 'vip' : 'standard');
            }

            // Decrement credit locally for non-admin accounts
            if (user && user.role !== 'admin' && user.role !== 'co-admin' && setUser) {
                setUser(prev => {
                    if (!prev) return prev;
                    const updated = { ...prev, credits: Math.max(0, (prev.credits || 0) - costToDeduct) };
                    try {
                        localStorage.setItem('user', JSON.stringify(updated));
                    } catch (e) {}
                    return updated;
                });
            }
        }
    }, [
        recordId,
        isUpgradeModal,
        interpretation,
        moduleType,
        token,
        user,
        setUser,
        onSuccess
    ]);

    return {
        interpretation,
        setInterpretation,
        interpretationMode,
        setInterpretationMode,
        isInterpreting,
        setIsInterpreting,
        showTierModal,
        setShowTierModal,
        isUpgradeModal,
        setIsUpgradeModal,
        vipChapter,
        setVipChapter,
        vipCompletedChapters,
        setVipCompletedChapters,
        vipActiveChapters,
        setVipActiveChapters,
        vipStreamingChapter,
        setVipStreamingChapter,
        vipStatusMessage,
        setVipStatusMessage,
        isVipCompleted,
        setIsVipCompleted,
        error,
        setError,
        loadingStep,
        setLoadingStep,
        triggerLuanGiai,
        handleCancelStream
    };
}

export default useInterpretationStream;
