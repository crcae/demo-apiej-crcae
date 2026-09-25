import { describe, expect, it } from 'vitest';
import {
  aggregateParkSnapshot,
  buildBuildingSnapshots,
  netAbsorptionM2,
  vacancyRatePct,
} from '../src/services/snapshot.service.js';

describe('snapshot preservation (Phase 1 §4.3)', () => {
  it('Q1 snapshot untouched when Q2 live state changes', () => {
    const q1 = { occupiedM2: 8000 };
    const q2Live = { occupiedM2: 9500 };
    // Q1 row is frozen; Q2 computes delta against it without mutating it
    expect(netAbsorptionM2(q2Live, q1)).toBe(1500);
    expect(q1.occupiedM2).toBe(8000); // untouched
  });

  it('refuses to write into a closed period', () => {
    const closed = { id: 'p-q1', year: 2026, quarter: 1 as const, isClosed: true };
    expect(() =>
      buildBuildingSnapshots(
        [{ id: 'b1', rentableM2: 10000, vacantM2: 2000, occupiedM2: 8000, askingRentUsd: 6.5, askingRentMxn: 110, availabilityState: 'AVAILABLE' }],
        closed,
      ),
    ).toThrow(/frozen/);
  });

  it('computes vacancy + weighted avg rent', () => {
    expect(vacancyRatePct(10000, 2000)).toBe(20);
    expect(vacancyRatePct(0, 0)).toBe(0);
    const agg = aggregateParkSnapshot('park-1', 'period-q2', [
      { id: 'b1', rentableM2: 6000, vacantM2: 1000, occupiedM2: 5000, askingRentUsd: 6.0, askingRentMxn: 100, availabilityState: 'AVAILABLE' },
      { id: 'b2', rentableM2: 4000, vacantM2: 4000, occupiedM2: 0, askingRentUsd: 7.0, askingRentMxn: 120, availabilityState: 'AVAILABLE' },
    ]);
    expect(agg.totalInventoryM2).toBe(10000);
    expect(agg.vacantM2).toBe(5000);
    expect(agg.avgAskRentUsd).toBeCloseTo(6.4, 2); // (6*6000+7*4000)/10000
  });
});
