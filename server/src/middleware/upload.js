const multer = require('multer');

// Store files in memory buffer to eliminate disk-based path traversal attacks
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file format. Only PNG, JPEG, and JPG images are accepted.'),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024, // 4MB max limit
  },
  fileFilter,
});

module.exports = upload;
