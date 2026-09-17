const BaziRecord = require('../models/BaziRecord');
const Conversation = require('../../../core/models/Conversation');
const Message = require('../../../core/models/Message');
const BaziPrompts = require('../services/BaziPrompts');
const AiService = require('../../../core/ai/AiService');
const ConversationContextService = require('../../../core/ai/ConversationContextService');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const MultiAgentPipelineService = require('../../../core/services/MultiAgentPipelineService');
const UserStatsService = require('../../../core/services/UserStatsService');
const AiStreamHelper = require('../../../core/ai/AiStreamHelper');
const { formatFieldToString, parseAiJsonChunk } = require('../../../core/utils/aiFormatters');
const { findByIdFlex, updateByIdFlex } = require('../../../core/services/HistoryQueryHelper');

const { ACTIVE_MODEL, BAZI_PROMPT_VERSION } = require('../../../core/config/ai');

class BaziAiController {
    static async interpretBazi(req, res) {
        const { id } = req.params;
        let record = null;
        let sse = null;

        try {
            record = req.record || await findByIdFlex(BaziRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });
            }

            // Check lock to prevent race conditions
            if (record.isGeneratingInterpretation) {
                const lockTime = record.updatedAt || record.createdAt || new Date();
                const elapsedSeconds = (new Date() - new Date(lockTime)) / 1000;
                if (elapsedSeconds < 15) {
                    return res.status(409).json({ error: 'Hệ thống đang tiến hành luận giải cho lá số này. Vui lòng đợi trong giây lát, hãy ấn vào luận giải ngay 1 lần nữa.' });
                }
                await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: false });
            }

            // Establish SSE
            sse = AiStreamHelper.initSseSession(req, res);

            let isCompleted = false;
            req.on('close', async () => {
                if (!isCompleted && req.refundCredit) {
                    try { await req.refundCredit(); } catch (e) {}
                }
            });

            // Invalidate Cache check
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

            // Lock record
            await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: true });

            const prompt = isVipMode 
                ? BaziPrompts.getDeepPrompt(record.toObject())
                : BaziPrompts.getStandardPrompt(record.toObject());

            let accumulatedText = "";
            let usageMetadata = null;

            if (isVipMode) {
                const birthYear = record.inputInfo?.birthSolarYear || record.inputInfo?.date?.split('/')?.[2];
                const vipResult = await MultiAgentPipelineService.runVipPipelineStream(prompt, birthYear, {
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

            await updateByIdFlex(BaziRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    mode: isVipMode ? 'vip' : 'standard',
                    generatedAt: new Date(),
                    model: isVipMode ? 'Chuyên Sâu' : 'Tiêu Chuẩn',
                    promptVersion: BAZI_PROMPT_VERSION,
                    promptTokens,
                    completionTokens,
                    tokensUsed
                },
                isGeneratingInterpretation: false
            });

            isCompleted = true;

            AiStreamHelper.recordInterpretTokens(record.userId, 'bazi', tokensUsed);

            sse.sendDone();

        } catch (error) {
            console.error("Bazi Interpret SSE Error:", error);
            if (req.refundCredit) {
                try { await req.refundCredit(); } catch (refErr) { console.error("Refund credit failed:", refErr); }
            }
            if (sse) sse.sendError(error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Bát Tự.');
            else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        } finally {
            if (sse) sse.cleanup();
            if (record) {
                await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async chatBazi(req, res) {
        const { id } = req.params;
        const { question, activeSectionId } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
        }

        if (!ConversationContextService.isDivinationRelated(question)) {
            return res.status(400).json({
                error: 'Tôi là trợ lý luận giải Bát Tự mệnh lý. Vui lòng hỏi những câu hỏi liên quan đến vận thế, công việc, tình duyên, gia đạo, thời tiết hoặc lá số này.'
            });
        }

        let sse = null;
        try {
            const record = req.record || await findByIdFlex(BaziRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });
            }

            let conversation = await Conversation.findOne({ recordId: id, system: 'bazi' });
            if (!conversation) {
                conversation = await Conversation.create({
                    recordId: id,
                    userId: record.userId || 'guest',
                    system: 'bazi'
                });
            }

            MemoryCacheService.clearChatCache('bazi', id);

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

            let analyzedData = record.analysisSnapshot;
            if (!analyzedData) {
                analyzedData = record.baziData;
                await updateByIdFlex(BaziRecord, id, { analysisSnapshot: analyzedData });
            }

            const context = await ConversationContextService.buildConversationContext('bazi', conversation._id);

            const vipContext = (ConversationContextService.extractVipContext && ConversationContextService.extractVipContext({
                record,
                system: 'bazi',
                activeSectionId,
                userQuestion: question
            })) || {};
            const prompt = BaziPrompts.getFollowUpPrompt(record.toObject(), context, question, vipContext.contextText || "");

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

            AiStreamHelper.recordChatTokens(conversation.userId, 'bazi', userTokens + totalTurnTokens);

            ConversationContextService.updateConversationSummary('bazi', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating Bazi summary:", err));

            MemoryCacheService.clearChatCache('bazi', id);

            isCompleted = true;
            sse.sendDone();

        } catch (error) {
            console.error("Bazi Chat Follow-up Error:", error);
            if (req.refundChatCredit) {
                try { await req.refundChatCredit(); } catch (refErr) { console.error("Refund chat credit failed:", refErr); }
            }
            if (sse) sse.sendError(error.message || 'Lỗi xảy ra khi sinh câu hỏi Bát Tự.');
            else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        } finally {
            if (sse) sse.cleanup();
        }
    }
}

module.exports = BaziAiController;
