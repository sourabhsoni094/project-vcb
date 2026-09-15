const visualCryptoService = require('../services/visualCryptoService');
const { logAudit } = require('../services/auditService');

/**
 * @desc    Decompose an image into 2 Visual Cryptography Shares
 * @route   POST /api/visual-crypto/decompose
 * @access  Public / Private
 */
const decomposeImage = async (req, res, next) => {
  try {
    let imageBuffer;

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.imageBase64) {
      imageBuffer = visualCryptoService.dataURLToBuffer(req.body.imageBase64);
    } else {
      // Generate sample image if none provided
      const sample = await visualCryptoService.generateTransactionSecretGraphic('DEMO-SAMPLE', 50000);
      imageBuffer = sample.binaryBuffer;
    }

    const result = await visualCryptoService.decomposeUploadedImage(imageBuffer);

    res.status(200).json({
      success: true,
      message: 'Visual Cryptography shares generated successfully via 2-out-of-2 XOR scheme.',
      data: {
        original: result.original,
        shareA: {
          dataUrl: result.shareA.dataUrl,
        },
        shareB: {
          dataUrl: result.shareB.dataUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reconstruct secret from two visual shares using bitwise XOR
 * @route   POST /api/visual-crypto/reconstruct
 * @access  Public / Private
 */
const reconstructSecret = async (req, res, next) => {
  try {
    const { shareA, shareB, expectedHash } = req.body;

    if (!shareA || !shareB) {
      return res.status(400).json({
        success: false,
        message: 'Both Share A and Share B are required for XOR reconstruction.',
        code: 'MISSING_SHARES',
      });
    }

    const combined = await visualCryptoService.combineShares(shareA, shareB);

    let verification = { isMatch: true };
    if (expectedHash) {
      verification = visualCryptoService.verifyReconstruction(
        combined.rawReconstructed,
        expectedHash
      );
    }

    res.status(200).json({
      success: true,
      message: 'Shares combined using bitwise XOR successfully.',
      data: {
        reconstructedDataUrl: combined.reconstructedDataUrl,
        width: combined.width,
        height: combined.height,
        verification,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get sample demo secret with pre-split shares
 * @route   GET /api/visual-crypto/sample
 * @access  Public / Private
 */
const getSampleDemo = async (req, res, next) => {
  try {
    const sample = await visualCryptoService.generateTransactionSecretGraphic(
      'ACADEMIC-DEMO',
      100000
    );
    const shares = visualCryptoService.generateSharesFromBinary(
      sample.rawBinary,
      sample.width,
      sample.height
    );

    res.status(200).json({
      success: true,
      data: {
        original: {
          dataUrl: sample.binaryDataUrl,
          hash: sample.hash,
          width: sample.width,
          height: sample.height,
        },
        shareA: {
          dataUrl: shares.shareA.dataUrl,
        },
        shareB: {
          dataUrl: shares.shareB.dataUrl,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  decomposeImage,
  reconstructSecret,
  getSampleDemo,
};
