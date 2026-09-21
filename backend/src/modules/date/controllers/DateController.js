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

    static async getPersonalizedMonthCalendar(req, res) {
        try {
            const mode = req.body.mode || req.query.mode || 'year';

            // Phiên bản Bát Tự Nâng Cao bắt buộc đăng nhập
            if (mode === 'bazi') {
                if (!req.user || !req.user.id) {
                    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để sử dụng phiên bản Bát Tự Nâng Cao' });
                }
            }

            const PersonalizedAlmanacService = require('../services/PersonalizedAlmanacService');
            const now = new Date();
            const year = parseInt(req.body.year || req.query.year || now.getFullYear(), 10);
            const month = parseInt(req.body.month || req.query.month || (now.getMonth() + 1), 10);

            const userId = req.user ? (req.user.id || req.user._id) : 'guest';
            let baziInfo = req.body.baziInfo || req.body.userBirth || null;

            if (mode === 'year') {
                const birthYear = req.body.birthYear || (baziInfo && baziInfo.year) || (req.dbUser && req.dbUser.baziInfo && req.dbUser.baziInfo.year) || 1995;
                baziInfo = { year: parseInt(birthYear, 10), month: 1, day: 1, hour: 12, minute: 0 };
            } else {
                // mode === 'bazi'
                if (!baziInfo && req.dbUser && req.dbUser.baziInfo) {
                    baziInfo = req.dbUser.baziInfo;
                }
                if (!baziInfo) {
                    return res.status(400).json({ success: false, message: 'Thiếu thông tin sinh mệnh Bát Tự (baziInfo)' });
                }
            }

            const calendarData = await PersonalizedAlmanacService.getMonthCalendar(userId, year, month, baziInfo, mode);
            return res.json({ success: true, ...calendarData });
        } catch (error) {
            console.error('Personalized Month Calendar Error:', error);
            return res.status(500).json({ error: 'Không thể lập cuốn lịch cá nhân hóa' });
        }
    }

    static async getPersonalizedDayDetail(req, res) {
        try {
            const mode = req.body.mode || req.query.mode || 'year';

            // Phiên bản Bát Tự Nâng Cao bắt buộc đăng nhập
            if (mode === 'bazi') {
                if (!req.user || !req.user.id) {
                    return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để sử dụng phiên bản Bát Tự Nâng Cao' });
                }
            }

            const PersonalizedAlmanacService = require('../services/PersonalizedAlmanacService');
            const { dateStr } = req.body;

            if (!dateStr) {
                return res.status(400).json({ error: 'Thiếu tham số ngày (dateStr)' });
            }

            const userId = req.user ? (req.user.id || req.user._id) : 'guest';
            let baziInfo = req.body.baziInfo || req.body.userBirth || null;

            if (mode === 'year') {
                const birthYear = req.body.birthYear || (baziInfo && baziInfo.year) || (req.dbUser && req.dbUser.baziInfo && req.dbUser.baziInfo.year) || 1995;
                baziInfo = { year: parseInt(birthYear, 10), month: 1, day: 1, hour: 12, minute: 0 };
            } else {
                // mode === 'bazi'
                if (!baziInfo && req.dbUser && req.dbUser.baziInfo) {
                    baziInfo = req.dbUser.baziInfo;
                }
                if (!baziInfo) {
                    return res.status(400).json({ success: false, message: 'Thiếu thông tin sinh mệnh Bát Tự (baziInfo)' });
                }
            }

            const dayDetail = await PersonalizedAlmanacService.getDayDetail(userId, dateStr, baziInfo, mode);
            return res.json({ success: true, ...dayDetail });
        } catch (error) {
            console.error('Personalized Day Detail Error:', error);
            return res.status(500).json({ error: 'Không thể tải chi tiết ngày cá nhân hóa' });
        }
    }
}

module.exports = DateController;
