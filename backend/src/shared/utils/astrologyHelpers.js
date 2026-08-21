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
1. ĐỐI DIỆN SỰ THẬT KHÁCH QUAN, PHÁN TRỰC DIỆN KHÔNG NÓI GIẢM NÓI TRÁNH:
   - Nếu lá số hoặc quẻ dịch có nhiều yếu tố xấu, hung tinh (như hình xung phá hại, bế tắc, hao tài lớn, bạo bệnh, cô độc ly tán, Dụng Thần suy yếu, hoặc quẻ gặp Lục Xung, Tuần Không phá hủy cấu trúc), bạn BẮT BUỘC phải chỉ rõ một cách chân thực, khách quan và trực diện mức độ nghiêm trọng để người dùng cảm nhận rõ tính chính xác và chiều sâu của huyền học truyền thống. Tuyệt đối không che giấu điểm xấu, không nói giảm nói tránh, không xoa dịu bằng cách nói tránh hay "chỉ nói tốt". Cát nói cát, Hung nói hung rõ ràng.
2. ĐỊNH HƯỚNG CẢI VẬN CHỦ ĐỘNG:
   - Đưa ra giải pháp hóa giải chi tiết, rõ ràng và có tính thực tế cao (bao gồm cải biến tâm tính, thay đổi hành vi, chọn môi trường phù hợp, dùng hỷ dụng thần phong thủy ngũ hành, hoặc chọn thời gian chủ động phòng thủ). Đương số cần hiểu rõ vận hạn thực tế để chủ động đề phòng và cải thiện đời sống.
3. Luận giải với văn phong trang trọng, uy nghiêm, giàu tính nhân văn triết lý của một vị hiền triết Đông Phương thực thụ.
`;
}

function formatDetailedBaziTimeline(baziData) {
    if (!baziData || !baziData.daYun) return "Không có thông tin chi tiết về Đại vận và Lưu niên.";
    
    // Tìm Đại vận hiện tại (Đại vận chứa năm 2026)
    let currentDaYun = null;
    for (const dy of baziData.daYun) {
        if (dy.startYear <= 2026 && dy.startYear + 10 > 2026) {
            currentDaYun = dy;
            break;
        }
    }
    
    let daYunText = "";
    if (currentDaYun) {
        daYunText = "* Đại vận hiện tại: " + currentDaYun.gan + " " + currentDaYun.zhi + " (Nạp âm: " + currentDaYun.naYin + " | Thập thần Can vận: " + (currentDaYun.thapThanGan || "Không") + " | Bắt đầu từ năm: " + currentDaYun.startYear + " | Tuổi bắt đầu: " + currentDaYun.startAge + " tuổi)";
    } else {
        daYunText = "* Đại vận hiện tại: Không xác định được chặng đại vận phù hợp.";
    }

    // Trích xuất chi tiết Lưu niên 2026 và 2027
    const getLuuNienInfo = (year) => {
        let found = null;
        for (const dy of baziData.daYun) {
            if (dy.liuNian) {
                const ln = dy.liuNian.find(item => item.year === year);
                if (ln) {
                    found = ln;
                    break;
                }
            }
        }
        return found;
    };

    const formatShenShaList = (list) => {
        return list && list.length > 0 ? list.join(', ') : 'Không';
    };

    const ln2026 = getLuuNienInfo(2026);
    const ln2027 = getLuuNienInfo(2027);

    let timelineText = `--- THÔNG TIN HỶ DỤNG THẦN BẢN MỆNH ---
- Dụng Thần: ${baziData.dungThan || 'Không'}
- Hỷ Thần: ${baziData.hyThan || 'Không'}

--- CHI TIẾT ĐẠI VẬN HIỆN TẠI ---
${daYunText}

--- CHI TIẾT LƯU NIÊN NĂM 2026 ---
`;

    if (ln2026) {
        const annualSS = ln2026.annualShenSha || {};
        timelineText += `- Năm lưu niên: 2026
- Can Chi: Bính Ngọ (Thập thần Can năm: ${ln2026.thapThanGan || 'Không'} | Nạp Âm: ${ln2026.naYin || 'Không'} | Vòng Trường Sinh: ${ln2026.truongSinh || 'Không'})
- Tuổi đương số: ${ln2026.age} tuổi
- Niên Vận Tinh di động: ${ln2026.nienVanTinh?.map(v => `${v.name} (đáo Chi ${v.zhi})`).join(', ') || 'Không'}
- Tác động Thần Sát của Lưu niên lên 4 trụ bản mệnh:
  * Trụ Năm (Cung tổ nghiệp, phụ mẫu): ${formatShenShaList(annualSS.year)}
  * Trụ Tháng (Cung anh em, sự nghiệp): ${formatShenShaList(annualSS.month)}
  * Trụ Ngày (Bản thân, Cung phối ngẫu): ${formatShenShaList(annualSS.day)}
  * Trụ Giờ (Cung con cái, hậu vận): ${formatShenShaList(annualSS.hour)}
`;
    } else {
        timelineText += "- Không có dữ liệu lưu niên năm 2026.\n";
    }

    timelineText += `\n--- CHI TIẾT LƯU NIÊN NĂM 2027 ---\n`;

    if (ln2027) {
        const annualSS = ln2027.annualShenSha || {};
        timelineText += `- Năm lưu niên: 2027
- Can Chi: Đinh Mùi (Thập thần Can năm: ${ln2027.thapThanGan || 'Không'} | Nạp Âm: ${ln2027.naYin || 'Không'} | Vòng Trường Sinh: ${ln2027.truongSinh || 'Không'})
- Tuổi đương số: ${ln2027.age} tuổi
- Niên Vận Tinh di động: ${ln2027.nienVanTinh?.map(v => `${v.name} (đáo Chi ${v.zhi})`).join(', ') || 'Không'}
- Tác động Thần Sát của Lưu niên lên 4 trụ bản mệnh:
  * Trụ Năm (Cung tổ nghiệp, phụ mẫu): ${formatShenShaList(annualSS.year)}
  * Trụ Tháng (Cung anh em, sự nghiệp): ${formatShenShaList(annualSS.month)}
  * Trụ Ngày (Bản thân, Cung phối ngẫu): ${formatShenShaList(annualSS.day)}
  * Trụ Giờ (Cung con cái, hậu vận): ${formatShenShaList(annualSS.hour)}
`;
    } else {
        timelineText += "- Không có dữ liệu lưu niên năm 2027.\n";
    }

    return timelineText;
}

module.exports = {
    stemElementMap,
    elementNameMap,
    formatDaYunText,
    getSafetyGuidelines,
    formatDetailedBaziTimeline
};
