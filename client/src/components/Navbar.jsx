import React from 'react';
import { LogOut, ShieldCheck, UserCheck, Cpu, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { info } = useToast();

  const handleLogout = async () => {
    await logout();
    info('Logged out securely.');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-soft-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Visual Cryptography Vault Active</span>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600">
          <Cpu className="w-3 h-3 text-indigo-600" />
          <span>HSM Node: Zurich-01</span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-semibold">0ms Latency</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700">
          <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
          <span className="capitalize font-bold text-slate-900">{user?.role}</span>
          <span className="text-[10px] text-slate-500">Portal</span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all duration-150"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
