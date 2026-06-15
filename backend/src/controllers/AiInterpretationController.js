const HexagramRecord = require('../models/HexagramRecord');
const User = require('../models/User');
const BaziRecord = require('../models/BaziRecord');
const RuleEngineService = require('../services/RuleEngineService');
const PromptTemplateManager = require('../services/PromptTemplateManager');
const AiService = require('../services/AiService');
const HexagramDataService = require('../services/HexagramDataService');
const HexagramConversation = require('../models/HexagramConversation');
const HexagramMessage = require('../models/HexagramMessage');
const BaziConversation = require('../models/BaziConversation');
const BaziMessage = require('../models/BaziMessage');
const ConversationContextService = require('../services/ConversationContextService');
const MemoryCacheService = require('../services/MemoryCacheService');
const mongoose = require('mongoose');

const {
    ACTIVE_MODEL,
    ICHING_PROMPT_VERSION,
    BAZI_PROMPT_VERSION
} = require('../config/ai');

const findByIdFlex = async (Model, id) => {
    let record = await Model.findById(id);
    if (!record && mongoose.isValidObjectId(id)) {
        const rawObj = await Model.collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
        if (rawObj) record = Model.hydrate(rawObj);
    }
    return record;
};

const updateByIdFlex = async (Model, id, update) => {
    let record = await Model.findByIdAndUpdate(id, update, { new: true });
    if (!record && mongoose.isValidObjectId(id)) {
        const rawObj = await Model.collection.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(id) },
            { $set: { ...update, updatedAt: new Date() } },
            { returnDocument: 'after' }
        );
        if (rawObj) record = Model.hydrate(rawObj);
    }
    return record;
};

class AiInterpretationController {
    static async interpretHexagram(req, res) {
        const { id } = req.params;
        let record = null;

        try {
            record = await findByIdFlex(HexagramRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            // Check lock to prevent race conditions
            if (record.isGeneratingInterpretation) {
                return res.status(409).json({ error: 'Hệ thống đang sinh luận giải cho quẻ này. Vui lòng đợi trong giây lát.' });
            }

            // Establish SSE Header
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            const sendSSE = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Invalidate Cache check
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                record.aiInterpretation.promptVersion === ICHING_PROMPT_VERSION &&
                record.aiInterpretation.model === ACTIVE_MODEL;

            if (hasValidCache) {
                // Stream from cache immediately
                const cachedText = record.aiInterpretation.content;
                sendSSE({ chunk: cachedText });
                sendSSE('[DONE]');
                res.end();
                return;
            }

            // Lock the record
            await updateByIdFlex(HexagramRecord, id, { isGeneratingInterpretation: true });

            // 0. Reconstruct lines
            const reconstructed = HexagramDataService.reconstructLines(record.toObject());
            const fullRecord = {
                ...record.toObject(),
                primaryLines: reconstructed.primaryLines,
                secondaryLines: reconstructed.secondaryLines,
                primaryHexagram: reconstructed.primaryHexagram,
                transformedHexagram: reconstructed.transformedHexagram
            };

            // 0.5 Fetch user gender
            let userGender = 1; // Default male
            if (record.userId && record.userId !== 'guest') {
                const user = await User.findById(record.userId).lean();
                if (user && user.gender !== undefined) {
                    userGender = user.gender;
                }
            }

            // 1. Run Rule Engine
            const analyzedData = RuleEngineService.analyze(fullRecord, userGender);

            // 2. Generate Prompt
            const prompt = PromptTemplateManager.getHexagramInterpretationPrompt(fullRecord, analyzedData);

            // 3. Call AI Service and stream chunks
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";

            for await (const chunk of resultStream.stream) {
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            // 4. Clean Markdown formatting & Parse/strip Ứng Kỳ block
            const { parseUngKyBlock } = require('../shared/utils/ungKyParser');
            const { cleanedText: textWithoutUngKyTags, ungKyList } = parseUngKyBlock(accumulatedText, record.dateCast || new Date());
            
            const cleanedContent = AiService.cleanMarkdown(textWithoutUngKyTags);
            const promptTokens = await AiService.countTokens(prompt, { model: ACTIVE_MODEL });
            const completionTokens = await AiService.countTokens(cleanedContent, { model: ACTIVE_MODEL });
            const tokensUsed = promptTokens + completionTokens;

            // 5. Update Database Record with rich metadata and parsed Ứng Kỳ
            await updateByIdFlex(HexagramRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    generatedAt: new Date(),
                    model: ACTIVE_MODEL,
                    promptVersion: ICHING_PROMPT_VERSION,
                    promptTokens: promptTokens,
                    completionTokens: completionTokens,
                    tokensUsed: tokensUsed
                },
                ungKy: ungKyList,
                isGeneratingInterpretation: false
            });

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Hexagram Interpret SSE Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI.' })}\n\n`);
            res.end();
        } finally {
            if (record) {
                await updateByIdFlex(HexagramRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async interpretBazi(req, res) {
        const { id } = req.params;
        let record = null;

        try {
            record = await findByIdFlex(BaziRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });
            }

            // Check lock
            if (record.isGeneratingInterpretation) {
                return res.status(409).json({ error: 'Hệ thống đang tiến hành luận giải cho lá số này. Vui lòng đợi trong giây lát.' });
            }

            // Establish SSE Header
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            const sendSSE = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Invalidate Cache check
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                record.aiInterpretation.promptVersion === BAZI_PROMPT_VERSION &&
                record.aiInterpretation.model === ACTIVE_MODEL;

            if (hasValidCache) {
                // Stream from cache immediately
                const cachedText = record.aiInterpretation.content;
                sendSSE({ chunk: cachedText });
                sendSSE('[DONE]');
                res.end();
                return;
            }

            // Lock the record
            await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: true });

            // 1. Generate Prompt using analyzed Bazi data
            const prompt = PromptTemplateManager.getBaziInterpretationPrompt(record.toObject());

            // 2. Call AI Service and stream chunks
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";

            for await (const chunk of resultStream.stream) {
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            // 3. Clean Markdown & Estimate tokens
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const promptTokens = await AiService.countTokens(prompt, { model: ACTIVE_MODEL });
            const completionTokens = await AiService.countTokens(cleanedContent, { model: ACTIVE_MODEL });
            const tokensUsed = promptTokens + completionTokens;

            // 4. Update Database Record with rich metadata
            await updateByIdFlex(BaziRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    generatedAt: new Date(),
                    model: ACTIVE_MODEL,
                    promptVersion: BAZI_PROMPT_VERSION,
                    promptTokens: promptTokens,
                    completionTokens: completionTokens,
                    tokensUsed: tokensUsed
                },
                isGeneratingInterpretation: false
            });

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Bazi Interpret SSE Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Bát Tự.' })}\n\n`);
            res.end();
        } finally {
            if (record) {
                await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async chatHexagram(req, res) {
        const { id } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
        }

        // 1. Kiểm tra Intent Filter trước tiên để bảo vệ Quota AI
        if (!ConversationContextService.isDivinationRelated(question)) {
            return res.status(400).json({
                error: 'Tôi là trợ lý luận giải Kinh Dịch và Bát Tự. Vui lòng hỏi những câu hỏi liên quan đến vận hạn, tình cảm, sự nghiệp, đời sống, thời tiết hoặc quẻ dịch này.'
            });
        }

        let record = null;
        let pingInterval = null;

        try {
            record = await findByIdFlex(HexagramRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            // 2. Tìm hoặc tạo cuộc hội thoại mới
            let conversation = await HexagramConversation.findOne({ recordId: id });
            if (!conversation) {
                conversation = await HexagramConversation.create({
                    recordId: id,
                    userId: record.userId || 'guest'
                });
            }

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('hexagrams', id);

            // 3. Rate Limit & Anti-Spam (Cooldown 10 giây & Tối đa 10 tin nhắn/giờ)
            const lastMsg = await HexagramMessage.findOne({ conversationId: conversation._id }).sort({ timestamp: -1 });
            if (lastMsg && (Date.now() - new Date(lastMsg.timestamp).getTime()) < 10000) {
                return res.status(429).json({ error: 'Vui lòng chờ 10 giây giữa các câu hỏi.' });
            }

            const oneHourAgo = new Date(Date.now() - 3600000);
            const msgCountInLastHour = await HexagramMessage.countDocuments({
                conversationId: conversation._id,
                role: 'user',
                createdAt: { $gte: oneHourAgo }
            });
            if (msgCountInLastHour >= 10) {
                return res.status(429).json({ error: 'Bạn đã đạt giới hạn 10 câu hỏi/giờ cho quẻ này để tránh quá tải hạn mức.' });
            }

            // 4. Thiết lập SSE Stream
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            const sendSSE = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            // Gửi heartbeat ping mỗi 15s để chống idle timeout trên Vercel/Render
            pingInterval = setInterval(() => {
                res.write("event: ping\ndata: keepalive\n\n");
            }, 15000);

            // 5. Caching Rule Engine Output
            let analyzedData = record.analysisSnapshot;
            if (!analyzedData) {
                const reconstructed = HexagramDataService.reconstructLines(record.toObject());
                const fullRecord = {
                    ...record.toObject(),
                    primaryLines: reconstructed.primaryLines,
                    secondaryLines: reconstructed.secondaryLines,
                    primaryHexagram: reconstructed.primaryHexagram,
                    transformedHexagram: reconstructed.transformedHexagram
                };

                let userGender = 1;
                if (record.userId && record.userId !== 'guest') {
                    const user = await User.findById(record.userId).lean();
                    if (user && user.gender !== undefined) userGender = user.gender;
                }

                analyzedData = RuleEngineService.analyze(fullRecord, userGender);
                
                // Lưu vào snapshot
                await updateByIdFlex(HexagramRecord, id, { analysisSnapshot: analyzedData });
            }

            // 6. Xây dựng bối cảnh cuộc đối thoại
            const context = await ConversationContextService.buildConversationContext('hexagram', conversation._id);

            // Tái thiết lập bản ghi quẻ đầy đủ cho prompt generator
            const reconstructed = HexagramDataService.reconstructLines(record.toObject());
            const fullRecord = {
                ...record.toObject(),
                primaryLines: reconstructed.primaryLines,
                secondaryLines: reconstructed.secondaryLines,
                primaryHexagram: reconstructed.primaryHexagram,
                transformedHexagram: reconstructed.transformedHexagram
            };

            // 7. Tạo Prompt Follow-up
            const prompt = PromptTemplateManager.getHexagramFollowUpPrompt(fullRecord, analyzedData, context, question);

            // Lưu tin nhắn của User vào Database
            const userTokens = await AiService.countTokens(question, { model: ACTIVE_MODEL });
            await HexagramMessage.create({
                conversationId: conversation._id,
                role: 'user',
                content: question,
                promptTokens: userTokens,
                totalTokens: userTokens
            });

            // 8. Stream dữ liệu từ AI
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";

            for await (const chunk of resultStream.stream) {
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            // 9. Xử lý lưu trữ phản hồi có cấu trúc JSON từ AI
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            let parsed = { answer: "", timing: null, risk: null, confidence: 0.85 };
            
            try {
                parsed = JSON.parse(cleanedContent);
            } catch (e) {
                const match = cleanedContent.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        const escaped = match[0].replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m, p1) => {
                            return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
                        });
                        parsed = JSON.parse(escaped);
                    } catch (e2) {
                        const answerMatch = match[0].match(/"answer"\s*:\s*"([\s\S]*?)"\s*,\s*"timing"/);
                        const answer = answerMatch ? answerMatch[1] : "";
                        
                        const timingMatch = match[0].match(/"timing"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const timing = timingMatch ? (timingMatch[1] || null) : null;
                        
                        const riskMatch = match[0].match(/"risk"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const risk = riskMatch ? (riskMatch[1] || null) : null;
                        
                        const confidenceMatch = match[0].match(/"confidence"\s*:\s*([0-9.]+)/);
                        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.85;

                        if (answer) {
                            parsed = { answer, timing, risk, confidence };
                        } else {
                            parsed.answer = cleanedContent;
                        }
                    }
                } else {
                    parsed.answer = cleanedContent;
                }
            }

            // Tính toán token AI
            const promptTokens = await AiService.countTokens(prompt, { model: ACTIVE_MODEL });
            const completionTokens = await AiService.countTokens(cleanedContent, { model: ACTIVE_MODEL });
            const totalTurnTokens = promptTokens + completionTokens;

            // Lưu tin nhắn AI vào Database
            await HexagramMessage.create({
                conversationId: conversation._id,
                role: 'ai',
                content: JSON.stringify(parsed),
                promptTokens: promptTokens,
                completionTokens: completionTokens,
                totalTokens: totalTurnTokens,
                structuredContent: {
                    answer: parsed.answer || cleanedContent,
                    timing: parsed.timing || null,
                    risk: parsed.risk || null,
                    confidence: parsed.confidence !== undefined ? parsed.confidence : 0.85
                }
            });

            // Cập nhật tổng số tin nhắn và token của Conversation
            await HexagramConversation.findByIdAndUpdate(conversation._id, {
                $inc: {
                    messageCount: 2,
                    totalPromptTokens: userTokens + promptTokens,
                    totalCompletionTokens: completionTokens,
                    totalTokens: userTokens + promptTokens + completionTokens
                }
            });

            // Cập nhật tóm tắt hội thoại bất đồng bộ
            ConversationContextService.updateConversationSummary('hexagram', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating conversation summary:", err));

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('hexagrams', id);

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Hexagram Chat Follow-up Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra trong quá trình sinh câu trả lời AI.' })}\n\n`);
            res.end();
        } finally {
            if (pingInterval) clearInterval(pingInterval);
        }
    }

    static async chatBazi(req, res) {
        const { id } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
        }

        // 1. Kiểm tra Intent Filter bảo vệ Quota
        if (!ConversationContextService.isDivinationRelated(question)) {
            return res.status(400).json({
                error: 'Tôi là trợ lý luận giải Bát Tự mệnh lý. Vui lòng hỏi những câu hỏi liên quan đến vận thế, công việc, tình duyên, gia đạo, thời tiết hoặc lá số này.'
            });
        }

        let record = null;
        let pingInterval = null;

        try {
            record = await findByIdFlex(BaziRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });
            }

            // 2. Tìm hoặc tạo cuộc hội thoại
            let conversation = await BaziConversation.findOne({ recordId: id });
            if (!conversation) {
                conversation = await BaziConversation.create({
                    recordId: id,
                    userId: record.userId || 'guest'
                });
            }

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('bazi', id);

            // 3. Rate Limit & Anti-Spam
            const lastMsg = await BaziMessage.findOne({ conversationId: conversation._id }).sort({ timestamp: -1 });
            if (lastMsg && (Date.now() - new Date(lastMsg.timestamp).getTime()) < 10000) {
                return res.status(429).json({ error: 'Vui lòng chờ 10 giây giữa các câu hỏi.' });
            }

            const oneHourAgo = new Date(Date.now() - 3600000);
            const msgCountInLastHour = await BaziMessage.countDocuments({
                conversationId: conversation._id,
                role: 'user',
                createdAt: { $gte: oneHourAgo }
            });
            if (msgCountInLastHour >= 10) {
                return res.status(429).json({ error: 'Bạn đã đạt giới hạn 10 câu hỏi/giờ cho lá số này.' });
            }

            // 4. Thiết lập SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            const sendSSE = (data) => {
                res.write(`data: ${JSON.stringify(data)}\n\n`);
            };

            pingInterval = setInterval(() => {
                res.write("event: ping\ndata: keepalive\n\n");
            }, 15000);

            // 5. Caching Bazi Rule Output (Bazi data is already analyzed during casting and stored in record.baziData)
            let analyzedData = record.analysisSnapshot;
            if (!analyzedData) {
                analyzedData = record.baziData;
                await updateByIdFlex(BaziRecord, id, { analysisSnapshot: analyzedData });
            }

            // 6. Xây dựng bối cảnh hội thoại
            const context = await ConversationContextService.buildConversationContext('bazi', conversation._id);

            // 7. Tạo Prompt
            const prompt = PromptTemplateManager.getBaziFollowUpPrompt(record.toObject(), context, question);

            // Lưu tin nhắn User vào DB
            const userTokens = await AiService.countTokens(question, { model: ACTIVE_MODEL });
            await BaziMessage.create({
                conversationId: conversation._id,
                role: 'user',
                content: question,
                promptTokens: userTokens,
                totalTokens: userTokens
            });

            // 8. Stream AI
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";

            for await (const chunk of resultStream.stream) {
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            // 9. Lưu trữ AI message dạng structured JSON
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            let parsed = { answer: "", timing: null, risk: null, confidence: 0.80 };
            
            try {
                parsed = JSON.parse(cleanedContent);
            } catch (e) {
                const match = cleanedContent.match(/\{[\s\S]*\}/);
                if (match) {
                    try {
                        const escaped = match[0].replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m, p1) => {
                            return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
                        });
                        parsed = JSON.parse(escaped);
                    } catch (e2) {
                        const answerMatch = match[0].match(/"answer"\s*:\s*"([\s\S]*?)"\s*,\s*"timing"/);
                        const answer = answerMatch ? answerMatch[1] : "";
                        
                        const timingMatch = match[0].match(/"timing"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const timing = timingMatch ? (timingMatch[1] || null) : null;
                        
                        const riskMatch = match[0].match(/"risk"\s*:\s*(?:"([\s\S]*?)"|null)/);
                        const risk = riskMatch ? (riskMatch[1] || null) : null;
                        
                        const confidenceMatch = match[0].match(/"confidence"\s*:\s*([0-9.]+)/);
                        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.80;

                        if (answer) {
                            parsed = { answer, timing, risk, confidence };
                        } else {
                            parsed.answer = cleanedContent;
                        }
                    }
                } else {
                    parsed.answer = cleanedContent;
                }
            }

            // Tính toán token AI
            const promptTokens = await AiService.countTokens(prompt, { model: ACTIVE_MODEL });
            const completionTokens = await AiService.countTokens(cleanedContent, { model: ACTIVE_MODEL });
            const totalTurnTokens = promptTokens + completionTokens;

            await BaziMessage.create({
                conversationId: conversation._id,
                role: 'ai',
                content: JSON.stringify(parsed),
                promptTokens: promptTokens,
                completionTokens: completionTokens,
                totalTokens: totalTurnTokens,
                structuredContent: {
                    answer: parsed.answer || cleanedContent,
                    timing: parsed.timing || null,
                    risk: parsed.risk || null,
                    confidence: parsed.confidence !== undefined ? parsed.confidence : 0.80
                }
            });

            // Cập nhật tổng số tin nhắn và token của Conversation
            await BaziConversation.findByIdAndUpdate(conversation._id, {
                $inc: {
                    messageCount: 2,
                    totalPromptTokens: userTokens + promptTokens,
                    totalCompletionTokens: completionTokens,
                    totalTokens: userTokens + promptTokens + completionTokens
                }
            });

            // Cập nhật tóm tắt
            ConversationContextService.updateConversationSummary('bazi', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating Bazi summary:", err));

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('bazi', id);

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Bazi Chat Follow-up Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra khi sinh câu hỏi Bát Tự.' })}\n\n`);
            res.end();
        } finally {
            if (pingInterval) clearInterval(pingInterval);
        }
    }
}

module.exports = AiInterpretationController;
