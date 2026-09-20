import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
    MessageCircle, X, Send, Clock, AlertTriangle, Sparkles, 
    User, AlertCircle, RefreshCw, Maximize2, Minimize2,
    Lightbulb, ChevronDown, ChevronUp, Layers, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { getChatStreamUrl, getHexagramChatMessages, getBaziChatMessages, getTuViChatMessages, getMarriageChatMessages } from '@/services/api';
import { AuthContext } from '@/context/AuthContext';

/**
 * Ngân hàng câu hỏi mẫu phong phú cho từng phân hệ học thuật (10 câu/phân hệ, phân loại theo chuyên đề/sự việc)
 */
const DISCIPLINE_QUESTIONS = {
    bazi: [
        { category: 'Sự Nghiệp', question: 'Công danh của tôi hợp làm chủ, tự kinh doanh hay làm chuyên môn trong tổ chức lớn?' },
        { category: 'Sự Nghiệp', question: 'Đại vận nào là giai đoạn hoàng kim bứt phá lớn nhất trong sự nghiệp của tôi?' },
        { category: 'Tài Chính', question: 'Lá số của tôi có số tích lũy được tài sản lớn không, hay hay gặp hạn hao hụt tiền bạc?' },
        { category: 'Tài Chính', question: 'Tôi có phù hợp với đầu tư tài chính mạo hiểm không hay nên ưu tiên phòng thủ tích lũy an toàn?' },
        { category: 'Hôn Nhân', question: 'Cung Phu Thê của tôi có gặp hình xung khắc hại nào không, cách hóa giải gia đạo ra sao?' },
        { category: 'Hôn Nhân', question: 'Mốc năm nào tôi dễ gặp biến động hoặc bước ngoặt lớn về mặt tình cảm?' },
        { category: 'Sức Khỏe', question: 'Bát tự của tôi vượng hành gì và khuyết hành gì, ảnh hưởng tới cơ quan tạng phủ nào nhất?' },
        { category: 'Sức Khỏe', question: 'Chế độ sinh hoạt và dinh dưỡng theo ngũ hành nào giúp tôi tăng cường sinh khí?' },
        { category: 'Cải Vận', question: 'Dụng Thần của tôi hợp với màu sắc, số may mắn và phương vị làm việc nào nhất?' },
        { category: 'Cải Vận', question: 'Tôi nên sử dụng vật phẩm phong thủy chất liệu gì để tương sinh Dụng Thần và trợ lực quý nhân?' }
    ],
    ziwei: [
        { category: 'Mệnh & Thân', question: 'Bộ chính tinh đắc hãm ở Cung Mệnh nói lên tiềm năng và sứ mệnh cốt lõi nào của tôi?' },
        { category: 'Mệnh & Thân', question: 'Thân cư ở cung nào và sau tuổi 30 vận mệnh cuộc đời tôi sẽ chuyển biến theo hướng nào?' },
        { category: 'Quan Lộc', question: 'Công việc hiện tại có phát huy đúng sở trường của các cát tinh trong cung Quan Lộc không?' },
        { category: 'Tài Bạch', question: 'Cung Tài Bạch có gặp Tuần, Triệt hay Hóa Lộc không, tiền tài đến từ nguồn nào là chủ yếu?' },
        { category: 'Phu Thê', question: 'Bạn đời tương lai của tôi có tính cách, tướng mạo và hoàn cảnh gia đình như thế nào?' },
        { category: 'Tử Tức', question: 'Cung Tử Tức của tôi có sao cát tinh nào trợ lực cho đường con cái thành đạt hiển vinh không?' },
        { category: 'Phúc Đức', question: 'Phúc Đức dòng họ có che chở cho tôi khi gặp hoạn nạn, sóng gió cuộc đời không?' },
        { category: 'Đại Vận', question: 'Đại hạn 10 năm hiện tại của tôi rơi vào cung nào, là giai đoạn thuận buồm xuôi gió hay thử thách?' },
        { category: 'Tật Ách', question: 'Hạn năm nay tôi cần chú ý đề phòng bệnh tật hoặc tai ương sông nước, xe cộ gì?' },
        { category: 'Cải Vận', question: 'Bộ sao giải thần nào trong lá số giúp tôi hóa giải hung tinh và tai ách hiệu quả nhất?' }
    ],
    hexagrams: [
        { category: 'Thời Vận', question: 'Sự việc tôi đang toan tính có cơ hội thành công thuận lợi đúng như kỳ vọng không?' },
        { category: 'Thời Vận', question: 'Thời điểm cụ thể (ứng kỳ theo tháng hoặc ngày nào) sự việc này sẽ có kết quả rõ ràng?' },
        { category: 'Thời Vận', question: 'Thế quẻ hiện tại là nên chủ động tấn công bứt phá hay kiên nhẫn thủ thế chờ thời?' },
        { category: 'Quý Nhân', question: 'Trong công việc này tôi có gặp được quý nhân giúp đỡ hay có tiểu nhân cản trở ngấm ngầm?' },
        { category: 'Quý Nhân', question: 'Đối tác hoặc người cộng sự này có thật lòng đáng tin cậy để tôi gửi gắm niềm tin không?' },
        { category: 'Tài Lộc', question: 'Dự án / thương vụ đầu tư này có mang lại tài lộc thực tế hay tiềm ẩn nguy cơ chôn vốn?' },
        { category: 'Rủi Ro', question: 'Điểm rủi ro và cạm bẫy lớn nhất tôi cần đề phòng tuyệt đối trong việc này là gì?' },
        { category: 'Tình Duyên', question: 'Mối quan hệ này có duyên đi đến hôn nhân lâu dài không hay chỉ là đoạn duyên ngắn?' },
        { category: 'Tình Duyên', question: 'Nếu đang có hiểu lầm rạn nứt, tôi nên mở lời thế nào để hàn gắn lại tình cảm đôi bên?' },
        { category: 'Đạo Dịch', question: 'Lời khuyên Đạo Dịch thực tiễn nhất cho tôi ngay lúc này để chuyển hung thành cát?' }
    ],
    marriage: [
        { category: 'Tương Hợp', question: 'Điểm tương hợp tổng quan giữa hai tuổi theo Can Chi, Ngũ Hành và Cung Phi là bao nhiêu?' },
        { category: 'Tương Hợp', question: 'Hai tuổi kết hợp có phạm phải cung xấu như Tuyệt Mạng, Ngũ Quỷ hay Họa Hại không?' },
        { category: 'Kinh Tế', question: 'Sau khi kết hôn, đường làm ăn tài lộc của hai bên sẽ vượng phát lên hay dễ bị tiêu hao?' },
        { category: 'Kinh Tế', question: 'Trong gia đình ai là người nên nắm giữ tay hòm chìa khóa để tiền tài sinh sôi nảy nở?' },
        { category: 'Tính Cách', question: 'Điểm khác biệt lớn nhất về tính cách giữa hai người là gì và cần nhường nhịn ở khía cạnh nào?' },
        { category: 'Hòa Giải', question: 'Làm thế nào để hóa giải xung khắc khẩu khí và tránh những trận cãi vã vô cớ?' },
        { category: 'Con Cái', question: 'Hai vợ chồng nên sinh con vào năm nào, mệnh gì để làm cầu nối tương sinh hóa giải cho bố mẹ?' },
        { category: 'Năm Hạn', question: 'Mốc năm nào hai vợ chồng dễ gặp sóng gió hoặc thử thách hôn nhân nhất cần chủ động gắn kết?' },
        { category: 'Gia Đình', question: 'Mối quan hệ giữa hai bên gia đình nội ngoại có êm ấm và trợ lực cho đôi trẻ không?' },
        { category: 'Phong Thủy', question: 'Bí quyết bố trí phòng ngủ và hướng giường hợp mệnh hai vợ chồng để giữ lửa yêu thương?' }
    ]
};

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
                        const answerMatch = jsonContent.match(/"answer"\s*:\s*"([\s\S]*?)"/);
                        const answer = answerMatch ? answerMatch[1] : "";
                        
                        const timingMatch = jsonContent.match(/"timing"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const timing = timingMatch ? (timingMatch[1] || null) : null;
                        
                        const riskMatch = jsonContent.match(/"risk"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const risk = riskMatch ? (riskMatch[1] || null) : null;

                        const dosMatch = jsonContent.match(/"dos"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const dos = dosMatch ? (dosMatch[1] || null) : null;

                        const dontsMatch = jsonContent.match(/"donts"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const donts = dontsMatch ? (dontsMatch[1] || null) : null;
                        
                        const confidenceMatch = jsonContent.match(/"confidence"\s*:\s*([0-9.]+)/);
                        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.8;
                        
                        if (answer) {
                            return { answer, timing, risk, dos, donts, confidence };
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

const AiChatWidget = ({ 
    type, 
    recordId, 
    userId, 
    isOpen: externalIsOpen, 
    setIsOpen: setExternalIsOpen,
    activeSection,
    setActiveSection
}) => {
    const auth = useContext(AuthContext);
    const token = auth ? auth.token : localStorage.getItem('token');
    const [localIsOpen, setLocalIsOpen] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : localIsOpen;
    const setIsOpen = setExternalIsOpen !== undefined ? setExternalIsOpen : setLocalIsOpen;
    const isControlled = externalIsOpen !== undefined;

    useEffect(() => {
        window.dispatchEvent(new CustomEvent('ai-chat-state-change', { detail: { isOpen: Boolean(isOpen) } }));
    }, [isOpen]);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamText, setStreamText] = useState('');
    const [error, setError] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const [detectedContext, setDetectedContext] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    // Pagination & Lazy Loading States
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const chatEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const previousRecordIdRef = useRef(recordId);
    const inputRef = useRef(null);
    const streamAnswer = getStreamingAnswer(streamText);

    const isIching = type === 'hexagrams';
    const isBazi = type === 'bazi';
    const isTuVi = type === 'tu_vi' || type === 'ziwei';
    const isMarriage = type === 'marriage';
    
    const themeColor = isIching ? 'amber' : isBazi ? 'blue' : isMarriage ? 'rose' : 'purple';
    const themeBg = isIching 
        ? 'bg-amber-800 hover:bg-amber-900 text-white' 
        : isBazi 
            ? 'bg-blue-800 hover:bg-blue-900 text-white' 
            : isMarriage
                ? 'bg-rose-800 hover:bg-rose-905 text-white'
                : 'bg-purple-850 hover:bg-purple-900 text-white';
    const themeBorder = isIching 
        ? 'border-amber-100 focus:border-amber-500' 
        : isBazi 
            ? 'border-blue-100 focus:border-blue-500' 
            : isMarriage
                ? 'border-rose-100 focus:border-rose-500'
                : 'border-purple-100 focus:border-purple-500';
    const themeHeader = isIching 
        ? 'bg-amber-950 text-amber-50' 
        : isBazi 
            ? 'bg-blue-950 text-blue-50' 
            : isMarriage
                ? 'bg-rose-950 text-rose-50'
                : 'bg-purple-950 text-purple-50';

    // Ngân hàng câu hỏi cho phân hệ hiện tại
    const questionKey = isIching ? 'hexagrams' : isMarriage ? 'marriage' : isBazi ? 'bazi' : 'ziwei';
    const rawQuestionList = DISCIPLINE_QUESTIONS[questionKey] || DISCIPLINE_QUESTIONS.bazi;

    // Nếu người dùng đang tập trung vào một chương cụ thể, ưu tiên đưa 3 câu hỏi liên quan lên đầu
    const contextualQuestions = activeSection ? [
        { category: 'Chương Đang Xem', question: `Thầy phân tích sâu hơn về những điểm cốt lõi trong "${activeSection.title}" giúp con.` },
        { category: 'Chương Đang Xem', question: `Trong "${activeSection.title}", con cần phòng tránh rủi ro hay cạm bẫy gì nhất?` },
        { category: 'Chương Đang Xem', question: `Chiến lược hành động thực tế tối ưu cho "${activeSection.title}" là gì ạ?` }
    ] : [];

    const fullQuestionList = [...contextualQuestions, ...rawQuestionList];
    const categories = ['ALL', ...Array.from(new Set(fullQuestionList.map(q => q.category)))];
    const filteredQuestions = selectedCategory === 'ALL' 
        ? fullQuestionList 
        : fullQuestionList.filter(q => q.category === selectedCategory);

    const handleSelectSuggestion = (qText) => {
        setInput(qText);
        setShowSuggestions(false);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 50);
    };

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
                    : isMarriage
                        ? getMarriageChatMessages
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

    const handleSend = async (e, overrideQuestion = null) => {
        if (e && e.preventDefault) e.preventDefault();
        const question = (overrideQuestion || input || '').trim();
        if (!question || isStreaming || cooldown > 0) return;

        setInput('');
        setError('');
        
        // Optimistic User Message
        const userMsg = { 
            _id: Date.now().toString(), 
            role: 'user', 
            content: question,
            sectionId: activeSection?.id || null,
            sectionTitle: activeSection?.title || null
        };
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);
        setStreamText('');

        // Activate 10s cooldown
        setCooldown(10);

        try {
            const url = getChatStreamUrl(type, recordId);
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
                    question, 
                    userId,
                    activeSectionId: activeSection?.id || null 
                })
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
                            let parsed = null;
                            try {
                                parsed = JSON.parse(dataStr);
                            } catch (err) {
                                // JSON parsing error of non-JSON / partial chunk (safe to ignore)
                            }
                            if (parsed) {
                                if (parsed.error) {
                                    throw new Error(parsed.error);
                                }
                                if (parsed.type === 'context_meta') {
                                    setDetectedContext(parsed);
                                }
                                if (parsed.chunk) {
                                    currentText += parsed.chunk;
                                    setStreamText(currentText);
                                }
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
                dos: null,
                donts: null,
                confidence: 0.8
            };

            // Save AI Message
            const aiMsg = {
                _id: (Date.now() + 1).toString(),
                role: 'ai',
                content: JSON.stringify(parsedJson),
                sectionId: activeSection?.id || detectedContext?.activeSectionId || null,
                sectionTitle: activeSection?.title || detectedContext?.activeSectionTitle || null,
                structuredContent: {
                    answer: parsedJson.answer || finalCleaned,
                    timing: parsedJson.timing || null,
                    risk: parsedJson.risk || null,
                    dos: parsedJson.dos || null,
                    donts: parsedJson.donts || null,
                    confidence: parsedJson.confidence !== undefined ? parsedJson.confidence : 0.8
                }
            };

            setMessages(prev => [...prev, aiMsg]);
            setStreamText('');

            // Debits local user credits by 50 points to keep UI in sync
            if (auth && auth.user && auth.user.role !== 'admin' && auth.user.role !== 'co-admin') {
                const updatedUser = { ...auth.user, credits: Math.max(0, (auth.user.credits || 0) - 50) };
                if (auth.setUser) {
                    auth.setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            }

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
                    dos: parsedObj.dos || null,
                    donts: parsedObj.donts || null,
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
                    dos: msg.structuredContent.dos,
                    donts: msg.structuredContent.donts,
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
                dos: null,
                donts: null,
                confidence: null
            };
        }

        const isMeaningful = (val) => {
            if (!val) return false;
            let strVal = "";
            if (Array.isArray(val)) {
                if (val.length === 0) return false;
                strVal = val.join(" ");
            } else if (typeof val === 'object') {
                if (Object.keys(val).length === 0) return false;
                strVal = JSON.stringify(val);
            } else {
                strVal = String(val);
            }
            const cleaned = strVal.trim().toLowerCase();
            return cleaned !== "" && cleaned !== "null" && cleaned !== "none" && cleaned !== "không có" && cleaned !== "không";
        };

        const formatFieldSafe = (val) => {
            if (!val) return "";
            if (Array.isArray(val)) {
                return val.map(item => {
                    const cleanItem = String(item).trim().replace(/^[-*•\s+]+/, '');
                    return `- ${cleanItem}`;
                }).join('\n');
            }
            if (typeof val === 'object') {
                return JSON.stringify(val);
            }
            return String(val);
        };

        return (
            <div className="space-y-3 text-neutral-800 text-sm">
                <div className="markdown-content text-neutral-800 text-sm leading-relaxed">
                    <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{sc.answer}</ReactMarkdown>
                </div>

                {/* Render timing / risk if meaningful */}
                {isMeaningful(sc.timing) && (
                    <div className="flex gap-2.5 p-3 rounded-xl bg-teal-50/70 border border-teal-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Clock size={16} className="text-teal-700 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Ứng kỳ / Thời điểm cát lợi</div>
                            <div className="text-xs text-teal-900 font-medium mt-0.5 whitespace-pre-line leading-relaxed markdown-content">{formatFieldSafe(sc.timing)}</div>
                        </div>
                    </div>
                )}

                {isMeaningful(sc.risk) && (
                    <div className="flex gap-2.5 p-3 rounded-xl bg-orange-50/70 border border-orange-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AlertTriangle size={16} className="text-orange-700 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[11px] font-bold text-orange-800 uppercase tracking-wider">Cảnh báo / Điểm đề phòng</div>
                            <div className="text-xs text-orange-900 font-medium mt-0.5 whitespace-pre-line leading-relaxed markdown-content">{formatFieldSafe(sc.risk)}</div>
                        </div>
                    </div>
                )}

                {/* Render dos / donts if meaningful */}
                {isMeaningful(sc.dos) && (
                    <div className="flex gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Sparkles size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Khuyên nên làm</div>
                            <div className="text-xs text-emerald-900 font-medium mt-0.5 whitespace-pre-line leading-relaxed markdown-content">
                                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{formatFieldSafe(sc.dos)}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {isMeaningful(sc.donts) && (
                    <div className="flex gap-2.5 p-3 rounded-xl bg-rose-50/70 border border-rose-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <AlertTriangle size={16} className="text-rose-700 shrink-0 mt-0.5" />
                        <div>
                            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Tránh làm</div>
                            <div className="text-xs text-rose-900 font-medium mt-0.5 whitespace-pre-line leading-relaxed markdown-content">
                                <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{formatFieldSafe(sc.donts)}</ReactMarkdown>
                            </div>
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
                    className={`fixed bottom-4 sm:bottom-24 right-4 left-4 sm:left-auto sm:right-6 z-40 ${
                        isMaximized 
                            ? 'sm:w-[680px] h-[580px] sm:h-[620px]' 
                            : 'sm:w-[380px] h-[500px] sm:h-[520px]'
                    } max-h-[85vh] rounded-3xl shadow-2xl border border-gray-100 bg-white flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-12 fade-in`}
                >
                    {/* Header */}
                    <div className={`p-4 flex justify-between items-center ${themeHeader}`}>
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-full bg-white/10">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h4 className="font-serif font-bold text-sm">Phong Thủy Luận Giải</h4>
                                <p className="text-[10px] text-white/70">
                                    {auth && auth.user ? `Còn ${auth.user.credits !== undefined ? auth.user.credits : 0} Points (Trừ 50 Points/câu)` : 'Tham vấn sâu về Quẻ & Lá số'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setIsMaximized(!isMaximized)}
                                className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                                title={isMaximized ? "Thu nhỏ" : "Phóng to"}
                            >
                                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button 
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ACTIVE VIP CONTEXT BANNER */}
                    {(activeSection || (detectedContext && (detectedContext.activeSectionTitle || (detectedContext.matchedSections && detectedContext.matchedSections.length > 0)))) && (
                        <div className="px-3.5 py-2 bg-gradient-to-r from-amber-50/80 via-purple-50/80 to-blue-50/80 border-b border-purple-100 flex items-center justify-between text-xs animate-in fade-in duration-200">
                            <div className="flex items-center gap-1.5 min-w-0 pr-2 flex-wrap">
                                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse shrink-0" />
                                <span className="font-bold text-slate-800 shrink-0">
                                    {detectedContext?.matchedSections?.length > 1 && !activeSection ? 'Ngữ cảnh đa chiều:' : 'Ngữ cảnh:'}
                                </span>
                                {activeSection ? (
                                    <span className="truncate font-semibold text-purple-700" title={activeSection.title}>
                                        {activeSection.title}
                                    </span>
                                ) : detectedContext?.matchedSections?.length > 1 ? (
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {detectedContext.matchedSections.map((sec, idx) => (
                                            <span 
                                                key={sec.id || idx} 
                                                className="inline-block bg-purple-100/90 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full truncate max-w-[130px]" 
                                                title={sec.title}
                                            >
                                                {sec.title.replace(/^Cụm \d+:\s*/i, '')}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="truncate font-semibold text-purple-700" title={detectedContext?.activeSectionTitle}>
                                        {detectedContext?.activeSectionTitle}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (setActiveSection) setActiveSection(null);
                                    setDetectedContext(null);
                                }}
                                className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 ml-1"
                                title="Xóa ngữ cảnh (quay về đàm đạo toàn cảnh lá số)"
                            >
                                <X size={13} />
                            </button>
                        </div>
                    )}

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
                                        : (isIching ? 'bg-amber-100 text-amber-900' : isMarriage ? 'bg-rose-100 text-rose-900' : isBazi ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900')
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
                                        <div>
                                            {msg.sectionTitle && (
                                                <div className="mb-1.5 pb-1 border-b border-neutral-700 flex items-center gap-1 text-[11px] font-semibold text-amber-300">
                                                    <span className="opacity-80">📌</span>
                                                    <span className="truncate max-w-[220px]" title={msg.sectionTitle}>{msg.sectionTitle}</span>
                                                </div>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {msg.sectionTitle && (
                                                <div className="mb-1.5 pb-1 border-b border-gray-100 flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                                                    <span className="opacity-80">📌</span>
                                                    <span className="truncate max-w-[220px]" title={msg.sectionTitle}>{msg.sectionTitle}</span>
                                                </div>
                                            )}
                                            {renderAiMessage(msg)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* STREAMING BUBBLE */}
                        {isStreaming && (
                            <div className="flex gap-2 max-w-[85%] mr-auto">
                                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                                    isIching ? 'bg-amber-100 text-amber-900' : isMarriage ? 'bg-rose-100 text-rose-900' : isBazi ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'
                                }`}>
                                    <Sparkles size={13} className="animate-spin" />
                                </div>
                                <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-tl-none space-y-2">
                                    {streamAnswer ? (
                                        <div className="markdown-content text-sm text-neutral-800 leading-relaxed">
                                            <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{streamAnswer}</ReactMarkdown>
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

                    {/* Ngân Hàng Câu Hỏi Gợi Ý (Chỉ mở khi người dùng chủ động bấm) */}
                    {showSuggestions && !isStreaming && (
                        <div className="border-t border-gray-200 bg-slate-50/95 backdrop-blur-md p-3 max-h-56 sm:max-h-64 flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/80">
                                <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wider">
                                    <Lightbulb size={14} className="text-amber-500" />
                                    <span>Gợi ý câu hỏi đàm đạo ({filteredQuestions.length})</span>
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setShowSuggestions(false)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-200/60 cursor-pointer"
                                    title="Đóng bảng gợi ý"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Category Filter Badges */}
                            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar shrink-0">
                                {categories.map((cat, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                                            selectedCategory === cat 
                                                ? 'bg-amber-600 text-white shadow-2xs' 
                                                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                                        }`}
                                    >
                                        {cat === 'ALL' ? 'Tất cả' : cat}
                                    </button>
                                ))}
                            </div>

                            {/* Scrollable Question Items */}
                            <div className="overflow-y-auto space-y-1.5 pr-1 custom-scrollbar flex-1">
                                {filteredQuestions.map((qObj, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectSuggestion(qObj.question)}
                                        className="p-2 rounded-xl bg-white hover:bg-amber-50/70 border border-slate-200 hover:border-amber-400 transition-all cursor-pointer group shadow-2xs flex flex-col gap-0.5"
                                        title="Bấm để đưa câu hỏi vào khung chat"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                                                qObj.category === 'Chương Đang Xem' 
                                                    ? 'bg-amber-100 text-amber-800' 
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {qObj.category}
                                            </span>
                                            <span className="text-[10px] text-slate-400 group-hover:text-amber-700 transition-colors ml-auto font-medium">
                                                Chọn câu này ↵
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-800 font-medium leading-snug group-hover:text-amber-950">
                                            {qObj.question}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Suggestion Toggle Bar */}
                    {!isStreaming && (
                        <div className="px-3 py-1.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-xs">
                            <button
                                type="button"
                                onClick={() => setShowSuggestions(prev => !prev)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                    showSuggestions
                                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                                }`}
                            >
                                <Lightbulb size={13} className={showSuggestions ? "text-amber-600 animate-pulse" : "text-amber-500"} />
                                <span>{showSuggestions ? 'Thu gọn gợi ý' : `💡 Gợi ý câu hỏi (${fullQuestionList.length})`}</span>
                                {showSuggestions ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                            </button>

                            {activeSection && (
                                <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 font-semibold truncate max-w-[150px]">
                                    📌 {activeSection.title}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer Input */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={cooldown > 0 ? `Chờ ${cooldown}s...` : "Nhập câu hỏi hoặc chọn từ gợi ý..."}
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
                            title="Gửi câu hỏi"
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
