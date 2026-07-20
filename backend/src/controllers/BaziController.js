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

class BaziController {
    static async analyze(req, res) {
        try {
            const { date, time, gender, userId, dayBoundaryMode, name } = req.body; // date: "dd/mm/yyyy" or "yyyy-mm-dd"
            if (!date || !time || gender === undefined) {
                return res.status(400).json({ error: 'Missing date, time, or gender parameters' });
            }

            const uid = userId || 'guest';
            const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];

            // 1. Check by Idempotency Key header if provided
            if (idempotencyKey) {
                const dupRecord = await BaziRecord.findOne({ idempotencyKey, isDeleted: { $ne: true } });
                if (dupRecord) {
                    let updated = false;
                    if (!dupRecord.baziData || !dupRecord.baziData.cungMenh || !dupRecord.baziData.cungMenh.gan || !dupRecord.baziData.tietKhiName || !dupRecord.baziData.tuLenhCan || !hasNewSchema(dupRecord.baziData)) {
                        const freshResult = BaziAnalyzer.analyze(date, time, parseInt(gender), dayBoundaryMode || 'midnight');
                        dupRecord.baziData = freshResult;
                        dupRecord.solarTimeline = freshResult.solarTimeline;
                        dupRecord.tietKhiTimeline = freshResult.tietKhiTimeline;
                        updated = true;
                    }
                    if (!dupRecord.baziData.menhQuai) {
                        const yearVal = getYearFromDateStr(date);
                        dupRecord.baziData.menhQuai = calculateMenhQuai(yearVal, dupRecord.inputInfo.gender);
                        dupRecord.markModified('baziData');
                        updated = true;
                    }
                    if (updated) {
                        await dupRecord.save();
                    }

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
            const existingRecord = await BaziRecord.findOne({
                userId: uid,
                'inputInfo.date': date,
                'inputInfo.time': time,
                'inputInfo.gender': parseInt(gender),
                'inputInfo.dayBoundaryMode': dayBoundaryMode || 'midnight',
                isDeleted: { $ne: true }
            });

            if (existingRecord) {
                let updated = false;
                // Migrate legacy records dynamically if they don't have full cungMenh object calculated
                if (!existingRecord.baziData || !existingRecord.baziData.cungMenh || !existingRecord.baziData.cungMenh.gan || !existingRecord.baziData.tietKhiName || !existingRecord.baziData.tuLenhCan || !hasNewSchema(existingRecord.baziData)) {
                    const freshResult = BaziAnalyzer.analyze(date, time, parseInt(gender), dayBoundaryMode || 'midnight');
                    existingRecord.baziData = freshResult;
                    existingRecord.solarTimeline = freshResult.solarTimeline;
                    existingRecord.tietKhiTimeline = freshResult.tietKhiTimeline;
                    updated = true;
                }
                if (!existingRecord.baziData.menhQuai) {
                    const yearVal = getYearFromDateStr(date);
                    existingRecord.baziData.menhQuai = calculateMenhQuai(yearVal, existingRecord.inputInfo.gender);
                    existingRecord.markModified('baziData');
                    updated = true;
                }
                if (updated) {
                    await existingRecord.save();
                }

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

            const result = BaziAnalyzer.analyze(date, time, parseInt(gender), dayBoundaryMode || 'midnight');
            const yearVal = getYearFromDateStr(date);
            result.menhQuai = calculateMenhQuai(yearVal, parseInt(gender));

            const formattedName = name?.trim() || `Bát Tự - ${parseInt(gender) === 1 ? 'Nam Mệnh' : 'Nữ Mệnh'}`;

            // Save to DB
            const record = new BaziRecord({
                userId: uid,
                idempotencyKey: idempotencyKey || `${uid}:${date}:${time}:${gender}:${dayBoundaryMode || 'midnight'}`,
                inputInfo: { name: formattedName, date, time, gender: parseInt(gender), dayBoundaryMode: dayBoundaryMode || 'midnight' },
                solarTimeline: result.solarTimeline,
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
