const ZiweiRecord = require('../models/ZiweiRecord');
const Conversation = require('../../../core/models/Conversation');
const Message = require('../../../core/models/Message');
const ZiweiFormatter = require('../services/ZiweiFormatter');
const ZiweiPrompts = require('../services/ZiweiPrompts');
const SymbolicAnalyzer = require('../../../shared/knowledge-engine/SymbolicAnalyzer');
const AiService = require('../../../core/ai/AiService');
const ConversationContextService = require('../../../core/ai/ConversationContextService');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const MultiAgentPipelineService = require('../../../core/services/MultiAgentPipelineService');
const AiStreamHelper = require('../../../core/ai/AiStreamHelper');
const { formatFieldToString, parseAiJsonChunk } = require('../../../core/utils/aiFormatters');
const { findByIdFlex, updateByIdFlex } = require('../../../core/services/HistoryQueryHelper');

const { ACTIVE_MODEL, ZIWEI_PROMPT_VERSION } = require('../../../core/config/ai');

const GEMINI_INPUT_RATE = 0.075 / 1000000;
const GEMINI_OUTPUT_RATE = 0.30 / 1000000;
const ZIWEI_KNOWLEDGE_VERSION = "tv_know_v2";

class ZiweiAiController {
    static async interpretZiwei(req, res) {
        const { id } = req.params;
        let record = null;
        let sse = null;

        try {
            record = req.record || await ZiweiRecord.findById(id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi lá số Tử Vi.' });
            }

            if (record.isGeneratingInterpretation) {
                const lockTime = record.updatedAt || record.createdAt || new Date();
                const elapsedSeconds = (new Date() - new Date(lockTime)) / 1000;
                if (elapsedSeconds < 15) {
                    return res.status(409).json({ error: 'Hệ thống đang tiến hành luận giải cho lá số này. Vui lòng đợi trong giây lát, hãy ấn vào luận giải ngay 1 lần nữa.' });
                }
                record.isGeneratingInterpretation = false;
                await record.save();
            }

            sse = AiStreamHelper.initSseSession(req, res);

            const isVipMode = req.body?.mode === 'vip' || req.query?.mode === 'vip';
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                (isVipMode ? record.aiInterpretation.mode === 'vip' : true);

            if (hasValidCache) {
                if (req.refundCredit) await req.refundCredit();
                sse.sendSSE({ chunk: record.aiInterpretation.content });
                sse.sendDone();
                return;
            }

            await updateByIdFlex(ZiweiRecord, id, { isGeneratingInterpretation: true });

            const symbolicAnalysis = SymbolicAnalyzer.analyze(record.chartData);
            const compressed = ZiweiFormatter.compressForAi(record);
            const prompt = ZiweiPrompts.buildMarkdownPrompt(compressed, symbolicAnalysis);

            let accumulatedText = "";
            let usageMetadata = null;

            if (isVipMode) {
                const birthYear = record.inputInfo?.birthSolarYear || record.inputInfo?.date?.split('/')?.[2];
                const vipResult = await MultiAgentPipelineService.runZiweiVipPipelineStream(prompt, birthYear, {
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

            if (!sse.isOpen()) return res.end();

            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const { promptTokens, completionTokens, tokensUsed } = AiStreamHelper.calculateTokens(prompt, cleanedContent, usageMetadata);
            const cost = (promptTokens * GEMINI_INPUT_RATE) + (completionTokens * GEMINI_OUTPUT_RATE);

            await updateByIdFlex(ZiweiRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    mode: isVipMode ? 'vip' : 'standard',
                    summary: "", 
                    sections: [], 
                    generatedAt: new Date(),
                    model: isVipMode ? 'Multi-Agent Chuyên Sâu (Qwen Plus + Gemini 3.1 Flash Lite)' : ACTIVE_MODEL,
                    promptVersion: ZIWEI_PROMPT_VERSION,
                    knowledgeVersion: ZIWEI_KNOWLEDGE_VERSION,
                    promptTokens,
                    completionTokens,
                    tokensUsed,
                    cost
                },
                analysisSnapshot: symbolicAnalysis,
                isGeneratingInterpretation: false
            });

            AiStreamHelper.recordInterpretTokens(record.userId, 'ziwei', tokensUsed);

            sse.sendDone();

        } catch (error) {
            console.error("Ziwei Interpret SSE Error:", error);
            if (sse) sse.sendError(error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Tử Vi.');
            else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        } finally {
            if (sse) sse.cleanup();
            if (record) {
                try {
                    await updateByIdFlex(ZiweiRecord, id, { isGeneratingInterpretation: false });
                } catch (dbErr) {
                    console.error("Failed to release lock in Ziwei Interpret finally block:", dbErr);
                }
            }
        }
    }

    static async chatZiwei(req, res) {
        let sse = null;
        try {
            const { id } = req.params;
            const { question, activeSectionId } = req.body;

            if (!question || !question.trim()) {
                return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
            }

            if (!ConversationContextService.isDivinationRelated(question)) {
                return res.status(400).json({
                    error: 'Tôi là trợ lý luận giải Tử Vi. Vui lòng hỏi những câu hỏi liên quan đến cung mệnh, gia đạo, sự nghiệp, tài lộc, thời tiết hoặc lá số này.'
                });
            }

            const record = req.record || await ZiweiRecord.findById(id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi lá số Tử Vi.' });
            }

            let conversation = await Conversation.findOne({ recordId: id, system: 'ziwei' });
            if (!conversation) {
                conversation = await Conversation.create({
                    recordId: id,
                    userId: record.userId || 'guest',
                    system: 'ziwei'
                });
            }

            MemoryCacheService.clearChatCache('ziwei', id);

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

            const context = await ConversationContextService.buildConversationContext('ziwei', conversation._id);

            const recentMessages = await Message.find({ conversationId: conversation._id })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();
            recentMessages.reverse();

            let memoryContext = "";
            if (conversation.summarizedMemory) {
                memoryContext = `Tóm tắt bối cảnh hội thoại cũ: ${conversation.summarizedMemory}\n\n`;
            }

            const historyPrompt = recentMessages.map(msg => 
                `${msg.role === 'user' ? 'Đương số' : 'Thầy'}: ${msg.content}`
            ).join("\n");

            const compressedChart = ZiweiFormatter.compressForAi(record);
            const symbolicAnalysis = record.analysisSnapshot || SymbolicAnalyzer.analyze(record.chartData);

            const vipContext = (ConversationContextService.extractVipContext && ConversationContextService.extractVipContext({
                record,
                system: 'ziwei',
                activeSectionId,
                userQuestion: question
            })) || {};

            const prompt = ZiweiPrompts.buildFollowUpPrompt(compressedChart, symbolicAnalysis, memoryContext, historyPrompt, question, vipContext.contextText || "");

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

            sse = AiStreamHelper.initSseSession(req, res);

            if (vipContext.matchedSections && vipContext.matchedSections.length > 0) {
                sse.sendSSE({
                    type: 'context_meta',
                    activeSectionId: vipContext.activeSectionId,
                    activeSectionTitle: vipContext.activeSectionTitle,
                    matchedSections: vipContext.matchedSections
                });
            }

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

            if (!sse.isOpen()) return res.end();

            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            let parsed = { answer: "", confidence: 0.85 };
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
                        const answerMatch = match[0].match(/"answer"\s*:\s*"([\s\S]*?)"/);
                        const answer = answerMatch ? answerMatch[1] : "";
                        const confidenceMatch = match[0].match(/"confidence"\s*:\s*([0-9.]+)/);
                        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.85;

                        if (answer) {
                            parsed = { answer, confidence };
                        } else {
                            parsed.answer = cleanedContent;
                        }
                    }
                } else {
                    parsed.answer = cleanedContent;
                }
            }

            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
            const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
            const tokensUsed = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

            const answerText = parsed.answer || cleanedContent || accumulatedText || "";
            const conf = typeof parsed.confidence === 'number' ? parsed.confidence : 0.85;

            const aiStructured = {
                answer: answerText,
                timing: formatFieldToString(parsed.timing),
                risk: formatFieldToString(parsed.risk),
                dos: formatFieldToString(parsed.dos),
                donts: formatFieldToString(parsed.donts),
                confidence: conf
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
                    totalTokens: tokensUsed,
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
                    totalTokens: tokensUsed,
                    structuredContent: {
                        answer: answerText,
                        confidence: 0.85
                    }
                });
            }

            await Conversation.findByIdAndUpdate(conversation._id, {
                $inc: { totalTokens: userTokens + tokensUsed }
            });

            AiStreamHelper.recordChatTokens(conversation.userId, 'ziwei', userTokens + tokensUsed);

            ConversationContextService.updateConversationSummary('ziwei', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating Ziwei summary:", err));

            MemoryCacheService.clearChatCache('ziwei', id);

            sse.sendDone();

        } catch (error) {
            console.error("[ZiweiAiController.chatZiwei] Error:", error);
            if (sse) sse.sendError(error.message || 'Lỗi sinh phản hồi từ AI.');
            else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
        } finally {
            if (sse) sse.cleanup();
        }
    }
}

module.exports = ZiweiAiController;
