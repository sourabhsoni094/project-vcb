const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccountById,
  getAccountBalance,
  createAccount,
  simulateDeposit,
} = require('../controllers/accountController');
const { protect } = require('../middleware/auth');

router.use(protect); // All account routes require authentication

router.route('/').get(getAccounts).post(createAccount);
router.route('/:id').get(getAccountById);
router.route('/:id/balance').get(getAccountBalance);
router.route('/:id/deposit').post(simulateDeposit);

module.exports = router;
