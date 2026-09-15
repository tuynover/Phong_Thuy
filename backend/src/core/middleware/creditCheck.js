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
        await setUserProfileCache(userId, user);
      }
    }

    // 3. Self-Healing: Re-verify with MongoDB if cached tokenVersion mismatches
    const payloadTokenVersion = tokenVersion !== undefined ? tokenVersion : 0;
    if (user && (user.tokenVersion || 0) !== payloadTokenVersion) {
      const freshMongoUser = await User.findById(userId);
      if (freshMongoUser) {
        user = freshMongoUser.toObject ? freshMongoUser.toObject() : freshMongoUser;
        await setUserProfileCache(userId, user);
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

    // 1. Kiểm tra trạng thái đã có bài luận giải phù hợp (Cache Hit 0ms):
    // - Bản ghi đã có luận giải VIP: Trả về cache VIP ở 0ms cho bất kỳ yêu cầu nào (standard hoặc vip)
    // - Bản ghi đã có luận giải thường và người dùng chỉ yêu cầu bản thường: Trả về cache thường ở 0ms
    const hasValidCache = 
      record?.aiInterpretation?.content &&
      (record.aiInterpretation.mode === 'vip' || !isVipMode);

    if (hasValidCache) {
      const acceptsJson = req.headers['accept']?.includes('application/json') && !req.headers['accept']?.includes('text/event-stream');
      if (acceptsJson) {
        return res.json({
          content: record.aiInterpretation.content,
          mode: record.aiInterpretation.mode || 'standard',
          fromCache: true
        });
      }
      // Với SSE stream, cho qua controller để phát lại stream 0ms, đảm bảo KHÔNG trừ bất kỳ credit nào
      req.creditCost = 0;
      req.creditDecremented = false;
      req.user = user;
      return next();
    }

    // 3. Tính toán chi phí point:
    // - Luận giải thường mới: 100 points
    // - Nâng cấp từ thường lên VIP: 400 points (chênh lệch 500 - 100 = 400)
    // - Luận giải VIP mới từ đầu: 500 points
    let requiredCost = 100;
    if (isVipMode) {
      const hasStandard = !!(record?.aiInterpretation?.content);
      requiredCost = hasStandard ? 400 : 500;
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
            await setUserProfileCache(req.user._id, refundedUser);
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
        error: `Bạn không đủ lượt sử dụng (cần ${requiredCost} points, hiện có ${user.credits || 0} points). Vui lòng nạp thêm point để tiếp tục.` 
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
    await setUserProfileCache(userId, updatedUser);

    req.user = updatedUser;
    next();
  } catch (error) {
    console.error('[creditCheck] Error:', error);
    return res.status(500).json({ error: 'Lỗi kiểm tra lượt sử dụng.' });
  }
};

module.exports = creditCheck;
