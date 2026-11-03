import { useState } from 'react';
import { Card, CardBody, Field, StatusBadge, inputCls } from '../../components/ui/primitives.js';
import { nextStatuses } from '../../services/marketService.js';
import type { Building, EntityStatus } from '../../types/domain.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';

interface Props {
  building: Building;
  isStaff: boolean;
  onSubmitForReview: (id: string, to: EntityStatus, comment?: string) => void;
}

/** Read-only ficha + transición de estado. La edición de campos va por el wizard. */
export function BuildingForm({ building, isStaff, onSubmitForReview }: Props): React.JSX.Element {
  const [comment, setComment] = useState('');

  return (
    <Card>
      <CardBody>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-brand-navy">
            Nave {building.code} · Clase {building.buildingClass}
          </h3>
          <StatusBadge status={building.status} />
        </div>
        <dl className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
            <dt className="font-medium text-slate-500">Código</dt>
            <dd className="font-bold text-slate-800">{building.code}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
            <dt className="font-medium text-slate-500">Renta USD/m²</dt>
            <dd className="font-bold text-slate-800">{formatUsdM2(building.askingRentUsdM2)}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
            <dt className="font-medium text-slate-500">Andenes</dt>
            <dd className="font-bold text-slate-800">{building.dockDoors}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-100">
            <dt className="font-medium text-slate-500">Altura libre</dt>
            <dd className="font-bold text-slate-800">{building.clearHeightM ?? '—'} m</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs font-medium text-slate-700">
          Bruta: {formatAreaM2(building.totalGrossM2)} · Rentable: {formatAreaM2(building.netRentableM2)} · {building.availabilityState}
          {building.hasGas ? ' · Gas' : ''}{building.powerKva ? ` · ${building.powerKva} kVA` : ''}
        </p>
        {!isStaff && (
          <p className="mt-1 text-[11px] text-slate-500">Nombre del ocupante y negociaciones ocultos por política de visibilidad (backend).</p>
        )}
        <p className="mt-2 text-[11px] font-medium text-slate-500">
          Para editar superficies, renta o specs usa «Editar en wizard».
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Field label="Comentario">
            <input className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motivo del cambio" />
          </Field>
          {nextStatuses(building.status).map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => onSubmitForReview(building.id, to, comment || undefined)}
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
