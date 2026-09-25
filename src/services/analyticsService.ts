// Live market analytics: Q2 (active) KPIs computed from current building state.
// Q1 rows are frozen seeds (mockQ1Kpis) — never recomputed, only compared.
import { corridorOf, corridorOrder, q1Corridor } from '../mock/market.mock.js';
import type { Building, CorridorStat, MarketKpis, Park } from '../types/domain.js';

function wAvg(items: Array<{ w: number; v: number | null | undefined }>): number | null {
  const tot = items.reduce((s, i) => s + i.w, 0);
  if (tot <= 0) return null;
  const sum = items.reduce((s, i) => s + (i.v ?? 0) * i.w, 0);
  return Number((sum / tot).toFixed(2));
}

/** Q2 live aggregates from VERIFIED + PENDING buildings (verified-only toggle optional). */
export function computeLiveKpis(
  buildings: Building[],
  parks: Park[],
  periodId: string,
  fxUsdMxn: number,
  verifiedOnly = false,
): MarketKpis {
  const scope = verifiedOnly ? buildings.filter((b) => b.status === 'VERIFIED') : buildings;
  const total = scope.reduce((s, b) => s + b.netRentableM2, 0);
  const vacant = scope
    .filter((b) => b.availabilityState === 'AVAILABLE' || b.availabilityState === 'UNDER_CONSTRUCTION')
    .reduce((s, b) => s + b.netRentableM2, 0);
  const leased = scope
    .filter((b) => b.availabilityState === 'LEASED' || b.availabilityState === 'RESERVED')
    .reduce((s, b) => s + b.netRentableM2, 0);
  const avgUsd = wAvg(scope.map((b) => ({ w: b.netRentableM2, v: b.askingRentUsdM2 })));
  const corridors: CorridorStat[] = corridorOrder.map((c) => {
    const inC = scope.filter((b) => corridorOf(b.parkId, parks) === c);
    const inv = inC.reduce((s, b) => s + b.netRentableM2, 0);
    const vac = inC
      .filter((b) => b.availabilityState === 'AVAILABLE' || b.availabilityState === 'UNDER_CONSTRUCTION')
      .reduce((s, b) => s + b.netRentableM2, 0);
    const prev = q1Corridor(c);
    const prevLeased = prev ? prev.inventoryM2 - prev.vacantM2 : 0;
    const curLeased = inv - vac;
    return {
      corridor: c,
      inventoryM2: inv,
      vacantM2: vac,
      vacancyPct: inv > 0 ? Number(((vac / inv) * 100).toFixed(1)) : 0,
      avgRentUsd: wAvg(inC.map((b) => ({ w: b.netRentableM2, v: b.askingRentUsdM2 }))),
      netAbsorptionM2: curLeased - prevLeased,
      grossAbsorptionM2: Math.max(0, curLeased - prevLeased),
    };
  });
  const q1Total = 68500;
  const q1Leased = q1Total - 68500 * 0.184;
  const netAbs = leased - q1Leased;
  return {
    periodId,
    totalInventoryM2: total,
    vacancyPct: total > 0 ? Number(((vacant / total) * 100).toFixed(1)) : 0,
    netAbsorptionM2: Math.round(netAbs),
    grossAbsorptionM2: Math.max(0, Math.round(netAbs)),
    avgRentUsd: avgUsd,
    avgRentMxn: avgUsd !== null ? Number((avgUsd * fxUsdMxn).toFixed(2)) : null,
    corridors,
  };
}

export interface Delta {
  value: number;
  up: boolean;
  good: boolean;
  label: string;
}

/** Q2 vs frozen Q1 deltas for KPI cards. */
export function kpiDeltas(live: MarketKpis, q1Vacancy: number, q1RentUsd: number | null): Record<string, Delta> {
  const vacDelta = Number((live.vacancyPct - q1Vacancy).toFixed(1));
  const rentDelta = live.avgRentUsd !== null && q1RentUsd !== null
    ? Number((live.avgRentUsd - q1RentUsd).toFixed(2))
    : 0;
  return {
    vacancy: { value: vacDelta, up: vacDelta > 0, good: vacDelta <= 0, label: `${vacDelta > 0 ? '+' : ''}${vacDelta} pp vs Q1` },
    rent: { value: rentDelta, up: rentDelta > 0, good: rentDelta >= 0, label: `${rentDelta > 0 ? '+' : ''}$${rentDelta} vs Q1` },
  };
}
