const User = require('../models/User');
const HexagramRecord = require('../models/HexagramRecord');
const BaziRecord = require('../models/BaziRecord');
const TuViRecord = require('../models/TuViRecord');
const HexagramConversation = require('../models/HexagramConversation');
const BaziConversation = require('../models/BaziConversation');
const TuViConversation = require('../models/TuViConversation');
const SseService = require('./SseService');

async function updateUserStats(userId) {
  if (!userId || userId === 'guest') return null;
  try {
    const userIdStr = userId.toString();
    const query = { userId: userIdStr };

    const [
      ichingCount,
      baziCount,
      tuviCount,
      ichingTokensRes,
      baziTokensRes,
      tuviTokensRes,
      ichingChatTokensRes,
      baziChatTokensRes,
      tuviChatTokensRes
    ] = await Promise.all([
      HexagramRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      BaziRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      TuViRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      HexagramRecord.aggregate([
        { $match: { ...query, isDeleted: { $ne: true }, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]),
      BaziRecord.aggregate([
        { $match: { ...query, isDeleted: { $ne: true }, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]),
      TuViRecord.aggregate([
        { $match: { ...query, isDeleted: { $ne: true }, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]),
      HexagramConversation.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ]),
      BaziConversation.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ]),
      TuViConversation.aggregate([
        { $match: query },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ])
    ]);

    const ichingTokens = ichingTokensRes[0]?.total || 0;
    const baziTokens = baziTokensRes[0]?.total || 0;
    const tuviTokens = tuviTokensRes[0]?.total || 0;

    const ichingChatTokens = ichingChatTokensRes[0]?.total || 0;
    const baziChatTokens = baziChatTokensRes[0]?.total || 0;
    const tuviChatTokens = tuviChatTokensRes[0]?.total || 0;

    const totalInterpretTokens = ichingTokens + baziTokens + tuviTokens;
    const totalChatTokens = ichingChatTokens + baziChatTokens + tuviChatTokens;
    const totalTokens = totalInterpretTokens + totalChatTokens;

    const stats = {
      ichingCount,
      baziCount,
      tuviCount,
      ichingTokens,
      baziTokens,
      tuviTokens,
      ichingChatTokens,
      baziChatTokens,
      tuviChatTokens,
      totalInterpretTokens,
      totalChatTokens,
      totalTokens,
      lastUpdated: new Date()
    };

    await User.findByIdAndUpdate(userIdStr, { stats });
    try {
      SseService.sendToAdmins('user_updated', { userId: userIdStr, action: 'stats', stats });
    } catch (sseErr) {
      console.error(`[UserStatsService] Failed to broadcast user_updated event for ${userIdStr}:`, sseErr);
    }
    return stats;
  } catch (error) {
    console.error(`[UserStatsService.updateUserStats] Error updating stats for user ${userId}:`, error);
    throw error;
  }
}

function updateUserStatsBackground(userId) {
  if (!userId || userId === 'guest') return;
  // Trigger immediately in the background without delay
  updateUserStats(userId).catch(err => {
    console.error(`[UserStatsService] Background stats update failed for user ${userId}:`, err);
  });
}

module.exports = {
  updateUserStats,
  updateUserStatsBackground
};
