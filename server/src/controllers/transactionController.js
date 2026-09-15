const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const VisualShare = require('../models/VisualShare');
const visualCryptoService = require('../services/visualCryptoService');
const { transition } = require('../services/transactionStateMachine');
const { logAudit, logSecurityEvent } = require('../services/auditService');

/**
 * Generate unique transaction reference code
 */
const generateTransactionId = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TXN-${dateStr}-${randomStr}`;
};

/**
 * @desc    Create a new transaction (Normal or Joint)
 * @route   POST /api/transactions
 * @access  Private
 */
const createTransaction = async (req, res, next) => {
  try {
    const { senderAccountId, receiverAccountNumber, amount, description = 'Funds Transfer' } = req.body;
    const transferAmount = Number(amount);

    if (!senderAccountId || !receiverAccountNumber || !transferAmount || transferAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sender account, valid receiver account number, and positive transfer amount are required.',
        code: 'INVALID_TRANSACTION_PAYLOAD',
      });
    }

    // 1. Validate sender account
    const senderAccount = await Account.findById(senderAccountId).populate('owners');
    if (!senderAccount) {
      return res.status(404).json({
        success: false,
        message: 'Sender account not found.',
        code: 'SENDER_ACCOUNT_NOT_FOUND',
      });
    }

    // Check sender ownership
    const isOwner = senderAccount.owners.some(
      (owner) => owner._id.toString() === req.user._id.toString()
    );
    if (!isOwner) {
      await logSecurityEvent({
        eventType: 'UNAUTHORIZED_RESOURCE_ACCESS',
        severity: 'HIGH',
        userId: req.user._id,
        userEmail: req.user.email,
        req,
        details: { attemptedAccountId: senderAccountId },
      });

      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You are not an owner of the specified sender account.',
        code: 'UNAUTHORIZED_SENDER',
      });
    }

    // Check sender status
    if (senderAccount.status === 'frozen') {
      return res.status(400).json({
        success: false,
        message: 'Sender account is frozen. Transactions cannot be initiated.',
        code: 'ACCOUNT_FROZEN',
      });
    }

    // 2. Validate receiver account
    const receiverAccount = await Account.findOne({ accountNumber: receiverAccountNumber });
    if (!receiverAccount) {
      return res.status(404).json({
        success: false,
        message: `Receiver account number '${receiverAccountNumber}' does not exist.`,
        code: 'RECEIVER_ACCOUNT_NOT_FOUND',
      });
    }

    if (receiverAccount._id.toString() === senderAccount._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Sender and receiver accounts cannot be identical.',
        code: 'IDENTICAL_ACCOUNTS',
      });
    }

    if (receiverAccount.status === 'frozen') {
      return res.status(400).json({
        success: false,
        message: 'Receiver account is currently frozen and cannot accept funds.',
        code: 'RECEIVER_FROZEN',
      });
    }

    // 3. Balance verification
    if (senderAccount.balance < transferAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${senderAccount.balance.toLocaleString('en-IN')}, Requested: ₹${transferAmount.toLocaleString('en-IN')}`,
        code: 'INSUFFICIENT_BALANCE',
      });
    }

    const transactionId = generateTransactionId();
    const isJoint = senderAccount.accountType === 'joint' && senderAccount.owners.length > 1;

    // Build authorizations matrix
    const authorizations = senderAccount.owners.map((owner) => ({
      userId: owner._id,
      status: owner._id.toString() === req.user._id.toString() ? 'APPROVED' : 'PENDING',
      authorizedAt: owner._id.toString() === req.user._id.toString() ? new Date() : null,
      shareProvided: owner._id.toString() === req.user._id.toString(),
    }));

    // If it's an individual account, complete immediately
    if (!isJoint) {
      // Normal transaction workflow
      senderAccount.balance -= transferAmount;
      receiverAccount.balance += transferAmount;

      await senderAccount.save();
      await receiverAccount.save();

      const transaction = await Transaction.create({
        transactionId,
        senderAccount: senderAccount._id,
        receiverAccount: receiverAccount._id,
        amount: transferAmount,
        transactionType: 'normal',
        state: 'COMPLETED',
        initiatedBy: req.user._id,
        description,
        authorizations,
      });

      await logAudit({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'TRANSACTION_CREATED',
        transactionId,
        result: 'SUCCESS',
        req,
        metadata: {
          amount: transferAmount,
          senderAccount: senderAccount.accountNumber,
          receiverAccount: receiverAccount.accountNumber,
          type: 'normal',
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Transaction completed successfully.',
        data: transaction,
      });
    }

    // ==========================================
    // JOINT ACCOUNT TRANSACTION WITH VISUAL CRYPTO
    // ==========================================
    // Generate dynamic visual cryptography security secret for this transaction
    const secretGraphic = await visualCryptoService.generateTransactionSecretGraphic(
      transactionId,
      transferAmount
    );

    // Decompose into Share A and Share B using CSPRNG
    const shares = visualCryptoService.generateSharesFromBinary(
      secretGraphic.rawBinary,
      secretGraphic.width,
      secretGraphic.height
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry

    const transaction = await Transaction.create({
      transactionId,
      senderAccount: senderAccount._id,
      receiverAccount: receiverAccount._id,
      amount: transferAmount,
      transactionType: 'joint_transfer',
      state: 'AWAITING_AUTHORIZATION',
      initiatedBy: req.user._id,
      description,
      secretVisualHash: secretGraphic.hash,
      authorizations,
      expiresAt,
    });

    // Find the secondary joint owner
    const coOwner = senderAccount.owners.find(
      (owner) => owner._id.toString() !== req.user._id.toString()
    );

    // Store Share A (bound to Initiator) and Share B (bound to Co-Owner)
    await VisualShare.create({
      transactionId,
      userId: req.user._id,
      shareType: 'SHARE_A',
      shareData: shares.shareA.dataUrl,
      expiresAt,
    });

    await VisualShare.create({
      transactionId,
      userId: coOwner._id,
      shareType: 'SHARE_B',
      shareData: shares.shareB.dataUrl,
      expiresAt,
    });

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'TRANSACTION_CREATED',
      transactionId,
      result: 'SUCCESS',
      req,
      metadata: {
        amount: transferAmount,
        type: 'joint_transfer',
        status: 'AWAITING_AUTHORIZATION',
      },
    });

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'VISUAL_SHARE_GENERATED',
      transactionId,
      result: 'SUCCESS',
      req,
      metadata: {
        hash: secretGraphic.hash,
        shareType: 'SHARE_A_AND_B',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Joint transaction initiated. Awaiting secondary co-owner authorization via visual cryptography.',
      data: {
        transaction,
        // Initiator can only see their own visual share thumbnail for audit tracking
        userSharePreview: shares.shareA.dataUrl,
        requiresAuthorizationFrom: {
          id: coOwner._id,
          name: coOwner.name,
          email: coOwner.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's transactions
 * @route   GET /api/transactions
 * @access  Private
 */
const getTransactions = async (req, res, next) => {
  try {
    const userAccounts = await Account.find({ owners: req.user._id }).select('_id');
    const accountIds = userAccounts.map((acc) => acc._id);

    let query = {};
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { senderAccount: { $in: accountIds } },
          { receiverAccount: { $in: accountIds } },
          { initiatedBy: req.user._id },
        ],
      };
    }

    const transactions = await Transaction.find(query)
      .populate('senderAccount', 'accountNumber accountType maskedAccountNumber')
      .populate('receiverAccount', 'accountNumber accountType maskedAccountNumber')
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
 * @desc    Get pending joint transactions awaiting user's authorization
 * @route   GET /api/transactions/pending-authorizations
 * @access  Private
 */
const getPendingAuthorizations = async (req, res, next) => {
  try {
    const userAccounts = await Account.find({ owners: req.user._id }).select('_id');
    const accountIds = userAccounts.map((acc) => acc._id);

    const pending = await Transaction.find({
      senderAccount: { $in: accountIds },
      state: 'AWAITING_AUTHORIZATION',
      authorizations: {
        $elemMatch: {
          userId: req.user._id,
          status: 'PENDING',
        },
      },
    })
      .populate('senderAccount', 'accountNumber accountType maskedAccountNumber owners')
      .populate('receiverAccount', 'accountNumber maskedAccountNumber')
      .populate('initiatedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pending.length,
      data: pending,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get specific transaction by ID
 * @route   GET /api/transactions/:id
 * @access  Private
 */
const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('senderAccount', 'accountNumber accountType maskedAccountNumber owners')
      .populate('receiverAccount', 'accountNumber accountType maskedAccountNumber')
      .populate('initiatedBy', 'name email')
      .populate('authorizations.userId', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction record not found.',
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    // Check if user has access to view this transaction
    const senderOwners = transaction.senderAccount?.owners || [];
    const isSenderOwner = senderOwners.some(
      (ownerId) => ownerId.toString() === req.user._id.toString()
    );
    const isInitiator = transaction.initiatedBy._id.toString() === req.user._id.toString();

    if (!isSenderOwner && !isInitiator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this transaction record.',
        code: 'FORBIDDEN_TRANSACTION_ACCESS',
      });
    }

    // Find if current user has an assigned share
    const userShare = await VisualShare.findOne({
      transactionId: transaction.transactionId,
      userId: req.user._id,
    }).select('+shareData');

    res.status(200).json({
      success: true,
      data: {
        ...transaction.toObject(),
        currentUserShare: userShare ? { shareType: userShare.shareType, status: userShare.status, preview: userShare.shareData } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authorize a joint transaction using Visual Cryptography XOR verification
 * @route   POST /api/transactions/:id/authorize
 * @access  Private
 */
const authorizeJointTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('senderAccount')
      .populate('receiverAccount');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    // State check
    if (transaction.state !== 'AWAITING_AUTHORIZATION') {
      return res.status(400).json({
        success: false,
        message: `Transaction cannot be authorized in '${transaction.state}' state.`,
        code: 'INVALID_TRANSACTION_STATE',
      });
    }

    // Check expiration
    if (transaction.expiresAt && new Date() > transaction.expiresAt) {
      transition(transaction, 'EXPIRED');
      await transaction.save();

      await logSecurityEvent({
        eventType: 'EXPIRED_SHARE',
        severity: 'LOW',
        userId: req.user._id,
        transactionId: transaction.transactionId,
        req,
      });

      return res.status(400).json({
        success: false,
        message: 'Transaction authorization period has expired.',
        code: 'TRANSACTION_EXPIRED',
      });
    }

    // Verify user is authorized signer
    const authEntry = transaction.authorizations.find(
      (a) => a.userId.toString() === req.user._id.toString()
    );

    if (!authEntry) {
      await logSecurityEvent({
        eventType: 'AUTHORIZATION_FAILURE',
        severity: 'HIGH',
        userId: req.user._id,
        transactionId: transaction.transactionId,
        req,
        details: { reason: 'Unauthorized user attempting authorization' },
      });

      return res.status(403).json({
        success: false,
        message: 'You are not an authorized signer for this transaction.',
        code: 'UNAUTHORIZED_SIGNER',
      });
    }

    // Check duplicate authorization
    if (authEntry.status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Duplicate authorization: You have already authorized this transaction.',
        code: 'DUPLICATE_AUTHORIZATION',
      });
    }

    // ====================================================
    // VISUAL CRYPTOGRAPHY SECRET RECONSTRUCTION & VERIFY
    // ====================================================
    // Retrieve Share A and Share B securely from internal vault
    const shares = await VisualShare.find({
      transactionId: transaction.transactionId,
    }).select('+shareData');

    const shareA = shares.find((s) => s.shareType === 'SHARE_A');
    const shareB = shares.find((s) => s.shareType === 'SHARE_B');

    if (!shareA || !shareB) {
      return res.status(400).json({
        success: false,
        message: 'Cryptographic security shares missing or damaged for this transaction.',
        code: 'MISSING_SECURITY_SHARES',
      });
    }

    // Combine Share A XOR Share B
    const combined = await visualCryptoService.combineShares(
      shareA.shareData,
      shareB.shareData
    );

    // Verify match against original transaction secret hash
    const verification = visualCryptoService.verifyReconstruction(
      combined.rawReconstructed,
      transaction.secretVisualHash
    );

    if (!verification.isMatch) {
      await logSecurityEvent({
        eventType: 'TAMPERED_SHARE_DETECTED',
        severity: 'CRITICAL',
        userId: req.user._id,
        transactionId: transaction.transactionId,
        req,
        details: { verification },
      });

      transition(transaction, 'FAILED');
      await transaction.save();

      return res.status(400).json({
        success: false,
        message: 'Visual Cryptography verification failed: Reconstructed secret does not match authentic transaction matrix.',
        code: 'CRYPTOGRAPHIC_MISMATCH',
      });
    }

    // Mark current user's authorization
    authEntry.status = 'APPROVED';
    authEntry.authorizedAt = new Date();
    authEntry.shareProvided = true;

    // Check if all authorizations are approved
    const allApproved = transaction.authorizations.every(
      (a) => a.status === 'APPROVED'
    );

    if (allApproved) {
      // Transition state machine: AUTHORIZED -> PROCESSING -> COMPLETED
      transition(transaction, 'AUTHORIZED');
      transition(transaction, 'PROCESSING');

      // Check balance once more before settlement
      const senderAccount = await Account.findById(transaction.senderAccount._id);
      const receiverAccount = await Account.findById(transaction.receiverAccount._id);

      if (senderAccount.balance < transaction.amount) {
        transition(transaction, 'FAILED');
        await transaction.save();
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance at moment of settlement.',
          code: 'INSUFFICIENT_BALANCE',
        });
      }

      // Debit sender, credit receiver
      senderAccount.balance -= transaction.amount;
      receiverAccount.balance += transaction.amount;

      await senderAccount.save();
      await receiverAccount.save();

      transition(transaction, 'COMPLETED');
      await transaction.save();

      // Mark visual shares consumed
      await VisualShare.updateMany(
        { transactionId: transaction.transactionId },
        { status: 'CONSUMED' }
      );

      await logAudit({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'VISUAL_SHARE_VERIFIED',
        transactionId: transaction.transactionId,
        result: 'SUCCESS',
        req,
        metadata: { match: true },
      });

      await logAudit({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'TRANSACTION_AUTHORIZED',
        transactionId: transaction.transactionId,
        result: 'SUCCESS',
        req,
        metadata: { finalState: 'COMPLETED', amount: transaction.amount },
      });

      return res.status(200).json({
        success: true,
        message: 'Transaction successfully authorized, cryptographically verified, and completed!',
        data: {
          transaction,
          reconstruction: {
            isVerified: true,
            reconstructedDataUrl: combined.reconstructedDataUrl,
          },
        },
      });
    } else {
      await transaction.save();
      return res.status(200).json({
        success: true,
        message: 'Authorization logged. Waiting for remaining signers.',
        data: { transaction },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a joint transaction
 * @route   POST /api/transactions/:id/reject
 * @access  Private
 */
const rejectJointTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
        code: 'TRANSACTION_NOT_FOUND',
      });
    }

    if (transaction.state !== 'AWAITING_AUTHORIZATION') {
      return res.status(400).json({
        success: false,
        message: `Transaction cannot be rejected in '${transaction.state}' state.`,
        code: 'INVALID_TRANSACTION_STATE',
      });
    }

    const authEntry = transaction.authorizations.find(
      (a) => a.userId.toString() === req.user._id.toString()
    );

    if (!authEntry && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not an authorized signer for this transaction.',
        code: 'UNAUTHORIZED_REJECT',
      });
    }

    if (authEntry) {
      authEntry.status = 'REJECTED';
      authEntry.authorizedAt = new Date();
    }

    transition(transaction, 'REJECTED');
    await transaction.save();

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'TRANSACTION_REJECTED',
      transactionId: transaction.transactionId,
      result: 'SUCCESS',
      req,
    });

    await logSecurityEvent({
      eventType: 'REJECTED_TRANSACTION',
      severity: 'LOW',
      userId: req.user._id,
      transactionId: transaction.transactionId,
      req,
    });

    res.status(200).json({
      success: true,
      message: 'Transaction has been rejected and cancelled.',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  getPendingAuthorizations,
  authorizeJointTransaction,
  rejectJointTransaction,
};
