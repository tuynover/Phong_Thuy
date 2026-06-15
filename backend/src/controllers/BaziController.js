const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziRecord = require('../models/BaziRecord');
const MemoryCacheService = require('../services/MemoryCacheService');

const formatCanChiSpacing = (str) => {
    if (!str) return str;
    return str.replace(/(Giáp|Ất|Bính|Đinh|Mậu|Kỷ|Canh|Tân|Nhâm|Quý)(?=[A-Z])/g, '$1 ');
};

class BaziController {
    static async analyze(req, res) {
        try {
            const { date, time, gender, userId, dayBoundaryMode } = req.body; // Expecting: date: "dd/mm/yyyy", time: "hh:mm", gender: 1 or 0, dayBoundaryMode: "midnight" | "zi_hour"
            if (!date || !time || gender === undefined) {
                return res.status(400).json({ error: 'Missing date, time, or gender parameters' });
            }

            const uid = userId || 'guest';
            const idempotencyKey = req.headers['idempotency-key'] || req.headers['Idempotency-Key'];

            // 1. Check by Idempotency Key header if provided
            if (idempotencyKey) {
                const dupRecord = await BaziRecord.findOne({ idempotencyKey });
                if (dupRecord) {
                    const baziData = { ...dupRecord.baziData };
                    if (baziData.lunarDateStr) baziData.lunarDateStr = formatCanChiSpacing(baziData.lunarDateStr);
                    if (baziData.lunarYear) baziData.lunarYear = formatCanChiSpacing(baziData.lunarYear);
                    if (baziData.tietKhiTimeline) baziData.tietKhiTimeline = formatCanChiSpacing(baziData.tietKhiTimeline);
                    return res.json({ 
                        ...baziData, 
                        recordId: dupRecord._id, 
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
                'inputInfo.dayBoundaryMode': dayBoundaryMode || 'midnight'
            });

            if (existingRecord) {
                const baziData = { ...existingRecord.baziData };
                if (baziData.lunarDateStr) baziData.lunarDateStr = formatCanChiSpacing(baziData.lunarDateStr);
                if (baziData.lunarYear) baziData.lunarYear = formatCanChiSpacing(baziData.lunarYear);
                if (baziData.tietKhiTimeline) baziData.tietKhiTimeline = formatCanChiSpacing(baziData.tietKhiTimeline);
                return res.json({ 
                    ...baziData, 
                    recordId: existingRecord._id, 
                    aiInterpretation: existingRecord.aiInterpretation 
                });
            }

            const result = BaziAnalyzer.analyze(date, time, parseInt(gender), dayBoundaryMode || 'midnight');
            
            // Save to DB
            const record = new BaziRecord({
                userId: uid,
                idempotencyKey: idempotencyKey || null,
                inputInfo: { date, time, gender: parseInt(gender), dayBoundaryMode: dayBoundaryMode || 'midnight' },
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

            // Invalidate user history cache
            MemoryCacheService.clearUserHistoryCache(uid);

            return res.json({ 
                ...result, 
                recordId: record._id, 
                aiInterpretation: record.aiInterpretation 
            });
        } catch (error) {
            console.error('Bazi Analyze Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = BaziController;
