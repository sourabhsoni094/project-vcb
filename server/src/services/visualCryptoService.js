const crypto = require('crypto');
const { PNG } = require('pngjs');

/**
 * Visual Cryptography Engine based on 2-out-of-2 XOR Secret Sharing
 * Research paper: "Visual Cryptography and Image Processing Based Approach for Secure Transactions in Banking Sector"
 * (Jain & Soni, TEL-NET 2017)
 */

const DEFAULT_WIDTH = 128;
const DEFAULT_HEIGHT = 128;

/**
 * Parse an image buffer (PNG) using pngjs
 */
const parsePNG = (buffer) => {
  return new Promise((resolve, reject) => {
    new PNG().parse(buffer, (err, data) => {
      if (err) return reject(new Error(`Invalid PNG image: ${err.message}`));
      resolve(data);
    });
  });
};

/**
 * Encode a PNG instance into a Buffer
 */
const encodePNG = (png) => {
  return PNG.sync.write(png);
};

/**
 * Convert PNG buffer to base64 Data URL
 */
const bufferToDataURL = (buffer, mimeType = 'image/png') => {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

/**
 * Convert Data URL back to Buffer
 */
const dataURLToBuffer = (dataUrl) => {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return Buffer.from(dataUrl, 'base64');
  }
  return Buffer.from(matches[2], 'base64');
};

/**
 * Preprocess and binarize a PNG image:
 * Converts to grayscale, applies thresholding (threshold = 128).
 * Black pixel = 0, White pixel = 255.
 */
const binarizePNG = (pngImage, threshold = 128) => {
  const { width, height, data } = pngImage;
  const binaryPNG = new PNG({ width, height });
  const rawBinary = Buffer.alloc(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Luminance conversion (Rec. 601)
      const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      const val = gray >= threshold ? 255 : 0;

      const binIdx = width * y + x;
      rawBinary[binIdx] = val === 255 ? 1 : 0; // 1 for white, 0 for black

      binaryPNG.data[idx] = val;
      binaryPNG.data[idx + 1] = val;
      binaryPNG.data[idx + 2] = val;
      binaryPNG.data[idx + 3] = 255; // Alpha opaque
    }
  }

  return {
    binaryPNG,
    binaryBuffer: encodePNG(binaryPNG),
    rawBinary,
    width,
    height,
  };
};

/**
 * Generate Visual Cryptography Shares (Share A & Share B)
 * Using Cryptographically Secure PRNG (crypto.randomBytes)
 * Share A: Random binary bits {0, 1}
 * Share B = Secret XOR Share A
 */
const generateSharesFromBinary = (rawBinary, width, height) => {
  const totalPixels = width * height;
  const shareA_PNG = new PNG({ width, height });
  const shareB_PNG = new PNG({ width, height });

  // Cryptographically secure random bytes for Share A
  const randomBytes = crypto.randomBytes(totalPixels);

  const rawShareA = Buffer.alloc(totalPixels);
  const rawShareB = Buffer.alloc(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    // 50% probability 0 or 1 using CSPRNG
    const bitA = (randomBytes[i] & 1) === 1 ? 1 : 0;
    const secretBit = rawBinary[i];
    
    // XOR Relationship: Secret = Share A XOR Share B => Share B = Secret XOR Share A
    const bitB = secretBit ^ bitA;

    rawShareA[i] = bitA;
    rawShareB[i] = bitB;

    const idx = i << 2;
    // Share A visual pixel: 1 => White (255), 0 => Black (0)
    const valA = bitA === 1 ? 255 : 0;
    shareA_PNG.data[idx] = valA;
    shareA_PNG.data[idx + 1] = valA;
    shareA_PNG.data[idx + 2] = valA;
    shareA_PNG.data[idx + 3] = 255;

    // Share B visual pixel
    const valB = bitB === 1 ? 255 : 0;
    shareB_PNG.data[idx] = valB;
    shareB_PNG.data[idx + 1] = valB;
    shareB_PNG.data[idx + 2] = valB;
    shareB_PNG.data[idx + 3] = 255;
  }

  const shareABuffer = encodePNG(shareA_PNG);
  const shareBBuffer = encodePNG(shareB_PNG);

  return {
    shareA: {
      buffer: shareABuffer,
      dataUrl: bufferToDataURL(shareABuffer),
      raw: rawShareA,
    },
    shareB: {
      buffer: shareBBuffer,
      dataUrl: bufferToDataURL(shareBBuffer),
      raw: rawShareB,
    },
  };
};

/**
 * Combine two shares using bitwise XOR
 * Reconstructed = Share A XOR Share B
 */
const combineShares = async (shareABufferOrUrl, shareBBufferOrUrl) => {
  const bufA = Buffer.isBuffer(shareABufferOrUrl)
    ? shareABufferOrUrl
    : dataURLToBuffer(shareABufferOrUrl);
  const bufB = Buffer.isBuffer(shareBBufferOrUrl)
    ? shareBBufferOrUrl
    : dataURLToBuffer(shareBBufferOrUrl);

  const [pngA, pngB] = await Promise.all([parsePNG(bufA), parsePNG(bufB)]);

  if (pngA.width !== pngB.width || pngA.height !== pngB.height) {
    throw new Error('Dimensions of Share A and Share B must match exactly for XOR reconstruction');
  }

  const { width, height } = pngA;
  const reconstructedPNG = new PNG({ width, height });
  const totalPixels = width * height;
  const rawReconstructed = Buffer.alloc(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const idx = i << 2;

    // Extract bit from Share A and Share B (threshold at 128)
    const bitA = pngA.data[idx] >= 128 ? 1 : 0;
    const bitB = pngB.data[idx] >= 128 ? 1 : 0;

    // Bitwise XOR: 1 ^ 1 = 0, 0 ^ 0 = 0, 1 ^ 0 = 1, 0 ^ 1 = 1
    const reconstructedBit = bitA ^ bitB;
    rawReconstructed[i] = reconstructedBit;

    const val = reconstructedBit === 1 ? 255 : 0;
    reconstructedPNG.data[idx] = val;
    reconstructedPNG.data[idx + 1] = val;
    reconstructedPNG.data[idx + 2] = val;
    reconstructedPNG.data[idx + 3] = 255;
  }

  const reconstructedBuffer = encodePNG(reconstructedPNG);

  return {
    reconstructedBuffer,
    reconstructedDataUrl: bufferToDataURL(reconstructedBuffer),
    rawReconstructed,
    width,
    height,
  };
};

/**
 * Calculate SHA-256 fingerprint of raw binary matrix
 */
const hashBinaryMatrix = (rawBinary) => {
  return crypto.createHash('sha256').update(rawBinary).digest('hex');
};

/**
 * Compare reconstructed raw bits against secret hash or original raw bits
 */
const verifyReconstruction = (reconstructedRaw, expectedHash) => {
  const computedHash = hashBinaryMatrix(reconstructedRaw);
  const isMatch = computedHash === expectedHash;
  return {
    isMatch,
    computedHash,
    expectedHash,
  };
};

/**
 * Generate a deterministic high-contrast dynamic security secret for a transaction
 * Draws an authorization badge / glyph containing transaction details and verification code
 */
const generateTransactionSecretGraphic = async (transactionId, amount, timestamp = Date.now()) => {
  const width = DEFAULT_WIDTH;
  const height = DEFAULT_HEIGHT;
  const png = new PNG({ width, height });

  // Simple clean cryptographic watermarking pattern based on transaction parameters
  const seed = crypto
    .createHash('sha256')
    .update(`${transactionId}-${amount}-${timestamp}`)
    .digest();

  // Create high-contrast geometric cryptographic watermark pattern
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;

      // Outer border
      const isBorder = x < 4 || x >= width - 4 || y < 4 || y >= height - 4;
      
      // Inner concentric security frame
      const isFrame = (x >= 8 && x < 12) || (x >= width - 12 && x < width - 8) ||
                      (y >= 8 && y < 12) || (y >= height - 12 && y < height - 8);

      // Center security glyph modulated by seed bytes
      const seedByte = seed[(x + y * 7) % seed.length];
      const isGlyph = (seedByte & 0x01) === 1;

      // Key security identifier cross
      const isCross = (Math.abs(x - width / 2) < 3 && y > 20 && y < height - 20) ||
                      (Math.abs(y - height / 2) < 3 && x > 20 && x < width - 20);

      const isWhite = isBorder || isFrame || isCross || isGlyph;
      const val = isWhite ? 255 : 0;

      png.data[idx] = val;
      png.data[idx + 1] = val;
      png.data[idx + 2] = val;
      png.data[idx + 3] = 255;
    }
  }

  const binaryBuffer = encodePNG(png);
  const binarized = binarizePNG(png);

  return {
    binaryBuffer,
    binaryDataUrl: bufferToDataURL(binaryBuffer),
    rawBinary: binarized.rawBinary,
    hash: hashBinaryMatrix(binarized.rawBinary),
    width,
    height,
  };
};

/**
 * End-to-end decomposition of any uploaded PNG image buffer
 */
const decomposeUploadedImage = async (imageBuffer) => {
  const parsed = await parsePNG(imageBuffer);
  const binarized = binarizePNG(parsed);
  const shares = generateSharesFromBinary(binarized.rawBinary, binarized.width, binarized.height);
  const hash = hashBinaryMatrix(binarized.rawBinary);

  return {
    original: {
      width: binarized.width,
      height: binarized.height,
      binaryDataUrl: bufferToDataURL(binarized.binaryBuffer),
      hash,
    },
    shareA: shares.shareA,
    shareB: shares.shareB,
    rawBinary: binarized.rawBinary,
  };
};

module.exports = {
  binarizePNG,
  generateSharesFromBinary,
  combineShares,
  hashBinaryMatrix,
  verifyReconstruction,
  generateTransactionSecretGraphic,
  decomposeUploadedImage,
  bufferToDataURL,
  dataURLToBuffer,
  parsePNG,
  encodePNG,
};
