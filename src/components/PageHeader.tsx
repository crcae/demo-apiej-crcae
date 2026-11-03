import type { ReactNode } from 'react';

interface Props {
  section: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/** Shared page chrome for authenticated system views. */
export function PageHeader({ section, title, subtitle, actions }: Props): React.JSX.Element {
  return (
    <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">Sistema / {section}</p>
        <h2 className="font-display mt-1 text-3xl font-extrabold tracking-tight text-[#0E1A3D]">{title}</h2>
        {subtitle !== undefined && subtitle !== '' && (
          <p className="mt-1 text-sm font-medium text-slate-600">{subtitle}</p>
        )}
      </div>
      {actions !== undefined && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
