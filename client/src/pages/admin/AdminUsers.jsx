import React, { useState, useEffect } from 'react';
import { Users, ShieldAlert, Lock, Unlock, Wallet } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/StatusBadge';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { success, error } = useToast();

  const fetchData = async () => {
    try {
      const [usersRes, accRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/accounts'),
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (accRes.data.success) setAccounts(accRes.data.data);
    } catch (err) {
      error('Failed to load user and account directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleFreeze = async (accountId) => {
    try {
      const res = await api.patch(`/admin/accounts/${accountId}/freeze`);
      if (res.data.success) {
        success(res.data.message);
        fetchData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to toggle freeze status.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-500">Loading User &amp; Vault Directory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Administrative Control Directory</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bank Identity &amp; Vault Control
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Supervise user entities, review account bindings, and execute administrative freeze actions.
        </p>
      </div>

      {/* Accounts Directory */}
      <div className="p-6 sm:p-7 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Managed Bank Accounts</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">{accounts.length} total accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="pb-3.5 font-semibold">Account Number</th>
                <th className="pb-3.5 font-semibold">Type</th>
                <th className="pb-3.5 font-semibold">Owners</th>
                <th className="pb-3.5 font-semibold">Balance</th>
                <th className="pb-3.5 font-semibold">Status</th>
                <th className="pb-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {accounts.map((acc) => (
                <tr key={acc._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900">
                    {acc.accountNumber}
                  </td>
                  <td className="py-3.5 text-slate-600 capitalize font-sans">
                    {acc.accountType}
                  </td>
                  <td className="py-3.5 text-slate-700 font-sans">
                    {acc.owners?.map((o) => o.name).join(', ') || 'None'}
                  </td>
                  <td className="py-3.5 font-extrabold text-slate-900 text-sm">
                    ₹{acc.balance?.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={acc.status} />
                  </td>
                  <td className="py-3.5 text-right font-sans">
                    <button
                      onClick={() => handleToggleFreeze(acc._id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition-all ${
                        acc.status === 'active'
                          ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      {acc.status === 'active' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Freeze Account</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unfreeze</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Directory */}
      <div className="p-6 sm:p-7 rounded-2xl glass-panel space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Registered Customer Profiles</span>
          </h2>
          <span className="text-xs font-mono text-slate-500">{users.length} registered profiles</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="pb-3.5 font-semibold">Name</th>
                <th className="pb-3.5 font-semibold">Email</th>
                <th className="pb-3.5 font-semibold">Role</th>
                <th className="pb-3.5 font-semibold">Account State</th>
                <th className="pb-3.5 font-semibold text-right">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 font-bold text-slate-900 font-sans">{u.name}</td>
                  <td className="py-3.5 text-slate-600">{u.email}</td>
                  <td className="py-3.5 text-slate-600 capitalize font-sans">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                      u.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="py-3.5 text-right text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
