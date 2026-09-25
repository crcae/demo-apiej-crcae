// Snapshot service — historical integrity.
// RULE: live tables are edited freely; quarterly metrics are ONLY written as
// immutable snapshot rows. Updates to a building in Q2 must never touch Q1 rows.

export interface PeriodRef {
  id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  isClosed: boolean;
}

export interface BuildingLive {
  id: string;
  rentableM2: number;
  vacantM2: number;
  occupiedM2: number;
  askingRentUsd: number | null;
  askingRentMxn: number | null;
  availabilityState: string;
}

export interface BuildingSnapshotRow extends BuildingLive {
  buildingId: string;
  periodId: string;
}

export interface ParkSnapshotInput {
  parkId: string;
  periodId: string;
  totalInventoryM2: number;
  vacantM2: number;
  leasedM2: number;
  underConstructionM2: number;
  avgAskRentUsd: number | null;
  avgAskRentMxn: number | null;
  avgSaleUsd: number | null;
}

export function vacancyRatePct(totalInventoryM2: number, vacantM2: number): number {
  if (totalInventoryM2 <= 0) return 0;
  return Number(((vacantM2 / totalInventoryM2) * 100).toFixed(3));
}

/** Net absorption for one building between two consecutive snapshots. */
export function netAbsorptionM2(current: { occupiedM2: number }, previous: { occupiedM2: number } | null): number {
  return current.occupiedM2 - (previous?.occupiedM2 ?? 0);
}

/**
 * Build snapshot rows for the ACTIVE (open) period from live state.
 * Caller persists with UNIQUE(building_id, period_id) — re-running for the
 * same period must upsert the OPEN period row only; closed periods throw
 * (DB trigger guard_snapshot_immutable enforces this too).
 */
export function buildBuildingSnapshots(
  live: BuildingLive[],
  period: PeriodRef,
  buildingIdOf: (b: BuildingLive) => string = (b) => b.id,
): BuildingSnapshotRow[] {
  if (period.isClosed) {
    throw new Error(`Period ${period.year}-Q${period.quarter} is closed: snapshots are frozen`);
  }
  return live.map((b) => ({
    ...b,
    buildingId: buildingIdOf(b),
    periodId: period.id,
  }));
}

/** Aggregate park-level snapshot from its buildings (weighted avg rent by rentable m²). */
export function aggregateParkSnapshot(
  parkId: string,
  periodId: string,
  buildings: BuildingLive[],
  underConstructionM2 = 0,
): ParkSnapshotInput {
  const total = buildings.reduce((s, b) => s + b.rentableM2, 0);
  const vacant = buildings.reduce((s, b) => s + b.vacantM2, 0);
  const occupied = buildings.reduce((s, b) => s + b.occupiedM2, 0);
  const wUsd = buildings.reduce((s, b) => s + (b.askingRentUsd ?? 0) * b.rentableM2, 0);
  const wMxn = buildings.reduce((s, b) => s + (b.askingRentMxn ?? 0) * b.rentableM2, 0);
  return {
    parkId,
    periodId,
    totalInventoryM2: total,
    vacantM2: vacant,
    leasedM2: occupied,
    underConstructionM2,
    avgAskRentUsd: total > 0 ? Number((wUsd / total).toFixed(2)) : null,
    avgAskRentMxn: total > 0 ? Number((wMxn / total).toFixed(2)) : null,
    avgSaleUsd: null,
  };
}
