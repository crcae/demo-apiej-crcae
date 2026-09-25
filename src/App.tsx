import { useMemo, useState } from 'react';
import { BuildingForm } from './features/naves/BuildingForm.js';
import { ParkForm } from './features/parques/ParkForm.js';
import { LandForm } from './features/terrenos/LandForm.js';
import { ValidationInbox, type PendingItem } from './features/validacion/ValidationInbox.js';
import { mockBuildings, mockLands, mockParks, mockPeriods } from './mock/market.mock.js';
import { listBuildingsFor, listLandsFor, listParksFor } from './services/marketService.js';
import type { ActorSession, Building, EntityStatus, Land, Park } from './types/domain.js';
import './App.css';

type Tab = 'parques' | 'naves' | 'terrenos' | 'validacion';

const STAFF: ActorSession = {
  userId: 'staff-1', fullName: 'Validador APIEJ', isSuperAdmin: false,
  orgId: 'org-apiej', role: 'APIEJ_STAFF',
};
const OPERATOR: ActorSession = {
  userId: 'op-1', fullName: 'Operador El Salto', isSuperAdmin: false,
  orgId: 'org-parque-salot', role: 'PARK_OPERATOR',
};
const OUTSIDER: ActorSession = {
  userId: 'op-2', fullName: 'Operador otra org', isSuperAdmin: false,
  orgId: 'org-otra', role: 'PARK_OPERATOR',
};

function App(): React.JSX.Element {
  const [actor, setActor] = useState<ActorSession>(STAFF);
  const [tab, setTab] = useState<Tab>('parques');
  const [parks, setParks] = useState<Park[]>(mockParks);
  const [buildings, setBuildings] = useState<Building[]>(mockBuildings);
  const [lands, setLands] = useState<Land[]>(mockLands);
  const [notice, setNotice] = useState<string | null>(null);

  const isStaff = actor.role === 'APIEJ_STAFF' || actor.role === 'SUPER_ADMIN' || actor.isSuperAdmin;

  const parksRes = useMemo(() => {
    const live = listParksFor(actor);
    if (!live.ok) return live;
    const ids = new Set(live.data.map((p) => p.id));
    return { ok: true as const, data: parks.filter((p) => ids.has(p.id)) };
  }, [actor, parks]);

  const buildingsRes = useMemo(() => {
    const live = listBuildingsFor(actor);
    if (!live.ok) return live;
    const ids = new Set(live.data.map((b) => b.id));
    return { ok: true as const, data: buildings.filter((b) => ids.has(b.id)) };
  }, [actor, buildings]);

  const landsRes = useMemo(() => {
    const live = listLandsFor(actor);
    if (!live.ok) return live;
    const ids = new Set(live.data.map((l) => l.id));
    return { ok: true as const, data: lands.filter((l) => ids.has(l.id)) };
  }, [actor, lands]);

  function transition(list: EntityStatus, to: EntityStatus, allowed: EntityStatus[]): boolean {
    void list;
    return allowed.includes(to);
  }

  function handleParkReview(id: string, to: EntityStatus, comment?: string): void {
    setParks((prev) => {
      const cur = prev.find((p) => p.id === id);
      if (!cur) return prev;
      // Operator path: only submit; Staff path: approve/request/reject (mirrors backend authorizeTransition)
      if (!isStaff && !(cur.status === 'DRAFT' && to === 'PENDING_VALIDATION') && !(cur.status === 'CHANGES_REQUESTED' && to === 'PENDING_VALIDATION')) {
        setNotice('403 Forbidden: los operadores solo pueden enviar a validación.');
        return prev;
      }
      if (!transition(cur.status, to, [to]) && false) return prev;
      setNotice(`Park ${cur.slug}: ${cur.status} → ${to}${comment ? ` — ${comment}` : ''}. Al aprobar se congela snapshot del trimestre activo (Q1 intacto).`);
      return prev.map((p) => (p.id === id ? { ...p, status: to, updatedAt: new Date().toISOString() } : p));
    });
  }

  function handleBuildingReview(id: string, to: EntityStatus, comment?: string): void {
    setBuildings((prev) => {
      const cur = prev.find((b) => b.id === id);
      if (!cur) return prev;
      if (!isStaff && !(cur.status === 'DRAFT' && to === 'PENDING_VALIDATION') && !(cur.status === 'CHANGES_REQUESTED' && to === 'PENDING_VALIDATION')) {
        setNotice('403 Forbidden: los operadores solo pueden enviar a validación.');
        return prev;
      }
      setNotice(`Nave ${cur.code}: ${cur.status} → ${to}${comment ? ` — ${comment}` : ''}. Snapshot Q1 preservado; cambios aplican al trimestre activo.`);
      return prev.map((b) => (b.id === id ? { ...b, status: to, updatedAt: new Date().toISOString() } : b));
    });
  }

  function handleLandReview(id: string, to: EntityStatus, comment?: string): void {
    setLands((prev) => {
      const cur = prev.find((l) => l.id === id);
      if (!cur) return prev;
      if (!isStaff && !(cur.status === 'DRAFT' && to === 'PENDING_VALIDATION') && !(cur.status === 'CHANGES_REQUESTED' && to === 'PENDING_VALIDATION')) {
        setNotice('403 Forbidden: los operadores solo pueden enviar a validación.');
        return prev;
      }
      setNotice(`Terreno ${cur.name}: ${cur.status} → ${to}${comment ? ` — ${comment}` : ''}.`);
      return prev.map((l) => (l.id === id ? { ...l, status: to, updatedAt: new Date().toISOString() } : l));
    });
  }

  const pending: PendingItem[] = useMemo(() => {
    if (!isStaff) return [];
    return [
      ...parks.filter((p) => p.status === 'PENDING_VALIDATION').map((p): PendingItem => ({ kind: 'PARK', id: p.id, title: p.name, status: p.status })),
      ...buildings.filter((b) => b.status === 'PENDING_VALIDATION').map((b): PendingItem => ({ kind: 'BUILDING', id: b.id, title: `Nave ${b.code}`, status: b.status })),
      ...lands.filter((l) => l.status === 'PENDING_VALIDATION').map((l): PendingItem => ({ kind: 'LAND', id: l.id, title: l.name, status: l.status })),
    ];
  }, [parks, buildings, lands, isStaff]);

  function handleDecide(item: PendingItem, to: EntityStatus, comment: string): void {
    if (item.kind === 'PARK') handleParkReview(item.id, to, comment);
    else if (item.kind === 'BUILDING') handleBuildingReview(item.id, to, comment);
    else handleLandReview(item.id, to, comment);
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'parques', label: 'Parques' },
    { key: 'naves', label: 'Naves' },
    { key: 'terrenos', label: 'Terrenos' },
    { key: 'validacion', label: `Validación${pending.length > 0 ? ` (${pending.length})` : ''}` },
  ];

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="bg-brand-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-bold">APIEJ · CRM + Captura de Mercado — Fase 1</h1>
            <p className="text-xs text-slate-300">Single source of truth · Snapshots Q1–Q4 · RBAC en backend</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              { label: 'Staff APIEJ', value: STAFF },
              { label: 'Operador (mi org)', value: OPERATOR },
              { label: 'Operador (otra org)', value: OUTSIDER },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => { setActor(o.value); setNotice(null); }}
                className={`rounded-xl px-3 py-2 font-bold transition ${actor.fullName === o.value.fullName ? 'bg-brand-blue text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-navy px-3 py-1 text-xs font-bold text-white">
            {actor.fullName} · {actor.role} · {actor.orgId}
          </span>
          {mockPeriods.map((p) => (
            <span key={p.id} className={`rounded-full px-3 py-1 text-xs font-bold ${p.isClosed ? 'bg-slate-200 text-slate-700' : 'bg-brand-emerald/15 text-brand-emerald'}`}>
              {p.label} {p.isClosed ? '· cerrado (inmutable)' : '· activo'}
            </span>
          ))}
        </div>

        {notice !== null && (
          <div className="mb-4 rounded-xl bg-brand-blue/10 p-3 text-sm text-brand-navy ring-1 ring-brand-blue/20">{notice}</div>
        )}

        <nav className="mb-4 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition ${tab === t.key ? 'bg-brand-navy text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'parques' && (
          <div className="grid gap-3">
            {!parksRes.ok && <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">403 — {parksRes.message}</div>}
            {parksRes.ok && parksRes.data.length === 0 && <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">Sin resultados: aislamiento por tenant (otra organización / sin acceso).</div>}
            {parksRes.ok && parksRes.data.map((p) => (
              <ParkForm key={p.id} park={p} isStaff={isStaff} onSubmitForReview={handleParkReview} />
            ))}
          </div>
        )}

        {tab === 'naves' && (
          <div className="grid gap-3">
            {!buildingsRes.ok && <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">403 — {buildingsRes.message}</div>}
            {buildingsRes.ok && buildingsRes.data.length === 0 && <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">Sin resultados: aislamiento por tenant.</div>}
            {buildingsRes.ok && buildingsRes.data.map((b) => (
              <BuildingForm key={b.id} building={b} isStaff={isStaff} onSubmitForReview={handleBuildingReview} />
            ))}
          </div>
        )}

        {tab === 'terrenos' && (
          <div className="grid gap-3">
            {!landsRes.ok && <div className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">403 — {landsRes.message}</div>}
            {landsRes.ok && landsRes.data.length === 0 && <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">Sin resultados: aislamiento por tenant.</div>}
            {landsRes.ok && landsRes.data.map((l) => (
              <LandForm key={l.id} land={l} onSubmitForReview={handleLandReview} />
            ))}
          </div>
        )}

        {tab === 'validacion' && (
          <div>
            {!isStaff && <div className="mb-3 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">403 Forbidden — solo APIEJ Staff / Super Admin.</div>}
            {isStaff && <ValidationInbox items={pending} onDecide={handleDecide} />}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
