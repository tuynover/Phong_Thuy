const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const ConversationContextService = require('../ai/ConversationContextService');

/**
 * Middleware kiểm tra điều kiện câu hỏi chat và tần suất (Rate Limit) trước khi trừ credit.
 * Giúp bảo vệ quyền lợi người dùng: tuyệt đối không trừ credit khi câu hỏi rỗng, lạc đề,
 * hoặc bị chặn bởi cooldown 10 giây / hạn mức 10 câu hỏi mỗi giờ.
 */
const chatRateLimiter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Câu hỏi không được để trống.' });
    }

    if (!ConversationContextService.isDivinationRelated(question)) {
      const path = req.originalUrl || '';
      let errorMsg = 'Vui lòng hỏi những câu hỏi liên quan đến lĩnh vực này.';
      if (path.includes('/iching') || path.includes('/hexagrams')) {
        errorMsg = 'Tôi là trợ lý luận giải Kinh Dịch. Vui lòng hỏi những câu hỏi liên quan đến quẻ dịch này.';
      } else if (path.includes('/bazi')) {
        errorMsg = 'Tôi là trợ lý luận giải Bát Tự. Vui lòng hỏi những câu hỏi liên quan đến lá số này.';
      } else if (path.includes('/ziwei') || path.includes('/tu-vi')) {
        errorMsg = 'Tôi là trợ lý luận giải Tử Vi. Vui lòng hỏi những câu hỏi liên quan đến lá số này.';
      } else if (path.includes('/marriage')) {
        errorMsg = 'Tôi là trợ lý luận giải hôn nhân gia đạo. Vui lòng hỏi những câu hỏi liên quan đến tình duyên, gia đạo, con cái hoặc lá số này.';
      }
      return res.status(400).json({ error: errorMsg });
    }

    // Xác định phân hệ phong thủy
    let system = 'iching';
    const path = req.originalUrl || '';
    if (path.includes('/bazi')) system = 'bazi';
    else if (path.includes('/ziwei') || path.includes('/tu-vi')) system = 'ziwei';
    else if (path.includes('/marriage')) system = 'marriage';

    const userId = req.dbUser ? (req.dbUser.id || req.dbUser._id) : (req.user ? (req.user.id || req.user._id) : 'guest');

    let conversation = await Conversation.findOne({ recordId: id, system });
    if (!conversation) {
      conversation = await Conversation.create({
        recordId: id,
        userId,
        system
      });
    }
    req.conversation = conversation;

    // Kiểm tra cooldown 10 giây giữa 2 câu hỏi liên tiếp
    const lastMsg = await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1 });
    if (lastMsg && (Date.now() - new Date(lastMsg.createdAt).getTime()) < 10000) {
      return res.status(429).json({ error: 'Vui lòng chờ 10 giây giữa các câu hỏi.' });
    }

    // Kiểm tra giới hạn 10 câu hỏi / giờ cho cuộc hội thoại
    const oneHourAgo = new Date(Date.now() - 3600000);
    const msgCountInLastHour = await Message.countDocuments({
      conversationId: conversation._id,
      role: 'user',
      createdAt: { $gte: oneHourAgo }
    });
    if (msgCountInLastHour >= 10) {
      const entityName = system === 'iching' ? 'quẻ dịch' : 'lá số';
      return res.status(429).json({ error: `Bạn đã đạt giới hạn 10 câu hỏi/giờ cho ${entityName} này.` });
    }

    next();
  } catch (err) {
    console.error('[chatRateLimiter] Error:', err);
    return res.status(500).json({ error: 'Lỗi kiểm tra trạng thái hội thoại.' });
  }
};

module.exports = chatRateLimiter;
