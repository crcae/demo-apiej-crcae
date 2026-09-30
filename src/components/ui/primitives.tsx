import type { ReactNode } from 'react';

export function Card({ children }: { children: ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-[2rem] border border-white/50 bg-[#EBF0F5] shadow-[8px_8px_16px_#c8d0e0,-8px_-8px_16px_#ffffff] transition-all duration-300 hover:shadow-[12px_12px_20px_#c8d0e0,-12px_-12px_20px_#ffffff]">{children}</div>
  );
}

export function CardBody({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="p-6">{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-xl border border-white/60 bg-[#E0E5EC] px-3 py-2 text-sm text-slate-900 shadow-[inset_3px_3px_6px_#c8d0e0,inset_-3px_-3px_6px_#ffffff] outline-none transition focus:shadow-[inset_2px_2px_4px_#c8d0e0,inset_-2px_-2px_4px_#ffffff]';

export function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const color =
    status === 'VERIFIED'
      ? 'bg-[#84CC16]/15 text-[#65A30D]'
      : status === 'PENDING_VALIDATION'
        ? 'bg-[#2563EB]/10 text-[#2563EB]'
        : status === 'CHANGES_REQUESTED' || status === 'REJECTED'
          ? 'bg-red-50 text-red-600'
          : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}
