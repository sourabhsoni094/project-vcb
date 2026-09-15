const store = require('../db/jsonStore');

class TransactionDocument {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = store.generateId();
    }
    if (!this.authorizations) {
      this.authorizations = [];
    }
  }

  toObject() {
    return { ...this };
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    // Normalize references
    const storageCopy = { ...this };
    if (storageCopy.senderAccount && storageCopy.senderAccount._id) {
      storageCopy.senderAccount = storageCopy.senderAccount._id;
    }
    if (storageCopy.receiverAccount && storageCopy.receiverAccount._id) {
      storageCopy.receiverAccount = storageCopy.receiverAccount._id;
    }
    if (storageCopy.initiatedBy && storageCopy.initiatedBy._id) {
      storageCopy.initiatedBy = storageCopy.initiatedBy._id;
    }

    const idx = store.data.transactions.findIndex((t) => t._id === this._id);
    if (idx !== -1) {
      store.data.transactions[idx] = storageCopy;
    } else {
      store.data.transactions.push(storageCopy);
    }
    store.save();
    return this;
  }
}

class TransactionQuery {
  constructor(promise) {
    this.promise = promise;
  }
  populate(field, select) {
    this.promise = this.promise.then((result) => {
      if (!result) return result;

      const populateOne = (tx) => {
        if (field === 'senderAccount') {
          const accId = tx.senderAccount && tx.senderAccount._id ? tx.senderAccount._id : tx.senderAccount;
          const acc = store.data.accounts.find((a) => a._id === accId);
          if (acc) {
            tx.senderAccount = {
              _id: acc._id,
              accountNumber: acc.accountNumber,
              accountType: acc.accountType,
              maskedAccountNumber: `XXXX XXXX ${acc.accountNumber?.slice(-4)}`,
              owners: acc.owners,
              balance: acc.balance,
            };
          }
        }
        if (field === 'receiverAccount') {
          const accId = tx.receiverAccount && tx.receiverAccount._id ? tx.receiverAccount._id : tx.receiverAccount;
          const acc = store.data.accounts.find((a) => a._id === accId);
          if (acc) {
            tx.receiverAccount = {
              _id: acc._id,
              accountNumber: acc.accountNumber,
              accountType: acc.accountType,
              maskedAccountNumber: `XXXX XXXX ${acc.accountNumber?.slice(-4)}`,
              owners: acc.owners,
              balance: acc.balance,
            };
          }
        }
        if (field === 'initiatedBy') {
          const uId = tx.initiatedBy && tx.initiatedBy._id ? tx.initiatedBy._id : tx.initiatedBy;
          const u = store.data.users.find((user) => user._id === uId);
          if (u) {
            tx.initiatedBy = { _id: u._id, name: u.name, email: u.email, role: u.role };
          }
        }
        if (field === 'authorizations.userId' && Array.isArray(tx.authorizations)) {
          tx.authorizations = tx.authorizations.map((auth) => {
            const uId = auth.userId && auth.userId._id ? auth.userId._id : auth.userId;
            const u = store.data.users.find((user) => user._id === uId);
            return {
              ...auth,
              userId: u ? { _id: u._id, name: u.name, email: u.email } : auth.userId,
            };
          });
        }
        return tx;
      };

      if (Array.isArray(result)) {
        return result.map(populateOne);
      }
      return populateOne(result);
    });
    return this;
  }
  sort(criteria) {
    this.promise = this.promise.then((list) => {
      if (!Array.isArray(list)) return list;
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    return this;
  }
  limit(n) {
    this.promise = this.promise.then((list) => (Array.isArray(list) ? list.slice(0, n) : list));
    return this;
  }
  then(resolve, reject) {
    return this.promise.then(resolve, reject);
  }
}

const Transaction = {
  async create(data) {
    const now = new Date().toISOString();
    const authorizations = Array.isArray(data.authorizations)
      ? data.authorizations.map((a) => ({
          userId: a.userId && a.userId._id ? a.userId._id : a.userId,
          status: a.status || 'PENDING',
          authorizedAt: a.authorizedAt || null,
          shareProvided: a.shareProvided || false,
        }))
      : [];

    const tx = new TransactionDocument({
      _id: store.generateId(),
      transactionId: data.transactionId,
      senderAccount: data.senderAccount && data.senderAccount._id ? data.senderAccount._id : data.senderAccount,
      receiverAccount: data.receiverAccount && data.receiverAccount._id ? data.receiverAccount._id : data.receiverAccount,
      amount: Number(data.amount),
      transactionType: data.transactionType || 'normal',
      state: data.state || 'PENDING',
      initiatedBy: data.initiatedBy && data.initiatedBy._id ? data.initiatedBy._id : data.initiatedBy,
      description: data.description || 'Funds Transfer',
      secretVisualHash: data.secretVisualHash || null,
      authorizations,
      expiresAt: data.expiresAt || null,
      createdAt: now,
      updatedAt: now,
    });

    store.data.transactions.push({ ...tx });
    store.save();
    return tx;
  },

  findOne(query = {}) {
    const p = Promise.resolve().then(() => {
      const match = store.data.transactions.find((t) => store.matches(t, query));
      return match ? new TransactionDocument(match) : null;
    });
    return new TransactionQuery(p);
  },

  findById(id) {
    return this.findOne({ _id: id });
  },

  find(query = {}) {
    const p = Promise.resolve().then(() => {
      return store.data.transactions
        .filter((t) => store.matches(t, query))
        .map((t) => new TransactionDocument(t));
    });
    return new TransactionQuery(p);
  },

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      store.data.transactions = [];
    } else {
      store.data.transactions = store.data.transactions.filter((t) => !store.matches(t, query));
    }
    store.save();
    return { acknowledged: true };
  },

  async countDocuments(query = {}) {
    return store.data.transactions.filter((t) => store.matches(t, query)).length;
  },
};

module.exports = Transaction;
