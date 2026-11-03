import { describe, expect, it } from 'vitest';
import {
  buildingDraftSchema,
  firstZodMessage,
  formatZodErrors,
  landDraftSchema,
  parkDraftSchema,
} from './capture.js';

describe('parkDraftSchema', () => {
  it('accepts balanced surfaces', () => {
    const r = parkDraftSchema.safeParse({
      name: 'Parque El Salto',
      municipality: 'El Salto',
      totalLandM2: 100_000,
      developedM2: 60_000,
      reserveM2: 40_000,
    });
    expect(r.success).toBe(true);
  });

  it('rejects unbalanced surfaces', () => {
    const r = parkDraftSchema.safeParse({
      name: 'Parque X',
      municipality: 'Zapopan',
      totalLandM2: 100,
      developedM2: 40,
      reserveM2: 40,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(formatZodErrors(r.error).totalLandM2).toMatch(/desarrollada \+ reserva/i);
    }
  });

  it('rejects short name', () => {
    const r = parkDraftSchema.safeParse({
      name: 'A',
      municipality: 'Zapopan',
      totalLandM2: 10,
      developedM2: 5,
      reserveM2: 5,
    });
    expect(r.success).toBe(false);
  });
});

describe('buildingDraftSchema', () => {
  const base = {
    parkId: 'park-salot',
    code: 'N-99',
    buildingClass: 'A' as const,
    totalGrossM2: 10_000,
    netRentableM2: 9_000,
    dockDoors: 12,
    ramps: 2,
    hasGas: true,
    hasCrane: false,
    availabilityState: 'AVAILABLE' as const,
  };

  it('accepts valid nave draft', () => {
    expect(buildingDraftSchema.safeParse(base).success).toBe(true);
  });

  it('rejects rentable > gross', () => {
    const r = buildingDraftSchema.safeParse({ ...base, netRentableM2: 12_000 });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(firstZodMessage(r.error)).toMatch(/rentable/i);
    }
  });

  it('rejects missing code', () => {
    const r = buildingDraftSchema.safeParse({ ...base, code: '' });
    expect(r.success).toBe(false);
  });

  it('rejects zero rentable', () => {
    const r = buildingDraftSchema.safeParse({ ...base, netRentableM2: 0 });
    expect(r.success).toBe(false);
  });
});

describe('landDraftSchema', () => {
  it('accepts sellable <= total', () => {
    expect(
      landDraftSchema.safeParse({ name: 'Macrolote 3', totalM2: 42_000, sellableM2: 40_000 }).success,
    ).toBe(true);
  });

  it('rejects sellable > total', () => {
    const r = landDraftSchema.safeParse({ name: 'Lote', totalM2: 1000, sellableM2: 2000 });
    expect(r.success).toBe(false);
  });
});
