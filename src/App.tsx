import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage.js';
import { AppHeader } from './components/AppHeader.js';
import type { TourStep } from './components/TourDock.js';
import { TourDock, type TourAction } from './components/TourDock.js';
import { AuditView } from './features/auditoria/AuditView.js';
import { CaptureView } from './features/captura/CaptureView.js';
import { ReportModal } from './features/reportes/ReportModal.js';
import { ReportsView } from './features/reportes/ReportsView.js';
import { CaptureWizard, type WizardDraft } from './features/captura/CaptureWizard.js';
import { Dashboard, type Currency } from './features/dashboard/Dashboard.js';
import { InventoryView } from './features/inventario/InventoryView.js';

const ParkMapView = lazy(() =>
  import('./features/mapa/ParkMapView.js').then((m) => ({ default: m.ParkMapView })),
);
import { ValidationView, type ReviewItem } from './features/validacion/ValidationView.js';
import {
  mockAuditSeed, mockBuildings, mockLands, mockParks, mockPeriods, mockQ1Kpis,
} from './mock/market.mock.js';
import { mockListings } from './mock/listings.mock.js';
import { computeLiveKpis } from './services/analyticsService.js';
import { classifyFxSource, fetchLiveFxRate, invalidateFxCache, resolveFx, type FxSource } from './services/fxService.js';
import { isStaff, listBuildingsFor, listLandsFor, listParksFor } from './services/marketService.js';
import { PERSONAS } from './store/personas.js';
import type { AuditEntry, Building, DemoPersonaKey, EntityStatus, Park } from './types/domain.js';
import './App.css';

type View = 'dashboard' | 'mapa' | 'inventario' | 'captura' | 'validacion' | 'reportes' | 'auditoria';

const VIEW_LABEL: Record<View, string> = {
  dashboard: 'Dashboard',
  mapa: 'Mapa GIS',
  inventario: 'Inventario',
  captura: 'Captura',
  validacion: 'Validación',
  reportes: 'Reportes',
  auditoria: 'Auditoría',
};

function nowIso(): string {
  return new Date().toISOString();
}

const KNOWN_VIEWS: View[] = ['dashboard', 'mapa', 'inventario', 'captura', 'validacion', 'reportes', 'auditoria'];

function PlatformApp(): React.JSX.Element {
  const entryState = useLocation().state as { view?: string } | null;
  const entryView: View = KNOWN_VIEWS.includes(entryState?.view as View) ? (entryState?.view as View) : 'dashboard';
  const [personaKey, setPersonaKey] = useState<DemoPersonaKey>('STAFF');
  const [view, setView] = useState<View>(entryView);
  const [periodId, setPeriodId] = useState('p-2026-q1');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [parks, setParks] = useState(mockParks);
  const [buildings, setBuildings] = useState<Building[]>(mockBuildings);
  const [lands, setLands] = useState(mockLands);
  const [audit, setAudit] = useState<AuditEntry[]>(mockAuditSeed);
  const [toast, setToast] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<Building | null>(null);
  const [tourStep, setTourStep] = useState<TourStep | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [liveFx, setLiveFx] = useState<number | null>(null);
  const [fxFetchFailed, setFxFetchFailed] = useState(false);

  const persona = PERSONAS.find((p) => p.key === personaKey) ?? PERSONAS[0];
  const actor = persona.actor;
  const staff = isStaff(actor);
  const readOnly = actor.role === 'MEMBER_VIEWER';
  const frozenFx = mockPeriods.find((p) => p.id === periodId)?.fxUsdMxn;
  const fx = resolveFx(liveFx, frozenFx);
  const fxSource: FxSource = classifyFxSource(liveFx, frozenFx, fxFetchFailed);

  function flash(msg: string): void {
    setToast(msg);
    window.setTimeout(() => setToast(null), 4200);
  }

  const revalidateFxCb = useCallback((opts?: { quiet?: boolean }) => {
    invalidateFxCache();
    void fetchLiveFxRate({ force: true }).then((rate) => {
      if (rate !== null) {
        setLiveFx(rate);
        setFxFetchFailed(false);
      } else {
        setLiveFx(null);
        setFxFetchFailed(true);
        if (opts?.quiet !== true) {
          setToast('No se pudo obtener FX en vivo — usando tipo de cambio del periodo.');
          window.setTimeout(() => setToast(null), 4200);
        }
      }
    });
  }, []);

  // Auto-fetch live USD/MXN on page load/refresh. Falls back to the frozen
  // period rate (or 17.35) when offline — the app never breaks.
  useEffect(() => {
    void fetchLiveFxRate().then((rate) => {
      if (rate !== null) {
        setLiveFx(rate);
        setFxFetchFailed(false);
      } else {
        setFxFetchFailed(true);
      }
    });
  }, []);

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

  const inboxItems: ReviewItem[] = useMemo(() => {
    const all: ReviewItem[] = [
      ...parks.filter((p) => p.status === 'PENDING_VALIDATION').map((p): ReviewItem => ({ kind: 'PARK', id: p.id, title: p.name, status: p.status })),
      ...buildings.filter((b) => b.status === 'PENDING_VALIDATION').map((b): ReviewItem => ({ kind: 'BUILDING', id: b.id, title: `Nave ${b.code}`, status: b.status })),
      ...lands.filter((l) => l.status === 'PENDING_VALIDATION').map((l): ReviewItem => ({ kind: 'LAND', id: l.id, title: l.name, status: l.status })),
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
        { label: 'Abrir Reportes PDF', gold: true, run: () => setView('reportes') },
      ],
    },
  };

  // Tenant-filtered datasets (backend RLS mirrored in marketService)
  const parksResult = useMemo(() => listParksFor(actor, parks), [actor, parks]);
  const buildingsResult = useMemo(() => listBuildingsFor(actor, buildings), [actor, buildings]);
  const landsResult = useMemo(() => listLandsFor(actor, lands), [actor, lands]);
  const visParks = parksResult.ok ? parksResult.data : [];
  const visBuildings = buildingsResult.ok ? buildingsResult.data : [];
  const visLands = landsResult.ok ? landsResult.data : [];
  const accessDenied = !parksResult.ok
    ? parksResult.message
    : !buildingsResult.ok
      ? buildingsResult.message
      : !landsResult.ok
        ? landsResult.message
        : null;

  // Live Q2 market aggregates — recalculated on every approval (Q1 stays frozen)
  const liveKpis = useMemo(
    () => computeLiveKpis(staff ? buildings : visBuildings, parks, 'p-2026-q2', fx),
    [staff, buildings, visBuildings, parks, fx],
  );

  function pushAudit(e: Omit<AuditEntry, 'id' | 'createdAt'>): void {
    setAudit((prev) => [{ ...e, id: `a-${nowIso()}`, createdAt: nowIso() }, ...prev]);
  }

  // --- Validation transitions (mirror backend authorizeTransition) ---
  function decide(item: ReviewItem, to: EntityStatus, comment: string): void {
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

  function updatePark(id: string, patch: Partial<Park>): void {
    setParks((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p)));
    pushAudit({
      actorName: actor.fullName, action: 'UPDATE', entityType: 'PARK',
      entityLabel: id, detail: 'Borrador actualizado (superficies y datos generales)',
    });
    flash('Borrador guardado.');
  }

  function createPark(): void {
    const stamp = Date.now() % 100000;
    setParks((prev) => [...prev, {
      id: `park-nuevo-${stamp}`, orgId: actor.orgId, name: 'Nuevo parque',
      slug: `parque-nuevo-${stamp}`, municipality: 'El Salto', corridor: 'ES-TL-IM',
      totalLandM2: 0, developedM2: 0, reserveM2: 0, infrastructure: {},
      category: 'PCI', status: 'DRAFT', visibility: 'PRIVATE', updatedAt: nowIso(),
    }]);
    pushAudit({
      actorName: actor.fullName, action: 'CREATE', entityType: 'PARK',
      entityLabel: 'Nuevo parque', detail: 'Parque creado como borrador',
    });
    flash('Nuevo parque creado como borrador.');
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
    ? ['dashboard', 'mapa', 'inventario', 'reportes']
    : staff
      ? ['dashboard', 'mapa', 'inventario', 'captura', 'validacion', 'reportes', 'auditoria']
      : ['dashboard', 'mapa', 'inventario', 'captura', 'validacion', 'reportes'];

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC]">
      <AppHeader
        items={allowedViews.map((v) => ({
          key: v,
          label: VIEW_LABEL[v],
          count: v === 'validacion' ? inboxItems.length : undefined,
        }))}
        activeView={view}
        onView={(k) => setView(k as View)}
        persona={personaKey}
        onPersona={switchPersona}
        orgName={actor.orgName}
        visibleCounts={`${visParks.length} parques · ${visBuildings.length} naves · ${visLands.length} terrenos`}
      />

      <div className="mx-auto w-full max-w-[1600px] px-4 py-5 md:px-6">
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

        <main key={`${view}-${personaKey}-${periodId}`} className="animate-enter relative z-10 min-w-0">
          {accessDenied !== null && (
            <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800 shadow-sm" role="alert">
              Sin permiso — {accessDenied}
            </div>
          )}

          {view === 'dashboard' && (
            <Dashboard
              periods={mockPeriods}
              activePeriodId={periodId}
              onPeriod={setPeriodId}
              live={liveKpis}
              frozen={mockQ1Kpis}
              currency={currency}
              onCurrency={setCurrency}
              readOnly={readOnly}
              fx={fx}
              fxSource={fxSource}
              onRevalidateFx={(quiet) => revalidateFxCb({ quiet: quiet === true })}
              pendingCount={inboxItems.length}
              onGoValidation={() => setView('validacion')}
              onExport={() => setView('reportes')}
              onOpenTour={() => {
                setTourStep(1);
                switchPersona('STAFF');
                setView('dashboard');
                setPeriodId('p-2026-q1');
                flash('Paso 1: Q1 congelado (inmutable). Prueba cambiar entre USD y MXN.');
              }}
            />
          )}

          {view === 'mapa' && (
            <Suspense fallback={<p className="rounded-2xl bg-white p-6 text-sm font-medium text-slate-600 shadow-sm">Cargando mapa GIS…</p>}>
              <ParkMapView parks={visParks} buildings={visBuildings} lands={visLands} isStaff={staff} />
            </Suspense>
          )}

          {view === 'inventario' && <InventoryView listings={mockListings} />}

          {view === 'captura' && !readOnly && (
            <CaptureView
              parks={visParks}
              buildings={visBuildings}
              lands={visLands}
              isStaff={staff}
              actorOrgId={actor.orgId}
              onSubmitReview={(kind, id, to, c) => submitForReview(kind, id, to, c)}
              onUpdatePark={updatePark}
              onCreatePark={createPark}
              onNewBuilding={() => { setEditing(null); setWizardOpen(true); }}
              onEditBuilding={(b) => { setEditing(b); setWizardOpen(true); }}
            />
          )}

          {view === 'validacion' && (
            <ValidationView
              parks={parks}
              buildings={buildings}
              lands={lands}
              audit={audit}
              actorOrgId={actor.orgId}
              isStaff={staff}
              spotlight={tourStep === 3 || tourStep === 4}
              onDecide={(item, to, comment) => decide(item, to, comment)}
            />
          )}

          {view === 'reportes' && (
            <ReportsView
              periods={mockPeriods}
              live={liveKpis}
              frozen={mockQ1Kpis}
              currency={currency}
              fx={fx}
              generatedBy={persona.label}
            />
          )}

          {view === 'auditoria' && <AuditView entries={audit} isStaff={staff} />}
        </main>

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

function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<PlatformApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
