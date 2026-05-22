const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Доступ заборонено: відсутній токен' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_example_change_me');
    req.user = decoded; // { id, role, email }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Токен прострочено' });
    }
    return res.status(403).json({ message: 'Недійсний токен' });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Доступ заборонено: недостатньо прав' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  authorizeRole
};
