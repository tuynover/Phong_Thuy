import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageCircle, X, Send, Clock, AlertTriangle, Sparkles, 
    User, AlertCircle, RefreshCw 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { getChatStreamUrl, getHexagramChatMessages, getBaziChatMessages, getTuViChatMessages } from '../services/api';

/**
 * Robust incremental JSON parser to extract the "answer" field in real-time as it streams.
 */
function getStreamingAnswer(text) {
    if (!text) return "";
    let cleaned = text.trim();
    // Strip markdown code block wrappers if any
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '');
    
    const answerKeyIndex = cleaned.indexOf('"answer"');
    if (answerKeyIndex === -1) {
        // Fallback: If it doesn't look like JSON yet, return empty
        if (cleaned.length > 0 && !cleaned.startsWith('{')) {
            return cleaned;
        }
        return "";
    }
    
    // Find the colon after "answer"
    const afterAnswerKey = cleaned.slice(answerKeyIndex + 8);
    const colonIndex = afterAnswerKey.indexOf(':');
    if (colonIndex === -1) return "";
    
    // Find the starting quote of the string value
    const afterColon = afterAnswerKey.slice(colonIndex + 1);
    const quoteStartIndex = afterColon.indexOf('"');
    if (quoteStartIndex === -1) return "";
    
    const answerValue = afterColon.slice(quoteStartIndex + 1);
    let answerText = "";
    let escaped = false;
    
    for (let i = 0; i < answerValue.length; i++) {
        const char = answerValue[i];
        if (escaped) {
            if (char === 'n') answerText += '\n';
            else if (char === 't') answerText += '\t';
            else if (char === 'r') answerText += '\r';
            else answerText += char;
            escaped = false;
        } else if (char === '\\') {
            escaped = true;
        } else if (char === '"') {
            break; // End of string value
        } else {
            answerText += char;
        }
    }
    return answerText;
}

/**
 * Super robust JSON parser to parse final Gemini outputs even with backticks, raw newlines, or unescaped quotes.
 */
function robustParseJSON(text) {
    if (!text) return null;
    const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
    
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        // Try to replace raw newlines within double quotes
        try {
            const escaped = cleaned.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, p1) => {
                return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
            });
            return JSON.parse(escaped);
        } catch (e2) {
            // Regex fallback to extract specific fields
            try {
                const match = cleaned.match(/\{[\s\S]*\}/);
                if (match) {
                    const jsonContent = match[0];
                    try {
                        return JSON.parse(jsonContent);
                    } catch (e3) {
                        const answerMatch = jsonContent.match(/"answer"\s*:\s*"([\s\S]*?)"\s*,\s*"timing"/);
                        const answer = answerMatch ? answerMatch[1] : "";
                        
                        const timingMatch = jsonContent.match(/"timing"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const timing = timingMatch ? (timingMatch[1] || null) : null;
                        
                        const riskMatch = jsonContent.match(/"risk"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const risk = riskMatch ? (riskMatch[1] || null) : null;
                        
                        const confidenceMatch = jsonContent.match(/"confidence"\s*:\s*([0-9.]+)/);
                        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8;
                        
                        if (answer) {
                            return { answer, timing, risk, confidence };
                        }
                    }
                }
            } catch (e4) {
                // Ignore
            }
        }
    }
    return null;
}

const AiChatWidget = ({ type, recordId, userId, isOpen: externalIsOpen, setIsOpen: setExternalIsOpen }) => {
    const [localIsOpen, setLocalIsOpen] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : localIsOpen;
    const setIsOpen = setExternalIsOpen !== undefined ? setExternalIsOpen : setLocalIsOpen;
    const isControlled = externalIsOpen !== undefined;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamText, setStreamText] = useState('');
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // Pagination & Lazy Loading States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const chatEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const previousRecordIdRef = useRef(recordId);
    const streamAnswer = getStreamingAnswer(streamText);

    const isIching = type === 'hexagrams';
    const isBazi = type === 'bazi';
    const isTuVi = type === 'tu_vi';
    
    const themeColor = isIching ? 'amber' : isBazi ? 'blue' : 'purple';
    const themeBg = isIching 
        ? 'bg-amber-800 hover:bg-amber-900 text-white' 
        : isBazi 
            ? 'bg-blue-800 hover:bg-blue-900 text-white' 
            : 'bg-purple-850 hover:bg-purple-900 text-white';
    const themeBorder = isIching 
        ? 'border-amber-100 focus:border-amber-500' 
        : isBazi 
            ? 'border-blue-100 focus:border-blue-500' 
            : 'border-purple-100 focus:border-purple-500';
    const themeHeader = isIching 
        ? 'bg-amber-950 text-amber-50' 
        : isBazi 
            ? 'bg-blue-950 text-blue-50' 
            : 'bg-purple-950 text-purple-50';

    // Fetch history page helper
    const fetchHistoryPage = async (pageNum, isInitial = false) => {
        if (isLoadingHistory || !recordId) return;
        setIsLoadingHistory(true);
        setError('');
        try {
            const apiCall = isIching 
                ? getHexagramChatMessages 
                : isBazi 
                    ? getBaziChatMessages 
                    : getTuViChatMessages;
            const res = await apiCall(recordId, pageNum, 20);
            const { messages: fetchedMessages, hasMore: moreAvailable } = res.data;

            if (isInitial) {
                setMessages(fetchedMessages);
                setPage(1);
                setTimeout(() => {
                    chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
                }, 50);
            } else {
                const container = messagesContainerRef.current;
                const oldScrollHeight = container ? container.scrollHeight : 0;
                const oldScrollTop = container ? container.scrollTop : 0;

                setMessages(prev => [...fetchedMessages, ...prev]);
                setPage(pageNum);

                setTimeout(() => {
                    if (container) {
                        const newScrollHeight = container.scrollHeight;
                        container.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;
                    }
                }, 30);
            }
            setHasMore(moreAvailable);
        } catch (err) {
            console.error("Lỗi khi tải lịch sử trò chuyện:", err);
            setError("Không thể tải lịch sử trò chuyện.");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Reset when recordId changes
    useEffect(() => {
        if (recordId !== previousRecordIdRef.current) {
            setMessages([]);
            setPage(1);
            setHasMore(false);
            previousRecordIdRef.current = recordId;
        }
    }, [recordId]);

    // Load initial history when opened
    useEffect(() => {
        if (isOpen && messages.length === 0 && recordId) {
            fetchHistoryPage(1, true);
        }
    }, [isOpen, recordId]);

    // Auto scroll to bottom
    useEffect(() => {
        if (page === 1 && isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, streamAnswer, isOpen, page]);

    // Cooldown timer effect
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    // Scroll up handler
    const handleScroll = (e) => {
        const container = e.currentTarget;
        if (container.scrollTop === 0 && hasMore && !isLoadingHistory && !isStreaming) {
            fetchHistoryPage(page + 1, false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isStreaming || cooldown > 0) return;

        const question = input.trim();
        setInput('');
        setError('');
        
        // Optimistic User Message
        const userMsg = { _id: Date.now().toString(), role: 'user', content: question };
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);
        setStreamText('');

        // Activate 10s cooldown
        setCooldown(10);

        try {
            const url = getChatStreamUrl(type, recordId);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question, userId })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `Lỗi kết nối từ máy chủ (HTTP ${response.status})`);
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
                        // Ignore keep-alive pings
                        if (trimmed.startsWith('event: ping')) continue;
                        
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
                                    setStreamText(currentText);
                                }
                            } catch (err) {
                                // JSON parsing error of individual chunk (usually safe to ignore)
                            }
                        }
                    }
                }
            }

            // Parse final accumulated JSON output using super robust parser
            const finalCleaned = (streamText || currentText || "").trim();
            const parsedObj = robustParseJSON(finalCleaned);
            const parsedJson = parsedObj || {
                answer: finalCleaned,
                timing: null,
                risk: null,
                confidence: 0.8
            };

            // Save AI Message
            const aiMsg = {
                _id: (Date.now() + 1).toString(),
                role: 'ai',
                content: JSON.stringify(parsedJson),
                structuredContent: {
                    answer: parsedJson.answer || finalCleaned,
                    timing: parsedJson.timing || null,
                    risk: parsedJson.risk || null,
                    confidence: parsedJson.confidence !== undefined ? parsedJson.confidence : 0.8
                }
            };

            setMessages(prev => [...prev, aiMsg]);
            setStreamText('');

        } catch (err) {
            console.error("Chat Stream Error:", err);
            setError(err.message || 'Lỗi xảy ra trong quá trình truyền dữ liệu.');
            // Remove the optimistic user message if it failed immediately before stream
            if (streamText === '') {
                setMessages(prev => prev.filter(m => m._id !== userMsg._id));
            }
        } finally {
            setIsStreaming(false);
        }
    };

    const renderAiMessage = (msg) => {
        let sc = null;
        
        // 1. Try to parse from msg.content first if it looks like a JSON string
        if (msg.content && msg.content.trim().startsWith('{') && msg.content.trim().endsWith('}')) {
            const parsedObj = robustParseJSON(msg.content);
            if (parsedObj) {
                sc = {
                    answer: parsedObj.answer || "",
                    timing: parsedObj.timing || null,
                    risk: parsedObj.risk || null,
                    confidence: parsedObj.confidence !== undefined ? parsedObj.confidence : null
                };
            }
        }
        
        // 2. Fallback to msg.structuredContent if parsing failed or didn't yield an answer
        if (!sc || !sc.answer) {
            if (msg.structuredContent && msg.structuredContent.answer) {
                sc = {
                    answer: msg.structuredContent.answer,
                    timing: msg.structuredContent.timing,
                    risk: msg.structuredContent.risk,
                    confidence: msg.structuredContent.confidence
                };
            }
        }
        
        // 3. Absolute fallback: use msg.content as the answer directly
        if (!sc || !sc.answer) {
            sc = {
                answer: msg.content || "",
                timing: null,
                risk: null,
                confidence: null
            };
        }

        const confidencePercent = sc.confidence ? Math.round(sc.confidence * 100) : null;

        return (
            <div className="space-y-3 text-neutral-800 text-sm">
                <div className="prose max-w-none prose-sm leading-relaxed">
                    <ReactMarkdown>{sc.answer}</ReactMarkdown>
                </div>

                {/* Timing Card */}
                {sc.timing && (
                    <div className="flex gap-2.5 p-3 rounded-xl bg-teal-50/70 border border-teal-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Clock size={16} className="text-teal-700 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Ứng kỳ / Thời điểm cát lợi</div>
                            <div className="text-xs text-teal-900 font-medium mt-0.5">{sc.timing}</div>
                        </div>
                    </div>
                )}

                {/* Risk Card */}
                {sc.risk && (
                    <div className="flex gap-2.5 p-3 rounded-xl bg-orange-50/70 border border-orange-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AlertTriangle size={16} className="text-orange-700 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">Cảnh báo / Điểm đề phòng</div>
                            <div className="text-xs text-orange-900 font-medium mt-0.5">{sc.risk}</div>
                        </div>
                    </div>
                )}

            </div>
        );
    };

    return (
        <div className="relative">
            {/* FLOATING ACTION BUTTON (FAB) */}
            {!isControlled && (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 border border-white/10 font-extrabold text-xs tracking-wider uppercase ${themeBg}`}
                    title="Hỏi thêm về quẻ/lá số này"
                >
                    {isOpen ? (
                        <>
                            <X size={18} />
                            <span>Đóng Chat</span>
                        </>
                    ) : (
                        <>
                            <MessageCircle size={18} className="animate-bounce" />
                            <span>Hỏi Thêm Thầy</span>
                        </>
                    )}
                </button>
            )}

            {/* CHAT BOX CONTAINER */}
            {isOpen && (
                <div 
                    className={`fixed bottom-4 sm:bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-40 w-auto sm:w-[380px] h-[500px] sm:h-[520px] max-h-[85vh] rounded-3xl shadow-2xl border border-gray-100 bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 fade-in duration-300`}
                >
                    {/* Header */}
                    <div className={`p-4 flex justify-between items-center ${themeHeader}`}>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-white/10">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h4 className="font-serif font-bold text-sm">Phong Thủy Luận Giải</h4>
                                <p className="text-[10px] text-white/70">Tham vấn sâu về Quẻ Dịch & Lá số</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages Panel */}
                    <div 
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50"
                    >
                        {isLoadingHistory && page > 1 && (
                            <div className="flex justify-center py-2 animate-pulse">
                                <RefreshCw size={14} className="animate-spin text-neutral-500" />
                            </div>
                        )}

                        {messages.length === 0 && !isStreaming && !isLoadingHistory && (
                            <div className="text-center py-16 px-6 space-y-3">
                                <div className="inline-block p-3 rounded-full bg-amber-50 text-amber-800">
                                    <Sparkles size={28} />
                                </div>
                                <h5 className="font-bold text-sm text-neutral-800">Bạn muốn thắc mắc gì thêm?</h5>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Hãy đặt câu hỏi sâu hơn về ứng kỳ, phương hướng cải mệnh, hoặc băn khoăn cụ thể liên quan tới quẻ/lá số này để Thầy Dịch Giải chi tiết thêm.
                                </p>
                            </div>
                        )}

                        {messages.length === 0 && !isStreaming && isLoadingHistory && page === 1 && (
                            <div className="text-center py-24 flex flex-col items-center justify-center gap-2">
                                <RefreshCw size={24} className="animate-spin text-amber-600" />
                                <span className="text-xs text-gray-400 font-medium">Đang tải lịch sử trò chuyện...</span>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div 
                                key={msg._id} 
                                className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                            >
                                {/* Avatar */}
                                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                                    msg.role === 'user' 
                                        ? 'bg-neutral-200 text-neutral-700' 
                                        : (isIching ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900')
                                }`}>
                                    {msg.role === 'user' ? <User size={13} /> : <Sparkles size={13} />}
                                </div>

                                {/* Bubble */}
                                <div className={`p-3.5 rounded-2xl ${
                                    msg.role === 'user' 
                                        ? 'bg-neutral-800 text-white rounded-tr-none' 
                                        : 'bg-white border border-gray-100 shadow-sm rounded-tl-none'
                                }`}>
                                    {msg.role === 'user' ? (
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    ) : (
                                        renderAiMessage(msg)
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* STREAMING BUBBLE */}
                        {isStreaming && (
                            <div className="flex gap-2 max-w-[85%] mr-auto">
                                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                                    isIching ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
                                }`}>
                                    <Sparkles size={13} className="animate-spin" />
                                </div>
                                <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-tl-none space-y-2">
                                    {streamAnswer ? (
                                        <div className="prose max-w-none prose-sm text-sm text-neutral-800 leading-relaxed">
                                            <ReactMarkdown>{streamAnswer}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium py-1">
                                            <RefreshCw size={12} className="animate-spin" />
                                            Đang lập luận mệnh lý...
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-800 items-start">
                                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div ref={chatEndRef} />
                    </div>

                    {/* Footer Input */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={cooldown > 0 ? `Chờ ${cooldown}s...` : "Đặt câu hỏi thắc mắc..."}
                            disabled={isStreaming || cooldown > 0}
                            className={`flex-1 text-sm px-4 py-2.5 rounded-full border bg-gray-50/50 outline-none transition-colors ${themeBorder} disabled:opacity-50`}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isStreaming || cooldown > 0}
                            className={`p-2.5 rounded-full shadow-md flex items-center justify-center transition-all ${
                                !input.trim() || isStreaming || cooldown > 0
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                    : themeBg
                            }`}
                        >
                            <Send size={15} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AiChatWidget;
