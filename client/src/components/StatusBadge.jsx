import React from 'react';

const StatusBadge = ({ status }) => {
  const styles = {
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm',
    AUTHORIZED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    PROCESSING: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse',
    AWAITING_AUTHORIZATION: 'bg-amber-50 text-amber-800 border-amber-200 shadow-sm',
    WATERMARK_GENERATED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    INITIATED: 'bg-slate-100 text-slate-700 border-slate-200',
    PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
    FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
    EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    AUDITED: 'bg-teal-50 text-teal-700 border-teal-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    frozen: 'bg-rose-50 text-rose-700 border-rose-200',
    SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    FAILURE: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const currentStyle = styles[status] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold tracking-wide uppercase border ${currentStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0"></span>
      <span>{status?.replace(/_/g, ' ')}</span>
    </span>
  );
};

export default StatusBadge;
