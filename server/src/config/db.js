const store = require('../db/jsonStore');

const connectDB = async () => {
  store.init();
  console.log(`✅ File-based JSON Database Engine initialized at: ${require('path').join(__dirname, '../../data/db.json')}`);
  return store;
};

const disconnectDB = async () => {
  store.save();
  console.log('🛑 JSON Database storage flushed and closed.');
};

module.exports = { connectDB, disconnectDB };
