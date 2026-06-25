const User = require('../models/User');
const IChingRecord = require('../models/IChingRecord');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const Conversation = require('../models/Conversation');
const SseService = require('./SseService');

async function updateUserStats(userId) {
  if (!userId || userId === 'guest') return null;
  try {
    const userIdStr = userId.toString();
    const query = { userId: userIdStr };

    const [
      ichingCount,
      baziCount,
      ziweiCount,
      ichingTokensRes,
      baziTokensRes,
      ziweiTokensRes,
      ichingChatTokensRes,
      baziChatTokensRes,
      ziweiChatTokensRes
    ] = await Promise.all([
      IChingRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      BaziRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      ZiweiRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      IChingRecord.aggregate([
        { $match: { ...query, isDeleted: { $ne: true }, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]),
      BaziRecord.aggregate([
        { $match: { ...query, isDeleted: { $ne: true }, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]),
      ZiweiRecord.aggregate([
        { $match: { ...query, isDeleted: { $ne: true }, 'aiInterpretation.tokensUsed': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$aiInterpretation.tokensUsed' } } }
      ]),
      Conversation.aggregate([
        { $match: { ...query, system: 'iching' } },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ]),
      Conversation.aggregate([
        { $match: { ...query, system: 'bazi' } },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ]),
      Conversation.aggregate([
        { $match: { ...query, system: 'ziwei' } },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ])
    ]);

    const ichingTokens = ichingTokensRes[0]?.total || 0;
    const baziTokens = baziTokensRes[0]?.total || 0;
    const ziweiTokens = ziweiTokensRes[0]?.total || 0;

    const ichingChatTokens = ichingChatTokensRes[0]?.total || 0;
    const baziChatTokens = baziChatTokensRes[0]?.total || 0;
    const ziweiChatTokens = ziweiChatTokensRes[0]?.total || 0;

    const totalInterpretTokens = ichingTokens + baziTokens + ziweiTokens;
    const totalChatTokens = ichingChatTokens + baziChatTokens + ziweiChatTokens;
    const totalTokens = totalInterpretTokens + totalChatTokens;

    const stats = {
      ichingCount,
      baziCount,
      ziweiCount,
      ichingTokens,
      baziTokens,
      ziweiTokens,
      ichingChatTokens,
      baziChatTokens,
      ziweiChatTokens,
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
