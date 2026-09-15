const Account = require('../models/Account');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');

/**
 * Generate unique 10-digit account number
 */
const generateAccountNumber = async () => {
  let unique = false;
  let accNum = '';
  while (!unique) {
    accNum = '1000' + Math.floor(100000 + Math.random() * 900000).toString();
    const exists = await Account.findOne({ accountNumber: accNum });
    if (!exists) unique = true;
  }
  return accNum;
};

/**
 * @desc    Get all accounts for the current user (or all if admin)
 * @route   GET /api/accounts
 * @access  Private
 */
const getAccounts = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query = { owners: req.user._id };
    }

    const accounts = await Account.find(query)
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
 * @desc    Get specific account details
 * @route   GET /api/accounts/:id
 * @access  Private
 */
const getAccountById = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id).populate(
      'owners',
      'name email status'
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    // Ownership check (IDOR protection)
    const isOwner = account.owners.some(
      (owner) => owner._id.toString() === req.user._id.toString()
    );

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have ownership privileges for this account.',
        code: 'FORBIDDEN_ACCOUNT_ACCESS',
      });
    }

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get real-time balance for an account
 * @route   GET /api/accounts/:id/balance
 * @access  Private
 */
const getAccountBalance = async (req, res, next) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    const isOwner = account.owners.some(
      (ownerId) => ownerId.toString() === req.user._id.toString()
    );

    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to account balance.',
        code: 'FORBIDDEN_ACCOUNT_ACCESS',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        accountId: account._id,
        accountNumber: account.accountNumber,
        maskedAccountNumber: account.maskedAccountNumber,
        balance: account.balance,
        status: account.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create an account (Individual or Joint)
 * @route   POST /api/accounts
 * @access  Private
 */
const createAccount = async (req, res, next) => {
  try {
    const { accountType = 'individual', coOwnerEmail, initialDeposit = 0 } = req.body;

    const owners = [req.user._id];

    if (accountType === 'joint') {
      if (!coOwnerEmail) {
        return res.status(400).json({
          success: false,
          message: 'Co-owner email is required to establish a joint account.',
          code: 'CO_OWNER_REQUIRED',
        });
      }

      if (coOwnerEmail.toLowerCase() === req.user.email.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot add yourself as the secondary joint co-owner.',
          code: 'INVALID_CO_OWNER',
        });
      }

      const coOwner = await User.findOne({ email: coOwnerEmail.toLowerCase() });
      if (!coOwner) {
        return res.status(404).json({
          success: false,
          message: `User with email '${coOwnerEmail}' does not exist in the banking registry.`,
          code: 'USER_NOT_FOUND',
        });
      }

      owners.push(coOwner._id);
    }

    const accountNumber = await generateAccountNumber();
    const balance = Math.max(0, Number(initialDeposit) || 0);

    const account = await Account.create({
      accountNumber,
      accountType,
      owners,
      balance,
    });

    const populatedAccount = await Account.findById(account._id).populate(
      'owners',
      'name email'
    );

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ADMIN_ACTION',
      result: 'SUCCESS',
      req,
      metadata: {
        actionType: 'ACCOUNT_CREATED',
        accountId: account._id,
        accountNumber,
        accountType,
      },
    });

    res.status(201).json({
      success: true,
      message: `${accountType === 'joint' ? 'Joint' : 'Individual'} account created successfully.`,
      data: populatedAccount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulate Deposit
 * @route   POST /api/accounts/:id/deposit
 * @access  Private
 */
const simulateDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const depositAmount = Number(amount);

    if (!depositAmount || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Deposit amount must be greater than ₹0.',
        code: 'INVALID_AMOUNT',
      });
    }

    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found.',
        code: 'ACCOUNT_NOT_FOUND',
      });
    }

    account.balance += depositAmount;
    await account.save();

    res.status(200).json({
      success: true,
      message: `Successfully deposited ₹${depositAmount.toLocaleString('en-IN')}`,
      data: {
        accountId: account._id,
        balance: account.balance,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAccounts,
  getAccountById,
  getAccountBalance,
  createAccount,
  simulateDeposit,
};
