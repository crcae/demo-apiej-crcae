import { useState } from 'react';
import { Card, CardBody, Field, StatusBadge, inputCls } from '../../components/ui/primitives.js';
import { nextStatuses } from '../../services/marketService.js';
import type { EntityStatus, Park } from '../../types/domain.js';
import { formatAreaM2 } from '../../utils/formatters.js';

interface Props {
  park: Park;
  isStaff: boolean;
  onSubmitForReview: (id: string, to: EntityStatus, comment?: string) => void;
}

export function ParkForm({ park, isStaff, onSubmitForReview }: Props): React.JSX.Element {
  const [name, setName] = useState(park.name);
  const [municipality, setMunicipality] = useState(park.municipality);
  const [totalLand, setTotalLand] = useState(String(park.totalLandM2));
  const [comment, setComment] = useState('');

  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-brand-navy">{park.name}</h3>
          <StatusBadge status={park.status} />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Nombre del parque">
            <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Municipio">
            <input className={inputCls} value={municipality} onChange={(e) => setMunicipality(e.target.value)} />
          </Field>
          <Field label="Superficie total (m²)">
            <input className={inputCls} inputMode="decimal" value={totalLand} onChange={(e) => setTotalLand(e.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Inventario: {formatAreaM2(park.totalLandM2)} · Desarrollado: {formatAreaM2(park.developedM2)} · Reserva: {formatAreaM2(park.reserveM2)}
        </p>
        {isStaff && park.internalNotes !== undefined && (
          <p className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-800">Nota interna: {park.internalNotes}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Field label="Comentario de revisión">
            <input className={inputCls} placeholder="Ej. Verificar polígono y reserves" value={comment} onChange={(e) => setComment(e.target.value)} />
          </Field>
          {nextStatuses(park.status).map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => onSubmitForReview(park.id, to, comment || undefined)}
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
