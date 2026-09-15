const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Initial schema structure
const INITIAL_DATA = {
  users: [],
  accounts: [],
  transactions: [],
  visual_shares: [],
  audit_logs: [],
  security_events: [],
};

class JsonStore {
  constructor() {
    this.data = { ...INITIAL_DATA };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        for (const key of Object.keys(INITIAL_DATA)) {
          if (!this.data[key]) this.data[key] = [];
        }
      } catch (e) {
        console.warn('Corrupted or empty db.json, reinitializing...');
        this.save();
      }
    } else {
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving db.json:', err);
    }
  }

  reset() {
    this.data = {
      users: [],
      accounts: [],
      transactions: [],
      visual_shares: [],
      audit_logs: [],
      security_events: [],
    };
    this.save();
  }

  generateId() {
    return crypto.randomBytes(12).toString('hex');
  }

  // Generic query matcher
  matches(item, query = {}) {
    for (const [key, condition] of Object.entries(query)) {
      if (key === '$or' && Array.isArray(condition)) {
        const anyMatch = condition.some((cond) => this.matches(item, cond));
        if (!anyMatch) return false;
        continue;
      }

      const itemVal = item[key];

      if (condition && typeof condition === 'object' && !Array.isArray(condition) && !(condition instanceof Date)) {
        if ('$in' in condition) {
          const list = condition.$in.map((v) => (v && v.toString ? v.toString() : v));
          const valStr = itemVal && itemVal.toString ? itemVal.toString() : itemVal;
          if (!list.includes(valStr)) return false;
          continue;
        }
        if ('$elemMatch' in condition) {
          if (!Array.isArray(itemVal)) return false;
          const match = itemVal.some((sub) => this.matches(sub, condition.$elemMatch));
          if (!match) return false;
          continue;
        }
      }

      // Comparison
      const cStr = condition && condition.toString ? condition.toString() : condition;
      const iStr = itemVal && itemVal.toString ? itemVal.toString() : itemVal;
      if (Array.isArray(itemVal)) {
        const listStr = itemVal.map((v) => (v && v.toString ? v.toString() : v));
        if (!listStr.includes(cStr)) return false;
      } else if (iStr !== cStr) {
        return false;
      }
    }
    return true;
  }
}

const store = new JsonStore();
module.exports = store;
