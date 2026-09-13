const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziRecord = require('../models/BaziRecord');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');
const InputValidator = require('../../../core/services/InputValidator');
const UserStatsService = require('../../../core/services/UserStatsService');
const { acquireRedisLock, releaseRedisLock } = require('../../../core/config/redis');

const formatCanChiSpacing = (str) => {
    if (!str) return str;
    return str.replace(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?=[A-Z])/g, '$1 ');
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
        let lockKey = null;
        try {
            const valResult = InputValidator.validateBaziInput(req.body);
            if (!valResult.isValid) {
                return res.status(400).json({ error: valResult.error });
            }

            const { calendarMode = 'solar', name, gender } = valResult.sanitized;
            const { userId, dayBoundaryMode } = req.body;

            const uid = userId || 'guest';

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
                    const { Lunar } = require('lunar-javascript');
                    const parts = date.split('/');
                    const dNum = parseInt(parts[0], 10);
                    const mNum = parseInt(parts[1], 10);
                    const yNum = parseInt(parts[2], 10);
                    
                    const lunarObj = Lunar.fromYmd(yNum, isLeap ? -mNum : mNum, dNum);
                    const solarObj = lunarObj.getSolar();
                    
                    date = `${String(solarObj.getDay()).padStart(2, '0')}/${String(solarObj.getMonth()).padStart(2, '0')}/${solarObj.getYear()}`;
                }
            }

            // Chống spam 10 request đồng thời cùng bộ dữ liệu (In-Flight Concurrency Protection 2.5s)
            const payloadKey = calendarMode === 'manual'
                ? `${uid}:manual:${manualData.yearGan}${manualData.yearZhi}_${manualData.monthGan}${manualData.monthZhi}_${manualData.dayGan}${manualData.dayZhi}_${manualData.hourGan}${manualData.hourZhi}:${gender}:${birthSolarYear}`
                : `${uid}:${date}:${time}:${gender}:${dayBoundaryMode || 'midnight'}`;
            lockKey = `inflight:bazi:${payloadKey}`;

            const acquired = await acquireRedisLock(lockKey, 2500);
            if (!acquired) {
                return res.status(429).json({
                    error: 'Yêu cầu của bạn đang được hệ thống xử lý, vui lòng không nhấn gửi liên tục.'
                });
            }
            if (typeof res.on === 'function') {
                res.on('finish', () => {
                    releaseRedisLock(lockKey);
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
                idempotencyKey: `${uid}:${date}:${time}:${gender}:${dayBoundaryMode || 'midnight'}:${Date.now()}`,
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
            UserStatsService.incrementRecordCount(uid, 'bazi', 1);

            // Invalidate user history cache
            MemoryCacheService.clearUserHistoryCache(uid);

            // Broadcast to admins
            try {
                const sseService = require('../../../core/services/SseService');
                sseService.sendToAdmins('new_calculation', { type: 'bazi', userId: uid, recordId: record._id });
            } catch (e) {}

            releaseRedisLock(lockKey);
            return res.json({ 
                ...result, 
                gender: parseInt(gender),
                recordId: record._id, 
                name: record.inputInfo.name,
                inputInfo: record.inputInfo,
                aiInterpretation: record.aiInterpretation 
            });
        } catch (error) {
            if (lockKey) {
                releaseRedisLock(lockKey);
            }
            console.error('Bazi Analyze Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = BaziController;
