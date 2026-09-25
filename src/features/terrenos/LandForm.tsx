import { useState } from 'react';
import { Card, CardBody, Field, StatusBadge, inputCls } from '../../components/ui/primitives.js';
import { nextStatuses } from '../../services/marketService.js';
import type { EntityStatus, Land } from '../../types/domain.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';

interface Props {
  land: Land;
  onSubmitForReview: (id: string, to: EntityStatus, comment?: string) => void;
}

export function LandForm({ land, onSubmitForReview }: Props): React.JSX.Element {
  const [name, setName] = useState(land.name);
  const [price, setPrice] = useState(String(land.priceSaleUsdM2 ?? ''));
  const [comment, setComment] = useState('');

  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-brand-navy">{land.name}</h3>
          <StatusBadge status={land.status} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Nombre / lote">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Precio venta USD/m²">
            <input className={inputCls} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Comentario">
            <input className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motivo del cambio" />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Total: {formatAreaM2(land.totalM2)} · Vendible: {formatAreaM2(land.sellableM2)} · Precio: {formatUsdM2(land.priceSaleUsdM2)} · {land.availabilityState}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {nextStatuses(land.status).map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => onSubmitForReview(land.id, to, comment || undefined)}
              className={`rounded-xl px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:opacity-90 ${to === 'VERIFIED' ? 'bg-brand-emerald' : to === 'PENDING_VALIDATION' ? 'bg-brand-orange' : 'bg-brand-blue'}`}
            >
              {to === 'PENDING_VALIDATION' ? 'Enviar a validación' : to}
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
