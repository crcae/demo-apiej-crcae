import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/PageHeader.js';
import type { AuditEntry, Building, EntityStatus, Land, Park } from '../../types/domain.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';

type ReviewTab = 'pendientes' | 'observaciones' | 'resueltos';
type DetailTab = 'info' | 'cambios';
type Kind = 'PARK' | 'BUILDING' | 'LAND';

export interface ReviewItem {
  kind: Kind;
  id: string;
  title: string;
  status: EntityStatus;
}

interface Props {
  parks: Park[];
  buildings: Building[];
  lands: Land[];
  audit: AuditEntry[];
  actorOrgId: string;
  isStaff: boolean;
  spotlight: boolean;
  onDecide: (item: ReviewItem, to: EntityStatus, comment: string) => void;
}

const KIND_LABEL: Record<Kind, string> = { PARK: 'PARQUE', BUILDING: 'NAVE', LAND: 'TERRENO' };

function statusBadge(status: EntityStatus): { label: string; cls: string } {
  if (status === 'PENDING_VALIDATION') return { label: 'Pendiente', cls: 'bg-amber-500/15 text-amber-800' };
  if (status === 'CHANGES_REQUESTED') return { label: 'Con observaciones', cls: 'bg-[#4A6CFF]/15 text-[#0284c7]' };
  if (status === 'VERIFIED') return { label: 'Verificado', cls: 'bg-emerald-500/15 text-emerald-800' };
  if (status === 'REJECTED') return { label: 'Rechazado', cls: 'bg-red-500/15 text-red-700' };
  return { label: 'Borrador', cls: 'bg-slate-200 text-slate-700' };
}

function orDash(v: string | undefined): string {
  return v !== undefined && v !== '' ? v : '—';
}

export function ValidationView({ parks, buildings, lands, audit, actorOrgId, isStaff, spotlight, onDecide }: Props): React.JSX.Element {
  const [tab, setTab] = useState<ReviewTab>('pendientes');
  const [detailTab, setDetailTab] = useState<DetailTab>('info');
  const [search, setSearch] = useState('');
  const [fKind, setFKind] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState<string | null>(null);

  const all: ReviewItem[] = useMemo(() => {
    const rows: ReviewItem[] = [
      ...parks.map((p): ReviewItem => ({ kind: 'PARK', id: p.id, title: p.name, status: p.status })),
      ...buildings.map((b): ReviewItem => ({ kind: 'BUILDING', id: b.id, title: `Nave ${b.code}`, status: b.status })),
      ...lands.map((l): ReviewItem => ({ kind: 'LAND', id: l.id, title: l.name, status: l.status })),
    ];
    const scoped = isStaff ? rows : rows.filter((it) => {
      if (it.kind === 'PARK') return parks.find((p) => p.id === it.id)?.orgId === actorOrgId;
      if (it.kind === 'BUILDING') return buildings.find((b) => b.id === it.id)?.orgId === actorOrgId;
      return lands.find((l) => l.id === it.id)?.orgId === actorOrgId;
    });
    return scoped.filter((it) => it.status !== 'DRAFT' && it.status !== 'ARCHIVED');
  }, [parks, buildings, lands, isStaff, actorOrgId]);

  const counts = useMemo(() => ({
    pendientes: all.filter((i) => i.status === 'PENDING_VALIDATION').length,
    observaciones: all.filter((i) => i.status === 'CHANGES_REQUESTED').length,
    resueltos: all.filter((i) => i.status === 'VERIFIED' || i.status === 'REJECTED').length,
  }), [all]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((it) => {
      if (tab === 'pendientes' && it.status !== 'PENDING_VALIDATION') return false;
      if (tab === 'observaciones' && it.status !== 'CHANGES_REQUESTED') return false;
      if (tab === 'resueltos' && !(it.status === 'VERIFIED' || it.status === 'REJECTED')) return false;
      if (fKind !== 'ALL' && it.kind !== fKind) return false;
      if (q !== '' && !`${KIND_LABEL[it.kind]} ${it.title}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, tab, fKind, search]);

  const selected = list.find((i) => i.id === selectedId) ?? list[0] ?? null;
  const park = selected?.kind === 'PARK' ? parks.find((p) => p.id === selected.id) ?? null : null;
  const building = selected?.kind === 'BUILDING' ? buildings.find((b) => b.id === selected.id) ?? null : null;
  const land = selected?.kind === 'LAND' ? lands.find((l) => l.id === selected.id) ?? null : null;
  const history = selected === null ? [] : audit.filter((a) => a.entityLabel === selected.title || a.entityLabel === selected.id);
  const badge = statusBadge(selected?.status ?? 'PENDING_VALIDATION');

  function pick(id: string): void {
    setSelectedId(id);
    setNotes('');
    setNotesError(null);
    setDetailTab('info');
  }

  function requireNotes(): boolean {
    if (notes.trim() === '') {
      setNotesError('Obligatorio para solicitar cambios o rechazar: escribe el motivo.');
      return false;
    }
    setNotesError(null);
    return true;
  }

  function decide(to: EntityStatus): void {
    if (selected === null || !isStaff) return;
    if ((to === 'CHANGES_REQUESTED' || to === 'REJECTED') && !requireNotes()) return;
    onDecide(selected, to, notes.trim() === '' ? 'Aprobado por APIEJ' : notes.trim());
    setNotes('');
    setNotesError(null);
  }

  function Field({ label, value }: { label: string; value: string }): React.JSX.Element {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
        <p className="text-[11px] font-semibold text-slate-600">{label}</p>
        <p className="mt-0.5 text-xs font-bold text-[#0F172A]">{value}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        section="Validación"
        title="Bandeja de revisión"
        subtitle="Elige un registro → revisa datos → Aprobar, Pedir cambios o Rechazar."
        actions={(
          <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            {counts.pendientes} pendientes
          </span>
        )}
      />

      {/* Filter tabs */}
      <div className="mb-4 mt-4 flex flex-wrap gap-2">
        {([
          ['pendientes', `Pendientes ${counts.pendientes}`],
          ['observaciones', 'Con observaciones'],
          ['resueltos', 'Resueltos'],
        ] as Array<[ReviewTab, string]>).map(([t, label]) => {
          const active = tab === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setSelectedId(null); }}
              className={`px-4 py-2 text-xs transition ${
                active
                  ? 'rounded-xl border border-[#4A6CFF]/30 bg-[#4A6CFF]/10 font-bold text-[#4A6CFF] shadow-sm'
                  : 'rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm hover:text-[#0E1A3D]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* List */}
        <div>
          <h3 className="mb-3 text-lg font-extrabold text-slate-900">
            {tab === 'pendientes' ? 'Pendientes de revisión' : tab === 'observaciones' ? 'Con observaciones' : 'Resueltos'}
          </h3>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar registro"
            className="mb-2.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-500"
          />
          <select
            value={fKind}
            onChange={(e) => setFKind(e.target.value)}
            className="mb-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">Tipo: Todos</option>
            <option value="PARK">Parques</option>
            <option value="BUILDING">Naves</option>
            <option value="LAND">Terrenos</option>
          </select>
          <div className="space-y-2">
            {list.map((it, idx) => {
              const b = statusBadge(it.status);
              const active = selected?.id === it.id;
              return (
                <button
                  key={`${it.kind}-${it.id}`}
                  type="button"
                  onClick={() => pick(it.id)}
                  className={`w-full rounded-[2rem] border border-slate-200/80 bg-white p-4 text-left transition-all duration-200 ${
                    active
                      ? 'border-l-4 border-l-[#4A6CFF] bg-blue-500/5 shadow-inner'
                      : 'shadow-sm hover:shadow-sm'
                  } ${spotlight && idx === 0 && tab === 'pendientes' ? 'animate-pulse ring-4 ring-emerald-500 ring-offset-2 ring-offset-white' : ''}`}
                >
                  <span className="block text-[10px] font-bold tracking-wider text-slate-500">{KIND_LABEL[it.kind]}</span>
                  <span className="mt-0.5 block text-sm font-extrabold text-[#0F172A]">{it.title}</span>
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${b.cls}`}>
                    {b.label}
                  </span>
                </button>
              );
            })}
            {list.length === 0 && (
              <p className="rounded-[2rem] border border-slate-200/80 bg-white p-4 text-xs font-medium text-slate-600 shadow-sm">
                Sin registros en esta bandeja.
              </p>
            )}
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">
            {list.length} {list.length === 1 ? 'registro' : 'registros'} {tab === 'pendientes' ? 'pendientes' : tab === 'observaciones' ? 'con observaciones' : 'resueltos'}
          </p>
        </div>

        {/* Detail */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
          {selected === null && (
            <p className="text-sm font-medium text-slate-600">Selecciona un registro para revisarlo.</p>
          )}
          {selected !== null && (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Revisar {selected.kind === 'PARK' ? 'parque' : selected.kind === 'BUILDING' ? 'nave' : 'terreno'}
                  </p>
                  <h3 className="mt-0.5 text-2xl font-black tracking-tight text-[#0E1A3D]">{selected.title}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>{badge.label}</span>
              </div>

              <div className="mt-3 flex gap-5 border-b border-slate-200">
                {([{ t: 'info', label: 'Información' }, { t: 'cambios', label: 'Historial' }] as Array<{ t: DetailTab; label: string }>).map(({ t, label }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDetailTab(t)}
                    className={`pb-2 text-xs transition ${
                      detailTab === t
                        ? 'border-b-2 border-[#4A6CFF] font-bold text-blue-600'
                        : 'font-semibold text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {detailTab === 'info' && (
                <>
                  <p className="mb-3 mt-4 text-sm font-extrabold text-slate-900">Información enviada</p>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {selected.kind === 'PARK' && park !== null && (
                      <>
                        <Field label="Tipo de registro" value="Parque" />
                        <Field label="Nombre" value={orDash(park.name)} />
                        <Field label="Municipio" value={orDash(park.municipality)} />
                        <Field label="Superficie total" value={park.totalLandM2 > 0 ? formatAreaM2(park.totalLandM2) : '— m²'} />
                        <Field label="Superficie desarrollada" value={park.developedM2 > 0 ? formatAreaM2(park.developedM2) : '— m²'} />
                        <Field label="Reserva territorial" value={park.reserveM2 > 0 ? formatAreaM2(park.reserveM2) : '— m²'} />
                      </>
                    )}
                    {selected.kind === 'BUILDING' && building !== null && (
                      <>
                        <Field label="Tipo de registro" value="Nave" />
                        <Field label="Código" value={orDash(building.code)} />
                        <Field label="Clase" value={building.buildingClass} />
                        <Field label="Superficie bruta" value={formatAreaM2(building.totalGrossM2)} />
                        <Field label="Superficie rentable" value={formatAreaM2(building.netRentableM2)} />
                        <Field label="Renta pedida" value={building.askingRentUsdM2 !== undefined ? formatUsdM2(building.askingRentUsdM2) : '—'} />
                      </>
                    )}
                    {selected.kind === 'LAND' && land !== null && (
                      <>
                        <Field label="Tipo de registro" value="Terreno" />
                        <Field label="Nombre" value={orDash(land.name)} />
                        <Field label="Superficie total" value={formatAreaM2(land.totalM2)} />
                        <Field label="Superficie vendible" value={formatAreaM2(land.sellableM2)} />
                        <Field label="Precio venta" value={land.priceSaleUsdM2 !== undefined ? formatUsdM2(land.priceSaleUsdM2) : '—'} />
                        <Field label="Disponibilidad" value={land.availabilityState} />
                      </>
                    )}
                  </div>
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    ℹ Vista de ejemplo: campos pendientes de cargar.
                  </p>
                </>
              )}

              {detailTab === 'cambios' && (
                <div className="mt-4 space-y-2">
                  {history.length === 0 && (
                    <p className="text-xs font-medium text-slate-600">Sin movimientos registrados para este registro.</p>
                  )}
                  {history.map((h) => (
                    <div key={h.id} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
                      <p className="text-xs font-bold text-[#0F172A]">{h.actorName} · {h.action}</p>
                      <p className="text-xs font-medium text-slate-600">{h.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {isStaff && selected.status === 'PENDING_VALIDATION' && (
                <>
                  <p className="mb-2 mt-6 text-sm font-extrabold text-slate-900">Observaciones del revisor</p>
                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setNotesError(null); }}
                    placeholder="Indica qué debe corregirse o el motivo del rechazo."
                    className="min-h-[80px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-800 outline-none placeholder:text-slate-500"
                  />
                  {notesError !== null ? (
                    <p className="mt-1.5 text-xs font-bold text-red-600">{notesError}</p>
                  ) : (
                    <p className="mt-1.5 text-xs font-medium text-slate-400">Obligatorio para solicitar cambios o rechazar.</p>
                  )}
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => decide('VERIFIED')}
                      className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#10B981] px-6 py-2.5 text-xs font-extrabold text-white shadow-md transition-all hover:bg-[#059669]"
                    >
                      ✓ Aprobar
                    </button>
                    <button
                      type="button"
                      onClick={() => decide('CHANGES_REQUESTED')}
                      className="cursor-pointer rounded-xl border border-amber-500/80 px-5 py-2.5 text-xs font-bold text-amber-600 transition-all hover:bg-amber-500/10"
                    >
                      Pedir cambios
                    </button>
                    <button
                      type="button"
                      onClick={() => decide('REJECTED')}
                      className="cursor-pointer rounded-xl border border-red-500/80 px-5 py-2.5 text-xs font-bold text-red-600 transition-all hover:bg-red-500/10"
                    >
                      Rechazar
                    </button>
                  </div>
                  <p className="mt-2 text-right text-[10px] font-medium text-slate-400">
                    La decisión quedará registrada en Auditoría.
                  </p>
                </>
              )}
              {isStaff && selected.status !== 'PENDING_VALIDATION' && (
                <p className="mt-6 rounded-2xl bg-slate-50 p-3 text-xs font-medium text-slate-600 ">
                  Este registro ya fue resuelto ({statusBadge(selected.status).label}). Solo los pendientes admiten decisión.
                </p>
              )}
              {!isStaff && (
                <p className="mt-6 rounded-2xl bg-slate-50 p-3 text-xs font-medium text-slate-600 ">
                  Vista de operador: sigues el estado de tus envíos. Solo APIEJ Staff puede decidir.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
