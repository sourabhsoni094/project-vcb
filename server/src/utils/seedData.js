require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const VisualShare = require('../models/VisualShare');
const AuditLog = require('../models/AuditLog');
const SecurityEvent = require('../models/SecurityEvent');

const seedDatabase = async () => {
  try {
    console.log('🌱 Connecting to database for seeding...');
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Account.deleteMany({}),
      Transaction.deleteMany({}),
      VisualShare.deleteMany({}),
      AuditLog.deleteMany({}),
      SecurityEvent.deleteMany({}),
    ]);

    console.log('👤 Seeding Users...');
    // Create Admin
    const admin = await User.create({
      name: 'Bank Administrator',
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      role: 'admin',
      status: 'active',
    });

    // Create User A
    const userA = await User.create({
      name: 'Alice Henderson (User A)',
      email: 'usera@example.com',
      password: 'UserA@12345',
      role: 'customer',
      status: 'active',
    });

    // Create User B
    const userB = await User.create({
      name: 'Bob Montgomery (User B)',
      email: 'userb@example.com',
      password: 'UserB@12345',
      role: 'customer',
      status: 'active',
    });

    console.log('🏦 Seeding Bank Accounts...');
    // 1. Joint Account owned by Alice and Bob with ₹100,000
    const jointAccount = await Account.create({
      accountNumber: '1000001234',
      accountType: 'joint',
      owners: [userA._id, userB._id],
      balance: 100000,
      status: 'active',
    });

    // 2. Individual Account for User A
    const accountA = await Account.create({
      accountNumber: '1000004321',
      accountType: 'individual',
      owners: [userA._id],
      balance: 25000,
      status: 'active',
    });

    // 3. Individual Account for User B
    const accountB = await Account.create({
      accountNumber: '1000008899',
      accountType: 'individual',
      owners: [userB._id],
      balance: 15000,
      status: 'active',
    });

    console.log('💳 Seeding Initial Transactions...');
    const pastTx1 = await Transaction.create({
      transactionId: 'TXN-INIT-0001',
      senderAccount: accountA._id,
      receiverAccount: jointAccount._id,
      amount: 5000,
      transactionType: 'normal',
      state: 'COMPLETED',
      initiatedBy: userA._id,
      description: 'Initial joint account contribution',
    });

    console.log('📋 Seeding Audit Trail & Security Events...');
    await AuditLog.create([
      {
        userId: admin._id,
        userEmail: admin.email,
        action: 'LOGIN_SUCCESS',
        result: 'SUCCESS',
        metadata: { client: 'Chrome 124.0 / Win11' },
      },
      {
        userId: userA._id,
        userEmail: userA.email,
        action: 'TRANSACTION_CREATED',
        transactionId: pastTx1.transactionId,
        result: 'SUCCESS',
        metadata: { amount: 5000, type: 'normal' },
      },
    ]);

    await SecurityEvent.create([
      {
        eventType: 'FAILED_LOGIN',
        severity: 'LOW',
        userEmail: 'unauthorized_attacker@darkweb.org',
        details: { reason: 'Incorrect credentials for unknown identity' },
      },
    ]);

    console.log(`
======================================================
  ✅ DATABASE SEEDED SUCCESSFULLY!
======================================================
  Demo Credentials:
  - Admin:  admin@example.com / AdminPassword123!
  - User A: usera@example.com / UserA@12345
  - User B: userb@example.com / UserB@12345

  Accounts:
  - Joint Account (User A & B): 1000001234  Balance: ₹100,000
  - Alice's Account (User A):   1000004321  Balance: ₹25,000
  - Bob's Account (User B):     1000008899  Balance: ₹15,000
======================================================
    `);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
