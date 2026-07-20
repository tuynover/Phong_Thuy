const User = require('../models/User');
const IChingRecord = require('../models/IChingRecord');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');
const Conversation = require('../models/Conversation');
const SseService = require('./SseService');

/**
 * Atomic Increment O(1) for Record Creation/Deletion
 * @param {string} userId - User ID
 * @param {string} system - System ('iching', 'bazi', 'ziwei', 'marriage')
 * @param {number} delta - Delta count (+1 for create, -1 for soft delete)
 */
async function incrementRecordCount(userId, system, delta = 1) {
  if (!userId || userId === 'guest') return;
  try {
    const userIdStr = userId.toString();
    const systemMap = {
      iching: 'stats.ichingCount',
      hexagrams: 'stats.ichingCount',
      bazi: 'stats.baziCount',
      bat_tu: 'stats.baziCount',
      ziwei: 'stats.ziweiCount',
      tu_vi: 'stats.ziweiCount',
      marriage: 'stats.marriageCount'
    };

    const countField = systemMap[system];
    if (!countField) return;

    await User.updateOne(
      { _id: userIdStr },
      { 
        $inc: { [countField]: delta },
        $set: { 'stats.lastUpdated': new Date() }
      }
    );
  } catch (error) {
    console.error(`[UserStatsService.incrementRecordCount] Error for user ${userId}:`, error);
  }
}

/**
 * Atomic Increment O(1) for AI Interpretation Tokens
 * @param {string} userId - User ID
 * @param {string} system - System ('iching', 'bazi', 'ziwei', 'marriage')
 * @param {number} tokensUsed - Tokens used by LLM
 */
async function incrementInterpretTokens(userId, system, tokensUsed = 0) {
  if (!userId || userId === 'guest' || !tokensUsed || tokensUsed <= 0) return;
  try {
    const userIdStr = userId.toString();
    const systemMap = {
      iching: 'stats.ichingTokens',
      hexagrams: 'stats.ichingTokens',
      bazi: 'stats.baziTokens',
      bat_tu: 'stats.baziTokens',
      ziwei: 'stats.ziweiTokens',
      tu_vi: 'stats.ziweiTokens',
      marriage: 'stats.marriageTokens'
    };

    const tokenField = systemMap[system];
    if (!tokenField) return;

    await User.updateOne(
      { _id: userIdStr },
      { 
        $inc: { 
          [tokenField]: tokensUsed,
          'stats.totalInterpretTokens': tokensUsed,
          'stats.totalTokens': tokensUsed
        },
        $set: { 'stats.lastUpdated': new Date() }
      }
    );
  } catch (error) {
    console.error(`[UserStatsService.incrementInterpretTokens] Error for user ${userId}:`, error);
  }
}

/**
 * Atomic Increment O(1) for Follow-up Chat Tokens
 * @param {string} userId - User ID
 * @param {string} system - System ('iching', 'bazi', 'ziwei', 'marriage')
 * @param {number} tokensUsed - Tokens used by LLM chat
 */
async function incrementChatTokens(userId, system, tokensUsed = 0) {
  if (!userId || userId === 'guest' || !tokensUsed || tokensUsed <= 0) return;
  try {
    const userIdStr = userId.toString();
    const systemMap = {
      iching: 'stats.ichingChatTokens',
      hexagrams: 'stats.ichingChatTokens',
      bazi: 'stats.baziChatTokens',
      bat_tu: 'stats.baziChatTokens',
      ziwei: 'stats.ziweiChatTokens',
      tu_vi: 'stats.ziweiChatTokens',
      marriage: 'stats.marriageChatTokens'
    };

    const tokenField = systemMap[system];
    if (!tokenField) return;

    await User.updateOne(
      { _id: userIdStr },
      { 
        $inc: { 
          [tokenField]: tokensUsed,
          'stats.totalChatTokens': tokensUsed,
          'stats.totalTokens': tokensUsed
        },
        $set: { 'stats.lastUpdated': new Date() }
      }
    );
  } catch (error) {
    console.error(`[UserStatsService.incrementChatTokens] Error for user ${userId}:`, error);
  }
}

/**
 * Full Recalculation (Full Sync for Cron Jobs or Manual Sync)
 */
async function recalculateUserStats(userId) {
  if (!userId || userId === 'guest') return null;
  try {
    const userIdStr = userId.toString();
    const query = { userId: userIdStr };

    const [
      ichingCount,
      baziCount,
      ziweiCount,
      marriageCount,
      ichingTokensRes,
      baziTokensRes,
      ziweiTokensRes,
      marriageTokensRes,
      ichingChatTokensRes,
      baziChatTokensRes,
      ziweiChatTokensRes,
      marriageChatTokensRes
    ] = await Promise.all([
      IChingRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      BaziRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      ZiweiRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
      MarriageRecord.countDocuments({ ...query, isDeleted: { $ne: true } }),
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
      MarriageRecord.aggregate([
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
      ]),
      Conversation.aggregate([
        { $match: { ...query, system: 'marriage' } },
        { $group: { _id: null, total: { $sum: '$totalTokens' } } }
      ])
    ]);

    const ichingTokens = ichingTokensRes[0]?.total || 0;
    const baziTokens = baziTokensRes[0]?.total || 0;
    const ziweiTokens = ziweiTokensRes[0]?.total || 0;
    const marriageTokens = marriageTokensRes[0]?.total || 0;

    const ichingChatTokens = ichingChatTokensRes[0]?.total || 0;
    const baziChatTokens = baziChatTokensRes[0]?.total || 0;
    const ziweiChatTokens = ziweiChatTokensRes[0]?.total || 0;
    const marriageChatTokens = marriageChatTokensRes[0]?.total || 0;

    const totalInterpretTokens = ichingTokens + baziTokens + ziweiTokens + marriageTokens;
    const totalChatTokens = ichingChatTokens + baziChatTokens + ziweiChatTokens + marriageChatTokens;
    const totalTokens = totalInterpretTokens + totalChatTokens;

    const stats = {
      ichingCount,
      baziCount,
      ziweiCount,
      marriageCount,
      ichingTokens,
      baziTokens,
      ziweiTokens,
      marriageTokens,
      ichingChatTokens,
      baziChatTokens,
      ziweiChatTokens,
      marriageChatTokens,
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
    console.error(`[UserStatsService.recalculateUserStats] Error updating stats for user ${userId}:`, error);
    throw error;
  }
}

function updateUserStatsBackground(userId) {
  if (!userId || userId === 'guest') return;
  recalculateUserStats(userId).catch(err => {
    console.error(`[UserStatsService] Background stats update failed for user ${userId}:`, err);
  });
}

module.exports = {
  incrementRecordCount,
  incrementInterpretTokens,
  incrementChatTokens,
  recalculateUserStats,
  updateUserStats: recalculateUserStats,
  updateUserStatsBackground
};
