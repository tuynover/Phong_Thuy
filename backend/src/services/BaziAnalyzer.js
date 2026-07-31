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

const TU_LENH_RULES = {
    'Dần': [
        { limit: 5, stem: 'Mậu' },
        { limit: 10, stem: 'Bính' },
        { limit: Infinity, stem: 'Giáp' }
    ],
    'Mão': [
        { limit: 7, stem: 'Giáp' },
        { limit: Infinity, stem: 'Ất' }
    ],
    'Thìn': [
        { limit: 7, stem: 'Ất' },
        { limit: 12, stem: 'Quý' },
        { limit: Infinity, stem: 'Mậu' }
    ],
    'Tỵ': [
        { limit: 7, stem: 'Mậu' },
        { limit: 12, stem: 'Canh' },
        { limit: Infinity, stem: 'Bính' }
    ],
    'Ngọ': [
        { limit: 7, stem: 'Bính' },
        { limit: Infinity, stem: 'Đinh' }
    ],
    'Mùi': [
        { limit: 7, stem: 'Đinh' },
        { limit: 12, stem: 'Ất' },
        { limit: Infinity, stem: 'Kỷ' }
    ],
    'Thân': [
        { limit: 5, stem: 'Mậu' },
        { limit: 10, stem: 'Nhâm' },
        { limit: Infinity, stem: 'Canh' }
    ],
    'Dậu': [
        { limit: 7, stem: 'Canh' },
        { limit: Infinity, stem: 'Tân' }
    ],
    'Tuất': [
        { limit: 7, stem: 'Tân' },
        { limit: 12, stem: 'Đinh' }, // 5 ngày đinh
        { limit: Infinity, stem: 'Mậu' }
    ],
    'Hợi': [
        { limit: 5, stem: 'Mậu' },
        { limit: 10, stem: 'Giáp' },
        { limit: Infinity, stem: 'Nhâm' }
    ],
    'Tý': [
        { limit: 7, stem: 'Nhâm' },
        { limit: Infinity, stem: 'Quý' }
    ],
    'Sửu': [
        { limit: 7, stem: 'Quý' },
        { limit: 12, stem: 'Tân' }, // 5 ngày tân
        { limit: Infinity, stem: 'Kỷ' }
    ]
};

const getTuLenhCan = (monthZhiVi, days) => {
    const rules = TU_LENH_RULES[monthZhiVi];
    if (!rules) return '';
    for (const rule of rules) {
        if (days <= rule.limit) {
            return rule.stem;
        }
    }
    return '';
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

const stems = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const zhis = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const getTuanKhong = (g, z) => {
    const sIdx = stems.indexOf(g);
    const zIdx = zhis.indexOf(z);
    if (sIdx === -1 || zIdx === -1) return [];
    const startBranchIdx = (zIdx - sIdx + 12) % 12;
    return [zhis[(startBranchIdx + 10) % 12], zhis[(startBranchIdx + 11) % 12]];
};

const getShenSha = (gan, zhi, { dmGan, yearZhi, dayZhi, monthZhi, yearGan }) => {
    const list = [];
    
    // 1. Thiên Ất Quý Nhân
    const thienAtStems = [];
    if (dmGan) thienAtStems.push(dmGan);
    if (yearGan && yearGan !== dmGan) thienAtStems.push(yearGan);

    let hasThienAt = false;
    for (const stem of thienAtStems) {
        if (stem === 'Giáp' || stem === 'Mậu') {
            if (zhi === 'Sửu' || zhi === 'Mùi') hasThienAt = true;
        } else if (stem === 'Ất' || stem === 'Kỷ') {
            if (zhi === 'Tý' || zhi === 'Thân') hasThienAt = true;
        } else if (stem === 'Bính' || stem === 'Đinh') {
            if (zhi === 'Hợi' || zhi === 'Dậu') hasThienAt = true;
        } else if (stem === 'Canh' || stem === 'Tân') {
            if (zhi === 'Dần' || zhi === 'Ngọ') hasThienAt = true;
        } else if (stem === 'Nhâm' || stem === 'Quý') {
            if (zhi === 'Tỵ' || zhi === 'Mão') hasThienAt = true;
        }
    }
    if (hasThienAt) list.push('Thiên Ất');
    
    // 2. Thái Cực Quý Nhân
    const thaiCucStems = [];
    if (dmGan) thaiCucStems.push(dmGan);
    if (yearGan && yearGan !== dmGan) thaiCucStems.push(yearGan);

    let hasThaiCuc = false;
    for (const stem of thaiCucStems) {
        if (stem === 'Giáp' || stem === 'Ất') {
            if (zhi === 'Tý' || zhi === 'Ngọ') hasThaiCuc = true;
        } else if (stem === 'Bính' || stem === 'Đinh') {
            if (zhi === 'Hợi' || zhi === 'Dậu') hasThaiCuc = true;
        } else if (stem === 'Mậu' || stem === 'Kỷ') {
            if (zhi === 'Thìn' || zhi === 'Tuất' || zhi === 'Sửu' || zhi === 'Mùi') hasThaiCuc = true;
        } else if (stem === 'Canh' || stem === 'Tân') {
            if (zhi === 'Dần' || zhi === 'Mão') hasThaiCuc = true;
        } else if (stem === 'Nhâm' || stem === 'Quý') {
            if (zhi === 'Tỵ' || zhi === 'Thân') hasThaiCuc = true;
        }
    }
    if (hasThaiCuc) list.push('Thái Cực');
    
    // 3. Thiên Đức Quý Nhân
    if (monthZhi === 'Tý' && zhi === 'Tỵ') list.push('Thiên Đức');
    else if (monthZhi === 'Sửu' && gan === 'Canh') list.push('Thiên Đức');
    else if (monthZhi === 'Dần' && gan === 'Đinh') list.push('Thiên Đức');
    else if (monthZhi === 'Mão' && zhi === 'Thân') list.push('Thiên Đức');
    else if (monthZhi === 'Thìn' && gan === 'Nhâm') list.push('Thiên Đức');
    else if (monthZhi === 'Tỵ' && gan === 'Tân') list.push('Thiên Đức');
    else if (monthZhi === 'Ngọ' && gan === 'Bính') list.push('Thiên Đức');
    else if (monthZhi === 'Mùi' && gan === 'Giáp') list.push('Thiên Đức');
    else if (monthZhi === 'Thân' && gan === 'Quý') list.push('Thiên Đức');
    else if (monthZhi === 'Dậu' && zhi === 'Dần') list.push('Thiên Đức');
    else if (monthZhi === 'Tuất' && gan === 'Bính') list.push('Thiên Đức');
    else if (monthZhi === 'Hợi' && gan === 'Ất') list.push('Thiên Đức');

    // 4. Nguyệt Đức Quý Nhân
    if (['Dần', 'Ngọ', 'Tuất'].includes(monthZhi) && gan === 'Bính') list.push('Nguyệt Đức');
    else if (['Thân', 'Tý', 'Thìn'].includes(monthZhi) && gan === 'Nhâm') list.push('Nguyệt Đức');
    else if (['Tỵ', 'Dậu', 'Sửu'].includes(monthZhi) && gan === 'Canh') list.push('Nguyệt Đức');
    else if (['Hợi', 'Mão', 'Mùi'].includes(monthZhi) && gan === 'Giáp') list.push('Nguyệt Đức');

    // 5. Lộc Thần
    if (dmGan === 'Giáp' && zhi === 'Dần') list.push('Lộc Thần');
    else if (dmGan === 'Ất' && zhi === 'Mão') list.push('Lộc Thần');
    else if (dmGan === 'Bính' && zhi === 'Tỵ') list.push('Lộc Thần');
    else if (dmGan === 'Đinh' && zhi === 'Ngọ') list.push('Lộc Thần');
    else if (dmGan === 'Mậu' && zhi === 'Tỵ') list.push('Lộc Thần');
    else if (dmGan === 'Kỷ' && zhi === 'Ngọ') list.push('Lộc Thần');
    else if (dmGan === 'Canh' && zhi === 'Thân') list.push('Lộc Thần');
    else if (dmGan === 'Tân' && zhi === 'Dậu') list.push('Lộc Thần');
    else if (dmGan === 'Nhâm' && zhi === 'Hợi') list.push('Lộc Thần');
    else if (dmGan === 'Quý' && zhi === 'Tý') list.push('Lộc Thần');

    // 6. Kình Dương
    if (dmGan === 'Giáp' && zhi === 'Mão') list.push('Kình Dương');
    else if (dmGan === 'Ất' && zhi === 'Thìn') list.push('Kình Dương');
    else if (dmGan === 'Bính' && zhi === 'Ngọ') list.push('Kình Dương');
    else if (dmGan === 'Đinh' && zhi === 'Mùi') list.push('Kình Dương');
    else if (dmGan === 'Mậu' && zhi === 'Ngọ') list.push('Kình Dương');
    else if (dmGan === 'Kỷ' && zhi === 'Mùi') list.push('Kình Dương');
    else if (dmGan === 'Canh' && zhi === 'Dậu') list.push('Kình Dương');
    else if (dmGan === 'Tân' && zhi === 'Tuất') list.push('Kình Dương');
    else if (dmGan === 'Nhâm' && zhi === 'Tý') list.push('Kình Dương');
    else if (dmGan === 'Quý' && zhi === 'Sửu') list.push('Kình Dương');

    // Helper check function for Year/Day Branch triggers
    const checkYearDayMatch = (val) => {
        return (['Thân', 'Tý', 'Thìn'].includes(yearZhi) || ['Thân', 'Tý', 'Thìn'].includes(dayZhi)) && val === 'Thân_Tý_Thìn' ||
               (['Dần', 'Ngọ', 'Tuất'].includes(yearZhi) || ['Dần', 'Ngọ', 'Tuất'].includes(dayZhi)) && val === 'Dần_Ngọ_Tuất' ||
               (['Tỵ', 'Dậu', 'Sửu'].includes(yearZhi) || ['Tỵ', 'Dậu', 'Sửu'].includes(dayZhi)) && val === 'Tỵ_Dậu_Sửu' ||
               (['Hợi', 'Mão', 'Mùi'].includes(yearZhi) || ['Hợi', 'Mão', 'Mùi'].includes(dayZhi)) && val === 'Hợi_Mão_Mùi';
    };

    // 7. Dịch Mã
    if (zhi === 'Dần' && checkYearDayMatch('Thân_Tý_Thìn')) list.push('Dịch Mã');
    else if (zhi === 'Thân' && checkYearDayMatch('Dần_Ngọ_Tuất')) list.push('Dịch Mã');
    else if (zhi === 'Hợi' && checkYearDayMatch('Tỵ_Dậu_Sửu')) list.push('Dịch Mã');
    else if (zhi === 'Tỵ' && checkYearDayMatch('Hợi_Mão_Mùi')) list.push('Dịch Mã');

    // 8. Hoa Cái
    if (zhi === 'Thìn' && checkYearDayMatch('Thân_Tý_Thìn')) list.push('Hoa Cái');
    else if (zhi === 'Tuất' && checkYearDayMatch('Dần_Ngọ_Tuất')) list.push('Hoa Cái');
    else if (zhi === 'Sửu' && checkYearDayMatch('Tỵ_Dậu_Sửu')) list.push('Hoa Cái');
    else if (zhi === 'Mùi' && checkYearDayMatch('Hợi_Mão_Mùi')) list.push('Hoa Cái');

    // 9. Đào Hoa
    if (zhi === 'Dậu' && checkYearDayMatch('Thân_Tý_Thìn')) list.push('Đào Hoa');
    else if (zhi === 'Mão' && checkYearDayMatch('Dần_Ngọ_Tuất')) list.push('Đào Hoa');
    else if (zhi === 'Ngọ' && checkYearDayMatch('Tỵ_Dậu_Sửu')) list.push('Đào Hoa');
    else if (zhi === 'Tý' && checkYearDayMatch('Hợi_Mão_Mùi')) list.push('Đào Hoa');

    // 10. Tướng Tinh
    if (zhi === 'Tý' && checkYearDayMatch('Thân_Tý_Thìn')) list.push('Tướng Tinh');
    else if (zhi === 'Ngọ' && checkYearDayMatch('Dần_Ngọ_Tuất')) list.push('Tướng Tinh');
    else if (zhi === 'Dậu' && checkYearDayMatch('Tỵ_Dậu_Sửu')) list.push('Tướng Tinh');
    else if (zhi === 'Mão' && checkYearDayMatch('Hợi_Mão_Mùi')) list.push('Tướng Tinh');

    // 11. Kiếp Sát
    if (zhi === 'Tỵ' && checkYearDayMatch('Thân_Tý_Thìn')) list.push('Kiếp Sát');
    else if (zhi === 'Hợi' && checkYearDayMatch('Dần_Ngọ_Tuất')) list.push('Kiếp Sát');
    else if (zhi === 'Dần' && checkYearDayMatch('Tỵ_Dậu_Sửu')) list.push('Kiếp Sát');
    else if (zhi === 'Thân' && checkYearDayMatch('Hợi_Mão_Mùi')) list.push('Kiếp Sát');

    // 12. Vong Thần
    if (zhi === 'Hợi' && checkYearDayMatch('Thân_Tý_Thìn')) list.push('Vong Thần');
    else if (zhi === 'Tỵ' && checkYearDayMatch('Dần_Ngọ_Tuất')) list.push('Vong Thần');
    else if (zhi === 'Thân' && checkYearDayMatch('Tỵ_Dậu_Sửu')) list.push('Vong Thần');
    else if (zhi === 'Dần' && checkYearDayMatch('Hợi_Mão_Mùi')) list.push('Vong Thần');

    // 13. Văn Xương
    const vanXuongStems = [];
    if (dmGan) vanXuongStems.push(dmGan);
    if (yearGan && yearGan !== dmGan) vanXuongStems.push(yearGan);

    let hasVanXuong = false;
    for (const stem of vanXuongStems) {
        if (stem === 'Giáp' && zhi === 'Tỵ') hasVanXuong = true;
        else if (stem === 'Ất' && zhi === 'Ngọ') hasVanXuong = true;
        else if (stem === 'Bính' && zhi === 'Thân') hasVanXuong = true;
        else if (stem === 'Đinh' && zhi === 'Dậu') hasVanXuong = true;
        else if (stem === 'Mậu' && zhi === 'Thân') hasVanXuong = true;
        else if (stem === 'Kỷ' && zhi === 'Dậu') hasVanXuong = true;
        else if (stem === 'Canh' && zhi === 'Hợi') hasVanXuong = true;
        else if (stem === 'Tân' && zhi === 'Tý') hasVanXuong = true;
        else if (stem === 'Nhâm' && zhi === 'Dần') hasVanXuong = true;
        else if (stem === 'Quý' && zhi === 'Mão') hasVanXuong = true;
    }
    if (hasVanXuong) list.push('Văn Xương');

    // 14. Cô Thần & Quả Tú (based on Year Branch)
    if (['Hợi', 'Tý', 'Sửu'].includes(yearZhi)) {
        if (zhi === 'Dần') list.push('Cô Thần');
        if (zhi === 'Tuất') list.push('Quả Tú');
    } else if (['Dần', 'Mão', 'Thìn'].includes(yearZhi)) {
        if (zhi === 'Tỵ') list.push('Cô Thần');
        if (zhi === 'Sửu') list.push('Quả Tú');
    } else if (['Tỵ', 'Ngọ', 'Mùi'].includes(yearZhi)) {
        if (zhi === 'Thân') list.push('Cô Thần');
        if (zhi === 'Thìn') list.push('Quả Tú');
    } else if (['Thân', 'Dậu', 'Tuất'].includes(yearZhi)) {
        if (zhi === 'Hợi') list.push('Cô Thần');
        if (zhi === 'Mùi') list.push('Quả Tú');
    }

    // 15. Không Vong (Logic Vòng tuần hoàn)
    const dayKhong = getTuanKhong(dmGan, dayZhi);
    const yearKhong = getTuanKhong(yearGan, yearZhi);
    
    if (dayKhong.includes(zhi) || yearKhong.includes(zhi)) {
        list.push('Không Vong');
    }

    // 16. Phúc Tinh Quý Nhân (Giáp/Bính -> Tý/Dần, Ất/Quý -> Sửu/Mão, Đinh -> Hợi, Mậu -> Thân, Kỷ -> Mùi, Canh -> Ngọ, Tân -> Tỵ, Nhâm -> Thìn)
    const phucTinhStems = [];
    if (dmGan) phucTinhStems.push(dmGan);
    if (yearGan && yearGan !== dmGan) phucTinhStems.push(yearGan);

    let hasPhucTinh = false;
    for (const stem of phucTinhStems) {
        if ((stem === 'Giáp' || stem === 'Bính') && (zhi === 'Dần' || zhi === 'Tý')) hasPhucTinh = true;
        else if ((stem === 'Ất' || stem === 'Quý') && (zhi === 'Mão' || zhi === 'Sửu')) hasPhucTinh = true;
        else if (stem === 'Đinh' && zhi === 'Hợi') hasPhucTinh = true;
        else if (stem === 'Mậu' && zhi === 'Thân') hasPhucTinh = true;
        else if (stem === 'Kỷ' && zhi === 'Mùi') hasPhucTinh = true;
        else if (stem === 'Canh' && zhi === 'Ngọ') hasPhucTinh = true;
        else if (stem === 'Tân' && zhi === 'Tỵ') hasPhucTinh = true;
        else if (stem === 'Nhâm' && zhi === 'Thìn') hasPhucTinh = true;
    }
    if (hasPhucTinh) list.push('Phúc Tinh');

    // 17. Quốc Ấn Quý Nhân (Giáp -> Tuất, Ất -> Hợi, Bính -> Sửu, Đinh -> Dần, Mậu -> Sửu, Kỷ -> Dần, Canh -> Thìn, Tân -> Tỵ, Nhâm -> Mùi, Quý -> Thân)
    const quocAnStems = [];
    if (dmGan) quocAnStems.push(dmGan);
    if (yearGan && yearGan !== dmGan) quocAnStems.push(yearGan);

    let hasQuocAn = false;
    for (const stem of quocAnStems) {
        if (stem === 'Giáp' && zhi === 'Tuất') hasQuocAn = true;
        else if (stem === 'Ất' && zhi === 'Hợi') hasQuocAn = true;
        else if (stem === 'Bính' && zhi === 'Sửu') hasQuocAn = true;
        else if (stem === 'Đinh' && zhi === 'Dần') hasQuocAn = true;
        else if (stem === 'Mậu' && zhi === 'Sửu') hasQuocAn = true;
        else if (stem === 'Kỷ' && zhi === 'Dần') hasQuocAn = true;
        else if (stem === 'Canh' && zhi === 'Thìn') hasQuocAn = true;
        else if (stem === 'Tân' && zhi === 'Tỵ') hasQuocAn = true;
        else if (stem === 'Nhâm' && zhi === 'Mùi') hasQuocAn = true;
        else if (stem === 'Quý' && zhi === 'Thân') hasQuocAn = true;
    }
    if (hasQuocAn) list.push('Quốc Ấn');

    // 18. Thiên Y Quý Nhân (Tháng sinh lùi 1 cung địa chi)
    const thienYMap = {
        'Tý': 'Hợi', 'Sửu': 'Tý', 'Dần': 'Sửu', 'Mão': 'Dần', 'Thìn': 'Mão', 'Tỵ': 'Thìn',
        'Ngọ': 'Tỵ', 'Mùi': 'Ngọ', 'Thân': 'Mùi', 'Dậu': 'Thân', 'Tuất': 'Dậu', 'Hợi': 'Tuất'
    };
    if (monthZhi && thienYMap[monthZhi] === zhi) {
        list.push('Thiên Y');
    }

    // 19. Hồng Loan (Địa chi năm gặp cung đào hoa Hồng Loan)
    const hongLoanMap = {
        'Tý': 'Mão', 'Sửu': 'Dần', 'Dần': 'Sửu', 'Mão': 'Tý', 'Thìn': 'Hợi', 'Tỵ': 'Tuất',
        'Ngọ': 'Dậu', 'Mùi': 'Thân', 'Thân': 'Mùi', 'Dậu': 'Ngọ', 'Tuất': 'Tỵ', 'Hợi': 'Thìn'
    };
    if (yearZhi && hongLoanMap[yearZhi] === zhi) {
        list.push('Hồng Loan');
    }

    // 20. Thiên Hỷ (Xung với Hồng Loan)
    const thienHyMap = {
        'Tý': 'Dậu', 'Sửu': 'Thân', 'Dần': 'Mùi', 'Mão': 'Ngọ', 'Thìn': 'Tỵ', 'Tỵ': 'Thìn',
        'Ngọ': 'Mão', 'Mùi': 'Dần', 'Thân': 'Sửu', 'Dậu': 'Tý', 'Tuất': 'Hợi', 'Hợi': 'Tuất'
    };
    if (yearZhi && thienHyMap[yearZhi] === zhi) {
        list.push('Thiên Hỷ');
    }

    // 21. Kim Dư Quý Nhân (Giáp -> Thìn, Ất -> Tỵ, Bính -> Mùi, Đinh -> Thân, Mậu -> Mùi, Kỷ -> Thân, Canh -> Tuất, Tân -> Hợi, Nhâm -> Sửu, Quý -> Dần)
    const kimDuStems = [];
    if (dmGan) kimDuStems.push(dmGan);
    if (yearGan && yearGan !== dmGan) kimDuStems.push(yearGan);

    let hasKimDu = false;
    for (const stem of kimDuStems) {
        if (stem === 'Giáp' && zhi === 'Thìn') hasKimDu = true;
        else if (stem === 'Ất' && zhi === 'Tỵ') hasKimDu = true;
        else if (stem === 'Bính' && zhi === 'Mùi') hasKimDu = true;
        else if (stem === 'Đinh' && zhi === 'Thân') hasKimDu = true;
        else if (stem === 'Mậu' && zhi === 'Mùi') hasKimDu = true;
        else if (stem === 'Kỷ' && zhi === 'Thân') hasKimDu = true;
        else if (stem === 'Canh' && zhi === 'Tuất') hasKimDu = true;
        else if (stem === 'Tân' && zhi === 'Hợi') hasKimDu = true;
        else if (stem === 'Nhâm' && zhi === 'Sửu') hasKimDu = true;
        else if (stem === 'Quý' && zhi === 'Dần') hasKimDu = true;
    }
    if (hasKimDu) list.push('Kim Dư');

    return list;
};

class BaziAnalyzer {
    constructor() {
        const rulesPath = path.join(__dirname, '../data/rules.json');
        this.rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    }

    getBranchRatios(zhi) {
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
    }

    evaluateStemCombinations(canChi, getBranchRatios = this.getBranchRatios.bind(this)) {
        const ganList = [canChi.year.gan, canChi.month.gan, canChi.day.gan, canChi.hour.gan];
        const zhiList = [canChi.year.zhi, canChi.month.zhi, canChi.day.zhi, canChi.hour.zhi];
        const monthZhi = canChi.month.zhi;
        const dayGan = canChi.day.gan;
        
        const stemToElement = {
            'Giáp': 'Moc', 'Ất': 'Moc', 'Bính': 'Hoa', 'Đinh': 'Hoa', 'Mậu': 'Tho',
            'Kỷ': 'Tho', 'Canh': 'Kim', 'Tân': 'Kim', 'Nhâm': 'Thuy', 'Quý': 'Thuy'
        };

        // 5 cặp hợp hóa
        const hoaHop = {
            'Giáp-Kỷ': 'Tho', 'Kỷ-Giáp': 'Tho',
            'Ất-Canh': 'Kim', 'Canh-Ất': 'Kim',
            'Bính-Tân': 'Thuy', 'Tân-Bính': 'Thuy',
            'Đinh-Nhâm': 'Moc', 'Nhâm-Đinh': 'Moc',
            'Mậu-Quý': 'Hoa', 'Quý-Mậu': 'Hoa'
        };

        const adjacentPairs = [[0, 1], [1, 2], [2, 3]];
        const combinations = []; 

        const foundPairs = [];
        adjacentPairs.forEach(([idx1, idx2]) => {
            const g1 = ganList[idx1];
            const g2 = ganList[idx2];
            const key = `${g1}-${g2}`;
            const transElem = hoaHop[key];
            if (transElem) {
                foundPairs.push({ idx1, idx2, g1, g2, transElem });
            }
        });

        const indexCounts = {};
        foundPairs.forEach(p => {
            indexCounts[p.idx1] = (indexCounts[p.idx1] || 0) + 1;
            indexCounts[p.idx2] = (indexCounts[p.idx2] || 0) + 1;
        });

        const tranhHopIndices = new Set();
        for (const idx in indexCounts) {
            if (indexCounts[idx] > 1) {
                tranhHopIndices.add(parseInt(idx, 10));
            }
        }

        const stemCounts = {};
        ganList.forEach(g => { stemCounts[g] = (stemCounts[g] || 0) + 1; });
        
        foundPairs.forEach(p => {
            const partner1 = p.g1;
            const partner2 = p.g2;
            if ((stemCounts[partner1] >= 2 && stemCounts[partner2] >= 1) ||
                (stemCounts[partner2] >= 2 && stemCounts[partner1] >= 1)) {
                tranhHopIndices.add(p.idx1);
                tranhHopIndices.add(p.idx2);
            }
        });

        foundPairs.forEach(p => {
            const { idx1, idx2, g1, g2 } = p;
            let transElem = p.transElem;

            // Nhật chủ tĩnh không hóa
            if (idx1 === 2 || idx2 === 2) {
                combinations.push({ idx1, idx2, g1, g2, transElem, status: 'hop_ban', reason: 'Nhật chủ tĩnh không hóa' });
                return;
            }

            if (tranhHopIndices.has(idx1) || tranhHopIndices.has(idx2)) {
                combinations.push({ idx1, idx2, g1, g2, transElem, status: 'hop_ban', reason: 'Tranh hợp (Đố hợp)' });
                return;
            }

            // Động hóa Giáp-Kỷ (Thổ hoặc Mộc)
            const pairKey = `${g1}-${g2}`;
            if (pairKey === 'Giáp-Kỷ' || pairKey === 'Kỷ-Giáp') {
                let strengthMoc = 0;
                let strengthTho = 0;
                ganList.forEach((g, idx) => {
                    if (stemToElement[g] === 'Moc') strengthMoc += (idx === 1 ? 7.5 : 15);
                    if (stemToElement[g] === 'Tho') strengthTho += (idx === 1 ? 7.5 : 15);
                });
                zhiList.forEach(z => {
                    const ratios = getBranchRatios(z);
                    ratios.forEach(r => {
                        if (r.stem) {
                            if (stemToElement[r.stem] === 'Moc') strengthMoc += 10 * r.ratio;
                            if (stemToElement[r.stem] === 'Tho') strengthTho += 10 * r.ratio;
                        }
                    });
                });
                if (strengthTho > strengthMoc) {
                    transElem = 'Tho';
                } else {
                    transElem = 'Moc';
                }
            }

            // Kiểm tra ngưỡng lực lượng với Vùng đệm chuyển tiếp mềm (Fuzzy Transition Zone: 15.0 -> 20.0)
            let totalStrength = 0;
            const el1 = stemToElement[g1];
            const el2 = stemToElement[g2];
            ganList.forEach((g, idx) => {
                const elem = stemToElement[g];
                if (elem === el1 || elem === el2) totalStrength += (idx === 1 ? 7.5 : 15);
            });
            zhiList.forEach(z => {
                const ratios = getBranchRatios(z);
                ratios.forEach(r => {
                    if (r.stem) {
                        const elem = stemToElement[r.stem];
                        if (elem === el1 || elem === el2) totalStrength += 10 * r.ratio;
                    }
                });
            });

            if (totalStrength < 15.0) {
                combinations.push({ idx1, idx2, g1, g2, transElem, transRatio: 0, status: 'hop_ban', reason: 'Lực lượng ngũ hành hai can quá yếu (<15.0 điểm)' });
                return;
            }

            const transRatio = totalStrength >= 20.0 ? 1.0 : Math.max(0.1, (totalStrength - 15.0) / 5.0);

            let isKhacPha = false;
            const neighborIndices = [idx1 - 1, idx2 + 1].filter(idx => idx >= 0 && idx < 4 && idx !== idx1 && idx !== idx2);
            for (const nIdx of neighborIndices) {
                const nStem = ganList[nIdx];
                const nElem = stemToElement[nStem];
                
                const relationMap = {
                    'Kim': { 'Moc': 'khac' },
                    'Moc': { 'Tho': 'khac' },
                    'Tho': { 'Thuy': 'khac' },
                    'Thuy': { 'Hoa': 'khac' },
                    'Hoa': { 'Kim': 'khac' }
                };
                if (nElem && relationMap[nElem]?.[transElem] === 'khac') {
                    isKhacPha = true;
                    break;
                }
            }

            if (isKhacPha) {
                combinations.push({ idx1, idx2, g1, g2, transElem, transRatio: 0, status: 'hop_ban', reason: 'Bị can kề sát khắc phá' });
                return;
            }

            let isNguyetLenhOk = false;
            const mappingNguyetLenh = {
                'Tho': ['Thìn', 'Tuất', 'Sửu', 'Mùi', 'Tỵ', 'Ngọ'],
                'Kim': ['Thân', 'Dậu', 'Thìn', 'Tuất', 'Sửu', 'Mùi'],
                'Thuy': ['Tý', 'Hợi', 'Thân', 'Dậu'],
                'Moc': ['Dần', 'Mão', 'Tý', 'Hợi'],
                'Hoa': ['Tỵ', 'Ngọ', 'Dần', 'Mão']
            };

            const okBranches = mappingNguyetLenh[transElem] || [];
            if (okBranches.includes(monthZhi)) {
                isNguyetLenhOk = true;
            }

            if (!isNguyetLenhOk) {
                combinations.push({ idx1, idx2, g1, g2, transElem, transRatio: 0, status: 'hop_ban', reason: 'Nguyệt lệnh thất thời' });
                return;
            }

            let hasPrimaryRoot = false;
            let secondaryRootCount = 0;

            zhiList.forEach(b => {
                const ratios = getBranchRatios(b);
                if (ratios[0] && ratios[0].stem) {
                    const primaryElem = stemToElement[ratios[0].stem];
                    if (primaryElem === transElem) {
                        hasPrimaryRoot = true;
                    }
                }
                for (let i = 1; i < ratios.length; i++) {
                    if (ratios[i] && ratios[i].stem) {
                        const secElem = stemToElement[ratios[i].stem];
                        if (secElem === transElem) {
                            secondaryRootCount++;
                        }
                    }
                }
            });

            const hasHelperBranch = hasPrimaryRoot || (secondaryRootCount >= 2);

            if (!hasHelperBranch) {
                combinations.push({ idx1, idx2, g1, g2, transElem, transRatio: 0, status: 'hop_ban', reason: 'Địa chi vô gốc hỗ trợ' });
                return;
            }

            combinations.push({ idx1, idx2, g1, g2, transElem, transRatio, status: 'hoa' });
        });

        return combinations;
    }

    getRepresentativeStem(elem) {
        const map = { 'Tho': 'Mậu', 'Kim': 'Canh', 'Thuy': 'Nhâm', 'Moc': 'Giáp', 'Hoa': 'Bính' };
        return map[elem] || '';
    }

    evaluateBranchCombinations(canChi) {
        const ganList = [canChi.year.gan, canChi.month.gan, canChi.day.gan, canChi.hour.gan];
        const zhiList = [canChi.year.zhi, canChi.month.zhi, canChi.day.zhi, canChi.hour.zhi];
        const monthZhi = canChi.month.zhi;

        const stemToElement = {
            'Giáp': 'Moc', 'Ất': 'Moc', 'Bính': 'Hoa', 'Đinh': 'Hoa', 'Mậu': 'Tho',
            'Kỷ': 'Tho', 'Canh': 'Kim', 'Tân': 'Kim', 'Nhâm': 'Thuy', 'Quý': 'Thuy'
        };

        const branchToElement = {
            'Tý': 'Thuy', 'Sửu': 'Tho', 'Dần': 'Moc', 'Mão': 'Moc', 'Thìn': 'Tho', 'Tỵ': 'Hoa',
            'Ngọ': 'Hoa', 'Mùi': 'Tho', 'Thân': 'Kim', 'Dậu': 'Kim', 'Tuất': 'Tho', 'Hợi': 'Thuy'
        };

        // 6 cặp Lục hợp gốc
        const lucHopPairs = {
            'Tý-Sửu': 'Tho', 'Sửu-Tý': 'Tho', 
            'Dần-Hợi': 'Moc', 'Hợi-Dần': 'Moc',
            'Mão-Tuất': 'Hoa', 'Tuất-Mão': 'Hoa',
            'Thìn-Dậu': 'Kim', 'Dậu-Thìn': 'Kim',
            'Tỵ-Thân': 'Thuy', 'Thân-Tỵ': 'Thuy',
            'Ngọ-Mùi': 'Tho', 'Mùi-Ngọ': 'Tho' 
        };

        const adjacentPairs = [[0, 1], [1, 2], [2, 3]];
        const combinations = [];

        adjacentPairs.forEach(([idx1, idx2]) => {
            const z1 = zhiList[idx1];
            const z2 = zhiList[idx2];
            const key = `${z1}-${z2}`;
            let transElem = lucHopPairs[key];
            if (!transElem) return;

            // Xác định động hóa thần cho Tý-Sửu và Ngọ-Mùi dựa trên Can dẫn hóa lộ diện
            if (key === 'Tý-Sửu' || key === 'Sửu-Tý') {
                const hasThuyCan = ganList.some(g => stemToElement[g] === 'Thuy');
                const hasThoCan = ganList.some(g => stemToElement[g] === 'Tho');
                if (hasThoCan) transElem = 'Tho';
                else if (hasThuyCan) transElem = 'Thuy';
                else {
                    // Không lộ can -> Không hóa (đặt mặc định Tho để kiểm tra điều kiện can dẫn hóa ở dưới, sẽ thất bại và rơi vào hợp bạn)
                    transElem = 'Tho';
                }
            } else if (key === 'Ngọ-Mùi' || key === 'Mùi-Ngọ') {
                const hasThoCan = ganList.some(g => stemToElement[g] === 'Tho');
                const hasHoaCan = ganList.some(g => stemToElement[g] === 'Hoa');
                if (hasThoCan) transElem = 'Tho';
                else if (hasHoaCan) transElem = 'Hoa';
                else {
                    // Không lộ can -> Không hóa
                    transElem = 'Tho';
                }
            }

            const isHopSinh = ['Dần-Hợi', 'Hợi-Dần', 'Thìn-Dậu', 'Dậu-Thìn', 'Ngọ-Mùi', 'Mùi-Ngọ'].includes(key);

            // 1. Kiểm tra Thiên can dẫn hóa (Bắt buộc)
            const hasCanDẫnHóa = ganList.some(g => stemToElement[g] === transElem);
            if (!hasCanDẫnHóa) {
                combinations.push({ idx1, idx2, z1, z2, transElem, status: 'hop_ban', reason: 'Không có Thiên can dẫn hóa' });
                return;
            }

            // 2. Kiểm tra Nguyệt lệnh (Cùng hành hoặc được sinh cho)
            const monthBranchElem = branchToElement[monthZhi];
            const isDongHanh = monthBranchElem === transElem;
            
            const relationMap = {
                'Kim': { 'Moc': 'khac', 'Thuy': 'sinh', 'Tho': 'duoc_sinh' },
                'Moc': { 'Tho': 'khac', 'Hoa': 'sinh', 'Thuy': 'duoc_sinh' },
                'Tho': { 'Thuy': 'khac', 'Kim': 'sinh', 'Hoa': 'duoc_sinh' },
                'Thuy': { 'Hoa': 'khac', 'Moc': 'sinh', 'Kim': 'duoc_sinh' },
                'Hoa': { 'Kim': 'khac', 'Tho': 'sinh', 'Moc': 'duoc_sinh' }
            };
            const isSinhTro = relationMap[monthBranchElem]?.[transElem] === 'duoc_sinh';

            const isNguyetLenhOk = isDongHanh || isSinhTro;

            if (!isNguyetLenhOk) {
                combinations.push({ idx1, idx2, z1, z2, transElem, status: 'hop_ban', reason: 'Nguyệt lệnh phản đối (thất thời)' });
                return;
            }

            // 3. Kiểm tra xung khắc bên ngoài (Chỉ áp dụng cho Hợp khắc)
            if (!isHopSinh) {
                let isClashed = false;
                const clashPairs = {
                    'Tý': 'Ngọ', 'Ngọ': 'Tý',
                    'Sửu': 'Mùi', 'Mùi': 'Sửu',
                    'Dần': 'Thân', 'Thân': 'Dần',
                    'Mão': 'Dậu', 'Dậu': 'Mão',
                    'Thìn': 'Tuất', 'Tuất': 'Thìn',
                    'Tỵ': 'Hợi', 'Hợi': 'Tỵ'
                };
                zhiList.forEach((b, bIdx) => {
                    if (bIdx !== idx1 && bIdx !== idx2) {
                        if (clashPairs[z1] === b || clashPairs[z2] === b) {
                            isClashed = true;
                        }
                    }
                });

                if (isClashed) {
                    combinations.push({ idx1, idx2, z1, z2, transElem, status: 'hop_ban', reason: 'Bị xung khắc phá vỡ' });
                    return;
                }
            }

            // Thỏa mãn tất cả điều kiện -> Hóa khí thành công!
            combinations.push({ idx1, idx2, z1, z2, transElem, status: 'hoa' });
        });

        return combinations;
    }

    hasDisruptionIntoCombination(targetBranches, branchList) {
        const clashes = {
            'Tý': 'Ngọ', 'Ngọ': 'Tý',
            'Sửu': 'Mùi', 'Mùi': 'Sửu',
            'Dần': 'Thân', 'Thân': 'Dần',
            'Mão': 'Dậu', 'Dậu': 'Mão',
            'Thìn': 'Tuất', 'Tuất': 'Thìn',
            'Tỵ': 'Hợi', 'Hợi': 'Tỵ'
        };
        const haiMap = {
            'Tý': 'Mùi', 'Mùi': 'Tý',
            'Sửu': 'Ngọ', 'Ngọ': 'Sửu',
            'Dần': 'Tỵ', 'Tỵ': 'Dần',
            'Mão': 'Thìn', 'Thìn': 'Mão',
            'Thân': 'Hợi', 'Hợi': 'Thân',
            'Dậu': 'Tuất', 'Tuất': 'Dậu'
        };
        const hinhMap = {
            'Tý': ['Mão'], 'Mão': ['Tý'],
            'Dần': ['Tỵ', 'Thân'], 'Tỵ': ['Dần', 'Thân'], 'Thân': ['Dần', 'Tỵ'],
            'Sửu': ['Tuất', 'Mùi'], 'Tuất': ['Sửu', 'Mùi'], 'Mùi': ['Sửu', 'Tuất'],
            'Thìn': ['Thìn'], 'Ngọ': ['Ngọ'], 'Dậu': ['Dậu'], 'Hợi': ['Hợi']
        };

        for (const tb of targetBranches) {
            if (clashes[tb] && branchList.includes(clashes[tb])) return true;
            if (haiMap[tb] && branchList.includes(haiMap[tb])) return true;
            if (hinhMap[tb]) {
                for (const th of hinhMap[tb]) {
                    if (th === tb) {
                        if (branchList.filter(z => z === tb).length > 1) return true;
                    } else if (branchList.includes(th)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    evaluateThreeBranchCombinations(canChi) {
        const ganList = [canChi.year.gan, canChi.month.gan, canChi.day.gan, canChi.hour.gan];
        const zhiList = [canChi.year.zhi, canChi.month.zhi, canChi.day.zhi, canChi.hour.zhi];
        const monthZhi = canChi.month.zhi;

        const stemToElement = {
            'Giáp': 'Moc', 'Ất': 'Moc', 'Bính': 'Hoa', 'Đinh': 'Hoa', 'Mậu': 'Tho',
            'Kỷ': 'Tho', 'Canh': 'Kim', 'Tân': 'Kim', 'Nhâm': 'Thuy', 'Quý': 'Thuy'
        };

        const branchToElement = {
            'Tý': 'Thuy', 'Sửu': 'Tho', 'Dần': 'Moc', 'Mão': 'Moc', 'Thìn': 'Tho', 'Tỵ': 'Hoa',
            'Ngọ': 'Hoa', 'Mùi': 'Tho', 'Thân': 'Kim', 'Dậu': 'Kim', 'Tuất': 'Tho', 'Hợi': 'Thuy'
        };

        const hasSubset = (arr, subset) => subset.every(v => arr.includes(v));

        const combinations = [];

        const groups = [
            { type: 'tamHop', branches: ['Thân', 'Tý', 'Thìn'], element: 'Thuy', leader: 'Tý' },
            { type: 'tamHop', branches: ['Dần', 'Ngọ', 'Tuất'], element: 'Hoa', leader: 'Ngọ' },
            { type: 'tamHop', branches: ['Tỵ', 'Dậu', 'Sửu'], element: 'Kim', leader: 'Dậu' },
            { type: 'tamHop', branches: ['Hợi', 'Mão', 'Mùi'], element: 'Moc', leader: 'Mão' },
            { type: 'tamHoi', branches: ['Dần', 'Mão', 'Thìn'], element: 'Moc', leader: 'Mão' },
            { type: 'tamHoi', branches: ['Tỵ', 'Ngọ', 'Mùi'], element: 'Hoa', leader: 'Ngọ' },
            { type: 'tamHoi', branches: ['Thân', 'Dậu', 'Tuất'], element: 'Kim', leader: 'Dậu' },
            { type: 'tamHoi', branches: ['Hợi', 'Tý', 'Sửu'], element: 'Thuy', leader: 'Tý' }
        ];

        groups.forEach(g => {
            if (hasSubset(zhiList, g.branches)) {
                const isClashed = this.hasDisruptionIntoCombination(g.branches, zhiList);
                if (isClashed) return;

                const hasCanDẫnHóa = ganList.some(gan => stemToElement[gan] === g.element);
                if (!hasCanDẫnHóa) return;

                const monthBranchElem = branchToElement[monthZhi];
                const isDongHanh = monthBranchElem === g.element;
                const relationMap = {
                    'Kim': { 'Moc': 'khac', 'Thuy': 'sinh', 'Tho': 'duoc_sinh' },
                    'Moc': { 'Tho': 'khac', 'Hoa': 'sinh', 'Thuy': 'duoc_sinh' },
                    'Tho': { 'Thuy': 'khac', 'Kim': 'sinh', 'Hoa': 'duoc_sinh' },
                    'Thuy': { 'Hoa': 'khac', 'Moc': 'sinh', 'Kim': 'duoc_sinh' },
                    'Hoa': { 'Kim': 'khac', 'Tho': 'sinh', 'Moc': 'duoc_sinh' }
                };
                const isSinhTro = relationMap[monthBranchElem]?.[g.element] === 'duoc_sinh';

                if (isDongHanh || isSinhTro) {
                    combinations.push({
                        type: g.type,
                        branches: g.branches,
                        element: g.element,
                        leader: g.leader,
                        status: 'hoa'
                    });
                }
            }
        });

        return combinations;
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
        const stemCombos = this.evaluateStemCombinations(canChi);
        const dmCombo = stemCombos.find(c => c.status === 'hoa' && (c.idx1 === 2 || c.idx2 === 2));
        if (dmCombo) {
            const elemNames = { 'Tho': 'Thổ', 'Kim': 'Kim', 'Thuy': 'Thủy', 'Moc': 'Mộc', 'Hoa': 'Hỏa' };
            return `Hóa ${elemNames[dmCombo.transElem]} cách`;
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
        
        let strongest = '';
        let maxVal = 0;
        for (const [el, val] of Object.entries(elementScore)) {
            if (val > maxVal) { maxVal = val; strongest = el; }
        }
        
        const isVeryWeak = (dmScore / totalScore) < 0.15;
        const isStrongestDominant = (maxVal / totalScore) >= 0.45; // Hành tòng theo phải thực sự mạnh áp đảo (>= 45%)
        
        if (isVeryWeak && isStrongestDominant) {
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

        const JIE_NAMES = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
        let prevJie = lunarAdjusted.getPrevJieQi();
        const tietKhiName = prevJie ? (JIE_QI_VI[prevJie.getName()] || prevJie.getName()) : '';

        // For Bazi month day-count, we must calculate elapsed days since the start of the Tiết (Jie) term, NOT the Trung khí (Qi) term.
        let prevJieForDayCount = prevJie;
        if (prevJieForDayCount && !JIE_NAMES.includes(prevJieForDayCount.getName())) {
            const tempSolar = prevJieForDayCount.getSolar().nextDay(-2);
            prevJieForDayCount = tempSolar.getLunar().getPrevJieQi();
        }

        // Calculate days elapsed since the start of the Bazi month (Tiết term)
        let tuLenhCan = '';
        if (prevJieForDayCount) {
            const jieSolar = prevJieForDayCount.getSolar();
            const birthDate = new Date(
                solarAdjusted.getYear(),
                solarAdjusted.getMonth() - 1,
                solarAdjusted.getDay(),
                solarAdjusted.getHour(),
                solarAdjusted.getMinute(),
                solarAdjusted.getSecond()
            );
            const jieDate = new Date(
                jieSolar.getYear(),
                jieSolar.getMonth() - 1,
                jieSolar.getDay(),
                jieSolar.getHour(),
                jieSolar.getMinute(),
                jieSolar.getSecond()
            );
            const msDiff = birthDate.getTime() - jieDate.getTime();
            const daysElapsed = Math.max(1, Math.floor(msDiff / (24 * 60 * 60 * 1000)) + 1);
            const monthZhiVi = toVi(baziAdjusted.getMonthZhi());
            tuLenhCan = getTuLenhCan(monthZhiVi, daysElapsed);
        }

        // Standard Lunar calendar birth info (Shifts strictly at Lunar New Year Mùng 1 Tết)
        const lunarDateStr = `ngày ${lunarLocal.getDay()} tháng ${lunarLocal.getMonth()} năm ${lunarLocal.getYear()} Âm lịch`;
        const lunarYear = toVi(lunarLocal.getYearInGanZhi());

        // Build Da Yun
        const yun = baziAdjusted.getYun(genderInt);

        // Định nghĩa context Thần Sát bằng tiếng Việt để tính toán chính xác
        const context = {
            dmGan: toVi(baziLocal.getDayGan()),
            yearZhi: toVi(baziAdjusted.getYearZhi()),
            dayZhi: toVi(baziLocal.getDayZhi()),
            monthZhi: toVi(baziAdjusted.getMonthZhi()),
            yearGan: toVi(baziAdjusted.getYearGan())
        };

        // Bóc tách Tàng can & Thập thần & Thần Sát
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

            const viGan = toVi(gan);
            const shenSha = getShenSha(viGan, viZhi, context);

            return {
                gan: viGan,
                zhi: viZhi,
                canChi: `${viGan} ${viZhi}`,
                thapThanGan,
                tangCan,
                shenSha
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

        const buildExtraPillar = (gan, zhi, calcShenSha = true) => {
            if (!gan || !zhi) return { gan: '', zhi: '', canChi: '', thapThanGan: '', tangCan: [], naYin: '', truongSinh: '', shenSha: [] };
            
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
            const shenSha = calcShenSha ? getShenSha(gan, zhi, context) : [];

            return {
                gan,
                zhi,
                canChi: `${gan} ${zhi}`,
                thapThanGan,
                tangCan,
                naYin,
                truongSinh,
                shenSha
            };
        };

        const taiNguyenCanChi = toVi(baziAdjusted.getTaiYuan());
        const cungMenhCanChi = toVi(baziLocal.getMingGong());
        const [tnGan, tnZhi] = taiNguyenCanChi.split(' ');
        const [cmGan, cmZhi] = cungMenhCanChi.split(' ');

        const taiNguyen = buildExtraPillar(tnGan, tnZhi, false);
        const cungMenh = buildExtraPillar(cmGan, cmZhi, false);

        // Build Da Yun enriched with pillars and Flowing Years (Lưu Niên)
        const rawDaYunData = yun.getDaYun().map(d => {
            const gan = toVi(d.getGanZhi().substring(0, 1));
            const zhi = toVi(d.getGanZhi().substring(1, 2));
            const pillar = buildExtraPillar(gan, zhi, false);
            
            const startYear = d.getStartYear();
            const startAge = d.getStartAge();
            
            // Build 10 Flowing Years (Lưu Niên) for this Great Cycle
            const liuNian = [];
            if (gan && zhi) {
                for (let i = 0; i < 10; i++) {
                    const curYear = startYear + i;
                    const curAge = startAge + i;
                    
                    // Get Bazi Year Can Chi for curYear using July 1st reference to ensure accuracy
                    const sol = Solar.fromYmd(curYear, 7, 1, 12, 0, 0);
                    const lun = sol.getLunar();
                    const baziYear = lun.getEightChar();
                    const yrGan = toVi(baziYear.getYearGan());
                    const yrZhi = toVi(baziYear.getYearZhi());
                    
                    const lnPillar = buildExtraPillar(yrGan, yrZhi, false);
                    
                    liuNian.push({
                        year: curYear,
                        age: curAge,
                        gan: lnPillar.gan,
                        zhi: lnPillar.zhi,
                        canChi: lnPillar.canChi,
                        thapThanGan: lnPillar.thapThanGan,
                        tangCan: lnPillar.tangCan,
                        naYin: lnPillar.naYin,
                        truongSinh: lnPillar.truongSinh,
                        shenSha: lnPillar.shenSha
                    });
                }
            }
            
            return {
                startYear,
                startAge,
                gan: pillar.gan,
                zhi: pillar.zhi,
                canChi: pillar.canChi,
                thapThanGan: pillar.thapThanGan,
                tangCan: pillar.tangCan,
                naYin: pillar.naYin,
                truongSinh: pillar.truongSinh,
                shenSha: pillar.shenSha,
                liuNian
            };
        });

        // daYun filters out pre-Da Yun childhood cycle with empty stem-branch
        const daYunData = rawDaYunData.filter(d => d.gan && d.zhi);

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

        // 1. Add base stem points adjusted by Hop/Hoa
        const stemCombos = this.evaluateStemCombinations(canChi, getBranchRatios);
        const stemAdjustedScores = { year: 0, month: 0, day: 0, hour: 0 };
        const stemAdjustedElements = { year: null, month: null, day: null, hour: null };

        pillars.forEach(p => {
            const gan = canChi[p].gan;
            stemAdjustedScores[p] = stemWeights[p];
            stemAdjustedElements[p] = this.rules.stemElement[gan];
        });

        stemCombos.forEach(combo => {
            const p1 = pillars[combo.idx1];
            const p2 = pillars[combo.idx2];

            if (combo.status === 'hoa') {
                const ratio = combo.transRatio !== undefined ? combo.transRatio : 1.0;
                stemAdjustedElements[p1] = combo.transElem;
                stemAdjustedElements[p2] = combo.transElem;
                stemAdjustedScores[p1] *= ratio;
                stemAdjustedScores[p2] *= ratio;

                const remRatio = 1.0 - ratio;
                if (remRatio > 0) {
                    const origElem1 = this.rules.stemElement[canChi[p1].gan];
                    const origElem2 = this.rules.stemElement[canChi[p2].gan];
                    baseScore[origElem1] += stemWeights[p1] * remRatio * 0.5;
                    baseElementScore[origElem1] += stemWeights[p1] * remRatio * 0.5;
                    baseScore[origElem2] += stemWeights[p2] * remRatio * 0.5;
                    baseElementScore[origElem2] += stemWeights[p2] * remRatio * 0.5;
                }
            } else if (combo.status === 'hop_ban') {
                stemAdjustedScores[p1] *= 0.5;
                stemAdjustedScores[p2] *= 0.5;
            }
        });

        pillars.forEach(p => {
            const targetElem = stemAdjustedElements[p];
            const score = stemAdjustedScores[p];
            if (targetElem && score > 0) {
                baseScore[targetElem] += score;
                baseElementScore[targetElem] += score;
            }
        });

        // 2. Add base branch points distributed to tàng can adjusted by Hop/Hoa
        const branchCombos = this.evaluateBranchCombinations(canChi);
        const branchAdjustedScores = { year: branchWeights.year, month: branchWeights.month, day: branchWeights.day, hour: branchWeights.hour };
        const branchAdjustedRatios = {};

        pillars.forEach(p => {
            const zhi = canChi[p].zhi;
            branchAdjustedRatios[p] = getBranchRatios(zhi);
        });

        const threeBranchCombos = this.evaluateThreeBranchCombinations(canChi);
        threeBranchCombos.forEach(combo => {
            if (combo.status === 'hoa') {
                const repStem = this.getRepresentativeStem(combo.element);
                pillars.forEach(p => {
                    if (combo.branches.includes(canChi[p].zhi)) {
                        branchAdjustedRatios[p] = [{ stem: repStem, ratio: 1.0 }];
                    }
                });
            }
        });

        branchCombos.forEach(combo => {
            const p1 = pillars[combo.idx1];
            const p2 = pillars[combo.idx2];

            if (combo.status === 'hoa') {
                const repStem = this.getRepresentativeStem(combo.transElem);
                branchAdjustedRatios[p1] = [{ stem: repStem, ratio: 1.0 }];
                branchAdjustedRatios[p2] = [{ stem: repStem, ratio: 1.0 }];
            } else if (combo.status === 'hop_ban') {
                const key = `${combo.z1}-${combo.z2}`;
                const isHopSinh = ['Dần-Hợi', 'Hợi-Dần', 'Thìn-Dậu', 'Dậu-Thìn', 'Ngọ-Mùi', 'Mùi-Ngọ'].includes(key);
                if (isHopSinh) {
                    let p_sinh = null;
                    let p_duoc_sinh = null;
                    const checkPairAndAssign = (z_a, z_b, p_a, p_b) => {
                        if (z_a === 'Hợi' && z_b === 'Dần') { p_sinh = p_a; p_duoc_sinh = p_b; }
                        else if (z_a === 'Dần' && z_b === 'Hợi') { p_sinh = p_b; p_duoc_sinh = p_a; }
                        else if (z_a === 'Thìn' && z_b === 'Dậu') { p_sinh = p_a; p_duoc_sinh = p_b; }
                        else if (z_a === 'Dậu' && z_b === 'Thìn') { p_sinh = p_b; p_duoc_sinh = p_a; }
                        else if (z_a === 'Ngọ' && z_b === 'Mùi') { p_sinh = p_a; p_duoc_sinh = p_b; }
                        else if (z_a === 'Mùi' && z_b === 'Ngọ') { p_sinh = p_b; p_duoc_sinh = p_a; }
                    };
                    checkPairAndAssign(combo.z1, combo.z2, p1, p2);
                    if (p_sinh && p_duoc_sinh) {
                        branchAdjustedScores[p_duoc_sinh] *= 1.30;
                    }
                } else {
                    branchAdjustedScores[p1] *= 0.5;
                    branchAdjustedScores[p2] *= 0.5;
                }
            }
        });

        pillars.forEach(p => {
            const weight = branchAdjustedScores[p];
            const ratios = branchAdjustedRatios[p];
            ratios.forEach(r => {
                if (!r.stem) return;
                const hElem = this.rules.stemElement[r.stem];
                if (hElem && weight > 0) {
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

        // Apply Diminishing Returns to element Multipliers (Excluding Day Master element - calculated via Academic Rules)
        const dmElem = this.rules.stemElement[dmGan];
        Object.keys(elementRoots).forEach(el => {
            if (el === dmElem) return; // Skip generic root calculation for Day Master
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

        const occupiedBranches = new Set();

        // 1. Tam Hợp & Tam Hội Hóa Khí
        threeBranchCombos.forEach(combo => {
            if (combo.status === 'hoa') {
                const el = combo.element;
                ensureSeedBase(el);
                const w_chi = getBranchCombinationDistance(combo.branches);
                combo.branches.forEach(z => occupiedBranches.add(z));

                const bonus = combo.type === 'tamHoi' ? 0.25 : 0.20;
                elementMultipliers[el] += bonus * w_chi;
                const label = combo.type === 'tamHoi' ? ' (Tam Hội Hóa)' : ' (Tam Hợp Hóa)';
                analysis.relations.tamHop.push(combo.branches.join('-') + label);
            }
        });

        const hasSubset = (arr, subset) => subset.every(v => arr.includes(v));

        // 2. Bán Tam Hợp (Có Đế Vượng - 5% bonus)
        const banTamHopGroups = this.rules.branchRelations.banTamHop;
        banTamHopGroups.forEach(group => {
            const targetBranches = group.branches || group;
            if (!Array.isArray(targetBranches)) return;
            if (hasSubset(branchList, targetBranches)) {
                const matchedUnique = [...new Set(branchList.filter(z => targetBranches.includes(z)))];
                if (matchedUnique.length < 2) return;

                const isClashed = this.hasDisruptionIntoCombination(targetBranches, branchList);
                analysis.relations.banTamHop.push(targetBranches.join('-') + (isClashed ? ' (Bị xung/hình/hại phá)' : ''));
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

                const isClashed = this.hasDisruptionIntoCombination(targetBranches, branchList);
                analysis.relations.banTamHop.push(targetBranches.join('-') + ' (Củng Hợp)' + (isClashed ? ' (Bị xung/hình/hại phá)' : ''));
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

        // Medium priority: Lục Hợp (12% shared -> +6% each or +12% for transformed element)
        branchCombos.forEach(combo => {
            const relStr = `${combo.z1}-${combo.z2}`;
            analysis.relations.lucHop.push(relStr);

            const targetBranches = [combo.z1, combo.z2];
            const hasOccupied = targetBranches.some(z => occupiedBranches.has(z));
            const scaleFactor = hasOccupied ? 0.2 : 1.0;

            targetBranches.forEach(z => occupiedBranches.add(z));

            const w_chi = getBranchCombinationDistance(targetBranches);
            
            if (combo.status === 'hoa') {
                const transElem = combo.transElem;
                ensureSeedBase(transElem);
                elementMultipliers[transElem] += 0.12 * scaleFactor * w_chi;
            }
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
        stemCombos.forEach(combo => {
            if (combo.status === 'hoa') {
                const transElem = combo.transElem;
                const monthBranchElem = this.rules.branchElement[monthZhi];
                const isRuling = transElem === monthBranchElem;
                const isSupported = this.rules.relation[monthBranchElem]?.[transElem] === 'sinh' || monthBranchElem === transElem;

                let hasHelper = false;
                pillars.forEach((p, idx) => {
                    if (idx !== combo.idx1 && idx !== combo.idx2) {
                        if (this.rules.stemElement[canChi[p].gan] === transElem) hasHelper = true;
                        const branchRatios = getBranchRatios(canChi[p].zhi);
                        if (branchRatios.some(r => r.stem && this.rules.stemElement[r.stem] === transElem)) hasHelper = true;
                    }
                });

                ensureSeedBase(transElem);
                if (hasHelper) {
                    if (isRuling) {
                        elementMultipliers[transElem] += 0.12;
                    } else if (isSupported) {
                        elementMultipliers[transElem] += 0.08;
                    } else {
                        elementMultipliers[transElem] += 0.02;
                    }
                } else {
                    elementMultipliers[transElem] += 0.02;
                }
            }
        });

        const ganList = pillars.map(p => canChi[p].gan);

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

        // Academic Flags Evaluation (Based on Refined User Rules)
        
        // 1. Check Được Tư Lệnh (Nhân Khí Tư Lệnh nắm quyền)
        const tuLenhElem = this.rules.stemElement[tuLenhCan];
        const isDucTuLenh = tuLenhElem === dmElem || (tuLenhElem && this.rules.relation[tuLenhElem]?.[dmElem] === 'duoc_sinh');

        // Clashes, hinh, hai maps for disruption check
        const clashes = {
            'Tý': 'Ngọ', 'Ngọ': 'Tý',
            'Sửu': 'Mùi', 'Mùi': 'Sửu',
            'Dần': 'Thân', 'Thân': 'Dần',
            'Mão': 'Dậu', 'Dậu': 'Mão',
            'Thìn': 'Tuất', 'Tuất': 'Thìn',
            'Tỵ': 'Hợi', 'Hợi': 'Tỵ'
        };
        const haiMap = {
            'Tý': 'Mùi', 'Mùi': 'Tý',
            'Sửu': 'Ngọ', 'Ngọ': 'Sửu',
            'Dần': 'Tỵ', 'Tỵ': 'Dần',
            'Mão': 'Thìn', 'Thìn': 'Mão',
            'Thân': 'Hợi', 'Hợi': 'Thân',
            'Dậu': 'Tuất', 'Tuất': 'Dậu'
        };
        const hinhMap = {
            'Tý': ['Mão'], 'Mão': ['Tý'],
            'Dần': ['Tỵ', 'Thân'], 'Tỵ': ['Dần', 'Thân'], 'Thân': ['Dần', 'Tỵ'],
            'Sửu': ['Tuất', 'Mùi'], 'Tuất': ['Sửu', 'Mùi'], 'Mùi': ['Sửu', 'Tuất'],
            'Thìn': ['Thìn'], 'Ngọ': ['Ngọ'], 'Dậu': ['Dậu'], 'Hợi': ['Hợi']
        };

        const isBranchDisrupted = (branch, index, allBranches) => {
            for (let i = 0; i < allBranches.length; i++) {
                if (i === index) continue;
                const otherBranch = allBranches[i];
                if (clashes[branch] === otherBranch) return true;
                if (haiMap[branch] === otherBranch) return true;
                if (hinhMap[branch]) {
                    if (hinhMap[branch].includes(otherBranch)) {
                        return true;
                    }
                }
            }
            return false;
        };

        // 2. Check Đắc Địa: Can ngày có Căn rễ chính khí và không bị xung/hình/hại phá hủy
        const allBranches = pillars.map(p => canChi[p].zhi);
        const isDacDia = allBranches.some((b, idx) => {
            const ratios = getBranchRatios(b);
            if (!ratios[0] || !ratios[0].stem) return false;
            const primaryElem = this.rules.stemElement[ratios[0].stem];
            if (primaryElem !== dmElem) return false;
            
            const isDisrupted = isBranchDisrupted(b, idx, allBranches);
            return !isDisrupted;
        });

        // 3. Check Được Sinh: Has Ấn (Chính Ấn / Thiên Ấn) in stems or branches
        const motherElem = Object.keys(this.rules.relation).find(k => this.rules.relation[k]?.[dmElem] === 'sinh');
        const otherStems = [canChi.year.gan, canChi.month.gan, canChi.hour.gan];

        const hasAnInStems = otherStems.some(s => this.rules.stemElement[s] === motherElem);
        const hasAnInBranches = allBranches.some(b => {
            const ratios = getBranchRatios(b);
            return ratios.some(r => r.stem && this.rules.stemElement[r.stem] === motherElem);
        });
        const isDuocSinh = hasAnInStems || hasAnInBranches;

        // 4. Check Được Trợ Giúp: Has Tỷ Kiếp (Same element) in other stems (Gốc rễ ở Địa chi đã tính ở Đắc Địa, tránh tính trùng lặp)
        const hasPeerInStems = otherStems.some(s => this.rules.stemElement[s] === dmElem);
        const isDuocTroGiup = hasPeerInStems;

        const getCombinationElement = (relStr) => {
            const cleanStr = relStr.split(' ')[0]; // Lấy phần 'Thân-Dậu'
            const branches = cleanStr.split('-');
            if (branches.some(b => ['Tý'].includes(b)) || 
                (branches.includes('Hợi') && branches.includes('Sửu')) ||
                (branches.includes('Thân') && branches.includes('Thìn'))) {
                return 'Thuy';
            }
            if (branches.some(b => ['Ngọ'].includes(b)) ||
                (branches.includes('Tỵ') && branches.includes('Mùi')) ||
                (branches.includes('Dần') && branches.includes('Tuất'))) {
                return 'Hoa';
            }
            if (branches.some(b => ['Dậu'].includes(b)) ||
                (branches.includes('Tỵ') && branches.includes('Sửu')) ||
                (branches.includes('Thân') && branches.includes('Tuất'))) {
                return 'Kim';
            }
            if (branches.some(b => ['Mão'].includes(b)) ||
                (branches.includes('Hợi') && branches.includes('Mùi')) ||
                (branches.includes('Dần') && branches.includes('Thìn'))) {
                return 'Moc';
            }
            return null;
        };

        // 5. Check Tam Hợp / Tam Hội (Không bị xung/hình/hại phá) và phải hóa thành ngũ hành đồng đảng (Trợ/Ấn)
        const hasSelfTamHopHoi = (analysis.relations.tamHop || []).concat(analysis.relations.banTamHop || []).some(relStr => {
            const isDisrupted = relStr.includes('phá');
            if (isDisrupted) return false; // Không hợp được khi bị xung/hình/hại
            
            const comboElem = getCombinationElement(relStr);
            return comboElem && (comboElem === dmElem || comboElem === motherElem);
        });

        // PHASE 3: Analysis
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

        // Tòng Cách Check với Vùng Đệm Chuyển Tiếp Mềm (0.65 - 0.70)
        let isTongCach = false;
        let strongestElem = "";
        let maxVal = 0;
        
        for (const [el, val] of Object.entries(normalizedScores)) {
            if (val > maxVal) { maxVal = val; strongestElem = el; }
        }

        const maxRatio = maxVal / totalScore;
        const isNoRootAnchor = !isDacDia && !isDuocSinh && !isDuocTroGiup;

        if (maxRatio > 0.70 || (maxRatio >= 0.65 && isNoRootAnchor)) {
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

        // Determine Graded Thân Degree based on Academic Matrix
        const count3 = (isDacDia ? 1 : 0) + (isDuocSinh ? 1 : 0) + (isDuocTroGiup ? 1 : 0);
        let thanDegree = "can_bang";

        if (isTongCach) {
            thanDegree = "tong_cach";
        } else if (isDucTuLenh) {
            if (count3 >= 3) thanDegree = "cuc_vuong";
            else if (count3 === 2) thanDegree = "rat_vuong";
            else if (count3 === 1) thanDegree = "vuong";
            else {
                // Đắc lệnh nhưng thất địa thất thế
                thanDegree = (dongDang >= khacTiet) ? "can_bang" : "nhuoc";
            }
        } else {
            if (count3 === 3) thanDegree = "rat_vuong";
            else if (count3 === 2) thanDegree = "vuong";
            else if (count3 === 1) {
                if (hasSelfTamHopHoi) thanDegree = "vuong";
                else {
                    thanDegree = (dongDang >= khacTiet) ? "can_bang" : "nhuoc";
                }
            } else {
                // Thất lệnh, thất địa, thất thế
                if (dongDang / totalScore < 0.10 || khacTiet > dongDang * 3) {
                    thanDegree = "suy_kiet";
                } else {
                    thanDegree = "rat_nhuoc";
                }
            }
        }

        analysis.academicFlags = {
            ducTuLenh: isDucTuLenh,
            tuLenhCan: tuLenhCan,
            dacDia: isDacDia,
            duocSinh: isDuocSinh,
            duocTroGiup: isDuocTroGiup,
            hasTamHopHoiSupport: hasSelfTamHopHoi
        };
        analysis.thanDegree = thanDegree;

        // Sync main analysis.than directly with thanDegree
        if (isTongCach) {
            analysis.than = "tong_cach";
        } else {
            if (["cuc_vuong", "rat_vuong", "vuong"].includes(thanDegree)) {
                analysis.than = "vuong";
            } else if (thanDegree === "can_bang") {
                analysis.than = "can_bang";
            } else {
                analysis.than = "nhuoc";
            }
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
            tuLenhCan,
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
