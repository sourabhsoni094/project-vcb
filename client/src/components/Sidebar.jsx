import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ShieldCheck,
  History,
  Binary,
  ShieldAlert,
  Users,
  FileSpreadsheet,
  Lock,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, isAdmin } = useAuth();

  const customerNav = [
    { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Vault & Accounts', path: '/accounts', icon: Wallet },
    { name: 'Wire & Transfer', path: '/transfer', icon: ArrowLeftRight },
    { name: 'Joint Approvals', path: '/joint-authorization', icon: ShieldCheck, badge: 'XOR' },
    { name: 'Ledger History', path: '/transactions', icon: History },
    { name: 'VC Research Lab', path: '/visual-cryptography', icon: Binary, highlight: true },
    { name: 'Security & Entropy', path: '/security', icon: Lock },
  ];

  const adminNav = [
    { name: 'Admin Command Center', path: '/admin', icon: ShieldAlert },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'Security & Audit Logs', path: '/admin/audit-logs', icon: FileSpreadsheet },
  ];

  const linkClasses = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
      isActive
        ? 'bg-emerald-50 text-emerald-800 border-l-4 border-l-emerald-600 font-bold shadow-soft-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-soft-sm shrink-0">
          <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
            SecureBank<span className="text-emerald-700 font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">VC</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-mono tracking-wider truncate">Shamir VC 2-of-2 Core</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div>
          <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-emerald-600" />
            <span>Treasury &amp; Vault</span>
          </p>
          <nav className="space-y-1">
            {customerNav.map((item) => (
              <NavLink key={item.path} to={item.path} className={linkClasses}>
                <div className="flex items-center gap-2.5 min-w-0">
                  <item.icon className={`w-4 h-4 shrink-0 ${item.highlight ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {isAdmin && (
          <div>
            <p className="px-3 text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-600 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-600" />
              <span>Administration</span>
            </p>
            <nav className="space-y-1">
              {adminNav.map((item) => (
                <NavLink key={item.path} to={item.path} className={linkClasses}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon className="w-4 h-4 shrink-0 text-amber-600" />
                    <span className="truncate">{item.name}</span>
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Cryptographic Engine Status Box */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-700">
            <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              CSPRNG Active
            </span>
            <span className="text-slate-400">256-bit</span>
          </div>
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            Dynamic secret sharing enabled for joint multi-party sign-off.
          </p>
        </div>
      </div>

      {/* User Session Profile */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-mono font-bold text-emerald-800 shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1">
              <span>{user?.name}</span>
              <Fingerprint className="w-3 h-3 text-emerald-600 shrink-0" />
            </p>
            <p className="text-[11px] font-mono text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
