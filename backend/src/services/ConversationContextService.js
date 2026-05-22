const HexagramConversation = require('../models/HexagramConversation');
const HexagramMessage = require('../models/HexagramMessage');
const BaziConversation = require('../models/BaziConversation');
const BaziMessage = require('../models/BaziMessage');

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
            // Love / Marriage
            'tình duyên', 'kết hôn', 'cưới', 'ly hôn', 'vợ', 'chồng', 'bạn trai', 'bạn gái', 'người yêu', 'tình cảm',
            'chia tay', 'quay lại', 'hẹn hò', 'mối quan hệ',
            // Health / Safety
            'sức khỏe', 'bệnh', 'tai nạn', 'tai ương', 'bình an', 'mổ', 'khám', 'thuốc', 'chữa',
            // Timing / Decisions
            'khi nào', 'bao giờ', 'thời điểm', 'ngày nào', 'tháng mấy', 'năm nào', 'nên', 'không nên',
            'làm thế nào', 'giải pháp', 'hóa giải', 'hướng nào', 'phong thủy', 'cải vận', 'vận hạn', 'đại vận',
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
    static async buildConversationContext(type, conversationId, limit = 4) {
        let conversation = null;
        let messages = [];

        if (type === 'hexagram') {
            conversation = await HexagramConversation.findById(conversationId).lean();
            if (conversation) {
                messages = await HexagramMessage.find({ conversationId })
                    .sort({ timestamp: 1 })
                    .lean();
            }
        } else {
            conversation = await BaziConversation.findById(conversationId).lean();
            if (conversation) {
                messages = await BaziMessage.find({ conversationId })
                    .sort({ timestamp: 1 })
                    .lean();
            }
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
    static async updateConversationSummary(type, conversationId, genAIInstance, activeModel) {
        try {
            let conversation = null;
            let messages = [];
            let ConversationModel = null;
            let MessageModel = null;

            if (type === 'hexagram') {
                ConversationModel = HexagramConversation;
                MessageModel = HexagramMessage;
            } else {
                ConversationModel = BaziConversation;
                MessageModel = BaziMessage;
            }

            conversation = await ConversationModel.findById(conversationId);
            if (!conversation) return;

            // Fetch all messages to build a summary
            messages = await MessageModel.find({ conversationId }).sort({ timestamp: 1 }).lean();
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
                conversation.messageCount = messages.length;
                await conversation.save();
                console.log(`Summarized conversation ${conversationId} successfully.`);
            }
        } catch (error) {
            console.error("Error summarizing conversation:", error);
        }
    }
}

module.exports = ConversationContextService;
