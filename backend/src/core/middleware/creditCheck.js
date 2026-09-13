const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getUserProfileCache, setUserProfileCache } = require('../config/redis');

const creditCheck = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'Vui lòng đăng nhập để sử dụng tính năng luận giải AI.' 
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' });
    }

    const userId = decoded.user?.id || decoded.id;
    const tokenVersion = decoded.user?.tokenVersion;
    if (!userId) {
      return res.status(401).json({ error: 'Token không hợp lệ.' });
    }

    // 1. Try Redis cache first
    let user = await getUserProfileCache(userId);
    
    // 2. Fallback to Mongo if miss
    if (!user) {
      const mongoUser = await User.findById(userId);
      if (mongoUser) {
        user = mongoUser.toObject ? mongoUser.toObject() : mongoUser;
        setUserProfileCache(userId, user);
      }
    }

    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'Tài khoản không tồn tại.' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ 
        error: `Tài khoản của bạn đã bị khóa. Lý do: ${user.lockReason || 'Không có'}` 
      });
    }

    const currentTokenVersion = user.tokenVersion || 0;
    const payloadTokenVersion = tokenVersion !== undefined ? tokenVersion : 0;
    if (payloadTokenVersion !== currentTokenVersion) {
      return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' });
    }

    // Determine requested mode (standard vs vip)
    const isVipMode = req.body?.mode === 'vip' || req.query?.mode === 'vip';

    // Fetch record if not already loaded by ownership middleware
    let record = req.record;
    if (!record && req.params?.id) {
      const path = req.originalUrl || '';
      let Model = null;
      if (path.includes('/iching') || path.includes('/hexagrams')) {
        const IChingRecord = require('../../modules/iching/models/IChingRecord');
        Model = IChingRecord;
      } else if (path.includes('/bazi')) {
        const BaziRecord = require('../../modules/bazi/models/BaziRecord');
        Model = BaziRecord;
      } else if (path.includes('/ziwei') || path.includes('/tu-vi')) {
        const ZiweiRecord = require('../../modules/ziwei/models/ZiweiRecord');
        Model = ZiweiRecord;
      } else if (path.includes('/marriage')) {
        const MarriageRecord = require('../../modules/bazi/models/MarriageRecord');
        Model = MarriageRecord;
      }
      if (Model) {
        record = await Model.findById(req.params.id);
        if (record) req.record = record;
      }
    }

    // 1. Trạng thái: Đã có bài luận giải chuyên sâu (VIP)
    if (record?.aiInterpretation?.mode === 'vip' && record.aiInterpretation?.content) {
      return res.status(400).json({
        error: 'Lá số / quẻ này đã có bài luận giải chuyên sâu VIP hoàn chỉnh. Không thể gửi thêm yêu cầu luận giải.'
      });
    }

    // 2. Trạng thái: Đã có bài luận giải thường, và client chỉ yêu cầu bản thường -> Trả về cache ngay ở 0ms, không gọi AI, không trừ credit
    if (!isVipMode && record?.aiInterpretation?.content) {
      return res.json({
        content: record.aiInterpretation.content,
        mode: record.aiInterpretation.mode || 'standard',
        fromCache: true
      });
    }

    // 3. Tính toán chi phí credit:
    // - Luận giải thường mới: 1 credit
    // - Nâng cấp từ thường lên VIP: 4 credits (chênh lệch 5 - 1 = 4)
    // - Luận giải VIP mới từ đầu: 5 credits
    let requiredCost = 1;
    if (isVipMode) {
      const hasStandard = !!(record?.aiInterpretation?.content);
      requiredCost = hasStandard ? 4 : 5;
    }
    req.creditCost = requiredCost;

    // Attach helper to refund credit if request fails or reads from cache
    req.creditDecremented = false;
    req.refundCredit = async () => {
      if (req.creditDecremented && req.user && req.user._id) {
        try {
          const refundedUser = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { credits: requiredCost } },
            { new: true }
          );
          if (refundedUser) {
            setUserProfileCache(req.user._id, refundedUser);
          }
          req.creditDecremented = false;
        } catch (e) {
          console.error('[creditCheck] Refund credit error:', e);
        }
      }
    };

    // Bypass check for admins and co-admins
    if (user.role === 'admin' || user.role === 'co-admin') {
      req.user = user;
      return next();
    }

    // Atomic credit decrement check
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, credits: { $gte: requiredCost } },
      { $inc: { credits: -requiredCost } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(402).json({ 
        error: `Bạn không đủ lượt sử dụng (cần ${requiredCost} credits, hiện có ${user.credits || 0} credits). Vui lòng nạp thêm lượt sử dụng để tiếp tục.` 
      });
    }

    req.creditDecremented = true;

    // Response Interceptor: Auto-refund on error HTTP status >= 400
    res.on('finish', async () => {
      if (res.statusCode >= 400 && req.creditDecremented) {
        await req.refundCredit();
      }
    });

    // Synchronize updated credits to Redis profile cache
    setUserProfileCache(userId, updatedUser);

    req.user = updatedUser;
    next();
  } catch (error) {
    console.error('[creditCheck] Error:', error);
    return res.status(500).json({ error: 'Lỗi kiểm tra lượt sử dụng.' });
  }
};

module.exports = creditCheck;
