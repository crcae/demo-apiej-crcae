// Demo personas — header-level switcher drives the entire tenancy experience.
import { ORG_ALPHA, ORG_BETA } from '../mock/market.mock.js';
import type { ActorSession, DemoPersonaKey } from '../types/domain.js';

export interface PersonaMeta {
  key: DemoPersonaKey;
  label: string;
  short: string;
  description: string;
  accent: string;
  actor: ActorSession;
}

export const PERSONAS: PersonaMeta[] = [
  {
    key: 'STAFF',
    label: 'APIEJ Staff',
    short: 'Staff',
    description: 'Super Admin · todo + validación + ocupantes + auditoría',
    accent: 'bg-brand-blue',
    actor: {
      userId: 'staff-1', fullName: 'Validador APIEJ', isSuperAdmin: true,
      orgId: 'org-apiej', orgName: 'APIEJ', role: 'APIEJ_STAFF',
    },
  },
  {
    key: 'ALPHA',
    label: 'Developer Alpha',
    short: 'Alpha',
    description: 'Park Operator · solo propiedades Alpha',
    accent: 'bg-brand-emerald',
    actor: {
      userId: 'op-alpha', fullName: 'Operador Alpha', isSuperAdmin: false,
      orgId: ORG_ALPHA, orgName: 'Developer Alpha', role: 'PARK_OPERATOR',
    },
  },
  {
    key: 'BETA',
    label: 'Developer Beta',
    short: 'Beta',
    description: 'Park Operator · solo propiedades Beta (aislamiento)',
    accent: 'bg-brand-orange',
    actor: {
      userId: 'op-beta', fullName: 'Operador Beta', isSuperAdmin: false,
      orgId: ORG_BETA, orgName: 'Developer Beta', role: 'PARK_OPERATOR',
    },
  },
  {
    key: 'MEMBER',
    label: 'Portal Member',
    short: 'Member',
    description: 'Solo lectura · agregados + anonimizados',
    accent: 'bg-slate-500',
    actor: {
      userId: 'member-1', fullName: 'Miembro Portal', isSuperAdmin: false,
      orgId: 'org-member', orgName: 'Miembro externo', role: 'MEMBER_VIEWER',
    },
  },
];
