const express = require('express');
const router = express.Router();
const {
  getSystemStats,
  getAllUsers,
  getAllAccounts,
  toggleFreezeAccount,
  getAllTransactions,
  getAuditLogs,
  getSecurityEvents,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Protect all admin endpoints and enforce admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.get('/accounts', getAllAccounts);
router.patch('/accounts/:id/freeze', toggleFreezeAccount);
router.get('/transactions', getAllTransactions);
router.get('/audit-logs', getAuditLogs);
router.get('/security-events', getSecurityEvents);

module.exports = router;
