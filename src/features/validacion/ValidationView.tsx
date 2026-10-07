import { useMemo, useState } from 'react';
import type { AuditEntry, Building, EntityStatus, Land, Park } from '../../types/domain.js';
import { formatAreaM2, formatUsdM2 } from '../../utils/formatters.js';

type ReviewTab = 'pendientes' | 'observaciones' | 'resueltos';
type DetailTab = 'info' | 'cambios' | 'docs';
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
  if (status === 'CHANGES_REQUESTED') return { label: 'Con observaciones', cls: 'bg-[#00a2ff]/15 text-[#0284c7]' };
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
      <div className="rounded-xl border border-white/60 bg-[#EBF0F5] p-2.5 shadow-[3px_3px_8px_#c5ccd6,-3px_-3px_8px_#ffffff]">
        <p className="text-[11px] font-semibold text-slate-600">{label}</p>
        <p className="mt-0.5 text-xs font-bold text-[#0F172A]">{value}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <p className="text-xs font-medium text-slate-500">Panel / Validación</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">Revisión de registros</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">Consulta la información antes de aprobar o solicitar cambios.</p>
        </div>
        <span className="mr-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700">
          {counts.pendientes} pendientes
        </span>
        <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Datos de ejemplo
        </span>
      </div>

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
              className={`px-4 py-2 text-xs transition-all duration-200 ${
                active
                  ? 'rounded-xl border border-blue-500/20 bg-blue-500/10 font-bold text-blue-700 shadow-sm'
                  : 'rounded-xl bg-[#EBF0F5] font-semibold text-slate-700 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff] hover:text-slate-950'
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
            className="mb-2.5 w-full rounded-xl border border-white/50 bg-[#E0E5EC] px-3.5 py-2 text-xs font-medium text-slate-800 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-slate-500"
          />
          <select
            value={fKind}
            onChange={(e) => setFKind(e.target.value)}
            className="mb-3 w-full rounded-xl border border-white/50 bg-[#E0E5EC] px-3 py-2 text-xs font-semibold text-slate-700 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none"
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
                  className={`w-full rounded-[2rem] border border-white/60 bg-[#EBF0F5] p-4 text-left transition-all duration-200 ${
                    active
                      ? 'border-l-4 border-l-[#00a2ff] bg-blue-500/5 shadow-[inset_4px_4px_8px_#c5ccd6,inset_-4px_-4px_8px_#ffffff]'
                      : 'shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff] hover:shadow-[8px_8px_16px_#c5ccd6,-8px_-8px_16px_#ffffff]'
                  } ${spotlight && idx === 0 && tab === 'pendientes' ? 'animate-pulse ring-4 ring-emerald-500 ring-offset-2 ring-offset-[#EBF0F5]' : ''}`}
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
              <p className="rounded-[2rem] border border-white/60 bg-[#EBF0F5] p-4 text-xs font-medium text-slate-600 shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff]">
                Sin registros en esta bandeja.
              </p>
            )}
          </div>
          <p className="mt-3 text-xs font-medium text-slate-400">
            {list.length} {list.length === 1 ? 'registro' : 'registros'} {tab === 'pendientes' ? 'pendientes' : tab === 'observaciones' ? 'con observaciones' : 'resueltos'}
          </p>
        </div>

        {/* Detail */}
        <div className="rounded-3xl border border-white/60 bg-[#EBF0F5] p-6 shadow-[10px_10px_24px_#c5ccd6,-10px_-10px_24px_#ffffff]">
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
                  <h3 className="mt-0.5 text-2xl font-black tracking-tight text-slate-950">{selected.title}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>{badge.label}</span>
              </div>

              <div className="mt-3 flex gap-5 border-b border-slate-200">
                {([{ t: 'info', label: 'Información' }, { t: 'cambios', label: 'Cambios' }, { t: 'docs', label: 'Documentos' }] as Array<{ t: DetailTab; label: string }>).map(({ t, label }) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDetailTab(t)}
                    className={`pb-2 text-xs transition ${
                      detailTab === t
                        ? 'border-b-2 border-[#00a2ff] font-bold text-blue-600'
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
                    <div key={h.id} className="rounded-2xl border border-white/60 bg-[#EBF0F5] p-3 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]">
                      <p className="text-xs font-bold text-[#0F172A]">{h.actorName} · {h.action}</p>
                      <p className="text-xs font-medium text-slate-600">{h.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'docs' && (
                <p className="mt-4 rounded-2xl bg-[#E0E5EC] p-4 text-xs font-medium text-slate-600 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
                  Sin documentos adjuntos. La evidencia fotográfica y planos se habilitarán en la Fase 2.
                </p>
              )}

              {isStaff && selected.status === 'PENDING_VALIDATION' && (
                <>
                  <p className="mb-2 mt-6 text-sm font-extrabold text-slate-900">Observaciones del revisor</p>
                  <textarea
                    value={notes}
                    onChange={(e) => { setNotes(e.target.value); setNotesError(null); }}
                    placeholder="Indica qué debe corregirse o el motivo del rechazo."
                    className="min-h-[80px] w-full rounded-2xl border border-white/50 bg-[#E0E5EC] p-3 text-xs font-medium text-slate-800 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-slate-500"
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
                      ✓ Aprobar y verificar
                    </button>
                    <button
                      type="button"
                      onClick={() => decide('CHANGES_REQUESTED')}
                      className="cursor-pointer rounded-xl border border-amber-500/80 px-5 py-2.5 text-xs font-bold text-amber-600 transition-all hover:bg-amber-500/10"
                    >
                      Solicitar cambios
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
                <p className="mt-6 rounded-2xl bg-[#E0E5EC] p-3 text-xs font-medium text-slate-600 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
                  Este registro ya fue resuelto ({statusBadge(selected.status).label}). Solo los pendientes admiten decisión.
                </p>
              )}
              {!isStaff && (
                <p className="mt-6 rounded-2xl bg-[#E0E5EC] p-3 text-xs font-medium text-slate-600 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff]">
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
