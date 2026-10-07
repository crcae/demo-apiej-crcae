import { useMemo, useState } from 'react';
import { BarChart3, FileText } from 'lucide-react';
import type { AuditEntry } from '../../types/domain.js';
import { Card, CardBody } from '../../components/ui/primitives.js';

type DateFilter = 'ALL' | '7D' | '30D';
type SortDir = 'DESC' | 'ASC';

interface Props {
  entries: AuditEntry[];
  isStaff: boolean;
}

const STATUS_ES: Record<string, string> = {
  DRAFT: 'Borrador',
  PENDING_VALIDATION: 'Pendiente de validación',
  VERIFIED: 'Verificado',
  CHANGES_REQUESTED: 'Con observaciones',
  REJECTED: 'Rechazado',
  ARCHIVED: 'Archivado',
};

function prettyStatus(raw: string): string {
  const key = raw.trim().toUpperCase().replace(/[\s_]+/g, '_');
  return STATUS_ES[key] ?? raw.trim();
}

function parseDetail(detail: string): { from: string | null; to: string | null; context: string } {
  const parts = detail.split('·').map((s) => s.trim());
  const head = parts[0] ?? '';
  if (!head.includes('→') && !head.includes('->')) {
    return { from: null, to: null, context: parts.join(' · ') };
  }
  const [from, ...rest] = head.split(/→|->/);
  return { from: prettyStatus(from ?? ''), to: prettyStatus(rest.join('→')), context: parts.slice(1).join(' · ') };
}

function badgeFor(action: AuditEntry['action']): { label: string; cls: string } {
  if (action === 'SNAPSHOT_CLOSE') return { label: 'Cierre trimestral', cls: 'bg-emerald-500/15 text-emerald-700' };
  if (action === 'CREATE') return { label: 'Creación', cls: 'bg-slate-200 text-slate-700' };
  if (action === 'UPDATE') return { label: 'Actualización', cls: 'bg-[#00a2ff]/15 text-[#0284c7]' };
  return { label: 'Cambio de estado', cls: 'bg-blue-500/15 text-blue-700' };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  const time = new Intl.DateTimeFormat('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true }).format(d);
  return `${date} · ${time}`;
}

export function AuditView({ entries, isStaff }: Props): React.JSX.Element {
  const [search, setSearch] = useState('');
  const [fEvent, setFEvent] = useState('ALL');
  const [fDate, setFDate] = useState<DateFilter>('ALL');
  const [sort, setSort] = useState<SortDir>('DESC');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const kinds = useMemo(() => [...new Set(entries.map((e) => e.action))], [entries]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = Date.now();
    const out = entries.filter((e) => {
      if (fEvent !== 'ALL' && e.action !== fEvent) return false;
      if (fDate !== 'ALL') {
        const age = now - new Date(e.createdAt).getTime();
        const limit = fDate === '7D' ? 7 : 30;
        if (age > limit * 86400000) return false;
      }
      if (q !== '' && !`${e.entityLabel} ${e.actorName} ${e.detail}`.toLowerCase().includes(q)) return false;
      return true;
    });
    out.sort((a, b) => sort === 'DESC'
      ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return out;
  }, [entries, search, fEvent, fDate, sort]);

  const selected = list.find((e) => e.id === selectedId) ?? list[0] ?? null;
  const selBadge = selected === null ? null : badgeFor(selected.action);
  const selDiff = selected === null ? null : parseDetail(selected.detail);

  function clear(): void {
    setSearch('');
    setFEvent('ALL');
    setFDate('ALL');
  }

  if (!isStaff) {
    return (
      <Card>
        <CardBody>
          <p className="text-sm font-bold text-red-600">403 Forbidden — audit trail solo visible para APIEJ Staff.</p>
          <p className="mt-1 text-xs font-medium text-slate-600">El backend (RLS <code>audit_staff_read</code>) niega esta lectura a tu rol.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div>
      {/* Header */}
      <p className="text-xs font-medium text-slate-500">Panel / Auditoría</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-slate-950">Historial de cambios</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">Consulta quién realizó cada cambio y cuándo.</p>
        </div>
        <span className="mr-2 rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700">
          Solo lectura
        </span>
        <span className="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-xs font-medium text-slate-700">
          Datos de ejemplo
        </span>
      </div>

      {/* Filter toolbar */}
      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#EBF0F5] p-3 shadow-[4px_4px_10px_#c5ccd6,-4px_-4px_10px_#ffffff]">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar registro o usuario"
            className="w-64 rounded-xl border border-white/50 bg-[#E0E5EC] px-3.5 py-2 text-xs font-medium text-slate-800 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none placeholder:text-slate-500"
          />
          <select
            value={fEvent}
            onChange={(e) => setFEvent(e.target.value)}
            className="rounded-xl border border-white/50 bg-[#E0E5EC] px-3 py-2 text-xs font-semibold text-slate-700 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none"
          >
            <option value="ALL">Evento: Todos</option>
            {kinds.map((k) => <option key={k} value={k}>{badgeFor(k).label}</option>)}
          </select>
          <select
            value={fDate}
            onChange={(e) => setFDate(e.target.value as DateFilter)}
            className="rounded-xl border border-white/50 bg-[#E0E5EC] px-3 py-2 text-xs font-semibold text-slate-700 shadow-[inset_3px_3px_6px_#c5ccd6,inset_-3px_-3px_6px_#ffffff] outline-none"
          >
            <option value="ALL">📅 Todas las fechas</option>
            <option value="7D">Últimos 7 días</option>
            <option value="30D">Últimos 30 días</option>
          </select>
        </div>
        <button
          type="button" onClick={clear}
          className="ml-auto cursor-pointer text-xs font-bold text-[#00a2ff] transition hover:underline"
        >
          Limpiar
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        {/* Event list */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-lg font-extrabold text-slate-900">
              Actividad registrada <span className="ml-1 text-xs font-medium text-slate-500">{list.length} eventos</span>
            </p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortDir)}
              className="border-none bg-transparent text-xs font-semibold text-slate-600 outline-none"
            >
              <option value="DESC">Más recientes primero ⌄</option>
              <option value="ASC">Más antiguos primero ⌄</option>
            </select>
          </div>
          <div className="space-y-2.5">
            {list.map((e) => {
              const b = badgeFor(e.action);
              const d = parseDetail(e.detail);
              const active = selected?.id === e.id;
              const snap = e.action === 'SNAPSHOT_CLOSE';
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedId(e.id)}
                  className={`w-full rounded-[2rem] border border-white/60 bg-[#EBF0F5] p-4 text-left transition-all duration-200 ${
                    active
                      ? 'border-l-4 border-l-[#00a2ff] bg-blue-500/5 shadow-[inset_4px_4px_8px_#c5ccd6,inset_-4px_-4px_8px_#ffffff]'
                      : 'shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff] hover:shadow-[8px_8px_16px_#c5ccd6,-8px_-8px_16px_#ffffff]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`rounded-full p-2.5 ${snap ? 'bg-emerald-500/15 text-emerald-600' : 'bg-blue-500/15 text-blue-600'}`}>
                      {snap ? <BarChart3 size={16} /> : <FileText size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${b.cls}`}>{b.label}</span>
                        <span className="text-[11px] font-medium text-slate-500">{e.actorName} · {formatDate(e.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-base font-extrabold text-slate-900">{e.entityLabel}</p>
                      <div className="mt-0.5 flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">{d.context || e.entityType}</span>
                        {d.from !== null && d.to !== null && (
                          <span className="text-xs font-medium text-slate-500">{d.from} ➔ {d.to}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {list.length === 0 && (
              <p className="rounded-[2rem] border border-white/60 bg-[#EBF0F5] p-4 text-xs font-medium text-slate-600 shadow-[6px_6px_14px_#c5ccd6,-6px_-6px_14px_#ffffff]">
                Sin eventos para estos filtros.
              </p>
            )}
          </div>
          <p className="mt-4 text-xs font-medium text-slate-400">Mostrando {list.length} eventos</p>
        </div>

        {/* Detail panel */}
        <div className="h-fit rounded-3xl border border-white/60 bg-[#EBF0F5] p-6 shadow-[10px_10px_24px_#c5ccd6,-10px_-10px_24px_#ffffff] lg:sticky lg:top-6">
          {selected === null && (
            <p className="text-sm font-medium text-slate-600">Selecciona un evento para ver el detalle.</p>
          )}
          {selected !== null && selBadge !== null && selDiff !== null && (
            <>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Detalle del evento</p>
              <h3 className="mt-0.5 text-2xl font-black tracking-tight text-slate-950">{selected.entityLabel}</h3>
              <p className="mb-3 mt-0.5 text-sm font-medium text-slate-500">{selDiff.context || selected.entityType}</p>
              <span className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${selBadge.cls}`}>
                {selBadge.label}
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-400">Realizado por</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{selected.actorName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Fecha y hora</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(selected.createdAt)}</p>
                </div>
              </div>
              <p className="mb-1 mt-6 text-base font-extrabold text-slate-900">¿Qué cambió?</p>
              <p className="mb-3 text-xs font-medium text-slate-500">Estado del registro</p>
              {selDiff.from !== null && selDiff.to !== null ? (
                <>
                  <div className="rounded-2xl border border-slate-300/40 bg-[#E0E5EC]/60 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Antes</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800">{selDiff.from}</p>
                  </div>
                  <p className="my-2 text-center text-slate-400">↓</p>
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Después</p>
                    <p className="mt-0.5 text-sm font-extrabold text-amber-800">{selDiff.to}</p>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-slate-300/40 bg-[#E0E5EC]/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registro</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">{selected.detail}</p>
                </div>
              )}
              <p className="mt-6 flex items-center gap-2 text-xs font-medium text-slate-500">
                🔒 Este historial es de solo lectura.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
