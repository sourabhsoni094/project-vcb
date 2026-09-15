const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  decomposeImage,
  reconstructSecret,
  getSampleDemo,
} = require('../controllers/visualCryptoController');

// Visual Cryptography Demo routes (can be accessed by evaluators/users)
router.post('/decompose', upload.single('image'), decomposeImage);
router.post('/reconstruct', reconstructSecret);
router.get('/sample', getSampleDemo);

module.exports = router;
