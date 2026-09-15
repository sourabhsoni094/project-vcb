const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAudit, logSecurityEvent } = require('../services/auditService');

/**
 * Helper to generate signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'super_secure_academic_research_jwt_secret_key_2026!',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/**
 * @desc    Register a new customer
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.',
        code: 'MISSING_FIELDS',
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
        code: 'EMAIL_ALREADY_EXISTS',
      });
    }

    // Default to 'customer' unless created by an admin flow
    const assignedRole = role === 'admin' ? 'customer' : 'customer';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
    });

    const token = generateToken(user._id, user.role);

    await logAudit({
      userId: user._id,
      userEmail: user.email,
      action: 'REGISTRATION',
      result: 'SUCCESS',
      req,
      metadata: { role: user.role },
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
        code: 'MISSING_CREDENTIALS',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      await logSecurityEvent({
        eventType: 'FAILED_LOGIN',
        severity: 'LOW',
        userEmail: email,
        req,
        details: { reason: 'User does not exist' },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check account lockout
    if (user.isLocked()) {
      await logSecurityEvent({
        eventType: 'FAILED_LOGIN',
        severity: 'HIGH',
        userId: user._id,
        userEmail: user.email,
        req,
        details: { reason: 'Account locked due to excessive failed attempts' },
      });

      return res.status(403).json({
        success: false,
        message: 'Account is temporarily locked due to repeated failed logins. Please try again later.',
        code: 'ACCOUNT_LOCKED',
      });
    }

    // Check frozen status
    if (user.status === 'frozen') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been frozen by banking administration.',
        code: 'ACCOUNT_FROZEN',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;
      // Lock for 15 minutes after 5 consecutive failures
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      await logAudit({
        userId: user._id,
        userEmail: user.email,
        action: 'LOGIN_FAILURE',
        result: 'FAILURE',
        req,
        metadata: { attempts: user.failedLoginAttempts },
      });

      await logSecurityEvent({
        eventType: 'FAILED_LOGIN',
        severity: user.failedLoginAttempts >= 3 ? 'HIGH' : 'MEDIUM',
        userId: user._id,
        userEmail: user.email,
        req,
        details: { failedAttempts: user.failedLoginAttempts },
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Login successful: reset failed attempts
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = generateToken(user._id, user.role);

    await logAudit({
      userId: user._id,
      userEmail: user.email,
      action: 'LOGIN_SUCCESS',
      result: 'SUCCESS',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res, next) => {
  try {
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'LOGOUT',
      result: 'SUCCESS',
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
