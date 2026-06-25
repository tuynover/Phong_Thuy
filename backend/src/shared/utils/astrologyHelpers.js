const stemMap = {
    "Giáp": "Mộc", "Ất": "Mộc", "Bính": "Hỏa", "Đinh": "Hỏa", "Mậu": "Thổ",
    "Kỷ": "Thổ", "Canh": "Kim", "Tân": "Kim", "Nhâm": "Thủy", "Quý": "Thủy"
};

const elementMap = {
    "Moc": "Mộc", "Hoa": "Hỏa", "Tho": "Thổ", "Kim": "Kim", "Thuy": "Thủy",
    "Mộc": "Mộc", "Hỏa": "Hỏa", "Thổ": "Thổ", "Thủy": "Thủy"
};

function stemElementMap(stem) {
    return stemMap[stem] || stem;
}

function elementNameMap(el) {
    return elementMap[el] || el;
}

function formatDaYunText(daYun) {
    if (!daYun || daYun.length === 0) return "Không có thông tin Đại vận.";
    return daYun.map(d => `   - Từ năm ${d.startYear} (khoảng 10 năm): Đại vận ${d.gan} ${d.zhi}`).join('\n');
}

function getSafetyGuidelines() {
    return `
--- NGUYÊN TẮC AN TOÀN & ĐỊNH HƯỚNG MỆNH LÝ CẢI MỆNH (AI SAFETY & MITIGATION LAYER) ---
1. ĐỐI DIỆN SỰ THẬT KHÁCH QUAN & KHÔNG CHE GIẤU TIÊU CỰC:
   - Nếu lá số hoặc quẻ dịch có nhiều yếu tố xấu, hung tinh (như hình xung phá hại, bế tắc, hao tài lớn, bạo bệnh, cô độc ly tán, Dụng Thần suy yếu, hoặc quẻ gặp Lục Xung, Tuần Không phá hủy cấu trúc), bạn BẮT BUỘC phải chỉ rõ một cách chân thực, khách quan và trực diện mức độ nghiêm trọng để người dùng cảm nhận rõ tính chính xác và chiều sâu của huyền học truyền thống. Tuyệt đối không che giấu điểm xấu hay nói tránh theo kiểu "chỉ nói tốt".
2. QUY TẮC CẢI MỆNH TRÁNH TỬ CỤC:
   - Tuy nhiên, tuyệt đối KHÔNG ĐƯỢC đưa ra những lời phán quyết bế tắc tuyệt đường ("tử cục", chắc chắn mất mạng, thảm họa không thể cứu vãn).
   - Với MỖI yếu tố tiêu cực được chỉ ra, bạn BẮT BUỘC phải đính kèm giải pháp hóa giải chi tiết, rõ ràng và có tính thực tế cao (bao gồm cải biến tâm tính, thay đổi hành vi, chọn môi trường phù hợp, dùng hỷ dụng thần phong thủy ngũ hành, hoặc chọn thời gian chủ động phòng thủ). Luôn hướng đương số đến việc hiểu rằng "Mệnh do thiên định, Vận do nhân tạo" - mọi thử thách đều có thể hóa giải nếu biết trước để chủ động đề phòng.
3. Luận giải với văn phong trang trọng, uy nghiêm, giàu tính nhân văn triết lý của một vị hiền triết Đông Phương thực thụ.
`;
}

module.exports = {
    stemElementMap,
    elementNameMap,
    formatDaYunText,
    getSafetyGuidelines
};
