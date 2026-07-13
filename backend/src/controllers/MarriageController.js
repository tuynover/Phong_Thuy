const BaziAnalyzer = require('../services/BaziAnalyzer');
const MarriageRecord = require('../models/MarriageRecord');
const MemoryCacheService = require('../services/MemoryCacheService');

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

const formatBaziData = (baziData) => {
    const data = { ...baziData };
    if (data.lunarDateStr) data.lunarDateStr = formatCanChiSpacing(data.lunarDateStr);
    if (data.lunarYear) data.lunarYear = formatCanChiSpacing(data.lunarYear);
    if (data.tietKhiTimeline) data.tietKhiTimeline = formatCanChiSpacing(data.tietKhiTimeline);
    return data;
};

class MarriageController {
    static async analyze(req, res) {
        try {
            const { male, female, userId, dayBoundaryMode } = req.body;
            if (!male || !male.date || !male.time || !female || !female.date || !female.time) {
                return res.status(400).json({ error: 'Thiếu thông tin ngày giờ sinh của Nam hoặc Nữ.' });
            }

            const uid = userId || 'guest';
            const dayMode = dayBoundaryMode || 'midnight';

            // Check duplicate to prevent redundant calculations (Semantic Idempotency)
            const existingRecord = await MarriageRecord.findOne({
                userId: uid,
                'inputInfo.male.date': male.date,
                'inputInfo.male.time': male.time,
                'inputInfo.female.date': female.date,
                'inputInfo.female.time': female.time,
                isDeleted: { $ne: true }
            });

            if (existingRecord) {
                const maleBazi = formatBaziData(existingRecord.maleBaziData);
                const femaleBazi = formatBaziData(existingRecord.femaleBaziData);
                return res.json({
                    recordId: existingRecord._id,
                    maleBaziData: maleBazi,
                    femaleBaziData: femaleBazi,
                    aiInterpretation: existingRecord.aiInterpretation
                });
            }

            // Analyze Male (gender = 1)
            const maleResult = BaziAnalyzer.analyze(male.date, male.time, 1, dayMode);
            const maleYearVal = getYearFromDateStr(male.date);
            maleResult.menhQuai = calculateMenhQuai(maleYearVal, 1);

            // Analyze Female (gender = 0)
            const femaleResult = BaziAnalyzer.analyze(female.date, female.time, 0, dayMode);
            const femaleYearVal = getYearFromDateStr(female.date);
            femaleResult.menhQuai = calculateMenhQuai(femaleYearVal, 0);

            // Create record
            const record = new MarriageRecord({
                userId: uid,
                idempotencyKey: `${uid}:marriage:${male.date}:${male.time}:${female.date}:${female.time}`,
                inputInfo: {
                    male: { date: male.date, time: male.time },
                    female: { date: female.date, time: female.time }
                },
                maleBaziData: maleResult,
                femaleBaziData: femaleResult,
                aiInterpretation: {
                    content: '',
                    generatedAt: null,
                    model: '',
                    promptVersion: '',
                    tokensUsed: 0
                }
            });

            await record.save();

            // Clear User cache
            MemoryCacheService.clearUserHistoryCache(uid);

            // Admin broadcast
            const sseService = require('../services/SseService');
            sseService.sendToAdmins('new_calculation', { type: 'marriage', userId: uid, recordId: record._id });

            return res.json({
                recordId: record._id,
                maleBaziData: formatBaziData(maleResult),
                femaleBaziData: formatBaziData(femaleResult),
                aiInterpretation: record.aiInterpretation
            });

        } catch (error) {
            console.error('Marriage Analyze Error:', error);
            return res.status(500).json({ error: 'Lỗi máy chủ khi lập lá số hợp hôn.' });
        }
    }
}

module.exports = MarriageController;
