const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const SecurityEvent = require('../models/SecurityEvent');
const VisualShare = require('../models/VisualShare');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Get system-wide security overview statistics
 * @route   GET /api/admin/stats
 * @access  Private (Admin)
 */
const getSystemStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalAccounts,
      totalTransactions,
      failedLogins,
      authFailures,
      suspiciousTx,
      expiredShares,
      rejectedTx,
      recentAuditLogs,
      recentSecurityEvents,
    ] = await Promise.all([
      User.countDocuments(),
      Account.countDocuments(),
      Transaction.countDocuments(),
      SecurityEvent.countDocuments({ eventType: 'FAILED_LOGIN' }),
      SecurityEvent.countDocuments({ eventType: 'AUTHORIZATION_FAILURE' }),
      SecurityEvent.countDocuments({ eventType: 'SUSPICIOUS_TRANSACTION' }),
      SecurityEvent.countDocuments({ eventType: 'EXPIRED_SHARE' }),
      Transaction.countDocuments({ state: 'REJECTED' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10),
      SecurityEvent.find().sort({ createdAt: -1 }).limit(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          totalAccounts,
          totalTransactions,
          failedLogins,
          authFailures,
          suspiciousTransactions: suspiciousTx,
          expiredSecurityShares: expiredShares,
          rejectedTransactions: rejectedTx,
        },
        recentAuditLogs,
        recentSecurityEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all registered users
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all accounts
 * @route   GET /api/admin/accounts
 * @access  Private (Admin)
 */
const getAllAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find()
      .populate('owners', 'name email role status')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: accounts.length,
      data: accounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Freeze or unfreeze an account
 * @route   PATCH /api/admin/accounts/:id/freeze
 * @access  Private (Admin)
 */
const toggleFreezeAccount = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    const previousStatus = account.status;
    account.status = account.status === 'active' ? 'frozen' : 'active';
    await account.save();

    const action = account.status === 'frozen' ? 'ACCOUNT_FROZEN' : 'ACCOUNT_UNFROZEN';

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      action,
      result: 'SUCCESS',
      req,
      metadata: {
        accountId: account._id,
        accountNumber: account.accountNumber,
        previousStatus,
        newStatus: account.status,
      },
    });

    res.status(200).json({
      success: true,
      message: `Account ${account.accountNumber} has been ${account.status}.`,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all transactions (with visual crypto status)
 * @route   GET /api/admin/transactions
 * @access  Private (Admin)
 */
const getAllTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate('senderAccount', 'accountNumber accountType')
      .populate('receiverAccount', 'accountNumber accountType')
      .populate('initiatedBy', 'name email')
      .populate('authorizations.userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get audit trail logs with filtering
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin)
 */
const getAuditLogs = async (req, res, next) => {
  try {
    const { action, result, limit = 50, page = 1 } = req.query;
    const query = {};

    if (action) query.action = action;
    if (result) query.result = result;

    const skip = (Number(page) - 1) * Number(limit);
    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get security events
 * @route   GET /api/admin/security-events
 * @access  Private (Admin)
 */
const getSecurityEvents = async (req, res, next) => {
  try {
    const events = await SecurityEvent.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSystemStats,
  getAllUsers,
  getAllAccounts,
  toggleFreezeAccount,
  getAllTransactions,
  getAuditLogs,
  getSecurityEvents,
};
