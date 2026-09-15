import React, { useState, useEffect } from 'react';
import { History, Search, ArrowUpRight, ArrowDownLeft, ShieldCheck, Filter, FileSpreadsheet, Copy } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('ALL');

  const { info } = useToast();

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const res = await api.get('/transactions');
        if (res.data.success) {
          setTransactions(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, []);

  const copyTxId = (id) => {
    navigator.clipboard.writeText(id);
    info(`Transaction ID ${id} copied to clipboard.`);
  };

  const filtered = transactions.filter((tx) => {
    const matchSearch =
      tx.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      tx.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterState === 'ALL' || tx.state === filterState;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-500">Loading Immutable Ledger Records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Immutable Financial Ledger &amp; Cryptographic Audit</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Transaction Ledger &amp; History
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Complete forensic record of single-signer transfers and 2-of-2 Visual Cryptography approvals.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by Transaction Ref ID, Account, or Purpose Note..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-soft-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-600 shadow-soft-sm"
          >
            <option value="ALL">All Ledger States</option>
            <option value="COMPLETED">Completed</option>
            <option value="AWAITING_AUTHORIZATION">Awaiting Authorization</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="p-6 sm:p-7 rounded-2xl glass-panel space-y-4 overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-mono">
            No matching transactions found in the ledger.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="pb-3.5 font-semibold">Reference ID</th>
                <th className="pb-3.5 font-semibold">Debited Sender</th>
                <th className="pb-3.5 font-semibold">Credited Receiver</th>
                <th className="pb-3.5 font-semibold">Amount</th>
                <th className="pb-3.5 font-semibold">Workflow Scheme</th>
                <th className="pb-3.5 font-semibold">Security State</th>
                <th className="pb-3.5 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filtered.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4">
                    <button
                      onClick={() => copyTxId(tx.transactionId)}
                      className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 transition-colors group"
                    >
                      <span>{tx.transactionId}</span>
                      <Copy className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </button>
                  </td>
                  <td className="py-4 text-slate-600">
                    {tx.senderAccount?.maskedAccountNumber || 'Vault Account'}
                  </td>
                  <td className="py-4 text-slate-600">
                    {tx.receiverAccount?.maskedAccountNumber || 'Vault Account'}
                  </td>
                  <td className="py-4 font-extrabold text-slate-900 text-sm">
                    ₹{tx.amount?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 font-sans text-xs">
                    {tx.transactionType === 'joint_transfer' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3 text-amber-600" />
                        <span>Joint VC 2-of-2</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[10px]">Standard Wire</span>
                    )}
                  </td>
                  <td className="py-4">
                    <StatusBadge status={tx.state} />
                  </td>
                  <td className="py-4 text-right text-slate-500">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Transactions;
