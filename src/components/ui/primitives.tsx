import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="p-5 md:p-6">{children}</div>;
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
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-[#4A6CFF] focus:bg-white focus:ring-2 focus:ring-[#4A6CFF]/20';

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  VERIFIED: { label: 'Verificado', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  AVAILABLE: { label: 'Disponible', cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  PENDING_VALIDATION: { label: 'En validación', cls: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
  RESERVED: { label: 'Reservado', cls: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' },
  CHANGES_REQUESTED: { label: 'Con observaciones', cls: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200' },
  REJECTED: { label: 'Rechazado', cls: 'bg-red-50 text-red-700 ring-1 ring-red-200' },
  DRAFT: { label: 'Borrador', cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  LEASED: { label: 'Arrendado', cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  SOLD: { label: 'Vendido', cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' },
  UNDER_CONSTRUCTION: { label: 'En construcción', cls: 'bg-[#4A6CFF]/10 text-[#4A6CFF] ring-1 ring-[#4A6CFF]/25' },
  OFF_MARKET: { label: 'Fuera de mercado', cls: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200' },
};

export function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const mapped = STATUS_STYLE[status] ?? { label: status, cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200' };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${mapped.cls}`}>
      {mapped.label}
    </span>
  );
}
