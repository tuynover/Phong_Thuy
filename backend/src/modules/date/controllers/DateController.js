const DateService = require('../services/DateService');
const MemoryCacheService = require('../../../core/services/MemoryCacheService');

class DateController {
    static async check(req, res) {
        try {
            const { birthYear, solarDate, solarHour, activity } = req.body;

            if (!birthYear || !solarDate || !activity) {
                return res.status(400).json({ error: 'Missing required parameters: birthYear, solarDate, or activity' });
            }

            const cacheKey = `date:check:${birthYear}:${solarDate}:${solarHour ?? ''}:${activity}`;
            const cached = MemoryCacheService.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const result = DateService.checkDate(birthYear, solarDate, solarHour, activity);
            MemoryCacheService.set(cacheKey, result, 24 * 60 * 60 * 1000);
            return res.json(result);
        } catch (error) {
            console.error('Date Check Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    static async consult(req, res) {
        try {
            const { birthYear, startDate, endDate, activity } = req.body;

            if (!birthYear || !startDate || !endDate || !activity) {
                return res.status(400).json({ error: 'Missing required parameters: birthYear, startDate, endDate, or activity' });
            }

            const cacheKey = `date:consult:${birthYear}:${startDate}:${endDate}:${activity}`;
            const cached = MemoryCacheService.get(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const result = DateService.consultDates(birthYear, startDate, endDate, activity);
            MemoryCacheService.set(cacheKey, result, 24 * 60 * 60 * 1000);
            return res.json(result);
        } catch (error) {
            console.error('Date Consult Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = DateController;
