import type { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200">{children}</div>
  );
}

export function CardBody({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="p-5">{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20';

export function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const color =
    status === 'VERIFIED'
      ? 'bg-brand-emerald/10 text-brand-emerald'
      : status === 'PENDING_VALIDATION'
        ? 'bg-brand-orange/10 text-brand-orange'
        : status === 'CHANGES_REQUESTED' || status === 'REJECTED'
          ? 'bg-red-50 text-red-600'
          : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}
