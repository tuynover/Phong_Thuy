const { Lunar, Solar } = require('lunar-javascript');

const GAN_VI = {
    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', 'Nhâm': 'Nhâm', '癸': 'Quý'
};

const ZHI_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const TRUC_VI = {
    '建': 'Kiến', '除': 'Trừ', '满': 'Mãn', '平': 'Bình', '定': 'Định', '执': 'Chấp',
    '破': 'Phá', '危': 'Nguy', '成': 'Thành', '收': 'Thu', '开': 'Khai', '闭': 'Bế'
};

const DEITY_VI = {
    '青龙': 'Thanh Long', '明堂': 'Minh Đường', '天刑': 'Thiên Hình', '朱雀': 'Chu Tước',
    '金匮': 'Kim Quỹ', '天德': 'Thiên Đức', '白虎': 'Bạch Hổ', '玉堂': 'Ngọc Đường',
    '天牢': 'Thiên Lao', '玄武': 'Nguyên Vũ', '司命': 'Tư Mệnh', '勾陈': 'Câu Trận',
    '宝光': 'Bảo Quang'
};

const DEITY_MEANINGS = {
    'Thanh Long': 'Đại diện cho hỷ sự, danh vọng, khởi đầu may mắn thịnh vượng',
    'Minh Đường': 'Đại diện cho quý nhân trợ giúp, danh tiếng vang xa, gia đạo bình an',
    'Thiên Hình': 'Đại diện cho tranh chấp pháp lý, kiện tụng, thị phi hao tổn',
    'Chu Tước': 'Đại diện cho cãi vã, khẩu thiệt thị phi, hao tài tốn của',
    'Kim Quỹ': 'Đại diện cho tài lộc, tích lũy tiền tài cát lợi, rất tốt cho giao dịch cưới hỏi',
    'Bảo Quang': 'Đại diện cho danh vọng, thi cử đỗ đạt, thăng tiến học hành sự nghiệp',
    'Bạch Hổ': 'Đại diện cho tai nạn huyết quang, thương tích cản trở phát sinh',
    'Ngọc Đường': 'Đại diện cho trí tuệ, ngọc quý đầy nhà, rất tốt cho xây dựng nhà cửa',
    'Thiên Lao': 'Đại diện cho tù túng cản trở, khó khăn, mọi việc trì hoãn bế tắc',
    'Nguyên Vũ': 'Đại diện cho hao tán của cải, trộm cắp, tiểu nhân quấy phá hãm hại',
    'Tư Mệnh': 'Đại diện cho vạn sự cát tường, tiêu tai giải nạn, sức khỏe thọ mệnh',
    'Câu Trận': 'Đại diện cho trì hoãn, cản trở, tranh chấp tài sản đất đai gia đạo'
};

const HOUR_RANGES = {
    'Tý': '23h - 1h',
    'Sửu': '1h - 3h',
    'Dần': '3h - 5h',
    'Mão': '5h - 7h',
    'Thìn': '7h - 9h',
    'Tỵ': '9h - 11h',
    'Ngọ': '11h - 13h',
    'Mùi': '13h - 15h',
    'Thân': '15h - 17h',
    'Dậu': '17h - 19h',
    'Tuất': '19h - 21h',
    'Hợi': '21h - 23h'
};

const NAYIN_MAP = {
    'Giáp Tý': 'Hải Trung Kim', 'Ất Sửu': 'Hải Trung Kim',
    'Bính Dần': 'Lư Trung Hỏa', 'Đinh Mão': 'Lư Trung Hỏa',
    'Mậu Thìn': 'Đại Lâm Mộc', 'Kỷ Tỵ': 'Đại Lâm Mộc',
    'Canh Ngọ': 'Lộ Bàng Thổ', 'Tân Mùi': 'Lộ Bàng Thổ',
    'Nhâm Thân': 'Kiếm Phong Kim', 'Quý Dậu': 'Kiếm Phong Kim',
    'Giáp Tuất': 'Sơn Đầu Hỏa', 'Ất Hợi': 'Sơn Đầu Hỏa',
    'Bính Tý': 'Giản Hạ Thủy', 'Đinh Sửu': 'Giản Hạ Thủy',
    'Mậu Dần': 'Thành Đầu Thổ', 'Kỷ Mão': 'Thành Đầu Thổ',
    'Canh Thìn': 'Bạch Lạp Kim', 'Tân Tỵ': 'Bạch Lạp Kim',
    'Nhâm Ngọ': 'Dương Liễu Mộc', 'Quý Mùi': 'Dương Liễu Mộc',
    'Giáp Thân': 'Tuyền Trung Thủy', 'Ất Dậu': 'Tuyền Trung Thủy',
    'Bính Tuất': 'Ốc Thượng Thổ', 'Đinh Hợi': 'Ốc Thượng Thổ',
    'Mậu Tý': 'Tích Lịch Hỏa', 'Kỷ Sửu': 'Tích Lịch Hỏa',
    'Canh Dần': 'Tùng Bách Mộc', 'Tân Mão': 'Tùng Bách Mộc',
    'Nhâm Thìn': 'Trường Lưu Thủy', 'Quý Tỵ': 'Trường Lưu Thủy',
    'Giáp Ngọ': 'Sa Trung Kim', 'Ất Mùi': 'Sa Trung Kim',
    'Bính Thân': 'Sơn Hạ Hỏa', 'Đinh Dậu': 'Sơn Hạ Hỏa',
    'Mậu Tuất': 'Bình Địa Mộc', 'Kỷ Hợi': 'Bình Địa Mộc',
    'Canh Tý': 'Bích Thượng Thổ', 'Tân Sửu': 'Bích Thượng Thổ',
    'Nhâm Dần': 'Kim Bạch Kim', 'Quý Mão': 'Kim Bạch Kim',
    'Giáp Thìn': 'Phúc Đăng Hỏa', 'Ất Tỵ': 'Phúc Đăng Hỏa',
    'Bính Ngọ': 'Thiên Hà Thủy', 'Đinh Mùi': 'Thiên Hà Thủy',
    'Mậu Thân': 'Đại Trạch Thổ', 'Kỷ Dậu': 'Đại Trạch Thổ',
    'Canh Tuất': 'Thoa Xuyến Kim', 'Tân Hợi': 'Thoa Xuyến Kim',
    'Nhâm Tý': 'Tang Đố Mộc', 'Quý Sửu': 'Tang Đố Mộc',
    'Giáp Dần': 'Đại Khê Thủy', 'Ất Mão': 'Đại Khê Thủy',
    'Bính Thìn': 'Sa Trung Thổ', 'Đinh Tỵ': 'Sa Trung Thổ',
    'Mậu Ngọ': 'Thiên Thượng Hỏa', 'Kỷ Mùi': 'Thiên Thượng Hỏa',
    'Canh Thân': 'Thạch Lựu Mộc', 'Tân Dậu': 'Thạch Lựu Mộc',
    'Nhâm Tuất': 'Đại Hải Thủy', 'Quý Hợi': 'Đại Hải Thủy'
};

const RELATION_MAP = {
    'Kim': { sinh: 'Thủy', khac: 'Mộc', biKhac: 'Hỏa' },
    'Mộc': { sinh: 'Hỏa', khac: 'Thổ', biKhac: 'Kim' },
    'Thủy': { sinh: 'Mộc', khac: 'Hỏa', biKhac: 'Thổ' },
    'Hỏa': { sinh: 'Thổ', khac: 'Kim', biKhac: 'Thủy' },
    'Thổ': { sinh: 'Kim', khac: 'Thủy', biKhac: 'Mộc' }
};

const CHONG_MAP = {
    'Tý': 'Ngọ', 'Ngọ': 'Tý',
    'Sửu': 'Mùi', 'Mùi': 'Sửu',
    'Dần': 'Thân', 'Thân': 'Dần',
    'Mão': 'Dậu', 'Dậu': 'Mão',
    'Thìn': 'Tuất', 'Tuất': 'Thìn',
    'Tỵ': 'Hợi', 'Hợi': 'Tỵ'
};

const HAI_MAP = {
    'Tý': 'Mùi', 'Mùi': 'Tý',
    'Sửu': 'Ngọ', 'Ngọ': 'Sửu',
    'Dần': 'Tỵ', 'Tỵ': 'Dần',
    'Mão': 'Thìn', 'Thìn': 'Mão',
    'Thân': 'Hợi', 'Hợi': 'Thân',
    'Dậu': 'Tuất', 'Tuất': 'Dậu'
};

const CAN_SHENG_KHAC = {
    'Giáp': 'Mậu', 'Ất': 'Kỷ', 'Bính': 'Canh', 'Đinh': 'Tân', 'Mậu': 'Nhâm',
    'Kỷ': 'Quý', 'Canh': 'Giáp', 'Tân': 'Ất', 'Nhâm': 'Bính', 'Quý': 'Đinh'
};

const SAT_CHU_MAP = {
    1: 'Tỵ', 2: 'Tý', 3: 'Mùi', 4: 'Mão', 5: 'Thân', 6: 'Tuất',
    7: 'Hợi', 8: 'Sửu', 9: 'Ngọ', 10: 'Dậu', 11: 'Dần', 12: 'Thìn'
};

const THO_TU_MAP = {
    1: 'Tuất', 2: 'Thìn', 3: 'Hợi', 4: 'Tỵ', 5: 'Tý', 6: 'Ngọ',
    7: 'Dần', 8: 'Dậu', 9: 'Mão', 10: 'Thân', 11: 'Dần', 12: 'Mùi'
};

const VANG_VONG_MAP = {
    1: 'Dần', 2: 'Tỵ', 3: 'Thân', 4: 'Hợi', 5: 'Mão', 6: 'Ngọ',
    7: 'Dậu', 8: 'Tý', 9: 'Thìn', 10: 'Mùi', 11: 'Tuất', 12: 'Sửu'
};

const toViCanChi = (hanStr) => {
    if (!hanStr) return '';
    let result = hanStr;
    for (const [han, vi] of Object.entries(GAN_VI)) result = result.replace(new RegExp(han, 'g'), vi + ' ');
    for (const [han, vi] of Object.entries(ZHI_VI)) result = result.replace(new RegExp(han, 'g'), vi);
    return result.trim().replace(/\s+/g, ' ');
};

const getElementFromNayin = (nayin) => {
    if (!nayin) return '';
    if (nayin.includes('Kim')) return 'Kim';
    if (nayin.includes('Mộc')) return 'Mộc';
    if (nayin.includes('Thủy')) return 'Thủy';
    if (nayin.includes('Hỏa')) return 'Hỏa';
    if (nayin.includes('Thổ')) return 'Thổ';
    return '';
};

const mapActivityKeywords = (activity) => {
    if (activity === 'cuoi_hoi') {
        return {
            goodTruc: ['Thành', 'Thu', 'Khai', 'Định', 'Trừ'],
            badTruc: ['Phá', 'Nguy', 'Chấp', 'Bế', 'Kiến'],
            yiKeywords: ['嫁娶', '纳采', '祈福', '祭祀'],
            jiKeywords: ['嫁娶', '安葬']
        };
    } else if (activity === 'khai_truong') {
        return {
            goodTruc: ['Kiến', 'Mãn', 'Khai', 'Thành'],
            badTruc: ['Phá', 'Bế', 'Nguy', 'Thu'],
            yiKeywords: ['开市', '交易', '纳财', '开仓'],
            jiKeywords: ['开市']
        };
    } else if (activity === 'dong_tho') {
        return {
            goodTruc: ['Kiến', 'Bình', 'Định', 'Thành', 'Khai'],
            badTruc: ['Phá', 'Nguy', 'Thu', 'Bế'],
            yiKeywords: ['动土', '破土', '修造'],
            jiKeywords: ['动土']
        };
    } else if (activity === 'do_mai') {
        return {
            goodTruc: ['Kiến', 'Bình', 'Định', 'Thành', 'Khai'],
            badTruc: ['Phá', 'Nguy', 'Thu', 'Bế'],
            yiKeywords: ['竖柱', '上梁', '盖屋'],
            jiKeywords: ['上梁']
        };
    } else if (activity === 'nhap_trach') {
        return {
            goodTruc: ['Khai', 'Thành', 'Định', 'Trừ'],
            badTruc: ['Phá', 'Thu', 'Bế', 'Nguy'],
            yiKeywords: ['入宅', '移徙', '安香'],
            jiKeywords: ['入宅', '移徙']
        };
    } else if (activity === 'xuat_hanh') {
        return {
            goodTruc: ['Kiến', 'Mãn', 'Thành', 'Khai'],
            badTruc: ['Phá', 'Nguy', 'Bế'],
            yiKeywords: ['出行', '出货'],
            jiKeywords: ['出行']
        };
    } else if (activity === 'ky_hop_dong') {
        return {
            goodTruc: ['Thành', 'Thu', 'Khai', 'Định'],
            badTruc: ['Phá', 'Bế'],
            yiKeywords: ['立券', '交易', '纳财'],
            jiKeywords: ['交易']
        };
    } else if (activity === 'cau_phuc') {
        return {
            goodTruc: ['Trừ', 'Định', 'Chấp', 'Thành', 'Khai'],
            badTruc: ['Phá', 'Bế'],
            yiKeywords: ['祈福', '祭祀', '求嗣'],
            jiKeywords: ['斋醮']
        };
    } else if (activity === 'an_tang') {
        return {
            goodTruc: ['Trừ', 'Chấp', 'Thành', 'Bế'],
            badTruc: ['Kiến', 'Mãn', 'Khai', 'Thu'],
            yiKeywords: ['安葬', '破土', '启攒'],
            jiKeywords: ['安葬']
        };
    }
    return null;
};

class DateService {
    static getUserYearInfo(birthYear) {
        const solar = Solar.fromYmd(parseInt(birthYear), 6, 15);
        const lunar = solar.getLunar();
        const yearCanChi = toViCanChi(lunar.getYearInGanZhiExact());
        const yearNaYin = NAYIN_MAP[yearCanChi] || 'N/A';
        const parts = yearCanChi.split(' ');
        const gan = parts[0];
        const zhi = parts[1];

        return {
            yearCanChi,
            naYin: yearNaYin,
            gan,
            zhi
        };
    }

    static evaluateDay(lunar, userYearInfo, activity) {
        const dayZhi = toViCanChi(lunar.getDayZhi());
        const dayGan = toViCanChi(lunar.getDayGan());
        const dayCanChi = toViCanChi(lunar.getDayInGanZhiExact());
        const dayNaYin = NAYIN_MAP[dayCanChi] || 'N/A';
        const dayElement = getElementFromNayin(dayNaYin);

        const userZhi = userYearInfo.zhi;
        const userGan = userYearInfo.gan;
        const userNaYin = userYearInfo.naYin;
        const userElement = getElementFromNayin(userNaYin);

        // Adjust timezone (+1 hour for GMT+8 Beijing astronomical solar terms) for Year, Month, and related boundaries
        const solar = lunar.getSolar();
        const solarAdjusted = solar.nextHour(1);
        const lunarAdjusted = solarAdjusted.getLunar();

        const lunarMonth = lunarAdjusted.getMonth();
        const isSatChu = SAT_CHU_MAP[Math.abs(lunarMonth)] === dayZhi;
        const isThoTu = THO_TU_MAP[Math.abs(lunarMonth)] === dayZhi;
        const isVangVong = VANG_VONG_MAP[Math.abs(lunarMonth)] === dayZhi;

        const positiveFactors = [];
        const negativeFactors = [];
        let score = 0;
        let isBlock = false;

        // 1. Direct Clash (Lục Xung) - BLOCK
        if (CHONG_MAP[dayZhi] === userZhi) {
            isBlock = true;
            score -= 2.5;
            negativeFactors.push(`Địa Chi ngày (${dayZhi}) Lục Xung trực tiếp với tuổi của bạn (${userZhi}).`);
        }

        // 2. Sat Chu Day - BLOCK
        if (isSatChu) {
            isBlock = true;
            score -= 2.0;
            negativeFactors.push(`Phạm ngày Sát Chủ trong tháng ${Math.abs(lunarMonth)} Âm lịch (đại kỵ mọi việc).`);
        }

        // 3. Tho Tu Day - Strong negative
        if (isThoTu) {
            score -= 3;
            negativeFactors.push(`Phạm ngày Thọ Tử cát hung sát hại khí vận.`);
        }

        // 4. Vang Vong Day - Negative
        if (isVangVong) {
            score -= 2;
            negativeFactors.push(`Phạm ngày Vãng Vong (chủ về mất mát, thất thoát).`);
        }

        // 5. Lục Hại
        if (HAI_MAP[dayZhi] === userZhi) {
            score -= 2;
            negativeFactors.push(`Địa Chi ngày (${dayZhi}) phạm Tương Hại với tuổi (${userZhi}) dễ sinh bất hòa, thị phi.`);
        }

        // 6. Heavenly Stem Clash (Can khắc Can)
        if (CAN_SHENG_KHAC[dayGan] === userGan) {
            score -= 1;
            negativeFactors.push(`Thiên Can ngày (${dayGan}) tương khắc Can tuổi (${userGan}) của bạn.`);
        }

        // 7. Ngũ Hành Nạp Âm
        if (dayElement && userElement) {
            if (dayElement === userElement) {
                score += 1.5;
                positiveFactors.push(`Ngũ hành ngày là ${dayNaYin} (${dayElement}) Tương Hòa với bản mệnh ${userNaYin} (${userElement}) của bạn.`);
            } else if (RELATION_MAP[dayElement].sinh === userElement) {
                score += 2.5;
                positiveFactors.push(`Ngũ hành ngày là ${dayNaYin} (${dayElement}) Tương Sinh cho bản mệnh ${userNaYin} (${userElement}) của bạn (rất tốt).`);
            } else if (RELATION_MAP[userElement].sinh === dayElement) {
                score += 0.5;
                positiveFactors.push(`Bản mệnh của bạn sinh cho ngũ hành ngày (Hao khí nhẹ, vẫn tốt).`);
            } else if (RELATION_MAP[dayElement].khac === userElement) {
                score -= 2;
                negativeFactors.push(`Ngũ hành ngày là ${dayNaYin} (${dayElement}) tương khắc bản mệnh ${userNaYin} (${userElement}) của bạn.`);
            } else if (RELATION_MAP[userElement].khac === dayElement) {
                score -= 0.5;
                negativeFactors.push(`Bản mệnh của bạn khắc chế ngày (Mất chút sức lực lực, hao tổn nhẹ).`);
            }
        }

        // 8. Thập Nhị Thần Hoàng Đạo / Hắc Đạo
        const dayTianShen = DEITY_VI[lunar.getDayTianShen()] || lunar.getDayTianShen();
        const dayTianShenType = lunar.getDayTianShenType(); // "黄道" or "黑道"
        if (dayTianShenType === '黄道') {
            score += 2;
            positiveFactors.push(`Ngày Hoàng Đạo cát lành (${dayTianShen}).`);
        } else {
            score -= 2;
            negativeFactors.push(`Ngày Hắc Đạo xung kỵ (${dayTianShen}).`);
        }

        // 9. Thập Nhị Kiến Trừ (Trực)
        const truc = TRUC_VI[lunarAdjusted.getZhiXing()] || lunarAdjusted.getZhiXing();
        const actRules = mapActivityKeywords(activity);
        if (actRules) {
            if (actRules.goodTruc.includes(truc)) {
                score += 2;
                positiveFactors.push(`Ngày có Trực ${truc} tốt cho công việc dự kiến.`);
            } else if (actRules.badTruc.includes(truc)) {
                score -= 2;
                negativeFactors.push(`Ngày có Trực ${truc} không phù hợp cho công việc này.`);
            }
        }

        // 10. Lịch pháp Nghiệp vụ (Yi / Ji)
        const dayYi = lunar.getDayYi();
        const dayJi = lunar.getDayJi();
        if (actRules) {
            let isYi = false;
            let isJi = false;
            actRules.yiKeywords.forEach(kw => {
                if (dayYi.includes(kw)) isYi = true;
            });
            actRules.jiKeywords.forEach(kw => {
                if (dayJi.includes(kw)) isJi = true;
            });

            if (isYi) {
                score += 2.5;
                positiveFactors.push(`Lịch thư chỉ định ngày này rất thích hợp để tiến hành.`);
            }
            if (isJi) {
                score -= 2.5;
                negativeFactors.push(`Lịch thư chỉ định ngày này kiêng kỵ thực hiện.`);
            }
        }

        // Determine Rating (5-level Weighted Scoring)
        let rating = 'Bình hòa';
        if (isBlock) {
            rating = 'Không được';
        } else if (score >= 3.5) {
            rating = 'Rất tốt';
        } else if (score >= 1.0) {
            rating = 'Nên';
        } else if (score >= -1.0 && score < 1.0) {
            rating = 'Bình hòa';
        } else if (score >= -3.5 && score < -1.0) {
            rating = 'Không nên';
        } else {
            rating = 'Không được';
        }

        return {
            rating,
            score,
            positiveFactors,
            negativeFactors,
            lunarDateInfo: {
                year: lunarAdjusted.getYear(),
                month: lunarAdjusted.getMonth(),
                day: lunar.getDay(),
                yearCanChi: toViCanChi(lunarAdjusted.getYearInGanZhiExact()),
                monthCanChi: toViCanChi(lunarAdjusted.getMonthInGanZhiExact()),
                dayCanChi,
                dayZhi,
                truc,
                deity: dayTianShen,
                deityType: dayTianShenType === '黄道' ? 'Hoàng Đạo' : 'Hắc Đạo',
                deityMeaning: DEITY_MEANINGS[dayTianShen] || ''
            }
        };
    }

    static evaluateHour(hSolar, userYearInfo, dayZhi) {
        const hLunar = hSolar.getLunar();
        const hourZhi = toViCanChi(hLunar.getTimeZhi());
        const hourGan = toViCanChi(hLunar.getTimeGan());
        const hourCanChi = toViCanChi(hLunar.getTimeInGanZhi());
        const hourTianShen = DEITY_VI[hLunar.getTimeTianShen()] || hLunar.getTimeTianShen();
        const hourTianShenType = hLunar.getTimeTianShenType();

        const userZhi = userYearInfo.zhi;

        const positiveFactors = [];
        const negativeFactors = [];
        let score = 0;
        let isBlock = false;

        // 1. Direct Clash with User Zhi
        if (CHONG_MAP[hourZhi] === userZhi) {
            isBlock = true;
            negativeFactors.push(`Giờ ${hourZhi} phạm Lục Xung trực tiếp với tuổi của bạn (${userZhi} xung ${hourZhi}).`);
        }

        // 2. Clash with Day Zhi
        if (CHONG_MAP[hourZhi] === dayZhi) {
            score -= 2.5;
            negativeFactors.push(`Giờ ${hourZhi} xung Địa Chi ngày (Giờ Phá, không tốt).`);
        }

        // 3. Hour Deity (Thần trị giờ)
        if (hourTianShenType === '黄道') {
            score += 2;
            positiveFactors.push(`Giờ Hoàng Đạo trị nhật bởi thần ${hourTianShen}.`);
        } else {
            score -= 2;
            negativeFactors.push(`Giờ Hắc Đạo trị nhật bởi thần ${hourTianShen}.`);
        }

        // Determine Rating
        let rating = 'Nên';
        if (isBlock) {
            rating = 'Không được';
        } else if (score >= 2) {
            rating = 'Rất tốt';
        } else if (score >= 0) {
            rating = 'Nên';
        } else {
            rating = 'Không nên';
        }

        return {
            rating,
            score,
            positiveFactors,
            negativeFactors,
            hourName: hourZhi,
            hourCanChi,
            deity: hourTianShen,
            deityType: hourTianShenType === '黄道' ? 'Hoàng Đạo' : 'Hắc Đạo',
            deityMeaning: DEITY_MEANINGS[hourTianShen] || '',
            timeRange: HOUR_RANGES[hourZhi] || ''
        };
    }

    static checkDate(birthYear, dateStr, hourStr, activity) {
        let year, month, day;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            day = parseInt(parts[0]);
            month = parseInt(parts[1]);
            year = parseInt(parts[2]);
        } else {
            const parts = dateStr.split('-');
            year = parseInt(parts[0]);
            month = parseInt(parts[1]);
            day = parseInt(parts[2]);
        }

        let hourVal = 12; 
        if (hourStr) {
            hourVal = parseInt(hourStr.split(':')[0]);
        }

        const solar = Solar.fromYmdHms(year, month, day, hourVal, 0, 0);
        const lunar = solar.getLunar();

                const userYearInfo = this.getUserYearInfo(birthYear);
        const dayEvaluation = this.evaluateDay(lunar, userYearInfo, activity);
        const hourEvaluation = this.evaluateHour(solar, userYearInfo, dayEvaluation.lunarDateInfo.dayZhi);

        // Calculate all good hours of the day
        const goodHours = [];
        const hours = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
        const hourValues = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

        hourValues.forEach((hVal, idx) => {
            const hSolar = Solar.fromYmdHms(year, month, day, hVal, 0, 0);
            const hEval = this.evaluateHour(hSolar, userYearInfo, dayEvaluation.lunarDateInfo.dayZhi);
            if (hEval.rating === 'Rất tốt' || hEval.rating === 'Nên') {
                goodHours.push({
                    hourName: hours[idx],
                    timeRange: HOUR_RANGES[hours[idx]],
                    rating: hEval.rating,
                    deity: hEval.deity,
                    deityMeaning: hEval.deityMeaning
                });
            }
        });

        return {
            userYearInfo,
            dayEvaluation,
            hourEvaluation,
            goodHours,
            solarDateInfo: {
                date: `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`,
                hour: hourStr || `${String(hourVal).padStart(2, '0')}:00`
            }
        };
    }

    static consultDates(birthYear, startDateStr, endDateStr, activity) {
        const parseDate = (dStr) => {
            if (dStr.includes('/')) {
                const parts = dStr.split('/');
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            }
            const parts = dStr.split('-');
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        };

        const start = parseDate(startDateStr);
        const end = parseDate(endDateStr);

        const userYearInfo = this.getUserYearInfo(birthYear);
        const recommendations = [];

                const current = new Date(start);
        while (current <= end) {
            const solar = Solar.fromDate(current);
            const lunar = solar.getLunar();
            const dayEval = this.evaluateDay(lunar, userYearInfo, activity);

            const goodHours = [];
            const hours = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
            const hourValues = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

            hourValues.forEach((hVal, idx) => {
                const hSolar = Solar.fromYmdHms(current.getFullYear(), current.getMonth() + 1, current.getDate(), hVal, 0, 0);
                const hEval = this.evaluateHour(hSolar, userYearInfo, dayEval.lunarDateInfo.dayZhi);
                if (hEval.rating === 'Rất tốt' || hEval.rating === 'Nên') {
                    goodHours.push({
                        hourName: hours[idx],
                        timeRange: HOUR_RANGES[hours[idx]],
                        rating: hEval.rating,
                        deity: hEval.deity,
                        deityMeaning: hEval.deityMeaning
                    });
                }
            });

            recommendations.push({
                solarDate: `${String(current.getDate()).padStart(2, '0')}/${String(current.getMonth() + 1).padStart(2, '0')}/${current.getFullYear()}`,
                dayEvaluation: dayEval,
                goodHours
            });

            current.setDate(current.getDate() + 1);
        }

        return {
            userYearInfo,
            recommendations
        };
    }
}

module.exports = DateService;
