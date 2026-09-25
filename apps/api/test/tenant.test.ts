import { describe, expect, it } from 'vitest';
import {
  assertTenantAccess,
  canReadVisibility,
  sanitizeBuilding,
  sanitizePark,
  type Actor,
} from '../src/security/tenantGuard.js';

const ORG_A = 'org-a';
const ORG_B = 'org-b';

const operatorA: Actor = {
  userId: 'user-a',
  isSuperAdmin: false,
  memberships: [{ orgId: ORG_A, role: 'PARK_OPERATOR', isActive: true }],
};

const staff: Actor = {
  userId: 'staff-1',
  isSuperAdmin: false,
  memberships: [{ orgId: 'apiej', role: 'APIEJ_STAFF', isActive: true }],
};

describe('tenant isolation (Phase 1 §4.2)', () => {
  it('operator CAN access own org', () => {
    expect(() => assertTenantAccess(operatorA, ORG_A)).not.toThrow();
  });

  it('operator gets 403 on another org private data', () => {
    try {
      assertTenantAccess(operatorA, ORG_B);
      expect.unreachable('should have thrown');
    } catch (e) {
      expect((e as Error).name).toBe('ForbiddenError');
      expect((e as { statusCode?: number }).statusCode).toBe(403);
    }
  });

  it('staff bypasses tenant isolation', () => {
    expect(() => assertTenantAccess(staff, ORG_B)).not.toThrow();
  });

  it('non-owner cannot read PRIVATE draft even if verified-listed elsewhere', () => {
    expect(
      canReadVisibility(operatorA, { orgId: ORG_B, visibility: 'PRIVATE', status: 'VERIFIED' }),
    ).toBe(false);
  });
});

describe('sensitive-field stripping (API response level)', () => {
  it('strips occupant + negotiation fields for operators', () => {
    const row = {
      id: 'b1',
      code: 'N-01',
      occupantCompanyEncrypted: 'secret-bytes',
      negotiatedPriceNote: '$5.80 custom deal',
    };
    const out = sanitizeBuilding(operatorA, row);
    expect(out).not.toHaveProperty('occupantCompanyEncrypted');
    expect(out).not.toHaveProperty('negotiatedPriceNote');
    expect(out).toHaveProperty('code', 'N-01');
  });

  it('keeps sensitive fields for staff', () => {
    const row = { id: 'b1', internalNotes: 'x', occupantCompanyEncrypted: 's' };
    expect(sanitizeBuilding(staff, row)).toHaveProperty('occupantCompanyEncrypted');
    expect(sanitizePark(staff, { id: 'p1', internalNotes: 'audit note' })).toHaveProperty('internalNotes');
  });
});
