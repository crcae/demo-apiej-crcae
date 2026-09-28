import type { AuditEntry } from '../../types/domain.js';
import { Card, CardBody } from '../../components/ui/primitives.js';

const actionColor: Record<AuditEntry['action'], string> = {
  CREATE: 'bg-brand-blue/10 text-brand-blue',
  UPDATE: 'bg-slate-100 text-slate-600',
  STATUS_CHANGE: 'bg-[#2563EB]/10 text-[#2563EB]',
  SNAPSHOT_CLOSE: 'bg-brand-emerald/10 text-brand-emerald',
  EXPORT: 'bg-purple-50 text-purple-600',
};

export function AuditList({ entries, isStaff }: { entries: AuditEntry[]; isStaff: boolean }): React.JSX.Element {
  if (!isStaff) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm font-bold text-red-600">403 Forbidden — audit trail solo visible para APIEJ Staff.</p>
          <p className="mt-1 text-xs font-medium text-slate-600">El backend (RLS <code>audit_staff_read</code>) niega esta lectura a tu rol.</p>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardBody>
        <h3 className="mb-1 text-sm font-bold text-brand-navy">Audit trail · append-only</h3>
        <p className="mb-3 text-xs font-medium text-slate-600">Toda transición de estado y cierre de periodo queda registrada con actor y diff.</p>
        <ol className="space-y-2">
          {entries.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start gap-2 rounded-2xl border border-white/60 bg-[#EBF0F5] p-3 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${actionColor[a.action]}`}>{a.action}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800">
                  {a.actorName} · {a.entityType} <span className="text-brand-blue">{a.entityLabel}</span>
                </p>
                <p className="text-xs font-medium text-slate-600">{a.detail}</p>
              </div>
              <span className="text-[11px] font-medium text-slate-600">{new Date(a.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
