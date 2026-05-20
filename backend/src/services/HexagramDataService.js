const hexagramsData = require('../data/hexagrams.json');
const linesData = require('../data/lines.json');

const GAN_VI = {
    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
};

const ZHI_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tị',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

const toVietnamese = (ganZhiStr) => {
    if (!ganZhiStr) return '';
    let result = ganZhiStr;
    for (const [han, vi] of Object.entries(GAN_VI)) result = result.replace(han, vi + ' ');
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

class HexagramDataService {
    static toVietnamese(val) {
        return toVietnamese(val);
    }
    static getElement(val) {
        return getElement(val);
    }
    
    // Tái tạo lại primaryLines và secondaryLines từ một record DB
    static reconstructLines(record) {
        const { primaryHexagram, movingLines, lunarDateInfo } = record;
        
        // 1. Phục hồi binary_code của quẻ biến từ quẻ chính và mảng movingLines
        const primaryBinaryStr = primaryHexagram.binary_code.split('').reverse().join('');
        let secondaryBinaryArr = primaryBinaryStr.split('');
        
        // movingLines lưu dạng 1-indexed. Ví dụ: [2, 6] nghĩa là hào 2 và 6 động.
        if (movingLines && movingLines.length > 0) {
            movingLines.forEach(lIdx => {
                if (lIdx >= 1 && lIdx <= 6) {
                    const i = lIdx - 1;
                    secondaryBinaryArr[i] = secondaryBinaryArr[i] === '1' ? '0' : '1';
                }
            });
        }
        const secondaryBinaryStr = secondaryBinaryArr.join('');
        const lookupSecondaryStr = secondaryBinaryArr.reverse().join('');
        
        let secondaryHexagram = record.transformedHexagram || hexagramsData.find(h => h.binary_code === lookupSecondaryStr) || { name: 'Quẻ ' + lookupSecondaryStr, palace: 'Chưa Rõ', palace_element: 'Chưa Rõ', binary_code: lookupSecondaryStr };

        // 2. Lọc dữ liệu hào tĩnh từ JSON
        let primaryHexLines = [];
        let secondaryHexLines = [];
        
        const pId = primaryHexagram.id || hexagramsData.find(h => h.binary_code === primaryHexagram.binary_code)?.id;
        const sId = secondaryHexagram.id || hexagramsData.find(h => h.binary_code === lookupSecondaryStr)?.id;

        if (pId) {
            primaryHexLines = linesData.filter(l => l.hexagram_id === pId).sort((a, b) => a.line_index - b.line_index);
        }
        if (sId) {
            secondaryHexLines = linesData.filter(l => l.hexagram_id === sId).sort((a, b) => a.line_index - b.line_index);
        }

        // 3. Chuẩn bị ngày tháng
        const dayCanChi = lunarDateInfo.dayCanChi;
        const monthCanChi = lunarDateInfo.monthCanChi;
        const dayGan = dayCanChi ? dayCanChi.split(' ')[0] : 'Giáp';
        
        const getPureBranch = (canChiStr) => {
            if (!canChiStr) return '';
            const parts = canChiStr.trim().split(' ');
            return parts.length >= 2 ? parts[parts.length - 1] : canChiStr;
        };
        const pureDayBranch = getPureBranch(dayCanChi);
        const pureMonthBranch = getPureBranch(monthCanChi);
        const tkStr = lunarDateInfo.tuankhong || '';

        // 4. Lấy Quái Thần
        const getQtBranch = (hexLines, binStr) => {
            if (!hexLines.length) return "";
            const hostLine = hexLines.find(l => l.is_host === 1);
            if (!hostLine) return "";
            const isYang = binStr[hostLine.line_index - 1] === '1';
            const baseIdx = isYang ? 0 : 6; // 0: Tý, 6: Ngọ
            const qtIdx = (baseIdx + hostLine.line_index - 1) % 12;
            return ZHI_ARRAY[qtIdx];
        };

        const primaryQtBranch = getQtBranch(primaryHexLines, primaryBinaryStr);
        const secondaryQtBranch = secondaryHexLines.length ? getQtBranch(secondaryHexLines, secondaryBinaryStr) : "";

        // 5. Xử lý từng hào
        const lucThuArray = lucThuMap[dayGan] || lucThuMap['Giáp'];

        const processLine = (line, idx, binaryStr, isSecondary, qtBranch) => {
            if (!line.stem_branch) return line; 
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

            const isMoving = movingLines ? movingLines.includes(idx + 1) : false;

            return {
                ...line,
                stem_branch: fullCanChi,
                element: elem,
                relative: rel,
                luc_thu: lucThuArray[idx],
                tk: isTK,
                moving: isMoving,
                vuong_suy: getVuongSuy(elem, pureMonthBranch),
                ts_ngay: getTruongSinh(elem, pureDayBranch),
                ts_thang: getTruongSinh(elem, pureMonthBranch),
                qt: branch === qtBranch ? "Quái Thân" : ""
            };
        };

        const procPrimary = primaryHexLines.map((l, i) => processLine(l, i, primaryBinaryStr, false, primaryQtBranch));
        const procSecondary = secondaryHexLines.map((l, i) => processLine(l, i, secondaryBinaryStr, true, secondaryQtBranch));

        return {
            primaryHexagram: { ...primaryHexagram, quai_than: primaryQtBranch },
            transformedHexagram: { ...secondaryHexagram, quai_than: secondaryQtBranch },
            primaryLines: procPrimary,
            secondaryLines: procSecondary
        };
    }
}

module.exports = HexagramDataService;
