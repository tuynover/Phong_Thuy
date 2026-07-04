const DateService = require('../services/DateService');

class DateController {
    static async check(req, res) {
        try {
            const { birthYear, solarDate, solarHour, activity } = req.body;

            if (!birthYear || !solarDate || !activity) {
                return res.status(400).json({ error: 'Missing required parameters: birthYear, solarDate, or activity' });
            }

            const result = DateService.checkDate(birthYear, solarDate, solarHour, activity);
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

            const result = DateService.consultDates(birthYear, startDate, endDate, activity);
            return res.json(result);
        } catch (error) {
            console.error('Date Consult Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }
}

module.exports = DateController;
