import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook quản lý toàn bộ vòng đời kết nối SSE Luận giải AI (Tiêu Chuẩn & Chuyên Sâu VIP)
 * Dùng chung cho cả 4 phân hệ: Bazi, Ziwei, Marriage, IChing.
 *
 * @param {Object} options
 * @param {string} [options.initialContent=''] - Nội dung luận giải ban đầu nếu đã có
 * @param {string} [options.initialMode='standard'] - Chế độ luận giải ban đầu ('standard' | 'vip')
 * @param {string} [options.scrollTargetId] - ID của DOM element cần tự động cuộn đến khi chunk đầu tiên xuất hiện
 */
export function useInterpretationStream({
  initialContent = '',
  initialMode = 'standard',
  scrollTargetId = null
} = {}) {
  const [interpretation, setInterpretation] = useState(initialContent);
  const [interpretationMode, setInterpretationMode] = useState(initialMode);
  const [isInterpreting, setIsInterpreting] = useState(false);

  // VIP Chapter Progress States
  const [vipChapter, setVipChapter] = useState(1);
  const [vipCompletedChapters, setVipCompletedChapters] = useState([]);
  const [vipActiveChapters, setVipActiveChapters] = useState([]);
  const [vipStreamingChapter, setVipStreamingChapter] = useState(null);
  const [vipStatusMessage, setVipStatusMessage] = useState('');
  const [isVipCompleted, setIsVipCompleted] = useState(false);
  const [streamError, setStreamError] = useState('');

  const abortControllerRef = useRef(null);
  const isInterpretingRef = useRef(false);

  // Đồng bộ nội dung nếu initialContent từ ngoài thay đổi
  useEffect(() => {
    // Không ghi đè nếu đang streaming hoặc vừa hoàn tất stream (đợi parent state cập nhật đồng bộ)
    if (isInterpretingRef.current) return;

    if (initialContent) {
      setInterpretation(initialContent);
      setInterpretationMode(initialMode || 'standard');
    } else {
      setInterpretation('');
      setInterpretationMode('standard');
    }
  }, [initialContent, initialMode]);

  // Dọn dẹp AbortController khi unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const abortStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isInterpretingRef.current = false;
    setIsInterpreting(false);
  }, []);

  const resetStream = useCallback(() => {
    abortStream();
    setInterpretation('');
    setInterpretationMode('standard');
    setVipChapter(1);
    setVipCompletedChapters([]);
    setVipActiveChapters([]);
    setVipStreamingChapter(null);
    setVipStatusMessage('');
    setIsVipCompleted(false);
    setStreamError('');
  }, [abortStream]);

  /**
   * Bắt đầu nhận luồng luận giải qua SSE
   * @param {Object} params
   * @param {string} params.streamUrl - URL endpoint POST nhận SSE
   * @param {Object} params.body - Payload gửi lên
   * @param {string} [params.token] - JWT token
   * @param {boolean} [params.isVip=false] - Chế độ VIP hay không
   * @param {Function} [params.onCreditDeduct] - Callback trừ point giao diện khi stream hoàn tất thành công
   */
  const startStream = useCallback(async ({
    streamUrl,
    body,
    token = null,
    isVip = false,
    onCreditDeduct = null
  }) => {
    if (!streamUrl) return;

    // Hủy stream cũ nếu đang chạy
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    isInterpretingRef.current = true;
    setIsInterpreting(true);
    setStreamError('');
    setInterpretation('');
    setInterpretationMode(isVip ? 'vip' : 'standard');
    setVipChapter(1);
    setVipCompletedChapters([]);
    setVipActiveChapters([]);
    setVipStreamingChapter(null);
    setVipStatusMessage(isVip ? 'Đang khởi động hệ thống phân tích...' : '');
    setIsVipCompleted(false);

    let currentText = '';
    let isStreamSuccessful = false;

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortCtrl.signal
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Lỗi kết nối từ máy chủ (HTTP ${response.status})`);
      }

      // Xử lý nếu server trả về JSON từ cache 0ms
      if (response.headers.get('content-type')?.includes('application/json')) {
        const json = await response.json();
        if (json.error) throw new Error(json.error);
        if (json.content) {
          currentText = json.content;
          setInterpretation(currentText);
          setInterpretationMode(json.mode || (isVip ? 'vip' : 'standard'));
          setIsVipCompleted(true);
          isStreamSuccessful = true;
          if (scrollTargetId) {
            setTimeout(() => {
              const element = document.getElementById(scrollTargetId);
              element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }
        }
      } else {
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
                  isStreamSuccessful = true;
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
                    setVipChapter(parsed.streamingChapterId);
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
                  if (parsed.meta) {
                    if (parsed.meta.chapter) {
                      setVipChapter(parsed.meta.chapter);
                      setVipStreamingChapter(parsed.meta.chapter);
                      setVipActiveChapters(prev => Array.from(new Set([...prev, parsed.meta.chapter])));
                    }
                    if (parsed.meta.status) {
                      setVipStatusMessage(parsed.meta.status);
                    }
                    if (parsed.meta.completedChapter) {
                      setVipCompletedChapters(prev => Array.from(new Set([...prev, parsed.meta.completedChapter])));
                    }
                  }
                  if (parsed.isCompleted || (parsed.stage === 'completed')) {
                    setIsVipCompleted(true);
                    isStreamSuccessful = true;
                  }

                  const textChunk = parsed.chunk !== undefined ? parsed.chunk : (parsed.delta !== undefined ? parsed.delta : '');
                  if (textChunk) {
                    const isFirstChunk = !currentText;
                    currentText += textChunk;
                    setInterpretation(currentText);

                    if (isFirstChunk && scrollTargetId) {
                      setTimeout(() => {
                        const element = document.getElementById(scrollTargetId);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }
                  }
                } catch (parseErr) {
                  if (parseErr.message.includes('bảo trì') || parseErr.message.includes('SAFETY') || parseErr.message.includes('luận giải') || parseErr.message.includes('quá tải')) {
                    throw parseErr;
                  }
                }
              }
            }
          }
        }
      }

      if (isStreamSuccessful || currentText.length > 50) {
        if (onCreditDeduct) {
          onCreditDeduct(currentText, isVip ? 'vip' : 'standard');
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Luồng bị hủy chủ động bởi người dùng
      } else {
        console.error('[useInterpretationStream] Error:', err);
        setStreamError(err.message || 'Hệ thống luận giải đang bận hoặc gặp lỗi. Vui lòng thử lại sau.');
      }
    } finally {
      setIsInterpreting(false);
      abortControllerRef.current = null;
      setTimeout(() => {
        isInterpretingRef.current = false;
      }, 800);
    }
  }, [scrollTargetId]);

  return {
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
    abortStream,
    resetStream
  };
}

export default useInterpretationStream;
