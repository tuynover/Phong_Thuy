const { elementNameMap, formatDaYunText, getSafetyGuidelines, formatDetailedBaziTimeline } = require('../shared/utils/astrologyHelpers');

class BaziPrompts {
    static getInterpretationPrompt(baziRecord) {
        const { inputInfo, baziData } = baziRecord;
        const genderText = inputInfo.gender === 1 ? 'Nam' : 'Nữ';
        const canChi = baziData.canChi;
        const safety = getSafetyGuidelines();

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

        const formatDungThanSuggestion = (baziData) => {
            const info = baziData.dungThanInfo || baziData.analysis?.dungThanInfo;
            if (!info || !info.primary) return '- Gợi ý Dụng Thần: Đang được AI luận giải theo nguyên lý ngũ hành sinh khắc.';

            let lines = [];
            lines.push(`- Gợi ý Dụng Thần Ưu Tiên 1 (Rule Engine): Dụng Thần [${info.primary.dungThan}], Hỷ Thần [${info.primary.hyThan}], Kỵ Thần [${info.primary.kyThan}]`);
            lines.push(`  + Cơ chế áp dụng: ${info.primary.mechanism} (Độ tin cậy: ${(info.primary.confidence * 100).toFixed(0)}%)`);
            lines.push(`  + Căn nguyên học thuật: ${info.primary.rationale}`);

            if (info.climateState?.idealElement) {
                lines.push(`  + Đánh giá Điều Hậu (${info.climateState.season}): Khí lý tưởng [${info.climateState.idealElement}] - ${info.climateState.inherentSupport} (Mức độ cấp thiết: ${info.climateState.urgency})`);
            }

            if (info.mediationState?.isConflict) {
                lines.push(`  + Đánh giá Thông Quan: ${info.mediationState.description} -> Khí cầu nối [${info.mediationState.mediator}]`);
            }

            if (info.scenarios?.length > 1) {
                lines.push(`  + Kịch bản Biến cách / Dự phòng từ Rule Engine:`);
                info.scenarios.slice(1).forEach((sc, idx) => {
                    lines.push(`    * Kịch bản ${idx + 1} (${sc.name}): Dụng [${sc.dungThan}], Hỷ [${sc.hyThan}], Kỵ [${sc.kyThan}] (Điểm: ${sc.score}/100)`);
                });
            }

            lines.push(`  * HƯỚNG DẪN BIỆN CHỨNG DÀNH CHO AI: Sử dụng gợi ý từ Rule Engine làm cơ sở đối chiếu vững chắc. Bạn hãy phối hợp toàn diện với sự thấu lộ của Thập Thần, vòng Trường Sinh, và tương tác Hợp/Hóa trên Tứ Trụ để chốt Dụng Thần tối ưu nhất. Nếu phát hiện lá số thuộc trường hợp Biến cách / Giả tòng đặc thù khác với gợi ý chính, bạn hoàn toàn có quyền biện chứng và giải thích rõ ràng căn nguyên.`);

            return lines.join('\n');
        };

        const formatDangerousShenShaAndHarshPatterns = (baziData) => {
            const dangerList = [
                'Thiên La', 'Địa Võng', 'Tai Sát', 'Đào Hoa Kiếp', 'Đào Hoa Sát',
                'Dương Nhận', 'Kình Dương', 'Kiếp Sát', 'Vong Thần', 'Cô Thần',
                'Quả Tú', 'Tuyệt Mệnh', 'Phá Toái', 'Âm Dương Sát', 'Đại Hao',
                'Huyết Chi', 'Tang Môn', 'Điếu Khách', 'Bạch Hổ', 'Phù Trầm'
            ];
            
            const foundDangers = [];
            const collectShenSha = (pillarName, list) => {
                if (!Array.isArray(list)) return;
                list.forEach(s => {
                    if (dangerList.some(d => s.includes(d))) {
                        foundDangers.push(`+ Trụ ${pillarName}: [${s}]`);
                    }
                });
            };

            collectShenSha('Năm', baziData.canChi?.year?.shenSha);
            collectShenSha('Tháng', baziData.canChi?.month?.shenSha);
            collectShenSha('Ngày', baziData.canChi?.day?.shenSha);
            collectShenSha('Giờ', baziData.canChi?.hour?.shenSha);
            collectShenSha('Thai Nguyên', baziData.taiNguyen?.shenSha);
            collectShenSha('Cung Mệnh', baziData.cungMenh?.shenSha);

            let res = [];
            if (foundDangers.length > 0) {
                res.push(`- DANH SÁCH THẦN SÁT HUNG HIỂM PHÁT HIỆN TẠI TỨ TRỤ & PHỤ TRỤ:`);
                res.push(foundDangers.join('\n'));
            } else {
                res.push(`- Thần Sát Hung Hiểm: Tứ Trụ không vướng các thần sát đại hung.`);
            }

            return res.join('\n');
        };

        const detailedTimelineText = formatDetailedBaziTimeline(baziData);

        return `Bạn là một Chuyên gia Thượng thừa về Tử Bình (Bát Tự) có hơn 20 năm kinh nghiệm thực chiến, kết hợp nhuần nhuyễn giữa Cổ học Phương Đông kinh điển ("Tích Thiên Tủy", "Tử Bình Chân Thuyên", "Tam Mệnh Thông Hội", "Trầm Thị Bát Tự") và Tư duy Phân tích Thời đại Mới (Tâm lý học hành vi, Kinh tế tri thức, Y học cổ truyền biện chứng và Bình đẳng giới).
Nhiệm vụ của bạn là lập và luận giải chi tiết lá số Tử Bình cho đương số dựa trên dữ liệu Tứ Trụ, Phụ Trụ, Đại Vận và Thần Sát đã được tính toán chính xác dưới đây.

BẮT BUỘC: Từ tất cả dữ liệu Tứ Trụ, Phụ Trụ, Đại Vận, Lưu Niên tĩnh động và trạng thái học thuật đã được cung cấp dưới đây, bạn phải phối hợp và kết hợp toàn diện tất cả các yếu tố lại với nhau để đưa ra luận đoán thật logic, nhất quán và biện chứng học thuật sâu sắc. Không phân tích các yếu tố rời rạc mà phải đặt chúng trong một hệ thống tương tác tổng hòa.

--- NGUYÊN TẮC LUẬN GIẢI HỌC THUẬT CHUYÊN SÂU NÂNG CAO ---

1. CHỈ DẪN TRỰC DIỆN & KHÔNG KIÊNG KỴ (DIRECT DIAGNOSTIC DIRECTIVE):
   - Tuyệt đối KHÔNG dùng văn phong an ủi, vuốt ve, né tránh hay dùng từ ngữ giảm nhẹ (euphemism) làm lu mờ sự thật khi phát hiện các cấu trúc cách cục nguy hiểm:
     * **Tứ Khố Xung Phá Tài / Tỷ Kiếp Đoạt Tài Cực Thịnh**: Phải cảnh báo thẳng thừng về nguy cơ bần cùng, tán gia bại sản, cờ bạc phá nghiệp, nợ nần lưu vong hoặc rơi vào cảnh khốn khó làm thuê làm mướn cả đời. Không né tránh thành "nên thận trọng đầu tư".
     * **Thất Sát Vô Chế / Thương Quan Kiến Quan / Tam Hình Dần-Thân-Tỵ, Sửu-Mùi-Tuất**: Phải chỉ rõ nguy cơ vướng vòng lao lý, ngục tù hình án, bị khởi tố, sụp đổ địa vị hoặc sa vào con đường phạm pháp phi mạo hiểm.
     * **Dương Nhận Trùng Điệp / Kim Mộc Giao Chiến Hung Bạo**: Phải cảnh báo nguy cơ đổ máu, tai nạn xe cộ, thương tật thân thể tàn phế, phẫu thuật nguy hiểm, hoặc bạo lực sát thân.
     * **Tuyệt Tự Cung / Chi Giờ Tử Tuyệt / Hỏa Diễm Thủy Khô**: Phải cảnh báo thẳng nguy cơ vô sinh hiếm muộn, tuyệt tự không con nối dõi, hoặc con cái bất hiếu làm liên lụy gia sản.
     * **Khuyết Hỏa Cực Hàn Mùa Đông / Hỏa Vượng Thiêu Kim Mộc**: Phải cảnh báo thẳng nguy cơ bệnh hiểm nghèo nan y (ung thư, bại liệt vận động, tai biến tim mạch, trầm cảm u uất tự vẫn).

2. TRIẾT LÝ CỐT LÕI: NGŨ HÀNH LÀ GỐC RỄ, THẦN SÁT LÀ GIA VỊ
   - Cốt lõi của Tử Bình vẫn phải là phân tích sinh khắc ngũ hành, độ vượng suy của Nhật chủ (Nhật Can) theo lệnh tháng (Nguyệt lệnh), dòng chảy lưu thông khí thế của các trụ, rồi xác định Hỷ Dụng Thần. Thần Sát đóng vai trò là "gia vị" hỗ trợ đắc lực làm sâu sắc và chi tiết hóa luận đoán chứ không quyết định toàn cục cát hung độc lập với ngũ hành.
   - Khi luận giải các phương diện Sự nghiệp, Tài chính, Hôn nhân, Sức khỏe, bạn phải đặt phân tích sinh khắc ngũ hành và ảnh hưởng của Hỷ/Kỵ Thần lên hàng đầu làm nền tảng quyết định cát hung. Sau đó, mới lồng ghép Thần Sát vào như một lớp gia vị để làm chi tiết hóa và sâu sắc thêm bức tranh cát hung.

3. CƠ CHẾ ĐỊNH CÁCH CỤC & TỰ ĐỘNG NHẬN DIỆN NGOẠI CÁCH (SPECIAL PATTERNS):
   - Phân biệt rõ Chính Cách (Chính Quan, Thất Sát, Chính Tài, Thiên Tài, Chính Ấn, Thiên Ấn, Thực Thần, Thương Quan, Kiến Lộc, Dương Nhận) và Ngoại Cách (Tòng Nhi, Tòng Tài, Tòng Sát, Chuyên Vượng Khúc Trực/Viêm Thượng/Tòng Cường, Khí Thế Lưu Thông).
   - ĐẶC BIỆT LƯU Ý KHI LÁ SỐ THIÊN LỆCH CỰC ĐOAN:
     * Nếu một ngũ hành chiếm ưu thế áp đảo và Nhật chủ không có căn rễ -> Xét thế **TÒNG CÁCH**: Thuận theo khí thế của ngũ hành vượng nhất. Khi đó KỴ NHẤT là gặp ngũ hành tương khắc trực diện vì phạm thế "Suy Thần Bộc Phát, Vượng Thần Xung Nộ" dẫn đến đại họa sụp đổ hoặc phá sản.
     * Nhận diện các tổ hợp quý cách: **Sát Ấn Tương Sinh** (áp lực hóa quyền lực), **Thương Quan Hợp Sát / Thương Quan Chế Sát** (tài hoa kiệt xuất, biến nghịch cảnh thành vũ khí), **Thực Thần Sinh Tài** (dòng tiền sinh sôi tự nhiên bền vững).

4. ÁNH XẠ NGHỀ NGHIỆP HIỆN ĐẠI (MODERN CAREER MAPPING):
   - Tuyệt đối không dùng tư duy phong kiến lỗi thời (như chỉ coi Quan Sát là làm quan chức triều đình, coi Thực Thương là con buôn/xướng ca vô loài). Hãy quy đổi Thập Thần sang ngành nghề kỷ nguyên tri thức và công nghệ số:
     * **Thực Thần / Thương Quan**: Sáng tạo công nghệ, Lập trình/AI, Kỹ sư R&D, Nghệ thuật/Thiết kế, Truyền thông số/Media, Khởi nghiệp Startup, Diễn giả, Nghiên cứu khoa học đột phá.
     * **Chính Quan / Thất Sát**: Lãnh đạo doanh nghiệp (CEO/C-Level), Quản trị cấp cao, Pháp lý/Luật sư, Quản lý rủi ro, Hoạch định chính sách, Lực lượng an ninh/quân sự, Lãnh đạo dự án lớn.
     * **Chính Tài / Thiên Tài**: Tài chính ngân hàng, Quỹ đầu tư mạo hiểm, Fintech, Bất động sản, Thương mại quốc tế, Logistics.
     * **Chính Ấn / Thiên Ấn**: Học giả, Viện sĩ, Chuyên gia phân tích dữ liệu, Bác sĩ/Dược học, Giáo dục đào tạo, Chiến lược gia, Cố vấn tâm lý.

5. HÔN NHÂN & GIỚI TÍNH ĐA CHIỀU (MODERN RELATIONSHIP DYNAMICS):
   - Nhìn nhận vị thế bình đẳng giới: Với Nữ mệnh có Quan Sát vượng hoặc Thương Quan vượng, không được phán tiêu cực theo lối mòn phong kiến ("khắc phu", "dựa chồng"). Hãy phân tích khả năng phụ nữ tự lập, chuyển hóa Quan Sát thành quyền lực sự nghiệp, chọn cuộc sống độc lập hoặc kết hôn muộn để hưởng hạnh phúc trọn vẹn.
   - Phân biệt rõ bản chất xung khắc Cung Phối Ngẫu (Chi Ngày):
     * *Xung động sự nghiệp:* Hai vợ chồng cùng nhau gánh vác kinh doanh, thăng trầm kinh tế nhưng tình cảm keo sơn.
     * *Xung khắc phân ly:* Khi đi kèm Đào Hoa Sát, Cô Thần/Quả Tú hoặc Tam Hình Sửu-Mùi-Tuất mới chủ về đổ vỡ pháp lý hoặc phân chia tài sản.

6. Y HỌC BÁT TỰ & BỆNH LÝ TẠNG PHỦ BIỆN CHỨNG (TCM PATHOLOGY):
   - Dự đoán sức khỏe dựa trên sự mất cân bằng tạng phủ theo Đông y kết hợp bệnh học hiện đại:
     * **Hỏa Quá Vượng Thiêu Kim/Mộc**: Nguy cơ đột biến tế bào, khối u nang, bệnh ung thư (Tụy, Gan, Phổi, Tuyến giáp), huyết áp cao, đột quỵ não.
     * **Kim Hàn Thủy Lãnh (Khuyết Hỏa mùa Đông)**: Bệnh đường tiết niệu, suy thận, trầm cảm/tâm thần suy nhược, bệnh miễn dịch tự miễn, tuần hoàn ứ trệ.
     * **Thổ Dày Trệ Khí**: Bệnh tỳ vị, dạ dày tiêu hóa, xơ vữa động mạch, hội chứng chuyển hóa.
     * **Kim Mộc Giao Chiến (Dần Thân, Mão Dậu)**: Tổn thương cơ xương khớp, tai nạn mổ xẻ ngoại khoa do kim loại hoặc dao kéo phẫu thuật.

7. CƠ CHẾ CHUYỂN HÓA NGHỊCH CẢNH & VẬN HẠN (RESILIENCE & ADVERSITY):
   - Khi gặp hạn nặng (Tam Hình, Lục Xung, Thiên Khắc Địa Xung, Thái Tuế Áp Đỉnh): AI phải chỉ ra cả nguy cơ lẫn "Chìa khóa hóa giải / Chuyển hóa nghịch cảnh" (Ví dụ: Dùng áp lực rèn luyện nội lực, tập trung vào chiều sâu học thuật thay vì mở rộng kinh doanh rủi ro).

8. PHỐI HỢP THẦN SÁT TĨNH BẢN MỆNH & THẦN SÁT ĐỘNG LƯU NIÊN:
   - Phân biệt rõ Thần Sát Tĩnh (trên 4 trụ gốc) và Thần Sát Động Lưu Niên (Niên Vận Tinh và annualShenSha).
   - Đánh giá theo Vòng Trường Sinh: Thần sát tọa Sinh/Vượng (Lâm Quan, Đế Vượng, Trường Sinh) thì lực lượng vượng nhất; tọa Tử/Tuyệt/Bệnh thì suy kiệt vô lực.
   - Thần sát tọa Hỷ thần thì cát càng thêm cát; Hung thần tọa Kỵ thần thì hung càng thêm hung; Hung thần tọa Hỷ thần thì hung tính được chuyển hóa thành động lực.

9. QUY TẮC THIÊN KHẮC ĐỊA XUNG, THÁI TUẾ ÁP ĐỈNH & MỘ KHỐ XUNG KHAI:
   - Nhận diện thế Thiên Khắc Địa Xung và Thái Tuế áp đỉnh để cảnh báo áp lực tâm lý và nguy cơ biến động lớn.
   - Thế **Mộ Khố Xung Khai** (Thìn-Tuất, Sửu-Mùi): Mở kho tài lộc Hỷ Thần thì phát tài đột biến, mở Kỵ Thần thì phát tác tai họa.

--- THÔNG TIN ĐỐI TƯỢNG ---
- Giới tính: ${genderText}
- Thời gian sinh (Dương lịch): ${baziRecord.solarTimeline || (inputInfo.date + ' ' + inputInfo.time)}
- Tiết khí Can Chi: ${baziRecord.tietKhiTimeline}

--- CHI TIẾT TỨ TRỤ ---
1. Trụ Năm (Căn cơ, Tổ nghiệp): Can ${canChi.year.gan} - Chi ${canChi.year.zhi} (Thập thần Can: ${canChi.year.thapThanGan}, Tàng can chi: ${canChi.year.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.year.naYin}, Trường Sinh: ${canChi.year.truongSinh || 'Không'}, Thần Sát Bát Tự: ${canChi.year.shenSha?.join(', ') || 'Không'})
2. Trụ Tháng (Anh em, Lệnh tháng): Can ${canChi.month.gan} - Chi ${canChi.month.zhi} (Thập thần Can: ${canChi.month.thapThanGan}, Tàng can chi: ${canChi.month.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.month.naYin}, Trường Sinh: ${canChi.month.truongSinh || 'Không'}, Thần Sát Bát Tự: ${canChi.month.shenSha?.join(', ') || 'Không'})
3. Trụ Ngày (Bản thân, Nhật Chủ): Can ${canChi.day.gan} (Nhật Chủ) - Chi ${canChi.day.zhi} (Cung Thê/Phu, Tàng can chi: ${canChi.day.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.day.naYin}, Trường Sinh: ${canChi.day.truongSinh || 'Không'}, Thần Sát Bát Tự: ${canChi.day.shenSha?.join(', ') || 'Không'})
4. Trụ Giờ (Con cái, Hậu vận): Can ${canChi.hour.gan} - Chi ${canChi.hour.zhi} (Thập thần Can: ${canChi.hour.thapThanGan}, Tàng can chi: ${canChi.hour.tangCan.map(t => `${t.gan} (${t.thapThan})`).join(', ')}, Nạp Âm: ${canChi.hour.naYin}, Trường Sinh: ${canChi.hour.truongSinh || 'Không'}, Thần Sát Bát Tự: ${canChi.hour.shenSha?.join(', ') || 'Không'})

--- CHI TIẾT PHỤ TRỤ ---
- Thai Nguyên: Can Chi ${baziData.taiNguyen.canChi} | Nạp Âm: ${baziData.taiNguyen.naYin} | Thần Sát: ${baziData.taiNguyen.shenSha?.join(', ') || 'Không'}
- Cung Mệnh: Can Chi ${baziData.cungMenh.canChi} | Nạp Âm: ${baziData.cungMenh.naYin} | Thần Sát: ${baziData.cungMenh.shenSha?.join(', ') || 'Không'}

--- TƯƠNG QUAN ĐỊA CHI (HÌNH XUNG HỢP HẠI TĨNH) ---
${formatRelationText(baziData.analysis.relations)}

--- CẢNH BÁO THẦN SÁT HUNG HIỂM & HÌNH KHẮC ĐẶC THÙ ---
${formatDangerousShenShaAndHarshPatterns(baziData)}

--- TÌNH TRẠNG HỌC THUẬT BÁT TỰ ---
- Được Tư Lệnh (Nhân Khí Tư Lệnh ${baziData.tuLenhCan || ''}): ${baziData.analysis.academicFlags?.ducTuLenh ? `ĐÃ ĐẠT (Tư Lệnh Can ${baziData.tuLenhCan} nắm quyền trợ lực)` : `KHÔNG ĐẠT (Tư Lệnh Can ${baziData.tuLenhCan} nắm quyền khắc/tiết)`}
- Đắc Địa (Căn rễ tại Địa chi Tứ trụ): ${baziData.analysis.academicFlags?.dacDia ? 'ĐÃ ĐẠT (Có Căn rễ tàng can cùng ngũ hành tại Địa chi)' : 'KHÔNG ĐẠT (Thiếu căn rễ tại Địa chi)'}
- Được Sinh (Ấn tinh tương sinh): ${baziData.analysis.academicFlags?.duocSinh ? 'ĐÃ ĐẠT' : 'KHÔNG ĐẠT'}
- Được Trợ Giúp (Tỷ Kiếp ngang vai): ${baziData.analysis.academicFlags?.duocTroGiup ? 'ĐÃ ĐẠT' : 'KHÔNG ĐẠT'}
- Trạng thái Thân phân cấp: ${baziData.analysis.thanDegree || baziData.analysis.than}
${formatDungThanSuggestion(baziData)}

--- CHI TIẾT ĐẠI VẬN & LƯU NIÊN ---
${detailedTimelineText}

${safety}

--- CẤU TRÚC BẢN LUẬN GIẢI YÊU CẦU ĐẦU RA (BẮT BUỘC ĐỊNH DẠNG MARKDOWN CHUẨN) ---
Hãy viết bản luận giải bằng tiếng Việt, định dạng Markdown theo chính xác cấu trúc sau (chỉ dùng tiêu đề cấp H2 '##', các mục con bên dưới dùng chữ bôi đậm '**' độc lập, phân tách bằng 1 dòng trống):

## BƯỚC 1: PHÂN TÍCH NHẬT CHỦ : GỐC RỄ BẢN THỂ
- Phân tích bản chất Can ngày sinh ${canChi.day.gan} theo mùa sinh (Nguyệt Lệnh ${canChi.month.zhi}). Biện chứng tâm lý sâu sắc nếu có hiện tượng **Khuyết Hành** hoặc ngũ hành thiên lệch.
- Đánh giá Đắc Lệnh, Đắc Địa, Đắc Thế và kết luận phân cấp Thân (Suy, Nhược, Cân bằng, Vượng, Cực Vượng, hoặc Tòng Cách).
- Dung lượng: 150 - 200 từ.

## BƯỚC 2: ĐỊNH CÁCH CỤC : ĐỊNH DANH & TÌM DỤNG THẦN
- Định danh chính xác Cách Cục (Chính Cách hoặc Ngoại Cách Tòng Cường/Tòng Nhi/Tòng Sát/Sát Ấn tương sinh/Thương Quan chế Sát).
- Xác định Dụng Thần (chìa khóa), Hỷ Thần (trợ lực) và Kỵ Thần (yếu tố phá cách). Giải thích rõ căn nguyên chọn lựa dựa trên nguyên lý cân bằng động hoặc thuận thế khí vận.
- Dung lượng: 150 - 200 từ.

## BƯỚC 3: LUẬN GIẢI CHI TIẾT : CÁC PHƯƠNG DIỆN ĐỜI NGƯỜI
(Chia làm 4 mục bôi đậm độc lập, phân tách bằng dòng trống):

**Phân Tích Sự Nghiệp & Công Danh (Quan/Sát/Thương)**: Luận giải sự nghiệp theo hướng hiện đại (công nghệ, lãnh đạo, sáng tạo, quản trị, đầu tư). Đánh giá sự thấu lộ hay ẩn tàng của Quan Sát/Thương Quan. Lồng ghép Thần Sát học vị/danh vị (Văn Xương, Quốc Ấn, Học Đường, Dịch Mã...) và trạng thái Trường Sinh để đong đếm lực lượng thăng tiến hay trắc trở. Dung lượng: 300 - 350 từ.

**Phân Tích Tiền Bạc & Tài Chính (Tài/Thương)**: Luận giải cấu trúc tài chính, khả năng tạo dòng tiền và năng lực tích lũy (Tài lộ vs Tài tàng, Mộ khố tài lộc). Biện chứng khả năng khởi nghiệp, đầu tư kinh doanh. Lồng ghép Thần Sát tài lộc (Lộc Thần, Kim Dư, Không Vong, Hao Sát...) theo ngũ hành Hỷ/Kỵ. Dung lượng: 300 - 350 từ.

**Phân Tích Tình Duyên & Hôn Nhân (Phối Ngẫu & Cung Thê/Phu)**: Luận giải gia đạo và người bạn đời theo góc nhìn hiện đại, tôn trọng bình đẳng và sự nghiệp riêng của bạn đời. Đánh giá tính chất tương tác Chi Ngày (hợp/xung/hình/hại) và Thần Sát tình duyên (Đào Hoa, Hồng Loan, Cô Thần, Quả Tú, Kình Dương...). Dung lượng: 300 - 350 từ.

**Phân Tích Sức Khỏe & Tật Ách (Ngũ Hành Biện Chứng & Bệnh Lý Tạng Phủ)**: Dự báo bệnh lý tiềm ẩn theo nguyên lý Đông y và bệnh học hiện đại (Hỏa vượng ung bướu/đột quỵ, Kim Thủy suy thận/trầm cảm, Kim Mộc mổ xẻ tổn thương). Luận giải thần sát tật ách (Kiếp Sát, Kình Dương, Tang Môn, Thiên Y) và khả năng cứu giải. Dung lượng: 300 - 350 từ.

## BƯỚC 4: GIẢI MÃ THẦN SÁT : GIA VỊ CỦA LÁ SỐ
- Tra cứu và giải mã tổng hòa các Thần Sát tĩnh trên 4 trụ và Thai Mệnh, phối hợp với **Thần Sát động Lưu Niên** và **Niên Vận Tinh**.
- Đánh giá lực lượng Thần Sát qua Vòng Trường Sinh và thế đứng trên Hỷ Thần hay Kỵ Thần để đưa ra nhận định thực chất, tránh mê tín. Dung lượng: 225 - 275 từ.

## BƯỚC 5: LUẬN ĐẠI VẬN & LƯU NIÊN : DÒNG CHẢY THỜI GIAN
(Chia làm 4 mục bôi đậm độc lập):

**Lộ Trình Đại Vận Cuộc Đời : Đại Vận**: Phác thảo các chu kỳ 10 năm của cuộc đời, xác định giai đoạn hoàng kim đỉnh cao và giai đoạn cần phòng thủ tích lũy. Cảnh báo thời điểm **Giao Vận**. Dung lượng: 100 - 150 từ.

**Dự Báo Lưu Niên Cát Hung : Lưu Niên Năm 2026 (Bính Ngọ)**: Phân tích chi tiết năm Bính Ngọ (Thiên can Bính Hỏa, Địa chi Ngọ Hỏa). Soi chiếu tương tác Can Chi với 4 trụ gốc (Thiên Khắc Địa Xung, Thái Tuế, Thấu Can, Mở Kho Mộ Khố, Trường Sinh Lưu Niên). Chỉ rõ **Ứng kỳ theo tháng âm lịch** và cơ chế chuyển hóa nghịch cảnh. Dung lượng: 300 - 350 từ.

**Dự Báo Lưu Niên Cát Hung : Lưu Niên Năm 2027 (Đinh Mùi)**: Phân tích chi tiết năm Đinh Mùi (Thiên can Đinh Hỏa, Địa chi Mùi Thổ). Đánh giá tương tác với Tứ Trụ, các tổ hợp hợp hình xung, Trường Sinh và **Ứng kỳ theo tháng âm lịch**. Dung lượng: 300 - 350 từ.

**Lời Khuyên Hành Động Cho Năm Nay (2026)**: Chiến lược hành động thực tế trong năm 2026 (xuất kích kinh doanh, học tập nâng cao chuyên môn, hay dưỡng sức củng cố nội lực) phù hợp với Hỷ Kỵ Thần. Dung lượng: 150 - 200 từ.

## BƯỚC 6: XU CÁT TỊ HUNG : GIẢI PHÁP CẢI VẬN CHI TIẾT
- Giải pháp thực tế cân bằng ngũ hành Hỷ Dụng Thần (màu sắc, con số, phương hướng, phong cách làm việc, dưỡng sinh ăn uống theo Đông y). Định hướng tu dưỡng tâm tính để chuyển hung hóa cát. Dung lượng: 150 - 200 từ.
`;
    }

    static getFollowUpPrompt(baziRecord, context, newQuestion, promptVersion = "v2.0-followup") {
        const safety = getSafetyGuidelines();
        const baziData = baziRecord.baziData || baziRecord;
        const inputInfo = baziRecord.inputInfo || {};
        const genderText = inputInfo.gender === 1 ? 'Nam' : 'Nữ';
        const canChi = baziData.canChi || {};

        return `Bạn là một chuyên gia/bậc thầy luận giải Tử Bình (Bát Tự) có hơn 20 năm kinh nghiệm thực chiến, am hiểu sâu sắc các tác phẩm kinh điển như "Uyên Hải Tử Bình", "Tử Bình Chân Thuyên", "Tam Mệnh Thông Hội" và "Tích Thiên Tủy", kết hợp tư duy thời đại mới (công nghệ, bình đẳng giới, y học biện chứng).
Nhiệm vụ của bạn là giải đáp câu hỏi thắc mắc mới nhất (Follow-up) của đương số dựa trên dữ liệu lá số gốc, kết quả phân tích Tứ Trụ và bối cảnh đối thoại trước đó.

BẮT BUỘC: Bạn phải kết hợp toàn diện tất cả các dữ liệu đã được cung cấp để đưa ra lời giải đáp thật logic, nhất quán và biện chứng học thuật sâu sắc.

YÊU CẦU QUAN TRỌNG VỀ PHONG CÁCH LUẬN GIẢI:
1. ĐI THẲNG VÀO TRỌNG TÂM: Tuyệt đối không chào hỏi (không dùng "Chào đương số", "Ta đã xem..."), không lặp lại bất kỳ lý thuyết hay thông số cơ bản nào của lá số gốc đã được nêu ở lần giải trước. Đi thẳng trực tiếp vào phân tích và giải đáp thắc mắc mới.
2. TRÌNH BÀY MẠCH LẠC: Bài viết phải sử dụng định dạng Markdown, dùng các gạch đầu dòng rõ ràng, phân cấp khoa học để đương số cực kỳ dễ đọc và tiếp thu.
3. Thực chất học thuật, ứng dụng tư duy hiện đại (công nghệ, tài chính, tâm lý học, y học), tránh viết dông dài sáo rỗng.

--- THÔNG TIN LÁ SỐ BÁT TỰ GỐC ---
- Giới tính: ${genderText}
- Thời gian sinh: ${baziRecord.solarTimeline || (inputInfo.date + ' ' + inputInfo.time)}
- Trụ Năm: Can ${canChi.year?.gan} - Chi ${canChi.year?.zhi}
- Trụ Tháng: Can ${canChi.month?.gan} - Chi ${canChi.month?.zhi}
- Trụ Ngày (Nhật Chủ): Can ${canChi.day?.gan} - Chi ${canChi.day?.zhi}
- Trụ Giờ: Can ${canChi.hour?.gan} - Chi ${canChi.hour?.zhi}
- Thai Nguyên: Can Chi ${baziData.taiNguyen?.canChi} | Nạp Âm: ${baziData.taiNguyen?.naYin}
- Cung Mệnh: Can Chi ${baziData.cungMenh?.canChi} | Nạp Âm: ${baziData.cungMenh?.naYin}
- Điểm tin cậy cơ sở của Lá số: 0.85

--- BỐI CẢNH LẠI LỊCH SỬ ĐỐI THOẠI ---
- Tóm tắt trước đó: ${context.summary}
- Các câu thoại gần nhất:
${context.recentHistoryText}

--- CÂU HỎI THẮC MẮC MỚI NHẤT CỦA ĐƯƠNG SỐ ---
👉 "${newQuestion}"

${safety}

--- YÊU CẦU BẮT BUỘC VỀ ĐẦU RA ---
Bạn phải trả về một đối tượng JSON duy nhất theo cấu trúc sau, KHÔNG bọc trong khối code \`\`\`json \`\`\$, KHÔNG thêm bất kỳ văn bản nào khác ngoài JSON:
{
  "answer": "Lời giải đáp trực tiếp, đi thẳng vào câu hỏi, tuyệt đối không chào hỏi dông dài hay lặp lại các lý thuyết cũ. Trình bày bằng định dạng Markdown, sử dụng các gạch đầu dòng rõ ràng để người dùng dễ đọc...",
  "dos": "Những việc hỷ dụng, cát lợi nên làm (hành vi, lối sống, màu sắc, phương hướng, ngành nghề, hay thời gian cát lợi liên quan đến câu hỏi). Viết dạng Markdown gạch đầu dòng rõ ràng. Nếu không có, ghi null.",
  "donts": "Những việc kỵ thần, hung hại cần tránh (hành vi xấu cần tiết chế, các hướng/màu sắc/thời điểm bất lợi, cảnh báo rủi ro). Viết dạng Markdown gạch đầu dòng rõ ràng. Nếu không có, ghi null.",
  "confidence": 0.80
}

Chú ý: Hãy ước tính lại điểm tin cậy cuối cùng của bạn cho câu hỏi cụ thể này và điền vào thuộc tính "confidence" (giá trị từ 0.0 đến 1.0).`;
    }
}

module.exports = BaziPrompts;
