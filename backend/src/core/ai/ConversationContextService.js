const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const logger = require('../services/LoggerService');
const console = {
    log: (msg, ...args) => logger.info(args.length ? `${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}` : msg),
    warn: (msg, ...args) => logger.warn(args.length ? `${msg} ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}` : msg),
    error: (msg, ...args) => {
        const err = args.find(a => a instanceof Error);
        const otherArgs = args.filter(a => !(a instanceof Error));
        const finalMsg = otherArgs.length ? `${msg} ${otherArgs.join(' ')}` : msg;
        logger.error(finalMsg, err || null);
    }
};

class ConversationContextService {
    /**
     * Intent Filter: Checks if a follow-up query is related to divination, life path, decisions, daily planning, or weather.
     * Rejects generic programming, IT, math homework, or other completely unrelated academic topics.
     * Note: "Thời tiết" is allowed because people can query "mai có mưa không", "thời tiết mai thế nào" to plan actions.
     */
    /**
     * Chuẩn hóa văn bản tiếng Việt phục vụ phân tích ý định và tìm kiếm ngữ nghĩa
     */
    static normalizeText(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .toLowerCase()
            .trim()
            .normalize('NFC')
            .replace(/[.,?!:;'"()\[\]{}]/g, ' ')
            .replace(/\s+/g, ' ');
    }

    /**
     * Tách từ (Tokenize) sinh unigram và bigram
     */
    static tokenize(text) {
        const clean = this.normalizeText(text);
        if (!clean) return [];
        const words = clean.split(' ').filter(w => w.length > 0);
        const tokens = [...words];
        for (let i = 0; i < words.length - 1; i++) {
            tokens.push(`${words[i]} ${words[i + 1]}`);
        }
        return tokens;
    }

    /**
     * Intent Filter Đa Lớp (Weighted Intent Scoring Guardrail):
     * Kiểm tra câu hỏi của người dùng có liên quan đến mệnh lý, định hướng cuộc sống,
     * tâm lý trăn trở, quyết định nhân sinh hoặc thời tiết để lập kế hoạch.
     * Chặn đứng 100% câu hỏi lập trình, học thuật thuần túy hoặc Jailbreak lồng phong thủy.
     */
    static isDivinationRelated(question) {
        if (!question || typeof question !== 'string') return false;
        const q = question.toLowerCase().trim().normalize('NFC');

        // 1. Chặn đứng các mẫu Jailbreak / Lập trình / Học thuật thuần túy
        const severeBlockPatterns = [
            /\b(viết|tạo|build)\s*(code|hàm|function|script|chương trình|thuật toán|api|app)\b/i,
            /\b(fix|sửa)\s*(lỗi|bug|code|lỗi cú pháp)\b/i,
            /\b(react|angular|vuejs|nextjs|nodejs|python|javascript|typescript|golang|java|c\+\+|sql|database|docker|kubernetes|html|css)\b/i,
            /\b(giải|làm)\s*(bài tập|toán|lý|hóa|ngữ pháp|đề thi)\b/i,
            /\b(dịch|translate)\s*(câu này|đoạn này|sang tiếng)\b/i,
            /\b(viết|generate)\s*(prompt|sql query)\b/i
        ];

        for (const pattern of severeBlockPatterns) {
            if (pattern.test(q)) {
                return false;
            }
        }

        // 2. Động cơ Chấm điểm Trọng số Ý định (Weighted Scoring System)
        let score = 0;

        // A. Thuật ngữ Cổ học & Dịch lý / Bát tự / Tử vi (Trọng số +3.0)
        const metaphysicsKeywords = [
            'can chi', 'nhật chủ', 'nhật nguyên', 'dụng thần', 'hỷ thần', 'kỵ thần', 'thập thần',
            'tử vi', 'bát tự', 'kinh dịch', 'lục hào', 'quẻ', 'hào động', 'thế ứng', 'quái thân',
            'đại vận', 'lưu niên', 'cung mệnh', 'cung thân', 'quan lộc', 'tài bạch', 'điền trạch',
            'phu thê', 'tật ách', 'thiên di', 'nô bộc', 'phụ mẫu', 'huynh đệ', 'ngũ hành',
            'kim', 'mộc', 'thủy', 'hỏa', 'thổ', 'tương sinh', 'tương khắc', 'lục hợp', 'tam hợp',
            'tương xung', 'tương hình', 'tương hại', 'thiên can', 'địa chi', 'giáp', 'ất', 'bính',
            'đinh', 'mậu', 'kỷ', 'canh', 'tân', 'nhâm', 'quý', 'tý', 'sửu', 'dần', 'mão', 'thìn',
            'tỵ', 'ngọ', 'mùi', 'thân', 'dậu', 'tuất', 'hợi', 'hóa lộc', 'hóa quyền', 'hóa khoa',
            'hóa kỵ', 'thái tuế', 'cô loan', 'kiếp sát', 'vong thần', 'văn xương', 'kim dư',
            'thiên trù', 'thiên y', 'âm dương sai thác', 'thập ác đại bại', 'đà la', 'kình dương',
            'không vong', 'tuế phá', 'tiểu hao', 'tử bình', 'tứ trụ', 'mệnh bàn', 'mệnh cục',
            'bản mệnh', 'tinh bàn', 'số mạng', 'vận mệnh', 'lá số'
        ];

        // B. Quyết định & Hành động đời sống (Trọng số +2.0)
        const lifeActionKeywords = [
            'công việc', 'sự nghiệp', 'kinh doanh', 'buôn bán', 'đầu tư', 'góp vốn', 'mở rộng',
            'tài chính', 'tiền bạc', 'tiền tài', 'tài lộc', 'mua đất', 'mua nhà', 'bất động sản',
            'chuyển việc', 'xin việc', 'thăng chức', 'tăng lương', 'phỏng vấn', 'sếp', 'đồng nghiệp',
            'đối tác', 'hợp tác', 'kết hôn', 'cưới hỏi', 'cưới', 'ly hôn', 'chia tay', 'người yêu',
            'bạn gái', 'bạn trai', 'vợ chồng', 'vợ', 'chồng', 'con cái', 'sinh con', 'mang thai',
            'bầu bí', 'phẫu thuật', 'mổ xẻ', 'khám bệnh', 'sức khỏe', 'bệnh tật', 'bệnh',
            'xuất hành', 'động thổ', 'khai trương', 'làm ăn', 'thua lỗ', 'học hành', 'thi cử',
            'đỗ đạt', 'trường học', 'gia đạo', 'gia đình', 'bố mẹ', 'cha mẹ'
        ];

        // C. Tâm lý trăn trở, bế tắc & Định hướng nhân sinh (Trọng số +1.5)
        const emotionalDilemmaKeywords = [
            'bế tắc', 'mệt mỏi', 'kiệt quệ', 'hoang mang', 'lo lắng', 'bất an', 'tương lai',
            'hy vọng', 'chông chênh', 'mất phương hướng', 'cô độc', 'áp lực', 'buồn phiền',
            'trắc trở', 'gian nan', 'thử thách', 'định hướng', 'lối thoát', 'buông bỏ',
            'vấp ngã', 'khủng hoảng', 'băn khoăn', 'phân vân', 'lời khuyên', 'cuộc sống'
        ];

        // D. Thời điểm & Dự báo (Trọng số +1.0)
        const timingKeywords = [
            'khi nào', 'bao giờ', 'thời điểm', 'năm nào', 'tháng mấy', 'năm nay', 'sang năm',
            'sắp tới', 'chu kỳ', 'giai đoạn', 'mốc thời gian', 'vận hạn', 'hạn', 'tiểu vận'
        ];

        // E. Lời khuyên & Đánh giá tính khả thi (Trọng số +1.0)
        const adviceKeywords = [
            'nên hay không nên', 'có nên', 'được không', 'tốt không', 'xấu không', 'hợp không',
            'làm sao', 'thế nào', 'như thế nào', 'giải pháp', 'phương hướng', 'hóa giải',
            'cải vận', 'cải thiện', 'khuyên', 'chỉ dẫn'
        ];

        // F. Thời tiết hỗ trợ kế hoạch (Trọng số +1.5)
        const weatherKeywords = ['thời tiết', 'mưa', 'nắng', 'bão', 'nhiệt độ', 'lạnh', 'nóng'];

        // G. Tương tác hội thoại & thỉnh giáo chuyên gia (Trọng số +1.5)
        const conversationalKeywords = [
            'giải thích', 'làm rõ', 'nói thêm', 'cho con hỏi', 'cho em hỏi', 'cho tôi hỏi',
            'thầy cho', 'giúp con', 'giúp em', 'giúp tôi', 'mục này', 'phần này', 'đoạn này',
            'thầy thấy sao', 'nhờ thầy', 'ý nghĩa'
        ];

        for (const kw of metaphysicsKeywords) {
            if (q.includes(kw)) { score += 3.0; break; }
        }
        for (const kw of lifeActionKeywords) {
            if (q.includes(kw)) { score += 2.0; break; }
        }
        for (const kw of emotionalDilemmaKeywords) {
            if (q.includes(kw)) { score += 1.5; break; }
        }
        for (const kw of timingKeywords) {
            if (q.includes(kw)) { score += 1.0; break; }
        }
        for (const kw of adviceKeywords) {
            if (q.includes(kw)) { score += 1.0; break; }
        }
        for (const kw of weatherKeywords) {
            if (q.includes(kw)) { score += 1.5; break; }
        }
        for (const kw of conversationalKeywords) {
            if (q.includes(kw)) { score += 1.5; break; }
        }

        // Câu hỏi thoại ngắn gọn trong bối cảnh đang xem lá số (<= 35 ký tự)
        if (q.length > 0 && q.length <= 35) {
            const shortConversational = ['sao', 'thế nào', 'gì', 'thầy', 'hỏi', 'giải thích', 'mục này', 'giúp con', 'giúp em', 'nói thêm', 'làm rõ'];
            if (shortConversational.some(w => q.includes(w))) {
                score += 1.5;
            }
        }

        return score >= 1.5;
    }

    /**
     * Builds structured conversation context for the AI
     * Retrieves previous summary and the last 3-5 messages in chronological order.
     */
    static async buildConversationContext(system, conversationId, limit = 4) {
        let sys = system;
        if (sys === 'hexagram') sys = 'iching';
        if (sys === 'tuvi' || sys === 'tu_vi') sys = 'ziwei';

        const conversation = await Conversation.findOne({ _id: conversationId, system: sys }).lean();
        let messages = [];

        if (conversation) {
            messages = await Message.find({ conversationId })
                .sort({ createdAt: 1 })
                .lean();
        }

        if (!conversation) {
            return {
                summary: "",
                recentHistoryText: "Chưa có cuộc hội thoại trước đó.",
                messageCount: 0
            };
        }

        // Limit the messages to the last N
        const messageCount = messages.length;
        const recentMessages = messages.slice(-limit);

        let recentHistoryText = "";
        recentMessages.forEach(msg => {
            const roleName = msg.role === 'user' ? 'Người dùng' : 'AI';
            let contentText = msg.content;
            
            // If message is AI and contains structured JSON, try to extract 'answer' for history continuity
            if (msg.role === 'ai' && msg.structuredContent && msg.structuredContent.answer) {
                contentText = msg.structuredContent.answer;
            } else if (msg.role === 'ai') {
                try {
                    const parsed = JSON.parse(msg.content);
                    if (parsed.answer) contentText = parsed.answer;
                } catch (e) {
                    // fall back to raw content
                }
            }
            
            recentHistoryText += `- [${roleName}]: ${contentText}\n`;
        });

        return {
            summary: conversation.summary || "Chưa có tóm tắt.",
            recentHistoryText: recentHistoryText.trim() || "Chưa có tin nhắn trong bối cảnh.",
            messageCount
        };
    }

    /**
     * Periodic summarizer to avoid AI context bloat
     * Creates or updates a short summary of the conversation
     */
    static async updateConversationSummary(system, conversationId, genAIInstance, activeModel) {
        try {
            let sys = system;
            if (sys === 'hexagram') sys = 'iching';
            if (sys === 'tuvi' || sys === 'tu_vi') sys = 'ziwei';

            const conversation = await Conversation.findOne({ _id: conversationId, system: sys });
            if (!conversation) return;

            // Fetch all messages to build a summary
            const messages = await Message.find({ conversationId }).sort({ createdAt: 1 }).lean();
            if (messages.length < 4) return; // Only summarize if there's enough dialogue

            let dialogString = "";
            messages.forEach(m => {
                let contentText = m.content;
                if (m.role === 'ai' && m.structuredContent && m.structuredContent.answer) {
                    contentText = m.structuredContent.answer;
                }
                dialogString += `${m.role === 'user' ? 'User' : 'AI'}: ${contentText}\n`;
            });

            const prompt = `Hãy tóm tắt ngắn gọn (trong vòng 3-4 dòng gạch đầu dòng) nội dung cốt lõi của cuộc trò chuyện mệnh lý dưới đây. Hãy nêu rõ:
1. Đương số đang lo lắng/hỏi về chủ đề gì chính.
2. Các mốc thời gian/lời khuyên AI đã đưa ra.
3. Trạng thái tâm lý hoặc quyết định hiện tại của đương số.

--- CUỘC TRÒ CHUYỆN ---
${dialogString}

--- TÓM TẮT SÚC TÍCH ---`;

            if (genAIInstance) {
                const model = genAIInstance.getGenerativeModel({ model: activeModel });
                const result = await model.generateContent(prompt);
                const summaryText = result.response.text().trim();
                
                conversation.summary = summaryText;
                await conversation.save();
                console.log(`Summarized conversation ${conversationId} successfully.`);
            }
        } catch (error) {
            console.error("Error summarizing conversation:", error);
        }
    }

    /**
     * Phân tách bài luận giải Markdown thành các phân đoạn (Sections/Chapters) có cấu trúc
     */
    static parseInterpretationSections(text, prefix = 'sec') {
        if (!text || typeof text !== 'string') return [];
        
        const lines = text.split(/\r?\n/);
        const sections = [];
        let currentSection = null;
        
        const chapterRegex = /^(?:#{1,3}\s*)?(?:CHƯƠNG|Chương|CHAPTER|Chapter|CỤM|Cụm|TRỤ CỘT|Trụ cột|TRỤ|Trụ|KỊCH BẢN|Kịch bản|KHỐI|Khối)\s*(\d+)\s*(?::|-|–|\.)\s*(.*)$/i;
        const buocRegex = /^(?:#{1,3}\s*)?(?:BƯỚC|Bước|PHẦN|Phần|STEP|Step)\s*(\d+(?:\.\d+)?)\s*(?::|-|–|\.)\s*(.*)$/i;
        const nhatChuRegex = /^(?:#{1,3}\s*)?(?:PHÂN TÍCH NHẬT CHỦ|Phân tích Nhật chủ|TỔNG QUAN BẢN MỆNH|Tổng quan Bản mệnh|NHẬT CHỦ & BẢN MỆNH|ĐỊNH VỊ BẢN MỆNH)(?::|-|–|\.)?\s*(.*)$/i;
        const summaryRegex = /^(?:#{1,3}\s*)?(?:CHIẾN LƯỢC ĐIỀU HÒA|ĐÚC KẾT NHÂN SINH|TỔNG KẾT & ĐIỀU HÒA|ĐIỀU HÒA CHIẾN LƯỢC)(?::|-|–|\.)?\s*(.*)$/i;
        const numberedStepRegex = /^(#{2,3})\s*(\d+(?:\.\d+)?)\s*(?::|-|–|\.)\s*(.*)$/;

        const hasChapters = lines.some(l => chapterRegex.test(l.trim()));
        const isZiwei = prefix === 'ziwei' || prefix === 'tu_vi';
        const isMarriage = prefix === 'marriage';
        const isIChing = prefix === 'iching';
        const prefixLabel = isZiwei ? 'Cụm' : isMarriage ? 'Trụ Cột' : isIChing ? 'Kịch Bản' : 'Chương';

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const trimmed = rawLine.trim();
            
            if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                continue;
            }
            
            const chapterMatch = trimmed.match(chapterRegex);
            const buocMatch = trimmed.match(buocRegex);
            const nhatChuMatch = trimmed.match(nhatChuRegex);
            const summaryMatch = trimmed.match(summaryRegex);

            let numberedStepMatch = null;
            if (!hasChapters && !chapterMatch && !buocMatch && !nhatChuMatch && !summaryMatch) {
                numberedStepMatch = rawLine.match(numberedStepRegex);
            }
            
            if (chapterMatch) {
                if (currentSection) {
                    sections.push({
                        id: currentSection.id,
                        title: currentSection.title,
                        content: currentSection.content.join('\n').trim()
                    });
                }
                
                const num = chapterMatch[1];
                let rawTitle = chapterMatch[2].replace(/^\*\*?/, '').replace(/\*\*?$/, '').trim();
                rawTitle = rawTitle.replace(/^(?:CỤM|CHƯƠNG|TRỤ CỘT|KỊCH BẢN|KHỐI)\s*\d*[:\s–-]*/i, '').trim();
                rawTitle = rawTitle.replace(/^[\s:&–-]+/, '').trim();
                
                currentSection = {
                    id: `${prefix}_ch_${num}`,
                    title: rawTitle ? `${prefixLabel} ${num}: ${rawTitle}` : `${prefixLabel} ${num}`,
                    content: []
                };
            } else if (buocMatch && !hasChapters) {
                if (currentSection) {
                    sections.push({
                        id: currentSection.id,
                        title: currentSection.title,
                        content: currentSection.content.join('\n').trim()
                    });
                }
                const num = buocMatch[1];
                let rawTitle = buocMatch[2].replace(/^\*\*?/, '').replace(/\*\*?$/, '').trim();
                currentSection = {
                    id: `${prefix}_${num}`,
                    title: rawTitle ? `Bước ${num}: ${rawTitle}` : `Bước ${num}`,
                    content: []
                };
            } else if (nhatChuMatch && (!currentSection || (!currentSection.id.includes('intro') && !currentSection.id.includes('nhat_chu')))) {
                if (currentSection) {
                    sections.push({
                        id: currentSection.id,
                        title: currentSection.title,
                        content: currentSection.content.join('\n').trim()
                    });
                }
                const defaultTitle = isZiwei ? 'Định Vị Bản Mệnh & Tinh Đồ' :
                                     isMarriage ? 'Tổng Quan Bản Mệnh Phối Ngẫu' :
                                     isIChing ? 'Tổng Quan Quẻ Dịch' : 'Phân Tích Nhật Chủ & Bản Mệnh';
                currentSection = {
                    id: `${prefix}_intro`,
                    title: defaultTitle,
                    content: []
                };
            } else if (summaryMatch && (!currentSection || !currentSection.id.includes('dieu_hoa'))) {
                if (currentSection) {
                    sections.push({
                        id: currentSection.id,
                        title: currentSection.title,
                        content: currentSection.content.join('\n').trim()
                    });
                }
                currentSection = {
                    id: `${prefix}_dieu_hoa`,
                    title: 'Chiến Lược Điều Hòa & Xu Cát Tị Hung',
                    content: []
                };
            } else if (numberedStepMatch) {
                if (currentSection) {
                    sections.push({
                        id: currentSection.id,
                        title: currentSection.title,
                        content: currentSection.content.join('\n').trim()
                    });
                }
                const num = numberedStepMatch[2];
                let rawTitle = numberedStepMatch[3].replace(/^\*\*?/, '').replace(/\*\*?$/, '').trim();
                currentSection = {
                    id: `${prefix}_${num}`,
                    title: rawTitle ? `${num}. ${rawTitle}` : `Phần ${num}`,
                    content: []
                };
            } else if (currentSection) {
                currentSection.content.push(rawLine);
            }
        }
        
        if (currentSection) {
            sections.push({
                id: currentSection.id,
                title: currentSection.title,
                content: currentSection.content.join('\n').trim()
            });
        }
        
        return sections;
    }

    /**
     * Chia nhỏ bài luận giải thành các đoạn văn (Semantic Chunks) có ngữ nghĩa trọn vẹn (~150 - 400 từ)
     */
    static chunkInterpretationSections(sections) {
        if (!sections || !Array.isArray(sections)) return [];
        const chunks = [];

        sections.forEach(sec => {
            const lines = (sec.content || '').split(/\r?\n/);
            let currentParagraph = [];
            let subTitle = sec.title;
            let pIndex = 1;

            const pushChunk = () => {
                if (currentParagraph.length > 0) {
                    const text = currentParagraph.join('\n').trim();
                    if (text.length > 30) {
                        chunks.push({
                            id: `${sec.id}_p${pIndex++}`,
                            sectionId: sec.id,
                            sectionTitle: sec.title,
                            subTitle: subTitle,
                            content: text,
                            tokens: this.tokenize(text)
                        });
                    }
                    currentParagraph = [];
                }
            };

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) {
                    pushChunk();
                    continue;
                }
                // Nếu gặp tiêu đề con (H3/H4/H5 hoặc gạch đầu dòng lớn)
                if (trimmed.startsWith('#') || trimmed.match(/^[0-9]+\.\s+[A-ZÀ-Ỹ]/)) {
                    pushChunk();
                    subTitle = trimmed.replace(/^#+\s*/, '');
                    continue;
                }
                currentParagraph.push(line);
            }
            pushChunk();
        });

        return chunks;
    }

    /**
     * Thuật toán xếp hạng ngữ nghĩa BM25 thuần JavaScript (In-Memory Okapi BM25 Ranker)
     * Độ phức tạp O(N), độ trễ 0ms, không phụ thuộc API ngoài.
     */
    static rankChunksBM25(query, chunks, { k1 = 1.2, b = 0.75 } = {}) {
        if (!query || !chunks || chunks.length === 0) return [];
        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0) return [];

        const N = chunks.length;
        const avgDocLen = chunks.reduce((sum, c) => sum + (c.tokens ? c.tokens.length : 0), 0) / (N || 1);

        // 1. Tính Document Frequency (DF) cho từng token của truy vấn
        const docFreq = {};
        queryTokens.forEach(token => {
            let count = 0;
            chunks.forEach(c => {
                if (c.tokens && c.tokens.includes(token)) count++;
            });
            docFreq[token] = count;
        });

        // 2. Chấm điểm BM25 cho từng chunk
        const scoredChunks = chunks.map(chunk => {
            let score = 0;
            const chunkTokens = chunk.tokens || [];
            const chunkLen = chunkTokens.length;

            // Đếm Term Frequency (TF)
            const termFreq = {};
            chunkTokens.forEach(t => {
                termFreq[t] = (termFreq[t] || 0) + 1;
            });

            queryTokens.forEach(token => {
                const df = docFreq[token] || 0;
                if (df > 0) {
                    // Công thức Okapi BM25 IDF
                    const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);
                    const tf = termFreq[token] || 0;
                    const numerator = tf * (k1 + 1);
                    const denominator = tf + k1 * (1 - b + b * (chunkLen / (avgDocLen || 1)));
                    score += idf * (numerator / denominator);
                }
            });

            return {
                ...chunk,
                score
            };
        });

        return scoredChunks
            .filter(c => c.score > 0)
            .sort((a, b) => b.score - a.score);
    }

    /**
     * Trích xuất ngữ cảnh VIP thông minh phục vụ Follow-up Chat
     * Áp dụng cơ chế Hybrid: In-Memory BM25 Paragraph Ranking + Multi-Intent Routing + Active Pinning
     * @param {Object} params
     * @param {Object} params.record Bản ghi lá số
     * @param {string} params.system 'ziwei' | 'bazi' | 'marriage' | 'iching'
     * @param {string} [params.activeSectionId] ID của Cụm/Chương mà người dùng đang đứng xem
     * @param {string} [params.userQuestion] Câu hỏi mới của người dùng
     * @returns {Object} { isVipMode, activeSectionId, activeSectionTitle, matchedSections, contextText }
     */
    static extractVipContext({ record, system, activeSectionId = null, userQuestion = '' }) {
        if (!record || !record.aiInterpretation) {
            return { isVipMode: false, activeSectionId: null, activeSectionTitle: null, matchedSections: [], contextText: "" };
        }

        const rawContent = record.aiInterpretation.content || "";
        const summary = record.aiInterpretation.summary || "";
        const mode = record.aiInterpretation.mode || (rawContent.length > 2500 ? 'vip' : 'standard');
        const isVipMode = mode === 'vip';

        if (!rawContent || rawContent.length < 300) {
            return { isVipMode, activeSectionId: null, activeSectionTitle: null, matchedSections: [], contextText: "" };
        }

        // Chuẩn hóa tiền tố hệ thống
        let prefix = 'tu_vi';
        if (system === 'bazi') prefix = 'bazi';
        else if (system === 'marriage') prefix = 'marriage';
        else if (system === 'iching' || system === 'hexagram') prefix = 'iching';

        const sections = this.parseInterpretationSections(rawContent, prefix);
        if (!sections || sections.length === 0) {
            const trimmedExcerpt = rawContent.slice(0, 3000);
            return {
                isVipMode,
                activeSectionId: null,
                activeSectionTitle: "Toàn Cảnh Bài Luận",
                matchedSections: [{ id: 'all', title: "Toàn Cảnh Bài Luận" }],
                contextText: `--- NỘI DUNG BÀI LUẬN GIẢI ĐÃ XUẤT BẢN CHO ĐƯƠNG SỐ ---\n${summary ? `[Tóm tắt]: ${summary}\n` : ''}${trimmedExcerpt}\n---`
            };
        }

        // 1. Chia nhỏ toàn bộ bài luận thành các Chunks có ngữ nghĩa
        const allChunks = this.chunkInterpretationSections(sections);

        let selectedChunks = [];
        let matchedSections = [];
        let pinnedSection = null;

        // 2. Trường hợp A: Người dùng bấm "💬 Đàm đạo mục này" (Ghim activeSectionId)
        if (activeSectionId) {
            const cleanId = String(activeSectionId).toLowerCase();
            pinnedSection = sections.find(s => 
                s.id.toLowerCase() === cleanId || 
                s.id.toLowerCase().includes(cleanId) ||
                cleanId.includes(s.id.toLowerCase())
            );

            if (pinnedSection) {
                const sectionChunks = allChunks.filter(c => c.sectionId === pinnedSection.id);
                
                // Nếu người dùng có câu hỏi cụ thể, chạy BM25 trong nội bộ chương đó để lấy đoạn khớp nhất
                if (userQuestion && sectionChunks.length > 0) {
                    const rankedInside = this.rankChunksBM25(userQuestion, sectionChunks);
                    selectedChunks = rankedInside.length > 0 ? rankedInside.slice(0, 2) : sectionChunks.slice(0, 2);
                    
                    // Kiểm tra liên ngành: Nếu câu hỏi có liên quan rất mạnh đến 1 chương khác (score > 3.5), lấy thêm 1 chunk tham chiếu
                    const otherChunks = allChunks.filter(c => c.sectionId !== pinnedSection.id);
                    if (otherChunks.length > 0) {
                        const crossRanked = this.rankChunksBM25(userQuestion, otherChunks);
                        if (crossRanked.length > 0 && crossRanked[0].score >= 3.5) {
                            selectedChunks.push(crossRanked[0]);
                        }
                    }
                } else {
                    // Mặc định lấy các đoạn đầu của chương được ghim
                    selectedChunks = sectionChunks.slice(0, 2);
                }

                matchedSections = [
                    { id: pinnedSection.id, title: pinnedSection.title },
                    ...selectedChunks
                        .filter(c => c.sectionId !== pinnedSection.id)
                        .map(c => ({ id: c.sectionId, title: c.sectionTitle }))
                ];
            }
        }

        // 3. Trường hợp B: Người dùng hỏi tự do trên toàn cảnh lá số (activeSectionId = null)
        if (selectedChunks.length === 0 && userQuestion && allChunks.length > 0) {
            // Chạy BM25 toàn cảnh trên toàn bộ bài luận giải VIP
            const rankedGlobal = this.rankChunksBM25(userQuestion, allChunks);
            
            if (rankedGlobal.length > 0) {
                // Lấy Top 2 - 3 Chunks có điểm số cao nhất (hỗ trợ đa chủ đề Multi-Intent)
                selectedChunks = rankedGlobal.slice(0, 3);
                
                // Thu thập danh sách các chương/cụm liên quan
                const seenSecIds = new Set();
                selectedChunks.forEach(c => {
                    if (!seenSecIds.has(c.sectionId)) {
                        seenSecIds.add(c.sectionId);
                        matchedSections.push({ id: c.sectionId, title: c.sectionTitle, score: c.score });
                    }
                });
            }
        }

        // 4. Trường hợp C: Fallback qua từ điển Topic Routing hoặc lấy Cụm 1 / Intro
        if (selectedChunks.length === 0) {
            const TOPIC_ROUTING = [
                {
                    key: 'career',
                    keywords: ['công việc', 'sự nghiệp', 'quan lộc', 'thăng tiến', 'thăng chức', 'chuyển việc', 'xin việc', 'phỏng vấn', 'sếp', 'đồng nghiệp', 'công ty', 'lãnh đạo', 'quan vận', 'ngành nghề', 'làm ăn'],
                    matches: ['quan_loc', 'ch_1', 'ch_2', 'ch_8', 'bazi_ch_1', 'tu_vi_ch_2', 'tu_vi_8', 'marriage_ch_4', 'iching_ch_3']
                },
                {
                    key: 'finance',
                    keywords: ['tiền', 'tiền tài', 'tài lộc', 'tài chính', 'tài bạch', 'đầu tư', 'kinh doanh', 'buôn bán', 'mua đất', 'đất đai', 'bất động sản', 'lỗ', 'lãi', 'chứng khoán', 'thu nhập', 'kho tài', 'chính tài', 'thiên tài'],
                    matches: ['tai_bach', 'ch_2', 'dien_trach', 'bazi_ch_2', 'tu_vi_ch_2', 'tu_vi_3', 'tu_vi_9', 'marriage_ch_4']
                },
                {
                    key: 'love',
                    keywords: ['tình cảm', 'tình duyên', 'hôn nhân', 'vợ', 'chồng', 'người yêu', 'bạn trai', 'bạn gái', 'phu thê', 'ly hôn', 'cưới', 'kết hôn', 'đào hoa', 'chia tay', 'con cái', 'tử tức', 'gia đạo'],
                    matches: ['phu_the', 'tu_tuc', 'ch_3', 'marriage', 'bazi_ch_3', 'tu_vi_ch_3', 'tu_vi_2', 'tu_vi_10', 'marriage_ch_1', 'marriage_ch_2', 'marriage_ch_3', 'iching_ch_2']
                },
                {
                    key: 'health',
                    keywords: ['sức khỏe', 'bệnh', 'tật ách', 'mổ', 'tai nạn', 'tai ương', 'nguy cơ', 'tạng phủ', 'thuốc', 'khám', 'chữa', 'thể trạng', 'ốm'],
                    matches: ['tat_ach', 'ch_4', 'bazi_ch_4', 'tu_vi_ch_4', 'tu_vi_6']
                },
                {
                    key: 'timing',
                    keywords: ['đại vận', 'lưu niên', 'vận hạn', 'khi nào', 'bao giờ', 'thời điểm', 'năm 2026', 'tháng mấy', 'mốc', 'chu kỳ', 'hạn', '10 năm', 'tiểu vận', 'tương lai', 'năm nay', 'sang năm'],
                    matches: ['dai_van', 'luu_nien', 'ch_5', 'ch_6', 'bazi_ch_6', 'tu_vi_ch_4', 'tu_vi_13', 'tu_vi_14', 'iching_ch_1']
                },
                {
                    key: 'remedy',
                    keywords: ['hóa giải', 'phong thủy', 'cải vận', 'màu sắc', 'hướng', 'vật phẩm', 'bổ cứu', 'dụng thần', 'hỷ thần', 'hướng nhà', 'tu tập', 'cứu giải'],
                    matches: ['dieu_hoa', 'cai_van', 'ch_5', 'bazi_ch_5', 'tu_vi_15', 'marriage_dieu_hoa', 'iching_dieu_hoa']
                }
            ];

            const q = (userQuestion || '').toLowerCase().normalize('NFC');
            for (const route of TOPIC_ROUTING) {
                const hasKeyword = route.keywords.some(kw => q.includes(kw));
                if (hasKeyword) {
                    const matched = sections.find(sec => 
                        route.matches.some(m => sec.id.toLowerCase().includes(m))
                    );
                    if (matched) {
                        pinnedSection = matched;
                        matchedSections = [{ id: matched.id, title: matched.title }];
                        break;
                    }
                }
            }

            if (!pinnedSection) {
                pinnedSection = sections[0];
                matchedSections = [{ id: sections[0].id, title: sections[0].title }];
            }

            const fallbackChunks = allChunks.filter(c => c.sectionId === pinnedSection.id);
            selectedChunks = fallbackChunks.length > 0 ? fallbackChunks.slice(0, 2) : [
                {
                    sectionId: pinnedSection.id,
                    sectionTitle: pinnedSection.title,
                    subTitle: pinnedSection.title,
                    content: pinnedSection.content.slice(0, 3000)
                }
            ];
        }

        // 5. Tổng hợp Context Text có cấu trúc rõ ràng cho AI
        const activeSectionTitle = matchedSections.map(s => s.title).join(' + ') || (pinnedSection && pinnedSection.title) || sections[0].title;
        const activeId = matchedSections[0]?.id || (pinnedSection && pinnedSection.id) || sections[0].id;

        const chunksText = selectedChunks.map((chunk, idx) => {
            return `--- [TRÍCH LỤC ${idx + 1}]: ${chunk.sectionTitle}${chunk.subTitle && chunk.subTitle !== chunk.sectionTitle ? ` - ${chunk.subTitle}` : ''} ---\n${chunk.content}`;
        }).join('\n\n');

        const contextText = `
--- BỐI CẢNH BÀI LUẬN GIẢI CHUYÊN SÂU ĐÃ XUẤT BẢN CHO ĐƯƠNG SỐ ---
[CHỈ THỊ QUAN TRỌNG]: Bạn chính là Bậc Thầy đã trực tiếp lập lá số và xuất bản công trình luận giải này. Khi giải đáp câu hỏi của đương số, BẮT BUỘC phải duy trì tính nhất quán 100% với các phân tích học thuật, mốc niên vận và kế sách đã nêu trong các trích đoạn dưới đây. TUYỆT ĐỐI KHÔNG dùng từ "VIP", hãy luôn gọi là "bài luận giải chuyên sâu":
- Phân Mục Đang Đàm Đạo: ${activeSectionTitle}
${summary ? `- Tóm Tắt Cốt Cách Toàn Đồ: ${summary}\n` : ''}
${chunksText}
--------------------------------------------------------------------------`;

        return {
            isVipMode,
            activeSectionId: activeId,
            activeSectionTitle,
            matchedSections,
            contextText: contextText.trim()
        };
    }
}

module.exports = ConversationContextService;
