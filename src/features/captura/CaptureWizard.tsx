import { useState } from 'react';
import type { AvailabilityState, Building, BuildingClass, Park, Visibility } from '../../types/domain.js';
import { buildingDraftSchema, firstZodMessage, formatZodErrors } from '../../schemas/capture.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';
import { Card, CardBody, Field, inputCls } from '../../components/ui/primitives.js';

export interface WizardDraft {
  parkId: string;
  code: string;
  buildingClass: BuildingClass;
  totalGrossM2: number;
  netRentableM2: number;
  clearHeightM?: number;
  dockDoors: number;
  ramps: number;
  powerKva?: number;
  hasGas: boolean;
  hasCrane: boolean;
  availabilityState: AvailabilityState;
  askingRentUsdM2?: number;
  visibility: Visibility;
}

interface Props {
  parks: Park[];
  editing: Building | null;
  fxUsdMxn: number;
  onClose: () => void;
  onSave: (draft: WizardDraft, submit: boolean, editingId: string | null) => void;
}

function parseNonNeg(v: string): number | null {
  if (v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function CaptureWizard({ parks, editing, fxUsdMxn, onClose, onSave }: Props): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [parkId, setParkId] = useState(editing?.parkId ?? parks[0]?.id ?? '');
  const [code, setCode] = useState(editing?.code ?? 'N-04');
  const [bClass, setBClass] = useState<BuildingClass>(editing?.buildingClass ?? 'A');
  const [gross, setGross] = useState(String(editing?.totalGrossM2 ?? 15200));
  const [rentable, setRentable] = useState(String(editing?.netRentableM2 ?? 14500));
  const [height, setHeight] = useState(String(editing?.clearHeightM ?? 10.4));
  const [docks, setDocks] = useState(String(editing?.dockDoors ?? 16));
  const [ramps, setRamps] = useState(String(editing?.ramps ?? 2));
  const [power, setPower] = useState(String(editing?.powerKva ?? 2000));
  const [gas, setGas] = useState(editing?.hasGas ?? true);
  const [crane, setCrane] = useState(editing?.hasCrane ?? false);
  const [avail, setAvail] = useState<AvailabilityState>(editing?.availabilityState ?? 'AVAILABLE');
  const [rent, setRent] = useState(String(editing?.askingRentUsdM2 ?? 6.9));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function buildCandidate(): Record<string, unknown> {
    const grossN = parseNonNeg(gross);
    const rentableN = parseNonNeg(rentable);
    const docksN = parseNonNeg(docks);
    const rampsN = parseNonNeg(ramps);
    const heightN = height.trim() === '' ? undefined : parseNonNeg(height);
    const powerN = power.trim() === '' ? undefined : parseNonNeg(power);
    const rentN = rent.trim() === '' ? undefined : parseNonNeg(rent);

    return {
      parkId,
      code: code.trim(),
      buildingClass: bClass,
      totalGrossM2: grossN ?? Number.NaN,
      netRentableM2: rentableN ?? Number.NaN,
      clearHeightM: heightN === null ? Number.NaN : heightN,
      dockDoors: docksN === null ? Number.NaN : Math.round(docksN),
      ramps: rampsN === null ? Number.NaN : Math.round(rampsN),
      powerKva: powerN === null ? Number.NaN : powerN,
      hasGas: gas,
      hasCrane: crane,
      availabilityState: avail,
      askingRentUsdM2: rentN === null ? Number.NaN : rentN,
      visibility: 'PRIVATE',
    };
  }

  function validate(): WizardDraft | null {
    const candidate = buildCandidate();
    // Drop undefined optionals that failed empty-string path
    if (candidate.clearHeightM === undefined) delete candidate.clearHeightM;
    if (candidate.powerKva === undefined) delete candidate.powerKva;
    if (candidate.askingRentUsdM2 === undefined) delete candidate.askingRentUsdM2;

    const parsed = buildingDraftSchema.safeParse(candidate);
    if (!parsed.success) {
      setFieldErrors(formatZodErrors(parsed.error));
      setError(firstZodMessage(parsed.error));
      return null;
    }
    setFieldErrors({});
    setError(null);
    return parsed.data as WizardDraft;
  }

  function previewDraft(): WizardDraft {
    const g = parseNonNeg(gross) ?? 0;
    const r = parseNonNeg(rentable) ?? 0;
    return {
      parkId,
      code: code.trim(),
      buildingClass: bClass,
      totalGrossM2: g,
      netRentableM2: r,
      clearHeightM: height.trim() === '' ? undefined : (parseNonNeg(height) ?? undefined),
      dockDoors: Math.round(parseNonNeg(docks) ?? 0),
      ramps: Math.round(parseNonNeg(ramps) ?? 0),
      powerKva: power.trim() === '' ? undefined : (parseNonNeg(power) ?? undefined),
      hasGas: gas,
      hasCrane: crane,
      availabilityState: avail,
      askingRentUsdM2: rent.trim() === '' ? undefined : (parseNonNeg(rent) ?? undefined),
      visibility: 'PRIVATE',
    };
  }

  const d = previewDraft();
  const rentMxn = d.askingRentUsdM2 !== undefined ? d.askingRentUsdM2 * fxUsdMxn : undefined;
  const err = (key: string): string | undefined => fieldErrors[key];

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0B192C]/60 p-4 sm:items-center" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <Card>
          <CardBody>
            <div className="mb-1 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#0B192C]">
                {editing ? `Editar nave ${editing.code}` : 'Nueva nave'} · Wizard de captura
              </h3>
              <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="mb-4 flex gap-1.5">
              {[1, 2, 3].map((s) => (
                <span key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-brand-blue' : 'bg-slate-200'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Field label="Parque">
                  <select className={inputCls} value={parkId} onChange={(e) => setParkId(e.target.value)}>
                    {parks.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  {err('parkId') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('parkId')}</p>}
                </Field>
                <Field label="Código (ej. N-04)">
                  <input className={inputCls} value={code} onChange={(e) => setCode(e.target.value)} />
                  {err('code') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('code')}</p>}
                </Field>
                <Field label="Clase">
                  <select className={inputCls} value={bClass} onChange={(e) => setBClass(e.target.value as BuildingClass)}>
                    <option value="A">A</option><option value="A-">A-</option><option value="B">B</option><option value="C">C</option>
                  </select>
                </Field>
                <Field label="Superficie bruta (m²)">
                  <input className={inputCls} inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} />
                  {err('totalGrossM2') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('totalGrossM2')}</p>}
                </Field>
                <Field label="Superficie rentable (m²)">
                  <input className={inputCls} inputMode="decimal" value={rentable} onChange={(e) => setRentable(e.target.value)} />
                  {err('netRentableM2') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('netRentableM2')}</p>}
                </Field>
                <Field label="Altura libre (m)">
                  <input className={inputCls} inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
                  {err('clearHeightM') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('clearHeightM')}</p>}
                </Field>
                <Field label="Andenes">
                  <input className={inputCls} inputMode="numeric" value={docks} onChange={(e) => setDocks(e.target.value)} />
                  {err('dockDoors') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('dockDoors')}</p>}
                </Field>
                <Field label="Rampas">
                  <input className={inputCls} inputMode="numeric" value={ramps} onChange={(e) => setRamps(e.target.value)} />
                  {err('ramps') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('ramps')}</p>}
                </Field>
                <Field label="Subestación (kVA)">
                  <input className={inputCls} inputMode="decimal" value={power} onChange={(e) => setPower(e.target.value)} />
                  {err('powerKva') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('powerKva')}</p>}
                </Field>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input type="checkbox" checked={gas} onChange={(e) => setGas(e.target.checked)} className="h-4 w-4 accent-brand-blue" /> Gas natural
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input type="checkbox" checked={crane} onChange={(e) => setCrane(e.target.checked)} className="h-4 w-4 accent-brand-blue" /> Grúa puente
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Disponibilidad">
                  <select className={inputCls} value={avail} onChange={(e) => setAvail(e.target.value as AvailabilityState)}>
                    <option value="AVAILABLE">Disponible</option>
                    <option value="UNDER_CONSTRUCTION">En construcción</option>
                    <option value="RESERVED">Reservada</option>
                    <option value="LEASED">Ocupada</option>
                  </select>
                </Field>
                <Field label="Renta pedida (USD/m²)">
                  <input className={inputCls} inputMode="decimal" value={rent} onChange={(e) => setRent(e.target.value)} />
                  {err('askingRentUsdM2') !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{err('askingRentUsdM2')}</p>}
                </Field>
                <p className="col-span-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                  Conversión automática Banxico {fxUsdMxn}: {formatUsdM2(d.askingRentUsdM2)} ≈{' '}
                  {rentMxn !== undefined ? `$${rentMxn.toFixed(2)} MXN/m²` : '—'} · La ficha pública mostrará ambas monedas.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm ring-1 ring-slate-200">
                <p className="font-extrabold text-[#0B192C]">Nave {d.code} · Clase {d.buildingClass} · {d.availabilityState}</p>
                <p className="mt-1 text-slate-600">
                  {formatAreaM2(d.netRentableM2)} rentables · {d.dockDoors} andenes · {d.clearHeightM ?? '—'} m altura ·{' '}
                  {formatUsdM2(d.askingRentUsdM2)}{d.hasGas ? ' · gas' : ''}{d.powerKva ? ` · ${d.powerKva} kVA` : ''}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Al enviar: estado → <b>PENDING_VALIDATION</b> · el inbox de Staff recibe alerta · al aprobar, el snapshot Q2 se recalcula y Q1 queda intacto.
                </p>
              </div>
            )}

            {error !== null && <p className="mt-3 rounded-xl bg-red-50 p-2 text-xs font-bold text-red-600">{error}</p>}

            <div className="mt-4 flex flex-wrap justify-between gap-2">
              <button
                type="button" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-40"
              >
                Atrás
              </button>
              <div className="flex gap-2">
                {step < 3 && (
                  <button
                    type="button" onClick={() => { if (validate() !== null) setStep((s) => s + 1); }}
                    className="rounded-xl bg-brand-blue px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
                  >
                    Siguiente
                  </button>
                )}
                {step === 3 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const draft = validate();
                        if (draft !== null) onSave(draft, false, editing?.id ?? null);
                      }}
                      className="rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-300"
                    >
                      Guardar borrador
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const draft = validate();
                        if (draft !== null) onSave(draft, true, editing?.id ?? null);
                      }}
                      className="rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
                    >
                      Enviar a validación
                    </button>
                  </>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
