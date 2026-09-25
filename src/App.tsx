import { lazy, Suspense, useMemo, useState } from 'react';
import { TopNav } from './components/TopNav.js';
import type { TourStep } from './components/TopNav.js';
import { TourDock, type TourAction } from './components/TourDock.js';
import { AuditList } from './features/auditoria/AuditList.js';
import { CaptureWizard, type WizardDraft } from './features/captura/CaptureWizard.js';
import { Dashboard, type Currency } from './features/dashboard/Dashboard.js';

const ParkMapView = lazy(() =>
  import('./features/mapa/ParkMapView.js').then((m) => ({ default: m.ParkMapView })),
);
import { BuildingForm } from './features/naves/BuildingForm.js';
import { ParkForm } from './features/parques/ParkForm.js';
import { LandForm } from './features/terrenos/LandForm.js';
import { ReportModal } from './features/reportes/ReportModal.js';
import { ValidationInbox, type PendingItem } from './features/validacion/ValidationInbox.js';
import {
  mockAuditSeed, mockBuildings, mockLands, mockParks, mockPeriods, mockQ1Kpis,
} from './mock/market.mock.js';
import { computeLiveKpis } from './services/analyticsService.js';
import { isStaff, listBuildingsFor, listLandsFor, listParksFor } from './services/marketService.js';
import { PERSONAS } from './store/personas.js';
import type { AuditEntry, Building, DemoPersonaKey, EntityStatus } from './types/domain.js';
import './App.css';

type View = 'dashboard' | 'mapa' | 'captura' | 'validacion' | 'auditoria';

const VIEW_LABEL: Record<View, string> = {
  dashboard: 'Dashboard',
  mapa: 'Mapa GIS',
  captura: 'Captura',
  validacion: 'Validación',
  auditoria: 'Auditoría',
};

function nowIso(): string {
  return new Date().toISOString();
}

function App(): React.JSX.Element {
  const [personaKey, setPersonaKey] = useState<DemoPersonaKey>('STAFF');
  const [view, setView] = useState<View>('dashboard');
  const [periodId, setPeriodId] = useState('p-2026-q2');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [parks, setParks] = useState(mockParks);
  const [buildings, setBuildings] = useState<Building[]>(mockBuildings);
  const [lands, setLands] = useState(mockLands);
  const [audit, setAudit] = useState<AuditEntry[]>(mockAuditSeed);
  const [toast, setToast] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [captureTab, setCaptureTab] = useState<'parques' | 'naves' | 'terrenos'>('naves');
  const [tourStep, setTourStep] = useState<TourStep | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const persona = PERSONAS.find((p) => p.key === personaKey) ?? PERSONAS[0];
  const actor = persona.actor;
  const staff = isStaff(actor);
  const readOnly = actor.role === 'MEMBER_VIEWER';
  const fx = mockPeriods.find((p) => p.id === periodId)?.fxUsdMxn ?? 17.35;

  function flash(msg: string): void {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4200);
  }

  function switchPersona(key: DemoPersonaKey): void {
    setPersonaKey(key);
    setToast(null);
    // Members only get Dashboard + Map; operators/staff keep current view if allowed
    if (key === 'MEMBER' && (view === 'captura' || view === 'validacion' || view === 'auditoria')) {
      setView('dashboard');
    }
  }

  function applyTourStep(s: TourStep): void {
    if (s === 1) {
      switchPersona('STAFF');
      setView('dashboard');
      setPeriodId('p-2026-q1');
      flash('Paso 1: Q1 congelado (inmutable). Cambia USD/MXN arriba: el FX Banxico convierte al instante.');
    } else if (s === 2) {
      switchPersona('ALPHA');
      setView('dashboard');
      setPeriodId('p-2026-q2');
      flash('Paso 2: eres Dev Alpha — lo de Beta vanish: KPIs, mapa y listas filtrados por backend.');
    } else if (s === 3) {
      switchPersona('STAFF');
      setView('validacion');
      flash('Paso 3: la nave pendiente brilla en dorado. Revísala y apruébala en 1 clic.');
    } else if (s === 4) {
      setView('validacion');
      flash('Paso 4: pulsa “Aprobar 1ª pendiente” en el dock o “Aprobar & Verificar” en la tarjeta.');
    } else {
      setView('mapa');
      flash('Paso 5: pines con ficha técnica e infraestructura. Exporta el Reporte Ejecutivo Q2.');
    }
  }

  function tourNext(): void {
    if (tourStep === null) return;
    if (tourStep === 5) {
      setTourStep(null);
      flash('Tour finalizado — Q1 intacto, Q2 en vivo. ¡Gracias!');
      return;
    }
    const n = (tourStep + 1) as TourStep;
    setTourStep(n);
    applyTourStep(n);
  }

  function tourPrev(): void {
    if (tourStep === null || tourStep === 1) return;
    const p = (tourStep - 1) as TourStep;
    setTourStep(p);
    applyTourStep(p);
  }

  function tourApproveFirst(): void {
    if (!staff) {
      flash('El tour necesita rol Staff para aprobar.');
      return;
    }
    const first = inboxItems[0];
    if (!first) {
      flash('Sin pendientes: crea una nave en Captura y envíala a validación primero.');
      return;
    }
    decide(first, 'VERIFIED', 'Aprobado en tour guiado');
    setTourStep(5);
    flash('✓ Aprobada y Q2 recalculado en vivo — Q1 intacto. Paso 5: mapa y reporte.');
  }

  const inboxItems: PendingItem[] = useMemo(() => {
    const all: PendingItem[] = [
      ...parks.filter((p) => p.status === 'PENDING_VALIDATION').map((p): PendingItem => ({ kind: 'PARK', id: p.id, title: p.name, status: p.status })),
      ...buildings.filter((b) => b.status === 'PENDING_VALIDATION').map((b): PendingItem => ({ kind: 'BUILDING', id: b.id, title: `Nave ${b.code}`, status: b.status })),
      ...lands.filter((l) => l.status === 'PENDING_VALIDATION').map((l): PendingItem => ({ kind: 'LAND', id: l.id, title: l.name, status: l.status })),
    ];
    if (staff) return all;
    return all.filter((it) => {
      if (it.kind === 'BUILDING') return buildings.find((b) => b.id === it.id)?.orgId === actor.orgId;
      if (it.kind === 'PARK') return parks.find((p) => p.id === it.id)?.orgId === actor.orgId;
      return lands.find((l) => l.id === it.id)?.orgId === actor.orgId;
    });
  }, [parks, buildings, lands, staff, actor.orgId]);

  const TOUR_COPY: Record<TourStep, { title: string; text: string; actions: () => TourAction[] }> = {
    1: {
      title: 'Visión General Q1',
      text: 'Q1 2026 está congelado como Snapshot inmutable. Prueba cambiar entre USD y MXN.',
      actions: () => [{
        label: currency === 'USD' ? 'Cambiar a MXN' : 'Cambiar a USD',
        gold: true,
        run: () => setCurrency(currency === 'USD' ? 'MXN' : 'USD'),
      }],
    },
    2: {
      title: 'Aislamiento Multi-Tenant',
      text: 'Aislamiento total: los datos de Dev Beta desaparecieron del sistema en tiempo real.',
      actions: () => [{
        label: 'Probar Dev Beta',
        gold: true,
        run: () => {
          switchPersona('BETA');
          flash('Ahora eres Dev Beta — compara: otros parques, otros números.');
        },
      }],
    },
    3: {
      title: 'Bandeja de Validación',
      text: `Como APIEJ Staff, tienes ${inboxItems.length} ${inboxItems.length === 1 ? 'nave pendiente' : 'naves pendientes'} de aprobación. Brilla en dorado.`,
      actions: () => [],
    },
    4: {
      title: 'Aprobación y Recálculo Q2',
      text: 'Pulsa «Aprobar 1ª pendiente» y mira cómo la vacancia y la absorción del Q2 se recalculan en vivo.',
      actions: () => [{
        label: 'Aprobar 1ª pendiente y recalcular',
        gold: true,
        run: tourApproveFirst,
      }],
    },
    5: {
      title: 'Mapa GIS y Reporte PDF',
      text: 'Explora la geolocalización de parques y genera el reporte ejecutivo oficial.',
      actions: () => [
        { label: 'Ir al Mapa GIS', run: () => setView('mapa') },
        { label: 'Abrir reporte PDF', gold: true, run: () => setReportOpen(true) },
      ],
    },
  };

  // Tenant-filtered datasets (backend RLS mirrored in marketService)
  const visParks = useMemo(() => {
    const r = listParksFor(actor, parks);
    return r.ok ? r.data : [];
  }, [actor, parks]);
  const visBuildings = useMemo(() => {
    const r = listBuildingsFor(actor, buildings);
    return r.ok ? r.data : [];
  }, [actor, buildings]);
  const visLands = useMemo(() => {
    const r = listLandsFor(actor, lands);
    return r.ok ? r.data : [];
  }, [actor, lands]);

  // Live Q2 market aggregates — recalculated on every approval (Q1 stays frozen)
  const liveKpis = useMemo(
    () => computeLiveKpis(staff ? buildings : visBuildings, parks, 'p-2026-q2', fx),
    [staff, buildings, visBuildings, parks, fx],
  );

  function pushAudit(e: Omit<AuditEntry, 'id' | 'createdAt'>): void {
    setAudit((prev) => [{ ...e, id: `a-${nowIso()}`, createdAt: nowIso() }, ...prev]);
  }

  // --- Validation transitions (mirror backend authorizeTransition) ---
  function decide(item: PendingItem, to: EntityStatus, comment: string): void {
    if (!staff) {
      flash('403 Forbidden — solo APIEJ Staff puede aprobar.');
      return;
    }
    if (item.kind === 'BUILDING') {
      setBuildings((prev) => prev.map((b) => (b.id === item.id ? { ...b, status: to, visibility: to === 'VERIFIED' ? 'SHARED' : b.visibility, updatedAt: nowIso() } : b)));
    } else if (item.kind === 'PARK') {
      setParks((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: to, updatedAt: nowIso() } : p)));
    } else {
      setLands((prev) => prev.map((l) => (l.id === item.id ? { ...l, status: to, updatedAt: nowIso() } : l)));
    }
    pushAudit({
      actorName: actor.fullName, action: 'STATUS_CHANGE', entityType: item.kind,
      entityLabel: item.title, detail: `PENDING_VALIDATION → ${to} · ${comment}`,
    });
    if (to === 'VERIFIED') {
      flash(`✓ ${item.title} verificada — snapshot Q2 recalculado en Dashboard · Q1 intacto.`);
      setView('dashboard');
      setPeriodId('p-2026-q2');
    } else {
      flash(`${item.title}: ${to} — ${comment}`);
    }
  }

  function submitForReview(kind: 'PARK' | 'BUILDING' | 'LAND', id: string, to: EntityStatus, comment?: string): void {
    const apply = <T extends { id: string; status: EntityStatus }>(rows: T[]): T[] =>
      rows.map((r) => (r.id === id ? { ...r, status: to } : r));
    if (!staff && to !== 'PENDING_VALIDATION') {
      flash('403 Forbidden — los operadores solo pueden enviar a validación.');
      return;
    }
    if (kind === 'BUILDING') setBuildings((prev) => apply(prev));
    else if (kind === 'PARK') setParks((prev) => apply(prev));
    else setLands((prev) => apply(prev));
    pushAudit({
      actorName: actor.fullName, action: 'STATUS_CHANGE', entityType: kind,
      entityLabel: id, detail: `→ ${to}${comment !== undefined ? ` · ${comment}` : ''}`,
    });
    if (to === 'PENDING_VALIDATION') flash('Enviado a validación — Staff recibió alerta en el inbox.');
    else flash(`Estado actualizado → ${to}`);
  }

  function saveWizard(d: WizardDraft, submit: boolean, editingId: string | null): void {
    if (editingId !== null) {
      setBuildings((prev) => prev.map((b) => (b.id === editingId ? {
        ...b,
        parkId: d.parkId, code: d.code, buildingClass: d.buildingClass,
        totalGrossM2: d.totalGrossM2, netRentableM2: d.netRentableM2,
        clearHeightM: d.clearHeightM, dockDoors: d.dockDoors, ramps: d.ramps,
        powerKva: d.powerKva, hasGas: d.hasGas, hasCrane: d.hasCrane,
        availabilityState: d.availabilityState,
        askingRentUsdM2: d.askingRentUsdM2,
        askingRentMxnM2: d.askingRentUsdM2 !== undefined ? Number((d.askingRentUsdM2 * fx).toFixed(2)) : undefined,
        status: submit ? 'PENDING_VALIDATION' : b.status,
        updatedAt: nowIso(),
      } : b)));
      pushAudit({
        actorName: actor.fullName, action: submit ? 'STATUS_CHANGE' : 'UPDATE',
        entityType: 'BUILDING', entityLabel: d.code,
        detail: submit ? `Editada y enviada → PENDING_VALIDATION` : 'Borrador actualizado',
      });
    } else {
      const id = `b-${d.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now() % 10000}`;
      const nb: Building = {
        id, orgId: actor.orgId, parkId: d.parkId, code: d.code, buildingClass: d.buildingClass,
        totalGrossM2: d.totalGrossM2, netRentableM2: d.netRentableM2,
        clearHeightM: d.clearHeightM, dockDoors: d.dockDoors, ramps: d.ramps,
        powerKva: d.powerKva, hasGas: d.hasGas, hasCrane: d.hasCrane,
        availabilityState: d.availabilityState, occupantAlias: 'Disponible',
        askingRentUsdM2: d.askingRentUsdM2,
        askingRentMxnM2: d.askingRentUsdM2 !== undefined ? Number((d.askingRentUsdM2 * fx).toFixed(2)) : undefined,
        status: submit ? 'PENDING_VALIDATION' : 'DRAFT',
        visibility: 'PRIVATE', updatedAt: nowIso(),
      };
      setBuildings((prev) => [...prev, nb]);
      pushAudit({
        actorName: actor.fullName, action: 'CREATE', entityType: 'BUILDING', entityLabel: d.code,
        detail: submit ? 'Creada y enviada → PENDING_VALIDATION' : 'Borrador creado',
      });
    }
    setWizardOpen(false);
    setEditing(null);
    flash(submit ? 'Nave enviada a validación — cambia a Staff para aprobarla.' : 'Borrador guardado.');
  }

  const allowedViews: View[] = readOnly
    ? ['dashboard', 'mapa']
    : staff
      ? ['dashboard', 'mapa', 'captura', 'validacion', 'auditoria']
      : ['dashboard', 'mapa', 'captura', 'validacion'];

  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-br from-[#E8D8CD] via-[#E2D5C8] to-[#CBD5E1] p-4 md:p-8">
      <div className="w-full max-w-[1600px] overflow-hidden rounded-[2.5rem] border border-white/80 bg-[#F4F1EB]/80 p-6 shadow-2xl backdrop-blur-sm md:p-8">
      <TopNav
        persona={personaKey}
        onPersona={switchPersona}
        items={allowedViews.map((v) => ({
          key: v,
          label: VIEW_LABEL[v],
          count: v === 'validacion' ? inboxItems.length : undefined,
        }))}
        activeView={view}
        onView={(k) => setView(k as View)}
        visibleCounts={`${visParks.length} parques · ${visBuildings.length} naves · ${visLands.length} terrenos`}
        currency={currency}
        onCurrency={setCurrency}
        onExport={() => setReportOpen(true)}
        onOpenTour={() => {
          setTourStep(1);
          // applyTourStep(1) runs on next tick via effect-free direct calls:
          switchPersona('STAFF');
          setView('dashboard');
          setPeriodId('p-2026-q1');
          flash('Paso 1: Q1 congelado (inmutable). Cambia USD/MXN arriba: el FX Banxico convierte al instante.');
        }}
      />

      <div className="mx-auto max-w-7xl px-1 pt-4">
      {tourStep !== null && (
        <TourDock
          step={tourStep}
          total={5}
          title={TOUR_COPY[tourStep].title}
          text={TOUR_COPY[tourStep].text}
          actions={TOUR_COPY[tourStep].actions()}
          canPrev={tourStep > 1}
          isLast={tourStep === 5}
          onPrev={tourPrev}
          onNext={tourNext}
          onClose={() => setTourStep(null)}
        />
      )}

        {/* Mobile nav — floating pill */}
        <div className="fixed bottom-3 left-3 right-3 z-[80] flex gap-1 rounded-full border border-slate-200/80 bg-white/85 p-1.5 shadow-lg backdrop-blur-md md:hidden">
          {allowedViews.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`flex-1 rounded-full px-2 py-2 text-[11px] font-bold transition ${view === v ? 'bg-[#0B192C] text-white shadow-sm' : 'text-slate-500'}`}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>

        {/* Main */}
        <main key={`${view}-${personaKey}-${periodId}`} className="animate-enter relative z-10 min-w-0 flex-1 pb-20 md:pb-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A]">{VIEW_LABEL[view]}</h2>
            <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
              {visParks.length} parques · {visBuildings.length} naves · {visLands.length} terrenos visibles
            </span>
          </div>

          {view === 'dashboard' && (
            <Dashboard
              periods={mockPeriods}
              activePeriodId={periodId}
              onPeriod={setPeriodId}
              live={liveKpis}
              frozen={mockQ1Kpis}
              currency={currency}
              readOnly={readOnly}
              fx={fx}
              pendingCount={inboxItems.length}
              onGoValidation={() => setView('validacion')}
            />
          )}

          {view === 'mapa' && (
            <Suspense fallback={<p className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">Cargando mapa GIS…</p>}>
              <ParkMapView parks={visParks} buildings={visBuildings} lands={visLands} isStaff={staff} />
            </Suspense>
          )}

          {view === 'captura' && !readOnly && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {(['parques', 'naves', 'terrenos'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCaptureTab(t)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition ${captureTab === t ? 'bg-[#0B192C] text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
                  >
                    {t}
                  </button>
                ))}
                {captureTab === 'naves' && (
                  <button
                    type="button"
                    onClick={() => { setEditing(null); setWizardOpen(true); }}
                    className="ml-auto rounded-xl bg-brand-emerald px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90"
                  >
                    + Nueva nave (wizard)
                  </button>
                )}
              </div>
              {captureTab === 'parques' && visParks.map((p) => (
                <ParkForm key={p.id} park={p} isStaff={staff} onSubmitForReview={(id, to, c) => submitForReview('PARK', id, to, c)} />
              ))}
              {captureTab === 'naves' && (
                <>
                  {visBuildings.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">Sin naves visibles para tu organización (aislamiento por tenant).</p>}
                  {visBuildings.map((b) => (
                    <div key={b.id} className="space-y-1">
                      <BuildingForm building={b} isStaff={staff} onSubmitForReview={(id, to, c) => submitForReview('BUILDING', id, to, c)} />
                      {!readOnly && (
                        <button type="button" onClick={() => { setEditing(b); setWizardOpen(true); }} className="text-xs font-bold text-brand-blue hover:underline">
                          Editar en wizard →
                        </button>
                      )}
                    </div>
                  ))}
                </>
              )}
              {captureTab === 'terrenos' && visLands.map((l) => (
                <LandForm key={l.id} land={l} onSubmitForReview={(id, to, c) => submitForReview('LAND', id, to, c)} />
              ))}
            </div>
          )}

          {view === 'validacion' && (
            <div>
              {!staff && (
                <p className="mb-3 rounded-xl bg-brand-orange/10 p-3 text-xs font-semibold text-amber-800 ring-1 ring-brand-orange/20">
                  Vista de operador: ves tus envíos y su estado. Solo Staff puede aprobar (botones deshabilitados por backend).
                </p>
              )}
              {staff ? (
                <ValidationInbox items={inboxItems} onDecide={decide} spotlight={tourStep === 3 || tourStep === 4} />
              ) : (
                <div className="space-y-2">
                  {inboxItems.length === 0 && <p className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">Sin envíos pendientes de tu organización.</p>}
                  {inboxItems.map((it) => (
                    <div key={`${it.kind}-${it.id}`} className="flex items-center justify-between rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-slate-200">
                      <span className="font-bold text-brand-navy">{it.title}</span>
                      <span className="rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-xs font-bold text-brand-orange">{it.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'auditoria' && <AuditList entries={audit} isStaff={staff} />}
        </main>
      </div>

      {wizardOpen && !readOnly && (
        <CaptureWizard
          parks={visParks.length > 0 ? visParks : parks.filter((p) => p.orgId === actor.orgId)}
          editing={editing}
          fxUsdMxn={fx}
          onClose={() => { setWizardOpen(false); setEditing(null); }}
          onSave={saveWizard}
        />
      )}

      {reportOpen && (
        <ReportModal
          live={liveKpis} frozen={mockQ1Kpis} currency={currency} fx={fx}
          generatedBy={persona.label} onClose={() => setReportOpen(false)}
        />
      )}

      {toast !== null && (
        <div className="fixed bottom-6 left-1/2 z-[110] w-max max-w-[92vw] -translate-x-1/2 rounded-2xl bg-[#0F172A] px-4 py-3 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10">
          {toast}
        </div>
      )}
      </div>
    </div>
  );
}

export default App;
