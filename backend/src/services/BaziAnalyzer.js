const fs = require('fs');
const path = require('path');
const { Lunar, Solar } = require('lunar-javascript');

const JIE_QI_VI = {
    '立春': 'Lập Xuân', '雨水': 'Vũ Thủy', '惊蛰': 'Kinh Trập', '春分': 'Xuân Phân',
    '清明': 'Thanh Minh', '谷雨': 'Cốc Vũ', '立夏': 'Lập Hạ', '小满': 'Tiểu Mãn',
    '芒种': 'Mang Chủng', '夏至': 'Hạ Chí', '小暑': 'Tiểu Thử', '大暑': 'Đại Thử',
    '立秋': 'Lập Thu', '处暑': 'Xử Thử', '白露': 'Bạch Lộ', '秋分': 'Thu Phân',
    '寒露': 'Hàn Lộ', '霜降': 'Sương Giáng', '立冬': 'Lập Đông', '小雪': 'Tiểu Tuyết',
    '大雪': 'Đại Tuyết', '冬至': 'Đông Chí', '小寒': 'Tiểu Hàn', '大寒': 'Đại Hàn'
};

const GAN_VI = {
    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
};

const ZHI_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tỵ',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const toVi = (hanStr) => {
    if (!hanStr) return '';
    let result = hanStr;
    for (const [han, vi] of Object.entries(GAN_VI)) result = result.replace(han, vi + ' ');
    for (const [han, vi] of Object.entries(ZHI_VI)) result = result.replace(han, vi);
    return result.trim();
};

const THAP_THAN = {
    "比肩": "Tỷ Kiên", "劫财": "Kiếp Tài", "食神": "Thực Thần", "伤官": "Thương Quan",
    "偏财": "Thiên Tài", "正财": "Chính Tài", "七杀": "Thất Sát", "正官": "Chính Quan",
    "偏印": "Thiên Ấn", "正印": "Chính Ấn", "日主": "Nhật Chủ"
};
const toThapThan = (han) => THAP_THAN[han] || han;

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

const TRUONG_SINH_MAP = {
    'Giáp': { 'Hợi': 'Trường Sinh', 'Tý': 'Mộc Dục', 'Sửu': 'Quan Đới', 'Dần': 'Lâm Quan', 'Mão': 'Đế Vượng', 'Thìn': 'Suy', 'Tỵ': 'Bệnh', 'Ngọ': 'Tử', 'Mùi': 'Mộ', 'Thân': 'Tuyệt', 'Dậu': 'Thai', 'Tuất': 'Dưỡng' },
    'Ất': { 'Ngọ': 'Trường Sinh', 'Tỵ': 'Mộc Dục', 'Thìn': 'Quan Đới', 'Mão': 'Lâm Quan', 'Dần': 'Đế Vượng', 'Sửu': 'Suy', 'Tý': 'Bệnh', 'Hợi': 'Tử', 'Tuất': 'Mộ', 'Dậu': 'Tuyệt', 'Thân': 'Thai', 'Mùi': 'Dưỡng' },
    'Bính': { 'Dần': 'Trường Sinh', 'Mão': 'Mộc Dục', 'Thìn': 'Quan Đới', 'Tỵ': 'Lâm Quan', 'Ngọ': 'Đế Vượng', 'Mùi': 'Suy', 'Thân': 'Bệnh', 'Dậu': 'Tử', 'Tuất': 'Mộ', 'Hợi': 'Tuyệt', 'Tý': 'Thai', 'Sửu': 'Dưỡng' },
    'Đinh': { 'Dậu': 'Trường Sinh', 'Thân': 'Mộc Dục', 'Mùi': 'Quan Đới', 'Ngọ': 'Lâm Quan', 'Tỵ': 'Đế Vượng', 'Thìn': 'Suy', 'Mão': 'Bệnh', 'Dần': 'Tử', 'Sửu': 'Mộ', 'Tý': 'Tuyệt', 'Hợi': 'Thai', 'Tuất': 'Dưỡng' },
    'Mậu': { 'Dần': 'Trường Sinh', 'Mão': 'Mộc Dục', 'Thìn': 'Quan Đới', 'Tỵ': 'Lâm Quan', 'Ngọ': 'Đế Vượng', 'Mùi': 'Suy', 'Thân': 'Bệnh', 'Dậu': 'Tử', 'Tuất': 'Mộ', 'Hợi': 'Tuyệt', 'Tý': 'Thai', 'Sửu': 'Dưỡng' },
    'Kỷ': { 'Dậu': 'Trường Sinh', 'Thân': 'Mộc Dục', 'Mùi': 'Quan Đới', 'Ngọ': 'Lâm Quan', 'Tỵ': 'Đế Vượng', 'Thìn': 'Suy', 'Mão': 'Bệnh', 'Dần': 'Tử', 'Sửu': 'Mộ', 'Tý': 'Tuyệt', 'Hợi': 'Thai', 'Tuất': 'Dưỡng' },
    'Canh': { 'Tỵ': 'Trường Sinh', 'Ngọ': 'Mộc Dục', 'Mùi': 'Quan Đới', 'Thân': 'Lâm Quan', 'Dậu': 'Đế Vượng', 'Tuất': 'Suy', 'Hợi': 'Bệnh', 'Tý': 'Tử', 'Sửu': 'Mộ', 'Dần': 'Tuyệt', 'Mão': 'Thai', 'Thìn': 'Dưỡng' },
    'Tân': { 'Tý': 'Trường Sinh', 'Hợi': 'Mộc Dục', 'Tuất': 'Quan Đới', 'Dậu': 'Lâm Quan', 'Thân': 'Đế Vượng', 'Mùi': 'Suy', 'Ngọ': 'Bệnh', 'Tỵ': 'Tử', 'Thìn': 'Mộ', 'Mão': 'Tuyệt', 'Dần': 'Thai', 'Sửu': 'Dưỡng' },
    'Nhâm': { 'Thân': 'Trường Sinh', 'Dậu': 'Mộc Dục', 'Tuất': 'Quan Đới', 'Hợi': 'Lâm Quan', 'Tý': 'Đế Vượng', 'Sửu': 'Suy', 'Dần': 'Bệnh', 'Mão': 'Tử', 'Thìn': 'Mộ', 'Tỵ': 'Tuyệt', 'Ngọ': 'Thai', 'Mùi': 'Dưỡng' },
    'Quý': { 'Mão': 'Trường Sinh', 'Dần': 'Mộc Dục', 'Sửu': 'Quan Đới', 'Tý': 'Lâm Quan', 'Hợi': 'Đế Vượng', 'Tuất': 'Suy', 'Dậu': 'Bệnh', 'Thân': 'Tử', 'Mùi': 'Mộ', 'Ngọ': 'Tuyệt', 'Tỵ': 'Thai', 'Thìn': 'Dưỡng' }
};

class BaziAnalyzer {
    constructor() {
        const rulesPath = path.join(__dirname, '../data/rules.json');
        this.rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    }

    determineCachCuc(dayGan, monthZhi, canChi, elementScore) {
        const exposedGans = [canChi.year.gan, canChi.month.gan, canChi.hour.gan];
        const allStems = [canChi.year.gan, canChi.month.gan, canChi.day.gan, canChi.hour.gan];
        const allZhis = [canChi.year.zhi, canChi.month.zhi, canChi.day.zhi, canChi.hour.zhi];
        
        const stemToElement = {
            'Giáp': 'Moc', 'Ất': 'Moc', 'Bính': 'Hoa', 'Đinh': 'Hoa', 'Mậu': 'Tho',
            'Kỷ': 'Tho', 'Canh': 'Kim', 'Tân': 'Kim', 'Nhâm': 'Thuy', 'Quý': 'Thuy'
        };
        const stemYinYang = {
            'Giáp': 'Duong', 'Ất': 'Am', 'Bính': 'Duong', 'Đinh': 'Am', 'Mậu': 'Duong',
            'Kỷ': 'Am', 'Canh': 'Duong', 'Tân': 'Am', 'Nhâm': 'Duong', 'Quý': 'Am'
        };
        const branchToElement = {
            'Tý': 'Thuy', 'Sửu': 'Tho', 'Dần': 'Moc', 'Mão': 'Moc', 'Thìn': 'Tho', 'Tỵ': 'Hoa',
            'Ngọ': 'Hoa', 'Mùi': 'Tho', 'Thân': 'Kim', 'Dậu': 'Kim', 'Tuất': 'Tho', 'Hợi': 'Thuy'
        };
        
        const dmElem = stemToElement[dayGan];
        if (!dmElem) return "Chính Quan cách";
        
        // 1. Khúc Trực cách (Mộc độc vượng)
        if ((dayGan === 'Giáp' || dayGan === 'Ất') && 
            ['Dần', 'Mão', 'Thìn'].includes(monthZhi) && 
            !allStems.includes('Canh') && !allStems.includes('Tân') && !allZhis.includes('Dậu')) {
            return "Khúc Trực cách (Mộc độc vượng)";
        }
        
        // 2. Viêm Thượng cách (Hỏa độc vượng)
        if ((dayGan === 'Bính' || dayGan === 'Đinh') && 
            ['Tỵ', 'Ngọ', 'Mùi'].includes(monthZhi) && 
            !allStems.includes('Nhâm') && !allStems.includes('Quý') && !allZhis.includes('Hợi') && !allZhis.includes('Tý')) {
            return "Viêm Thượng cách (Hỏa độc vượng)";
        }
        
        // 3. Gia Tường cách (Thổ độc vượng)
        if ((dayGan === 'Mậu' || dayGan === 'Kỷ') && 
            ['Thìn', 'Tuất', 'Sửu', 'Mùi'].includes(monthZhi) && 
            !allStems.includes('Giáp') && !allStems.includes('Ất') && !allZhis.includes('Dần') && !allZhis.includes('Mão')) {
            return "Gia Tường cách (Thổ độc vượng)";
        }
        
        // 4. Tòng Cách cách (Kim độc vượng)
        if ((dayGan === 'Canh' || dayGan === 'Tân') && 
            ['Thân', 'Dậu', 'Tuất'].includes(monthZhi) && 
            !allStems.includes('Bính') && !allStems.includes('Đinh') && !allZhis.includes('Ngọ') && !allZhis.includes('Tỵ')) {
            return "Tòng Cách cách (Kim độc vượng)";
        }
        
        // 5. Nhuận Hạ cách (Thủy độc vượng)
        if ((dayGan === 'Nhâm' || dayGan === 'Quý') && 
            ['Hợi', 'Tý', 'Thìn'].includes(monthZhi) && 
            !allStems.includes('Mậu') && !allStems.includes('Kỷ') && !allZhis.includes('Mùi') && !allZhis.includes('Tuất')) {
            return "Nhuận Hạ cách (Thủy độc vượng)";
        }
        
        // 6. Hợp hóa cách
        const checkHợpHóa = (g1, g2) => {
            const pairs = [['Giáp', 'Kỷ', 'Tho'], ['Ất', 'Canh', 'Kim'], ['Bính', 'Tân', 'Thuy'], ['Đinh', 'Nhâm', 'Moc'], ['Mậu', 'Quý', 'Hoa']];
            for (const [x, y, elem] of pairs) {
                if ((g1 === x && g2 === y) || (g1 === y && g2 === x)) return elem;
            }
            return null;
        };
        
        const mStem = canChi.month.gan;
        const hStem = canChi.hour.gan;
        let targetElem = checkHợpHóa(dayGan, mStem) || checkHợpHóa(dayGan, hStem);
        if (targetElem) {
            const mEl = branchToElement[monthZhi];
            if (mEl === targetElem || (targetElem === 'Tho' && ['Thìn', 'Tuất', 'Sửu', 'Mùi'].includes(monthZhi)) || (targetElem === 'Moc' && monthZhi === 'Hợi')) {
                const elemNames = { 'Tho': 'Thổ', 'Kim': 'Kim', 'Thuy': 'Thủy', 'Moc': 'Mộc', 'Hoa': 'Hỏa' };
                return `Hóa ${elemNames[targetElem]} cách`;
            }
        }
        
        const getRelation = (dm, other) => {
            const dmE = stemToElement[dm];
            const otherE = stemToElement[other];
            const dmYinYang = stemYinYang[dm];
            const otherYinYang = stemYinYang[other];
            
            if (dmE === otherE) {
                return dmYinYang === otherYinYang ? 'Tỷ Kiên' : 'Kiếp Tài';
            }
            
            const relMap = {
                'Kim': { 'Thuy': 'sinh', 'Moc': 'khac', 'Hoa': 'bi_khac', 'Tho': 'duoc_sinh' },
                'Moc': { 'Hoa': 'sinh', 'Tho': 'khac', 'Kim': 'bi_khac', 'Thuy': 'duoc_sinh' },
                'Thuy': { 'Moc': 'sinh', 'Hoa': 'khac', 'Tho': 'bi_khac', 'Kim': 'duoc_sinh' },
                'Hoa': { 'Tho': 'sinh', 'Kim': 'khac', 'Thuy': 'bi_khac', 'Moc': 'duoc_sinh' },
                'Tho': { 'Kim': 'sinh', 'Thuy': 'khac', 'Moc': 'bi_khac', 'Hoa': 'duoc_sinh' }
            };
            
            const rel = relMap[dmE][otherE];
            if (rel === 'duoc_sinh') return dmYinYang === otherYinYang ? 'Thiên Ấn' : 'Chính Ấn';
            if (rel === 'sinh') return dmYinYang === otherYinYang ? 'Thực Thần' : 'Thương Quan';
            if (rel === 'khac') return dmYinYang === otherYinYang ? 'Thiên Tài' : 'Chính Tài';
            if (rel === 'bi_khac') return dmYinYang === otherYinYang ? 'Thất Sát' : 'Chính Quan';
            return 'Tỷ Kiên';
        };

        // 7. Tòng Sát, Tòng Tài, Tòng Nhi
        const totalScore = Object.values(elementScore).reduce((a,b) => a+b, 0);
        const dmScore = elementScore[dmElem] || 0;
        const isVeryWeak = (dmScore / totalScore) < 0.15;
        
        if (isVeryWeak) {
            let strongest = '';
            let maxVal = 0;
            for (const [el, val] of Object.entries(elementScore)) {
                if (val > maxVal) { maxVal = val; strongest = el; }
            }
            
            const elemToStem = { 'Moc': 'Giáp', 'Hoa': 'Bính', 'Tho': 'Mậu', 'Kim': 'Canh', 'Thuy': 'Nhâm' };
            const dummyStem = elemToStem[strongest];
            const rel = getRelation(dayGan, dummyStem);
            
            if (rel === 'Thất Sát' || rel === 'Chính Quan') return "Tòng Sát cách";
            if (rel === 'Thiên Tài' || rel === 'Chính Tài') return "Tòng Tài cách";
            if (rel === 'Thực Thần' || rel === 'Thương Quan') return "Tòng Nhi cách";
        }

        // Standard Bát Cách / Kiến Lộc / Dương Nhận
        const monthHiddenStems = {
            'Tý': ['Quý'],
            'Sửu': ['Kỷ', 'Quý', 'Tân'],
            'Dần': ['Giáp', 'Bính', 'Mậu'],
            'Mão': ['Ất'],
            'Thìn': ['Mậu', 'Ất', 'Quý'],
            'Tỵ': ['Bính', 'Canh', 'Mậu'],
            'Ngọ': ['Đinh', 'Kỷ'],
            'Mùi': ['Kỷ', 'Đinh', 'Ất'],
            'Thân': ['Canh', 'Nhâm', 'Mậu'],
            'Dậu': ['Tân'],
            'Tuất': ['Mậu', 'Tân', 'Đinh'],
            'Hợi': ['Nhâm', 'Giáp']
        };

        const mtangs = monthHiddenStems[monthZhi] || [];
        for (const tang of mtangs) {
            if (exposedGans.includes(tang)) {
                const rel = getRelation(dayGan, tang);
                return `${rel} cách`;
            }
        }
        
        const mainQi = mtangs[0];
        if (mainQi) {
            const rel = getRelation(dayGan, mainQi);
            if (rel === 'Tỷ Kiên') return "Kiến Lộc cách";
            if (rel === 'Kiếp Tài') return "Dương Nhận cách";
            return `${rel} cách`;
        }
        
        return "Chính Quan cách";
    }

    analyze(dateStr, timeStr, gender = 1, dayBoundaryMode = 'midnight') { // gender: 1 (Nam), 0 (Nữ)
        // 1. Data Prep
        let day, month, year;
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-').map(Number);
            year = parts[0];
            month = parts[1];
            day = parts[2];
        } else {
            const parts = dateStr.split('/').map(Number);
            day = parts[0];
            month = parts[1];
            year = parts[2];
        }
        const [hour, minute] = timeStr.split(':').map(Number);
        
        const genderInt = parseInt(gender) === 0 ? 0 : 1;
        const sect = dayBoundaryMode === 'zi_hour' ? 1 : 2;

        // A. local Bazi for Day and Hour
        const solarLocal = Solar.fromYmdHms(year, month, day, hour, minute, 0);
        const lunarLocal = solarLocal.getLunar();
        const baziLocal = lunarLocal.getEightChar();
        baziLocal.setSect(sect);

        // B. Adjusted Bazi (+1 hour for GMT+8 Beijing astronomical solar terms) for Year, Month, and Da Yun
        const solarAdjusted = solarLocal.nextHour(1);
        const lunarAdjusted = solarAdjusted.getLunar();
        const baziAdjusted = lunarAdjusted.getEightChar();
        baziAdjusted.setSect(sect);
        
        const solarTimeline = `${String(day).padStart(2,'0')}/${String(month).padStart(2,'0')}/${year} ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`;
        const tietKhiTimeline = `${toVi(baziLocal.getTimeGan() + baziLocal.getTimeZhi())} - ${toVi(baziLocal.getDayGan() + baziLocal.getDayZhi())} - ${toVi(baziAdjusted.getMonthGan() + baziAdjusted.getMonthZhi())} - ${toVi(baziAdjusted.getYearGan() + baziAdjusted.getYearZhi())}`;

        const prevJie = lunarLocal.getPrevJieQi();
        const tietKhiName = prevJie ? (JIE_QI_VI[prevJie.getName()] || prevJie.getName()) : '';

        // Standard Lunar calendar birth info (Shifts strictly at Lunar New Year Mùng 1 Tết)
        const lunarDateStr = `ngày ${lunarLocal.getDay()} tháng ${lunarLocal.getMonth()} năm ${lunarLocal.getYear()} Âm lịch`;
        const lunarYear = toVi(lunarLocal.getYearInGanZhi());

        // Build Da Yun
        const yun = baziAdjusted.getYun(genderInt);
        
        // rawDaYun keeps childhood cycle (Index 0) and all un-filtered items
        const rawDaYunData = yun.getDaYun().map(d => ({
            startYear: d.getStartYear(),
            startAge: d.getStartAge(),
            gan: toVi(d.getGanZhi().substring(0, 1)),
            zhi: toVi(d.getGanZhi().substring(1, 2)),
        }));

        // daYun filters out pre-Da Yun childhood cycle with empty stem-branch
        const daYunData = rawDaYunData.filter(d => d.gan && d.zhi);

        // Bóc tách Tàng can & Thập thần
        const buildPillar = (type) => {
            let gan, zhi, thapThanGan;
            let hiddenList = [];
            
            if (type === 'year') {
                gan = baziAdjusted.getYearGan();
                zhi = baziAdjusted.getYearZhi();
                thapThanGan = toThapThan(baziAdjusted.getYearShiShenGan());
                hiddenList = baziAdjusted.getYearShiShenZhi();
            }
            if (type === 'month') {
                gan = baziAdjusted.getMonthGan();
                zhi = baziAdjusted.getMonthZhi();
                thapThanGan = toThapThan(baziAdjusted.getMonthShiShenGan());
                hiddenList = baziAdjusted.getMonthShiShenZhi();
            }
            if (type === 'day') {
                gan = baziLocal.getDayGan();
                zhi = baziLocal.getDayZhi();
                thapThanGan = "Nhật Chủ";
                hiddenList = baziLocal.getDayShiShenZhi();
            }
            if (type === 'hour') {
                gan = baziLocal.getTimeGan();
                zhi = baziLocal.getTimeZhi();
                thapThanGan = toThapThan(baziLocal.getTimeShiShenGan());
                hiddenList = baziLocal.getTimeShiShenZhi();
            }

            const viZhi = toVi(zhi);
            const hiddenStemsArr = this.rules.hiddenStems[viZhi] || [];
            
            const tangCan = hiddenStemsArr.map((tGan, idx) => ({
                gan: tGan.stem || tGan,
                thapThan: toThapThan(hiddenList[idx])
            }));

            return {
                gan: toVi(gan),
                zhi: viZhi,
                thapThanGan,
                tangCan
            };
        };

        const canChi = {
            year: buildPillar('year'),
            month: buildPillar('month'),
            day: buildPillar('day'),
            hour: buildPillar('hour')
        };

        const dmGan = canChi.day.gan;

        const applyNaYinAndTruongSinh = (pillar) => {
            const comb = `${pillar.gan} ${pillar.zhi}`;
            pillar.naYin = NAYIN_MAP[comb] || '';
            pillar.truongSinh = TRUONG_SINH_MAP[dmGan]?.[pillar.zhi] || '';
        };

        applyNaYinAndTruongSinh(canChi.year);
        applyNaYinAndTruongSinh(canChi.month);
        applyNaYinAndTruongSinh(canChi.day);
        applyNaYinAndTruongSinh(canChi.hour);

        const buildExtraPillar = (gan, zhi) => {
            if (!gan || !zhi) return { gan: '', zhi: '', thapThanGan: '', tangCan: [], naYin: '', truongSinh: '' };
            
            const stemToElement = {
                'Giáp': 'Moc', 'Ất': 'Moc', 'Bính': 'Hoa', 'Đinh': 'Hoa', 'Mậu': 'Tho',
                'Kỷ': 'Tho', 'Canh': 'Kim', 'Tân': 'Kim', 'Nhâm': 'Thuy', 'Quý': 'Thuy'
            };
            const stemYinYang = {
                'Giáp': 'Duong', 'Ất': 'Am', 'Bính': 'Duong', 'Đinh': 'Am', 'Mậu': 'Duong',
                'Kỷ': 'Am', 'Canh': 'Duong', 'Tân': 'Am', 'Nhâm': 'Duong', 'Quý': 'Am'
            };
            
            const getRelation = (dm, other) => {
                const dmE = stemToElement[dm];
                const otherE = stemToElement[other];
                const dmYinYang = stemYinYang[dm];
                const otherYinYang = stemYinYang[other];
                
                if (!dmE || !otherE) return 'Tỷ Kiên';
                if (dmE === otherE) {
                    return dmYinYang === otherYinYang ? 'Tỷ Kiên' : 'Kiếp Tài';
                }
                
                const relMap = {
                    'Kim': { 'Thuy': 'sinh', 'Moc': 'khac', 'Hoa': 'bi_khac', 'Tho': 'duoc_sinh' },
                    'Moc': { 'Hoa': 'sinh', 'Tho': 'khac', 'Kim': 'bi_khac', 'Thuy': 'duoc_sinh' },
                    'Thuy': { 'Moc': 'sinh', 'Hoa': 'khac', 'Tho': 'bi_khac', 'Kim': 'duoc_sinh' },
                    'Hoa': { 'Tho': 'sinh', 'Kim': 'khac', 'Thuy': 'bi_khac', 'Moc': 'duoc_sinh' },
                    'Tho': { 'Kim': 'sinh', 'Thuy': 'khac', 'Moc': 'bi_khac', 'Hoa': 'duoc_sinh' }
                };
                
                const rel = relMap[dmE][otherE];
                if (rel === 'duoc_sinh') return dmYinYang === otherYinYang ? 'Thiên Ấn' : 'Chính Ấn';
                if (rel === 'sinh') return dmYinYang === otherYinYang ? 'Thực Thần' : 'Thương Quan';
                if (rel === 'khac') return dmYinYang === otherYinYang ? 'Thiên Tài' : 'Chính Tài';
                if (rel === 'bi_khac') return dmYinYang === otherYinYang ? 'Thất Sát' : 'Chính Quan';
                return 'Tỷ Kiên';
            };

            const hiddenStemsArr = this.rules.hiddenStems[zhi] || [];
            const tangCan = hiddenStemsArr.map(tGan => {
                const tStem = tGan.stem || tGan;
                return {
                    gan: tStem,
                    thapThan: getRelation(dmGan, tStem)
                };
            });

            const thapThanGan = getRelation(dmGan, gan);
            const comb = `${gan} ${zhi}`;
            const naYin = NAYIN_MAP[comb] || '';
            const truongSinh = TRUONG_SINH_MAP[dmGan]?.[zhi] || '';

            return {
                gan,
                zhi,
                thapThanGan,
                tangCan,
                naYin,
                truongSinh
            };
        };

        const taiNguyenCanChi = toVi(baziAdjusted.getTaiYuan());
        const cungMenhCanChi = toVi(baziLocal.getMingGong());
        const [tnGan, tnZhi] = taiNguyenCanChi.split(' ');
        const [cmGan, cmZhi] = cungMenhCanChi.split(' ');

        const taiNguyen = buildExtraPillar(tnGan, tnZhi);
        const cungMenh = buildExtraPillar(cmGan, cmZhi);

        const analysis = {
            than: "",
            tongCachType: "",
            relations: {
                tamHop: [], banTamHop: [], lucXung: [], lucHop: [], lucHai: [], lucPha: []
            }
        };

        // PHASE 1: Build Base Elements
        let elementScore = { Kim: 0, Moc: 0, Thuy: 0, Hoa: 0, Tho: 0 };
        const baseElementScore = { Kim: 0, Moc: 0, Thuy: 0, Hoa: 0, Tho: 0 };
        const pillars = ['year', 'month', 'day', 'hour'];
        const config = this.rules.scoreConfig;

        // Base Stem weights
        const stemWeights = {
            year: config.canWeight, // 15
            month: config.monthCanWeight, // 7.5
            day: config.canWeight, // 15
            hour: config.canWeight // 15
        };

        // Base Branch weights
        const branchWeights = {
            year: config.chiWeight, // 10
            month: config.monthChiWeight, // 25
            day: config.chiWeight, // 10
            hour: config.chiWeight // 10
        };

        // Ratios of hidden stems in a branch (1 Can = 100%, Ngọ/Hợi = 70/30, 3 Can = 60/30/10)
        const getBranchRatios = (zhi) => {
            if (['Tý', 'Mão', 'Dậu'].includes(zhi)) {
                const stems = this.rules.hiddenStems[zhi] || [];
                const stemName = stems[0]?.stem || stems[0] || '';
                return [{ stem: stemName, ratio: 1.0 }];
            }
            if (zhi === 'Ngọ') {
                return [
                    { stem: 'Đinh', ratio: 0.7 },
                    { stem: 'Kỷ', ratio: 0.3 }
                ];
            }
            if (zhi === 'Hợi') {
                return [
                    { stem: 'Nhâm', ratio: 0.7 },
                    { stem: 'Giáp', ratio: 0.3 }
                ];
            }
            const stems = (this.rules.hiddenStems[zhi] || []).map(h => h.stem || h);
            return [
                { stem: stems[0] || '', ratio: 0.6 },
                { stem: stems[1] || '', ratio: 0.3 },
                { stem: stems[2] || '', ratio: 0.1 }
            ];
        };

        // 1. Add base stem points
        pillars.forEach(p => {
            const gan = canChi[p].gan;
            const ganElem = this.rules.stemElement[gan];
            if (ganElem) {
                elementScore[ganElem] += stemWeights[p];
                baseElementScore[ganElem] += stemWeights[p];
            }
        });

        // 2. Add base branch points distributed to tàng can
        pillars.forEach(p => {
            const zhi = canChi[p].zhi;
            const weight = branchWeights[p];
            const ratios = getBranchRatios(zhi);
            ratios.forEach(r => {
                if (!r.stem) return;
                const hElem = this.rules.stemElement[r.stem];
                if (hElem) {
                    elementScore[hElem] += weight * r.ratio;
                    baseElementScore[hElem] += weight * r.ratio;
                }
            });
        });

        // PHASE 2: Quyền Lực Trụ Tháng & Thấu Can toàn lá số
        const monthZhi = canChi.month.zhi;
        const monthStem = canChi.month.gan;
        const monthStemElem = this.rules.stemElement[monthStem];
        
        const monthRatios = getBranchRatios(monthZhi);
        const monthRootPowerMap = {};
        monthRatios.forEach(r => {
            if (r.stem) {
                monthRootPowerMap[r.stem] = branchWeights.month * r.ratio; // e.g. 15, 7.5, 2.5
            }
        });

        // Step 2: Month Stem power adjustment
        let monthStemBonus = 0;
        const primaryHidden = monthRatios[0]?.stem || '';
        const primaryHiddenElem = this.rules.stemElement[primaryHidden];

        if (monthRootPowerMap[monthStem] !== undefined) {
            // Level 1: Thấu Can
            monthStemBonus += monthRootPowerMap[monthStem];
        } else if (monthStemElem && monthStemElem === primaryHiddenElem) {
            // Level 3: Đồng hành
            monthStemBonus += (monthRootPowerMap[primaryHidden] || 0) * 0.7;
        } else if (monthStemElem && primaryHiddenElem && this.rules.relation[primaryHiddenElem]?.[monthStemElem] === 'sinh') {
            // Level 2: Đắc sinh
            monthStemBonus += stemWeights.month * config.dacSinhBonusPercent; // 40% of Month Stem base
        } else if (monthStemElem) {
            // Level 4: Bị khắc
            let hasAnyRoot = false;
            pillars.forEach(p => {
                const zhi = canChi[p].zhi;
                const ratios = getBranchRatios(zhi);
                if (ratios.some(r => r.stem && this.rules.stemElement[r.stem] === monthStemElem)) {
                    hasAnyRoot = true;
                }
            });
            if (hasAnyRoot) {
                monthStemBonus += 1;
            } else {
                monthStemBonus -= stemWeights.month * config.biKhacPenaltyPercent; // -40% of Month Stem base
            }
        }
        if (monthStemElem) {
            elementScore[monthStemElem] += monthStemBonus;
        }

        // Step 3: Thấu can toàn lá số (based on distance to month branch, with Đa Thấu Phân Khí logic)
        const pillarIndices = { year: 0, month: 1, day: 2, hour: 3 };
        
        let exposedCount = 0;
        pillars.forEach(p => {
            const gan = canChi[p].gan;
            if (monthRootPowerMap[gan] !== undefined) {
                exposedCount++;
            }
        });
        const exposedDivisor = Math.max(1, exposedCount); // N >= 1

        pillars.forEach(p => {
            const gan = canChi[p].gan;
            if (monthRootPowerMap[gan] !== undefined) {
                const distance = Math.abs(pillarIndices[p] - 1);
                let multiplier = 1.0;
                if (distance === 0) multiplier = config.distanceMultipliers.d0; // 1.0
                else if (distance === 1) multiplier = config.distanceMultipliers.d1; // 0.75
                else if (distance === 2) multiplier = config.distanceMultipliers.d2; // 0.5
                else if (distance === 3) multiplier = config.distanceMultipliers.d3; // 0.2
                
                const ganElem = this.rules.stemElement[gan];
                if (ganElem) {
                    const finalRootPower = monthRootPowerMap[gan] / exposedDivisor;
                    elementScore[ganElem] += finalRootPower * multiplier;
                }
            }
        });

        // PHASE 3: Can Có Gốc (Thông Căn Địa Chi)
        pillars.forEach(sp => {
            const stem = canChi[sp].gan;
            const stemElem = this.rules.stemElement[stem];
            if (!stemElem) return;

            pillars.forEach(bp => {
                const branch = canChi[bp].zhi;
                const weight = branchWeights[bp];
                const ratios = getBranchRatios(branch);

                ratios.forEach(r => {
                    if (!r.stem) return;
                    const rElem = this.rules.stemElement[r.stem];
                    if (rElem === stemElem) {
                        const dist = Math.abs(pillarIndices[sp] - pillarIndices[bp]);
                        let multiplier = 1.0;
                        if (dist === 0) multiplier = config.distanceMultipliers.d0;
                        else if (dist === 1) multiplier = config.distanceMultipliers.d1;
                        else if (dist === 2) multiplier = config.distanceMultipliers.d2;
                        else if (dist === 3) multiplier = config.distanceMultipliers.d3;

                        // Yin/Yang matching multiplier (đồng tính 1.0 vs lệch tính 0.7)
                        const stemPolarity = this.rules.yinYang[stem];
                        const rootPolarity = this.rules.yinYang[r.stem];
                        const polarityMult = (stemPolarity === rootPolarity) 
                            ? config.yinYangRootMultipliers.same 
                            : config.yinYangRootMultipliers.opposite;

                        const rootPower = weight * r.ratio;
                        elementScore[stemElem] += rootPower * multiplier * polarityMult;
                    }
                });
            });
        });

        // PHASE 4: Chân Thần và Giả Thần
        pillars.forEach(p => {
            const stem = canChi[p].gan;
            const stemElem = this.rules.stemElement[stem];
            if (!stemElem) return;

            const isChanThan = monthRatios.some(r => r.stem && this.rules.stemElement[r.stem] === stemElem);
            if (isChanThan) {
                // Add 20% of the stem's base weight
                elementScore[stemElem] += stemWeights[p] * config.chanThanBonusPercent;
            }
        });

        // PHASE 5: seasonal states (Vượng - Tướng - Hưu - Tù - Tử)
        let season = '';
        if (['Dần', 'Mão', 'Thìn'].includes(monthZhi)) season = 'Spring';
        else if (['Tỵ', 'Ngọ', 'Mùi'].includes(monthZhi)) season = 'Summer';
        else if (['Thân', 'Dậu', 'Tuất'].includes(monthZhi)) season = 'Autumn';
        else if (['Hợi', 'Tý', 'Sửu'].includes(monthZhi)) season = 'Winter';

        const getSeasonalMultiplier = (el) => {
            let status = 'Huu';
            if (monthZhi === 'Thìn' || monthZhi === 'Sửu') {
                if (el === 'Tho') return 1.5; // Thổ vượng
                if (el === 'Kim') return 1.2; // Kim tướng
                if (el === 'Hoa' || el === 'Thuy') return 0.9; // Hỏa, Thủy nửa hưu nửa tù
                if (el === 'Moc') return 0.6; // Mộc tử
            } else if (monthZhi === 'Mùi' || monthZhi === 'Tuất') {
                if (el === 'Tho') return 1.5; // Thổ vượng
                if (el === 'Kim') return 1.2; // Kim tướng
                if (el === 'Hoa') return 1.0; // Hỏa nửa tướng nửa tù
                if (el === 'Thuy') return 0.7; // Thủy nửa tù nửa tử
                if (el === 'Moc') return 0.6; // Mộc tử
            } else {
                if (season === 'Spring') {
                    if (el === 'Moc') status = 'Vuong';
                    else if (el === 'Hoa') status = 'Tuong';
                    else if (el === 'Thuy') status = 'Huu';
                    else if (el === 'Tho') status = 'Tu';
                    else if (el === 'Kim') status = 'Tu_Death';
                } else if (season === 'Summer') {
                    if (el === 'Hoa') status = 'Vuong';
                    else if (el === 'Tho') status = 'Tuong';
                    else if (el === 'Moc') status = 'Huu';
                    else if (el === 'Kim') status = 'Tu';
                    else if (el === 'Thuy') status = 'Tu_Death';
                } else if (season === 'Autumn') {
                    if (el === 'Kim') status = 'Vuong';
                    else if (el === 'Thuy') status = 'Tuong';
                    else if (el === 'Tho') status = 'Huu';
                    else if (el === 'Moc') status = 'Tu';
                    else if (el === 'Hoa') status = 'Tu_Death';
                } else if (season === 'Winter') {
                    if (el === 'Thuy') status = 'Vuong';
                    else if (el === 'Moc') status = 'Tuong';
                    else if (el === 'Kim') status = 'Huu';
                    else if (el === 'Hoa') status = 'Tu';
                    else if (el === 'Tho') status = 'Tu_Death';
                }
            }
            return config.seasonalMultipliers[status] || 1.0;
        };

        this.rules.elements.forEach(el => {
            elementScore[el] *= getSeasonalMultiplier(el);
        });

        // PHASE 6: Proportional Dynamic Adjustments (Sinh - Khắc - Tiết - Hao giữa các Hành)
        let preAdjustedTotal = Object.values(elementScore).reduce((a, b) => a + b, 0);
        if (preAdjustedTotal > 0) {
            let newScores = { ...elementScore };
            this.rules.elements.forEach(el1 => {
                if (elementScore[el1] > 0) {
                    this.rules.elements.forEach(el2 => {
                        if (el1 === el2) return;
                        const rel = this.rules.relation[el1]?.[el2];
                        if (rel && elementScore[el2] > 0) {
                            const factor = config.relationScore[rel] || 0;
                            const weightOfEl2 = elementScore[el2] / preAdjustedTotal;
                            newScores[el1] += elementScore[el1] * factor * weightOfEl2;
                        }
                    });
                }
            });
            elementScore = newScores;
        }

        // PHASE 7: Hội Cục Địa Chi (Tam Hội & Bán Tam Hội)
        const branchList = pillars.map(p => canChi[p].zhi);
        const countSeasonalBranches = (seasonList) => {
            return branchList.filter(z => seasonList.includes(z)).length;
        };

        const seasonalGroups = {
            Moc: ['Dần', 'Mão', 'Thìn'],
            Hoa: ['Tỵ', 'Ngọ', 'Mùi'],
            Kim: ['Thân', 'Dậu', 'Tuất'],
            Thuy: ['Hợi', 'Tý', 'Sửu']
        };

        Object.keys(seasonalGroups).forEach(el => {
            const count = countSeasonalBranches(seasonalGroups[el]);
            if (count === 3) {
                elementScore[el] += config.tamHoiScore; // +12 points
                analysis.relations.tamHop.push(seasonalGroups[el].join('-') + ' (Hội)');
            } else if (count === 2) {
                elementScore[el] += config.banTamHoiScore; // +4 points
                analysis.relations.tamHop.push(branchList.filter(z => seasonalGroups[el].includes(z)).join('-') + ' (Bán Hội)');
            }
        });

        // PHASE 8: Combine Branch relationships (With directional preemption/priority logic)
        const hasSubset = (arr, subset) => subset.every(v => arr.includes(v));
        const occupiedBranches = new Set();

        // High priority: Tam Hội & Tam Hợp
        const highPriorityRelations = ['tamHop', 'banTamHop'];
        highPriorityRelations.forEach(relType => {
            const groups = this.rules.branchRelations[relType];
            groups.forEach(group => {
                const targetBranches = group.branches || group;
                if (!Array.isArray(targetBranches)) return;

                if (hasSubset(branchList, targetBranches)) {
                    analysis.relations[relType].push(targetBranches.join('-'));
                    targetBranches.forEach(z => occupiedBranches.add(z));
                    
                    const points = config.special[relType];
                    if (points) {
                        const domElem = this.rules.branchElement[targetBranches[1]];
                        elementScore[domElem] += points;
                    }
                }
            });
        });

        // Medium priority: Lục Hợp
        const mediumPriorityRelations = ['lucHop'];
        mediumPriorityRelations.forEach(relType => {
            const groups = this.rules.branchRelations[relType];
            groups.forEach(group => {
                const targetBranches = group.branches || group;
                if (!Array.isArray(targetBranches)) return;

                if (hasSubset(branchList, targetBranches)) {
                    analysis.relations[relType].push(targetBranches.join('-'));
                    
                    const hasOccupied = targetBranches.some(z => occupiedBranches.has(z));
                    const scaleFactor = hasOccupied ? 0.2 : 1.0; // 80% reduction if occupied

                    targetBranches.forEach(z => occupiedBranches.add(z));
                    
                    const points = config.special[relType];
                    if (points) {
                        targetBranches.forEach(z => {
                            const e = this.rules.branchElement[z];
                            elementScore[e] += (points / 2) * scaleFactor;
                        });
                    }
                }
            });
        });

        // Low priority: Lục Xung, Lục Hại, Lục Phá, Hình
        const lowPriorityRelations = ['lucXung', 'lucHai', 'lucPha', 'hinh'];
        lowPriorityRelations.forEach(relType => {
            if (relType === 'tamHoi') return;
            const groups = this.rules.branchRelations[relType];
            if (!groups) return;
            groups.forEach(group => {
                const targetBranches = group.branches || group;
                if (!Array.isArray(targetBranches)) return;

                if (hasSubset(branchList, targetBranches)) {
                    analysis.relations[relType].push(targetBranches.join('-'));
                    
                    const hasOccupied = targetBranches.some(z => occupiedBranches.has(z));
                    const scaleFactor = hasOccupied ? 0.2 : 1.0; // 80% reduction if occupied

                    const points = config.special[relType];
                    if (points) {
                        targetBranches.forEach(z => {
                            const e = this.rules.branchElement[z];
                            elementScore[e] += (points / 2) * scaleFactor;
                        });
                    }
                }
            });
        });

        // PHASE 9: Hợp Hóa Thiên Can Nghiêm Ngặt
        const ganList = pillars.map(p => canChi[p].gan);
        const adjacentPairs = [[0, 1], [1, 2], [2, 3]];
        adjacentPairs.forEach(([idx1, idx2]) => {
            const g1 = ganList[idx1];
            const g2 = ganList[idx2];
            const pair1 = `${g1}-${g2}`;
            const pair2 = `${g2}-${g1}`;
            const transElem = this.rules.hoaHop[pair1] || this.rules.hoaHop[pair2];
            if (transElem) {
                const monthBranchElem = this.rules.branchElement[monthZhi];
                const isRuling = transElem === monthBranchElem;
                const isSupported = this.rules.relation[monthBranchElem]?.[transElem] === 'sinh' || monthBranchElem === transElem;

                let hasHelper = false;
                pillars.forEach((p, idx) => {
                    if (idx !== idx1 && idx !== idx2) {
                        if (this.rules.stemElement[canChi[p].gan] === transElem) hasHelper = true;
                        const branchRatios = getBranchRatios(canChi[p].zhi);
                        if (branchRatios.some(r => r.stem && this.rules.stemElement[r.stem] === transElem)) hasHelper = true;
                    }
                });

                if (hasHelper) {
                    if (isRuling) {
                        elementScore[transElem] += 12;
                    } else if (isSupported) {
                        elementScore[transElem] += 8;
                    } else {
                        elementScore[transElem] += 2;
                    }
                } else {
                    elementScore[transElem] += 2;
                }
            }
        });

        // PHASE 10: Tương Tác Giữa Các Thiên Can Theo Khoảng Cách
        for (let i = 0; i < ganList.length; i++) {
            for (let j = i + 1; j < ganList.length; j++) {
                const g1 = ganList[i];
                const g2 = ganList[j];
                const el1 = this.rules.stemElement[g1];
                const el2 = this.rules.stemElement[g2];
                if (!el1 || !el2) continue;

                const distance = j - i;
                let multiplier = 1.0;
                if (distance === 1) multiplier = config.distanceMultipliers.d1; // 0.75
                else if (distance === 2) multiplier = config.distanceMultipliers.d2; // 0.5
                else if (distance === 3) multiplier = config.distanceMultipliers.d3; // 0.2

                const rel1 = this.rules.relation[el1]?.[el2];
                const rel2 = this.rules.relation[el2]?.[el1];

                if (rel1) {
                    const baseChange = config.relationScore[rel1] || 0;
                    elementScore[el1] += elementScore[el1] * baseChange * multiplier * 0.5;
                }
                if (rel2) {
                    const baseChange = config.relationScore[rel2] || 0;
                    elementScore[el2] += elementScore[el2] * baseChange * multiplier * 0.5;
                }
            }
        }

        // PHASE 11: Quy Tắc Thổ Khô - Thổ Ướt
        let hasWet = branchList.some(z => this.rules.tho.wet.includes(z));
        let hasDry = branchList.some(z => this.rules.tho.dry.includes(z));
        if (hasWet) {
            elementScore['Kim'] += 2;
            elementScore['Hoa'] -= 2;
            elementScore['Thuy'] += 2.4;
        }
        if (hasDry) {
            elementScore['Hoa'] += 4;
            elementScore['Thuy'] -= 2.4;
        }

        // Thổ quá vượng
        const currentThoScore = elementScore['Tho'];
        const currentTotal = Object.values(elementScore).reduce((a, b) => a + b, 0);
        if (currentTotal > 0 && (currentThoScore / currentTotal) > 0.35) {
            elementScore['Moc'] *= (1 - config.thoVuongPenaltyPercent);
            elementScore['Thuy'] *= (1 - config.thoVuongPenaltyPercent);
        }

        // Ensure no negative scores before final adjustments
        for (const k in elementScore) elementScore[k] = Math.max(0, elementScore[k]);

        // PHASE 12: Phản Sinh & Phản Khắc
        let preFinalTotal = Object.values(elementScore).reduce((a, b) => a + b, 0);
        if (preFinalTotal > 0) {
            this.rules.elements.forEach(mother => {
                const child = Object.keys(this.rules.relation[mother]).find(k => this.rules.relation[mother][k] === 'sinh');
                if (child) {
                    const motherPct = elementScore[mother] / preFinalTotal;
                    if (motherPct >= 0.35) {
                        const penalty = -0.5 * (elementScore[mother] - 35);
                        elementScore[child] = Math.max(0, elementScore[child] + penalty);
                    }
                }
            });

            this.rules.elements.forEach(cha => {
                const con = Object.keys(this.rules.relation[cha]).find(k => this.rules.relation[cha][k] === 'khac');
                if (con) {
                    const scoreCha = elementScore[cha];
                    const scoreCon = elementScore[con];
                    if (scoreCon > 2.5 * scoreCha && scoreCha > 0) {
                        const penalty = -0.4 * (scoreCon - 2.5 * scoreCha);
                        elementScore[cha] = Math.max(0, scoreCha + penalty);
                    }
                }
            });
        }

        // PHASE 12.1: Con Vượng Mẹ Kiệt (Tiết khí cực đoan) & Mẫu dĩ tử quý
        const postFinalTotal = Object.values(elementScore).reduce((a, b) => a + b, 0);
        if (postFinalTotal > 0) {
            this.rules.elements.forEach(mother => {
                const child = Object.keys(this.rules.relation[mother]).find(k => this.rules.relation[mother][k] === 'sinh');
                if (child) {
                    const childPct = elementScore[child] / postFinalTotal;
                    if (childPct > 0.35) {
                        elementScore[mother] *= 0.7; // Con quá vượng làm kiệt quệ mẹ
                    } else if (childPct >= 0.25 && childPct <= 0.35) {
                        elementScore[mother] *= 1.1; // Con vượng che chở mẹ
                    }
                }
            });
        }

        // PHASE 12.2: Tòng Cách Check (Bypass điểm sàn nếu có 1 hành cực thịnh > 65%)
        let isTongCachChart = false;
        const totalThoScore = Object.values(elementScore).reduce((a, b) => a + b, 0);
        if (totalThoScore > 0) {
            for (const el in elementScore) {
                if ((elementScore[el] / totalThoScore) > 0.65) {
                    isTongCachChart = true;
                    break;
                }
            }
        }

        // PHASE 12.5: Minimum Floor Enforcement
        if (!isTongCachChart) {
            this.rules.elements.forEach(el => {
                const baseVal = baseElementScore[el] || 0;
                if (baseVal > 0) {
                    const floorVal = baseVal * config.minFloorPercent; // 5% of base points
                    if (elementScore[el] < floorVal) {
                        elementScore[el] = floorVal;
                    }
                }
            });
        }

        // PHASE 13: Normalization to 100 points
        const finalTotal = Object.values(elementScore).reduce((a, b) => a + b, 0);
        if (finalTotal > 0) {
            for (const k in elementScore) {
                elementScore[k] = parseFloat(((elementScore[k] / finalTotal) * 100).toFixed(2));
            }
            const currentSum = Object.values(elementScore).reduce((a, b) => a + b, 0);
            const diff = parseFloat((100 - currentSum).toFixed(2));
            if (diff !== 0) {
                let maxKey = 'Kim';
                let maxVal = -1;
                for (const k in elementScore) {
                    if (elementScore[k] > maxVal) {
                        maxVal = elementScore[k];
                        maxKey = k;
                    }
                }
                elementScore[maxKey] = parseFloat((elementScore[maxKey] + diff).toFixed(2));
            }
        } else {
            elementScore = { Kim: 20, Moc: 20, Thuy: 20, Hoa: 20, Tho: 20 };
        }

        // Ensure no negative scores
        for (const k in elementScore) elementScore[k] = Math.max(0, parseFloat(elementScore[k].toFixed(2)));

        // PHASE 3: Analysis
        const dmElem = this.rules.stemElement[dmGan];
        const totalScore = Object.values(elementScore).reduce((a,b) => a+b, 0);

        // Lực Nhật chủ (bao gồm chính nó và hành Sinh nó)
        let dongDang = 0;
        let khacTiet = 0;
        
        Object.keys(elementScore).forEach(el => {
            const relation = this.rules.relation[dmElem][el];
            if (relation === 'tro' || relation === 'duoc_sinh') {
                dongDang += elementScore[el];
            } else {
                khacTiet += elementScore[el];
            }
        });

        // Tòng Cách Check
        let isTongCach = false;
        let strongestElem = "";
        let maxVal = 0;
        
        for (const [el, val] of Object.entries(elementScore)) {
            if (val > maxVal) { maxVal = val; strongestElem = el; }
        }

        if (maxVal / totalScore > 0.7) {
            isTongCach = true;
            analysis.than = "tong_cach";
            const rel = this.rules.relation[dmElem][strongestElem];
            if (rel === 'tro') analysis.tongCachType = "tòng vượng";
            else if (rel === 'khac') analysis.tongCachType = "tòng sát";
            else if (rel === 'sinh') analysis.tongCachType = "tòng nhi";
            else if (rel === 'bi_khac') analysis.tongCachType = "tòng tài";
            else analysis.tongCachType = "tòng cách đặc biệt";
        } else {
            if (dongDang > khacTiet * 1.2) analysis.than = "vuong";
            else if (khacTiet > dongDang * 1.2) analysis.than = "nhuoc";
            else analysis.than = "can_bang";
        }

        // Determine structure (Cách cục) based on docx rules
        analysis.cachCuc = this.determineCachCuc(dmGan, monthZhi, canChi, elementScore);

        // PHASE 4: Dụng Thần & Hỷ Thần
        let dungThan = "";
        let hyThan = "";
        
        if (isTongCach) {
            // Tòng theo hành mạnh nhất
            dungThan = strongestElem;
            hyThan = Object.keys(this.rules.relation[strongestElem]).find(k => this.rules.relation[strongestElem][k] === 'duoc_sinh');
        } else {
            if (analysis.than === "vuong") {
                // Find element that Khắc or Tiết (Sinh Xuất) day master mostly
                dungThan = Object.keys(this.rules.relation[dmElem]).find(k => this.rules.relation[dmElem][k] === 'bi_khac'); // Thê Tài
                hyThan = Object.keys(this.rules.relation[dmElem]).find(k => this.rules.relation[dmElem][k] === 'khac'); // Quan Sát
            } else {
                // Nhược -> Sinh (Phụ mẫu) / Trợ (Huynh đệ)
                dungThan = Object.keys(this.rules.relation[dmElem]).find(k => this.rules.relation[dmElem][k] === 'duoc_sinh'); 
                hyThan = dmElem;
            }
        }

        // PHASE 4.5: Nguyệt Lệnh Dụng Thần
        let nguyetLenhDungThan = "";
        const mZhi = canChi.month.zhi;
        const mTangs = this.rules.hiddenStems[mZhi] || [];
        const exposedStems = [canChi.year.gan, canChi.month.gan, canChi.day.gan, canChi.hour.gan];
        
        const exposedTang = mTangs.filter(t => exposedStems.includes(t.stem || t));
        if (exposedTang.length > 0) {
            nguyetLenhDungThan = exposedTang[0].stem || exposedTang[0]; // Ordered by Primary first
        } else {
            if (['Tý', 'Mão', 'Dậu'].includes(mZhi)) {
                nguyetLenhDungThan = mTangs[0].stem || mTangs[0];
            } else if (mZhi === 'Ngọ') {
                if (exposedStems.includes('Kỷ')) nguyetLenhDungThan = 'Kỷ';
                else nguyetLenhDungThan = 'Đinh';
            } else {
                nguyetLenhDungThan = mTangs[0].stem || mTangs[0];
            }
        }

        return {
            solarTimeline,
            tietKhiTimeline,
            lunarDateStr,
            lunarYear,
            tietKhiName,
            canChi,
            taiNguyen,
            cungMenh,
            nguHanh: elementScore,
            analysis,
            dungThan,
            hyThan,
            nguyetLenhDungThan,
            daYun: daYunData, // filtered visible ones
            rawDaYun: rawDaYunData, // complete unfiltered list
            metadata: {
                timezone: "Asia/Ho_Chi_Minh",
                utcOffset: 7,
                solarTimestamp: new Date(Date.UTC(year, month - 1, day, hour, minute)).getTime()
            }
        };
    }
}

module.exports = new BaziAnalyzer();
