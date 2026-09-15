import React, { useState } from 'react';
import {
  Binary,
  Upload,
  Sparkles,
  Combine,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowDown,
  RefreshCw,
  Cpu,
  Layers,
  FlaskConical,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const VisualCryptoDemo = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCombining, setIsCombining] = useState(false);

  // States for the 8-step pipeline
  const [originalData, setOriginalData] = useState(null);
  const [shareAData, setShareAData] = useState(null);
  const [shareBData, setShareBData] = useState(null);
  const [reconstructedData, setReconstructedData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const { success, error, info } = useToast();

  // 1. Load Academic Sample Pattern
  const handleLoadSample = async () => {
    setLoading(true);
    resetState();
    try {
      const res = await api.get('/visual-crypto/sample');
      if (res.data.success) {
        setOriginalData(res.data.data.original);
        setShareAData(res.data.data.shareA);
        setShareBData(res.data.data.shareB);
        success('Pre-split Banking Security Pattern loaded into memory.');
      }
    } catch (err) {
      error('Failed to load sample pattern.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Upload and Decompose Custom Image
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    resetState();
    setSelectedFile(file);

    const formData = new FormData();
    formData.append('image', file);

    setLoading(true);
    try {
      const res = await api.post('/visual-crypto/decompose', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setOriginalData(res.data.data.original);
        setShareAData(res.data.data.shareA);
        setShareBData(res.data.data.shareB);
        success('Image successfully thresholded and decomposed into 2 CSPRNG shares!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Decomposition failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Combine Shares using XOR
  const handleCombineXOR = async () => {
    if (!shareAData || !shareBData) {
      return error('Both Share A and Share B must be generated first.');
    }

    setIsCombining(true);
    try {
      const res = await api.post('/visual-crypto/reconstruct', {
        shareA: shareAData.dataUrl,
        shareB: shareBData.dataUrl,
        expectedHash: originalData?.hash,
      });

      if (res.data.success) {
        setReconstructedData(res.data.data.reconstructedDataUrl);
        setVerificationResult(res.data.data.verification);
        success('Shares successfully combined using boolean XOR (A ⊕ B)!');
      }
    } catch (err) {
      error('Reconstruction failed.');
    } finally {
      setIsCombining(false);
    }
  };

  const resetState = () => {
    setOriginalData(null);
    setShareAData(null);
    setShareBData(null);
    setReconstructedData(null);
    setVerificationResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold mb-2">
            <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
            <span>IEEE TEL-NET 2017 Academic Research Laboratory</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Visual Cryptography Research Playground
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Interactive 8-step image decomposition and XOR secret sharing engine for multi-party banking security.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all disabled:opacity-50 shadow-soft-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Load Sample Secret</span>
          </button>

          <label className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-soft-sm cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Upload Custom Image</span>
            <input
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Research Theory Cards */}
      <div className="p-5 rounded-2xl glass-panel text-xs text-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <span className="font-mono text-emerald-800 font-bold block text-xs">1. Information-Theoretic Secrecy</span>
          <p className="text-slate-600 text-xs leading-relaxed font-sans">
            Share A is generated via a Cryptographically Secure Pseudo-Random Generator (CSPRNG). Statistically, every pixel has 50% entropy.
          </p>
        </div>
        <div className="space-y-1.5">
          <span className="font-mono text-emerald-800 font-bold block text-xs">2. Complementary XOR Binding</span>
          <p className="text-slate-600 text-xs leading-relaxed font-sans">
            Share B is calculated via <code className="font-mono text-emerald-700">Share_B = Secret ⊕ Share_A</code>. Neither share contains mutual info with the original secret.
          </p>
        </div>
        <div className="space-y-1.5">
          <span className="font-mono text-emerald-800 font-bold block text-xs">3. Zero Contrast Loss Overlay</span>
          <p className="text-slate-600 text-xs leading-relaxed font-sans">
            Superimposing Share A and Share B yields <code className="font-mono text-emerald-700">Reconstructed = Share_A ⊕ Share_B</code> with 100% pixel identity.
          </p>
        </div>
      </div>

      {/* Main Interactive Pipeline Visualizer */}
      <div className="p-8 rounded-2xl glass-panel space-y-8">
        {loading ? (
          <div className="py-24 text-center space-y-4 text-slate-500">
            <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="font-mono text-xs text-slate-600">Binarizing image matrix and generating CSPRNG shares...</p>
          </div>
        ) : !originalData ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mx-auto">
              <Binary className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">No Secret Matrix Loaded</h3>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                Click <strong className="text-slate-900">Load Sample Secret</strong> or upload your own PNG/JPEG image above to start the visual secret sharing pipeline.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Step 1: Original Thresholded Secret */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                  Step 1 &amp; 2: Original Binarized Secret Matrix
                </span>
                <span className="font-mono text-[11px] text-emerald-800 font-bold">
                  SHA-256: {originalData.hash?.substring(0, 20)}...
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-soft-sm shrink-0">
                  <img
                    src={originalData.dataUrl || originalData.binaryDataUrl}
                    alt="Original Binarized Secret"
                    className="w-36 h-36 image-rendering-pixelated rounded"
                  />
                </div>
                <div className="text-xs text-slate-700 space-y-2">
                  <div className="font-mono font-bold text-slate-900">Normalized Watermark Matrix:</div>
                  <p className="font-sans leading-relaxed text-slate-600">
                    Image normalized to standard dimensions ({originalData.width || 128}×{originalData.height || 128} pixels) and converted to binary luminance (threshold: 128).
                  </p>
                  <div className="text-emerald-700 font-mono text-xs flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Ready for 2-out-of-2 secret sharing decomposition</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center text-slate-400">
              <ArrowDown className="w-6 h-6 animate-bounce text-emerald-600" />
            </div>

            {/* Step 2: The Two Decomposed Shares */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 block">
                Step 3, 4 &amp; 5: Decomposed Random Noise Shares (Zero Information)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Share A */}
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-800">Share A (CSPRNG Random Bit Matrix)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                      Signer A / Co-Owner 1
                    </span>
                  </div>
                  <div className="flex justify-center p-3 bg-white border border-slate-200 rounded-xl">
                    <img
                      src={shareAData?.dataUrl}
                      alt="Share A"
                      className="w-40 h-40 image-rendering-pixelated rounded shadow-soft-sm"
                    />
                  </div>
                  <p className="text-[11px] font-sans text-slate-600 text-center leading-relaxed">
                    Pure pseudorandom noise generated with Node.js CSPRNG. Completely indecipherable alone.
                  </p>
                </div>

                {/* Share B */}
                <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-indigo-800">Share B (Complementary XOR Matrix)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold">
                      Signer B / Co-Owner 2
                    </span>
                  </div>
                  <div className="flex justify-center p-3 bg-white border border-slate-200 rounded-xl">
                    <img
                      src={shareBData?.dataUrl}
                      alt="Share B"
                      className="w-40 h-40 image-rendering-pixelated rounded shadow-soft-sm"
                    />
                  </div>
                  <p className="text-[11px] font-sans text-slate-600 text-center leading-relaxed">
                    Calculated via Secret ⊕ Share A. Contains zero recognizable patterns without Share A.
                  </p>
                </div>
              </div>
            </div>

            {/* Action to Combine */}
            <div className="flex flex-col items-center justify-center gap-3 pt-4">
              <button
                onClick={handleCombineXOR}
                disabled={isCombining}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft-sm transition-all disabled:opacity-50"
              >
                {isCombining ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Combine className="w-5 h-5" />
                )}
                <span>Reconstruct Secret via Bitwise XOR (Share A ⊕ Share B)</span>
              </button>
              <span className="text-xs font-mono text-slate-500">
                Simulates server-side computational overlay of both participant shares
              </span>
            </div>

            {/* Step 3: Reconstructed Result & Verification */}
            {reconstructedData && (
              <div className="pt-6 border-t border-slate-200 space-y-4 animate-scale-up">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
                    Step 7 &amp; 8: Reconstructed Image &amp; Hash Verification Verdict
                  </span>
                  {verificationResult?.isMatch && (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold shadow-soft-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verification: 100% Cryptographic Match</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-xl bg-slate-50 border border-emerald-300">
                  <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-soft-sm shrink-0">
                    <img
                      src={reconstructedData}
                      alt="Reconstructed Image"
                      className="w-40 h-40 image-rendering-pixelated rounded"
                    />
                  </div>
                  <div className="text-xs text-slate-700 space-y-3">
                    <div className="font-display font-bold text-lg text-slate-900">
                      Cryptographic Reconstruction Validated
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                      <div className="text-slate-900 font-bold">Expected Hash: {originalData?.hash}</div>
                      <div className="text-emerald-700 font-bold">Computed Hash: {verificationResult?.computedHash}</div>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed font-sans">
                      When both shares are XORed pixel by pixel, the random noise annihilates itself and reproduces the pristine authentication matrix. This proves the multi-party authorization property stated in the IEEE paper without leaking secrets in transit.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualCryptoDemo;
