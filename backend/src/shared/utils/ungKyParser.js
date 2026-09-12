const { Lunar, Solar } = require('lunar-javascript');

const ZHI_VI_MAP = {
    'tý': '子', 'sửu': '丑', 'dần': '寅', 'mão': '卯', 'thìn': '辰',
    'tị': '巳', 'tỵ': '巳', 'ngọ': '午', 'mùi': '未', 'thân': '申',
    'dậu': '酉', 'tuất': '戌', 'hợi': '亥'
};

const ZHI_TO_LUNAR_MONTH = {
    'dần': 1, 'mão': 2, 'thìn': 3, 'tị': 4, 'tỵ': 4, 'ngọ': 5,
    'mùi': 6, 'thân': 7, 'dậu': 8, 'tuất': 9, 'hợi': 10, 'tý': 11, 'sửu': 12
};

const ZHI_VI = {
    '子': 'Tý', '丑': 'Sửu', '寅': 'Dần', '卯': 'Mão', '辰': 'Thìn', '巳': 'Tị',
    '午': 'Ngọ', '未': 'Mùi', '申': 'Thân', '酉': 'Dậu', '戌': 'Tuất', '亥': 'Hợi'
};

/**
 * Finds the first upcoming Solar date starting from referenceDate + 1
 * that matches the target lunar Day branch (e.g. "Dần")
 */
function findNextDayByBranch(startDate, targetBranch) {
    const key = targetBranch.toLowerCase().trim();
    const targetZhi = ZHI_VI_MAP[key];
    if (!targetZhi) return null;

    let currentSolar = Solar.fromDate(startDate);
    for (let i = 1; i <= 60; i++) { 
        const nextSolar = currentSolar.next(i);
        const nextLunar = nextSolar.getLunar();
        const nextZhi = nextLunar.getDayZhi();
        if (nextZhi === targetZhi) {
            return new Date(nextSolar.getYear(), nextSolar.getMonth() - 1, nextSolar.getDay());
        }
    }
    return null;
}

/**
 * Finds the first upcoming Solar date that starts the target Lunar month branch (e.g. "Thân")
 * or numeric Lunar Month.
 */
function getUpcomingLunarMonthDate(referenceLunar, targetMonthNum) {
    const castYear = referenceLunar.getYear();
    const castMonth = referenceLunar.getMonth();
    
    let targetYear = castYear;
    if (targetMonthNum < castMonth) {
        targetYear = castYear + 1;
    }
    
    const targetLunar = Lunar.fromYmd(targetYear, targetMonthNum, 1);
    const targetSolar = targetLunar.getSolar();
    return new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
}

/**
 * Finds the first upcoming Solar date for a specific lunar Day and Month (e.g. Day 15 Month 8)
 */
function getUpcomingLunarDayMonthDate(referenceLunar, targetMonth, targetDay) {
    const castYear = referenceLunar.getYear();
    const castMonth = referenceLunar.getMonth();
    const castDay = referenceLunar.getDay();
    
    let targetYear = castYear;
    if (targetMonth < castMonth || (targetMonth === castMonth && targetDay < castDay)) {
        targetYear = castYear + 1;
    }
    
    let targetLunar;
    try {
        targetLunar = Lunar.fromYmd(targetYear, targetMonth, targetDay);
    } catch (err) {
        targetLunar = Lunar.fromYmd(targetYear, targetMonth, 1);
    }
    
    const targetSolar = targetLunar.getSolar();
    return new Date(targetSolar.getYear(), targetSolar.getMonth() - 1, targetSolar.getDay());
}

function parseUngKyBlock(text, castDate = new Date()) {
    const startTag = "---UNG_KY_START---";
    const endTag = "---UNG_KY_END---";
    
    const startIdx = text.indexOf(startTag);
    const endIdx = text.indexOf(endTag);
    
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
        return { cleanedText: text, ungKyList: [] };
    }
    
    const block = text.substring(startIdx + startTag.length, endIdx).trim();
    const cleanedText = (text.substring(0, startIdx) + text.substring(endIdx + endTag.length)).trim();
    
    const lines = block.split('\n');
    const ungKyList = [];
    
    const solar = Solar.fromDate(castDate);
    const referenceLunar = solar.getLunar();
    
    for (let line of lines) {
        line = line.trim().replace(/^-\s*/, '').toLowerCase();
        if (!line) continue;
        
        let match;
        if (line.startsWith("ngày ") && line.endsWith(" âm lịch") && !/\d+/.test(line)) {
            const branch = line.replace("ngày ", "").replace(" âm lịch", "").trim();
            const solarDate = findNextDayByBranch(castDate, branch);
            if (solarDate) {
                const targetLunar = Solar.fromDate(solarDate).getLunar();
                ungKyList.push({
                    lunarDay: targetLunar.getDay(),
                    lunarMonth: targetLunar.getMonth(),
                    lunarYear: targetLunar.getYear(),
                    isMonthOnly: false,
                    originalText: `Ngày ${branch.charAt(0).toUpperCase() + branch.slice(1)} âm lịch`,
                    solarDate,
                    status: 'pending'
                });
            }
        }
        else if (line.startsWith("tháng ") && line.endsWith(" âm lịch") && !/\d+/.test(line)) {
            const branch = line.replace("tháng ", "").replace(" âm lịch", "").trim();
            const targetMonthNum = ZHI_TO_LUNAR_MONTH[branch];
            if (targetMonthNum) {
                const solarDate = getUpcomingLunarMonthDate(referenceLunar, targetMonthNum);
                const targetLunar = Solar.fromDate(solarDate).getLunar();
                ungKyList.push({
                    lunarDay: 1,
                    lunarMonth: targetMonthNum,
                    lunarYear: targetLunar.getYear(),
                    isMonthOnly: true,
                    originalText: `Tháng ${branch.charAt(0).toUpperCase() + branch.slice(1)} âm lịch`,
                    solarDate,
                    status: 'pending'
                });
            }
        }
        else if ((match = line.match(/ngày\s+(\d+)\s+tháng\s+(\d+)/))) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]);
            if (day >= 1 && day <= 30 && month >= 1 && month <= 12) {
                const solarDate = getUpcomingLunarDayMonthDate(referenceLunar, month, day);
                const targetLunar = Solar.fromDate(solarDate).getLunar();
                ungKyList.push({
                    lunarDay: day,
                    lunarMonth: month,
                    lunarYear: targetLunar.getYear(),
                    isMonthOnly: false,
                    originalText: `Ngày ${day} tháng ${month} âm lịch`,
                    solarDate,
                    status: 'pending'
                });
            }
        }
        else if ((match = line.match(/tháng\s+(\d+)/))) {
            const month = parseInt(match[1]);
            if (month >= 1 && month <= 12) {
                const solarDate = getUpcomingLunarMonthDate(referenceLunar, month);
                const targetLunar = Solar.fromDate(solarDate).getLunar();
                ungKyList.push({
                    lunarDay: 1,
                    lunarMonth: month,
                    lunarYear: targetLunar.getYear(),
                    isMonthOnly: true,
                    originalText: `Tháng ${month} âm lịch`,
                    solarDate,
                    status: 'pending'
                });
            }
        }
    }
    
    return { cleanedText, ungKyList };
}

const GAN_VI = {
    '甲': 'Giáp', '乙': 'Ất', '丙': 'Bính', '丁': 'Đinh', '戊': 'Mậu',
    '己': 'Kỷ', '庚': 'Canh', '辛': 'Tân', '壬': 'Nhâm', '癸': 'Quý'
};

function toViGanZhi(gz) {
    if (!gz || gz.length < 2) return gz;
    return (GAN_VI[gz[0]] || gz[0]) + ' ' + (ZHI_VI[gz[1]] || gz[1]);
}

function formatDateDDMMYYYY(date) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
}

function getDayOfWeekVi(date) {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[date.getDay()];
}

function parseDateFlexible(val) {
    if (!val) return new Date();
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === 'string') {
        const dmyMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (dmyMatch) {
            const day = parseInt(dmyMatch[1], 10);
            const month = parseInt(dmyMatch[2], 10) - 1;
            const year = parseInt(dmyMatch[3], 10);
            return new Date(year, month, day);
        }
        const d = new Date(val);
        if (!isNaN(d.getTime())) return d;
    }
    if (typeof val === 'number') return new Date(val);
    return new Date();
}

/**
 * Tạo Bảng Tra Cứu Lịch Pháp Gần Nhất Chính Xác (Source of Truth) cho Kinh Dịch
 * Giúp AI tra cứu và quy đổi mốc Dương lịch gần nhất theo Phương án B mà không bị nhầm lẫn hay bịa ngày xa xôi.
 */
function generateIChingCalendarGroundTruth(castDate = new Date()) {
    const baseDate = parseDateFlexible(castDate);
    const curSolar = Solar.fromDate(baseDate);
    const curLunar = curSolar.getLunar();

    const curDayGz = toViGanZhi(curLunar.getDayInGanZhi());
    const curMonthGz = toViGanZhi(curLunar.getMonthInGanZhi());
    const curYearGz = toViGanZhi(curLunar.getYearInGanZhi());

    let text = '=== [BẢNG TRA CỨU MỐC DƯƠNG LỊCH GẦN NHẤT CHÍNH XÁC (SOURCE OF TRUTH)] ===\n';
    text += `* TỌA ĐỘ THỜI ĐIỂM GIEO QUẺ: Ngày ${formatDateDDMMYYYY(baseDate)} Dương lịch (tức ngày ${curLunar.getDay()}/${Math.abs(curLunar.getMonth())}/${curLunar.getYear()} Âm lịch - Ngày ${curDayGz}, Tháng ${curMonthGz}, Năm ${curYearGz}).\n\n`;

    text += '--- BẢNG 1: MỐC CÁC NGÀY CAN CHI GẦN NHẤT TRONG VÒNG 1 - 14 NGÀY TỚI KỂ TỪ HÔM NAY (BẮT BUỘC ƯU TIÊN SỬ DỤNG CHO HÀNG 1, 2, 3 CỦA BẢNG MA TRẬN) ---\n';
    text += '(Sử dụng cho Nhóm 2 - Cấp độ 2: Các ngày vàng gần nhất để nộp hồ sơ, gửi CV, hẹn phỏng vấn, chủ động hành động; và Nhóm 3: Việc ngắn hạn, đòi nợ, ký hợp đồng, pháp lý)\n';

    const branchOccurrences = {};
    for (const zhiChar in ZHI_VI) {
        branchOccurrences[ZHI_VI[zhiChar]] = [];
    }

    for (let i = 0; i <= 35; i++) {
        const nextSolar = curSolar.next(i);
        const nextLunar = nextSolar.getLunar();
        const zhiVi = ZHI_VI[nextLunar.getDayZhi()];
        const dateObj = new Date(nextSolar.getYear(), nextSolar.getMonth() - 1, nextSolar.getDay());
        if (branchOccurrences[zhiVi] && branchOccurrences[zhiVi].length < 2) {
            const dayGz = toViGanZhi(nextLunar.getDayInGanZhi());
            const dow = getDayOfWeekVi(dateObj);
            const isToday = (i === 0) ? ' (HÔM NAY - NGÀY GIEO)' : '';
            branchOccurrences[zhiVi].push(
                `${dow}, ${formatDateDDMMYYYY(dateObj)} DL (Ngày ${dayGz} - ${nextLunar.getDay()}/${Math.abs(nextLunar.getMonth())} ÂL)${isToday}`
            );
        }
    }

    const branchOrder = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tị', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    for (const zhi of branchOrder) {
        const occs = branchOccurrences[zhi] || [];
        text += `* Ngày ${zhi} gần nhất:\n`;
        occs.forEach((oc, idx) => {
            text += `  + Lần ${idx + 1}: ${oc}\n`;
        });
    }

    text += '\n--- BẢNG 2: QUY ĐỔI KHOẢNG NGÀY DƯƠNG LỊCH CỦA CÁC THÁNG ÂM LỊCH TỚI (DÙNG ĐOÁN THEO THÁNG MỤC TIÊU / DÀI HẠN) ---\n';
    text += '(Sử dụng cho Nhóm 1: Mang thai, sinh con, mua nhà, định cư; và Nhóm 2 - Cấp độ 1: Tháng mục tiêu nhận việc/nhậm chức)\n';

    const monthStarts = [];
    for (let i = -30; i <= 210; i++) {
        const s = curSolar.next(i);
        const l = s.getLunar();
        if (l.getDay() === 1) {
            monthStarts.push({
                lunarMonth: l.getMonth(),
                lunarYear: l.getYear(),
                monthGz: toViGanZhi(l.getMonthInGanZhi()),
                solarDate: new Date(s.getYear(), s.getMonth() - 1, s.getDay())
            });
        }
    }

    let curMonthIdx = -1;
    for (let idx = 0; idx < monthStarts.length; idx++) {
        if (monthStarts[idx].lunarYear === curLunar.getYear() && monthStarts[idx].lunarMonth === curLunar.getMonth()) {
            curMonthIdx = idx;
            break;
        }
    }

    if (curMonthIdx !== -1) {
        for (let o = 0; o <= 5; o++) {
            const mIdx = curMonthIdx + o;
            if (mIdx < monthStarts.length) {
                const startInfo = monthStarts[mIdx];
                const nextInfo = monthStarts[mIdx + 1];
                let endSolarDate;
                if (nextInfo) {
                    endSolarDate = new Date(nextInfo.solarDate.getTime() - 24 * 60 * 60 * 1000);
                } else {
                    endSolarDate = new Date(startInfo.solarDate.getTime() + 29 * 24 * 60 * 60 * 1000);
                }
                const isCurrent = (o === 0) ? ' [THÁNG HIỆN TẠI ĐANG GIEO]' : '';
                const mNum = Math.abs(startInfo.lunarMonth);
                const leapText = startInfo.lunarMonth < 0 ? ' (Nhuận)' : '';
                text += `- Tháng ${mNum}${leapText} ÂL (${startInfo.monthGz})${isCurrent}: Từ ngày ${formatDateDDMMYYYY(startInfo.solarDate)} đến ngày ${formatDateDDMMYYYY(endSolarDate)} Dương lịch.\n`;
            }
        }
    }

    return text;
}

module.exports = {
    parseUngKyBlock,
    findNextDayByBranch,
    getUpcomingLunarMonthDate,
    getUpcomingLunarDayMonthDate,
    generateIChingCalendarGroundTruth
};
