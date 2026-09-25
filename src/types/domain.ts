// APIEJ canonical frontend domain types (mirrors apps/api drizzle schema + Supabase).
// No `any` per AGENTS.md.

export type OrganizationType = 'APIEJ_INTERNAL' | 'PARK_DEVELOPER' | 'SUPPLIER' | 'BROKER';
export type RoleKey = 'SUPER_ADMIN' | 'APIEJ_STAFF' | 'PARK_OPERATOR' | 'BROKER' | 'SUPPLIER' | 'MEMBER_VIEWER' | 'PUBLIC';
export type EntityStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VERIFIED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'ARCHIVED';
export type Visibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';
export type AvailabilityState = 'AVAILABLE' | 'RESERVED' | 'LEASED' | 'SOLD' | 'UNDER_CONSTRUCTION' | 'OFF_MARKET';
export type BuildingClass = 'A' | 'A-' | 'B' | 'C';
export type ParkCategory = 'PCI' | 'PCP';

export interface Organization {
  id: string;
  type: OrganizationType;
  name: string;
  rfc?: string;
  contactEmail?: string;
  membershipStatus: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}

export interface ActorSession {
  userId: string;
  fullName: string;
  isSuperAdmin: boolean;
  orgId: string;
  orgName: string;
  role: RoleKey;
}

/** Demo personas for the Sprint 1 showcase (maps to ActorSession). */
export type DemoPersonaKey = 'STAFF' | 'ALPHA' | 'BETA' | 'MEMBER';

export interface Park {
  id: string;
  orgId: string;
  name: string;
  slug: string;
  municipality: string;
  corridor: string;
  address?: string;
  lat?: number;
  lng?: number;
  totalLandM2: number;
  developedM2: number;
  reserveM2: number;
  infrastructure: Infrastructure;
  category: ParkCategory;
  status: EntityStatus;
  visibility: Visibility;
  /** Staff-only; never rendered for operators (backend strips it too). */
  internalNotes?: string;
  updatedAt: string;
}

export interface Infrastructure {
  water?: boolean;
  powerKva?: number;
  gas?: boolean;
  fiber?: boolean;
  railSpur?: boolean;
  security?: boolean;
}

export interface Building {
  id: string;
  orgId: string;
  parkId?: string | null;
  code: string;
  buildingClass: BuildingClass;
  totalGrossM2: number;
  netRentableM2: number;
  clearHeightM?: number;
  dockDoors: number;
  ramps: number;
  floorLoadTM2?: number;
  powerKva?: number;
  hasGas: boolean;
  hasCrane: boolean;
  lat?: number;
  lng?: number;
  availabilityState: AvailabilityState;
  occupantAlias?: string;
  /** SENSITIVE — staff-only, stripped at API layer for other roles. */
  occupantCompany?: string;
  /** SENSITIVE — staff-only custom negotiation note. */
  negotiatedNote?: string;
  askingRentUsdM2?: number;
  askingRentMxnM2?: number;
  askingSaleUsdM2?: number;
  status: EntityStatus;
  visibility: Visibility;
  updatedAt: string;
}

export interface Land {
  id: string;
  orgId: string;
  parkId?: string | null;
  name: string;
  totalM2: number;
  sellableM2: number;
  zoning?: string;
  topography?: string;
  priceSaleUsdM2?: number;
  priceSaleMxnM2?: number;
  availabilityState: Extract<AvailabilityState, 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'OFF_MARKET'>;
  status: EntityStatus;
  visibility: Visibility;
  updatedAt: string;
}

export interface Period {
  id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  label: string;
  isClosed: boolean;
  fxUsdMxn?: number;
}

export interface ParkSnapshot {
  parkId: string;
  periodId: string;
  totalInventoryM2: number;
  vacantM2: number;
  leasedM2: number;
  underConstructionM2: number;
  vacancyRatePct: number;
  avgAskRentUsd?: number | null;
  avgAskRentMxn?: number | null;
}

export interface ValidationReview {
  id: string;
  entityType: 'PARK' | 'BUILDING' | 'LAND';
  entityId: string;
  fromStatus: EntityStatus;
  toStatus: EntityStatus;
  commentPublic?: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actorName: string;
  action: 'CREATE' | 'UPDATE' | 'STATUS_CHANGE' | 'SNAPSHOT_CLOSE' | 'EXPORT';
  entityType: string;
  entityLabel: string;
  detail: string;
  createdAt: string;
}

export interface CorridorStat {
  corridor: string;
  inventoryM2: number;
  vacantM2: number;
  vacancyPct: number;
  avgRentUsd: number | null;
  netAbsorptionM2: number;
  grossAbsorptionM2: number;
}

export interface MarketKpis {
  periodId: string;
  totalInventoryM2: number;
  vacancyPct: number;
  netAbsorptionM2: number;
  grossAbsorptionM2: number;
  avgRentUsd: number | null;
  avgRentMxn: number | null;
  corridors: CorridorStat[];
}
