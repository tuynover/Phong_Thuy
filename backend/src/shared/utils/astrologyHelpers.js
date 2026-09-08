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

const STEMS_INFO = {
    'Giáp': { element: 'Mộc', polarity: 1 },
    'Ất': { element: 'Mộc', polarity: -1 },
    'Bính': { element: 'Hỏa', polarity: 1 },
    'Đinh': { element: 'Hỏa', polarity: -1 },
    'Mậu': { element: 'Thổ', polarity: 1 },
    'Kỷ': { element: 'Thổ', polarity: -1 },
    'Canh': { element: 'Kim', polarity: 1 },
    'Tân': { element: 'Kim', polarity: -1 },
    'Nhâm': { element: 'Thủy', polarity: 1 },
    'Quý': { element: 'Thủy', polarity: -1 }
};

const ELEMENT_CYCLE = {
    'Mộc': { sinh: 'Hỏa', duocSinh: 'Thủy', khac: 'Thổ', biKhac: 'Kim' },
    'Hỏa': { sinh: 'Thổ', duocSinh: 'Mộc', khac: 'Kim', biKhac: 'Thủy' },
    'Thổ': { sinh: 'Kim', duocSinh: 'Hỏa', khac: 'Thủy', biKhac: 'Mộc' },
    'Kim': { sinh: 'Thủy', duocSinh: 'Thổ', khac: 'Mộc', biKhac: 'Hỏa' },
    'Thủy': { sinh: 'Mộc', duocSinh: 'Kim', khac: 'Hỏa', biKhac: 'Thổ' }
};


function getTenGodsLockTable(dayCan) {
    const dayInfo = STEMS_INFO[dayCan];
    if (!dayInfo) return '';
    const dayEl = dayInfo.element;
    const dayPol = dayInfo.polarity;
    const cycle = ELEMENT_CYCLE[dayEl];

    const mapping = {};
    for (const [stem, info] of Object.entries(STEMS_INFO)) {
        if (info.element === dayEl) {
            mapping[stem] = info.polarity === dayPol ? 'Tỷ Kiên (Đồng khí trợ Thân)' : 'Kiếp Tài (Đồng khí đoạt Tài)';
        } else if (info.element === cycle.sinh) {
            mapping[stem] = info.polarity === dayPol ? `Thực Thần (${dayEl} sinh ${cycle.sinh}, Thân tiết khí)` : `Thương Quan (${dayEl} sinh ${cycle.sinh}, Thân tiết khí)`;
        } else if (info.element === cycle.khac) {
            mapping[stem] = info.polarity === dayPol ? `Thiên Tài (${dayEl} khắc ${cycle.khac}, Thân chi phối)` : `Chính Tài (${dayEl} khắc ${cycle.khac}, Thân chi phối)`;
        } else if (info.element === cycle.biKhac) {
            mapping[stem] = info.polarity === dayPol ? `Thất Sát (${cycle.biKhac} khắc ${dayEl}, áp chế Thân)` : `Chính Quan (${cycle.biKhac} khắc ${dayEl}, kỷ luật Thân)`;
        } else if (info.element === cycle.duocSinh) {
            mapping[stem] = info.polarity === dayPol ? `Thiên Ấn / Kiêu Thần (${cycle.duocSinh} sinh ${dayEl}, sinh trợ Thân)` : `Chính Ấn (${cycle.duocSinh} sinh ${dayEl}, sinh trợ Thân)`;
        }
    }

    const lines = Object.entries(mapping).map(([stem, role]) => `  * Can ${stem} (${STEMS_INFO[stem].element}): ${role}`);

    return `[HỆ THỐNG KIỂM SOÁT THẬP THẦN NỘI BỘ CHO NHẬT CHỦ ${dayCan.toUpperCase()} (${dayEl.toUpperCase()})]
(Chỉ dẫn tư duy ngầm cho AI - TUYỆT ĐỐI KHÔNG chép nguyên văn, KHÔNG giảng giải lý thuyết suông cho khách hàng):
- Nhật Chủ: ${dayCan} (${dayEl}, ${dayPol === 1 ? 'Dương' : 'Âm'})
- Bảng ánh xạ Thập Thần 10 Can với Nhật Chủ:
${lines.join('\n')}

- QUY TẮC SINH KHẮC NỘI BỘ:
  * ${cycle.duocSinh} sinh ${dayEl} (Ấn Tinh).
  * ${dayEl} sinh ${cycle.sinh} (Thực Thương - Nhật Chủ tiết khí, TUYỆT ĐỐI KHÔNG coi là tương khắc).
  * ${dayEl} khắc ${cycle.khac} (Tài Tinh).
  * ${cycle.biKhac} khắc ${dayEl} (Quan Sát).
  * Can Kiếp Tài của ${dayCan} (${dayEl}) DUY NHẤT LÀ ${Object.keys(mapping).find(s => mapping[s].includes('Kiếp Tài'))} (Can cùng hành khác cực). TUYỆT ĐỐI KHÔNG gọi can ngũ hành khác là Kiếp Tài.
- NGUYÊN TẮC PHÁT NGÔN CHO KHÁCH HÀNG:
  * TUYỆT ĐỐI CẤM trích dẫn các cụm từ kỹ thuật như "Theo Bảng Thập Thần", "Theo bảng khóa cứng", "Kiếp Tài vắng mặt trong lá số"...
  * Nếu lá số KHÔNG CÓ Kiếp Tài thì BỎ QUA HOÀN TOÀN từ "Kiếp Tài", chỉ luận thực tế nguồn tài chính có thật của đương số.`;
}

/**
 * Phân tích Tất Định Tứ Mộ Khố & Xác Định Kho Tài (Tài Khố) Chuẩn Tử Bình
 */
function getMoKhoAndTaiKhoAnalysis(canChi, dayCan) {
    const dayEl = stemElementMap(dayCan);
    
    // Ánh xạ Kho Tài (Tài Khố) theo Nhật Chủ
    const TAI_KHO_MAP = {
        'Thổ': { khoChi: 'Thìn', khoName: 'Thủy Khố', taiType: 'Tài Khố (Kho Tài)', taiElement: 'Thủy', xungChi: 'Tuất' },
        'Hỏa': { khoChi: 'Sửu', khoName: 'Kim Khố', taiType: 'Tài Khố (Kho Tài)', taiElement: 'Kim', xungChi: 'Mùi' },
        'Kim': { khoChi: 'Mùi', khoName: 'Mộc Khố', taiType: 'Tài Khố (Kho Tài)', taiElement: 'Mộc', xungChi: 'Sửu' },
        'Thủy': { khoChi: 'Tuất', khoName: 'Hỏa Khố', taiType: 'Tài Khố (Kho Tài)', taiElement: 'Hỏa', xungChi: 'Thìn' },
        'Mộc': { khoChi: 'Tuất/Thìn/Mùi/Sửu', khoName: 'Thổ Khố', taiType: 'Tài Khố (Kho Tài)', taiElement: 'Thổ', xungChi: 'Xung tương ứng' }
    };

    const targetTaiKho = TAI_KHO_MAP[dayEl] || { khoChi: 'Thìn', khoName: 'Thủy Khố', taiType: 'Tài Khố', taiElement: 'Thủy', xungChi: 'Tuất' };

    const pillars = [
        { name: 'Trụ Năm', zhi: canChi.year?.zhi, gan: canChi.year?.gan, tangCan: canChi.year?.tangCan || [] },
        { name: 'Trụ Tháng', zhi: canChi.month?.zhi, gan: canChi.month?.gan, tangCan: canChi.month?.tangCan || [] },
        { name: 'Trụ Ngày', zhi: canChi.day?.zhi, gan: canChi.day?.gan, tangCan: canChi.day?.tangCan || [] },
        { name: 'Trụ Giờ', zhi: canChi.hour?.zhi, gan: canChi.hour?.gan, tangCan: canChi.hour?.tangCan || [] }
    ];

    const MO_KHO_LIST = ['Thìn', 'Tuất', 'Sửu', 'Mùi'];
    const presentKho = [];
    const allZhis = pillars.map(p => p.zhi);

    pillars.forEach(p => {
        if (MO_KHO_LIST.includes(p.zhi)) {
            let khoNature = '';
            let isTaiKho = false;
            if (p.zhi === 'Thìn') {
                khoNature = 'Thủy Khố (Mộ Khố của Thủy & Thấp Thổ)';
                if (dayEl === 'Thổ') isTaiKho = true;
            } else if (p.zhi === 'Tuất') {
                khoNature = 'Hỏa Khố (Mộ Khố của Hỏa & Táo Thổ)';
                if (dayEl === 'Thủy') isTaiKho = true;
            } else if (p.zhi === 'Sửu') {
                khoNature = 'Kim Khố (Mộ Khố của Kim & Thấp Thổ)';
                if (dayEl === 'Hỏa') isTaiKho = true;
            } else if (p.zhi === 'Mùi') {
                khoNature = 'Mộc Khố (Mộ Khố của Mộc & Táo Thổ)';
                if (dayEl === 'Kim') isTaiKho = true;
            }
            if (dayEl === 'Mộc') isTaiKho = true;

            const oppZhi = p.zhi === 'Thìn' ? 'Tuất' : (p.zhi === 'Tuất' ? 'Thìn' : (p.zhi === 'Sửu' ? 'Mùi' : 'Sửu'));
            const isOpenedInNatal = allZhis.includes(oppZhi);

            presentKho.push({
                pillar: p.name,
                zhi: p.zhi,
                khoNature,
                isTaiKho,
                tangCan: p.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', '),
                oppZhi,
                isOpenedInNatal
            });
        }
    });

    const hasTaiKho = presentKho.some(k => k.isTaiKho);
    const taiKhoDetails = presentKho.filter(k => k.isTaiKho);

    let report = `--- ĐỊNH DANH MỘ KHỐ & KHO TÀI (TÀI KHỐ) TẤT ĐỊNH NGUYÊN CỤC ---\n`;
    report += `- Nhật Chủ: ${dayCan} (Hành ${dayEl}). Ngũ hành Tài Tinh: ${targetTaiKho.taiElement} -> Kho Tài tương ứng: ${targetTaiKho.khoChi} (${targetTaiKho.khoName}).\n`;
    
    if (presentKho.length === 0) {
        report += `- Hiện diện Mộ Khố trong 4 trụ: HOÀN TOÀN KHÔNG CÓ Thìn, Tuất, Sửu, Mùi.\n`;
        report += `- Kết luận Tài Khố: KHÔNG CÓ KHO TÀI. (Quy tắc hành văn Chương 2: TUYỆT ĐỐI CẤM nhắc từ "Mộ Khố", luận thẳng đặc tính dòng tiền luân chuyển liên tục, cần chuyển thành tài sản cứng).\n`;
    } else {
        report += `- Các Mộ Khố hiện diện trong nguyên cục:\n`;
        presentKho.forEach(k => {
            report += `  + ${k.pillar} tọa Chi ${k.zhi}: Bản chất là ${k.khoNature}. Tàng can: [${k.tangCan}]. ${k.isTaiKho ? '👉 ĐÂY CHÍNH LÀ KHO TÀI (TÀI KHỐ) CỦA ĐƯƠNG SỐ!' : ''}\n`;
            report += `    Trạng thái: ${k.isOpenedInNatal ? `ĐÃ ĐƯỢC XUNG KHAI trong nguyên cục bởi Chi ${k.oppZhi}.` : `ĐANG ĐÓNG trong nguyên cục (do không có Chi ${k.oppZhi} đối xung). Cần chờ Đại Vận hoặc Lưu Niên ${k.oppZhi} xung khai mở kho.`}\n`;
        });

        if (hasTaiKho) {
            const tk = taiKhoDetails[0];
            report += `\n‼️ CHỈ THỊ BẮT BUỘC CHO CHƯƠNG 2 (TÀI CHÍNH):
- Đương số CÓ KHO TÀI TỌA TẠI ${tk.pillar.toUpperCase()} (CHI ${tk.zhi.toUpperCase()}).
- TUYỆT ĐỐI CẤM viết "Lá số không có Thìn, Tuất, Sửu, Mùi" hoặc "Không có Mộ Khố đóng vai trò kho tài"!
- BẮT BUỘC LUẬN GIẢI: Khả năng tụ tài, tích lũy ngầm qua Kho Tài Chi ${tk.zhi}. Hiện trạng kho đang ${tk.isOpenedInNatal ? 'mở' : 'đóng'}, khi gặp vận/năm ${tk.oppZhi} (như Đại Vận ${tk.oppZhi} hoặc các năm ${tk.oppZhi}) sẽ tạo xung khai bung mở kho tài, mang lại thời cơ bứt phá tài sản lớn.`;
        }
    }

    return report;
}

/**
 * Thống Kê Thập Thần Hiện Diện & Khóa Cứng Thập Thần Vắng Mặt Triệt Tiêu Ảo Giác
 */
function getActualPresentTenGodsSummary(canChi, dayCan) {
    const dayEl = stemElementMap(dayCan);
    const dayPol = STEMS_INFO[dayCan]?.polarity || 1;

    const presentGods = new Set();
    const presentStems = [];

    // Can lộ
    [canChi.year, canChi.month, canChi.hour].forEach(p => {
        if (p?.thapThanGan) {
            presentGods.add(p.thapThanGan);
            presentStems.push(`${p.gan} (${p.thapThanGan})`);
        }
    });

    // Tàng can
    [canChi.year, canChi.month, canChi.day, canChi.hour].forEach(p => {
        (p?.tangCan || []).forEach(t => {
            if (t?.thapThan) {
                presentGods.add(t.thapThan);
            }
        });
    });

    const ALL_10_GODS = ['Chính Quan', 'Thất Sát', 'Chính Ấn', 'Thiên Ấn', 'Tỷ Kiên', 'Kiếp Tài', 'Thực Thần', 'Thương Quan', 'Chính Tài', 'Thiên Tài'];
    const absentGods = ALL_10_GODS.filter(g => !presentGods.has(g));

    return `--- THỐNG KÊ THẬP THẦN THỰC TẾ TRONG NGUYÊN CỤC ---
- Thập Thần Hiện Diện (CÓ THỂ LUẬN GIẢI): [ ${Array.from(presentGods).join(' | ')} ]
- Thập Thần HOÀN TOÀN VẮNG MẶT: [ ${absentGods.join(' | ')} ]
‼️ CẢNH BÁO KỶ LUẬT TUYỆT ĐỐI CHO AI:
- TUYỆT ĐỐI KHÔNG BỊA ĐẶT các Thập Thần vắng mặt sau thành có trong nguyên cục: ${absentGods.map(g => `"${g}"`).join(', ')}.
- Nếu không có "Chính Ấn", TUYỆT ĐỐI CẤM viết "được sinh bởi Chính Ấn" (chỉ được viết Thiên Ấn).
- Nếu không có "Kiếp Tài", TUYỆT ĐỐI CẤM gán Canh Kim hay bất kỳ can nào khác là Kiếp Tài.`;
}

function getBranchRelationsRuleTable() {
    return `[HỆ THỐNG KIỂM SOÁT QUAN HỆ ĐỊA CHI NỘI BỘ]
(Chỉ dẫn tư duy ngầm cho AI - TUYỆT ĐỐI KHÔNG chép nguyên văn, KHÔNG giảng giải lý thuyết suông cho khách hàng):
1. LỤC XUNG (Chỉ có 6 cặp đối xứng trục 180 độ, ngoài 6 cặp này TUYỆT ĐỐI KHÔNG XUNG NHAU):
   - Tý - Ngọ | Sửu - Mùi | Dần - Thân | Mão - Dậu | Thìn - Tuất | Tỵ - Hợi.
   (Nhắc nhở nội bộ: Dần CHỈ xung Thân, Dần KHÔNG xung Thìn/Tuất; Thìn CHỈ xung Tuất; Tuất xung Thìn chứ KHÔNG hình Thìn).
2. KHO TÀI & XUNG KHAI MỘ KHỐ:
   - Thìn là Kho Thủy/Thổ (chỉ xung khai khi gặp Tuất).
   - Tuất là Kho Hỏa (chỉ xung khai khi gặp Thìn).
   - Sửu là Kho Kim (chỉ xung khai khi gặp Mùi).
   - Mùi là Kho Mộc (chỉ xung khai khi gặp Sửu).
3. TAM HỢP / BÁN HỢP:
   - Dần - Ngọ - Tuất (Hỏa Cục: Dần và Tuất là Bán Tam Hợp hòa hợp, KHÔNG xung hình nhau).
   - Thân - Tý - Thìn (Thủy Cục).
   - Tỵ - Dậu - Sửu (Kim Cục).
   - Hợi - Mão - Mùi (Mộc Cục).
4. TAM HÌNH & TỰ HÌNH:
   - Dần - Tỵ - Thân | Sửu - Tuất - Mùi | Tý - Mão.
   - Tự hình: Thìn hình Thìn, Ngọ hình Ngọ, Dậu hình Dậu, Hợi hình Hợi.
‼️ QUY TẮC PHÁT NGÔN CHO KHÁCH HÀNG:
- Đi thẳng vào trọng tâm vận mệnh thực tế, đưa ra lời khuyên sắc bén.
- TUYỆT ĐỐI CẤM các câu thanh minh lý thuyết như "Theo quy tắc Tử Bình chuẩn xác...", "Thìn không xung Dần, không xung Mão...", "Theo kinh điển...". Thân chủ chỉ cần biết thực tế vận mệnh của họ ra sao, không cần nghe giảng bài!`;
}

module.exports = {
    stemElementMap,
    elementNameMap,
    formatDaYunText,
    getSafetyGuidelines,
    formatDetailedBaziTimeline,
    getTenGodsLockTable,
    getBranchRelationsRuleTable,
    getMoKhoAndTaiKhoAnalysis,
    getActualPresentTenGodsSummary
};
