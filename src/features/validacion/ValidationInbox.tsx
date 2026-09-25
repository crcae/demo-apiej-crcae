import { Card, CardBody, StatusBadge } from '../../components/ui/primitives.js';
import type { EntityStatus } from '../../types/domain.js';

export interface PendingItem {
  kind: 'PARK' | 'BUILDING' | 'LAND';
  id: string;
  title: string;
  status: EntityStatus;
}

interface Props {
  items: PendingItem[];
  onDecide: (item: PendingItem, to: EntityStatus, comment: string) => void;
}

export function ValidationInbox({ items, onDecide }: Props): React.JSX.Element {
  if (items.length === 0) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm text-slate-500">Sin pendientes. Los envíos de operadores aparecen aquí con estado PENDING_VALIDATION.</p>
        </CardBody>
      </Card>
    );
  }
  return (
    <div className="grid gap-3">
      {items.map((it) => (
        <Card key={`${it.kind}-${it.id}`}>
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-400">{it.kind}</p>
                <h4 className="text-sm font-bold text-brand-navy">{it.title}</h4>
              </div>
              <StatusBadge status={it.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onDecide(it, 'VERIFIED', 'Aprobado por APIEJ')}
                className="rounded-xl bg-brand-emerald px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => onDecide(it, 'CHANGES_REQUESTED', 'Ajustar superficies y evidencia fotográfica')}
                className="rounded-xl bg-brand-orange px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Solicitar cambios
              </button>
              <button
                type="button"
                onClick={() => onDecide(it, 'REJECTED', 'No cumple criterios')}
                className="rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90"
              >
                Rechazar
              </button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
