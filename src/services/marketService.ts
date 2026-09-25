// Repository pattern: UI consumes these services; swapping mock -> HTTP
// requires no design change (per AGENTS.md). Tenant + visibility enforcement
// already happened in backend; services only pass actor context + handle 403.
import { mockBuildings, mockLands, mockParks } from '../mock/market.mock.js';
import type { ActorSession, Building, EntityStatus, Land, Park } from '../types/domain.js';

export interface ForbiddenResult {
  ok: false;
  status: 403;
  message: string;
}

function deny(message: string): ForbiddenResult {
  return { ok: false, status: 403, message };
}

export type ListResult<T> = { ok: true; data: T[] } | ForbiddenResult;

function isStaff(actor: ActorSession): boolean {
  return actor.isSuperAdmin || actor.role === 'SUPER_ADMIN' || actor.role === 'APIEJ_STAFF';
}

/**
 * Simulated backend tenant gate for the mock adapter.
 * Real adapter: GET /v1/parks with Authorization header; Supabase RLS returns
 * 403/empty for cross-tenant private rows. Shape preserved here so UI logic
 * (403 banner vs empty state) is already correct pre-API.
 *
 * - Staff: everything (incl. sensitive fields).
 * - PARK_OPERATOR: own org only (mirrors RLS tenant_isolation policy).
 * - MEMBER_VIEWER: VERIFIED + SHARED/PUBLIC only, sensitive fields stripped.
 */
export function listParksFor(actor: ActorSession, source: Park[] = mockParks): ListResult<Park> {
  if (actor.role === 'PUBLIC') return deny('Public visitors use the marketplace (Phase 4).');
  if (isStaff(actor)) return { ok: true, data: source };
  if (actor.role === 'MEMBER_VIEWER') {
    return {
      ok: true,
      data: source
        .filter((p) => p.status === 'VERIFIED' && p.visibility !== 'PRIVATE')
        .map((p) => ({ ...p, internalNotes: undefined })),
    };
  }
  return { ok: true, data: source.filter((p) => p.orgId === actor.orgId) };
}

export function listBuildingsFor(actor: ActorSession, source: Building[] = mockBuildings): ListResult<Building> {
  if (actor.role === 'PUBLIC') return deny('Public visitors use the marketplace (Phase 4).');
  if (isStaff(actor)) return { ok: true, data: source };
  if (actor.role === 'MEMBER_VIEWER') {
    return {
      ok: true,
      data: source
        .filter((b) => b.status === 'VERIFIED' && b.visibility !== 'PRIVATE')
        .map((b) => ({ ...b, occupantCompany: undefined, negotiatedNote: undefined })),
    };
  }
  return { ok: true, data: source.filter((b) => b.orgId === actor.orgId) };
}

export function listLandsFor(actor: ActorSession, source: Land[] = mockLands): ListResult<Land> {
  if (actor.role === 'PUBLIC') return deny('Public visitors use the marketplace (Phase 4).');
  if (isStaff(actor)) return { ok: true, data: source };
  if (actor.role === 'MEMBER_VIEWER') {
    return { ok: true, data: source.filter((l) => l.status === 'VERIFIED' && l.visibility !== 'PRIVATE') };
  }
  return { ok: true, data: source.filter((l) => l.orgId === actor.orgId) };
}

export const STATUS_FLOW: Record<EntityStatus, EntityStatus[]> = {
  DRAFT: ['PENDING_VALIDATION', 'ARCHIVED'],
  PENDING_VALIDATION: ['VERIFIED', 'CHANGES_REQUESTED', 'REJECTED'],
  CHANGES_REQUESTED: ['PENDING_VALIDATION', 'ARCHIVED'],
  VERIFIED: ['PENDING_VALIDATION', 'ARCHIVED'],
  REJECTED: ['DRAFT'],
  ARCHIVED: ['DRAFT'],
};

/** Local optimistic transition helper; real adapter POSTs to /v1/reviews (RPC). */
export function nextStatuses(s: EntityStatus): EntityStatus[] {
  return STATUS_FLOW[s] ?? [];
}

export { isStaff };
