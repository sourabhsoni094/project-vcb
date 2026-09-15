const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  getPendingAuthorizations,
  authorizeJointTransaction,
  rejectJointTransaction,
} = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

router.use(protect); // All transaction routes require authentication

router.route('/').get(getTransactions).post(createTransaction);
router.get('/pending-authorizations', getPendingAuthorizations);
router.route('/:id').get(getTransactionById);
router.post('/:id/authorize', authorizeJointTransaction);
router.post('/:id/reject', rejectJointTransaction);

module.exports = router;
