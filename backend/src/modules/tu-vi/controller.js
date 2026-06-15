const TuViRecord = require('./models/TuViRecord');
const TuViConversation = require('./models/TuViConversation');
const TuViMessage = require('./models/TuViMessage');
const TuViValidator = require('./validators');
const TuViFormatter = require('./formatter');
const TuViCache = require('./cache');
const TuViPrompts = require('./prompts');
const AstrologyEngine = require('../../shared/engines/AstrologyEngine');
const SymbolicAnalyzer = require('../../shared/knowledge-engine/SymbolicAnalyzer');
const JobQueueService = require('../../services/JobQueueService');
const AiService = require('../../services/AiService');
const MemoryCacheService = require('../../services/MemoryCacheService');
const mongoose = require('mongoose');

// Tỷ giá quy đổi token Gemini 1.5 Flash-lite (USD)
const GEMINI_INPUT_RATE = 0.075 / 1000000;
const GEMINI_OUTPUT_RATE = 0.30 / 1000000;
const ACTIVE_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

// Đăng ký bộ xử lý hàng đợi AI ngầm cho phân hệ Tử Vi
JobQueueService.registerHandler('tu_vi', async (jobParams, updateProgress) => {
  const { recordId, school, calendarType, timezone } = jobParams;
  
  // 1. Đọc bản ghi từ Database
  const record = await TuViRecord.findById(recordId);
  if (!record) {
    throw new Error('Không tìm thấy bản ghi lá số Tử Vi.');
  }

  // 2. Chạy Symbolic Analyzer để trích xuất cách cục & kết nối tam hợp xung chiếu
  await updateProgress(15);
  const symbolicAnalysis = SymbolicAnalyzer.analyze(record.chartData);

  // 3. Nén dữ liệu lá số để gửi cho AI (Tiết kiệm 80% tokens!)
  await updateProgress(30);
  const compressed = TuViFormatter.compressForAi(record);

  // 4. Xây dựng Prompt học thuật nghiêm ngặt
  await updateProgress(45);
  const prompt = TuViPrompts.buildPrompt(compressed, symbolicAnalysis);

  // 5. Gọi AI sinh bài luận giải dạng Structured JSON Output
  await updateProgress(60);
  const responseSchema = TuViPrompts.getResponseSchema();
  const aiResult = await AiService.generateStructuredOutput(prompt, responseSchema, { model: ACTIVE_MODEL });

  await updateProgress(85);

  // 6. Tính toán số lượng tokens và chi phí tài chính thực tế
  const promptTokens = await AiService.countTokens(prompt, { model: ACTIVE_MODEL });
  const completionTokens = await AiService.countTokens(JSON.stringify(aiResult), { model: ACTIVE_MODEL });
  const tokensUsed = promptTokens + completionTokens;
  const cost = (promptTokens * GEMINI_INPUT_RATE) + (completionTokens * GEMINI_OUTPUT_RATE);

  // 7. Cập nhật bài luận giải hoàn tất vào bản ghi lá số
  record.aiInterpretation = {
    summary: aiResult.summary || "",
    sections: aiResult.sections || [],
    generatedAt: new Date(),
    model: ACTIVE_MODEL,
    promptVersion: "tv_prompt_v1",
    knowledgeVersion: "tv_know_v1",
    promptTokens,
    completionTokens,
    tokensUsed,
    cost
  };
  record.analysisSnapshot = symbolicAnalysis;
  record.isGeneratingInterpretation = false;
  await record.save();

  // 8. Lưu vào bộ đệm AI Cache
  const aiHash = TuViCache.generateAiHash(record.chartHash, {
    promptVersion: "tv_prompt_v1",
    model: ACTIVE_MODEL,
    knowledgeVersion: "tv_know_v1"
  });
  TuViCache.setInterpretation(aiHash, record.aiInterpretation);

  return record.aiInterpretation;
});

class TuViController {
  /**
   * Tạo đồ hình lá số thô (Deterministic)
   */
  static async createChart(req, res) {
    try {
      const valResult = TuViValidator.validateBirthInfo(req.body);
      if (!valResult.isValid) {
        return res.status(400).json({ error: valResult.error });
      }

      const { date, hour, gender, timezone, school, calendarType } = valResult.sanitized;
      const userId = req.body.userId || 'guest';
      const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];

      // 1. Kiểm tra bằng Idempotency Key header nếu được cung cấp
      if (idempotencyKey) {
        const dupRecord = await TuViRecord.findOne({ idempotencyKey });
        if (dupRecord) {
          return res.json(dupRecord);
        }
      }

      // 2. Tạo mã băm lá số thô để kiểm tra cache & database (Semantic Idempotency)
      const chartHash = TuViCache.generateChartHash({ date, hour, gender, timezone, school, calendarType });
      
      // A. Kiểm tra Memory Cache trước
      const cachedChart = TuViCache.getChart(chartHash);
      if (cachedChart) {
        return res.json(cachedChart);
      }

      // B. Kiểm tra Database xem đã tồn tại lá số này cho user chưa (Database Idempotency)
      const existingRecord = await TuViRecord.findOne({ userId, chartHash });
      if (existingRecord) {
        // Cập nhật lại bộ nhớ đệm và trả về bản ghi cũ
        TuViCache.setChart(chartHash, existingRecord);
        return res.json(existingRecord);
      }

      // 3. Chạy bộ máy tính toán an sao thô độc lập
      const rawAstrolabe = AstrologyEngine.generate('tu_vi', { date, hour, gender, lang: 'vi-VN' });
      
      // 4. Tạo ID mới và chuẩn hóa dữ liệu Standard Output
      const recordId = new mongoose.Types.ObjectId().toString();
      const metadata = { engine_version: "1.0.0", prompt_version: "tv_prompt_v1", knowledge_version: "tv_know_v1", calendar_type: calendarType, school, timezone };
      const formattedOutput = TuViFormatter.toStandardOutput(rawAstrolabe, recordId, metadata);

      // 5. Lưu bản ghi thô vào database
      const newRecord = await TuViRecord.create({
        _id: recordId,
        userId,
        system: 'tu_vi',
        idempotencyKey: idempotencyKey || null,
        inputInfo: { date, hour, gender, timezone, school, calendarType },
        chartHash,
        chartData: formattedOutput.chart_data,
        aiInterpretation: { summary: "", sections: [] }
      });

      // 5. Thiết lập cache và trả về
      TuViCache.setChart(chartHash, newRecord);
      
      // Hủy cache lịch sử cũ của người dùng này để tải danh sách mới
      MemoryCacheService.clearUserHistoryCache(userId);

      return res.json(newRecord);
    } catch (error) {
      console.error("[TuViController.createChart] Error:", error);
      return res.status(500).json({ error: error.message || 'Lỗi xảy ra khi tính toán lá số Tử Vi.' });
    }
  }

  /**
   * Kích hoạt luận giải AI thông qua hàng đợi chống timeout
   */
  static async interpret(req, res) {
    try {
      const { id } = req.params;
      const record = await TuViRecord.findById(id);
      if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi lá số Tử Vi.' });
      }

      // 1. Kiểm tra trong bộ đệm AI Cache
      const aiHash = TuViCache.generateAiHash(record.chartHash, {
        promptVersion: "tv_prompt_v1",
        model: ACTIVE_MODEL,
        knowledgeVersion: "tv_know_v1"
      });
      const cachedInterp = TuViCache.getInterpretation(aiHash);
      if (cachedInterp && cachedInterp.sections && cachedInterp.sections.length > 0) {
        record.aiInterpretation = cachedInterp;
        await record.save();
        return res.json({ status: 'completed', result: cachedInterp });
      }

      // Nếu đã có sẵn trong bản ghi cũ
      if (record.aiInterpretation && record.aiInterpretation.sections && record.aiInterpretation.sections.length > 0) {
        return res.json({ status: 'completed', result: record.aiInterpretation });
      }

      // 2. Kiểm tra xem có Job nào đang xử lý bản ghi này không để tránh spam
      record.isGeneratingInterpretation = true;
      await record.save();

      // 3. Đưa vào hàng đợi xử lý ngầm (FIFO Queue)
      const job = await JobQueueService.enqueue('tu_vi', {
        recordId: id,
        school: record.inputInfo.school,
        calendarType: record.inputInfo.calendarType,
        timezone: record.inputInfo.timezone
      });

      // Trả về jobId ngay lập tức để frontend lắng nghe tiến độ
      return res.json({
        status: 'queued',
        jobId: job._id,
        progress: 0
      });

    } catch (error) {
      console.error("[TuViController.interpret] Error:", error);
      return res.status(500).json({ error: error.message || 'Lỗi xảy ra khi gửi yêu cầu luận giải AI.' });
    }
  }

  /**
   * Kiểm tra tiến độ Job
   */
  static async checkJobStatus(req, res) {
    try {
      const { jobId } = req.params;
      const job = await JobQueueService.getJobStatus(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Không tìm thấy tiến trình luận giải.' });
      }
      return res.json(job);
    } catch (error) {
      console.error("[TuViController.checkJobStatus] Error:", error);
      return res.status(500).json({ error: 'Lỗi kiểm tra tiến độ.' });
    }
  }

  /**
   * Lấy lịch sử lá số Tử Vi (Dùng Compound Index và Projections tối ưu tốc độ)
   */
  static async getHistory(req, res) {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit) || 30;
      const cacheKey = `history:${userId}:tu_vi:${limit}`;

      // Check cache lịch sử trước
      const cachedHistory = MemoryCacheService.get(cacheKey);
      if (cachedHistory) {
        return res.json(cachedHistory);
      }

      const records = await TuViRecord.find({ 
        userId, 
        isDeleted: { $ne: true }, 
        status: { $ne: 'locked' } 
      })
        .sort({ createdAt: -1 })
        .select('-chartData.palaces -analysisSnapshot') // Cắt bớt phần hiển thị chi tiết khi tải list
        .limit(limit)
        .lean();

      MemoryCacheService.set(cacheKey, records, 300000); // Lưu 5 phút

      return res.json(records);
    } catch (error) {
      console.error("[TuViController.getHistory] Error:", error);
      return res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách lịch sử.' });
    }
  }

  /**
   * Xem chi tiết một bản ghi Tử Vi
   */
  static async getRecordDetail(req, res) {
    try {
      const { id } = req.params;
      const record = await TuViRecord.findById(id).lean();
      if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi lá số.' });
      }
      return res.json(record);
    } catch (error) {
      console.error("[TuViController.getRecordDetail] Error:", error);
      return res.status(500).json({ error: 'Lỗi máy chủ.' });
    }
  }

  /**
   * Đánh giá chất lượng luận giải lá số
   */
  static async rateRecord(req, res) {
    try {
      const { id } = req.params;
      const { rating, feedback } = req.body;

      const record = await TuViRecord.findById(id);
      if (!record) return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });

      record.rating = rating;
      record.feedback = feedback || '';
      await record.save();

      // Hủy cache cũ
      MemoryCacheService.clearUserHistoryCache(record.userId);

      return res.json({ success: true, record });
    } catch (error) {
      console.error("[TuViController.rateRecord] Error:", error);
      return res.status(500).json({ error: 'Lỗi máy chủ khi đánh giá.' });
    }
  }

  // --- TRÒ CHUYỆN HỎI ĐÁP TIẾP THEO (FOLLOW-UP CHAT) ---

  /**
   * Lấy tin nhắn cũ (Có phân trang cuộn và Cache)
   */
  static async getChatMessages(req, res) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      const cacheKey = `history:chat:tu_vi:${id}:${page}:${limit}`;
      const cachedData = MemoryCacheService.get(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      const conversation = await TuViConversation.findOne({ recordId: id }).lean();
      if (!conversation) {
        return res.json({ messages: [], hasMore: false });
      }

      const total = await TuViMessage.countDocuments({ conversationId: conversation._id });
      const messages = await TuViMessage.find({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      messages.reverse(); // Đưa về thứ tự thời gian tăng dần

      const responseData = {
        messages,
        hasMore: total > skip + messages.length,
        total
      };

      MemoryCacheService.set(cacheKey, responseData, 300000); // Lưu 5 phút

      return res.json(responseData);
    } catch (error) {
      console.error("[TuViController.getChatMessages] Error:", error);
      return res.status(500).json({ error: 'Lỗi máy chủ khi lấy tin nhắn cũ.' });
    }
  }

  /**
   * Trò chuyện Hỏi đáp
   */
  static async chatFollowUp(req, res) {
    try {
      const { id } = req.params;
      const { question } = req.body;

      if (!question || !question.trim()) {
        return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
      }

      const record = await TuViRecord.findById(id);
      if (!record) {
        return res.status(404).json({ error: 'Không tìm thấy bản ghi lá số.' });
      }

      // 1. Tìm hoặc tạo cuộc trò chuyện
      let conversation = await TuViConversation.findOne({ recordId: id });
      if (!conversation) {
        conversation = await TuViConversation.create({
          recordId: id,
          userId: record.userId
        });
      }

      // Invalidate cache tin nhắn lập tức
      MemoryCacheService.clearChatCache('tu_vi', id);

      // 2. Quản lý bộ nhớ hội thoại AI (Conversation Memory Strategy - Lấy 10 tin nhắn gần nhất)
      const recentMessages = await TuViMessage.find({ conversationId: conversation._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      recentMessages.reverse();

      // Dựng bối cảnh cuộc trò chuyện
      let memoryContext = "";
      if (conversation.summarizedMemory) {
        memoryContext = `Tóm tắt bối cảnh hội thoại cũ: ${conversation.summarizedMemory}\n\n`;
      }

      const historyPrompt = recentMessages.map(msg => 
        `${msg.role === 'user' ? 'Đương số' : 'Thầy'}: ${msg.content}`
      ).join("\n");

      // 3. Đọc dữ liệu giải cục để làm cơ sở học thuật (Facts)
      const compressedChart = TuViFormatter.compressForAi(record);
      const symbolicAnalysis = record.analysisSnapshot || SymbolicAnalyzer.analyze(record.chartData);

      const prompt = TuViPrompts.buildFollowUpPrompt(compressedChart, symbolicAnalysis, memoryContext, historyPrompt, question);

      const userTokens = await AiService.countTokens(question, { model: ACTIVE_MODEL });
      
      // Lưu tin nhắn của User vào DB
      const userMessage = await TuViMessage.create({
        conversationId: conversation._id,
        role: 'user',
        content: question,
        promptTokens: userTokens,
        totalTokens: userTokens
      });

      // 4. Stream dữ liệu từ AI
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const sendSSE = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      const resultStream = await AiService.generateInterpretationStream(prompt, { model: ACTIVE_MODEL });
      let accumulatedText = "";

      for await (const chunk of resultStream.stream) {
        const chunkText = chunk.text();
        accumulatedText += chunkText;
        sendSSE({ chunk: chunkText });
      }

      // Xử lý lưu trữ phản hồi dạng cấu trúc
      const cleanedContent = AiService.cleanMarkdown(accumulatedText);
      let parsed = { answer: "", timing: null, risk: null, confidence: 0.85 };
      try {
        parsed = JSON.parse(cleanedContent);
      } catch (e) {
        const match = cleanedContent.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            // Attempt to clean raw newlines within double quotes
            const escaped = match[0].replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m, p1) => {
              return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
            });
            parsed = JSON.parse(escaped);
          } catch (e2) {
            // Regex fallback to extract fields
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

      const promptTokens = await AiService.countTokens(prompt, { model: ACTIVE_MODEL });
      const completionTokens = await AiService.countTokens(cleanedContent, { model: ACTIVE_MODEL });
      const tokensUsed = promptTokens + completionTokens;
      const cost = (promptTokens * GEMINI_INPUT_RATE) + (completionTokens * GEMINI_OUTPUT_RATE);

      // Lưu tin nhắn AI vào DB
      await TuViMessage.create({
        conversationId: conversation._id,
        role: 'ai',
        content: JSON.stringify(parsed),
        promptTokens,
        completionTokens,
        totalTokens: tokensUsed,
        cost,
        structuredContent: {
          answer: parsed.answer || cleanedContent,
          timing: parsed.timing || "",
          risk: parsed.risk || "",
          confidence: parsed.confidence || 0.85
        }
      });

      // Cập nhật cuộc hội thoại hội thoại và token cost
      conversation.messageCount += 2;
      conversation.totalPromptTokens += userTokens + promptTokens;
      conversation.totalCompletionTokens += completionTokens;
      conversation.totalTokens += userTokens + tokensUsed;
      conversation.totalCost += cost;

      // 5. Pruning / Context Summarization (Nếu số lượng tin nhắn quá lớn > 12)
      const allMsgsCount = await TuViMessage.countDocuments({ conversationId: conversation._id });
      if (allMsgsCount >= 12 && allMsgsCount % 4 === 0) {
        const oldMessagesToSummarize = await TuViMessage.find({ conversationId: conversation._id })
          .sort({ createdAt: 1 })
          .limit(allMsgsCount - 6)
          .lean();

        const summaryPrompt = `Hãy tóm tắt ngắn gọn các ý chính cốt lõi trong cuộc trò chuyện hỏi đáp huyền học dưới đây chỉ trong 3 câu ngắn:\n\n${
          oldMessagesToSummarize.map(m => `${m.role}: ${m.content}`).join("\n")
        }`;
        
        try {
          const summarizedText = await AiService.generateInterpretation(summaryPrompt, { model: ACTIVE_MODEL });
          conversation.summarizedMemory = conversation.summarizedMemory 
            ? `${conversation.summarizedMemory} | ${summarizedText}` 
            : summarizedText;
        } catch (sumErr) {
          console.error("Context Compression Error:", sumErr.message);
        }
      }

      await conversation.save();

      // Clear cache tin nhắn lần nữa sau khi đã lưu xong tin nhắn AI
      MemoryCacheService.clearChatCache('tu_vi', id);

      sendSSE('[DONE]');
      res.end();

    } catch (error) {
      console.error("[TuViController.chatFollowUp] Error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message || 'Lỗi sinh phản hồi từ AI.' })}\n\n`);
      res.end();
    }
  }
}

module.exports = TuViController;
