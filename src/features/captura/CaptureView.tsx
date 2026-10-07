import { useEffect, useMemo, useState } from 'react';
import type { Building, EntityStatus, Land, Park } from '../../types/domain.js';
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
  if (status === 'CHANGES_REQUESTED') return { label: 'Con observaciones', cls: 'bg-[#00a2ff]/15 text-[#0284c7]' };
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

  function draft(): Partial<Park> {
    return { name: name.trim(), municipality: municipio, totalLandM2: num(total), developedM2: num(dev), reserveM2: num(reserve) };
  }

  function reset(): void {
    if (selected === null) return;
    setName(selected.name);
    setMunicipio(selected.municipality);
    setTotal(String(selected.totalLandM2));
    setDev(String(selected.developedM2));
    setReserve(String(selected.reserveM2));
    setComment('');
  }

  const sel = statusBadge(selected?.status ?? 'DRAFT');
  const inputCls = 'w-full rounded-xl border border-white/60 bg-[#E0E5EC] px-3 py-2 text-xs font-semibold text-slate-800 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none';

  return (
    <div>
      {/* Header */}
      <p className="text-xs font-medium text-slate-500">Panel / Captura</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">Registro de parques y espacios</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">Actualiza la información y envíala a revisión.</p>
        </div>
        <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Datos de ejemplo
        </span>
      </div>

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
                className={`px-3 py-1.5 text-xs transition-all duration-200 ${
                  active
                    ? 'rounded-xl border border-blue-500/20 bg-blue-500/10 font-bold text-blue-700'
                    : 'rounded-xl bg-[#EBF0F5] font-semibold text-slate-700 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff] hover:text-slate-950'
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
            className="ml-auto flex cursor-pointer items-center gap-2 rounded-xl bg-[#b3d700] px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md transition-all hover:bg-[#a2c400]"
          >
            + Nuevo parque
          </button>
        )}
        {cat === 'naves' && (
          <button
            type="button"
            onClick={onNewBuilding}
            className="ml-auto rounded-xl bg-[#b3d700] px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md transition-all hover:bg-[#a2c400]"
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
              className="mb-2.5 w-full rounded-xl border border-white/50 bg-[#E0E5EC] px-3.5 py-2 text-xs font-medium text-slate-800 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-slate-500"
            />
            <select
              value={fStatus}
              onChange={(e) => setFStatus(e.target.value)}
              className="mb-3 w-full rounded-xl border border-white/50 bg-[#E0E5EC] px-3 py-2 text-xs font-semibold text-slate-700 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none"
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
                        ? 'border-[#00a2ff]/40 bg-[#E2E8F0] shadow-[inset_4px_4px_8px_#c5ccd6,inset_-4px_-4px_8px_#ffffff]'
                        : 'border-white/60 bg-[#EBF0F5] shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff] hover:shadow-[8px_8px_16px_#c5ccd6,-8px_-8px_16px_#ffffff]'
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
                <p className="rounded-[2rem] border border-white/60 bg-[#EBF0F5] p-4 text-xs font-medium text-slate-600 shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff]">
                  Sin resultados para tu organización (aislamiento por tenant).
                </p>
              )}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">{list.length} registros</p>
          </div>

          {/* Edit form */}
          <div className="rounded-3xl border border-white/60 bg-[#EBF0F5] p-6 shadow-[10px_10px_24px_#c5ccd6,-10px_-10px_24px_#ffffff]">
            {selected === null && (
              <p className="text-sm font-medium text-slate-600">Selecciona un parque para editarlo.</p>
            )}
            {selected !== null && (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Editar parque</p>
                    <h3 className="mt-0.5 text-2xl font-black tracking-tight text-slate-950">{name || selected.name}</h3>
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
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-slate-700">Municipio *</span>
                    <select value={municipio} onChange={(e) => setMunicipio(e.target.value)} className={inputCls}>
                      {[...new Set([selected.municipality, ...MUNICIPIOS, ...parks.map((p) => p.municipality)])].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
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
                  className="min-h-[90px] w-full rounded-2xl border border-white/50 bg-[#E0E5EC] p-3 text-xs font-medium text-slate-800 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-slate-500"
                />

                <p className="mt-6 text-xs font-medium text-slate-400">* Campos obligatorios</p>
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button" onClick={reset}
                    className="mr-4 cursor-pointer text-xs font-bold text-[#00a2ff] transition hover:underline"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (name.trim() === '' || municipio === '') return;
                      onUpdatePark(selected.id, draft());
                    }}
                    className="mr-3 rounded-xl bg-[#EBF0F5] px-4 py-2.5 text-xs font-bold text-blue-600 shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff] transition-all hover:text-blue-800"
                  >
                    Guardar borrador
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (name.trim() === '' || municipio === '') return;
                      onUpdatePark(selected.id, draft());
                      onSubmitReview('PARK', selected.id, 'PENDING_VALIDATION', comment || undefined);
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#00a2ff] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#008cdc]"
                  >
                    Enviar a validación ➔
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
              <button type="button" onClick={() => onEditBuilding(b)} className="text-xs font-bold text-[#00a2ff] hover:underline">
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
