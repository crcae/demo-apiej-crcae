// APIEJ Phase 1 — Drizzle domain schema (mirrors supabase/migrations/0001_phase1_core.sql)
// Single source of DDL truth is the SQL migration; this file is the typed ORM layer.

import {
  pgTable, uuid, text, boolean, timestamp, doublePrecision,
  numeric, integer, jsonb, uniqueIndex,
} from 'drizzle-orm/pg-core';

// --- Identity & tenancy ---
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: text('type').notNull().$type<'APIEJ_INTERNAL' | 'PARK_DEVELOPER' | 'SUPPLIER' | 'BROKER'>(),
  name: text('name').notNull(),
  rfc: text('rfc'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  membershipStatus: text('membership_status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable('profiles', {
  userId: uuid('user_id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  isSuperAdmin: boolean('is_super_admin').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const roles = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().$type<'SUPER_ADMIN' | 'APIEJ_STAFF' | 'PARK_OPERATOR' | 'BROKER' | 'SUPPLIER' | 'PUBLIC'>(),
  description: text('description').notNull(),
});

export const memberships = pgTable('memberships', {
  userId: uuid('user_id').notNull(),
  orgId: uuid('org_id').notNull(),
  roleId: uuid('role_id').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Time axis ---
export const periods = pgTable('periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  year: integer('year').notNull(),
  quarter: integer('quarter').notNull(),
  isClosed: boolean('is_closed').notNull().default(false),
  closedAt: timestamp('closed_at', { withTimezone: true }),
  fxUsdMxn: numeric('fx_usd_mxn', { precision: 10, scale: 4 }),
}, (t) => [uniqueIndex('periods_year_quarter').on(t.year, t.quarter)]);

export type EntityStatus = 'DRAFT' | 'PENDING_VALIDATION' | 'VERIFIED' | 'CHANGES_REQUESTED' | 'REJECTED' | 'ARCHIVED';
export type Visibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';

// --- Inventory (live truth) ---
export const parks = pgTable('parks', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  municipality: text('municipality').notNull(),
  corridor: text('corridor').notNull().default('Guadalajara Metro'),
  address: text('address'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  totalLandM2: numeric('total_land_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  developedM2: numeric('developed_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  reserveM2: numeric('reserve_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  infrastructure: jsonb('infrastructure').notNull().default({}),
  category: text('category').notNull().default('PCI').$type<'PCI' | 'PCP'>(),
  status: text('status').notNull().default('DRAFT').$type<EntityStatus>(),
  visibility: text('visibility').notNull().default('PRIVATE').$type<Visibility>(),
  internalNotes: text('internal_notes'), // SENSITIVE
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const buildings = pgTable('buildings', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  parkId: uuid('park_id'),
  code: text('code').notNull(),
  buildingClass: text('building_class').notNull().default('A'),
  totalGrossM2: numeric('total_gross_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  netRentableM2: numeric('net_rentable_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  clearHeightM: numeric('clear_height_m', { precision: 5, scale: 2 }),
  dockDoors: integer('dock_doors').notNull().default(0),
  ramps: integer('ramps').notNull().default(0),
  floorLoadTM2: numeric('floor_load_t_m2', { precision: 6, scale: 2 }),
  powerKva: numeric('power_kva', { precision: 10, scale: 2 }),
  hasGas: boolean('has_gas').notNull().default(false),
  hasCrane: boolean('has_crane').notNull().default(false),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  availabilityState: text('availability_state').notNull().default('AVAILABLE'),
  occupantAlias: text('occupant_alias'),
  askingRentUsdM2: numeric('asking_rent_usd_m2', { precision: 10, scale: 2 }),
  askingRentMxnM2: numeric('asking_rent_mxn_m2', { precision: 10, scale: 2 }),
  askingSaleUsdM2: numeric('asking_sale_usd_m2', { precision: 10, scale: 2 }),
  negotiatedPriceNote: text('negotiated_price_note'), // SENSITIVE
  status: text('status').notNull().default('DRAFT').$type<EntityStatus>(),
  visibility: text('visibility').notNull().default('PRIVATE').$type<Visibility>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const lands = pgTable('lands', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull(),
  parkId: uuid('park_id'),
  name: text('name').notNull(),
  totalM2: numeric('total_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  sellableM2: numeric('sellable_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  zoning: text('zoning'),
  topography: text('topography'),
  priceSaleUsdM2: numeric('price_sale_usd_m2', { precision: 10, scale: 2 }),
  priceSaleMxnM2: numeric('price_sale_mxn_m2', { precision: 10, scale: 2 }),
  availabilityState: text('availability_state').notNull().default('AVAILABLE'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  status: text('status').notNull().default('DRAFT').$type<EntityStatus>(),
  visibility: text('visibility').notNull().default('PRIVATE').$type<Visibility>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const occupancies = pgTable('occupancies', {
  id: uuid('id').defaultRandom().primaryKey(),
  buildingId: uuid('building_id').notNull(),
  orgId: uuid('org_id').notNull(),
  periodId: uuid('period_id').notNull(),
  leasedM2: numeric('leased_m2', { precision: 14, scale: 2 }).notNull(),
  rentUsdM2: numeric('rent_usd_m2', { precision: 10, scale: 2 }), // SENSITIVE
  isConfidential: boolean('is_confidential').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Snapshots (immutable) ---
export const parkSnapshots = pgTable('park_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  parkId: uuid('park_id').notNull(),
  periodId: uuid('period_id').notNull(),
  totalInventoryM2: numeric('total_inventory_m2', { precision: 14, scale: 2 }).notNull(),
  vacantM2: numeric('vacant_m2', { precision: 14, scale: 2 }).notNull(),
  leasedM2: numeric('leased_m2', { precision: 14, scale: 2 }).notNull(),
  underConstructionM2: numeric('under_construction_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  avgAskRentUsd: numeric('avg_ask_rent_usd', { precision: 10, scale: 2 }),
  avgAskRentMxn: numeric('avg_ask_rent_mxn', { precision: 10, scale: 2 }),
  avgSaleUsd: numeric('avg_sale_usd', { precision: 10, scale: 2 }),
  snapshotHash: text('snapshot_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const buildingSnapshots = pgTable('building_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  buildingId: uuid('building_id').notNull(),
  periodId: uuid('period_id').notNull(),
  rentableM2: numeric('rentable_m2', { precision: 14, scale: 2 }).notNull(),
  vacantM2: numeric('vacant_m2', { precision: 14, scale: 2 }).notNull(),
  occupiedM2: numeric('occupied_m2', { precision: 14, scale: 2 }).notNull(),
  askingRentUsd: numeric('asking_rent_usd', { precision: 10, scale: 2 }),
  askingRentMxn: numeric('asking_rent_mxn', { precision: 10, scale: 2 }),
  availabilityState: text('availability_state').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const marketAggregates = pgTable('market_aggregates', {
  id: uuid('id').defaultRandom().primaryKey(),
  periodId: uuid('period_id').notNull(),
  scope: text('scope').notNull(),
  totalInventoryM2: numeric('total_inventory_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  vacancyRatePct: numeric('vacancy_rate_pct', { precision: 6, scale: 3 }).notNull().default('0'),
  netAbsorptionM2: numeric('net_absorption_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  grossAbsorptionM2: numeric('gross_absorption_m2', { precision: 14, scale: 2 }).notNull().default('0'),
  avgRentUsdM2: numeric('avg_rent_usd_m2', { precision: 10, scale: 2 }),
  avgRentMxnM2: numeric('avg_rent_mxn_m2', { precision: 10, scale: 2 }),
  computedAt: timestamp('computed_at', { withTimezone: true }).notNull().defaultNow(),
});

export const validationReviews = pgTable('validation_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityType: text('entity_type').notNull().$type<'PARK' | 'BUILDING' | 'LAND'>(),
  entityId: uuid('entity_id').notNull(),
  fromStatus: text('from_status').notNull(),
  toStatus: text('to_status').notNull(),
  commentPublic: text('comment_public'),
  notesInternal: text('notes_internal'), // SENSITIVE
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  diff: jsonb('diff'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
