const { GoogleGenerativeAI } = require('@google/generative-ai');
const AiService = require('./AiService');
const logger = require('./LoggerService');

// Bộ quản lý xoay tua tài khoản OpenRouter (Round-Robin & Fallback)
class OpenRouterRotator {
  static currentIndex = 0;

  static getKeys() {
    const keys = [];
    if (process.env.OPENROUTER_API_KEYS) {
      keys.push(...process.env.OPENROUTER_API_KEYS.split(',').map(k => k.trim()).filter(Boolean));
    }
    if (process.env.OPENROUTER_API_KEY && !keys.includes(process.env.OPENROUTER_API_KEY.trim())) {
      keys.push(process.env.OPENROUTER_API_KEY.trim());
    }
    if (process.env.OPENROUTER_API_KEY_2 && !keys.includes(process.env.OPENROUTER_API_KEY_2.trim())) {
      keys.push(process.env.OPENROUTER_API_KEY_2.trim());
    }
    return keys;
  }

  static getNextKey() {
    const keys = this.getKeys();
    if (keys.length === 0) return null;
    const key = keys[this.currentIndex % keys.length];
    this.currentIndex = (this.currentIndex + 1) % keys.length;
    return key;
  }
}

class MultiAgentPipelineService {
  /**
   * Helper: Gọi OpenRouter API endpoint với cơ chế xoay tua 2+ key & tự động retry khi gặp Rate Limit (429)
   */
  static async callOpenRouterEndpoint({ model, systemPrompt, prompt, timeoutMs = 75000 }) {
    const keys = OpenRouterRotator.getKeys();
    if (keys.length === 0) {
      throw new Error('OPENROUTER_API_KEY is not configured.');
    }

    let lastError = null;
    const maxAttempts = Math.max(keys.length * 2, 3);

    // Thử lần lượt qua danh sách keys (xoay tua hoặc retry với backoff khi gặp Rate Limit / lỗi tạm thời)
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const apiKey = OpenRouterRotator.getNextKey();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const maskedKey = `${apiKey.slice(0, 10)}...${apiKey.slice(-4)}`;
        logger.info(`[OpenRouter] Requesting model [${model}] using key [${maskedKey}] (attempt ${attempt + 1}/${maxAttempts})...`);

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://tuynover.ddns.net',
            'X-Title': 'Phong Thuy AI - Co Hoc Phuong Dong'
          },
          body: JSON.stringify({
            model,
            messages: [
              ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 4096
          }),
          signal: controller.signal
        });

        clearTimeout(timeout);

        if (!res.ok) {
          const errText = await res.text();
          const errMessage = `OpenRouter Error ${res.status}: ${errText.slice(0, 250)}`;
          logger.warn(`[OpenRouter] Key [${maskedKey}] returned ${res.status}: ${errMessage}`);

          // Nếu dính Rate Limit (429) hoặc Lỗi tải server tạm thời (502, 503) -> Backoff và thử tiếp
          if (res.status === 429 || res.status === 502 || res.status === 503) {
            lastError = new Error(errMessage);
            const waitMs = 1500 * (attempt + 1);
            logger.info(`[OpenRouter] Rate limited (429/503). Waiting ${waitMs}ms before retry/rotation...`);
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }

          // Hết quota (402) hoặc Key sai (401)
          if ((res.status === 402 || res.status === 401) && keys.length > 1) {
            lastError = new Error(errMessage);
            continue;
          }

          throw new Error(errMessage);
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        if (!content) {
          throw new Error(`OpenRouter returned empty content for model ${model}`);
        }
        return content;
      } catch (err) {
        clearTimeout(timeout);
        lastError = err;
        logger.warn(`[OpenRouter] Attempt ${attempt + 1} failed: ${err.message}.`);
        if (attempt < maxAttempts - 1) {
          await new Promise(r => setTimeout(r, 1200));
        }
      }
    }

    throw lastError || new Error('All OpenRouter keys/attempts failed.');
  }

  /**
   * Helper: Gọi OpenAI-compatible endpoints (Grok, Groq, OpenRouter)
   */
  static async callOpenAiEndpoint({ url, apiKey, model, systemPrompt, prompt, timeoutMs = 60000 }) {
    if (!apiKey) {
      throw new Error(`API Key for ${model} is not configured.`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4096
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API Error ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  /**
   * Helper: Gọi Google Gemini với key chỉ định (Sử dụng 100% Google Gemini SDK chính thức với Google API Key)
   */
  static async callGeminiWithKey(apiKey, prompt, modelName = 'gemini-3.1-flash-lite', retries = 2) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is not set');
    const genAI = new GoogleGenerativeAI(key);
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: 4096, temperature: 0.7 }
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        if (attempt < retries && (err.message?.includes('503') || err.message?.includes('429'))) {
          logger.warn(`[Gemini SDK] Attempt ${attempt + 1} hit ${err.message}. Retrying in 1.5s...`);
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Khung Triết Lý & Chỉ Dẫn Học Thuật Chuyên Sâu theo từng Chương
   */
  static getChapterSpecificInstructions(chapterId) {
    const INSTRUCTIONS = {
      1: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 1 (SỰ NGHIỆP & CÔNG DANH):
- ĐỊNH HƯỚNG CỐT LÕI: Phân tích sâu sắc năng lực vượt trội và vị thế nghề nghiệp MŨI NHỌN trong kỷ nguyên số (AI, Dữ liệu, Quản trị rủi ro tài chính, Tư vấn chiến lược, Công nghệ cao). Tránh đưa ra các định hướng chung chung nước đôi kiểu "làm gì cũng được".
- RANH GIỚI ĐỊA BÀN (CHỐNG LẶP Ý):
  + CẤM lấn sân sang chuyện hôn nhân, gia đạo hay tiền bạc đầu tư (đã có chương riêng).
  + CẤM lặp lại điệp khúc "tính nóng nảy do Dần - Thân xung" (để dành việc này cho Chương 3).
- THẬP THẦN & QUY TẮC HIỆN HỮU:
  + Chỉ luận các Thập Thần CÓ MẶT THỰC TẾ trong nguyên cục (Thất Sát Giáp Mộc, Thực Thần Canh Kim, Thiên Ấn Bính Hỏa...).
  + TUYỆT ĐỐI CẤM viết "được sinh bởi Chính Ấn" nếu nguyên cục KHÔNG CÓ Đinh Hỏa (Chính Ấn). Chỉ được luận Thiên Ấn (Bính Hỏa).
- THẦN SÁT SỰ NGHIỆP: CHỈ LUẬN GIẢI các Thần Sát CÓ MẶT THỰC TẾ (như Văn Xương, Học Đường...). Sao nào không có thì BIẾN MẤT HOÀN TOÀN.`,

      2: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 2 (TÀI CHÍNH & DÒNG TIỀN):
- ĐI THẲNG TRỌNG TÂM THỰC CHIẾN: Nguồn thu Chính Tài vs Thiên Tài, cơ chế tích lũy qua Kho Tài, và giải pháp dòng tiền.
- RANH GIỚI ĐỊA BÀN (CHỐNG LẶP Ý):
  + CẤM lặp lại chuyện định hướng nghề nghiệp của Chương 1.
  + CẤM nhai lại điệp khúc "nóng giận do Dần - Thân xung" của Chương 3.
- TÍCH LŨY QUA KHO TÀI (TÀI KHỐ) - TUÂN THỦ 100% DỮ LIỆU ĐÃ TÍNH TOÁN:
  + BẮT BUỘC kiểm tra khối dữ liệu "--- ĐỊNH DANH MỘ KHỐ & KHO TÀI (TÀI KHỐ) ---" được cung cấp.
  + NẾU ĐÃ XÁC ĐỊNH CÓ KHO TÀI (Ví dụ: Trụ Giờ tọa Chi Thìn là Thủy Khố = KHO TÀI của Mậu Thổ): BẮT BUỘC LUẬN GIẢI khả năng tích lũy ngầm qua Kho Tài này, tàng ẩn Chính Tài; giải thích hiện trạng kho đang đóng trong nguyên cục và khi gặp Đại Vận hoặc Lưu Niên đối xung (như Tuất xung Thìn) sẽ mở kho, tạo đột phá tài sản.
  + TUYỆT ĐỐI CẤM PHÁN ẨU "Lá số không có Thìn, Tuất, Sửu, Mùi" hoặc "Không có Mộ Khố đóng vai trò kho tài"!
  + Chỉ khi nào dữ liệu ghi rõ "KHÔNG CÓ KHO TÀI" thì mới được luận giải theo hướng dòng tiền luân chuyển không kho.
- CẢNH BÁO RỦI RO DÒNG TIỀN: Phân tích rủi ro chi tiêu cảm xúc, biến động thị trường. CẤM nhắc từ "Kiếp Tài" nếu lá số không có Kiếp Tài.
- PHONG CÁCH ĐÒN BẨY & BẢNG NIÊN BIỂU ĐẮC TÀI: Đưa ra bảng Markdown các năm kích hoạt tài lộc sắc bén.`,

      3: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 3 (HÔN NHÂN & GIA ĐẠO):
- ĐỊA BÀN CHỦ LỰC CỦA CUNG PHỐI NGẪU & TƯƠNG TÁC ĐỊA CHI:
  + Đây là ĐỊA BÀN DUY NHẤT để phân tích sâu sắc tác động của Cung Phối Ngẫu (Chi Ngày) và tương tác Lục Xung giữa Chi Ngày với Chi Tháng (như Dần - Thân Lục Xung).
  + Luận giải chân thực mâu thuẫn nội tâm giữa khát vọng tự do và nhu cầu gắn kết, cách kiểm soát cảm xúc và chuyển hóa xung đột thành hòa khí.
- THẦN SÁT TÌNH CẢM & GIA ĐẠO:
  + Chỉ luận các Thần Sát thực tế có trong bảng Thần Sát (Âm Dương Sai Thác, Hồng Diễm, Hoa Cái, Thái Cực...).
  + TUYỆT ĐỐI CẤM SỬ DỤNG CÁC SAO NGOẠI LAI CỦA TỬ VI ĐẨU SỐ: Tuyệt đối CẤM nhắc đến sao "Đà La", "Kình Dương", "Địa Không", "Địa Kiếp", "Hóa Kỵ"... Bát Tự KHÔNG CÓ các sao này!
- TỬ TỨC: Luận giải Trụ Giờ về đường con cái dựa trên Thập Thần và Thần Sát hiện diện thực tế.`,

      4: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 4 (SỨC KHỎE & TẠNG PHỦ):
- DƯỠNG SINH ĐÔNG Y THỰC CHIẾN (HOÀNG ĐẾ NỘI KINH):
  Quy chiếu ngũ hành thái quá hoặc bất cập sang 5 tạng (Can Mộc, Tâm Hỏa, Tỳ Thổ, Phế Kim, Thận Thủy).
- RANH GIỚI ĐỊA BÀN (CHỐNG LẶP Ý):
  + Tập trung 100% vào thể chất, tạng phủ và nhịp sinh học.
  + CẤM nhắc lại chuyện sự nghiệp công danh, tiền bạc hay hôn nhân.
  + CẤM nhai lại điệp khúc "năm 2026-2027" một cách sáo rỗng ngoài khía cạnh lưu niên khí hậu ảnh hưởng đến tạng phủ.
- VẬN HẠN THỂ CHẤT: Chỉ cảnh báo huyết quang/phẫu thuật nếu có hung sát thực tế (Huyết Nhận, Lục Xung). Tuyệt đối CẤM dọa nạt ung u bướu hay bệnh hiểm nghèo!`,

      5: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 5 (PHONG THỦY & CẢI VẬN):
- CHIẾN LƯỢC CẢI VẬN DỰA TRÊN DỤNG THẦN & HỶ THẦN:
  + Không gian sống, phương vị làm việc (hướng nhà, hướng bàn làm việc).
  + Màu sắc, chất liệu trang phục, vật phẩm trợ mệnh thuận Dụng Thần.
  + Mạng lưới Quý Nhân kết nối cát lành.
- RANH GIỚI ĐỊA BÀN (CHỐNG LẶP Ý):
  + Đi thẳng vào các giải pháp hành động phong thủy cụ thể. CẤM lặp lại các phân tích tính cách tiêu cực ở các chương trước.`,

      6: `NGUYÊN TẮC HỌC THUẬT CHƯƠNG 6 (MỐC ĐẠI VẬN 100 NĂM):
- BẢN ĐỒ THỜI GIAN 100 NĂM ĐỜI NGƯỜI:
  Phân tích từng bước Đại Vận 10 năm từ tiền vận đến hậu vận.
- BẢNG MA TRẬN ĐẠI VẬN BẮT BUỘC:
  | Giai Đoạn / Độ Tuổi | Can Chi Đại Vận | Khí Thế & Tương Tác Học Thuật | Đánh Giá Cát / Hung | Chiến Lược Tiến Thủ / Phòng Thủ |
- KỶ LUẬT HỌC THUẬT NGHIÊM NGẶT VỀ THẬP THẦN ĐẠI VẬN:
  + BẮT BUỘC phân tích đúng Can Chi của từng bước Đại Vận và Thập Thần tương ứng với Nhật Chủ.
  + TUYỆT ĐỐI CẤM COPY-PASTE nhãn "Thiên Tài (Nhâm Thủy)" cho tất cả các đại vận! Phải chỉ rõ: Đại vận can gì, chi gì, mang khí của Thập thần nào (Ấn, Quan, Sát, Tài, Thương, Thực, hay Tỷ Kiếp).
- 10 NĂM HOÀNG KIM & BƯỚC NGOẶT: Chỉ rõ đại vận đắc dụng thần rực rỡ nhất để dốc sức kiến tạo đại nghiệp.`
    };

    return INSTRUCTIONS[chapterId] || '';
  }

  /**
   * Làm sạch context thô: Loại bỏ phần hướng dẫn cấu trúc của bài luận giải cơ bản
   */
  static cleanContextForVip(rawContext) {
    if (!rawContext) return '';
    const marker = '--- CẤU TRÚC BẢN LUẬN GIẢI YÊU CẦU ĐẦU RA';
    const idx = rawContext.indexOf(marker);
    if (idx !== -1) {
      return rawContext.substring(0, idx).trim();
    }
    return rawContext.trim();
  }

  /**
   * Lấy cấu hình Model tối ưu cho OpenRouter: Ưu tiên các mô hình có độ chính xác học thuật cao nhất và độ trễ tối ưu
   */
  static getOpenRouterModelForChapter(chapterId) {
    const DEFAULT_MAP = {
      1: process.env.OPENROUTER_MODEL_CH1 || 'qwen/qwen-plus',                  // Sự Nghiệp: Qwen Plus thấu triệt nghề nghiệp 4.0, tư duy phi tuyến
      2: process.env.OPENROUTER_MODEL_CH2 || 'qwen/qwen-plus',                  // Tài Chính: Qwen Plus đỉnh cao giải mã Kho Tài Thìn & tích lũy ngầm
      3: process.env.OPENROUTER_MODEL_CH3 || 'gemini-direct',                   // Hôn Nhân: Gemini SDK trực tiếp (6.8s, sạch 100% sao Tử Vi)
      4: process.env.OPENROUTER_MODEL_CH4 || 'gemini-direct',                   // Sức Khỏe: Đẩy thẳng Google Gemini SDK
      5: process.env.OPENROUTER_MODEL_CH5 || 'gemini-direct',                   // Cải Vận: Đẩy thẳng Google Gemini SDK
      6: process.env.OPENROUTER_MODEL_CH6 || 'gemini-direct'                    // Đại Vận 100 Năm: Gemini SDK (8.2s, bảng Markdown chuẩn xác 100% từng Thập Thần)
    };
    return DEFAULT_MAP[chapterId] || 'qwen/qwen-plus';
  }

  /**
   * TẦNG 2: Thực thi từng Replica Chuyên Đề Song Song
   * - 2 Replica (Chương 4 & 5): Đẩy THẲNG Google Gemini trực tiếp (không qua OpenRouter, độ trễ ~3-4s, 0 rate limit).
   * - 4 Replica còn lại (Chương 1, 2, 3, 6): Xử lý qua OpenRouter xoay tua key với các mô hình độ trễ thấp nhất.
   */
  static async executeReplica(replica, fullContext) {
    const { id, title, provider, model, keyEnv, subtopics } = replica;
    const apiKey = process.env[keyEnv] || process.env.GEMINI_API_KEY;

    const cleanContext = this.cleanContextForVip(fullContext);
    const chapterInstruction = this.getChapterSpecificInstructions(id);

    const replicaPrompt = `Dựa trên dữ liệu lá số phong thủy và phân tích học thuật nền tảng:\n${cleanContext}\n\n` +
      `----------------------------------------\n` +
      `CHỈ DẪN HỌC THUẬT CHUYÊN BIỆT CHO CHƯƠNG ${id}: ${title.toUpperCase()}\n` +
      `${chapterInstruction}\n\n` +
      `ĐỊNH HƯỚNG CÁC TRỌNG TÂM CẦN LUẬN GIẢI (Áp dụng nguyên tắc: CÓ THÌ LUẬN SÂU, KHÔNG CÓ THÌ BỎ QUA HOẶC CHUYỂN HƯỚNG SANG THỰC TẾ BẢN MỆNH):\n${subtopics.map((s, idx) => `- ${s}`).join('\n')}\n\n` +
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
      `Bắt đầu trực tiếp bằng: ## CHƯƠNG ${id}: ${title.toUpperCase()}`;

    try {
      // 1. TỐI ƯU HÓA: 2 Replica của Gemini (Chương 4 & 5) -> ĐẨY THẲNG Google Gemini SDK
      if (provider === 'gemini') {
        const geminiKey = process.env[keyEnv] || process.env.GEMINI_API_KEY;
        const geminiModel = model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
        logger.info(`[MultiAgentPipeline - Tầng 2] Replica ${id} (${title}) đẩy thẳng Google Gemini trực tiếp [${geminiModel}]...`);
        return await this.callGeminiWithKey(geminiKey, replicaPrompt, geminiModel);
      }

      // 2. 4 Replicas còn lại (Chương 1, 2, 3, 6): OpenRouter Gateway với xoay tua key
      const openRouterKeys = OpenRouterRotator.getKeys();
      if (openRouterKeys.length > 0) {
        const orModel = this.getOpenRouterModelForChapter(id);
        try {
          logger.info(`[MultiAgentPipeline - Tầng 2] Replica ${id} (${title}) routing to OpenRouter [${orModel}]...`);
          return await this.callOpenRouterEndpoint({
            model: orModel,
            prompt: replicaPrompt
          });
        } catch (orErr) {
          logger.warn(`[MultiAgentPipeline - Tầng 2] OpenRouter replica ${id} error with [${orModel}]: ${orErr.message}. Trying backup model...`);
          // Dự phòng thông minh: Chuyển sang mô hình đối trọng có độ trễ thấp
          const backupOrModel = 'qwen/qwen-2.5-72b-instruct';
          try {
            logger.info(`[MultiAgentPipeline - Tầng 2] Replica ${id} retrying with OpenRouter backup model [${backupOrModel}]...`);
            return await this.callOpenRouterEndpoint({
              model: backupOrModel,
              prompt: replicaPrompt
            });
          } catch (backupErr) {
            logger.warn(`[MultiAgentPipeline - Tầng 2] OpenRouter backup model [${backupOrModel}] failed: ${backupErr.message}. Falling back to provider keys...`);
          }
        }
      }

      // 3. Fallback định tuyến theo Provider cục bộ (Grok, Gemini)
      if (provider === 'grok' && apiKey) {
        const isGroq = apiKey.startsWith('gsk_');
        const url = isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.x.ai/v1/chat/completions';
        const modelToUse = isGroq ? 'llama-3.3-70b-versatile' : (model || 'grok-2-latest');
        return await this.callOpenAiEndpoint({
          url,
          apiKey,
          model: modelToUse,
          prompt: replicaPrompt
        });
      } else {
        return await this.callGeminiWithKey(apiKey, replicaPrompt, model);
      }
    } catch (err) {
      logger.warn(`[MultiAgentPipeline - Tầng 2] Replica ${id} error: ${err.message}. Falling back to Gemini...`);
      return await AiService.generateInterpretation(replicaPrompt, { model: 'gemini-3.1-flash-lite' });
    }
  }

  /**
   * KIẾN TRÚC 3 TẦNG CHUYÊN SÂU (VIP PIPELINE):
   * - TẦNG 1: Gemini + Qwen Plus chạy SONG SONG tạo 2 bản phân tích nền tảng.
   * - TẦNG 2: 6 Model chuyên biệt xử lý SONG SONG 6 chuyên đề (Qwen Plus & Gemini Flash Lite).
   * - TẦNG 3: 1 Gemini kết hợp, tạo dẫn nhập & đúc kết, TUYỆT ĐỐI KHÔNG NÉN NỘI DUNG mà giữ nguyên trọn vẹn 100% 6 chương.
   */
  static async runVipPipelineStream(prompt, birthYear, options = {}) {
    const { onProgress } = options;

    const REPLICAS = [
      {
        id: 1,
        title: 'Sự Nghiệp & Công Danh',
        provider: 'openrouter',
        model: 'qwen/qwen-plus',
        keyEnv: 'OPENROUTER_API_KEY',
        subtopics: [
          'Năng lực cốt lõi và thiên hướng nghề nghiệp vượt trội (ánh xạ kinh tế tri thức)',
          'Định vị vai trò: Lãnh đạo độc lập hay Chuyên gia cố vấn/quản trị cấp cao',
          'Môi trường làm việc, phong cách cộng sự và văn hóa tương hỗ',
          'Rào cản sự nghiệp và cạm bẫy thương trường (chỉ luận yếu tố thực tế có trong mệnh)',
          'Thời điểm vàng bứt phá danh vọng và thành tựu đỉnh cao'
        ]
      },
      {
        id: 2,
        title: 'Tài Chính & Dòng Tiền',
        provider: 'openrouter',
        model: 'qwen/qwen-plus',
        keyEnv: 'OPENROUTER_API_KEY_2',
        subtopics: [
          'Chính Tài vs Thiên Tài: Nguồn thu chủ lực và bản chất dòng tiền',
          'Khả năng tích lũy và chiến lược bảo toàn của cải (Mộ Khố nếu có, hoặc chuyển hóa tài sản cứng)',
          'Cảnh báo rủi ro dòng tiền và cạm bẫy tài chính (chỉ luận nguy cơ thực tế, không nhắc yếu tố vắng mặt)',
          'Phong cách đòn bẩy tài chính và quản trị rủi ro tối ưu',
          'Bảng niên biểu các năm vượng tài đắc lộc trong cuộc đời'
        ]
      },
      {
        id: 3,
        title: 'Hôn Nhân & Gia Đạo',
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        keyEnv: 'GEMINI_API_KEY',
        subtopics: [
          'Mô hình nhân duyên chủ đạo và xu hướng gắn kết tình cảm',
          'Chân dung, tính cách và ngũ hành bổ khuyết của người bạn đời tương hợp',
          'Vùng nhạy cảm tình cảm và nghệ thuật hóa giải xung đột (dựa trên Cung Phối Ngẫu)',
          'Đường con cái (Tử tức) và phúc trạch gia đạo nhiều thế hệ',
          'Bí quyết gìn giữ hòa khí và phong thủy không gian tổ ấm'
        ]
      },
      {
        id: 4,
        title: 'Sức Khỏe & Tạng Phủ',
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        keyEnv: 'GEMINI_API_KEY',
        subtopics: [
          'Cân bằng Ngũ hành và trạng thái 5 tạng phủ theo lý luận Đông Y',
          'Nhận diện tạng phủ suy yếu tương đối và nguy cơ bệnh lý cần phòng ngừa từ sớm',
          'Vận hạn thể chất đặc biệt (chỉ luận hạn mổ xẻ/huyết quang nếu có hung sát thực tế)',
          'Đồng hồ sinh học, giờ giấc sinh hoạt và nhịp điệu tái tạo năng lượng',
          'Phác đồ dưỡng sinh Đông Y: Thực phẩm, thói quen và vận động thuận Dụng Thần'
        ]
      },
      {
        id: 5,
        title: 'Phong Thủy & Cải Vận',
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        keyEnv: 'GEMINI_API_KEY_2',
        subtopics: [
          'Định hình Persona phong cách sống kích hoạt vận may theo độ tuổi',
          'Phương vị, hướng nhà, hướng làm việc và màu sắc bổ khuyết Dụng Thần',
          'Vật phẩm trợ mệnh, chất liệu trang phục và tần số năng lượng tương sinh',
          'Mạng lưới Quý Nhân phù trợ và phương vị kết nối cát lành',
          'Cải mệnh từ gốc: Rèn luyện tâm tính, kiểm soát cảm xúc và tích phúc hành thiện'
        ]
      },
      {
        id: 6,
        title: 'Mốc Đại Vận 100 Năm',
        provider: 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
        keyEnv: 'GEMINI_API_KEY_2',
        subtopics: [
          'Bảng ma trận chu kỳ 10 năm từng bước Đại Vận suốt cuộc đời',
          '10 năm hoàng kim rực rỡ nhất để dốc sức kiến tạo đại nghiệp',
          'Các bước ngoặt vận hạn cần thu mình phòng thủ (chỉ cảnh báo xung khắc nếu có thực tế)',
          'Lộ trình chiến lược: Năm nào nên tấn công mở rộng, năm nào nên tích lũy nội lực',
          'Kim chỉ nam nhân sinh và bài học giác ngộ cuộc đời'
        ]
      }
    ];

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // =========================================================================
          // TẦNG 1: DUAL PRE-ANALYSIS SONG SONG (GEMINI + QWEN PLUS)
          // =========================================================================
          logger.info('[MultiAgentPipeline - TẦNG 1] Bắt đầu Gemini & Qwen Plus chạy SONG SONG tạo 2 bản phân tích nền tảng...');
          if (onProgress) {
            onProgress({ stage: 'stage1', step: 'pre_analysis', message: 'Tầng 1: Đang phân tích âm dương ngũ hành & Tử Bình CoT...' });
          }

          const geminiPromise = MultiAgentPipelineService.callGeminiWithKey(
            process.env.GEMINI_API_KEY,
            `[BẢN PHÂN TÍCH 1 - TỔNG QUAN HỆ THỐNG NGŨ HÀNH & DỤNG THẦN TỪ GEMINI]:\n` +
            `Dựa trên dữ liệu lá số Bát Tự:\n${prompt}\n` +
            `Hãy khảo sát chuyên sâu: Vượng suy của Nhật chủ, phân bổ năng lượng 5 hành, Thập Thần chủ quản (tuân thủ đúng hệ thống Thập Thần, không nhầm Can ngũ hành khác là Kiếp Tài), Dụng Thần, Hỷ Thần, Kỵ Thần, và trạng thái tạng phủ để làm nền tảng học thuật vững chắc cho 6 chuyên đề.\n` +
            `LƯU Ý QUAN TRỌNG: BẮT BUỘC xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi". CHỈ LUẬN GIẢI các Thần Sát có thật trong danh sách Hiện Diện của lá số, TUYỆT ĐỐI KHÔNG liệt kê các sao không có để ghi "không xuất hiện".`
          ).catch(err => {
            logger.warn(`[Tầng 1] Gemini Pre-Analysis error: ${err.message}`);
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
            ? MultiAgentPipelineService.callOpenRouterEndpoint({
                model: 'qwen/qwen-plus',
                prompt: qwenCotPrompt,
                timeoutMs: 40000
              })
            : MultiAgentPipelineService.callGeminiWithKey(
                process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY,
                qwenCotPrompt
              )
          ).catch(err => {
            logger.warn(`[Tầng 1] Qwen Plus Pre-Analysis error: ${err.message}. Falling back to Gemini...`);
            return MultiAgentPipelineService.callGeminiWithKey(
              process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY,
              qwenCotPrompt
            ).catch(() => 'Dữ liệu Tử Bình CoT đã được xác lập trong phân tích số học nguyên bản.');
          });

          // Chạy đồng thời 2 luồng Tầng 1
          const [geminiAnalysis, cotAnalysis] = await Promise.all([geminiPromise, qwenPromise]);

          const combinedPreAnalysis = `\n=== BẢN PHÂN TÍCH HỌC THUẬT NỀN TẢNG TẦNG 1 (DUAL PRE-ANALYSIS) ===\n` +
            `[BẢN 1 - GEMINI]:\n${geminiAnalysis}\n\n` +
            `[BẢN 2 - QWEN TỬ BÌNH CHAIN-OF-THOUGHT]:\n${cotAnalysis}\n` +
            `===================================================================\n`;

          const fullContext = `${prompt}\n${combinedPreAnalysis}`;

          // =========================================================================
          // TẦNG 2: 6 REPLICAS CHUYÊN ĐỀ SONG SONG (6 MODELS QUA OPENROUTER/PROVIDERS)
          // =========================================================================
          logger.info('[MultiAgentPipeline - TẦNG 2] Khởi chạy 6 Replicas: 2 Replicas đẩy thẳng Gemini SDK, 4 Replicas qua OpenRouter (staggered 100ms)...');
          if (onProgress) {
            onProgress({ stage: 'stage2', step: 'replicas_start', message: 'Tầng 2: 6 chuyên đề đang được phân tích song song...' });
          }

          const replicaPromises = REPLICAS.map((rep, idx) => {
            const delay = rep.provider === 'gemini' ? 0 : idx * 100;
            return new Promise(resolve => setTimeout(resolve, delay)).then(async () => {
              if (onProgress) {
                onProgress({ stage: 'stage2', chapterId: rep.id, status: 'in_progress', title: rep.title, message: `Đang phân tích: C${rep.id} - ${rep.title}...` });
              }
              const output = await MultiAgentPipelineService.executeReplica(rep, fullContext);
              if (onProgress) {
                onProgress({ stage: 'stage2', chapterId: rep.id, status: 'completed', title: rep.title, message: `Hoàn tất: C${rep.id} - ${rep.title}` });
              }
              return output;
            });
          });

          // Đợi toàn bộ 6 chương hoàn thành từ Tầng 2
          const chaptersOutput = await Promise.all(replicaPromises);
          logger.info('[MultiAgentPipeline - TẦNG 2] 6 Replicas đã hoàn thành 100% bản thảo chi tiết.');

          // =========================================================================
          // TẦNG 3: GEMINI TỔNG BIÊN TẬP (CHIEF EDITOR & STRATEGIC HARMONIZER)
          // Đọc TOÀN BỘ 6 CHƯƠNG ĐÃ HOÀN THÀNH để rà soát, xuất SWOT thực chiến & Điều hòa đa mục tiêu
          // =========================================================================
          logger.info('[MultiAgentPipeline - TẦNG 3] Gemini đọc TOÀN BỘ 6 chương (Chief Editor) để thẩm định, tạo SWOT thực chiến & Chiến lược điều hòa đa mục tiêu...');
          if (onProgress) {
            onProgress({ stage: 'stage3', step: 'synthesis_start', message: 'Tầng 3: Tổng Biên Tập AI đang rà soát toàn văn 6 chương & điều hòa chiến lược...' });
          }

          const fullChaptersContext = chaptersOutput.map((content, idx) => {
            const rep = REPLICAS[idx];
            return `=== VĂN BẢN ĐÃ LUẬN GIẢI: CHƯƠNG ${rep.id} - ${rep.title.toUpperCase()} ===\n${(content || '').trim()}`;
          }).join('\n\n----------------------------------------\n\n');

          // Gemini đọc TOÀN BỘ 6 chương để tạo Dẫn Nhập SWOT thực chiến và Điều Hòa Đa Mục Tiêu
          let introAndOutro = null;
          try {
            const synthesisPrompt = `Bạn là Đại Sư Mệnh Lý Đông Phương & Tổng Biên Tập Học Thuật Tối Cao.
Dưới đây là 2 nguồn dữ liệu học thuật hoàn chỉnh của lá số:

[NGUỒN 1: DỮ LIỆU LÁ SỐ BÁT TỰ & BẢN PHÂN TÍCH HỌC THUẬT NỀN TẢNG (TẦNG 1)]:
${combinedPreAnalysis}

[NGUỒN 2: TOÀN VĂN 6 CHUYÊN ĐỀ ĐÃ ĐƯỢC 6 CHUYÊN GIA ĐỘC LẬP LUẬN GIẢI CHI TIẾT (TẦNG 2)]:
${fullChaptersContext}

NHIỆM VỤ TỔNG BIÊN TẬP CỦA BẠN (ĐỌC TOÀN BỘ NỘI DUNG 6 CHƯƠNG TRÊN ĐỂ RÀ SOÁT, TỔNG HỢP VÀ ĐIỀU HÒA CHIẾN LƯỢC TOÀN DIỆN):

1. SOẠN THẢO PHẦN MỞ ĐẦU (Định vị bản thể & Ma trận SWOT thực chiến):
   Bắt đầu chính xác bằng: "## ĐỊNH VỊ BẢN MỆNH: BẢN ĐỒ CHIẾN LƯỢC NHÂN SINH & MA TRẬN SWOT"
   Bao gồm 2 mục con rõ ràng:
   ### 1. Bản Thể & Chân Dung Cốt Cách Nhật Chủ (khoảng 250 - 300 từ): Khắc họa thần thái cốt cách, năng lượng ngũ hành chủ đạo, điểm đắc lực và sứ mệnh gốc rễ của Nhật Chủ.
   ### 2. Ma Trận Định Vị Bản Mệnh SWOT (Chiết Xuất 100% Từ 6 Phân Hệ Thực Chiến):
   BẮT BUỘC thiết lập 1 BẢNG MARKDOWN chuẩn xác gồm 3 cột:
   | Chiều Phân Tích | Yếu Tố Mệnh Lý Biện Chứng (Tổng hợp từ 6 chương) | Ý Nghĩa Thực Tế & Lời Khuyên Hành Động |
   - Hàng 1: **S - Strengths (Thế Mạnh Cốt Lõi)**: Tổng hợp trực tiếp từ Ch1 & Ch2 (Dụng Thần đắc lực, cách cục thành tựu, kho tài tích sản...).
   - Hàng 2: **W - Weaknesses (Tử Huyệt Cần Khắc Phục)**: Tổng hợp trực tiếp từ Ch3 & Ch4 (Tâm tính nóng nảy, ngũ hành khuyết hãm, tạng phủ suy thoái...).
   - Hàng 3: **O - Opportunities (Thời Cơ Thiên Thời)**: Tổng hợp trực tiếp từ Ch1, Ch2 & Ch6 (Đại vận hoàng kim, năm mở kho tài, cơ hội bứt phá...).
   - Hàng 4: **T - Threats (Cạm Bẫy Cần Đề Phòng)**: Tổng hợp trực tiếp từ Ch3, Ch4 & Ch6 (Khúc cua vận hạn xung phá, nguy cơ gia đạo, hao tài...).

2. SOẠN THẢO PHẦN KẾT THÚC (Chiến lược điều hòa đa mục tiêu & Đúc kết nhân sinh):
   Bắt đầu chính xác bằng: "## CHIẾN LƯỢC ĐIỀU HÒA ĐA MỤC TIÊU & HÓA GIẢI XUNG KHẮC BẢN MỆNH"
   (Đây là phần cốt lõi để hòa giải các mâu thuẫn đánh đổi giữa 6 chương độc lập, giải quyết xung đột giữa tiền bạc, sự nghiệp, sức khỏe và hôn nhân):
   ### 1. Cân Bằng Giữa Dòng Tiền & Tạng Phủ (Tài Chính vs Sức Khỏe)
   Chỉ rõ nguyên tắc: Khi nào dồn lực kiến tạo tài sản mà không làm suy kiệt tạng phủ; cơ chế dưỡng sinh bổ khuyết trong các năm đại vận lao lực.
   ### 2. Cân Bằng Giữa Danh Vọng & Hạnh Phúc Gia Đạo (Sự Nghiệp vs Hôn Nhân)
   Nghệ thuật phân bổ thời gian và chuyển hóa năng lượng xung khắc (như Lục Xung, Tương Hình) để sự nghiệp thăng hoa mà không làm rạn nứt cung phối ngẫu.
   ### 3. Bảng Lộ Trình Đồng Bộ Hành Động Theo Chu Kỳ (Master Action Roadmap)
   Lập BẢNG MARKDOWN 4 cột:
   | Giai Đoạn Vận Hạn | Mục Tiêu Trọng Tâm Ưu Tiên | Thách Thức Cần Phòng Thủ | Lời Khuyên Hành Động Thực Chiến |
   
   Tiếp theo là mục:
   ## ĐÚC KẾT NHÂN SINH & LỜI KHUYÊN HÀNH ĐẠO (khoảng 250 - 350 từ) đúc kết thông điệp trí tuệ, an nhiên tự tại, thuận thiên hành đạo.

LƯU Ý BẮT BUỘC:
- Xưng hô với đương số là "bạn", TUYỆT ĐỐI KHÔNG dùng từ "ngươi".
- TUYỆT ĐỐI KHÔNG tóm tắt hay rút gọn 6 chương vì hệ thống sẽ chèn 100% nguyên văn 6 chương chi tiết vào giữa. Bạn CHỈ XUẤT ĐÚNG 2 PHẦN:
  [PHẦN 1: DẪN NHẬP ĐỊNH VỊ BẢN MỆNH & SWOT]
  và
  [PHẦN 2: CHIẾN LƯỢC ĐIỀU HÒA ĐA MỤC TIÊU & ĐÚC KẾT NHÂN SINH].`;

            const introResult = await MultiAgentPipelineService.callGeminiWithKey(
              process.env.GEMINI_API_KEY,
              synthesisPrompt
            );
            introAndOutro = introResult;
          } catch (synthErr) {
            logger.warn(`[MultiAgentPipeline - TẦNG 3] Synthesis warning: ${synthErr.message}`);
          }

          // Xử lý tách phần Dẫn Nhập và phần Kết Thúc Điều Hòa
          let introHeader = '';
          let outroFooter = '';
          if (introAndOutro) {
            const cleanedSynthesis = AiService.cleanMarkdown(introAndOutro);
            const splitRegex = /(?=##\s*CHIẾN LƯỢC ĐIỀU HÒA|##\s*ĐÚC KẾT)/i;
            const parts = cleanedSynthesis.split(splitRegex);
            if (parts.length > 1) {
              introHeader = parts[0].trim();
              outroFooter = parts.slice(1).join('\n\n').trim();
            } else {
              introHeader = cleanedSynthesis.trim();
            }
          }

          // 1. Stream phần Dẫn Nhập (Định Vị Bản Mệnh SWOT) ở đầu
          if (introHeader) {
            const chunkSize = 120;
            for (let c = 0; c < introHeader.length; c += chunkSize) {
              const chunk = introHeader.slice(c, c + chunkSize);
              controller.enqueue(encoder.encode(chunk));
              await new Promise(r => setTimeout(r, 15));
            }
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 2. Stream lần lượt 6 Chương NGUYÊN BẢN 100% CHI TIẾT (TUYỆT ĐỐI KHÔNG NÉN)
          for (let i = 0; i < REPLICAS.length; i++) {
            const rep = REPLICAS[i];

            if (onProgress) {
              onProgress({ stage: 'streaming', streamingChapterId: rep.id, title: rep.title, message: `Đang trình bày: C${rep.id} - ${rep.title}` });
            }

            const chapterText = chaptersOutput[i] || '';
            const cleanedChapterText = AiService.cleanMarkdown(chapterText);

            const chunkSize = 120;
            for (let c = 0; c < cleanedChapterText.length; c += chunkSize) {
              const chunk = cleanedChapterText.slice(c, c + chunkSize);
              controller.enqueue(encoder.encode(chunk));
              await new Promise(r => setTimeout(r, 15));
            }
            controller.enqueue(encoder.encode('\n\n---\n\n'));
          }

          // 3. Stream phần Chiến Lược Điều Hòa & Đúc Kết Nhân Sinh ở cuối
          if (outroFooter) {
            const chunkSize = 120;
            for (let c = 0; c < outroFooter.length; c += chunkSize) {
              const chunk = outroFooter.slice(c, c + chunkSize);
              controller.enqueue(encoder.encode(chunk));
              await new Promise(r => setTimeout(r, 15));
            }
          }

          if (onProgress) {
            onProgress({ stage: 'completed', isCompleted: true, message: 'Hoàn tất toàn bộ luận giải chuyên sâu!' });
          }

          logger.info('[MultiAgentPipeline] Luồng stream 3 Tầng hoàn thành trọn vẹn 100%.');

        } catch (err) {
          logger.error('[MultiAgentPipelineService] Stream error:', err);
          controller.enqueue(encoder.encode(`\n\n[Lỗi tạo bài Chuyên Sâu: ${err.message}]`));
        } finally {
          controller.close();
        }
      }
    });

    return { stream };
  }
}

module.exports = MultiAgentPipelineService;
