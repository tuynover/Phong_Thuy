const hexagramsData = require('../data/hexagrams.json');
const linesData = require('../data/lines.json');
const { Lunar } = require('lunar-javascript');
const HexagramRecord = require('../models/HexagramRecord');

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

const ZHI_ARRAY = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tị", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const TRUONG_SINH_STATES = ["Trường Sinh", "Mộc Dục", "Quan Đới", "Lâm Quan", "Đế Vượng", "Suy", "Bệnh", "Tử", "Mộ", "Tuyệt", "Thai", "Dưỡng"];

const getVuongSuy = (element, monthBranch) => {
    const monthElement = getElement(monthBranch);
    if (element === monthElement) return "Vượng";
    const sinh = { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" };
    const khac = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };
    
    if (sinh[monthElement] === element) return "Tướng";
    if (sinh[element] === monthElement) return "Hưu";
    if (khac[monthElement] === element) return "Tử";
    if (khac[element] === monthElement) return "Tù";
    return "";
};

const getTruongSinh = (element, branch) => {
    let startIdx = 0;
    if (element === "Mộc") startIdx = 11; // Hợi
    else if (element === "Hỏa") startIdx = 2; // Dần
    else if (element === "Kim") startIdx = 5; // Tị
    else if (element === "Thủy" || element === "Thổ") startIdx = 8; // Thân
    
    const branchIdx = ZHI_ARRAY.indexOf(branch);
    if (branchIdx === -1) return "";
    const offset = (branchIdx - startIdx + 12) % 12;
    return TRUONG_SINH_STATES[offset];
};

class DivinationController {
    static async calculate(req, res) {
        try {
            const lines = req.body.lines; 
            const userId = req.body.userId || 'guest';
            const question = req.body.question || 'xem sức khỏe và công việc sắp tới có thuận lợi hay không';

            if (!lines || lines.length !== 6) {
                return res.status(400).json({ error: 'Require exactly 6 lines.' });
            }

            const primaryBinaryStr = lines.map(l => l.type).join('');
            const secondaryBinaryStr = lines.map(l => l.moving ? (1 - l.type) : l.type).join('');

            const lookupPrimaryStr = primaryBinaryStr.split('').reverse().join('');
            const lookupSecondaryStr = secondaryBinaryStr.split('').reverse().join('');

            let primaryHexagram = hexagramsData.find(h => h.binary_code === lookupPrimaryStr) || { name: 'Quẻ ' + lookupPrimaryStr, palace: 'Chưa Rõ', palace_element: 'Chưa Rõ', binary_code: lookupPrimaryStr };
            let secondaryHexagram = hexagramsData.find(h => h.binary_code === lookupSecondaryStr) || { name: 'Quẻ ' + lookupSecondaryStr, palace: 'Chưa Rõ', palace_element: 'Chưa Rõ', binary_code: lookupSecondaryStr };

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

            const getPureBranch = (canChiStr) => {
                const parts = canChiStr.trim().split(' ');
                return parts.length >= 2 ? parts[parts.length - 1] : canChiStr;
            };
            const pureDayBranch = getPureBranch(dayBranch);
            const pureMonthBranch = getPureBranch(monthBranch);

            const getQtBranch = (hexLines, binStr) => {
                const hostLine = hexLines.find(l => l.is_host === 1);
                if (!hostLine) return "";
                const isYang = binStr[hostLine.line_index - 1] === '1';
                const baseIdx = isYang ? 0 : 6; // 0: Tý, 6: Ngọ
                const qtIdx = (baseIdx + hostLine.line_index - 1) % 12;
                return ZHI_ARRAY[qtIdx];
            };

            const primaryQtBranch = getQtBranch(primaryHexLines, primaryBinaryStr);
            const secondaryQtBranch = secondaryHexLines.length ? getQtBranch(secondaryHexLines, secondaryBinaryStr) : "";

            primaryHexagram.quai_than = primaryQtBranch;
            secondaryHexagram.quai_than = secondaryQtBranch;

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
            const processLine = (line, idx, binaryStr, isSecondary, qtBranch) => {
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
                    moving: lines[idx].moving,
                    vuong_suy: getVuongSuy(elem, pureMonthBranch),
                    ts_ngay: getTruongSinh(elem, pureDayBranch),
                    ts_thang: getTruongSinh(elem, pureMonthBranch),
                    qt: branch === qtBranch ? "Quái Thân" : ""
                };
            };

            const procPrimary = primaryHexLines.map((l, i) => processLine(l, i, primaryBinaryStr, false, primaryQtBranch));
            const procSecondary = secondaryHexLines.map((l, i) => processLine(l, i, secondaryBinaryStr, true, secondaryQtBranch));

            const resultPayload = {
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
            };

            const movingLinesArray = lines.map((l, i) => l.moving ? i + 1 : -1).filter(i => i !== -1);
            
            // Check for duplicate record
            const existingRecord = await HexagramRecord.findOne({
                userId,
                question,
                'primaryHexagram.binary_code': resultPayload.primary.binary_code,
                movingLines: movingLinesArray
            });

            if (existingRecord) {
                return res.json({ ...resultPayload, recordId: existingRecord._id, interpretation: existingRecord.interpretation });
            }

            // Save to database (WITHOUT primaryLines and secondaryLines)
            const record = new HexagramRecord({
                userId,
                question,
                primaryHexagram: resultPayload.primary,
                transformedHexagram: resultPayload.secondary,
                movingLines: movingLinesArray,
                lunarDateInfo: resultPayload.dateInfo
            });
            await record.save();

            return res.json({ ...resultPayload, recordId: record._id });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }
}

module.exports = DivinationController;
