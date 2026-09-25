import { describe, expect, it } from 'vitest';
import { authorizeTransition } from '../src/services/validation.service.js';
import type { Actor } from '../src/security/tenantGuard.js';

const operator: Actor = {
  userId: 'op-1',
  isSuperAdmin: false,
  memberships: [{ orgId: 'org-a', role: 'PARK_OPERATOR', isActive: true }],
};
const staff: Actor = {
  userId: 'st-1',
  isSuperAdmin: false,
  memberships: [{ orgId: 'apiej', role: 'APIEJ_STAFF', isActive: true }],
};

describe('validation workflow (Phase 1 §4.4)', () => {
  it('operator submits DRAFT -> PENDING_VALIDATION', () => {
    const r = authorizeTransition(
      operator,
      { entityType: 'PARK', entityId: 'p1', from: 'DRAFT', to: 'PENDING_VALIDATION' },
      'org-a',
      true,
    );
    expect(r.to).toBe('PENDING_VALIDATION');
  });

  it('operator CANNOT self-approve', () => {
    expect(() =>
      authorizeTransition(
        operator,
        { entityType: 'PARK', entityId: 'p1', from: 'PENDING_VALIDATION', to: 'VERIFIED' },
        'org-a',
        true,
      ),
    ).toThrow(/only submit/);
  });

  it('staff approves PENDING_VALIDATION -> VERIFIED', () => {
    const r = authorizeTransition(
      staff,
      { entityType: 'BUILDING', entityId: 'b1', from: 'PENDING_VALIDATION', to: 'VERIFIED', commentPublic: 'OK' },
      'org-a',
      false,
    );
    expect(r.to).toBe('VERIFIED');
  });

  it('rejects illegal jumps (DRAFT -> VERIFIED)', () => {
    expect(() =>
      authorizeTransition(
        staff,
        { entityType: 'LAND', entityId: 'l1', from: 'DRAFT', to: 'VERIFIED' },
        'org-a',
        false,
      ),
    ).toThrow(/Invalid status transition/);
  });
});
