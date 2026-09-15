import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Users,
  Wallet,
  ArrowLeftRight,
  Clock,
  XCircle,
  FileSpreadsheet,
  Activity,
  Cpu,
} from 'lucide-react';
import api from '../../services/api';
import StatusBadge from '../../components/StatusBadge';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
        <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-mono text-xs text-slate-500">Loading Bank Audit Console...</p>
      </div>
    );
  }

  const metrics = stats?.metrics || {};

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono font-bold mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Institutional Command &amp; Security Control</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Bank Security &amp; Forensic Telemetry
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Real-time threat analytics, failed login trackers, and multi-party Visual Cryptography audit trails.
        </p>
      </div>

      {/* Security Telemetry Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 font-mono">
        <div className="p-4 rounded-xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Failed Logins</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">{metrics.failedLogins || 0}</span>
          <p className="text-[10px] text-slate-500 font-sans">Brute-force attempts</p>
        </div>

        <div className="p-4 rounded-xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Auth Failures</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">{metrics.authFailures || 0}</span>
          <p className="text-[10px] text-slate-500 font-sans">Visual share mismatches</p>
        </div>

        <div className="p-4 rounded-xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Suspicious Tx</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">{metrics.suspiciousTransactions || 0}</span>
          <p className="text-[10px] text-slate-500 font-sans">Anomalous transfers</p>
        </div>

        <div className="p-4 rounded-xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Expired Shares</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">{metrics.expiredSecurityShares || 0}</span>
          <p className="text-[10px] text-slate-500 font-sans">Exceeded 24h window</p>
        </div>

        <div className="p-4 rounded-xl glass-panel space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold">Rejected Tx</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900 block">{metrics.rejectedTransactions || 0}</span>
          <p className="text-[10px] text-slate-500 font-sans">Co-owner rejections</p>
        </div>
      </div>

      {/* System Volumes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono">
        <div className="p-6 rounded-2xl glass-panel-interactive flex items-center justify-between">
          <div>
            <span className="text-xs font-sans text-slate-500 block mb-1">Registered System Users</span>
            <span className="text-3xl font-extrabold text-slate-900">{metrics.totalUsers}</span>
          </div>
          <Users className="w-8 h-8 text-indigo-600" />
        </div>

        <div className="p-6 rounded-2xl glass-panel-interactive flex items-center justify-between">
          <div>
            <span className="text-xs font-sans text-slate-500 block mb-1">Active Bank Vaults</span>
            <span className="text-3xl font-extrabold text-slate-900">{metrics.totalAccounts}</span>
          </div>
          <Wallet className="w-8 h-8 text-emerald-600" />
        </div>

        <div className="p-6 rounded-2xl glass-panel-interactive flex items-center justify-between">
          <div>
            <span className="text-xs font-sans text-slate-500 block mb-1">Total Ledger Volume</span>
            <span className="text-3xl font-extrabold text-slate-900">{metrics.totalTransactions}</span>
          </div>
          <ArrowLeftRight className="w-8 h-8 text-amber-600" />
        </div>
      </div>

      {/* Recent Audit & Threat Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Threats */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Recent Threat Telemetry</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Auto-detected anomalies</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {stats?.recentSecurityEvents?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center font-sans">No security threat events recorded.</p>
            ) : (
              stats?.recentSecurityEvents?.map((ev) => (
                <div
                  key={ev._id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-rose-700 block">{ev.eventType}</span>
                    <span className="text-[11px] text-slate-600">
                      User: {ev.userEmail || 'Anonymous'} • IP: {ev.ipAddress}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log Stream */}
        <div className="p-6 rounded-2xl glass-panel space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Immutable Audit Feed</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-500">Operational log stream</span>
          </div>

          <div className="space-y-2.5 font-mono text-xs">
            {stats?.recentAuditLogs?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center font-sans">No audit logs recorded yet.</p>
            ) : (
              stats?.recentAuditLogs?.map((log) => (
                <div
                  key={log._id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{log.action}</span>
                    <span className="text-[11px] text-slate-600">
                      {log.userEmail || 'System'} • {log.result}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
