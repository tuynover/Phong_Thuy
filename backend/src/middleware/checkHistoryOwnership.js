module.exports = async (req, res, next) => {
  const { userId } = req.params;
  if (!userId) {
    return next();
  }

  // Guest history queries are allowed (typically return empty or limited guest lists)
  if (userId === 'guest') {
    return next();
  }

  // Registered user histories require auth profile
  if (!req.dbUser) {
    return res.status(403).json({ error: 'Bạn không có quyền truy cập thông tin này.' });
  }

  const currentUserId = String(req.dbUser.id || req.dbUser._id);
  const isAdmin = req.dbUser.role === 'admin' || req.dbUser.role === 'co-admin';

  if (currentUserId !== String(userId) && !isAdmin) {
    return res.status(403).json({ error: 'Bạn không có quyền truy cập thông tin này.' });
  }


  next();
};
