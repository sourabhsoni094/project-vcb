const store = require('../db/jsonStore');

class VisualShareDocument {
  constructor(data) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = store.generateId();
    }
  }

  async save() {
    this.updatedAt = new Date().toISOString();
    const idx = store.data.visual_shares.findIndex((s) => s._id === this._id);
    if (idx !== -1) {
      store.data.visual_shares[idx] = { ...this };
    } else {
      store.data.visual_shares.push({ ...this });
    }
    store.save();
    return this;
  }
}

class VisualShareQuery {
  constructor(promise) {
    this.promise = promise;
  }
  select() {
    return this;
  }
  then(resolve, reject) {
    return this.promise.then(resolve, reject);
  }
}

const VisualShare = {
  async create(data) {
    const now = new Date().toISOString();
    const share = new VisualShareDocument({
      _id: store.generateId(),
      transactionId: data.transactionId,
      userId: data.userId && data.userId._id ? data.userId._id : data.userId,
      shareType: data.shareType,
      status: data.status || 'PENDING',
      shareData: data.shareData,
      storageReference: data.storageReference || 'internal-vault',
      expiresAt: data.expiresAt || null,
      createdAt: now,
      updatedAt: now,
    });

    store.data.visual_shares.push({ ...share });
    store.save();
    return share;
  },

  findOne(query = {}) {
    const p = Promise.resolve().then(() => {
      const match = store.data.visual_shares.find((s) => store.matches(s, query));
      return match ? new VisualShareDocument(match) : null;
    });
    return new VisualShareQuery(p);
  },

  find(query = {}) {
    const p = Promise.resolve().then(() => {
      return store.data.visual_shares
        .filter((s) => store.matches(s, query))
        .map((s) => new VisualShareDocument(s));
    });
    return new VisualShareQuery(p);
  },

  async updateMany(query = {}, updates = {}) {
    store.data.visual_shares.forEach((s) => {
      if (store.matches(s, query)) {
        Object.assign(s, updates);
        s.updatedAt = new Date().toISOString();
      }
    });
    store.save();
    return { acknowledged: true };
  },

  async deleteMany(query = {}) {
    if (Object.keys(query).length === 0) {
      store.data.visual_shares = [];
    } else {
      store.data.visual_shares = store.data.visual_shares.filter((s) => !store.matches(s, query));
    }
    store.save();
    return { acknowledged: true };
  },
};

module.exports = VisualShare;
