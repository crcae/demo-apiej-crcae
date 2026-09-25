// Capture-engine input contracts (zod) — shared by API handlers + web forms.
import { z } from 'zod';

export const parkInput = z.object({
  orgId: z.string().uuid(),
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(180).regex(/^[a-z0-9-]+$/),
  municipality: z.string().min(2).max(120),
  corridor: z.string().max(120).default('Guadalajara Metro'),
  address: z.string().max(300).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  totalLandM2: z.number().nonnegative().default(0),
  developedM2: z.number().nonnegative().default(0),
  reserveM2: z.number().nonnegative().default(0),
  infrastructure: z.record(z.string(), z.unknown()).default({}),
  category: z.enum(['PCI', 'PCP']).default('PCI'),
  visibility: z.enum(['PRIVATE', 'SHARED', 'PUBLIC']).default('PRIVATE'),
});

export const buildingInput = z.object({
  orgId: z.string().uuid(),
  parkId: z.string().uuid().nullable().optional(),
  code: z.string().min(1).max(60),
  buildingClass: z.enum(['A', 'A-', 'B', 'C']).default('A'),
  totalGrossM2: z.number().nonnegative(),
  netRentableM2: z.number().nonnegative(),
  clearHeightM: z.number().positive().max(30).optional(),
  dockDoors: z.number().int().nonnegative().default(0),
  ramps: z.number().int().nonnegative().default(0),
  floorLoadTM2: z.number().nonnegative().optional(),
  powerKva: z.number().nonnegative().optional(),
  hasGas: z.boolean().default(false),
  hasCrane: z.boolean().default(false),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  availabilityState: z.enum(['AVAILABLE', 'RESERVED', 'LEASED', 'SOLD', 'UNDER_CONSTRUCTION', 'OFF_MARKET']).default('AVAILABLE'),
  occupantAlias: z.string().max(160).optional(),
  askingRentUsdM2: z.number().nonnegative().optional(),
  askingRentMxnM2: z.number().nonnegative().optional(),
  askingSaleUsdM2: z.number().nonnegative().optional(),
  visibility: z.enum(['PRIVATE', 'SHARED', 'PUBLIC']).default('PRIVATE'),
});

export const landInput = z.object({
  orgId: z.string().uuid(),
  parkId: z.string().uuid().nullable().optional(),
  name: z.string().min(2).max(160),
  totalM2: z.number().nonnegative(),
  sellableM2: z.number().nonnegative(),
  zoning: z.string().max(120).optional(),
  topography: z.string().max(120).optional(),
  priceSaleUsdM2: z.number().nonnegative().optional(),
  priceSaleMxnM2: z.number().nonnegative().optional(),
  availabilityState: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'OFF_MARKET']).default('AVAILABLE'),
  visibility: z.enum(['PRIVATE', 'SHARED', 'PUBLIC']).default('PRIVATE'),
});

export type ParkInput = z.infer<typeof parkInput>;
export type BuildingInput = z.infer<typeof buildingInput>;
export type LandInput = z.infer<typeof landInput>;
