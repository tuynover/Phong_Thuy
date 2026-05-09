const BaziAnalyzer = require('../services/BaziAnalyzer');

class BaziController {
    static analyze(req, res) {
        try {
            const { date, time, gender } = req.body; // Expecting: date: "dd/mm/yyyy", time: "hh:mm", gender: 1 or 0
            if (!date || !time || gender === undefined) {
                return res.status(400).json({ error: 'Missing date, time, or gender parameters' });
            }

            const result = BaziAnalyzer.analyze(date, time, parseInt(gender));
            return res.json(result);
        } catch (error) {
            console.error('Bazi Analyze Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = BaziController;
