// Decoupled mock data (swap-ready for HTTP/API per AGENTS.md).
// Tenants: org-apiej (staff) · org-alpha (Developer Alpha) · org-beta (Developer Beta) · org-member.
import type { AuditEntry, Building, CorridorStat, Land, MarketKpis, Park, Period } from '../types/domain.js';

export const ORG_ALPHA = 'org-alpha';
export const ORG_BETA = 'org-beta';

export const mockPeriods: Period[] = [
  { id: 'p-2026-q1', year: 2026, quarter: 1, label: '2026-Q1', isClosed: true, fxUsdMxn: 17.12 },
  { id: 'p-2026-q2', year: 2026, quarter: 2, label: '2026-Q2', isClosed: false, fxUsdMxn: 17.35 },
];

export const mockParks: Park[] = [
  {
    id: 'park-salot', orgId: ORG_ALPHA,
    name: 'Parque Industrial El Salto', slug: 'parque-industrial-el-salto',
    municipality: 'El Salto', corridor: 'El Salto',
    address: 'Carretera a Chapala Km 12',
    lat: 20.522, lng: -103.193,
    totalLandM2: 450000, developedM2: 320000, reserveM2: 130000,
    infrastructure: { water: true, powerKva: 12000, gas: true, fiber: true, railSpur: false, security: true },
    category: 'PCI', status: 'VERIFIED', visibility: 'SHARED',
    internalNotes: 'Auditoría Q1 OK. Subestación 12 MVA verificada con CFE.',
    updatedAt: '2026-06-10T18:00:00Z',
  },
  {
    id: 'park-tlajo-alpha', orgId: ORG_ALPHA,
    name: 'Ampliación Tlajomulco (borrador)', slug: 'ampliacion-tlajomulco-borrador',
    municipality: 'Tlajomulco', corridor: 'Tlajomulco',
    address: 'Av. Adolf Horn Km 8',
    lat: 20.472, lng: -103.452,
    totalLandM2: 120000, developedM2: 0, reserveM2: 120000,
    infrastructure: { water: false, gas: false, fiber: false },
    category: 'PCP', status: 'DRAFT', visibility: 'PRIVATE',
    updatedAt: '2026-09-20T18:00:00Z',
  },
  {
    id: 'park-zapopan-beta', orgId: ORG_BETA,
    name: 'Zapopan Logistics Park', slug: 'zapopan-logistics-park',
    municipality: 'Zapopan', corridor: 'Zapopan',
    address: 'Periférico Norte 4200',
    lat: 20.724, lng: -103.402,
    totalLandM2: 280000, developedM2: 210000, reserveM2: 70000,
    infrastructure: { water: true, powerKva: 8000, gas: true, fiber: true, railSpur: true, security: true },
    category: 'PCI', status: 'VERIFIED', visibility: 'SHARED',
    updatedAt: '2026-05-28T18:00:00Z',
  },
  {
    id: 'park-perisur-beta', orgId: ORG_BETA,
    name: 'Periférico Sur Industrial', slug: 'periferico-sur-industrial',
    municipality: 'Tlaquepaque', corridor: 'Periférico Sur',
    address: 'Periférico Sur 6800',
    lat: 20.603, lng: -103.358,
    totalLandM2: 190000, developedM2: 60000, reserveM2: 130000,
    infrastructure: { water: true, powerKva: 4000, gas: false, fiber: true, railSpur: false, security: true },
    category: 'PCP', status: 'PENDING_VALIDATION', visibility: 'PRIVATE',
    updatedAt: '2026-09-23T18:00:00Z',
  },
];

export const mockBuildings: Building[] = [
  {
    id: 'b-n01', orgId: ORG_ALPHA, parkId: 'park-salot',
    code: 'N-01', buildingClass: 'A',
    totalGrossM2: 12500, netRentableM2: 11800,
    clearHeightM: 9.6, dockDoors: 12, ramps: 2, floorLoadTM2: 5, powerKva: 1500,
    hasGas: true, hasCrane: false, lat: 20.523, lng: -103.194,
    availabilityState: 'AVAILABLE', occupantAlias: 'Disponible',
    askingRentUsdM2: 6.5, askingRentMxnM2: 112.8,
    status: 'VERIFIED', visibility: 'SHARED',
    updatedAt: '2026-06-10T18:00:00Z',
  },
  {
    id: 'b-n02', orgId: ORG_ALPHA, parkId: 'park-salot',
    code: 'N-02', buildingClass: 'A-',
    totalGrossM2: 8000, netRentableM2: 7600,
    clearHeightM: 8.2, dockDoors: 8, ramps: 1,
    hasGas: false, hasCrane: false, lat: 20.521, lng: -103.192,
    availabilityState: 'LEASED', occupantAlias: 'Logistics tenant',
    occupantCompany: 'Autopartes del Centro SA de CV',
    negotiatedNote: 'Renta pactada $5.80 USD/m² por 5 años (confidencial).',
    askingRentUsdM2: 6.1, askingRentMxnM2: 105.8,
    status: 'PENDING_VALIDATION', visibility: 'PRIVATE',
    updatedAt: '2026-09-22T18:00:00Z',
  },
  {
    id: 'b-n04', orgId: ORG_ALPHA, parkId: 'park-salot',
    code: 'N-04', buildingClass: 'A',
    totalGrossM2: 15200, netRentableM2: 14500,
    clearHeightM: 10.4, dockDoors: 16, ramps: 2, floorLoadTM2: 6, powerKva: 2000,
    hasGas: true, hasCrane: true, lat: 20.524, lng: -103.195,
    availabilityState: 'UNDER_CONSTRUCTION', occupantAlias: 'En construcción',
    askingRentUsdM2: 6.9, askingRentMxnM2: 119.7,
    status: 'DRAFT', visibility: 'PRIVATE',
    updatedAt: '2026-09-24T18:00:00Z',
  },
  {
    id: 'b-z01', orgId: ORG_BETA, parkId: 'park-zapopan-beta',
    code: 'Z-01', buildingClass: 'A',
    totalGrossM2: 20000, netRentableM2: 19200,
    clearHeightM: 11.0, dockDoors: 24, ramps: 4, floorLoadTM2: 6, powerKva: 2500,
    hasGas: true, hasCrane: false, lat: 20.725, lng: -103.403,
    availabilityState: 'LEASED', occupantAlias: 'E-commerce tenant',
    occupantCompany: 'Distribuidora Occidente SA de CV',
    negotiatedNote: 'Contrato 7 años, escalador 3% anual (confidencial).',
    askingRentUsdM2: 7.2, askingRentMxnM2: 124.9,
    status: 'VERIFIED', visibility: 'SHARED',
    updatedAt: '2026-05-28T18:00:00Z',
  },
  {
    id: 'b-z02', orgId: ORG_BETA, parkId: 'park-zapopan-beta',
    code: 'Z-02', buildingClass: 'B',
    totalGrossM2: 6500, netRentableM2: 6100,
    clearHeightM: 7.5, dockDoors: 6, ramps: 1,
    hasGas: false, hasCrane: false, lat: 20.723, lng: -103.401,
    availabilityState: 'AVAILABLE', occupantAlias: 'Disponible',
    askingRentUsdM2: 5.4, askingRentMxnM2: 93.7,
    status: 'VERIFIED', visibility: 'SHARED',
    updatedAt: '2026-05-28T18:00:00Z',
  },
  {
    id: 'b-s01', orgId: ORG_BETA, parkId: 'park-perisur-beta',
    code: 'S-01', buildingClass: 'B',
    totalGrossM2: 9800, netRentableM2: 9300,
    clearHeightM: 8.0, dockDoors: 10, ramps: 2,
    hasGas: false, hasCrane: false, lat: 20.604, lng: -103.359,
    availabilityState: 'AVAILABLE', occupantAlias: 'Disponible',
    askingRentUsdM2: 5.8, askingRentMxnM2: 100.6,
    status: 'PENDING_VALIDATION', visibility: 'PRIVATE',
    updatedAt: '2026-09-23T18:00:00Z',
  },
];

export const mockLands: Land[] = [
  {
    id: 'l-macrolote-3', orgId: ORG_ALPHA, parkId: 'park-salot',
    name: 'Macrolote 3', totalM2: 45000, sellableM2: 42000,
    zoning: 'Industrial', topography: 'Plana',
    priceSaleUsdM2: 85, priceSaleMxnM2: 1474,
    availabilityState: 'AVAILABLE', status: 'VERIFIED', visibility: 'SHARED',
    updatedAt: '2026-06-10T18:00:00Z',
  },
  {
    id: 'l-zap-lote-7', orgId: ORG_BETA, parkId: 'park-zapopan-beta',
    name: 'Lote 7 — Reserva', totalM2: 30000, sellableM2: 28000,
    zoning: 'Industrial', topography: 'Semiplana',
    priceSaleUsdM2: 110, priceSaleMxnM2: 1908,
    availabilityState: 'AVAILABLE', status: 'VERIFIED', visibility: 'SHARED',
    updatedAt: '2026-05-28T18:00:00Z',
  },
];

/** Frozen Q1-2026 closed-period aggregates (immutable — simulator never mutates these). */
export const mockQ1Kpis: MarketKpis = {
  periodId: 'p-2026-q1',
  totalInventoryM2: 68500,
  vacancyPct: 18.4,
  netAbsorptionM2: 12400,
  grossAbsorptionM2: 15800,
  avgRentUsd: 6.32,
  avgRentMxn: 108.2,
  corridors: [
    { corridor: 'El Salto', inventoryM2: 26800, vacantM2: 5200, vacancyPct: 19.4, avgRentUsd: 6.4, netAbsorptionM2: 5100, grossAbsorptionM2: 6200 },
    { corridor: 'Tlajomulco', inventoryM2: 0, vacantM2: 0, vacancyPct: 0, avgRentUsd: null, netAbsorptionM2: 0, grossAbsorptionM2: 0 },
    { corridor: 'Zapopan', inventoryM2: 32300, vacantM2: 5600, vacancyPct: 17.3, avgRentUsd: 6.5, netAbsorptionM2: 6200, grossAbsorptionM2: 8100 },
    { corridor: 'Periférico Sur', inventoryM2: 9400, vacantM2: 1800, vacancyPct: 19.1, avgRentUsd: 5.7, netAbsorptionM2: 1100, grossAbsorptionM2: 1500 },
  ],
};

/** Corridor scaffold for live Q2 computation (Q1 rows stay frozen). */
export const corridorOrder: string[] = ['El Salto', 'Tlajomulco', 'Zapopan', 'Periférico Sur'];

export function corridorOf(parkId: string | null | undefined, parks: Park[]): string {
  const p = parks.find((x) => x.id === parkId);
  return p?.corridor ?? 'El Salto';
}

export const mockAuditSeed: AuditEntry[] = [
  {
    id: 'a-1', actorName: 'Validador APIEJ', action: 'SNAPSHOT_CLOSE',
    entityType: 'PERIOD', entityLabel: '2026-Q1',
    detail: 'Cierre trimestral: 68,500 m² inventario · vacancia 18.4% · hash 9f31…c2',
    createdAt: '2026-04-02T16:00:00Z',
  },
  {
    id: 'a-2', actorName: 'Operador Beta', action: 'STATUS_CHANGE',
    entityType: 'BUILDING', entityLabel: 'S-01',
    detail: 'DRAFT → PENDING_VALIDATION · Periférico Sur Industrial',
    createdAt: '2026-09-23T18:10:00Z',
  },
  {
    id: 'a-3', actorName: 'Operador Alpha', action: 'STATUS_CHANGE',
    entityType: 'BUILDING', entityLabel: 'N-02',
    detail: 'DRAFT → PENDING_VALIDATION · Parque Industrial El Salto',
    createdAt: '2026-09-22T18:05:00Z',
  },
];

export function q1Corridor(name: string): CorridorStat | undefined {
  return mockQ1Kpis.corridors.find((c) => c.corridor === name);
}
