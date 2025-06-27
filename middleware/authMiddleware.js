const jwt = require('jsonwebtoken');

exports.protect = (roles = []) => {
  // roles param can be a single role string or array of roles
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden: Access denied' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  };
};
