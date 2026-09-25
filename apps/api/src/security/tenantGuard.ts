// RBAC core — backend-only enforcement. Frontend role checks are UX hints, never security.

export type RoleKey =
  | 'SUPER_ADMIN'
  | 'APIEJ_STAFF'
  | 'PARK_OPERATOR'
  | 'BROKER'
  | 'SUPPLIER'
  | 'PUBLIC';

export type Visibility = 'PRIVATE' | 'SHARED' | 'PUBLIC';
export type EntityStatus =
  | 'DRAFT'
  | 'PENDING_VALIDATION'
  | 'VERIFIED'
  | 'CHANGES_REQUESTED'
  | 'REJECTED'
  | 'ARCHIVED';

export interface Actor {
  userId: string;
  isSuperAdmin: boolean;
  memberships: Array<{ orgId: string; role: RoleKey; isActive: boolean }>;
}

export function isApiejStaff(actor: Actor): boolean {
  if (actor.isSuperAdmin) return true;
  return actor.memberships.some(
    (m) => m.isActive && (m.role === 'SUPER_ADMIN' || m.role === 'APIEJ_STAFF'),
  );
}

export function activeOrgIds(actor: Actor): string[] {
  return actor.memberships.filter((m) => m.isActive).map((m) => m.orgId);
}

/** Tenant isolation: PARK_OPERATOR may ONLY touch rows of their own org. Staff bypass. */
export function canAccessOrg(actor: Actor, orgId: string): boolean {
  if (isApiejStaff(actor)) return true;
  return activeOrgIds(actor).includes(orgId);
}

/** Visibility gate for reads (mirrors RLS policies in 0001 migration). */
export function canReadVisibility(
  actor: Actor,
  row: { orgId: string; visibility: Visibility; status: EntityStatus },
): boolean {
  if (isApiejStaff(actor)) return true;
  if (activeOrgIds(actor).includes(row.orgId)) return true; // owner sees own drafts
  if (row.status !== 'VERIFIED') return false;
  if (row.visibility === 'PUBLIC') return actor.memberships.length > 0 || true; // anon allowed via public views
  if (row.visibility === 'SHARED') return actor.memberships.some((m) => m.isActive);
  return false; // PRIVATE + non-owner => deny
}

export class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(message = 'Forbidden: cross-tenant access denied') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

/** Policy guard: throws 403 when a PARK_OPERATOR queries another org's data. */
export function assertTenantAccess(actor: Actor, orgId: string): void {
  if (!canAccessOrg(actor, orgId)) throw new ForbiddenError();
}

// --- Sensitive-field stripping (API response level) ---
// These columns must NEVER leave the backend for non-staff roles.
const SENSITIVE_BUILDING_FIELDS = ['occupantCompanyEncrypted', 'negotiatedPriceNote'] as const;
const SENSITIVE_PARK_FIELDS = ['internalNotes'] as const;
const SENSITIVE_REVIEW_FIELDS = ['notesInternal'] as const;
const SENSITIVE_OCCUPANCY_FIELDS = ['occupantCompanyEncrypted', 'rentUsdM2'] as const;

type SensitiveField =
  | (typeof SENSITIVE_BUILDING_FIELDS)[number]
  | (typeof SENSITIVE_PARK_FIELDS)[number]
  | (typeof SENSITIVE_REVIEW_FIELDS)[number]
  | (typeof SENSITIVE_OCCUPANCY_FIELDS)[number];

export function stripSensitive<T extends Record<string, unknown>>(
  actor: Actor,
  row: T,
  sensitiveFields: readonly (keyof T)[],
): T {
  if (isApiejStaff(actor)) return row;
  const copy: Record<string, unknown> = { ...row };
  for (const f of sensitiveFields) delete copy[f as string];
  return copy as T;
}

export function sanitizeBuilding<T extends Record<string, unknown>>(actor: Actor, row: T): T {
  return stripSensitive(actor, row, SENSITIVE_BUILDING_FIELDS as unknown as (keyof T)[]);
}

export function sanitizePark<T extends Record<string, unknown>>(actor: Actor, row: T): T {
  return stripSensitive(actor, row, SENSITIVE_PARK_FIELDS as unknown as (keyof T)[]);
}

export function sanitizeReview<T extends Record<string, unknown>>(actor: Actor, row: T): T {
  return stripSensitive(actor, row, SENSITIVE_REVIEW_FIELDS as unknown as (keyof T)[]);
}

export function sanitizeOccupancy<T extends Record<string, unknown>>(actor: Actor, row: T): T {
  return stripSensitive(actor, row, SENSITIVE_OCCUPANCY_FIELDS as unknown as (keyof T)[]);
}

export type { SensitiveField };
