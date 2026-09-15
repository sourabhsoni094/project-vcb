const request = require('supertest');
const app = require('../src/app');
const store = require('../src/db/jsonStore');
const User = require('../src/models/User');
const Account = require('../src/models/Account');
const { canTransition } = require('../src/services/transactionStateMachine');

let token;
let user;
let account1;
let account2;

beforeAll(async () => {
  store.reset();

  user = await User.create({
    name: 'Tester One',
    email: 'tester1@example.com',
    password: 'Password123!',
    role: 'customer',
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tester1@example.com', password: 'Password123!' });
  token = res.body.data.token;

  account1 = await Account.create({
    accountNumber: '1000000001',
    accountType: 'individual',
    owners: [user._id],
    balance: 50000,
  });

  account2 = await Account.create({
    accountNumber: '1000000002',
    accountType: 'individual',
    owners: [user._id],
    balance: 10000,
  });
});

describe('Banking Simulation and Transaction Tests', () => {
  test('POST /api/transactions should perform valid normal transfer', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        senderAccountId: account1._id,
        receiverAccountNumber: account2.accountNumber,
        amount: 5000,
        description: 'Test Transfer',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.state).toBe('COMPLETED');

    const updated1 = await Account.findById(account1._id);
    const updated2 = await Account.findById(account2._id);
    expect(updated1.balance).toBe(45000);
    expect(updated2.balance).toBe(15000);
  });

  test('POST /api/transactions should fail on insufficient balance', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        senderAccountId: account1._id,
        receiverAccountNumber: account2.accountNumber,
        amount: 9999999, // Exceeds balance
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INSUFFICIENT_BALANCE');
  });

  test('POST /api/transactions should fail when receiver account is invalid', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        senderAccountId: account1._id,
        receiverAccountNumber: '9999999999', // Nonexistent
        amount: 1000,
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('RECEIVER_ACCOUNT_NOT_FOUND');
  });

  test('Transaction State Machine must prevent illegal state transitions (COMPLETED -> PENDING)', () => {
    expect(canTransition('COMPLETED', 'PENDING')).toBe(false);
    expect(canTransition('COMPLETED', 'AUTHORIZED')).toBe(false);
    expect(canTransition('AWAITING_AUTHORIZATION', 'AUTHORIZED')).toBe(true);
    expect(canTransition('AUTHORIZED', 'PROCESSING')).toBe(true);
    expect(canTransition('PROCESSING', 'COMPLETED')).toBe(true);
  });
});
