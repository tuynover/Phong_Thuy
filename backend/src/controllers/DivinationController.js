const hexagramsData = require('../data/hexagrams.json');
const linesData = require('../data/lines.json');
const { Lunar } = require('lunar-javascript');

// Mapping Thiên Can từ Hán sang Việt
const GAN_VI = {
    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
};

// Mapping Địa Chi từ Hán sang Việt
const ZHI_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tị',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const toVietnamese = (ganZhiStr) => {
    if (!ganZhiStr) return '';
    let result = ganZhiStr;
    // Thay Thiên Can trước
    for (const [han, vi] of Object.entries(GAN_VI)) result = result.replace(han, vi + ' ');
    // Thay Địa Chi sau (xóa dấu cách thừa ở cuối nếu chỉ có 1 ký tự)
    for (const [han, vi] of Object.entries(ZHI_VI)) result = result.replace(han, vi);
    return result.trim();
};

const getElement = (branch) => {
    if (["Tý", "Hợi"].includes(branch)) return "Thủy";
    if (["Dần", "Mão"].includes(branch)) return "Mộc";
    if (["Tị", "Ngọ"].includes(branch)) return "Hỏa";
    if (["Thân", "Dậu"].includes(branch)) return "Kim";
    if (["Thìn", "Tuất", "Sửu", "Mùi"].includes(branch)) return "Thổ";
    return "Unknown";
};

const getRelative = (palaceElement, lineElement) => {
    if (palaceElement === lineElement) return "Huynh Đệ";
    const sinh = { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" };
    const khac = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };
    
    if (sinh[palaceElement] === lineElement) return "Tử Tôn";
    if (sinh[lineElement] === palaceElement) return "Phụ Mẫu";
    if (khac[palaceElement] === lineElement) return "Thê Tài";
    if (khac[lineElement] === palaceElement) return "Quan Quỷ";
    return "Unknown";
};

const stemMapping = {
    "111": { inner: "Giáp", outer: "Nhâm" },
    "000": { inner: "Ất", outer: "Quý" },
    "010": { inner: "Mậu", outer: "Mậu" },
    "101": { inner: "Kỷ", outer: "Kỷ" },
    "100": { inner: "Canh", outer: "Canh" },
    "011": { inner: "Tân", outer: "Tân" },
    "001": { inner: "Bính", outer: "Bính" },
    "110": { inner: "Đinh", outer: "Đinh" }
};

class DivinationController {
    static async calculate(req, res) {
        try {
            const lines = req.body.lines; 
            if (!lines || lines.length !== 6) {
                return res.status(400).json({ error: 'Require exactly 6 lines.' });
            }

            const primaryBinaryStr = lines.map(l => l.type).join('');
            const secondaryBinaryStr = lines.map(l => l.moving ? (1 - l.type) : l.type).join('');

            let primaryHexagram = hexagramsData.find(h => h.binary_code === primaryBinaryStr) || { name: 'Quẻ ' + primaryBinaryStr, palace: 'Chưa Rõ', palace_element: 'Chưa Rõ', binary_code: primaryBinaryStr };
            let secondaryHexagram = hexagramsData.find(h => h.binary_code === secondaryBinaryStr) || { name: 'Quẻ ' + secondaryBinaryStr, palace: 'Chưa Rõ', palace_element: 'Chưa Rõ', binary_code: secondaryBinaryStr };

            let primaryHexLines = [];
            let secondaryHexLines = [];

            if (primaryHexagram.id) {
                primaryHexLines = linesData.filter(l => l.hexagram_id === primaryHexagram.id).sort((a, b) => a.line_index - b.line_index);
            }
            if (secondaryHexagram.id) {
                secondaryHexLines = linesData.filter(l => l.hexagram_id === secondaryHexagram.id).sort((a, b) => a.line_index - b.line_index);
            }

            // Date setup using lunar-javascript
            // We'll use current date. If we want precision, this could come from FE.
            const now = new Date();
            const lunar = Lunar.fromDate(now);
            const hourCanChi = toVietnamese(lunar.getEightChar().getTime());
            const dayCanChi = toVietnamese(lunar.getDayInGanZhiExact());
            const monthCanChi = toVietnamese(lunar.getMonthInGanZhiExact());
            const yearCanChi = toVietnamese(lunar.getYearInGanZhiExact());
            
            const dayGan = toVietnamese(lunar.getDayGan());
            const monthBranch = toVietnamese(lunar.getMonthZhi());
            const dayBranch = toVietnamese(lunar.getDayZhi());
            
            const tkStrRaw = lunar.getDayXunKong(); // e.g. "戌亥"
            const tkStr = toVietnamese(tkStrRaw);

            const lucThuMap = {
                'Giáp': ['Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ', 'Huyền Vũ'],
                'Ất':   ['Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ', 'Huyền Vũ'],
                'Bính': ['Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ', 'Huyền Vũ', 'Thanh Long'],
                'Đinh': ['Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ', 'Huyền Vũ', 'Thanh Long'],
                'Mậu':  ['Câu Trần', 'Đằng Xà', 'Bạch Hổ', 'Huyền Vũ', 'Thanh Long', 'Chu Tước'],
                'Kỷ':   ['Đằng Xà', 'Bạch Hổ', 'Huyền Vũ', 'Thanh Long', 'Chu Tước', 'Câu Trần'],
                'Canh': ['Bạch Hổ', 'Huyền Vũ', 'Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà'],
                'Tân':  ['Bạch Hổ', 'Huyền Vũ', 'Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà'],
                'Nhâm': ['Huyền Vũ', 'Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ'],
                'Quý':  ['Huyền Vũ', 'Thanh Long', 'Chu Tước', 'Câu Trần', 'Đằng Xà', 'Bạch Hổ']
            };
            const lucThuArray = lucThuMap[dayGan] || lucThuMap['Giáp'];

            // Function to generate full Can Chi for a line
            const processLine = (line, idx, binaryStr, isSecondary) => {
                if (!line.stem_branch) return line; // Fallback
                const branch = line.stem_branch;
                const innerTri = binaryStr.substring(0,3);
                const outerTri = binaryStr.substring(3,6);
                
                let stem = "";
                if (idx < 3) {
                    stem = stemMapping[innerTri]?.inner || "";
                } else {
                    stem = stemMapping[outerTri]?.outer || "";
                }
                
                const fullCanChi = `${stem} ${branch}`;
                const elem = line.element || getElement(branch);
                const isTK = tkStr.includes(branch) ? "K" : "";
                
                let rel = line.relative;
                if (isSecondary) {
                    rel = getRelative(primaryHexagram.palace_element, elem);
                }

                return {
                    ...line,
                    stem_branch: fullCanChi,
                    element: elem,
                    relative: rel,
                    luc_thu: lucThuArray[idx],
                    tk: isTK,
                    moving: lines[idx].moving
                };
            };

            const procPrimary = primaryHexLines.map((l, i) => processLine(l, i, primaryBinaryStr, false));
            const procSecondary = secondaryHexLines.map((l, i) => processLine(l, i, secondaryBinaryStr, true));

            return res.json({
                primary: primaryHexagram,
                secondary: secondaryHexagram,
                primaryLines: procPrimary,
                secondaryLines: procSecondary,
                dateInfo: {
                    time: now.toLocaleTimeString('vi-VN'),
                    solarDate: now.toLocaleDateString('vi-VN'),
                    lunarDateStr: `ngày ${lunar.getDay()} tháng ${lunar.getMonth()} năm ${lunar.getYear()} Âm lịch`,
                    hourCanChi,
                    dayCanChi,
                    monthCanChi,
                    yearCanChi,
                    tietKhi: lunar.getJieQi(),
                    nhatThan: `${dayBranch}-${getElement(dayBranch)}`,
                    nguyetLenh: `${monthBranch}-${getElement(monthBranch)}`,
                    tuankhong: tkStr
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = DivinationController;
