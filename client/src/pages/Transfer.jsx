import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Binary,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Sparkles,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [senderAccountId, setSenderAccountId] = useState('');
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Payment for services');
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);

  const { success, error } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await api.get('/accounts');
        if (res.data.success && res.data.data.length > 0) {
          setAccounts(res.data.data);
          setSenderAccountId(res.data.data[0]._id);
        }
      } catch (err) {
        error('Failed to load available accounts.');
      }
    };
    fetchAccounts();
  }, []);

  const selectedAccount = accounts.find((a) => a._id === senderAccountId);
  const isJointAccount = selectedAccount?.accountType === 'joint';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      return error('Please specify a positive transfer amount.');
    }
    if (selectedAccount && Number(amount) > selectedAccount.balance) {
      return error('Insufficient funds in selected account.');
    }

    setLoading(true);
    try {
      const res = await api.post('/transactions', {
        senderAccountId,
        receiverAccountNumber,
        amount: Number(amount),
        description,
      });

      if (res.data.success) {
        setResultData(res.data);
        success(res.data.message);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Transaction initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold mb-2">
          <Send className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multi-Party Wire Transfer Protocol</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Transfer Capital &amp; Initiate Wire
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Single-signer execution or Visual Cryptography secret-sharing decomposition for joint vaults.
        </p>
      </div>

      {resultData ? (
        /* Result Confirmation View */
        <div className="p-8 rounded-2xl glass-panel space-y-6 animate-scale-up">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                resultData.data.transaction?.state === 'COMPLETED'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                  : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}
            >
              {resultData.data.transaction?.state === 'COMPLETED' ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <Clock className="w-7 h-7 animate-pulse" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-600">
                <span>TX-ID:</span>
                <span className="text-emerald-800">{resultData.data.transaction?.transactionId}</span>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900 mt-0.5">
                {resultData.data.transaction?.state === 'COMPLETED'
                  ? 'Transaction Completed Immediately'
                  : 'Joint Transaction Created (Awaiting Authorization)'}
              </h2>
            </div>
          </div>

          {resultData.data.userSharePreview && (
            <div className="p-6 rounded-xl bg-amber-50/70 border border-amber-200 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-900">
                  <Binary className="w-4 h-4 text-amber-700" />
                  <span>Visual Cryptography Security Share A Bound</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold">
                  2-of-2 Multi-Sig Pending
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                The transaction watermark secret was split into two CSPRNG noise matrices. Your share (Share A) is saved on server memory. Co-owner{' '}
                <span className="font-bold text-slate-900">{resultData.data.requiresAuthorizationFrom?.name}</span> must authenticate to execute XOR reconstruction.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                <div className="flex flex-col items-center shrink-0">
                  <div className="p-2 bg-white border border-amber-300 rounded-xl shadow-soft-sm">
                    <img
                      src={resultData.data.userSharePreview}
                      alt="Share A"
                      className="w-28 h-28 image-rendering-pixelated rounded"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-1.5">
                    Share A (CSPRNG Noise)
                  </span>
                </div>

                <div className="flex-1 text-xs text-slate-700 space-y-2 font-mono">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                    <div className="font-bold text-emerald-800 font-sans">Quick Walkthrough for Co-Owner Verification:</div>
                    <div className="text-slate-700 font-sans">1. Sign out of this session.</div>
                    <div className="text-slate-700 font-sans">
                      2. Login as <span className="text-emerald-700 font-mono font-bold">{resultData.data.requiresAuthorizationFrom?.email}</span> (Password: <code className="text-emerald-700">UserB@12345</code>).
                    </div>
                    <div className="text-slate-700 font-sans">
                      3. Navigate to <span className="text-amber-800 font-bold">Joint Approvals</span> to authorize &amp; release funds via XOR.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => {
                setResultData(null);
                setAmount('');
              }}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Initiate Another Transfer
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-soft-sm"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="p-6 sm:p-8 rounded-2xl glass-panel space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sender Account */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Source Account
              </label>
              <select
                value={senderAccountId}
                onChange={(e) => setSenderAccountId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                {accounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.maskedAccountNumber} ({acc.accountType === 'joint' ? 'Joint 2-of-2' : 'Individual'}) - Available: ₹{acc.balance?.toLocaleString('en-IN')}
                  </option>
                ))}
              </select>
            </div>

            {/* Joint Account Notice Banner */}
            {isJointAccount && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-mono font-bold text-amber-800 text-xs">
                    2-out-of-2 Visual Cryptography Protocol Enforced
                  </p>
                  <p className="text-slate-700 text-xs leading-relaxed font-sans">
                    This account is co-owned. Under our visual cryptography security scheme, initiating this wire will split a watermark matrix into Share A and Share B. The transfer will remain <span className="font-mono text-amber-800 font-bold">AWAITING_AUTHORIZATION</span> until co-owner signs off.
                  </p>
                </div>
              </div>
            )}

            {/* Receiver Account Number */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Destination Account Number
              </label>
              <input
                type="text"
                required
                value={receiverAccountNumber}
                onChange={(e) => setReceiverAccountNumber(e.target.value)}
                placeholder="e.g. 1000008899"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
              {/* Quick Select Destination */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => setReceiverAccountNumber('1000008899')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-[10px] text-emerald-800 font-bold transition-colors"
                >
                  1000008899 (User B Bob)
                </button>
                <button
                  type="button"
                  onClick={() => setReceiverAccountNumber('1000004321')}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 font-mono text-[10px] text-teal-800 font-bold transition-colors"
                >
                  1000004321 (User A Alice)
                </button>
              </div>
            </div>

            {/* Transfer Amount */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Transfer Capital Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 font-bold font-mono">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 font-mono font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAmount('50000')}
                  className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono text-slate-700 font-semibold"
                >
                  ₹50,000 (Paper Scenario)
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('10000')}
                  className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono text-slate-700 font-semibold"
                >
                  ₹10,000
                </button>
                <button
                  type="button"
                  onClick={() => setAmount('25000')}
                  className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-mono text-slate-700 font-semibold"
                >
                  ₹25,000
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Reference / Purpose Note
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Reason for transfer"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft-sm transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Confirm &amp; Execute Wire Protocol</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Transfer;
