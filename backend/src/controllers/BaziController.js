const BaziAnalyzer = require('../services/BaziAnalyzer');
const BaziRecord = require('../models/BaziRecord');

class BaziController {
    static async analyze(req, res) {
        try {
            const { date, time, gender, userId } = req.body; // Expecting: date: "dd/mm/yyyy", time: "hh:mm", gender: 1 or 0
            if (!date || !time || gender === undefined) {
                return res.status(400).json({ error: 'Missing date, time, or gender parameters' });
            }

            const result = BaziAnalyzer.analyze(date, time, parseInt(gender));
            
            // Save to DB
            const record = new BaziRecord({
                userId: userId || 'guest',
                inputInfo: { date, time, gender: parseInt(gender) },
                solarTimeline: result.solarTimeline,
                tietKhiTimeline: result.tietKhiTimeline,
                baziData: result
            });
            await record.save();

            return res.json({ ...result, recordId: record._id });
        } catch (error) {
            console.error('Bazi Analyze Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = BaziController;
