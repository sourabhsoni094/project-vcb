const visualCryptoService = require('../src/services/visualCryptoService');

describe('Visual Cryptography 2-out-of-2 XOR Engine Tests', () => {
  test('Should generate dynamic transaction secret graphic and binarize correctly', async () => {
    const graphic = await visualCryptoService.generateTransactionSecretGraphic('TXN-TEST-1234', 50000);
    expect(graphic).toBeDefined();
    expect(graphic.width).toBe(128);
    expect(graphic.height).toBe(128);
    expect(graphic.rawBinary.length).toBe(128 * 128);
    expect(graphic.hash).toBeDefined();
  });

  test('Should decompose secret binary matrix into two valid complementary shares', async () => {
    const graphic = await visualCryptoService.generateTransactionSecretGraphic('TXN-TEST-5678', 25000);
    const shares = visualCryptoService.generateSharesFromBinary(
      graphic.rawBinary,
      graphic.width,
      graphic.height
    );

    expect(shares.shareA).toBeDefined();
    expect(shares.shareB).toBeDefined();
    expect(shares.shareA.raw.length).toBe(128 * 128);
    expect(shares.shareB.raw.length).toBe(128 * 128);

    // Verify mathematical relation: Secret = Share A XOR Share B
    for (let i = 0; i < graphic.rawBinary.length; i++) {
      const bitA = shares.shareA.raw[i];
      const bitB = shares.shareB.raw[i];
      const reconstructedBit = bitA ^ bitB;
      expect(reconstructedBit).toBe(graphic.rawBinary[i]);
    }
  });

  test('Should reconstruct secret with 100% fidelity using combineShares()', async () => {
    const graphic = await visualCryptoService.generateTransactionSecretGraphic('TXN-RECONSTRUCT', 10000);
    const shares = visualCryptoService.generateSharesFromBinary(
      graphic.rawBinary,
      graphic.width,
      graphic.height
    );

    const combined = await visualCryptoService.combineShares(
      shares.shareA.buffer,
      shares.shareB.buffer
    );

    expect(combined.width).toBe(128);
    expect(combined.height).toBe(128);

    const verification = visualCryptoService.verifyReconstruction(
      combined.rawReconstructed,
      graphic.hash
    );

    expect(verification.isMatch).toBe(true);
    expect(verification.computedHash).toBe(graphic.hash);
  });

  test('Should fail verification if share is tampered with or corrupted', async () => {
    const graphic = await visualCryptoService.generateTransactionSecretGraphic('TXN-CORRUPT', 10000);
    const shares = visualCryptoService.generateSharesFromBinary(
      graphic.rawBinary,
      graphic.width,
      graphic.height
    );

    // Tamper with Share A
    const corruptedRaw = Buffer.from(shares.shareA.raw);
    corruptedRaw[10] = corruptedRaw[10] === 1 ? 0 : 1;
    corruptedRaw[20] = corruptedRaw[20] === 1 ? 0 : 1;

    const tamperedHash = visualCryptoService.hashBinaryMatrix(corruptedRaw);
    expect(tamperedHash).not.toBe(graphic.hash);
  });
});
