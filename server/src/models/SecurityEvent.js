const store = require('../db/jsonStore');

class SecurityEventQuery {
  constructor(promise) {
    this.promise = promise;
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

const SecurityEvent = {
  async create(data) {
    const items = Array.isArray(data) ? data : [data];
    const created = items.map((d) => ({
      _id: store.generateId(),
      eventType: d.eventType,
      severity: d.severity || 'MEDIUM',
      userId: d.userId,
      userEmail: d.userEmail,
      transactionId: d.transactionId,
      ipAddress: d.ipAddress || '127.0.0.1',
      details: d.details || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    store.data.security_events.push(...created);
    store.save();
    return Array.isArray(data) ? created : created[0];
  },

  find(query = {}) {
    const p = Promise.resolve().then(() => {
      return store.data.security_events.filter((ev) => {
        for (const [k, v] of Object.entries(query)) {
          if (ev[k] !== v) return false;
        }
        return true;
      });
    });
    return new SecurityEventQuery(p);
  },

  async countDocuments(query = {}) {
    return store.data.security_events.filter((ev) => {
      for (const [k, v] of Object.entries(query)) {
        if (ev[k] !== v) return false;
      }
      return true;
    }).length;
  },

  async deleteMany(query = {}) {
    store.data.security_events = [];
    store.save();
    return { acknowledged: true };
  },
};

module.exports = SecurityEvent;
