const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziRecord = require('../models/BaziRecord');
const MemoryCacheService = require('../services/MemoryCacheService');

class BaziController {
    static async analyze(req, res) {
        try {
            const { date, time, gender, userId } = req.body; // Expecting: date: "dd/mm/yyyy", time: "hh:mm", gender: 1 or 0
            if (!date || !time || gender === undefined) {
                return res.status(400).json({ error: 'Missing date, time, or gender parameters' });
            }

            const uid = userId || 'guest';

            // Check for duplicate record
            const existingRecord = await BaziRecord.findOne({
                userId: uid,
                'inputInfo.date': date,
                'inputInfo.time': time,
                'inputInfo.gender': parseInt(gender)
            });

            if (existingRecord) {
                return res.json({ 
                    ...existingRecord.baziData, 
                    recordId: existingRecord._id, 
                    aiInterpretation: existingRecord.aiInterpretation 
                });
            }

            const result = BaziAnalyzer.analyze(date, time, parseInt(gender));
            
            // Save to DB
            const record = new BaziRecord({
                userId: uid,
                inputInfo: { date, time, gender: parseInt(gender) },
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
