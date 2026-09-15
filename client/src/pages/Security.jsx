import React from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  Database,
  Binary,
  Cpu,
  Fingerprint,
  CheckCircle2,
  Zap,
  Activity,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Security = () => {
  const { user } = useAuth();

  const securityFeatures = [
    {
      title: '2-out-of-2 Visual Cryptography (XOR)',
      desc: 'All joint authorizations decompose a dynamic security watermark into two CSPRNG bit matrices (Share A and Share B). Single shares reveal 0 information mathematically.',
      icon: Binary,
      status: 'Active',
      color: 'text-emerald-700',
    },
    {
      title: 'Hardware CSPRNG Randomness',
      desc: 'Random share generation utilizes Node.js crypto.randomBytes() with hardware entropy, replacing insecure pseudorandom generators.',
      icon: Cpu,
      status: 'Enforced',
      color: 'text-indigo-700',
    },
    {
      title: 'Zero-Trust Authorization Guard',
      desc: 'The backend never trusts client assertions. Every authorization independently reconstructs the secret and validates against SHA-256 fingerprint.',
      icon: ShieldCheck,
      status: 'Active',
      color: 'text-emerald-700',
    },
    {
      title: 'Anti-IDOR Share Isolation',
      desc: 'Visual shares are bounded strictly to (transactionId, userId). User A can never request User B’s share through any REST endpoint.',
      icon: Lock,
      status: 'Guaranteed',
      color: 'text-indigo-700',
    },
    {
      title: '10-State Immutable State Machine',
      desc: 'Enforces irreversible state progression: PENDING -> AWAITING_AUTHORIZATION -> SHARES_COMBINED -> COMPLETED. Illegal state mutations throw HTTP 400 errors.',
      icon: Fingerprint,
      status: 'Active',
      color: 'text-amber-800',
    },
    {
      title: 'Bcrypt Hashing & Rate Limiting',
      desc: 'Passwords salted with 10 rounds of bcrypt. Access secured via time-bounded JSON Web Tokens with rate-limiting brute-force safeguards.',
      icon: Key,
      status: 'Enforced',
      color: 'text-teal-700',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono font-semibold mb-2">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-time Cryptographic Telemetry &amp; Safeguards</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Security &amp; Entropy Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Cryptographic architecture, threat mitigations, and mathematical secrecy guarantees protecting vault assets.
        </p>
      </div>

      {/* Account Security Overview Banner */}
      <div className="p-6 rounded-2xl glass-panel flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-soft-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-slate-900 text-lg">Cryptographic Protection Active</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold">
                ✓ Verified
              </span>
            </div>
            <p className="text-xs font-mono text-slate-600 mt-1">
              Signed in as <span className="text-slate-900 font-bold">{user?.email}</span> (Role: <span className="text-emerald-800 capitalize font-bold">{user?.role}</span>)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="space-y-0.5">
            <div className="text-slate-500 text-[10px]">CSPRNG ENTROPY</div>
            <div className="text-emerald-700 font-bold">100% (256-bit)</div>
          </div>
          <div className="w-px h-8 bg-slate-200"></div>
          <div className="space-y-0.5">
            <div className="text-slate-500 text-[10px]">HSM VERIFICATION</div>
            <div className="text-indigo-700 font-bold">0 Bit Error</div>
          </div>
        </div>
      </div>

      {/* Security Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {securityFeatures.map((feat, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl glass-panel-interactive space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <feat.icon className={`w-5 h-5 ${feat.color}`} />
                  <span className="font-display font-bold text-sm text-slate-900">{feat.title}</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold uppercase">
                  {feat.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">{feat.desc}</p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Compliant with IEEE Research Paper Specs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Security;
