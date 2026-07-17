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
        const baseScore = { Kim: 0, Moc: 0, Thuy: 0, Hoa: 0, Tho: 0 };
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

        // Bazi 5.2 - Lực Lượng Can Chi (Tải, Phúc, Song Thể, Che Đầu, Tiết Cước)
        const canChiAdjustments = {
            // 1. TẢI (Chi sinh Can)
            'Giáp Tý': { can: 0.20, chi: -0.20 },
            'Ất Hợi': { can: 0.30, chi: -0.30 },
            'Bính Dần': { can: 0.30, chi: -0.30 },
            'Đinh Mão': { can: 0.20, chi: -0.20 },
            'Kỷ Tỵ': { can: 0.30, chi: -0.30 },
            'Mậu Ngọ': { can: 0.30, chi: -0.30 },
            'Canh Thìn': { can: 0.20, chi: 0.30 },
            'Canh Tuất': { can: 0.30, chi: -0.30 },
            'Tân Mùi': { can: 0.20, chi: -0.20 },
            'Tân Sửu': { can: 0.30, chi: -0.30 },
            'Nhâm Thân': { can: 0.30, chi: -0.30 },
            'Quý Dậu': { can: 0.20, chi: -0.20 },
            // 2. PHÚC (Can sinh Chi)
            'Giáp Ngọ': { can: -0.30, chi: 0.30 },
            'Ất Tỵ': { can: -0.30, chi: 0.30 },
            'Bính Tuất': { can: -0.30, chi: 0.30 },
            'Bính Thìn': { can: -0.30, chi: 0.30 },
            'Đinh Mùi': { can: -0.30, chi: 0.30 },
            'Đinh Sửu': { can: -0.30, chi: 0.30 },
            'Mậu Thân': { can: -0.30, chi: 0.30 },
            'Kỷ Dậu': { can: -0.30, chi: 0.30 },
            'Canh Tý': { can: -0.30, chi: 0.30 },
            'Tân Hợi': { can: -0.30, chi: 0.30 },
            'Nhâm Dần': { can: -0.30, chi: 0.30 },
            'Quý Mão': { can: -0.30, chi: 0.30 },
            // 3. SONG THỂ (Đồng hành)
            'Giáp Dần': { can: 0.50, chi: 0.50 },
            'Ất Mão': { can: 0.50, chi: 0.50 },
            'Bính Ngọ': { can: 0.50, chi: 0.50 },
            'Đinh Tỵ': { can: 0.50, chi: 0.50 },
            'Kỷ Mùi': { can: 0.50, chi: 0.50 },
            'Kỷ Sửu': { can: 0.50, chi: 0.50 },
            'Mậu Thìn': { can: 0.50, chi: 0.50 },
            'Mậu Tuất': { can: 0.50, chi: 0.50 },
            'Canh Thân': { can: 0.50, chi: 0.50 },
            'Tân Dậu': { can: 0.50, chi: 0.50 },
            'Nhâm Tý': { can: 0.50, chi: 0.50 },
            'Quý Hợi': { can: 0.50, chi: 0.50 },
            // 4. CHE ĐẦU (Chi khắc Can hoặc Can khắc Chi mạnh)
            'Giáp Thìn': { can: 0.0, chi: -0.70 },
            'Giáp Tuất': { can: -0.30, chi: -0.50 },
            'Ất Sửu': { can: -0.30, chi: -0.50 },
            'Ất Mùi': { can: -0.30, chi: -0.50 },
            'Bính Thân': { can: -0.30, chi: -0.45 },
            'Đinh Dậu': { can: -0.30, chi: -0.45 },
            'Mậu Tý': { can: -0.30, chi: -0.45 },
            'Kỷ Hợi': { can: -0.30, chi: -0.45 },
            'Canh Dần': { can: -0.30, chi: -0.45 },
            'Tân Mão': { can: -0.30, chi: -0.45 },
            'Nhâm Ngọ': { can: -0.30, chi: -0.45 },
            'Quý Tỵ': { can: -0.30, chi: -0.45 },
            // 5. TIẾT CƯỚC (Can khắc Chi hoặc Chi khắc Can mạnh)
            'Giáp Thân': { can: -0.50, chi: -0.25 },
            'Ất Dậu': { can: -0.50, chi: -0.25 },
            'Bính Tý': { can: -0.50, chi: -0.25 },
            'Đinh Hợi': { can: -0.50, chi: -0.25 },
            'Mậu Dần': { can: -0.50, chi: -0.25 },
            'Kỷ Mão': { can: -0.50, chi: -0.25 },
            'Canh Ngọ': { can: -0.50, chi: -0.25 },
            'Tân Tỵ': { can: -0.50, chi: -0.25 },
            'Nhâm Tuất': { can: -0.40, chi: -0.30 },
            'Nhâm Thìn': { can: -0.50, chi: -0.25 },
            'Quý Sửu': { can: -0.40, chi: -0.30 },
            'Quý Mùi': { can: -0.50, chi: -0.25 }
        };

        pillars.forEach(p => {
            const key = `${canChi[p].gan} ${canChi[p].zhi}`;
            const adj = canChiAdjustments[key];
            if (adj) {
                stemWeights[p] *= (1 + adj.can);
                branchWeights[p] *= (1 + adj.chi);
            }
        });

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
                baseScore[ganElem] += stemWeights[p];
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
                    baseScore[hElem] += weight * r.ratio;
                    baseElementScore[hElem] += weight * r.ratio;
                }
            });
        });

        // PHASE 2: Nguyệt Lệnh & Thấu Can (Root Power) to Base Score
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

        const pillarIndices = { year: 0, month: 1, day: 2, hour: 3 };
        
        let exposedCount = 0;
        pillars.forEach(p => {
            const gan = canChi[p].gan;
            if (monthRootPowerMap[gan] !== undefined) {
                exposedCount++;
            }
        });
        const exposedDivisor = Math.max(1, exposedCount); // N >= 1

        let rootPowerPoints = { Kim: 0, Moc: 0, Thuy: 0, Hoa: 0, Tho: 0 };
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
                    rootPowerPoints[ganElem] += finalRootPower * multiplier;
                }
            }
        });

        // Add Root Power directly to Base Score (Tầng 1)
        for (const el in baseScore) {
            baseScore[el] += rootPowerPoints[el];
        }

        // TẦNG 2: Multipliers Accumulation
        let elementMultipliers = { Kim: 1.0, Moc: 1.0, Thuy: 1.0, Hoa: 1.0, Tho: 1.0 };

        // 1. Month Stem Power Adjustment (Nguyệt Lệnh Can Chi)
        let monthStemBonusPercent = 0.0;
        const primaryHidden = monthRatios[0]?.stem || '';
        const primaryHiddenElem = this.rules.stemElement[primaryHidden];

        if (monthRootPowerMap[monthStem] !== undefined) {
            // Level 1: Thấu Can (Already in Base Score Root Power, no extra bonus)
            monthStemBonusPercent = 0.0;
        } else if (monthStemElem && monthStemElem === primaryHiddenElem) {
            // Level 3: Đồng hành (+70% of Month Primary Hidden Root Power)
            monthStemBonusPercent = ((monthRootPowerMap[primaryHidden] || 0) * 0.7) / stemWeights.month;
        } else if (monthStemElem && primaryHiddenElem && this.rules.relation[primaryHiddenElem]?.[monthStemElem] === 'sinh') {
            // Level 2: Đắc sinh (+40% of Month Stem base)
            monthStemBonusPercent = config.dacSinhBonusPercent;
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
                monthStemBonusPercent = 1.0 / stemWeights.month; // small boost
            } else {
                monthStemBonusPercent = -config.biKhacPenaltyPercent; // -40% penalty
            }
        }
        if (monthStemElem) {
            elementMultipliers[monthStemElem] += monthStemBonusPercent;
        }

        // 2. Thông Căn với Diminishing Returns & Trọng Số Gốc
        const elementRoots = { Kim: [], Moc: [], Thuy: [], Hoa: [], Tho: [] };
        const stemRootScores = { year: 0, month: 0, day: 0, hour: 0 };
        const diminishingFactors = [1.0, 0.7, 0.4, 0.2];

        pillars.forEach(sp => {
            const stem = canChi[sp].gan;
            const stemElem = this.rules.stemElement[stem];
            if (!stemElem) return;

            const roots = [];
            pillars.forEach(bp => {
                const branch = canChi[bp].zhi;
                const weight = branchWeights[bp];
                const ratios = getBranchRatios(branch);

                ratios.forEach((r, rIdx) => {
                    if (!r.stem) return;
                    const rElem = this.rules.stemElement[r.stem];
                    if (rElem === stemElem) {
                        const dist = Math.abs(pillarIndices[sp] - pillarIndices[bp]);
                        let distMult = 1.0;
                        if (dist === 0) distMult = config.distanceMultipliers.d0;
                        else if (dist === 1) distMult = config.distanceMultipliers.d1;
                        else if (dist === 2) distMult = config.distanceMultipliers.d2;
                        else if (dist === 3) distMult = config.distanceMultipliers.d3;

                        const stemPolarity = this.rules.yinYang[stem];
                        const rootPolarity = this.rules.yinYang[r.stem];
                        const polarityMult = (stemPolarity === rootPolarity) 
                            ? config.yinYangRootMultipliers.same 
                            : config.yinYangRootMultipliers.opposite;

                        // Weighted Root (Proposal 5): Bản khí 100%, Trung khí 70%, Dư khí 40%
                        let rootTypeWeight = 1.0;
                        if (ratios.length === 2 && rIdx === 1) {
                            rootTypeWeight = 0.7; // Ngọ/Hợi secondary
                        } else if (ratios.length === 3) {
                            if (rIdx === 1) rootTypeWeight = 0.7;
                            else if (rIdx === 2) rootTypeWeight = 0.4;
                        }

                        const rootPower = weight * r.ratio;
                        const rootScore = rootPower * distMult * polarityMult * rootTypeWeight;
                        roots.push(rootScore);
                    }
                });
            });

            // Sort roots and apply diminishing factors to find the stem's root score
            const sortedRoots = roots.sort((a, b) => b - a);
            let totalRootScore = 0;
            sortedRoots.forEach((val, idx) => {
                const factor = diminishingFactors[idx] !== undefined ? diminishingFactors[idx] : 0.1;
                totalRootScore += val * factor;
            });
            stemRootScores[sp] = totalRootScore;

            // Add to element root scores
            elementRoots[stemElem].push(totalRootScore);
        });

        // Apply Diminishing Returns to element Multipliers
        Object.keys(elementRoots).forEach(el => {
            const roots = elementRoots[el].sort((a, b) => b - a);
            let totalRootScore = 0;
            roots.forEach((val, idx) => {
                const factor = diminishingFactors[idx] !== undefined ? diminishingFactors[idx] : 0.1;
                totalRootScore += val * factor;
            });
            const rootBonusPct = totalRootScore / 15.0; // scale against standard stem weight
            elementMultipliers[el] += rootBonusPct;
        });

        // 3. Chân Thần và Giả Thần
        pillars.forEach(p => {
            const stem = canChi[p].gan;
            const stemElem = this.rules.stemElement[stem];
            if (!stemElem) return;

            const isChanThan = monthRatios.some(r => r.stem && this.rules.stemElement[r.stem] === stemElem);
            if (isChanThan) {
                elementMultipliers[stemElem] += config.chanThanBonusPercent; // +20%
            }
        });

        // 4. Seasonal States (Vượng - Tướng - Hưu - Tù - Tử)
        let season = '';
        if (['Dần', 'Mão', 'Thìn'].includes(monthZhi)) season = 'Spring';
        else if (['Tỵ', 'Ngọ', 'Mùi'].includes(monthZhi)) season = 'Summer';
        else if (['Thân', 'Dậu', 'Tuất'].includes(monthZhi)) season = 'Autumn';
        else if (['Hợi', 'Tý', 'Sửu'].includes(monthZhi)) season = 'Winter';

        const getSeasonalMultiplier = (el) => {
            let status = 'Huu';
            if (monthZhi === 'Thìn' || monthZhi === 'Sửu') {
                if (el === 'Tho') return 1.5;
                if (el === 'Kim') return 1.2;
                if (el === 'Hoa' || el === 'Thuy') return 0.9;
                if (el === 'Moc') return 0.6;
            } else if (monthZhi === 'Mùi' || monthZhi === 'Tuất') {
                if (el === 'Tho') return 1.5;
                if (el === 'Kim') return 1.2;
                if (el === 'Hoa') return 1.0;
                if (el === 'Thuy') return 0.7;
                if (el === 'Moc') return 0.6;
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
            elementMultipliers[el] *= getSeasonalMultiplier(el);
        });

        // 5. Cát Cục Hợp/Xung/Hóa Địa Chi (Percentage base)
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

        // If elements are khuyết (0 base) but participate in combinations, seed them
        const ensureSeedBase = (el) => {
            if (baseScore[el] === 0) {
                baseScore[el] = 3.0; // 3.0 points seed for khuyết hành
            }
        };

        // Branch combination distance multiplier helper
        const getBranchCombinationDistance = (targetBranches) => {
            const indices = [];
            const used = new Set();
            targetBranches.forEach(b => {
                for (let i = 0; i < branchList.length; i++) {
                    if (branchList[i] === b && !used.has(i)) {
                        indices.push(i);
                        used.add(i);
                        break;
                    }
                }
            });
            if (indices.length < 2) return 1.0;
            
            if (targetBranches.length === 2) {
                const dist = Math.abs(indices[0] - indices[1]);
                if (dist === 1) return 1.0;
                if (dist === 2) return 0.6;
                if (dist === 3) return 0.3;
                return 1.0;
            } else if (targetBranches.length === 3) {
                indices.sort((a, b) => a - b);
                const diff1 = indices[1] - indices[0];
                const diff2 = indices[2] - indices[1];
                if (diff1 === 1 && diff2 === 1) return 1.0;
                if ((diff1 === 1 && diff2 === 2) || (diff1 === 2 && diff2 === 1)) return 0.7;
                return 0.5;
            }
            return 1.0;
        };

        Object.keys(seasonalGroups).forEach(el => {
            const matchedUnique = [...new Set(branchList.filter(z => seasonalGroups[el].includes(z)))];
            const count = matchedUnique.length;
            if (count === 3) {
                ensureSeedBase(el);
                const w_chi = getBranchCombinationDistance(seasonalGroups[el]);
                elementMultipliers[el] += 0.15 * w_chi; // +15% Tam Hội
                analysis.relations.tamHop.push(seasonalGroups[el].join('-') + ' (Hội)');
            } else if (count === 2) {
                ensureSeedBase(el);
                const w_chi = getBranchCombinationDistance(matchedUnique);
                elementMultipliers[el] += 0.05 * w_chi; // +5% Bán Hội
                analysis.relations.tamHop.push(matchedUnique.join('-') + ' (Bán Hội)');
            }
        });

        const hasSubset = (arr, subset) => subset.every(v => arr.includes(v));
        const occupiedBranches = new Set();

        // Helper check clash into combination
        const hasClashIntoCombination = (targetBranches) => {
            const clashes = {
                'Tý': 'Ngọ', 'Ngọ': 'Tý',
                'Sửu': 'Mùi', 'Mùi': 'Sửu',
                'Dần': 'Thân', 'Thân': 'Dần',
                'Mão': 'Dậu', 'Dậu': 'Mão',
                'Thìn': 'Tuất', 'Tuất': 'Thìn',
                'Tỵ': 'Hợi', 'Hợi': 'Tỵ'
            };
            return targetBranches.some(tb => branchList.includes(clashes[tb]));
        };

        // 1. Tam Hợp (20% bonus)
        const tamHopGroups = this.rules.branchRelations.tamHop;
        tamHopGroups.forEach(group => {
            const targetBranches = group.branches || group;
            if (!Array.isArray(targetBranches)) return;
            if (hasSubset(branchList, targetBranches)) {
                const isClashed = hasClashIntoCombination(targetBranches);
                analysis.relations.tamHop.push(targetBranches.join('-') + (isClashed ? ' (Bị xung phá)' : ''));
                targetBranches.forEach(z => occupiedBranches.add(z));

                const domElem = group.element || this.rules.branchElement[group.leader];
                if (domElem && !isClashed) {
                    ensureSeedBase(domElem);
                    const w_chi = getBranchCombinationDistance(targetBranches);
                    elementMultipliers[domElem] += 0.20 * w_chi;
                }
            }
        });

        // 2. Bán Tam Hợp (Có Đế Vượng - 5% bonus)
        const banTamHopGroups = this.rules.branchRelations.banTamHop;
        banTamHopGroups.forEach(group => {
            const targetBranches = group.branches || group;
            if (!Array.isArray(targetBranches)) return;
            if (hasSubset(branchList, targetBranches)) {
                const matchedUnique = [...new Set(branchList.filter(z => targetBranches.includes(z)))];
                if (matchedUnique.length < 2) return;

                const isClashed = hasClashIntoCombination(targetBranches);
                analysis.relations.banTamHop.push(targetBranches.join('-') + (isClashed ? ' (Bị xung phá)' : ''));
                targetBranches.forEach(z => occupiedBranches.add(z));

                const domElem = group.element;
                if (domElem && !isClashed) {
                    ensureSeedBase(domElem);
                    const w_chi = getBranchCombinationDistance(targetBranches);
                    elementMultipliers[domElem] += 0.05 * w_chi;
                }
            }
        });

        // 3. Củng Hợp (Bán Tam Hợp không có Đế Vượng)
        const cungHopGroups = [
            { branches: ["Thân", "Thìn"], element: "Thuy" },
            { branches: ["Dần", "Tuất"], element: "Hoa" },
            { branches: ["Hợi", "Mùi"], element: "Moc" },
            { branches: ["Tỵ", "Sửu"], element: "Kim" }
        ];
        cungHopGroups.forEach(group => {
            const targetBranches = group.branches;
            if (hasSubset(branchList, targetBranches)) {
                const matchedUnique = [...new Set(branchList.filter(z => targetBranches.includes(z)))];
                if (matchedUnique.length < 2) return;

                const isClashed = hasClashIntoCombination(targetBranches);
                analysis.relations.banTamHop.push(targetBranches.join('-') + ' (Củng Hợp)' + (isClashed ? ' (Bị xung phá)' : ''));
                targetBranches.forEach(z => occupiedBranches.add(z));

                const domElem = group.element;
                if (domElem && !isClashed) {
                    ensureSeedBase(domElem);
                    const w_chi = getBranchCombinationDistance(targetBranches);
                    
                    const stemList = pillars.map(p => canChi[p].gan);
                    const hasCanLo = stemList.some(s => this.rules.stemElement[s] === domElem);
                    
                    const pctBonus = hasCanLo ? 0.05 : 0.02; // Thiên can dẫn hóa thì cộng 5%, ngược lại cộng 2%
                    elementMultipliers[domElem] += pctBonus * w_chi;
                }
            }
        });

        // Medium priority: Lục Hợp (12% shared -> +6% each)
        const mediumPriorityRelations = ['lucHop'];
        mediumPriorityRelations.forEach(relType => {
            const groups = this.rules.branchRelations[relType];
            groups.forEach(group => {
                const targetBranches = group.branches || group;
                if (!Array.isArray(targetBranches)) return;

                if (hasSubset(branchList, targetBranches)) {
                    analysis.relations[relType].push(targetBranches.join('-'));
                    
                    const hasOccupied = targetBranches.some(z => occupiedBranches.has(z));
                    const scaleFactor = hasOccupied ? 0.2 : 1.0;

                    targetBranches.forEach(z => occupiedBranches.add(z));
                    
                    const w_chi = getBranchCombinationDistance(targetBranches);
                    targetBranches.forEach(z => {
                        const e = this.rules.branchElement[z];
                        if (e) {
                            ensureSeedBase(e);
                            elementMultipliers[e] += 0.06 * scaleFactor * w_chi;
                        }
                    });
                }
            });
        });

        // Low priority: Lục Xung (-12% -> -6% each), Lục Hại (-6% -> -3% each), Lục Phá (-5% -> -2.5% each), Hình (-12% -> -6% each)
        const lowPriorityRelations = ['lucXung', 'lucHai', 'lucPha', 'hinh'];
        lowPriorityRelations.forEach(relType => {
            const groups = this.rules.branchRelations[relType];
            if (!groups) return;
            groups.forEach(group => {
                const targetBranches = group.branches || group;
                if (!Array.isArray(targetBranches)) return;

                if (hasSubset(branchList, targetBranches)) {
                    analysis.relations[relType].push(targetBranches.join('-'));
                    
                    const hasOccupied = targetBranches.some(z => occupiedBranches.has(z));
                    const scaleFactor = hasOccupied ? 0.2 : 1.0;

                    let penaltyVal = -0.06; // default for xung, hinh
                    if (relType === 'lucHai') penaltyVal = -0.03;
                    else if (relType === 'lucPha') penaltyVal = -0.025;

                    const w_chi = getBranchCombinationDistance(targetBranches);
                    targetBranches.forEach(z => {
                        const e = this.rules.branchElement[z];
                        if (e) {
                            elementMultipliers[e] += penaltyVal * scaleFactor * w_chi;
                        }
                    });
                }
            });
        });

        // 6. Hợp Hóa Thiên Can Nghiêm Ngặt (Percentage-based)
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
                    ensureSeedBase(transElem);
                    if (isRuling) {
                        elementMultipliers[transElem] += 0.12;
                    } else if (isSupported) {
                        elementMultipliers[transElem] += 0.08;
                    } else {
                        elementMultipliers[transElem] += 0.02;
                    }
                } else {
                    ensureSeedBase(transElem);
                    elementMultipliers[transElem] += 0.02;
                }
            }
        });

        // 7. Tương Tác Thiên Can Khoảng Cách & Cản Trở Cự Ly
        const getBlockageFactor = (idx1, idx2) => {
            let minBlock = 1.0;
            for (let k = idx1 + 1; k < idx2; k++) {
                const midPillar = pillars[k];
                const midStem = canChi[midPillar].gan;
                const midElem = this.rules.stemElement[midStem];
                const midRootScore = stemRootScores[midPillar] || 0;
                
                // Gốc mạnh nếu tổng điểm thông căn >= 5.0
                const hasStrongRoot = midRootScore >= 5.0;
                
                if (hasStrongRoot) {
                    const stem1 = canChi[pillars[idx1]].gan;
                    const stem2 = canChi[pillars[idx2]].gan;
                    const el1 = this.rules.stemElement[stem1];
                    const el2 = this.rules.stemElement[stem2];
                    
                    const isKhac1 = this.rules.relation[midElem]?.[el1] === 'khac' || this.rules.relation[el1]?.[midElem] === 'khac';
                    const isKhac2 = this.rules.relation[midElem]?.[el2] === 'khac' || this.rules.relation[el2]?.[midElem] === 'khac';
                    
                    if (isKhac1 || isKhac2) {
                        minBlock = Math.min(minBlock, 0.1); // giảm 90% tương tác
                    }
                }
            }
            return minBlock;
        };

        for (let i = 0; i < ganList.length; i++) {
            for (let j = i + 1; j < ganList.length; j++) {
                const g1 = ganList[i];
                const g2 = ganList[j];
                const el1 = this.rules.stemElement[g1];
                const el2 = this.rules.stemElement[g2];
                if (!el1 || !el2) continue;

                const distance = j - i;
                let multiplier = 1.0;
                if (distance === 1) multiplier = config.distanceMultipliers.d1;
                else if (distance === 2) multiplier = config.distanceMultipliers.d2;
                else if (distance === 3) multiplier = config.distanceMultipliers.d3;

                // Quy tắc Quá Tải Tương Tác (Saturation): gần nhất 1.0, nhì 0.5, xa nhất 0.2
                let satMult = 1.0;
                if (distance === 2) satMult = 0.5;
                else if (distance === 3) satMult = 0.2;

                // Quy tắc Can Trung Gian Cản Trở (Blockage)
                const blockFactor = getBlockageFactor(i, j);

                const finalCanMult = multiplier * satMult * blockFactor;

                const rel1 = this.rules.relation[el1]?.[el2];
                const rel2 = this.rules.relation[el2]?.[el1];

                if (rel1) {
                    const baseChange = config.relationScore[rel1] || 0;
                    elementMultipliers[el1] += baseChange * finalCanMult * 0.5;
                }
                if (rel2) {
                    const baseChange = config.relationScore[rel2] || 0;
                    elementMultipliers[el2] += baseChange * finalCanMult * 0.5;
                }
            }
        }

        // 8. Thổ Khô & Thổ Ướt (Hòa khí 8%)
        let hasWet = branchList.some(z => this.rules.tho.wet.includes(z));
        let hasDry = branchList.some(z => this.rules.tho.dry.includes(z));
        if (hasWet) {
            elementMultipliers['Kim'] += 0.08;
            elementMultipliers['Hoa'] -= 0.20;
            elementMultipliers['Thuy'] += 0.08;
        }
        if (hasDry) {
            elementMultipliers['Hoa'] += 0.08;
            elementMultipliers['Thuy'] -= 0.24;
        }

        // Thổ quá vượng (>35% of intermediate scores)
        let intermediateScores = {};
        this.rules.elements.forEach(el => {
            intermediateScores[el] = Math.max(0, baseScore[el] * elementMultipliers[el]);
        });
        const intermediateTotal = Object.values(intermediateScores).reduce((a, b) => a + b, 0);
        if (intermediateTotal > 0 && (intermediateScores['Tho'] / intermediateTotal) > 0.35) {
            elementMultipliers['Moc'] *= (1 - config.thoVuongPenaltyPercent);
            elementMultipliers['Thuy'] *= (1 - config.thoVuongPenaltyPercent);
        }

        // Compute scores before phi tuyến sinh khắc
        let currentScores = {};
        this.rules.elements.forEach(el => {
            currentScores[el] = Math.max(0, baseScore[el] * elementMultipliers[el]);
        });

        // 9. Tương Sinh Khắc Phi Tuyến (Dynamic interaction)
        let nonlinearScores = { ...currentScores };
        this.rules.elements.forEach(el1 => {
            if (currentScores[el1] > 0) {
                this.rules.elements.forEach(el2 => {
                    if (el1 === el2) return;
                    const rel = this.rules.relation[el1]?.[el2];
                    if (rel && currentScores[el2] > 0) {
                        const factor = config.relationScore[rel] || 0;
                        const proportion = currentScores[el2] / (currentScores[el1] + currentScores[el2]);
                        nonlinearScores[el1] += currentScores[el1] * factor * proportion;
                    }
                });
            }
        });
        currentScores = nonlinearScores;
        for (const k in currentScores) currentScores[k] = Math.max(0, currentScores[k]);

        // 10. Bão Hòa Năng Lượng & Bù Đắp Hành Yếu
        const totalBeforeSat = Object.values(currentScores).reduce((a, b) => a + b, 0);
        if (totalBeforeSat > 0) {
            this.rules.elements.forEach(el => {
                const pct = currentScores[el] / totalBeforeSat;
                // Saturation
                if (pct > 0.60) {
                    currentScores[el] *= 0.20;
                } else if (pct > 0.50) {
                    currentScores[el] *= 0.50;
                } else if (pct > 0.40) {
                    currentScores[el] *= 0.70;
                }
                // Compensation
                if (pct < 0.05 && pct > 0) {
                    currentScores[el] *= 1.5;
                } else if (pct < 0.08 && pct > 0) {
                    currentScores[el] *= 1.3;
                }
            });
        }

        // 11. Phản Sinh / Phản Khắc & Con Vượng Mẹ Kiệt với Ngưỡng Mượt
        const smoothStep = (edge0, edge1, x) => {
            const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
            return t * t * (3 - 2 * t);
        };

        const totalAfterSat = Object.values(currentScores).reduce((a, b) => a + b, 0);
        if (totalAfterSat > 0) {
            // Phản sinh: Mẹ vượng hại con
            this.rules.elements.forEach(mother => {
                const child = Object.keys(this.rules.relation[mother]).find(k => this.rules.relation[mother][k] === 'sinh');
                if (child) {
                    const motherPct = currentScores[mother] / totalAfterSat;
                    const activation = smoothStep(0.30, 0.40, motherPct);
                    if (activation > 0) {
                        const maxPenalty = -0.5 * (currentScores[mother] - 35);
                        const penalty = maxPenalty * activation;
                        currentScores[child] = Math.max(0, currentScores[child] + penalty);
                    }
                }
            });

            // Phản khắc: Con quá vượng khắc ngược cha
            this.rules.elements.forEach(cha => {
                const con = Object.keys(this.rules.relation[cha]).find(k => this.rules.relation[cha][k] === 'khac');
                if (con) {
                    const scoreCha = currentScores[cha];
                    const scoreCon = currentScores[con];
                    if (scoreCon > 2.0 * scoreCha && scoreCha > 0) {
                        const ratio = scoreCon / scoreCha;
                        const activation = smoothStep(2.0, 3.0, ratio);
                        const maxPenalty = -0.4 * (scoreCon - 2.5 * scoreCha);
                        const penalty = maxPenalty * activation;
                        currentScores[cha] = Math.max(0, scoreCha + penalty);
                    }
                }
            });

            // Con Vượng Mẹ Kiệt & Mẫu dĩ tử quý
            this.rules.elements.forEach(mother => {
                const child = Object.keys(this.rules.relation[mother]).find(k => this.rules.relation[mother][k] === 'sinh');
                if (child) {
                    const childPct = currentScores[child] / totalAfterSat;
                    const kietActivation = smoothStep(0.30, 0.40, childPct);
                    if (kietActivation > 0) {
                        const factor = 1.0 - (0.30 * kietActivation);
                        currentScores[mother] *= factor;
                    } else {
                        const supportActivation = smoothStep(0.20, 0.30, childPct) * (1.0 - smoothStep(0.30, 0.40, childPct));
                        if (supportActivation > 0) {
                            const factor = 1.0 + (0.10 * supportActivation);
                            currentScores[mother] *= factor;
                        }
                    }
                }
            });
        }

        // 12. Điểm Sàn Phân Cấp & Chuẩn Hóa
        let isTongCachChart = false;
        const totalBeforeFloor = Object.values(currentScores).reduce((a, b) => a + b, 0);
        if (totalBeforeFloor > 0) {
            for (const el in currentScores) {
                if ((currentScores[el] / totalBeforeFloor) > 0.65) {
                    isTongCachChart = true;
                    break;
                }
            }
        }

        if (!isTongCachChart) {
            this.rules.elements.forEach(el => {
                const hasCanLo = pillars.some(p => this.rules.stemElement[canChi[p].gan] === el);
                let maxBranchType = 0;
                pillars.forEach(p => {
                    const zhi = canChi[p].zhi;
                    const ratios = getBranchRatios(zhi);
                    ratios.forEach((r, rIdx) => {
                        if (r.stem && this.rules.stemElement[r.stem] === el) {
                            let type = 1;
                            if (rIdx === 0) type = 3;
                            else if (rIdx === 1) type = 2;
                            maxBranchType = Math.max(maxBranchType, type);
                        }
                    });
                });

                let floorPercent = 0.0;
                if (hasCanLo) floorPercent = 0.05;
                else if (maxBranchType === 3) floorPercent = 0.04;
                else if (maxBranchType === 2) floorPercent = 0.02;
                else if (maxBranchType === 1) floorPercent = 0.01;

                if (floorPercent > 0) {
                    const baseVal = baseElementScore[el] || 0;
                    const floorVal = baseVal * floorPercent;
                    if (currentScores[el] < floorVal) {
                        currentScores[el] = floorVal;
                    }
                }
            });
        }

        // Save raw scores before normalization
        const rawScores = {};
        for (const k in currentScores) {
            rawScores[k] = parseFloat(currentScores[k].toFixed(2));
        }

        // Normalize to 100 points
        let normalizedScores = { ...currentScores };
        const finalTotal = Object.values(normalizedScores).reduce((a, b) => a + b, 0);
        if (finalTotal > 0) {
            for (const k in normalizedScores) {
                normalizedScores[k] = parseFloat(((normalizedScores[k] / finalTotal) * 100).toFixed(2));
            }
            const currentSum = Object.values(normalizedScores).reduce((a, b) => a + b, 0);
            const diff = parseFloat((100 - currentSum).toFixed(2));
            if (diff !== 0) {
                let maxKey = 'Kim';
                let maxVal = -1;
                for (const k in normalizedScores) {
                    if (normalizedScores[k] > maxVal) {
                        maxVal = normalizedScores[k];
                        maxKey = k;
                    }
                }
                normalizedScores[maxKey] = parseFloat((normalizedScores[maxKey] + diff).toFixed(2));
            }
        } else {
            normalizedScores = { Kim: 20, Moc: 20, Thuy: 20, Hoa: 20, Tho: 20 };
        }

        for (const k in normalizedScores) {
            normalizedScores[k] = Math.max(0, parseFloat(normalizedScores[k].toFixed(2)));
        }

        // Entropy, Dominance & Confidence
        let entropy = 0;
        for (const el in normalizedScores) {
            const p = normalizedScores[el] / 100.0;
            if (p > 0) entropy += -p * Math.log(p);
        }
        entropy = parseFloat(entropy.toFixed(4));

        let maxPct = 0;
        for (const el in normalizedScores) {
            maxPct = Math.max(maxPct, normalizedScores[el] / 100.0);
        }
        const dominanceIndex = parseFloat((maxPct - 0.20).toFixed(4));

        let confidenceScore = 1.0;
        confidenceScore += exposedCount * 0.1;
        let primaryRootsCount = 0;
        pillars.forEach(sp => {
            const stem = canChi[sp].gan;
            const stemElem = this.rules.stemElement[stem];
            if (!stemElem) return;
            pillars.forEach(bp => {
                const branch = canChi[bp].zhi;
                const ratios = getBranchRatios(branch);
                if (ratios[0]?.stem && this.rules.stemElement[ratios[0].stem] === stemElem) {
                    primaryRootsCount++;
                }
            });
        });
        confidenceScore += primaryRootsCount * 0.05;
        confidenceScore = parseFloat(Math.min(2.0, confidenceScore).toFixed(2));

        // PHASE 3: Analysis
        const dmElem = this.rules.stemElement[dmGan];
        const totalScore = Object.values(normalizedScores).reduce((a,b) => a+b, 0);

        // Lực Nhật chủ (bao gồm chính nó và hành Sinh nó)
        let dongDang = 0;
        let khacTiet = 0;
        
        Object.keys(normalizedScores).forEach(el => {
            const relation = this.rules.relation[dmElem][el];
            if (relation === 'tro' || relation === 'duoc_sinh') {
                dongDang += normalizedScores[el];
            } else {
                khacTiet += normalizedScores[el];
            }
        });

        // Tòng Cách Check
        let isTongCach = false;
        let strongestElem = "";
        let maxVal = 0;
        
        for (const [el, val] of Object.entries(normalizedScores)) {
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
        analysis.cachCuc = this.determineCachCuc(dmGan, monthZhi, canChi, normalizedScores);

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
            nguHanh: normalizedScores,
            nguHanhRaw: rawScores,
            entropy,
            dominanceIndex,
            confidenceScore,
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
