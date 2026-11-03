import { useState } from 'react';
import { Card, CardBody, Field, StatusBadge, inputCls } from '../../components/ui/primitives.js';
import { nextStatuses } from '../../services/marketService.js';
import type { EntityStatus, Land } from '../../types/domain.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';

interface Props {
  land: Land;
  onSubmitForReview: (id: string, to: EntityStatus, comment?: string) => void;
}

/** Read-only ficha + transición de estado (sin edición local engañosa). */
export function LandForm({ land, onSubmitForReview }: Props): React.JSX.Element {
  const [comment, setComment] = useState('');

  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-brand-navy">{land.name}</h3>
          <StatusBadge status={land.status} />
        </div>
        <dl className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
            <dt className="font-medium text-slate-500">Nombre / lote</dt>
            <dd className="font-bold text-slate-800">{land.name}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
            <dt className="font-medium text-slate-500">Precio venta USD/m²</dt>
            <dd className="font-bold text-slate-800">{formatUsdM2(land.priceSaleUsdM2)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
            <dt className="font-medium text-slate-500">Disponibilidad</dt>
            <dd className="font-bold text-slate-800">{land.availabilityState}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs font-medium text-slate-700">
          Total: {formatAreaM2(land.totalM2)} · Vendible: {formatAreaM2(land.sellableM2)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Field label="Comentario">
            <input className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motivo del cambio" />
          </Field>
          {nextStatuses(land.status).map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => onSubmitForReview(land.id, to, comment || undefined)}
              className={`rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 ${to === 'VERIFIED' ? 'bg-brand-emerald' : to === 'PENDING_VALIDATION' ? 'bg-[#2563EB]' : 'bg-brand-blue'}`}
            >
              {to === 'PENDING_VALIDATION' ? 'Enviar a validación' : to}
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
