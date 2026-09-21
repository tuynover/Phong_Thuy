const { Solar, Lunar, SolarMonth } = require('lunar-javascript');
const BaziAnalyzer = require('../../bazi/services/BaziAnalyzer');
const { getAsync, setExAsync } = require('../../../core/config/redis');
const logger = require('../../../core/services/LoggerService');

const GAN_VI = {
    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
};

const ZHI_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const ZHI_ANIMALS = {
    'Tý': 'Chuột', 'Sửu': 'Trâu', 'Dần': 'Hổ', 'Mão': 'Mèo',
    'Thìn': 'Rồng', 'Tỵ': 'Rắn', 'Ngọ': 'Ngựa', 'Mùi': 'Dê',
    'Thân': 'Khỉ', 'Dậu': 'Gà', 'Tuất': 'Chó', 'Hợi': 'Lợn'
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

const STEM_INFO = {
    'Giáp': { el: 'Mộc', pol: 1 },
    'Ất': { el: 'Mộc', pol: -1 },
    'Bính': { el: 'Hỏa', pol: 1 },
    'Đinh': { el: 'Hỏa', pol: -1 },
    'Mậu': { el: 'Thổ', pol: 1 },
    'Kỷ': { el: 'Thổ', pol: -1 },
    'Canh': { el: 'Kim', pol: 1 },
    'Tân': { el: 'Kim', pol: -1 },
    'Nhâm': { el: 'Thủy', pol: 1 },
    'Quý': { el: 'Thủy', pol: -1 }
};

const BRANCH_ELEMENTS = {
    'Tý': 'Thủy', 'Sửu': 'Thổ', 'Dần': 'Mộc', 'Mão': 'Mộc',
    'Thìn': 'Thổ', 'Tỵ': 'Hỏa', 'Ngọ': 'Hỏa', 'Mùi': 'Thổ',
    'Thân': 'Kim', 'Dậu': 'Kim', 'Tuất': 'Thổ', 'Hợi': 'Thủy'
};

const GEN_MAP = { 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim', 'Kim': 'Thủy', 'Thủy': 'Mộc' };
const OVER_MAP = { 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim', 'Kim': 'Mộc' };

const LUC_HOP = {
    'Tý': 'Sửu', 'Sửu': 'Tý', 'Dần': 'Hợi', 'Hợi': 'Dần',
    'Mão': 'Tuất', 'Tuất': 'Mão', 'Thìn': 'Dậu', 'Dậu': 'Thìn',
    'Tỵ': 'Thân', 'Thân': 'Tỵ', 'Ngọ': 'Mùi', 'Mùi': 'Ngọ'
};

const TAM_HOP_GROUPS = [
    ['Thân', 'Tý', 'Thìn'],
    ['Hợi', 'Mão', 'Mùi'],
    ['Dần', 'Ngọ', 'Tuất'],
    ['Tỵ', 'Dậu', 'Sửu']
];

const LUC_XUNG = {
    'Tý': 'Ngọ', 'Ngọ': 'Tý', 'Sửu': 'Mùi', 'Mùi': 'Sửu',
    'Dần': 'Thân', 'Thân': 'Dần', 'Mão': 'Dậu', 'Dậu': 'Mão',
    'Thìn': 'Tuất', 'Tuất': 'Thìn', 'Tỵ': 'Hợi', 'Hợi': 'Tỵ'
};

const TUONG_HAI = {
    'Tý': 'Mùi', 'Mùi': 'Tý', 'Sửu': 'Ngọ', 'Ngọ': 'Sửu',
    'Dần': 'Tỵ', 'Tỵ': 'Dần', 'Mão': 'Thìn', 'Thìn': 'Mão',
    'Thân': 'Hợi', 'Hợi': 'Thân', 'Dậu': 'Tuất', 'Tuất': 'Dậu'
};

const HOUR_RANGES = {
    'Tý': '23h - 01h', 'Sửu': '01h - 03h', 'Dần': '03h - 05h', 'Mão': '05h - 07h',
    'Thìn': '07h - 09h', 'Tỵ': '09h - 11h', 'Ngọ': '11h - 13h', 'Mùi': '13h - 15h',
    'Thân': '15h - 17h', 'Dậu': '17h - 19h', 'Tuất': '19h - 21h', 'Hợi': '21h - 23h'
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

const STEM_COMBINES = {
    'Giáp': 'Kỷ', 'Kỷ': 'Giáp',
    'Ất': 'Canh', 'Canh': 'Ất',
    'Bính': 'Tân', 'Tân': 'Bính',
    'Đinh': 'Nhâm', 'Nhâm': 'Đinh',
    'Mậu': 'Quý', 'Quý': 'Mậu'
};

const STEM_CLASHES = {
    'Giáp': 'Canh', 'Canh': 'Giáp',
    'Ất': 'Tân', 'Tân': 'Ất',
    'Bính': 'Nhâm', 'Nhâm': 'Bính',
    'Đinh': 'Quý', 'Quý': 'Đinh'
};

const toViCanChi = (hanStr) => {
    if (!hanStr) return '';
    let result = hanStr;
    for (const [han, vi] of Object.entries(GAN_VI)) result = result.replace(new RegExp(han, 'g'), vi + ' ');
    for (const [han, vi] of Object.entries(ZHI_VI)) result = result.replace(new RegExp(han, 'g'), vi);
    return result.trim().replace(/\s+/g, ' ');
};

const getThapThan = (dayMaster, targetStem) => {
    if (!STEM_INFO[dayMaster] || !STEM_INFO[targetStem]) return '';
    const d = STEM_INFO[dayMaster];
    const t = STEM_INFO[targetStem];
    const samePol = d.pol === t.pol;

    if (d.el === t.el) return samePol ? 'Tỷ Kiên' : 'Kiếp Tài';
    if (GEN_MAP[d.el] === t.el) return samePol ? 'Thực Thần' : 'Thương Quan';
    if (OVER_MAP[d.el] === t.el) return samePol ? 'Thiên Tài' : 'Chính Tài';
    if (OVER_MAP[t.el] === d.el) return samePol ? 'Thất Sát' : 'Chính Quan';
    if (GEN_MAP[t.el] === d.el) return samePol ? 'Thiên Ấn' : 'Chính Ấn';
    return '';
};

const isTamHop = (z1, z2) => {
    if (!z1 || !z2) return false;
    for (const grp of TAM_HOP_GROUPS) {
        if (grp.includes(z1) && grp.includes(z2) && z1 !== z2) return true;
    }
    return false;
};

class PersonalizedAlmanacService {
    /**
     * Trích xuất thông tin Bát Tự cốt lõi từ user/input cho phiên bản Nâng Cao (Bát Tự Tứ Trụ)
     */
    static resolveBaziProfile(baziInput) {
        if (!baziInput) return null;

        if (baziInput.dayMaster && baziInput.dungThan) {
            return {
                dayMaster: baziInput.dayMaster,
                dayZhi: baziInput.dayZhi || null,
                yearZhi: baziInput.yearZhi || null,
                dungThan: baziInput.dungThan,
                hyThan: baziInput.hyThan || null,
                kyThan: baziInput.kyThan || null
            };
        }

        const date = baziInput.date || (baziInput.day && baziInput.month && baziInput.year ? `${String(baziInput.day).padStart(2, '0')}/${String(baziInput.month).padStart(2, '0')}/${baziInput.year}` : null);
        const time = baziInput.time || (baziInput.hour !== undefined ? `${String(baziInput.hour).padStart(2, '0')}:${String(baziInput.minute || 0).padStart(2, '0')}` : '12:00');
        const gender = baziInput.gender !== undefined ? parseInt(baziInput.gender, 10) : 1;

        if (date) {
            try {
                const analysis = BaziAnalyzer.analyze(date, time, gender, 'midnight');
                if (analysis && analysis.canChi) {
                    return {
                        dayMaster: analysis.canChi.day?.gan,
                        dayZhi: analysis.canChi.day?.zhi,
                        yearZhi: analysis.canChi.year?.zhi,
                        dungThan: analysis.dungThanInfo?.primary?.dungThan || analysis.dungThan,
                        hyThan: analysis.dungThanInfo?.primary?.hyThan || analysis.hyThan,
                        kyThan: analysis.dungThanInfo?.primary?.kyThan || analysis.kyThan
                    };
                }
            } catch (err) {
                logger.warn('[PersonalizedAlmanac] Analyze bazi fallback error:', err.message);
            }
        }

        return null;
    }

    /**
     * Trích xuất thông tin Năm Sinh cho phiên bản Cơ Bản (Theo Năm Sinh / Con Giáp)
     */
    static resolveYearProfile(rawInput) {
        if (!rawInput) return null;
        let yNum = null;
        if (rawInput.birthYear) yNum = parseInt(rawInput.birthYear, 10);
        else if (rawInput.year) yNum = parseInt(rawInput.year, 10);
        else if (rawInput.date) {
            const match = String(rawInput.date).match(/\b(19\d{2}|20\d{2})\b/);
            if (match) yNum = parseInt(match[1], 10);
        }
        if (!yNum || isNaN(yNum)) return null;

        try {
            const l = Lunar.fromYmd(yNum, 6, 1);
            const yearGanZhiHan = l.getYearInGanZhi();
            const yearCanChi = toViCanChi(yearGanZhiHan);
            const parts = yearCanChi.split(' ');
            const yearGan = parts[0] || '';
            const yearZhi = parts[1] || '';
            const napAm = NAYIN_MAP[yearCanChi] || 'Bình Hòa';
            const napAmEl = napAm.split(' ').pop();
            const shengXiao = ZHI_ANIMALS[yearZhi] || l.getYearShengXiao();

            return {
                mode: 'year',
                birthYear: yNum,
                yearCanChi,
                yearGan,
                yearZhi,
                napAm,
                napAmEl,
                shengXiao,
                title: `Tuổi ${yearCanChi} (${shengXiao}) • Mệnh ${napAm}`
            };
        } catch (e) {
            logger.warn('[PersonalizedAlmanac] Resolve year profile error:', e.message);
            return null;
        }
    }

    /**
     * Lấy ma trận cuốn lịch trọn vẹn của 1 tháng kèm cá nhân hóa (hỗ trợ mode = 'year' hoặc 'bazi')
     */
    static async getMonthCalendar(userId, year, month, rawBazi, mode = 'bazi') {
        const y = parseInt(year, 10);
        const m = parseInt(month, 10);
        const calcMode = mode === 'year' ? 'year' : 'bazi';

        const bazi = calcMode === 'bazi' ? this.resolveBaziProfile(rawBazi) : null;
        const yearProfile = calcMode === 'year' ? this.resolveYearProfile(rawBazi) : null;

        let profileKey = 'general';
        if (calcMode === 'bazi' && bazi) {
            profileKey = `bazi_${bazi.dayMaster}_${bazi.dayZhi}_${bazi.dungThan}`;
        } else if (calcMode === 'year' && yearProfile) {
            profileKey = `year_${yearProfile.yearCanChi}`;
        }

        const cacheKey = `almanac:month:${userId || 'user'}:${calcMode}:${profileKey}:${y}:${m}`;

        try {
            const cached = await getAsync(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (e) {
            // ignore redis error
        }

        const solarMonth = SolarMonth.fromYm(y, m);
        const days = solarMonth.getDays();

        const today = new Date();
        const todayYear = today.getFullYear();
        const todayMonth = today.getMonth() + 1;
        const todayDate = today.getDate();
        const todayMidnight = new Date(todayYear, todayMonth - 1, todayDate).getTime();

        // 1. Phân tích từng ngày trong tháng
        const calendarDays = days.map(sDay => {
            const lDay = sDay.getLunar();
            const sY = sDay.getYear();
            const sM = sDay.getMonth();
            const sD = sDay.getDay();

            const cellMidnight = new Date(sY, sM - 1, sD).getTime();
            const isToday = cellMidnight === todayMidnight;
            const isPast = cellMidnight < todayMidnight;
            const dayOfWeek = sDay.getWeek(); // 0 = CN, 1 = T2...

            const ganZhi = lDay.getDayInGanZhiExact();
            const dayCanChi = toViCanChi(ganZhi);
            const parts = dayCanChi.split(' ');
            const dayGan = parts[0] || '';
            const dayZhi = parts[1] || '';

            const trucHan = lDay.getZhiXing();
            const truc = TRUC_VI[trucHan] || trucHan;

            const deityHan = lDay.getDayTianShen();
            const deityName = DEITY_VI[deityHan] || deityHan;
            const deityType = lDay.getDayTianShenType() === '黄道' ? 'Hoàng Đạo' : 'Hắc Đạo';

            const jieQi = lDay.getJieQi() || null;

            let score = 50;
            let thapThan = '';
            let energyTier = 'neutral';
            let tag = '';
            const highlights = [];

            // Điểm hoàng đạo / trực ngày cơ bản
            if (deityType === 'Hoàng Đạo') score += 8;
            else score -= 8;

            if (['Thành', 'Khai', 'Định', 'Mãn'].includes(truc)) score += 6;
            else if (['Phá', 'Nguy', 'Bế'].includes(truc)) score -= 8;

            // PHIÊN BẢN 1: THEO NĂM SINH (CƠ BẢN)
            if (calcMode === 'year' && yearProfile) {
                const dayNapAm = NAYIN_MAP[dayCanChi] || '';
                const dayNapAmEl = dayNapAm.split(' ').pop();

                // 1. Chi ngày vs Chi năm sinh (Tuổi)
                if (LUC_HOP[dayZhi] === yearProfile.yearZhi) {
                    score += 18;
                    tag = 'Lục Hợp Tuổi';
                    highlights.push(`Lục Hợp với tuổi ${yearProfile.yearCanChi} (${yearProfile.yearZhi} hợp ${dayZhi})`);
                } else if (isTamHop(dayZhi, yearProfile.yearZhi)) {
                    score += 14;
                    if (!tag) tag = 'Tam Hợp Tuổi';
                    highlights.push(`Tam Hợp với tuổi ${yearProfile.yearCanChi}`);
                } else if (LUC_XUNG[dayZhi] === yearProfile.yearZhi) {
                    score -= 26;
                    tag = 'Trực Xung Tuổi';
                    highlights.push(`Lục Xung trực tiếp với tuổi ${yearProfile.yearCanChi} (${yearProfile.yearZhi} xung ${dayZhi})`);
                } else if (TUONG_HAI[dayZhi] === yearProfile.yearZhi) {
                    score -= 14;
                    tag = 'Tương Hại Tuổi';
                    highlights.push(`Tương Hại với tuổi ${yearProfile.yearCanChi}`);
                }

                // 2. Can ngày vs Can năm sinh
                if (STEM_COMBINES[dayGan] === yearProfile.yearGan) {
                    score += 10;
                    highlights.push(`Thiên can tương hợp (${dayGan} hợp ${yearProfile.yearGan})`);
                } else if (STEM_CLASHES[dayGan] === yearProfile.yearGan) {
                    score -= 12;
                    highlights.push(`Thiên can tương xung (${dayGan} xung ${yearProfile.yearGan})`);
                }

                // 3. Ngũ Hành Nạp Âm
                if (dayNapAmEl && yearProfile.napAmEl) {
                    if (GEN_MAP[dayNapAmEl] === yearProfile.napAmEl) {
                        score += 15;
                        highlights.push(`Nạp âm ngày tương sinh Mệnh Niên (${yearProfile.napAm})`);
                        if (!tag) tag = 'Tương Sinh Mệnh';
                    } else if (dayNapAmEl === yearProfile.napAmEl) {
                        score += 8;
                        highlights.push(`Nạp âm ngày đồng hành Mệnh Niên (${yearProfile.napAm})`);
                    } else if (OVER_MAP[dayNapAmEl] === yearProfile.napAmEl) {
                        score -= 18;
                        highlights.push(`Nạp âm ngày (${dayNapAm}) khắc Mệnh Niên (${yearProfile.napAm})`);
                        if (!tag) tag = 'Tương Khắc Mệnh';
                    } else if (OVER_MAP[yearProfile.napAmEl] === dayNapAmEl) {
                        score += 6;
                        highlights.push(`Mệnh Niên khắc chế Nạp âm ngày`);
                    }
                }
            } 
            // PHIÊN BẢN 2: THEO BÁT TỰ TỨ TRỤ (NÂNG CAO)
            else if (calcMode === 'bazi' && bazi && bazi.dayMaster) {
                thapThan = getThapThan(bazi.dayMaster, dayGan);
                const dayStemEl = STEM_INFO[dayGan]?.el;
                const dayBranchEl = BRANCH_ELEMENTS[dayZhi];

                // 1. Điểm Thập Thần
                if (['Chính Ấn', 'Thiên Tài', 'Chính Quan', 'Thực Thần'].includes(thapThan)) {
                    score += 14;
                    tag = thapThan;
                    highlights.push(`Nạp khí cát tường từ ${thapThan}`);
                } else if (['Thiên Ấn', 'Chính Tài', 'Tỷ Kiên'].includes(thapThan)) {
                    score += 8;
                    if (!tag) tag = thapThan;
                } else if (thapThan === 'Thất Sát') {
                    score -= 8;
                    highlights.push('Áp lực kỷ luật & thử thách (Thất Sát)');
                    tag = 'Thất Sát';
                } else if (thapThan === 'Kiếp Tài') {
                    score -= 6;
                    highlights.push('Đề phòng hao tài (Kiếp Tài)');
                }

                // 2. Điểm Dụng Thần / Kỵ Thần
                if (dayStemEl === bazi.dungThan || dayBranchEl === bazi.dungThan) {
                    score += 18;
                    highlights.push(`Trợ lực Dụng Thần (${bazi.dungThan})`);
                    if (!tag) tag = 'Vượng Dụng Thần';
                } else if (dayStemEl === bazi.hyThan || dayBranchEl === bazi.hyThan) {
                    score += 10;
                    highlights.push(`Tương sinh Hỷ Thần (${bazi.hyThan})`);
                } else if (dayStemEl === bazi.kyThan || dayBranchEl === bazi.kyThan) {
                    score -= 16;
                    highlights.push(`Phạm Kỵ Thần (${bazi.kyThan})`);
                }

                // 3. Tương tác Chi Ngày sinh
                if (bazi.dayZhi) {
                    if (LUC_HOP[dayZhi] === bazi.dayZhi) {
                        score += 14;
                        tag = 'Lục Hợp';
                        highlights.push(`Lục Hợp với Chi Ngày sinh (${bazi.dayZhi})`);
                    } else if (isTamHop(dayZhi, bazi.dayZhi)) {
                        score += 12;
                        if (!tag) tag = 'Tam Hợp';
                        highlights.push(`Tam Hợp với Chi Ngày sinh (${bazi.dayZhi})`);
                    } else if (LUC_XUNG[dayZhi] === bazi.dayZhi) {
                        score -= 22;
                        tag = 'Tương Xung';
                        highlights.push(`Lục Xung trực tiếp Chi Ngày sinh (${bazi.dayZhi} xung ${dayZhi})`);
                    } else if (TUONG_HAI[dayZhi] === bazi.dayZhi) {
                        score -= 10;
                        highlights.push(`Tương Hại Chi Ngày sinh (${bazi.dayZhi})`);
                    }
                }

                // 4. Tương tác Chi Năm sinh
                if (bazi.yearZhi && bazi.yearZhi !== bazi.dayZhi) {
                    if (LUC_XUNG[dayZhi] === bazi.yearZhi) {
                        score -= 12;
                        highlights.push(`Xung tuổi (${bazi.yearZhi} xung ${dayZhi})`);
                    } else if (LUC_HOP[dayZhi] === bazi.yearZhi) {
                        score += 8;
                        highlights.push(`Hợp tuổi (${bazi.yearZhi})`);
                    }
                }
            }

            // Chuẩn hóa điểm 10 - 98
            const finalScore = Math.max(12, Math.min(98, score));

            if (finalScore >= 75) {
                energyTier = 'auspicious';
                if (!tag) tag = 'Cát Tường';
            } else if (finalScore < 50) {
                energyTier = 'caution';
                if (!tag) tag = 'Thận Trọng';
            } else {
                energyTier = 'neutral';
                if (!tag) tag = 'Bình Hòa';
            }

            const rawMonth = lDay.getMonth();
            const absMonth = Math.abs(rawMonth);
            const isLeapMonth = rawMonth < 0;

            return {
                solarDate: `${sY}-${String(sM).padStart(2, '0')}-${String(sD).padStart(2, '0')}`,
                day: sD,
                month: sM,
                year: sY,
                dayOfWeek,
                dateStr: `${String(sD).padStart(2, '0')}/${String(sM).padStart(2, '0')}/${sY}`,
                lunarDay: lDay.getDay(),
                lunarMonth: absMonth,
                isLeapMonth,
                lunarYear: lDay.getYear(),
                dayCanChi,
                dayGan,
                dayZhi,
                truc,
                deityName,
                deityType,
                jieQi,
                score: finalScore,
                energyTier,
                tag,
                thapThan,
                highlights,
                isToday,
                isPast
            };
        });

        // 2. Tổng quan năng lượng tháng
        const sampleLunar = days[15] ? days[15].getLunar() : days[0].getLunar();
        const monthGanZhi = toViCanChi(sampleLunar.getMonthInGanZhiExact());
        const yearGanZhi = toViCanChi(sampleLunar.getYearInGanZhiExact());

        let monthlyOutlook = null;
        if (calcMode === 'year' && yearProfile) {
            const monthZhi = monthGanZhi.split(' ')[1] || '';
            const isMonthHop = LUC_HOP[monthZhi] === yearProfile.yearZhi || isTamHop(monthZhi, yearProfile.yearZhi);
            const isMonthXung = LUC_XUNG[monthZhi] === yearProfile.yearZhi || TUONG_HAI[monthZhi] === yearProfile.yearZhi;

            let themeTitle = `Tháng Bình Hòa - Vững Vàng Cho Tuổi ${yearProfile.yearCanChi}`;
            let status = 'neutral';
            let summary = `Tháng ${monthGanZhi} mang năng lượng âm dương điều hòa cho tuổi ${yearProfile.yearCanChi} (${yearProfile.shengXiao}). Đây là thời điểm thích hợp để củng cố nền tảng, duy trì sự ổn định trong công việc và các mối quan hệ.`;
            let favorable = [
                `Khai thác năng lượng Mệnh Niên ${yearProfile.napAm} để gia tăng may mắn`,
                'Duy trì sự ổn định, hoàn thiện các kế hoạch đang dở dang',
                'Tăng cường gắn kết gia đạo và đồng nghiệp'
            ];
            let cautions = [
                'Tránh các khoản chi tiêu quá đà hoặc đầu tư mạo hiểm',
                'Cẩn trọng khẩu thiệt và các tranh chấp không cần thiết'
            ];

            if (isMonthHop) {
                themeTitle = `Tháng Hợp Tuổi - Thuận Buồm Xuôi Gió Cho Tuổi ${yearProfile.yearCanChi}`;
                status = 'favorable';
                summary = `Tháng ${monthGanZhi} tương hợp đắc lực với tuổi ${yearProfile.yearCanChi} (${yearProfile.yearZhi}). Năng lượng cát khí tương sinh giúp mọi sự hanh thông, dễ gặp quý nhân trợ giúp trên bước đường sự nghiệp và tài lộc.`;
                favorable.unshift(`Tự tin triển khai các dự định, kế hoạch lớn trong tháng`);
            } else if (isMonthXung) {
                themeTitle = `Tháng Xung Tuổi - Thủ Thế Bồi Đắp Cho Tuổi ${yearProfile.yearCanChi}`;
                status = 'caution';
                summary = `Tháng ${monthGanZhi} có tương tác xung khắc với chi tuổi ${yearProfile.yearZhi}. Bạn nên điềm tĩnh, chú trọng an toàn cá nhân, tránh đối đầu trực diện và bảo toàn nguồn lực tài chính.`;
                cautions.unshift(`Đặc biệt đề phòng các ngày có địa chi ${monthZhi} xung khắc`);
            }

            monthlyOutlook = {
                monthCanChi: monthGanZhi,
                yearCanChi: yearGanZhi,
                themeTitle,
                status,
                thapThan: 'Mệnh Niên',
                summary,
                favorableActivities: favorable,
                cautions
            };
        } else if (calcMode === 'bazi' && bazi && bazi.dayMaster) {
            const mGan = monthGanZhi.split(' ')[0] || '';
            const mZhi = monthGanZhi.split(' ')[1] || '';
            const mThapThan = getThapThan(bazi.dayMaster, mGan);
            const mStemEl = STEM_INFO[mGan]?.el;
            const mBranchEl = BRANCH_ELEMENTS[mZhi];

            const isFavorable = mStemEl === bazi.dungThan || mBranchEl === bazi.dungThan;
            const isChallenging = mStemEl === bazi.kyThan || mBranchEl === bazi.kyThan;

            let themeTitle = `Tháng ${mThapThan} - Khởi Sắc`;
            let status = isFavorable ? 'favorable' : (isChallenging ? 'caution' : 'neutral');
            let summary = '';
            let favorable = [];
            let cautions = [];

            if (['Chính Tài', 'Thiên Tài'].includes(mThapThan)) {
                themeTitle = `Tháng ${mThapThan} - Khai Thông Tài Lộc & Cơ Hội Đầu Tư`;
                summary = `Tháng này mang năng lượng ${mThapThan} vượng sắc, tạo đà cho các hoạt động tài chính, thương lượng hợp đồng và mở rộng kinh doanh.`;
                favorable = [
                    'Tập trung đàm phán hợp đồng thương mại, ký kết giao dịch lớn',
                    'Đầu tư mở rộng kinh doanh hoặc gia tăng thu nhập thụ động',
                    'Thiết lập quan hệ đối tác tin cậy'
                ];
                cautions = [
                    'Tránh các hình thức đầu cơ siêu rủi ro, cờ bạc',
                    'Minh bạch hóa các khoản thu chi để tránh thất thoát'
                ];
            } else if (['Chính Quan', 'Thất Sát'].includes(mThapThan)) {
                themeTitle = `Tháng ${mThapThan} - Khẳng Định Quyền Uy & Thăng Tiến Sự Nghiệp`;
                summary = `Tháng này năng lượng ${mThapThan} tác động trực tiếp. Bạn có cơ hội đảm nhận trọng trách mới, nâng cao uy tín chuyên môn nhưng cũng đi kèm áp lực kỷ luật.`;
                favorable = [
                    'Chủ động nhận các đầu việc quan trọng, thể hiện năng lực điều hành',
                    'Hoàn thiện hồ sơ pháp lý, chứng chỉ chuyên môn',
                    'Thiết lập quy trình làm việc chuẩn mực cho đội nhóm'
                ];
                cautions = [
                    'Tránh đối đầu trực diện hoặc vi phạm quy chế cơ quan',
                    'Kiểm soát căng thẳng, tránh để áp lực công việc ảnh hưởng giấc ngủ'
                ];
            } else if (['Chính Ấn', 'Thiên Ấn'].includes(mThapThan)) {
                themeTitle = `Tháng ${mThapThan} - Trí Tuệ Tĩnh Lặng & Quý Nhân Tương Trợ`;
                summary = `Tháng này được bao bọc bởi năng lượng ${mThapThan}. Tâm trí sáng suốt, rất thuận lợi cho việc học tập, nghiên cứu chuyên sâu, thiền định và đón nhận sự chỉ dẫn từ tiền bối.`;
                favorable = [
                    'Đăng ký các khóa đào tạo chuyên môn, trau dồi tri thức mới',
                    'Ký kết văn bản, nộp hồ sơ bằng cấp, xuất bản công trình',
                    'Dành thời gian chăm sóc sức khỏe tinh thần và gắn kết gia đình'
                ];
                cautions = [
                    'Tránh tư tưởng trì trệ, chậm chạp hoặc quá an phận thủ thường',
                    'Cân bằng giữa lý thuyết học tập và thực tế hành động'
                ];
            } else if (['Thực Thần', 'Thương Quan'].includes(mThapThan)) {
                themeTitle = `Tháng ${mThapThan} - Bùng Nổ Sáng Tạo & Lan Tỏa Tinh Hoa`;
                summary = `Tháng này năng lượng phát tiết của ${mThapThan} đạt đỉnh. Đầu óc nhạy bén, dồi dào ý tưởng đổi mới, rất thích hợp cho tiếp thị, thuyết trình, nghệ thuật.`;
                favorable = [
                    'Ra mắt sản phẩm mới, chiến dịch truyền thông sáng tạo',
                    'Gặp gỡ đối tác, chia sẻ ý tưởng tại các hội thảo',
                    'Tìm kiếm giải pháp mới giải quyết các nút thắt tồn đọng'
                ];
                cautions = [
                    'Tiết chế lời nói, tránh phát ngôn thẳng thắn làm tổn thương người khác',
                    'Tránh ôm đồm quá nhiều dự án cùng lúc khiến kiệt sức'
                ];
            } else {
                themeTitle = `Tháng ${mThapThan} - Mở Rộng Hợp Tác & Thắt Chặt Tình Bằng Hữu`;
                summary = `Tháng này mang năng lượng ${mThapThan}, khuyến khích tinh thần kết nối bạn bè, tìm kiếm cộng sự đồng chí hướng.`;
                favorable = [
                    'Tìm kiếm cộng sự, kết nối đối tác có chung tầm nhìn',
                    'Học hỏi kinh nghiệm từ các đồng nghiệp xuất sắc',
                    'Tham gia các hoạt động thiện nguyện, xây dựng cộng đồng'
                ];
                cautions = [
                    'Không nên cho vay mượn tiền bạc khi không có cam kết pháp lý',
                    'Tránh tranh chấp quyền lợi hoặc so đo hơn thua với người thân'
                ];
            }

            if (isFavorable) {
                summary += ` Đặc biệt, ngũ hành tháng nạp khí Dụng Thần (${bazi.dungThan}) bản mệnh, tạo thế "Thuận Phong Đắc Ý".`;
            } else if (isChallenging) {
                summary += ` Ngũ hành tháng nạp khí Kỵ Thần (${bazi.kyThan}), bạn nên ưu tiên chiến lược "Thủ Thế Bồi Đắp".`;
            }

            monthlyOutlook = {
                monthCanChi: monthGanZhi,
                yearCanChi: yearGanZhi,
                themeTitle,
                status,
                thapThan: mThapThan,
                summary,
                favorableActivities: favorable,
                cautions
            };
        }

        const result = {
            year: y,
            month: m,
            mode: calcMode,
            hasPersonalizedProfile: !!(calcMode === 'year' ? yearProfile : (bazi && bazi.dayMaster)),
            profile: calcMode === 'year' ? yearProfile : (bazi ? {
                dayMaster: bazi.dayMaster,
                dungThan: bazi.dungThan,
                hyThan: bazi.hyThan,
                kyThan: bazi.kyThan
            } : null),
            monthlyOutlook,
            days: calendarDays
        };

        // Cache Redis 12 giờ
        try {
            await setExAsync(cacheKey, 12 * 3600, JSON.stringify(result));
        } catch (e) {
            // ignore redis error
        }

        return result;
    }

    /**
     * Lấy phân tích chi tiết của 1 ngày cụ thể kèm Giờ Hoàng Đạo vượng nhất
     */
    static async getDayDetail(userId, dateStr, rawBazi, mode = 'bazi') {
        let y, m, d;
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            d = parseInt(parts[0], 10);
            m = parseInt(parts[1], 10);
            y = parseInt(parts[2], 10);
        } else {
            const parts = dateStr.split('-');
            y = parseInt(parts[0], 10);
            m = parseInt(parts[1], 10);
            d = parseInt(parts[2], 10);
        }

        const calcMode = mode === 'year' ? 'year' : 'bazi';
        const bazi = calcMode === 'bazi' ? this.resolveBaziProfile(rawBazi) : null;
        const yearProfile = calcMode === 'year' ? this.resolveYearProfile(rawBazi) : null;

        const solar = Solar.fromYmd(y, m, d);
        const lunar = solar.getLunar();

        const ganZhi = lunar.getDayInGanZhiExact();
        const dayCanChi = toViCanChi(ganZhi);
        const parts = dayCanChi.split(' ');
        const dayGan = parts[0] || '';
        const dayZhi = parts[1] || '';

        const trucHan = lunar.getZhiXing();
        const truc = TRUC_VI[trucHan] || trucHan;

        const deityHan = lunar.getDayTianShen();
        const deityName = DEITY_VI[deityHan] || deityHan;
        const deityType = lunar.getDayTianShenType() === '黄道' ? 'Hoàng Đạo' : 'Hắc Đạo';

        // Đánh giá 12 khung giờ trong ngày
        const allHours = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
        const evaluatedHours = allHours.map((hZhi, idx) => {
            const testHourNum = (idx * 2) % 24;
            const hSolar = Solar.fromYmdHms(y, m, d, testHourNum, 0, 0);
            const hLunar = hSolar.getLunar();

            const hourCanChi = toViCanChi(hLunar.getTimeInGanZhi());
            const hourTianShen = DEITY_VI[hLunar.getTimeTianShen()] || hLunar.getTimeTianShen();
            const isHoangDao = hLunar.getTimeTianShenType() === '黄道';

            let hScore = isHoangDao ? 5 : -5;
            let isClash = false;

            if (calcMode === 'year' && yearProfile) {
                if (LUC_XUNG[hZhi] === yearProfile.yearZhi) {
                    isClash = true;
                    hScore -= 25;
                }
                if (LUC_HOP[hZhi] === yearProfile.yearZhi) {
                    hScore += 10;
                }
            } else if (calcMode === 'bazi' && bazi) {
                if (bazi.dayZhi && LUC_XUNG[hZhi] === bazi.dayZhi) {
                    isClash = true;
                    hScore -= 20;
                }
                if (bazi.yearZhi && LUC_XUNG[hZhi] === bazi.yearZhi) {
                    hScore -= 10;
                }
                if (LUC_HOP[hZhi] === dayZhi || (bazi.dayZhi && LUC_HOP[hZhi] === bazi.dayZhi)) {
                    hScore += 6;
                }
            }

            return {
                branch: hZhi,
                canChi: hourCanChi,
                range: HOUR_RANGES[hZhi],
                isHoangDao,
                isClash,
                deity: hourTianShen,
                score: hScore
            };
        });

        // Lọc top 3 giờ hoàng đạo tốt nhất không bị xung
        const luckyHours = evaluatedHours
            .filter(h => h.isHoangDao && !h.isClash)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        let thapThan = '';
        let personalizedScore = 50;
        let adviceDo = [];
        let adviceDont = [];
        let highlights = [];

        if (deityType === 'Hoàng Đạo') personalizedScore += 8;
        else personalizedScore -= 8;

        if (['Thành', 'Khai', 'Định', 'Mãn'].includes(truc)) personalizedScore += 6;
        else if (['Phá', 'Nguy', 'Bế'].includes(truc)) personalizedScore -= 8;

        if (calcMode === 'year' && yearProfile) {
            const dayNapAm = NAYIN_MAP[dayCanChi] || '';
            const dayNapAmEl = dayNapAm.split(' ').pop();

            if (LUC_HOP[dayZhi] === yearProfile.yearZhi) {
                personalizedScore += 18;
                highlights.push(`Lục Hợp với tuổi ${yearProfile.yearCanChi} (${yearProfile.yearZhi} hợp ${dayZhi})`);
            } else if (isTamHop(dayZhi, yearProfile.yearZhi)) {
                personalizedScore += 14;
                highlights.push(`Tam Hợp với tuổi ${yearProfile.yearCanChi}`);
            } else if (LUC_XUNG[dayZhi] === yearProfile.yearZhi) {
                personalizedScore -= 26;
                highlights.push(`Lục Xung trực tiếp với tuổi ${yearProfile.yearCanChi} (${yearProfile.yearZhi} xung ${dayZhi})`);
            } else if (TUONG_HAI[dayZhi] === yearProfile.yearZhi) {
                personalizedScore -= 14;
                highlights.push(`Tương Hại với tuổi ${yearProfile.yearCanChi}`);
            }

            if (dayNapAmEl && yearProfile.napAmEl) {
                if (GEN_MAP[dayNapAmEl] === yearProfile.napAmEl) {
                    personalizedScore += 15;
                    highlights.push(`Nạp âm ngày tương sinh Mệnh Niên (${yearProfile.napAm})`);
                } else if (OVER_MAP[dayNapAmEl] === yearProfile.napAmEl) {
                    personalizedScore -= 18;
                    highlights.push(`Nạp âm ngày (${dayNapAm}) khắc Mệnh Niên (${yearProfile.napAm})`);
                }
            }

            adviceDo = [
                'Tiến hành các công việc trọng đại trong khung giờ Hoàng Đạo đã chọn lọc',
                'Kết nối, giao dịch với những đối tác có con giáp tương hợp',
                'Chú trọng an yên, duy trì sự cân bằng thân tâm'
            ];
            adviceDont = [
                'Tránh các quyết định bốc đồng vào các khung giờ xung tuổi',
                'Không nên tranh cãi hoặc xung đột trực diện trong ngày'
            ];
        } else if (calcMode === 'bazi' && bazi && bazi.dayMaster) {
            thapThan = getThapThan(bazi.dayMaster, dayGan);
            const dayStemEl = STEM_INFO[dayGan]?.el;
            const dayBranchEl = BRANCH_ELEMENTS[dayZhi];

            if (['Chính Ấn', 'Thiên Tài', 'Chính Quan', 'Thực Thần'].includes(thapThan)) {
                personalizedScore += 16;
                highlights.push(`Đón nhận cát khí từ ${thapThan}`);
            } else if (['Thiên Ấn', 'Chính Tài', 'Tỷ Kiên'].includes(thapThan)) {
                personalizedScore += 8;
            } else if (thapThan === 'Thất Sát') {
                personalizedScore -= 8;
                highlights.push('Áp lực và thử thách (Thất Sát)');
            } else if (thapThan === 'Kiếp Tài') {
                personalizedScore -= 6;
                highlights.push('Đề phòng hao tài (Kiếp Tài)');
            }

            if (dayStemEl === bazi.dungThan || dayBranchEl === bazi.dungThan) {
                personalizedScore += 18;
                highlights.push(`Ngũ hành ngày tương trợ Dụng Thần (${bazi.dungThan})`);
            } else if (dayStemEl === bazi.kyThan || dayBranchEl === bazi.kyThan) {
                personalizedScore -= 16;
                highlights.push(`Ngũ hành ngày nạp Kỵ Thần (${bazi.kyThan})`);
            }

            if (bazi.dayZhi) {
                if (LUC_HOP[dayZhi] === bazi.dayZhi) {
                    personalizedScore += 14;
                    highlights.push(`Lục Hợp với Chi Ngày sinh (${bazi.dayZhi})`);
                } else if (LUC_XUNG[dayZhi] === bazi.dayZhi) {
                    personalizedScore -= 22;
                    highlights.push(`Lục Xung trực tiếp Chi Ngày sinh (${bazi.dayZhi} xung ${dayZhi})`);
                }
            }

            if (['Chính Tài', 'Thiên Tài'].includes(thapThan)) {
                adviceDo = ['Ký kết thương thảo, đàm phán hợp đồng', 'Khởi tạo kế hoạch tài chính mới', 'Gặp gỡ khách hàng tiềm năng'];
                adviceDont = ['Cho vay mượn thiếu giấy tờ', 'Chi tiêu theo cảm hứng bất chợt'];
            } else if (['Chính Quan', 'Thất Sát'].includes(thapThan)) {
                adviceDo = ['Báo cáo tiến độ công việc với cấp trên', 'Xử lý các thủ tục hành chính, giấy tờ', 'Thiết lập kỷ luật cá nhân'];
                adviceDont = ['Tranh cãi gay gắt nơi công sở', 'Làm việc tắc trách, cẩu thả'];
            } else if (['Chính Ấn', 'Thiên Ấn'].includes(thapThan)) {
                adviceDo = ['Học tập kỹ năng mới, đọc sách trau dồi', 'Xin lời khuyên từ tiền bối uy tín', 'Dành thời gian tĩnh tâm suy ngẫm'];
                adviceDont = ['Ra quyết định vội vàng khi chưa đủ thông tin', 'Trì hoãn công việc cấp bách'];
            } else if (['Thực Thần', 'Thương Quan'].includes(thapThan)) {
                adviceDo = ['Lên ý tưởng sáng tạo, thiết kế đổi mới', 'Gặp gỡ bạn bè, giao lưu kết nối', 'Quảng bá sản phẩm hoặc chia sẻ bài viết'];
                adviceDont = ['Khẩu thiệt thị phi, bàn tán chuyện người khác', 'Hành động hấp tấp thiếu chuẩn bị'];
            } else {
                adviceDo = ['Hợp tác làm việc nhóm, chia sẻ kinh nghiệm', 'Mở rộng mối quan hệ xã hội', 'Tập luyện thể thao nâng cao thể lực'];
                adviceDont = ['Chung vốn đầu tư mạo hiểm', 'So bì ghen tị với thành công của người khác'];
            }
        } else {
            adviceDo = ['Triển khai các công việc thường nhật', 'Cân nhắc xuất hành vào giờ Hoàng Đạo'];
            adviceDont = ['Tránh các việc trọng đại vào giờ Hắc Đạo'];
        }

        const finalScore = Math.max(15, Math.min(98, personalizedScore));
        let energyTier = finalScore >= 75 ? 'auspicious' : (finalScore < 50 ? 'caution' : 'neutral');

        return {
            solarDate: `${d}/${m}/${y}`,
            lunarDate: `${lunar.getDay()}/${lunar.getMonth()}/${lunar.getYear()}`,
            lunarDateStr: `Ngày ${lunar.getDay()} Tháng ${lunar.getMonth()} Năm ${toViCanChi(lunar.getYearInGanZhiExact())}`,
            dayCanChi,
            truc,
            deityName,
            deityType,
            score: finalScore,
            energyTier,
            thapThan: calcMode === 'year' ? (yearProfile?.napAm || 'Mệnh Niên') : thapThan,
            highlights,
            luckyHours,
            adviceDo,
            adviceDont,
            allHours: evaluatedHours
        };
    }
}

module.exports = PersonalizedAlmanacService;
