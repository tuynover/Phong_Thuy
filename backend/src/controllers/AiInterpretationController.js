const IChingRecord = require('../models/IChingRecord');
const User = require('../models/User');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const RuleEngineService = require('../services/RuleEngineService');
const IChingPrompts = require('../services/IChingPrompts');
const BaziPrompts = require('../services/BaziPrompts');
const ZiweiPrompts = require('../services/ZiweiPrompts');
const MarriagePrompts = require('../services/MarriagePrompts');
const AiService = require('../services/AiService');
const IChingDataService = require('../services/IChingDataService');
const ConversationContextService = require('../services/ConversationContextService');
const MemoryCacheService = require('../services/MemoryCacheService');
const SymbolicAnalyzer = require('../shared/knowledge-engine/SymbolicAnalyzer');
const ZiweiFormatter = require('../services/ZiweiFormatter');
const mongoose = require('mongoose');

const {
    ACTIVE_MODEL,
    ICHING_PROMPT_VERSION,
    BAZI_PROMPT_VERSION,
    ZIWEI_PROMPT_VERSION,
    MARRIAGE_PROMPT_VERSION
} = require('../config/ai');

// Gemini 1.5 Flash-lite rates (USD)
const GEMINI_INPUT_RATE = 0.075 / 1000000;
const GEMINI_OUTPUT_RATE = 0.30 / 1000000;

const findByIdFlex = async (Model, id) => {
    return await Model.findById(id);
};

const updateByIdFlex = async (Model, id, update) => {
    const record = await Model.findByIdAndUpdate(id, update, { new: true });
    if (record && record.userId && record.userId !== 'guest') {
        const UserStatsService = require('../services/UserStatsService');
        if (update && update.aiInterpretation && update.aiInterpretation.tokensUsed > 0) {
            let system = 'iching';
            if (Model === BaziRecord) system = 'bazi';
            else if (Model === ZiweiRecord) system = 'ziwei';
            else if (Model === MarriageRecord) system = 'marriage';
            UserStatsService.incrementInterpretTokens(record.userId, system, update.aiInterpretation.tokensUsed);
        }
    }
    return record;
};

class AiInterpretationController {
    static async interpretHexagram(req, res) {
        const { id } = req.params;
        let record = null;

        try {
            record = req.record || await findByIdFlex(IChingRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            // Check lock to prevent race conditions
            if (record.isGeneratingInterpretation) {
                const lockTime = record.updatedAt || record.createdAt || new Date();
                const elapsedSeconds = (new Date() - new Date(lockTime)) / 1000;
                if (elapsedSeconds < 15) {
                    return res.status(409).json({ error: 'Hệ thống đang sinh luận giải cho quẻ này. Vui lòng đợi trong giây lát, hãy ấn vào luận giải ngay 1 lần nữa.' });
                }
                // Lock timed out, reset and proceed
                await updateByIdFlex(IChingRecord, id, { isGeneratingInterpretation: false });
            }

            // Establish SSE Header
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            let isConnectionOpen = true;
            let pingInterval = null;

            req.on('close', () => {
                isConnectionOpen = false;
                if (pingInterval) clearInterval(pingInterval);
            });

            const sendSSE = (data) => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            };

            pingInterval = setInterval(() => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(":\n\n");
                }
            }, 15000);

            // Invalidate Cache check
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                record.aiInterpretation.promptVersion === ICHING_PROMPT_VERSION &&
                record.aiInterpretation.model === ACTIVE_MODEL;

            if (hasValidCache) {
                if (req.refundCredit) await req.refundCredit();
                // Stream from cache immediately
                const cachedText = record.aiInterpretation.content;
                sendSSE({ chunk: cachedText });
                sendSSE('[DONE]');
                res.end();
                return;
            }

            // Lock the record
            await updateByIdFlex(IChingRecord, id, { isGeneratingInterpretation: true });

            // 0. Reconstruct lines
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
            const prompt = IChingPrompts.getInterpretationPrompt(fullRecord, analyzedData);

            // 3. Call AI Service and stream chunks
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!isConnectionOpen) {
                    console.log(`[SSE] Client closed connection, stopping IChing stream.`);
                    break;
                }
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            if (!isConnectionOpen) {
                return res.end();
            }

            // 4. Clean Markdown formatting & Parse/strip Ứng Kỳ block
            const { parseUngKyBlock } = require('../shared/utils/ungKyParser');
            const { cleanedText: textWithoutUngKyTags, ungKyList } = parseUngKyBlock(accumulatedText, record.dateCast || new Date());
            
            const cleanedContent = AiService.cleanMarkdown(textWithoutUngKyTags);
            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
            const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
            const tokensUsed = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

            // 5. Update Database Record
            await updateByIdFlex(IChingRecord, id, {
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
            if (pingInterval) clearInterval(pingInterval);
            if (record) {
                await updateByIdFlex(IChingRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async interpretBazi(req, res) {
        const { id } = req.params;
        let record = null;

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
                // Lock timed out, reset and proceed
                await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: false });
            }

            // Establish SSE Header
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            let isConnectionOpen = true;
            let pingInterval = null;

            req.on('close', () => {
                isConnectionOpen = false;
                if (pingInterval) clearInterval(pingInterval);
            });

            const sendSSE = (data) => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            };

            pingInterval = setInterval(() => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(":\n\n");
                }
            }, 15000);

            // Invalidate Cache check
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                record.aiInterpretation.promptVersion === BAZI_PROMPT_VERSION &&
                record.aiInterpretation.model === ACTIVE_MODEL;

            if (hasValidCache) {
                if (req.refundCredit) await req.refundCredit();
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
            const prompt = BaziPrompts.getInterpretationPrompt(record.toObject());

            // 2. Call AI Service and stream chunks
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!isConnectionOpen) {
                    console.log(`[SSE] Client closed connection, stopping Bazi stream.`);
                    break;
                }
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            if (!isConnectionOpen) {
                return res.end();
            }

            // 3. Clean Markdown & Estimate tokens
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
            const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
            const tokensUsed = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

            // 4. Update Database Record
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
            if (pingInterval) clearInterval(pingInterval);
            if (record) {
                await updateByIdFlex(BaziRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async interpretMarriage(req, res) {
        const { id } = req.params;
        let record = null;

        try {
            record = req.record || await findByIdFlex(MarriageRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi hôn nhân.' });
            }

            // Check lock to prevent race conditions
            if (record.isGeneratingInterpretation) {
                const lockTime = record.updatedAt || record.createdAt || new Date();
                const elapsedSeconds = (new Date() - new Date(lockTime)) / 1000;
                if (elapsedSeconds < 15) {
                    return res.status(409).json({ error: 'Hệ thống đang tiến hành luận giải cho lá số hợp hôn này. Vui lòng đợi trong giây lát, hãy ấn vào luận giải ngay 1 lần nữa.' });
                }
                // Lock timed out, reset and proceed
                await updateByIdFlex(MarriageRecord, id, { isGeneratingInterpretation: false });
            }

            // Establish SSE Header
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            let isConnectionOpen = true;
            let pingInterval = null;

            req.on('close', () => {
                isConnectionOpen = false;
                if (pingInterval) clearInterval(pingInterval);
            });

            const sendSSE = (data) => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            };

            pingInterval = setInterval(() => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(":\n\n");
                }
            }, 15000);

            // Invalidate Cache check
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                record.aiInterpretation.promptVersion === MARRIAGE_PROMPT_VERSION &&
                record.aiInterpretation.model === ACTIVE_MODEL;

            if (hasValidCache) {
                if (req.refundCredit) await req.refundCredit();
                // Stream from cache immediately
                const cachedText = record.aiInterpretation.content;
                sendSSE({ chunk: cachedText });
                sendSSE('[DONE]');
                res.end();
                return;
            }

            // Lock the record
            await updateByIdFlex(MarriageRecord, id, { isGeneratingInterpretation: true });

            // 1. Generate Prompt using analyzed Marriage data
            const prompt = MarriagePrompts.getInterpretationPrompt(record.toObject());

            // 2. Call AI Service and stream chunks
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!isConnectionOpen) {
                    console.log(`[SSE] Client closed connection, stopping Marriage stream.`);
                    break;
                }
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            if (!isConnectionOpen) {
                return res.end();
            }

            // 3. Clean Markdown & Estimate tokens
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
            const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
            const tokensUsed = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

            // 4. Update Database Record
            await updateByIdFlex(MarriageRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    generatedAt: new Date(),
                    model: ACTIVE_MODEL,
                    promptVersion: MARRIAGE_PROMPT_VERSION,
                    promptTokens: promptTokens,
                    completionTokens: completionTokens,
                    tokensUsed: tokensUsed
                },
                isGeneratingInterpretation: false
            });

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Marriage Interpret SSE Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Hợp Hôn.' })}\n\n`);
            res.end();
        } finally {
            if (pingInterval) clearInterval(pingInterval);
            if (record) {
                await updateByIdFlex(MarriageRecord, id, { isGeneratingInterpretation: false });
            }
        }
    }

    static async interpretZiwei(req, res) {
        const { id } = req.params;
        let record = null;

        try {
            record = req.record || await ZiweiRecord.findById(id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi lá số Tử Vi.' });
            }

            // Check lock to prevent race conditions (with 15-second timeout for self-healing)
            if (record.isGeneratingInterpretation) {
                const lockTime = record.updatedAt || record.createdAt || new Date();
                const elapsedSeconds = (new Date() - new Date(lockTime)) / 1000;
                if (elapsedSeconds < 15) {
                    return res.status(409).json({ error: 'Hệ thống đang tiến hành luận giải cho lá số này. Vui lòng đợi trong giây lát, hãy ấn vào luận giải ngay 1 lần nữa.' });
                }
                // Lock timed out, reset and proceed
                record.isGeneratingInterpretation = false;
                await record.save();
            }

            // Establish SSE Header
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            let isConnectionOpen = true;
            let pingInterval = null;

            req.on('close', () => {
                isConnectionOpen = false;
                if (pingInterval) clearInterval(pingInterval);
            });

            const sendSSE = (data) => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            };

            pingInterval = setInterval(() => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(":\n\n");
                }
            }, 15000);

            const ZIWEI_PROMPT_VERSION = "v3_14_palaces";
            const ZIWEI_KNOWLEDGE_VERSION = "tv_know_v2";

            // Invalidate Cache check
            const hasValidCache = 
                record.aiInterpretation &&
                record.aiInterpretation.content &&
                record.aiInterpretation.promptVersion === ZIWEI_PROMPT_VERSION &&
                record.aiInterpretation.model === ACTIVE_MODEL;

            if (hasValidCache) {
                if (req.refundCredit) await req.refundCredit();
                // Stream from cache immediately
                const cachedText = record.aiInterpretation.content;
                sendSSE({ chunk: cachedText });
                sendSSE('[DONE]');
                res.end();
                return;
            }

            // Lock the record
            await updateByIdFlex(ZiweiRecord, id, { isGeneratingInterpretation: true });

            // 1. Run Symbolic Analyzer
            const symbolicAnalysis = SymbolicAnalyzer.analyze(record.chartData);

            // 2. Compress data for AI
            const compressed = ZiweiFormatter.compressForAi(record);

            // 3. Build Markdown Prompt
            const prompt = ZiweiPrompts.buildMarkdownPrompt(compressed, symbolicAnalysis);

            // 4. Call AI Service and stream chunks
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!isConnectionOpen) {
                    console.log(`[SSE] Client closed connection, stopping Ziwei stream.`);
                    break;
                }
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            if (!isConnectionOpen) {
                return res.end();
            }

            // 5. Clean Markdown formatting & Estimate tokens
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
            const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
            const tokensUsed = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);
            const cost = (promptTokens * GEMINI_INPUT_RATE) + (completionTokens * GEMINI_OUTPUT_RATE);

            // 6. Update Database Record with rich metadata
            await updateByIdFlex(ZiweiRecord, id, {
                aiInterpretation: {
                    content: cleanedContent,
                    summary: "", 
                    sections: [], 
                    generatedAt: new Date(),
                    model: ACTIVE_MODEL,
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

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Ziwei Interpret SSE Error:", error);
            if (isConnectionOpen && !res.writableEnded) {
                res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra trong quá trình sinh luận giải AI cho Tử Vi.' })}\n\n`);
                res.end();
            }
        } finally {
            if (pingInterval) clearInterval(pingInterval);
            if (record) {
                try {
                    await updateByIdFlex(ZiweiRecord, id, { isGeneratingInterpretation: false });
                } catch (dbErr) {
                    console.error("Failed to release lock in Ziwei Interpret finally block:", dbErr);
                }
            }
        }
    }



    static async chatHexagram(req, res) {
        const { id } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
        }

        // 1. Kiểm tra Intent Filter bảo vệ Quota AI
        if (!ConversationContextService.isDivinationRelated(question)) {
            return res.status(400).json({
                error: 'Tôi là trợ lý luận giải Kinh Dịch và Bát Tự. Vui lòng hỏi những câu hỏi liên quan đến vận hạn, tình cảm, sự nghiệp, đời sống, thời tiết hoặc quẻ dịch này.'
            });
        }

        let record = null;
        let pingInterval = null;

        try {
            record = req.record || await findByIdFlex(IChingRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi quẻ dịch.' });
            }

            // 2. Tìm hoặc tạo cuộc hội thoại mới
            let conversation = await Conversation.findOne({ recordId: id, system: 'iching' });
            if (!conversation) {
                conversation = await Conversation.create({
                    recordId: id,
                    userId: record.userId || 'guest',
                    system: 'iching'
                });
            }

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('iching', id);

            // 3. Rate Limit & Anti-Spam (Cooldown 10 giây & Tối đa 10 tin nhắn/giờ)
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
                return res.status(429).json({ error: 'Bạn đã đạt giới hạn 10 câu hỏi/giờ cho quẻ này để tránh quá tải hạn mức.' });
            }

            // 4. Thiết lập SSE Stream
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            let isConnectionOpen = true;
            let pingInterval = null;

            req.on('close', () => {
                isConnectionOpen = false;
                if (pingInterval) clearInterval(pingInterval);
            });

            const sendSSE = (data) => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            };

            pingInterval = setInterval(() => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(":\n\n");
                }
            }, 15000);

            // 5. Caching Rule Engine Output
            let analyzedData = record.analysisSnapshot;
            if (!analyzedData) {
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
                    if (user && user.gender !== undefined) userGender = user.gender;
                }

                analyzedData = RuleEngineService.analyze(fullRecord, userGender);
                await updateByIdFlex(IChingRecord, id, { analysisSnapshot: analyzedData });
            }

            // 6. Xây dựng bối cảnh cuộc đối thoại
            const context = await ConversationContextService.buildConversationContext('iching', conversation._id);

            // Tái thiết lập bản ghi quẻ đầy đủ cho prompt generator
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

            // 7. Tạo Prompt Follow-up
            const prompt = IChingPrompts.getFollowUpPrompt(fullRecord, analyzedData, context, question);

            // Lưu tin nhắn của User vào Database
            const userTokens = Math.ceil((question || '').length / 4);
            await Message.create({
                conversationId: conversation._id,
                role: 'user',
                content: question,
                promptTokens: userTokens,
                totalTokens: userTokens
            });

            // 8. Stream dữ liệu từ AI
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!isConnectionOpen) {
                    console.log(`[SSE] Client closed connection, stopping IChing chat stream.`);
                    break;
                }
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            if (!isConnectionOpen) {
                return res.end();
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
            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
            const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
            const totalTurnTokens = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

            // Lưu tin nhắn AI vào Database
            await Message.create({
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

            // Cập nhật tổng số token của Conversation
            await Conversation.findByIdAndUpdate(conversation._id, {
                $inc: {
                    totalTokens: userTokens + totalTurnTokens
                }
            });

            if (conversation.userId && conversation.userId !== 'guest') {
                const UserStatsService = require('../services/UserStatsService');
                UserStatsService.incrementChatTokens(conversation.userId, 'iching', userTokens + totalTurnTokens);
            }

            // Cập nhật tóm tắt hội thoại bất đồng bộ
            ConversationContextService.updateConversationSummary('iching', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating conversation summary:", err));

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('iching', id);

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
            record = req.record || await findByIdFlex(BaziRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Bát Tự.' });
            }

            // 2. Tìm hoặc tạo cuộc hội thoại
            let conversation = await Conversation.findOne({ recordId: id, system: 'bazi' });
            if (!conversation) {
                conversation = await Conversation.create({
                    recordId: id,
                    userId: record.userId || 'guest',
                    system: 'bazi'
                });
            }

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('bazi', id);

            // 3. Rate Limit & Anti-Spam
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

            // 4. Thiết lập SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            let isConnectionOpen = true;
            let pingInterval = null;

            req.on('close', () => {
                isConnectionOpen = false;
                if (pingInterval) clearInterval(pingInterval);
            });

            const sendSSE = (data) => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            };

            pingInterval = setInterval(() => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(":\n\n");
                }
            }, 15000);

            // 5. Caching Bazi Rule Output
            let analyzedData = record.analysisSnapshot;
            if (!analyzedData) {
                analyzedData = record.baziData;
                await updateByIdFlex(BaziRecord, id, { analysisSnapshot: analyzedData });
            }

            // 6. Xây dựng bối cảnh hội thoại
            const context = await ConversationContextService.buildConversationContext('bazi', conversation._id);

            // 7. Tạo Prompt
            const prompt = BaziPrompts.getFollowUpPrompt(record.toObject(), context, question);

            // Lưu tin nhắn User vào DB
            const userTokens = Math.ceil((question || '').length / 4);
            await Message.create({
                conversationId: conversation._id,
                role: 'user',
                content: question,
                promptTokens: userTokens,
                totalTokens: userTokens
            });

            // 8. Stream AI
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!isConnectionOpen) {
                    console.log(`[SSE] Client closed connection, stopping Bazi chat stream.`);
                    break;
                }
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            if (!isConnectionOpen) {
                return res.end();
            }

            // 9. Lưu trữ AI message dạng structured JSON
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            let parsed = { answer: "", dos: "", donts: "", confidence: 0.80 };
            
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
                        
                        const dosMatch = match[0].match(/"dos"\s*:\s*"([\s\S]*?)"/);
                        const dos = dosMatch ? dosMatch[1] : "";
                        
                        const dontsMatch = match[0].match(/"donts"\s*:\s*"([\s\S]*?)"/);
                        const donts = dontsMatch ? dontsMatch[1] : "";
                        
                        const confidenceMatch = match[0].match(/"confidence"\s*:\s*([0-9.]+)/);
                        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.80;

                        if (answer) {
                            parsed = { answer, dos, donts, confidence };
                        } else {
                            parsed.answer = cleanedContent;
                        }
                    }
                } else {
                    parsed.answer = cleanedContent;
                }
            }

            // Tính toán token AI
            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
            const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
            const totalTurnTokens = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

            await Message.create({
                conversationId: conversation._id,
                role: 'ai',
                content: JSON.stringify(parsed),
                promptTokens: promptTokens,
                completionTokens: completionTokens,
                totalTokens: totalTurnTokens,
                structuredContent: {
                    answer: parsed.answer || cleanedContent,
                    dos: parsed.dos || "",
                    donts: parsed.donts || "",
                    confidence: parsed.confidence !== undefined ? parsed.confidence : 0.80
                }
            });

            // Cập nhật tổng số token của Conversation
            await Conversation.findByIdAndUpdate(conversation._id, {
                $inc: {
                    totalTokens: userTokens + totalTurnTokens
                }
            });

            if (conversation.userId && conversation.userId !== 'guest') {
                const UserStatsService = require('../services/UserStatsService');
                UserStatsService.incrementChatTokens(conversation.userId, 'bazi', userTokens + totalTurnTokens);
            }

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

    static async chatMarriage(req, res) {
        const { id } = req.params;
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
        }

        // 1. Kiểm tra Intent Filter bảo vệ Quota
        if (!ConversationContextService.isDivinationRelated(question)) {
            return res.status(400).json({
                error: 'Tôi là trợ lý luận giải hôn nhân gia đạo. Vui lòng hỏi những câu hỏi liên quan đến tình duyên, gia đạo, con cái hoặc lá số này.'
            });
        }

        let record = null;
        let pingInterval = null;

        try {
            record = req.record || await findByIdFlex(MarriageRecord, id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi Hợp Hôn.' });
            }

            // 2. Tìm hoặc tạo cuộc hội thoại
            let conversation = await Conversation.findOne({ recordId: id, system: 'marriage' });
            if (!conversation) {
                conversation = await Conversation.create({
                    recordId: id,
                    userId: record.userId || 'guest',
                    system: 'marriage'
                });
            }

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('marriage', id);

            // 3. Rate Limit & Anti-Spam
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

            // 4. Thiết lập SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            let isConnectionOpen = true;
            let pingInterval = null;

            req.on('close', () => {
                isConnectionOpen = false;
                if (pingInterval) clearInterval(pingInterval);
            });

            const sendSSE = (data) => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(`data: ${JSON.stringify(data)}\n\n`);
                }
            };

            pingInterval = setInterval(() => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(":\n\n");
                }
            }, 15000);

            // 5. Xây dựng bối cảnh hội thoại
            const context = await ConversationContextService.buildConversationContext('marriage', conversation._id);

            // 6. Tạo Prompt
            const prompt = MarriagePrompts.getFollowUpPrompt(record.toObject(), context, question);

            // Lưu tin nhắn User vào DB
            const userTokens = Math.ceil((question || '').length / 4);
            await Message.create({
                conversationId: conversation._id,
                role: 'user',
                content: question,
                promptTokens: userTokens,
                totalTokens: userTokens
            });

            // 7. Stream AI
            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!isConnectionOpen) {
                    console.log(`[SSE] Client closed connection, stopping Marriage chat stream.`);
                    break;
                }
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            if (!isConnectionOpen) {
                return res.end();
            }

            // 8. Lưu trữ AI message dạng structured JSON
            const cleanedContent = AiService.cleanMarkdown(accumulatedText);
            let parsed = { answer: "", dos: "", donts: "", confidence: 0.85 };
            
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
                        
                        const dosMatch = match[0].match(/"dos"\s*:\s*"([\s\S]*?)"/);
                        const dos = dosMatch ? dosMatch[1] : "";
                        
                        const dontsMatch = match[0].match(/"donts"\s*:\s*"([\s\S]*?)"/);
                        const donts = dontsMatch ? dontsMatch[1] : "";
                        
                        const confidenceMatch = match[0].match(/"confidence"\s*:\s*([0-9.]+)/);
                        const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.85;

                        if (answer) {
                            parsed = { answer, dos, donts, confidence };
                        } else {
                            parsed.answer = cleanedContent;
                        }
                    }
                } else {
                    parsed.answer = cleanedContent;
                }
            }

            // Tính toán token AI
            const promptTokens = usageMetadata?.promptTokenCount || Math.ceil((prompt || '').length / 4);
            const completionTokens = usageMetadata?.candidatesTokenCount || Math.ceil((cleanedContent || '').length / 4);
            const totalTurnTokens = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

            await Message.create({
                conversationId: conversation._id,
                role: 'ai',
                content: JSON.stringify(parsed),
                promptTokens: promptTokens,
                completionTokens: completionTokens,
                totalTokens: totalTurnTokens,
                structuredContent: {
                    answer: parsed.answer || cleanedContent,
                    dos: parsed.dos || "",
                    donts: parsed.donts || "",
                    confidence: parsed.confidence !== undefined ? parsed.confidence : 0.85
                }
            });

            // Cập nhật tổng số token của Conversation
            await Conversation.findByIdAndUpdate(conversation._id, {
                $inc: {
                    totalTokens: userTokens + totalTurnTokens
                }
            });

            if (conversation.userId && conversation.userId !== 'guest') {
                const UserStatsService = require('../services/UserStatsService');
                UserStatsService.incrementChatTokens(conversation.userId, 'marriage', userTokens + totalTurnTokens);
            }

            // Cập nhật tóm tắt
            ConversationContextService.updateConversationSummary('marriage', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating Marriage summary:", err));

            // Invalidate conversation chat cache
            MemoryCacheService.clearChatCache('marriage', id);

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("Marriage Chat Follow-up Error:", error);
            res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi xảy ra khi sinh câu hỏi Hợp Hôn.' })}\n\n`);
            res.end();
        } finally {
            if (pingInterval) clearInterval(pingInterval);
        }
    }

    static async chatZiwei(req, res) {
        let pingInterval = null;
        try {
            const { id } = req.params;
            const { question } = req.body;

            if (!question || !question.trim()) {
                return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
            }

            // 1. Kiểm tra Intent Filter bảo vệ Quota
            if (!ConversationContextService.isDivinationRelated(question)) {
                return res.status(400).json({
                    error: 'Tôi là trợ lý luận giải Tử Vi. Vui lòng hỏi những câu hỏi liên quan đến cung mệnh, gia đạo, sự nghiệp, tài lộc, thời tiết hoặc lá số này.'
                });
            }

            const record = req.record || await ZiweiRecord.findById(id);
            if (!record) {
                return res.status(404).json({ error: 'Không tìm thấy bản ghi lá số Tử Vi.' });
            }

            // 2. Tìm hoặc tạo cuộc trò chuyện
            let conversation = await Conversation.findOne({ recordId: id, system: 'ziwei' });
            if (!conversation) {
                conversation = await Conversation.create({
                    recordId: id,
                    userId: record.userId || 'guest',
                    system: 'ziwei'
                });
            }

            // Invalidate cache tin nhắn lập tức
            MemoryCacheService.clearChatCache('ziwei', id);

            // Rate Limit
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

            // 3. Dựng bối cảnh hội thoại
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

            // Đọc dữ liệu giải cục để làm cơ sở học thuật (Facts)
            const compressedChart = ZiweiFormatter.compressForAi(record);
            const symbolicAnalysis = record.analysisSnapshot || SymbolicAnalyzer.analyze(record.chartData);

            const prompt = ZiweiPrompts.buildFollowUpPrompt(compressedChart, symbolicAnalysis, memoryContext, historyPrompt, question);

            const userTokens = Math.ceil((question || '').length / 4);
            
            // Lưu tin nhắn của User vào DB
            await Message.create({
                conversationId: conversation._id,
                role: 'user',
                content: question,
                promptTokens: userTokens,
                totalTokens: userTokens
            });

            let isConnectionOpen = true;
            let pingInterval = null;

            req.on('close', () => {
                isConnectionOpen = false;
                if (pingInterval) clearInterval(pingInterval);
            });

            // 4. Stream dữ liệu từ AI
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('Content-Encoding', 'none');

            const sendSSE = (data) => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write('data: ' + JSON.stringify(data) + '\n\n');
                }
            };

            pingInterval = setInterval(() => {
                if (isConnectionOpen && !res.writableEnded) {
                    res.write(":\n\n");
                }
            }, 15000);

            const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
            let accumulatedText = "";
            let usageMetadata = null;

            for await (const chunk of resultStream.stream) {
                if (!isConnectionOpen) {
                    console.log(`[SSE] Client closed connection, stopping Ziwei chat stream.`);
                    break;
                }
                if (chunk.usageMetadata) usageMetadata = chunk.usageMetadata;
                const chunkText = chunk.text();
                accumulatedText += chunkText;
                sendSSE({ chunk: chunkText });
            }

            if (!isConnectionOpen) {
                return res.end();
            }

            // Xử lý lưu trữ phản hồi dạng cấu trúc
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

            // Lưu tin nhắn AI vào DB
            await Message.create({
                conversationId: conversation._id,
                role: 'ai',
                content: JSON.stringify(parsed),
                promptTokens,
                completionTokens,
                totalTokens: tokensUsed,
                structuredContent: {
                    answer: parsed.answer || cleanedContent,
                    timing: "",
                    risk: "",
                    confidence: parsed.confidence || 0.85
                }
            });

            // Cập nhật cuộc hội thoại
            await Conversation.findByIdAndUpdate(conversation._id, {
                $inc: {
                    totalTokens: userTokens + tokensUsed
                }
            });

            if (conversation.userId && conversation.userId !== 'guest') {
                const UserStatsService = require('../services/UserStatsService');
                UserStatsService.incrementChatTokens(conversation.userId, 'ziwei', userTokens + tokensUsed);
            }

            // Cập nhật tóm tắt
            ConversationContextService.updateConversationSummary('ziwei', conversation._id, AiService.genAI, ACTIVE_MODEL)
                .catch(err => console.error("Error updating Ziwei summary:", err));

            // Clear cache tin nhắn lần nữa
            MemoryCacheService.clearChatCache('ziwei', id);

            sendSSE('[DONE]');
            res.end();

        } catch (error) {
            console.error("[AiInterpretationController.chatZiwei] Error:", error);
            res.write('data: ' + JSON.stringify({ error: error.message || 'Lỗi sinh phản hồi từ AI.' }) + '\n\n');
            res.end();
        } finally {
            if (pingInterval) clearInterval(pingInterval);
        }
    }
}

module.exports = AiInterpretationController;
