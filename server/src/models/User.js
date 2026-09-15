const bcrypt = require('bcryptjs');
const store = require('../db/jsonStore');

class UserDocument {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = store.generateId();
    }
  }

  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  isLocked() {
    return !!(this.lockUntil && new Date(this.lockUntil) > new Date());
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    const idx = store.data.users.findIndex((u) => u._id === this._id);
    if (idx !== -1) {
      store.data.users[idx] = { ...this };
    } else {
      store.data.users.push({ ...this });
    }
    store.save();
    return this;
  }

  toJSON() {
    const copy = { ...this };
    delete copy.password;
    return copy;
  }
}

class Query {
  constructor(promise) {
    this.promise = promise;
  }
  select() {
    return this;
  }
  populate() {
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
  skip(n) {
    this.promise = this.promise.then((list) => (Array.isArray(list) ? list.slice(n) : list));
    return this;
  }
  then(resolve, reject) {
    return this.promise.then(resolve, reject);
  }
}

const User = {
  async create(data) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);
    const now = new Date().toISOString();

    const user = new UserDocument({
      _id: store.generateId(),
      name: data.name,
      email: data.email.toLowerCase(),
      password: passwordHash,
      role: data.role || 'customer',
      status: data.status || 'active',
      failedLoginAttempts: data.failedLoginAttempts || 0,
      lockUntil: data.lockUntil || null,
      createdAt: now,
      updatedAt: now,
    });

    store.data.users.push({ ...user });
    store.save();
    return user;
  },

  findOne(query = {}) {
    const p = Promise.resolve().then(() => {
      const match = store.data.users.find((u) => store.matches(u, query));
      return match ? new UserDocument(match) : null;
    });
    return new Query(p);
  },

  findById(id) {
    return this.findOne({ _id: id });
  },

  find(query = {}) {
    const p = Promise.resolve().then(() => {
      return store.data.users
        .filter((u) => store.matches(u, query))
        .map((u) => new UserDocument(u));
    });
    return new Query(p);
  },

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      store.data.users = [];
    } else {
      store.data.users = store.data.users.filter((u) => !store.matches(u, query));
    }
    store.save();
    return { acknowledged: true };
  },

  async countDocuments(query = {}) {
    return store.data.users.filter((u) => store.matches(u, query)).length;
  },
};

module.exports = User;
