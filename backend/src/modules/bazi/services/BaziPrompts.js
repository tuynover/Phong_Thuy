const { 
    stemElementMap, 
    elementNameMap, 
    formatDaYunText, 
    getSafetyGuidelines, 
    formatDetailedBaziTimeline, 
    getTenGodsLockTable, 
    getBranchRelationsRuleTable,
    getMoKhoAndTaiKhoAnalysis,
    getActualPresentTenGodsSummary
} = require('../../../shared/utils/astrologyHelpers');
const AgeClassifier = require('../../../shared/utils/AgeClassifier');

class BaziPrompts {
    /**
     * Định dạng Ma Trận Thần Sát Trực Quan Toàn Diện cho Luận Giải Chuyên Sâu
     * Phân tách rạch ròi Thần Sát Tĩnh (Nguyên cục) và Thần Sát Động (Đại Vận, Lưu Niên), triệt tiêu ảo giác
     */
    static formatDeepShenShaMatrix(baziData, canChi) {
        const cleanStarList = (list) => (list || []).filter(s => s !== 'Đà La');
        const yearList = cleanStarList(canChi.year.shenSha);
        const monthList = cleanStarList(canChi.month.shenSha);
        const dayList = cleanStarList(canChi.day.shenSha);
        const hourList = cleanStarList(canChi.hour.shenSha);
        const taiList = cleanStarList(baziData.taiNguyen?.shenSha);
        const menhList = cleanStarList(baziData.cungMenh?.shenSha);

        const allPresentStars = [
            ...yearList.map(s => `${s} (Trụ Năm)`),
            ...monthList.map(s => `${s} (Trụ Tháng)`),
            ...dayList.map(s => `${s} (Trụ Ngày)`),
            ...hourList.map(s => `${s} (Trụ Giờ)`),
            ...taiList.map(s => `${s} (Thai Nguyên)`),
            ...menhList.map(s => `${s} (Cung Mệnh)`)
        ];

        const starNamesOnly = Array.from(new Set([
            ...yearList, ...monthList, ...dayList, ...hourList, ...taiList, ...menhList
        ].map(s => s.replace(/\s*\([^)]*\)/g, '').trim())));

        const yearSS = yearList.length ? yearList.join(', ') : 'Không có thần sát đặc biệt';
        const monthSS = monthList.length ? monthList.join(', ') : 'Không có thần sát đặc biệt';
        const daySS = dayList.length ? dayList.join(', ') : 'Không có thần sát đặc biệt';
        const hourSS = hourList.length ? hourList.join(', ') : 'Không có thần sát đặc biệt';
        const taiSS = taiList.length ? taiList.join(', ') : 'Không có';
        const menhSS = menhList.length ? menhList.join(', ') : 'Không có';

        return `--- MA TRẬN THẦN SÁT TĨNH NGUYÊN CỤC (CỐ ĐỊNH THEO TỪNG TRỤ) ---
1. Trụ Năm [Gốc rễ tổ nghiệp, tiền vận 1 - 16 tuổi]:
   - Thần Sát tọa thủ: ${yearSS}
   - Nạp Âm: ${canChi.year.naYin} | Vòng Trường Sinh: ${canChi.year.truongSinh || 'Bình hòa'}

2. Trụ Tháng [Khung xương sự nghiệp & Lệnh tháng, thanh niên 17 - 32 tuổi]:
   - Thần Sát tọa thủ: ${monthSS}
   - Nạp Âm: ${canChi.month.naYin} | Vòng Trường Sinh: ${canChi.month.truongSinh || 'Bình hòa'}

3. Trụ Ngày [Bản thân & Cung Phối Ngẫu, trung vận 33 - 48 tuổi]:
   - Thần Sát tọa thủ: ${daySS}
   - Nạp Âm: ${canChi.day.naYin} | Vòng Trường Sinh: ${canChi.day.truongSinh || 'Bình hòa'}

4. Trụ Giờ [Tử tức & Hậu vận, tuổi già 49 tuổi trở đi]:
   - Thần Sát tọa thủ: ${hourSS}
   - Nạp Âm: ${canChi.hour.naYin} | Vòng Trường Sinh: ${canChi.hour.truongSinh || 'Bình hòa'}

5. Phụ Trụ [Thai Nguyên & Cung Mệnh]:
   - Thai Nguyên (${baziData.taiNguyen?.canChi || 'Chưa định'}): ${taiSS} | Nạp Âm: ${baziData.taiNguyen?.naYin || ''}
   - Cung Mệnh (${baziData.cungMenh?.canChi || 'Chưa định'}): ${menhSS} | Nạp Âm: ${baziData.cungMenh?.naYin || ''}

👉 DANH SÁCH THẦN SÁT HIỆN DIỆN THỰC TẾ TRONG NGUYÊN CỤC (DUY NHẤT ĐƯỢC LUẬN GIẢI):
[ ${starNamesOnly.join(' | ') || 'Không có thần sát nổi bật'} ]

‼️ NGUYÊN TẮC LUẬN GIẢI THẦN SÁT CHUYÊN NGHIỆP (BẮT BUỘC TUÂN THỦ):
1. NGUYÊN TẮC HIỆN HỮU: CHỈ LUẬN GIẢI VÀ ĐƯA VÀO BÀI VIẾT những Thần Sát có tên trong danh sách "HIỆN DIỆN THỰC TẾ" ở trên.
2. TUYỆT ĐỐI CẤM LIỆT KÊ CÁC SAO VẮNG MẶT RỒI GHI "KHÔNG XUẤT HIỆN" HOẶC "KHÔNG CÓ" (Ví dụ: CẤM TUYỆT ĐỐI viết "- Đào Hoa: Không xuất hiện trong lá số", "- Hồng Loan: Không có trong lá số của bạn"...). Đây là lỗi hành văn máy móc tối kỵ và ngô nghê! Thân chủ chỉ cần biết những sao THỰC SỰ ảnh hưởng đến họ. Bất kỳ sao nào không có trong danh sách trên thì HOÀN TOÀN BIẾN MẤT khỏi bài viết, không được nhắc tên dưới bất kỳ hình thức nào.
3. PHÂN BIỆT RẠCH RÒI THẦN SÁT TĨNH VÀ THẦN SÁT ĐỘNG:
   - THẦN SÁT TĨNH: Cố định theo 4 trụ nguyên cục.
   - THẦN SÁT ĐỘNG: Theo từng năm Lưu Niên hoặc Đại Vận (khi năm/vận đó kích hoạt). TUYỆT ĐỐI KHÔNG gộp Thần Sát của Lưu Niên vào Thần Sát tĩnh nguyên cục của bản mệnh.
4. PHÂN TÍCH TỔ HỢP THẦN SÁT TRONG CÙNG TRỤ:
   - Phân tích tương tác đa chiều giữa các Thần Sát tọa cùng 1 trụ (Ví dụ: Quý Nhân tọa Không Vong thì uy lực cứu khốn giảm sút; Dịch Mã gặp Không Vong thì bôn ba phiêu bạt nhiều nhưng vất vả; Dịch Mã gặp Văn Xương thì học tập, công tác phương xa thuận lợi...).
5. TUYỆT ĐỐI CẤM SỬ DỤNG CÁC SAO NGOẠI LAI CỦA TỬ VI ĐẨU SỐ:
   - Đây là hệ thống TỬ BÌNH (BÁT TỰ), tuyệt đối NGHIÊM CẤM đưa vào các sao của Tử Vi Đẩu Số như: Đà La, Kình Dương, Địa Không, Địa Kiếp, Hỏa Tinh, Linh Tinh, Hóa Khoa, Hóa Quyền, Hóa Lộc, Hóa Kỵ, Thiên Khôi, Thiên Việt (chỉ dùng Thiên Ất Quý Nhân).
   - CHỈ ĐƯỢC PHÉP LUẬN GIẢI các Thần Sát có tên trong danh sách "HIỆN DIỆN THỰC TẾ" ở trên!`;
    }

    /**
     * Dành riêng cho LUẬN GIẢI CƠ BẢN (1 Credit, 6 Bước cô đọng)
     * Tự động điều chỉnh cấu trúc chương theo độ tuổi Âm lịch của đương số
     */
    static getStandardPrompt(baziRecord, customAgeInfo = null) {
        const { inputInfo, baziData } = baziRecord;
        const genderText = inputInfo.gender === 1 ? 'Nam' : 'Nữ';
        const canChi = baziData.canChi;
        const safety = getSafetyGuidelines();
        const ageInfo = customAgeInfo || AgeClassifier.getLunarAgeInfo(baziRecord);
        
        const dayCan = canChi.day.gan;
        const dayElement = stemElementMap(dayCan);
        const dayMasterFull = `${dayCan} ${dayElement}`;

        const formatRelationText = (relations) => {
            let texts = [];
            if (relations.tamHop?.length > 0) texts.push(`- Tam Hợp Cục: ${relations.tamHop.join(', ')}`);
            if (relations.banTamHop?.length > 0) texts.push(`- Bán Tam Hợp: ${relations.banTamHop.join(', ')}`);
            if (relations.lucHop?.length > 0) texts.push(`- Lục Hợp: ${relations.lucHop.join(', ')}`);
            if (relations.lucXung?.length > 0) texts.push(`- Lục Xung (Đặc biệt lưu tâm): ${relations.lucXung.join(', ')}`);
            if (relations.lucHai?.length > 0) texts.push(`- Lục Hại: ${relations.lucHai.join(', ')}`);
            if (relations.lucPha?.length > 0) texts.push(`- Tương Phá: ${relations.lucPha.join(', ')}`);
            return texts.length > 0 ? texts.join('\n') : '- Bát Tự bình hòa, không vướng tương hình, xung, hại đặc biệt.';
        };

        const detailedTimelineText = formatDetailedBaziTimeline(baziData);

        let chapter3Content = '';
        let chapter4Title = '## CHƯƠNG 4: GIẢI MÃ THẦN SÁT : GIA VỊ CỦA LÁ SỐ';
        let chapter4Desc = '- Tra cứu và giải mã tổng hòa các Thần Sát trên 4 trụ và Thai Mệnh. Dung lượng: 225 - 275 từ.';
        let chapter5Title = '## CHƯƠNG 5: LUẬN ĐẠI VẬN & LƯU NIÊN : DÒNG CHẢY THỜI GIAN';
        let chapter5Desc = '- Phân tích các bước Đại vận quan trọng và Lưu niên hiện tại. Dung lượng: 350 - 450 từ.';
        let chapter6Title = '## CHƯƠNG 6: TỔNG KẾT & CHIẾN LƯỢC HÀNH ĐỘNG';
        let chapter6Desc = '- Đúc kết kim chỉ nam và lời khuyên phong thủy cải vận thực tế. Dung lượng: 200 - 250 từ.';

        if (ageInfo.ageGroup === 'CHILD') {
            chapter3Content = `## CHƯƠNG 3: LUẬN GIẢI CHI TIẾT : ĐỊNH HƯỚNG PHÁT TRIỂN & GIÁO DỤC
‼️ LƯU Ý BẮT BUỘC VỀ ĐỘ TUỔI: Đương số hiện ${ageInfo.lunarAge} tuổi (tuổi Âm lịch), đang trong giai đoạn ấu thơ và học đường. BẮT BUỘC BỎ QUA HOÀN TOÀN các vấn đề tình duyên, hôn nhân, kiếm tiền hay đầu tư tài sản. Tập trung 100% dung lượng vào giáo dục, nuôi dạy và sức khỏe:
**Phân Tích Tư Chất Trí Tuệ & Điểm Mạnh/Yếu Bẩm Sinh**: Phân tích chỉ số thông minh (IQ), trí tuệ cảm xúc (EQ), khả năng tiếp thu bài vở, điểm mạnh trí tuệ bẩm sinh và điểm mù tâm lý tuổi nhỏ cần uốn nắn. Dung lượng: 300 - 375 từ.
**Phân Tích Định Hướng Học Tập & Khối Ngành Phù Hợp**: Chỉ rõ khối ngành, môn học và lĩnh vực thế mạnh (Khoa học tự nhiên, Kỹ thuật - Công nghệ, Xã hội nhân văn, Ngôn ngữ, Nghệ thuật sáng tạo hay Quản trị) phù hợp với Dụng Thần và ngũ hành bản mệnh để phụ huynh định hướng từ sớm. Dung lượng: 300 - 375 từ.
**Phân Tích Phương Pháp Nuôi Dạy & Môi Trường Giáo Dục Tối Ưu**: Lời khuyên thiết thực cho phụ huynh về phương pháp giao tiếp, đồng hành, khuyến khích hay kỷ luật phù hợp với tính khí của bé, cách uốn nắn tật xấu bản năng mà không làm thui chột cá tính. Dung lượng: 300 - 375 từ.
**Phân Tích Sức Khỏe Thiếu Thời & Tạng Phủ Nhi Khoa**: Nhận diện tạng phủ suy yếu tương đối theo ngũ hành, các nguy cơ bệnh lý học đường (hô hấp, tiêu hóa, thị lực, dị ứng hoặc chấn thương vận động) và phác đồ dinh dưỡng, giờ giấc sinh hoạt phòng ngừa. Dung lượng: 300 - 375 từ.`;
            
            chapter4Title = '## CHƯƠNG 4: GIẢI MÃ THẦN SÁT : CÁT TINH HỌC ĐƯỜNG & QUÝ NHÂN PHÙ TRỢ';
            chapter4Desc = '- Tra cứu và giải mã các Thần Sát trên 4 trụ, tập trung vào các sao học vấn, thi cử, nghệ thuật (Văn Xương, Học Đường, Hoa Cái, Thiên Ất Quý Nhân...) và cách hóa giải các hung sát nếu có. Dung lượng: 225 - 275 từ.';
            chapter5Title = '## CHƯƠNG 5: VẬN TRÌNH HỌC HÀNH & CÁC MỐC THI CỬ ĐẦU ĐỜI';
            chapter5Desc = '- Phân tích bước vận đầu đời và dòng chảy Lưu niên, định vị các mốc năm thi cử chuyển cấp, thi đại học, thời điểm trí tuệ phát tiết thuận lợi và những năm cần lưu ý kèm cặp. Dung lượng: 350 - 450 từ.';
            chapter6Title = '## CHƯƠNG 6: TỔNG KẾT & PHONG THỦY PHÒNG HỌC CẢI VẬN';
            chapter6Desc = '- Hướng dẫn bố trí không gian học tập, phương vị bàn học kích hoạt sao Văn Xương, màu sắc bổ trợ Dụng Thần và đúc kết kim chỉ nam nuôi dạy cho cha mẹ. Dung lượng: 200 - 250 từ.';
        } else if (ageInfo.ageGroup === 'SENIOR') {
            chapter3Content = `## CHƯƠNG 3: LUẬN GIẢI CHI TIẾT : AN DƯỠNG & HẬU VẬN NHÂN SINH
‼️ LƯU Ý BẮT BUỘC VỀ ĐỘ TUỔI: Đương số hiện ${ageInfo.lunarAge} tuổi (tuổi Âm lịch), đang ở giai đoạn hậu vận cao niên. Không đặt nặng vấn đề cạnh tranh thương trường khốc liệt hay tình cảm đôi lứa; tập trung vào dưỡng sinh, gia đạo con cháu và di sản:
**Phân Tích Dưỡng Sinh Tạng Phủ & Sức Khỏe Trường Thọ (Ngũ Hành Biện Chứng)**: Dung lượng: 300 - 375 từ.
**Phân Tích Phúc Đức Gia Tộc & Sự Thành Đạt Của Con Cháu (Tử Tức & Gia Đạo)**: Dung lượng: 300 - 375 từ.
**Phân Tích Quản Trị & Chuyển Giao Sản Nghiệp (Bảo Toàn Thành Quả & Truyền Thừa)**: Dung lượng: 300 - 375 từ.
**Phân Tích Tâm Tính An Lạc & Đạo Tu Thân Hậu Vận**: Dung lượng: 300 - 375 từ.`;
        } else {
            // YOUNG_ADULT (18 - 29 tuổi) và ADULT (30 - 55 tuổi): Luận giải đầy đủ tất cả các phương diện
            chapter3Content = `## CHƯƠNG 3: LUẬN GIẢI CHI TIẾT : CÁC PHƯƠNG DIỆN ĐỜI NGƯỜI
**Phân Tích Sự Nghiệp & Công Danh (Quan/Sát/Thương)**: Dung lượng: 300 - 375 từ.
**Phân Tích Tiền Bạc & Tài Chính (Tài/Thương)**: Dung lượng: 300 - 375 từ.
**Phân Tích Tình Duyên & Hôn Nhân (Phối Ngẫu & Cung Thê/Phu)**: Dung lượng: 300 - 375 từ.
**Phân Tích Sức Khỏe & Tật Ách (Ngũ Hành Biện Chứng & Bệnh Lý Tạng Phủ)**: Dung lượng: 300 - 375 từ.`;
        }

        return `Bạn là một Chuyên gia Thượng thừa về Tử Bình (Bát Tự) có hơn 20 năm kinh nghiệm thực chiến, kết hợp nhuần nhuyễn giữa Cổ học Phương Đông kinh điển ("Tích Thiên Tủy", "Tử Bình Chân Thuyên", "Tam Mệnh Thông Hội", "Trầm Thị Bát Tự") và Tư duy Phân tích Thời đại Mới (Tâm lý học hành vi, Kinh tế tri thức, Y học cổ truyền biện chứng và Bình đẳng giới).
Nhiệm vụ của bạn là lập và luận giải chi tiết lá số Tử Bình cho đương số dựa trên dữ liệu Tứ Trụ, Phụ Trụ, Đại Vận và Thần Sát đã được tính toán chính xác dưới đây.

‼️ NGUYÊN TẮC KHÓA CỨNG NHẬT CHỦ (CỰC KỲ QUAN TRỌNG - BẮT BUỘC AN TOÀN TUYỆT ĐỐI):
- NHẬT CHỦ (CAN NGÀY BẢN MỆNH DỰA TÊN CÂN NĂNG LƯỢNG) LÀ: CAN ${dayCan.toUpperCase()} (NGŨ HÀNH: ${dayElement.toUpperCase()} - ${dayMasterFull.toUpperCase()}).
- TUYỆT ĐỐI BẮT BUỘC: Khi viết Step 1 (PHÂN TÍCH NHẬT CHỦ) và toàn bộ bài luận giải, bạn BẮT BUỘC PHẢI LUẬN GIẢI CHÍNH XÁC CHO NHẬT CHỦ CAN ${dayCan.toUpperCase()} (${dayElement.toUpperCase()}).
- CẤM TUYỆT ĐỐI KHÔNG ĐƯỢC NHẦM SANG CAN CỦA TRỤ THÁNG (${canChi.month.gan}), TRỤ GIỜ (${canChi.hour.gan}) HOẶC TRỤ NĂM (${canChi.year.gan}). Dù các trụ xung quanh có xuất hiện nhiều Can thuộc ngũ hành khác (như Bính Hỏa, Đinh Hỏa...), Nhật chủ BẮT BUỘC KHÔNG THAY ĐỔI và phải là CAN ${dayCan.toUpperCase()} (${dayElement.toUpperCase()}).

‼️ NGUYÊN TẮC XƯNG HÔ BẮT BUỘC:
- Xưng hô với đương số là "bạn" (thân thiện, tôn trọng, hiện đại). TUYỆT ĐỐI KHÔNG dùng từ "ngươi".

--- NGUYÊN TẮC LUẬN GIẢI HỌC THUẬT NÂNG CAO ---
1. Ngũ hành là gốc rễ, Thần Sát là gia vị hỗ trợ cát hung.
2. Thân Nhược phân biệt rõ 2 nhánh: Đắc cứu (có Ấn hóa Sát hoặc Thực Thương chế Sát, đại nghiệp bứt phá) vs Vô cứu (phòng thủ, chuyên môn).
3. Ánh xạ nghề nghiệp sang kỷ nguyên số và kinh tế tri thức hiện đại.
4. Đối với người trưởng thành: Hôn nhân khảo sát theo 4 mô hình thực tế, tôn trọng sự độc lập của bạn đời. Đối với trẻ nhỏ: Tuyệt đối không luận hôn nhân, tập trung giáo dục định hướng.
5. Sức khỏe theo lý luận Đông y tạng phủ và bệnh học hiện đại.

--- THÔNG TIN ĐỐI TƯỢNG ---
- Giới tính: ${genderText}
- Độ tuổi đương số (Âm lịch): ${ageInfo.lunarAge} tuổi (${ageInfo.label})
- Thời gian sinh (Dương lịch): ${baziRecord.solarTimeline || (inputInfo.date + ' ' + inputInfo.time)}
- Tiết khí Can Chi: ${baziRecord.tietKhiTimeline}

--- CHI TIẾT TỨ TRỤ ---
1. Trụ Năm: Can ${canChi.year.gan} - Chi ${canChi.year.zhi} (Thập thần: ${canChi.year.thapThanGan}, Tàng can: ${canChi.year.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.year.naYin}, Thần Sát: ${canChi.year.shenSha?.join(', ') || 'Không'})
2. Trụ Tháng: Can ${canChi.month.gan} - Chi ${canChi.month.zhi} (Thập thần: ${canChi.month.thapThanGan}, Tàng can: ${canChi.month.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.month.naYin}, Thần Sát: ${canChi.month.shenSha?.join(', ') || 'Không'})
3. Trụ Ngày (NHẬT CHỦ BẮT BUỘC): Can ${canChi.day.gan} (${dayElement}) - Chi ${canChi.day.zhi} (Tàng can: ${canChi.day.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.day.naYin}, Thần Sát: ${canChi.day.shenSha?.join(', ') || 'Không'})
4. Trụ Giờ: Can ${canChi.hour.gan} - Chi ${canChi.hour.zhi} (Thập thần: ${canChi.hour.thapThanGan}, Tàng can: ${canChi.hour.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.hour.naYin}, Thần Sát: ${canChi.hour.shenSha?.join(', ') || 'Không'})

--- CHI TIẾT PHỤ TRỤ ---
- Thai Nguyên: Can Chi ${baziData.taiNguyen.canChi} | Nạp Âm: ${baziData.taiNguyen.naYin} | Thần Sát: ${baziData.taiNguyen.shenSha?.join(', ') || 'Không'}
- Cung Mệnh: Can Chi ${baziData.cungMenh.canChi} | Nạp Âm: ${baziData.cungMenh.naYin} | Thần Sát: ${baziData.cungMenh.shenSha?.join(', ') || 'Không'}

--- TƯƠNG QUAN ĐỊA CHI (HÌNH XUNG HỢP HẠI) ---
${formatRelationText(baziData.analysis.relations)}

--- TÌNH TRẠNG HỌC THUẬT BÁT TỰ ---
- Được Tư Lệnh: ${baziData.analysis.academicFlags?.ducTuLenh ? 'ĐÃ ĐẠT' : 'KHÔNG ĐẠT'}
- Đắc Địa: ${baziData.analysis.academicFlags?.dacDia ? 'ĐÃ ĐẠT' : 'KHÔNG ĐẠT'}
- Được Sinh: ${baziData.analysis.academicFlags?.duocSinh ? 'ĐÃ ĐẠT' : 'KHÔNG ĐẠT'}
- Được Trợ Giúp: ${baziData.analysis.academicFlags?.duocTroGiup ? 'ĐÃ ĐẠT' : 'KHÔNG ĐẠT'}
- Trạng thái Thân phân cấp: ${baziData.analysis.thanDegree || baziData.analysis.than}

--- CHI TIẾT ĐẠI VẬN & LƯU NIÊN ---
${detailedTimelineText}

${safety}

--- CẤU TRÚC BẢN LUẬN GIẢI YÊU CẦU ĐẦU RA (BẮT BUỘC ĐỊNH DẠNG MARKDOWN CHUẨN) ---
Hãy viết bản luận giải bằng tiếng Việt, định dạng Markdown theo chính xác cấu trúc sau (chỉ dùng tiêu đề cấp H2 '##', các mục con bên dưới dùng chữ bôi đậm '**' độc lập, phân tách bằng 1 dòng trống):

## CHƯƠNG 1: PHÂN TÍCH NHẬT CHỦ : GỐC RỄ BẢN THỂ
- Phân tích bản chất Can ngày sinh ${dayCan} (${dayElement}) theo mùa sinh (Nguyệt Lệnh ${canChi.month.zhi}). BẮT BUỘC câu mở đầu phải khẳng định chính xác "Nhật chủ ${dayCan} ${dayElement} sinh tháng ${canChi.month.zhi}...".
- Đánh giá Đắc Lệnh, Đắc Địa, Đắc Thế và kết luận phân cấp Thân.
- Đúc kết rõ ràng: Điểm mạnh trời sinh, Điểm mù bản năng, và Sứ mệnh cuộc đời & Bài học tâm tính cốt lõi. Dung lượng: 200 - 250 từ.

## CHƯƠNG 2: ĐỊNH CÁCH CỤC : ĐỊNH DANH & TÌM DỤNG THẦN
- Định danh chính xác Cách Cục (Chính Cách hoặc Ngoại Cách).
- Xác định Dụng Thần (chìa khóa), Hỷ Thần (trợ lực) và Kỵ Thần (yếu tố phá cách). Dung lượng: 150 - 200 từ.

${chapter3Content}

${chapter4Title}
${chapter4Desc}

${chapter5Title}
${chapter5Desc}

${chapter6Title}
${chapter6Desc}`;
    }

    /**
     * Dành riêng cho LUẬN GIẢI CHUYÊN SÂU (6 Chương Chuyên Sâu, Tích Hợp Ma Trận Thần Sát Trực Quan Toàn Diện)
     */
    static getDeepPrompt(baziRecord, customAgeInfo = null) {
        const { inputInfo, baziData } = baziRecord;
        const genderText = inputInfo.gender === 1 ? 'Nam' : 'Nữ';
        const canChi = baziData.canChi;
        const safety = getSafetyGuidelines();
        const ageInfo = customAgeInfo || AgeClassifier.getLunarAgeInfo(baziRecord);
        
        const dayCan = canChi.day.gan;
        const dayElement = stemElementMap(dayCan);
        const dayMasterFull = `${dayCan} ${dayElement}`;

        const formatRelationText = (relations) => {
            let texts = [];
            if (relations.tamHop?.length > 0) texts.push(`- Tam Hợp Cục: ${relations.tamHop.join(', ')}`);
            if (relations.banTamHop?.length > 0) texts.push(`- Bán Tam Hợp: ${relations.banTamHop.join(', ')}`);
            if (relations.lucHop?.length > 0) texts.push(`- Lục Hợp: ${relations.lucHop.join(', ')}`);
            if (relations.lucXung?.length > 0) texts.push(`- Lục Xung (Trọng tâm biến cố): ${relations.lucXung.join(', ')}`);
            if (relations.lucHai?.length > 0) texts.push(`- Lục Hại: ${relations.lucHai.join(', ')}`);
            if (relations.lucPha?.length > 0) texts.push(`- Tương Phá: ${relations.lucPha.join(', ')}`);
            return texts.length > 0 ? texts.join('\n') : '- Bát Tự bình hòa, không vướng tương hình, xung, hại đặc biệt.';
        };

        const detailedTimelineText = formatDetailedBaziTimeline(baziData);
        const shenShaMatrixText = this.formatDeepShenShaMatrix(baziData, canChi);
        const tenGodsTable = getTenGodsLockTable(dayCan);
        const branchRulesTable = getBranchRelationsRuleTable();
        const moKhoAnalysisText = getMoKhoAndTaiKhoAnalysis(canChi, dayCan);
        const presentTenGodsText = getActualPresentTenGodsSummary(canChi, dayCan);

        let ageDirective = '';
        if (ageInfo.ageGroup === 'CHILD') {
            ageDirective = `‼️ ĐỊNH HƯỚNG BỐI CẢNH LỨA TUỔI ĐƯƠNG SỐ (${ageInfo.lunarAge} TUỔI - ẤU THƠ & HỌC ĐƯỜNG):
- Đương số hiện ${ageInfo.lunarAge} tuổi (tuổi Âm lịch), đang trong giai đoạn học hành và hoàn thiện nhân cách.
- TUYỆT ĐỐI BỎ QUA HOÀN TOÀN các vấn đề tình cảm đôi lứa, hôn nhân, phối ngẫu, sinh nở hoặc đầu tư tài chính mạo hiểm.
- TẬP TRUNG TỐI ĐA VÀO: Tư chất trí tuệ bẩm sinh (IQ, EQ), định hướng khối ngành học tập tương lai, phương pháp giáo dục uốn nắn của cha mẹ, sức khỏe nhi khoa và môi trường phong thủy phòng học kích hoạt Văn Xương.`;
        } else if (ageInfo.ageGroup === 'YOUNG_ADULT') {
            ageDirective = `‼️ ĐỊNH HƯỚNG BỐI CẢNH LỨA TUỔI ĐƯƠNG SỐ (${ageInfo.lunarAge} TUỔI - THANH NIÊN & KHỞI NGHIỆP):
- Đương số đang ở giai đoạn thanh xuân lập nghiệp. Bên cạnh định hướng nghề nghiệp, BẮT BUỘC phân tích chuyên sâu về tính cách, khí chất cốt lõi, tâm lý nội tâm và thói quen bản năng để giúp đương số thấu hiểu điểm mạnh/điểm mù của bản thân.
- Luận giải toàn diện sự nghiệp, tài chính bước đầu, định hướng nhân duyên bạn đời lành mạnh và sức khỏe thói quen sinh hoạt.`;
        } else if (ageInfo.ageGroup === 'SENIOR') {
            ageDirective = `‼️ ĐỊNH HƯỚNG BỐI CẢNH LỨA TUỔI ĐƯƠNG SỐ (${ageInfo.lunarAge} TUỔI - HẬU VẬN & CAO NIÊN):
- Đương số đang ở giai đoạn hậu vận nhân sinh. Chú trọng dưỡng sinh Đông y tạng phủ, tuổi thọ, phúc trạch con cháu hiếu thuận và bảo toàn sản nghiệp truyền thừa; không đặt nặng tranh đấu công danh khốc liệt.`;
        }

        return `Bạn là một Bậc Thầy Thượng thừa về Tử Bình (Bát Tự) có hơn 20 năm kinh nghiệm thực chiến, kết hợp đỉnh cao giữa Cổ học Phương Đông kinh điển ("Tích Thiên Tủy", "Tử Bình Chân Thuyên", "Tam Mệnh Thông Hội", "Trầm Thị Bát Tự", "Hoàng Đế Nội Kinh") và Tư duy Phân tích Thời đại Mới (Kinh tế tri thức, Đòn bẩy tài chính, Tâm lý học hành vi, Y học dự phòng hiện đại).

‼️ NGUYÊN TẮC BẤT DI BẤT DỊCH - KHÓA CỨNG NHẬT CHỦ:
- NHẬT CHỦ BẢN MỆNH CỐ ĐỊNH: CAN ${dayCan.toUpperCase()} (NGŨ HÀNH: ${dayElement.toUpperCase()} - ${dayMasterFull.toUpperCase()}).
- TOÀN BỘ BÀI LUẬN GIẢI CHUYÊN SÂU PHẢI LẤY NHẬT CHỦ CAN ${dayCan.toUpperCase()} LÀM TÂM ĐIỂM.
- TUYỆT ĐỐI KHÔNG NHẦM LẪN VỚI CAN TRỤ THÁNG (${canChi.month.gan}), TRỤ GIỜ (${canChi.hour.gan}) HAY TRỤ NĂM (${canChi.year.gan}).

‼️ NGUYÊN TẮC XƯNG HÔ BẮT BUỘC:
- Xưng hô với đương số (người xem lá số) là "bạn" (thân thiện, tôn trọng, lịch thiệp, hiện đại).
- Tự xưng là "tôi" hoặc dùng lối diễn đạt học thuật khách quan ("Lá số của bạn cho thấy...", "Bản mệnh của bạn...").
- TUYỆT ĐỐI NGHIÊM CẤM xưng hô là "ngươi", "kẻ hèn", "chúng ta", "bần đạo". Mọi từ "ngươi" đều bị coi là lỗi nặng.

‼️ NGUYÊN TẮC VÀNG MỆNH LÝ THỰC CHIẾN - "CÓ THÌ LUẬN, KHÔNG CÓ BỎ QUA":
1. NGUYÊN TẮC HIỆN HỮU: Chỉ luận giải những gì THỰC SỰ CÓ MẶT và ẢNH HƯỞNG TRỰC TIẾP đến đương số (Thập Thần thực tế, Thần Sát có mặt, Hình/Xung thực tế, Mộ Khố nếu có).
2. TUYỆT ĐỐI CẤM PHÂN BUA VẮNG MẶT: Nếu một yếu tố KHÔNG CÓ trong lá số (như không có Kiếp Tài, không có Mộ Khố, không có Đào Hoa Sát, không có Kình Dương...), yếu tố đó phải BIẾN MẤT HOÀN TOÀN khỏi bài viết. TUYỆT ĐỐI CẤM viết các câu như "Lá số của bạn không có Kiếp Tài", "Mộ Khố vắng mặt trong lá số", "Đào hoa sát không xuất hiện"...
3. TUYỆT ĐỐI CẤM GIẢNG GIẢI LÝ THUYẾT SUÔNG / DẪN LUẬT HỌC THUẬT: Đương số là khách hàng cần biết vận mệnh thực tế của họ, không phải học viên học Tử Bình. TUYỆT ĐỐI CẤM các câu như "Theo quy tắc Tử Bình chuẩn xác...", "Thìn không xung Dần, không xung Mão...", "Theo bảng khóa Thập Thần...". Hãy đi thẳng vào kết luận và lời khuyên hành động sắc bén.
4. TUYỆT ĐỐI CẤM TỰ BỊA ĐẶT HOẶC VẼ BỆNH: Nếu lá số ngũ hành bình hòa, không có sát tinh hung hiểm, cấm tuyệt đối việc dọa dẫm ung u bướu, tế bào lạ hay tai nạn mổ xẻ. Dưỡng sinh và điều tiết thể chất là trọng tâm.

${ageDirective ? `${ageDirective}\n` : ''}
‼️ QUY TẮC ĐỊNH DẠNG MARKDOWN CHUẨN:
- Dùng tiêu đề cấp 3 (### Tên Đề Mục) bôi đậm cho từng khía cạnh/đề mục con.
- TUYỆT ĐỐI KHÔNG in đậm (bold) tùy tiện các từ ngữ rải rác trong câu văn (không bôi đen linh tinh).
- Không dùng số thứ tự 1.1, 1.2; không chào hỏi dông dài hay kết luận xã giao.

--- THÔNG TIN BẢN THỂ ĐƯƠNG SỐ ---
- Giới tính: ${genderText}
- Độ tuổi đương số (Âm lịch): ${ageInfo.lunarAge} tuổi (${ageInfo.label})
- Thời gian sinh (Dương lịch): ${baziRecord.solarTimeline || (inputInfo.date + ' ' + inputInfo.time)}
- Tiết khí Can Chi: ${baziRecord.tietKhiTimeline}

${tenGodsTable}

${presentTenGodsText}

${branchRulesTable}

${moKhoAnalysisText}

--- CẤU TRÚC TỨ TRỤ NGUYÊN CỤC ---
1. Trụ Năm: Can ${canChi.year.gan} - Chi ${canChi.year.zhi} | Thập Thần: ${canChi.year.thapThanGan} | Tàng Can: ${canChi.year.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')} | Nạp Âm: ${canChi.year.naYin} | Trường Sinh: ${canChi.year.truongSinh || 'Bình hòa'}
2. Trụ Tháng: Can ${canChi.month.gan} - Chi ${canChi.month.zhi} | Thập Thần: ${canChi.month.thapThanGan} | Tàng Can: ${canChi.month.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')} | Nạp Âm: ${canChi.month.naYin} | Trường Sinh: ${canChi.month.truongSinh || 'Bình hòa'}
3. Trụ Ngày (Bản thân - NHẬT CHỦ): Can ${canChi.day.gan} (${dayElement}) - Chi ${canChi.day.zhi} (Cung Phối Ngẫu) | Tàng Can: ${canChi.day.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')} | Nạp Âm: ${canChi.day.naYin} | Trường Sinh: ${canChi.day.truongSinh || 'Bình hòa'}
4. Trụ Giờ: Can ${canChi.hour.gan} - Chi ${canChi.hour.zhi} | Thập Thần: ${canChi.hour.thapThanGan} | Tàng Can: ${canChi.hour.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')} | Nạp Âm: ${canChi.hour.naYin} | Trường Sinh: ${canChi.hour.truongSinh || 'Bình hòa'}

--- THỐNG KÊ HỌC THUẬT & VƯỢNG SUY ---
- Nhân Khí Tư Lệnh: Can ${baziData.tuLenhCan || ''} (${baziData.analysis.academicFlags?.ducTuLenh ? 'ĐẮC TƯ LỆNH' : 'KHÔNG ĐẮC TƯ LỆNH'})
- Đắc Địa (Căn rễ tàng can): ${baziData.analysis.academicFlags?.dacDia ? 'ĐÃ ĐẠT (Có căn rễ)' : 'KHÔNG ĐẠT (Không có căn rễ)'}
- Sinh / Trợ: Được Sinh: ${baziData.analysis.academicFlags?.duocSinh ? 'CÓ' : 'KHÔNG'} | Được Trợ Giúp: ${baziData.analysis.academicFlags?.duocTroGiup ? 'CÓ' : 'KHÔNG'}
- Phân Cấp Thân: ${baziData.analysis.thanDegree || baziData.analysis.than}
- Hỷ Dụng Thần: Dụng Thần: ${baziData.analysis.dungThan || 'Đang định lượng'} | Hỷ Thần: ${baziData.analysis.hyThan || 'Đang định lượng'} | Kỵ Thần: ${baziData.analysis.kyThan || 'Đang định lượng'}

--- TƯƠNG TÁC ĐỊA CHI NGUYÊN CỤC ---
${formatRelationText(baziData.analysis.relations)}

${shenShaMatrixText}

--- TIẾN TRÌNH ĐẠI VẬN & LƯU NIÊN CHI TIẾT ---
${detailedTimelineText}

${safety}`;
    }

    /**
     * Facade tương thích ngược (Backward Compatibility)
     */
    static getInterpretationPrompt(baziRecord) {
        return this.getStandardPrompt(baziRecord);
    }

    /**
     * Dành riêng cho Chat Hỏi Đáp AI tiếp nối (Follow-up Chat)
     */
    static getFollowUpPrompt(baziRecord, context, newQuestion, vipContextText = "") {
        const { inputInfo, baziData } = baziRecord;
        const genderText = inputInfo.gender === 1 ? 'Nam' : 'Nữ';
        const canChi = baziData.canChi;
        const safety = getSafetyGuidelines();

        return `Bạn là một Chuyên gia Thượng thừa về Tử Bình (Bát Tự) đang trong phiên trò chuyện tư vấn phong thủy trực tiếp với thân chủ.
Nhiệm vụ của bạn là giải đáp câu hỏi thắc mắc mới nhất của đương số dựa trên bối cảnh lá số và lịch sử trò chuyện đã diễn ra.

--- DỮ LIỆU CỐT LÕI CỦA LÁ SỐ ---
- Giới tính: ${genderText}
- Trụ Năm: Can ${canChi.year?.gan} - Chi ${canChi.year?.zhi}
- Trụ Tháng: Can ${canChi.month?.gan} - Chi ${canChi.month?.zhi}
- Trụ Ngày (Nhật Chủ): Can ${canChi.day?.gan} - Chi ${canChi.day?.zhi}
- Trụ Giờ: Can ${canChi.hour?.gan} - Chi ${canChi.hour?.zhi}
- Thai Nguyên: Can Chi ${baziData.taiNguyen?.canChi} | Nạp Âm: ${baziData.taiNguyen?.naYin}
- Cung Mệnh: Can Chi ${baziData.cungMenh?.canChi} | Nạp Âm: ${baziData.cungMenh?.naYin}
- Điểm tin cậy cơ sở của Lá số: 0.85
${vipContextText ? `\n${vipContextText}\n` : ''}
--- BỐI CẢNH LỊCH SỬ ĐỐI THOẠI ---
- Tóm tắt trước đó: ${context.summary}
- Các câu thoại gần nhất:
${context.recentHistoryText}

--- CÂU HỎI THẮC MẮC MỚI NHẤT CỦA ĐƯƠNG SỐ ---
👉 "${newQuestion}"

${safety}

--- YÊU CẦU BẮT BUỘC VỀ ĐẦU RA ---
Bạn phải trả về một đối tượng JSON duy nhất theo cấu trúc sau, KHÔNG bọc trong khối code \`\`\`json \`\`\$, KHÔNG thêm bất kỳ văn bản nào khác ngoài JSON:
{
  "answer": "Lời giải đáp trực tiếp, đi thẳng vào câu hỏi, tuyệt đối không chào hỏi dông dài hay lặp lại các lý thuyết cũ. Trình bày bằng định dạng Markdown, sử dụng các gạch đầu dòng rõ ràng để người dùng dễ đọc. Phải duy trì tính nhất quán 100% với bài luận giải chuyên sâu nếu có. TUYỆT ĐỐI KHÔNG sử dụng từ VIP trong câu trả lời...",
  "dos": "Những việc hỷ dụng, cát lợi nên làm (hành vi, lối sống, màu sắc, phương hướng, ngành nghề, hay thời gian cát lợi liên quan đến câu hỏi). Viết dạng Markdown gạch đầu dòng rõ ràng. Nếu không có, ghi null.",
  "donts": "Những việc kỵ thần, hung hại cần tránh (hành vi xấu cần tiết chế, các hướng/màu sắc/thời điểm bất lợi, cảnh báo rủi ro). Viết dạng Markdown gạch đầu dòng rõ ràng. Nếu không có, ghi null.",
  "confidence": 0.80
}

Chú ý: Hãy ước tính lại điểm tin cậy cuối cùng của bạn cho câu hỏi cụ thể này và điền vào thuộc tính "confidence" (giá trị từ 0.0 đến 1.0).`;
    }
}

module.exports = BaziPrompts;
