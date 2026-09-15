import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  PlusCircle,
  Binary,
  Cpu,
  Layers,
  CheckCircle2,
  Lock,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

const Dashboard = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [accRes, txRes, pendingRes] = await Promise.all([
          api.get('/accounts'),
          api.get('/transactions'),
          api.get('/transactions/pending-authorizations'),
        ]);

        if (accRes.data.success) setAccounts(accRes.data.data);
        if (txRes.data.success) setTransactions(txRes.data.data.slice(0, 6));
        if (pendingRes.data.success) setPendingApprovals(pendingRes.data.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalBalance = accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const primaryAccount = accounts[0];
  const jointAccount = accounts.find((a) => a.accountType === 'joint') || primaryAccount;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-500">Loading Executive Treasury Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Sovereign Light Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 border border-slate-200 shadow-soft-sm">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sovereign Treasury Vault • 2-of-2 Visual Secret Sharing</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span className="text-emerald-700">{user?.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
              Multi-party transaction authorizations backed by mathematical visual cryptography. Zero contrast loss, CSPRNG bitwise overlay verification.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/transfer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-soft-sm"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Transfer Capital</span>
            </Link>
            <Link
              to="/joint-authorization"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-soft-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Joint Approvals</span>
              {pendingApprovals.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-mono text-[10px] font-bold flex items-center justify-center">
                  {pendingApprovals.length}
                </span>
              )}
            </Link>
            <Link
              to="/visual-cryptography"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs transition-all"
            >
              <Binary className="w-4 h-4 text-emerald-700" />
              <span>VC Lab</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Authorization Alert Banner */}
      {pendingApprovals.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-4 shadow-soft-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 font-bold">
                  Action Required • Visual Cryptography Co-Signer Ping
                </span>
                <h3 className="font-display font-bold text-base text-slate-900">
                  {pendingApprovals.length} Joint Transaction{pendingApprovals.length > 1 ? 's' : ''} Awaiting Your Authorization
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Share A has been bound by the initiator. Supply your bound key (Share B) to perform XOR reconstruction.
                </p>
              </div>
            </div>
            <Link
              to="/joint-authorization"
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-soft-sm shrink-0 text-center"
            >
              Authorize &amp; Reconstruct (XOR) &rarr;
            </Link>
          </div>

          {/* Stepper visual preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-amber-200 text-xs font-mono">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-amber-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700">1. Matrix Watermark Generated</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-amber-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-slate-700">2. Share A CSPRNG Synthesized</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-100 border border-amber-300 text-amber-900">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
              <span className="font-semibold">3. Awaiting Share B XOR Overlay</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Financial Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Portfolio Balance Card */}
        <div className="p-6 rounded-2xl glass-panel-interactive flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
              Total Portfolio Balance
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono font-extrabold text-3xl text-slate-900 tracking-tight">
                ₹{totalBalance.toLocaleString('en-IN')}
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-700">INR</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Combined reserves across {accounts.length} registered vault accounts
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Security Ledger</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Synchronized
            </span>
          </div>
        </div>

        {/* Joint Account Card */}
        <div className="p-6 rounded-2xl glass-panel-interactive flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
              Joint Vault Account
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xl text-slate-900">
                {jointAccount?.maskedAccountNumber || '1000001234'}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                2-of-2 Multi-Sig
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-1">
              Balance: <span className="text-slate-900 font-bold">₹{jointAccount?.balance?.toLocaleString('en-IN') || 0}</span>
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Co-Signer Status</span>
            <span className="text-slate-800 font-medium">Alice &amp; Bob Enrolled</span>
          </div>
        </div>

        {/* Visual Cryptography Security Engine */}
        <div className="p-6 rounded-2xl glass-panel-interactive flex flex-col justify-between space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500">
              Cryptographic Engine
            </span>
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
              <Cpu className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Zero Pixel Expansion</span>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Computational XOR engine with 100% reconstruction fidelity &amp; SHA-256 fingerprinting.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Single Point Failure</span>
            <span className="text-emerald-700 font-bold">0% (Immune)</span>
          </div>
        </div>
      </div>

      {/* Recent Ledger Activity Table */}
      <div className="p-6 sm:p-7 rounded-2xl glass-panel space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display font-bold text-lg text-slate-900">Recent Ledger Transactions</h2>
            <p className="text-xs text-slate-500">Immutable audit log of recent wire settlements</p>
          </div>
          <Link
            to="/transactions"
            className="text-xs font-mono font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
          >
            <span>View Complete Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-mono">
            No transaction records found on this account yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="pb-3 font-semibold">Transaction ID</th>
                  <th className="pb-3 font-semibold">Sender Account</th>
                  <th className="pb-3 font-semibold">Receiver Account</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Security State</th>
                  <th className="pb-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 text-slate-900 font-bold">{tx.transactionId}</td>
                    <td className="py-3.5 text-slate-600">
                      {tx.senderAccount?.maskedAccountNumber || 'External'}
                    </td>
                    <td className="py-3.5 text-slate-600">
                      {tx.receiverAccount?.maskedAccountNumber || 'External'}
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 text-sm">
                      ₹{tx.amount?.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 text-slate-600 capitalize font-sans">
                      {tx.transactionType?.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3.5">
                      <StatusBadge status={tx.state} />
                    </td>
                    <td className="py-3.5 text-right text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
