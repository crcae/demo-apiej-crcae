// Validation workflow state machine — backend enforced.
// DRAFT -> PENDING_VALIDATION -> VERIFIED | CHANGES_REQUESTED -> (resubmit) ...
// REJECTED / ARCHIVED are terminal-ish (ARCHIVED reversible by staff only).

import type { EntityStatus } from '../security/tenantGuard.js';
import { isApiejStaff, type Actor } from '../security/tenantGuard.js';

export type EntityType = 'PARK' | 'BUILDING' | 'LAND';

const TRANSITIONS: Record<EntityStatus, EntityStatus[]> = {
  DRAFT: ['PENDING_VALIDATION', 'ARCHIVED'],
  PENDING_VALIDATION: ['VERIFIED', 'CHANGES_REQUESTED', 'REJECTED'],
  CHANGES_REQUESTED: ['PENDING_VALIDATION', 'ARCHIVED'],
  VERIFIED: ['PENDING_VALIDATION', 'ARCHIVED'], // re-validation on data change
  REJECTED: ['DRAFT'],
  ARCHIVED: ['DRAFT'],
};

export function canTransition(from: EntityStatus, to: EntityStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class InvalidTransitionError extends Error {
  constructor(from: EntityStatus, to: EntityStatus) {
    super(`Invalid status transition: ${from} -> ${to}`);
    this.name = 'InvalidTransitionError';
  }
}

export interface TransitionRequest {
  entityType: EntityType;
  entityId: string;
  from: EntityStatus;
  to: EntityStatus;
  commentPublic?: string;
  notesInternal?: string;
}

/**
 * Authorize + validate a status change.
 * - Operators: may only submit own rows (DRAFT->PENDING_VALIDATION, CHANGES_REQUESTED->PENDING_VALIDATION).
 * - Staff: may approve/request-changes/reject.
 * Returns the review record payload to persist (caller writes to validation_reviews + updates entity).
 */
export function authorizeTransition(
  actor: Actor,
  req: TransitionRequest,
  rowOrgId: string,
  isOwner: boolean,
): TransitionRequest {
  if (!canTransition(req.from, req.to)) throw new InvalidTransitionError(req.from, req.to);

  const staff = isApiejStaff(actor);

  // Operator path
  if (!staff) {
    if (!isOwner) {
      const e = new Error('Forbidden: not owner of entity');
      e.name = 'ForbiddenError';
      throw e;
    }
    const operatorAllowed =
      (req.from === 'DRAFT' && req.to === 'PENDING_VALIDATION') ||
      (req.from === 'CHANGES_REQUESTED' && req.to === 'PENDING_VALIDATION') ||
      (req.from === 'REJECTED' && req.to === 'DRAFT');
    if (!operatorAllowed) {
      const e = new Error('Forbidden: operators may only submit for validation');
      e.name = 'ForbiddenError';
      throw e;
    }
    if (req.notesInternal) {
      const e = new Error('Forbidden: operators cannot set internal notes');
      e.name = 'ForbiddenError';
      throw e;
    }
    void rowOrgId;
    return req;
  }

  // Staff path: full power except cannot fabricate ownership
  return req;
}
