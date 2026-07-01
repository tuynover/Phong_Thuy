const { elementNameMap, formatDaYunText, getSafetyGuidelines } = require('../shared/utils/astrologyHelpers');

class MarriagePrompts {
    static getInterpretationPrompt(marriageRecord) {
        const { inputInfo, maleBaziData, femaleBaziData } = marriageRecord;
        const safety = getSafetyGuidelines();

        const formatPillarsInfo = (baziData) => {
            const canChi = baziData.canChi;
            return `
1. Trụ Năm (Căn cơ, Tổ nghiệp): Can ${canChi.year.gan} - Chi ${canChi.year.zhi} (Thập thần: ${canChi.year.thapThanGan}, Tàng can: ${canChi.year.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.year.naYin})
2. Trụ Tháng (Anh em, Lệnh tháng): Can ${canChi.month.gan} - Chi ${canChi.month.zhi} (Thập thần: ${canChi.month.thapThanGan}, Tàng can: ${canChi.month.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.month.naYin})
3. Trụ Ngày (Bản thân, Nhật Chủ): Can ${canChi.day.gan} (Nhật Chủ) - Chi ${canChi.day.zhi} (Cung Phu Thê, Tàng can: ${canChi.day.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.day.naYin})
4. Trụ Giờ (Con cái, Hậu vận): Can ${canChi.hour.gan} - Chi ${canChi.hour.zhi} (Thập thần: ${canChi.hour.thapThanGan}, Tàng can: ${canChi.hour.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.hour.naYin})
`;
        };

        const formatNguHanhInfo = (nguHanh) => {
            return Object.entries(nguHanh).map(([k, v]) => `${elementNameMap(k)}: ${v}%`).join(', ');
        };

        const malePillars = formatPillarsInfo(maleBaziData);
        const femalePillars = formatPillarsInfo(femaleBaziData);

        const maleNguHanhText = formatNguHanhInfo(maleBaziData.nguHanh);
        const femaleNguHanhText = formatNguHanhInfo(femaleBaziData.nguHanh);

        const maleDaYunText = formatDaYunText(maleBaziData.daYun);
        const femaleDaYunText = formatDaYunText(femaleBaziData.daYun);

        const maleCungPhi = maleBaziData.menhQuai ? `${maleBaziData.menhQuai.cung} (${maleBaziData.menhQuai.element} - ${maleBaziData.menhQuai.group})` : 'Chưa rõ';
        const femaleCungPhi = femaleBaziData.menhQuai ? `${femaleBaziData.menhQuai.cung} (${femaleBaziData.menhQuai.element} - ${femaleBaziData.menhQuai.group})` : 'Chưa rõ';

        return `Bạn là một bậc thầy luận giải Tử Bình Bát Tự và Phong Thủy Bát Trạch với hơn 20 năm kinh nghiệm thực chiến.
Nhiệm vụ của bạn là luận giải chi tiết sự hòa hợp hôn nhân (Bát Tự Hợp Hôn) giữa hai đương số dựa trên dữ liệu Tứ Trụ đã được tính toán chính xác dưới đây.

LƯU Ý QUAN TRỌNG: 
- Nói thẳng, nói thật, có gì nói đó. Tuyệt đối không nói giảm nói tránh các xung khắc nguy hiểm, nguy cơ ly tán, tai ách, bệnh tật hoặc bế tắc kinh tế.
- Tập trung hoàn toàn vào các khía cạnh liên quan đến hôn nhân, con cái, tài lộc gia đạo. Không đi lan man vào phân tích chi tiết tính cách hay cuộc đời đơn lẻ của từng người.
- Sử dụng giọng văn trang trọng, cổ kính, giàu tính học thuật mệnh lý nhưng rõ ràng, đanh thép.

--- DỮ LIỆU TỨ TRỤ NAM MỆNH (CHỒNG) ---
- Ngày sinh Dương lịch: ${inputInfo.male.date} ${inputInfo.male.time}
- Can Chi Tứ Trụ: ${malePillars}
- Nạp Âm Bản Mệnh: ${maleBaziData.canChi.day.naYin}
- Cung Phi (Mệnh Quái): ${maleCungPhi}
- Phân bổ ngũ hành: ${maleNguHanhText}
- Dụng Thần: ${elementNameMap(maleBaziData.dungThan)} | Kỵ Thần: ${elementNameMap(maleBaziData.kyThan)}
- Đại Vận Cuộc Đời:
${maleDaYunText}

--- DỮ LIỆU TỨ TRỤ NỮ MỆNH (VỢ) ---
- Ngày sinh Dương lịch: ${inputInfo.female.date} ${inputInfo.female.time}
- Can Chi Tứ Trụ: ${femalePillars}
- Nạp Âm Bản Mệnh: ${femaleBaziData.canChi.day.naYin}
- Cung Phi (Mệnh Quái): ${femaleCungPhi}
- Phân bổ ngũ hành: ${femaleNguHanhText}
- Dụng Thần: ${elementNameMap(femaleBaziData.dungThan)} | Kỵ Thần: ${elementNameMap(femaleBaziData.kyThan)}
- Đại Vận Cuộc Đời:
${femaleDaYunText}

BẮT BUỘC: Bạn phải phân tích chi tiết sự tương tác của hai lá số qua chính xác 8 khía cạnh sau (sử dụng tiêu đề cấp H2 '##', các mục nhỏ bên trong bôi đậm '**', không sử dụng tiêu đề H3 '###'):
- Mỗi mục con hoặc mỗi khía cạnh phải cách nhau ít nhất một dòng trống để đảm bảo hiển thị Markdown chuẩn xác và đẹp mắt.
- Không ghi chữ "Khía cạnh" trong tiêu đề.

## 1. CUNG PHI BÁT TỰ (CUNG MỆNH)
- Tự tính toán sự kết hợp Cung Phi của Nam (${maleCungPhi}) và Nữ (${femaleCungPhi}) để xác định quẻ biến thuộc nhóm cát (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) hay nhóm hung (Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại).
- Đánh giá cụ thể cát hung của sự kết hợp này đối với gia vận và cuộc sống hôn nhân.
- Khống chế độ dài: 200 - 250 từ.

## 2. TƯƠNG HỢP NHẬT CAN (TÌNH CẢM & THẾ GIỚI QUAN)
- Phân tích tương tác giữa Nhật Can của chồng (${maleBaziData.canChi.day.gan}) và vợ (${femaleBaziData.canChi.day.gan}).
- Đánh giá xem thuộc nhóm Thiên Can Ngũ Hợp (Giáp-Kỷ hóa Thổ, Ất-Canh hóa Kim, Bính-Tân hóa Thủy, Đinh-Nhâm hóa Mộc, Mậu-Quý hóa Hỏa) hay Tương Xung (Giáp-Canh, Ất-Tân, Bính-Nhâm, Đinh-Quý) hoặc Bình hòa/Tương sinh để chỉ rõ mức độ hòa hợp tư tưởng, thế giới quan.
- Khống chế độ dài: 200 - 250 từ.

## 3. SỰ BÌNH ỔN CỦA NHẬT CHI (CUNG PHU THÊ)
- Xét tương quan giữa Nhật Chi (Cung Phu Thê) của chồng (${maleBaziData.canChi.day.zhi}) và vợ (${femaleBaziData.canChi.day.zhi}).
- Đánh giá xem hai chi ngày có nằm trong mối quan hệ Tam Hợp/Lục Hợp (nền móng bền vững) hay Lục Xung/Lục Hại (nền móng rung lắc dữ dội) hay không. Chỉ rõ nếu bản thân Nhật Chi của một bên đã bị hình xung sẵn trong lá số của chính họ.
- Khống chế độ dài: 200 - 250 từ.

## 4. DỤNG THẦN TƯƠNG TẾ (ĐỘ BÙ TRỪ NGŨ HÀNH)
- Đối chiếu vượng suy ngũ hành. Xem lá số người này có bù đắp được khuyết thiếu (Dụng Thần) của người kia và ngược lại không (Thế bù trừ năng lượng), hay cùng bị một loại bệnh ngũ hành (cùng cực vượng Hỏa gây bế tắc tài lộc và nóng nảy).
- Khống chế độ dài: 200 - 250 từ.

## 5. THẦN SÁT HÌNH KHẮC & HÓA GIẢI RỦI RO
Phân tích chi tiết qua 3 mục con độc lập, ngăn cách nhau bằng dòng trống:

**Nam mệnh (Xem Thê Tinh - Sao Vợ)**: Đánh giá thế cục Kiếp Tài có khắc thê tinh (Tài tinh) gây bất hòa, tiêu hoang phá sản hay vợ đau ốm liên miên không. Khống chế: 150 - 200 từ.

**Nữ mệnh (Xem Phu Tinh - Sao Chồng)**: Đánh giá thế cục Thương Quan có khắc phu tinh (Quan/Sát tinh) dẫn đến xung khắc, lấn át chồng hoặc dễ chịu cảnh cô độc không. Khống chế: 150 - 200 từ.

**Thần sát chuyên biệt**: Xét tầm ảnh hưởng của các sao hình khắc, cô độc, trắc trở (Cô Thần, Quả Tú, Âm Dương Sai Thác, Hồng Diễm Sát) nếu có trên 2 lá số để tìm cách hóa giải. Khống chế: 150 - 200 từ.

## 6. SỰ ĐỒNG ĐIỆU CỦA ĐẠI VẬN
- Đối chiếu hai trục Đại vận 10 năm của vợ chồng. Đánh giá xem hai người có cùng bước vào cát vận (thịnh vượng nhanh chóng), một người gánh một người, hay cùng đi xuống suy vận (dễ lâm vào biến cố tài chính, ly tán).
- Khống chế độ dài: 200 - 250 từ.

## 7. TRỤ NĂM VÀ TRỤ THÁNG (GIA ĐẠO & GỐC RỄ XÃ HỘI)
- Phân tích tương tác giữa Trụ Năm hai bên (họ hàng, tổ tiên chúc phúc hay phản đối) và Trụ Tháng hai bên (môi trường xã hội, công việc, anh em hòa thuận hay mâu thuẫn).
- Khống chế độ dài: 200 - 250 từ.

## 8. CUNG CON CÁI (TRỤ GIỜ)
- Đánh giá tương tác giữa Trụ Giờ của chồng (${maleBaziData.canChi.hour.zhi}) và vợ (${femaleBaziData.canChi.hour.zhi}).
- Có bị xung phá trực tiếp (Lục xung trụ giờ gây hiếm muộn, khó sinh, khó nuôi) hay tương sinh hòa hợp. Có chứa Hỷ/Dụng thần giúp sinh con vượng khí cho cha mẹ hay không.
- Khống chế độ dài: 200 - 250 từ.

## 9. KẾT LUẬN & BIỆN PHÁP HÓA GIẢI XUNG KHẮC
- Đưa ra điểm số tương thích tổng quan (thang điểm 10).
- Tổng kết các điểm xung khắc nghiêm trọng nhất.
- Đưa ra biện pháp hóa giải cụ thể (chọn năm sinh con làm cầu nối, bài trí phương vị phong thủy nhà ở, màu sắc tương hỗ hoặc điều chỉnh hành vi).

${safety}
`;
    }
}

module.exports = MarriagePrompts;
