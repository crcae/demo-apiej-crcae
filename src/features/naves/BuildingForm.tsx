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

export function BuildingForm({ building, isStaff, onSubmitForReview }: Props): React.JSX.Element {
  const [code, setCode] = useState(building.code);
  const [rent, setRent] = useState(String(building.askingRentUsdM2 ?? ''));
  const [docks, setDocks] = useState(String(building.dockDoors));
  const [height, setHeight] = useState(String(building.clearHeightM ?? ''));
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
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Código">
            <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field label="Renta USD/m²">
            <input className={inputCls} inputMode="decimal" value={rent} onChange={(e) => setRent(e.target.value)} />
          </Field>
          <Field label="Andenes">
            <input className={inputCls} inputMode="numeric" value={docks} onChange={(e) => setDocks(e.target.value)} />
          </Field>
          <Field label="Altura libre (m)">
            <input className={inputCls} inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Bruta: {formatAreaM2(building.totalGrossM2)} · Rentable: {formatAreaM2(building.netRentableM2)} · Renta: {formatUsdM2(building.askingRentUsdM2)} · {building.availabilityState}
          {building.hasGas ? ' · Gas' : ''}{building.powerKva ? ` · ${building.powerKva} kVA` : ''}
        </p>
        {!isStaff && (
          <p className="mt-1 text-[11px] text-slate-400">Nombre del ocupante y negociaciones ocultos por política de visibilidad (backend).</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Field label="Comentario">
            <input className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Motivo del cambio" />
          </Field>
          {nextStatuses(building.status).map((to) => (
            <button
              key={to}
              type="button"
              onClick={() => onSubmitForReview(building.id, to, comment || undefined)}
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
