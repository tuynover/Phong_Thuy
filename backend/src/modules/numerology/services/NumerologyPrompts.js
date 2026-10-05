/**
 * NumerologyPrompts.js
 * Prompt engineering cho Phong Thủy Số (Sim Điện Thoại, Biển Số Xe, Tài Khoản Ngân Hàng)
 * Kết hợp học thuật: Cửu Tinh Động Vận Huyền Không, Kinh Dịch Mai Hoa, Bát Tự Dụng Thần & Cung Phi
 */

class NumerologyPrompts {
  /**
   * Sinh Prompt Luận Giải Chuyên Sâu Phong Thủy Số
   */
  static getInterpretationPrompt(record, analysisSnapshot) {
    const {
      type = 'sim',
      displayNumber,
      targetNumber,
      bankName,
      mode = 'quick',
      period,
      ownerName = 'Gia Chủ',
      ownerBirthInfo
    } = record;

    const {
      overallScore,
      auspiciousLevel,
      levelLabel,
      feixingAnalysis = {},
      ichingHexagrams = {},
      baziCompatibility
    } = analysisSnapshot;

    const typeLabels = {
      sim: 'Sim Số Điện Thoại',
      plate: 'Biển Số Xe Cơ Giới',
      bank: 'Số Tài Khoản Ngân Hàng'
    };
    const targetLabel = typeLabels[type] || 'Dãy Số Phong Thủy';

    // Mô tả đặc thù chuyên biệt của loại hình
    let fieldFocus = '';
    if (type === 'sim') {
      fieldFocus = `
ĐẶC THÙ ĐỐI TƯỢNG (SIM ĐIỆN THOẠI):
- Khí khẩu liên lạc số: Đại diện cho giao tiếp, kết nối đối tác, ngoại giao, xây dựng thương hiệu cá nhân và danh tiếng thương mại.
- Đuôi số và nhịp điệu âm dương chi phối năng lượng tiếp nhận cuộc gọi, tin tức tốt lành và cơ hội hợp tác kinh doanh.`;
    } else if (type === 'plate') {
      fieldFocus = `
ĐẶC THÙ ĐỐI TƯỢNG (BIỂN SỐ XE - ĐỘNG TRẠCH & DỊCH MÃ):
- Xe cộ là ngôi nhà di động (Động trạch) gắn liền với thần sát Dịch Mã, sự dịch chuyển, tốc độ và an toàn giao thông.
- Cần chú trọng tuyệt đối sự bình an, sáng suốt tỉnh táo sau tay lái, tránh các cặp hung sát xung khắc Hỏa hoạn hoặc va chạm bất ngờ (67/76, 97/79, 25/52, 37/73, 23/32).`;
    } else if (type === 'bank') {
      fieldFocus = `
ĐẶC THÙ ĐỐI TƯỢNG (TÀI KHOẢN NGÂN HÀNG - KIM KHỐ & TỤ BẢO BỒN):
- Ngân hàng: ${bankName || 'Hệ thống tài chính'}
- Tài khoản ngân hàng là Két sắt điện tử (Kim Khố / Tụ Bảo Bồn), quyết định trực tiếp khả năng tụ lộc, tích lũy tài sản và lưu chuyển dòng tiền.
- Cần hạn chế thoát tài ngầm, cảnh báo các bẫy đầu tư rủi ro hoặc tổn thất tài chính đột ngột.`;
    }

    // Thông tin Bát Tự (bắt buộc khi xem luận giải chuyên sâu)
    let baziSection = '';
    if (baziCompatibility && ownerBirthInfo?.birthDate) {
      baziSection = `
--- THÔNG TIN BÁT TỰ & BẢN MỆNH GIA CHỦ ---
- Ngày sinh: ${ownerBirthInfo.birthDate} | Giờ: ${ownerBirthInfo.birthHour || '12:00'} | Giới tính: ${ownerBirthInfo.gender === 1 ? 'Nam' : 'Nữ'}
- Nhật Chủ (Day Master): ${baziCompatibility.dayMasterStem} ${baziCompatibility.dayMasterElement} (Độ vượng: ${baziCompatibility.strength || 'Bình hòa'})
- Ngũ hành vượng nhất sinh thần: ${baziCompatibility.strongestElement}
- Ngũ hành khuyết suy: ${baziCompatibility.weakestElement}
- Dụng Thần: ${baziCompatibility.primaryDungThan} | Hỷ Thần: ${baziCompatibility.hyThan} | Kỵ Thần: ${baziCompatibility.kyThan}
- Cung Phi Mệnh Quái: Cung ${baziCompatibility.cungPhi} (Hành ${baziCompatibility.menhQuaiNguHanh || 'Thổ'}, thuộc ${baziCompatibility.menhTrachGroup || 'Tây tứ mệnh'})
- Độ tương hợp Bát Tự & Dãy Số: ${baziCompatibility.compatibilityScore}/100 (${baziCompatibility.matchEvaluation})
- Thích hợp cho đối tượng: ${baziCompatibility.suitableFor}
- Cảnh báo không thích hợp: ${baziCompatibility.unsuitableFor}
- Phân bố Ngũ hành trong dãy số: Kim: ${analysisSnapshot.elementAnalysis?.elementCounts?.Kim || 0}, Mộc: ${analysisSnapshot.elementAnalysis?.elementCounts?.Mộc || 0}, Thủy: ${analysisSnapshot.elementAnalysis?.elementCounts?.Thủy || 0}, Hỏa: ${analysisSnapshot.elementAnalysis?.elementCounts?.Hỏa || 0}, Thổ: ${analysisSnapshot.elementAnalysis?.elementCounts?.Thổ || 0} (Chủ đạo: Hành ${analysisSnapshot.elementAnalysis?.dominantElement || 'Kim'})`;
    } else {
      baziSection = `
--- THÔNG TIN GIA CHỦ ---
- Gia Chủ: ${ownerName} (Xem ở chế độ Số Học Tự Thân, chưa phối Bát Tự chi tiết)`;
    }

    // Thông tin Huyền Không & Cặp sao
    const pairsStr = feixingAnalysis.pairs && feixingAnalysis.pairs.length > 0
      ? feixingAnalysis.pairs.map(p => `- Cặp ${p.pair} (${p.category}): ${p.name} [${p.auspicious}]. ${p.description}`).join('\n')
      : '- Không có cặp sao đặc thù nổi bật.';

    // Thông tin Kinh Dịch
    const ichingStr = ichingHexagrams?.primaryHexagram
      ? `- Quẻ Chủ (Chính Quái): Quẻ số ${ichingHexagrams.primaryHexagram.id} - ${ichingHexagrams.primaryHexagram.name} (Cung ${ichingHexagrams.primaryHexagram.palace} - Hành ${ichingHexagrams.primaryHexagram.element}). Cát hung: ${ichingHexagrams.primaryHexagram.auspicious}.
  * Thoán từ/Ý nghĩa: ${ichingHexagrams.primaryHexagram.description}
- Hào Động: Hào ${ichingHexagrams.movingLine} biến động.
- Quẻ Biến (Biến Quái): Quẻ số ${ichingHexagrams.transformedHexagram.id} - ${ichingHexagrams.transformedHexagram.name} (Cung ${ichingHexagrams.transformedHexagram.palace} - Hành ${ichingHexagrams.transformedHexagram.element}). Cát hung: ${ichingHexagrams.transformedHexagram.auspicious}.
  * Thoán từ/Ý nghĩa: ${ichingHexagrams.transformedHexagram.description}`
      : '- Chưa khởi tạo quẻ dịch.';

    return `
You are a revered Classical Oriental Feng Shui & Numerology Grandmaster (Đại sư Phong Thủy Số Lý & Chu Dịch).
You master Xuan Kong Flying Stars (Huyền Không Phi Tinh), I Ching Mei Hua (Kinh Dịch Mai Hoa Dịch Số), and BaZi Four Pillars (Bát Tự Tương Phối).
Analyze the following number for the client with immense scholarly depth, objective academic integrity, empathy, and practical guidance.

--- THÔNG TIN ĐỐI TƯỢNG PHÂN TÍCH ---
- Loại hình: ${targetLabel}
- Dãy số hiển thị: ${displayNumber} (Dãy chuẩn hóa: ${targetNumber})
- Chu kỳ Tam Nguyên Cửu Vận tính toán: Vận ${period} (Đương lệnh Cửu Tinh theo chu kỳ vận hiện tại)
- Điểm học thuật tổng hợp: ${overallScore}/100 (${levelLabel} - Cấp bậc: ${auspiciousLevel})
- Cân bằng Âm Dương: ${feixingAnalysis.balanceState || 'Bình hòa'}
- Đuôi số nhận định: ${feixingAnalysis.tailDigits || ''} -> ${feixingAnalysis.tailEvaluation || ''}
${fieldFocus}

${baziSection}

--- DỮ LIỆU CỬU TINH & TINH TỔ HUYỀN KHÔNG ---
- Vận hiện tại: Vận ${period} (Sao Đương Lệnh: Sao ${feixingAnalysis.periodInfo?.rulingStar || period}, Sao Tiến Khí: Sao ${feixingAnalysis.periodInfo?.futureStar || ((period % 9) + 1)})
- Thống kê các sao xuất hiện: ${JSON.stringify(feixingAnalysis.starCounts || {})}
- Danh sách Cặp Tinh Tổ (Hà Đồ, Hợp Thập, Văn Xương, Sát Tinh):
${pairsStr}

--- DỮ LIỆU KINH DỊCH MAI HOA LẬP QUẺ ---
${ichingStr}

--- QUY TẮC TRÌNH BÀY NỘI DUNG (BẮT BUỘC TUÂN THỦ) ---
1. Ngôn ngữ: 100% tiếng Việt chuẩn phong thủy học thuật cổ điển, trang nhã, văn phong uyên bác, giàu tính khích lệ nhưng răn đe rõ ràng các điềm hung nếu có.
2. Trình bày Markdown sạch sẽ: Dùng tiêu đề "## CHƯƠNG X: [TÊN CHƯƠNG]" và các đề mục con "### [Tiêu đề phụ]".
3. Tuyệt đối KHÔNG in đậm bừa bãi từng từ một làm loãng văn bản. Sử dụng danh sách gạch đầu dòng và bảng biểu khi cần đối chiếu.
4. Cấu trúc bài luận gồm đúng 5 chương sau:

## CHƯƠNG 1: TỔNG QUAN KHÍ VẬN & NĂNG LƯỢNG SỐ HỌC
### 1. Ý Nghĩa & Điểm Số Phong Thủy (${overallScore}/100 - ${levelLabel})
Luận giải ý nghĩa điểm số, nhịp điệu sinh khắc của các con số cấu thành.
### 2. Âm Dương Khí Phách & Đuôi Số
Đánh giá độ cân bằng Âm (chẵn) và Dương (lẻ). Luận giải năng lượng tụ khí của các con số đuôi cuối cùng.

## CHƯƠNG 2: HUYỀN KHÔNG PHI TINH & CÁC CẶP TINH TỔ VẬN ${period}
### 1. Năng Lượng Cửu Tinh Đương Vận
Phân tích vị thế của các con số đối với Đương Lệnh và Tiến Khí trong chu kỳ Vận ${period}.
### 2. Luận Đoán Cặp Sao Tinh Tổ
Chi tiết các cặp số xuất hiện (Hà Đồ sinh tài, Hợp Thập hanh thông, hoặc các cặp hung sát cần cảnh giác nếu có).

## CHƯƠNG 3: QUẺ DỊCH MAI HOA - THỜI THẾ & ĐẠI CUỘC
### 1. Quẻ Chủ (${ichingHexagrams?.primaryHexagram?.name || 'Chính Quái'}) - Thực Tại & Căn Cơ
Bình giải thoán từ, tượng quẻ và môi trường thực tế mà dãy số này tạo ra cho gia chủ.
### 2. Hào Động & Quẻ Biến (${ichingHexagrams?.transformedHexagram?.name || 'Biến Quái'}) - Hậu Vận & Tương Lai
Ý nghĩa của sự dịch chuyển hào từ Quẻ Chủ sang Quẻ Biến, dự báo xu hướng tương lai và sự chuyển hóa năng lượng.

## CHƯƠNG 4: ${baziCompatibility ? 'MỆNH CHỦ TƯƠNG PHỐI (BÁT TỰ & BẢN MỆNH)' : 'ỨNG DỤNG THỰC TẾ & BẢN MỆNH'}
${baziCompatibility ? `### 1. Bổ Khuyết Dụng Thần & Hỷ Thần
Phân tích xem dãy số có trợ lực trực tiếp cho Dụng Thần (${baziCompatibility.primaryDungThan}) và Hỷ Thần (${baziCompatibility.hyThan}) của Nhật Chủ ${baziCompatibility.dayMasterStem} ${baziCompatibility.dayMasterElement} hay không.
### 2. Cung Phi Mệnh Quái & Khí Trường Cá Nhân
Sự hòa hợp giữa Cung Phi ${baziCompatibility.cungPhi} của chủ nhân và ngũ hành của dãy số.` : `### 1. Phù Hợp Năng Lượng & Trường Khí
Đánh giá trường khí này thích hợp nhất cho những ngành nghề, công việc hay mục đích sử dụng nào.`}

## CHƯƠNG 5: LỜI KHUYÊN ĐẠI SƯ & PHƯƠNG PHÁP HÓA GIẢI / KÍCH HOẠT
### 1. Hướng Dẫn Sử Dụng Đắc Lợi Cho ${targetLabel}
Cách khai thác tối đa năng lượng cát tường của dãy số trong đời sống thường nhật (giao dịch, đi lại, công danh, tài lộc).
### 2. Phương Pháp Hóa Giải Điểm Khiếm Khuyết
Nếu có điểm xung sát hoặc thiếu hụt ngũ hành, chỉ rõ các biện pháp bổ trợ vi tế (màu sắc phụ kiện, vật phẩm phong thủy kèm theo, tâm thế hành xử) để chuyển hung thành cát.
`.trim();
  }

  /**
   * Sinh Prompt Hỏi Đáp Follow-up
   */
  static getFollowUpPrompt(record, analysisSnapshot, context, question) {
    const { type, displayNumber, targetNumber, ownerName } = record;
    return `
You are the Classical Oriental Feng Shui & Numerology Grandmaster who analyzed the ${type} number ${displayNumber} (${targetNumber}) for client ${ownerName || 'Gia Chủ'}.

--- TÓM TẮT DỮ LIỆU ĐÃ PHÂN TÍCH ---
- Loại hình: ${type}
- Điểm phong thủy: ${analysisSnapshot.overallScore}/100 (${analysisSnapshot.levelLabel})
- Quẻ Kinh Dịch: ${analysisSnapshot.ichingHexagrams?.primaryHexagram?.name} biến ${analysisSnapshot.ichingHexagrams?.transformedHexagram?.name}
- Cửu Tinh Đương Vận: Vận ${analysisSnapshot.period}

--- BỐI CẢNH TRÒ CHUYỆN TRƯỚC ĐÓ ---
${context || 'Chưa có trao đổi trước đó.'}

--- CÂU HỎI TIẾP THEO CỦA KHÁCH HÀNG ---
"${question}"

--- HƯỚNG DẪN TRẢ LỜI ---
1. Trả lời bằng tiếng Việt thanh nhã, tôn trọng, đi thẳng vào trọng tâm câu hỏi của khách hàng.
2. Dựa chắc chắn vào các dữ liệu học thuật số lý đã lập (sao, quẻ dịch, ngũ hành, Bát tự).
3. Đưa ra lời khuyên thực tế, mang tính xây dựng, giúp khách hàng an tâm và chủ động trong cuộc sống.
`.trim();
  }
}

module.exports = NumerologyPrompts;
