const IChingRecord = require('../models/IChingRecord');
const Conversation = require('../../../core/models/Conversation');
const Message = require('../../../core/models/Message');
const User = require('../../../core/models/User');
const IChingPrompts = require('../services/IChingPrompts');
const IChingDataService = require('../services/IChingDataService');
const RuleEngineService = require('../services/RuleEngineService');
const AiService = require('../../../core/ai/AiService');
const ConversationContextService = require('../../../core/ai/ConversationContextService');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const MultiAgentPipelineService = require('../../../core/services/MultiAgentPipelineService');
const AiStreamHelper = require('../../../core/ai/AiStreamHelper');
const { formatFieldToString, parseAiJsonChunk } = require('../../../core/utils/aiFormatters');
const { findByIdFlex, updateByIdFlex } = require('../../../core/services/HistoryQueryHelper');
const { parseUngKyBlock } = require('../../../shared/utils/ungKyParser');

const { ACTIVE_MODEL, ICHING_PROMPT_VERSION } = require('../../../core/config/ai');

class IChingAiController {
    static async interpretHexagram(req, res) {
        const { id } = req.params;
        let record = null;
        let sse = null;

        try {
            record = req.record || await findByIdFlex(IChingRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            if (record.isGeneratingInterpretation) {
                const lockTime = record.updatedAt || record.createdAt || new Date();
                const elapsedSeconds = (new Date() - new Date(lockTime)) / 1000;
                if (elapsedSeconds < 15) {
                    return res.status(409).json({ error: 'Hệ thống đang sinh luận giải cho quẻ này. Vui lòng đợi trong giây lát, hãy ấn vào luận giải ngay 1 lần nữa.' });
                }
                await updateByIdFlex(IChingRecord, id, { isGeneratingInterpretation: false });
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

            await updateByIdFlex(IChingRecord, id, { isGeneratingInterpretation: true });

            const reconstructed = IChingDataService.parseLines({
                primaryHexagram: record.primaryHexagram,
                secondaryHexagram: record.transformedHexagram || record.primaryHexagram,
                movingLines: record.movingLines,
                dayGanZhi: record.lunarDateInfo.dayCanChi,
                monthGanZhi: record.lunarDateInfo.monthCanChi
            });
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
                if (user && user.gender !== undefined) {
                    userGender = user.gender;
                }
            }

            const analyzedData = RuleEngineService.analyze(fullRecord, userGender);
            const prompt = IChingPrompts.getInterpretationPrompt(fullRecord, analyzedData);

            let accumulatedText = "";
            let usageMetadata = null;

            if (isVipMode) {
                const birthYear = record.lunarDateInfo?.solarYear || record.solarYear || new Date().getFullYear();
                const castDate = record.lunarDateInfo?.solarDate || record.createdAt || new Date();
                const vipResult = await MultiAgentPipelineService.runIChingVipPipelineStream(prompt, birthYear, {
                    onProgress: (progress) => sse.sendSSE(progress),
                    castDate
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

            const { cleanedText: textWithoutUngKyTags, ungKyList } = parseUngKyBlock(accumulatedText, record.dateCast || new Date());
            const cleanedContent = AiService.cleanMarkdown(textWithoutUngKyTags);

            const { promptTokens, completionTokens, tokensUsed } = AiStreamHelper.calculateTokens(prompt, cleanedContent, usageMetadata);

            await updateByIdFlex(IChingRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    mode: isVipMode ? 'vip' : 'standard',
                    generatedAt: new Date(),
                    model: isVipMode ? 'Chuyên Sâu' : 'Tiêu Chuẩn',
                    promptVersion: ICHING_PROMPT_VERSION,
                    promptTokens,
                    completionTokens,
                    tokensUsed
                },
                ungKy: ungKyList,
                isGeneratingInterpretation: false
            });

            isCompleted = true;

            AiStreamHelper.recordInterpretTokens(record.userId, 'iching', tokensUsed);

            sse.sendDone();

        } catch (error) {
            console.error("Hexagram Interpret SSE Error:", error);
            if (req.refundCredit) {
                try { await req.refundCredit(); } catch (refErr) { console.error("Refund credit failed:", refErr); }
            }
            if (sse) sse.sendError(error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI.');
            else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        } finally {
            if (sse) sse.cleanup();
            if (record) {
                await updateByIdFlex(IChingRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async chatHexagram(req, res) {
        const { id } = req.params;
        const { question, activeSectionId } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
        }

        if (!ConversationContextService.isDivinationRelated(question)) {
            return res.status(400).json({
                error: 'Tôi là trợ lý luận giải Kinh Dịch. Vui lòng hỏi những câu hỏi liên quan đến sự việc, thời vận, cát hung hoặc diễn biến của quẻ này.'
            });
        }

        let sse = null;
        try {
            const record = req.record || await findByIdFlex(IChingRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            let conversation = await Conversation.findOne({ recordId: id, system: 'iching' });
            if (!conversation) {
                conversation = await Conversation.create({
                    recordId: id,
                    userId: record.userId || 'guest',
                    system: 'iching'
                });
            }

            MemoryCacheService.clearChatCache('iching', id);

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
                return res.status(429).json({ error: 'Bạn đã đạt giới hạn 10 câu hỏi/giờ cho quẻ dịch này.' });
            }

            sse = AiStreamHelper.initSseSession(req, res);

            let isCompleted = false;
            req.on('close', async () => {
                if (!isCompleted && req.refundChatCredit) {
                    try { await req.refundChatCredit(); } catch (e) {}
                }
            });

            const reconstructed = IChingDataService.parseLines({
                primaryHexagram: record.primaryHexagram,
                secondaryHexagram: record.transformedHexagram || record.primaryHexagram,
                movingLines: record.movingLines,
                dayGanZhi: record.lunarDateInfo?.dayCanChi,
                monthGanZhi: record.lunarDateInfo?.monthCanChi
            });
            const fullRecord = {
                ...record.toObject(),
                primaryLines: reconstructed.primaryLines,
                secondaryLines: reconstructed.secondaryLines,
                primaryHexagram: reconstructed.primaryHexagram,
                transformedHexagram: reconstructed.transformedHexagram
            };

            let analyzedData = record.analysisSnapshot;
            if (!analyzedData) {
                let userGender = 1;
                if (record.userId && record.userId !== 'guest') {
                    const user = await User.findById(record.userId).lean();
                    if (user && user.gender !== undefined) userGender = user.gender;
                }
                analyzedData = RuleEngineService.analyze(fullRecord, userGender);
                await updateByIdFlex(IChingRecord, id, { analysisSnapshot: analyzedData });
            }

            const context = await ConversationContextService.buildConversationContext('iching', conversation._id);

            const vipContext = (ConversationContextService.extractVipContext && ConversationContextService.extractVipContext({
                record,
                system: 'iching',
                activeSectionId,
                userQuestion: question
            })) || {};

            const prompt = IChingPrompts.getFollowUpPrompt(fullRecord, analyzedData, context, question, vipContext.contextText || "");

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

            AiStreamHelper.recordChatTokens(conversation.userId, 'iching', userTokens + totalTurnTokens);

            ConversationContextService.updateConversationSummary('iching', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating IChing summary:", err));

            MemoryCacheService.clearChatCache('iching', id);

            isCompleted = true;
            sse.sendDone();

        } catch (error) {
            console.error("IChing Chat Follow-up Error:", error);
            if (req.refundChatCredit) {
                try { await req.refundChatCredit(); } catch (refErr) { console.error("Refund chat credit failed:", refErr); }
            }
            if (sse) sse.sendError(error.message || 'Lỗi xảy ra khi sinh câu hỏi Kinh Dịch.');
            else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        } finally {
            if (sse) sse.cleanup();
        }
    }
}

module.exports = IChingAiController;
