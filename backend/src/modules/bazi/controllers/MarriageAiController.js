const MarriageRecord = require('../models/MarriageRecord');
const Conversation = require('../../../core/models/Conversation');
const Message = require('../../../core/models/Message');
const MarriagePrompts = require('../services/MarriagePrompts');
const AiService = require('../../../core/ai/AiService');
const ConversationContextService = require('../../../core/ai/ConversationContextService');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const MultiAgentPipelineService = require('../../../core/services/MultiAgentPipelineService');
const UserStatsService = require('../../../core/services/UserStatsService');
const AiStreamHelper = require('../../../core/ai/AiStreamHelper');
const { formatFieldToString, parseAiJsonChunk } = require('../../../core/utils/aiFormatters');
const { findByIdFlex, updateByIdFlex } = require('../../../core/services/HistoryQueryHelper');

const { ACTIVE_MODEL, MARRIAGE_PROMPT_VERSION } = require('../../../core/config/ai');

class MarriageAiController {
    static async interpretMarriage(req, res) {
        const { id } = req.params;
        let record = null;
        let sse = null;

        try {
            record = req.record || await findByIdFlex(MarriageRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi hôn nhân.' });
            }

            if (record.isGeneratingInterpretation) {
                const lockTime = record.updatedAt || record.createdAt || new Date();
                const elapsedSeconds = (new Date() - new Date(lockTime)) / 1000;
                if (elapsedSeconds < 15) {
                    return res.status(409).json({ error: 'Hệ thống đang tiến hành luận giải cho lá số hợp hôn này. Vui lòng đợi trong giây lát, hãy ấn vào luận giải ngay 1 lần nữa.' });
                }
                await updateByIdFlex(MarriageRecord, id, { isGeneratingInterpretation: false });
            }

            sse = AiStreamHelper.initSseSession(req, res);

            let isCompleted = false;
            req.on('close', async () => {
                if (!isCompleted && req.refundCredit) {
                    try { await req.refundCredit(); } catch (e) {}
                }
            });

            const isVipMode = req.body?.mode === 'vip' || req.query?.mode === 'vip';
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                (isVipMode ? record.aiInterpretation.mode === 'vip' : true);

            if (hasValidCache) {
                isCompleted = true;
                if (req.refundCredit) await req.refundCredit();
                sse.sendSSE({ chunk: record.aiInterpretation.content });
                sse.sendDone();
                return;
            }

            await updateByIdFlex(MarriageRecord, id, { isGeneratingInterpretation: true });

            const prompt = MarriagePrompts.getInterpretationPrompt(record.toObject());

            let accumulatedText = "";
            let usageMetadata = null;

            if (isVipMode) {
                const birthYear = record.male?.birthSolarYear || record.male?.date?.split('/')?.[2] || record.female?.birthSolarYear || new Date().getFullYear();
                const vipResult = await MultiAgentPipelineService.runMarriageVipPipelineStream(prompt, birthYear, {
                    onProgress: (progress) => sse.sendSSE(progress)
                });
                for await (const chunk of vipResult.stream) {
                    if (!sse.isOpen()) break;
                    const chunkText = typeof chunk === 'string' ? chunk : new TextDecoder().decode(chunk);
                    accumulatedText += chunkText;
                    sse.sendSSE({ chunk: chunkText });
                }
            } else {
                const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
                for await (const chunk of resultStream.stream) {
                    if (!sse.isOpen()) break;
                    if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                    const chunkText = chunk.text();
                    accumulatedText += chunkText;
                    sse.sendSSE({ chunk: chunkText });
                }
            }

            if (!sse.isOpen()) {
                if (!isCompleted && req.refundCredit) await req.refundCredit();
                return res.end();
            }

            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const { promptTokens, completionTokens, tokensUsed } = AiStreamHelper.calculateTokens(prompt, cleanedContent, usageMetadata);

            await updateByIdFlex(MarriageRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    mode: isVipMode ? 'vip' : 'standard',
                    generatedAt: new Date(),
                    model: isVipMode ? 'Chuyên Sâu' : 'Tiêu Chuẩn',
                    promptVersion: MARRIAGE_PROMPT_VERSION,
                    promptTokens,
                    completionTokens,
                    tokensUsed
                },
                isGeneratingInterpretation: false
            });

            isCompleted = true;

            AiStreamHelper.recordInterpretTokens(record.userId, 'marriage', tokensUsed);

            sse.sendDone();

        } catch (error) {
            console.error("Marriage Interpret SSE Error:", error);
            if (req.refundCredit) {
                try { await req.refundCredit(); } catch (refErr) { console.error("Refund credit failed:", refErr); }
            }
            if (sse) sse.sendError(error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Hợp Hôn.');
            else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        } finally {
            if (sse) sse.cleanup();
            if (record) {
                await updateByIdFlex(MarriageRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async chatMarriage(req, res) {
        const { id } = req.params;
        const { question, activeSectionId } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
        }

        if (!ConversationContextService.isDivinationRelated(question)) {
            return res.status(400).json({
                error: 'Tôi là trợ lý luận giải hôn nhân gia đạo. Vui lòng hỏi những câu hỏi liên quan đến tình duyên, gia đạo, con cái hoặc lá số này.'
            });
        }

        let sse = null;
        try {
            const record = req.record || await findByIdFlex(MarriageRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Hợp Hôn.' });
            }

            let conversation = await Conversation.findOne({ recordId: id, system: 'marriage' });
            if (!conversation) {
                conversation = await Conversation.create({
                    recordId: id,
                    userId: record.userId || 'guest',
                    system: 'marriage'
                });
            }

            MemoryCacheService.clearChatCache('marriage', id);

            const lastMsg = await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 });
            if (lastMsg && (Date.now() - new Date(lastMsg.createdAt).getTime()) < 10000) {
                return res.status(429).json({ error: 'Vui lòng chờ 10 giây giữa các câu hỏi.' });
            }

            const oneHourAgo = new Date(Date.now() - 3600000);
            const msgCountInLastHour = await Message.countDocuments({
                conversationId: conversation._id,
                role: 'user',
                createdAt: { $gte: oneHourAgo }
            });
            if (msgCountInLastHour >= 10) {
                return res.status(429).json({ error: 'Bạn đã đạt giới hạn 10 câu hỏi/giờ cho lá số này.' });
            }

            sse = AiStreamHelper.initSseSession(req, res);

            let isCompleted = false;
            req.on('close', async () => {
                if (!isCompleted && req.refundChatCredit) {
                    try { await req.refundChatCredit(); } catch (e) {}
                }
            });

            const context = await ConversationContextService.buildConversationContext('marriage', conversation._id);

            const vipContext = (ConversationContextService.extractVipContext && ConversationContextService.extractVipContext({
                record,
                system: 'marriage',
                activeSectionId,
                userQuestion: question
            })) || {};
            const prompt = MarriagePrompts.getFollowUpPrompt(record.toObject(), context, question, "v2.0-followup", vipContext.contextText || "");

            if (vipContext.matchedSections && vipContext.matchedSections.length > 0) {
                sse.sendSSE({
                    type: 'context_meta',
                    activeSectionId: vipContext.activeSectionId,
                    activeSectionTitle: vipContext.activeSectionTitle,
                    matchedSections: vipContext.matchedSections
                });
            }

            const userTokens = Math.ceil((question || '').length / 4);
            await Message.create({
                conversationId: conversation._id,
                role: 'user',
                content: question,
                sectionId: activeSectionId || null,
                sectionTitle: vipContext.activeSectionTitle || null,
                promptTokens: userTokens,
                totalTokens: userTokens
            });

            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!sse.isOpen()) break;
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sse.sendSSE({ chunk: chunkText });
            }

            if (!sse.isOpen()) {
                if (!isCompleted && req.refundChatCredit) await req.refundChatCredit();
                return res.end();
            }

            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const parsed = parseAiJsonChunk(cleanedContent);

            const { promptTokens, completionTokens, tokensUsed: totalTurnTokens } = AiStreamHelper.calculateTokens(prompt, cleanedContent, usageMetadata);

            const answerText = parsed.answer || cleanedContent || accumulatedText || "";
            const aiStructured = {
                answer: answerText,
                dos: formatFieldToString(parsed.dos),
                donts: formatFieldToString(parsed.donts),
                timing: formatFieldToString(parsed.timing),
                risk: formatFieldToString(parsed.risk),
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.80
            };

            try {
                await Message.create({
                    conversationId: conversation._id,
                    role: 'ai',
                    content: JSON.stringify(aiStructured),
                    sectionId: activeSectionId || null,
                    sectionTitle: vipContext.activeSectionTitle || null,
                    promptTokens,
                    completionTokens,
                    totalTokens: totalTurnTokens,
                    structuredContent: aiStructured
                });
            } catch (saveErr) {
                await Message.create({
                    conversationId: conversation._id,
                    role: 'ai',
                    content: answerText,
                    sectionId: activeSectionId || null,
                    sectionTitle: vipContext.activeSectionTitle || null,
                    promptTokens,
                    completionTokens,
                    totalTokens: totalTurnTokens,
                    structuredContent: { answer: answerText, confidence: 0.80 }
                });
            }

            await Conversation.findByIdAndUpdate(conversation._id, {
                $inc: { totalTokens: userTokens + totalTurnTokens }
            });

            AiStreamHelper.recordChatTokens(conversation.userId, 'marriage', userTokens + totalTurnTokens);

            ConversationContextService.updateConversationSummary('marriage', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating Marriage summary:", err));

            MemoryCacheService.clearChatCache('marriage', id);

            isCompleted = true;
            sse.sendDone();

        } catch (error) {
            console.error("Marriage Chat Follow-up Error:", error);
            if (req.refundChatCredit) {
                try { await req.refundChatCredit(); } catch (refErr) { console.error("Refund chat credit failed:", refErr); }
            }
            if (sse) sse.sendError(error.message || 'Lỗi xảy ra khi sinh câu hỏi Hôn Nhân.');
            else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        } finally {
            if (sse) sse.cleanup();
        }
    }
}

module.exports = MarriageAiController;
