const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - JWT Verification
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided.',
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'super_secure_academic_research_jwt_secret_key_2026!'
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status === 'frozen') {
      return res.status(403).json({
        success: false,
        message: 'Account is frozen by bank administration. Please contact support.',
        code: 'ACCOUNT_FROZEN',
      });
    }

    if (user.isLocked()) {
      return res.status(403).json({
        success: false,
        message: 'Account temporarily locked due to repeated failed logins.',
        code: 'ACCOUNT_LOCKED',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      code: 'TOKEN_INVALID',
    });
  }
};

/**
 * Restrict to specific roles (RBAC)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user ? req.user.role : 'anonymous'}' is not authorized to access this resource.`,
        code: 'FORBIDDEN',
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
