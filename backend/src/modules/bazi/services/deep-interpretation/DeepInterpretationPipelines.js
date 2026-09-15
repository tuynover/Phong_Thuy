/**
 * DeepInterpretationPipelines.js
 * Điều phối các luồng Luận Giải Chuyên Sâu Đa Tầng (Multi-Agent Pipeline) cho từng bộ môn
 */

const logger = require('../../../../core/services/LoggerService');
const AiService = require('../../../../core/ai/AiService');
const { OpenRouterRotator, GeminiRotator, LlmProviderService, SseStreamHelper } = require('./DeepInterpretationCore');
const { BAZI_VIP_CONFIG, ZIWEI_VIP_CONFIG, MARRIAGE_VIP_CONFIG, ICHING_VIP_CONFIG } = require('./DeepInterpretationConfigs');
const { generateIChingCalendarGroundTruth } = require('../../../../shared/utils/ungKyParser');

/**
 * Pipeline Bát Tự Đa Tầng (3 Tầng: Dual CoT -> 6 Replicas -> Chief Editor)
 */
class BaziDeepPipeline {
  static async executeReplica(replica, fullContext) {
    const { id, title, provider, model, keyEnv, subtopics } = replica;
    const apiKey = provider === 'gemini' ? GeminiRotator.getNextKey() : (process.env[keyEnv] || process.env.GEMINI_API_KEY);

    const cleanContext = SseStreamHelper.cleanContextForVip(fullContext);
    const chapterInstruction = BAZI_VIP_CONFIG.getChapterSpecificInstructions(id);

    const replicaPrompt = `Dựa trên dữ liệu lá số phong thủy và phân tích học thuật nền tảng:\n${cleanContext}\n\n` +
      `----------------------------------------\n` +
      `CHỈ DẪN HỌC THUẬT CHUYÊN BIỆT CHO CHƯƠNG ${id}: ${title.toUpperCase()}\n` +
      `${chapterInstruction}\n\n` +
      `ĐỊNH HƯỚNG CÁC TRỌNG TÂM CẦN LUẬN GIẢI (Áp dụng nguyên tắc: CÓ THÌ LUẬN SÂU, KHÔNG CÓ THÌ BỎ QUA HOẶC CHUYỂN HƯỚNG SANG THỰC TẾ BẢN MỆNH):\n${subtopics.map((s) => `- ${s}`).join('\n')}\n\n` +
      `‼️ BỘ QUY TẮC KỶ LUẬT BẮT BUỘC:\n` +
      `1. QUY TẮC XƯNG HÔ: BẮT BUỘC xưng hô với đương số là "bạn" (thân thiện, tôn trọng, hiện đại, lịch thiệp). Tự xưng là "tôi" hoặc góc nhìn học thuật khách quan. TUYỆT ĐỐI NGHIÊM CẤM xưng "ngươi" hay "kẻ hèn". Bất kỳ từ "ngươi" nào xuất hiện đều là lỗi nặng.\n` +
      `2. THẬP THẦN & NGŨ HÀNH: Tuân thủ 100% hệ thống Thập Thần của Nhật Chủ. TUYỆT ĐỐI KHÔNG gọi sai Can ngũ hành khác là Kiếp Tài, TUYỆT ĐỐI KHÔNG đảo ngược quan hệ tương sinh tương khắc của Nhật Chủ.\n` +
      `3. ĐỊA CHI CHUẨN TỬ BÌNH: Tuân thủ 100% quy tắc Lục Xung & Tam Hình. Dần chỉ xung Thân (Dần KHÔNG xung Thìn, Dần KHÔNG xung Tuất); Thìn chỉ xung Tuất (Tuất xung Thìn mở kho, Tuất KHÔNG hình Thìn). TUYỆT ĐỐI CẤM ghép cặp xung hình sai lệch kiến thức cơ bản!\n` +
      `4. NGUYÊN TẮC HIỆN HỮU ("CÓ THÌ LUẬN, KHÔNG CÓ BỎ QUA"): CHỈ LUẬN GIẢI các yếu tố/Thần Sát CÓ MẶT THỰC TẾ trong lá số. TUYỆT ĐỐI CẤM liệt kê các sao hoặc yếu tố không có để ghi "Không xuất hiện" hay "Không có" (như CẤM viết "- Đào Hoa: Không xuất hiện", "- Kiếp Tài: Vắng mặt", "- Mộ Khố: Không có"...). Yếu tố nào không có thì HOÀN TOÀN BIẾN MẤT khỏi bài viết!\n` +
      `5. ĐI THẲNG TRỌNG TÂM - TUYỆT ĐỐI CẤM VĂN PHONG "TRẢ BÀI / GIẢNG GIẢI LÝ THUYẾT": Bậc thầy phong thủy chỉ nói về những gì THỰC TẾ CÓ MẶT và ẢNH HƯỞNG TRỰC TIẾP đến vận mệnh đương số. TUYỆT ĐỐI CẤM các câu thanh minh lý thuyết dài dòng như "Theo quy tắc Tử Bình chuẩn xác...", "Thìn không xung cái này, không xung cái kia...", "Kiếp Tài hoàn toàn vắng mặt...", "Đào hoa sát không xuất hiện...", "Theo Bảng Thập Thần...". Hãy đi thẳng vào kết luận thực tế và giải pháp chuyển hóa!\n` +
      `6. TIÊU ĐỀ RÕ RÀNG: Dùng tiêu đề cấp 3 (### Tên Đề Mục) bôi đậm cho từng đề mục con.\n` +
      `7. CẤM BÔI ĐEN LINH TINH: TUYỆT ĐỐI KHÔNG in đậm tùy tiện các từ ngữ rải rác trong câu văn, chỉ dùng in đậm cho đề mục con (###).\n` +
      `8. ĐỊNH DẠNG: Chuẩn Markdown GFM. Dùng bảng Markdown khi tổng hợp các năm/mốc vận hạn hoặc so sánh.\n` +
      `9. KHÔNG RƯỜM RÀ: TUYỆT ĐỐI KHÔNG dùng số thứ tự 1.1, 1.2; TUYỆT ĐỐI KHÔNG ghi lời chào mở đầu hay kết thúc xã giao.\n` +
      `10. DUNG LƯỢNG: Phân tích học thuật sâu sắc, sắc bén, ngôn từ chuẩn phong thủy Đông phương (độ dài khoảng 800 - 1.200 từ).\n` +
      `11. 100% TIẾNG VIỆT THUẦN TÚY: TUYỆT ĐỐI KHÔNG sử dụng chữ Hán / tiếng Trung (như 沟通, 夫妻...). Dùng hoàn toàn tiếng Việt học thuật chuẩn mực.\n` +
      `12. TUYỆT ĐỐI CẤM SAO TỬ VI NGOẠI LAI: Tuyệt đối KHÔNG đưa vào các sao Tử Vi Đẩu Số như Đà La, Kình Dương, Địa Không, Địa Kiếp, Hóa Khoa, Hóa Quyền, Hóa Lộc, Hóa Kỵ. Bát Tự CHỈ DÙNG các Thần Sát có trong danh sách Hiện Diện.\n` +
      `13. RANH GIỚI ĐỊA BÀN & CHỐNG LẶP Ý: Bám sát chuyên đề của Chương ${id}, TUYỆT ĐỐI KHÔNG lặp lại các ý của các chương khác (như không nhắc chuyện tình cảm ở chương tài chính, không nhai lại tính nóng giận ở chương sự nghiệp).\n` +
      `14. KHO TÀI & THẬP THẦN: Bắt buộc tuân thủ dữ liệu Mộ Khố và Thập Thần đã tính sẵn. Nếu có Kho Tài Thìn ở Trụ Giờ thì phải luận khả năng tích lũy qua Thìn, tuyệt đối cấm nói không có kho tài!\n` +
      `15. TUYỆT ĐỐI CẤM TỪ "VIP": TUYỆT ĐỐI KHÔNG dùng từ "VIP", "gói VIP", "báo cáo VIP" hay bất kỳ từ "VIP" nào trong bài viết. Hãy luôn sử dụng từ "luận giải chuyên sâu" hoặc "bản luận giải chuyên sâu".\n` +
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.toUpperCase()}`;

    try {
      if (provider === 'gemini') {
        const geminiKey = process.env[keyEnv] || process.env.GEMINI_API_KEY;
        const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        logger.info(`[BaziDeepPipeline - Tầng 2] Replica ${id} (${title}) đẩy thẳng Google Gemini trực tiếp [${geminiModel}]...`);
        return await LlmProviderService.callGeminiWithKey(geminiKey, replicaPrompt, geminiModel);
      }

      const openRouterKeys = OpenRouterRotator.getKeys();
      if (openRouterKeys.length > 0) {
        const orModel = BAZI_VIP_CONFIG.getOpenRouterModelForChapter(id);
        try {
          logger.info(`[BaziDeepPipeline - Tầng 2] Replica ${id} (${title}) routing to OpenRouter [${orModel}]...`);
          return await LlmProviderService.callOpenRouterEndpoint({
            model: orModel,
            prompt: replicaPrompt
          });
        } catch (orErr) {
          logger.warn(`[BaziDeepPipeline - Tầng 2] OpenRouter replica ${id} error: ${orErr.message}. Falling back to Gemini...`);
        }
      }

      if (provider === 'grok' && apiKey) {
        const isGroq = apiKey.startsWith('gsk_');
        const url = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
        const modelToUse = isGroq ? 'llama-3.3-70b-versatile' : (model || 'grok-2-latest');
        return await LlmProviderService.callOpenAiEndpoint({
          url,
          apiKey,
          model: modelToUse,
          prompt: replicaPrompt
        });
      } else {
        const fallbackGeminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        const fallbackKey = GeminiRotator.getFallbackKey();
        logger.info(`[BaziDeepPipeline - Fallback] Xoay tua sang [${GeminiRotator.getKeyLabel(fallbackKey)}] cho Replica ${id}...`);
        return await LlmProviderService.callGeminiWithKey(fallbackKey, replicaPrompt, fallbackGeminiModel);
      }
    } catch (err) {
      logger.warn(`[BaziDeepPipeline - Tầng 2] Replica ${id} error: ${err.message}. Falling back to Gemini...`);
      const fallbackKey = GeminiRotator.getFallbackKey();
      return await AiService.generateInterpretation(replicaPrompt, { 
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        apiKey: fallbackKey
      });
    }
  }

  static async runVipPipelineStream(prompt, birthYear, options = {}) {
    const { onProgress } = options;
    const REPLICAS = BAZI_VIP_CONFIG.REPLICAS;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // =========================================================================
          // TẦNG 1: DUAL PRE-ANALYSIS SONG SONG (GEMINI + QWEN PLUS)
          // =========================================================================
          logger.info('[BaziDeepPipeline - TẦNG 1] Bắt đầu Gemini & Qwen Plus chạy SONG SONG...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage1', step: 'pre_analysis', message: 'Đang khảo cứu tương quan âm dương ngũ hành & Dụng Thần...' });

          const geminiPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            `[BẢN PHÂN TÍCH 1 - TỔNG QUAN HỆ THỐNG NGŨ HÀNH & DỤNG THẦN TỪ GEMINI]:\n` +
            `Dựa trên dữ liệu lá số Bát Tự:\n${prompt}\n` +
            `Hãy khảo sát chuyên sâu: Vượng suy của Nhật chủ, phân bổ năng lượng 5 hành, Thập Thần chủ quản (tuân thủ đúng hệ thống Thập Thần, không nhầm Can ngũ hành khác là Kiếp Tài), Dụng Thần, Hỷ Thần, Kỵ Thần, và trạng thái tạng phủ để làm nền tảng học thuật vững chắc cho 6 chuyên đề.\n` +
            `LƯU Ý QUAN TRỌNG: BẮT BUỘC xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi". CHỈ LUẬN GIẢI các Thần Sát có thật trong danh sách Hiện Diện của lá số, TUYỆT ĐỐI KHÔNG liệt kê các sao không có để ghi "không xuất hiện".`
          ).catch(err => {
            logger.warn(`[BaziDeepPipeline - Tầng 1] Gemini Pre-Analysis error: ${err.message}`);
            return 'Dữ liệu Ngũ hành và Dụng Thần đã được tính toán trong snapshot nguyên bản.';
          });

          const qwenCotPrompt = `[BẢN PHÂN TÍCH 2 - BIỆN CHỨNG TỬ BÌNH CỔ HỌC & CHAIN-OF-THOUGHT TỪ QWEN PLUS]:\n` +
            `Dựa trên dữ liệu lá số Bát Tự:\n${prompt}\n` +
            `Căn cứ kinh điển Tử Bình Chân Thuyên và Tích Thiên Tủy, hãy suy luận Chain-of-Thought (CoT) chuyên sâu về:\n` +
            `1. Mệnh cách và tương tác sinh khắc chế hóa cốt lõi (tuân thủ đúng ngũ hành theo hệ thống Thập Thần của Nhật Chủ).\n` +
            `2. Ma trận Thần Sát tĩnh nguyên cục: CHỈ LUẬN các sao có mặt thực tế trong danh sách, TUYỆT ĐỐI KHÔNG liệt kê các sao vắng mặt để ghi "không xuất hiện".\n` +
            `3. Tương tác Địa Chi: Tuân thủ quy tắc Lục Xung & Tam Hình chuẩn xác (Dần chỉ xung Thân, Thìn chỉ xung Tuất; Dần không xung Thìn/Tuất; Tuất xung Thìn chứ không hình Thìn).\n` +
            `4. Định vị các điểm gãy vận hạn (Thiên Khắc Địa Xung, Hình Hại), các chu kỳ biến cố và thời cơ bứt phá hoàng kim trong cuộc đời đương số.\n` +
            `5. ĐỊNH HƯỚNG TRỤC THỜI GIAN ĐỒNG BỘ: Chỉ rõ mốc năm/đại vận ĐẠI CÁT bứt phá và mốc năm/đại vận THẬN TRỌNG để 6 chuyên đề sau đối chiếu đồng bộ.\n` +
            `LƯU Ý XƯNG HÔ & VĂN PHONG: BẮT BUỘC xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG xưng "ngươi". TUYỆT ĐỐI KHÔNG dùng các cụm từ lộ prompt kỹ thuật như "theo bảng khóa cứng"...`;

          const openRouterKeys = OpenRouterRotator.getKeys();
          const qwenPromise = (openRouterKeys.length > 0
            ? LlmProviderService.callOpenRouterEndpoint({
                model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
                prompt: qwenCotPrompt,
              })
            : LlmProviderService.callGeminiWithKey(
                GeminiRotator.getFallbackKey(),
                qwenCotPrompt
              )
          ).catch(err => {
            const fallbackKey = GeminiRotator.getFallbackKey();
            logger.warn(`[BaziDeepPipeline - Tầng 1] OpenRouter CoT error: ${err.message}. Falling back to Gemini [${GeminiRotator.getKeyLabel(fallbackKey)}]...`);
            return LlmProviderService.callGeminiWithKey(
              fallbackKey,
              qwenCotPrompt
            ).catch(() => 'Dữ liệu Tử Bình CoT đã được xác lập trong phân tích số học nguyên bản.');
          });

          const [geminiAnalysis, cotAnalysis] = await Promise.all([geminiPromise, qwenPromise]);

          const combinedPreAnalysis = `\n=== BẢN PHÂN TÍCH HỌC THUẬT NỀN TẢNG TẦNG 1 (DUAL PRE-ANALYSIS) ===\n` +
            `[BẢN 1 - GEMINI]:\n${geminiAnalysis}\n\n` +
            `[BẢN 2 - QWEN TỬ BÌNH CHAIN-OF-THOUGHT]:\n${cotAnalysis}\n` +
            `===================================================================\n`;

          const fullContext = `${prompt}\n${combinedPreAnalysis}`;

          // =========================================================================
          // TẦNG 2: 6 REPLICAS CHUYÊN ĐỀ SONG SONG
          // =========================================================================
          logger.info('[BaziDeepPipeline - TẦNG 2] Khởi chạy 6 Replicas song song...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage2', step: 'replicas_start', message: 'Đang tiến hành luận giải chuyên sâu 6 chương...' });

          const replicaPromises = REPLICAS.map((rep, idx) => {
            const delay = idx * 250;
            return new Promise(resolve => setTimeout(resolve, delay)).then(async () => {
              SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage2', chapterId: rep.id, status: 'in_progress', title: rep.title, message: `Đang luận giải: Chương ${rep.id} - ${rep.title}...` });
              const output = await BaziDeepPipeline.executeReplica(rep, fullContext);
              SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage2', chapterId: rep.id, status: 'completed', title: rep.title, message: `Đã hoàn tất: Chương ${rep.id} - ${rep.title}` });
              return output;
            });
          });

          const chaptersOutput = await Promise.all(replicaPromises);
          logger.info('[BaziDeepPipeline - TẦNG 2] 6 Replicas đã hoàn thành 100% bản thảo.');

          // =========================================================================
          // TẦNG 3: GEMINI TỔNG BIÊN TẬP (CHIEF EDITOR)
          // =========================================================================
          logger.info('[BaziDeepPipeline - TẦNG 3] Gemini đọc TOÀN BỘ 6 chương để tạo SWOT & Điều Hòa...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage3', step: 'synthesis_start', message: 'Đang tổng hợp ma trận định vị bản mệnh & điều hòa chiến lược...' });

          const fullChaptersContext = chaptersOutput.map((content, idx) => {
            const rep = REPLICAS[idx];
            return `=== VĂN BẢN ĐÃ LUẬN GIẢI: CHƯƠNG ${rep.id} - ${rep.title.toUpperCase()} ===\n${(content || '').trim()}`;
          }).join('\n\n----------------------------------------\n\n');

          let introAndOutro = null;
          try {
            const synthesisPrompt = `Bạn là Đại Sư Mệnh Lý Đông Phương uyên bác.
Dưới đây là 2 nguồn dữ liệu học thuật hoàn chỉnh của lá số:

[NGUỒN 1: DỮ LIỆU LÁ SỐ BÁT TỰ & BẢN PHÂN TÍCH HỌC THUẬT NỀN TẢNG (TẦNG 1)]:
${combinedPreAnalysis}

[NGUỒN 2: TOÀN VĂN 6 CHUYÊN ĐỀ ĐÃ ĐƯỢC 6 CHUYÊN GIA ĐỘC LẬP LUẬN GIẢI CHI TIẾT (TẦNG 2)]:
${fullChaptersContext}

NHIỆM VỤ CỦA BẠN (TỔNG HỢP VÀ ĐIỀU HÒA CHIẾN LƯỢC TOÀN DIỆN CHO ĐƯƠNG SỐ):

1. SOẠN THẢO PHẦN MỞ ĐẦU (Định vị bản thể & Ma trận SWOT thực chiến):
   BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## ĐỊNH VỊ BẢN MỆNH: BẢN ĐỒ CHIẾN LƯỢC NHÂN SINH & MA TRẬN SWOT"
   Bao gồm 2 mục con rõ ràng:
   ### 1. Bản Thể & Chân Dung Cốt Cách Nhật Chủ (khoảng 250 - 300 từ): Khắc họa thần thái cốt cách, năng lượng ngũ hành chủ đạo, điểm đắc lực và sứ mệnh gốc rễ của Nhật Chủ.
   ### 2. Ma Trận Định Vị Bản Mệnh SWOT (Chiết Xuất 100% Từ 6 Phân Hệ Thực Chiến):
   BẮT BUỘC thiết lập 1 BẢNG MARKDOWN chuẩn xác gồm 3 cột:
   | Chiều Phân Tích | Yếu Tố Mệnh Lý Biện Chứng (Tổng hợp từ 6 chương) | Ý Nghĩa Thực Tế & Lời Khuyên Hành Động |
   - Hàng 1: **S - Strengths (Thế Mạnh Cốt Lõi)**: Tổng hợp trực tiếp từ Ch1 & Ch2.
   - Hàng 2: **W - Weaknesses (Tử Huyệt Cần Khắc Phục)**: Tổng hợp trực tiếp từ Ch3 & Ch4.
   - Hàng 3: **O - Opportunities (Thời Cơ Thiên Thời)**: Tổng hợp trực tiếp từ Ch1, Ch2 & Ch6.
   - Hàng 4: **T - Threats (Cạm Bẫy Cần Đề Phòng)**: Tổng hợp trực tiếp từ Ch3, Ch4 & Ch6.

2. SOẠN THẢO PHẦN KẾT THÚC (Chiến lược điều hòa đa mục tiêu & Đúc kết nhân sinh):
   BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## CHIẾN LƯỢC ĐIỀU HÒA ĐA MỤC TIÊU & HÓA GIẢI XUNG KHẮC BẢN MỆNH"
   ### 1. Cân Bằng Giữa Dòng Tiền & Tạng Phủ (Tài Chính vs Sức Khỏe)
   ### 2. Cân Bằng Giữa Danh Vọng & Hạnh Phúc Gia Đạo (Sự Nghiệp vs Hôn Nhân)
   ### 3. Bảng Lộ Trình Đồng Bộ Hành Động Theo Chu Kỳ (Master Action Roadmap)
   Lập BẢNG MARKDOWN 4 cột:
   | Giai Đoạn Vận Hạn | Mục Tiêu Trọng Tâm Ưu Tiên | Thách Thức Cần Phòng Thủ | Lời Khuyên Hành Động Thực Chiến |
   
   Tiếp theo là mục:
   ## ĐÚC KẾT NHÂN SINH & LỜI KHUYÊN HÀNH ĐẠO (khoảng 250 - 350 từ).

‼️ BỘ QUY TẮC BẮT BUỘC:
- TUYỆT ĐỐI CẤM mọi lời chào hỏi, xưng danh hay kể lể quy trình biên tập (CẤM: "Chào bạn", "Với tư cách là...", "Tổng biên tập", "Tôi đã thẩm định...", "Theo yêu cầu của bạn", "Dưới đây là phần trình bày...", "Sau khi đọc 6 chương..."). Đi thẳng ngay vào tiêu đề Markdown!
- Xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG tóm tắt hay rút gọn 6 chương vì hệ thống sẽ chèn 100% nguyên văn 6 chương chi tiết vào giữa. Bạn CHỈ XUẤT ĐÚNG 2 PHẦN:
  [PHẦN 1: DẪN NHẬP ĐỊNH VỊ BẢN MỆNH & SWOT] và [PHẦN 2: CHIẾN LƯỢC ĐIỀU HÒA ĐA MỤC TIÊU & ĐÚC KẾT NHÂN SINH].
- TUYỆT ĐỐI KHÔNG dùng từ "VIP", "gói VIP", "báo cáo VIP" hay bất kỳ từ "VIP" nào. Hãy luôn sử dụng từ "luận giải chuyên sâu" hoặc "bản luận giải chuyên sâu".`;

            const chiefKey = GeminiRotator.getFallbackKey();
            logger.info(`[BaziDeepPipeline - Tầng 3] Chief Editor điều phối qua [${GeminiRotator.getKeyLabel(chiefKey)}]...`);
            introAndOutro = await LlmProviderService.callGeminiWithKey(chiefKey, synthesisPrompt);
          } catch (synthErr) {
            logger.warn(`[BaziDeepPipeline - Tầng 3] Synthesis warning: ${synthErr.message}`);
          }

          let introHeader = '';
          let outroFooter = '';
          if (introAndOutro) {
            const cleanedSynthesis = SseStreamHelper.cleanMarkdown(introAndOutro);
            const splitRegex = /(?=##\s*CHIẾN LƯỢC ĐIỀU HÒA|##\s*ĐÚC KẾT)/i;
            const parts = cleanedSynthesis.split(splitRegex);
            if (parts.length > 1) {
              introHeader = SseStreamHelper.sanitizeMetaIntro(parts[0]);
              outroFooter = parts.slice(1).join('\n\n').trim();
            } else {
              introHeader = SseStreamHelper.sanitizeMetaIntro(cleanedSynthesis);
            }
          }

          // 1. Stream Intro SWOT
          if (introHeader) {
            await SseStreamHelper.streamTextChunks(controller, encoder, introHeader, { chunkSize: 120, delayMs: 15 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 2. Stream 6 Chapters Full Text
          for (let i = 0; i < REPLICAS.length; i++) {
            const rep = REPLICAS[i];
            SseStreamHelper.dispatchProgress(onProgress, { stage: 'streaming', streamingChapterId: rep.id, title: rep.title, message: `Đang xuất nội dung: Chương ${rep.id} - ${rep.title}...` });
            const chapterText = SseStreamHelper.cleanMarkdown(chaptersOutput[i] || '');
            await SseStreamHelper.streamTextChunks(controller, encoder, chapterText, { chunkSize: 120, delayMs: 15 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 3. Stream Outro Strategy
          if (outroFooter) {
            await SseStreamHelper.streamTextChunks(controller, encoder, outroFooter, { chunkSize: 120, delayMs: 15 });
          }

          SseStreamHelper.dispatchProgress(onProgress, { stage: 'completed', isCompleted: true, message: 'Hoàn tất toàn bộ luận giải chuyên sâu!' });
          logger.info('[BaziDeepPipeline] Luồng stream hoàn thành trọn vẹn 100%.');

        } catch (err) {
          logger.error('[BaziDeepPipeline] Stream error:', err);
          controller.enqueue(encoder.encode(`\n\n[Lỗi tạo bài Chuyên Sâu: ${err.message}]`));
        } finally {
          controller.close();
        }
      }
    });

    return { stream };
  }
}

/**
 * Pipeline Tử Vi Đẩu Số Đa Tầng (4 Tầng: Cốt Cách CoT + Tứ Hóa CoT + 5 Cụm Cung Replicas + Chief Editor)
 */
class ZiweiDeepPipeline {
  static async executeClusterReplica(replica, fullContext) {
    const { id, title, provider, model, keyEnv, subtopics } = replica;
    const apiKey = process.env[keyEnv] || process.env.GEMINI_API_KEY;

    const clusterInstruction = ZIWEI_VIP_CONFIG.getClusterSpecificInstructions(id);

    const clusterPrompt = `Dựa trên dữ liệu lá số Tử Vi Đẩu Số và bản phân tích CoT học thuật nền tảng:\n${fullContext}\n\n` +
      `----------------------------------------\n` +
      `CHỈ DẪN HỌC THUẬT CHUYÊN BIỆT CHO CHƯƠNG ${id}: ${title.toUpperCase()}\n` +
      `${clusterInstruction}\n\n` +
      `CÁC ĐỀ MỤC TRỌNG TÂM CẦN LUẬN GIẢI SÂU SẮC:\n${subtopics.map((s) => `- ${s}`).join('\n')}\n\n` +
      `‼️ BỘ QUY TẮC KỶ LUẬT BẮT BUỘC:\n` +
      `1. QUY TẮC XƯNG HÔ: BẮT BUỘC xưng hô với đương số là "bạn" (thân thiện, tôn trọng, lịch thiệp). Tự xưng là "tôi" hoặc góc nhìn học thuật khách quan. TUYỆT ĐỐI NGHIÊM CẤM xưng "ngươi".\n` +
      `2. THẬP NHỊ CUNG & TINH ĐẨU TỬ VI: Tuân thủ 100% dữ liệu sao đắc hãm, tuần triệt, tam hợp chiếu và tứ hóa phi tinh của cung vị tương ứng.\n` +
      `3. CHỈ LUẬN GIẢI SAO HIỆN HỮU: Chỉ luận các sao có mặt thực tế trong cung vị hoặc các cung chiếu về. Yếu tố nào không có thì HOÀN TOÀN BIẾN MẤT, không được ghi "không có".\n` +
      `4. KHÔNG PHÁN XÉT ĐOẠT MỆNH: Tuyệt đối không phán về ngày chết, số đoạt tuyệt, bệnh bất trị. Luôn đi kèm giải pháp cải mệnh, tu dưỡng tâm tính, hướng thiện.\n` +
      `5. TIÊU ĐỀ RÕ RÀNG: Dùng tiêu đề cấp 3 (### Tên Đề Mục) bôi đậm cho từng đề mục con.\n` +
      `6. ĐỊNH DẠNG: Chuẩn Markdown GFM. Dùng bảng Markdown khi tổng hợp các năm vận hạn hoặc so sánh cát hung.\n` +
      `7. DUNG LƯỢNG: Phân tích sâu sắc, độ dài khoảng 800 - 1.200 từ cho chương này.\n` +
      `8. 100% TIẾNG VIỆT THUẦN TÚY: Không dùng chữ Hán / tiếng Trung.\n` +
      `9. TUYỆT ĐỐI CẤM TỪ "VIP": TUYỆT ĐỐI KHÔNG dùng từ "VIP", "gói VIP", "báo cáo VIP" hay bất kỳ từ "VIP" nào trong bài viết. Hãy luôn sử dụng từ "luận giải chuyên sâu" hoặc "bản luận giải chuyên sâu".\n` +
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.replace(/^Cụm\s*/i, '').toUpperCase()}`;

    try {
      if (provider === 'gemini') {
        const geminiKey = GeminiRotator.getNextKey();
        const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        logger.info(`[ZiweiDeepPipeline - Tầng 2] Cluster ${id} (${title}) gọi Gemini [${geminiModel}] qua [${GeminiRotator.getKeyLabel(geminiKey)}]...`);
        return await LlmProviderService.callGeminiWithKey(geminiKey, clusterPrompt, geminiModel);
      }

      const openRouterKeys = OpenRouterRotator.getKeys();
      if (openRouterKeys.length > 0) {
        const orModel = model || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free';
        try {
          logger.info(`[ZiweiDeepPipeline - Tầng 3] Cluster ${id} (${title}) routing to OpenRouter [${orModel}]...`);
          return await LlmProviderService.callOpenRouterEndpoint({
            model: orModel,
            prompt: clusterPrompt
          });
        } catch (orErr) {
          logger.warn(`[ZiweiDeepPipeline - Tầng 3] OpenRouter error: ${orErr.message}. Falling back to Gemini...`);
        }
      }

      const fallbackGeminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
      const fallbackKey = GeminiRotator.getFallbackKey();
      logger.info(`[ZiweiDeepPipeline - Fallback] Xoay tua sang [${GeminiRotator.getKeyLabel(fallbackKey)}] cho Cụm ${id}...`);
      return await LlmProviderService.callGeminiWithKey(fallbackKey, clusterPrompt, fallbackGeminiModel);
    } catch (err) {
      logger.warn(`[ZiweiDeepPipeline - Tầng 2] Cluster ${id} fallback error: ${err.message}`);
      const fallbackKey = GeminiRotator.getFallbackKey();
      return await AiService.generateInterpretation(clusterPrompt, { 
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        apiKey: fallbackKey
      });
    }
  }

  static async runVipPipelineStream(prompt, birthYear, options = {}) {
    const { onProgress } = options;
    const REPLICAS = ZIWEI_VIP_CONFIG.REPLICAS;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // =========================================================================
          // TẦNG 1 & TẦNG 2: DUAL CHAIN-OF-THOUGHT (CỐT CÁCH & TỨ HÓA PHI TINH)
          // =========================================================================
          logger.info('[ZiweiDeepPipeline - TẦNG 1 & 2] Bắt đầu suy luận CoT Cốt Cách & Tứ Hóa Phi Tinh...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage1', step: 'cot_personality', message: 'Đang thẩm định cốt cách Mệnh Thân & Cục vị tinh đồ...' });

          const personalityCotPrompt = `[BẢN SUY LUẬN 1 - GIÁM ĐỊNH CỐT CÁCH MỆNH THÂN & CỤC]:\n` +
            `Dựa trên dữ liệu lá số Tử Vi:\n${prompt}\n` +
            `Hãy suy luận Chain-of-Thought (CoT) chuyên sâu về:\n` +
            `1. Bản Mệnh và Cục: Quan hệ tương sinh/tương khắc giữa Cục và Mệnh (Mệnh sinh Cục, Cục khắc Mệnh...). Ý nghĩa định vị xuất phát điểm và sự thuận nghịch của đời người.\n` +
            `2. Tinh đẩu Mệnh Thân: Cốt cách lãnh đạo, mưu lược hay chuyên môn kỹ nghệ. Các sao đắc hãm và sát tinh đi kèm.\n` +
            `3. Cung Thân chuyển biến: Khi bước qua tuổi lập thân (trung niên), trọng tâm nhân sinh chuyển về cung nào và biến đổi ra sao.\n` +
            `LƯU Ý: Xưng hô với đương số là "bạn", không xưng "ngươi".`;

          const tuHoaCotPrompt = `[BẢN SUY LUẬN 2 - TRUY VẾT DÒNG CHẢY TỨ HÓA PHI TINH & CỘNG HƯỞNG CUNG VỊ]:\n` +
            `Dựa trên dữ liệu lá số Tử Vi:\n${prompt}\n` +
            `Hãy suy luận Chain-of-Thought (CoT) chuyên sâu về:\n` +
            `1. Can Năm sinh và Bốn Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ) đóng tại những cung nào trong 12 cung.\n` +
            `2. Dòng chảy năng lượng: Cung đắc Hóa Lộc (nơi phát tài phát lộc), Hóa Quyền (nơi nắm quyền lực/trọng trách), Hóa Khoa (nơi danh tiếng/quý nhân hóa giải), và Hóa Kỵ (nơi trắc trở, tâm tư dằn vặt, tử huyệt cần tu dưỡng).\n` +
            `3. Các thế xung chiếu và phi tinh kích hoạt: Khi gặp Đại Hạn kích hoạt cung nào thì tứ hóa tạo nên bước ngoặt lớn.\n` +
            `LƯU Ý: Xưng hô với đương số là "bạn", không xưng "ngươi".`;

          const cot1Promise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            personalityCotPrompt
          ).catch((e) => {
            logger.warn('[ZiweiDeepPipeline - CoT 1] Gemini error:', e.message);
            return 'Cốt cách Mệnh Thân & Cục đã được ghi nhận trong dữ liệu tinh đồ.';
          });

          const openRouterKeys = OpenRouterRotator.getKeys();
          const cot2Promise = (openRouterKeys.length > 0
            ? LlmProviderService.callOpenRouterEndpoint({
                model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
                prompt: tuHoaCotPrompt,
                timeoutMs: 40000
              })
            : LlmProviderService.callGeminiWithKey(
                GeminiRotator.getFallbackKey(),
                tuHoaCotPrompt
              )
          ).catch((e) => {
            const fallbackKey = GeminiRotator.getFallbackKey();
            logger.warn(`[ZiweiDeepPipeline - CoT 2] OpenRouter error, falling back to Gemini [${GeminiRotator.getKeyLabel(fallbackKey)}]:`, e.message);
            return LlmProviderService.callGeminiWithKey(
              fallbackKey,
              tuHoaCotPrompt
            ).catch(() => 'Dòng chảy Tứ Hóa Phi Tinh đã được tổng hợp trong tinh đồ.');
          });

          const [cot1, cot2] = await Promise.all([cot1Promise, cot2Promise]);

          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage2', step: 'cot_tuhoa', message: 'Đang truy vết dòng chảy Tứ Hóa Phi Tinh & biến động cung vị...' });

          const combinedCot = `\n=== BẢN SUY LUẬN HỌC THUẬT NỀN TẢNG (TẦNG 1 & 2 DUAL COT) ===\n` +
            `[COT 1 - CỐT CÁCH MỆNH THÂN & CỤC (GEMINI)]:\n${cot1}\n\n` +
            `[COT 2 - TỨ HÓA PHI TINH & CỘNG HƯỞNG CUNG VỊ (OPENROUTER)]:\n${cot2}\n` +
            `=======================================================\n`;

          const fullContext = `${prompt}\n${combinedCot}`;

          // =========================================================================
          // TẦNG 3: 5 REPLICAS CHƯƠNG CHUYÊN ĐỀ SONG SONG
          // =========================================================================
          logger.info('[ZiweiDeepPipeline - TẦNG 3] Khởi chạy 5 Chương chuyên đề song song...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage3', step: 'clusters_start', message: 'Đang tiến hành luận giải chuyên sâu 5 chương tinh đồ...' });

          const clusterPromises = REPLICAS.map((rep, idx) => {
            const delay = idx * 250;
            return new Promise(resolve => setTimeout(resolve, delay)).then(async () => {
              SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage3', chapterId: rep.id, status: 'in_progress', title: rep.title, message: `Đang luận giải: Chương ${rep.id} - ${rep.title}...` });
              const output = await ZiweiDeepPipeline.executeClusterReplica(rep, fullContext);
              SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage3', chapterId: rep.id, status: 'completed', title: rep.title, message: `Đã hoàn tất: Chương ${rep.id} - ${rep.title}` });
              return output;
            });
          });

          const clustersOutput = await Promise.all(clusterPromises);
          logger.info('[ZiweiDeepPipeline - TẦNG 3] 5 Chương đã hoàn thành 100%.');

          // =========================================================================
          // TẦNG 4: GEMINI CHIEF EDITOR (SWOT MỆNH BÀN & ĐIỀU HÒA CHIẾN LƯỢC ĐẠI HẠN)
          // =========================================================================
          logger.info('[ZiweiDeepPipeline - TẦNG 4] Gemini đọc TOÀN BỘ 5 chương để xuất SWOT & Hóa Giải...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage4', step: 'synthesis_start', message: 'Đang tổng hợp ma trận mệnh bàn & kế sách điều hòa phi tinh...' });

          const fullClustersContext = clustersOutput.map((content, idx) => {
            const rep = REPLICAS[idx];
            return `=== VĂN BẢN ĐÃ LUẬN GIẢI: CHƯƠNG ${rep.id} - ${rep.title.toUpperCase()} ===\n${(content || '').trim()}`;
          }).join('\n\n----------------------------------------\n\n');

          let introAndOutro = null;
          try {
            const chiefEditorPrompt = `Bạn là Đại Sư Tử Vi Đẩu Số uyên bác.
Dưới đây là 2 nguồn dữ liệu hoàn chỉnh của lá số:

[NGUỒN 1: TINH ĐỒ FACT DATA & SUY LUẬN TẦNG 1-2 COT]:
${combinedCot}

[NGUỒN 2: TOÀN VĂN 5 CHƯƠNG ĐÃ ĐƯỢC 5 CHUYÊN GIA ĐỘC LẬP LUẬN GIẢI CHI TIẾT (TẦNG 3)]:
${fullClustersContext}

NHIỆM VỤ CỦA BẠN (TỔNG HỢP VÀ ĐIỀU HÒA CHIẾN LƯỢC TOÀN DIỆN CHO ĐƯƠNG SỐ):
1. SOẠN THẢO PHẦN MỞ ĐẦU (Định vị bản thể & Ma trận SWOT Mệnh Bàn):
   BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## ĐỊNH VỊ BẢN MỆNH: MA TRẬN MỆNH BÀN SWOT & TỔNG QUAN TINH ĐỒ"
   ### 1. Thần Thái & Chân Dung Cốt Cách Tinh Đẩu (khoảng 250 - 300 từ)
   ### 2. Ma Trận Mệnh Bàn SWOT 4 Chiều (Tổng hợp từ 5 chương & Tứ Hóa):
   BẮT BUỘC lập BẢNG MARKDOWN chuẩn xác gồm 3 cột:
   | Chiều Phân Tích | Tinh Đẩu & Cung Vị Biện Chứng | Ý Nghĩa Thực Tế & Lời Khuyên Hành Động |
   - **S - Strengths**: Các cát tinh đắc địa, Hóa Lộc, Hóa Quyền, thế tam hợp đắc lực.
   - **W - Weaknesses**: Các hung sát tinh hãm địa, cung Vô Chính Diệu, tử huyệt tâm lý.
   - **O - Opportunities**: Thiên thời từ Hóa Khoa, Quý Nhân trợ mệnh, vận trình hanh thông.
   - **T - Threats**: Hóa Kỵ xung phá, cạm bẫy Không Kiếp, Kình Đà và các hạn hiểm ác.

2. SOẠN THẢO PHẦN KẾT THÚC (Chiến lược điều hòa & Kế sách hóa giải tinh đồ):
   BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## CHIẾN LƯỢC ĐIỀU HÒA & ĐẠI HẠN 10 NĂM: KẾ SÁCH PHI TINH HÓA GIẢI"
   ### 1. Kế Sách Phi Tinh Điều Hòa Năng Lượng & Hóa Giải Hung Sát
   (Cách hóa giải Hóa Kỵ, cách thuần hóa Không Kiếp, Kình Đà dựa trên hành vi và môi trường).
   ### 2. Bảng Dự Phóng Đại Vận 10 Năm (Master Lifepath Roadmap)
   Lập BẢNG MARKDOWN 4 cột:
   | Đại Hạn / Độ Tuổi | Cung Vị Đại Hạn | Cát Tinh & Hung Sát Chủ Quản | Chiến Lược Hành Động Tối Ưu |
   
   Tiếp theo là mục:
   ## ĐÚC KẾT NHÂN SINH & LỜI KHUYÊN HÀNH ĐẠO (khoảng 250 - 350 từ).

‼️ BỘ QUY TẮC BẮT BUỘC:
- TUYỆT ĐỐI CẤM mọi lời chào hỏi, xưng danh hay kể lể quy trình biên tập (CẤM: "Chào bạn", "Với tư cách là...", "Tổng biên tập", "Tôi đã thẩm định...", "Theo yêu cầu của bạn", "Dưới đây là phần trình bày...", "Sau khi đọc 5 chương..."). Đi thẳng ngay vào tiêu đề Markdown!
- Xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG tóm tắt hay rút gọn 5 chương vì hệ thống sẽ chèn 100% nguyên văn 5 chương vào giữa. Bạn CHỈ XUẤT ĐÚNG 2 PHẦN:
  [PHẦN 1: DẪN NHẬP ĐỊNH VỊ BẢN MỆNH SWOT] và [PHẦN 2: CHIẾN LƯỢC ĐIỀU HÒA & KẾ SÁCH HÓA GIẢI].
- TUYỆT ĐỐI KHÔNG dùng từ "VIP", "gói VIP", "báo cáo VIP" hay bất kỳ từ "VIP" nào. Hãy luôn sử dụng từ "luận giải chuyên sâu" hoặc "bản luận giải chuyên sâu".`;

            const chiefKey = GeminiRotator.getFallbackKey();
            logger.info(`[ZiweiDeepPipeline - Tầng 4] Chief Editor điều phối qua [${GeminiRotator.getKeyLabel(chiefKey)}]...`);
            introAndOutro = await LlmProviderService.callGeminiWithKey(chiefKey, chiefEditorPrompt);
          } catch (synthErr) {
            logger.warn(`[ZiweiDeepPipeline - Tầng 4] Synthesis warning: ${synthErr.message}`);
          }

          let introHeader = '';
          let outroFooter = '';
          if (introAndOutro) {
            const cleanedSynthesis = SseStreamHelper.cleanMarkdown(introAndOutro);
            const splitRegex = /(?=##\s*CHIẾN LƯỢC ĐIỀU HÒA|##\s*ĐÚC KẾT)/i;
            const parts = cleanedSynthesis.split(splitRegex);
            if (parts.length > 1) {
              introHeader = SseStreamHelper.sanitizeMetaIntro(parts[0]);
              outroFooter = parts.slice(1).join('\n\n').trim();
            } else {
              introHeader = SseStreamHelper.sanitizeMetaIntro(cleanedSynthesis);
            }
          }

          // 1. Stream Intro SWOT
          if (introHeader) {
            await SseStreamHelper.streamTextChunks(controller, encoder, introHeader, { chunkSize: 120, delayMs: 15 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 2. Stream 5 Clusters Full Text
          for (let i = 0; i < REPLICAS.length; i++) {
            const rep = REPLICAS[i];
            SseStreamHelper.dispatchProgress(onProgress, { stage: 'streaming', streamingChapterId: rep.id, title: rep.title, message: `Đang xuất nội dung: Chương ${rep.id} - ${rep.title}...` });
            const clusterText = SseStreamHelper.cleanMarkdown(clustersOutput[i] || '');
            await SseStreamHelper.streamTextChunks(controller, encoder, clusterText, { chunkSize: 120, delayMs: 15 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 3. Stream Outro Strategy & Conclusion
          if (outroFooter) {
            await SseStreamHelper.streamTextChunks(controller, encoder, outroFooter, { chunkSize: 120, delayMs: 15 });
          }

          SseStreamHelper.dispatchProgress(onProgress, { stage: 'completed', isCompleted: true, message: 'Hoàn tất toàn bộ luận giải chuyên sâu Tử Vi Đẩu Số!' });
          logger.info('[ZiweiDeepPipeline] Luồng stream Tử Vi hoàn thành trọn vẹn 100%.');

        } catch (err) {
          logger.error('[ZiweiDeepPipeline] Stream error:', err);
          controller.enqueue(encoder.encode(`\n\n[Lỗi tạo bài Tử Vi Chuyên Sâu: ${err.message}]`));
        } finally {
          controller.close();
        }
      }
    });

    return { stream };
  }
}

/**
 * Pipeline Hợp Hôn Đa Tầng (3 Tầng: CoT Tương Quan -> 4 Replicas 4 Trụ Cột -> Gemini Chief Editor)
 */
class MarriageDeepPipeline {
  static async executeReplica(replica, fullContext) {
    const { id, title, provider, model, keyEnv, subtopics } = replica;
    const cleanContext = SseStreamHelper.cleanContextForVip(fullContext);
    const pillarInstruction = MARRIAGE_VIP_CONFIG.getPillarSpecificInstructions(id);

    const replicaPrompt = `Dựa trên dữ liệu lá số Bát Tự Hợp Hôn và phân tích đối chiếu học thuật giữa hai người:\n${cleanContext}\n\n` +
      `----------------------------------------\n` +
      `CHỈ DẪN HỌC THUẬT CHUYÊN BIỆT CHO CHƯƠNG ${id}: ${title.toUpperCase()}\n` +
      `${pillarInstruction}\n\n` +
      `ĐỊNH HƯỚNG CÁC TRỌNG TÂM CẦN LUẬN GIẢI:\n${subtopics.map(s => `- ${s}`).join('\n')}\n\n` +
      `‼️ BỘ QUY TẮC KỶ LUẬT HỌC THUẬT BẮT BUỘC:\n` +
      `1. QUY TẮC XƯNG HÔ: BẮT BUỘC xưng hô với hai người là "hai bạn" hoặc "anh chị" (hoặc "chồng" / "vợ"), tự xưng là "tôi" hoặc góc nhìn chuyên gia học thuật khách quan. TUYỆT ĐỐI NGHIÊM CẤM xưng "ngươi", "kẻ hèn".\n` +
      `2. TUYỆT ĐỐI KHÔNG PHÁN XÉT BẾ TẮC / LY HÔN: Trong đạo học phong thủy, hôn nhân là sự hòa hợp và tu dưỡng. Bất kỳ cặp xung khắc nào đều có ngũ hành cầu nối hóa giải. Tập trung vào cách thấu hiểu, bù khuyết và phương pháp chuyển hóa thực tế.\n` +
      `3. ĐI THẲNG TRỌNG TÂM: Phân tích thực tế đời sống hôn nhân, gia đình, tài chính, con cái. Tránh giảng giải lý thuyết suông dài dòng.\n` +
      `4. TIÊU ĐỀ RÕ RÀNG: Dùng tiêu đề cấp 3 (### Tên Đề Mục) cho từng đề mục con.\n` +
      `5. ĐỊNH DẠNG: Chuẩn Markdown GFM, dùng bảng Markdown khi so sánh hoặc niên biểu mốc thời gian.\n` +
      `6. 100% TIẾNG VIỆT THUẦN TÚY: Không dùng chữ Hán / tiếng Trung.\n` +
      `7. DUNG LƯỢNG: Phân tích sâu sắc, độ dài khoảng 800 - 1.200 từ cho Chương này.\n` +
      `8. TUYỆT ĐỐI CẤM TỪ "VIP": TUYỆT ĐỐI KHÔNG dùng từ "VIP", "gói VIP", "báo cáo VIP" hay bất kỳ từ "VIP" nào trong bài viết. Hãy luôn sử dụng từ "luận giải chuyên sâu" hoặc "bản luận giải chuyên sâu".\n` +
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.toUpperCase()}`;

    try {
      if (provider === 'gemini') {
        const geminiKey = GeminiRotator.getNextKey();
        const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        logger.info(`[MarriageDeepPipeline - Tầng 2] Trụ ${id} (${title}) gọi Gemini [${geminiModel}] qua [${GeminiRotator.getKeyLabel(geminiKey)}]...`);
        return await LlmProviderService.callGeminiWithKey(geminiKey, replicaPrompt, geminiModel);
      }

      const openRouterKeys = OpenRouterRotator.getKeys();
      if (openRouterKeys.length > 0) {
        try {
          logger.info(`[MarriageDeepPipeline - Tầng 2] Chương ${id} (${title}) routing to OpenRouter [${model}]...`);
          return await LlmProviderService.callOpenRouterEndpoint({
            model: model || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
            prompt: replicaPrompt
          });
        } catch (orErr) {
          logger.warn(`[MarriageDeepPipeline - Tầng 2] OpenRouter Chương ${id} error: ${orErr.message}. Falling back to Gemini...`);
        }
      }

      const fallbackGeminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
      const fallbackKey = GeminiRotator.getFallbackKey();
      logger.info(`[MarriageDeepPipeline - Fallback] Xoay tua sang [${GeminiRotator.getKeyLabel(fallbackKey)}] cho Chương ${id}...`);
      return await LlmProviderService.callGeminiWithKey(fallbackKey, replicaPrompt, fallbackGeminiModel);
    } catch (err) {
      logger.warn(`[MarriageDeepPipeline - Tầng 2] Chương ${id} fallback error: ${err.message}. Using default Gemini...`);
      const fallbackKey = GeminiRotator.getFallbackKey();
      return await AiService.generateInterpretation(replicaPrompt, { 
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        apiKey: fallbackKey
      });
    }
  }

  static async runVipPipelineStream(prompt, birthYear, options = {}) {
    return this.runMarriageVipPipelineStream(prompt, options);
  }

  static async runMarriageVipPipelineStream(prompt, options = {}) {
    const { onProgress } = options;
    const PILLARS = MARRIAGE_VIP_CONFIG.PILLARS;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // --- TỔNG QUAN: Phân Tích Cốt Lõi Tương Quan Bản Mệnh (DUAL COT) ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'cot_started',
            message: 'Đang khảo cứu tương quan Bát Tự & Cung Phi Bát Trạch...'
          });

          const cotGeminiPrompt = `Bạn là Bậc thầy Mệnh lý Hợp Hôn. Hãy phân tích ngắn gọn, sắc bén tương quan bản mệnh:\n${prompt}\n\n` +
            `YÊU CẦU ĐÚC KẾT CỐT LÕI (150-250 từ):\n` +
            `1. Bản chất tương tác Nhật Chủ & Ngũ hành Nạp Âm của 2 người (Tương sinh, tương khắc hay tương trợ?).\n` +
            `2. Sự bổ khuyết ngũ hành: Ai có ngũ hành vượng để bổ trợ cho ngũ hành suy khuyết của người kia?`;

          const cotOrPrompt = `Bạn là Đại sư Phong thủy Bát Trạch & Hôn Phối. Hãy biện chứng phong thủy hợp hôn:\n${prompt}\n\n` +
            `YÊU CẦU ĐÚC KẾT CỐT LÕI (150-250 từ):\n` +
            `1. Tương quan Cung Phi Bát Trạch (Thuộc nhóm Sinh Khí, Diên Niên, Thiên Y, Phục Vị hay Tuyệt Mệnh, Ngũ Quỷ, Họa Hại, Lục Sát?).\n` +
            `2. Đâu là "ngũ hành cầu nối" trọng yếu nhất để chuyển hung thành cát cho cặp đôi này?`;

          const cotGeminiPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            cotGeminiPrompt
          ).catch((e) => {
            logger.warn('[MarriageDeepPipeline - CoT Gemini] Error:', e.message);
            return 'Tương quan ngũ hành bản mệnh đã được xác lập trong dữ liệu hợp hôn.';
          });

          const openRouterKeys = OpenRouterRotator.getKeys();
          const cotOrPromise = (openRouterKeys.length > 0
            ? LlmProviderService.callOpenRouterEndpoint({
                model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
                prompt: cotOrPrompt,
                timeoutMs: 35000
              })
            : LlmProviderService.callGeminiWithKey(
                GeminiRotator.getFallbackKey(),
                cotOrPrompt
              )
          ).catch((e) => {
            const fallbackKey = GeminiRotator.getFallbackKey();
            logger.warn(`[MarriageDeepPipeline - CoT OpenRouter] Error, falling back to Gemini [${GeminiRotator.getKeyLabel(fallbackKey)}]:`, e.message);
            return LlmProviderService.callGeminiWithKey(
              fallbackKey,
              cotOrPrompt
            ).catch(() => 'Tương quan Cung Phi và ngũ hành cầu nối đã được xác lập.');
          });

          const [cotGemini, cotOr] = await Promise.all([cotGeminiPromise, cotOrPromise]);

          const fullContext = `${prompt}\n\n[BẢN PHÂN TÍCH TƯƠNG QUAN NỀN TẢNG (DUAL COT)]:\n` +
            `[BẢN 1 - KHẢO CỨU BẢN MỆNH & NGŨ HÀNH (GEMINI)]:\n${cotGemini}\n\n` +
            `[BẢN 2 - BIỆN CHỨNG CUNG PHI & CẦU NỐI (OPENROUTER)]:\n${cotOr}`;

          // --- PHÂN TÍCH SONG SONG 4 CHƯƠNG ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'replicas_started',
            message: 'Đang tiến hành luận giải chuyên sâu 4 chương duyên phận gia đạo...'
          });

          const pillarPromises = PILLARS.map((pillar, idx) => {
            const delay = idx * 250;
            return new Promise(resolve => setTimeout(resolve, delay)).then(async () => {
              SseStreamHelper.dispatchProgress(onProgress, {
                chapterId: pillar.id,
                status: 'in_progress',
                title: pillar.title,
                message: `Đang luận giải Chương ${pillar.id}: ${pillar.title}...`
              });
              const text = await MarriageDeepPipeline.executeReplica(pillar, fullContext);
              SseStreamHelper.dispatchProgress(onProgress, {
                chapterId: pillar.id,
                status: 'completed',
                title: pillar.title,
                message: `Đã hoàn tất Chương ${pillar.id}: ${pillar.title}`
              });
              return { id: pillar.id, title: pillar.title, text };
            });
          });

          const pillarResults = await Promise.all(pillarPromises);

          // --- TỔNG HỢP MA TRẬN DUYÊN PHẬN & HÒA GIẢI ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'chief_editor',
            message: 'Đang tổng hợp ma trận duyên phận tương hợp & phác đồ hòa giải...'
          });

          const editorPrompt = `Bạn là Bậc Thầy Phong Thủy & Hôn Nhân Gia Đạo uyên thâm. Đọc toàn bộ phân tích 4 Chương sau đây để viết phần Dẫn Nhập Đánh Giá Tương Hợp và Phác Đồ Hòa Giải trực tiếp cho hai đương số:\n\n` +
            pillarResults.map(p => `=== CHƯƠNG ${p.id}: ${p.title} ===\n${p.text}`).join('\n\n') +
            `\n\nNHIỆM VỤ CỦA BẠN:\n` +
            `1. Viết phần DẪN NHẬP & MA TRẬN ĐÁNH GIÁ MỨC ĐỘ TƯƠNG HỢP đặt lên ĐẦU bài viết:\n` +
            `   - BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## TỔNG QUAN HÔN PHỐI & KHÍ TRƯỜNG NHÂN DUYÊN"\n` +
            `   - Điểm số hòa hợp (thang điểm 100/100) và Tỷ lệ tương thích (%)\n` +
            `   - Ma trận SWOT Hôn Nhân: S (Điểm tựa gắn kết), W (Điểm nhạy cảm xung đột), O (Cơ hội tài lộc khi đồng lòng), T (Nguy cơ rủi ro cần lường trước)\n` +
            `2. Viết phần KẾT LUẬN & PHÁC ĐỒ HÓA GIẢI đặt ở CUỐI bài viết:\n` +
            `   - BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## CHIẾN LƯỢC ĐIỀU HÒA & PHÁC ĐỒ HÓA GIẢI HÔN NHÂN"\n` +
            `   - 3 NGUYÊN TẮC VÀNG GÌN GIỮ HẠNH PHÚC GIA ĐẠO\n` +
            `   - PHÁC ĐỒ HÓA GIẢI TOÀN DIỆN & LỜI CHÚC PHÚC TRĂM NĂM\n\n` +
            `‼️ BỘ QUY TẮC BẮT BUỘC:\n` +
            `- TUYỆT ĐỐI CẤM mọi lời chào hỏi, xưng danh hay kể lể quy trình biên tập (CẤM: "Chào bạn", "Với tư cách là...", "Tổng biên tập", "Tôi đã thẩm định...", "Theo yêu cầu của bạn", "Dưới đây là phần trình bày..."). Đi thẳng ngay vào tiêu đề Markdown!\n` +
            `- TUYỆT ĐỐI KHÔNG dùng từ "VIP", hãy luôn sử dụng từ "luận giải chuyên sâu" hoặc "bản luận giải chuyên sâu".\n\n` +
            `Phân tách rõ ràng 2 phần bằng thẻ: <!-- SPLIT_INTRO_OUTRO -->`;

          let introHeader = '';
          let outroFooter = '';
          try {
            const chiefKey = GeminiRotator.getFallbackKey();
            logger.info(`[MarriageDeepPipeline] Chief Editor điều phối qua [${GeminiRotator.getKeyLabel(chiefKey)}]...`);
            const editorText = await AiService.generateInterpretation(editorPrompt, { 
              model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
              apiKey: chiefKey
            });
            if (editorText.includes('<!-- SPLIT_INTRO_OUTRO -->')) {
              const parts = editorText.split('<!-- SPLIT_INTRO_OUTRO -->');
              introHeader = SseStreamHelper.sanitizeMetaIntro(parts[0]);
              outroFooter = parts[1].trim();
            } else {
              outroFooter = editorText.trim();
            }
          } catch (edErr) {
            logger.warn('[MarriageDeepPipeline] Chief Editor error:', edErr.message);
          }

          // --- PHÁT DÒNG KẾT QUẢ SSE MƯỢT MÀ ---
          if (introHeader) {
            await SseStreamHelper.streamTextChunks(controller, encoder, introHeader, { chunkSize: 120, delayMs: 15 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          for (const p of pillarResults) {
            SseStreamHelper.dispatchProgress(onProgress, {
              stage: 'streaming',
              streamingChapterId: p.id,
              message: `Đang xuất Chương ${p.id}: ${p.title}...`
            });
            await SseStreamHelper.streamTextChunks(controller, encoder, p.text, { chunkSize: 120, delayMs: 15 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          if (outroFooter) {
            await SseStreamHelper.streamTextChunks(controller, encoder, outroFooter, { chunkSize: 120, delayMs: 15 });
          }

          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'completed',
            isCompleted: true,
            message: 'Hoàn tất toàn bộ luận giải chuyên sâu Hợp Hôn Gia Đạo!'
          });
          logger.info('[MarriageDeepPipeline] Stream Hợp Hôn hoàn thành trọn vẹn 100%.');

        } catch (err) {
          logger.error('[MarriageDeepPipeline] Stream error:', err);
          controller.enqueue(encoder.encode(`\n\n[Lỗi tạo bài Hợp Hôn Chuyên Sâu: ${err.message}]`));
        } finally {
          controller.close();
        }
      }
    });

    return { stream };
  }
}

/**
 * Pipeline Kinh Dịch Đa Tầng (3 Tầng: CoT Lục Hào -> 3 Replicas Kịch Bản -> Gemini Chief Editor)
 */
class IChingDeepPipeline {
  static async executeReplica(replica, fullContext, options = {}) {
    const { id, title, provider, model, keyEnv, subtopics } = replica;
    const cleanContext = SseStreamHelper.cleanContextForVip(fullContext);
    let scenarioInstruction = ICHING_VIP_CONFIG.getChapterSpecificInstructions(id) || ICHING_VIP_CONFIG.getScenarioSpecificInstructions(id);

    // Chèn Bảng Tra Cứu Lịch Pháp Gần Nhất (Source of Truth) cho Chương 5 theo Phương án B
    if (id === 5) {
      const castDate = options.castDate || new Date();
      const calendarGroundTruth = generateIChingCalendarGroundTruth(castDate);
      scenarioInstruction = `${scenarioInstruction}\n\n${calendarGroundTruth}`;
    }

    const replicaPrompt = `Dựa trên dữ liệu quẻ Kinh Dịch, câu hỏi cốt lõi của đương số và bảng Lục Hào phân tích:\n${cleanContext}\n\n` +
      `----------------------------------------\n` +
      `CHỈ DẪN HỌC THUẬT CHUYÊN BIỆT CHO CHƯƠNG ${id}: ${title.toUpperCase()}\n` +
      `${scenarioInstruction}\n\n` +
      `ĐỊNH HƯỚNG CÁC TRỌNG TÂM CẦN LUẬN GIẢI:\n${subtopics.map(s => `- ${s}`).join('\n')}\n\n` +
      `‼️ BỘ QUY TẮC KỶ LUẬT HỌC THUẬT BẮT BUỘC:\n` +
      `1. QUY TẮC XƯNG HÔ: BẮT BUỘC xưng hô với đương số là "bạn", tự xưng là "tôi" hoặc góc nhìn học thuật khách quan. TUYỆT ĐỐI CẤM xưng "ngươi", "kẻ hèn".\n` +
      `2. CHUẨN XÁC DỊCH LÝ: Bám sát Quẻ Chủ, Quẻ Biến, Thế - Ứng, Hào Động và Dụng Thần tương ứng với câu hỏi. TUYỆT ĐỐI KHÔNG phán nước đôi vô nghĩa.\n` +
      `3. 100% TẬP TRUNG CÂU HỎI CỐT LÕI: Tuyệt đối không lan man sang chủ đề khác không được hỏi.\n` +
      `4. TIÊU ĐỀ RÕ RÀNG: Dùng tiêu đề cấp 3 (### Tên Đề Mục) cho từng đề mục con.\n` +
      `5. ĐỊNH DẠNG: Chuẩn Markdown GFM, dùng bảng Markdown khi so sánh hoặc mốc thời gian.\n` +
      `6. 100% TIẾNG VIỆT THUẦN TÚY: Không dùng chữ Hán / tiếng Trung.\n` +
      `7. DUNG LƯỢNG: Phân tích sâu sắc, độ dài khoảng 600 - 900 từ cho Chương này.\n` +
      `8. TUYỆT ĐỐI CẤM TỪ "VIP": TUYỆT ĐỐI KHÔNG dùng từ "VIP", "gói VIP", "báo cáo VIP" hay bất kỳ từ "VIP" nào trong bài viết. Hãy luôn sử dụng từ "luận giải chuyên sâu" hoặc "bản luận giải chuyên sâu".\n` +
      `9. TUYỆT ĐỐI CẤM MỌI LỜI CHÀO HỎI, XƯNG DANH: TUYỆT ĐỐI CẤM mọi câu chào hỏi, tự xưng danh (CẤM: 'Chào bạn', 'Với tư cách là...'). Bắt đầu trực tiếp bằng tiêu đề: ## CHƯƠNG ${id}: ${title.toUpperCase()} và đi thẳng vào nội dung học thuật.\n\n` +
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.toUpperCase()}`;

    let generatedText = '';
    try {
      if (provider === 'gemini') {
        const geminiKey = GeminiRotator.getNextKey();
        const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        logger.info(`[IChingDeepPipeline - Phân tích] Chương ${id} (${title}) gọi Gemini [${geminiModel}] qua [${GeminiRotator.getKeyLabel(geminiKey)}]...`);
        generatedText = await LlmProviderService.callGeminiWithKey(geminiKey, replicaPrompt, geminiModel);
      } else {
        const openRouterKeys = OpenRouterRotator.getKeys();
        if (openRouterKeys.length > 0) {
          try {
            logger.info(`[IChingDeepPipeline - Phân tích] Chương ${id} (${title}) routing to OpenRouter [${model}]...`);
            generatedText = await LlmProviderService.callOpenRouterEndpoint({
              model: model || process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
              prompt: replicaPrompt
            });
          } catch (orErr) {
            logger.warn(`[IChingDeepPipeline - Phân tích] OpenRouter Chương ${id} error: ${orErr.message}. Falling back to Gemini...`);
          }
        }
        if (!generatedText) {
          const fallbackGeminiModel = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
          const fallbackKey = GeminiRotator.getFallbackKey();
          logger.info(`[IChingDeepPipeline - Fallback] Xoay tua sang [${GeminiRotator.getKeyLabel(fallbackKey)}] cho Chương ${id}...`);
          generatedText = await LlmProviderService.callGeminiWithKey(fallbackKey, replicaPrompt, fallbackGeminiModel);
        }
      }
    } catch (err) {
      logger.warn(`[IChingDeepPipeline - Phân tích] Chương ${id} fallback error: ${err.message}. Using default Gemini...`);
      const fallbackKey = GeminiRotator.getFallbackKey();
      generatedText = await AiService.generateInterpretation(replicaPrompt, { 
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        apiKey: fallbackKey
      });
    }

    return SseStreamHelper.sanitizeMetaIntro(generatedText);
  }

  static async runVipPipelineStream(prompt, birthYear, options = {}) {
    return this.runIChingVipPipelineStream(prompt, options);
  }

  static async runIChingVipPipelineStream(prompt, options = {}) {
    const { onProgress } = options;
    const CHAPTERS = ICHING_VIP_CONFIG.CHAPTERS;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // --- TỔNG QUAN: Phân Tích Cốt Cách Quẻ Dịch (DUAL COT) ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'cot_started',
            message: 'Đang khảo cứu cốt cách quái tượng, Thế - Ứng & Hào Động...'
          });

          const cotGeminiPrompt = `Bạn là Bậc thầy Dịch học cổ truyền. Hãy phân tích ngắn gọn, sắc bén tượng quẻ sau:\n${prompt}\n\n` +
            `YÊU CẦU ĐÚC KẾT TƯỢNG PHÁP (150-250 từ):\n` +
            `1. Ý nghĩa cốt lõi của Quẻ Chính (Thể) và xu hướng phát triển sang Quẻ Biến (Dụng).\n` +
            `2. Ý nghĩa quái tượng thiên nhiên và Thoán Từ then chốt đối với câu hỏi của đương số.`;

          const cotOrPrompt = `Bạn là Đại sư Lục Hào Dự Trắc. Hãy biện chứng Lục Hào & Khí pháp:\n${prompt}\n\n` +
            `YÊU CẦU ĐÚC KẾT KHÍ PHÁP (150-250 từ):\n` +
            `1. Tương quan Hào Thế (Bản thân) vs Hào Ứng (Đối tác/Môi trường) và Hào Động mấu chốt.\n` +
            `2. Độ vượng tướng hưu tù của Dụng Thần theo ngày tháng gieo quẻ.`;

          const cotGeminiPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            cotGeminiPrompt
          ).catch((e) => {
            logger.warn('[IChingDeepPipeline - CoT Gemini] Error:', e.message);
            return 'Tượng quẻ và Thoán Từ đã được ghi nhận trong quái tượng nguyên bản.';
          });

          const openRouterKeys = OpenRouterRotator.getKeys();
          const cotOrPromise = (openRouterKeys.length > 0
            ? LlmProviderService.callOpenRouterEndpoint({
                model: process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3.5-lightning:free',
                prompt: cotOrPrompt,
                timeoutMs: 35000
              })
            : LlmProviderService.callGeminiWithKey(
                GeminiRotator.getFallbackKey(),
                cotOrPrompt
              )
          ).catch((e) => {
            const fallbackKey = GeminiRotator.getFallbackKey();
            logger.warn(`[IChingDeepPipeline - CoT OpenRouter] Error, falling back to Gemini [${GeminiRotator.getKeyLabel(fallbackKey)}]:`, e.message);
            return LlmProviderService.callGeminiWithKey(
              fallbackKey,
              cotOrPrompt
            ).catch(() => 'Lục Hào Dụng Thần và hào động đã được xác lập.');
          });

          const [cotGemini, cotOr] = await Promise.all([cotGeminiPromise, cotOrPromise]);

          const fullContext = `${prompt}\n\n[BẢN PHÂN TÍCH BIỆN CHỨNG DỊCH LÝ NỀN TẢNG (DUAL COT)]:\n` +
            `[BẢN 1 - TƯỢNG PHÁP & THỜI THẾ (GEMINI)]:\n${cotGemini}\n\n` +
            `[BẢN 2 - KHÍ PHÁP & LỤC HÀO DỤNG THẦN (OPENROUTER)]:\n${cotOr}`;

          // --- PHÂN TÍCH SONG SONG 6 CHƯƠNG ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'replicas_started',
            message: 'Đang tiến hành luận giải chuyên sâu 6 chương Dịch lý...'
          });

          const chapterPromises = CHAPTERS.map((ch, idx) => {
            const delay = idx * 250;
            return new Promise(resolve => setTimeout(resolve, delay)).then(async () => {
              SseStreamHelper.dispatchProgress(onProgress, {
                chapterId: ch.id,
                status: 'in_progress',
                title: ch.title,
                message: `Đang luận giải Chương ${ch.id}: ${ch.title}...`
              });
              const text = await IChingDeepPipeline.executeReplica(ch, fullContext, options);
              SseStreamHelper.dispatchProgress(onProgress, {
                chapterId: ch.id,
                status: 'completed',
                title: ch.title,
                message: `Đã hoàn tất Chương ${ch.id}: ${ch.title}`
              });
              return { id: ch.id, title: ch.title, text };
            });
          });

          const chapterResults = await Promise.all(chapterPromises);

          // --- TỔNG HỢP MA TRẬN QUÁI TƯỢNG & KIM CHỈ NAM ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'chief_editor',
            message: 'Đang tổng hợp ma trận quái tượng & kim chỉ nam Đạo Dịch...'
          });

          const editorPrompt = `Bạn là Bậc Thầy Dịch Lý Cổ Học Phương Đông. Đọc toàn bộ 6 chương luận giải Kinh Dịch sau đây để viết phần Tổng Quan Định Vị và Đúc Kết Chỉ Nam trực tiếp cho đương số:\n\n` +
            chapterResults.map(s => `=== CHƯƠNG ${s.id}: ${s.title} ===\n${s.text}`).join('\n\n') +
            `\n\nNHIỆM VỤ CỦA BẠN:\n` +
            `1. Viết phần DẪN NHẬP & MA TRẬN ĐỐI CHIẾU QUÁI TƯỢNG (SWOT DỊCH LÝ) đặt lên ĐẦU bài viết:\n` +
            `   - BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## TỔNG QUAN QUÁI TƯỢNG & ĐỊNH VỊ THỜI THẾ"\n` +
            `   - Khắc họa bức tranh toàn cảnh và định vị tình thế hiện tại của đương số đối với câu hỏi cốt lõi\n` +
            `   - Ma trận SWOT Dịch Lý (Bảng 3 cột: Chiều Kích | Yếu Tố Dịch Lý | Ý Nghĩa Thực Tế):\n` +
            `     + S (Thế mạnh & Nội lực Hào Thế)\n` +
            `     + W (Điểm yếu & Cạm bẫy tiềm ẩn)\n` +
            `     + O (Thời cơ hanh thông & Điểm đột phá)\n` +
            `     + T (Rủi ro hung sát & Đối tượng khắc phá)\n` +
            `2. Viết phần KẾT LUẬN & ĐẠO DỊCH CHỈ NAM đặt ở CUỐI bài viết:\n` +
            `   - BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## KẾT LUẬN & ĐẠO DỊCH CHỈ NAM"\n` +
            `   - ĐÚC KẾT CHIẾN LƯỢC: NGUYÊN TẮC HÀNH ĐỘNG TÙY THỜI BIẾN DỊCH\n` +
            `   - 3 ĐIỀU TỐI QUAN TRỌNG ĐỂ THÀNH CÔNG VÀ GIỮ GÌN PHÚC ĐỨC\n\n` +
            `‼️ BỘ QUY TẮC BẮT BUỘC:\n` +
            `- TUYỆT ĐỐI CẤM mọi lời chào hỏi, xưng danh hay kể lể quy trình biên tập (CẤM: "Chào bạn", "Với tư cách là...", "Tổng biên tập", "Tôi đã thẩm định...", "Theo yêu cầu của bạn", "Dưới đây là phần trình bày...", "Sau khi đọc 6 chương..."). Đi thẳng ngay vào tiêu đề Markdown!\n` +
            `- Xưng hô với đương số là "bạn", giọng văn uyên bác, trang trọng, đồng cảm sâu sắc.\n` +
            `- TUYỆT ĐỐI KHÔNG dùng từ "VIP", hãy luôn sử dụng từ "luận giải chuyên sâu" hoặc "bản luận giải chuyên sâu".\n\n` +
            `Phân tách rõ ràng 2 phần bằng thẻ: <!-- SPLIT_INTRO_OUTRO -->`;

          let introHeader = '';
          let outroFooter = '';
          try {
            const chiefKey = GeminiRotator.getFallbackKey();
            logger.info(`[IChingDeepPipeline] Chief Editor điều phối qua [${GeminiRotator.getKeyLabel(chiefKey)}]...`);
            const editorText = await AiService.generateInterpretation(editorPrompt, { 
              model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
              apiKey: chiefKey
            });
            if (editorText.includes('<!-- SPLIT_INTRO_OUTRO -->')) {
              const parts = editorText.split('<!-- SPLIT_INTRO_OUTRO -->');
              introHeader = SseStreamHelper.sanitizeMetaIntro(parts[0]);
              outroFooter = parts[1].trim();
            } else {
              outroFooter = editorText.trim();
            }
          } catch (edErr) {
            logger.warn('[IChingDeepPipeline] Chief Editor error:', edErr.message);
          }

          // --- PHÁT DÒNG KẾT QUẢ SSE MƯỢT MÀ ---
          if (introHeader) {
            await SseStreamHelper.streamTextChunks(controller, encoder, introHeader, { chunkSize: 120, delayMs: 15 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          for (const s of chapterResults) {
            SseStreamHelper.dispatchProgress(onProgress, {
              stage: 'streaming',
              streamingChapterId: s.id,
              message: `Đang xuất nội dung: Chương ${s.id} - ${s.title}...`
            });
            await SseStreamHelper.streamTextChunks(controller, encoder, s.text, { chunkSize: 120, delayMs: 15 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          if (outroFooter) {
            await SseStreamHelper.streamTextChunks(controller, encoder, outroFooter, { chunkSize: 120, delayMs: 15 });
          }

          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'completed',
            isCompleted: true,
            message: 'Hoàn tất toàn bộ luận giải chuyên sâu Kinh Dịch Lục Hào!'
          });
          logger.info('[IChingDeepPipeline] Luồng stream Kinh Dịch hoàn thành trọn vẹn 100%.');

        } catch (err) {
          logger.error('[IChingDeepPipeline] Stream error:', err);
          controller.enqueue(encoder.encode(`\n\n[Lỗi tạo bài Kinh Dịch Chuyên Sâu: ${err.message}]`));
        } finally {
          controller.close();
        }
      }
    });

    return { stream };
  }
}

module.exports = {
  BaziDeepPipeline,
  ZiweiDeepPipeline,
  MarriageDeepPipeline,
  IChingDeepPipeline
};
