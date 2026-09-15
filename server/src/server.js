require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`
======================================================
  SECUREBANK-VC BACKEND ENGINE STARTED
  Mode: ${process.env.NODE_ENV || 'development'}
  Listening on: http://localhost:${PORT}
  Visual Cryptography: Node.js 2-out-of-2 XOR Engine
======================================================
      `);
    });

    // Handle Unhandled Rejections & Exceptions
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      // Close server & exit process in severe cases
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
