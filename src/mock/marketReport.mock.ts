/** Demo-only market report figures for Observatorio APIEJ (PCI / PCP structure).
 * Invented numbers for the product demo — not official market data. */

export interface CorridorMetricRow {
  corridor: string;
  netAbsorptionM2: number;
  availabilityM2: number;
  availabilityPct: number;
  avgRentUsd: number;
  underConstructionM2: number;
}

export interface ParkCapitalBlock {
  label: string;
  short: 'PCI' | 'PCP';
  grossAbsorptionM2: number;
  netAbsorptionM2: number;
  vacationsM2: number;
  availabilityM2: number;
  availabilityPct: number;
  avgRentUsd: number;
  maxRentUsd: number;
  minRentUsd: number;
  underConstructionM2: number;
  preLeasedM2: number;
  inventoryGrowthPct: number;
  corridors: CorridorMetricRow[];
}

export interface NationalCompareRow {
  market: string;
  netAbsorptionM2: number;
  availabilityPct: number;
  avgRentUsd: number;
}

export interface MarketReportDemo {
  periodLabel: string;
  title: string;
  subtitle: string;
  coverageNote: string;
  corridorsCovered: string[];
  fxUsdMxn: number;
  pci: ParkCapitalBlock;
  pcp: ParkCapitalBlock;
  national: NationalCompareRow[];
  zmgTotals: {
    inventoryM2: number;
    underConstructionM2: number;
    availabilityM2: number;
    availabilityPct: number;
    grossAbsorptionM2: number;
    netAbsorptionM2: number;
    avgRentUsd: number;
  };
  disclaimer: string;
}

export const mockMarketReportDemo: MarketReportDemo = {
  periodLabel: '2026-Q2',
  title: 'Resumen de Mercado Industrial',
  subtitle: 'Observatorio APIEJ · Documento demostrativo',
  coverageNote: 'Cobertura ilustrativa de corredores de la Zona Metropolitana de Guadalajara (ZMG).',
  corridorsCovered: [
    'Zapopan Norte',
    'El Salto–Tlajomulco–Ixtlahuacán',
    'Periférico Sur',
    'López Mateos Sur',
    'Tonalá–Zapotlanejo',
    'Circuito Metropolitano Sur',
    'Antigua Zona Industrial',
    'Carretera a Colima',
  ],
  fxUsdMxn: 17.45,
  pci: {
    label: 'Parques de Capital Institucional',
    short: 'PCI',
    grossAbsorptionM2: 98_400,
    netAbsorptionM2: 86_250,
    vacationsM2: 12_150,
    availabilityM2: 142_800,
    availabilityPct: 2.8,
    avgRentUsd: 7.45,
    maxRentUsd: 11.20,
    minRentUsd: 5.90,
    underConstructionM2: 412_000,
    preLeasedM2: 48_600,
    inventoryGrowthPct: 7.2,
    corridors: [
      { corridor: 'El Salto–Tlajomulco', netAbsorptionM2: 52_100, availabilityM2: 88_400, availabilityPct: 3.1, avgRentUsd: 6.95, underConstructionM2: 268_000 },
      { corridor: 'Zapopan Norte', netAbsorptionM2: 24_800, availabilityM2: 22_100, availabilityPct: 1.9, avgRentUsd: 8.10, underConstructionM2: 64_500 },
      { corridor: 'Periférico Sur', netAbsorptionM2: 6_200, availabilityM2: 18_600, availabilityPct: 2.4, avgRentUsd: 7.85, underConstructionM2: 41_200 },
      { corridor: 'Carretera a Colima', netAbsorptionM2: 3_150, availabilityM2: 13_700, availabilityPct: 4.0, avgRentUsd: 6.40, underConstructionM2: 38_300 },
    ],
  },
  pcp: {
    label: 'Parques de Capital Patrimonial',
    short: 'PCP',
    grossAbsorptionM2: 41_200,
    netAbsorptionM2: 22_850,
    vacationsM2: 18_350,
    availabilityM2: 198_500,
    availabilityPct: 7.6,
    avgRentUsd: 6.85,
    maxRentUsd: 9.80,
    minRentUsd: 5.20,
    underConstructionM2: 118_400,
    preLeasedM2: 9_800,
    inventoryGrowthPct: 5.4,
    corridors: [
      { corridor: 'Zapopan Norte', netAbsorptionM2: 9_400, availabilityM2: 58_200, availabilityPct: 8.2, avgRentUsd: 7.20, underConstructionM2: 28_600 },
      { corridor: 'Tonalá–Zapotlanejo', netAbsorptionM2: 6_150, availabilityM2: 44_800, availabilityPct: 9.1, avgRentUsd: 6.55, underConstructionM2: 31_200 },
      { corridor: 'El Salto–Tlajomulco', netAbsorptionM2: 4_800, availabilityM2: 36_100, availabilityPct: 6.8, avgRentUsd: 6.90, underConstructionM2: 42_000 },
      { corridor: 'Circuito Metropolitano Sur', netAbsorptionM2: 2_500, availabilityM2: 29_400, availabilityPct: 7.4, avgRentUsd: 6.15, underConstructionM2: 16_600 },
    ],
  },
  national: [
    { market: 'CDMX', netAbsorptionM2: 380_000, availabilityPct: 4.2, avgRentUsd: 10.40 },
    { market: 'Monterrey', netAbsorptionM2: 210_000, availabilityPct: 5.8, avgRentUsd: 6.75 },
    { market: 'Guadalajara (demo)', netAbsorptionM2: 109_100, availabilityPct: 4.6, avgRentUsd: 7.15 },
    { market: 'Juárez', netAbsorptionM2: 165_000, availabilityPct: 6.2, avgRentUsd: 6.90 },
    { market: 'Bajío', netAbsorptionM2: 58_000, availabilityPct: 3.9, avgRentUsd: 5.65 },
  ],
  zmgTotals: {
    inventoryM2: 7_820_000,
    underConstructionM2: 530_400,
    availabilityM2: 341_300,
    availabilityPct: 4.4,
    grossAbsorptionM2: 139_600,
    netAbsorptionM2: 109_100,
    avgRentUsd: 7.15,
  },
  disclaimer:
    'Documento demostrativo · cifras de ejemplo para la demo APIEJ. No constituyen datos oficiales ni republicación de reportes confidenciales.',
};
