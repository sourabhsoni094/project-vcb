import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, Filter, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (actionFilter) params.action = actionFilter;
      if (resultFilter) params.result = resultFilter;

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resultFilter]);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(s) ||
      l.userEmail?.toLowerCase().includes(s) ||
      l.transactionId?.toLowerCase().includes(s) ||
      l.ipAddress?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Forensic Systems Audit Ledger</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Immutable Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Comprehensive forensics ledger tracking all security, authentication, and visual cryptography operations.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all border border-slate-200 shadow-soft-sm shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, email, transaction ID, or IP..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-soft-sm"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-600 shadow-soft-sm"
        >
          <option value="">All Actions</option>
          <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
          <option value="LOGIN_FAILURE">LOGIN_FAILURE</option>
          <option value="TRANSACTION_CREATED">TRANSACTION_CREATED</option>
          <option value="TRANSACTION_AUTHORIZED">TRANSACTION_AUTHORIZED</option>
          <option value="TRANSACTION_REJECTED">TRANSACTION_REJECTED</option>
          <option value="VISUAL_SHARE_GENERATED">VISUAL_SHARE_GENERATED</option>
          <option value="VISUAL_SHARE_VERIFIED">VISUAL_SHARE_VERIFIED</option>
          <option value="ACCOUNT_FROZEN">ACCOUNT_FROZEN</option>
          <option value="ADMIN_ACTION">ADMIN_ACTION</option>
        </select>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-600 shadow-soft-sm"
        >
          <option value="">All Results</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILURE">FAILURE</option>
          <option value="WARNING">WARNING</option>
        </select>
      </div>

      {/* Logs Table */}
      <div className="p-6 rounded-2xl glass-panel space-y-4 overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-mono">
            No audit records match the selected parameters.
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="pb-3.5 font-semibold">Action Event</th>
                <th className="pb-3.5 font-semibold">User Email</th>
                <th className="pb-3.5 font-semibold">Target Tx / Account</th>
                <th className="pb-3.5 font-semibold">Result</th>
                <th className="pb-3.5 font-semibold">Origin IP</th>
                <th className="pb-3.5 font-semibold">Metadata Summary</th>
                <th className="pb-3.5 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">{log.action}</td>
                  <td className="py-3.5 text-slate-600 font-sans">{log.userEmail || 'System'}</td>
                  <td className="py-3.5 text-slate-600">
                    {log.transactionId || 'N/A'}
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={log.result} />
                  </td>
                  <td className="py-3.5 text-slate-500">{log.ipAddress}</td>
                  <td className="py-3.5 text-slate-500 max-w-xs truncate text-[11px]">
                    {JSON.stringify(log.metadata)}
                  </td>
                  <td className="py-3.5 text-right text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
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

export default AdminAuditLogs;
