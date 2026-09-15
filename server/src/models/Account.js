const store = require('../db/jsonStore');

class AccountDocument {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = store.generateId();
    }
  }

  get maskedAccountNumber() {
    if (!this.accountNumber) return '';
    const lastFour = this.accountNumber.slice(-4);
    return `XXXX XXXX ${lastFour}`;
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    // Normalize owners to IDs for storage
    const storageCopy = { ...this };
    if (Array.isArray(storageCopy.owners)) {
      storageCopy.owners = storageCopy.owners.map((o) => (o && o._id ? o._id : o));
    }

    const idx = store.data.accounts.findIndex((a) => a._id === this._id);
    if (idx !== -1) {
      store.data.accounts[idx] = storageCopy;
    } else {
      store.data.accounts.push(storageCopy);
    }
    store.save();
    return this;
  }

  toJSON() {
    const copy = { ...this };
    copy.maskedAccountNumber = this.maskedAccountNumber;
    return copy;
  }
}

class AccountQuery {
  constructor(promise) {
    this.promise = promise;
  }
  populate(field, select) {
    this.promise = this.promise.then((result) => {
      if (!result) return result;
      const populateOne = (acc) => {
        if (field === 'owners' && Array.isArray(acc.owners)) {
          acc.owners = acc.owners.map((ownerId) => {
            const rawId = ownerId && ownerId._id ? ownerId._id : ownerId;
            const u = store.data.users.find((user) => user._id === rawId);
            return u ? { _id: u._id, name: u.name, email: u.email, role: u.role, status: u.status } : { _id: rawId };
          });
        }
        return acc;
      };

      if (Array.isArray(result)) {
        return result.map(populateOne);
      }
      return populateOne(result);
    });
    return this;
  }
  select() {
    return this;
  }
  sort(criteria) {
    this.promise = this.promise.then((list) => {
      if (!Array.isArray(list)) return list;
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    });
    return this;
  }
  then(resolve, reject) {
    return this.promise.then(resolve, reject);
  }
}

const Account = {
  async create(data) {
    const now = new Date().toISOString();
    const owners = Array.isArray(data.owners)
      ? data.owners.map((o) => (o && o._id ? o._id : o))
      : [];

    const acc = new AccountDocument({
      _id: store.generateId(),
      accountNumber: data.accountNumber,
      accountType: data.accountType || 'individual',
      owners,
      balance: Number(data.balance) || 0,
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
    });

    store.data.accounts.push({ ...acc });
    store.save();
    return acc;
  },

  findOne(query = {}) {
    const p = Promise.resolve().then(() => {
      const match = store.data.accounts.find((a) => store.matches(a, query));
      return match ? new AccountDocument(match) : null;
    });
    return new AccountQuery(p);
  },

  findById(id) {
    return this.findOne({ _id: id });
  },

  find(query = {}) {
    const p = Promise.resolve().then(() => {
      return store.data.accounts
        .filter((a) => store.matches(a, query))
        .map((a) => new AccountDocument(a));
    });
    return new AccountQuery(p);
  },

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      store.data.accounts = [];
    } else {
      store.data.accounts = store.data.accounts.filter((a) => !store.matches(a, query));
    }
    store.save();
    return { acknowledged: true };
  },

  async countDocuments(query = {}) {
    return store.data.accounts.filter((a) => store.matches(a, query)).length;
  },
};

module.exports = Account;
