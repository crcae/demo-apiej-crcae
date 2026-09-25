import type { AuditEntry } from '../../types/domain.js';
import { Card, CardBody } from '../../components/ui/primitives.js';

const actionColor: Record<AuditEntry['action'], string> = {
  CREATE: 'bg-brand-blue/10 text-brand-blue',
  UPDATE: 'bg-slate-100 text-slate-600',
  STATUS_CHANGE: 'bg-brand-orange/10 text-brand-orange',
  SNAPSHOT_CLOSE: 'bg-brand-emerald/10 text-brand-emerald',
  EXPORT: 'bg-purple-50 text-purple-600',
};

export function AuditList({ entries, isStaff }: { entries: AuditEntry[]; isStaff: boolean }): React.JSX.Element {
  if (!isStaff) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm font-bold text-red-600">403 Forbidden — audit trail solo visible para APIEJ Staff.</p>
          <p className="mt-1 text-xs text-slate-500">El backend (RLS <code>audit_staff_read</code>) niega esta lectura a tu rol.</p>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardBody>
        <h3 className="mb-1 text-sm font-bold text-brand-navy">Audit trail · append-only</h3>
        <p className="mb-3 text-xs text-slate-500">Toda transición de estado y cierre de periodo queda registrada con actor y diff.</p>
        <ol className="space-y-2">
          {entries.map((a) => (
            <li key={a.id} className="flex flex-wrap items-start gap-2 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${actionColor[a.action]}`}>{a.action}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800">
                  {a.actorName} · {a.entityType} <span className="text-brand-blue">{a.entityLabel}</span>
                </p>
                <p className="text-xs text-slate-500">{a.detail}</p>
              </div>
              <span className="text-[11px] text-slate-400">{new Date(a.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}
