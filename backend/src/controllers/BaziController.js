const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziRecord = require('../models/BaziRecord');
const MemoryCacheService = require('../services/MemoryCacheService');

const formatCanChiSpacing = (str) => {
    if (!str) return str;
    return str.replace(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?=[A-Z])/g, '$1 ');
};

const hasNewSchema = (baziData) => {
    if (!baziData) return false;
    if (baziData.daYun && baziData.daYun.length > 0) {
        const firstYun = baziData.daYun[0];
        if (!firstYun.tangCan || firstYun.tangCan.length === 0) return false;
        if (firstYun.liuNian && firstYun.liuNian.length > 0) {
            const firstYear = firstYun.liuNian[0];
            if (!firstYear.annualShenSha || !firstYear.nienVanTinh) return false;
        }
    }
    return true;
};

const getYearFromDateStr = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
        return parseInt(dateStr.split('/')[2]);
    } else if (dateStr.includes('-')) {
        return parseInt(dateStr.split('-')[0]);
    }
    return null;
};

const GUA_MAP = {
    1: { cung: 'Khảm', element: 'Thủy', group: 'Đông tứ mệnh' },
    2: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
    3: { cung: 'Chấn', element: 'Mộc', group: 'Đông tứ mệnh' },
    4: { cung: 'Tốn', element: 'Mộc', group: 'Đông tứ mệnh' },
    5: { 
        male: { cung: 'Khôn', element: 'Thổ', group: 'Tây tứ mệnh' },
        female: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' }
    },
    6: { cung: 'Càn', element: 'Kim', group: 'Tây tứ mệnh' },
    7: { cung: 'Đoài', element: 'Kim', group: 'Tây tứ mệnh' },
    8: { cung: 'Cấn', element: 'Thổ', group: 'Tây tứ mệnh' },
    9: { cung: 'Ly', element: 'Hỏa', group: 'Đông tứ mệnh' }
};

const calculateMenhQuai = (solarYear, gender) => {
    let tempYear = parseInt(solarYear);
    if (isNaN(tempYear)) return null;
    
    let sum = tempYear;
    while (sum >= 10) {
        sum = String(sum).split('').reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    
    let guaNum;
    const genderVal = parseInt(gender) === 0 ? 0 : 1;
    if (genderVal === 1) { // Male
        guaNum = 11 - sum;
        if (guaNum <= 0) guaNum += 9;
    } else { // Female
        guaNum = 4 + sum;
        while (guaNum > 9) guaNum -= 9;
    }
    
    const gua = GUA_MAP[guaNum];
    if (guaNum === 5) {
        return genderVal === 1 ? gua.male : gua.female;
    }
    return gua;
};

const InputValidator = require('../services/InputValidator');

class BaziController {
    static async analyze(req, res) {
        try {
            const valResult = InputValidator.validateBaziInput(req.body);
            if (!valResult.isValid) {
                return res.status(400).json({ error: valResult.error });
            }

            const { calendarMode = 'solar', name, gender } = valResult.sanitized;
            const { userId, dayBoundaryMode } = req.body;

            const uid = userId || 'guest';
            const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];

            let date, time, manualData, birthSolarYear, isLeap, rawDate;

            if (calendarMode === 'manual') {
                manualData = valResult.sanitized.manualData;
                birthSolarYear = valResult.sanitized.birthSolarYear;
            } else {
                date = valResult.sanitized.date;
                rawDate = valResult.sanitized.rawDate;
                time = valResult.sanitized.time;
                isLeap = valResult.sanitized.isLeap;

                if (calendarMode === 'lunar') {
                    // Quy đổi ngày âm lịch sang dương lịch
                    const { Lunar } = require('lunar-javascript');
                    const parts = date.split('/');
                    const dNum = parseInt(parts[0], 10);
                    const mNum = parseInt(parts[1], 10);
                    const yNum = parseInt(parts[2], 10);
                    
                    const lunarObj = Lunar.fromYmd(yNum, isLeap ? -mNum : mNum, dNum);
                    const solarObj = lunarObj.getSolar();
                    
                    // Ghi đè date bằng ngày dương lịch quy đổi để thuật toán và DB hoạt động
                    date = `${String(solarObj.getDay()).padStart(2, '0')}/${String(solarObj.getMonth()).padStart(2, '0')}/${solarObj.getYear()}`;
                }
            }

            // 1. Check by Idempotency Key header if provided
            let idempotencyKeyVal = idempotencyKey;
            if (!idempotencyKeyVal) {
                if (calendarMode === 'manual') {
                    const mStr = `${manualData.yearGan}${manualData.yearZhi}_${manualData.monthGan}${manualData.monthZhi}_${manualData.dayGan}${manualData.dayZhi}_${manualData.hourGan}${manualData.hourZhi}`;
                    idempotencyKeyVal = `${uid}:manual:${mStr}:${gender}:${birthSolarYear}`;
                } else {
                    idempotencyKeyVal = `${uid}:${date}:${time}:${gender}:${dayBoundaryMode || 'midnight'}`;
                }
            }

            if (idempotencyKeyVal) {
                const dupRecord = await BaziRecord.findOne({ idempotencyKey: idempotencyKeyVal, isDeleted: { $ne: true } });
                if (dupRecord) {
                    const baziData = { ...dupRecord.baziData };
                    if (baziData.lunarDateStr) baziData.lunarDateStr = formatCanChiSpacing(baziData.lunarDateStr);
                    if (baziData.lunarYear) baziData.lunarYear = formatCanChiSpacing(baziData.lunarYear);
                    if (baziData.tietKhiTimeline) baziData.tietKhiTimeline = formatCanChiSpacing(baziData.tietKhiTimeline);
                    return res.json({ 
                        ...baziData, 
                        gender: dupRecord.inputInfo.gender,
                        recordId: dupRecord._id, 
                        name: dupRecord.inputInfo.name,
                        inputInfo: dupRecord.inputInfo,
                        aiInterpretation: dupRecord.aiInterpretation 
                    });
                }
            }

            // 2. Check for duplicate record by data parameters (Semantic Idempotency)
            let existingRecord;
            if (calendarMode === 'manual') {
                existingRecord = await BaziRecord.findOne({
                    userId: uid,
                    'inputInfo.calendarMode': 'manual',
                    'inputInfo.birthSolarYear': birthSolarYear,
                    'inputInfo.gender': parseInt(gender),
                    'inputInfo.manualData.yearGan': manualData.yearGan,
                    'inputInfo.manualData.yearZhi': manualData.yearZhi,
                    'inputInfo.manualData.monthGan': manualData.monthGan,
                    'inputInfo.manualData.monthZhi': manualData.monthZhi,
                    'inputInfo.manualData.dayGan': manualData.dayGan,
                    'inputInfo.manualData.dayZhi': manualData.dayZhi,
                    'inputInfo.manualData.hourGan': manualData.hourGan,
                    'inputInfo.manualData.hourZhi': manualData.hourZhi,
                    isDeleted: { $ne: true }
                });
            } else {
                existingRecord = await BaziRecord.findOne({
                    userId: uid,
                    'inputInfo.date': date,
                    'inputInfo.time': time,
                    'inputInfo.gender': parseInt(gender),
                    'inputInfo.dayBoundaryMode': dayBoundaryMode || 'midnight',
                    'inputInfo.calendarMode': calendarMode,
                    isDeleted: { $ne: true }
                });
            }

            if (existingRecord) {
                const baziData = { ...existingRecord.baziData };
                if (baziData.lunarDateStr) baziData.lunarDateStr = formatCanChiSpacing(baziData.lunarDateStr);
                if (baziData.lunarYear) baziData.lunarYear = formatCanChiSpacing(baziData.lunarYear);
                if (baziData.tietKhiTimeline) baziData.tietKhiTimeline = formatCanChiSpacing(baziData.tietKhiTimeline);
                return res.json({ 
                    ...baziData, 
                    gender: existingRecord.inputInfo.gender,
                    recordId: existingRecord._id, 
                    name: existingRecord.inputInfo.name,
                    inputInfo: existingRecord.inputInfo,
                    aiInterpretation: existingRecord.aiInterpretation 
                });
            }

            let result;
            if (calendarMode === 'manual') {
                manualData.birthSolarYear = parseInt(birthSolarYear, 10);
                result = BaziAnalyzer.analyze(null, null, parseInt(gender), null, manualData);
                result.menhQuai = calculateMenhQuai(birthSolarYear, parseInt(gender));
            } else {
                result = BaziAnalyzer.analyze(date, time, parseInt(gender), dayBoundaryMode || 'midnight');
                const yearVal = getYearFromDateStr(date);
                result.menhQuai = calculateMenhQuai(yearVal, parseInt(gender));
            }

            const formattedName = name?.trim() || `Bát Tự - ${parseInt(gender) === 1 ? 'Nam Mệnh' : 'Nữ Mệnh'}`;

            // Save to DB
            const inputInfo = {
                name: formattedName,
                gender: parseInt(gender),
                calendarMode
            };

            if (calendarMode === 'manual') {
                inputInfo.birthSolarYear = birthSolarYear;
                inputInfo.manualData = manualData;
                inputInfo.date = `Thủ công (${birthSolarYear})`;
                inputInfo.time = `Thủ công`;
            } else {
                inputInfo.date = date;
                inputInfo.time = time;
                inputInfo.dayBoundaryMode = dayBoundaryMode || 'midnight';
                if (calendarMode === 'lunar') {
                    inputInfo.isLeap = isLeap;
                    inputInfo.lunarDate = rawDate;
                }
            }

            const record = new BaziRecord({
                userId: uid,
                idempotencyKey: idempotencyKeyVal || `${uid}:${date}:${time}:${gender}:${dayBoundaryMode || 'midnight'}`,
                inputInfo,
                solarTimeline: result.solarTimeline || 'Nhập thủ công Bát tự',
                tietKhiTimeline: result.tietKhiTimeline,
                baziData: result,
                aiInterpretation: {
                    content: '',
                    generatedAt: null,
                    model: '',
                    promptVersion: '',
                    tokensUsed: 0
                }
            });
            await record.save();

            // Increment user bazi record count O(1)
            const UserStatsService = require('../services/UserStatsService');
            UserStatsService.incrementRecordCount(uid, 'bazi', 1);

            // Invalidate user history cache
            MemoryCacheService.clearUserHistoryCache(uid);

            // Broadcast to admins
            const sseService = require('../services/SseService');
            sseService.sendToAdmins('new_calculation', { type: 'bazi', userId: uid, recordId: record._id });

            return res.json({ 
                ...result, 
                gender: parseInt(gender),
                recordId: record._id, 
                name: record.inputInfo.name,
                inputInfo: record.inputInfo,
                aiInterpretation: record.aiInterpretation 
            });
        } catch (error) {
            console.error('Bazi Analyze Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = BaziController;
