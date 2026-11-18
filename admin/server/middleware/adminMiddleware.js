const jwt = require('jsonwebtoken');

function adminMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Admin authentication required' });
    }

    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (payload.type !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }

    req.admin = true;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
}

module.exports = adminMiddleware;
