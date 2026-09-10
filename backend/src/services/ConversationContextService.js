const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const logger = require('./LoggerService');
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
    static isDivinationRelated(question) {
        if (!question) return false;
        // Normalize to lowercase and Unicode NFC (Composed) to avoid keyboard encoding issues
        const q = question.toLowerCase().trim().normalize('NFC');

        // 1. Explicitly reject programming, web development, technology and academic homework
        const blockKeywords = [
            'react', 'angular', 'vuejs', 'nextjs', 'nodejs', 'javascript', 'python', 'java', 'html', 'css', 
            'viết code', 'lập trình', 'thuật toán', 'database', 'sql', 'git', 'bug', 'fix lỗi', 'debug',
            'giải toán', 'công thức lý', 'phương trình hóa', 'học tiếng anh', 'ngữ pháp', 'dịch câu này'
        ].map(k => k.normalize('NFC'));

        for (const kw of blockKeywords) {
            if (q.includes(kw)) {
                return false;
            }
        }

        // 2. Allow list (divination, life, forecasting, planning, weather, actions, dates, stems/branches, terms)
        const allowKeywords = [
            // Weather (allowed by user)
            'mưa', 'nắng', 'thời tiết', 'bão', 'nhiệt độ', 'lạnh', 'nóng',
            // Career / Money
            'công việc', 'sự nghiệp', 'tiền tài', 'tài lộc', 'đầu tư', 'kinh doanh', 'mua bán', 'hợp tác', 'đối tác',
            'sếp', 'đồng nghiệp', 'xin việc', 'phỏng vấn', 'thăng chức', 'tăng lương', 'chuyển việc', 'thất nghiệp',
            'tiền', 'tiền bạc', 'làm ăn', 'buôn bán', 'thua lỗ',
            // Love / Marriage
            'tình duyên', 'kết hôn', 'cưới', 'ly hôn', 'vợ', 'chồng', 'bạn trai', 'bạn gái', 'người yêu', 'tình cảm',
            'chia tay', 'quay lại', 'hẹn hò', 'mối quan hệ', 'phu thê',
            // Family & Home
            'gia đạo', 'gia đình', 'con cái', 'cha mẹ', 'bố mẹ', 'mẹ', 'bố', 'cha', 'anh em', 'chị em', 'nhà cửa', 'đất đai', 'bất động sản',
            // Health / Safety / Life events
            'sức khỏe', 'bệnh', 'tai nạn', 'tai ương', 'bình an', 'mổ', 'khám', 'thuốc', 'chữa',
            'sinh con', 'bầu bí', 'mang thai', 'khai trương', 'xuất hành', 'động thổ', 'thi cử', 'học hành', 'đỗ đạt',
            // Timing / Decisions
            'khi nào', 'bao giờ', 'thời điểm', 'ngày nào', 'tháng mấy', 'năm nào', 'nên', 'không nên',
            'làm thế nào', 'giải pháp', 'hóa giải', 'hướng nào', 'phong thủy', 'cải vận', 'vận hạn', 'đại vận',
            'vận', 'hạn', 'hợp', 'xung', 'khắc', 'sinh',
            // Heavenly Stems (Thiên can) - normalized to NFC
            'giáp', 'ất', 'bính', 'đinh', 'mậu', 'kỷ', 'canh', 'tân', 'nhâm', 'quý',
            // Earthly Branches (Địa chi) - normalized to NFC
            'tý', 'sửu', 'dần', 'mão', 'thìn', 'tỵ', 'ngọ', 'mùi', 'thân', 'dậu', 'tuất', 'hợi',
            // Metaphysical & Chinese Philosophy terms (Thuật ngữ Dịch lý/Bát tự)
            'thiên can', 'địa chi', 'can chi', 'nhật chủ', 'nhật nguyên', 'thế ứng', 'hào động', 'lục thú', 
            'lục thân', 'thập thần', 'dụng thần', 'hỷ thần', 'kỵ thần', 'hưu tù', 'tử tuyệt', 'tràng sinh', 
            'sinh khắc', 'hình hại', 'tương hình', 'tương hại', 'tương xung', 'xung hợp', 'tam hợp', 
            'lục hợp', 'nguyệt phá', 'hóa tiến', 'hóa thoái', 'không vong', 'thần sát', 'tử bình', 
            'tứ trụ', 'đại vận', 'lưu niên', 'vận thế', 'vận trình', 'tiểu vận', 'mệnh cục', 'ngũ hành', 
            'kim', 'mộc', 'thủy', 'hỏa', 'thổ', 'quẻ', 'kinh dịch', 'bát quái', 'hào', 'dịch lý',
            // General fortune
            'quẻ', 'lá số', 'bát tự', 'tử vi', 'mệnh', 'số mạng', 'tương lai', 'vận mệnh', 'điềm báo', 'giải thích thêm'
        ].map(k => k.normalize('NFC'));

        // If it matches any allowable keyword, it's immediately approved
        for (const kw of allowKeywords) {
            if (q.includes(kw)) {
                return true;
            }
        }

        // 3. Fallback heuristic: if it's a short question or general planning question, we let it pass to AI,
        // but if it's completely generic and doesn't match any daily-life or foretelling intent, we filter it.
        const generalQuestionWords = ['sao', 'thế nào', 'gì', 'được không', 'tốt không', 'xấu không', 'xuất hành'].map(k => k.normalize('NFC'));
        for (const qw of generalQuestionWords) {
            if (q.includes(qw)) {
                return true;
            }
        }

        // If the question is extremely short and has no context, let the AI handle it, but block if it's very long and unrecognized.
        if (q.length > 0 && q.length < 10) {
            return true;
        }

        return false;
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
     * Trích xuất ngữ cảnh VIP thông minh phục vụ Follow-up Chat
     * Áp dụng cơ chế Hybrid: Active-Chapter Awareness + Topic Semantic Routing
     * @param {Object} params
     * @param {Object} params.record Bản ghi lá số
     * @param {string} params.system 'ziwei' | 'bazi' | 'marriage' | 'iching'
     * @param {string} [params.activeSectionId] ID của Cụm/Chương mà người dùng đang đứng xem
     * @param {string} [params.userQuestion] Câu hỏi mới của người dùng
     * @returns {Object} { isVipMode, activeSectionId, activeSectionTitle, contextText }
     */
    static extractVipContext({ record, system, activeSectionId = null, userQuestion = '' }) {
        if (!record || !record.aiInterpretation) {
            return { isVipMode: false, activeSectionId: null, activeSectionTitle: null, contextText: "" };
        }

        const rawContent = record.aiInterpretation.content || "";
        const summary = record.aiInterpretation.summary || "";
        const mode = record.aiInterpretation.mode || (rawContent.length > 2500 ? 'vip' : 'standard');
        const isVipMode = mode === 'vip';

        if (!rawContent || rawContent.length < 300) {
            return { isVipMode, activeSectionId: null, activeSectionTitle: null, contextText: "" };
        }

        // Chuẩn hóa tiền tố hệ thống
        let prefix = 'tu_vi';
        if (system === 'bazi') prefix = 'bazi';
        else if (system === 'marriage') prefix = 'marriage';
        else if (system === 'iching' || system === 'hexagram') prefix = 'iching';

        const sections = this.parseInterpretationSections(rawContent, prefix);
        if (!sections || sections.length === 0) {
            // Nếu không tách được section, dùng lát cắt 1000 từ đầu tiên
            const trimmedExcerpt = rawContent.slice(0, 3000);
            return {
                isVipMode,
                activeSectionId: null,
                activeSectionTitle: "Toàn Cảnh Bài Luận",
                contextText: `--- NỘI DUNG BÀI LUẬN GIẢI ĐÃ XUẤT BẢN CHO ĐƯƠNG SỐ ---\n${summary ? `[Tóm tắt]: ${summary}\n` : ''}${trimmedExcerpt}\n---`
            };
        }

        let selectedSection = null;

        // 1. Ưu tiên 1: Người dùng chỉ định rõ activeSectionId từ nút "Đàm đạo mục này"
        if (activeSectionId) {
            const cleanId = String(activeSectionId).toLowerCase();
            selectedSection = sections.find(s => 
                s.id.toLowerCase() === cleanId || 
                s.id.toLowerCase().includes(cleanId) ||
                cleanId.includes(s.id.toLowerCase())
            );
        }

        // 2. Ưu tiên 2: Semantic Intent Routing qua từ khóa câu hỏi của người dùng
        if (!selectedSection && userQuestion) {
            const q = userQuestion.toLowerCase().normalize('NFC');
            
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

            for (const route of TOPIC_ROUTING) {
                const hasKeyword = route.keywords.some(kw => q.includes(kw));
                if (hasKeyword) {
                    const matched = sections.find(sec => 
                        route.matches.some(m => sec.id.toLowerCase().includes(m))
                    );
                    if (matched) {
                        selectedSection = matched;
                        break;
                    }
                }
            }
        }

        // 3. Fallback: Nếu không khớp mục cụ thể, chọn mục Cốt Lõi / Cụm 1 / Intro
        if (!selectedSection) {
            selectedSection = sections[0];
        }

        // Giới hạn độ dài nội dung trích xuất tối đa 1200 từ (~5000 ký tự) để tránh phình token
        const sectionContentExcerpt = selectedSection.content.length > 5000 
            ? selectedSection.content.slice(0, 5000) + "\n...(còn tiếp)"
            : selectedSection.content;

        const contextText = `
--- TRÍCH LỤC TỪ BÀI LUẬN GIẢI VIP CHUYÊN SÂU ĐÃ XUẤT BẢN CHO ĐƯƠNG SỐ ---
[LƯU Ý QUAN TRỌNG]: Bạn chính là Chuyên gia đã biên soạn bài luận giải VIP này. Khi giải đáp câu hỏi của đương số, BẮT BUỘC phải duy trì tính nhất quán 100% với các phân tích học thuật và lời khuyên đã nêu trong bài viết dưới đây:
- Phân Mục Trọng Tâm Đang Đàm Đạo: ${selectedSection.title}
- Nội Dung Chi Tiết Đã Phân Tích Trong Bài:
${sectionContentExcerpt}
${summary ? `\n- Tóm Tắt Cốt Cách Tổng Thể: ${summary}` : ''}
--------------------------------------------------------------------------`;

        return {
            isVipMode,
            activeSectionId: selectedSection.id,
            activeSectionTitle: selectedSection.title,
            contextText: contextText.trim()
        };
    }
}

module.exports = ConversationContextService;
