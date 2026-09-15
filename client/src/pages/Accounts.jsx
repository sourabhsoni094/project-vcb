import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Users, ArrowDownCircle, ShieldCheck, Check, Copy, Sparkles, Layers } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  // Create account form state
  const [accountType, setAccountType] = useState('individual');
  const [coOwnerEmail, setCoOwnerEmail] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('10000');

  const { success, error, info } = useToast();

  const fetchAccounts = async () => {
    try {
      const res = await api.get('/accounts');
      if (res.data.success) {
        setAccounts(res.data.data);
      }
    } catch (err) {
      error('Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        accountType,
        initialDeposit: Number(initialDeposit),
      };
      if (accountType === 'joint') {
        payload.coOwnerEmail = coOwnerEmail;
      }

      const res = await api.post('/accounts', payload);
      if (res.data.success) {
        success(res.data.message);
        setShowCreateModal(false);
        setCoOwnerEmail('');
        fetchAccounts();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create account.');
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/accounts/${selectedAccountId}/deposit`, {
        amount: Number(depositAmount),
      });
      if (res.data.success) {
        success(res.data.message);
        setShowDepositModal(false);
        setDepositAmount('');
        fetchAccounts();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Deposit failed.');
    }
  };

  const copyAccNumber = (num) => {
    navigator.clipboard.writeText(num);
    info(`Account ${num} copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-500">Loading Sovereign Accounts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold mb-2">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vault Registry &amp; Liquidity Portfolio</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Registered Bank Vault Accounts
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage individual single-signer accounts and 2-of-2 visual secret sharing joint vaults.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-soft-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Vault Account</span>
        </button>
      </div>

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((acc) => (
          <div
            key={acc._id}
            className="p-6 rounded-2xl glass-panel-interactive flex flex-col justify-between space-y-6 group"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      acc.accountType === 'joint'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {acc.accountType === 'joint' ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      <Wallet className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                      {acc.accountType === 'joint' ? '2-of-2 Multi-Sig Joint' : 'Standard Operating'}
                    </span>
                    <button
                      onClick={() => copyAccNumber(acc.accountNumber)}
                      className="font-mono text-sm font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors group/btn"
                    >
                      <span>{acc.maskedAccountNumber}</span>
                      <Copy className="w-3 h-3 text-slate-400 group-hover/btn:text-emerald-600 transition-colors" />
                    </button>
                  </div>
                </div>
                <StatusBadge status={acc.status} />
              </div>

              <div className="mt-6">
                <span className="text-[11px] font-mono text-slate-500 block mb-0.5">Available Liquidity Balance</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-extrabold text-3xl text-slate-900 tracking-tight">
                    ₹{acc.balance?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-mono text-emerald-700 font-semibold">INR</span>
                </div>
              </div>

              {acc.accountType === 'joint' && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Joint Co-Holders (Shamir Secret Scheme):</span>
                  </div>
                  <ul className="space-y-1 text-slate-700 font-sans text-xs">
                    {acc.owners?.map((owner) => (
                      <li key={owner._id} className="flex items-center justify-between">
                        <span className="font-medium">{owner.name}</span>
                        <span className="font-mono text-[10px] text-slate-500">{owner.email}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedAccountId(acc._id);
                  setShowDepositModal(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold transition-all"
              >
                <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deposit Capital</span>
              </button>
              <span className="text-[10px] font-mono text-slate-400">
                Registered: {new Date(acc.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Open New Account */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-soft-lg space-y-6 animate-scale-up">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-700 font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Vault Account Provisioning</span>
              </div>
              <h2 className="font-display text-xl font-bold text-slate-900">Establish Vault Account</h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure single-signer or multi-party visual cryptography joint vault.
              </p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Account Type Architecture
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('individual')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      accountType === 'individual'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold shadow-soft-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900">Individual Account</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Single signer execution</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('joint')}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      accountType === 'joint'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold shadow-soft-sm'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900">2-of-2 Joint Vault</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Visual Cryptography multi-auth</div>
                  </button>
                </div>
              </div>

              {accountType === 'joint' && (
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Secondary Co-Owner Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={coOwnerEmail}
                    onChange={(e) => setCoOwnerEmail(e.target.value)}
                    placeholder="userb@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 font-mono"
                  />
                  <p className="text-[10px] font-mono text-slate-500 mt-1">
                    Demo tip: User B (Bob) email is <code className="text-emerald-700 font-bold">userb@example.com</code>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Initial Liquidity Deposit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-soft-sm"
                >
                  Confirm &amp; Open Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Simulate Deposit */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-soft-lg space-y-5 animate-scale-up">
            <h3 className="font-display font-bold text-lg text-slate-900">Credit Capital Deposit</h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Deposit Amount (₹)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 25000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-600 font-mono"
                />
              </div>

              {/* Quick preset chips */}
              <div className="flex items-center gap-2">
                {['5000', '25000', '50000', '100000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className="flex-1 py-1 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-mono text-slate-700 font-semibold transition-colors"
                  >
                    +₹{Number(amt).toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-soft-sm"
                >
                  Credit Funds
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
