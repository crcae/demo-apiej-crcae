import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.js';
import type { Building, EntityStatus, Land, Park } from '../../types/domain.js';
import { firstZodMessage, formatZodErrors, parkDraftSchema } from '../../schemas/capture.js';
import { formatAreaM2 } from '../../utils/formatters.js';
import { BuildingForm } from '../naves/BuildingForm.js';
import { LandForm } from '../terrenos/LandForm.js';

type Category = 'parques' | 'naves' | 'terrenos';

interface Props {
  parks: Park[];
  buildings: Building[];
  lands: Land[];
  isStaff: boolean;
  actorOrgId: string;
  onSubmitReview: (kind: 'PARK' | 'BUILDING' | 'LAND', id: string, to: EntityStatus, comment?: string) => void;
  onUpdatePark: (id: string, patch: Partial<Park>) => void;
  onCreatePark: () => void;
  onNewBuilding: () => void;
  onEditBuilding: (b: Building) => void;
}

const MUNICIPIOS = ['El Salto', 'Tlajomulco', 'Zapopan', 'Tlaquepaque', 'Tonalá', 'Guadalajara'];

function statusBadge(status: Park['status']): { label: string; cls: string } {
  if (status === 'VERIFIED') return { label: 'Verificado', cls: 'bg-emerald-500/15 text-emerald-800' };
  if (status === 'PENDING_VALIDATION') return { label: 'En revisión', cls: 'bg-amber-500/15 text-amber-800' };
  if (status === 'CHANGES_REQUESTED') return { label: 'Con observaciones', cls: 'bg-[#4A6CFF]/15 text-[#0284c7]' };
  return { label: 'Borrador', cls: 'bg-slate-200 text-slate-700' };
}

function num(v: string): number {
  const n = Number(v.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function CaptureView({
  parks, buildings, lands, isStaff, actorOrgId,
  onSubmitReview, onUpdatePark, onCreatePark, onNewBuilding, onEditBuilding,
}: Props): React.JSX.Element {
  const [cat, setCat] = useState<Category>('parques');
  const [search, setSearch] = useState('');
  const [fStatus, setFStatus] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [total, setTotal] = useState('');
  const [dev, setDev] = useState('');
  const [reserve, setReserve] = useState('');
  const [comment, setComment] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return parks.filter((p) => {
      if (fStatus !== 'ALL' && p.status !== fStatus) return false;
      if (q !== '' && !`${p.name} ${p.municipality}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [parks, search, fStatus]);

  const selected = parks.find((p) => p.id === selectedId) ?? list[0] ?? null;

  // Load selected park into the form.
  useEffect(() => {
    if (selected === null) return;
    setName(selected.name);
    setMunicipio(selected.municipality);
    setTotal(String(selected.totalLandM2));
    setDev(String(selected.developedM2));
    setReserve(String(selected.reserveM2));
    setComment('');
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const match = selected !== null && num(total) === num(dev) + num(reserve);
  const diff = Math.abs(num(total) - (num(dev) + num(reserve)));

  function parseDraftCandidate(): Record<string, unknown> {
    const totalN = Number(total.replace(/,/g, ''));
    const devN = Number(dev.replace(/,/g, ''));
    const reserveN = Number(reserve.replace(/,/g, ''));
    return {
      name: name.trim(),
      municipality: municipio,
      totalLandM2: Number.isFinite(totalN) ? totalN : Number.NaN,
      developedM2: Number.isFinite(devN) ? devN : Number.NaN,
      reserveM2: Number.isFinite(reserveN) ? reserveN : Number.NaN,
    };
  }

  function validatePark(): Partial<Park> | null {
    const parsed = parkDraftSchema.safeParse(parseDraftCandidate());
    if (!parsed.success) {
      setFieldErrors(formatZodErrors(parsed.error));
      setFormError(firstZodMessage(parsed.error));
      return null;
    }
    setFieldErrors({});
    setFormError(null);
    return parsed.data;
  }

  function reset(): void {
    if (selected === null) return;
    setName(selected.name);
    setMunicipio(selected.municipality);
    setTotal(String(selected.totalLandM2));
    setDev(String(selected.developedM2));
    setReserve(String(selected.reserveM2));
    setComment('');
    setFormError(null);
    setFieldErrors({});
  }

  const sel = statusBadge(selected?.status ?? 'DRAFT');
  const inputCls = 'w-full rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none';

  return (
    <div>
      <PageHeader
        section="Captura"
        title="Captura sencilla"
        subtitle="1) Completa datos · 2) Guarda borrador · 3) Envía a revisión. Las naves se editan con el wizard."
      />

      <div className="mb-4 mt-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5">
          {([
            ['parques', `Parques ${parks.length}`],
            ['naves', `Naves ${buildings.length}`],
            ['terrenos', `Terrenos ${lands.length}`],
          ] as Array<[Category, string]>).map(([c, label]) => {
            const active = cat === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 text-xs transition ${
                  active
                    ? 'rounded-xl border border-[#4A6CFF]/30 bg-[#4A6CFF]/10 font-bold text-[#4A6CFF]'
                    : 'rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm hover:text-[#0E1A3D]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        {cat === 'parques' && (
          <button
            type="button"
            onClick={onCreatePark}
            className="ml-auto flex cursor-pointer items-center gap-2 rounded-xl bg-[#4A6CFF] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#3b5aef]"
          >
            + Nuevo parque
          </button>
        )}
        {cat === 'naves' && (
          <button
            type="button"
            onClick={onNewBuilding}
            className="ml-auto rounded-xl bg-[#4A6CFF] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#3b5aef]"
          >
            + Nueva nave (wizard)
          </button>
        )}
      </div>

      {cat === 'parques' && (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* Registry list */}
          <div>
            <h3 className="mb-3 text-lg font-extrabold text-slate-900">Parques registrados</h3>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Buscar parque"
              className="mb-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-500"
            />
            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">Estado: Todos</option>
              <option value="VERIFIED">Verificado</option>
              <option value="PENDING_VALIDATION">En revisión</option>
              <option value="DRAFT">Borrador</option>
            </select>
            <div className="space-y-2">
              {list.map((p) => {
                const b = statusBadge(p.status);
                const active = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full rounded-[2rem] border p-4 text-left transition-all duration-200 ${
                      active
                        ? 'border-[#4A6CFF]/40 bg-[#E2E8F0] shadow-inner'
                        : 'border-slate-200/80 bg-white shadow-sm hover:shadow-sm'
                    }`}
                  >
                    <span className="block text-sm font-extrabold text-[#0F172A]">{p.name}</span>
                    <span className="mt-0.5 block text-xs font-medium text-slate-600">
                      {p.totalLandM2 > 0 ? `${p.municipality} · ${formatAreaM2(p.totalLandM2)}` : 'Superficie por consultar'}
                    </span>
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${b.cls}`}>
                      {b.label}
                    </span>
                  </button>
                );
              })}
              {list.length === 0 && (
                <p className="rounded-[2rem] border border-slate-200/80 bg-white p-4 text-xs font-medium text-slate-600 shadow-sm">
                  Sin resultados para tu organización (aislamiento por tenant).
                </p>
              )}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">{list.length} registros</p>
          </div>

          {/* Edit form */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            {selected === null && (
              <p className="text-sm font-medium text-slate-600">Selecciona un parque para editarlo.</p>
            )}
            {selected !== null && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Editar parque</p>
                    <h3 className="mt-0.5 text-2xl font-black tracking-tight text-[#0E1A3D]">{name || selected.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${sel.cls}`}>{sel.label}</span>
                    <span className="px-1 text-base font-black text-slate-400">⋮</span>
                  </div>
                </div>

                <p className="mb-2 mt-4 text-sm font-bold text-slate-900">Datos generales</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-700">Nombre del parque *</span>
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
                    {fieldErrors.name !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{fieldErrors.name}</p>}
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-700">Municipio *</span>
                    <select value={municipio} onChange={(e) => setMunicipio(e.target.value)} className={inputCls}>
                      {[...new Set([selected.municipality, ...MUNICIPIOS, ...parks.map((p) => p.municipality)])].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {fieldErrors.municipality !== undefined && <p className="mt-1 text-[11px] font-bold text-red-600">{fieldErrors.municipality}</p>}
                  </label>
                </div>

                <p className="mb-2 mt-6 text-sm font-bold text-slate-900">Superficies</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {([
                    ['Superficie total *', total, setTotal],
                    ['Superficie desarrollada', dev, setDev],
                    ['Reserva territorial', reserve, setReserve],
                  ] as Array<[string, string, (v: string) => void]>).map(([label, v, set]) => (
                    <label key={label} className="block">
                      <span className="mb-1 block text-xs font-semibold text-slate-700">{label}</span>
                      <span className="flex items-center gap-1.5">
                        <input value={v} inputMode="decimal" onChange={(e) => set(e.target.value)} className={inputCls} />
                        <span className="text-xs font-bold text-slate-500">m²</span>
                      </span>
                    </label>
                  ))}
                </div>
                <div className={`mt-3 flex items-center justify-between rounded-2xl border p-3 text-xs ${
                  match ? 'border-emerald-500/20 bg-emerald-500/10' : 'border-red-500/20 bg-red-500/10'
                }`}>
                  <span className="font-medium text-slate-600">Total = superficie desarrollada + reserva territorial</span>
                  {match ? (
                    <span className="flex items-center gap-1 font-bold text-emerald-700">✔ Las superficies coinciden.</span>
                  ) : (
                    <span className="font-bold text-red-600">✕ Diferencia de {formatAreaM2(diff)}.</span>
                  )}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  ℹ Captura superficies en metros cuadrados.
                </p>

                <p className="mb-2 mt-6 text-sm font-bold text-slate-900">Comentarios para revisión (Opcional)</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Describe los cambios o lo que debe revisar el equipo."
                  className="min-h-[90px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-500"
                />

                <p className="mt-6 text-xs font-medium text-slate-400">* Campos obligatorios</p>
                {formError !== null && (
                  <p className="mt-2 rounded-xl bg-red-50 p-2 text-xs font-bold text-red-600">{formError}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button" onClick={reset}
                    className="mr-4 cursor-pointer text-xs font-bold text-[#4A6CFF] transition hover:underline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const draft = validatePark();
                      if (draft === null) return;
                      onUpdatePark(selected.id, draft);
                    }}
                    className="mr-3 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-blue-600 shadow-sm transition-all hover:text-blue-800"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const draft = validatePark();
                      if (draft === null) return;
                      onUpdatePark(selected.id, draft);
                      onSubmitReview('PARK', selected.id, 'PENDING_VALIDATION', comment || undefined);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#4A6CFF] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#3b5aef]"
                  >
                    Enviar a revisión ➔
                  </button>
                </div>
                <p className="mt-1.5 text-right text-[10px] font-medium text-slate-400">
                  Guardar borrador no envía el registro a revisión.
                </p>
                {!isStaff && (
                  <p className="mt-1.5 text-right text-[10px] font-medium text-slate-500">
                    Solo ves parques de tu organización ({actorOrgId}).
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {cat === 'naves' && (
        <div className="space-y-3">
          {buildings.length === 0 && <p className="text-sm font-medium text-slate-600">Sin naves visibles para tu organización.</p>}
          {buildings.map((b) => (
            <div key={b.id} className="space-y-1">
              <BuildingForm building={b} isStaff={isStaff} onSubmitForReview={(id, to, c) => onSubmitReview('BUILDING', id, to, c)} />
              <button type="button" onClick={() => onEditBuilding(b)} className="text-xs font-bold text-[#4A6CFF] hover:underline">
                Editar en wizard →
              </button>
            </div>
          ))}
        </div>
      )}

      {cat === 'terrenos' && (
        <div className="space-y-3">
          {lands.length === 0 && <p className="text-sm font-medium text-slate-600">Sin terrenos visibles para tu organización.</p>}
          {lands.map((l) => (
            <LandForm key={l.id} land={l} onSubmitForReview={(id, to, c) => onSubmitReview('LAND', id, to, c)} />
          ))}
        </div>
      )}
    </div>
  );
}
