const request = require('supertest');
const app = require('../src/app');
const store = require('../src/db/jsonStore');
const User = require('../src/models/User');
const Account = require('../src/models/Account');

let tokenA, tokenB, tokenIntruder;
let userA, userB, userIntruder;
let jointAccount, receiverAccount;

beforeAll(async () => {
  store.reset();

  // Create User A
  userA = await User.create({
    name: 'Alice',
    email: 'alice@bank.org',
    password: 'Password123!',
    role: 'customer',
  });
  const resA = await request(app)
    .post('/api/auth/login')
    .send({ email: 'alice@bank.org', password: 'Password123!' });
  tokenA = resA.body.data.token;

  // Create User B
  userB = await User.create({
    name: 'Bob',
    email: 'bob@bank.org',
    password: 'Password123!',
    role: 'customer',
  });
  const resB = await request(app)
    .post('/api/auth/login')
    .send({ email: 'bob@bank.org', password: 'Password123!' });
  tokenB = resB.body.data.token;

  // Create Intruder
  userIntruder = await User.create({
    name: 'Mallory',
    email: 'mallory@dark.org',
    password: 'Password123!',
    role: 'customer',
  });
  const resIntruder = await request(app)
    .post('/api/auth/login')
    .send({ email: 'mallory@dark.org', password: 'Password123!' });
  tokenIntruder = resIntruder.body.data.token;

  // Joint account owned by Alice and Bob
  jointAccount = await Account.create({
    accountNumber: '1000005555',
    accountType: 'joint',
    owners: [userA._id, userB._id],
    balance: 100000,
  });

  // Separate recipient account
  receiverAccount = await Account.create({
    accountNumber: '1000006666',
    accountType: 'individual',
    owners: [userIntruder._id],
    balance: 5000,
  });
});

describe('Joint Account Visual Cryptography Authorization Suite', () => {
  let createdTransactionId;

  test('Step 1: User A initiates ₹50,000 joint transfer -> creates VC shares & AWAITING_AUTHORIZATION', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        senderAccountId: jointAccount._id,
        receiverAccountNumber: receiverAccount.accountNumber,
        amount: 50000,
        description: 'Joint authorization research demo',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.state).toBe('AWAITING_AUTHORIZATION');
    expect(res.body.data.userSharePreview).toBeDefined();

    createdTransactionId = res.body.data.transaction._id;

    // Verify balance is NOT deducted yet
    const acc = await Account.findById(jointAccount._id);
    expect(acc.balance).toBe(100000);
  });

  test('Step 2: Unauthorized user cannot authorize the joint transaction', async () => {
    const res = await request(app)
      .post(`/api/transactions/${createdTransactionId}/authorize`)
      .set('Authorization', `Bearer ${tokenIntruder}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED_SIGNER');
  });

  test('Step 3: User B authorizes transaction -> XOR combines shares, verifies secret, completes transfer', async () => {
    const res = await request(app)
      .post(`/api/transactions/${createdTransactionId}/authorize`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.transaction.state).toBe('COMPLETED');
    expect(res.body.data.reconstruction.isVerified).toBe(true);

    // Verify balances updated
    const updatedJoint = await Account.findById(jointAccount._id);
    const updatedReceiver = await Account.findById(receiverAccount._id);

    expect(updatedJoint.balance).toBe(50000);
    expect(updatedReceiver.balance).toBe(55000);
  });

  test('Step 4: Duplicate authorization is rejected', async () => {
    const res = await request(app)
      .post(`/api/transactions/${createdTransactionId}/authorize`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
