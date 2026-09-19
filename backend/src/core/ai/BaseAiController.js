const AiService = require('./AiService');
const AiStreamHelper = require('./AiStreamHelper');
const ConversationContextService = require('./ConversationContextService');
const MemoryCacheService = require('../services/MemoryCacheService');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const logger = require('../services/LoggerService');
const { formatFieldToString, parseAiJsonChunk } = require('../utils/aiFormatters');
const { findByIdFlex, updateByIdFlex } = require('../services/HistoryQueryHelper');
const { ACTIVE_MODEL } = require('../config/ai');

/**
 * BaseAiController - Lớp cơ sở chuẩn hóa toàn bộ luồng SSE và quản lý luồng AI cho 4 phân hệ
 * (Bát Tự, Tử Vi, Kinh Dịch, Hợp Hôn).
 * Giúp loại bỏ hoàn toàn code lặp, đảm bảo tính nhất quán về:
 * 1. SSE Heartbeat & ngắt kết nối an toàn.
 * 2. Refund credit tự động khi client abort giữa chừng.
 * 3. Atomic lock 15s chống spam yêu cầu kép.
 * 4. Cache hit 0ms tức thì.
 * 5. Chuẩn hóa tính toán tokens và ghi nhận thống kê.
 */
class BaseAiController {
  /**
   * Xử lý luồng Luận giải (Interpret) chuẩn qua SSE
   * @param {Object} req - Express Request
   * @param {Object} res - Express Response
   * @param {Object} config - Cấu hình phân hệ
   */
  static async handleInterpret(req, res, config) {
    const {
      RecordModel,
      system,
      promptVersion,
      buildPrompt,
      runVipPipeline,
      notFoundMessage = 'Không tìm thấy bản ghi.',
      errorMessage = 'Lỗi xảy ra trong quá trình sinh luận giải AI.'
    } = config;

    const { id } = req.params;
    let record = null;
    let sse = null;

    try {
      record = req.record || await findByIdFlex(RecordModel, id);
      if (!record) {
        return res.status(404).json({ error: notFoundMessage });
      }

      // Check lock to prevent race conditions
      if (record.isGeneratingInterpretation) {
        const lockTime = record.updatedAt || record.createdAt || new Date();
        const elapsedSeconds = (new Date() - new Date(lockTime)) / 1000;
        if (elapsedSeconds < 15) {
          return res.status(409).json({
            error: 'Hệ thống đang tiến hành luận giải cho lá số này. Vui lòng đợi trong giây lát, hãy ấn vào luận giải ngay 1 lần nữa.'
          });
        }
        await updateByIdFlex(RecordModel, id, { isGeneratingInterpretation: false });
      }

      // Establish SSE Session
      sse = AiStreamHelper.initSseSession(req, res);

      let isCompleted = false;
      req.on('close', async () => {
        if (!isCompleted && req.refundCredit) {
          try { await req.refundCredit(); } catch (e) {
            logger.warn(`[BaseAiController][${system}] Refund credit failed on close:`, e.message);
          }
        }
      });

      // Cache Check
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
      await updateByIdFlex(RecordModel, id, { isGeneratingInterpretation: true });

      // Build Prompt
      const prompt = await buildPrompt(record, isVipMode, req);

      let accumulatedText = "";
      let usageMetadata = null;

      if (isVipMode && typeof runVipPipeline === 'function') {
        const vipResult = await runVipPipeline({
          prompt,
          record,
          isVipMode,
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

      // Client disconnected early check
      if (!sse.isOpen()) {
        if (!isCompleted && req.refundCredit) await req.refundCredit();
        return res.end();
      }

      const cleanedContent = AiService.cleanMarkdown(accumulatedText);
      const { promptTokens, completionTokens, tokensUsed } = AiStreamHelper.calculateTokens(prompt, cleanedContent, usageMetadata);

      await updateByIdFlex(RecordModel, id, {
        aiInterpretation: {
          content: cleanedContent,
          mode: isVipMode ? 'vip' : 'standard',
          generatedAt: new Date(),
          model: isVipMode ? 'Chuyên Sâu' : 'Tiêu Chuẩn',
          promptVersion,
          promptTokens,
          completionTokens,
          tokensUsed
        },
        isGeneratingInterpretation: false
      });

      isCompleted = true;

      AiStreamHelper.recordInterpretTokens(record.userId, system, tokensUsed);
      sse.sendDone();

    } catch (error) {
      logger.error(`[BaseAiController][${system}] Interpret SSE Error:`, error);
      if (req.refundCredit) {
        try { await req.refundCredit(); } catch (refErr) {
          logger.error(`[BaseAiController][${system}] Refund credit failed:`, refErr);
        }
      }
      if (sse) sse.sendError(error.message || errorMessage);
      else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
    } finally {
      if (sse) sse.cleanup();
      if (record) {
        await updateByIdFlex(RecordModel, id, { isGeneratingInterpretation: false });
      }
    }
  }

  /**
   * Xử lý luồng Chat Follow-up chuẩn qua SSE
   * @param {Object} req - Express Request
   * @param {Object} res - Express Response
   * @param {Object} config - Cấu hình phân hệ
   */
  static async handleChat(req, res, config) {
    const {
      RecordModel,
      system,
      notDivinationError,
      buildFollowUpPrompt,
      ensureAnalysisSnapshot,
      notFoundMessage = 'Không tìm thấy bản ghi.'
    } = config;

    const { id } = req.params;
    const { question, activeSectionId } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
    }

    if (!ConversationContextService.isDivinationRelated(question)) {
      return res.status(400).json({
        error: notDivinationError || 'Tôi là trợ lý luận giải mệnh lý phong thủy. Vui lòng hỏi những câu hỏi liên quan đến vận thế, công việc, tình duyên, gia đạo hoặc lá số này.'
      });
    }

    let sse = null;
    try {
      const record = req.record || await findByIdFlex(RecordModel, id);
      if (!record) {
        return res.status(404).json({ error: notFoundMessage });
      }

      let conversation = await Conversation.findOne({ recordId: id, system });
      if (!conversation) {
        conversation = await Conversation.create({
          recordId: id,
          userId: record.userId || 'guest',
          system
        });
      }

      MemoryCacheService.clearChatCache(system, id);

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
          try { await req.refundChatCredit(); } catch (e) {
            logger.warn(`[BaseAiController][${system}] Refund chat credit on close failed:`, e.message);
          }
        }
      });

      if (typeof ensureAnalysisSnapshot === 'function') {
        await ensureAnalysisSnapshot(record, id);
      }

      const context = await ConversationContextService.buildConversationContext(system, conversation._id);

      const vipContext = (ConversationContextService.extractVipContext && ConversationContextService.extractVipContext({
        record,
        system,
        activeSectionId,
        userQuestion: question
      })) || {};

      const prompt = await buildFollowUpPrompt({
        record,
        context,
        question,
        vipContextText: vipContext.contextText || ""
      });

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

      AiStreamHelper.recordChatTokens(conversation.userId, system, userTokens + totalTurnTokens);

      ConversationContextService.updateConversationSummary(system, conversation._id, AiService.genAI, ACTIVE_MODEL)
        .catch(err => logger.error(`[BaseAiController][${system}] Error updating summary:`, err));

      MemoryCacheService.clearChatCache(system, id);

      isCompleted = true;
      sse.sendDone();

    } catch (error) {
      logger.error(`[BaseAiController][${system}] Chat Follow-up Error:`, error);
      if (req.refundChatCredit) {
        try { await req.refundChatCredit(); } catch (refErr) {
          logger.error(`[BaseAiController][${system}] Refund chat credit failed:`, refErr);
        }
      }
      if (sse) sse.sendError(error.message || 'Lỗi xảy ra khi sinh câu hỏi tư vấn AI.');
      else res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
    } finally {
      if (sse) sse.cleanup();
    }
  }
}

module.exports = BaseAiController;
