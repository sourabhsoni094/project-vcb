const store = require('../db/jsonStore');

class AuditLogQuery {
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
  skip(n) {
    this.promise = this.promise.then((list) => (Array.isArray(list) ? list.slice(n) : list));
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

const AuditLog = {
  async create(data) {
    const items = Array.isArray(data) ? data : [data];
    const created = items.map((d) => ({
      _id: store.generateId(),
      userId: d.userId,
      userEmail: d.userEmail,
      action: d.action,
      transactionId: d.transactionId,
      result: d.result || 'SUCCESS',
      ipAddress: d.ipAddress || '127.0.0.1',
      userAgent: d.userAgent || 'System',
      metadata: d.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    store.data.audit_logs.push(...created);
    store.save();
    return Array.isArray(data) ? created : created[0];
  },

  find(query = {}) {
    const p = Promise.resolve().then(() => {
      return store.data.audit_logs.filter((log) => {
        for (const [k, v] of Object.entries(query)) {
          if (log[k] !== v) return false;
        }
        return true;
      });
    });
    return new AuditLogQuery(p);
  },

  async countDocuments(query = {}) {
    return store.data.audit_logs.filter((log) => {
      for (const [k, v] of Object.entries(query)) {
        if (log[k] !== v) return false;
      }
      return true;
    }).length;
  },

  async deleteMany(query = {}) {
    store.data.audit_logs = [];
    store.save();
    return { acknowledged: true };
  },
};

module.exports = AuditLog;
