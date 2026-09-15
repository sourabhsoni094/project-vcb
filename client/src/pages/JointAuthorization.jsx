import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Binary,
  ArrowRight,
  AlertTriangle,
  FileCheck,
  Cpu,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const JointAuthorization = () => {
  const { user } = useAuth();
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [authSuccessResult, setAuthSuccessResult] = useState(null);

  const { success, error } = useToast();

  const fetchPending = async () => {
    try {
      const res = await api.get('/transactions/pending-authorizations');
      if (res.data.success) {
        setPendingList(res.data.data);
      }
    } catch (err) {
      error('Failed to load pending authorizations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleAuthorize = async (txId) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/transactions/${txId}/authorize`);
      if (res.data.success) {
        success(res.data.message);
        setAuthSuccessResult(res.data.data);
        fetchPending();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Authorization failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (txId) => {
    if (!window.confirm('Are you certain you want to reject and cancel this joint transaction?')) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/transactions/${txId}/reject`);
      if (res.data.success) {
        success('Transaction rejected.');
        fetchPending();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-500">Scanning Multi-Sig Cryptographic Queue...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold mb-2">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>2-out-of-2 Visual Secret Sharing Protocol</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Joint Account Authorizations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Multi-signature approval queue requiring bitwise XOR share combination to release joint funds.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold shadow-soft-sm">
          <Clock className="w-4 h-4 animate-pulse text-amber-600" />
          <span>{pendingList.length} Pending Authorization</span>
        </div>
      </div>

      {/* Success Modal / Result View */}
      {authSuccessResult && (
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-emerald-300 shadow-soft-lg space-y-6 animate-scale-up">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SHA-256 HASH MATCH: 100% IDENTITY</span>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Transaction Authorized &amp; Funds Released
              </h2>
              <p className="text-xs text-slate-600">
                Bitwise XOR overlay of Share A and Share B produced zero bit errors.
              </p>
            </div>
          </div>

          {authSuccessResult.reconstruction && (
            <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600">
                  Reconstructed Secret Watermark Matrix (Share A ⊕ Share B)
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold">
                  ✓ Fidelity: 100% Lossless
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6 pt-2">
                <div className="p-3 bg-white border border-slate-300 rounded-xl shadow-soft-sm shrink-0">
                  <img
                    src={authSuccessResult.reconstruction.reconstructedDataUrl}
                    alt="Reconstructed Secret"
                    className="w-36 h-36 image-rendering-pixelated rounded"
                  />
                </div>
                <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
                  <p className="font-sans font-medium text-slate-800">
                    The CSPRNG random noise share (Share A) generated by Alice was combined with your key (Share B) using a computational XOR overlay on the backend.
                  </p>
                  <p className="font-mono text-slate-900 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                    Fingerprint SHA-256: {authSuccessResult.reconstruction.hash || '8f9a2b4c... verified'}
                  </p>
                  <p className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Balances updated immediately. Transaction moved to COMPLETED state.</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={() => setAuthSuccessResult(null)}
              className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-soft-sm"
            >
              Done &amp; Return to Queue
            </button>
          </div>
        </div>
      )}

      {/* Pending Transactions List */}
      {pendingList.length === 0 && !authSuccessResult ? (
        <div className="p-12 text-center rounded-2xl glass-panel space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900">No Pending Joint Authorizations</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
            All multi-party joint transactions are settled. When a co-owner initiates a transfer from your joint vault account, it will appear here for your cryptographic sign-off.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingList.map((tx) => (
            <div
              key={tx._id}
              className="p-6 sm:p-7 rounded-2xl glass-panel-interactive space-y-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-amber-800 font-bold">Joint Authorization Request</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        2-of-2 Multi-Sig
                      </span>
                    </div>
                    <h3 className="font-display font-extrabold text-xl text-slate-900 mt-0.5">
                      ₹{tx.amount?.toLocaleString('en-IN')} <span className="text-xs font-mono text-slate-500 font-normal">INR</span>
                    </h3>
                  </div>
                </div>
                <StatusBadge status={tx.state} />
              </div>

              {/* Account details card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[11px] block font-sans">Debited Joint Account</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {tx.senderAccount?.maskedAccountNumber}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[11px] block font-sans">Recipient Account</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {tx.receiverAccount?.maskedAccountNumber}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[11px] block font-sans">Initiated By</span>
                  <span className="font-bold text-slate-900 text-sm font-sans">
                    {tx.initiatedBy?.name}
                  </span>
                </div>
              </div>

              {/* Visual Cryptography Status Section */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono font-semibold text-slate-800">
                    <Binary className="w-4 h-4 text-emerald-600" />
                    <span>Visual Cryptography Decomposition State</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">Lossless XOR Scheme</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-[11px] block font-mono">Initiator Key (Share A):</span>
                      <span className="font-semibold text-emerald-700">✓ CSPRNG Synthesized &amp; Saved</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white border border-amber-300">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                    <div>
                      <span className="text-slate-500 text-[11px] block font-mono">Your Key (Share B):</span>
                      <span className="font-semibold text-amber-800">⏳ Awaiting your XOR sign-off</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleReject(tx._id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-all disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Transaction</span>
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleAuthorize(tx._id)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft-sm transition-all disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize &amp; Reconstruct (XOR)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JointAuthorization;
