const User = require('../../../core/models/User');
const IChingRecord = require('../../iching/models/IChingRecord');
const BaziRecord = require('../../bazi/models/BaziRecord');
const ZiweiRecord = require('../../ziwei/models/ZiweiRecord');
const MarriageRecord = require('../../bazi/models/MarriageRecord');
const Conversation = require('../../../core/models/Conversation');
const SystemLog = require('../models/SystemLog');
const BanAppeal = require('../models/BanAppeal');

class AdminStatsController {
  static async getAnalytics(req, res) {
    try {
      const { startDate, endDate, groupBy = 'day' } = req.query;

      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      let end = endDate ? new Date(endDate) : new Date();
      if (endDate) {
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1);
      }

      // 1. Total overview stats - using $ne: true to include legacy records
      const [
        totalUsers,
        totalIching,
        totalBazi,
        totalZiwei,
        totalMarriage,
        totalAppeals
      ] = await Promise.all([
        User.countDocuments({ isDeleted: { $ne: true } }),
        IChingRecord.countDocuments({ isDeleted: { $ne: true } }),
        BaziRecord.countDocuments({ isDeleted: { $ne: true } }),
        ZiweiRecord.countDocuments({ isDeleted: { $ne: true } }),
        MarriageRecord.countDocuments({ isDeleted: { $ne: true } }),
        BanAppeal.countDocuments({ status: 'pending' })
      ]);

      // Generate dateFormat
      const dateFormat = groupBy === 'hour' ? '%Y-%m-%d %H:00' : '%Y-%m-%d';

      // Generate all timeline keys for zero-filling
      const timeKeys = [];
      let current = new Date(start.getTime());
      
      current.setSeconds(0);
      current.setMilliseconds(0);
      if (groupBy !== 'hour') {
        current.setHours(0, 0, 0, 0);
      } else {
        current.setMinutes(0);
      }

      const endLimit = new Date(end.getTime());

      const formatTimeTZ = (date, formatStr) => {
        const tzOffsetMs = 7 * 60 * 60 * 1000;
        const localTime = new Date(date.getTime() + tzOffsetMs);
        const yyyy = localTime.getUTCFullYear();
        const mm = String(localTime.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(localTime.getUTCDate()).padStart(2, '0');
        if (formatStr.includes('%H')) {
          const hh = String(localTime.getUTCHours()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd} ${hh}:00`;
        }
        return `${yyyy}-${mm}-${dd}`;
      };

      const stepMs = groupBy === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      let safetyCount = 0;
      while (current <= endLimit && safetyCount < 1000) {
        timeKeys.push(formatTimeTZ(current, dateFormat));
        current = new Date(current.getTime() + stepMs);
        safetyCount++;
      }

      const matchRange = { createdAt: { $gte: start, $lte: end }, isDeleted: { $ne: true } };
      const conversationMatchRange = { createdAt: { $gte: start, $lte: end } };

      // 2. 3. 4. Parallelized aggregates over time
      const [
        accesses,
        baziTimeline,
        ichingTimeline,
        ziweiTimeline,
        marriageTimeline,
        baziTokens,
        ichingTokens,
        ziweiTokens,
        marriageTokens,
        baziChatTokens,
        ichingChatTokens,
        ziweiChatTokens,
        marriageChatTokens
      ] = await Promise.all([
        SystemLog.aggregate([
          { $match: { timestamp: { $gte: start, $lte: end } } },
          {
            $group: {
              _id: { $dateToString: { format: dateFormat, date: '$timestamp', timezone: 'Asia/Ho_Chi_Minh' } },
              visits: { $sum: 1 }
            }
          }
        ]),
        BaziRecord.aggregate([
          { $match: matchRange },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
        ]),
        IChingRecord.aggregate([
          { $match: matchRange },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
        ]),
        ZiweiRecord.aggregate([
          { $match: matchRange },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
        ]),
        MarriageRecord.aggregate([
          { $match: matchRange },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, count: { $sum: 1 } } }
        ]),
        BaziRecord.aggregate([
          { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        IChingRecord.aggregate([
          { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        ZiweiRecord.aggregate([
          { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        MarriageRecord.aggregate([
          { $match: { ...matchRange, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$aiInterpretation.tokensUsed' } } }
        ]),
        Conversation.aggregate([
          { $match: { ...conversationMatchRange, system: 'bazi', totalTokens: { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
        ]),
        Conversation.aggregate([
          { $match: { ...conversationMatchRange, system: 'iching', totalTokens: { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
        ]),
        Conversation.aggregate([
          { $match: { ...conversationMatchRange, system: 'ziwei', totalTokens: { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
        ]),
        Conversation.aggregate([
          { $match: { ...conversationMatchRange, system: 'marriage', totalTokens: { $gt: 0 } } },
          { $group: { _id: { $dateToString: { format: dateFormat, date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } }, tokens: { $sum: '$totalTokens' } } }
        ])
      ]);

      // Map everything to a unified timeline array with zero-filling
      const timelineMap = new Map();
      for (const key of timeKeys) {
        timelineMap.set(key, {
          date: key,
          visits: 0,
          iching: 0,
          bazi: 0,
          ziwei: 0,
          marriage: 0,
          ichingTokens: 0,
          baziTokens: 0,
          ziweiTokens: 0,
          marriageTokens: 0,
          ichingInterpretTokens: 0,
          baziInterpretTokens: 0,
          ziweiInterpretTokens: 0,
          marriageInterpretTokens: 0,
          ichingChatTokens: 0,
          baziChatTokens: 0,
          ziweiChatTokens: 0,
          marriageChatTokens: 0,
          interpretTokens: 0,
          chatTokens: 0,
          tokens: 0
        });
      }

      accesses.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).visits = item.visits || 0;
        }
      });

      ichingTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).iching = item.count || 0;
        }
      });
      baziTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).bazi = item.count || 0;
        }
      });
      ziweiTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).ziwei = item.count || 0;
        }
      });
      marriageTimeline.forEach(item => {
        if (timelineMap.has(item._id)) {
          timelineMap.get(item._id).marriage = item.count || 0;
        }
      });

      ichingTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.ichingInterpretTokens = item.tokens || 0;
          entry.ichingTokens = (entry.ichingTokens || 0) + (item.tokens || 0);
          entry.interpretTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      baziTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.baziInterpretTokens = item.tokens || 0;
          entry.baziTokens = (entry.baziTokens || 0) + (item.tokens || 0);
          entry.interpretTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      ziweiTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.ziweiInterpretTokens = item.tokens || 0;
          entry.ziweiTokens = (entry.ziweiTokens || 0) + (item.tokens || 0);
          entry.interpretTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      marriageTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.marriageInterpretTokens = item.tokens || 0;
          entry.marriageTokens = (entry.marriageTokens || 0) + (item.tokens || 0);
          entry.interpretTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });

      ichingChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.ichingChatTokens = item.tokens || 0;
          entry.ichingTokens = (entry.ichingTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      baziChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.baziChatTokens = item.tokens || 0;
          entry.baziTokens = (entry.baziTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      ziweiChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.ziweiChatTokens = item.tokens || 0;
          entry.ziweiTokens = (entry.ziweiTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });
      marriageChatTokens.forEach(item => {
        if (timelineMap.has(item._id)) {
          const entry = timelineMap.get(item._id);
          entry.marriageChatTokens = item.tokens || 0;
          entry.marriageTokens = (entry.marriageTokens || 0) + (item.tokens || 0);
          entry.chatTokens += item.tokens || 0;
          entry.tokens += item.tokens || 0;
        }
      });

      const timeline = Array.from(timelineMap.values());

      // 5. User resource consumption drill-down (Top 10 consumers directly from User stats)
      const topUsers = await User.find({
        isDeleted: { $ne: true },
        'stats.totalTokens': { $gt: 0 }
      })
      .sort({ 'stats.totalTokens': -1 })
      .limit(10)
      .select('email name stats')
      .lean();

      const userConsumptionList = topUsers.map(u => ({
        userId: u._id.toString(),
        name: u.name,
        email: u.email,
        tokens: u.stats?.totalTokens || 0,
        bazi: u.stats?.baziCount || 0,
        iching: u.stats?.ichingCount || 0,
        ziwei: u.stats?.ziweiCount || 0,
        marriage: u.stats?.marriageCount || 0,
        chatTokens: u.stats?.totalChatTokens || 0,
        interpretationTokens: u.stats?.totalInterpretTokens || 0
      }));

      return res.json({
        overview: {
          totalUsers,
          totalIching,
          totalBazi,
          totalZiwei,
          totalMarriage,
          totalAppeals
        },
        timeline,
        userConsumption: userConsumptionList
      });
    } catch (error) {
      console.error('[AdminStatsController.getAnalytics] Error:', error);
      return res.status(500).json({ error: 'Lỗi tải dữ liệu thống kê.' });
    }
  }
}

module.exports = AdminStatsController;
