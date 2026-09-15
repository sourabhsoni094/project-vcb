import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, User, KeyRound, Cpu, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Authentication successful! Welcome to SecureBank-VC Vault.');
      navigate('/dashboard');
    } catch (err) {
      error(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for academic testing
  const quickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500/20 selection:text-emerald-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-4 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-soft-md">
            <ShieldCheck className="w-8 h-8 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            SecureBank<span className="text-emerald-700 font-mono text-sm px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">VC</span>
          </h2>
          <p className="mt-1 text-xs font-mono text-slate-500">
            2-out-of-2 Visual Cryptography Banking Vault System
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-soft-lg space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Vault Security Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-soft-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Authenticate &amp; Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Academic Demo Quick-Login Presets */}
          <div className="mt-6 pt-6 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>IEEE Paper Demo Credentials</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => quickFill('usera@example.com', 'UserA@12345')}
                className="px-2.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-mono font-bold text-emerald-800 transition-colors text-center"
              >
                User A (Alice)
              </button>
              <button
                type="button"
                onClick={() => quickFill('userb@example.com', 'UserB@12345')}
                className="px-2.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-mono font-bold text-indigo-800 transition-colors text-center"
              >
                User B (Bob)
              </button>
              <button
                type="button"
                onClick={() => quickFill('admin@example.com', 'AdminPassword123!')}
                className="px-2.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-mono font-bold text-amber-800 transition-colors text-center"
              >
                Bank Admin
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Don't have a vault account?{' '}
              <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
                Register New Customer
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
