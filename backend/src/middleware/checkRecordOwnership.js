const IChingRecord = require('../models/IChingRecord');
const BaziRecord = require('../models/BaziRecord');
const ZiweiRecord = require('../models/ZiweiRecord');
const MarriageRecord = require('../models/MarriageRecord');

module.exports = async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next();
  }

  // Determine model by examining URL path
  let Model = null;
  const path = req.originalUrl || '';

  if (path.includes('/iching') || path.includes('/hexagrams')) {
    Model = IChingRecord;
  } else if (path.includes('/bazi')) {
    Model = BaziRecord;
  } else if (path.includes('/ziwei') || path.includes('/tu-vi')) {
    Model = ZiweiRecord;
  } else if (path.includes('/marriage')) {
    Model = MarriageRecord;
  }

  if (!Model) {
    return next();
  }

  try {
    const record = await Model.findById(id);
    if (!record) {
      // Let the controller handle 404
      return next();
    }

    // Guest records are public/accessible by anyone (both guest and signed-in users)
    if (record.userId === 'guest') {
      req.record = record;
      return next();
    }

    // Registered user records require auth profile
    if (!req.dbUser) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bản ghi này.' });
    }

    const currentUserId = String(req.dbUser.id || req.dbUser._id);
    const isOwner = String(record.userId) === currentUserId;
    const isAdmin = req.dbUser.role === 'admin' || req.dbUser.role === 'co-admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập bản ghi này.' });
    }

    req.record = record;
    next();
  } catch (err) {
    console.error('Error verifying record ownership:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
