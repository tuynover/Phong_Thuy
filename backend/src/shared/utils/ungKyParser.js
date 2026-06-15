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

module.exports = {
    parseUngKyBlock,
    findNextDayByBranch,
    getUpcomingLunarMonthDate,
    getUpcomingLunarDayMonthDate
};
