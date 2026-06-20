const mongoose = require('mongoose');


const User = require('../backend/src/models/User');
const HexagramRecord = require('../backend/src/models/HexagramRecord');
const BaziRecord = require('../backend/src/models/BaziRecord');
const TuViRecord = require('../backend/src/modules/tu-vi/models/TuViRecord');
const HexagramConversation = require('../backend/src/models/HexagramConversation');
const BaziConversation = require('../backend/src/models/BaziConversation');
const TuViConversation = require('../backend/src/modules/tu-vi/models/TuViConversation');
const BanAppeal = require('../backend/src/models/BanAppeal');

async function check() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const matchRange = {
    createdAt: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      $lte: new Date()
    }
  };

  const drillDownMap = new Map();
  
  const sumUserStats = async (model, recordType) => {
    const stats = await model.aggregate([
      { $match: { ...matchRange, userId: { $ne: 'guest' } } },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          tokens: { $sum: { $ifNull: ['$aiInterpretation.tokensUsed', 0] } }
        }
      }
    ]);

    for (const item of stats) {
      const uid = item._id;
      if (!uid || uid === 'guest') continue;
      const current = drillDownMap.get(uid) || { tokens: 0, bazi: 0, iching: 0, tuvi: 0, chatTokens: 0, interpretationTokens: 0 };
      current.tokens += item.tokens;
      current.interpretationTokens = (current.interpretationTokens || 0) + item.tokens;
      current[recordType] = item.count;
      drillDownMap.set(uid, current);
    }
  };

  const sumChatStats = async (model) => {
    const stats = await model.aggregate([
      { $match: { ...matchRange, userId: { $ne: 'guest' } } },
      {
        $group: {
          _id: '$userId',
          tokens: { $sum: { $ifNull: ['$totalTokens', 0] } }
        }
      }
    ]);

    for (const item of stats) {
      const uid = item._id;
      if (!uid || uid === 'guest') continue;
      const current = drillDownMap.get(uid) || { tokens: 0, bazi: 0, iching: 0, tuvi: 0, chatTokens: 0, interpretationTokens: 0 };
      current.tokens += item.tokens;
      current.chatTokens = (current.chatTokens || 0) + item.tokens;
      drillDownMap.set(uid, current);
    }
  };

  await sumUserStats(BaziRecord, 'bazi');
  await sumUserStats(HexagramRecord, 'iching');
  await sumUserStats(TuViRecord, 'tuvi');

  await sumChatStats(BaziConversation);
  await sumChatStats(HexagramConversation);
  await sumChatStats(TuViConversation);

  const sortedDrillDownEntries = Array.from(drillDownMap.entries())
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .slice(0, 10);

  const topUserIds = sortedDrillDownEntries.map(([uid]) => uid);
  const topUsers = await User.find({ _id: { $in: topUserIds } }).select('email name').lean();
  const topUsersMap = new Map(topUsers.map(u => [u._id.toString(), u]));

  const userConsumptionList = [];
  for (const [uid, stats] of sortedDrillDownEntries) {
    const u = topUsersMap.get(uid.toString());
    if (u) {
      userConsumptionList.push({
        userId: uid,
        name: u.name,
        email: u.email,
        ...stats
      });
    }
  }

  console.log('User consumption list:');
  console.log(JSON.stringify(userConsumptionList, null, 2));

  await mongoose.disconnect();
}

check();
