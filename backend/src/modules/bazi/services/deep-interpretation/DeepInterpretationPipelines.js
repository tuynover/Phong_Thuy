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
    const { id, title, model, subtopics } = replica;
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
      `16. QUY TẮC BÌNH DÂN HÓA XUYÊN SUỐT (BẮT ĐẦU NGAY TỪ DÒNG ĐẦU TIÊN & TRONG TỪNG ĐOẠN VĂN):\n` +
      `    - BẮT BUỘC viết cho người HOÀN TOÀN KHÔNG BIẾT GÌ VỀ BÁT TỰ, không biết Can Chi, Thập Thần hay Ngũ Hành là gì.\n` +
      `    - TUYỆT ĐỐI KHÔNG viết theo kiểu lý thuyết hàn lâm khô cứng rồi mới tóm tắt máy móc ở cuối! Thay vào đó, BẮT BUỘC phải bình dân hóa NGAY TỪ DÒNG ĐẦU TIÊN và XUYÊN SUỐT TOÀN BỘ BÀI VIẾT.\n` +
      `    - Mỗi khi đề cập đến một thuật ngữ học thuật (Nhật Chủ, Dụng Thần, Thập Thần, Can Chi, Mộ Khố, Thần Sát, Tương Xung...), BẮT BUỘC phải lồng ghép ngay lời giải thích bằng ngôn ngữ đời thường, gần gũi, kèm hình tượng ẩn dụ sinh động (như ngọn lửa trong đêm, dòng nước lớn, cỗ xe leo dốc, mảnh đất màu mỡ, con thuyền xuôi gió...).\n` +
      `    - Mọi phân tích phải liên hệ trực diện với cuộc sống thực tế: Bạn có điểm mạnh gì? Tâm lý ra sao? Tài chính, sự nghiệp, tình cảm bị ảnh hưởng thế nào? Cụ thể cần làm gì và tránh làm gì để chuyển hung thành cát?\n` +
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.toUpperCase()}`;

    try {
      const geminiKey = GeminiRotator.getNextKey();
      const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
      logger.info(`[BaziDeepPipeline - Tầng 2] Replica ${id} (${title}) gọi Google Gemini SDK [${geminiModel}] qua [${GeminiRotator.getKeyLabel(geminiKey)}]...`);
      return await LlmProviderService.callGeminiWithKey(geminiKey, replicaPrompt, geminiModel);
    } catch (err) {
      logger.warn(`[BaziDeepPipeline - Tầng 2] Replica ${id} error: ${err.message}. Xoay tua sang Gemini fallback key...`);
      const fallbackKey = GeminiRotator.getFallbackKey();
      return await LlmProviderService.callGeminiWithKey(fallbackKey, replicaPrompt, process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite');
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
          // TẦNG 1: DUAL PRE-ANALYSIS SONG SONG (2 LUỒNG GEMINI SDK XOAY TUA KEY)
          // =========================================================================
          logger.info('[BaziDeepPipeline - TẦNG 1] Bắt đầu 2 luồng Gemini SDK Pre-Analysis chạy SONG SONG...');
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

          const cotPrompt = `[BẢN PHÂN TÍCH 2 - BIỆN CHỨNG TỬ BÌNH CỔ HỌC & CHAIN-OF-THOUGHT TỪ GEMINI]:\n` +
            `Dựa trên dữ liệu lá số Bát Tự:\n${prompt}\n` +
            `Căn cứ kinh điển Tử Bình Chân Thuyên và Tích Thiên Tủy, hãy suy luận Chain-of-Thought (CoT) chuyên sâu về:\n` +
            `1. Mệnh cách và tương tác sinh khắc chế hóa cốt lõi (tuân thủ đúng ngũ hành theo hệ thống Thập Thần của Nhật Chủ).\n` +
            `2. Ma trận Thần Sát tĩnh nguyên cục: CHỈ LUẬN các sao có mặt thực tế trong danh sách, TUYỆT ĐỐI KHÔNG liệt kê các sao vắng mặt để ghi "không xuất hiện".\n` +
            `3. Tương tác Địa Chi: Tuân thủ quy tắc Lục Xung & Tam Hình chuẩn xác (Dần chỉ xung Thân, Thìn chỉ xung Tuất; Dần không xung Thìn/Tuất; Tuất xung Thìn chứ không hình Thìn).\n` +
            `4. Định vị các điểm gãy vận hạn (Thiên Khắc Địa Xung, Hình Hại), các chu kỳ biến cố và thời cơ bứt phá hoàng kim trong cuộc đời đương số.\n` +
            `5. ĐỊNH HƯỚNG TRỤC THỜI GIAN ĐỒNG BỘ: Chỉ rõ mốc năm/đại vận ĐẠI CÁT bứt phá và mốc năm/đại vận THẬN TRỌNG để 6 chuyên đề sau đối chiếu đồng bộ.\n` +
            `LƯU Ý XƯNG HÔ & VĂN PHONG: BẮT BUỘC xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG xưng "ngươi". TUYỆT ĐỐI KHÔNG dùng các cụm từ lộ prompt kỹ thuật như "theo bảng khóa cứng"...`;

          const cotPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            cotPrompt
          ).catch(err => {
            const fallbackKey = GeminiRotator.getFallbackKey();
            logger.warn(`[BaziDeepPipeline - Tầng 1] Gemini CoT error: ${err.message}. Retrying with [${GeminiRotator.getKeyLabel(fallbackKey)}]...`);
            return LlmProviderService.callGeminiWithKey(
              fallbackKey,
              cotPrompt
            ).catch(() => 'Dữ liệu Tử Bình CoT đã được xác lập trong phân tích số học nguyên bản.');
          });

          const [geminiAnalysis, cotAnalysis] = await Promise.all([geminiPromise, cotPromise]);

          const combinedPreAnalysis = `\n=== BẢN PHÂN TÍCH HỌC THUẬT NỀN TẢNG TẦNG 1 (DUAL PRE-ANALYSIS) ===\n` +
            `[BẢN 1 - GEMINI NGŨ HÀNH & DỤNG THẦN]:\n${geminiAnalysis}\n\n` +
            `[BẢN 2 - GEMINI TỬ BÌNH CHAIN-OF-THOUGHT]:\n${cotAnalysis}\n` +
            `===================================================================\n`;

          const fullContext = `${prompt}\n${combinedPreAnalysis}`;

          // =========================================================================
          // TẦNG 2: KHỞI CHẠY SONG SONG 6 REPLICAS & INTRO SWOT (PROGRESSIVE STREAMING)
          // =========================================================================
          logger.info('[BaziDeepPipeline - TẦNG 2] Khởi chạy song song 6 Replicas và Intro SWOT...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage2', step: 'replicas_start', message: 'Đang tiến hành luận giải chuyên sâu các chương...' });

          // Khởi chạy Intro SWOT ngay trên nền Tầng 1 Pre-Analysis
          const introPrompt = `Bạn là Bậc Thầy Mệnh Lý Đông Phương uyên bác.
Dựa trên dữ liệu lá số Bát Tự và bản phân tích học thuật nền tảng:
${combinedPreAnalysis}

NHIỆM VỤ CỦA BẠN: SOẠN THẢO PHẦN MỞ ĐẦU (Định vị bản thể & Ma trận SWOT thực chiến):
BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## ĐỊNH VỊ BẢN MỆNH: BẢN ĐỒ CHIẾN LƯỢC NHÂN SINH & MA TRẬN SWOT"
Bao gồm 2 mục con rõ ràng:
### 1. Bản Thể & Chân Dung Cốt Cách Nhật Chủ (khoảng 250 - 300 từ): Khắc họa thần thái cốt cách, năng lượng ngũ hành chủ đạo, điểm đắc lực và sứ mệnh gốc rễ của Nhật Chủ. Dùng ngôn ngữ đời thường, giàu hình ảnh ẩn dụ (ngọn đuốc, dòng nước, đất đai, cỗ xe...), bình dân hóa cho người không biết gì về Bát Tự.
### 2. Ma Trận Định Vị Bản Mệnh SWOT:
BẮT BUỘC thiết lập 1 BẢNG MARKDOWN chuẩn xác gồm 3 cột:
| Chiều Phân Tích | Yếu Tố Mệnh Lý Biện Chứng | Ý Nghĩa Thực Tế & Lời Khuyên Hành Động |
- Hàng 1: **S - Strengths (Thế Mạnh Cốt Lõi)**: Năng lực vượt trội, quý nhân, điểm tựa tinh thần.
- Hàng 2: **W - Weaknesses (Tử Huyệt Cần Khắc Phục)**: Điểm yếu, cạm bẫy tâm lý, thói quen bất lợi.
- Hàng 3: **O - Opportunities (Thời Cơ Thiên Thời)**: Mốc đại vận, năm bứt phá hoàng kim.
- Hàng 4: **T - Threats (Cạm Bẫy Cần Đề Phòng)**: Giai đoạn biến động, xung khắc cần phòng thủ.

‼️ BỘ QUY TẮC BẮT BUỘC:
- Đi thẳng vào tiêu đề Markdown, TUYỆT ĐỐI CẤM mọi lời chào hỏi hay xưng danh rác.
- Xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG dùng từ "VIP".`;

          const introPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            introPrompt
          ).catch(err => {
            logger.warn(`[BaziDeepPipeline] Intro SWOT warning: ${err.message}`);
            return '## ĐỊNH VỊ BẢN MỆNH: BẢN ĐỒ CHIẾN LƯỢC NHÂN SINH & MA TRẬN SWOT\n\nBản mệnh đã được định vị qua tương quan ngũ hành và đại vận.';
          });

          // Khởi chạy 6 Replicas song song
          const replicaPromises = REPLICAS.map((rep, idx) => {
            const delay = idx * 200;
            return new Promise(resolve => setTimeout(resolve, delay)).then(async () => {
              SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage2', chapterId: rep.id, status: 'in_progress', title: rep.title, message: `Đang luận giải: Chương ${rep.id} - ${rep.title}...` });
              const output = await BaziDeepPipeline.executeReplica(rep, fullContext);
              SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage2', chapterId: rep.id, status: 'completed', title: rep.title, message: `Đã hoàn tất: Chương ${rep.id} - ${rep.title}` });
              return output;
            });
          });

          // =========================================================================
          // TIẾN TRÌNH PHÁT DÒNG TỨC THÌ (PROGRESSIVE REPLICA STREAMING)
          // =========================================================================
          // 1. Stream Intro SWOT ngay khi hoàn tất (TTFT đạt cực sớm sau ~15-18s!)
          const rawIntro = await introPromise;
          const introHeader = SseStreamHelper.sanitizeMetaIntro(rawIntro);
          if (introHeader) {
            SseStreamHelper.dispatchProgress(onProgress, { stage: 'streaming', step: 'intro', message: 'Đang trình bày: Bản đồ chiến lược nhân sinh & Ma trận SWOT...' });
            await SseStreamHelper.streamTextChunks(controller, encoder, introHeader, { chunkSize: 120, delayMs: 12 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 2. Stream tuần tự từng Chương ngay khi hoàn thành
          const chaptersOutput = [];
          for (let i = 0; i < REPLICAS.length; i++) {
            const rep = REPLICAS[i];
            SseStreamHelper.dispatchProgress(onProgress, { stage: 'streaming', streamingChapterId: rep.id, title: rep.title, message: `Đang xuất nội dung: Chương ${rep.id} - ${rep.title}...` });
            const rawChapter = await replicaPromises[i];
            const chapterText = SseStreamHelper.cleanMarkdown(rawChapter || '');
            chaptersOutput.push(chapterText);
            await SseStreamHelper.streamTextChunks(controller, encoder, chapterText, { chunkSize: 120, delayMs: 12 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // =========================================================================
          // TẦNG 3: GEMINI TỔNG BIÊN TẬP (OUTRO STRATEGY & ROADMAP)
          // =========================================================================
          logger.info('[BaziDeepPipeline - TẦNG 3] Soạn thảo Chiến lược Điều hòa & Master Roadmap...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage3', step: 'outro', message: 'Đang đúc kết chiến lược điều hòa đa mục tiêu & lộ trình hành động...' });

          const outroPrompt = `Bạn là Bậc Thầy Mệnh Lý Đông Phương uyên bác.
Dựa trên toàn bộ bản phân tích 6 chương chuyên sâu:
${chaptersOutput.map((c, idx) => `[CHƯƠNG ${idx + 1}]:\n${c.slice(0, 1000)}...`).join('\n\n')}

NHIỆM VỤ CỦA BẠN: SOẠN THẢO PHẦN KẾT THÚC (Chiến lược điều hòa đa mục tiêu & Đúc kết nhân sinh):
BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## CHIẾN LƯỢC ĐIỀU HÒA ĐA MỤC TIÊU & HÓA GIẢI XUNG KHẮC BẢN MỆNH"
### 1. Cân Bằng Giữa Dòng Tiền & Tạng Phủ (Tài Chính vs Sức Khỏe)
### 2. Cân Bằng Giữa Danh Vọng & Hạnh Phúc Gia Đạo (Sự Nghiệp vs Hôn Nhân)
### 3. Bảng Lộ Trình Đồng Bộ Hành Động Theo Chu Kỳ (Master Action Roadmap)
Lập BẢNG MARKDOWN 4 cột:
| Giai Đoạn Vận Hạn | Mục Tiêu Trọng Tâm Ưu Tiên | Thách Thức Cần Phòng Thủ | Lời Khuyên Hành Động Thực Chiến |

Tiếp theo là mục:
## ĐÚC KẾT NHÂN SINH & LỜI KHUYÊN HÀNH ĐẠO (khoảng 250 - 350 từ).

‼️ BỘ QUY TẮC BẮT BUỘC:
- Đi thẳng ngay vào tiêu đề Markdown, TUYỆT ĐỐI CẤM chào hỏi hay xưng danh rác.
- Xưng hô "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG dùng từ "VIP".`;

          const chiefKey = GeminiRotator.getFallbackKey();
          const rawOutro = await LlmProviderService.callGeminiWithKey(chiefKey, outroPrompt).catch(err => {
            logger.warn(`[BaziDeepPipeline - Tầng 3] Outro warning: ${err.message}`);
            return '## CHIẾN LƯỢC ĐIỀU HÒA ĐA MỤC TIÊU & HÓA GIẢI XUNG KHẮC BẢN MỆNH\n\nChúc bạn luôn giữ vững tâm định và gặt hái thành công.';
          });

          const outroFooter = SseStreamHelper.cleanMarkdown(rawOutro || '');
          if (outroFooter) {
            await SseStreamHelper.streamTextChunks(controller, encoder, outroFooter, { chunkSize: 120, delayMs: 12 });
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
      `10. QUY TẮC BÌNH DÂN HÓA XUYÊN SUỐT (BẮT ĐẦU NGAY TỪ DÒNG ĐẦU TIÊN & TRONG TỪNG ĐOẠN VĂN):\n` +
      `    - BẮT BUỘC viết cho người HOÀN TOÀN KHÔNG BIẾT GÌ VỀ TỬ VI, không biết cung chức, chính tinh, sát tinh hay tứ hóa là gì.\n` +
      `    - TUYỆT ĐỐI KHÔNG viết theo kiểu lý thuyết hàn lâm khô cứng rồi mới tóm tắt máy móc ở cuối! Thay vào đó, BẮT BUỘC phải bình dân hóa NGAY TỪ DÒNG ĐẦU TIÊN và XUYÊN SUỐT TOÀN BỘ BÀI VIẾT.\n` +
      `    - Mỗi khi đề cập đến một thuật ngữ học thuật (Chính Tinh, Sát Tinh, Tứ Hóa, Đắc Hãm, Cung Vị, Triệt, Tuần...), BẮT BUỘC phải lồng ghép ngay lời giải thích bằng ngôn ngữ đời thường, gần gũi, kèm hình tượng ẩn dụ sinh động (cỗ xe leo dốc, dòng nước chảy, người cầm lái, mảnh đất màu mỡ, ngọn đèn soi đường...).\n` +
      `    - Mọi phân tích phải liên hệ trực diện với cuộc sống thực tế: Bạn có điểm mạnh gì? Tâm lý ra sao? Tiền tài, sự nghiệp, gia đạo bị ảnh hưởng thế nào? Cụ thể cần làm gì và tránh làm gì để chuyển hung thành cát?\n` +
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.replace(/^Cụm\s*/i, '').toUpperCase()}`;

    try {
      const geminiKey = GeminiRotator.getNextKey();
      const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
      logger.info(`[ZiweiDeepPipeline - Tầng 2] Cluster ${id} (${title}) gọi Gemini [${geminiModel}] qua [${GeminiRotator.getKeyLabel(geminiKey)}]...`);
      return await LlmProviderService.callGeminiWithKey(geminiKey, clusterPrompt, geminiModel);
    } catch (err) {
      logger.warn(`[ZiweiDeepPipeline - Tầng 2] Cluster ${id} fallback error: ${err.message}`);
      const fallbackKey = GeminiRotator.getFallbackKey();
      return await LlmProviderService.callGeminiWithKey(fallbackKey, clusterPrompt, process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite');
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
          // TẦNG 1 & TẦNG 2: DUAL CHAIN-OF-THOUGHT (2 LUỒNG GEMINI SDK XOAY TUA KEY)
          // =========================================================================
          logger.info('[ZiweiDeepPipeline - TẦNG 1 & 2] Bắt đầu suy luận CoT Cốt Cách & Tứ Hóa Phi Tinh qua Gemini SDK...');
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

          const cot2Promise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            tuHoaCotPrompt
          ).catch((e) => {
            const fallbackKey = GeminiRotator.getFallbackKey();
            logger.warn(`[ZiweiDeepPipeline - CoT 2] Gemini error, retrying with [${GeminiRotator.getKeyLabel(fallbackKey)}]:`, e.message);
            return LlmProviderService.callGeminiWithKey(
              fallbackKey,
              tuHoaCotPrompt
            ).catch(() => 'Dòng chảy Tứ Hóa Phi Tinh đã được tổng hợp trong tinh đồ.');
          });

          const [cot1, cot2] = await Promise.all([cot1Promise, cot2Promise]);

          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage2', step: 'cot_tuhoa', message: 'Đang truy vết dòng chảy Tứ Hóa Phi Tinh & biến động cung vị...' });

          const combinedCot = `\n=== BẢN SUY LUẬN HỌC THUẬT NỀN TẢNG (TẦNG 1 & 2 DUAL COT) ===\n` +
            `[COT 1 - CỐT CÁCH MỆNH THÂN & CỤC (GEMINI)]:\n${cot1}\n\n` +
            `[COT 2 - TỨ HÓA PHI TINH & CỘNG HƯỞNG CUNG VỊ (GEMINI)]:\n${cot2}\n` +
            `=======================================================\n`;

          const fullContext = `${prompt}\n${combinedCot}`;

          // =========================================================================
          // TẦNG 3: KHỞI CHẠY SONG SONG 5 CỤM CUNG & INTRO SWOT (PROGRESSIVE STREAMING)
          // =========================================================================
          logger.info('[ZiweiDeepPipeline - TẦNG 3] Khởi chạy song song 5 Cụm Cung và Intro SWOT...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage3', step: 'clusters_start', message: 'Đang tiến hành luận giải chuyên sâu 5 chương tinh đồ...' });

          const introPrompt = `Bạn là Bậc Thầy Tử Vi Đẩu Số uyên bác.
Dựa trên dữ liệu lá số Tử Vi và bản suy luận cốt cách nền tảng:
${combinedCot}

NHIỆM VỤ CỦA BẠN: SOẠN THẢO PHẦN MỞ ĐẦU (Định vị bản thể & Ma trận SWOT Mệnh Bàn):
BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## ĐỊNH VỊ BẢN MỆNH: MA TRẬN MỆNH BÀN SWOT & TỔNG QUAN TINH ĐỒ"
### 1. Thần Thái & Chân Dung Cốt Cách Tinh Đẩu (khoảng 250 - 300 từ): Khắc họa khí chất, điểm mạnh cốt tử và bản lĩnh nội tại bằng ngôn ngữ đời thường, hình tượng sinh động.
### 2. Ma Trận Mệnh Bàn SWOT 4 Chiều:
BẮT BUỘC lập BẢNG MARKDOWN chuẩn xác gồm 3 cột:
| Chiều Phân Tích | Tinh Đẩu & Cung Vị Biện Chứng | Ý Nghĩa Thực Tế & Lời Khuyên Hành Động |
- **S - Strengths**: Cát tinh đắc địa, Hóa Lộc, Hóa Quyền, thế tam hợp đắc lực.
- **W - Weaknesses**: Hung sát tinh hãm địa, cung Vô Chính Diệu, tử huyệt tâm lý.
- **O - Opportunities**: Thời vận hanh thông, Hóa Khoa, Quý Nhân trợ mệnh.
- **T - Threats**: Hóa Kỵ xung phá, cạm bẫy Không Kiếp, Kình Đà và các đại hạn hiểm ác.

‼️ BỘ QUY TẮC BẮT BUỘC:
- Đi thẳng ngay vào tiêu đề Markdown, TUYỆT ĐỐI CẤM chào hỏi hay xưng danh rác.
- Xưng hô "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG dùng từ "VIP".`;

          const introPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            introPrompt
          ).catch(err => {
            logger.warn(`[ZiweiDeepPipeline] Intro SWOT warning: ${err.message}`);
            return '## ĐỊNH VỊ BẢN MỆNH: MA TRẬN MỆNH BÀN SWOT & TỔNG QUAN TINH ĐỒ\n\nBản mệnh đã được định vị qua cốt cách Mệnh Thân và Tứ Hóa.';
          });

          // Khởi chạy 5 Clusters song song
          const clusterPromises = REPLICAS.map((rep, idx) => {
            const delay = idx * 200;
            return new Promise(resolve => setTimeout(resolve, delay)).then(async () => {
              SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage3', chapterId: rep.id, status: 'in_progress', title: rep.title, message: `Đang luận giải: Chương ${rep.id} - ${rep.title}...` });
              const output = await ZiweiDeepPipeline.executeClusterReplica(rep, fullContext);
              SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage3', chapterId: rep.id, status: 'completed', title: rep.title, message: `Đã hoàn tất: Chương ${rep.id} - ${rep.title}` });
              return output;
            });
          });

          // =========================================================================
          // TIẾN TRÌNH PHÁT DÒNG TỨC THÌ (PROGRESSIVE REPLICA STREAMING)
          // =========================================================================
          // 1. Stream Intro SWOT ngay khi hoàn tất (TTFT đạt cực sớm sau ~15-18s!)
          const rawIntro = await introPromise;
          const introHeader = SseStreamHelper.sanitizeMetaIntro(rawIntro);
          if (introHeader) {
            SseStreamHelper.dispatchProgress(onProgress, { stage: 'streaming', step: 'intro', message: 'Đang trình bày: Bản đồ tinh đồ & Ma trận SWOT Mệnh Bàn...' });
            await SseStreamHelper.streamTextChunks(controller, encoder, introHeader, { chunkSize: 120, delayMs: 12 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 2. Stream tuần tự từng Cụm Cung ngay khi hoàn thành
          const clustersOutput = [];
          for (let i = 0; i < REPLICAS.length; i++) {
            const rep = REPLICAS[i];
            SseStreamHelper.dispatchProgress(onProgress, { stage: 'streaming', streamingChapterId: rep.id, title: rep.title, message: `Đang xuất nội dung: Chương ${rep.id} - ${rep.title}...` });
            const rawCluster = await clusterPromises[i];
            const clusterText = SseStreamHelper.cleanMarkdown(rawCluster || '');
            clustersOutput.push(clusterText);
            await SseStreamHelper.streamTextChunks(controller, encoder, clusterText, { chunkSize: 120, delayMs: 12 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // =========================================================================
          // TẦNG 4: GEMINI TỔNG BIÊN TẬP (OUTRO STRATEGY & ROADMAP)
          // =========================================================================
          logger.info('[ZiweiDeepPipeline - TẦNG 4] Soạn thảo Kế sách Phi Tinh & Master Lifepath Roadmap...');
          SseStreamHelper.dispatchProgress(onProgress, { stage: 'stage4', step: 'outro', message: 'Đang đúc kết kế sách điều hòa phi tinh & dự phóng đại vận 10 năm...' });

          const outroPrompt = `Bạn là Bậc Thầy Tử Vi Đẩu Số uyên bác.
Dựa trên toàn bộ 5 chương phân tích 12 cung tinh đồ:
${clustersOutput.map((c, idx) => `[CHƯƠNG ${idx + 1}]:\n${c.slice(0, 1000)}...`).join('\n\n')}

NHIỆM VỤ CỦA BẠN: SOẠN THẢO PHẦN KẾT THÚC (Chiến lược điều hòa & Kế sách hóa giải tinh đồ):
BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## CHIẾN LƯỢC ĐIỀU HÒA & ĐẠI HẠN 10 NĂM: KẾ SÁCH PHI TINH HÓA GIẢI"
### 1. Kế Sách Phi Tinh Điều Hòa Năng Lượng & Hóa Giải Hung Sát
(Cách hóa giải Hóa Kỵ, cách thuần hóa Không Kiếp, Kình Đà dựa trên hành vi và môi trường thực tế).
### 2. Bảng Dự Phóng Đại Vận 10 Năm (Master Lifepath Roadmap)
Lập BẢNG MARKDOWN 4 cột:
| Đại Hạn / Độ Tuổi | Cung Vị Đại Hạn | Cát Tinh & Hung Sát Chủ Quản | Chiến Lược Hành Động Tối Ưu |

Tiếp theo là mục:
## ĐÚC KẾT NHÂN SINH & LỜI KHUYÊN HÀNH ĐẠO (khoảng 250 - 350 từ).

‼️ BỘ QUY TẮC BẮT BUỘC:
- Đi thẳng ngay vào tiêu đề Markdown, TUYỆT ĐỐI CẤM chào hỏi hay xưng danh rác.
- Xưng hô "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG dùng từ "VIP".`;

          const chiefKey = GeminiRotator.getFallbackKey();
          const rawOutro = await LlmProviderService.callGeminiWithKey(chiefKey, outroPrompt).catch(err => {
            logger.warn(`[ZiweiDeepPipeline - Tầng 4] Outro warning: ${err.message}`);
            return '## CHIẾN LƯỢC ĐIỀU HÒA & ĐẠI HẠN 10 NĂM: KẾ SÁCH PHI TINH HÓA GIẢI\n\nChúc bạn luôn vững vàng tâm thế và chuyển hóa vận mệnh.';
          });

          const outroFooter = SseStreamHelper.cleanMarkdown(rawOutro || '');
          if (outroFooter) {
            await SseStreamHelper.streamTextChunks(controller, encoder, outroFooter, { chunkSize: 120, delayMs: 12 });
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
      `9. QUY TẮC BÌNH DÂN HÓA XUYÊN SUỐT (BẮT ĐẦU NGAY TỪ DÒNG ĐẦU TIÊN & TRONG TỪNG ĐOẠN VĂN):\n` +
      `    - BẮT BUỘC viết cho người HOÀN TOÀN KHÔNG BIẾT GÌ VỀ BÁT TỰ, HỢP HÔN hay CUNG PHI BÁT TRẠCH.\n` +
      `    - TUYỆT ĐỐI KHÔNG viết theo kiểu lý thuyết hàn lâm khô cứng rồi mới tóm tắt máy móc ở cuối! Thay vào đó, BẮT BUỘC phải bình dân hóa NGAY TỪ DÒNG ĐẦU TIÊN và XUYÊN SUỐT TOÀN BỘ BÀI VIẾT.\n` +
      `    - Mỗi khi đề cập đến một thuật ngữ học thuật (Cung Phi, Nạp Âm, Tương Xung, Tuyệt Mệnh, Dụng Thần, Hóa Giải...), BẮT BUỘC phải lồng ghép ngay lời giải thích bằng ngôn ngữ đời thường, gần gũi, kèm hình tượng ẩn dụ sinh động (như hai bánh xe cùng trục, dòng sông và con thuyền, chiếc kiềng ba chân, người giữ lửa tổ ấm...).\n` +
      `    - Mọi phân tích phải liên hệ trực diện với đời sống hôn nhân thường nhật: Hai bạn có điểm tựa gắn kết gì? Điểm nhạy cảm dễ cãi vã là gì? Tài chính, con cái ra sao? Cụ thể cần cư xử và làm gì để hòa hợp trăm năm?\n` +
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.toUpperCase()}`;

    try {
      const geminiKey = GeminiRotator.getNextKey();
      const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
      logger.info(`[MarriageDeepPipeline - Tầng 2] Trụ ${id} (${title}) gọi Gemini [${geminiModel}] qua [${GeminiRotator.getKeyLabel(geminiKey)}]...`);
      return await LlmProviderService.callGeminiWithKey(geminiKey, replicaPrompt, geminiModel);
    } catch (err) {
      logger.warn(`[MarriageDeepPipeline - Tầng 2] Chương ${id} fallback error: ${err.message}`);
      const fallbackKey = GeminiRotator.getFallbackKey();
      return await LlmProviderService.callGeminiWithKey(fallbackKey, replicaPrompt, process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite');
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
          // --- TỔNG QUAN: Phân Tích Cốt Lõi Tương Quan Bản Mệnh (2 LUỒNG GEMINI SDK XOAY TUA KEY) ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'cot_started',
            message: 'Đang khảo cứu tương quan Bát Tự & Cung Phi Bát Trạch qua Gemini SDK...'
          });

          const cotGeminiPrompt = `Bạn là Bậc thầy Mệnh lý Hợp Hôn. Hãy phân tích ngắn gọn, sắc bén tương quan bản mệnh:\n${prompt}\n\n` +
            `YÊU CẦU ĐÚC KẾT CỐT LÕI (150-250 từ):\n` +
            `1. Bản chất tương tác Nhật Chủ & Ngũ hành Nạp Âm của 2 người (Tương sinh, tương khắc hay tương trợ?).\n` +
            `2. Sự bổ khuyết ngũ hành: Ai có ngũ hành vượng để bổ trợ cho ngũ hành suy khuyết của người kia?`;

          const cotPhiTrachPrompt = `Bạn là Đại sư Phong thủy Bát Trạch & Hôn Phối. Hãy biện chứng phong thủy hợp hôn:\n${prompt}\n\n` +
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

          const cotPhiTrachPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            cotPhiTrachPrompt
          ).catch((e) => {
            const fallbackKey = GeminiRotator.getFallbackKey();
            logger.warn(`[MarriageDeepPipeline - CoT Phi Trạch] Error, retrying with [${GeminiRotator.getKeyLabel(fallbackKey)}]:`, e.message);
            return LlmProviderService.callGeminiWithKey(
              fallbackKey,
              cotPhiTrachPrompt
            ).catch(() => 'Tương quan Cung Phi và ngũ hành cầu nối đã được xác lập.');
          });

          const [cotGemini, cotPhiTrach] = await Promise.all([cotGeminiPromise, cotPhiTrachPromise]);

          const fullContext = `${prompt}\n\n[BẢN PHÂN TÍCH TƯƠNG QUAN NỀN TẢNG (DUAL COT GEMINI)]:\n` +
            `[BẢN 1 - KHẢO CỨU BẢN MỆNH & NGŨ HÀNH (GEMINI)]:\n${cotGemini}\n\n` +
            `[BẢN 2 - BIỆN CHỨNG CUNG PHI & CẦU NỐI (GEMINI)]:\n${cotPhiTrach}`;

          // --- KHỞI CHẠY SONG SONG 4 CHƯƠNG & INTRO SWOT (PROGRESSIVE STREAMING) ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'replicas_started',
            message: 'Đang tiến hành luận giải chuyên sâu 4 chương duyên phận gia đạo...'
          });

          const introPrompt = `Bạn là Bậc Thầy Phong Thủy & Hôn Nhân Gia Đạo uyên thâm.
Dựa trên phân tích tương quan bản mệnh hai người:
${fullContext}

NHIỆM VỤ CỦA BẠN: SOẠN THẢO PHẦN MỞ ĐẦU (Tổng quan hôn phối & Ma trận SWOT Hôn Nhân):
BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## TỔNG QUAN HÔN PHỐI & KHÍ TRƯỜNG NHÂN DUYÊN"
### 1. Điểm Số Hòa Hợp & Khí Trường Duyên Phận (khoảng 200 - 250 từ): Điểm số hòa hợp (thang điểm 100/100) và Tỷ lệ tương thích (%), phân tích bức tranh tổng thể bằng ngôn ngữ đời thường, giàu hình ảnh ẩn dụ (hai bánh xe, dòng sông và con thuyền...).
### 2. Ma Trận SWOT Hôn Nhân & Duyên Phận:
BẮT BUỘC lập BẢNG MARKDOWN 3 cột:
| Chiều Phân Tích | Yếu Tố Hợp Hôn Biện Chứng | Ý Nghĩa Thực Tế & Lời Khuyên Hành Động |
- **S - Strengths**: Điểm tựa gắn kết, tương sinh ngũ hành, sự thấu hiểu tự nhiên.
- **W - Weaknesses**: Điểm nhạy cảm dễ xung đột, thói quen trái ngược cần bao dung.
- **O - Opportunities**: Cơ hội tài lộc thịnh vượng khi hai người đồng lòng.
- **T - Threats**: Nguy cơ rủi ro ngoại cảnh, năm xung khắc cần đề phòng.

‼️ BỘ QUY TẮC BẮT BUỘC:
- Đi thẳng ngay vào tiêu đề Markdown, TUYỆT ĐỐI CẤM chào hỏi hay xưng danh rác.
- Xưng hô "hai bạn" hoặc "anh chị", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG dùng từ "VIP".`;

          const introPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            introPrompt
          ).catch(err => {
            logger.warn(`[MarriageDeepPipeline] Intro warning: ${err.message}`);
            return '## TỔNG QUAN HÔN PHỐI & KHÍ TRƯỜNG NHÂN DUYÊN\n\nKhí trường duyên phận của hai bạn đã được xác lập qua tương quan Bát Tự và Cung Phi.';
          });

          // Khởi chạy 4 Pillars song song
          const pillarPromises = PILLARS.map((pillar, idx) => {
            const delay = idx * 200;
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

          // =========================================================================
          // TIẾN TRÌNH PHÁT DÒNG TỨC THÌ (PROGRESSIVE REPLICA STREAMING)
          // =========================================================================
          // 1. Stream Intro SWOT ngay khi hoàn tất (TTFT đạt chỉ sau ~15-18s!)
          const rawIntro = await introPromise;
          const introHeader = SseStreamHelper.sanitizeMetaIntro(rawIntro);
          if (introHeader) {
            SseStreamHelper.dispatchProgress(onProgress, { stage: 'streaming', step: 'intro', message: 'Đang trình bày: Tổng quan hôn phối & Ma trận SWOT Duyên Phận...' });
            await SseStreamHelper.streamTextChunks(controller, encoder, introHeader, { chunkSize: 120, delayMs: 12 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 2. Stream tuần tự từng Trụ Cột Hôn Nhân ngay khi hoàn thành
          const pillarResults = [];
          for (let i = 0; i < PILLARS.length; i++) {
            const p = PILLARS[i];
            SseStreamHelper.dispatchProgress(onProgress, {
              stage: 'streaming',
              streamingChapterId: p.id,
              message: `Đang xuất Chương ${p.id}: ${p.title}...`
            });
            const rawPillar = await pillarPromises[i];
            const cleanText = SseStreamHelper.cleanMarkdown(rawPillar.text || '');
            pillarResults.push({ id: p.id, title: p.title, text: cleanText });
            await SseStreamHelper.streamTextChunks(controller, encoder, cleanText, { chunkSize: 120, delayMs: 12 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // =========================================================================
          // TẦNG 3: GEMINI TỔNG BIÊN TẬP (OUTRO PHÁC ĐỒ HÓA GIẢI)
          // =========================================================================
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'chief_editor',
            message: 'Đang tổng hợp phác đồ hòa giải hôn nhân & lời chúc phúc trăm năm...'
          });

          const editorPrompt = `Bạn là Bậc Thầy Phong Thủy & Hôn Nhân Gia Đạo uyên thâm.
Dựa trên 4 chương phân tích duyên phận hôn phối:
${pillarResults.map(p => `=== CHƯƠNG ${p.id}: ${p.title} ===\n${p.text.slice(0, 1000)}...`).join('\n\n')}

NHIỆM VỤ CỦA BẠN: SOẠN THẢO PHẦN KẾT LUẬN & PHÁC ĐỒ HÓA GIẢI:
BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## CHIẾN LƯỢC ĐIỀU HÒA & PHÁC ĐỒ HÓA GIẢI HÔN NHÂN"
### 1. 3 NGUYÊN TẮC VÀNG GÌN GIỮ HẠNH PHÚC GIA ĐẠO
### 2. PHÁC ĐỒ HÓA GIẢI TOÀN DIỆN & LỜI CHÚC PHÚC TRĂM NĂM (khoảng 250 - 350 từ).

‼️ BỘ QUY TẮC BẮT BUỘC:
- Đi thẳng ngay vào tiêu đề Markdown, TUYỆT ĐỐI CẤM chào hỏi hay xưng danh rác.
- Xưng hô "hai bạn" hoặc "anh chị", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG dùng từ "VIP".`;

          const chiefKey = GeminiRotator.getFallbackKey();
          const rawOutro = await LlmProviderService.callGeminiWithKey(chiefKey, editorPrompt).catch(err => {
            logger.warn(`[MarriageDeepPipeline] Outro warning: ${err.message}`);
            return '## CHIẾN LƯỢC ĐIỀU HÒA & PHÁC ĐỒ HÓA GIẢI HÔN NHÂN\n\nChúc hai bạn luôn hòa thuận, bao dung và hạnh phúc bền lâu.';
          });

          const outroFooter = SseStreamHelper.cleanMarkdown(rawOutro || '');
          if (outroFooter) {
            await SseStreamHelper.streamTextChunks(controller, encoder, outroFooter, { chunkSize: 120, delayMs: 12 });
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
      `9. TUYỆT ĐỐI CẤM MỌI LỜI CHÀO HỎI, XƯNG DANH: TUYỆT ĐỐI CẤM mọi câu chào hỏi, tự xưng danh (CẤM: 'Chào bạn', 'Với tư cách là...'). Bắt đầu trực tiếp bằng tiêu đề: ## CHƯƠNG ${id}: ${title.toUpperCase()} và đi thẳng vào nội dung học thuật.\n` +
      `10. QUY TẮC BÌNH DÂN HÓA XUYÊN SUỐT (BẮT ĐẦU NGAY TỪ DÒNG ĐẦU TIÊN & TRONG TỪNG ĐOẠN VĂN):\n` +
      `    - BẮT BUỘC viết cho người HOÀN TOÀN KHÔNG BIẾT GÌ VỀ KINH DỊCH, không biết Quái Tượng, Thoán Từ, Thế - Ứng, Hào Động hay Dụng Thần là gì.\n` +
      `    - TUYỆT ĐỐI KHÔNG viết theo kiểu lý thuyết cổ thư khô cứng rồi mới tóm tắt máy móc ở cuối! Thay vào đó, BẮT BUỘC phải bình dân hóa NGAY TỪ DÒNG ĐẦU TIÊN và XUYÊN SUỐT TOÀN BỘ BÀI VIẾT.\n` +
      `    - Mỗi khi đề cập đến một thuật ngữ Dịch lý (Thế - Ứng, Hào Động, Thoán Từ, Dụng Thần, Hóa Tiến/Thoái, Phục Thần, Ứng Kỳ...), BẮT BUỘC phải lồng ghép ngay lời giải thích bằng ngôn ngữ đời thường, gần gũi, kèm hình tượng ẩn dụ sinh động (như người leo dốc, con thuyền xuôi gió hay ngược dòng, chuẩn bị hạt giống trước mùa mưa giông...).\n` +
      `    - Mọi phân tích phải bám sát 100% câu hỏi cốt lõi của đương số và trả lời thực tế: Tình thế hiện tại ra sao? Thuận lợi hay cản trở? Thời điểm nào nên tiến, khi nào nên thủ? Cụ thể cần làm gì ngay lúc này để đắc thời đắc vị?\n` +
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.toUpperCase()}`;

    let generatedText = '';
    try {
      const geminiKey = GeminiRotator.getNextKey();
      const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
      logger.info(`[IChingDeepPipeline - Phân tích] Chương ${id} (${title}) gọi Gemini [${geminiModel}] qua [${GeminiRotator.getKeyLabel(geminiKey)}]...`);
      generatedText = await LlmProviderService.callGeminiWithKey(geminiKey, replicaPrompt, geminiModel);
    } catch (err) {
      logger.warn(`[IChingDeepPipeline - Phân tích] Chương ${id} fallback error: ${err.message}`);
      const fallbackKey = GeminiRotator.getFallbackKey();
      generatedText = await LlmProviderService.callGeminiWithKey(fallbackKey, replicaPrompt, process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite');
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
          // --- TỔNG QUAN: Phân Tích Cốt Cách Quẻ Dịch (2 LUỒNG GEMINI SDK XOAY TUA KEY) ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'cot_started',
            message: 'Đang khảo cứu cốt cách quái tượng, Thế - Ứng & Hào Động qua Gemini SDK...'
          });

          const cotGeminiPrompt = `Bạn là Bậc thầy Dịch học cổ truyền. Hãy phân tích ngắn gọn, sắc bén tượng quẻ sau:\n${prompt}\n\n` +
            `YÊU CẦU ĐÚC KẾT TƯỢNG PHÁP (150-250 từ):\n` +
            `1. Ý nghĩa cốt lõi của Quẻ Chính (Thể) và xu hướng phát triển sang Quẻ Biến (Dụng).\n` +
            `2. Ý nghĩa quái tượng thiên nhiên và Thoán Từ then chốt đối với câu hỏi của đương số.`;

          const cotLucHaoPrompt = `Bạn là Đại sư Lục Hào Dự Trắc. Hãy biện chứng Lục Hào & Khí pháp:\n${prompt}\n\n` +
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

          const cotLucHaoPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            cotLucHaoPrompt
          ).catch((e) => {
            const fallbackKey = GeminiRotator.getFallbackKey();
            logger.warn(`[IChingDeepPipeline - CoT Lục Hào] Error, retrying with [${GeminiRotator.getKeyLabel(fallbackKey)}]:`, e.message);
            return LlmProviderService.callGeminiWithKey(
              fallbackKey,
              cotLucHaoPrompt
            ).catch(() => 'Lục Hào Dụng Thần và hào động đã được xác lập.');
          });

          const [cotGemini, cotLucHao] = await Promise.all([cotGeminiPromise, cotLucHaoPromise]);

          const fullContext = `${prompt}\n\n[BẢN PHÂN TÍCH BIỆN CHỨNG DỊCH LÝ NỀN TẢNG (DUAL COT GEMINI)]:\n` +
            `[BẢN 1 - TƯỢNG PHÁP & THỜI THẾ (GEMINI)]:\n${cotGemini}\n\n` +
            `[BẢN 2 - KHÍ PHÁP & LỤC HÀO DỤNG THẦN (GEMINI)]:\n${cotLucHao}`;

          // --- KHỞI CHẠY SONG SONG 6 CHƯƠNG & INTRO SWOT (PROGRESSIVE STREAMING) ---
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'replicas_started',
            message: 'Đang tiến hành luận giải chuyên sâu 6 chương Dịch lý...'
          });

          const introPrompt = `Bạn là Bậc Thầy Dịch Lý Cổ Học Phương Đông.
Dựa trên phân tích quẻ Dịch và biện chứng nền tảng:
${fullContext}

NHIỆM VỤ CỦA BẠN: SOẠN THẢO PHẦN MỞ ĐẦU (Tổng quan định vị thời thế & Ma trận SWOT Dịch Lý):
BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## TỔNG QUAN QUÁI TƯỢNG & ĐỊNH VỊ THỜI THẾ"
### 1. Bức Tranh Toàn Cảnh & Khí Thế Quái Tượng (khoảng 200 - 250 từ): Khắc họa thời thế hiện tại của đương số đối với câu hỏi bằng ngôn ngữ đời thường, hình tượng sinh động.
### 2. Ma Trận Đối Chiếu Quái Tượng SWOT Dịch Lý:
BẮT BUỘC lập BẢNG MARKDOWN 3 cột:
| Chiều Kích | Yếu Tố Dịch Lý Biện Chứng | Ý Nghĩa Thực Tế & Lời Khuyên Hành Động |
- **S - Strengths**: Thế mạnh, nội lực Hào Thế, sự ủng hộ của thời thế.
- **W - Weaknesses**: Điểm yếu, lực cản nội tại, chỗ hổng cần khắc phục.
- **O - Opportunities**: Thời cơ thuận lợi từ Hào Động, điểm đột phá hanh thông.
- **T - Threats**: Rủi ro hung sát, hào thoái, đối tượng khắc phá cần đề phòng.

‼️ BỘ QUY TẮC BẮT BUỘC:
- Đi thẳng ngay vào tiêu đề Markdown, TUYỆT ĐỐI CẤM chào hỏi hay xưng danh rác.
- Xưng hô "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG dùng từ "VIP".`;

          const introPromise = LlmProviderService.callGeminiWithKey(
            GeminiRotator.getNextKey(),
            introPrompt
          ).catch(err => {
            logger.warn(`[IChingDeepPipeline] Intro warning: ${err.message}`);
            return '## TỔNG QUAN QUÁI TƯỢNG & ĐỊNH VỊ THỜI THẾ\n\nThời thế quái tượng đã được xác lập qua tương quan Thể - Dụng và Lục Hào.';
          });

          // Khởi chạy 6 Chapters song song
          const chapterPromises = CHAPTERS.map((ch, idx) => {
            const delay = idx * 200;
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

          // =========================================================================
          // TIẾN TRÌNH PHÁT DÒNG TỨC THÌ (PROGRESSIVE REPLICA STREAMING)
          // =========================================================================
          // 1. Stream Intro SWOT ngay khi hoàn tất (TTFT đạt chỉ sau ~15-18s!)
          const rawIntro = await introPromise;
          const introHeader = SseStreamHelper.sanitizeMetaIntro(rawIntro);
          if (introHeader) {
            SseStreamHelper.dispatchProgress(onProgress, { stage: 'streaming', step: 'intro', message: 'Đang trình bày: Tổng quan quái tượng & Ma trận SWOT Dịch Lý...' });
            await SseStreamHelper.streamTextChunks(controller, encoder, introHeader, { chunkSize: 120, delayMs: 12 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 2. Stream tuần tự từng Chương ngay khi hoàn thành
          const chapterResults = [];
          for (let i = 0; i < CHAPTERS.length; i++) {
            const s = CHAPTERS[i];
            SseStreamHelper.dispatchProgress(onProgress, {
              stage: 'streaming',
              streamingChapterId: s.id,
              message: `Đang xuất nội dung: Chương ${s.id} - ${s.title}...`
            });
            const rawChapter = await chapterPromises[i];
            const cleanText = SseStreamHelper.cleanMarkdown(rawChapter.text || '');
            chapterResults.push({ id: s.id, title: s.title, text: cleanText });
            await SseStreamHelper.streamTextChunks(controller, encoder, cleanText, { chunkSize: 120, delayMs: 12 });
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // =========================================================================
          // TẦNG 3: GEMINI TỔNG BIÊN TẬP (OUTRO ĐẠO DỊCH CHỈ NAM)
          // =========================================================================
          SseStreamHelper.dispatchProgress(onProgress, {
            stage: 'chief_editor',
            message: 'Đang tổng hợp Đạo Dịch chỉ nam & diệu kế hành động...'
          });

          const editorPrompt = `Bạn là Bậc Thầy Dịch Lý Cổ Học Phương Đông.
Dựa trên toàn bộ 6 chương luận giải Kinh Dịch sau đây:
${chapterResults.map(s => `=== CHƯƠNG ${s.id}: ${s.title} ===\n${s.text.slice(0, 1000)}...`).join('\n\n')}

NHIỆM VỤ CỦA BẠN: SOẠN THẢO PHẦN KẾT LUẬN & ĐẠO DỊCH CHỈ NAM:
BẮT ĐẦU CHÍNH XÁC BẰNG TIÊU ĐỀ: "## KẾT LUẬN & ĐẠO DỊCH CHỈ NAM"
### 1. ĐÚC KẾT CHIẾN LƯỢC: NGUYÊN TẮC HÀNH ĐỘNG TÙY THỜI BIẾN DỊCH
### 2. 3 ĐIỀU TỐI QUAN TRỌNG ĐỂ THÀNH CÔNG VÀ GIỮ GÌN PHÚC ĐỨC (khoảng 250 - 350 từ).

‼️ BỘ QUY TẮC BẮT BUỘC:
- Đi thẳng ngay vào tiêu đề Markdown, TUYỆT ĐỐI CẤM chào hỏi hay xưng danh rác.
- Xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG dùng từ "VIP".`;

          const chiefKey = GeminiRotator.getFallbackKey();
          const rawOutro = await LlmProviderService.callGeminiWithKey(chiefKey, editorPrompt).catch(err => {
            logger.warn(`[IChingDeepPipeline] Outro warning: ${err.message}`);
            return '## KẾT LUẬN & ĐẠO DỊCH CHỈ NAM\n\nChúc bạn luôn sáng suốt thuận theo Đạo Dịch và gặt hái đại cát.';
          });

          const outroFooter = SseStreamHelper.cleanMarkdown(rawOutro || '');
          if (outroFooter) {
            await SseStreamHelper.streamTextChunks(controller, encoder, outroFooter, { chunkSize: 120, delayMs: 12 });
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
